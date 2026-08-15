import React, { useState, useMemo } from "react";
import {
  Download,
  Printer,
  IndianRupee,
  FileText,
  ArrowUpRight,
  BarChart2,
  Filter,
} from "lucide-react";
import Stamp from "./Stamp";
import Pagination from "./Pagination";
import { usePagination } from "../utils/usePagination";
import {
  computeTotals,
  money,
  fmtDate,
  displayStatus,
} from "../utils/helpers";

// =========================================================
// BILL TYPE FORMATTER
// =========================================================
const formatBillType = (type) => {
  if (!type) return "Invoice";

  const cleaned = String(type)
    .replace(/_/g, " ")
    .trim();

  return (
    cleaned.charAt(0).toUpperCase() +
    cleaned.slice(1)
  );
};

// =========================================================
// GET COMPANY NAME FROM INVOICE
// =========================================================
// IMPORTANT:
// Never return "Unknown Company".
// =========================================================
const getInvoiceCompanyName = (
  inv,
  profiles = []
) => {
  if (!inv) return "";

  // Direct company name
  if (
    typeof inv.companyName === "string" &&
    inv.companyName.trim()
  ) {
    return inv.companyName.trim();
  }

  if (
    typeof inv.sellerName === "string" &&
    inv.sellerName.trim()
  ) {
    return inv.sellerName.trim();
  }

  if (
    typeof inv.company === "string" &&
    inv.company.trim()
  ) {
    return inv.company.trim();
  }

  if (
    typeof inv.seller === "string" &&
    inv.seller.trim()
  ) {
    return inv.seller.trim();
  }

  // Populated company profile
  if (
    inv.companyProfile &&
    typeof inv.companyProfile === "object" &&
    inv.companyProfile.name
  ) {
    return String(
      inv.companyProfile.name
    ).trim();
  }

  // Populated profile
  if (
    inv.profile &&
    typeof inv.profile === "object" &&
    inv.profile.name
  ) {
    return String(
      inv.profile.name
    ).trim();
  }

  // Populated company object
  if (
    inv.company &&
    typeof inv.company === "object" &&
    inv.company.name
  ) {
    return String(
      inv.company.name
    ).trim();
  }

  // Resolve company using ID
  const targetId =
    inv.companyProfileId ||
    (
      typeof inv.companyProfile ===
      "object"
        ? inv.companyProfile?._id ||
          inv.companyProfile?.id
        : inv.companyProfile
    ) ||
    inv.profileId ||
    inv.companyId;

  if (
    targetId &&
    profiles.length > 0
  ) {
    const matchedProfile =
      profiles.find(
        (profile) =>
          String(
            profile?.id ||
              profile?._id
          ) ===
          String(targetId)
      );

    if (matchedProfile?.name) {
      return String(
        matchedProfile.name
      ).trim();
    }
  }

  return "";
};

