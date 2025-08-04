import fetch from 'node-fetch';

async function testAPICall() {
  try {
    const accountId = '682785b3e4f687aa2af24755';
    const orgId = '6808baf5f691bbb5e9fd1d5b';
    
    console.log(`🧪 Testing API call for account: ${accountId}`);
    
    // Test the ledgers API first
    console.log('\n1️⃣ Testing /api/accounting/ledgers/{id}');
    const ledgerResponse = await fetch(`http://localhost:3001/api/accounting/ledgers/${accountId}`, {
      headers: {
        'x-organization-id': orgId
      }
    });
    
    console.log(`   Status: ${ledgerResponse.status}`);
    const ledgerData = await ledgerResponse.json();
    console.log(`   Response:`, JSON.stringify(ledgerData, null, 2));
    
    if (ledgerResponse.ok && ledgerData.chartOfAccount) {
      console.log('\n2️⃣ Testing /api/accounting/ledger/{chartOfAccountId}');
      const txResponse = await fetch(`http://localhost:3001/api/accounting/ledger/${ledgerData.chartOfAccount._id}`, {
        headers: {
          'x-organization-id': orgId
        }
      });
      
      console.log(`   Status: ${txResponse.status}`);
      const txData = await txResponse.json();
      console.log(`   Response:`, JSON.stringify(txData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPICall();