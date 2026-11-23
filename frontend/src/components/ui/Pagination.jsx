"use client";

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-xs text-muted">
      <span>
        Showing <strong className="text-primary">{start}–{end}</strong> of{" "}
        <strong className="text-primary">{totalItems}</strong>
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-full border border-border bg-white px-3.5 py-1.5 font-semibold text-primary hover:bg-primary/5 disabled:opacity-40"
        >
          Previous
        </button>

        <span className="px-2 font-semibold text-primary">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-full border border-border bg-white px-3.5 py-1.5 font-semibold text-primary hover:bg-primary/5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}