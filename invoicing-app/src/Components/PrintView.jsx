import React from "react";
import { Printer, Download, ChevronLeft } from "lucide-react";
import { computeTotals, isCommissionInvoice, invoiceTitleLabel, fmtDate, escapeHtml, money, amountInWords } from "../utils/helpers";

// Helper to format ISO date strings (YYYY-MM-DD) into (DD/MM/YYYY) -> e.g., 10/06/2026
function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

function buildInvoiceHTML(invoice, business, client) {
  const totals = computeTotals(invoice);
  const symbol = business.currencySymbol;
  const grandTotal = Math.round(totals.total);
  const roundOff = grandTotal - totals.total;
  const isIntra = invoice.stateType === "intra";
  const isInter = invoice.stateType === "inter";
  const halfTax = totals.taxAmount / 2;
  const terms = (business.terms || "").split("\n").filter(Boolean);
  const rows = invoice.lineItems.length ? invoice.lineItems : [];
  const MIN_ROWS = 10;
  const blankRowCount = Math.max(0, MIN_ROWS - rows.length);

  const commission = isCommissionInvoice(invoice);
  const billTitleText = commission && invoice.billTitle ? invoice.billTitle : invoiceTitleLabel(invoice.billType);

  const itemHeaderRow = commission
    ? `<tr style="background:#F0DFC0;">
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:36px;">Sr.no</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:100px;white-space:nowrap;">Date</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;text-align:left;">Party name</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:80px;">Total weight</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:90px;">Commission</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:100px;">Amount in ${symbol}</th>
      </tr>`
    : `<tr style="background:#F0DFC0;">
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:36px;">Sr.no</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;text-align:left;">Description of goods</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:70px;">HSN code</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:60px;">Quantity</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:50px;">Unit</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:70px;">Rate</th>
        <th style="border:1px solid #1F2A3C;padding:6px 4px;font-size:11px;font-weight:700;color:#000000;width:90px;">Amount</th>
      </tr>`;

  const itemRows = commission
    ? rows.map((li, idx) => `
      <tr>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;white-space:nowrap;">${formatDate(li.date)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;">${escapeHtml(li.partyName)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;">${escapeHtml(li.weight)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;">${escapeHtml(li.commission)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:right;font-family:'IBM Plex Mono',monospace;">${money((Number(li.weight) || 0) * (Number(li.commission) || 0), symbol)}</td>
      </tr>`).join("")
    : rows.map((li, idx) => `
      <tr>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;">${escapeHtml(li.description)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;">${escapeHtml(li.hsnCode)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;">${escapeHtml(li.qty)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:center;">${escapeHtml(li.unit)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:right;font-family:'IBM Plex Mono',monospace;">${money(li.price, symbol)}</td>
        <td style="border:1px solid #1F2A3C;padding:6px 4px;font-size:12px;font-weight:600;color:#000000;text-align:right;font-family:'IBM Plex Mono',monospace;">${money((Number(li.qty) || 0) * (Number(li.price) || 0), symbol)}</td>
      </tr>`).join("");

  const blankCols = commission ? 6 : 7;
  const blankRows = blankRowCount > 0
    ? `<tr><td colspan="${blankCols}" style="border:1px solid #1F2A3C;border-top:none;height:${blankRowCount * 26}px;">&nbsp;</td></tr>`
    : "";

  const gstRows = isIntra
    ? `<tr style="background:#FBEEDD;">
        <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;">SGST ${(Number(invoice.taxRate) / 2).toFixed(1)}%</td>
        <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">${money(halfTax, symbol)}</td>
      </tr>
      <tr style="background:#FBEEDD;">
        <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;">CGST ${(Number(invoice.taxRate) / 2).toFixed(1)}%</td>
        <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">${money(halfTax, symbol)}</td>
      </tr>`
    : isInter
    ? `<tr style="background:#FBEEDD;">
        <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;">IGST ${Number(invoice.taxRate).toFixed(1)}%</td>
        <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">${money(totals.taxAmount, symbol)}</td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(invoice.number)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #000000; background: #fff; margin: 0; padding: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
  .toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
  .toolbar button { font-family: 'Inter', sans-serif; border: 1px solid #1F2A3C; background: #1F2A3C; color: #F7F3EA; padding: 9px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .sheet { max-width: 900px; margin: 0 auto; border: 1px solid #1F2A3C; }
  table { width: 100%; border-collapse: collapse; }
  @media print {
    @page { size: auto; margin: 0 !important; }
    .toolbar { display: none; }
    body { padding: 1.5cm !important; margin: 0 !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
</style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="sheet">
    <div style="text-align:center;font-weight:700;font-size:13px;letter-spacing:0.06em;padding:6px 0;border-bottom:1px solid #1F2A3C;color:#8B0000;">
      JAY SWAMINARAYAN
    </div>
    <div style="background:#fff;border-bottom:1px solid #1F2A3C;padding:12px 16px;text-align:center;">
      <span style="font-family:'Zilla Slab',serif;font-size:22px;font-weight:700;background:#F5D98C;padding:3px 14px;display:block;margin-left:-16px;margin-right:-16px;color:#000000;">${escapeHtml(business.name)}</span>
      <div style="font-size:13px;font-weight:700;text-transform:uppercase;margin-top:6px;white-space:pre-line;color:#000000;">${escapeHtml(business.address)}</div>
      ${business.panNumber && business.panNumber.trim() ? `<div style="font-size:13px;font-weight:700;text-transform:uppercase;margin-top:4px;color:#000000;">PAN: ${escapeHtml(business.panNumber)}</div>` : ""}
      ${business.gstNumber ? `<div style="font-size:13px;font-weight:700;text-transform:uppercase;margin-top:4px;color:#000000;">GSTIN: ${escapeHtml(business.gstNumber)}</div>` : ""}
      ${business.phone ? `<div style="font-size:13px;font-weight:700;text-transform:uppercase;margin-top:3px;color:#000000;">Mobile: ${escapeHtml(business.phone)}</div>` : ""}
      ${business.email ? `<div style="font-size:13px;font-weight:700;text-transform:uppercase;margin-top:3px;color:#000000;">Email: ${escapeHtml(business.email)}</div>` : ""}
    </div>
    <div style="text-align:center;font-weight:700;font-size:13px;letter-spacing:0.08em;padding:6px 0;border-bottom:1px solid #1F2A3C;background:${commission ? "transparent" : "#F7F3EA"};color:#000000;">
      ${escapeHtml(billTitleText.toUpperCase())}
    </div>

    ${commission ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;">
      <div style="border:1px solid #1F2A3C;border-right:0;padding:7px 8px;font-size:15px;font-weight:800;color:#000000;"><b>Invoice no:</b> ${escapeHtml(invoice.number)}</div>
      <div style="border:1px solid #1F2A3C;border-left:0;padding:7px 8px;font-size:15px;font-weight:800;color:#000000;text-align:right;"><b>Date:</b> ${fmtDate(invoice.issueDate)}</div>
    </div>` : `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;">
      <div style="border:1px solid #1F2A3C;border-right:0;padding:7px 8px;font-size:15px;font-weight:800;color:#000000;"><b>Invoice no:</b> ${escapeHtml(invoice.number)}</div>
      <div style="border:1px solid #1F2A3C;border-left:0;border-right:0;padding:7px 8px;font-size:15px;font-weight:800;color:#000000;text-align:center;"><b>State:</b> ${isIntra ? "Intra-state" : isInter ? "Inter-state" : "N/A"}</div>
      <div style="border:1px solid #1F2A3C;border-left:0;padding:7px 8px;font-size:15px;font-weight:800;color:#000000;text-align:right;"><b>Date:</b> ${fmtDate(invoice.issueDate)}</div>
    </div>`}

    ${(!commission && invoice.shipDispatchType && invoice.shipDispatchName) ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #1F2A3C;">
      <div style="border-right:1px solid #1F2A3C;">
        <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;"><b>Bill to:</b> ${escapeHtml(client?.name || "—")}</div>
        <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;white-space:pre-line;"><b>Address:</b> ${escapeHtml(client?.address)}</div>
        <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;"><b>GST no:</b> ${escapeHtml(client?.gstNumber || "—")}</div>
        <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;"><b>State code:</b> ${escapeHtml(client?.stateCode || "—")}</div>
      </div>
      <div>
        <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;"><b>${invoice.shipDispatchType === "shipTo" ? "Ship to:" : "Dispatch from:"}</b> ${escapeHtml(invoice.shipDispatchName)}</div>
        <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;white-space:pre-line;"><b>Address:</b> ${escapeHtml(invoice.shipDispatchAddress)}</div>
        <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;"><b>GST no:</b> ${escapeHtml(invoice.shipDispatchGst || "—")}</div>
      </div>
    </div>` : `
    <div style="border-top:1px solid #1F2A3C;">
      <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;"><b>${commission ? "Party name:" : "Bill to:"}</b> ${escapeHtml(client?.name || "—")}</div>
      <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;white-space:pre-line;"><b>Address:</b> ${escapeHtml(client?.address)}</div>
      <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;"><b>GST no:</b> ${escapeHtml(client?.gstNumber || "—")}</div>
      <div style="padding:7px 8px;font-size:15px;font-weight:800;color:#000000;"><b>State code:</b> ${escapeHtml(client?.stateCode || "—")}</div>
    </div>`}

    ${(invoice.notes && invoice.notes.trim()) ? `
    <div style="border-top:1px solid #1F2A3C;">
      <div style="padding:6px 8px;font-size:12px;font-weight:600;color:#000000;white-space:pre-line;">${escapeHtml(invoice.notes)}</div>
    </div>` : ""}

    ${(!commission && (invoice.transportName || invoice.vehicleNo)) ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #1F2A3C;">
      <div style="border:1px solid #1F2A3C;border-right:0;padding:7px 8px;font-size:14px;font-weight:700;color:#000000;"><b>Transport details:</b> ${escapeHtml(invoice.transportName || "—")}</div>
      <div style="border:1px solid #1F2A3C;border-left:0;padding:7px 8px;font-size:14px;font-weight:700;color:#000000;"><b>Vehicle no:</b> ${escapeHtml(invoice.vehicleNo || "—")}</div>
    </div>` : ""}

    <table style="border-top:1px solid #1F2A3C;">
      <thead>${itemHeaderRow}</thead>
      <tbody>${itemRows}${blankRows}</tbody>
    </table>

    <div style="display:grid;grid-template-columns:1.4fr 1fr;">
      <div style="border-right:1px solid #1F2A3C;">
        <!-- Amount in Words -->
        <div style="padding:9px 10px;font-size:15px;font-weight:800;color:#000000;border-bottom:1px solid #1F2A3C;">${escapeHtml(amountInWords(grandTotal, "Rupees"))}</div>
        
        <!-- Bank Details -->
        <div style="padding:9px 10px;border-bottom:1px solid #1F2A3C;color:#000000;font-weight:700;">
          <div style="font-weight:800;font-size:15px;margin-bottom:5px;color:#000000;">Bank details</div>
          <div style="font-size:14px;font-weight:700;color:#000000;">Bank name: ${escapeHtml(business.bankName || "—")}</div>
          <div style="font-size:14px;font-weight:700;color:#000000;">Branch name: ${escapeHtml(business.branchName || "—")}</div>
          <div style="font-size:14px;font-weight:700;color:#000000;">A/C no: ${escapeHtml(business.accountNo || "—")}</div>
          <div style="font-size:14px;font-weight:700;color:#000000;">IFSC code: ${escapeHtml(business.ifscCode || "—")}</div>
        </div>
        
        <!-- Terms & Conditions -->
        <div style="padding:8px 10px;">
          <div style="font-weight:800;font-size:15px;margin-bottom:5px;color:#000000;">Terms &amp; conditions</div>
          ${terms.map((t) => `<div style="font-size:13.5px;font-weight:600;color:#000000;margin-bottom:3px;">${escapeHtml(t)}</div>`).join("")}
        </div>
      </div>
      <div>
        <table>
          <tbody>
            <tr style="background:#FBEEDD;">
              <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;">Sub total</td>
              <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">${money(totals.subtotal, symbol)}</td>
            </tr>
            ${gstRows}
            <tr style="background:#FBEEDD;">
              <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;">Round off</td>
              <td style="padding:7px 10px;font-size:15px;font-weight:700;color:#000000;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">${money(roundOff, symbol)}</td>
            </tr>
            <tr style="background:#F5D98C;">
              <td style="padding:9px 10px;font-size:16px;font-weight:800;color:#000000;">Grand total</td>
              <td style="padding:9px 10px;font-size:16px;font-weight:800;color:#000000;text-align:right;font-family:'IBM Plex Mono',monospace;">${money(grandTotal, symbol)}</td>
            </tr>
          </tbody>
        </table>
        <div style="border-top:1px solid #1F2A3C;padding:8px 10px 40px;">
          <div style="font-weight:700;font-size:12px;color:#000000;">Signature &amp; stamp</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function Cell({ children, style }) {
  return <div style={{ border: "1px solid #1F2A3C", padding: "6px 8px", fontSize: 12, color: "#000000", ...style }}>{children}</div>;
}

