import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePdfBase64 = async (order) => {
    const jsPDFModule = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDFModule.jsPDF('p', 'pt');

    // Company Info (placeholder)
    doc.setFontSize(18);
    doc.text('[Company Name]', 40, 40);
    doc.setFontSize(10);
    doc.text('[Street Address]', 40, 60);
    doc.text('[City, ST ZIP]', 40, 75);
    doc.text('Phone: [000-000-0000]', 40, 90);
    doc.text('Fax: [000-000-0000]', 40, 105);

    // Invoice Title
    doc.setFontSize(24);
    doc.setTextColor('#3a5da8');
    doc.text('INVOICE', 420, 50, { align: 'right' });
    doc.setTextColor('#222');

    doc.setFontSize(12);

    // Invoice Info Table
    autoTable(doc, {
        startY: 120,
        head: [['DATE', 'SALES VOUCHER NO', 'CUSTOMER ID']],
        body: [[
            order.date ? new Date(order.date).toLocaleDateString() : 'N/A',
            order.referenceNo || 'N/A',
            order.customer?._id || 'N/A',
        ]],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 58, 94] },
    });

    // Customer Info
    let y = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFillColor(34, 58, 94);
    doc.setTextColor('#fff');
    doc.rect(40, y, 220, 20, 'F');
    doc.text('BILL TO:', 45, y + 14);
    doc.rect(300, y, 220, 20, 'F');
    doc.text('SHIP TO:', 305, y + 14);

    doc.setTextColor('#222');
    doc.setFontSize(10);
    doc.text('[Name]', 45, y + 34);
    doc.text('[Company Name]', 45, y + 48);
    doc.text('[Street Address]', 45, y + 62);
    doc.text('[City, ST ZIP]', 45, y + 76);
    doc.text('[Phone]', 45, y + 90);

    doc.text('[Name]', 305, y + 34);
    doc.text('[Company Name]', 305, y + 48);
    doc.text('[Street Address]', 305, y + 62);
    doc.text('[City, ST ZIP]', 305, y + 76);
    doc.text('[Phone]', 305, y + 90);

    // Items Table
    const items = (order.items || []).map(item => [
        item.item?._id || 'N/A',
        item.item?.name || 'Unknown Product',
        item.quantity || 0,
        (item.price || 0).toFixed(2),
        ((item.quantity || 0) * (item.price || 0)).toFixed(2),
    ]);

    autoTable(doc, {
        startY: y + 110,
        head: [['ITEM #', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
        body: items,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 58, 94] },
    });

    // Totals
    let y2 = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('SUBTOTAL', 400, y2);
    doc.text((order.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0).toFixed(2), 520, y2, { align: 'right' });
    doc.text('TAX RATE', 400, y2 + 16);
    doc.text('6.750%', 520, y2 + 16, { align: 'right' });
    doc.text('TAX', 400, y2 + 32);
    doc.text(((order.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0) * 0.0675).toFixed(2), 520, y2 + 32, { align: 'right' });
    doc.text('TOTAL', 400, y2 + 48);
    doc.setFontSize(14);
    doc.setTextColor('#3a5da8');
    doc.text(((order.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0) * 1.0675).toFixed(2), 520, y2 + 48, { align: 'right' });
    doc.setTextColor('#222');

    // Comments
    doc.setFontSize(10);
    doc.text('Other Comments or Special Instructions:', 40, y2 + 80);
    doc.text('- Total payment due in 30 days', 60, y2 + 96);
    doc.text('- Please include the invoice number on your check', 60, y2 + 110);

    // Footer
    doc.setFontSize(12);
    doc.setTextColor('#3a5da8');
    doc.text('Thank You For Your Business!', 40, y2 + 140);
    doc.setTextColor('#888');
    doc.setFontSize(10);
    doc.text('If you have any questions about this invoice, please contact', 40, y2 + 160);
    doc.text('[Name, Phone #, E-mail]', 40, y2 + 172);

    // Return as base64 string
    return doc.output('datauristring');
}; 