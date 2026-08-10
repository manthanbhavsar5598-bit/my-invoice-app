import React, { useState } from "react";
import ResetPassword from "./ResetPassword";

// Settings is User-scoped only: app preferences + password reset.
// Company info lives entirely under Company Profiles now.
export default function Settings({ settings, onSave }) {
  const [s, setS] = useState(settings);

  return (
    <div>
      <h1 className="lg-display" style={{ fontSize: 26, margin: "0 0 18px" }}>Settings</h1>

      <div className="lg-card" style={{ maxWidth: 500, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--ink-soft)" }}>Preferences</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Currency symbol</label>
          <input value={s.currencySymbol} onChange={(e) => setS({ ...s, currencySymbol: e.target.value })} style={{ maxWidth: 140 }} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 12px", color: "var(--ink-soft)" }}>Notifications</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 16, cursor: "pointer" }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={!!s.sendEmailOnInvoiceCreate}
            onChange={(e) => setS({ ...s, sendEmailOnInvoiceCreate: e.target.checked })}
          />
          Send an email automatically when a bill/invoice is created
        </label>

        <button className="lg-btn" onClick={() => onSave(s)}>Save settings</button>
      </div>

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 16, maxWidth: 500 }}>
        Manage company name, contact, bank details, and terms in the Company profiles tab — you can add as many as you need and pick one per invoice.
      </div>

      <ResetPassword email={settings.email} />
    </div>
  );
}