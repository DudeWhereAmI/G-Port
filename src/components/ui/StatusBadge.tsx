import React from "react";
import type { StatusTone } from "../../theme/tokens";

/**
 * One status → tone mapping for the whole app. Every badge in every module
 * goes through this table, so the same state always has the same colour.
 */
export const STATUS_TONE: Record<string, StatusTone> = {
  // load / substation (M-1)
  NORMAL: "success",
  HIGH_SOLAR: "info",
  WARNING: "warning",
  OVERLOAD: "danger",
  // approvals (M-3)
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  AUTO: "info",
  RUNNING: "info",
  LOCKED_GROUP: "neutral",
  // records (M-2)
  DRAFT: "neutral",
  RECONCILED: "info",
  LOCKED: "info",
  SHARED: "success",
  // data level (M-2)
  MEASURED: "success",
  ALLOCATED: "info",
  ESTIMATED: "warning",
  // generic
  RESOLVED: "success",
  INVESTIGATING: "warning",
  OK: "success",
  FAIL: "danger",
  INFO: "info",
};

const TONE_CLASS: Record<StatusTone, { pill: string; dot: string }> = {
  success: { pill: "bg-success-soft text-success", dot: "bg-success-dot" },
  warning: { pill: "bg-warning-soft text-warning", dot: "bg-warning-dot" },
  danger: { pill: "bg-danger-soft text-danger", dot: "bg-danger-dot" },
  info: { pill: "bg-info-soft text-info", dot: "bg-info-dot" },
  neutral: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

interface StatusBadgeProps {
  /** a key of STATUS_TONE, or an explicit tone */
  status?: string;
  tone?: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
  title?: string;
}

/** Small pill: 12px, soft background, medium weight, coloured dot. */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, tone, children, dot = true, title }) => {
  const t = tone ?? (status ? STATUS_TONE[status] : undefined) ?? "neutral";
  const c = TONE_CLASS[t];
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-xs font-medium whitespace-nowrap ${c.pill}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} aria-hidden="true" />}
      {children}
    </span>
  );
};

/** Neutral grey tag (module codes, categories). */
export const Tag: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
  <span title={title} className="inline-flex items-center h-5 px-1.5 rounded-[4px] bg-slate-100 text-slate-600 text-[11px] font-medium leading-none">
    {children}
  </span>
);
