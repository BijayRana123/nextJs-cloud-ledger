"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Times-Roman', // Use a more compatible default font
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  businessDetails: {
    fontSize: 12,
  },
  purchaseOrderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    fontSize: 10,
  },
  supplierDetails: {},
  orderInfo: {
    textAlign: 'right',
  },
  itemsTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomColor: '#000',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    textAlign: 'center',
    fontWeight: 'bold', // Changed from fontStyle: 'bold'
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 20,
    fontSize: 9,
  },
  tableColNum: {
    width: '5%',
    textAlign: 'left',
    paddingLeft: 5,
  },
  tableColItem: {
    width: '70%',
    textAlign: 'left',
    paddingLeft: 5,
  },
  tableColQty: {
    width: '25%',
    textAlign: 'right',
    paddingRight: 5,
  },
  notes: {
    fontSize: 10,
    marginBottom: 30,
  },
  notesTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  forSection: {
    fontSize: 10,
    textAlign: 'right',
  },
  forTitle: {
    fontWeight: 'bold',
  },
  signatureLine: {
    marginTop: 30,
    borderTopColor: '#000',
    borderTopWidth: 1,
    width: '50%',
    marginLeft: 'auto',
  }
});

// Create Document Component
const PurchaseOrderDocument = ({ purchaseOrder }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.businessDetails}>
          <Text>Tigg Bookkeeping Services</Text>
          <Text>Lalitpur , Nepal,</Text>
          <Text>PAN: 345543876</Text>
          <Text>hello@tiggbooks.com, tiggapp.com</Text>
        </View>
        <View>
          <Text style={styles.purchaseOrderTitle}>PURCHASE ORDER</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.supplierDetails}>
          <Text style={styles.notesTitle}>Supplier Details:</Text>
          <Text>{purchaseOrder.supplier?.name || 'N/A'}</Text>
          <Text>{purchaseOrder.supplier?.address || 'N/A'}</Text>
          <Text>PAN: {purchaseOrder.supplier?.pan || 'N/A'}</Text>
        </View>
        <View style={styles.orderInfo}>
          <Text><Text style={styles.forTitle}>Order:</Text> {purchaseOrder.status || 'N/A'}</Text>
          <Text><Text style={styles.forTitle}>Date:</Text> {purchaseOrder.date ? new Date(purchaseOrder.date).toLocaleDateString('en-GB') : 'N/A'}</Text>
          <Text><Text style={styles.forTitle}>Ref:</Text> {purchaseOrder.referenceNo || 'N/A'}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.itemsTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableColNum}>#</Text>
          <Text style={styles.tableColItem}>Item Name</Text>
          <Text style={styles.tableColQty}>Qty</Text>
        </View>
        {purchaseOrder.items?.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.tableColNum}>{index + 1}</Text>
            <Text style={styles.tableColItem}>{item.item?.name || 'Unknown Item'}</Text>
            <Text style={styles.tableColQty}>{item.quantity || 0}</Text>
          </View>
        ))}
      </View>

      {/* Notes */}
      <View style={styles.notes}>
        <Text style={styles.notesTitle}>Notes</Text>
        <Text>{purchaseOrder.notes || 'N/A'}</Text>
      </View>

      {/* For / Signature */}
      <View style={styles.forSection}>
        <Text style={styles.forTitle}>For:</Text>
        <Text>Tigg Bookkeeping Services</Text>
        <View style={styles.signatureLine}></View>
      </View>

    </Page>
  </Document>
);


export default function PrintPurchaseOrderPage() {
  const { id } = useParams();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPurchaseOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organization/purchase-orders/${id}`);
      const result = await response.json();

      if (response.ok) {
        setPurchaseOrder(result.purchaseOrder);
      } else {
        setError(result.message || "Failed to fetch purchase order for printing");
      }
    } catch (err) {
      console.error("Error fetching purchase order for printing:", err);
      setError("An error occurred while fetching the purchase order for printing.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
    }
  }, [id]);

  if (isLoading) {
    return <div className="p-4">Loading purchase order for printing...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!purchaseOrder) {
    return <div className="p-4">Purchase order not found for printing.</div>;
  }

  // Render the PDFViewer with the PurchaseOrderDocument
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PDFViewer style={{ width: '100%', height: '100%' }}>
        <PurchaseOrderDocument purchaseOrder={purchaseOrder} />
      </PDFViewer>
    </div>
  );
}
