import fs from 'fs';
import path from 'path';

// Read the accounting.js file
const accountingPath = path.join(process.cwd(), 'lib', 'accounting.js');
let content = fs.readFileSync(accountingPath, 'utf8');

console.log('🔧 Fixing future account code generation...');

// Replace the problematic line
const oldLine = "let code = resolvedPath.replace(/:/g, '_').replace(/[^a-zA-Z0-9_]/g, '_');";
const newLine = "// Generate proper numeric code using the helper function\n        const code = await generateAccountCode(accountType, orgId);";

// Count and replace
const beforeCount = (content.match(new RegExp(oldLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
content = content.replace(new RegExp(oldLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLine);

// Also remove the uniqueness check since we generate proper codes
const uniquenessCheck = /\s*\/\/ Check if code already exists and make it unique if needed[\s\S]*?code = `\$\{code\}_\$\{Date\.now\(\)\}`;/g;
const uniquenessMatches = (content.match(uniquenessCheck) || []).length;
content = content.replace(uniquenessCheck, '');

// Write back
fs.writeFileSync(accountingPath, content);

console.log(`✅ Fixed ${beforeCount} occurrences of problematic code generation`);
console.log(`✅ Removed ${uniquenessMatches} uniqueness workarounds`);
console.log('🎉 Future organizations will now get proper numeric account codes!');

// Test the fix by checking if the helper function is being called
if (content.includes('await generateAccountCode(accountType, orgId)')) {
  console.log('✅ Verification: Helper function is now being called correctly');
} else {
  console.log('❌ Warning: Helper function call not found in the updated code');
}