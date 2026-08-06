import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  enableSelection = false,
  bulkActions,
  emptyState,
  onRowClick,
  stickyHeader = true,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  pageSize?: number;
  enableSelection?: boolean;
  bulkActions?: (selectedCount: number, clear: () => void) => ReactNode;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const selectedCount = table.getSelectedRowModel().rows.length;

  if (data.length === 0 && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <div className="space-y-3">
      {enableSelection && selectedCount > 0 && bulkActions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/8 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">
            {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions(selectedCount, () => setRowSelection({}))}
          </div>
        </div>
      ) : null}

      <div className="scroll-slim overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead className={cn(stickyHeader && "sticky top-0 z-10", "bg-card/95 backdrop-blur")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0 hover:bg-elevated/60",
                  row.getIsSelected() && "bg-primary/6",
                  onRowClick && "cursor-pointer",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)} ·{" "}
          {data.length} record{data.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
