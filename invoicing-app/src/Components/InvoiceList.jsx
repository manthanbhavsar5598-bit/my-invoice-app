import React from "react";
import { Plus, Search, Printer, Trash2 } from "lucide-react";
import Stamp from "./Stamp";
import { displayStatus, computeTotals, fmtDate, money } from "../utils/helpers";

export default function InvoiceList({ data, clientsById, filter, setFilter, search, setSearch, onNew, onOpen, onPrint, onDelete, onSetStatus }) {
  const symbol = data.settings.currencySymbol;
  let list = data.invoices;
  if (filter !== "all") list = list.filter((i) => displayStatus(i) === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter((i) => i.number.toLowerCase().includes(q) || (clientsById[i.clientId]?.name || "").toLowerCase().includes(q));
  }
  list = [...list].sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Invoices</h1>
        <button className="lg-btn" onClick={onNew}><Plus size={15} /> New invoice</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--ink-soft)" }} />
          <input placeholder="Search number or client" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 150 }}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="lg-card" style={{ padding: 0 }}>
        {list.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>No invoices match.</div>
        ) : (
          <table className="lg-table">
            <thead>
              <tr><th>Number</th><th>Type</th><th>Client</th><th>Issued</th><th>Due</th><th>Status</th><th style={{ textAlign: "right" }}>Total</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((inv) => {
                const t = computeTotals(inv);
                const st = displayStatus(inv);
                return (
                  <tr key={inv.id}>
                    <td className="lg-mono" style={{ cursor: "pointer" }} onClick={() => onOpen(inv.id)}>{inv.number}</td>
                    <td style={{ fontSize: 12, color: "var(--ink-soft)" }}>{inv.billType || "Invoice"}</td>
                    <td style={{ cursor: "pointer" }} onClick={() => onOpen(inv.id)}>{clientsById[inv.clientId]?.name || "Deleted client"}</td>
                    <td>{fmtDate(inv.issueDate)}</td>
                    <td>{fmtDate(inv.dueDate)}</td>
                    <td><Stamp status={st} /></td>
                    <td className="lg-mono" style={{ textAlign: "right" }}>{money(t.total, symbol)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {st !== "paid" && (
                          <button className="lg-btn-ghost" style={{ padding: "5px 9px", fontSize: 11 }} onClick={() => onSetStatus(inv.id, "paid")}>Mark paid</button>
                        )}
                        <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => onPrint(inv.id)} title="Print / PDF"><Printer size={13} /></button>
                        <button className="lg-btn-danger" onClick={() => onDelete(inv.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}