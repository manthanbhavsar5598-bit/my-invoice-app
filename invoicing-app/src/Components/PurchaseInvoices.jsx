import React, { useEffect, useMemo, useState } from "react";
import { Save, Pencil, Trash2, RotateCcw, Download, Printer, Filter } from "lucide-react";
import ClientPicker from "./ClientPicker";
import Pagination from "./Pagination";
import { usePagination } from "../utils/usePagination";
import { money, todayISO, fmtDate } from "../utils/helpers";

const EMPTY = {
  id: null,
  date: todayISO(),
  billNo: "",
  companyProfileId: "",
  billFrom: "",
  hsnCode: "",
  weight: "",
  amount: "",
  igst: "",
  cgst: "",
  sgst: "",
  roundOff: "",
};

const NUM_FIELDS = ["amount", "igst", "cgst", "sgst", "roundOff"];

function grandTotalOf(f) {
  return NUM_FIELDS.reduce((sum, key) => sum + (Number(f[key]) || 0), 0);
}

export default function PurchaseInvoices({ clients, profiles = [], purchaseInvoices, symbol, onSave, onDelete }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const clientsById = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients]
  );

  const profilesById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles]
  );

  const grandTotal = grandTotalOf(form);
  const isEditing = !!form.id;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // FILTER STATE (draft values, only applied on button click)
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: "",
    toDate: "",
    companyId: "all",
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      fromDate: filterFromDate,
      toDate: filterToDate,
      companyId: filterCompanyId,
    });
  };

  const handleResetFilters = () => {
    setFilterFromDate("");
    setFilterToDate("");
    setFilterCompanyId("all");
    setAppliedFilters({ fromDate: "", toDate: "", companyId: "all" });
  };

  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter((pi) => {
      if (appliedFilters.fromDate && pi.date < appliedFilters.fromDate) return false;
      if (appliedFilters.toDate && pi.date > appliedFilters.toDate) return false;
      if (appliedFilters.companyId !== "all" && (pi.companyProfileId || "") !== appliedFilters.companyId) return false;
      return true;
    });
  }, [purchaseInvoices, appliedFilters]);

  const pagination = usePagination(filteredPurchaseInvoices);
  const { pageItems, setPage } = pagination;
  // Jump back to page 1 whenever the applied filters change so we
  // never land on a page that no longer has any rows.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const reset = () => setForm(EMPTY);

  const handleSave = async () => {
    if (!form.billNo.trim()) {
      alert("Bill No. is required.");
      return;
    }
    if (!form.billFrom) {
      alert("Please select a Bill From client.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, grandTotal });
      reset();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pi) => {
    setForm({
      id: pi.id,
      date: pi.date,
      billNo: pi.billNo,
      companyProfileId: pi.companyProfileId || "",
      billFrom: pi.billFrom,
      hsnCode: pi.hsnCode,
      weight: pi.weight,
      amount: pi.amount,
      igst: pi.igst,
      cgst: pi.cgst,
      sgst: pi.sgst,
      roundOff: pi.roundOff,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (confirm("Delete this purchase invoice?")) {
      onDelete(id);
    }
  };

  // CSV export — same filename pattern as Reports (Name_Report_YYYY-MM-DD.csv)
  const handleExportCSV = () => {
    const headers = ["Date", "Bill No", "Company Profile", "Bill From", "HSN Code", "Weight", "Amount", "IGST", "CGST", "SGST", "Round Off", "Grand Total"];
    const rows = filteredPurchaseInvoices.map((pi) => [
      pi.date,
      pi.billNo,
      `"${profilesById[pi.companyProfileId]?.name || pi.companyProfileName || "-"}"`,
      `"${clientsById[pi.billFrom]?.name || pi.billFromName || "-"}"`,
      pi.hsnCode,
      pi.weight,
      pi.amount,
      pi.igst,
      pi.cgst,
      pi.sgst,
      pi.roundOff,
      pi.grandTotal,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Purchase_Invoice_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF export — opens a clean print window, same approach as Reports
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank", "width=1400,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups to generate the PDF.");
      return;
    }
    const rows = filteredPurchaseInvoices
      .map(
        (pi) => `
          <tr>
            <td>${fmtDate(pi.date)}</td>
            <td>${pi.billNo || "—"}</td>
            <td>${profilesById[pi.companyProfileId]?.name || pi.companyProfileName || "—"}</td>
            <td>${clientsById[pi.billFrom]?.name || pi.billFromName || "—"}</td>
            <td>${pi.hsnCode || "—"}</td>
            <td class="number">${pi.weight || 0}</td>
            <td class="number">${money(pi.amount, symbol)}</td>
            <td class="number">${money(pi.igst, symbol)}</td>
            <td class="number">${money(pi.cgst, symbol)}</td>
            <td class="number">${money(pi.sgst, symbol)}</td>
            <td class="number">${money(pi.roundOff, symbol)}</td>
            <td class="number total">${money(pi.grandTotal, symbol)}</td>
          </tr>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Purchase Invoice Report</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #fff; color: #111827; font-family: Arial, Helvetica, sans-serif; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
            .title { margin: 0; font-size: 21px; font-weight: 700; color: #111827; }
            .generated { text-align: right; font-size: 9px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th { padding: 8px 5px; background: #f3f4f6; color: #374151; border-top: 1px solid #111827; border-bottom: 1px solid #111827; font-size: 8px; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.3px; }
            td { padding: 7px 5px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 8px; vertical-align: middle; word-wrap: break-word; }
            th.number, td.number { text-align: right; }
            td.total { font-weight: 700; }
            .no-data { padding: 30px; text-align: center; color: #6b7280; font-size: 10px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Purchase Invoice Report</h1>
            <div class="generated">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Bill No</th><th>Company Profile</th><th>Bill From</th><th>HSN Code</th>
                <th class="number">Weight</th><th class="number">Amount</th>
                <th class="number">IGST</th><th class="number">CGST</th><th class="number">SGST</th>
                <th class="number">Round Off</th><th class="number">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="12" class="no-data">No purchase invoices available.</td></tr>`}
            </tbody>
          </table>
          <script>
            window.onload = function () { window.focus(); window.print(); };
            window.onafterprint = function () { window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const numInput = { type: "number", step: "0.01" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Purchase invoices</h1>
      </div>

      {/* ENTRY FORM */}
      <div className="lg-card" style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="Date">
            <input type="date" value={form.date} onChange={set("date")} />
          </Field>

          <Field label="Bill No. *">
            <input value={form.billNo} onChange={set("billNo")} placeholder="Bill No." />
          </Field>

          <Field label="Company Profile">
            <select value={form.companyProfileId} onChange={set("companyProfileId")}>
              <option value="">Select a company profile…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Bill From">
            <ClientPicker
              clients={clients}
              value={form.billFrom}
              onChange={(id) => setForm((f) => ({ ...f, billFrom: id }))}
            />
          </Field>

          <Field label="HSN Code">
            <input value={form.hsnCode} onChange={set("hsnCode")} placeholder="HSN Code" />
          </Field>

          <Field label="Weight">
            <input {...numInput} value={form.weight} onChange={set("weight")} placeholder="0" />
          </Field>

          <Field label="Amount">
            <input {...numInput} value={form.amount} onChange={set("amount")} placeholder="0.00" />
          </Field>

          <Field label="IGST">
            <input {...numInput} value={form.igst} onChange={set("igst")} placeholder="0.00" />
          </Field>

          <Field label="CGST">
            <input {...numInput} value={form.cgst} onChange={set("cgst")} placeholder="0.00" />
          </Field>

          <Field label="SGST">
            <input {...numInput} value={form.sgst} onChange={set("sgst")} placeholder="0.00" />
          </Field>

          <Field label="Round Off">
            <input {...numInput} value={form.roundOff} onChange={set("roundOff")} placeholder="0.00" />
          </Field>

          <Field label="Grand Total">
            <input className="lg-mono" value={money(grandTotal, symbol)} readOnly style={{ background: "var(--paper-dark)", fontWeight: 600 }} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="lg-btn" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {isEditing ? "Update purchase invoice" : "Save purchase invoice"}
          </button>
          {isEditing && (
            <button className="lg-btn-ghost" onClick={reset}>
              <RotateCcw size={13} /> Cancel edit
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="lg-card" style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <Field label="From">
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
            />
          </Field>

          <Field label="To">
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
            />
          </Field>

          <Field label="Company Profile">
            <select value={filterCompanyId} onChange={(e) => setFilterCompanyId(e.target.value)}>
              <option value="all">All company profiles</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="lg-btn" onClick={handleApplyFilters}>
              <Filter size={14} /> Apply
            </button>
            <button className="lg-btn-ghost" onClick={handleResetFilters}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="lg-card" style={{ padding: 0, overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 16px 0" }}>
          <button className="lg-btn-ghost" onClick={handleExportCSV} style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={14} /> CSV
          </button>
          <button className="lg-btn-ghost" onClick={handleExportPDF} style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Printer size={14} /> PDF
          </button>
        </div>
        {filteredPurchaseInvoices.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>
            {purchaseInvoices.length === 0
              ? "No purchase invoices yet. Fill in the form above to add one."
              : "No purchase invoices match the selected filters."}
          </div>
        ) : (
          <table className="lg-table" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill No.</th>
                <th>Company Profile</th>
                <th>Bill From</th>
                <th>HSN Code</th>
                <th style={{ textAlign: "right" }}>Weight</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right" }}>IGST</th>
                <th style={{ textAlign: "right" }}>CGST</th>
                <th style={{ textAlign: "right" }}>SGST</th>
                <th style={{ textAlign: "right" }}>Round Off</th>
                <th style={{ textAlign: "right" }}>Grand Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((pi) => (
                <tr key={pi.id}>
                  <td>{pi.date}</td>
                  <td>{pi.billNo}</td>
                  <td>{profilesById[pi.companyProfileId]?.name || pi.companyProfileName || "—"}</td>
                  <td>{clientsById[pi.billFrom]?.name || pi.billFromName || "—"}</td>
                  <td>{pi.hsnCode}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{pi.weight}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(pi.amount, symbol)}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(pi.igst, symbol)}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(pi.cgst, symbol)}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(pi.sgst, symbol)}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(pi.roundOff, symbol)}</td>
                  <td className="lg-mono" style={{ textAlign: "right", fontWeight: 600 }}>{money(pi.grandTotal, symbol)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => handleEdit(pi)}>
                        <Pencil size={13} />
                      </button>
                      <button className="lg-btn-danger" onClick={() => handleDelete(pi.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination {...pagination} />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-soft)", marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}