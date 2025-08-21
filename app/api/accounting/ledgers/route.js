import dbConnect from '@/lib/dbConnect';
import { Ledger, LedgerGroup, Customer } from '@/lib/models';
import AccountingTransaction from '@/lib/models/AccountingTransaction';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Item, StockEntry } from '@/lib/models';

export async function GET(request) {
  try {
    await dbConnect();
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');
    const filter = { organization: orgId };
    if (group) filter.group = group;
    
    // Get all ledgers (including inventory for depreciation and other journal entries)
    const allLedgers = await Ledger.find(filter).populate('group').lean();
    
    // Include all ledgers (including inventory for depreciation and other journal entries)
    const ledgers = allLedgers;

    // Helper to build the full account path for a ledger
    function buildLedgerPath(ledger, groups) {
      let pathParts = [];
      let currentGroup = groups.find(g => g._id.toString() === (ledger.group?._id?.toString() || ledger.group?.toString()));
      while (currentGroup) {
        pathParts.unshift(currentGroup.name);
        currentGroup = groups.find(g => g._id.toString() === (currentGroup.parent ? currentGroup.parent.toString() : null));
      }
      pathParts.push(ledger.name);
      
      // Ensure the path starts with the proper root category
      const fullPath = pathParts.join(":");
      
      // Add proper prefixes based on the group type
      if (fullPath.startsWith("Accounts Receivable:") || fullPath.startsWith("Accounts Payable:")) {
        if (fullPath.startsWith("Accounts Receivable:")) {
          return "Assets:" + fullPath;
        } else {
          return "Liabilities:" + fullPath;
        }
      }
      
      return fullPath;
    }

    // Fetch all groups for path construction
    const allGroups = await LedgerGroup.find({ organization: orgId }).lean();

    // Debug: Check what account paths exist in transactions
    const MediciTransaction = mongoose.models.MediciTransaction || mongoose.model('MediciTransaction', new mongoose.Schema({
      accounts: String,
      debit: Boolean,
      credit: Boolean,
      amount: Number,
      organizationId: mongoose.Schema.Types.ObjectId
    }, { collection: 'medici_transactions' }));
    
    // Debug: Check for customer-specific transactions (only show first time)
    const customerTransactions = await MediciTransaction.find({ 
      organizationId: orgId, 
      accounts: { $regex: /Assets:Accounts Receivable:/ } 
    }).limit(3);
    if (customerTransactions.length > 0) {

    }

    console.log(`Processing ${ledgers.length} ledgers for organization ${orgId}`);
    
    // Compute balances for each ledger
    const ledgersWithBalances = await Promise.all(ledgers.map(async (ledger) => {
    const accountPath = ledger.path || buildLedgerPath(ledger, allGroups);
    let balance = 0;
    let availableStock = null;
    let itemName = null;
    // If this is an inventory ledger, try to find the item and its stock
    if (ledger.group && ledger.group.name && ledger.group.name.toLowerCase().includes('inventory')) {
      // Try to extract item name from description if possible
      if (ledger.description && ledger.description.startsWith('Item:')) {
        itemName = ledger.description.replace('Item:', '').trim();
        // Find the item by name
        const itemDoc = await Item.findOne({ name: itemName, organization: orgId });
        if (itemDoc) {
          // Sum all stock entries for this item
          const stockEntries = await StockEntry.find({ item: itemDoc._id, organization: orgId });
          availableStock = stockEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        }
      }
    }
    // Compute balance using medici_transactions collection with flexible path matching
    let transactions = await MediciTransaction.find({
      $or: [
        { accounts: accountPath },
        { accounts: ledger.name }, // Try just the ledger name
        // For Cash accounts, try common variations
        ...(ledger.name.toLowerCase() === 'cash' ? [
          { accounts: 'Assets:Cash' },
          { accounts: 'Cash' },
          { accounts: 'Assets:Cash-in-Hand:Cash' }
        ] : []),
        // For other accounts, try with standardized paths
        { accounts: `Assets:${ledger.name}` },
        { accounts: `Liabilities:${ledger.name}` },
        { accounts: `Equity:${ledger.name}` },
        { accounts: `Income:${ledger.name}` },
        { accounts: `Expenses:${ledger.name}` }
      ],
      organizationId: orgId
    });
    
    // For customer ledgers, also try to find transactions using customer ID and case variations
    if (accountPath.includes("Assets:Accounts Receivable:") && transactions.length === 0) {
      const customerName = accountPath.split(":").pop(); // Get the last part (customer name)
      
      // Try to find the customer by name (case-insensitive)
      const customerDoc = await Customer.findOne({ 
        name: { $regex: new RegExp(`^${customerName}$`, 'i') }, 
        organization: orgId 
      });
      
      if (customerDoc) {
        // Try customer ID path
        const customerIdPath = `Assets:Accounts Receivable:${customerDoc._id}`;
        const customerIdTransactions = await MediciTransaction.find({
          accounts: customerIdPath,
          organizationId: orgId
        });
        if (customerIdTransactions.length > 0) {
          transactions = customerIdTransactions;
        }
      }
      
      // If still no transactions, try case variations of the customer name
      if (transactions.length === 0) {
        const nameVariations = [
          customerName, // original
          customerName.toLowerCase(), // lowercase
          customerName.charAt(0).toUpperCase() + customerName.slice(1).toLowerCase(), // Title case
          customerName.toUpperCase() // uppercase
        ];
        
        for (const nameVariation of nameVariations) {
          const variationPath = `Assets:Accounts Receivable:${nameVariation}`;
          const variationTransactions = await MediciTransaction.find({
            accounts: variationPath,
            organizationId: orgId
          });
          if (variationTransactions.length > 0) {
            transactions = variationTransactions;
            break;
          }
        }
      }
    }
    
    // For supplier ledgers, also try to find transactions using supplier ID and case variations
    if (accountPath.includes("Liabilities:Accounts Payable:") && transactions.length === 0) {
      const supplierName = accountPath.split(":").pop(); // Get the last part (supplier name)
      
      // Try to find the supplier by name (case-insensitive)
      const Supplier = mongoose.models.Supplier || mongoose.model('Supplier');
      const supplierDoc = await Supplier.findOne({ 
        name: { $regex: new RegExp(`^${supplierName}$`, 'i') }, 
        organization: orgId 
      });
      
      if (supplierDoc) {
        // Try supplier ID path
        const supplierIdPath = `Liabilities:Accounts Payable:${supplierDoc._id}`;
        const supplierIdTransactions = await MediciTransaction.find({
          accounts: supplierIdPath,
          organizationId: orgId
        });
        if (supplierIdTransactions.length > 0) {
          transactions = supplierIdTransactions;
        }
      }
      
      // If still no transactions, try case variations of the supplier name
      if (transactions.length === 0) {
        const nameVariations = [
          supplierName, // original
          supplierName.toLowerCase(), // lowercase
          supplierName.charAt(0).toUpperCase() + supplierName.slice(1).toLowerCase(), // Title case
          supplierName.toUpperCase() // uppercase
        ];
        
        for (const nameVariation of nameVariations) {
          const variationPath = `Liabilities:Accounts Payable:${nameVariation}`;
          const variationTransactions = await MediciTransaction.find({
            accounts: variationPath,
            organizationId: orgId
          });
          if (variationTransactions.length > 0) {
            transactions = variationTransactions;
            break;
          }
        }
      }
    }
    
    for (const txn of transactions) {
      if (txn.debit) {
        balance += txn.amount;
      } else if (txn.credit) {
        balance -= txn.amount;
      }
    }
    
    // Debug for specific ledgers that should have balances
    if (balance !== 0 || ledger.name.toLowerCase() === 'cash' || ledger.name === 'barsha' || ledger.name === 'prashant' || ledger.name === 'Sales Revenue') {
      console.log(`Ledger: ${ledger.name}, Path: ${accountPath}, Balance: ${balance}, Transactions: ${transactions.length}`);
      if (transactions.length > 0) {
        console.log('Sample transactions:', transactions.slice(0, 2).map(t => ({ accounts: t.accounts, amount: t.amount, debit: t.debit, credit: t.credit })));
      }
    }
    return { ...ledger, path: accountPath, balance, availableStock, itemName };
  }));

    return NextResponse.json({ ledgers: ledgersWithBalances });
  } catch (error) {
    console.error('Error in ledgers GET:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const { name, group, description, openingBalance } = await request.json();
  if (!name || !group) return NextResponse.json({ error: 'Name and group required' }, { status: 400 });
  
  try {
    // Check if ledger with this name already exists for this organization
    const existingLedger = await Ledger.findOne({ name, organization: orgId });
    if (existingLedger) {
      return NextResponse.json({ error: 'Ledger with this name already exists' }, { status: 409 });
    }
    // Generate code for the new ledger
    const groupDoc = await LedgerGroup.findById(group);
    if (!groupDoc) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }
    
    // Ensure the group has a code
    let groupCode = groupDoc.code;
    if (!groupCode) {
      // If group doesn't have a code, generate one
      const existingGroupCodes = await LedgerGroup.find({ 
        organization: orgId, 
        code: { $exists: true, $ne: null } 
      }).select('code').lean();
      
      const usedCodes = existingGroupCodes.map(g => parseInt(g.code)).filter(code => !isNaN(code));
      let newGroupCode = 1000;
      while (usedCodes.includes(newGroupCode)) {
        newGroupCode += 100;
      }
      
      groupCode = newGroupCode.toString();
      await LedgerGroup.findByIdAndUpdate(group, { code: groupCode });
    }
    
    // Generate ledger code based on group code
    const baseCode = parseInt(groupCode);
    const existingLedgers = await Ledger.find({ 
      group: group, 
      organization: orgId,
      code: { $exists: true, $ne: null }
    }).select('code').lean();
    
    const usedLedgerCodes = existingLedgers.map(l => parseInt(l.code)).filter(code => !isNaN(code));
    let newLedgerCode = baseCode + 1;
    while (usedLedgerCodes.includes(newLedgerCode)) {
      newLedgerCode++;
    }
    
    const ledger = await Ledger.create({
      name,
      group,
      description,
      openingBalance: openingBalance || 0,
      organization: orgId,
      code: newLedgerCode.toString(),
    });

    // Fetch all groups to build the path
    const allGroups = await LedgerGroup.find({ organization: orgId }).lean();
    function buildLedgerPath(ledger, groups) {
      let pathParts = [];
      let currentGroup = groups.find(g => g._id.toString() === (ledger.group?.toString()));
      while (currentGroup) {
        pathParts.unshift(currentGroup.name);
        currentGroup = groups.find(g => g._id.toString() === (currentGroup.parent ? currentGroup.parent.toString() : null));
      }
      pathParts.push(ledger.name);
      return pathParts.join(":");
    }
    const accountPath = ledger.path || buildLedgerPath(ledger, allGroups);

    // Only create a transaction if openingBalance is nonzero
    if (openingBalance && openingBalance !== 0) {
      // Determine if this is an asset/receivable or liability/payable
      // Fetch the group to check its name/type
      const groupDoc = allGroups.find(g => g._id.toString() === group.toString());
      let isAssetOrReceivable = false;
      let isLiabilityOrPayable = false;
      if (groupDoc) {
        const groupName = groupDoc.name.toLowerCase();
        if (groupName.includes('asset') || groupName.includes('receivable')) isAssetOrReceivable = true;
        if (groupName.includes('liability') || groupName.includes('payable')) isLiabilityOrPayable = true;
      }
      // Fallback: asset/receivable = debit, liability/payable = credit
      const debit = !!isAssetOrReceivable;
      const credit = !!isLiabilityOrPayable;
      // If neither, default to debit
      const txnDebit = debit || (!debit && !credit);
      const txnCredit = credit;
      // Create a minimal journal if required
      let journalId = undefined;
      try {
        const Journal = mongoose.models.AccountingJournal || mongoose.model('AccountingJournal', new mongoose.Schema({ datetime: Date, memo: String, organization: mongoose.Schema.Types.ObjectId }, { strict: false }));
        const journal = await Journal.create({ datetime: new Date(), memo: 'Opening Balance', organization: orgId });
        journalId = journal._id;
      } catch (e) {
        // If journal creation fails, allow null
      }
      await AccountingTransaction.create({
        journal: journalId,
        datetime: new Date(),
        account_path: accountPath,
        debit: txnDebit,
        credit: txnCredit,
        amount: openingBalance,
        organization: orgId,
        meta: { openingBalance: true }
      });
    }

    return NextResponse.json({ ledger });
  } catch (e) {
    console.error('Error creating ledger:', e);
    
    // Handle duplicate key error specifically
    if (e.code === 11000) {
      if (e.message.includes('name_1_organization_1')) {
        return NextResponse.json({ 
          error: `A ledger with the name "${name}" already exists in this organization. Please choose a different name.` 
        }, { status: 400 });
      }
      if (e.message.includes('code_1_organization_1')) {
        return NextResponse.json({ 
          error: 'A ledger with this code already exists. Please try again.' 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
} 
