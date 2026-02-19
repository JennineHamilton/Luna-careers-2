'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from './button';

export interface LunaPaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Number of page buttons to show */
  siblingCount?: number;
  /** Additional className */
  className?: string;
}

/**
 * LunaPagination - Pagination component for tables and lists.
 *
 * @example
 * ```tsx
 * <LunaPagination
 *   currentPage={3}
 *   totalPages={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 *   showFirstLast
 * />
 * ```
 */
export function LunaPagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  className,
}: LunaPaginationProps) {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // + 2 ellipsis

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = Array.from(
        { length: 3 + siblingCount * 2 },
        (_, i) => totalPages - (3 + siblingCount * 2) + i + 1
      );
      return [1, '...', ...rightRange];
    }

    if (showLeftEllipsis && showRightEllipsis) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <nav
      data-slot="luna-pagination"
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      {/* First Page */}
      {showFirstLast && (
        <LunaButton
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          icon={<ChevronsLeft className="w-4 h-4" />}
          aria-label="First page"
        />
      )}

      {/* Previous Page */}
      <LunaButton
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        icon={<ChevronLeft className="w-4 h-4" />}
        aria-label="Previous page"
      />

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-luna-gray-400">
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        return (
          <LunaButton
            key={pageNumber}
            variant={currentPage === pageNumber ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
            aria-label={`Page ${pageNumber}`}
            aria-current={currentPage === pageNumber ? 'page' : undefined}
          >
            {pageNumber}
          </LunaButton>
        );
      })}

      {/* Next Page */}
      <LunaButton
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        icon={<ChevronRight className="w-4 h-4" />}
        aria-label="Next page"
      />

      {/* Last Page */}
      {showFirstLast && (
        <LunaButton
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          icon={<ChevronsRight className="w-4 h-4" />}
          aria-label="Last page"
        />
      )}
    </nav>
  );
}

