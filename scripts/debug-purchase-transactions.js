// Debug purchase transactions
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugPurchaseTransactions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Debugging Purchase Transactions...\n');
    
    // Check recent purchase orders
    console.log('📋 Recent Purchase Orders:');
    const recentPOs = await db.collection('purchaseorders').find({}).sort({createdAt: -1}).limit(3).toArray();
    for(const po of recentPOs) {
      console.log(`- PO ${po._id}: ${po.referenceNo || 'NO REF'}, Total: ${po.totalAmount}, Supplier: ${po.supplier}, Created: ${po.createdAt}`);
      console.log(`  Items: ${po.items?.length || 0} items`);
      if (po.items && po.items.length > 0) {
        po.items.forEach(item => {
          console.log(`    - Item ${item.item}: Qty ${item.quantity}, Price ${item.price}`);
        });
      }
    }
    
    console.log('\n📋 Recent Journal Entries (Medici):');
    const journals = await db.collection('medici_journals').find({}).sort({timestamp: -1}).limit(5).toArray();
    if (journals.length === 0) {
      console.log('❌ No journal entries found!');
    } else {
      journals.forEach(journal => {
        console.log(`- Journal ${journal.voucherNumber || journal._id}: ${journal.memo}`);
        console.log(`  Created: ${journal.timestamp}, Organization: ${journal.organizationId}`);
      });
    }
    
    console.log('\n📋 Recent Medici Transactions:');
    const transactions = await db.collection('medici_transactions').find({}).sort({timestamp: -1}).limit(10).toArray();
    if (transactions.length === 0) {
      console.log('❌ No medici transactions found!');
    } else {
      transactions.forEach(tx => {
        console.log(`- Account: ${tx.account}, ${tx.debit || 0} DR / ${tx.credit || 0} CR`);
        console.log(`  Voucher: ${tx.voucherNumber}, Memo: ${tx.memo}`);
        console.log(`  Date: ${tx.timestamp}, Organization: ${tx.organizationId}`);
        console.log('  ---');
      });
    }
    
    // Check specific ledger
    const ledgerId = '6899d87eca6cd058c142d026';
    console.log(`\n📋 Checking Ledger ${ledgerId}:`);
    try {
      const ledger = await db.collection('ledgers').findOne({_id: new ObjectId(ledgerId)});
      if (ledger) {
        console.log(`✅ Ledger found: ${ledger.name} (Path: ${ledger.path})`);
        console.log(`   Code: ${ledger.code}, Group: ${ledger.group}, Org: ${ledger.organization}`);
        
        // Check transactions for this ledger (by path)
        const ledgerTxs = await db.collection('medici_transactions').find({
          account: ledger.path || ledger.name
        }).sort({timestamp: -1}).limit(5).toArray();
        
        console.log(`\n💰 Transactions for ledger "${ledger.name}":`);
        if (ledgerTxs.length === 0) {
          console.log('❌ No transactions found for this ledger!');
        } else {
          ledgerTxs.forEach(tx => {
            console.log(`- ${tx.timestamp}: ${tx.debit || 0} DR / ${tx.credit || 0} CR`);
            console.log(`  Memo: ${tx.memo}, Voucher: ${tx.voucherNumber}`);
          });
        }
        
        // Also check by name if path didn't work
        if (ledgerTxs.length === 0) {
          const ledgerTxsByName = await db.collection('medici_transactions').find({
            account: ledger.name
          }).sort({timestamp: -1}).limit(5).toArray();
          
          console.log(`\n💰 Transactions for ledger name "${ledger.name}":`);
          if (ledgerTxsByName.length === 0) {
            console.log('❌ No transactions found by name either!');
          } else {
            ledgerTxsByName.forEach(tx => {
              console.log(`- ${tx.timestamp}: ${tx.debit || 0} DR / ${tx.credit || 0} CR`);
              console.log(`  Memo: ${tx.memo}, Voucher: ${tx.voucherNumber}`);
            });
          }
        }
      } else {
        console.log(`❌ Ledger ${ledgerId} not found!`);
      }
    } catch (err) {
      console.error('Error checking ledger:', err.message);
    }
    
    // Check all collections to see what exists
    console.log('\n📊 Database Collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check if medici is properly set up
    console.log('\n🔧 Medici Setup Check:');
    const mediCiJournalsCount = await db.collection('medici_journals').countDocuments();
    const mediciTransactionsCount = await db.collection('medici_transactions').countDocuments();
    console.log(`- medici_journals: ${mediCiJournalsCount} documents`);
    console.log(`- medici_transactions: ${mediciTransactionsCount} documents`);
    
  } catch (error) {
    console.error('❌ Error debugging transactions:', error);
  } finally {
    await client.close();
  }
}

debugPurchaseTransactions();