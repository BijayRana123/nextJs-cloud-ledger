// Test script for Profit & Loss Statement functionality
// Run this in the browser console or as a Node.js script

const testProfitLossAPI = async () => {
  console.log('🧪 Testing Profit & Loss Statement API...');
  
  try {
    // Test data - replace with actual organization ID
    const testData = {
      organizationId: "YOUR_ORGANIZATION_ID", // Replace with actual ID
      startDate: new Date(2024, 0, 1).toISOString(), // Jan 1, 2024
      endDate: new Date(2024, 11, 31).toISOString(), // Dec 31, 2024
      format: 'json',
      includeComparison: false
    };

    console.log('📤 Sending request with data:', testData);

    const response = await fetch('/api/accounting/reports/income-statement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! P&L Data received:');
      console.log('📊 Total Revenue:', result.data.totals?.totalRevenue || 0);
      console.log('💸 Total Expenses:', result.data.totals?.totalExpenses || 0);
      console.log('💰 Net Income:', result.data.totals?.netIncome || 0);
      console.log('📈 Net Margin:', result.data.totals?.netIncomeMargin?.toFixed(2) + '%' || '0%');
      console.log('🏢 Revenue Accounts:', result.data.revenues?.length || 0);
      console.log('💳 Expense Accounts:', result.data.expenses?.length || 0);
      
      if (result.data.validation?.warnings?.length > 0) {
        console.log('⚠️ Warnings:', result.data.validation.warnings);
      }
      
      return result.data;
    } else {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return null;
    }
  } catch (error) {
    console.error('🚨 Network Error:', error);
    return null;
  }
};

const testAccountTransactionsAPI = async (accountPath, organizationId) => {
  console.log('🧪 Testing Account Transactions API...');
  
  try {
    const testData = {
      organizationId: organizationId,
      accountPath: accountPath,
      startDate: new Date(2024, 0, 1).toISOString(),
      endDate: new Date(2024, 11, 31).toISOString()
    };

    const response = await fetch('/api/accounting/ledger/account-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Account Transactions Success!');
      console.log('📝 Total Transactions:', result.data.transactions?.length || 0);
      console.log('💰 Total Debits:', result.data.summary?.totalDebits || 0);
      console.log('💰 Total Credits:', result.data.summary?.totalCredits || 0);
      console.log('📊 Net Amount:', result.data.summary?.netAmount || 0);
      return result.data;
    } else {
      const error = await response.json();
      console.error('❌ Account Transactions API Error:', error);
      return null;
    }
  } catch (error) {
    console.error('🚨 Account Transactions Network Error:', error);
    return null;
  }
};

// Test CSV export
const testCSVExport = async (organizationId) => {
  console.log('🧪 Testing CSV Export...');
  
  try {
    const testData = {
      organizationId: organizationId,
      startDate: new Date(2024, 0, 1).toISOString(),
      endDate: new Date(2024, 11, 31).toISOString(),
      format: 'csv'
    };

    const response = await fetch('/api/accounting/reports/income-statement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const csvContent = await response.text();
      console.log('✅ CSV Export Success!');
      console.log('📄 CSV Content Preview:', csvContent.substring(0, 200) + '...');
      return csvContent;
    } else {
      console.error('❌ CSV Export Error:', response.status);
      return null;
    }
  } catch (error) {
    console.error('🚨 CSV Export Network Error:', error);
    return null;
  }
};

// Test period comparison
const testPeriodComparison = async (organizationId) => {
  console.log('🧪 Testing Period Comparison...');
  
  try {
    const currentEnd = new Date();
    const currentStart = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), 1);
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);

    const testData = {
      organizationId: organizationId,
      startDate: currentStart.toISOString(),
      endDate: currentEnd.toISOString(),
      includeComparison: true,
      previousStartDate: previousStart.toISOString(),
      previousEndDate: previousEnd.toISOString(),
      format: 'json'
    };

    const response = await fetch('/api/accounting/reports/income-statement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Period Comparison Success!');
      console.log('📊 Current Period Revenue:', result.data.currentPeriod?.totals?.totalRevenue || 0);
      console.log('📊 Previous Period Revenue:', result.data.previousPeriod?.totals?.totalRevenue || 0);
      console.log('📈 Revenue Change:', result.data.comparison?.revenueChange || 0);
      console.log('📈 Revenue Change %:', result.data.comparison?.revenueChangePercent?.toFixed(2) + '%' || '0%');
      return result.data;
    } else {
      const error = await response.json();
      console.error('❌ Period Comparison Error:', error);
      return null;
    }
  } catch (error) {
    console.error('🚨 Period Comparison Network Error:', error);
    return null;
  }
};

// Main test function
const runAllTests = async () => {
  console.log('🚀 Starting Profit & Loss Statement Tests...');
  console.log('⚠️ Make sure to replace YOUR_ORGANIZATION_ID with actual organization ID');
  
  const organizationId = "YOUR_ORGANIZATION_ID"; // Replace with actual ID
  
  // Test basic P&L
  const plData = await testProfitLossAPI();
  
  if (plData && plData.revenues?.length > 0) {
    // Test account transactions with first revenue account
    await testAccountTransactionsAPI(plData.revenues[0].accountPath, organizationId);
  }
  
  // Test CSV export
  await testCSVExport(organizationId);
  
  // Test period comparison
  await testPeriodComparison(organizationId);
  
  console.log('🏁 All tests completed!');
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testProfitLossAPI,
    testAccountTransactionsAPI,
    testCSVExport,
    testPeriodComparison,
    runAllTests
  };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected. Run runAllTests() to start testing.');
}