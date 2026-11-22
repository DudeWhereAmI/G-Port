import React, { useState } from "react";
import { Lock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { ForecastPoint, INTERVAL_MINUTES, minuteLabel } from "../../data/module1Forecast";
import { ASSET_GROUPS, AdjustKey, DispatchResult, MILP_STATS } from "../../data/module3PeakShaving";

interface Cell {
  kw: number;
  load: number;
  color: string;
  locked: boolean;
}

const LOCK_BG = "repeating-linear-gradient(135deg, #E2E8F0 0 3px, #F8FAFC 3px 6px)";

function adjColor(v: number, max: number): string {
  if (Math.abs(v) < 0.5) return "#F1F5F9";
  const a = Math.min(1, 0.25 + (0.75 * Math.abs(v)) / Math.max(1, max));
  return v < 0 ? `rgba(16,185,129,${a})` : `rgba(59,130,246,${a})`;
}

/** B4 – 12 groups × 96 intervals decision heatmap. */
export const DecisionMatrix: React.FC<{ result: DispatchResult; points: ForecastPoint[] }> = ({ result, points }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const [hover, setHover] = useState<{ row: number; col: number; x: number; y: number } | null>(null);

  const loadOf = (id: string, p: ForecastPoint): number => {
    switch (id) {
      case "ITV": return p.detail.itvKw;
      case "SWAP": return p.detail.swapKw;
      case "REEFER": return p.feeders.f03;
      case "RTG": return p.feeders.f02;
      case "HVAC": return p.detail.hvacKw;
      case "PV": return p.pv;
      case "STS": return p.feeders.f01;
      case "OPS": return p.feeders.f04;
      case "SAFETY_LIGHT": return p.detail.lightingKw;
      case "FIRE": return 25;
      case "UPS": return 110;
      case "RADAR": return 15;
      default: return 0;
    }
  };
  const rows = [
    ...ASSET_GROUPS.map((g) => ({ id: g.id, name: t(g.name.en, g.name.vn), kind: g.kind })),
    ...(result.settings.bessEnabled ? [{ id: "BESS", name: "BESS", kind: "FLEX" as const }] : []),
  ];
  const maxAdj = Math.max(1, ...result.intervals.flatMap((x) => (Object.values(x.adjust) as number[]).map(Math.abs)));
  const cells: Cell[][] = rows.map((r) =>
    result.intervals.map((x, i) => {
      const p = points[i];
      const load = r.id === "BESS" ? 500 : loadOf(r.id, p);
      if (r.kind === "PROTECTED") return { kw: 0, load, color: "", locked: true };
      if (r.id === "PV") return { kw: 0, load, color: p.pv > 0 ? `rgba(245,158,11,${0.15 + (0.5 * p.pv) / 2000})` : "#F1F5F9", locked: false };
      const v = x.adjust[r.id as AdjustKey] ?? 0;
      return { kw: v, load, color: adjColor(v, maxAdj), locked: false };
    })
  );

  const reason = (id: string, v: number): string => {
    if (id === "PV") return t("Automatic setpoint · full self-consumption", "Điểm đặt tự động · tự dùng toàn bộ");
    if (Math.abs(v) < 0.5) return t("No adjustment", "Không điều chỉnh");
    const m: Record<string, [string, string, string, string]> = {
      ITV: ["Charging moved out of peak", "Dời sạc khỏi giờ đỉnh / cao điểm", "Pre-charging in off-peak", "Sạc bù giờ thấp điểm"],
      SWAP: ["Swap charging deferred", "Hoãn sạc trạm đổi pin", "Catch-up charging off-peak", "Sạc bù giờ thấp điểm"],
      REEFER: ["Staggered compressors (≤ 45 min/sub-group)", "So le máy nén (≤ 45 phút/nhóm con)", "Pre-cooling before the peak", "Làm lạnh trước giờ đỉnh"],
      RTG: ["Eco-idle (idle > 5 min)", "Chờ tiết kiệm (rỗi > 5 phút)", "", ""],
      HVAC: ["+1.5 °C setpoint, corridor dimming", "Tăng điểm đặt +1,5 °C, giảm sáng hành lang", "", ""],
      BESS: ["Discharging to shave the peak", "Xả pin cắt đỉnh", "Charging off-peak", "Sạc pin giờ thấp điểm"],
    };
    const r = m[id];
    return v < 0 ? t(r[0], r[1]) : t(r[2], r[3]);
  };

  const h = hover ? { row: rows[hover.row], cell: cells[hover.row][hover.col], x: result.intervals[hover.col] } : null;

  return (
    <div className="space-y-2">
      <div className="relative overflow-x-auto" onMouseLeave={() => setHover(null)}>
        <div className="min-w-[760px]">
          {rows.map((r, ri) => (
            <div key={r.id} className="flex items-center gap-2 h-[18px] mb-[2px]">
              <div className="w-44 shrink-0 text-xs font-semibold text-slate-700 truncate" title={r.name}>
                {r.kind === "PROTECTED" ? <Lock className="inline w-3 h-3 mr-1 text-muted -mt-0.5" aria-hidden="true" /> : null}
                {r.name}
              </div>
              <div className="flex-1 grid h-full" style={{ gridTemplateColumns: `repeat(${result.intervals.length}, minmax(0, 1fr))` }}>
                {cells[ri].map((c, ci) => (
                  <div
                    key={ci}
                    onMouseEnter={(e) => {
                      const box = (e.currentTarget.offsetParent as HTMLElement | null)?.getBoundingClientRect();
                      const cb = e.currentTarget.getBoundingClientRect();
                      setHover({ row: ri, col: ci, x: cb.left - (box?.left ?? 0), y: cb.top - (box?.top ?? 0) });
                    }}
                    className={`h-full border-r border-white/70 ${hover && hover.row === ri && hover.col === ci ? "outline outline-2 outline-slate-900 z-10" : ""}`}
                    style={{ background: c.locked ? LOCK_BG : c.color }}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-44 shrink-0" />
            <div className="flex-1 relative h-4 text-xs text-muted">
              {Array.from({ length: 13 }, (_, i) => (
                <span key={i} className="absolute -translate-x-1/2" style={{ left: `${(i / 12) * 100}%` }}>
                  {minuteLabel(i * 120)}
                </span>
              ))}
            </div>
          </div>
        </div>
        {h && hover && (
          <div className="absolute z-20 pointer-events-none" style={{ left: Math.min(hover.x + 12, 600), top: hover.y + 20 }}>
            <div className="bg-white border border-slate-300 rounded-card shadow-lg px-3 py-2 text-xs text-ink min-w-[220px] space-y-0.5">
              <div className="font-medium">
                {h.row.name} · {h.x.label}–{minuteLabel(h.x.minute + INTERVAL_MINUTES)}
              </div>
              {h.cell.locked ? (
                <div className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" /> {t(`Locked at 100% · ${kw(h.cell.load)}`, `Khóa 100% · ${kw(h.cell.load)}`)}</div>
              ) : (
                <>
                  <div>
                    {t("Setpoint", "Điểm đặt")}:{" "}
                    <b>{h.cell.load > 0 ? pct(((h.cell.load + h.cell.kw) / h.cell.load) * 100, 0) : "—"}</b> ·{" "}
                    <b>{kw(h.cell.load + h.cell.kw)}</b>
                    {h.cell.kw !== 0 && (
                      <span className={h.cell.kw < 0 ? "text-success" : "text-blue-700"}>
                        {" "}({h.cell.kw > 0 ? "+" : "−"}{num(Math.abs(h.cell.kw))} kW)
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600">{reason(h.row.id, h.cell.kw)}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold pl-0 sm:pl-[184px]">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-2.5 rounded-sm bg-slate-100 border border-line" />0%</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-2.5 rounded-sm" style={{ background: "rgba(16,185,129,0.8)" }} />{t("Reduced", "Giảm")}</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-2.5 rounded-sm" style={{ background: "rgba(59,130,246,0.8)" }} />{t("Increased / shifted in", "Tăng / dời vào")}</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-2.5 rounded-sm" style={{ background: "rgba(245,158,11,0.5)" }} />{t("PV (auto)", "PV (tự động)")}</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-2.5 rounded-sm border border-line" style={{ background: LOCK_BG }} /><Lock className="w-3 h-3" aria-hidden="true" /> {t("Locked", "Khóa")}</span>
        <span className="text-slate-400">
          {t(`${MILP_STATS.decisionVariables} decision variables`, `${MILP_STATS.decisionVariables} biến quyết định`)}
        </span>
      </div>
    </div>
  );
};
