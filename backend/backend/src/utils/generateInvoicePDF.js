const PDFDocument = require('pdfkit');

// Builds a PDF for the given invoice + client + companyProfile and resolves
// with a Buffer. companyProfile is the CompanyProfile the invoice was issued
// under (selected on the Invoice Form) — never a "primary" fallback.
// Keeping this stream-to-buffer (rather than writing to disk) keeps the API
// stateless, which matters for horizontal scaling / ephemeral filesystems on
// hosts like Render/Railway.
const generateInvoicePDF = (invoice, client, companyProfile) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .fontSize(20)
      .text(companyProfile?.name || 'Invoice', { align: 'left' })
      .fontSize(10)
      .fillColor('#555')
      .text(companyProfile?.address || '')
      .text(companyProfile?.phone || '')
      .moveDown(1.5);

    doc
      .fillColor('#000')
      .fontSize(16)
      .text(`Invoice #${invoice.number}`, { align: 'right' })
      .fontSize(10)
      .fillColor('#555')
      .text(`Issue date: ${new Date(invoice.issueDate).toLocaleDateString()}`, { align: 'right' })
      .text(`Due date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'right' })
      .text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' })
      .moveDown(1);

    doc
      .fillColor('#000')
      .fontSize(12)
      .text('Bill to:', { underline: true })
      .fontSize(10)
      .text(client?.name || '')
      .text(client?.email || '')
      .text(client?.address || '')
      .moveDown(1.5);

    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#000');
    doc.text('Description', 50, tableTop, { width: 220 });
    doc.text('Qty', 280, tableTop, { width: 60, align: 'right' });
    doc.text('Unit Price', 340, tableTop, { width: 80, align: 'right' });
    doc.text('Line Total', 430, tableTop, { width: 90, align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(520, tableTop + 15).stroke();

    const isCommission = invoice.billType === 'Commission Invoice';
    let y = tableTop + 22;
    invoice.items.forEach((item) => {
      const qty = isCommission ? item.weight : item.qty;
      const rate = isCommission ? item.commission : item.price;
      const lineTotal = ((qty || 0) * (rate || 0)).toFixed(2);
      doc.text(item.description || item.partyName || '', 50, y, { width: 220 });
      doc.text(String(qty || 0), 280, y, { width: 60, align: 'right' });
      doc.text((rate || 0).toFixed(2), 340, y, { width: 80, align: 'right' });
      doc.text(lineTotal, 430, y, { width: 90, align: 'right' });
      y += 20;
    });

    doc.moveTo(50, y + 5).lineTo(520, y + 5).stroke();
    y += 15;

    doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, 340, y, { width: 180, align: 'right' });
    y += 15;
    doc.text(`Tax (${invoice.taxRate}%): ${invoice.taxAmount.toFixed(2)}`, 340, y, { width: 180, align: 'right' });
    y += 15;
    doc.fontSize(12).text(`Total: ${invoice.total.toFixed(2)}`, 340, y, { width: 180, align: 'right' });

    if (invoice.notes) {
      doc.moveDown(2).fontSize(10).fillColor('#555').text(`Notes: ${invoice.notes}`);
    }

    doc.end();
  });
};

module.exports = generateInvoicePDF;