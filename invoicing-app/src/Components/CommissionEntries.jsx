import React, { useMemo, useState } from "react";
import { Save, Pencil, Trash2, RotateCcw, Filter, X } from "lucide-react";
import ClientPicker from "./ClientPicker";
import { money, todayISO, fmtDate } from "../utils/helpers";

const EMPTY = {
  id: null,
  date: todayISO(),
  fromCompany: "",
  toCompany: "",
  item: "",
  quantity: "",
  rate: "",
};

const EMPTY_FILTERS = {
  fromDate: "",
  toDate: "",
  fromCompany: "",
  toCompany: "",
};

export default function CommissionEntries({
  clients,
  items,
  commissions,
  symbol,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const clientsById = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients]
  );

  const isEditing = !!form.id;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const reset = () => setForm(EMPTY);
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const handleSave = async () => {
    if (!form.fromCompany) {
      alert("Please select a From company.");
      return;
    }
    if (!form.toCompany) {
      alert("Please select a To company.");
      return;
    }
    if (!form.item) {
      alert("Please select an item.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form });
      reset();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c) => {
    setForm({
      id: c.id,
      date: c.date,
      fromCompany: c.fromCompany,
      toCompany: c.toCompany,
      item: c.item,
      quantity: c.quantity,
      rate: c.rate,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (confirm("Delete this commission entry?")) {
      onDelete(id);
    }
  };

  const filteredCommissions = useMemo(
    () =>
      commissions.filter((c) => {
        if (filters.fromDate && (!c.date || c.date < filters.fromDate)) return false;
        if (filters.toDate && (!c.date || c.date > filters.toDate)) return false;
        if (filters.fromCompany && c.fromCompany !== filters.fromCompany) return false;
        if (filters.toCompany && c.toCompany !== filters.toCompany) return false;
        return true;
      }),
    [commissions, filters]
  );

  const hasActiveFilters =
    filters.fromDate || filters.toDate || filters.fromCompany || filters.toCompany;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Commission entry</h1>
      </div>

      {/* ENTRY FORM */}
      <div className="lg-card" style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="Date">
            <input type="date" value={form.date} onChange={set("date")} />
          </Field>

          <Field label="From company *">
            <ClientPicker
              clients={clients}
              value={form.fromCompany}
              onChange={(id) => setForm((f) => ({ ...f, fromCompany: id }))}
            />
          </Field>

          <Field label="To company *">
            <ClientPicker
              clients={clients}
              value={form.toCompany}
              onChange={(id) => setForm((f) => ({ ...f, toCompany: id }))}
            />
          </Field>

          <Field label="Item *">
            <select value={form.item} onChange={set("item")}>
              <option value="">Select item…</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantity">
            <input type="number" step="0.01" value={form.quantity} onChange={set("quantity")} placeholder="0" />
          </Field>

          <Field label="Rate">
            <input type="number" step="0.01" value={form.rate} onChange={set("rate")} placeholder="0.00" />
          </Field>

        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="lg-btn" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {isEditing ? "Update commission entry" : "Save commission entry"}
          </button>
          {isEditing && (
            <button className="lg-btn-ghost" onClick={reset}>
              <RotateCcw size={13} /> Cancel edit
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="lg-card" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Filter size={14} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Filters</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="From date">
            <input type="date" value={filters.fromDate} onChange={setFilter("fromDate")} />
          </Field>

          <Field label="To date">
            <input type="date" value={filters.toDate} onChange={setFilter("toDate")} />
          </Field>

          <Field label="From company">
            <select value={filters.fromCompany} onChange={setFilter("fromCompany")}>
              <option value="">All companies</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="To company">
            <select value={filters.toCompany} onChange={setFilter("toCompany")}>
              <option value="">All companies</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {hasActiveFilters && (
          <div style={{ marginTop: 12 }}>
            <button className="lg-btn-ghost" onClick={clearFilters} style={{ fontSize: 13 }}>
              <X size={13} /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="lg-card" style={{ padding: 0, overflowX: "auto" }}>
        {filteredCommissions.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>
            {commissions.length === 0
              ? "No commission entries yet. Fill in the form above to add one."
              : "No commission entries match the selected filters."}
          </div>
        ) : (
          <table className="lg-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>From company</th>
                <th>To company</th>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Quantity</th>
                <th style={{ textAlign: "right" }}>Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.map((c) => (
                <tr key={c.id}>
                  <td>{fmtDate(c.date)}</td>
                  <td>{clientsById[c.fromCompany]?.name || c.fromCompanyName || "—"}</td>
                  <td>{clientsById[c.toCompany]?.name || c.toCompanyName || "—"}</td>
                  <td>{c.itemName || "—"}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{c.quantity}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(c.rate, symbol)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => handleEdit(c)}>
                        <Pencil size={13} />
                      </button>
                      <button className="lg-btn-danger" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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