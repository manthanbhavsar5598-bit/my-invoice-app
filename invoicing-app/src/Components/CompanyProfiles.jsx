import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import EntityForm from "./EntityForm";
import { uid } from "../utils/helpers";

export default function CompanyProfiles({ profiles, onSave, onDelete }) {
  const [editingProfileId, setEditingProfileId] = useState(null);

  const editingProfile = editingProfileId === "new"
    ? { id: uid("biz"), name: "", email: "", phone: "", address: "", gstNumber: "", currencySymbol: "₹", bankName: "", branchName: "", accountNo: "", ifscCode: "", terms: "" }
    : profiles.find((p) => p.id === editingProfileId);

  const handleSave = (p) => {
    onSave(p);
    setEditingProfileId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Company profiles</h1>
        <button className="lg-btn" onClick={() => setEditingProfileId("new")}><Plus size={15} /> Add profile</button>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18, maxWidth: 560 }}>
        Add a profile for each business name you bill under. There's no "primary" profile — you pick which one to use every time you create an invoice.
      </div>

      {editingProfile && (
        <EntityForm
          key={editingProfile.id}
          entity={editingProfile}
          fields={[
            { key: "name", label: "Business name" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone" },
            { key: "gstNumber", label: "GST number" },
            { key: "currencySymbol", label: "Currency symbol" },
            { key: "address", label: "Address", type: "textarea" },
            { key: "bankName", label: "Bank name" },
            { key: "branchName", label: "Branch name" },
            { key: "accountNo", label: "Account no" },
            { key: "ifscCode", label: "IFSC code" },
            { key: "terms", label: "Terms & conditions (one per line)", type: "textarea" },
          ]}
          onSave={handleSave}
          onCancel={() => setEditingProfileId(null)}
        />
      )}

      <div className="lg-card" style={{ padding: 0 }}>
        <table className="lg-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Bank</th><th>A/C no</th><th></th></tr>
          </thead>
          <tbody>
            {profiles.length === 0 && (
              <tr><td colSpan={5} style={{ color: "var(--ink-soft)" }}>No company profiles yet. Add one to start creating invoices.</td></tr>
            )}
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.bankName || "—"}</td>
                <td className="lg-mono">{p.accountNo || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => setEditingProfileId(p.id)}><Pencil size={13} /></button>
                    <button className="lg-btn-danger" onClick={() => onDelete(p.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}