/*
  Cleanup script: remove accounting and stock artifacts for deleted Purchase Vouchers (PurchaseOrders)

  Supports:
  - Bulk scan of orphaned PV journals/transactions/stock entries
  - Targeted cleanup by voucher number (PV-XXXX)
  - Targeted cleanup by purchase order id
  - Optional organization scoping
  - Dry-run mode (default) so you can see what would be deleted

  Usage examples (node):
    node scripts/cleanup-purchase-voucher-artifacts.js --all --org 66ef... --apply
    node scripts/cleanup-purchase-voucher-artifacts.js --voucher PV-0007 --apply
    node scripts/cleanup-purchase-voucher-artifacts.js --po 66f0a3... --apply

  Notes:
  - "Apply" mode actually deletes. Without --apply it will only print what it would do.
  - For stock entries tied to missing purchase vouchers, we also roll back Item.quantity by the same amount.
*/

import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { PurchaseOrder, Item, StockEntry } from '../lib/models.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { apply: false, all: false, voucher: null, po: null, org: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--apply') opts.apply = true;
    else if (a === '--all') opts.all = true;
    else if (a === '--voucher') opts.voucher = args[++i];
    else if (a === '--po') opts.po = args[++i];
    else if (a === '--org') opts.org = args[++i];
  }
  return opts;
}

async function getCollections() {
  const db = mongoose.connection.db;
  return {
    txCol: db.collection('medici_transactions'),
    jrCol: db.collection('medici_journals'),
  };
}

async function deleteByVoucherNumber(voucherNumber, orgId, apply) {
  const { txCol, jrCol } = await getCollections();
  const jrQuery = { voucherNumber };
  if (orgId) jrQuery.organizationId = new mongoose.Types.ObjectId(orgId);
  const journals = await jrCol.find(jrQuery, { projection: { _id: 1 } }).toArray();
  const jrIds = journals.map(j => j._id);
  console.log(`Voucher ${voucherNumber} -> journals found: ${jrIds.length}`);
  if (!jrIds.length) return { deletedJournals: 0, deletedTransactions: 0 };

  if (apply) {
    const txRes = await txCol.deleteMany({ _journal: { $in: jrIds } });
    const jrRes = await jrCol.deleteMany({ _id: { $in: jrIds } });
    console.log(`Deleted tx: ${txRes.deletedCount}, journals: ${jrRes.deletedCount}`);
    return { deletedJournals: jrRes.deletedCount, deletedTransactions: txRes.deletedCount };
  } else {
    const txCount = await txCol.countDocuments({ _journal: { $in: jrIds } });
    console.log(`[dry-run] Would delete tx: ${txCount}, journals: ${jrIds.length}`);
    return { deletedJournals: jrIds.length, deletedTransactions: txCount };
  }
}

async function deleteByPurchaseOrderId(poId, orgId, apply) {
  const { txCol, jrCol } = await getCollections();
  const poObjectId = new mongoose.Types.ObjectId(poId);

  // 1) Delete medici tx that reference this voucher/order id
  const txQuery = {
    $or: [
      { 'meta.purchaseVoucherId': poObjectId },
      { 'meta.purchaseOrderId': poObjectId },
    ],
  };
  if (orgId) txQuery.organizationId = new mongoose.Types.ObjectId(orgId);
  const txToDelete = await txCol.find(txQuery, { projection: { _id: 1, _journal: 1 } }).toArray();
  const txIds = txToDelete.map(t => t._id);
  const jrIdsFromTx = [...new Set(txToDelete.map(t => t._journal).filter(Boolean))];

  // 2) If we know the voucherNumber from PO, also remove its journals (legacy/edge cases)
  const poDoc = await PurchaseOrder.findById(poId).lean();
  let jrIdsByVoucher = [];
  if (poDoc?.referenceNo) {
    const jrQuery = { voucherNumber: poDoc.referenceNo };
    if (orgId) jrQuery.organizationId = new mongoose.Types.ObjectId(orgId);
    const jrDocs = await jrCol.find(jrQuery, { projection: { _id: 1 } }).toArray();
    jrIdsByVoucher = jrDocs.map(j => j._id);
  }

  const jrIds = [...new Set([...jrIdsFromTx, ...jrIdsByVoucher])];

  // 3) Stock entries for this voucher
  const stockQuery = { referenceId: poObjectId, referenceType: 'PurchaseVoucher' };
  if (orgId) stockQuery.organization = new mongoose.Types.ObjectId(orgId);
  const stockEntries = await StockEntry.find(stockQuery).lean();

  console.log(`PO ${poId}: tx found=${txIds.length}, journals=${jrIds.length}, stockEntries=${stockEntries.length}`);

  if (apply) {
    if (txIds.length) {
      const txRes = await txCol.deleteMany({ _id: { $in: txIds } });
      console.log(`Deleted transactions: ${txRes.deletedCount}`);
    }
    if (jrIds.length) {
      // Delete their tx first (if any remain), then journals
      const txRes = await txCol.deleteMany({ _journal: { $in: jrIds } });
      const jrRes = await jrCol.deleteMany({ _id: { $in: jrIds } });
      console.log(`Deleted journal-linked tx: ${txRes.deletedCount}, journals: ${jrRes.deletedCount}`);
    }
    if (stockEntries.length) {
      // Rollback item quantities for each stock entry, then delete stock entries
      for (const se of stockEntries) {
        if (se.item && se.quantity) {
          await Item.updateOne({ _id: se.item }, { $inc: { quantity: -Number(se.quantity) } });
        }
      }
      const delRes = await StockEntry.deleteMany({ _id: { $in: stockEntries.map(s => s._id) } });
      console.log(`Deleted stock entries: ${delRes.deletedCount} and rolled back item quantities`);
    }

    // Remove orphan journals (with no transactions) for this org as a last pass
    const orphanQuery = { _transactions: { $size: 0 } };
    if (orgId) orphanQuery.organizationId = new mongoose.Types.ObjectId(orgId);
    const orphanDel = await jrCol.deleteMany(orphanQuery);
    if (orphanDel.deletedCount) {
      console.log(`Deleted orphan journals (no tx): ${orphanDel.deletedCount}`);
    }
  } else {
    const txCount = txIds.length + (await (async () => txCol.countDocuments({ _journal: { $in: jrIds } }))());
    console.log(`[dry-run] Would delete tx: ${txCount}, journals: ${jrIds.length}, stockEntries: ${stockEntries.length}`);
  }
}

