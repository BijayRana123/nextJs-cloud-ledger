import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import shadcn/ui table components
import { Plus, ChevronLeft, ChevronRight, Menu } from "lucide-react"; // Icons for buttons and pagination

// Placeholder data for the table
const purchaseBills = [
  {
    id: "1",
    supplier: "ABC Associates Pvt Ltd",
    billNo: "dsf655",
    referenceNo: "asdf512",
    date: "04-01-2082",
    total: "0.00",
    highlighted: false,
  },
  {
    id: "2",
    supplier: "abc chinese company",
    billNo: "54125",
    referenceNo: "8455",
    date: "04-01-2082",
    total: "0.00",
    highlighted: false,
  },
  {
    id: "3",
    supplier: "Aakrist pathak",
    billNo: "1215stssdg",
    referenceNo: "asdf512",
    date: "04-01-2082",
    total: "0.00",
    highlighted: true, // Example highlighted row
  },
  {
    id: "4",
    supplier: "table bhandary",
    billNo: "12",
    referenceNo: "12",
    date: "01-01-2082",
    total: "113.00",
    highlighted: false,
  },
  {
    id: "5",
    supplier: "ABC SUPPLIERS PVT LTD",
    billNo: "1234xxasdy",
    referenceNo: "1234xxasdy",
    date: "28-12-2081",
    total: "0.00",
    highlighted: false,
  },
  {
    id: "6",
    supplier: "Chaudhary Traders",
    billNo: "1234333",
    referenceNo: "1234333",
    date: "28-12-2081",
    total: "77,970.00",
    highlighted: false,
  },
   {
    id: "7",
    supplier: "Chaudhary Traders",
    billNo: "332323",
    referenceNo: "332323",
    date: "28-12-2081",
    total: "1,24,300.00",
    highlighted: false,
  },
];


export default function PurchaseBillsPage() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Bills</h1>
        <Button className="bg-green-500 hover:bg-green-600" asChild> {/* Use asChild to make the Button a link */}
          <Link href="/dashboard/purchase/add-purchase-bill"> {/* Add Link and href */}
            <Plus className="h-5 w-5 mr-2" />
            ADD NEW
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="approved" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            {/* Add other tabs if necessary */}
          </TabsList>
          <div className="flex items-center gap-4">
            {/* Pagination Placeholder */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-gray-700">1 - 20 / 214</span> {/* Placeholder text */}
              <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            {/* Options Button */}
            <Button variant="outline">
              <Menu className="h-4 w-4 mr-2" />
              OPTIONS
            </Button>
          </div>
        </div>

        <Input
          type="text"
          placeholder="Search..."
          className="mb-4"
        />

        <TabsContent value="approved">
          {/* Approved Bills Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>
                    <input type="checkbox" />
                  </TableHead>
                  <TableHead>SUPPLIER</TableHead>
                  <TableHead>BILL NO</TableHead>
                  <TableHead>REFERENCE NO</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseBills.map((bill) => (
                  <TableRow key={bill.id} className={bill.highlighted ? "bg-green-50" : ""}>
                    <TableCell><input type="checkbox" /></TableCell>
                    <TableCell>{bill.supplier}</TableCell>
                    <TableCell>{bill.billNo}</TableCell>
                    <TableCell>{bill.referenceNo}</TableCell>
                    <TableCell>{bill.date}</TableCell>
                    <TableCell>{bill.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="draft">
          {/* Draft Bills Table Placeholder */}
          <div>
            <p>Placeholder for Draft Purchase Bills table.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
