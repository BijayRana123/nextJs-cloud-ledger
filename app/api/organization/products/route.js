import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Item, User } from '@/lib/models'; // Import Item and User models
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

    const products = await Item.find({ organization: organizationId });

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

    // Assuming the user is associated with one organization for products
    const organizationId = user.organizations[0]._id;

    const newProductData = await request.json();

    const productToSave = new Item({
      ...newProductData,
      organization: organizationId, // Associate product with organization
      // Ensure default values are set if not provided in the request
      defaultQty: newProductData.defaultQty !== undefined ? newProductData.defaultQty : 1,
      defaultRate: newProductData.defaultRate !== undefined ? newProductData.defaultRate : 0,
      defaultDiscount: newProductData.defaultDiscount !== undefined ? newProductData.defaultDiscount : 0,
      defaultTax: newProductData.defaultTax !== undefined ? newProductData.defaultTax : 0,
      availableForSale: newProductData.availableForSale !== undefined ? newProductData.availableForSale : true,
    });

    const savedProduct = await productToSave.save();

    console.log("New product saved:", savedProduct);

    return NextResponse.json({ message: "Product created successfully", product: savedProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 });
  }
}

// You can add other HTTP methods (PUT, DELETE) here if needed
