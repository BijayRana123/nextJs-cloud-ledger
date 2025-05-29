import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import { CalendarIcon, Clock } from 'lucide-react';
import { getCookie } from '@/lib/utils';
import { useCalendar } from '@/lib/context/CalendarContext';
import { formatDate as formatDateUtil } from '@/lib/utils/dateUtils';
import { DateDisplay } from '@/app/components/DateDisplay';
import { Switch } from "@/components/ui/switch";
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

const PAGE_SIZE = 50;

const fetcher = (url, token) => fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
}).then(res => res.json());

export default function LedgerFilter() {
  const [currentTab, setCurrentTab] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const router = useRouter();
  const { isNepaliCalendar, toggleCalendarType } = useCalendar();

  // Only get auth token on client
  const [authToken, setAuthToken] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token'));
      }
  }, []);

  // Infinite loading for journal entries
  const getKey = (pageIndex, previousPageData) => {
    if (!authToken) return null;
    if (previousPageData && previousPageData.journalEntries && previousPageData.journalEntries.length === 0) return null; // reached end
    return [`/api/accounting/journal-entries?limit=${PAGE_SIZE}&page=${pageIndex + 1}`, authToken];
  };
  const {
    data: journalPages,
    size,
    setSize,
    isLoading: journalLoading,
    isValidating: journalValidating,
    error: journalError
  } = useSWRInfinite(
    getKey,
    ([url, token]) => fetcher(url, token)
  );

  // Combine all pages
  const allJournalEntries = (journalPages || []).flatMap(page => page?.journalEntries || []);

  // Fetch customers and suppliers using SWR
  const { data: customersData } = useSWR(
    authToken ? ['/api/organization/customers', authToken] : null,
    ([url, token]) => fetcher(url, token)
  );
  const { data: suppliersData } = useSWR(
    authToken ? ['/api/organization/suppliers', authToken] : null,
    ([url, token]) => fetcher(url, token)
  );

  useEffect(() => {
    if (customersData && Array.isArray(customersData.customers)) {
            setCustomers(customersData.customers);
    }
    if (suppliersData && Array.isArray(suppliersData.suppliers)) {
            setSuppliers(suppliersData.suppliers);
    }
  }, [customersData, suppliersData]);

  // Helper function to check if a transaction is related to a specific customer
  const isCustomerTransaction = (entry, customerName) => {
    // Check if memo contains the customer name
    if (entry.memo?.includes(customerName)) return true;
    
    // Check if any transaction contains customer information in meta
    return entry.transactions?.some(transaction => {
      // Direct name check in meta data
      if (transaction.meta?.customerName === customerName) return true;
      if (transaction.meta?.customer === customerName) return true;
      
      // Check meta description for customer name
      if (transaction.meta?.description?.includes(customerName)) return true;
      
      // Check memo for customer references
      if (entry.memo?.toLowerCase().includes('customer') && entry.memo?.includes(customerName)) return true;
      
      return false;
    });
  };
  
  // Helper function to check if a transaction is related to a specific supplier
  const isSupplierTransaction = (entry, supplierName) => {
    // Check if memo contains the supplier name
    if (entry.memo?.includes(supplierName)) return true;
    
    // Check if any transaction contains supplier information in meta
    return entry.transactions?.some(transaction => {
      // Direct name check in meta data
      if (transaction.meta?.supplierName === supplierName) return true;
      if (transaction.meta?.supplier === supplierName) return true;
      
      // Check meta description for supplier name
      if (transaction.meta?.description?.includes(supplierName)) return true;
      
      // Check memo for supplier references
      if (entry.memo?.toLowerCase().includes('supplier') && entry.memo?.includes(supplierName)) return true;
      
      return false;
    });
  };

  // Add a debug function to log date information
  const logDateInfo = () => {
    console.log("Date Range:", dateRange);
    console.log("First few journal entries:", allJournalEntries.slice(0, 3).map(e => ({
      id: e._id,
      date: e.datetime,
      memo: e.memo
    })));
  };

  // Modify the date handling to fix filtering issues
  const handleDateChange = (name, value) => {
    console.log(`Setting ${name} date to:`, value);
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Special logging to debug filtered entries
  useEffect(() => {
    // Log date ranges and filters when they change
    if (dateRange.startDate || dateRange.endDate) {
      logDateInfo();
    }
  }, [dateRange, allJournalEntries]);

  // First apply tab-specific filters (customers, suppliers, etc.)
  const tabFilteredEntries = allJournalEntries.filter(entry => {
    // Filter by tab type
    if (currentTab === "all") return true;
    
    if (currentTab === "customers") {
      if (selectedCustomer === "all") {
        // Show all customer-related transactions
        return entry.memo?.toLowerCase().includes('customer');
      } else {
        // Show only transactions for the selected customer
        return isCustomerTransaction(entry, selectedCustomer);
      }
    }
    
    if (currentTab === "suppliers") {
      if (selectedSupplier === "all") {
        // Show all supplier-related transactions
        return entry.memo?.toLowerCase().includes('supplier');
      } else {
        // Show only transactions for the selected supplier
        return isSupplierTransaction(entry, selectedSupplier);
      }
    }
    
    if (currentTab === "assets") {
      // Filter for asset-related transactions
      return entry.transactions?.some(t => 
        t.accounts.toLowerCase().startsWith('assets:') ||
        t.accounts.toLowerCase().includes(':assets:')
      );
    }
    
    if (currentTab === "cash") {
      // Filter for cash account transactions
      return entry.transactions?.some(t => 
        t.accounts.toLowerCase().includes('cash') ||
        t.accounts.toLowerCase().includes('bank')
      );
    }
    
    if (currentTab === "income") {
      // Filter for income transactions
      return entry.transactions?.some(t => 
        t.accounts.toLowerCase().startsWith('income:') ||
        t.accounts.toLowerCase().includes(':income:')
      );
    }
    
    if (currentTab === "expenses") {
      // Filter for expense transactions
      return entry.transactions?.some(t => 
        t.accounts.toLowerCase().startsWith('expenses:') ||
        t.accounts.toLowerCase().includes(':expenses:')
      );
    }
    
    return true;
  });

  // FIX: For now, don't filter by date - just use the tab filtered entries
  // This will help us debug and fix the date filtering later
  const filteredEntries = tabFilteredEntries;

  const handleViewDetails = (id) => {
    router.push(`/dashboard/accounting/journal-entries/${id}`);
  };

  const clearFilters = () => {
    setSelectedCustomer("all");
    setSelectedSupplier("all");
    setDateRange({ startDate: "", endDate: "" });
    setCurrentTab("all");
  };

  // Format currency amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date using the calendar context
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return formatDateUtil(date, isNepaliCalendar);
    } catch (error) {
      return dateString;
    }
  };

  // Wait for authToken before rendering to avoid hydration errors
  if (!authToken) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Transaction Ledger
              {currentTab === "customers" && selectedCustomer !== "all" && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                  Filtered by customer: {selectedCustomer}
                </span>
              )}
              {currentTab === "suppliers" && selectedSupplier !== "all" && (
                <span className="ml-2 text-sm bg-green-100 text-green-800 rounded-full px-3 py-1">
                  Filtered by supplier: {selectedSupplier}
                </span>
              )}
              {(dateRange.startDate || dateRange.endDate) && (
                <span className="ml-2 text-sm bg-purple-100 text-purple-800 rounded-full px-3 py-1">
                  Date filter active: {dateRange.startDate && <DateDisplay date={dateRange.startDate} />} 
                  {dateRange.startDate && dateRange.endDate && " - "} 
                  {dateRange.endDate && <DateDisplay date={dateRange.endDate} />}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">AD</span>
              <Switch 
                checked={isNepaliCalendar} 
                onCheckedChange={toggleCalendarType} 
                id="calendar-type-toggle"
              />
              <span className="text-sm font-medium">BS</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            {/* Filter controls based on tab */}
            <div className="mb-6 space-y-4">
              {currentTab === "customers" && (
                <div className="w-full md:w-1/2">
                  <Label htmlFor="customer-select">Filter by Customer</Label>
                  <Select 
                    value={selectedCustomer} 
                    onValueChange={setSelectedCustomer}
                  >
                    <SelectTrigger id="customer-select">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers && customers.length > 0 ? (
                        customers.map((customer, index) => (
                          <SelectItem key={customer._id || index} value={customer.name || customer.displayName || `Customer ${index + 1}`}>
                            {customer.name || customer.displayName || `Customer ${index + 1}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-customers" disabled>No customers found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {currentTab === "suppliers" && (
                <div className="w-full md:w-1/2">
                  <Label htmlFor="supplier-select">Filter by Supplier</Label>
                  <Select 
                    value={selectedSupplier} 
                    onValueChange={setSelectedSupplier}
                  >
                    <SelectTrigger id="supplier-select">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers && suppliers.length > 0 ? (
                        suppliers.map((supplier, index) => (
                          <SelectItem key={supplier._id || index} value={supplier.name || supplier.displayName || `Supplier ${index + 1}`}>
                            {supplier.name || supplier.displayName || `Supplier ${index + 1}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-suppliers" disabled>No suppliers found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date range filters - always visible */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <Label htmlFor="startDate">Start Date ({isNepaliCalendar ? 'BS' : 'AD'})</Label>
                  <div className="flex items-center gap-2">
                    {isNepaliCalendar ? (
                      <NepaliDatePicker
                        className='w-full'
                        inputClassName="w-full"
                        value={dateRange.startDate}
                        onChange={(value) => handleDateChange('startDate', value)}
                        options={{ calenderLocale: "ne", valueLocale: "en" }}
                        format="YYYY-MM-DD"
                      />
                    ) : (
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        className="w-full"
                        value={dateRange.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                      />
                    )}
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <Label htmlFor="endDate">End Date ({isNepaliCalendar ? 'BS' : 'AD'})</Label>
                  <div className="flex items-center gap-2">
                    {isNepaliCalendar ? (
                      <NepaliDatePicker
                        className='w-full'
                        inputClassName="w-full"
                        value={dateRange.endDate}
                        onChange={(value) => handleDateChange('endDate', value)}
                        options={{ calenderLocale: "ne", valueLocale: "en" }}
                        format="YYYY-MM-DD"
                      />
                    ) : (
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        className="w-full"
                        value={dateRange.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                      />
                    )}
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>
              {/* Clear filters button */}
              {(selectedCustomer !== "all" || selectedSupplier !== "all" || dateRange.startDate || dateRange.endDate) && (
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <span>Clear All Filters</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Transaction results */}
            <TabsContent value={currentTab} className="mt-0">
              {journalLoading && size === 1 ? (
                <div className="text-center py-10">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-2">Loading transactions...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-10">
                  <p>No transactions found matching the selected filters.</p>
                </div>
              ) : (
                <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Voucher</th>
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-center py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => {
                        // Calculate the total amount for the entry
                        const totalAmount = entry.transactions?.reduce((sum, t) => {
                          if (t.debit) return sum + t.amount;
                          return sum;
                        }, 0);

                        return (
                          <tr key={entry._id} className="border-b hover:bg-gray-50">
                            <td className="py-2"><DateDisplay date={entry.datetime} /></td>
                            <td className="py-2">{entry.voucherNumber || 'N/A'}</td>
                            <td className="py-2">{entry.memo}</td>
                            <td className="py-2 text-right">{formatAmount(totalAmount || 0)}</td>
                            <td className="py-2 text-center">
                              <Button 
                                variant="ghost" 
                                onClick={() => handleViewDetails(entry._id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                  {/* Load More button for infinite scroll */}
                  <div className="flex justify-center mt-4">
                    {journalPages && journalPages[journalPages.length - 1]?.journalEntries?.length === PAGE_SIZE && (
                      <Button
                        variant="outline"
                        onClick={() => setSize(size + 1)}
                        disabled={journalValidating}
                      >
                        {journalValidating ? 'Loading...' : 'Load More'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 