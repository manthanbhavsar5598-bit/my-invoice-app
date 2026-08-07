import React, { useState } from "react";
import { Plus, Play, Pencil, Trash2 } from "lucide-react";
import RecurringForm from "./RecurringForm";
import { uid, todayISO, computeTotals, fmtDate, money } from "../utils/helpers";

function blankRecurring() {
  return { id: uid("rec"), clientId: "", frequency: "monthly", nextDate: todayISO(), active: true, taxRate: 0, notes: "", lineItems: [{ id: uid("li"), description: "", qty: 1, price: 0 }] };
}

export default function Recurring({ data, clientsById, onSave, onDelete, onGenerate }) {
  const [editingId, setEditingId] = useState(null);
  const editing = editingId === "new" ? blankRecurring() : data.recurring.find((r) => r.id === editingId);
  const symbol = data.business.currencySymbol;

  const handleSave = (r) => {
    onSave(r, editingId === "new");
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Recurring invoices</h1>
        <button className="lg-btn" onClick={() => setEditingId("new")}><Plus size={15} /> New template</button>
      </div>

      {editing && (
        <RecurringForm entity={editing} data={data} onSave={handleSave} onCancel={() => setEditingId(null)} />
      )}

      <div className="lg-card" style={{ padding: 0 }}>
        {data.recurring.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>No recurring templates. Set one up for clients you bill on a schedule.</div>
        ) : (
          <table className="lg-table">
            <thead>
              <tr><th>Client</th><th>Frequency</th><th>Next due</th><th style={{ textAlign: "right" }}>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {data.recurring.map((r) => {
                const t = computeTotals(r);
                const due = r.active && r.nextDate <= todayISO();
                return (
                  <tr key={r.id}>
                    <td>{clientsById[r.clientId]?.name || "Deleted client"}</td>
                    <td style={{ textTransform: "capitalize" }}>{r.frequency}</td>
                    <td style={{ color: due ? "var(--stamp-red)" : "inherit", fontWeight: due ? 600 : 400 }}>{fmtDate(r.nextDate)}{due ? " · due" : ""}</td>
                    <td className="lg-mono" style={{ textAlign: "right" }}>{money(t.total, symbol)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="lg-btn-ghost" style={{ padding: "5px 9px", fontSize: 11 }} onClick={() => onGenerate(r)}><Play size={12} /> Generate</button>
                        <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => setEditingId(r.id)}><Pencil size={13} /></button>
                        <button className="lg-btn-danger" onClick={() => onDelete(r.id)}><Trash2 size={12} /></button>
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