import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { ForecastPoint, INTERVAL_MINUTES, NOW_MINUTE, P_PEAK_SWITCH, minuteLabel } from "../../data/module1Forecast";
import { TIMELINE_LEFT, TIMELINE_RIGHT, TimeDomain, pPeakColor, timelinePct } from "./timeline";

interface RiskRibbonProps {
  points: ForecastPoint[];
  domain: TimeDomain;
}

/** Heat strip of p_peak per 15-minute interval, sharing the chart's X axis. */
export const RiskRibbon: React.FC<RiskRibbonProps> = ({ points, domain }) => {
  const { t } = useLanguage();
  const { pct } = useFormat();

  // contiguous runs with p_peak ≥ 10 % (future only)
  const runs: { from: number; to: number }[] = [];
  for (const p of points) {
    if (p.locked || p.pPeak < P_PEAK_SWITCH) continue;
    const last = runs[runs.length - 1];
    if (last && last.to === p.minute) last.to = p.minute + INTERVAL_MINUTES;
    else runs.push({ from: p.minute, to: p.minute + INTERVAL_MINUTES });
  }
  const visible = (from: number, to: number) => to > domain[0] && from < domain[1];
  const box = (from: number, to: number) => {
    const l = Math.max(0, timelinePct(from, domain));
    const r = Math.min(100, timelinePct(to, domain));
    return { left: `${l}%`, width: `${Math.max(0, r - l)}%` };
  };

  return (
    <div className="relative" style={{ marginLeft: TIMELINE_LEFT, marginRight: TIMELINE_RIGHT }}>
      <div className="absolute top-[14px] text-[10px] font-bold text-slate-500 text-right leading-tight" style={{ left: -TIMELINE_LEFT, width: TIMELINE_LEFT - 6 }}>
        p_peak
      </div>
      {/* switch labels */}
      <div className="relative h-3.5">
        {runs.filter((r) => visible(r.from, r.to)).map((r) => (
          <div
            key={r.from}
            className="absolute top-0 h-3.5 text-[10px] font-bold text-orange-700 whitespace-nowrap overflow-visible flex items-center justify-center"
            style={box(r.from, r.to)}
          >
            {t("Switch P50 → P90", "Chuyển P50 → P90")}
          </div>
        ))}
      </div>
      <div className="relative h-4 rounded-sm overflow-hidden bg-slate-100">
        {points.filter((p) => visible(p.minute, p.minute + INTERVAL_MINUTES)).map((p) => (
          <div
            key={p.minute}
            className="absolute top-0 bottom-0 border-r border-white/60"
            style={{ ...box(p.minute, p.minute + INTERVAL_MINUTES), backgroundColor: p.locked ? "#E2E8F0" : pPeakColor(p.pPeak) }}
            title={
              p.locked
                ? `${p.label} · ${t("locked", "đã khóa")}`
                : `${p.label}–${minuteLabel(p.minute + INTERVAL_MINUTES)} · p_peak ${pct(p.pPeak * 100, 0)}`
            }
          />
        ))}
        {runs.filter((r) => visible(r.from, r.to)).map((r) => (
          <div key={`o-${r.from}`} className="absolute top-0 bottom-0 border-2 border-orange-700 rounded-sm pointer-events-none" style={box(r.from, r.to)} />
        ))}
        {NOW_MINUTE >= domain[0] && NOW_MINUTE <= domain[1] && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-900" style={{ left: `${timelinePct(NOW_MINUTE, domain)}%` }} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500 font-semibold">
        <span>{t("Probability net grid > 8,000 kW per 15 min:", "Xác suất điện lưới > 8.000 kW mỗi 15 phút:")}</span>
        {[
          { c: pPeakColor(0), l: "<1%" },
          { c: pPeakColor(0.07), l: "5–10%" },
          { c: pPeakColor(0.2), l: "10–30%" },
          { c: pPeakColor(0.5), l: "30–60%" },
          { c: pPeakColor(0.9), l: "≥60%" },
        ].map((s) => (
          <span key={s.l} className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-2.5 rounded-sm border border-black/5" style={{ backgroundColor: s.c }} />
            {s.l}
          </span>
        ))}
      </div>
    </div>
  );
};
