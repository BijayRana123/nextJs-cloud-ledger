import React, { useState } from 'react';
import StockWarningModal from './StockWarningModal';

const SalesFormWithStockValidation = () => {
  const [formData, setFormData] = useState({
    customer: '',
    items: [],
    // ... other form fields
  });
  
  const [stockModal, setStockModal] = useState({
    isOpen: false,
    stockErrors: [],
    stockWarnings: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to check stock levels before submission
  const checkStockLevels = async (items) => {
    try {
      const response = await fetch('/api/organization/check-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
        },
        body: JSON.stringify({ items })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking stock:', error);
      return { errors: [{ error: 'Failed to check stock levels' }], warnings: [], canProceed: false };
    }
  };

  // Handle form submission with stock validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      // First, check stock levels
      const stockCheck = await checkStockLevels(formData.items);
      
      // If there are errors or warnings, show the modal
      if (stockCheck.errors.length > 0 || stockCheck.warnings.length > 0) {
        setStockModal({
          isOpen: true,
          stockErrors: stockCheck.errors,
          stockWarnings: stockCheck.warnings
        });
        setIsSubmitting(false);
        return;
      }

      // If no stock issues, proceed with submission
      await submitSalesVoucher();
      
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Error creating sales voucher: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to actually submit the sales voucher
  const submitSalesVoucher = async () => {
    try {
      const response = await fetch('/api/organization/sales-vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Success - check if there are stock warnings in the response
        if (data.stockWarnings && data.stockWarnings.length > 0) {
          alert(`Sales voucher created successfully!\n\nStock warnings:\n${data.stockWarnings.map(w => `- ${w.itemName}: ${w.remainingAfterSale} remaining`).join('\n')}`);
        } else {
          alert('Sales voucher created successfully!');
        }
        
        // Reset form or redirect
        setFormData({ customer: '', items: [] });
        
      } else {
        // Handle API errors
        if (data.stockErrors) {
          setStockModal({
            isOpen: true,
            stockErrors: data.stockErrors,
            stockWarnings: data.stockWarnings || []
          });
        } else {
          alert('Error: ' + data.message);
        }
      }
    } catch (error) {
      console.error('Error submitting sales voucher:', error);
      alert('Error creating sales voucher: ' + error.message);
    }
  };

  // Handle proceeding despite warnings
  const handleProceedWithWarnings = async () => {
    setStockModal({ isOpen: false, stockErrors: [], stockWarnings: [] });
    await submitSalesVoucher();
  };

  // Handle closing the stock modal
  const handleCloseStockModal = () => {
    setStockModal({ isOpen: false, stockErrors: [], stockWarnings: [] });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Sales Voucher</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer
          </label>
          <select
            value={formData.customer}
            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Customer</option>
            <option value="CASH">Cash Sale</option>
            {/* Add customer options here */}
          </select>
        </div>

        {/* Items Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items
          </label>
          {/* Add your items input components here */}
          <div className="text-sm text-gray-500">
            Items will be validated for stock levels before saving
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {isSubmitting ? 'Checking Stock...' : 'Create Sales Voucher'}
          </button>
        </div>
      </form>

      {/* Stock Warning Modal */}
      <StockWarningModal
        isOpen={stockModal.isOpen}
        onClose={handleCloseStockModal}
        onProceed={handleProceedWithWarnings}
        stockErrors={stockModal.stockErrors}
        stockWarnings={stockModal.stockWarnings}
      />
    </div>
  );
};

export default SalesFormWithStockValidation;