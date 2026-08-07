import React, { useState } from "react";

export default function Settings({ business, onSave }) {
  const [b, setB] = useState(business);

  return (
    <div>
      <h1 className="lg-display" style={{ fontSize: 26, margin: "0 0 18px" }}>Settings</h1>
      <div className="lg-card" style={{ maxWidth: 500 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--ink-soft)" }}>Primary company profile</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Business name</label>
          <input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Email</label>
          <input value={b.email} onChange={(e) => setB({ ...b, email: e.target.value })} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Phone</label>
          <input value={b.phone} onChange={(e) => setB({ ...b, phone: e.target.value })} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Address</label>
          <textarea rows={2} value={b.address} onChange={(e) => setB({ ...b, address: e.target.value })} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>GST number</label>
          <input value={b.gstNumber} onChange={(e) => setB({ ...b, gstNumber: e.target.value })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Currency symbol</label>
            <input value={b.currencySymbol} onChange={(e) => setB({ ...b, currencySymbol: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Invoice prefix</label>
            <input value={b.prefix} onChange={(e) => setB({ ...b, prefix: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Next number</label>
            <input type="number" value={b.nextNumber} onChange={(e) => setB({ ...b, nextNumber: Number(e.target.value) })} />
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 12px", color: "var(--ink-soft)" }}>Bank details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Bank name</label>
            <input value={b.bankName} onChange={(e) => setB({ ...b, bankName: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Branch name</label>
            <input value={b.branchName} onChange={(e) => setB({ ...b, branchName: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Account no</label>
            <input value={b.accountNo} onChange={(e) => setB({ ...b, accountNo: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>IFSC code</label>
            <input value={b.ifscCode} onChange={(e) => setB({ ...b, ifscCode: e.target.value })} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Terms & conditions (one per line)</label>
          <textarea rows={5} value={b.terms} onChange={(e) => setB({ ...b, terms: e.target.value })} />
        </div>
        <button className="lg-btn" onClick={() => onSave(b)}>Save settings</button>
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12, maxWidth: 500 }}>
        Bill under more than one business name? Manage those in the Company profiles tab.
      </div>
    </div>
  );
}