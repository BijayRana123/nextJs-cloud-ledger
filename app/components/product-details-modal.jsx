"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { XIcon } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function ProductDetailsModal({ isOpen, onClose, product }) {
  if (!product) {
    return null; // Don't render if no product data is provided
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]"> {/* Adjust max-width as needed */}
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
          {/* Close button */}
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <XIcon className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Product Info */}
          <div className="flex items-center gap-4">
            {/* Placeholder for Avatar/Initials - Using first letter of product name */}
            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
              {product.name ? product.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="font-bold">{product.name}</div>
              <div className="text-sm text-gray-500">{product.category} | HS Code: {product.code}</div> {/* Assuming category and code are available */}
            </div>
          </div>

          {/* Balance Details (Placeholder based on image) */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-4">
              <div>
                <Label>Balance</Label>
                {/* TODO: Fetch and display actual product balance */}
                <div className="font-bold">N/A</div> {/* Placeholder */}
              </div>
              <div>
                <Label>Reorder Level</Label>
                {/* TODO: Fetch and display actual reorder level */}
                <div className="font-bold">N/A</div> {/* Placeholder */}
              </div>
            </CardContent>
          </Card>

          {/* Item Details (Based on image and potential product data) */}
          <div>
            <h3 className="text-lg font-bold mb-2">Item Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {/* Placeholder Icon */}
                <span>💲</span>
                <div>
                  <Label>Selling Price</Label>
                  <div>{product.sellingPrice || 'N/A'}</div> {/* Assuming sellingPrice is available */}
                </div>
              </div>
              <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>💰</span>
                <div>
                  <Label>Purchase Price</Label>
                  <div>{product.purchasePrice || 'N/A'}</div> {/* Assuming purchasePrice is available */}
                </div>
              </div>
               <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>📦</span>
                <div>
                  <Label>Primary Unit</Label>
                  <div>{product.primaryUnit || 'N/A'}</div> {/* Assuming primaryUnit is available */}
                </div>
              </div>
               <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>🧾</span>
                <div>
                  <Label>Tax</Label>
                  <div>{product.tax || 'N/A'}</div> {/* Assuming tax is available */}
                </div>
              </div>
               <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>🏷️</span>
                <div>
                  <Label>Category</Label>
                  <div>{product.category || 'N/A'}</div> {/* Assuming category is available */}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions (Placeholder based on image) */}
          <div>
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Recent Transactions</h3>
                 {/* TODO: Implement View More link functionality */}
                <a href="#" className="text-blue-600 hover:underline text-sm">View More</a>
             </div>
             {/* TODO: Fetch and display recent transactions */}
             <div className="text-gray-500 text-sm">No recent transactions found.</div> {/* Placeholder */}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
