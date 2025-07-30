"use client";

import { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation'; // Import useRouter
import Cookies from 'js-cookie'; // Import Cookies library
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"; // Assuming Dialog components are available
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"; // Assuming Tabs components are available

export default function CreateNewSupplierModal({ isOpen, onClose, onSupplierCreated }) { // Added onSupplierCreated prop
  const router = useRouter(); // Call useRouter at the top level

  const [formData, setFormData] = useState({
    contactType: 'Supplier', // Default to Supplier based on the image
    name: '',
    address: '',
    code: '',
    pan: '',
    phoneNumber: '',
    group: '',
  });

  // Generate code when the modal opens
  useEffect(() => {
    if (isOpen) {
      // TODO: Implement actual code generation logic
      const generatedCode = `SUP${Math.floor(Math.random() * 10000)}`;
      setFormData((prev) => ({
        ...prev,
        code: generatedCode,
      }));
    }
  }, [isOpen]); // Run effect when modal opens

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

  const handleContactTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      contactType: value,
    }));
  };

  const handleSubmit = async (e) => { // Added async keyword
    e.preventDefault();
    e.preventDefault();
    
    // TODO: Add client-side validation before submitting

    // Send data to the backend API
    try {
      // Retrieve the JWT from the cookie
      const authToken = Cookies.get('sb-mnvxxmmrlvjgpnhditxc-auth-token'); // Assuming the token is stored in this cookie

      if (!authToken) {
        console.error("CreateNewSupplierModal: Authentication token not found in cookie."); // Keep console error for debugging
        // Redirect to login page if token is missing
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/organization/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, // Include the JWT in the Authorization header
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Supplier created successfully

        // Call the callback function with the new supplier data
        if (onSupplierCreated) {
          onSupplierCreated(result.supplier); // Pass the entire supplier object
        }
        onClose(); // Close modal on success
      } else {
        // Handle API errors
        console.error("Error saving supplier:", result.message);
        // TODO: Display error message to the user
        alert(`Error saving supplier: ${result.message}`); // Basic alert for now
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // TODO: Handle network errors
      alert("An unexpected error occurred."); // Basic alert for now
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Supplier Name</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-1.5">
            <Label>Type of Contact *</Label>
            <Tabs value={formData.contactType} onValueChange={handleContactTypeChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="Customer">Customer</TabsTrigger>
                <TabsTrigger value="Supplier">Supplier</TabsTrigger>
                <TabsTrigger value="Lead">Lead</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Address" value={formData.address} onChange={handleInputChange} />
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col space-y-1.5">
                <Label htmlFor="code">Code</Label>
                {/* Set Input to readOnly and use generated code */}
                <Input id="code" placeholder="Code" value={formData.code} readOnly />
             </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="pan">PAN</Label>
                <Input id="pan" placeholder="PAN" value={formData.pan} onChange={handleInputChange} />
             </div>
           </div>
            <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col space-y-1.5">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleInputChange} />
             </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="group">Group</Label>
                 <Select id="group" value={formData.group} onValueChange={(value) => handleSelectChange('group', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Fetch actual group options */}
                      <SelectItem value="group1">Group 1</SelectItem>
                      <SelectItem value="group2">Group 2</SelectItem>
                    </SelectContent>
                  </Select>
             </div>
           </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
