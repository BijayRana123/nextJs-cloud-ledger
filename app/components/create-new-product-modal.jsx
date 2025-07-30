"use client";

import { useState, useEffect } from 'react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Combobox } from "../../components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card"; // Using Card for structure within modal
import { XIcon } from "lucide-react"; // Close icon
import CreateNewCategoryModal from "@/components/create-new-category-modal"; // Import new category modal
import CreateNewPrimaryUnitModal from "@/components/create-new-primary-unit-modal"; // Import new primary unit modal
import { useOrganization } from '@/lib/context/OrganizationContext';


export default function CreateNewProductModal({ isOpen, onClose, onProductCreated }) {
  const { currentOrganization } = useOrganization();
  const [formData, setFormData] = useState({
    type: 'Goods', // Default to Goods
    name: '',
    code: '',
    category: '', // Stores category ID or value
    tax: 'No Vat', // Default tax
    primaryUnit: '', // Stores primary unit ID or value
    availableForSale: true, // Default to true
    openingStock: 0, // Opening stock quantity
  });

  // Default categories and units
  const defaultCategories = [
    { value: 'general', label: 'General' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'food-beverages', label: 'Food & Beverages' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'raw-materials', label: 'Raw Materials' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'books-media', label: 'Books & Media' },
    { value: 'health-beauty', label: 'Health & Beauty' },
    { value: 'sports-outdoors', label: 'Sports & Outdoors' },
    { value: 'toys-games', label: 'Toys & Games' }
  ];

  const defaultUnits = [
    { value: 'piece', label: 'Piece (Pcs)' },
    { value: 'kilogram', label: 'Kilogram (Kg)' },
    { value: 'gram', label: 'Gram (g)' },
    { value: 'liter', label: 'Liter (L)' },
    { value: 'milliliter', label: 'Milliliter (mL)' },
    { value: 'meter', label: 'Meter (m)' },
    { value: 'centimeter', label: 'Centimeter (cm)' },
    { value: 'box', label: 'Box' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'set', label: 'Set' },
    { value: 'pair', label: 'Pair' },
    { value: 'pack', label: 'Pack' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'can', label: 'Can' },
    { value: 'bag', label: 'Bag' },
    { value: 'roll', label: 'Roll' },
    { value: 'sheet', label: 'Sheet' },
    { value: 'pound', label: 'Pound (lb)' },
    { value: 'ounce', label: 'Ounce (oz)' },
    { value: 'gallon', label: 'Gallon' },
    { value: 'quart', label: 'Quart' },
    { value: 'pint', label: 'Pint' },
    { value: 'cup', label: 'Cup' },
    { value: 'tablespoon', label: 'Tablespoon' },
    { value: 'teaspoon', label: 'Teaspoon' }
  ];

  // State for combobox options
  const [categoryOptions, setCategoryOptions] = useState(defaultCategories);
  const [primaryUnitOptions, setPrimaryUnitOptions] = useState(defaultUnits);
  const [isLoading, setIsLoading] = useState(false);

  // State to control visibility of nested modals
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewPrimaryUnitModalOpen, setIsNewPrimaryUnitModalOpen] = useState(false);

  // No need to fetch from API since we're using default options
  // useEffect(() => {
  //   if (isOpen) {
  //     fetchCategories();
  //     fetchUnits();
  //   }
  // }, [isOpen]);

  // These functions are commented out since we're using default options
  // Later these can be uncommented and modified to save custom categories/units to database
  
  // const fetchCategories = async () => { ... };
  // const fetchUnits = async () => { ... };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handlers for opening nested modals
  const handleOpenNewCategoryModal = () => setIsNewCategoryModalOpen(true);
  const handleOpenNewPrimaryUnitModal = () => setIsNewPrimaryUnitModalOpen(true);

  // Handlers for when a new category or unit is created in their respective modals
  const handleCategoryCreated = (newCategory) => {
    setCategoryOptions((prev) => [...prev, newCategory]);
    setFormData((prev) => ({ ...prev, category: newCategory.value })); // Select the new category
    setIsNewCategoryModalOpen(false); // Close the modal
  };

  const handlePrimaryUnitCreated = (newUnit) => {
    setPrimaryUnitOptions((prev) => [...prev, newUnit]);
    setFormData((prev) => ({ ...prev, primaryUnit: newUnit.value })); // Select the new unit
    setIsNewPrimaryUnitModalOpen(false); // Close the modal
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    
    // Implement API call to create new product


    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (currentOrganization && currentOrganization._id) {
        headers['x-organization-id'] = currentOrganization._id;
      }
      
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        category: formData.category || null,
        primaryUnit: formData.primaryUnit || null,
        openingStock: Number(formData.openingStock) || 0,
        // Add the display labels for category and unit for better readability
        categoryLabel: formData.category ? defaultCategories.find(c => c.value === formData.category)?.label : null,
        primaryUnitLabel: formData.primaryUnit ? defaultUnits.find(u => u.value === formData.primaryUnit)?.label : null
      };
      
      const response = await fetch('/api/organization/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {

        // Call the onProductCreated prop with the new product data from the API
        if (onProductCreated) {
          onProductCreated(result.product);
        }
         onClose(); // Close the modal on success
      } else {
        console.error("Error creating product:", result.message);
        alert(`Error creating product: ${result.message}`);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert(`Error creating product: ${error.message}`);
    }
  };

  // Reset form data when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: 'Goods',
        name: '',
        code: '',
        category: '',
        tax: 'No Vat',
        primaryUnit: '',
        availableForSale: true,
        openingStock: 0,
      });
    }
  }, [isOpen]);


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Product/Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Type of Product */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="type">Type of Product *</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={formData.type === 'Goods' ? 'default' : 'outline'}
                    onClick={() => handleSelectChange('type', 'Goods')}
                  >
                    Goods
                  </Button>
                  <Button
                     type="button"
                    variant={formData.type === 'Services' ? 'default' : 'outline'}
                    onClick={() => handleSelectChange('type', 'Services')}
                  >
                    Services
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
              </div>

              {/* Code */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="Code" value={formData.code} onChange={handleInputChange} />
              </div>

              {/* Category */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="category">Category</Label>
                 <Combobox
                  className="w-full"
                   options={categoryOptions}
                   value={formData.category}
                   onValueChange={(value) => handleSelectChange('category', value)}
                   placeholder="Select Category (Optional)"
                   onAddNew={handleOpenNewCategoryModal} // Open new category modal
                 />
              </div>

              {/* Tax */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="tax">Tax</Label>
                <Select id="tax" value={formData.tax} onValueChange={(value) => handleSelectChange('tax', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Vat">No Vat</SelectItem>
                    {/* Add other tax options as needed */}
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Unit */}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="primaryUnit">Primary Unit</Label>
                 <Combobox
                   className="w-full"
                   options={primaryUnitOptions}
                   value={formData.primaryUnit}
                   onValueChange={(value) => handleSelectChange('primaryUnit', value)}
                   placeholder="Select Primary Unit (Optional)"
                   onAddNew={handleOpenNewPrimaryUnitModal} // Open new primary unit modal
                 />
              </div>

              {/* Opening Stock - Only show for Goods */}
              {formData.type === 'Goods' && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="openingStock">Opening Stock</Label>
                  <Input 
                    id="openingStock" 
                    type="number" 
                    placeholder="0" 
                    value={formData.openingStock} 
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-gray-500">Initial quantity in stock</p>
                </div>
              )}

              {/* Available For Sale Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="availableForSale"
                  checked={formData.availableForSale}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" // Basic styling
                />
                <Label htmlFor="availableForSale">Available For Sale</Label>
              </div>

            </div>
            <DialogFooter>
              <Button type="submit" className="bg-green-500 hover:bg-green-600">Save</Button>
               <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nested Modals */}
      <CreateNewCategoryModal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />

      <CreateNewPrimaryUnitModal
        isOpen={isNewPrimaryUnitModalOpen}
        onClose={() => setIsNewPrimaryUnitModalOpen(false)}
        onUnitCreated={handlePrimaryUnitCreated}
      />
    </>
  );
}
