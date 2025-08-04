import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccounts.js';
import dbConnect from '../dbConnect.js';

class TrialBalanceService {
  /**
   * Generate trial balance for an organization as of a specific date
   * @param {string} organizationId - The organization ID
   * @param {Date|string} asOfDate - The date to generate trial balance as of
   * @returns {Object} Trial balance data
   */
  static async generateTrialBalance(organizationId, asOfDate = new Date()) {
    await dbConnect();

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const asOfDateTime = new Date(asOfDate);
    
    // Get all active accounts for the organization
    const accounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(organizationId),
      active: true
    }).sort({ code: 1 });

    // Get the transaction collection directly
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');

    const trialBalanceData = [];
    let totalDebits = 0;
    let totalCredits = 0;

    // Calculate balance for each account
    for (const account of accounts) {
      const accountBalance = await this.calculateAccountBalance(
        transactionCollection,
        account,
        organizationId,
        asOfDateTime
      );

      if (accountBalance && Math.abs(accountBalance.balance) > 0.01) {
        trialBalanceData.push(accountBalance);
        
        if (accountBalance.isDebitBalance) {
          totalDebits += Math.abs(accountBalance.balance);
        } else {
          totalCredits += Math.abs(accountBalance.balance);
        }
      }
    }

    // Sort by account code
    trialBalanceData.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    // Check if trial balance balances
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
    const difference = totalDebits - totalCredits;

    return {
      asOfDate: asOfDateTime.toISOString(),
      organizationId,
      accounts: trialBalanceData,
      totals: {
        totalDebits: Math.round(totalDebits * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        difference: Math.round(difference * 100) / 100,
        isBalanced
      },
      summary: {
        totalAccounts: trialBalanceData.length,
        accountsWithDebitBalance: trialBalanceData.filter(acc => acc.debitAmount > 0).length,
        accountsWithCreditBalance: trialBalanceData.filter(acc => acc.creditAmount > 0).length
      }
    };
  }

  /**
   * Calculate balance for a specific account
   * @param {Object} transactionCollection - MongoDB transaction collection
   * @param {Object} account - Chart of account object
   * @param {string} organizationId - Organization ID
   * @param {Date} asOfDate - Date to calculate balance as of
   * @returns {Object} Account balance data
   */
  static async calculateAccountBalance(transactionCollection, account, organizationId, asOfDate) {
    // Build query for transactions up to the specified date
    const query = {
      accounts: account.path,
      voided: false,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      datetime: { $lte: asOfDate }
    };

    // Get all transactions for this account
    const transactions = await transactionCollection.find(query).toArray();

    let debitBalance = 0;
    let creditBalance = 0;

    // Calculate the total debits and credits
    for (const txn of transactions) {
      if (txn.debit) {
        debitBalance += txn.amount;
      } else if (txn.credit) {
        creditBalance += txn.amount;
      }
    }

    // Calculate net balance based on account type
    // Assets, Expenses = Debit balance (debit - credit)
    // Liabilities, Equity, Revenue = Credit balance (credit - debit)
    let netBalance = 0;
    let isDebitBalance = false;

    if (['asset', 'expense'].includes(account.type)) {
      netBalance = debitBalance - creditBalance;
      isDebitBalance = netBalance > 0;
    } else {
      netBalance = creditBalance - debitBalance;
      isDebitBalance = netBalance < 0;
      netBalance = Math.abs(netBalance);
    }

    return {
      accountId: account._id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      accountSubtype: account.subtype,
      accountPath: account.path,
      debitAmount: isDebitBalance ? Math.abs(netBalance) : 0,
      creditAmount: !isDebitBalance ? Math.abs(netBalance) : 0,
      balance: netBalance,
      isDebitBalance,
      transactionCount: transactions.length,
      totalDebits: debitBalance,
      totalCredits: creditBalance
    };
  }

  /**
   * Get trial balance summary statistics
   * @param {Array} trialBalanceAccounts - Array of trial balance account data
   * @returns {Object} Summary statistics
   */
  static getTrialBalanceSummary(trialBalanceAccounts) {
    const summary = {
      totalAccounts: trialBalanceAccounts.length,
      accountsWithDebitBalance: 0,
      accountsWithCreditBalance: 0,
      accountsByType: {},
      largestDebitBalance: { amount: 0, account: null },
      largestCreditBalance: { amount: 0, account: null }
    };

    trialBalanceAccounts.forEach(account => {
      // Count debit/credit balances
      if (account.debitAmount > 0) {
        summary.accountsWithDebitBalance++;
        if (account.debitAmount > summary.largestDebitBalance.amount) {
          summary.largestDebitBalance = {
            amount: account.debitAmount,
            account: account.accountName
          };
        }
      } else if (account.creditAmount > 0) {
        summary.accountsWithCreditBalance++;
        if (account.creditAmount > summary.largestCreditBalance.amount) {
          summary.largestCreditBalance = {
            amount: account.creditAmount,
            account: account.accountName
          };
        }
      }

      // Count by account type
      if (!summary.accountsByType[account.accountType]) {
        summary.accountsByType[account.accountType] = 0;
      }
      summary.accountsByType[account.accountType]++;
    });

    return summary;
  }

  /**
   * Validate trial balance integrity
   * @param {Object} trialBalanceData - Trial balance data
   * @returns {Object} Validation results
   */
  static validateTrialBalance(trialBalanceData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if debits equal credits
    if (!trialBalanceData.totals.isBalanced) {
      validation.isValid = false;
      validation.errors.push({
        type: 'UNBALANCED',
        message: `Trial balance is out of balance by ${Math.abs(trialBalanceData.totals.difference).toFixed(2)}`,
        difference: trialBalanceData.totals.difference
      });
    }

    // Check for accounts with zero balances (shouldn't appear in trial balance)
    const zeroBalanceAccounts = trialBalanceData.accounts.filter(
      acc => acc.debitAmount === 0 && acc.creditAmount === 0
    );
    
    if (zeroBalanceAccounts.length > 0) {
      validation.warnings.push({
        type: 'ZERO_BALANCE_ACCOUNTS',
        message: `${zeroBalanceAccounts.length} accounts with zero balances found`,
        accounts: zeroBalanceAccounts.map(acc => acc.accountName)
      });
    }

    // Check for unusual account type balances
    trialBalanceData.accounts.forEach(account => {
      const isNormalBalance = this.isNormalBalance(account.accountType, account.isDebitBalance);
      if (!isNormalBalance) {
        validation.warnings.push({
          type: 'UNUSUAL_BALANCE',
          message: `${account.accountName} has an unusual ${account.isDebitBalance ? 'debit' : 'credit'} balance for a ${account.accountType} account`,
          account: account.accountName,
          accountType: account.accountType,
          balanceType: account.isDebitBalance ? 'debit' : 'credit'
        });
      }
    });

    return validation;
  }

  /**
   * Check if an account balance is normal for its type
   * @param {string} accountType - The account type
   * @param {boolean} isDebitBalance - Whether the balance is a debit balance
   * @returns {boolean} True if normal balance
   */
  static isNormalBalance(accountType, isDebitBalance) {
    const normalDebitTypes = ['asset', 'expense'];
    const normalCreditTypes = ['liability', 'equity', 'revenue'];

    if (normalDebitTypes.includes(accountType)) {
      return isDebitBalance;
    } else if (normalCreditTypes.includes(accountType)) {
      return !isDebitBalance;
    }

    return true; // Unknown type, assume normal
  }

  /**
   * Export trial balance to CSV format
   * @param {Object} trialBalanceData - Trial balance data
   * @returns {string} CSV content
   */
  static exportToCSV(trialBalanceData) {
    const headers = [
      'Account Code',
      'Account Name', 
      'Account Type',
      'Account Subtype',
      'Debit Amount',
      'Credit Amount'
    ];

    const rows = trialBalanceData.accounts.map(account => [
      account.accountCode,
      account.accountName,
      account.accountType,
      account.accountSubtype,
      account.debitAmount.toFixed(2),
      account.creditAmount.toFixed(2)
    ]);

    // Add totals row
    rows.push([
      '',
      '',
      '',
      'TOTALS:',
      trialBalanceData.totals.totalDebits.toFixed(2),
      trialBalanceData.totals.totalCredits.toFixed(2)
    ]);

    // Convert to CSV
    const csvContent = [
      `Trial Balance - As of ${new Date(trialBalanceData.asOfDate).toLocaleDateString()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    return csvContent;
  }
}

export default TrialBalanceService;