"use client"

import { X, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Import DialogTitle
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'; // Import useRouter

export function CreateNewModal({ isOpen, onClose, onOpenCustomerModal, onOpenSupplierModal, onOpenProductModal }) {
  const router = useRouter(); // Initialize useRouter

  const categories = [
    {
      title: "GENERAL",
      items: ["Customer", "Supplier", "Products", "Accounts"],
    },
    {
      title: "SALES",
      items: [ "Sales Voucher", "Sales Return"],
    },
    {
      title: "PURCHASE",
      items: ["Purchase Voucher", "Purchase Return"],
    },
    {
      title: "ACCOUNTING",
      items: ["Journal Voucher", "Contra Voucher", "Receipt Voucher", "Payment Voucher"],
    },
  ]

  const handleItemClick = (category, item) => {
    onClose(); // Close the main modal first
    
    if (item === 'Customer') {
      onOpenCustomerModal && onOpenCustomerModal();
    } else if (item === 'Supplier') {
      onOpenSupplierModal && onOpenSupplierModal();
    } else if (item === 'Products') {
      onOpenProductModal && onOpenProductModal();
    } else {
      // Map other items to their respective routes
      const routeMap = {
        'Accounts': '/dashboard/accounting/ledger',
        'Sales Voucher': '/dashboard/sales/add-sales-voucher',
        'Sales Return': '/dashboard/sales/add-sales-return',
        'Purchase Voucher': '/dashboard/purchase/add-purchase-bill',
        'Purchase Return': '/dashboard/purchase/add-purchase-return',
        'Journal Voucher': '/dashboard/accounting/journal-entries/new',
        'Contra Voucher': '/dashboard/accounting/transactions/contra-voucher/new',
        'Receipt Voucher': '/dashboard/accounting/transactions/receive-payment/new',
        'Payment Voucher': '/dashboard/accounting/transactions/pay-supplier/new',
      };
      const route = routeMap[item];
      if (route) {
        router.push(route);
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-none"> {/* Remove default border */}
        <DialogHeader className="p-6 border-b flex flex-row items-center justify-between"> {/* Add padding, border-b, and flex properties */}
          <DialogTitle className="text-xl font-semibold">Create New</DialogTitle> {/* Style title */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-green-500 text-white hover:bg-green-600" // Keep button styles
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
          {categories.map((category, index) => (
            <div key={index} className="p-6 border-r last:border-r-0">
              <h3 className="font-semibold text-gray-700 mb-4 uppercase text-sm">{category.title}</h3> {/* Style category title, reduced mb */}
              <div className="space-y-3"> {/* Adjusted spacing */}
                {category.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 w-full text-left text-sm" // Adjust text size
                    onClick={() => handleItemClick(category.title, item)}
                  >
                    <Plus className="h-4 w-4 text-gray-400" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
