import React from "react";

export default function Metric({ icon: Icon, label, value, accent, tint }) {
  return (
    <div className="lg-card lg-metric" style={{ borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)" }}>{label}</div>
        {Icon && (
          <div style={{ width: 30, height: 30, borderRadius: 8, background: tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={15} color={accent} />
          </div>
        )}
      </div>
      <div className="lg-mono" style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}