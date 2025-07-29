"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"; // Assuming Dialog components are available
import { Card, CardContent } from "../../components/ui/card"; // Assuming Card components are available
import { Label } from "../../components/ui/label"; // Assuming Label component is available
import { XIcon } from "lucide-react"; // Assuming XIcon is available
import { Button } from "../../components/ui/button"; // Assuming Button is available

export default function SupplierDetailsModal({ isOpen, onClose, supplier }) {
  if (!supplier) {
    return null; // Don't render if no supplier data is provided
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]"> {/* Adjust max-width as needed */}
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
          {/* Close button */}
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <XIcon className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Contact Info */}
          <div className="flex items-center gap-4">
            {/* Placeholder for Avatar/Initials */}
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {supplier.name ? supplier.name.charAt(0).toUpperCase() : '?'}{/* Display first initial */}
            </div>
            <div>
              <div className="font-bold">{supplier.name}</div>
              <div className="text-sm text-gray-500">{supplier.contactType} | {supplier.code}</div>
            </div>
          </div>

          {/* Balance Details */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-4">
              <div>
                <Label>Balance</Label>
                {/* TODO: Fetch and display actual balance */}
                <div className="text-red-600 font-bold">( NPR N/A )</div> {/* Placeholder */}
              </div>
              <div>
                <Label>Balance Credit Limit</Label>
                {/* TODO: Fetch and display actual credit limit */}
                <div className="font-bold">NPR N/A</div> {/* Placeholder */}
              </div>
            </CardContent>
          </Card>

          {/* Basic Details */}
          <div>
            <h3 className="text-lg font-bold mb-2">Basic Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {/* Placeholder Icon */}
                <span>📞</span>
                <div>
                  <Label>Phone</Label>
                  <div>{supplier.phoneNumber || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>📍</span>
                <div>
                  <Label>Location</Label>
                  <div>{supplier.address || 'N/A'}</div> {/* Using address as location for now */}
                </div>
              </div>
               <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>📧</span>
                <div>
                  <Label>Email</Label>
                  {/* TODO: Add email field to schema and modal if needed */}
                  <div>N/A</div> {/* Placeholder */}
                </div>
              </div>
               <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>💳</span>
                <div>
                  <Label>PAN</Label>
                  <div>{supplier.pan || 'N/A'}</div>
                </div>
              </div>
               <div className="flex items-center gap-2">
                 {/* Placeholder Icon */}
                <span>📜</span>
                <div>
                  <Label>Credit Terms</Label>
                   {/* TODO: Add credit terms field to schema and modal if needed */}
                  <div>N/A</div> {/* Placeholder */}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
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
