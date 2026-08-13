import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "../utils/usePagination";

// =========================================================
// COMMON PAGINATION COMPONENT
// =========================================================
// Renders the "rows per page" selector, the "showing X-Y of Z"
// summary, and prev/next page navigation. Pair with the
// `usePagination` hook — pass its return value straight through:
//
//   const pagination = usePagination(rows);
//   ...
//   <Pagination {...pagination} />
//
// Used across every table listing in the app so pagination looks
// and behaves identically everywhere.
// =========================================================
export default function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  setPage,
  setPageSize,
}) {
  if (!totalItems) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        padding: "12px 16px",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
        Showing {start}–{end} of {totalItems}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ width: 76, padding: "4px 6px" }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            className="lg-btn-ghost"
            style={{ padding: "5px 8px" }}
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: "var(--ink-soft)", minWidth: 76, textAlign: "center" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="lg-btn-ghost"
            style={{ padding: "5px 8px" }}
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}