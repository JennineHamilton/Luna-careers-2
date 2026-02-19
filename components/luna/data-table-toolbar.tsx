'use client';

import * as React from 'react';
import { Search, Download, Filter, X, FileText, FileSpreadsheet, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaInput } from './input';
import { LunaButton } from './button';
import { LunaCombobox, type ComboboxOption } from './combobox';
import { LunaDateRangePicker, type DateRange } from './date-range-picker';
import { LunaSeparator } from './separator';

export interface DataTableFilter {
  /** Filter column key */
  column: string;
  /** Filter label */
  label: string;
  /** Filter options */
  options: ComboboxOption[];
}

export interface LunaDataTableToolbarProps {
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Available filters */
  filters?: DataTableFilter[];
  /** Active filters - now supports multiple values per filter */
  activeFilters?: Record<string, string[]>;
  /** Filter change handler - now receives array of values */
  onFilterChange?: (column: string, values: string[]) => void;
  /** Date range filter */
  dateRange?: DateRange;
  /** Date range change handler */
  onDateRangeChange?: (range: DateRange | undefined) => void;
  /** CSV export handler */
  onExportCSV?: () => void;
  /** PDF export handler */
  onExportPDF?: () => void;
  /** Excel export handler */
  onExportExcel?: () => void;
  /** Create button handler */
  onCreateClick?: () => void;
  /** Create button label */
  createLabel?: string;
  /** Create button icon */
  createIcon?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * LunaDataTableToolbar - Toolbar with search, filters, and export for data tables.
 *
 * @example
 * ```tsx
 * <LunaDataTableToolbar
 *   searchPlaceholder="Search users..."
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   filters={[
 *     { column: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }] }
 *   ]}
 *   onExport={() => exportToCSV()}
 * />
 * ```
 */
export function LunaDataTableToolbar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onExportCSV,
  onExportPDF,
  onExportExcel,
  onCreateClick,
  createLabel = 'Create',
  createIcon,
  className,
}: LunaDataTableToolbarProps) {
  const hasActiveFilters = Object.values(activeFilters).some((values) => values && values.length > 0);
  const hasDateFilter = dateRange?.from || dateRange?.to;

  const clearFilters = () => {
    filters.forEach((filter) => {
      onFilterChange?.(filter.column, []);
    });
    onDateRangeChange?.(undefined);
  };

  return (
    <div
      data-slot="luna-data-table-toolbar"
      className={cn('mt-4 mb-6', className)}
    >
      {/* Top separator */}
      <LunaSeparator className="mb-3" />

      {/* Main toolbar - Responsive layout */}
      <div className="flex flex-col gap-3">
        {/* Filters row - wraps on smaller screens */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="w-full sm:w-auto sm:min-w-[200px] lg:min-w-[240px] flex-1 lg:flex-initial">
            <LunaInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-9 text-sm w-full"
            />
          </div>

          {/* Filters - Multiselect Combobox */}
          {filters.map((filter) => (
            <div key={filter.column} className="w-full sm:w-auto sm:min-w-[140px] lg:min-w-[160px] flex-1 lg:flex-initial">
              <LunaCombobox
                options={filter.options}
                value={activeFilters[filter.column] || []}
                onChange={(values) => onFilterChange?.(filter.column, values)}
                placeholder={filter.label}
                searchPlaceholder={`Search ${filter.label.toLowerCase()}...`}
                className="h-9 text-sm w-full"
              />
            </div>
          ))}

          {/* Date Range Picker */}
          {onDateRangeChange && (
            <div className="w-full sm:w-auto sm:min-w-[180px] lg:min-w-[200px] flex-1 lg:flex-initial">
              <LunaDateRangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                placeholder="Date range"
                className="h-9 text-sm w-full"
              />
            </div>
          )}

          {/* Clear filters */}
          {(hasActiveFilters || hasDateFilter) && (
            <LunaButton
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </LunaButton>
          )}

          {/* Spacer to push action buttons to the right on desktop */}
          <div className="hidden lg:block flex-1" />

          {/* Action buttons */}
          <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
            {/* Export buttons - Icon only */}
            {onExportCSV && (
              <LunaButton
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                title="Export to CSV"
                className="h-9 w-9 p-0"
              >
                <FileText className="w-4 h-4" />
              </LunaButton>
            )}
            {onExportPDF && (
              <LunaButton
                variant="outline"
                size="sm"
                onClick={onExportPDF}
                title="Export to PDF"
                className="h-9 w-9 p-0"
              >
                <File className="w-4 h-4" />
              </LunaButton>
            )}
            {onExportExcel && (
              <LunaButton
                variant="outline"
                size="sm"
                onClick={onExportExcel}
                title="Export to Excel"
                className="h-9 w-9 p-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </LunaButton>
            )}

            {/* Create button */}
            {onCreateClick && (
              <LunaButton
                variant="primary"
                size="sm"
                onClick={onCreateClick}
                className="h-9 text-sm"
              >
                {createIcon && <span className="mr-2">{createIcon}</span>}
                {createLabel}
              </LunaButton>
            )}
          </div>
        </div>
      </div>

      {/* Bottom separator */}
      <LunaSeparator className="mt-3" />
    </div>
  );
}