// =========================================================
// TAX DETAILS
// =========================================================
// Supports:
// - subtotal
// - taxAmount
// - total
// - IGST
// - CGST
// - SGST
// - round off
// - old invoice formats
// =========================================================
const extractTaxDetails = (inv) => {
  if (!inv) {
    return {
      subtotal: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      taxAmount: 0,
      roundOff: 0,
      total: 0,
    };
  }

  const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  // Compute fallback totals
  const computed =
    computeTotals(inv) || {};

  // =======================================================
  // SUBTOTAL
  // =======================================================
  let subtotal = toNumber(
    inv.subtotal
  );

  if (subtotal <= 0) {
    subtotal = toNumber(
      computed.subtotal
    );
  }

  // =======================================================
  // TAX AMOUNT
  // =======================================================
  // Backend stores total tax in taxAmount.
  // =======================================================
  let taxAmount = toNumber(
    inv.taxAmount
  );

  if (taxAmount <= 0) {
    taxAmount = toNumber(
      computed.taxAmount
    );
  }

  // Fallback using tax rate
  const taxRate = toNumber(
    inv.taxRate
  );

  if (
    taxAmount <= 0 &&
    subtotal > 0 &&
    taxRate > 0
  ) {
    taxAmount =
      subtotal *
      (taxRate / 100);
  }

  // =======================================================
  // IGST
  // =======================================================
  let igst = toNumber(
    inv.igst ??
      inv.igstAmount ??
      inv.igstVal ??
      inv.igstTax ??
      inv.taxIgst
  );

  // =======================================================
  // CGST
  // =======================================================
  let cgst = toNumber(
    inv.cgst ??
      inv.cgstAmount ??
      inv.cgstVal ??
      inv.cgstTax ??
      inv.taxCgst
  );

  // =======================================================
  // SGST
  // =======================================================
  let sgst = toNumber(
    inv.sgst ??
      inv.sgstAmount ??
      inv.sgstVal ??
      inv.sgstTax ??
      inv.taxSgst
  );

  // =======================================================
  // TAX SPLIT
  // =======================================================
  if (
    igst === 0 &&
    cgst === 0 &&
    sgst === 0 &&
    taxAmount > 0
  ) {
    // Interstate
    if (
      inv.stateType === "inter"
    ) {
      igst = taxAmount;
    }

    // Intrastate
    else if (
      inv.stateType === "intra"
    ) {
      cgst =
        taxAmount / 2;

      sgst =
        taxAmount / 2;
    }
  }

  // =======================================================
  // TOTAL / GRAND TOTAL
  // =======================================================
  // IMPORTANT:
  // The printed invoice uses computeTotals(inv).total as the
  // exact invoice total, then calculates:
  //
  //   grandTotal = Math.round(totals.total)
  //   roundOff   = grandTotal - totals.total
  //
  // Reports must use exactly the same source/calculation.
  // Do NOT prefer inv.total or a separately stored roundOff,
  // otherwise the Reports total can differ from the invoice.
  // =======================================================
  let total = toNumber(
    computed.total
  );

  // Fallback only for very old invoices where computeTotals
  // cannot produce a value.
  if (total === 0) {
    total = toNumber(inv.total);

    if (total === 0) {
      total =
        subtotal +
        taxAmount;
    }
  }

  // This is exactly the same round-off rule used by PrintView.
  const grandTotal = Math.round(
    total
  );

  const roundOff = Number(
    (grandTotal - total).toFixed(2)
  );

  return {
    subtotal: Number(
      subtotal.toFixed(2)
    ),

    igst: Number(
      igst.toFixed(2)
    ),

    cgst: Number(
      cgst.toFixed(2)
    ),

    sgst: Number(
      sgst.toFixed(2)
    ),

    taxAmount: Number(
      taxAmount.toFixed(2)
    ),

    roundOff: Number(
      roundOff.toFixed(2)
    ),

    total: Number(
      total.toFixed(2)
    ),

    // Must match the invoice PrintView grand total exactly.
    finalTotal: Number(
      grandTotal.toFixed(2)
    ),
  };
};