async function bulkScanAndCleanup(orgId, apply) {
  const { txCol, jrCol } = await getCollections();

  // A) Orphan PV journals by voucherNumber (PV-...)
  const jrQuery = { voucherNumber: { $regex: /^PV-/ } };
  if (orgId) jrQuery.organizationId = new mongoose.Types.ObjectId(orgId);
  const pvJournals = await jrCol.find(jrQuery, { projection: { _id: 1, voucherNumber: 1, organizationId: 1 } }).toArray();
  console.log(`Found PV journals: ${pvJournals.length}`);

  let totalDeletedTx = 0, totalDeletedJr = 0;
  for (const jr of pvJournals) {
    const voucherNumber = jr.voucherNumber;
    // See if any PO exists with this referenceNo within org
    const exists = await PurchaseOrder.findOne({ referenceNo: voucherNumber, ...(orgId ? { organization: orgId } : {}) }).lean();
    if (!exists) {
      console.log(`Orphan PV journal by voucherNumber=${voucherNumber} (no matching PurchaseOrder)`);
      const res = await deleteByVoucherNumber(voucherNumber, orgId, apply);
      totalDeletedTx += res.deletedTransactions || 0;
      totalDeletedJr += res.deletedJournals || 0;
    }
  }

  // B) Transactions with meta.purchaseVoucherId / meta.purchaseOrderId whose PO no longer exists
  const txQuery = {
    $or: [
      { 'meta.purchaseVoucherId': { $exists: true } },
      { 'meta.purchaseOrderId': { $exists: true } },
    ],
  };
  if (orgId) txQuery.organizationId = new mongoose.Types.ObjectId(orgId);

  const cursor = txCol.find(txQuery, { projection: { _id: 1, _journal: 1, 'meta.purchaseVoucherId': 1, 'meta.purchaseOrderId': 1 } });
  const seenPoIds = new Set();
  const orphanPoIds = new Set();

  while (await cursor.hasNext()) {
    const d = await cursor.next();
    const id = d.meta?.purchaseVoucherId || d.meta?.purchaseOrderId;
    if (!id) continue;
    const poIdStr = typeof id === 'string' ? id : (id.toString());
    if (seenPoIds.has(poIdStr) || orphanPoIds.has(poIdStr)) continue;
    seenPoIds.add(poIdStr);
    const exists = await PurchaseOrder.exists({ _id: poIdStr });
    if (!exists) {
      orphanPoIds.add(poIdStr);
    }
  }

  console.log(`Orphan purchase voucher IDs found in transactions: ${orphanPoIds.size}`);
  for (const poId of orphanPoIds) {
    await deleteByPurchaseOrderId(poId, orgId, apply);
  }

  // C) Stock entries referencing missing PO
  const stockQuery = { referenceType: 'PurchaseVoucher' };
  if (orgId) stockQuery.organization = new mongoose.Types.ObjectId(orgId);
  const stockEntries = await StockEntry.find(stockQuery, { _id: 1, item: 1, quantity: 1, referenceId: 1 }).lean();
  let pruned = 0;
  for (const se of stockEntries) {
    if (!se.referenceId) continue;
    const exists = await PurchaseOrder.exists({ _id: se.referenceId });
    if (!exists) {
      pruned++;
      if (apply) {
        if (se.item && se.quantity) {
          await Item.updateOne({ _id: se.item }, { $inc: { quantity: -Number(se.quantity) } });
        }
        await StockEntry.deleteOne({ _id: se._id });
        console.log(`Deleted orphan StockEntry ${se._id} and rolled back item qty by ${se.quantity}`);
      } else {
        console.log(`[dry-run] Would delete orphan StockEntry ${se._id} and rollback item qty by ${se.quantity}`);
      }
    }
  }
  if (apply) console.log(`Deleted orphan stock entries: ${pruned}`);
  else console.log(`[dry-run] Would delete orphan stock entries: ${pruned}`);

  return { totalDeletedTx, totalDeletedJr };
}

async function main() {
  const { apply, all, voucher, po, org } = parseArgs();
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`\n=== Cleanup Purchase Voucher Artifacts (${mode}) ===`);
  if (org) console.log(`Scoped to organization: ${org}`);

  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    if (voucher) {
      await deleteByVoucherNumber(voucher, org, apply);
    } else if (po) {
      await deleteByPurchaseOrderId(po, org, apply);
    } else if (all) {
      await bulkScanAndCleanup(org, apply);
    } else {
      console.log('Nothing to do. Provide one of: --voucher PV-XXXX | --po <id> | --all');
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main();