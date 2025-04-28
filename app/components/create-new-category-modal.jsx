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

  // State for combobox options (mock data for "Under Category")
  const [parentCategoryOptions, setParentCategoryOptions] = useState([
    { value: 'parent_cat_1', label: 'Root Category 1' },
    { value: 'parent_cat_2', label: 'Root Category 2' },
  ]);

  // TODO: Add state and effects to fetch real parent category options from APIs

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to create new category
    console.log("Submitting New Category:", formData);

    // Mock category data to return
    const newMockCategory = {
      value: `cat_${Date.now()}`,
      label: formData.name, // Using name as label for now
      // Add other relevant category details based on formData
    };

    // Call the onCategoryCreated prop with the new category data
    if (onCategoryCreated) {
      onCategoryCreated(newMockCategory);
    }

    // Close the modal
    onClose();
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
            <Button type="submit" className="bg-green-500 hover:bg-green-600">Save</Button>
             <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
