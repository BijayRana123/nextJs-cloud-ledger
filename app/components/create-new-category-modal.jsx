"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox"; // Assuming Combobox is used for "Under Category"

export default function CreateNewCategoryModal({ isOpen, onClose, onCategoryCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    underCategory: '', // Stores parent category ID or value
    description: '',
  });

  // State for parent category options
  const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch parent categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchParentCategories();
    }
  }, [isOpen]);

  // Function to fetch parent categories from API
  const fetchParentCategories = async () => {
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
        setParentCategoryOptions(formattedCategories);
      } else {
        console.error("Failed to fetch parent categories");
      }
    } catch (error) {
      console.error("Error fetching parent categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Submit form to create new category
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/organization/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newCategory = {
          value: data.category._id,
          label: data.category.name,
        };
        
        // Call the onCategoryCreated prop with the new category data
        if (onCategoryCreated) {
          onCategoryCreated(newCategory);
        }
        
        // Close the modal
        onClose();
      } else {
        console.error("Failed to create category");
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error creating category:", error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form data when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        underCategory: '',
        description: '',
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            </div>

            {/* Under Category */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="underCategory">Under Category</Label>
               <Combobox
                 className="w-full"
                 options={parentCategoryOptions}
                 value={formData.underCategory}
                 onValueChange={(value) => handleSelectChange('underCategory', value)}
                 placeholder="Select Parent Category"
                 // No onAddNew here as per image
               />
            </div>

            {/* Description */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Description" value={formData.description} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-green-500 hover:bg-green-600" disabled={isLoading}>Save</Button>
             <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
