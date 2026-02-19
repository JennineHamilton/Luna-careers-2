'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaCheckbox } from './checkbox';
import { LunaPagination } from './pagination';
import { LunaEmptyState } from './empty-state';

export interface DataTableColumn<T> {
  /** Column header label */
  header: string;
  /** Accessor key for the data */
  accessorKey: keyof T;
  /** Custom cell renderer */
  cell?: (row: T) => React.ReactNode;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom className for the column */
  className?: string;
  /** Custom header className */
  headerClassName?: string;
}

export interface LunaDataTableProps<T> {
  /** Table columns configuration */
  columns: DataTableColumn<T>[];
  /** Table data */
  data: T[];
  /** Additional className for the table wrapper */
  className?: string;
  /** Whether to show striped rows */
  striped?: boolean;
  /** Whether to show hover effect on rows */
  hoverable?: boolean;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Enable multi-select with checkboxes */
  selectable?: boolean;
  /** Selected rows */
  selectedRows?: T[];
  /** Selection change handler */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Row ID accessor for selection */
  rowIdAccessor?: keyof T;
  /** Actions column renderer */
  actionsColumn?: (row: T) => React.ReactNode;
  /** Enable pagination (default: true) */
  paginated?: boolean;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Available page sizes */
  pageSizeOptions?: number[];
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * LunaDataTable - A data table component with sorting and customization.
 *
 * @example
 * ```tsx
 * <LunaDataTable
 *   columns={[
 *     { header: 'Name', accessorKey: 'name', sortable: true },
 *     { header: 'Email', accessorKey: 'email' },
 *     { header: 'Status', accessorKey: 'status', cell: (row) => <LunaBadge>{row.status}</LunaBadge> },
 *   ]}
 *   data={users}
 *   striped
 *   hoverable
 *   onRowClick={(row) => console.log(row)}
 * />
 * ```
 */
export function LunaDataTable<T extends Record<string, any>>({
  columns,
  data,
  className,
  striped = false,
  hoverable = true,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  loadingMessage = 'Loading...',
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowIdAccessor = 'id' as keyof T,
  actionsColumn,
  paginated = true,
  pageSize = 10,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 25, 50, 100],
}: LunaDataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [currentPageSize, setCurrentPageSize] = React.useState(pageSize);

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.accessorKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column.accessorKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = React.useMemo(() => {
    if (!paginated) return 1;
    return Math.ceil(sortedData.length / currentPageSize);
  }, [paginated, sortedData.length, currentPageSize]);

  const paginatedData = React.useMemo(() => {
    if (!paginated) return sortedData;
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [paginated, sortedData, currentPage, currentPageSize]);

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length, currentPageSize]);

  const getSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;

    if (sortColumn === column.accessorKey) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      );
    }

    return <ChevronsUpDown className="w-4 h-4 text-luna-gray-400" />;
  };

  // Selection logic
  const isRowSelected = (row: T) => {
    return selectedRows.some((selectedRow) => selectedRow[rowIdAccessor] === row[rowIdAccessor]);
  };

  const toggleRowSelection = (row: T) => {
    if (!onSelectionChange) return;

    if (isRowSelected(row)) {
      onSelectionChange(selectedRows.filter((r) => r[rowIdAccessor] !== row[rowIdAccessor]));
    } else {
      onSelectionChange([...selectedRows, row]);
    }
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;

    // Select/deselect all on current page
    const dataToSelect = paginated ? paginatedData : sortedData;
    const allCurrentPageSelected = dataToSelect.every(row => isRowSelected(row));

    if (allCurrentPageSelected) {
      // Deselect all on current page
      const idsToDeselect = new Set(dataToSelect.map(row => row[rowIdAccessor]));
      onSelectionChange(selectedRows.filter(row => !idsToDeselect.has(row[rowIdAccessor])));
    } else {
      // Select all on current page
      const newSelections = dataToSelect.filter(row => !isRowSelected(row));
      onSelectionChange([...selectedRows, ...newSelections]);
    }
  };

  const dataToCheck = paginated ? paginatedData : sortedData;
  const isAllSelected = dataToCheck.length > 0 && dataToCheck.every(row => isRowSelected(row));
  const isSomeSelected = selectedRows.length > 0 && !isAllSelected;

  return (
    <div data-slot="luna-data-table-wrapper" className={cn('w-full overflow-x-auto rounded-md border border-luna-border-default', className)}>
      <table className="w-full border-collapse relative">
        <thead className="bg-luna-gray-50 border-b border-luna-border-default">
          <tr>
            {/* Checkbox column header - Sticky left */}
            {selectable && (
              <th className="sticky left-0 z-20 px-4 py-3 w-12 bg-luna-gray-50 border-b border-luna-border-default border-r border-luna-border-default">
                <LunaCheckbox
                  checked={isAllSelected}
                  {...(isSomeSelected && { indeterminate: true })}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelectAll();
                  }}
                />
              </th>
            )}

            {columns.map((column, index) => {
              const isFirstColumn = index === 0;
              const stickyLeft = selectable ? 'left-12' : 'left-0';

              return (
                <th
                  key={index}
                  className={cn(
                    'px-4 py-3 text-sm font-semibold text-luna-gray-700 border-b border-luna-border-default text-left',
                    column.sortable && 'cursor-pointer select-none hover:bg-luna-gray-100',
                    column.headerClassName,
                    isFirstColumn && 'sticky z-10 bg-luna-gray-50 border-r border-luna-border-default shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)]',
                    isFirstColumn && stickyLeft
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2 justify-start">
                    <span>{column.header}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              );
            })}

            {/* Actions column header - Sticky right */}
            {actionsColumn && (
              <th className="sticky right-0 z-10 px-4 py-3 text-left text-sm font-semibold text-luna-gray-700 w-20 bg-luna-gray-50 border-b border-luna-border-default border-l border-luna-border-default shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.08)]">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0) + (actionsColumn ? 1 : 0)} className="px-4 py-8 text-center text-luna-gray-500">
                {loadingMessage}
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0) + (actionsColumn ? 1 : 0)} className="p-0">
                <LunaEmptyState
                  icon={SearchX}
                  title="No results found"
                  description={emptyMessage}
                  size="sm"
                />
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIndex) => {
              const isSelected = isRowSelected(row);

              return (
                <tr
                  key={rowIndex}
                  className={cn(
                    'group border-b border-luna-border-default last:border-b-0',
                    striped && rowIndex % 2 === 1 && 'bg-luna-gray-50/50',
                    hoverable && 'hover:bg-luna-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-luna-primary-50'
                  )}
                >
                  {/* Checkbox column - Sticky left */}
                  {selectable && (
                    <td
                      className={cn(
                        'sticky left-0 z-10 px-4 py-3 border-b border-r border-luna-border-default transition-colors',
                        isSelected ? 'bg-luna-primary-50' : 'bg-white',
                        striped && rowIndex % 2 === 1 && !isSelected && 'bg-luna-gray-50',
                        hoverable && !isSelected && 'group-hover:bg-luna-gray-50'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LunaCheckbox
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleRowSelection(row);
                        }}
                      />
                    </td>
                  )}

                  {columns.map((column, colIndex) => {
                    const isFirstColumn = colIndex === 0;
                    const stickyLeft = selectable ? 'left-12' : 'left-0';

                    return (
                      <td
                        key={colIndex}
                        className={cn(
                          'px-4 py-3 text-sm text-luna-gray-900 border-b border-luna-border-default transition-colors text-left',
                          column.className,
                          isFirstColumn && 'sticky z-10 border-r border-luna-border-default shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)]',
                          isFirstColumn && stickyLeft,
                          isFirstColumn && isSelected && 'bg-luna-primary-50',
                          isFirstColumn && !isSelected && 'bg-white',
                          isFirstColumn && striped && rowIndex % 2 === 1 && !isSelected && 'bg-luna-gray-50',
                          isFirstColumn && hoverable && !isSelected && 'group-hover:bg-luna-gray-50'
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {column.cell ? column.cell(row) : String(row[column.accessorKey] ?? '')}
                      </td>
                    );
                  })}

                  {/* Actions column - Sticky right */}
                  {actionsColumn && (
                    <td
                      className={cn(
                        'sticky right-0 z-10 px-4 py-3 border-b border-l border-luna-border-default shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.08)] transition-colors',
                        'text-left',
                        isSelected ? 'bg-luna-primary-50' : 'bg-white',
                        striped && rowIndex % 2 === 1 && !isSelected && 'bg-luna-gray-50',
                        hoverable && !isSelected && 'group-hover:bg-luna-gray-50'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actionsColumn(row)}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-luna-border-default bg-white">
          {/* Page size selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2 text-sm text-luna-gray-600">
              <span>Show</span>
              <select
                value={currentPageSize}
                onChange={(e) => setCurrentPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-luna-border-default rounded-md bg-white text-luna-gray-900 focus:outline-none focus:ring-2 focus:ring-luna-primary-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>
          )}

          {/* Pagination controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-luna-gray-600">
              Showing {((currentPage - 1) * currentPageSize) + 1} to {Math.min(currentPage * currentPageSize, sortedData.length)} of {sortedData.length} entries
            </span>
            <LunaPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showFirstLast
            />
          </div>
        </div>
      )}
    </div>
  );
}

