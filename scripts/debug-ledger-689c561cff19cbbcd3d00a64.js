import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function debugSpecificLedger() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Import models after connection
    const ChartOfAccount = (await import('../lib/models/ChartOfAccounts.js')).default;
    const Organization = (await import('../lib/models/Organization.js')).default;

    const accountId = '689c561cff19cbbcd3d00a64';
    
    console.log('\n=== DEBUGGING ACCOUNT 689c561cff19cbbcd3d00a64 ===');
    
    // Find the account
    const account = await ChartOfAccount.findById(accountId).populate('organization', 'name');
    
    if (!account) {
      console.log('❌ Account not found');
      return;
    }
    
    console.log('✅ Account found:');
    console.log(`   Name: ${account.name}`);
    console.log(`   Code: ${account.code}`);
    console.log(`   Type: ${account.type}`);
    console.log(`   Path: ${account.path}`);
    console.log(`   Organization: ${account.organization?.name} (${account.organization?._id})`);
    console.log(`   Opening Balance: ${account.openingBalance || 0}`);
    
    const orgId = account.organization._id;
    
    // Check for Medici transactions
    console.log('\n=== CHECKING MEDICI TRANSACTIONS ===');
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    // Extract account path components
    const pathParts = account.path.split(':');
    const accountType = pathParts[0];
    const accountName = pathParts[pathParts.length - 1];
    
    console.log(`Account type: ${accountType}`);
    console.log(`Account name: ${accountName}`);
    
    // Build candidate accounts (same logic as in the API)
    const candidateAccounts = new Set([account.path]);
    
    const leafName = accountName;
    if (accountType === 'Accounts Payable' && leafName) {
      candidateAccounts.add(`Liabilities:Accounts Payable:${leafName}`);
    }
    if (accountType === 'Accounts Receivable' && leafName) {
      candidateAccounts.add(`Assets:Accounts Receivable:${leafName}`);
    }
    if (accountType === 'Cash-in-Hand' && leafName) {
      candidateAccounts.add(`Assets:Cash-in-Hand:${leafName}`);
    }
    if (accountType === 'Cash' && leafName) {
      candidateAccounts.add(`Assets:Cash:${leafName}`);
    }
    if (accountName.toLowerCase() === 'cash') {
      candidateAccounts.add('Assets:Cash');
      candidateAccounts.add('Cash');
      candidateAccounts.add('Assets:Cash-in-Hand:Cash');
    }
    
    console.log('Candidate accounts:', Array.from(candidateAccounts));
    
    // Search for transactions
    const query = {
      accounts: { $in: Array.from(candidateAccounts) },
      voided: { $ne: true },
      organizationId: new mongoose.Types.ObjectId(orgId)
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const transactions = await transactionCollection
      .find(query)
      .sort({ datetime: 1 })
      .toArray();
      
    console.log(`Found ${transactions.length} transactions`);
    
    if (transactions.length > 0) {
      console.log('\nFirst few transactions:');
      transactions.slice(0, 5).forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.datetime?.toISOString()} - ${tx.memo || 'No memo'} - ${tx.debit ? 'DR' : 'CR'} ${tx.amount} - Accounts: ${tx.accounts?.join(', ')}`);
      });
    }
    
    // Check if there are any transactions for this organization at all
    console.log('\n=== CHECKING ALL TRANSACTIONS FOR THIS ORGANIZATION ===');
    const allOrgTransactions = await transactionCollection
      .find({ organizationId: new mongoose.Types.ObjectId(orgId) })
      .limit(10)
      .toArray();
      
    console.log(`Total transactions for organization: ${allOrgTransactions.length}`);
    
    if (allOrgTransactions.length > 0) {
      console.log('\nSample transactions for this organization:');
      allOrgTransactions.slice(0, 5).forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.datetime?.toISOString()} - ${tx.memo || 'No memo'} - Accounts: ${tx.accounts?.join(', ')}`);
      });
    }
    
    // Check for purchase vouchers that might be related
    console.log('\n=== CHECKING FOR PURCHASE VOUCHERS ===');
    const purchaseTransactions = await transactionCollection
      .find({ 
        organizationId: new mongoose.Types.ObjectId(orgId),
        memo: { $regex: /purchase|bill/i }
      })
      .limit(10)
      .toArray();
      
    console.log(`Purchase-related transactions: ${purchaseTransactions.length}`);
    
    if (purchaseTransactions.length > 0) {
      console.log('\nPurchase transactions:');
      purchaseTransactions.forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.datetime?.toISOString()} - ${tx.memo} - Accounts: ${tx.accounts?.join(', ')} - ${tx.debit ? 'DR' : 'CR'} ${tx.amount}`);
      });
    }
    
    // Check if this account appears in any transactions with different path format
    console.log('\n=== CHECKING FOR ACCOUNT NAME IN ANY TRANSACTION ===');
    const nameBasedTransactions = await transactionCollection
      .find({ 
        organizationId: new mongoose.Types.ObjectId(orgId),
        accounts: { $regex: new RegExp(accountName, 'i') }
      })
      .limit(10)
      .toArray();
      
    console.log(`Transactions containing account name "${accountName}": ${nameBasedTransactions.length}`);
    
    if (nameBasedTransactions.length > 0) {
      console.log('\nTransactions with account name:');
      nameBasedTransactions.forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.datetime?.toISOString()} - ${tx.memo} - Accounts: ${tx.accounts?.join(', ')} - ${tx.debit ? 'DR' : 'CR'} ${tx.amount}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugSpecificLedger();