import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  // Generate page numbers with ellipsis if many pages
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      aria-label="Gallery pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-stone-200"
    >
      <div className="text-xs text-stone-500">
        Page <strong className="text-stone-800 font-semibold">{currentPage}</strong> of{' '}
        <strong className="text-stone-800 font-semibold">{totalPages}</strong> (20 paintings per page)
      </div>

      <div className="flex items-center space-x-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          id="pagination-prev-btn"
          className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Number buttons */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-stone-400 text-xs">
                  ...
                </span>
              );
            }

            const pageNum = Number(page);
            const isActive = currentPage === pageNum;

            return (
              <button
                key={`page-${pageNum}`}
                id={`pagination-page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 shadow-xs'
                    : 'border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-950'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          id="pagination-next-btn"
          className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
