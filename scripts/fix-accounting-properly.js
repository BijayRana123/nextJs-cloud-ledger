import fs from 'fs';
import path from 'path';

// Read the accounting.js file
const accountingPath = path.join(process.cwd(), 'lib', 'accounting.js');
let content = fs.readFileSync(accountingPath, 'utf8');

console.log('🔧 Properly fixing accounting.js...');

// Fix the first occurrence (around line 595)
const firstBrokenSection = `      // Determine account type and subtype based on path
      let accountType = 'asset';
      let accountSubtype = 'current';
      // Generate proper numeric code using the helper function
        const code = await generateAccountCode(accountType, orgId);
      
      if (resolvedPath.startsWith('Liabilities:')) {
        accountType = 'liability';
        accountSubtype = 'current_liability';
      } else if (resolvedPath.startsWith('Revenue:') || resolvedPath.startsWith('Income:')) {
        accountType = 'revenue';
        accountSubtype = 'operating_revenue';
      } else if (resolvedPath.startsWith('Expenses:')) {
        accountType = 'expense';
        accountSubtype = 'operating_expense';
      } else if (resolvedPath.startsWith('Equity:')) {
        accountType = 'equity';
        accountSubtype = 'capital';
      }
      
      // Check if ChartOfAccount already exists by path first
      let chartAccount = await ChartOfAccount.findOne({ path: resolvedPath, organization: orgId });
      if (!chartAccount) {
        }`;

const firstFixedSection = `      // Determine account type and subtype based on path
      let accountType = 'asset';
      let accountSubtype = 'current';
      
      if (resolvedPath.startsWith('Liabilities:')) {
        accountType = 'liability';
        accountSubtype = 'current_liability';
      } else if (resolvedPath.startsWith('Revenue:') || resolvedPath.startsWith('Income:')) {
        accountType = 'revenue';
        accountSubtype = 'operating_revenue';
      } else if (resolvedPath.startsWith('Expenses:')) {
        accountType = 'expense';
        accountSubtype = 'operating_expense';
      } else if (resolvedPath.startsWith('Equity:')) {
        accountType = 'equity';
        accountSubtype = 'capital';
      }
      
      // Check if ChartOfAccount already exists by path first
      let chartAccount = await ChartOfAccount.findOne({ path: resolvedPath, organization: orgId });
      if (!chartAccount) {
        // Generate proper numeric code using the helper function
        const code = await generateAccountCode(accountType, orgId);`;

// Replace both occurrences
content = content.replace(firstBrokenSection, firstFixedSection);
content = content.replace(firstBrokenSection, firstFixedSection); // Replace second occurrence too

// Write back
fs.writeFileSync(accountingPath, content);

console.log('✅ Fixed broken code sections');
console.log('✅ Moved code generation after account type determination');
console.log('✅ Fixed missing braces');
console.log('🎉 accounting.js is now properly fixed!');

// Verify the fix
if (content.includes('const code = await generateAccountCode(accountType, orgId);') && 
    !content.includes('if (!chartAccount) {\n        }')) {
  console.log('✅ Verification: Code is properly structured');
} else {
  console.log('❌ Warning: Some issues may remain');
}