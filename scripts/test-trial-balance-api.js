import fetch from 'node-fetch';

async function testTrialBalanceAPI() {
  try {
    console.log('🧪 Testing Trial Balance API...\n');
    
    const orgId = '6808baf5f691bbb5e9fd1d5b';
    const asOfDate = new Date().toISOString().split('T')[0];
    
    const url = `http://localhost:3000/api/accounting/reports/trial-balance?organizationId=${orgId}&asOfDate=${asOfDate}`;
    console.log(`📡 Making request to: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n✅ API Response received successfully!');
    console.log('\n📊 Trial Balance Summary:');
    console.log(`As of Date: ${data.asOfDate}`);
    console.log(`Total Accounts: ${data.summary.totalAccounts}`);
    console.log(`Total Debits: $${data.totals.totalDebits.toFixed(2)}`);
    console.log(`Total Credits: $${data.totals.totalCredits.toFixed(2)}`);
    console.log(`Is Balanced: ${data.totals.isBalanced ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📋 Account Details:');
    console.log('Code    | Name                  | Type          | Debit         | Credit');
    console.log('--------|----------------------|---------------|---------------|---------------');
    
    data.accounts.forEach(account => {
      const code = account.accountCode.padEnd(7);
      const name = account.accountName.padEnd(20);
      const type = account.accountType.padEnd(13);
      const debit = account.debitAmount > 0 ? `$${account.debitAmount.toFixed(2)}`.padStart(13) : '-'.padStart(13);
      const credit = account.creditAmount > 0 ? `$${account.creditAmount.toFixed(2)}`.padStart(13) : '-'.padStart(13);
      
      console.log(`${code} | ${name} | ${type} | ${debit} | ${credit}`);
    });
    
    console.log('\n🔍 Account Code Analysis:');
    data.accounts.forEach(account => {
      if (account.accountCode.includes(' ') || account.accountCode.includes(':') || account.accountCode.length > 10) {
        console.log(`⚠️  WARNING: Account "${account.accountCode}" has unusual code format`);
      } else {
        console.log(`✅ Account "${account.accountCode}" has proper numeric code`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testTrialBalanceAPI();