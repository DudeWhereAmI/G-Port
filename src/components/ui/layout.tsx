import React from "react";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { cx } from "./primitives";
import { BRAND, NEUTRAL, STATUS } from "../../theme/tokens";

// ---------------------------------------------------------------------------
// PageHeader
// ---------------------------------------------------------------------------

interface PageHeaderProps {
  breadcrumb: string[];
  title: string;
  description?: string;
  /** at most one primary button; others secondary / ghost */
  actions?: React.ReactNode;
  /** "Updated HH:MM · Source: … · Version #n" */
  meta?: React.ReactNode;
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ breadcrumb, title, description, actions, meta, extra }) => (
  <header className="space-y-3">
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-label text-muted">
      {breadcrumb.map((b, i) => (
        <React.Fragment key={b}>
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
          <span className={i === breadcrumb.length - 1 ? "text-ink font-medium" : ""}>{b}</span>
        </React.Fragment>
      ))}
    </nav>
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
        {meta && <div className="text-xs text-muted flex flex-wrap items-center gap-x-2 gap-y-1">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
    {extra}
  </header>
);

/** "a · b · c" meta line helper. */
export const MetaLine: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <>
    {items.filter(Boolean).map((it, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span aria-hidden="true">·</span>}
        <span>{it}</span>
      </React.Fragment>
    ))}
  </>
);

// ---------------------------------------------------------------------------
// Card / ChartCard
// ---------------------------------------------------------------------------

export const Card: React.FC<{ children: React.ReactNode; className?: string; id?: string; padded?: boolean }> = ({ children, className, id, padded = true }) => (
  <section id={id} className={cx("bg-white border border-line rounded-card min-w-0 scroll-mt-20", padded && "p-5", className)}>
    {children}
  </section>
);

interface ChartCardProps {
  title: string;
  description?: string;
  toolbar?: React.ReactNode;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/** Title + one-line description + right toolbar, chart, legend below. */
export const ChartCard: React.FC<ChartCardProps> = ({ title, description, toolbar, legend, children, className, id }) => (
  <Card id={id} className={cx("space-y-4", className)}>
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="text-label text-muted mt-0.5">{description}</p>}
      </div>
      {toolbar && <div className="flex flex-wrap items-center gap-2 shrink-0">{toolbar}</div>}
    </div>
    {children}
    {legend && <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">{legend}</div>}
  </Card>
);

export const LegendDot: React.FC<{ color: string; label: string; kind?: "line" | "dashed" | "area" }> = ({ color, label, kind = "area" }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    {kind === "area" ? (
      <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
    ) : (
      <span className="w-4 border-t-2" style={{ borderColor: color, borderStyle: kind === "dashed" ? "dashed" : "solid" }} />
    )}
    {label}
  </span>
);

/** Shared chart tooltip surface. */
export const ChartTooltipBox: React.FC<{ title?: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white border border-line rounded-control shadow-overlay px-3 py-2 text-xs text-ink min-w-[180px] space-y-1">
    {title && <div className="font-semibold text-ink">{title}</div>}
    {children}
  </div>
);

export const ChartTooltipRow: React.FC<{ color: string; label: string; value: string; strong?: boolean }> = ({ color, label, value, strong }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="flex items-center gap-1.5 text-muted">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
    <span className={cx("tabular-nums text-ink", strong ? "font-semibold" : "font-medium")}>{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// KpiCard
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  /** e.g. { value: "−7,2%", direction: "down", good: true } */
  delta?: { value: string; direction: "up" | "down"; good: boolean };
  hint?: React.ReactNode;
  spark?: number[];
  /** the single accent on the page */
  accent?: "danger" | "warning" | "success";
  onClick?: () => void;
  footer?: React.ReactNode;
}

const ACCENT_BAR = { danger: STATUS.danger.dot, warning: STATUS.warning.dot, success: STATUS.success.dot };

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const w = 72;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={BRAND.main} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
};

/** Same height and structure on every page. */
export const KpiCard: React.FC<KpiCardProps> = ({ label, value, unit, delta, hint, spark, accent, onClick, footer }) => {
  const Comp: React.ElementType = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx(
        "relative text-left bg-white border border-line rounded-card p-4 min-h-[112px] flex flex-col justify-between gap-2 overflow-hidden",
        onClick && "hover:border-slate-300 transition-colors cursor-pointer"
      )}
    >
      {accent && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: ACCENT_BAR[accent] }} aria-hidden="true" />}
      <div className="flex items-start justify-between gap-2">
        <span className="text-label font-medium text-muted">{label}</span>
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-kpi font-semibold text-ink tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
        {delta && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium ml-1"
            style={{ color: delta.good ? STATUS.success.text : STATUS.danger.text }}
          >
            {delta.direction === "up" ? <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
            {delta.value}
          </span>
        )}
      </div>
      {(hint || footer) && (
        <div className="text-xs text-muted truncate" title={typeof hint === "string" ? hint : undefined}>
          {hint}
          {footer}
        </div>
      )}
    </Comp>
  );
};

export const KpiRow: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{children}</div>;

export { NEUTRAL };
