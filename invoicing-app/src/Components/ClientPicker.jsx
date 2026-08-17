import React, { useState, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

export default function ClientPicker({ clients, value, onChange, valueKey = "id", placeholder = "Search customers…", allowCustom = false }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const wrapRef = useRef(null);
  const selected = clients.find((c) => c[valueKey] === value);
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  // The dropdown is rendered in a portal (see below) so a scrollable or
  // overflow-clipped ancestor — e.g. a horizontally-scrollable line-item
  // row — can never cut it off. Since it's no longer a normal DOM child
  // of this input, its position has to be measured and tracked manually.
  const updateMenuRect = useCallback(() => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setMenuRect({ top: r.bottom, left: r.left, width: r.width });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuRect();
    window.addEventListener("scroll", updateMenuRect, true);
    window.addEventListener("resize", updateMenuRect);
    return () => {
      window.removeEventListener("scroll", updateMenuRect, true);
      window.removeEventListener("resize", updateMenuRect);
    };
  }, [open, updateMenuRect]);

  // When allowCustom is on, a typed name that doesn't match any saved
  // client is still a valid value (e.g. a one-off party not yet in the
  // client list) — commit it instead of silently discarding it on blur.
  function commitCustomIfNeeded() {
    if (allowCustom && query.trim()) {
      onChange(query.trim());
    }
    setQuery("");
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--ink-soft)" }} />
        <input
          placeholder={placeholder}
          value={open ? query : (selected ? selected.name : (allowCustom ? (value || "") : ""))}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => { setOpen(false); commitCustomIfNeeded(); }, 150)}
          style={{ paddingLeft: 30 }}
        />
      </div>
      {open && menuRect && createPortal(
        <div
          style={{
            position: "fixed",
            top: menuRect.top,
            left: menuRect.left,
            width: menuRect.width,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 4,
            marginTop: 4,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          }}
        >
          {clients.length === 0 ? (
            <div style={{ padding: 10, fontSize: 13, color: "var(--ink-soft)" }}>
              {allowCustom ? "No saved clients yet — you can still type a name to use it directly." : "No clients yet — add one from the Clients tab."}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 10, fontSize: 13, color: "var(--ink-soft)" }}>
              {allowCustom ? "No matches — this name will be used as typed." : "No matches."}
            </div>
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
        </div>,
        document.body
      )}
    </div>
  );
}