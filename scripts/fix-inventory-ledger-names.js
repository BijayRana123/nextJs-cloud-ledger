// Fix inventory ledger names: replace ObjectId names with item names
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

const ledgerSchema = new mongoose.Schema({
  name: String,
  group: mongoose.Schema.Types.ObjectId,
  description: String,
  organization: mongoose.Schema.Types.ObjectId,
  path: String,
}, { strict: false });
const Ledger = mongoose.model('Ledger', ledgerSchema, 'ledgers');

const itemSchema = new mongoose.Schema({
  name: String,
  organization: mongoose.Schema.Types.ObjectId,
}, { strict: false });
const Item = mongoose.model('Item', itemSchema, 'items');

const ledgerGroupSchema = new mongoose.Schema({
  name: String,
  parent: mongoose.Schema.Types.ObjectId,
  organization: mongoose.Schema.Types.ObjectId,
}, { strict: false });
const LedgerGroup = mongoose.model('LedgerGroup', ledgerGroupSchema, 'ledgergroups');

const customerSchema = new mongoose.Schema({
  name: String,
  organization: mongoose.Schema.Types.ObjectId,
}, { strict: false });
const Customer = mongoose.model('Customer', customerSchema, 'customers');

async function run() {
  await mongoose.connect(MONGODB_URI);

  // Find all inventory groups
  const inventoryGroups = await LedgerGroup.find({ name: /inventory/i });
  const groupIds = inventoryGroups.map(g => g._id.toString());
  // Find all ledgers in inventory groups whose name is a valid ObjectId
  const ledgers = await Ledger.find({ group: { $in: groupIds } });
  let count = 0;
  for (const ledger of ledgers) {
    if (mongoose.Types.ObjectId.isValid(ledger.name)) {
      const item = await Item.findOne({ _id: ledger.name, organization: ledger.organization });
      if (item) {
        const oldName = ledger.name;
        // Check for duplicate
        const duplicate = await Ledger.findOne({ name: item.name, organization: ledger.organization, _id: { $ne: ledger._id } });
        if (duplicate) {
          console.warn(`Duplicate ledger exists for item '${item.name}' in org '${ledger.organization}'. Skipping ledger ${ledger._id}.`);
          continue;
        }
        ledger.name = item.name;
        ledger.description = `Item:${item.name}`;
        // Update path if present
        if (ledger.path && ledger.path.endsWith(oldName)) {
          ledger.path = ledger.path.replace(oldName, item.name);
        }
        await ledger.save();

        count++;
      }
    }
  }


  // Fix customer ledgers (Accounts Receivable)
  const arGroups = await LedgerGroup.find({ name: /accounts receivable/i });
  const arGroupIds = arGroups.map(g => g._id.toString());
  const arLedgers = await Ledger.find({ group: { $in: arGroupIds } });
  let arCount = 0;
  for (const ledger of arLedgers) {
    if (mongoose.Types.ObjectId.isValid(ledger.name)) {
      const customer = await Customer.findOne({ _id: ledger.name, organization: ledger.organization });
      if (customer) {
        const oldName = ledger.name;
        // Check for duplicate
        const duplicate = await Ledger.findOne({ name: customer.name, organization: ledger.organization, _id: { $ne: ledger._id } });
        if (duplicate) {
          console.warn(`Duplicate ledger exists for customer '${customer.name}' in org '${ledger.organization}'. Skipping ledger ${ledger._id}.`);
          continue;
        }
        ledger.name = customer.name;
        // Update path if present
        if (ledger.path && ledger.path.endsWith(oldName)) {
          ledger.path = ledger.path.replace(oldName, customer.name);
        }
        await ledger.save();

        arCount++;
      }
    }
  }


  // NEW: Fix customer ledgers under Assets group (not just Accounts Receivable)
  const assetsGroups = await LedgerGroup.find({ name: /assets/i });
  const assetsGroupIds = assetsGroups.map(g => g._id.toString());
  const assetLedgers = await Ledger.find({ group: { $in: assetsGroupIds } });
  let assetCount = 0;
  for (const ledger of assetLedgers) {
    if (mongoose.Types.ObjectId.isValid(ledger.name)) {
      const customer = await Customer.findOne({ _id: ledger.name, organization: ledger.organization });
      if (customer) {
        // Move to Accounts Receivable group if not already
        let arGroup = arGroups[0];
        if (!arGroup) {
          // Generate a code for the new LedgerGroup
          const existingGroupCodes = await LedgerGroup.find({ 
            organization: ledger.organization, 
            code: { $exists: true, $ne: null } 
          }).select('code').lean();
          
          const usedCodes = existingGroupCodes.map(g => parseInt(g.code)).filter(code => !isNaN(code));
          let newGroupCode = 1000;
          while (usedCodes.includes(newGroupCode)) {
            newGroupCode += 100;
          }
          
          arGroup = await LedgerGroup.create({ 
            name: 'Accounts Receivable', 
            code: newGroupCode.toString(),
            organization: ledger.organization 
          });
        }
        // Check for duplicate
        const duplicate = await Ledger.findOne({ name: customer.name, organization: ledger.organization, _id: { $ne: ledger._id } });
        if (duplicate) {
          console.warn(`Duplicate ledger exists for customer '${customer.name}' in org '${ledger.organization}'. Skipping asset ledger ${ledger._id}.`);
          continue;
        }
        const oldName = ledger.name;
        ledger.name = customer.name;
        ledger.group = arGroup._id;
        // Update path if present
        if (ledger.path && ledger.path.endsWith(oldName)) {
          ledger.path = ledger.path.replace(oldName, customer.name);
        }
        await ledger.save();

        assetCount++;
      }
    }
  }


  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); }); 
