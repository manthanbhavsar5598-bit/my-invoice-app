import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import EntityForm from "./EntityForm";
import { uid } from "../utils/helpers";

export default function CompanyProfiles({ business, profiles, onSave, onDelete }) {
  const navigate = useNavigate();
  const [editingProfileId, setEditingProfileId] = useState(null);

  const editingProfile = editingProfileId === "new"
    ? { id: uid("biz"), name: "", email: "", phone: "", address: "", gstNumber: "", prefix: "INV", nextNumber: 1001, bankName: "", branchName: "", accountNo: "", ifscCode: "" }
    : profiles.find((p) => p.id === editingProfileId);

  const handleSave = (p) => {
    onSave({ ...p, nextNumber: Number(p.nextNumber) });
    setEditingProfileId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="lg-display" style={{ fontSize: 26, margin: 0 }}>Company profiles</h1>
        <button className="lg-btn" onClick={() => setEditingProfileId("new")}><Plus size={15} /> Add profile</button>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18, maxWidth: 560 }}>
        If you bill under more than one business name, add each profile here. When creating a new invoice you'll get to pick which one it's issued from — its own name, contact details, and invoice numbering.
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
            { key: "address", label: "Address", type: "textarea" },
            { key: "prefix", label: "Invoice prefix" },
            { key: "nextNumber", label: "Next number", type: "number" },
            { key: "bankName", label: "Bank name" },
            { key: "branchName", label: "Branch name" },
            { key: "accountNo", label: "Account no" },
            { key: "ifscCode", label: "IFSC code" },
          ]}
          onSave={handleSave}
          onCancel={() => setEditingProfileId(null)}
        />
      )}

      <div className="lg-card" style={{ padding: 0 }}>
        <table className="lg-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Prefix</th><th>Bank</th><th>A/C no</th><th></th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{business.name} <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>(primary)</span></td>
              <td>{business.email}</td>
              <td className="lg-mono">{business.prefix}</td>
              <td>{business.bankName || "—"}</td>
              <td className="lg-mono">{business.accountNo || "—"}</td>
              <td>
                <button className="lg-btn-ghost" style={{ padding: "5px 8px" }} onClick={() => navigate("/settings")}><Pencil size={13} /></button>
              </td>
            </tr>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td className="lg-mono">{p.prefix}</td>
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