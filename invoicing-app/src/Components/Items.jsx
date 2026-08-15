import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import EntityForm from "./EntityForm";
import Pagination from "./Pagination";
import { usePagination } from "../utils/usePagination";
import { uid, money } from "../utils/helpers";

export default function Items({ items, settings, onSave, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const editing = editingId === "new"
    ? { id: uid("it"), name: "", description: "", price: 0, unit: "", hsnCode: "" }
    : items.find((i) => i.id === editingId);

  const symbol = settings.currencySymbol;
  const pagination = usePagination(items);
  const { pageItems } = pagination;

  const handleSave = (item) => {
    onSave(item);
    setEditingId(null);
  };

  return (
    <div>
      <div className="resp-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Item catalog</h1>
        <button className="lg-btn" onClick={() => setEditingId("new")}><Plus size={15} /> Add item</button>
      </div>

      {editing && (
        <EntityForm
          key={editing.id}
          entity={editing}
          fields={[
            { key: "name", label: "Name" },
            { key: "description", label: "Description" },
            { key: "hsnCode", label: "HSN/SAC code" },
            { key: "price", label: "Default price", type: "number" },
            { key: "unit", label: "Unit (e.g. hour, item, kg)" },
          ]}
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
      )}

      <div className="lg-card" style={{ padding: 0 }}>
        {items.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>No catalog items yet. Add services or products you bill often.</div>
        ) : (
          <div className="resp-scroll-x">
          <table className="lg-table">
            <thead>
              <tr><th>Name</th><th>Description</th><th>HSN/SAC</th><th>Unit</th><th style={{ textAlign: "right" }}>Price</th><th></th></tr>
            </thead>
            <tbody>
              {pageItems.map((it) => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td>{it.description}</td>
                  <td>{it.hsnCode}</td>
                  <td>{it.unit}</td>
                  <td className="lg-mono" style={{ textAlign: "right" }}>{money(it.price, symbol)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => setEditingId(it.id)}><Pencil size={13} /></button>
                      <button className="lg-btn-danger" onClick={() => onDelete(it.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        <Pagination {...pagination} />
      </div>
    </div>
  );
}