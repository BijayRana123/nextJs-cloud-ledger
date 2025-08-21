import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function debugSpecificLedgerIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Import models after connection
    const { Ledger } = await import('../lib/models.js');
    const ChartOfAccount = (await import('../lib/models/ChartOfAccounts.js')).default;

    const accountId = '689c561cff19cbbcd3d00a64';
    
    console.log('\n=== TESTING LEDGER API FOR ID:', accountId, '===');
    
    // Step 1: Check if it exists as a Ledger
    console.log('\n1. CHECKING AS LEDGER:');
    const ledger = await Ledger.findById(accountId).populate('group organization');
    
    if (ledger) {
      console.log('✅ Found as Ledger:');
      console.log(`   Name: ${ledger.name}`);
      console.log(`   Code: ${ledger.code}`);
      console.log(`   Group: ${ledger.group?.name || 'No Group'}`);
      console.log(`   Organization: ${ledger.organization?.name} (${ledger.organization?._id})`);
      console.log(`   Opening Balance: ${ledger.openingBalance || 0}`);
    } else {
      console.log('❌ Not found as Ledger');
      return;
    }
    
    // Step 2: Simulate the ChartOfAccount creation logic from the API
    console.log('\n2. SIMULATING CHART OF ACCOUNT CREATION:');
    const orgId = ledger.organization._id.toString();
    const groupName = ledger.group?.name || 'Misc';
    const code = `${groupName}:${ledger.name}`;
    const path = `${groupName}:${ledger.name}`;
    
    console.log(`   Group Name: ${groupName}`);
    console.log(`   Code: ${code}`);
    console.log(`   Path: ${path}`);
    
    // Check if ChartOfAccount already exists
    let coa = await ChartOfAccount.findOne({ code, organization: orgId, name: ledger.name });
    
    if (coa) {
      console.log('✅ ChartOfAccount already exists:');
      console.log(`   ID: ${coa._id}`);
      console.log(`   Path: ${coa.path}`);
      console.log(`   Type: ${coa.type}`);
    } else {
      console.log('❌ ChartOfAccount does not exist, would need to be created');
      
      // Determine type and subtype
      let type = 'asset';
      let subtype = 'current';
      if (/liab/i.test(groupName)) { type = 'liability'; subtype = 'current_liability'; }
      if (/revenue|income/i.test(groupName)) { type = 'revenue'; subtype = 'operating_revenue'; }
      if (/expense/i.test(groupName)) { type = 'expense'; subtype = 'operating_expense'; }
      if (/equity/i.test(groupName)) { type = 'equity'; subtype = 'capital'; }
      
      console.log(`   Would create with type: ${type}, subtype: ${subtype}`);
    }
    
    // Step 3: Check for transactions using different path formats
    console.log('\n3. CHECKING FOR TRANSACTIONS:');
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    const candidateAccounts = new Set([path]);
    
    // Add variations based on the ledger name and group
    const leafName = ledger.name;
    if (groupName.toLowerCase().includes('payable')) {
      candidateAccounts.add(`Liabilities:Accounts Payable:${leafName}`);
      candidateAccounts.add(`Accounts Payable:${leafName}`);
    }
    if (groupName.toLowerCase().includes('receivable')) {
      candidateAccounts.add(`Assets:Accounts Receivable:${leafName}`);
      candidateAccounts.add(`Accounts Receivable:${leafName}`);
    }
    if (groupName.toLowerCase().includes('cash')) {
      candidateAccounts.add(`Assets:Cash:${leafName}`);
      candidateAccounts.add(`Assets:Cash-in-Hand:${leafName}`);
      candidateAccounts.add(`Cash:${leafName}`);
    }
    if (leafName.toLowerCase() === 'cash') {
      candidateAccounts.add('Assets:Cash');
      candidateAccounts.add('Cash');
    }
    
    console.log('   Candidate account paths:', Array.from(candidateAccounts));
    
    const query = {
      accounts: { $in: Array.from(candidateAccounts) },
      voided: { $ne: true },
      organizationId: new mongoose.Types.ObjectId(orgId)
    };
    
    const transactions = await transactionCollection
      .find(query)
      .sort({ datetime: -1 })
      .limit(10)
      .toArray();
      
    console.log(`   Found ${transactions.length} transactions`);
    
    if (transactions.length > 0) {
      console.log('   Recent transactions:');
      transactions.forEach((tx, idx) => {
        console.log(`     ${idx + 1}. ${tx.datetime?.toISOString()} - ${tx.memo || 'No memo'} - ${tx.debit ? 'DR' : 'CR'} ${tx.amount}`);
        console.log(`        Accounts: ${tx.accounts?.join(', ')}`);
      });
    } else {
      console.log('   ❌ No transactions found with any candidate path');
      
      // Check what transactions DO exist for this organization
      const anyOrgTx = await transactionCollection
        .find({ organizationId: new mongoose.Types.ObjectId(orgId) })
        .sort({ datetime: -1 })
        .limit(5)
        .toArray();
        
      console.log(`\n   Found ${anyOrgTx.length} total transactions for this organization:`);
      anyOrgTx.forEach((tx, idx) => {
        const accounts = Array.isArray(tx.accounts) ? tx.accounts.join(', ') : tx.accounts;
        console.log(`     ${idx + 1}. ${tx.memo || 'No memo'} - Accounts: ${accounts}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugSpecificLedgerIssue();