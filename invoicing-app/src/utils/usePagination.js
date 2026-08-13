// =========================================================
// COMMON PAGINATION HOOK
// =========================================================
// One shared pagination implementation used by every listing
// screen in the app (Invoices, Clients, Purchase Invoices,
// Commission Entries, Items, Recurring, Reports, ...).
//
// Usage:
//   const pagination = usePagination(filteredRows);
//   pagination.pageItems   -> slice of `filteredRows` for the
//                              current page (render this, not
//                              the full array)
//   <Pagination {...pagination} />
//
// Keeping this logic in one place means every table gets the
// exact same page-size options, navigation behavior, and
// "showing X-Y of Z" copy, and any future tweak only needs to
// happen here.
// =========================================================
import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40];

export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export function usePagination(items, initialPageSize = DEFAULT_PAGE_SIZE) {
  const source = items || [];

  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = source.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp the current page whenever the underlying data set or
  // page size changes (e.g. a filter reduces the result count),
  // so we never render an empty "page 4 of 2" state.
  useEffect(() => {
    if (page > totalPages) {
      setPageState(totalPages);
    }
  }, [totalPages, page]);

  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return source.slice(start, start + pageSize);
  }, [source, safePage, pageSize]);

  function setPage(nextPage) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setPageState(clamped);
  }

  // Changing the page size always resets back to page 1 so the
  // visible rows stay predictable.
  function setPageSize(nextSize) {
    setPageSizeState(nextSize);
    setPageState(1);
  }

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    setPage,
    setPageSize,
  };
}