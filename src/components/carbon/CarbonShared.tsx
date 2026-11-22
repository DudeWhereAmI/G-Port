import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { StatusBadge } from "../ui";
import { DataLevel, RecordStatus } from "../../data/module2Carbon";

export const LEVEL_STYLE: Record<DataLevel, string> = {
  MEASURED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ALLOCATED: "bg-blue-50 text-blue-800 border-blue-200",
  ESTIMATED: "bg-amber-50 text-amber-900 border-amber-200",
};

export function useLevelLabel() {
  const { t } = useLanguage();
  return (l: DataLevel) =>
    l === "MEASURED" ? t("Measured", "Đo trực tiếp") : l === "ALLOCATED" ? t("Allocated", "Phân bổ") : t("Estimated", "Ước tính");
}

export const LevelBadge: React.FC<{ level: DataLevel }> = ({ level }) => {
  const label = useLevelLabel();
  return <StatusBadge status={level}>{label(level)}</StatusBadge>;
};

export const STATUS_STEPS: RecordStatus[] = ["DRAFT", "RECONCILED", "LOCKED", "SHARED"];

export function useStatusLabel() {
  const { t } = useLanguage();
  return (s: RecordStatus) =>
    s === "DRAFT"
      ? t("Draft", "Bản nháp")
      : s === "RECONCILED"
      ? t("Reconciled", "Đã đối soát")
      : s === "LOCKED"
      ? t("Locked (SHA-256)", "Đã khóa (SHA-256)")
      : t("Shared with carrier", "Đã chia sẻ hãng tàu");
}

const STATUS_STYLE: Record<RecordStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  RECONCILED: "bg-blue-100 text-blue-800",
  LOCKED: "bg-violet-100 text-violet-800",
  SHARED: "bg-emerald-100 text-emerald-800",
};

export const RecordStatusBadge: React.FC<{ status: RecordStatus }> = ({ status }) => {
  const label = useStatusLabel();
  return <StatusBadge status={status}>{label(status)}</StatusBadge>;
};

/** Draft → Reconciled → Locked → Shared stepper. */
export const StatusStepper: React.FC<{ status: RecordStatus }> = ({ status }) => {
  const label = useStatusLabel();
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span className={`h-px w-3 ${i <= idx ? "bg-brand" : "bg-slate-200"}`} />}
          <span className={`h-6 px-2 inline-flex items-center rounded-full text-xs font-medium ${i <= idx ? "bg-brand-soft text-brand" : "bg-slate-100 text-muted"}`}>{label(s)}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

/** Share of directly measured emissions. */
export const MeasuredBar: React.FC<{ pct: number }> = ({ pct }) => (
  <div className="flex items-center gap-1.5 min-w-[80px]">
    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
    <span className="text-xs tabular-nums text-slate-600 w-8 text-right">{Math.round(pct)}%</span>
  </div>
);

/** kg/TEU bar against the port average marker. */
export const IntensityBar: React.FC<{ value: number; avg: number; max?: number; label: string }> = ({ value, avg, max = 25, label }) => (
  <div className="flex items-center gap-1.5 min-w-[96px]">
    <div className="relative h-1.5 flex-1 rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${value > avg ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      <div className="absolute -top-1 -bottom-1 w-0.5 bg-slate-900" style={{ left: `${(avg / max) * 100}%` }} />
    </div>
    <span className="text-xs tabular-nums text-slate-700 w-9 text-right">{label}</span>
  </div>
);
