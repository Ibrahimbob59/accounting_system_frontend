import { useState, type ReactNode } from 'react'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Shown in place of rows when `data` is empty — e.g. "No invoices yet." */
  emptyState?: ReactNode
  className?: string
  /** Navigate-to-detail pattern (partners, and any future master list). Adds
   * a pointer cursor + click handler per row; omit for a purely static table. */
  onRowClick?: (row: TData) => void
}

/**
 * Thin, themed wrapper over TanStack Table (headless — no styling of its
 * own) and our own styled Table primitives (components/ui/table.tsx). This
 * is why TanStack Table was chosen over MUI's DataGrid: the markup is ours,
 * so it inherits tokens/radius/dark-mode for free instead of fighting a
 * second design system (see docs/CONVENTIONS.md).
 *
 * Sorting is wired in by default since almost every list needs it and it's
 * cheap. Pagination/filtering are deliberately NOT built in here — add them
 * per screen with TanStack's getPaginationRowModel/getFilteredRowModel
 * when a real list actually needs them, rather than speculatively.
 *
 * Sorting pitfall (found while verifying this component): sort operates on
 * whatever the column's accessor returns — if a money/date column's row
 * data holds a pre-formatted string ("$1,200.00"), it sorts
 * lexicographically ("$1,200.00" < "$450.00"), not numerically. Store the
 * raw number/Date in the row data and format only inside the column's
 * `cell` renderer, not in the data itself.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  emptyState,
  className,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    // `overflow-hidden` is load-bearing, not cosmetic: without it the header
    // row's fill squares off the container's rounded top corners.
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface',
        className
      )}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-text-primary"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sortDir === 'asc' && <ChevronUp className="size-3.5" />}
                        {sortDir === 'desc' && (
                          <ChevronDown className="size-3.5" />
                        )}
                        {!sortDir && (
                          <ChevronsUpDown className="size-3.5 text-text-disabled" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-text-muted"
              >
                {emptyState ?? 'No data'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
