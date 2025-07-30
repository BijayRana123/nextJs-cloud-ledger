import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Category, Unit } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function POST(request) {
  await dbConnect();
  
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found.' }, { status: 400 });
    }

    // Default categories
    const defaultCategories = [
      'General',
      'Electronics',
      'Clothing',
      'Food & Beverages',
      'Office Supplies',
      'Raw Materials'
    ];

    // Default units
    const defaultUnits = [
      'Piece',
      'Kilogram',
      'Liter',
      'Meter',
      'Box',
      'Dozen',
      'Set',
      'Gram',
      'Pound'
    ];

    const createdCategories = [];
    const createdUnits = [];

    // Create categories if they don't exist
    for (const categoryName of defaultCategories) {
      const existingCategory = await Category.findOne({ 
        name: categoryName, 
        organization: organizationId 
      });
      
      if (!existingCategory) {
        const category = await Category.create({
          name: categoryName,
          organization: organizationId
        });
        createdCategories.push(category);
      }
    }

    // Create units if they don't exist
    for (const unitName of defaultUnits) {
      const existingUnit = await Unit.findOne({ 
        name: unitName, 
        organization: organizationId 
      });
      
      if (!existingUnit) {
        const unit = await Unit.create({
          name: unitName,
          organization: organizationId
        });
        createdUnits.push(unit);
      }
    }

    return NextResponse.json({
      message: 'Default categories and units created successfully',
      created: {
        categories: createdCategories.length,
        units: createdUnits.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating default categories and units:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
