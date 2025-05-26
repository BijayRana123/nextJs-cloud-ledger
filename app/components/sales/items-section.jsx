'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCookie } from '@/lib/utils';

// Custom table components
export function CustomTable({ children, className }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className || ''}`}>
        {children}
      </table>
    </div>
  );
}

export function CustomTableHeader({ children, className }) {
  return <thead className={`[&_tr]:border-b ${className || ''}`}>{children}</thead>;
}

export function CustomTableBody({ children, className }) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`}>{children}</tbody>;
}

export function CustomTableRow({ children, className }) {
  // Ensure children is an array and filter out any text nodes that are just whitespace
  const filteredChildren = React.Children.toArray(children).filter(child => 
    typeof child !== 'string' || child.trim() !== ''
  );
  
  return (<tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ''}`}>{filteredChildren}</tr>);
}

export function CustomTableHead({ children, className }) {
  return (
    <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className || ''}`}>
      {children}
    </th>
  );
}

export function CustomTableCell({ children, className }) {
  return (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`}>
      {children || ''}
    </td>
  );
}

const ItemsSection = ({ formData, setFormData, updateTotals }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [itemDetails, setItemDetails] = useState({
    quantity: 1,
    price: 0,
    discount: 0,
    tax: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all items when the component mounts
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      // Retrieve the JWT from the cookie
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      
      // Make the API call with the authentication token
      const response = await fetch('/api/organization/items', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Fetched items:", result.items);
        
        // Format items for the combobox
        const formattedOptions = result.items.map(item => ({
          value: item._id,
          label: item.name,
          itemData: item
        }));
        
        setOptions(formattedOptions);
      } else {
        console.error("Failed to fetch items:", response.status);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;

    const selectedOption = options.find(option => option.value === selectedItemId);
    if (!selectedOption) return;

    const newItem = {
      item: selectedId,
      itemName: selectedOption.label,
      quantity: parseFloat(itemDetails.quantity) || 1,
      price: parseFloat(itemDetails.price) || 0,
      discount: parseFloat(itemDetails.discount) || 0,
      tax: parseFloat(itemDetails.tax) || 0,
    };

    // Calculate the amount
    newItem.amount = (newItem.quantity * newItem.price) - newItem.discount;

    // Add the new item to the formData
    const updatedItems = [...(formData.items || []), newItem];
    setFormData({ ...formData, items: updatedItems });

    // Reset the form
    setSelectedItemId(null);
    setItemDetails({
      quantity: 1,
      price: 0,
      discount: 0,
      tax: 0,
    });

    // Update totals
    if (updateTotals) {
      updateTotals(updatedItems);
    }
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });

    // Update totals
    if (updateTotals) {
      updateTotals(updatedItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    // Recalculate amount
    if (field === 'quantity' || field === 'price' || field === 'discount') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const price = parseFloat(updatedItems[index].price) || 0;
      const discount = parseFloat(updatedItems[index].discount) || 0;
      updatedItems[index].amount = (quantity * price) - discount;
    }

    setFormData({ ...formData, items: updatedItems });

    // Update totals
    if (updateTotals) {
      updateTotals(updatedItems);
    }
  };

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter(option => 
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  // Limit displayed options to maximum 4
  const displayedOptions = React.useMemo(() => {
    return filteredOptions.slice(0, 4);
  }, [filteredOptions]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="md:col-span-2">
            <Label htmlFor="itemName">Item</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedItemId ? 
                    options.find(option => option.value === selectedItemId)?.label : 
                    "Select item..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search item..." 
                    value={inputValue}
                    onValueChange={setInputValue}
                  />
                  {displayedOptions.length === 0 && inputValue !== "" ? (
                    <CommandEmpty>No item found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {displayedOptions.map((option) => (
                        <CommandItem
                          key={option.value || Math.random().toString()}
                          value={option.value}
                          onSelect={() => {
                            setSelectedItemId(option.value);
                            setOpen(false);
                            setInputValue('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedItemId === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={itemDetails.quantity}
              onChange={(e) => setItemDetails({ ...itemDetails, quantity: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={itemDetails.price}
              onChange={(e) => setItemDetails({ ...itemDetails, price: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="discount">Discount</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              value={itemDetails.discount}
              onChange={(e) => setItemDetails({ ...itemDetails, discount: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Button onClick={handleAddItem} disabled={!selectedItemId}>
            Add Item
          </Button>
        </div>

        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow>
              <CustomTableHead>Item</CustomTableHead>
              <CustomTableHead>Quantity</CustomTableHead>
              <CustomTableHead>Price</CustomTableHead>
              <CustomTableHead>Discount</CustomTableHead>
              <CustomTableHead>Amount</CustomTableHead>
              <CustomTableHead>Actions</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {formData.items && formData.items.length > 0 ? (
              formData.items.map((item, index) => (
                <CustomTableRow key={index}>
                  <CustomTableCell>{item.itemName}</CustomTableCell>
                  <CustomTableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-20"
                    />
                  </CustomTableCell>
                  <CustomTableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="w-24"
                    />
                  </CustomTableCell>
                  <CustomTableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      className="w-24"
                    />
                  </CustomTableCell>
                  <CustomTableCell>{Number(item.amount || 0).toFixed(2)}</CustomTableCell>
                  <CustomTableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CustomTableCell>
                </CustomTableRow>
              ))
            ) : (
              <CustomTableRow>
                <CustomTableCell colSpan="6" className="text-center py-4">
                  No items added yet
                </CustomTableCell>
              </CustomTableRow>
            )}
          </CustomTableBody>
        </CustomTable>
      </CardContent>
    </Card>
  );
};

export default ItemsSection;