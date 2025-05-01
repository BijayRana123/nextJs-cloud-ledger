import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import dbConnect from '@/lib/dbConnect';
import { PurchaseOrder } from '@/lib/models'; // Assuming your PurchaseOrder model is exported from here

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = await params;

  try {
    // Fetch the purchase order data
    const purchaseOrder = await PurchaseOrder.findById(id).populate('supplier').populate('items.item');

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Construct the URL for the print page.
    // This assumes the print page is accessible at /dashboard/purchase/purchase-orders/:id/print
    // and that the Next.js development server is running on localhost:3000
    // In a production environment, you would use the actual domain.
    const printPageUrl = `http://localhost:3000/dashboard/purchase/purchase-orders/${id}/print`;

    // Navigate to the print page and wait for the DOM to be fully loaded
    await page.goto(printPageUrl, { waitUntil: 'domcontentloaded' });

    // Wait for the print-ready indicator
    await page.waitForSelector('[data-testid="print-ready"]');
    await page.waitForFunction('document.readyState === "complete"'); // Wait for the page to be fully loaded

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Include background colors/images
    });

    // Close the browser
    await browser.close();

    // Send the PDF as a response
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="purchase-order-${id}.pdf"`);

    return new NextResponse(pdfBuffer, { headers });

  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error stack:', error.stack); // Log the error stack
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 }); // Include error message in response
  }
}

// Note: This API route is designed for GET requests to generate the PDF.
// You might need to adjust the URL and port (localhost:3000) for your specific environment.
// Ensure your PurchaseOrder model and dbConnect are correctly imported and configured.
