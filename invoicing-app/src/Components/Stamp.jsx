import React from "react";

const STATUS_STYLE = {
  draft: { color: "var(--ink-soft)", label: "draft" },
  sent: { color: "var(--gold)", label: "sent" },
  paid: { color: "var(--ledger-green)", label: "paid" },
  overdue: { color: "var(--stamp-red)", label: "overdue" },
};

export default function Stamp({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span
      style={{
        display: "inline-block",
        border: `2px solid ${s.color}`,
        color: s.color,
        borderRadius: 4,
        padding: "2px 10px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontWeight: 700,
        transform: "rotate(-4deg)",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}