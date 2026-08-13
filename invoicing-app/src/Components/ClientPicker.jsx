import React, { useState } from "react";
import { Search } from "lucide-react";

export default function ClientPicker({ clients, value, onChange, valueKey = "id", placeholder = "Search customers…" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c[valueKey] === value);
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--ink-soft)" }} />
        <input
          placeholder={placeholder}
          value={open ? query : (selected ? selected.name : "")}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ paddingLeft: 30 }}
        />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 4, marginTop: 4, maxHeight: 200, overflowY: "auto", zIndex: 10, boxShadow: "0 4px 10px rgba(0,0,0,0.08)" }}>
          {clients.length === 0 ? (
            <div style={{ padding: 10, fontSize: 13, color: "var(--ink-soft)" }}>No clients yet — add one from the Clients tab.</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 10, fontSize: 13, color: "var(--ink-soft)" }}>No matches.</div>
          ) : filtered.map((c) => (
            <div
              key={c.id}
              style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer" }}
              onMouseDown={() => { onChange(c[valueKey]); setQuery(""); setOpen(false); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-dark)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}