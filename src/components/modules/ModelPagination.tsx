import * as React from "react";
import { Button } from "@/components/ui/Button";
import { PaginationMeta } from "@/types";

interface ModelPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  isLoading?: boolean;
}

export function ModelPagination({
  pagination,
  onPageChange,
  onLimitChange,
  isLoading,
}: ModelPaginationProps) {
  const { page, totalPages, total, limit, hasNextPage, hasPrevPage } = pagination;

  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display (current page +/- 2)
  const pageNumbers: number[] = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
      {/* Items count summary & limit selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="font-mono">
          Showing <strong className="text-white font-medium">{startItem}</strong> -{" "}
          <strong className="text-white font-medium">{endItem}</strong> of{" "}
          <strong className="text-white font-medium">{total}</strong> models
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <label htmlFor="limitSelect" className="text-slate-400 hidden md:inline">
            Per page:
          </label>
          <select
            id="limitSelect"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={isLoading}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-sky-500 cursor-pointer disabled:opacity-50"
          >
            <option value="6">6</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
      </div>

      {/* Page navigation buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || isLoading}
          className="text-xs px-2.5 py-1 h-auto"
        >
          &larr; Prev
        </Button>

        <div className="flex items-center gap-1">
          {startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className="w-7 h-7 rounded text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                1
              </button>
              {startPage > 2 && <span className="text-slate-400 px-1">...</span>}
            </>
          )}

          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={isLoading || p === page}
              className={`w-7 h-7 rounded text-xs font-mono transition-colors ${
                p === page
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-slate-400 px-1">...</span>}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className="w-7 h-7 rounded text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isLoading}
          className="text-xs px-2.5 py-1 h-auto"
        >
          Next &rarr;
        </Button>
      </div>
    </div>
  );
}
