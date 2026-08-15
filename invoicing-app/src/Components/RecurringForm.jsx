import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { uid } from "../utils/helpers";

export default function RecurringForm({ entity, data, onSave, onCancel }) {
  const [r, setR] = useState(entity);

  function updateLine(id, patch) {
    setR({ ...r, lineItems: r.lineItems.map((li) => (li.id === id ? { ...li, ...patch } : li)) });
  }

  function addLine() {
    setR({ ...r, lineItems: [...r.lineItems, { id: uid("li"), description: "", qty: 1, price: 0 }] });
  }

  function removeLine(id) {
    setR({ ...r, lineItems: r.lineItems.filter((li) => li.id !== id) });
  }

  function handleSave() {
    if (!r.clientId) { alert("Pick a client first."); return; }
    onSave(r);
  }

  return (
    <div className="lg-card" style={{ marginBottom: 16 }}>
      <div className="resp-form-grid" data-cols="3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Client</label>
          <select value={r.clientId} onChange={(e) => setR({ ...r, clientId: e.target.value })}>
            <option value="">Select a client…</option>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Frequency</label>
          <select value={r.frequency} onChange={(e) => setR({ ...r, frequency: e.target.value })}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Next due date</label>
          <input type="date" value={r.nextDate} onChange={(e) => setR({ ...r, nextDate: e.target.value })} />
        </div>
      </div>

      <div className="resp-line-items">
      {r.lineItems.map((li) => (
        <div key={li.id} style={{ display: "grid", gridTemplateColumns: "3fr 70px 90px 30px", gap: 8, marginBottom: 8 }}>
          <input placeholder="Description" value={li.description} onChange={(e) => updateLine(li.id, { description: e.target.value })} />
          <input type="number" min="0" placeholder="Qty" value={li.qty} onChange={(e) => updateLine(li.id, { qty: e.target.value })} />
          <input type="number" min="0" step="0.01" placeholder="Price" value={li.price} onChange={(e) => updateLine(li.id, { price: e.target.value })} />
          <button className="lg-btn-danger" onClick={() => removeLine(li.id)}><Trash2 size={12} /></button>
        </div>
      ))}
      </div>
      <button className="lg-btn-ghost" onClick={addLine}><Plus size={13} /> Add line</button>

      <div style={{ display: "flex", gap: 20, marginTop: 14, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={r.active} onChange={(e) => setR({ ...r, active: e.target.checked })} /> Active
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Tax %</label>
          <input type="number" style={{ width: 70 }} value={r.taxRate} onChange={(e) => setR({ ...r, taxRate: e.target.value })} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="lg-btn" onClick={handleSave}>Save template</button>
        <button className="lg-btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}