export default function PrintView({ invoice, business, client, onClose }) {
  const totals = computeTotals(invoice);
  const symbol = business.currencySymbol;
  const grandTotal = Math.round(totals.total);
  const roundOff = grandTotal - totals.total;
  const isIntra = invoice.stateType === "intra";
  const isInter = invoice.stateType === "inter";
  const halfTax = totals.taxAmount / 2;
  const terms = (business.terms || "").split("\n").filter(Boolean);
  const rows = invoice.lineItems.length ? invoice.lineItems : [];
  const MIN_ROWS = 10;
  const blankRowCount = Math.max(0, MIN_ROWS - rows.length);
  const commission = isCommissionInvoice(invoice);
  const billTitleText = commission && invoice.billTitle ? invoice.billTitle : invoiceTitleLabel(invoice.billType);

  function downloadStandaloneHTML() {
    const html = buildInvoiceHTML(invoice, business, client);
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.number || "invoice"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <style>{`
        @media print {
          @page { size: auto; margin: 0 !important; }
          body { padding: 1.5cm !important; margin: 0 !important; }
          .lg-noprint { display: none !important; }
        }
      `}</style>
      <div className="lg-noprint" style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <button className="lg-btn" onClick={() => window.print()}><Printer size={14} /> Print / Save as PDF</button>
        <button className="lg-btn-ghost" onClick={downloadStandaloneHTML}><Download size={14} /> Download printable file</button>
        <button className="lg-btn-ghost" onClick={onClose}><ChevronLeft size={14} /> Back</button>
      </div>
      <div className="lg-noprint" style={{ fontSize: 12, fontWeight: 600, color: "#000000", marginBottom: 16, maxWidth: 500 }}>
        If the print button above doesn't open a dialog, use "Download printable file" — open the downloaded file in your browser and print or save it as a PDF from there.
      </div>

      <div className="lg-print-area" style={{ fontFamily: "Inter, sans-serif", color: "#000000", background: "#fff", maxWidth: 900, margin: "0 auto", border: "1px solid #1F2A3C" }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", padding: "6px 0", borderBottom: "1px solid #1F2A3C", color: "#8B0000" }}>
          JAY SWAMINARAYAN
        </div>

        <div style={{ background: "#fff", borderBottom: "1px solid #1F2A3C", padding: "12px 16px", textAlign: "center" }}>
          <span className="lg-display" style={{ fontSize: 22, fontWeight: 700, background: "#F5D98C", padding: "3px 14px", display: "block", marginLeft: -16, marginRight: -16, color: "#000000" }}>{business.name}</span>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 6, whiteSpace: "pre-line", color: "#000000" }}>{business.address}</div>
          {business.panNumber && business.panNumber.trim() && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 4, color: "#000000" }}>PAN: {business.panNumber}</div>}
          {business.gstNumber && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 4, color: "#000000" }}>GSTIN: {business.gstNumber}</div>}
          {business.phone && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 3, color: "#000000" }}>Mobile: {business.phone}</div>}
          {business.email && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 3, color: "#000000" }}>Email: {business.email}</div>}
        </div>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", padding: "6px 0", borderBottom: "1px solid #1F2A3C", background: isCommissionInvoice(invoice) ? "transparent" : "#F7F3EA", color: "#000000" }}>
          {billTitleText.toUpperCase()}
        </div>

        {isCommissionInvoice(invoice) ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <Cell style={{ borderRight: 0, fontSize: 13, fontWeight: 700 }}><b>Invoice no:</b> {invoice.number}</Cell>
            <Cell style={{ borderLeft: 0, textAlign: "right", fontSize: 13, fontWeight: 700 }}><b>Date:</b> {fmtDate(invoice.issueDate)}</Cell>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <Cell style={{ borderRight: 0, fontSize: 14, fontWeight: 700 }}><b>Invoice no:</b> {invoice.number}</Cell>
            <Cell style={{ borderRight: 0, borderLeft: 0, textAlign: "center", fontSize: 14, fontWeight: 700 }}>
              <b>State:</b> {isIntra ? "Intra-state" : isInter ? "Inter-state" : "N/A"}
            </Cell>
            <Cell style={{ borderLeft: 0, textAlign: "right", fontSize: 14, fontWeight: 700 }}><b>Date:</b> {fmtDate(invoice.issueDate)}</Cell>
          </div>
        )}

        {!isCommissionInvoice(invoice) && invoice.shipDispatchType && invoice.shipDispatchName ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #1F2A3C" }}>
            <div style={{ borderRight: "1px solid #1F2A3C" }}>
              <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700 }}><b>Bill to:</b> {client?.name || "—"}</Cell>
              <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700, whiteSpace: "pre-line" }}><b>Address:</b> {client?.address}</Cell>
              <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700 }}><b>GST no:</b> {client?.gstNumber || "—"}</Cell>
              <Cell style={{ border: "none", fontSize: 14, fontWeight: 700 }}><b>State code:</b> {client?.stateCode || "—"}</Cell>
            </div>
            <div>
              <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700 }}>
                <b>{invoice.shipDispatchType === "shipTo" ? "Ship to:" : "Dispatch from:"}</b> {invoice.shipDispatchName}
              </Cell>
              <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700, whiteSpace: "pre-line" }}><b>Address:</b> {invoice.shipDispatchAddress}</Cell>
              <Cell style={{ border: "none", fontSize: 14, fontWeight: 700 }}><b>GST no:</b> {invoice.shipDispatchGst || "—"}</Cell>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid #1F2A3C" }}>
            <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700 }}>
              <b>{isCommissionInvoice(invoice) ? "Party name:" : "Bill to:"}</b> {client?.name || "—"}
            </Cell>
            <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700, whiteSpace: "pre-line" }}><b>Address:</b> {client?.address}</Cell>
            <Cell style={{ border: "none", borderBottom: "1px solid #1F2A3C", fontSize: 14, fontWeight: 700 }}><b>GST no:</b> {client?.gstNumber || "—"}</Cell>
            <Cell style={{ border: "none", fontSize: 14, fontWeight: 700 }}><b>State code:</b> {client?.stateCode || "—"}</Cell>
          </div>
        )}

        {invoice.notes && invoice.notes.trim() && (
          <div style={{ borderTop: "1px solid #1F2A3C" }}>
            <Cell style={{ border: "none", fontSize: 12, fontWeight: 600, whiteSpace: "pre-line" }}>{invoice.notes}</Cell>
          </div>
        )}

        {!isCommissionInvoice(invoice) && (invoice.transportName || invoice.vehicleNo) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #1F2A3C" }}>
            <Cell style={{ borderRight: 0, fontSize: 14, fontWeight: 700 }}><b>Transport details:</b> {invoice.transportName || "—"}</Cell>
            <Cell style={{ borderLeft: 0, fontSize: 14, fontWeight: 700 }}><b>Vehicle no:</b> {invoice.vehicleNo || "—"}</Cell>
          </div>
        )}

        <table style={{ borderTop: "1px solid #1F2A3C", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            {isCommissionInvoice(invoice) ? (
              <tr style={{ background: "#F0DFC0" }}>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 36 }}>Sr.no</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 100, whiteSpace: "nowrap" }}>Date</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", textAlign: "left" }}>Party name</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 80 }}>Total weight</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 90 }}>Commission</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 100 }}>Amount in {symbol}</th>
              </tr>
            ) : (
              <tr style={{ background: "#F0DFC0" }}>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 36 }}>Sr.no</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", textAlign: "left" }}>Description of goods</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 70 }}>HSN code</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 60 }}>Quantity</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 50 }}>Unit</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 70 }}>Rate</th>
                <th style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 90 }}>Amount</th>
              </tr>
            )}
          </thead>
          <tbody>
            {isCommissionInvoice(invoice)
              ? rows.map((li, idx) => (
                  <tr key={li.id || idx}>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center", whiteSpace: "nowrap" }}>{formatDate(li.date)}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000" }}>{li.partyName}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.weight}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.commission}</td>
                    <td className="lg-mono" style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "right" }}>
                      {money((Number(li.weight) || 0) * (Number(li.commission) || 0), symbol)}
                    </td>
                  </tr>
                ))
              : rows.map((li, idx) => (
                  <tr key={li.id || idx}>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000" }}>{li.description}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.hsnCode}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.qty}</td>
                    <td style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.unit}</td>
                    <td className="lg-mono" style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "right" }}>{money(li.price, symbol)}</td>
                    <td className="lg-mono" style={{ border: "1px solid #1F2A3C", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "right" }}>
                      {money((Number(li.qty) || 0) * (Number(li.price) || 0), symbol)}
                    </td>
                  </tr>
                ))}
            {blankRowCount > 0 && (
              <tr>
                <td colSpan={isCommissionInvoice(invoice) ? 6 : 7} style={{ border: "1px solid #1F2A3C", borderTop: "none", height: blankRowCount * 26 }}>
                  &nbsp;
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr" }}>
          <div style={{ borderRight: "1px solid #1F2A3C" }}>
            {/* Amount in Words */}
            <div style={{ padding: "8px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C" }}>
              {amountInWords(grandTotal, "Rupees")}
            </div>

            {/* Bank Details */}
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #1F2A3C" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#000000" }}>Bank details</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>Bank name: {business.bankName || "—"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>Branch name: {business.branchName || "—"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>A/C no: {business.accountNo || "—"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>IFSC code: {business.ifscCode || "—"}</div>
            </div>

            {/* Terms & Conditions */}
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#000000" }}>Terms & conditions</div>
              {terms.map((t, idx) => (
                <div key={idx} style={{ fontSize: 12.5, fontWeight: 600, color: "#000000", marginBottom: 2 }}>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ background: "#FBEEDD" }}>
                  <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C" }}>Sub total</td>
                  <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C", textAlign: "right" }}>
                    {money(totals.subtotal, symbol)}
                  </td>
                </tr>
                {isIntra && (
                  <>
                    <tr style={{ background: "#FBEEDD" }}>
                      <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C" }}>SGST {(Number(invoice.taxRate) / 2).toFixed(1)}%</td>
                      <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C", textAlign: "right" }}>
                        {money(halfTax, symbol)}
                      </td>
                    </tr>
                    <tr style={{ background: "#FBEEDD" }}>
                      <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C" }}>CGST {(Number(invoice.taxRate) / 2).toFixed(1)}%</td>
                      <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C", textAlign: "right" }}>
                        {money(halfTax, symbol)}
                      </td>
                    </tr>
                  </>
                )}
                {isInter && (
                  <tr style={{ background: "#FBEEDD" }}>
                    <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C" }}>IGST {Number(invoice.taxRate).toFixed(1)}%</td>
                    <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C", textAlign: "right" }}>
                      {money(totals.taxAmount, symbol)}
                    </td>
                  </tr>
                )}
                <tr style={{ background: "#FBEEDD" }}>
                  <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C" }}>Round off</td>
                  <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #1F2A3C", textAlign: "right" }}>
                    {money(roundOff, symbol)}
                  </td>
                </tr>
                <tr style={{ background: "#F5D98C" }}>
                  <td style={{ padding: "8px 10px", fontSize: 15, fontWeight: 800, color: "#000000" }}>Grand total</td>
                  <td className="lg-mono" style={{ padding: "8px 10px", fontSize: 15, fontWeight: 800, color: "#000000", textAlign: "right" }}>
                    {money(grandTotal, symbol)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ borderTop: "1px solid #1F2A3C", padding: "8px 10px 40px" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#000000" }}>Signature &amp; stamp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}