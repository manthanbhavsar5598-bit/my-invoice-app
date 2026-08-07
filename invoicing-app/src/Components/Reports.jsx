import React, { useState, useMemo } from "react";
import { Download } from "lucide-react";
import Metric from "./Metric";
import { computeTotals, displayStatus, money } from "../utils/helpers";

function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Reports({ data, clientsById }) {
  const symbol = data.business.currencySymbol;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return data.invoices.filter((i) => {
      if (from && i.issueDate < from) return false;
      if (to && i.issueDate > to) return false;
      return true;
    });
  }, [data.invoices, from, to]);

  const totals = useMemo(() => {
    let invoiced = 0, paid = 0, outstanding = 0, tax = 0;
    filtered.forEach((i) => {
      const t = computeTotals(i);
      invoiced += t.total;
      tax += t.taxAmount;
      if (i.status === "paid") paid += t.total;
      else outstanding += t.total;
    });
    return { invoiced, paid, outstanding, tax };
  }, [filtered]);

  const byClient = useMemo(() => {
    const map = {};
    filtered.forEach((i) => {
      const key = i.clientId;
      if (!map[key]) map[key] = { invoiced: 0, paid: 0, outstanding: 0, count: 0 };
      const t = computeTotals(i);
      map[key].invoiced += t.total;
      map[key].count += 1;
      if (i.status === "paid") map[key].paid += t.total;
      else map[key].outstanding += t.total;
    });
    return Object.entries(map)
      .map(([clientId, v]) => ({ clientId, name: clientsById[clientId]?.name || "Deleted client", ...v }))
      .sort((a, b) => b.invoiced - a.invoiced);
  }, [filtered, clientsById]);

  function exportCSV() {
    const headers = ["Number", "Client", "Issue date", "Due date", "Status", "Subtotal", "Tax", "Total", "Paid date"];
    const rows = filtered.map((i) => {
      const t = computeTotals(i);
      return [i.number, clientsById[i.clientId]?.name || "Deleted client", i.issueDate, i.dueDate, displayStatus(i), t.subtotal.toFixed(2), t.taxAmount.toFixed(2), t.total.toFixed(2), i.paidDate || ""];
    });
    downloadCSV(`invoice-report_${from || "all"}_to_${to || "now"}.csv`, headers, rows);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Reports</h1>
        <button className="lg-btn-ghost" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>

      <div className="lg-card" style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 18 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 160 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 160 }} />
        </div>
        {(from || to) && <button className="lg-btn-ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear</button>}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-soft)" }}>{filtered.length} invoice{filtered.length === 1 ? "" : "s"} in range, by issue date</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
        <Metric label="Invoiced" value={money(totals.invoiced, symbol)} accent="var(--ink)" />
        <Metric label="Paid" value={money(totals.paid, symbol)} accent="var(--ledger-green)" />
        <Metric label="Outstanding" value={money(totals.outstanding, symbol)} accent="var(--stamp-red)" />
        <Metric label="Tax collected" value={money(totals.tax, symbol)} accent="var(--gold)" />
      </div>

      <div className="lg-card" style={{ padding: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, padding: "14px 18px 0", color: "var(--ink-soft)" }}>By client</div>
        {byClient.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>No invoices in this range.</div>
        ) : (
          <table className="lg-table">
            <thead>
              <tr><th>Client</th><th>Invoices</th><th style={{ textAlign: "right" }}>Invoiced</th><th style={{ textAlign: "right" }}>Paid</th><th style={{ textAlign: "right" }}>Outstanding</th></tr>
            </thead>
            <tbody>
              {byClient.map((c) => (
                <tr key={c.clientId}>
                  <td>{c.name}</td>
                  <td>{c.count}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(c.invoiced, symbol)}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(c.paid, symbol)}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(c.outstanding, symbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}