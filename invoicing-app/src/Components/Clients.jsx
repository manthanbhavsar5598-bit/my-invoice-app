import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import EntityForm from "./EntityForm";
import { uid } from "../utils/helpers";

export default function Clients({ clients, invoices, onSave, onDelete }) {
  const [editingId, setEditingId] = useState(null);

  const editing = editingId === "new"
    ? { id: uid("cl"), name: "", email: "", phone: "", address: "", gstNumber: "", stateCode: "" }
    : clients.find((c) => c.id === editingId);

  const handleSave = (client) => {
    onSave(client);
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Clients</h1>
        <button className="lg-btn" onClick={() => setEditingId("new")}><Plus size={15} /> Add client</button>
      </div>

      {editing && (
        <EntityForm
          key={editing.id}
          entity={editing}
          fields={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone" },
            { key: "gstNumber", label: "GST number" },
            { key: "stateCode", label: "State code" },
            { key: "address", label: "Address", type: "textarea" },
          ]}
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
      )}

      <div className="lg-card" style={{ padding: 0 }}>
        {clients.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>No clients yet.</div>
        ) : (
          <table className="lg-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>GST no</th><th>State code</th><th>Invoices</th><th></th></tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.gstNumber}</td>
                  <td>{c.stateCode}</td>
                  <td>{invoices.filter((i) => i.clientId === c.id).length}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => setEditingId(c.id)}><Pencil size={13} /></button>
                      <button className="lg-btn-danger" onClick={() => onDelete(c.id)}><Trash2 size={12} /></button>
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