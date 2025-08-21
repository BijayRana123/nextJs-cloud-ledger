# Purchase Accounting Debug Issue

## Problem
Purchase vouchers are being created but the accounting transactions are not being recorded in the ledger.

## Debug Steps Taken

### 1. Analysis of Current State
- ✅ Purchase orders exist in database with referenceNo (PV-0001, PV-0007, etc.)
- ❌ No corresponding journal entries for purchase vouchers
- ❌ Medici transactions show `Account: undefined` 
- ❌ Specific ledger (6899d87eca6cd058c142d026) has no transactions

### 2. Database Investigation
```
📋 Recent Purchase Orders:
- PO 686bbcb0b377c24f73cf6256: PV-0001, Total: 23, Supplier: 680c86a8c5c08ea94aa286d8
- PO 686bbeccb377c24f73cf6543: PV-0007, Total: 12, Supplier: 68143a8a8d2f2018ad14a7d0

📋 Recent Journal Entries (Medici):
- Only expense and sales entries found
- NO purchase voucher entries

📋 Medici Transactions:
- Account names showing as "undefined"
- 1047 transactions exist but none for purchases
```

### 3. Root Cause Analysis

**Possible Issues:**
1. `createPurchaseEntry` function not being called
2. Function being called but failing silently 
3. Account path resolution failing (causing `undefined` accounts)
4. Medici library setup issues

### 4. Debug Logging Added

Added extensive logging to `createPurchaseEntry` function in `lib/accounting.js`:
- Function entry logging
- Supplier name resolution logging
- Account path creation logging
- Transaction commit logging

**Files Modified:**
- `lib/accounting.js` - Added debug console logs

### 5. Test Instructions

**To test the fix:**
1. Create a new purchase voucher through the UI
2. Check the server console logs for debug output
3. Look for the following log patterns:
   ```
   🔧 createPurchaseEntry called with:
   🔍 Resolving supplier name from ID:
   ✅ Supplier name resolved:
   🔍 Credit account path:
   ✅ Credit account ledger ensured
   🔍 Processing X items
   🔍 Final transaction setup:
   🔍 Committing journal entry...
   ✅ Journal entry committed with voucher number:
   ```

### 6. Expected Debug Output

If working correctly, you should see:
```
🔧 createPurchaseEntry called with:
- Purchase Order ID: [ObjectId]
- Organization ID: [ObjectId] 
- Organization Name: [Name]
- Purchase Order Items: 1
- Supplier ID: [ObjectId]

🔍 Resolving supplier name from ID: [ObjectId]
✅ Supplier name resolved: [Supplier Name]
🔍 Credit account path: Liabilities:Accounts Payable:[Supplier Name]
✅ Credit account ledger ensured
🔍 Processing 1 items
🔍 Final transaction setup:
- Total amount: [Amount]
- Raw credit account: Liabilities:Accounts Payable:[Supplier Name]
- Standardized credit account: Liabilities:Accounts Payable:[Supplier Name]
🔍 Committing journal entry...
✅ Journal entry committed with voucher number: PV-XXXX
```

### 7. Next Steps

1. **Create Purchase Voucher** - Use the frontend to create a new purchase voucher
2. **Check Logs** - Look at the server console for debug output
3. **Verify Database** - Run `scripts/debug-purchase-transactions.js` again to see if new entries appear
4. **Remove Debug Logs** - Once issue is identified and fixed

### 8. Common Issues to Check

**If no logs appear:**
- `createPurchaseEntry` is not being called from the API
- Check `app/api/organization/purchase-orders/route.js` for errors

**If logs appear but fail:**
- Supplier name resolution failure
- Medici library connection issues  
- Database connection problems
- Account path creation errors

**If logs work but no transactions:**
- Medici commit() method failing
- Transaction model issues
- Collection name mismatches

Please create a purchase voucher now and share the console output to continue debugging.