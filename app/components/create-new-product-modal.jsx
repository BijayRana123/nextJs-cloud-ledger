"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card"; // Using Card for structure within modal
import { XIcon } from "lucide-react"; // Close icon
import CreateNewCategoryModal from "@/app/components/create-new-category-modal"; // Import new category modal
import CreateNewPrimaryUnitModal from "@/app/components/create-new-primary-unit-modal"; // Import new primary unit modal


export default function CreateNewProductModal({ isOpen, onClose, onProductCreated }) {
  const [formData, setFormData] = useState({
    type: 'Goods', // Default to Goods
    name: '',
    code: '',
    category: '', // Stores category ID or value
    tax: 'No Vat', // Default tax
    primaryUnit: '', // Stores primary unit ID or value
    availableForSale: true, // Default to true
  });

  // State for combobox options
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [primaryUnitOptions, setPrimaryUnitOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State to control visibility of nested modals
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewPrimaryUnitModalOpen, setIsNewPrimaryUnitModalOpen] = useState(false);

  // Fetch categories and units data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch categories
      fetchCategories();
      // Fetch units
      fetchUnits();
    }
  }, [isOpen]);

  // Function to fetch categories from API
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organization/categories');
      if (response.ok) {
        const data = await response.json();
        // Transform data to match combobox format
        const formattedCategories = data.categories.map(cat => ({
          value: cat._id,
          label: cat.name
        }));
        setCategoryOptions(formattedCategories);
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch units from API
  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organization/units');
      if (response.ok) {
        const data = await response.json();
        // Transform data to match combobox format
        const formattedUnits = data.units.map(unit => ({
          value: unit._id,
          label: unit.name
        }));
        setPrimaryUnitOptions(formattedUnits);
      } else {
        console.error("Failed to fetch units");
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    // Implement API call to create new product
    console.log("Submitting New Product:", formData);

    try {
      const response = await fetch('/api/organization/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Product created successfully:", result.product);
        // Call the onProductCreated prop with the new product data from the API
        if (onProductCreated) {
          onProductCreated(result.product);
        }
         onClose(); // Close the modal on success
      } else {
        console.error("Error creating product:", result.message);
        // TODO: Handle error display to the user
      }
    } catch (error) {
      console.error("Error creating product:", error);
      // TODO: Handle network error display to the user
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
                <Label htmlFor="category">Category *</Label>
                 <Combobox
                  className="w-full"
                   options={categoryOptions}
                   value={formData.category}
                   onValueChange={(value) => handleSelectChange('category', value)}
                   placeholder="Select Category"
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
                <Label htmlFor="primaryUnit">Primary Unit *</Label>
                 <Combobox
                   className="w-full"
                   options={primaryUnitOptions}
                   value={formData.primaryUnit}
                   onValueChange={(value) => handleSelectChange('primaryUnit', value)}
                   placeholder="Select Primary Unit"
                   onAddNew={handleOpenNewPrimaryUnitModal} // Open new primary unit modal
                 />
              </div>

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
