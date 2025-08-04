import fs from 'fs';
import path from 'path';

// Read the accounting.js file
const accountingPath = path.join(process.cwd(), 'lib', 'accounting.js');
let content = fs.readFileSync(accountingPath, 'utf8');

console.log('🔧 Fixing account code generation in accounting.js...');

// Replace the problematic code generation with proper numeric code generation
const oldPattern = /let code = resolvedPath\.replace\(\/:/g, '_'\)\.replace\(\/\[^a-zA-Z0-9_\]\/g, '_'\);/g;
const newCode = '// Generate proper numeric code\n        const code = await generateAccountCode(accountType, orgId);';

// Count occurrences
const matches = content.match(oldPattern);
console.log(`Found ${matches ? matches.length : 0} occurrences to fix`);

if (matches && matches.length > 0) {
  // Replace all occurrences
  content = content.replace(oldPattern, newCode);
  
  // Also remove the code uniqueness check since we're generating proper codes
  content = content.replace(/\s*\/\/ Check if code already exists and make it unique if needed[\s\S]*?code = `\$\{code\}_\$\{Date\.now\(\)\}`;/g, '');
  
  // Write the fixed content back
  fs.writeFileSync(accountingPath, content);
  
  console.log('✅ Successfully fixed account code generation!');
  console.log('📝 Changes made:');
  console.log('  - Replaced path-based codes with proper numeric codes');
  console.log('  - Removed code uniqueness workaround');
  console.log('  - All future accounts will have proper numeric codes');
} else {
  console.log('ℹ️  No occurrences found to fix');
}

console.log('\n🎉 Account code generation has been fixed for future organizations!');