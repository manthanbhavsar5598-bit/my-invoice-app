import React, { useState } from "react";
import { X } from "lucide-react";

export default function EntityForm({ entity, fields, onSave, onCancel }) {
  const [e, setE] = useState(entity);

  return (
    <div className="lg-card" style={{ marginBottom: 16 }}>
      <div className="resp-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {fields.map((f) => (
          <div key={f.key} style={f.type === "textarea" ? { gridColumn: "1 / -1" } : {}}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>{f.label}</label>
            {f.type === "textarea" ? (
              <textarea rows={2} value={e[f.key]} onChange={(ev) => setE({ ...e, [f.key]: ev.target.value })} />
            ) : (
              <input type={f.type || "text"} value={e[f.key]} onChange={(ev) => setE({ ...e, [f.key]: ev.target.value })} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button className="lg-btn" onClick={() => onSave(e)}>Save</button>
        <button className="lg-btn-ghost" onClick={onCancel}><X size={13} /> Cancel</button>
      </div>
    </div>
  );
}