// =========================================================
// REPORTS COMPONENT
// =========================================================
export default function Reports({
  data,
  clientsById,
  profiles = [],
}) {
  const symbol =
    data?.settings?.currencySymbol ||
    "₹";

  const invoices =
    data?.invoices || [];

  const clientsList =
    Object.values(
      clientsById || {}
    );

  // =======================================================
  // AVAILABLE COMPANIES
  // =======================================================
  // ONLY registered Company Profiles.
  //
  // We DO NOT extract company names from invoices.
  // This completely removes "Unknown Company".
  // =======================================================
  const availableCompanies =
    useMemo(() => {
      const companiesMap =
        new Map();

      profiles.forEach(
        (profile) => {
          const id =
            profile?.id ||
            profile?._id;

          const name = String(
            profile?.name || ""
          ).trim();

          if (!id || !name) {
            return;
          }

          companiesMap.set(
            String(id),
            {
              id: String(id),
              name,
            }
          );
        }
      );

      return Array.from(
        companiesMap.values()
      );
    }, [profiles]);

  // =======================================================
  // BILL TYPES
  // =======================================================
  const availableBillTypes =
    useMemo(() => {
      const typesSet =
        new Set();

      invoices.forEach(
        (invoice) => {
          const type =
            invoice.type ||
            invoice.billType ||
            "Invoice";

          if (type) {
            typesSet.add(type);
          }
        }
      );

      return Array.from(
        typesSet
      );
    }, [invoices]);

  // =======================================================
  // FILTER STATES
  // =======================================================
  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [companyId, setCompanyId] =
    useState("all");

  const [customerId, setCustomerId] =
    useState("all");

  const [status, setStatus] =
    useState("all");

  const [billType, setBillType] =
    useState("all");

  // =======================================================
  // APPLIED FILTERS
  // =======================================================
  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState({
    fromDate: "",
    toDate: "",
    companyId: "all",
    customerId: "all",
    status: "all",
    billType: "all",
  });

  // =======================================================
  // APPLY FILTERS
  // =======================================================
  const handleApplyFilters = (
    e
  ) => {
    e.preventDefault();

    setAppliedFilters({
      fromDate,
      toDate,
      companyId,
      customerId,
      status,
      billType,
    });
  };

  // =======================================================
  // FILTER INVOICES
  // =======================================================
  const filteredInvoices =
    useMemo(() => {
      return invoices.filter(
        (invoice) => {
          // ==============================================
          // COMPANY FILTER
          // ==============================================
          if (
            appliedFilters.companyId !==
            "all"
          ) {
            const selectedCompanyId =
              String(
                appliedFilters.companyId
              ).trim();

            // Current field:
            // companyProfileId
            //
            // Backend field:
            // companyProfile
            //
            // Older fields:
            // profileId / companyId
            const invoiceCompanyId =
              String(
                invoice.companyProfileId ||
                  (
                    typeof invoice.companyProfile ===
                    "object"
                      ? invoice.companyProfile?._id ||
                        invoice.companyProfile?.id
                      : invoice.companyProfile
                  ) ||
                  invoice.profileId ||
                  invoice.companyId ||
                  ""
              ).trim();

            // Exact ID match
            if (
              invoiceCompanyId !==
              selectedCompanyId
            ) {
              // =========================================
              // NAME FALLBACK
              // =========================================
              const selectedCompany =
                profiles.find(
                  (profile) =>
                    String(
                      profile?.id ||
                        profile?._id
                    ) ===
                    selectedCompanyId
                );

              const invoiceCompanyName =
                getInvoiceCompanyName(
                  invoice,
                  profiles
                )
                  .toLowerCase()
                  .trim();

              const selectedCompanyName =
                String(
                  selectedCompany?.name ||
                    ""
                )
                  .toLowerCase()
                  .trim();

              if (
                !selectedCompanyName ||
                !invoiceCompanyName ||
                invoiceCompanyName !==
                  selectedCompanyName
              ) {
                return false;
              }
            }
          }

          // ==============================================
          // CUSTOMER FILTER
          // ==============================================
          if (
            appliedFilters.customerId !==
              "all" &&
            String(
              invoice.clientId
            ) !==
              String(
                appliedFilters.customerId
              )
          ) {
            return false;
          }

          // ==============================================
          // STATUS FILTER
          // ==============================================
          // Invoice statuses used by the billing system are:
          // draft, sent and paid.
          // Always filter against the actual invoice.status
          // value so the Reports filter matches the status
          // stored on the invoice.
          if (
            appliedFilters.status !==
            "all"
          ) {
            const currentStatus = String(
              invoice?.status || ""
            )
              .toLowerCase()
              .trim();

            const targetStatus = String(
              appliedFilters.status
            )
              .toLowerCase()
              .trim();

            if (
              currentStatus !==
              targetStatus
            ) {
              return false;
            }
          }

          // ==============================================
          // BILL TYPE FILTER
          // ==============================================
          if (
            appliedFilters.billType !==
            "all"
          ) {
            const invoiceType =
              invoice.type ||
              invoice.billType ||
              "Invoice";

            const normalizedInvoiceType =
              String(
                invoiceType
              )
                .toLowerCase()
                .replace(
                  /_/g,
                  " "
                )
                .trim();

            const normalizedFilterType =
              String(
                appliedFilters.billType
              )
                .toLowerCase()
                .replace(
                  /_/g,
                  " "
                )
                .trim();

            if (
              normalizedInvoiceType !==
              normalizedFilterType
            ) {
              return false;
            }
          }

          // ==============================================
          // FROM DATE
          // ==============================================
          if (
            appliedFilters.fromDate
          ) {
            const invoiceDate =
              new Date(
                invoice.issueDate ||
                  invoice.createdAt
              );

            const startDate =
              new Date(
                appliedFilters.fromDate
              );

            if (
              invoiceDate <
              startDate
            ) {
              return false;
            }
          }

          // ==============================================
          // TO DATE
          // ==============================================
          if (
            appliedFilters.toDate
          ) {
            const invoiceDate =
              new Date(
                invoice.issueDate ||
                  invoice.createdAt
              );

            const endDate =
              new Date(
                appliedFilters.toDate
              );

            endDate.setHours(
              23,
              59,
              59,
              999
            );

            if (
              invoiceDate >
              endDate
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      invoices,
      profiles,
      appliedFilters,
    ]);

    const pagination =
    usePagination(filteredInvoices);

  // =======================================================
  // METRICS
  // =======================================================
  const metrics =
    useMemo(() => {
      let revenue = 0;
      let tax = 0;
      let totalRoundOff = 0;

      const totalBills =
        filteredInvoices.length;

      filteredInvoices.forEach(
        (invoice) => {
          const totals =
            extractTaxDetails(
              invoice
            );

          revenue +=
            Number(
              totals.finalTotal
            ) || 0;

          // IMPORTANT:
          // Use taxAmount directly.
          tax +=
            Number(
              totals.taxAmount
            ) || 0;

          totalRoundOff +=
            Number(
              totals.roundOff
            ) || 0;
        }
      );

      const avgPerBill =
        totalBills > 0
          ? revenue / totalBills
          : 0;

      return {
        revenue,
        totalBills,
        tax,
        totalRoundOff,
        avgPerBill,
      };
    }, [filteredInvoices]);

  // =======================================================
  // CSV EXPORT
  // =======================================================
  const handleExportCSV = () => {
    const headers = [
      "Bill No",
      "Company",
      "Customer",
      "GST No",
      "Type",
      "Date",
      "Status",
      "Subtotal",
      "IGST",
      "CGST",
      "SGST",
      "Round Off",
      "Total",
    ];

    const rows =
      filteredInvoices.map(
        (invoice) => {
          const client =
            clientsById?.[
              invoice.clientId
            ];

          const totals =
            extractTaxDetails(
              invoice
            );

          return [
            invoice.number,

            `"${getInvoiceCompanyName(
              invoice,
              profiles
            )}"`,

            `"${client?.name ||
              "Deleted client"}"`,

            `"${client?.gstNumber ||
              client?.taxId ||
              "-"}"`,

            formatBillType(
              invoice.type ||
                invoice.billType
            ),

            invoice.issueDate ||
              "-",

            displayStatus(
              invoice
            ),

            totals.subtotal,
            totals.igst,
            totals.cgst,
            totals.sgst,
            totals.roundOff,
            totals.finalTotal,
          ];
        }
      );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map(
          (row) =>
            row.join(",")
        ),
      ].join("\n");

    const encodedUri =
      encodeURI(csvContent);

    const link =
      document.createElement(
        "a"
      );

    link.setAttribute(
      "href",
      encodedUri
    );

    link.setAttribute(
      "download",
      `Sales_Report_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );
  };

  // =======================================================
  // PDF / PRINT REPORT
  // =======================================================
  // IMPORTANT:
  // This creates a separate clean print document.
  //
  // It does NOT print the Reports webpage.
  // =======================================================
  const handleExportPDF = () => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1400,height=900"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to generate the PDF."
      );
      return;
    }

    // -----------------------------------------------------
    // Selected company name
    // -----------------------------------------------------
    const selectedCompany =
      appliedFilters.companyId !==
      "all"
        ? profiles.find(
            (profile) =>
              String(
                profile?.id ||
                  profile?._id
              ) ===
              String(
                appliedFilters.companyId
              )
          )
        : null;

    const companyTitle =
      selectedCompany?.name ||
      "All Companies";

    // -----------------------------------------------------
    // Date range
    // -----------------------------------------------------
    const fromText =
      appliedFilters.fromDate
        ? fmtDate(
            appliedFilters.fromDate
          )
        : "";

    const toText =
      appliedFilters.toDate
        ? fmtDate(
            appliedFilters.toDate
          )
        : "";

    let dateRange =
      "All Dates";

    if (
      fromText &&
      toText
    ) {
      dateRange =
        `${fromText} - ${toText}`;
    } else if (fromText) {
      dateRange =
        `From ${fromText}`;
    } else if (toText) {
      dateRange =
        `Until ${toText}`;
    }

    // -----------------------------------------------------
    // Generate table rows
    // -----------------------------------------------------
    const rows =
      filteredInvoices
        .map((invoice) => {
          const client =
            clientsById?.[
              invoice.clientId
            ];

          const totals =
            extractTaxDetails(
              invoice
            );

          return `
            <tr>
              <td>
                ${
                  invoice.number ||
                  "—"
                }
              </td>

              <td>
                ${
                  client?.name ||
                  "Deleted client"
                }
              </td>

              <td>
                ${
                  client?.gstNumber ||
                  client?.taxId ||
                  "—"
                }
              </td>

              <td>
                ${formatBillType(
                  invoice.type ||
                    invoice.billType
                )}
              </td>

              <td>
                ${
                  invoice.issueDate
                    ? fmtDate(
                        invoice.issueDate
                      )
                    : "—"
                }
              </td>

              <td>
                ${displayStatus(
                  invoice
                )}
              </td>

              <td class="number">
                ${money(
                  totals.subtotal,
                  symbol
                )}
              </td>

              <td class="number">
                ${
                  totals.igst > 0
                    ? money(
                        totals.igst,
                        symbol
                      )
                    : "—"
                }
              </td>

              <td class="number">
                ${
                  totals.cgst > 0
                    ? money(
                        totals.cgst,
                        symbol
                      )
                    : "—"
                }
              </td>

              <td class="number">
                ${
                  totals.sgst > 0
                    ? money(
                        totals.sgst,
                        symbol
                      )
                    : "—"
                }
              </td>

              <td class="number">
                ${
                  totals.roundOff !==
                  0
                    ? money(
                        totals.roundOff,
                        symbol
                      )
                    : "—"
                }
              </td>

              <td class="number total">
                ${money(
                  totals.total,
                  symbol
                )}
              </td>
            </tr>
          `;
        })
        .join("");

    // -----------------------------------------------------
    // Open print document
    // -----------------------------------------------------
    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>

          <meta charset="UTF-8" />

          <title>
            Sales Transactions Report
          </title>

          <style>

            /* ===========================================
               PAGE
               =========================================== */

            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #111827;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            .report {
              width: 100%;
            }

            /* ===========================================
               HEADER
               =========================================== */

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 14px;
            }

            .title {
              margin: 0;
              font-size: 21px;
              line-height: 1.2;
              font-weight: 700;
              color: #111827;
            }

            .subtitle {
              margin-top: 5px;
              font-size: 10px;
              color: #6b7280;
            }

            .generated {
              text-align: right;
              font-size: 9px;
              color: #6b7280;
            }

            /* ===========================================
               SUMMARY
               =========================================== */

            .summary {
              display: flex;
              gap: 28px;
              margin-bottom: 15px;
              padding: 9px 12px;
              border: 1px solid #e5e7eb;
              border-radius: 5px;
              background: #f9fafb;
            }

            .summary-item {
              display: flex;
              flex-direction: column;
              gap: 3px;
            }

            .summary-label {
              font-size: 8px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .summary-value {
              font-size: 11px;
              font-weight: 700;
              color: #111827;
            }

            /* ===========================================
               TABLE
               =========================================== */

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            thead {
              display: table-header-group;
            }

            tr {
              page-break-inside: avoid;
            }

            th {
              padding: 8px 5px;
              background: #f3f4f6;
              color: #374151;
              border-top: 1px solid #111827;
              border-bottom: 1px solid #111827;
              font-size: 8px;
              font-weight: 700;
              text-align: left;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            td {
              padding: 7px 5px;
              border-bottom: 1px solid #e5e7eb;
              color: #111827;
              font-size: 8px;
              vertical-align: middle;
              word-wrap: break-word;
            }

            th.number,
            td.number {
              text-align: right;
            }

            td.total {
              font-weight: 700;
            }

            .no-data {
              padding: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 10px;
            }

            /* ===========================================
               FOOTER
               =========================================== */

            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 12px;
              padding-top: 7px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 8px;
            }

            /* ===========================================
               PRINT
               =========================================== */

            @media print {

              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .summary,
              th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

            }

          </style>

        </head>

        <body>

          <div class="report">

            <!-- =======================================
                 HEADER
                 ======================================= -->

            <div class="header">

              <div>

                <h1 class="title">
                  Sales Transactions
                </h1>

                <div class="subtitle">
                  Company:
                  ${companyTitle}
                  &nbsp;&nbsp; | &nbsp;&nbsp;
                  ${dateRange}
                </div>

              </div>

              <div class="generated">
                Generated:
                ${new Date().toLocaleDateString()}
              </div>

            </div>

            <!-- =======================================
                 SUMMARY
                 ======================================= -->

            <div class="summary">

              <div class="summary-item">

                <span class="summary-label">
                  Total Bills
                </span>

                <span class="summary-value">
                  ${metrics.totalBills}
                </span>

              </div>

              <div class="summary-item">

                <span class="summary-label">
                  Total Revenue
                </span>

                <span class="summary-value">
                  ${money(
                    metrics.revenue,
                    symbol
                  )}
                </span>

              </div>

              <div class="summary-item">

                <span class="summary-label">
                  Total Tax
                </span>

                <span class="summary-value">
                  ${money(
                    metrics.tax,
                    symbol
                  )}
                </span>

              </div>

              <div class="summary-item">

                <span class="summary-label">
                  Average Bill
                </span>

                <span class="summary-value">
                  ${money(
                    metrics.avgPerBill,
                    symbol
                  )}
                </span>

              </div>

            </div>

            <!-- =======================================
                 SALES TRANSACTIONS TABLE
                 ======================================= -->

            <table>

              <thead>

                <tr>

                  <th>
                    Bill No
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    GST No
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Status
                  </th>

                  <th class="number">
                    Subtotal
                  </th>

                  <th class="number">
                    IGST
                  </th>

                  <th class="number">
                    CGST
                  </th>

                  <th class="number">
                    SGST
                  </th>

                  <th class="number">
                    Round Off
                  </th>

                  <th class="number">
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                ${
                  rows ||
                  `
                    <tr>
                      <td
                        colspan="12"
                        class="no-data"
                      >
                        No sales transactions
                        available for the
                        selected filters.
                      </td>
                    </tr>
                  `
                }

              </tbody>

            </table>

            <!-- =======================================
                 FOOTER
                 ======================================= -->

            <div class="footer">

              <span>
                Sales Transactions Report
              </span>

              <span>
                ${
                  metrics.totalBills
                }
                transaction(s)
              </span>

            </div>

          </div>

          <script>

            window.onload = function () {
              window.focus();
              window.print();
            };

            window.onafterprint = function () {
              window.close();
            };

          </script>

        </body>

      </html>
    `);

    printWindow.document.close();
  };

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <div
      className="dash-shell"
      style={{
        background: "#FAFAFA",
        minHeight: "100vh",
        padding: "24px 32px",
        borderRadius: 12,
      }}
    >

      {/* =================================================
          FILTER BAR
          ================================================= */}

      <form
        onSubmit={
          handleApplyFilters
        }
        style={{
          marginBottom: 24,
        }}
      >

        <div
          className="resp-filter-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(6, 1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >

          {/* FROM */}

          <div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#71717A",
                marginBottom: 6,
              }}
            >
              From
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "8px 12px",
                borderRadius: 8,
                border:
                  "1px solid #E4E4E7",
                background: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing:
                  "border-box",
              }}
            />

          </div>

          {/* TO */}

          <div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#71717A",
                marginBottom: 6,
              }}
            >
              To
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "8px 12px",
                borderRadius: 8,
                border:
                  "1px solid #E4E4E7",
                background: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing:
                  "border-box",
              }}
            />

          </div>

          {/* COMPANY */}

          <div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#71717A",
                marginBottom: 6,
              }}
            >
              Company
            </label>

            <select
              value={companyId}
              onChange={(e) =>
                setCompanyId(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "8px 12px",
                borderRadius: 8,
                border:
                  "1px solid #E4E4E7",
                background: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing:
                  "border-box",
              }}
            >

              <option value="all">
                All Companies
              </option>

              {availableCompanies.map(
                (company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                )
              )}

            </select>

          </div>

          {/* CUSTOMER */}

          <div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#71717A",
                marginBottom: 6,
              }}
            >
              Customer
            </label>

            <select
              value={customerId}
              onChange={(e) =>
                setCustomerId(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "8px 12px",
                borderRadius: 8,
                border:
                  "1px solid #E4E4E7",
                background: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing:
                  "border-box",
              }}
            >

              <option value="all">
                All Customers
              </option>

              {clientsList.map(
                (client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.name}
                  </option>
                )
              )}

            </select>

          </div>

          {/* STATUS */}

          <div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#71717A",
                marginBottom: 6,
              }}
            >
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "8px 12px",
                borderRadius: 8,
                border:
                  "1px solid #E4E4E7",
                background: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing:
                  "border-box",
              }}
            >

              <option value="all">
                All Statuses
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="sent">
                Sent
              </option>

              <option value="paid">
                Paid
              </option>

            </select>

          </div>

          {/* BILL TYPE */}

          <div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#71717A",
                marginBottom: 6,
              }}
            >
              Bill Type
            </label>

            <select
              value={billType}
              onChange={(e) =>
                setBillType(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "8px 12px",
                borderRadius: 8,
                border:
                  "1px solid #E4E4E7",
                background: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing:
                  "border-box",
              }}
            >

              <option value="all">
                All Types
              </option>

              {availableBillTypes.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {formatBillType(
                      type
                    )}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {/* APPLY */}

        <button
          type="submit"
          style={{
            background: "#0F172A",
            color: "#fff",
            border: "none",
            padding:
              "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <Filter size={14} />
          Apply
        </button>

      </form>

      {/* =================================================
          KPI CARDS
          ================================================= */}

      <div
        className="resp-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >

        {/* TOTAL REVENUE */}

        <div
          className="lg-card"
          style={{
            padding:
              "18px 20px",
            background: "#fff",
            borderRadius: 12,
            border:
              "1px solid #E4E4E7",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >

          <div
            style={{
              background:
                "#E8F5E9",
              padding: 12,
              borderRadius: 10,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <IndianRupee
              size={20}
              color="#2E7D32"
            />
          </div>

          <div>

            <div
              style={{
                fontSize: 12,
                color: "#71717A",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Total Revenue
            </div>

            <div
              className="lg-mono"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#09090B",
              }}
            >
              {money(
                metrics.revenue,
                symbol
              )}
            </div>

          </div>

        </div>

        {/* TOTAL BILLS */}

        <div
          className="lg-card"
          style={{
            padding:
              "18px 20px",
            background: "#fff",
            borderRadius: 12,
            border:
              "1px solid #E4E4E7",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >

          <div
            style={{
              background:
                "#E3F2FD",
              padding: 12,
              borderRadius: 10,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <FileText
              size={20}
              color="#1565C0"
            />
          </div>

          <div>

            <div
              style={{
                fontSize: 12,
                color: "#71717A",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Total Bills
            </div>

            <div
              className="lg-mono"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#09090B",
              }}
            >
              {metrics.totalBills}
            </div>

          </div>

        </div>

        {/* TOTAL TAX */}

        <div
          className="lg-card"
          style={{
            padding:
              "18px 20px",
            background: "#fff",
            borderRadius: 12,
            border:
              "1px solid #E4E4E7",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >

          <div
            style={{
              background:
                "#F3E5F5",
              padding: 12,
              borderRadius: 10,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <ArrowUpRight
              size={20}
              color="#7B1FA2"
            />
          </div>

          <div>

            <div
              style={{
                fontSize: 12,
                color: "#71717A",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Total Tax
            </div>

            <div
              className="lg-mono"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#09090B",
              }}
            >
              {money(
                metrics.tax,
                symbol
              )}
            </div>

            {metrics.totalRoundOff !==
              0 && (
              <div
                style={{
                  fontSize: 11,
                  color: "#71717A",
                  marginTop: 2,
                }}
              >
                Round Off:{" "}
                {money(
                  metrics.totalRoundOff,
                  symbol
                )}
              </div>
            )}

          </div>

        </div>

        {/* AVG PER BILL */}

        <div
          className="lg-card"
          style={{
            padding:
              "18px 20px",
            background: "#fff",
            borderRadius: 12,
            border:
              "1px solid #E4E4E7",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >

          <div
            style={{
              background:
                "#FFF3E0",
              padding: 12,
              borderRadius: 10,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <BarChart2
              size={20}
              color="#E65100"
            />
          </div>

          <div>

            <div
              style={{
                fontSize: 12,
                color: "#71717A",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Avg per Bill
            </div>

            <div
              className="lg-mono"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#09090B",
              }}
            >
              {money(
                metrics.avgPerBill,
                symbol
              )}
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          SALES TRANSACTIONS
          ================================================= */}

      <div
        className="lg-card"
        style={{
          background: "#fff",
          borderRadius: 12,
          padding:
            "20px 24px",
          border:
            "1px solid #E4E4E7",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >

        {/* HEADER */}

        <div
          className="resp-toolbar"
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 12,
          }}
        >

          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
              color: "#09090B",
            }}
          >
            Sales Transactions
          </h2>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >

            {/* CSV */}

            <button
              className="lg-btn-ghost"
              onClick={
                handleExportCSV
              }
              style={{
                fontSize: 13,
                padding:
                  "7px 14px",
                borderRadius: 8,
                display: "flex",
                alignItems:
                  "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              CSV
            </button>

            {/* PDF */}

            <button
              className="lg-btn-ghost"
              onClick={
                handleExportPDF
              }
              style={{
                fontSize: 13,
                padding:
                  "7px 14px",
                borderRadius: 8,
                display: "flex",
                alignItems:
                  "center",
                gap: 6,
              }}
            >
              <Printer size={14} />
              PDF
            </button>

          </div>

        </div>

        {/* =================================================
            SALES TABLE
            ================================================= */}

        <div
          style={{
            overflowX: "auto",
          }}
        >

          <table
            className="lg-table"
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >

            <thead>

              <tr
                style={{
                  background:
                    "#FAFAFA",
                  borderBottom:
                    "1px solid #E4E4E7",
                }}
              >

                <th style={thStyle}>
                  Bill No
                </th>

                <th style={thStyle}>
                  Customer
                </th>

                <th style={thStyle}>
                  GST No
                </th>

                <th style={thStyle}>
                  Type
                </th>

                <th style={thStyle}>
                  Date
                </th>

                <th style={thStyle}>
                  Status
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "right",
                  }}
                >
                  Subtotal
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "right",
                  }}
                >
                  IGST
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "right",
                  }}
                >
                  CGST
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "right",
                  }}
                >
                  SGST
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "right",
                  }}
                >
                  Round Off
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "right",
                  }}
                >
                  Total
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredInvoices.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={12}
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "32px 0",
                      color:
                        "#71717A",
                      fontSize: 13,
                    }}
                  >
                    No sales
                    transactions
                    available for
                    selected
                    criteria.
                  </td>

                </tr>

              ) : (

                pagination.pageItems.map(
                  (invoice) => {
                    const client =
                      clientsById?.[
                        invoice.clientId
                      ];

                    const totals =
                      extractTaxDetails(
                        invoice
                      );

                    return (
                      <tr
                        key={
                          invoice.id
                        }
                        style={{
                          borderBottom:
                            "1px solid #E4E4E7",
                          transition:
                            "background 0.15s",
                        }}
                      >

                        {/* BILL NO */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {
                            invoice.number
                          }
                        </td>

                        {/* CUSTOMER */}

                        <td
                          style={{
                            padding:
                              "12px 10px",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {client?.name ||
                            "Deleted client"}
                        </td>

                        {/* GST */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            fontSize: 12,
                            color:
                              "#71717A",
                          }}
                        >
                          {client?.gstNumber ||
                            client?.taxId ||
                            "—"}
                        </td>

                        {/* TYPE */}

                        <td
                          style={{
                            padding:
                              "12px 10px",
                            fontSize: 13,
                          }}
                        >
                          {formatBillType(
                            invoice.type ||
                              invoice.billType
                          )}
                        </td>

                        {/* DATE */}

                        <td
                          style={{
                            padding:
                              "12px 10px",
                            fontSize: 13,
                            color:
                              "#71717A",
                          }}
                        >
                          {fmtDate(
                            invoice.issueDate
                          )}
                        </td>

                        {/* STATUS */}

                        <td
                          style={{
                            padding:
                              "12px 10px",
                          }}
                        >
                          <Stamp
                            status={displayStatus(
                              invoice
                            )}
                          />
                        </td>

                        {/* SUBTOTAL */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            textAlign:
                              "right",
                            fontSize: 13,
                          }}
                        >
                          {money(
                            totals.subtotal,
                            symbol
                          )}
                        </td>

                        {/* IGST */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            textAlign:
                              "right",
                            fontSize: 13,
                            color:
                              totals.igst >
                              0
                                ? "#09090B"
                                : "#71717A",
                          }}
                        >
                          {totals.igst >
                          0
                            ? money(
                                totals.igst,
                                symbol
                              )
                            : "—"}
                        </td>

                        {/* CGST */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            textAlign:
                              "right",
                            fontSize: 13,
                            color:
                              totals.cgst >
                              0
                                ? "#09090B"
                                : "#71717A",
                          }}
                        >
                          {totals.cgst >
                          0
                            ? money(
                                totals.cgst,
                                symbol
                              )
                            : "—"}
                        </td>

                        {/* SGST */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            textAlign:
                              "right",
                            fontSize: 13,
                            color:
                              totals.sgst >
                              0
                                ? "#09090B"
                                : "#71717A",
                          }}
                        >
                          {totals.sgst >
                          0
                            ? money(
                                totals.sgst,
                                symbol
                              )
                            : "—"}
                        </td>

                        {/* ROUND OFF */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            textAlign:
                              "right",
                            fontSize: 13,
                            color:
                              totals.roundOff !==
                              0
                                ? "#09090B"
                                : "#71717A",
                          }}
                        >
                          {totals.roundOff !==
                          0
                            ? money(
                                totals.roundOff,
                                symbol
                              )
                            : "—"}
                        </td>

                        {/* TOTAL */}

                        <td
                          className="lg-mono"
                          style={{
                            padding:
                              "12px 10px",
                            textAlign:
                              "right",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {money(
                            totals.finalTotal,
                            symbol
                          )}
                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        <Pagination {...pagination} />

      </div>

    </div>
  );
}

// =========================================================
// TABLE HEADER STYLE
// =========================================================
const thStyle = {
  padding:
    "12px 10px",
  fontSize: 12,
  fontWeight: 600,
  color: "#52525B",
  textAlign: "left",
};