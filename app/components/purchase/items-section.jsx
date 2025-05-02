"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from "@/components/ui/CustomTable";
import { XIcon, PlusCircleIcon } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CreateNewProductModal from "@/app/components/create-new-product-modal"; // Import the new product modal

import ProductDetailsModal from "@/app/components/product-details-modal";

export default function ItemsSection({ formData, setFormData }) {
  // State to manage product combobox options
  const [productOptions, setProductOptions] = useState([]);
  // State to track if products are loading
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  // State to store details of the selected product for the modal
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  // State to control the product details modal visibility
  const [isProductDetailsModalOpen, setIsProductDetailsModalOpen] = useState(false);
  // State to control the new product modal visibility
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);


  // Using dynamic import with next/dynamic for client-side only rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      if (!mounted) return;

      setIsLoadingProducts(true);
      try {
        const response = await fetch('/api/organization/products'); // Assuming this endpoint exists
        const result = await response.json();

        if (response.ok) {
          const formattedOptions = result.products.map(product => ({
            value: product._id, // Or product.code, depending on how you identify products
            label: product.name,
            productData: product // Store the full product object
          }));
          setProductOptions(formattedOptions);
        } else {
          console.error("Error fetching products:", result.message);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [mounted]);

  const handleAddItem = () => {
    // Add a new empty item with structure to hold product data
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, {
        product: '', // Stores product ID
        productName: '', // Stores product name for display
        productCode: '', // Stores product code for display
        qty: '',
        rate: '',
        discount: '',
        tax: '',
        amount: ''
      }],
    }));
  };

  // Function to calculate amount (placeholder)
  const calculateAmount = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const tax = parseFloat(item.tax) || 0; // Assuming tax is a percentage

    // Simple calculation: (Qty * Rate) * (1 - Discount/100) * (1 + Tax/100)
    // Adjust calculation based on actual business logic (e.g., is discount applied before or after tax?)
    const subtotal = qty * rate;
    const discountedAmount = subtotal * (1 - discount / 100);
    const amountWithTax = discountedAmount * (1 + tax / 100);

    return amountWithTax.toFixed(2); // Format to 2 decimal places
  };


  const handleItemInputChange = (index, field, value) => {
    const newItems = [...formData.items];

    if (field === 'product') {
      // Find the selected product from options
      const selectedProductOption = productOptions.find(option => option.value === value);

      if (selectedProductOption) {
        const productData = selectedProductOption.productData;
        // Update the item with product ID and default values
        newItems[index] = {
          ...newItems[index],
          product: value, // Store the product ID
          productName: productData.name, // Store product name for display
          productCode: productData.code, // Store product code for display
          qty: productData.defaultQty !== undefined ? String(productData.defaultQty) : '1', // Default to '1' if not provided, ensure string
          rate: productData.defaultRate !== undefined ? String(productData.defaultRate) : '', // Ensure string
          discount: productData.defaultDiscount !== undefined ? String(productData.defaultDiscount) : '0', // Default to '0', ensure string
          tax: productData.defaultTax !== undefined ? String(productData.defaultTax) : '0', // Default to '0', ensure string
        };
        // Calculate initial amount after populating default values
        newItems[index].amount = calculateAmount(newItems[index]);

        // If this is the last item and a product was selected, add a new empty row
        if (index === newItems.length - 1) {
          newItems.push({
            product: '',
            productName: '',
            productCode: '',
            qty: '',
            rate: '',
            discount: '',
            tax: '',
            amount: ''
          });
        }
      } else {
        // If product is cleared or not found, reset the item fields
        newItems[index] = {
          ...newItems[index],
          product: '',
          productName: '',
          productCode: '',
          qty: '',
          rate: '',
          discount: '',
          tax: '',
          amount: ''
        };
      }
    } else {
      // Handle changes to other fields (qty, rate, discount, tax)
      newItems[index][field] = value;
      // Recalculate amount if qty, rate, discount, or tax changes
      newItems[index].amount = calculateAmount(newItems[index]);
    }

    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      // If the items array becomes empty after removal, add a new empty item
      if (newItems.length === 0) {
        return {
          ...prev,
          items: [{
            product: '',
            productName: '',
            productCode: '',
            qty: '',
            rate: '',
            discount: '',
            tax: '',
            amount: ''
          }],
        };
      }
      return { ...prev, items: newItems };
    });
  };

  const handleViewProductDetails = (productData) => {
    setSelectedProductDetails(productData);
    setIsProductDetailsModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent>
        {mounted ? (
          <>
            <CustomTable className="mb-4">
              <CustomTableHeader>
                <CustomTableRow className="bg-gray-800 text-white">
                  <CustomTableHead>Product / service</CustomTableHead><CustomTableHead>Qty</CustomTableHead><CustomTableHead>Rate</CustomTableHead><CustomTableHead>Discount</CustomTableHead><CustomTableHead>Tax</CustomTableHead><CustomTableHead>Amount</CustomTableHead><CustomTableHead></CustomTableHead>{/* Action column */}
                </CustomTableRow>
              </CustomTableHeader>
              <CustomTableBody>
                {formData.items.map((item, index) => (
                  <CustomTableRow key={`item-${index}`} className="border-b last:border-b-0">
                    <CustomTableCell>
                      {item.productName ? (
                        // Display selected product details
                        <div className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2">
                          <span className="text-sm text-gray-800">
                            {item.productName} ({item.productCode})
                          </span>
                          {/* TODO: Implement actual ProductDetailsModal */}
                          <a href="#" className="text-blue-600 hover:underline text-xs ml-2" onClick={(e) => {
                            e.preventDefault();
                            const fullProductData = productOptions.find(option => option.value === item.product)?.productData;
                            if (fullProductData) {
                              handleViewProductDetails(fullProductData);
                            }
                          }}>View Details</a>
                        </div>
                      ) : (
                        // Display combobox for selection
                        <Combobox
                          className="w-full"
                          options={productOptions}
                          value={item.product}
                          onValueChange={(value) => handleItemInputChange(index, 'product', value)}
                          placeholder="Add Code or Product"
                          onAddNew={() => setIsNewProductModalOpen(true)} // Open new product modal
                        />
                      )}
                    </CustomTableCell>
                    <CustomTableCell>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemInputChange(index, 'qty', e.target.value)}
                        disabled={!item.product} // Disable if no product is selected
                      />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemInputChange(index, 'rate', e.target.value)}
                        disabled={!item.product} // Disable if no product is selected
                      />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemInputChange(index, 'discount', e.target.value)}
                        disabled={!item.product} // Disable if no product is selected
                      />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Input
                        type="number"
                        value={item.tax}
                        onChange={(e) => handleItemInputChange(index, 'tax', e.target.value)}
                        disabled={!item.product} // Disable if no product is selected
                      />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly // Amount is calculated
                      />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </CustomTableCell>
                  </CustomTableRow>
                ))}
              </CustomTableBody>
            </CustomTable>
          </>
        ) : (
          <div className="py-4 text-center">Loading table...</div>
        )}
         <Button variant="outline" onClick={handleAddItem}>+ Add Additional Cost</Button>
      </CardContent>

      {/* New Product Modal */}
      <CreateNewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onProductCreated={(newProduct) => {
          console.log("New product created:", newProduct);
          // Add the new product to the options
          setProductOptions((prevOptions) => [
            ...prevOptions,
            {
              value: newProduct._id, // Or newProduct.code
              label: newProduct.name,
              productData: newProduct,
            },
          ]);
          // Optionally select the newly created product in the last row
          setFormData((prev) => {
            const lastItemIndex = prev.items.length - 1;
            if (lastItemIndex >= 0) {
              const newItems = [...prev.items];
              newItems[lastItemIndex] = {
                ...newItems[lastItemIndex],
                product: newProduct._id, // Or newProduct.code
                productName: newProduct.name,
                productCode: newProduct.code,
                qty: newProduct.defaultQty !== undefined ? String(newProduct.defaultQty) : '1',
                rate: newProduct.defaultRate !== undefined ? String(newProduct.defaultRate) : '',
                discount: newProduct.defaultDiscount !== undefined ? String(newProduct.defaultDiscount) : '0',
                tax: newProduct.defaultTax !== undefined ? String(newProduct.defaultTax) : '0',
                amount: calculateAmount({ // Calculate amount for the new item
                  qty: newProduct.defaultQty !== undefined ? String(newProduct.defaultQty) : '1',
                  rate: newProduct.defaultRate !== undefined ? String(newProduct.defaultRate) : '',
                  discount: newProduct.defaultDiscount !== undefined ? String(newProduct.defaultDiscount) : '0',
                  tax: newProduct.defaultTax !== undefined ? String(newProduct.defaultTax) : '0',
                }),
              };
              // Add another empty row after selecting the new product
              newItems.push({
                product: '',
                productName: '',
                productCode: '',
                qty: '',
                rate: '',
                discount: '',
                tax: '',
                amount: ''
              });
              return { ...prev, items: newItems };
            }
            return prev;
          });
        }}
      />

      <ProductDetailsModal
        isOpen={isProductDetailsModalOpen}
        onClose={() => setIsProductDetailsModalOpen(false)}
        product={selectedProductDetails}
      />
    </Card>
  );
}
