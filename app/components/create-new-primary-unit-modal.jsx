"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function CreateNewPrimaryUnitModal({ isOpen, onClose, onUnitCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    acceptsFraction: false,
  });

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to create new primary unit
    console.log("Submitting New Primary Unit:", formData);

    // Mock unit data to return
    const newMockUnit = {
      value: `unit_${Date.now()}`,
      label: formData.name, // Using name as label for now
      // Add other relevant unit details based on formData
    };

    // Call the onUnitCreated prop with the new unit data
    if (onUnitCreated) {
      onUnitCreated(newMockUnit);
    }

    // Close the modal
    onClose();
  };

  // Reset form data when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        shortName: '',
        description: '',
        acceptsFraction: false,
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Primary Unit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            </div>

            {/* Short Name */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="shortName">Short Name *</Label>
              <Input id="shortName" placeholder="Short Name" value={formData.shortName} onChange={handleInputChange} required />
            </div>

            {/* Description */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Description" value={formData.description} onChange={handleInputChange} />
            </div>

            {/* Accepts Fraction Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="acceptsFraction"
                checked={formData.acceptsFraction}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" // Basic styling
              />
              <Label htmlFor="acceptsFraction">Accepts Fraction</Label>
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
