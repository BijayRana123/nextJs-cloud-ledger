// scripts/fix-customer-coa-paths.js
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ChartOfAccountImport from '../lib/models/ChartOfAccounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';
  await mongoose.connect(MONGODB_URI);
  const ChartOfAccount = ChartOfAccountImport;

  const customerAccounts = await ChartOfAccount.find({
    type: 'asset',
    path: { $regex: /^(Assets:)?Accounts Receivable:/ }
  });


  let updated = 0;
  for (const account of customerAccounts) {
    const customerName = account.name;
    const oldPath = account.path;
    const newPath = `Assets:Accounts Receivable:${customerName}`;
    if (oldPath !== newPath) {
      await ChartOfAccount.findByIdAndUpdate(account._id, {
        path: newPath,
        code: newPath.replace(/:/g, '')
      });

      updated++;
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error running fix-customer-coa-paths.js:', err);
  process.exit(1);
});
