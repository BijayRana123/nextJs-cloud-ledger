import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccounts.js';
import dbConnect from '../dbConnect.js';

class ProfitLossService {
  /**
   * Generate Profit & Loss Statement for an organization for a specific period
   * @param {string} organizationId - The organization ID
   * @param {Date|string} startDate - The start date of the period
   * @param {Date|string} endDate - The end date of the period
   * @returns {Object} Profit & Loss statement data
   */
  static async generateProfitLossStatement(organizationId, startDate, endDate) {
    await dbConnect();

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    // Validate date range
    if (startDateTime >= endDateTime) {
      throw new Error('Start date must be before end date');
    }

    // Get all revenue and expense accounts for the organization
    const accounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(organizationId),
      active: true,
      type: { $in: ['revenue', 'expense'] }
    }).sort({ code: 1 });

    // Get the transaction collection directly
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');

    const revenueAccounts = [];
    const expenseAccounts = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    // Process each account
    for (const account of accounts) {
      const accountBalance = await this.calculateAccountBalanceForPeriod(
        transactionCollection,
        account,
        organizationId,
        startDateTime,
        endDateTime
      );

      if (accountBalance && Math.abs(accountBalance.balance) > 0.01) {
        const accountData = {
          accountId: account._id,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          accountSubtype: account.subtype,
          accountPath: account.path,
          amount: Math.abs(accountBalance.balance),
          transactionCount: accountBalance.transactionCount,
          totalDebits: accountBalance.totalDebits,
          totalCredits: accountBalance.totalCredits
        };

        if (account.type === 'revenue') {
          revenueAccounts.push(accountData);
          totalRevenue += accountData.amount;
        } else if (account.type === 'expense') {
          expenseAccounts.push(accountData);
          totalExpenses += accountData.amount;
        }
      }
    }

    // Group accounts by subtype for better presentation
    const groupedRevenue = this.groupAccountsBySubtype(revenueAccounts);
    const groupedExpenses = this.groupAccountsBySubtype(expenseAccounts);

    // Calculate net income
    const netIncome = totalRevenue - totalExpenses;

    // Calculate percentages
    const revenueWithPercentages = revenueAccounts.map(account => ({
      ...account,
      percentageOfRevenue: totalRevenue > 0 ? (account.amount / totalRevenue) * 100 : 0
    }));

    const expensesWithPercentages = expenseAccounts.map(account => ({
      ...account,
      percentageOfRevenue: totalRevenue > 0 ? (account.amount / totalRevenue) * 100 : 0
    }));

    return {
      period: {
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        description: this.formatPeriodDescription(startDateTime, endDateTime)
      },
      organizationId,
      revenues: revenueWithPercentages,
      expenses: expensesWithPercentages,
      groupedRevenues: groupedRevenue,
      groupedExpenses: groupedExpenses,
      totals: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netIncome: Math.round(netIncome * 100) / 100,
        netIncomeMargin: totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 10000) / 100 : 0
      },
      summary: {
        totalRevenueAccounts: revenueAccounts.length,
        totalExpenseAccounts: expenseAccounts.length,
        isProfitable: netIncome > 0,
        largestRevenueSource: revenueAccounts.length > 0 ? 
          revenueAccounts.reduce((max, account) => account.amount > max.amount ? account : max) : null,
        largestExpense: expenseAccounts.length > 0 ? 
          expenseAccounts.reduce((max, account) => account.amount > max.amount ? account : max) : null
      }
    };
  }

  /**
   * Calculate balance for a specific account for a given period
   * @param {Object} transactionCollection - MongoDB transaction collection
   * @param {Object} account - Chart of account object
   * @param {string} organizationId - Organization ID
   * @param {Date} startDate - Start date of the period
   * @param {Date} endDate - End date of the period
   * @returns {Object} Account balance data for the period
   */
  static async calculateAccountBalanceForPeriod(transactionCollection, account, organizationId, startDate, endDate) {
    // Build query for transactions within the specified period
    const query = {
      accounts: account.path,
      voided: false,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      datetime: { 
        $gte: startDate,
        $lte: endDate 
      }
    };

    // Get all transactions for this account within the period
    const transactions = await transactionCollection.find(query).toArray();

    let debitBalance = 0;
    let creditBalance = 0;

    // Calculate the total debits and credits for the period
    for (const txn of transactions) {
      if (txn.debit) {
        debitBalance += txn.amount;
      } else if (txn.credit) {
        creditBalance += txn.amount;
      }
    }

    // For P&L, we want the net activity for the period
    // Revenue accounts: Credit balance is positive (revenue earned)
    // Expense accounts: Debit balance is positive (expenses incurred)
    let netBalance = 0;

    if (account.type === 'revenue') {
      // For revenue accounts, credit increases revenue
      netBalance = creditBalance - debitBalance;
    } else if (account.type === 'expense') {
      // For expense accounts, debit increases expense
      netBalance = debitBalance - creditBalance;
    }

    return {
      balance: netBalance,
      transactionCount: transactions.length,
      totalDebits: debitBalance,
      totalCredits: creditBalance
    };
  }

  /**
   * Group accounts by their subtype for better presentation
   * @param {Array} accounts - Array of account data
   * @returns {Object} Grouped accounts by subtype
   */
  static groupAccountsBySubtype(accounts) {
    const grouped = {};
    
    accounts.forEach(account => {
      const subtype = account.accountSubtype;
      if (!grouped[subtype]) {
        grouped[subtype] = {
          subtypeName: this.formatSubtypeName(subtype),
          accounts: [],
          total: 0
        };
      }
      grouped[subtype].accounts.push(account);
      grouped[subtype].total += account.amount;
    });

    return grouped;
  }

  /**
   * Format subtype name for display
   * @param {string} subtype - The subtype code
   * @returns {string} Formatted subtype name
   */
  static formatSubtypeName(subtype) {
    const subtypeNames = {
      'operating_revenue': 'Operating Revenue',
      'other_revenue': 'Other Revenue',
      'operating_expense': 'Operating Expenses',
      'other_expense': 'Other Expenses'
    };

    return subtypeNames[subtype] || subtype.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format period description for display
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {string} Formatted period description
   */
  static formatPeriodDescription(startDate, endDate) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    
    // Check if it's a full month
    const isFullMonth = startDate.getDate() === 1 && 
      endDate.getDate() === new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();
    
    if (isFullMonth) {
      return startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    
    // Check if it's a full year
    const isFullYear = startDate.getMonth() === 0 && startDate.getDate() === 1 &&
      endDate.getMonth() === 11 && endDate.getDate() === 31 &&
      startDate.getFullYear() === endDate.getFullYear();
    
    if (isFullYear) {
      return `Year ${startDate.getFullYear()}`;
    }
    
    return `${start} to ${end}`;
  }

  /**
   * Compare two periods for trend analysis
   * @param {string} organizationId - Organization ID
   * @param {Date} currentStartDate - Current period start date
   * @param {Date} currentEndDate - Current period end date
   * @param {Date} previousStartDate - Previous period start date
   * @param {Date} previousEndDate - Previous period end date
   * @returns {Object} Comparison data
   */
  static async comparePeriods(organizationId, currentStartDate, currentEndDate, previousStartDate, previousEndDate) {
    const [currentPeriod, previousPeriod] = await Promise.all([
      this.generateProfitLossStatement(organizationId, currentStartDate, currentEndDate),
      this.generateProfitLossStatement(organizationId, previousStartDate, previousEndDate)
    ]);

    const revenueChange = currentPeriod.totals.totalRevenue - previousPeriod.totals.totalRevenue;
    const expenseChange = currentPeriod.totals.totalExpenses - previousPeriod.totals.totalExpenses;
    const netIncomeChange = currentPeriod.totals.netIncome - previousPeriod.totals.netIncome;

    const revenueChangePercent = previousPeriod.totals.totalRevenue > 0 ? 
      (revenueChange / previousPeriod.totals.totalRevenue) * 100 : 0;
    const expenseChangePercent = previousPeriod.totals.totalExpenses > 0 ? 
      (expenseChange / previousPeriod.totals.totalExpenses) * 100 : 0;
    const netIncomeChangePercent = previousPeriod.totals.netIncome !== 0 ? 
      (netIncomeChange / Math.abs(previousPeriod.totals.netIncome)) * 100 : 0;

    return {
      currentPeriod,
      previousPeriod,
      comparison: {
        revenueChange: Math.round(revenueChange * 100) / 100,
        expenseChange: Math.round(expenseChange * 100) / 100,
        netIncomeChange: Math.round(netIncomeChange * 100) / 100,
        revenueChangePercent: Math.round(revenueChangePercent * 100) / 100,
        expenseChangePercent: Math.round(expenseChangePercent * 100) / 100,
        netIncomeChangePercent: Math.round(netIncomeChangePercent * 100) / 100
      }
    };
  }

  /**
   * Export P&L to CSV format
   * @param {Object} profitLossData - P&L statement data
   * @returns {string} CSV content
   */
  static exportToCSV(profitLossData) {
    const lines = [];
    
    // Header
    lines.push(`Profit & Loss Statement`);
    lines.push(`Period: ${profitLossData.period.description}`);
    lines.push('');
    
    // Revenue section
    lines.push('REVENUE');
    lines.push('Account,Amount,% of Revenue');
    
    profitLossData.revenues.forEach(account => {
      lines.push(`${account.accountName},${account.amount.toFixed(2)},${account.percentageOfRevenue.toFixed(1)}%`);
    });
    
    lines.push(`Total Revenue,${profitLossData.totals.totalRevenue.toFixed(2)},100.0%`);
    lines.push('');
    
    // Expenses section
    lines.push('EXPENSES');
    lines.push('Account,Amount,% of Revenue');
    
    profitLossData.expenses.forEach(account => {
      lines.push(`${account.accountName},${account.amount.toFixed(2)},${account.percentageOfRevenue.toFixed(1)}%`);
    });
    
    lines.push(`Total Expenses,${profitLossData.totals.totalExpenses.toFixed(2)},${(profitLossData.totals.totalExpenses / profitLossData.totals.totalRevenue * 100).toFixed(1)}%`);
    lines.push('');
    
    // Net Income
    lines.push(`Net Income,${profitLossData.totals.netIncome.toFixed(2)},${profitLossData.totals.netIncomeMargin.toFixed(1)}%`);
    
    return lines.join('\n');
  }

  /**
   * Validate P&L statement data
   * @param {Object} profitLossData - P&L statement data
   * @returns {Object} Validation results
   */
  static validateProfitLossStatement(profitLossData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if there are any revenue accounts
    if (profitLossData.revenues.length === 0) {
      validation.warnings.push({
        type: 'NO_REVENUE',
        message: 'No revenue accounts found for the selected period'
      });
    }

    // Check if there are any expense accounts
    if (profitLossData.expenses.length === 0) {
      validation.warnings.push({
        type: 'NO_EXPENSES',
        message: 'No expense accounts found for the selected period'
      });
    }

    // Check for negative revenue (unusual)
    const negativeRevenue = profitLossData.revenues.filter(account => account.amount < 0);
    if (negativeRevenue.length > 0) {
      validation.warnings.push({
        type: 'NEGATIVE_REVENUE',
        message: `${negativeRevenue.length} revenue accounts have negative amounts`,
        accounts: negativeRevenue.map(acc => acc.accountName)
      });
    }

    // Check for negative expenses (unusual)
    const negativeExpenses = profitLossData.expenses.filter(account => account.amount < 0);
    if (negativeExpenses.length > 0) {
      validation.warnings.push({
        type: 'NEGATIVE_EXPENSES',
        message: `${negativeExpenses.length} expense accounts have negative amounts`,
        accounts: negativeExpenses.map(acc => acc.accountName)
      });
    }

    // Check for very high expense ratios
    profitLossData.expenses.forEach(account => {
      if (account.percentageOfRevenue > 50) {
        validation.warnings.push({
          type: 'HIGH_EXPENSE_RATIO',
          message: `${account.accountName} represents ${account.percentageOfRevenue.toFixed(1)}% of revenue`,
          account: account.accountName,
          percentage: account.percentageOfRevenue
        });
      }
    });

    return validation;
  }
}

export default ProfitLossService;