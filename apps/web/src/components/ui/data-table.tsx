import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<Row> = { key: string; header: ReactNode; cell: (row: Row) => ReactNode; className?: string };

export function DataTable<Row>({ columns, rows, getRowId, caption, empty, className }: { columns: DataTableColumn<Row>[]; rows: Row[]; getRowId: (row: Row) => string; caption?: string; empty?: ReactNode; className?: string }) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return <div className={cn("overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]", className)}><table className="w-full min-w-[640px] border-collapse text-left text-sm">{caption ? <caption className="sr-only">{caption}</caption> : null}<thead className="bg-[var(--muted-surface)] text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted-strong)]"><tr>{columns.map((column) => <th key={column.key} scope="col" className={cn("px-4 py-3", column.className)}>{column.header}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{rows.map((row) => <tr key={getRowId(row)} className="transition-colors hover:bg-[var(--muted-surface)]">{columns.map((column) => <td key={column.key} className={cn("px-4 py-3.5 align-middle", column.className)}>{column.cell(row)}</td>)}</tr>)}</tbody></table></div>;
}
