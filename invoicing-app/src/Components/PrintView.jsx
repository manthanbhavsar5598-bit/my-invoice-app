import React from "react";
import { Printer, Download, ChevronLeft } from "lucide-react";

import {
  computeTotals,
  isCommissionInvoice,
  invoiceTitleLabel,
  fmtDate,
  escapeHtml,
  money,
  amountInWords,
} from "../utils/helpers";


// =========================================================
// DATE FORMATTER
// =========================================================

function formatDate(dateStr) {
  if (!dateStr) return "";

  const parts = dateStr.split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;

    return `${day}/${month}/${year}`;
  }

  return dateStr;
}


// =========================================================
// STANDALONE PRINT HTML
// =========================================================

function buildInvoiceHTML(
  invoice,
  business,
  client
) {
  const totals = computeTotals(invoice);

  const symbol =
    business.currencySymbol;

  const grandTotal =
    Math.round(totals.total);

  const roundOff =
    grandTotal - totals.total;

  const isIntra =
    invoice.stateType === "intra";

  const isInter =
    invoice.stateType === "inter";

  const halfTax =
    totals.taxAmount / 2;

  const terms =
    (business.terms || "")
      .split("\n")
      .filter(Boolean);

  const rows =
    invoice.lineItems.length
      ? invoice.lineItems
      : [];

  const MIN_ROWS = 10;

  const blankRowCount =
    Math.max(
      0,
      MIN_ROWS - rows.length
    );

  const commission =
    isCommissionInvoice(
      invoice
    );


  // =======================================================
  // ITEM HEADER
  // =======================================================

  const itemHeaderRow =
    commission
      ? `
        <tr style="background:#F0DFC0;">
          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:36px;">
            Sr.no
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:100px;white-space:nowrap;">
            Date
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;text-align:left;">
            Party name
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:80px;">
            Total weight
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:90px;">
            Commission
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:100px;">
            Amount in ${symbol}
          </th>
        </tr>
      `
      : `
        <tr style="background:#F0DFC0;">
          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:36px;">
            Sr.no
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;text-align:left;">
            Description of goods
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:70px;">
            HSN code
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:60px;">
            Quantity
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:50px;">
            Unit
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:70px;">
            Rate
          </th>

          <th style="border:1px solid #1F2A3C;padding:7px 4px;font-size:12px;font-weight:700;color:#111827;width:90px;">
            Amount
          </th>
        </tr>
      `;


  // =======================================================
  // ITEM ROWS
  // =======================================================

  const itemRows =
    commission
      ? rows
          .map(
            (li, idx) => `
              <tr>
                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;">
                  ${idx + 1}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;white-space:nowrap;">
                  ${formatDate(li.date)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;">
                  ${escapeHtml(li.partyName)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;">
                  ${escapeHtml(li.weight)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;">
                  ${escapeHtml(li.commission)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600;">
                  ${money(
                    (Number(li.weight) || 0) *
                      (Number(li.commission) || 0),
                    symbol
                  )}
                </td>
              </tr>
            `
          )
          .join("")
      : rows
          .map(
            (li, idx) => `
              <tr>
                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;">
                  ${idx + 1}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;">
                  ${escapeHtml(li.description)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;">
                  ${escapeHtml(li.hsnCode)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;">
                  ${escapeHtml(li.qty)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:center;">
                  ${escapeHtml(li.unit)}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600;">
                  ${money(
                    li.price,
                    symbol
                  )}
                </td>

                <td style="border:1px solid #1F2A3C;padding:7px 4px;font-size:13px;color:#111827;text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600;">
                  ${money(
                    (Number(li.qty) || 0) *
                      (Number(li.price) || 0),
                    symbol
                  )}
                </td>
              </tr>
            `
          )
          .join("");


  // =======================================================
  // BLANK ROWS
  // =======================================================

  const blankCols =
    commission ? 6 : 7;

  const blankRows =
    blankRowCount > 0
      ? `
        <tr>
          <td
            colspan="${blankCols}"
            style="
              border:1px solid #1F2A3C;
              border-top:none;
              height:${blankRowCount * 26}px;
              color:#111827;
            "
          >
            &nbsp;
          </td>
        </tr>
      `
      : "";


  // =======================================================
  // GST ROWS
  // =======================================================

  const gstRows =
    isIntra
      ? `
        <tr style="background:#FBEEDD;">
          <td style="padding:8px 10px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;">
            SGST ${(Number(invoice.taxRate) / 2).toFixed(1)}%
          </td>

          <td style="padding:8px 10px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;">
            ${symbol}
          </td>

          <td style="padding:8px 10px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">
            ${halfTax.toFixed(2)}
          </td>
        </tr>

        <tr style="background:#FBEEDD;">
          <td style="padding:8px 10px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;">
            CGST ${(Number(invoice.taxRate) / 2).toFixed(1)}%
          </td>

          <td style="padding:8px 10px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;">
            ${symbol}
          </td>

          <td style="padding:8px 10px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">
            ${halfTax.toFixed(2)}
          </td>
        </tr>
      `
      : isInter
      ? `
        <tr style="background:#FBEEDD;">
          <td style="padding:8px 10px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;">
            IGST ${Number(invoice.taxRate).toFixed(1)}%
          </td>

          <td style="padding:8px 10px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;">
            ${symbol}
          </td>

          <td style="padding:8px 10px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #1F2A3C;text-align:right;font-family:'IBM Plex Mono',monospace;">
            ${totals.taxAmount.toFixed(2)}
          </td>
        </tr>
      `
      : "";


  // =======================================================
  // STANDALONE HTML
  // =======================================================

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8">

<title>
  ${escapeHtml(invoice.number)}
</title>

<style>

  @import url(
    'https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap'
  );

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', sans-serif;

    color: #111827;

    background: #fff;

    margin: 0;

    padding: 24px;

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;

    font-weight: 500;
  }

  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  .toolbar button {
    font-family: 'Inter', sans-serif;

    border: 1px solid #1F2A3C;

    background: #1F2A3C;

    color: #F7F3EA;

    padding: 9px 16px;

    border-radius: 4px;

    font-size: 13px;

    font-weight: 600;

    cursor: pointer;
  }

  .sheet {
    max-width: 900px;

    margin: 0 auto;

    border: 1px solid #1F2A3C;

    color: #111827;
  }

  .sheet td,
  .sheet th {
    color: #111827;
  }

  .sheet strong,
  .sheet b {
    color: #111111;
  }

  .jay-heading {
    color: #C62828 !important;

    font-size: 16px;

    font-weight: 800;

    letter-spacing: 0.08em;

    padding: 8px 0;
  }

  .transport-section {
    font-size: 14px !important;

    font-weight: 600 !important;

    color: #111827 !important;
  }

  .bank-section {
    color: #111827 !important;

    font-size: 14px !important;

    font-weight: 600 !important;
  }

  .bank-title {
    font-size: 15px !important;

    font-weight: 800 !important;

    color: #111111 !important;

    margin-bottom: 5px;
  }

  .tax-section td {
    font-size: 14px !important;

    font-weight: 600 !important;

    color: #111827 !important;
  }

  .tax-section .tax-value {
    font-family:
      'IBM Plex Mono',
      monospace;

    font-weight: 600 !important;
  }

  .grand-total-row td {
    font-size: 15px !important;

    font-weight: 800 !important;

    color: #111111 !important;
  }

  @media print {

    .toolbar {
      display: none;
    }

    body {
      padding: 0;

      color: #111111 !important;
    }

    .sheet {
      color: #111111 !important;
    }

    .sheet td,
    .sheet th {
      color: #111111;
    }

    .jay-heading {
      color: #C62828 !important;
    }

    .transport-section,
    .bank-section,
    .tax-section td {
      color: #111111 !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }

</style>

</head>

<body>

  <div class="toolbar">

    <button onclick="window.print()">
      Print / Save as PDF
    </button>

  </div>


  <div class="sheet">

    <!-- =================================================
         JAY SWAMINARAYAN
         ================================================= -->

    <div
      class="jay-heading"
      style="
        text-align:center;
        border-bottom:1px solid #1F2A3C;
      "
    >
      JAY SWAMINARAYAN
    </div>


    <!-- =================================================
         BUSINESS HEADER
         ================================================= -->

    <div
      style="
        background:#fff;
        border-bottom:1px solid #1F2A3C;
        padding:12px 16px;
        text-align:center;
        color:#111827;
      "
    >

      <span
        style="
          font-family:'Zilla Slab',serif;
          font-size:22px;
          font-weight:800;
          color:#111111;
          background:transparent;
          padding:2px 12px;
          display:inline-block;
        "
      >
        ${escapeHtml(business.name)}
      </span>

      <div
        style="
          font-size:14px;
          font-weight:700;
          color:#111827;
          text-transform:uppercase;
          margin-top:6px;
          white-space:pre-line;
        "
      >
        ${escapeHtml(
          business.address
        )}
      </div>

      <div
        style="
          font-size:14px;
          font-weight:700;
          color:#111827;
          text-transform:uppercase;
          margin-top:4px;
        "
      >
        ${
          business.gstNumber
            ? `GSTIN: ${escapeHtml(
                business.gstNumber
              )}&nbsp;&nbsp;`
            : ""
        }

        ${
          business.phone
            ? `Tel: ${escapeHtml(
                business.phone
              )}&nbsp;&nbsp;`
            : ""
        }

        ${escapeHtml(
          business.email
        )}
      </div>

    </div>


    <!-- =================================================
         BILL TITLE
         ================================================= -->

    <div
      style="
        text-align:center;
        font-weight:800;
        font-size:14px;
        letter-spacing:0.08em;
        color:#111111;
        padding:7px 0;
        border-bottom:1px solid #1F2A3C;
        background:${commission ? "transparent" : "#F7F3EA"};
      "
    >
      ${escapeHtml(
        invoiceTitleLabel(
          invoice.billType
        ).toUpperCase()
      )}
    </div>


    <!-- =================================================
         INVOICE HEADER
         ================================================= -->

    ${
      commission
        ? `
          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
            "
          >

            <div
              style="
                border:1px solid #1F2A3C;
                border-right:0;
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
              "
            >
              <b>Invoice no:</b>
              ${escapeHtml(
                invoice.number
              )}
            </div>

            <div
              style="
                border:1px solid #1F2A3C;
                border-left:0;
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
                text-align:right;
              "
            >
              <b>Date:</b>
              ${fmtDate(
                invoice.issueDate
              )}
            </div>

          </div>
        `
        : `
          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr 1fr;
            "
          >

            <div
              style="
                border:1px solid #1F2A3C;
                border-right:0;
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
              "
            >
              <b>Invoice no:</b>
              ${escapeHtml(
                invoice.number
              )}
            </div>

            <div
              style="
                border:1px solid #1F2A3C;
                border-left:0;
                border-right:0;
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
                text-align:center;
              "
            >
              <b>State:</b>
              ${
                isIntra
                  ? "Intra-state"
                  : isInter
                  ? "Inter-state"
                  : "N/A"
              }
            </div>

            <div
              style="
                border:1px solid #1F2A3C;
                border-left:0;
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
                text-align:right;
              "
            >
              <b>Date:</b>
              ${fmtDate(
                invoice.issueDate
              )}
            </div>

          </div>
        `
    }


    <!-- =================================================
         BILL TO / SHIP TO
         ================================================= -->

    ${
      !commission &&
      invoice.shipDispatchType &&
      invoice.shipDispatchName
        ? `
          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              border-top:1px solid #1F2A3C;
            "
          >

            <div
              style="
                border-right:1px solid #1F2A3C;
              "
            >

              <div
                style="
                  padding:7px 8px;
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                "
              >
                <b>Bill to:</b>
                ${escapeHtml(
                  client?.name || "—"
                )}
              </div>

              <div
                style="
                  padding:7px 8px;
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                  white-space:pre-line;
                "
              >
                <b>Address:</b>
                ${escapeHtml(
                  client?.address
                )}
              </div>

              <div
                style="
                  padding:7px 8px;
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                "
              >
                <b>GST no:</b>
                ${escapeHtml(
                  client?.gstNumber ||
                    "—"
                )}
              </div>

              <div
                style="
                  padding:7px 8px;
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                "
              >
                <b>State code:</b>
                ${escapeHtml(
                  client?.stateCode ||
                    "—"
                )}
              </div>

            </div>


            <div>

              <div
                style="
                  padding:7px 8px;
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                "
              >
                <b>
                  ${
                    invoice.shipDispatchType ===
                    "shipTo"
                      ? "Ship to:"
                      : "Dispatch from:"
                  }
                </b>

                ${escapeHtml(
                  invoice.shipDispatchName
                )}
              </div>

              <div
                style="
                  padding:7px 8px;
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                  white-space:pre-line;
                "
              >
                <b>Address:</b>
                ${escapeHtml(
                  invoice.shipDispatchAddress
                )}
              </div>

              <div
                style="
                  padding:7px 8px;
                  font-size:14px;
                  font-weight:700;
                  color:#111827;
                "
              >
                <b>GST no:</b>
                ${escapeHtml(
                  invoice.shipDispatchGst ||
                    "—"
                )}
              </div>

            </div>

          </div>
        `
        : `
          <div
            style="
              border-top:1px solid #1F2A3C;
            "
          >

            <div
              style="
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
                border-bottom:1px solid #1F2A3C;
              "
            >
              <b>
                ${
                  commission
                    ? "Party name:"
                    : "Bill to:"
                }
              </b>

              ${escapeHtml(
                client?.name || "—"
              )}
            </div>

            <div
              style="
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
                border-bottom:1px solid #1F2A3C;
                white-space:pre-line;
              "
            >
              <b>Address:</b>
              ${escapeHtml(
                client?.address
              )}
            </div>

            <div
              style="
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
                border-bottom:1px solid #1F2A3C;
              "
            >
              <b>GST no:</b>
              ${escapeHtml(
                client?.gstNumber ||
                  "—"
              )}
            </div>

            <div
              style="
                padding:7px 8px;
                font-size:14px;
                font-weight:700;
                color:#111827;
              "
            >
              <b>State code:</b>
              ${escapeHtml(
                client?.stateCode ||
                  "—"
              )}
            </div>

          </div>
        `
    }


    <!-- =================================================
         NOTES
         ================================================= -->

    ${
      invoice.notes &&
      invoice.notes.trim()
        ? `
          <div
            style="
              border-top:1px solid #1F2A3C;
            "
          >
            <div
              style="
                padding:7px 8px;
                font-size:13px;
                font-weight:500;
                color:#111827;
                white-space:pre-line;
              "
            >
              ${escapeHtml(
                invoice.notes
              )}
            </div>
          </div>
        `
        : ""
    }


    <!-- =================================================
         TRANSPORT DETAILS
         ================================================= -->

    ${
      !commission &&
      (invoice.transportName ||
        invoice.vehicleNo)
        ? `
          <div
            class="transport-section"
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              border-top:1px solid #1F2A3C;
            "
          >

            <div
              style="
                border:1px solid #1F2A3C;
                border-right:0;
                padding:9px 10px;
                font-size:14px;
                font-weight:600;
                color:#111827;
              "
            >
              <b>Transport details:</b>
              ${escapeHtml(
                invoice.transportName ||
                  "—"
              )}
            </div>

            <div
              style="
                border:1px solid #1F2A3C;
                border-left:0;
                padding:9px 10px;
                font-size:14px;
                font-weight:600;
                color:#111827;
              "
            >
              <b>Vehicle no:</b>
              ${escapeHtml(
                invoice.vehicleNo ||
                  "—"
              )}
            </div>

          </div>
        `
        : ""
    }


    <!-- =================================================
         ITEMS TABLE
         ================================================= -->

    <table
      style="
        border-top:1px solid #1F2A3C;
        width:100%;
        border-collapse:collapse;
      "
    >

      <thead>
        ${itemHeaderRow}
      </thead>

      <tbody>
        ${itemRows}
        ${blankRows}
      </tbody>

    </table>


    <!-- =================================================
         BOTTOM SECTION
         ================================================= -->

    <div
      style="
        display:grid;
        grid-template-columns:1.4fr 1fr;
      "
    >

      <!-- LEFT SIDE -->

      <div
        style="
          border-right:1px solid #1F2A3C;
        "
      >

        <!-- AMOUNT IN WORDS -->

        <div
          style="
            padding:9px 10px;
            font-size:14px;
            font-weight:700;
            color:#111111;
            border-bottom:1px solid #1F2A3C;
          "
        >
          ${escapeHtml(
            amountInWords(
              grandTotal,
              "Rupees"
            )
          )}
        </div>


        <!-- BANK DETAILS -->

        <div
          class="bank-section"
          style="
            padding:10px;
            border-bottom:1px solid #1F2A3C;
            color:#111827;
            font-size:14px;
            font-weight:600;
          "
        >

          <div
            class="bank-title"
            style="
              font-weight:800;
              font-size:15px;
              color:#111111;
              margin-bottom:6px;
            "
          >
            Bank details
          </div>

          <div
            style="
              font-size:14px;
              line-height:1.55;
              color:#111827;
            "
          >
            Bank name:
            ${escapeHtml(
              business.bankName ||
                "—"
            )}
          </div>

          <div
            style="
              font-size:14px;
              line-height:1.55;
              color:#111827;
            "
          >
            Branch name:
            ${escapeHtml(
              business.branchName ||
                "—"
            )}
          </div>

          <div
            style="
              font-size:14px;
              line-height:1.55;
              color:#111827;
            "
          >
            A/C no:
            ${escapeHtml(
              business.accountNo ||
                "—"
            )}
          </div>

          <div
            style="
              font-size:14px;
              line-height:1.55;
              color:#111827;
            "
          >
            IFSC code:
            ${escapeHtml(
              business.ifscCode ||
                "—"
            )}
          </div>

        </div>


        <!-- TERMS -->

        <div
          style="
            padding:9px 10px;
          "
        >

          <div
            style="
              font-weight:800;
              font-size:14px;
              color:#111111;
              margin-bottom:5px;
            "
          >
            Terms &amp; conditions
          </div>

          ${terms
            .map(
              (t) => `
                <div
                  style="
                    font-size:13px;
                    font-weight:500;
                    color:#111827;
                    margin-bottom:3px;
                    line-height:1.4;
                  "
                >
                  ${escapeHtml(t)}
                </div>
              `
            )
            .join("")}

        </div>

      </div>


      <!-- RIGHT SIDE TAX -->

      <div>

        <table
          class="tax-section"
          style="
            width:100%;
            border-collapse:collapse;
          "
        >

          <tbody>

            <!-- SUBTOTAL -->

            <tr
              style="
                background:#FBEEDD;
              "
            >

              <td
                style="
                  padding:8px 10px;
                  font-size:14px;
                  font-weight:600;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                "
              >
                Sub total
              </td>

              <td
                style="
                  padding:8px 10px;
                  font-size:13px;
                  font-weight:600;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                  width:20px;
                "
              >
                ${symbol}
              </td>

              <td
                class="tax-value"
                style="
                  padding:8px 10px;
                  font-size:14px;
                  font-weight:600;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                  text-align:right;
                  font-family:'IBM Plex Mono',monospace;
                "
              >
                ${totals.subtotal.toFixed(2)}
              </td>

            </tr>


            <!-- GST -->

            ${gstRows}


            <!-- ROUND OFF -->

            <tr
              style="
                background:#FBEEDD;
              "
            >

              <td
                style="
                  padding:8px 10px;
                  font-size:14px;
                  font-weight:600;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                "
              >
                Round off
              </td>

              <td
                style="
                  padding:8px 10px;
                  font-size:13px;
                  font-weight:600;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                "
              >
                ${symbol}
              </td>

              <td
                class="tax-value"
                style="
                  padding:8px 10px;
                  font-size:14px;
                  font-weight:600;
                  color:#111827;
                  border-bottom:1px solid #1F2A3C;
                  text-align:right;
                  font-family:'IBM Plex Mono',monospace;
                "
              >
                ${roundOff.toFixed(2)}
              </td>

            </tr>


            <!-- GRAND TOTAL -->

            <tr
              class="grand-total-row"
              style="
                background:#F5D98C;
              "
            >

              <td
                style="
                  padding:9px 10px;
                  font-size:15px;
                  font-weight:800;
                  color:#111111;
                "
              >
                Grand total
              </td>

              <td
                style="
                  padding:9px 10px;
                  font-size:13px;
                  font-weight:800;
                  color:#111111;
                "
              >
                ${symbol}
              </td>

              <td
                style="
                  padding:9px 10px;
                  font-size:15px;
                  font-weight:800;
                  color:#111111;
                  text-align:right;
                  font-family:'IBM Plex Mono',monospace;
                "
              >
                ${grandTotal.toFixed(2)}
              </td>

            </tr>

          </tbody>

        </table>


        <!-- SIGNATURE -->

        <div
          style="
            border-top:1px solid #1F2A3C;
            padding:9px 10px;
          "
        >

          <div
            style="
              font-weight:800;
              font-size:13px;
              color:#111111;
              margin-bottom:6px;
            "
          >
            Signature &amp; stamp
          </div>

          <div
            style="
              border:1px solid #1F2A3C;
              height:70px;
            "
          ></div>

        </div>

      </div>

    </div>

  </div>

</body>

</html>
`;
}


// =========================================================
// SMALL CELL COMPONENT
// =========================================================

function Cell({
  children,
  style,
}) {
  return (
    <div
      style={{
        border:
          "1px solid #1F2A3C",

        padding:
          "7px 8px",

        fontSize:
          14,

        fontWeight:
          600,

        color:
          "#111827",

        ...style,
      }}
    >
      {children}
    </div>
  );
}


// =========================================================
// PRINT VIEW
// =========================================================

export default function PrintView({
  invoice,
  business,
  client,
  onClose,
}) {
  const totals =
    computeTotals(invoice);

  const symbol =
    business.currencySymbol;

  const grandTotal =
    Math.round(totals.total);

  const roundOff =
    grandTotal - totals.total;

  const isIntra =
    invoice.stateType === "intra";

  const isInter =
    invoice.stateType === "inter";

  const halfTax =
    totals.taxAmount / 2;

  const terms =
    (business.terms || "")
      .split("\n")
      .filter(Boolean);

  const rows =
    invoice.lineItems.length
      ? invoice.lineItems
      : [];

  const MIN_ROWS = 10;

  const blankRowCount =
    Math.max(
      0,
      MIN_ROWS - rows.length
    );

  const commission =
    isCommissionInvoice(
      invoice
    );


  // =======================================================
  // DOWNLOAD HTML
  // =======================================================

  function downloadStandaloneHTML() {
    const html =
      buildInvoiceHTML(
        invoice,
        business,
        client
      );

    const blob =
      new Blob(
        [html],
        {
          type:
            "text/html;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      `${
        invoice.number ||
        "invoice"
      }.html`;

    document.body.appendChild(
      a
    );

    a.click();

    document.body.removeChild(
      a
    );

    URL.revokeObjectURL(
      url
    );
  }


  // =======================================================
  // PRINT VIEW
  // =======================================================

  return (
    <div>

      {/* =================================================
          PRINT BUTTONS
          ================================================= */}

      <div
        className="lg-noprint"
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >

        <button
          className="lg-btn"
          onClick={() =>
            window.print()
          }
        >
          <Printer
            size={14}
          />

          Print / Save as PDF
        </button>


        <button
          className="lg-btn-ghost"
          onClick={
            downloadStandaloneHTML
          }
        >
          <Download
            size={14}
          />

          Download printable file
        </button>


        <button
          className="lg-btn-ghost"
          onClick={onClose}
        >
          <ChevronLeft
            size={14}
          />

          Back
        </button>

      </div>


      <div
        className="lg-noprint"
        style={{
          fontSize: 12,
          color:
            "#374151",
          marginBottom: 16,
          maxWidth: 500,
        }}
      >
        If the print button above
        doesn't open a dialog, use
        "Download printable file" —
        open the downloaded file in
        your browser and print or
        save it as a PDF from there.
      </div>


      {/* =================================================
          PRINT SHEET
          ================================================= */}

      <div
        className="lg-print-area"
        style={{
          fontFamily:
            "Inter, sans-serif",

          color:
            "#111827",

          background:
            "#fff",

          maxWidth:
            900,

          margin:
            "0 auto",

          border:
            "1px solid #1F2A3C",

          fontWeight:
            500,

          WebkitPrintColorAdjust:
            "exact",

          printColorAdjust:
            "exact",
        }}
      >

        {/* ===============================================
            JAY SWAMINARAYAN
            =============================================== */}

        <div
          style={{
            textAlign:
              "center",

            fontWeight:
              800,

            fontSize:
              16,

            letterSpacing:
              "0.08em",

            padding:
              "8px 0",

            borderBottom:
              "1px solid #1F2A3C",

            color:
              "#C62828",
          }}
        >
          JAY SWAMINARAYAN
        </div>


        {/* ===============================================
            BUSINESS HEADER
            =============================================== */}

        <div
          style={{
            background:
              "#fff",

            borderBottom:
              "1px solid #1F2A3C",

            padding:
              "12px 16px",

            textAlign:
              "center",

            color:
              "#111827",
          }}
        >

          <span
            className="lg-display"
            style={{
              fontSize:
                22,

              fontWeight:
                800,

              color:
                "#111111",

              background:
                "transparent",

              padding:
                "2px 12px",

              display:
                "inline-block",
            }}
          >
            {business.name}
          </span>


          <div
            style={{
              fontSize:
                14,

              fontWeight:
                700,

              color:
                "#111827",

              textTransform:
                "uppercase",

              marginTop:
                6,

              whiteSpace:
                "pre-line",
            }}
          >
            {business.address}
          </div>


          <div
            style={{
              fontSize:
                14,

              fontWeight:
                700,

              color:
                "#111827",

              textTransform:
                "uppercase",

              marginTop:
                4,
            }}
          >

            {business.gstNumber && (
              <>
                GSTIN:
                {" "}
                {business.gstNumber}
                {"  "}
              </>
            )}

            {business.phone && (
              <>
                Tel:
                {" "}
                {business.phone}
                {"  "}
              </>
            )}

            {business.email}

          </div>

        </div>


        {/* ===============================================
            BILL TITLE
            =============================================== */}

        <div
          style={{
            textAlign:
              "center",

            fontWeight:
              800,

            fontSize:
              14,

            letterSpacing:
              "0.08em",

            padding:
              "7px 0",

            borderBottom:
              "1px solid #1F2A3C",

            background:
              commission
                ? "transparent"
                : "#F7F3EA",

            color:
              "#111111",
          }}
        >
          {invoiceTitleLabel(
            invoice.billType
          ).toUpperCase()}
        </div>


        {/* ===============================================
            INVOICE HEADER
            =============================================== */}

        {commission ? (

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "1fr 1fr",
            }}
          >

            <Cell
              style={{
                borderRight:
                  0,

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                Invoice no:
              </b>

              {" "}

              {invoice.number}
            </Cell>


            <Cell
              style={{
                borderLeft:
                  0,

                textAlign:
                  "right",

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                Date:
              </b>

              {" "}

              {fmtDate(
                invoice.issueDate
              )}
            </Cell>

          </div>

        ) : (

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "1fr 1fr 1fr",
            }}
          >

            <Cell
              style={{
                borderRight:
                  0,

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                Invoice no:
              </b>

              {" "}

              {invoice.number}
            </Cell>


            <Cell
              style={{
                borderRight:
                  0,

                borderLeft:
                  0,

                textAlign:
                  "center",

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                State:
              </b>

              {" "}

              {isIntra
                ? "Intra-state"
                : isInter
                ? "Inter-state"
                : "N/A"}
            </Cell>


            <Cell
              style={{
                borderLeft:
                  0,

                textAlign:
                  "right",

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                Date:
              </b>

              {" "}

              {fmtDate(
                invoice.issueDate
              )}
            </Cell>

          </div>

        )}


        {/* ===============================================
            BILL TO / SHIP TO
            =============================================== */}

        {!commission &&
        invoice.shipDispatchType &&
        invoice.shipDispatchName ? (

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "1fr 1fr",

              borderTop:
                "1px solid #1F2A3C",
            }}
          >

            <div
              style={{
                borderRight:
                  "1px solid #1F2A3C",
              }}
            >

              <Cell
                style={{
                  border:
                    "none",

                  borderBottom:
                    "1px solid #1F2A3C",

                  fontSize:
                    14,

                  fontWeight:
                    700,
                }}
              >
                <b>
                  Bill to:
                </b>

                {" "}

                {client?.name ||
                  "—"}
              </Cell>


              <Cell
                style={{
                  border:
                    "none",

                  borderBottom:
                    "1px solid #1F2A3C",

                  fontSize:
                    14,

                  fontWeight:
                    700,

                  whiteSpace:
                    "pre-line",
                }}
              >
                <b>
                  Address:
                </b>

                {" "}

                {client?.address}
              </Cell>


              <Cell
                style={{
                  border:
                    "none",

                  borderBottom:
                    "1px solid #1F2A3C",

                  fontSize:
                    14,

                  fontWeight:
                    700,
                }}
              >
                <b>
                  GST no:
                </b>

                {" "}

                {client?.gstNumber ||
                  "—"}
              </Cell>


              <Cell
                style={{
                  border:
                    "none",

                  fontSize:
                    14,

                  fontWeight:
                    700,
                }}
              >
                <b>
                  State code:
                </b>

                {" "}

                {client?.stateCode ||
                  "—"}
              </Cell>

            </div>


            <div>

              <Cell
                style={{
                  border:
                    "none",

                  borderBottom:
                    "1px solid #1F2A3C",

                  fontSize:
                    14,

                  fontWeight:
                    700,
                }}
              >
                <b>
                  {
                    invoice.shipDispatchType ===
                    "shipTo"
                      ? "Ship to:"
                      : "Dispatch from:"
                  }
                </b>

                {" "}

                {
                  invoice.shipDispatchName
                }
              </Cell>


              <Cell
                style={{
                  border:
                    "none",

                  borderBottom:
                    "1px solid #1F2A3C",

                  fontSize:
                    14,

                  fontWeight:
                    700,

                  whiteSpace:
                    "pre-line",
                }}
              >
                <b>
                  Address:
                </b>

                {" "}

                {
                  invoice.shipDispatchAddress
                }
              </Cell>


              <Cell
                style={{
                  border:
                    "none",

                  fontSize:
                    14,

                  fontWeight:
                    700,
                }}
              >
                <b>
                  GST no:
                </b>

                {" "}

                {
                  invoice.shipDispatchGst ||
                  "—"
                }
              </Cell>

            </div>

          </div>

        ) : (

          <div
            style={{
              borderTop:
                "1px solid #1F2A3C",
            }}
          >

            <Cell
              style={{
                border:
                  "none",

                borderBottom:
                  "1px solid #1F2A3C",

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                {
                  commission
                    ? "Party name:"
                    : "Bill to:"
                }
              </b>

              {" "}

              {client?.name ||
                "—"}
            </Cell>


            <Cell
              style={{
                border:
                  "none",

                borderBottom:
                  "1px solid #1F2A3C",

                fontSize:
                  14,

                fontWeight:
                  700,

                whiteSpace:
                  "pre-line",
              }}
            >
              <b>
                Address:
              </b>

              {" "}

              {client?.address}
            </Cell>


            <Cell
              style={{
                border:
                  "none",

                borderBottom:
                  "1px solid #1F2A3C",

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                GST no:
              </b>

              {" "}

              {client?.gstNumber ||
                "—"}
            </Cell>


            <Cell
              style={{
                border:
                  "none",

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              <b>
                State code:
              </b>

              {" "}

              {client?.stateCode ||
                "—"}
            </Cell>

          </div>

        )}


        {/* ===============================================
            NOTES
            =============================================== */}

        {invoice.notes &&
          invoice.notes.trim() && (

            <div
              style={{
                borderTop:
                  "1px solid #1F2A3C",
              }}
            >

              <Cell
                style={{
                  border:
                    "none",

                  fontSize:
                    13,

                  fontWeight:
                    500,

                  whiteSpace:
                    "pre-line",
                }}
              >
                {invoice.notes}
              </Cell>

            </div>

          )}


        {/* ===============================================
            TRANSPORT DETAILS
            =============================================== */}

        {!commission &&
          (invoice.transportName ||
            invoice.vehicleNo) && (

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                borderTop:
                  "1px solid #1F2A3C",
              }}
            >

              <Cell
                style={{
                  borderRight:
                    0,

                  fontSize:
                    14,

                  fontWeight:
                    600,

                  color:
                    "#111827",

                  padding:
                    "9px 10px",
                }}
              >
                <b>
                  Transport details:
                </b>

                {" "}

                {invoice.transportName ||
                  "—"}
              </Cell>


              <Cell
                style={{
                  borderLeft:
                    0,

                  fontSize:
                    14,

                  fontWeight:
                    600,

                  color:
                    "#111827",

                  padding:
                    "9px 10px",
                }}
              >
                <b>
                  Vehicle no:
                </b>

                {" "}

                {invoice.vehicleNo ||
                  "—"}
              </Cell>

            </div>

          )}


        {/* ===============================================
            ITEMS TABLE
            =============================================== */}

        <table
          style={{
            borderTop:
              "1px solid #1F2A3C",

            width:
              "100%",

            borderCollapse:
              "collapse",

            color:
              "#111827",
          }}
        >

          <thead>

            {commission ? (

              <tr
                style={{
                  background:
                    "#F0DFC0",
                }}
              >

                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      36,
                  }}
                >
                  Sr.no
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      100,

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  Date
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    textAlign:
                      "left",
                  }}
                >
                  Party name
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      80,
                  }}
                >
                  Total weight
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      90,
                  }}
                >
                  Commission
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      100,
                  }}
                >
                  Amount in {symbol}
                </th>

              </tr>

            ) : (

              <tr
                style={{
                  background:
                    "#F0DFC0",
                }}
              >

                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      36,
                  }}
                >
                  Sr.no
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    textAlign:
                      "left",
                  }}
                >
                  Description of goods
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      70,
                  }}
                >
                  HSN code
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      60,
                  }}
                >
                  Quantity
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      50,
                  }}
                >
                  Unit
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      70,
                  }}
                >
                  Rate
                </th>


                <th
                  style={{
                    border:
                      "1px solid #1F2A3C",

                    padding:
                      "7px 4px",

                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#111827",

                    width:
                      90,
                  }}
                >
                  Amount
                </th>

              </tr>

            )}

          </thead>


          <tbody>

            {commission
              ? rows.map(
                  (
                    li,
                    idx
                  ) => (

                    <tr
                      key={
                        li.id ||
                        idx
                      }
                    >

                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",
                        }}
                      >
                        {idx + 1}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {formatDate(
                          li.date
                        )}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",
                        }}
                      >
                        {li.partyName}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",
                        }}
                      >
                        {li.weight}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",
                        }}
                      >
                        {
                          li.commission
                        }
                      </td>


                      <td
                        className="lg-mono"
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            600,

                          color:
                            "#111111",

                          textAlign:
                            "right",
                        }}
                      >
                        {money(
                          (Number(
                            li.weight
                          ) || 0) *
                            (Number(
                              li.commission
                            ) || 0),
                          symbol
                        )}
                      </td>

                    </tr>

                  )
                )
              : rows.map(
                  (
                    li,
                    idx
                  ) => (

                    <tr
                      key={
                        li.id ||
                        idx
                      }
                    >

                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",
                        }}
                      >
                        {idx + 1}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",
                        }}
                      >
                        {li.description}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",
                        }}
                      >
                        {li.hsnCode}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",
                        }}
                      >
                        {li.qty}
                      </td>


                      <td
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            500,

                          color:
                            "#111827",

                          textAlign:
                            "center",
                        }}
                      >
                        {li.unit}
                      </td>


                      <td
                        className="lg-mono"
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            600,

                          color:
                            "#111111",

                          textAlign:
                            "right",
                        }}
                      >
                        {money(
                          li.price,
                          symbol
                        )}
                      </td>


                      <td
                        className="lg-mono"
                        style={{
                          border:
                            "1px solid #1F2A3C",

                          padding:
                            "7px 4px",

                          fontSize:
                            13,

                          fontWeight:
                            600,

                          color:
                            "#111111",

                          textAlign:
                            "right",
                        }}
                      >
                        {money(
                          (Number(
                            li.qty
                          ) || 0) *
                            (Number(
                              li.price
                            ) || 0),
                          symbol
                        )}
                      </td>

                    </tr>

                  )
                )}


            {/* BLANK ROW */}

            {blankRowCount >
              0 && (

              <tr>

                <td
                  colSpan={
                    commission
                      ? 6
                      : 7
                  }

                  style={{
                    border:
                      "1px solid #1F2A3C",

                    borderTop:
                      "none",

                    height:
                      blankRowCount *
                      26,

                    color:
                      "#111827",
                  }}
                >
                  &nbsp;
                </td>

              </tr>

            )}

          </tbody>

        </table>


        {/* ===============================================
            FINAL SECTION
            =============================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1.4fr 1fr",
          }}
        >

          {/* LEFT */}

          <div
            style={{
              borderRight:
                "1px solid #1F2A3C",
            }}
          >

            {/* AMOUNT WORDS */}

            <div
              style={{
                padding:
                  "9px 10px",

                fontSize:
                  14,

                fontWeight:
                  700,

                color:
                  "#111111",

                borderBottom:
                  "1px solid #1F2A3C",
              }}
            >
              {amountInWords(
                grandTotal,
                "Rupees"
              )}
            </div>


            {/* BANK DETAILS */}

            <div
              style={{
                padding:
                  "10px",

                borderBottom:
                  "1px solid #1F2A3C",

                color:
                  "#111827",
              }}
            >

              <div
                style={{
                  fontWeight:
                    800,

                  fontSize:
                    15,

                  color:
                    "#111111",

                  marginBottom:
                    6,
                }}
              >
                Bank details
              </div>


              <div
                style={{
                  fontSize:
                    14,

                  fontWeight:
                    600,

                  color:
                    "#111827",

                  lineHeight:
                    1.55,
                }}
              >
                Bank name:
                {" "}
                {business.bankName ||
                  "—"}
              </div>


              <div
                style={{
                  fontSize:
                    14,

                  fontWeight:
                    600,

                  color:
                    "#111827",

                  lineHeight:
                    1.55,
                }}
              >
                Branch name:
                {" "}
                {business.branchName ||
                  "—"}
              </div>


              <div
                style={{
                  fontSize:
                    14,

                  fontWeight:
                    600,

                  color:
                    "#111827",

                  lineHeight:
                    1.55,
                }}
              >
                A/C no:
                {" "}
                {business.accountNo ||
                  "—"}
              </div>


              <div
                style={{
                  fontSize:
                    14,

                  fontWeight:
                    600,

                  color:
                    "#111827",

                  lineHeight:
                    1.55,
                }}
              >
                IFSC code:
                {" "}
                {business.ifscCode ||
                  "—"}
              </div>

            </div>


            {/* TERMS */}

            <div
              style={{
                padding:
                  "9px 10px",
              }}
            >

              <div
                style={{
                  fontWeight:
                    800,

                  fontSize:
                    14,

                  color:
                    "#111111",

                  marginBottom:
                    5,
                }}
              >
                Terms &amp; conditions
              </div>


              {terms.map(
                (
                  t,
                  idx
                ) => (

                  <div
                    key={idx}
                    style={{
                      fontSize:
                        13,

                      fontWeight:
                        500,

                      color:
                        "#111827",

                      marginBottom:
                        3,

                      lineHeight:
                        1.4,
                    }}
                  >
                    {t}
                  </div>

                )
              )}

            </div>

          </div>


          {/* RIGHT TAX SECTION */}

          <div>

            <table
              style={{
                width:
                  "100%",

                borderCollapse:
                  "collapse",
              }}
            >

              <tbody>

                {/* SUBTOTAL */}

                <tr
                  style={{
                    background:
                      "#FBEEDD",
                  }}
                >

                  <td
                    style={{
                      padding:
                        "8px 10px",

                      fontSize:
                        14,

                      fontWeight:
                        600,

                      color:
                        "#111827",

                      borderBottom:
                        "1px solid #1F2A3C",
                    }}
                  >
                    Sub total
                  </td>


                  <td
                    style={{
                      padding:
                        "8px 10px",

                      fontSize:
                        13,

                      fontWeight:
                        600,

                      color:
                        "#111827",

                      borderBottom:
                        "1px solid #1F2A3C",

                      width:
                        20,
                    }}
                  >
                    {symbol}
                  </td>


                  <td
                    className="lg-mono"
                    style={{
                      padding:
                        "8px 10px",

                      fontSize:
                        14,

                      fontWeight:
                        600,

                      color:
                        "#111111",

                      borderBottom:
                        "1px solid #1F2A3C",

                      textAlign:
                        "right",
                    }}
                  >
                    {totals.subtotal.toFixed(
                      2
                    )}
                  </td>

                </tr>


                {/* INTRA STATE */}

                {isIntra && (
                  <>

                    <tr
                      style={{
                        background:
                          "#FBEEDD",
                      }}
                    >

                      <td
                        style={{
                          padding:
                            "8px 10px",

                          fontSize:
                            14,

                          fontWeight:
                            600,

                          color:
                            "#111827",

                          borderBottom:
                            "1px solid #1F2A3C",
                        }}
                      >
                        SGST{" "}
                        {(
                          Number(
                            invoice.taxRate
                          ) / 2
                        ).toFixed(
                          1
                        )}
                        %
                      </td>


                      <td
                        style={{
                          padding:
                            "8px 10px",

                          fontSize:
                            13,

                          fontWeight:
                            600,

                          color:
                            "#111827",

                          borderBottom:
                            "1px solid #1F2A3C",
                        }}
                      >
                        {symbol}
                      </td>


                      <td
                        className="lg-mono"
                        style={{
                          padding:
                            "8px 10px",

                          fontSize:
                            14,

                          fontWeight:
                            600,

                          color:
                            "#111111",

                          borderBottom:
                            "1px solid #1F2A3C",

                          textAlign:
                            "right",
                        }}
                      >
                        {halfTax.toFixed(
                          2
                        )}
                      </td>

                    </tr>


                    <tr
                      style={{
                        background:
                          "#FBEEDD",
                      }}
                    >

                      <td
                        style={{
                          padding:
                            "8px 10px",

                          fontSize:
                            14,

                          fontWeight:
                            600,

                          color:
                            "#111827",

                          borderBottom:
                            "1px solid #1F2A3C",
                        }}
                      >
                        CGST{" "}
                        {(
                          Number(
                            invoice.taxRate
                          ) / 2
                        ).toFixed(
                          1
                        )}
                        %
                      </td>


                      <td
                        style={{
                          padding:
                            "8px 10px",

                          fontSize:
                            13,

                          fontWeight:
                            600,

                          color:
                            "#111827",

                          borderBottom:
                            "1px solid #1F2A3C",
                        }}
                      >
                        {symbol}
                      </td>


                      <td
                        className="lg-mono"
                        style={{
                          padding:
                            "8px 10px",

                          fontSize:
                            14,

                          fontWeight:
                            600,

                          color:
                            "#111111",

                          borderBottom:
                            "1px solid #1F2A3C",

                          textAlign:
                            "right",
                        }}
                      >
                        {halfTax.toFixed(
                          2
                        )}
                      </td>

                    </tr>

                  </>
                )}


                {/* INTER STATE */}

                {isInter && (
                  <tr
                    style={{
                      background:
                        "#FBEEDD",
                    }}
                  >

                    <td
                      style={{
                        padding:
                          "8px 10px",

                        fontSize:
                          14,

                        fontWeight:
                          600,

                        color:
                          "#111827",

                        borderBottom:
                          "1px solid #1F2A3C",
                      }}
                    >
                      IGST{" "}
                      {Number(
                        invoice.taxRate
                      ).toFixed(
                        1
                      )}
                      %
                    </td>


                    <td
                      style={{
                        padding:
                          "8px 10px",

                        fontSize:
                          13,

                        fontWeight:
                          600,

                        color:
                          "#111827",

                        borderBottom:
                          "1px solid #1F2A3C",
                      }}
                    >
                      {symbol}
                    </td>


                    <td
                      className="lg-mono"
                      style={{
                        padding:
                          "8px 10px",

                        fontSize:
                          14,

                        fontWeight:
                          600,

                        color:
                          "#111111",

                        borderBottom:
                          "1px solid #1F2A3C",

                        textAlign:
                          "right",
                      }}
                    >
                      {totals.taxAmount.toFixed(
                        2
                      )}
                    </td>

                  </tr>
                )}


                {/* ROUND OFF */}

                <tr
                  style={{
                    background:
                      "#FBEEDD",
                  }}
                >

                  <td
                    style={{
                      padding:
                        "8px 10px",

                      fontSize:
                        14,

                      fontWeight:
                        600,

                      color:
                        "#111827",

                      borderBottom:
                        "1px solid #1F2A3C",
                    }}
                  >
                    Round off
                  </td>


                  <td
                    style={{
                      padding:
                        "8px 10px",

                      fontSize:
                        13,

                      fontWeight:
                        600,

                      color:
                        "#111827",

                      borderBottom:
                        "1px solid #1F2A3C",
                    }}
                  >
                    {symbol}
                  </td>


                  <td
                    className="lg-mono"
                    style={{
                      padding:
                        "8px 10px",

                      fontSize:
                        14,

                      fontWeight:
                        600,

                      color:
                        "#111111",

                      borderBottom:
                        "1px solid #1F2A3C",

                      textAlign:
                        "right",
                    }}
                  >
                    {roundOff.toFixed(
                      2
                    )}
                  </td>

                </tr>


                {/* GRAND TOTAL */}

                <tr
                  style={{
                    background:
                      "#F5D98C",
                  }}
                >

                  <td
                    style={{
                      padding:
                        "9px 10px",

                      fontSize:
                        15,

                      fontWeight:
                        800,

                      color:
                        "#111111",
                    }}
                  >
                    Grand total
                  </td>


                  <td
                    style={{
                      padding:
                        "9px 10px",

                      fontSize:
                        13,

                      fontWeight:
                        800,

                      color:
                        "#111111",
                    }}
                  >
                    {symbol}
                  </td>


                  <td
                    className="lg-mono"
                    style={{
                      padding:
                        "9px 10px",

                      fontSize:
                        15,

                      fontWeight:
                        800,

                      color:
                        "#111111",

                      textAlign:
                        "right",
                    }}
                  >
                    {grandTotal.toFixed(
                      2
                    )}
                  </td>

                </tr>

              </tbody>

            </table>


            {/* SIGNATURE */}

            <div
              style={{
                borderTop:
                  "1px solid #1F2A3C",

                padding:
                  "9px 10px",
              }}
            >

              <div
                style={{
                  fontWeight:
                    800,

                  fontSize:
                    13,

                  color:
                    "#111111",

                  marginBottom:
                    6,
                }}
              >
                Signature &amp; stamp
              </div>


              <div
                style={{
                  border:
                    "1px solid #1F2A3C",

                  height:
                    70,
                }}
              />

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          PRINT OVERRIDES
          ================================================= */}

      <style>
        {`

          @media print {

            html,
            body {
              background: #ffffff !important;
              color: #111111 !important;
            }

            .lg-noprint {
              display: none !important;
            }

            .lg-print-area {
              color: #111111 !important;

              background: #ffffff !important;

              border-color:
                #1F2A3C !important;

              -webkit-print-color-adjust:
                exact !important;

              print-color-adjust:
                exact !important;

              color-adjust:
                exact !important;
            }

            .lg-print-area * {
              -webkit-print-color-adjust:
                exact !important;

              print-color-adjust:
                exact !important;

              color-adjust:
                exact !important;
            }

            .lg-print-area
            td,
            .lg-print-area
            th {
              color:
                #111111 !important;
            }

            .lg-print-area
            b {
              color:
                #111111 !important;
            }

            .lg-print-area
            .lg-mono {
              color:
                #111111 !important;
            }

            /* Keep JAY SWAMINARAYAN red */

            .lg-print-area
            > div:first-child {
              color:
                #C62828 !important;
            }

          }

        `}
      </style>

    </div>
  );
}