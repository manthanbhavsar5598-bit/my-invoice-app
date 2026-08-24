import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Printer, ChevronLeft } from "lucide-react";
import { computeTotals, isCommissionInvoice, invoiceTitleLabel, fmtDate, money, amountInWords } from "../utils/helpers";

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

// Formats a weight value to always show 2 decimal places (e.g. 10540 -> "10540.00")
// for consistent, easy-to-scan figures on the printed invoice. Falls back to the
// raw value if it isn't a plain number (e.g. blank).
function fmtWeight(v) {
  const n = Number(v);
  return v !== "" && v != null && Number.isFinite(n) ? n.toFixed(2) : (v ?? "");
}

function Cell({ children, style }) {
  return <div style={{ border: "1px solid #000000", padding: "6px 8px", fontSize: 12, color: "#000000", ...style }}>{children}</div>;
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

  // On narrow screens the invoice sheet below is wider than the viewport
  // and scrolls horizontally within its own box. Some mobile browsers
  // (notably iOS Safari) don't reliably start that scroll position at the
  // true left edge on first render, which visually clips the left side of
  // the sheet. Forcing it to 0 right after mount guarantees the full
  // document is reachable. This only ever touches scroll position, never
  // invoice data or calculations.
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, []);

  // Fit-to-one-page: invoices vary a lot in length (line item count,
  // remarks, terms & conditions), so a fixed font/padding can't guarantee
  // everything lands on a single A4 page — and just as often, a short
  // invoice ends well before the page does, leaving a big blank gap at
  // the bottom instead of actually using the paper. The scale factor
  // below handles both directions: it shrinks content that's too tall to
  // fit, and stretches content that's shorter than the page so it fills
  // it properly. It's computed ahead of time (on mount, once fonts finish
  // loading, and again right before printing as a safety re-check) and
  // stored as a CSS custom property, applied only inside `@media print`
  // via the CSS `zoom` property below. zoom (not transform) is used
  // deliberately: transform is a paint-only effect that doesn't change
  // how much vertical space an element claims in the page's layout flow,
  // so Chrome's print pagination ignores it and still breaks the page at
  // the original, unscaled height. zoom genuinely shrinks or grows the
  // element's real layout size, so pagination correctly sees the true
  // final size either way. This only ever touches presentation, never
  // invoice data or totals.
  const sheetRef = useRef(null);
  const [printVars, setPrintVars] = useState({ "--print-scale": 1 });

  useLayoutEffect(() => {
    // ~287mm x 200mm usable area on A4 with the 0.5cm body padding below,
    // converted to CSS px at 96dpi, with only a hair of safety margin
    // (a 0.1% shave on the final scale) to absorb font-metric / rounding
    // differences across browsers — zoom is precise, so it doesn't need
    // the larger buffer the old transform-based approach needed.
    const USABLE_HEIGHT_PX = 1080;
    const USABLE_WIDTH_PX = 750;
    // Cap how far a short invoice can be stretched up, so a near-empty
    // invoice doesn't blow up into oversized, odd-looking text — this
    // still lets a normal invoice fill the page, just not without limit.
    const MAX_STRETCH = 1.35;

    function measure() {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const naturalHeight = sheet.scrollHeight;
      const naturalWidth = sheet.scrollWidth;
      if (!naturalHeight || !naturalWidth) return;
      // No longer capped at 1: content shorter than the page is scaled UP
      // to fill it (instead of leaving a large blank gap at the bottom),
      // and content taller than the page is still scaled down to fit, in
      // both cases keeping every font size, padding, and proportion in
      // the same ratio to every other.
      const rawScale = Math.min(USABLE_HEIGHT_PX / naturalHeight, USABLE_WIDTH_PX / naturalWidth);
      const scale = Math.min(rawScale, MAX_STRETCH) * 0.999;
      setPrintVars({ "--print-scale": scale });
    }

    measure();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
    window.addEventListener("beforeprint", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("beforeprint", measure);
      window.removeEventListener("resize", measure);
    };
  }, [invoice, business, client]);

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body, #root, .lg-app, .lg-app-shell, .lg-main-content {
            height: auto !important;
            min-height: 0 !important;
          }
          body { padding: 0.5cm !important; margin: 0 !important; }
          .lg-noprint { display: none !important; }
          .lg-print-scroll { overflow: visible !important; width: auto !important; }
          .lg-print-area {
            zoom: var(--print-scale, 1);
            page-break-inside: avoid;
          }
          .lg-print-area tr { page-break-inside: avoid; }
        }
      `}</style>
      <div className="lg-noprint" style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <button className="lg-btn" onClick={() => window.print()}><Printer size={14} /> Print / Save as PDF</button>
        <button className="lg-btn-ghost" onClick={onClose}><ChevronLeft size={14} /> Back</button>
      </div>

      <div className="lg-print-scroll resp-scroll-x" ref={scrollRef} style={printVars}>
      <div className="lg-print-area" ref={sheetRef} style={{ fontFamily: "Inter, sans-serif", color: "#000000", background: "#fff", maxWidth: 900, minWidth: 620, margin: "0 auto", border: "1px solid #000000" }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", padding: "4px 0", borderBottom: "1px solid #000000", color: "#8B0000" }}>
          JAY SWAMINARAYAN
        </div>

        <div style={{ background: "#fff", borderBottom: "1px solid #000000", padding: "8px 14px", textAlign: "center" }}>
          <span className="lg-display" style={{ fontSize: 22, fontWeight: 700, background: "#F5D98C", padding: "3px 14px", display: "block", marginLeft: -14, marginRight: -14, color: "#000000" }}>{business.name}</span>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 6, whiteSpace: "pre-line", color: "#000000" }}>{business.address}</div>
          {business.panNumber && business.panNumber.trim() && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 4, color: "#000000" }}>PAN: {business.panNumber}</div>}
          {business.gstNumber && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 4, color: "#000000" }}>GSTIN: {business.gstNumber}</div>}
          {business.phone && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 3, color: "#000000" }}>Mobile: {business.phone}</div>}
          {business.email && <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginTop: 3, color: "#000000" }}>Email: {business.email}</div>}
        </div>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", padding: "5px 0", borderBottom: "1px solid #000000", background: isCommissionInvoice(invoice) ? "transparent" : "#F7F3EA", color: "#000000" }}>
          {billTitleText.toUpperCase()}
        </div>

        {isCommissionInvoice(invoice) ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <Cell style={{ border: "none", borderRight: "1px solid #000000", fontSize: 13, fontWeight: 700 }}><b>Invoice no:</b> {invoice.number}</Cell>
            <Cell style={{ border: "none", textAlign: "right", fontSize: 13, fontWeight: 700 }}><b>Date:</b> {fmtDate(invoice.issueDate)}</Cell>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <Cell style={{ border: "none", borderRight: "1px solid #000000", fontSize: 14, fontWeight: 700 }}><b>Invoice no:</b> {invoice.number}</Cell>
            <Cell style={{ border: "none", borderRight: "1px solid #000000", textAlign: "center", fontSize: 14, fontWeight: 700 }}>
              <b>State:</b> {isIntra ? "Intra-state" : isInter ? "Inter-state" : "N/A"}
            </Cell>
            <Cell style={{ border: "none", textAlign: "right", fontSize: 14, fontWeight: 700 }}><b>Date:</b> {fmtDate(invoice.issueDate)}</Cell>
          </div>
        )}

        {!isCommissionInvoice(invoice) && invoice.shipDispatchType && invoice.shipDispatchName ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #000000" }}>
            <div style={{ borderRight: "1px solid #000000" }}>
              <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700 }}><b>Bill to:</b> {client?.name || "—"}</Cell>
              <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700, whiteSpace: "pre-line" }}><b>Address:</b> {client?.address}</Cell>
              <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700 }}><b>GST no:</b> {client?.gstNumber || "—"}</Cell>
              <Cell style={{ border: "none", fontSize: 14, fontWeight: 700 }}><b>State code:</b> {client?.stateCode || "—"}</Cell>
            </div>
            <div>
              <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700 }}>
                <b>{invoice.shipDispatchType === "shipTo" ? "Ship to:" : "Dispatch from:"}</b> {invoice.shipDispatchName}
              </Cell>
              <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700, whiteSpace: "pre-line" }}><b>Address:</b> {invoice.shipDispatchAddress}</Cell>
              <Cell style={{ border: "none", fontSize: 14, fontWeight: 700 }}><b>GST no:</b> {invoice.shipDispatchGst || "—"}</Cell>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid #000000" }}>
            <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700 }}>
              <b>{isCommissionInvoice(invoice) ? "Party name:" : "Bill to:"}</b> {client?.name || "—"}
            </Cell>
            <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700, whiteSpace: "pre-line" }}><b>Address:</b> {client?.address}</Cell>
            <Cell style={{ border: "none", borderBottom: "1px solid #000000", fontSize: 14, fontWeight: 700 }}><b>GST no:</b> {client?.gstNumber || "—"}</Cell>
            <Cell style={{ border: "none", fontSize: 14, fontWeight: 700 }}><b>State code:</b> {client?.stateCode || "—"}</Cell>
          </div>
        )}

        {invoice.notes && invoice.notes.trim() && (
          <div style={{ borderTop: "1px solid #000000" }}>
            <Cell style={{ border: "none", fontSize: 12, fontWeight: 600, whiteSpace: "pre-line" }}>{invoice.notes}</Cell>
          </div>
        )}

        {!isCommissionInvoice(invoice) && (invoice.transportName || invoice.vehicleNo) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #000000" }}>
            <Cell style={{ border: "none", borderRight: "1px solid #000000", fontSize: 14, fontWeight: 700 }}><b>Transport details:</b> {invoice.transportName || "—"}</Cell>
            <Cell style={{ border: "none", fontSize: 14, fontWeight: 700 }}><b>Vehicle no:</b> {invoice.vehicleNo || "—"}</Cell>
          </div>
        )}

        <table style={{ borderTop: "1px solid #000000", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            {isCommissionInvoice(invoice) ? (
              <tr style={{ background: "#F0DFC0" }}>
                <th style={{ border: "1px solid #000000", borderLeft: "none", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 36 }}>Sr.no</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 100, whiteSpace: "nowrap" }}>Date</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", textAlign: "left" }}>Party name</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 80 }}>Total weight</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 90 }}>Commission</th>
                <th style={{ border: "1px solid #000000", borderRight: "none", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 100 }}>Amount in {symbol}</th>
              </tr>
            ) : (
              <tr style={{ background: "#F0DFC0" }}>
                <th style={{ border: "1px solid #000000", borderLeft: "none", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 36 }}>Sr.no</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", textAlign: "left" }}>Description of goods</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 70 }}>HSN code</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 60 }}>Quantity</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 50 }}>Unit</th>
                <th style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 70 }}>Rate</th>
                <th style={{ border: "1px solid #000000", borderRight: "none", padding: "6px 4px", fontSize: 11, fontWeight: 700, color: "#000000", width: 90 }}>Amount</th>
              </tr>
            )}
          </thead>
          <tbody>
            {isCommissionInvoice(invoice)
              ? rows.map((li, idx) => (
                  <tr key={li.id || idx}>
                    <td style={{ border: "1px solid #000000", borderLeft: "none", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center", whiteSpace: "nowrap" }}>{formatDate(li.date)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000" }}>{li.partyName}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{fmtWeight(li.weight)}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.commission}</td>
                    <td className="lg-mono" style={{ border: "1px solid #000000", borderRight: "none", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "right" }}>
                      {money((Number(li.weight) || 0) * (Number(li.commission) || 0), symbol)}
                    </td>
                  </tr>
                ))
              : rows.map((li, idx) => (
                  <tr key={li.id || idx}>
                    <td style={{ border: "1px solid #000000", borderLeft: "none", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000" }}>{li.description}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.hsnCode}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.qty}</td>
                    <td style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "center" }}>{li.unit}</td>
                    <td className="lg-mono" style={{ border: "1px solid #000000", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "right" }}>{money(li.price, symbol)}</td>
                    <td className="lg-mono" style={{ border: "1px solid #000000", borderRight: "none", padding: "6px 4px", fontSize: 12, fontWeight: 600, color: "#000000", textAlign: "right" }}>
                      {money((Number(li.qty) || 0) * (Number(li.price) || 0), symbol)}
                    </td>
                  </tr>
                ))}
            {blankRowCount > 0 && (
              <tr>
                <td colSpan={isCommissionInvoice(invoice) ? 6 : 7} style={{ border: "1px solid #000000", borderTop: "none", borderLeft: "none", borderRight: "none", height: blankRowCount * 26 }}>
                  &nbsp;
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr" }}>
          <div style={{ borderRight: "1px solid #000000" }}>
            {/* Amount in Words */}
            <div style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000" }}>
              {amountInWords(grandTotal, "Rupees")}
            </div>

            {/* Bank Details */}
            <div style={{ padding: "6px 10px", borderBottom: "1px solid #000000" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#000000" }}>Bank details</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>Bank name: {business.bankName || "—"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>Branch name: {business.branchName || "—"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>A/C no: {business.accountNo || "—"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>IFSC code: {business.ifscCode || "—"}</div>
            </div>

            {/* Terms & Conditions */}
            <div style={{ padding: "6px 10px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: "#000000" }}>Terms & conditions</div>
              {terms.map((t, idx) => (
                <div key={idx} style={{ fontSize: 12.5, fontWeight: 600, color: "#000000", marginBottom: 2 }}>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ background: "#FBEEDD" }}>
                  <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000" }}>Sub total</td>
                  <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000", textAlign: "right" }}>
                    {money(totals.subtotal, symbol)}
                  </td>
                </tr>
                {isIntra && (
                  <>
                    <tr style={{ background: "#FBEEDD" }}>
                      <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000" }}>SGST {(Number(invoice.taxRate) / 2).toFixed(1)}%</td>
                      <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000", textAlign: "right" }}>
                        {money(halfTax, symbol)}
                      </td>
                    </tr>
                    <tr style={{ background: "#FBEEDD" }}>
                      <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000" }}>CGST {(Number(invoice.taxRate) / 2).toFixed(1)}%</td>
                      <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000", textAlign: "right" }}>
                        {money(halfTax, symbol)}
                      </td>
                    </tr>
                  </>
                )}
                {isInter && (
                  <tr style={{ background: "#FBEEDD" }}>
                    <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000" }}>IGST {Number(invoice.taxRate).toFixed(1)}%</td>
                    <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000", textAlign: "right" }}>
                      {money(totals.taxAmount, symbol)}
                    </td>
                  </tr>
                )}
                <tr style={{ background: "#FBEEDD" }}>
                  <td style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000" }}>Round off</td>
                  <td className="lg-mono" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#000000", borderBottom: "1px solid #000000", textAlign: "right" }}>
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
            <div style={{ borderTop: "1px solid #000000", padding: "6px 10px 22px" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#000000" }}>Signature &amp; stamp</div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}