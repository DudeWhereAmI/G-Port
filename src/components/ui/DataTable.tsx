import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { EmptyState, Input, Skeleton, cx } from "./primitives";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  /** value used for sorting & search; omit to make the column non-sortable */
  sortValue?: (row: T) => number | string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchText?: (row: T) => string;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  initialSort?: { key: string; dir: 1 | -1 };
  selectedKey?: string | null;
  toolbar?: React.ReactNode;
  maxHeight?: number;
}

/** Sticky header, 44px rows, right-aligned numbers, sort / search / pagination. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  searchable,
  searchText,
  pageSize = 12,
  loading,
  emptyTitle,
  initialSort,
  selectedKey,
  toolbar,
  maxHeight,
}: DataTableProps<T>) {
  const { t } = useLanguage();
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(initialSort ?? null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = needle && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(needle)) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const x = col.sortValue!(a);
          const y = col.sortValue!(b);
          return (typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number)) * sort.dir;
        });
      }
    }
    return out;
  }, [rows, q, sort, columns, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div className="space-y-3">
      {(searchable || toolbar) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {searchable && (
            <Input
              icon={Search}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder={t("Search…", "Tìm kiếm…")}
              aria-label={t("Search table", "Tìm trong bảng")}
              className="w-full sm:w-72"
            />
          )}
          {toolbar}
        </div>
      )}
      <div className="border border-line rounded-card overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-line">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    style={c.width ? { width: c.width } : undefined}
                    className={cx("h-10 px-3 text-xs font-medium text-muted whitespace-nowrap", c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left")}
                    aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : undefined}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key ? ((s.dir * -1) as 1 | -1) : -1 }))}
                        className={cx("inline-flex items-center gap-1 hover:text-ink cursor-pointer", active && "text-ink")}
                      >
                        {c.header}
                        {active ? sort!.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {columns.map((c) => (
                      <td key={c.key} className="h-11 px-3">
                        <Skeleton className="h-3.5" />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.map((r) => {
                  const k = rowKey(r);
                  return (
                    <tr
                      key={k}
                      onClick={onRowClick ? () => onRowClick(r) : undefined}
                      onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(r) : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      className={cx(
                        "border-b border-line last:border-0 transition-colors",
                        onRowClick && "cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50",
                        selectedKey === k && "bg-brand-soft/60"
                      )}
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={cx("h-11 px-3 text-ink", c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left")}
                        >
                          {c.render(r)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <EmptyState compact title={emptyTitle ?? t("No results", "Không có kết quả")} />}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {t(
              `${current * pageSize + 1}–${Math.min(filtered.length, (current + 1) * pageSize)} of ${filtered.length}`,
              `${current * pageSize + 1}–${Math.min(filtered.length, (current + 1) * pageSize)} / ${filtered.length}`
            )}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={t("Previous page", "Trang trước")} disabled={current === 0} onClick={() => setPage(current - 1)} className="w-8 h-8 inline-flex items-center justify-center rounded-control hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" aria-label={t("Next page", "Trang sau")} disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="w-8 h-8 inline-flex items-center justify-center rounded-control hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
