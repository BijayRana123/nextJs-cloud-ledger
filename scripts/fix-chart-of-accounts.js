import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixChartOfAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808baf5f691bbb5e9fd1d5b';
    
    // Check if organization already has accounts
    const existingAccounts = await ChartOfAccount.find({ organization: orgId });
    console.log(`\n📊 Existing accounts for organization: ${existingAccounts.length}`);
    
    if (existingAccounts.length > 0) {
      console.log('Organization already has chart of accounts. Exiting...');
      return;
    }

    // Find accounts with no organization
    const orphanAccounts = await ChartOfAccount.find({ 
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    });
    
    console.log(`\n🔍 Found ${orphanAccounts.length} accounts without organization`);
    
    if (orphanAccounts.length > 0) {
      // Option 1: Assign existing orphan accounts to the organization
      console.log('\n🔧 Assigning orphan accounts to organization...');
      
      const updateResult = await ChartOfAccount.updateMany(
        { 
          $or: [
            { organization: { $exists: false } },
            { organization: null }
          ]
        },
        { 
          $set: { organization: new mongoose.Types.ObjectId(orgId) }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} accounts`);
    } else {
      // Option 2: Create default accounts for the organization
      console.log('\n🆕 Creating default accounts for organization...');
      
      const defaultAccounts = [
        // Asset accounts
        { code: '1000', name: 'Assets', type: 'asset', subtype: 'current', path: 'Assets', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '1100', name: 'Current Assets', type: 'asset', subtype: 'current', parent: '1000', path: 'Assets:Current Assets', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '1110', name: 'Cash and Bank', type: 'asset', subtype: 'current', parent: '1100', path: 'Assets:Current Assets:Cash and Bank', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '1120', name: 'Accounts Receivable', type: 'asset', subtype: 'current', parent: '1100', path: 'Assets:Current Assets:Accounts Receivable', isSubledger: true, subledgerType: 'customer', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '1130', name: 'Inventory', type: 'asset', subtype: 'current', parent: '1100', path: 'Assets:Current Assets:Inventory', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '1200', name: 'Fixed Assets', type: 'asset', subtype: 'fixed', parent: '1000', path: 'Assets:Fixed Assets', organization: new mongoose.Types.ObjectId(orgId) },
        
        // Liability accounts
        { code: '2000', name: 'Liabilities', type: 'liability', subtype: 'current_liability', path: 'Liabilities', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '2100', name: 'Current Liabilities', type: 'liability', subtype: 'current_liability', parent: '2000', path: 'Liabilities:Current Liabilities', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '2110', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability', parent: '2100', path: 'Liabilities:Current Liabilities:Accounts Payable', isSubledger: true, subledgerType: 'supplier', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '2120', name: 'Taxes Payable', type: 'liability', subtype: 'current_liability', parent: '2100', path: 'Liabilities:Current Liabilities:Taxes Payable', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '2200', name: 'Long Term Liabilities', type: 'liability', subtype: 'long_term_liability', parent: '2000', path: 'Liabilities:Long Term Liabilities', organization: new mongoose.Types.ObjectId(orgId) },
        
        // Equity accounts
        { code: '3000', name: 'Equity', type: 'equity', subtype: 'capital', path: 'Equity', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '3100', name: 'Owner\'s Capital', type: 'equity', subtype: 'capital', parent: '3000', path: 'Equity:Owner\'s Capital', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '3200', name: 'Retained Earnings', type: 'equity', subtype: 'retained_earnings', parent: '3000', path: 'Equity:Retained Earnings', organization: new mongoose.Types.ObjectId(orgId) },
        
        // Revenue accounts
        { code: '4000', name: 'Revenue', type: 'revenue', subtype: 'operating_revenue', path: 'Revenue', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '4100', name: 'Sales Revenue', type: 'revenue', subtype: 'operating_revenue', parent: '4000', path: 'Revenue:Sales Revenue', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '4200', name: 'Service Revenue', type: 'revenue', subtype: 'operating_revenue', parent: '4000', path: 'Revenue:Service Revenue', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '4900', name: 'Other Revenue', type: 'revenue', subtype: 'other_revenue', parent: '4000', path: 'Revenue:Other Revenue', organization: new mongoose.Types.ObjectId(orgId) },
        
        // Expense accounts
        { code: '5000', name: 'Expenses', type: 'expense', subtype: 'operating_expense', path: 'Expenses', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '5100', name: 'Cost of Goods Sold', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Cost of Goods Sold', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '5200', name: 'Salaries and Wages', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Salaries and Wages', isSubledger: true, subledgerType: 'employee', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '5300', name: 'Rent Expense', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Rent Expense', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '5400', name: 'Utilities Expense', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Utilities Expense', organization: new mongoose.Types.ObjectId(orgId) },
        { code: '5900', name: 'Other Expenses', type: 'expense', subtype: 'other_expense', parent: '5000', path: 'Expenses:Other Expenses', organization: new mongoose.Types.ObjectId(orgId) }
      ];

      await ChartOfAccount.insertMany(defaultAccounts);
      console.log(`✅ Created ${defaultAccounts.length} default accounts`);
    }
    
    // Verify the fix
    const finalCount = await ChartOfAccount.find({ organization: orgId }).countDocuments();
    console.log(`\n✅ Organization now has ${finalCount} accounts`);
    
    // Show some sample accounts
    const sampleAccounts = await ChartOfAccount.find({ organization: orgId }).limit(5);
    console.log('\n📋 Sample accounts:');
    sampleAccounts.forEach(acc => {
      console.log(`  - ${acc.code}: ${acc.name} (${acc.type}) - Path: ${acc.path}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixChartOfAccounts();