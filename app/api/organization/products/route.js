import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Item, User, StockEntry, Warehouse } from '@/lib/models'; // Import Item, User, StockEntry, and Warehouse models
import { protect } from '@/lib/middleware/auth'; // Import protect middleware

export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // Get the organization ID from the request object (set by the auth middleware)
    const organizationId = request.organizationId;

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const products = await Item.find({ organization: organizationId })
      .select('_id name code type category categoryLabel tax primaryUnit primaryUnitLabel defaultQty defaultRate defaultDiscount defaultTax availableForSale openingStock')
      .lean();

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // User is authenticated, get the user ID from the modified request object
    const userId = request.user._id;

    // Find the user to get their organization ID
    const user = await User.findById(userId).populate('organizations');
    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ message: 'User or organization not found' }, { status: 404 });
    }

    // Try to get organizationId from x-organization-id header
    let organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      // Fallback to user's first organization
      organizationId = user.organizations[0]._id;
    }

    const newProductData = await request.json();

    // Check if a product with the same name already exists in this organization
    const existingProduct = await Item.findOne({ 
      name: newProductData.name, 
      organization: organizationId 
    });
    
    if (existingProduct) {
      return NextResponse.json({ 
        message: "A product with this name already exists in your organization" 
      }, { status: 409 });
    }

    const productToSave = new Item({
      ...newProductData,
      organization: organizationId, // Associate product with organization
      // Ensure default values are set if not provided in the request
      defaultQty: newProductData.defaultQty !== undefined ? newProductData.defaultQty : 1,
      defaultRate: newProductData.defaultRate !== undefined ? newProductData.defaultRate : 0,
      defaultDiscount: newProductData.defaultDiscount !== undefined ? newProductData.defaultDiscount : 0,
      defaultTax: newProductData.defaultTax !== undefined ? newProductData.defaultTax : 0,
      availableForSale: newProductData.availableForSale !== undefined ? newProductData.availableForSale : true,
      openingStock: newProductData.openingStock !== undefined ? Number(newProductData.openingStock) : 0,
    });

    const savedProduct = await productToSave.save();



    // --- Create item ledger under Inventory ---
    const { Ledger, LedgerGroup } = await import('@/lib/models');
    // Find or create the Inventory group for this organization
    let inventoryGroup = await LedgerGroup.findOne({ name: /inventory/i, organization: organizationId });
    if (!inventoryGroup) {
      // Generate a code for the new LedgerGroup
      const existingGroupCodes = await LedgerGroup.find({ 
        organization: organizationId, 
        code: { $exists: true, $ne: null } 
      }).select('code').lean();
      
      const usedCodes = existingGroupCodes.map(g => parseInt(g.code)).filter(code => !isNaN(code));
      let newGroupCode = 1000;
      while (usedCodes.includes(newGroupCode)) {
        newGroupCode += 100;
      }
      
      inventoryGroup = await LedgerGroup.create({ 
        name: 'Inventory', 
        code: newGroupCode.toString(),
        organization: organizationId 
      });
    }
    // Ledger path: Assets:Inventory:Item Name
    const ledgerPath = `Assets:Inventory:${savedProduct.name}`;
    // Check for existing ledger by name/org
    let existingLedger = await Ledger.findOne({ name: savedProduct.name, organization: organizationId });
    if (!existingLedger) {
      // Generate ledger code based on group code
      const baseCode = parseInt(inventoryGroup.code);
      const existingLedgers = await Ledger.find({ 
        group: inventoryGroup._id, 
        organization: organizationId,
        code: { $exists: true, $ne: null }
      }).select('code').lean();
      
      const usedLedgerCodes = existingLedgers.map(l => parseInt(l.code)).filter(code => !isNaN(code));
      let newLedgerCode = baseCode + 1;
      while (usedLedgerCodes.includes(newLedgerCode)) {
        newLedgerCode++;
      }

      await Ledger.create({
        name: savedProduct.name,
        code: newLedgerCode.toString(),
        group: inventoryGroup._id,
        organization: organizationId,
        path: ledgerPath,
        description: `Item: ${savedProduct.name}`
      });
    }
    // --- End item ledger creation ---

    // --- Handle opening stock for Goods ---
    // Note: We no longer create separate stock entries for opening stock
    // The opening stock is stored directly in the item.openingStock field
    // and is used as the starting point for stock calculations
    if (savedProduct.type === 'Goods' && savedProduct.openingStock > 0) {

    }
    // --- End opening stock handling ---

    return NextResponse.json({ message: "Product created successfully", product: savedProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 });
  }
}

// You can add other HTTP methods (PUT, DELETE) here if needed
