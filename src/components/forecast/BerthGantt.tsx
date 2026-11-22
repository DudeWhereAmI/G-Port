import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { BerthId, NOW_MINUTE, VesselCall, minuteLabelWithDay, planCranes } from "../../data/module1Forecast";
import { TIMELINE_LEFT, TIMELINE_RIGHT, TimeDomain, timelinePct } from "./timeline";

const BERTHS: BerthId[] = ["B1", "B2", "B3"];
const BAR_COLOR: Record<BerthId, string> = { B1: "#0369A1", B2: "#004B91", B3: "#6D28D9" };

interface BerthGanttProps {
  vessels: VesselCall[];
  /** plan positions, drawn as dashed ghosts when a what-if moved a vessel */
  baseVessels: VesselCall[];
  domain: TimeDomain;
  highlightId: string | null;
  onHover: (id: string | null) => void;
}

/** Berth timeline (ETA → ETD) synchronised with the chart's time axis. */
export const BerthGantt: React.FC<BerthGanttProps> = ({ vessels, baseVessels, domain, highlightId, onHover }) => {
  const { t, lang } = useLanguage();
  const { num } = useFormat();
  const span = (from: number, to: number) => {
    const l = Math.max(0, timelinePct(from, domain));
    const r = Math.min(100, timelinePct(to, domain));
    return { l, w: Math.max(0, r - l) };
  };

  return (
    <div className="relative" style={{ marginLeft: TIMELINE_LEFT, marginRight: TIMELINE_RIGHT }}>
      <div className="space-y-1">
        {BERTHS.map((berth) => (
          <div key={berth} className="relative h-7 bg-slate-50 rounded-md border border-line">
            <div
              className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 text-right"
              style={{ left: -TIMELINE_LEFT, width: TIMELINE_LEFT - 6 }}
            >
              {berth}
            </div>

            {baseVessels
              .filter((b) => b.berth === berth)
              .map((b) => {
                const cur = vessels.find((v) => v.id === b.id);
                if (!cur || (cur.etaMin === b.etaMin && cur.etdMin === b.etdMin)) return null;
                const s = span(b.etaMin, b.etdMin);
                if (s.w <= 0) return null;
                return (
                  <div
                    key={`ghost-${b.id}`}
                    className="absolute top-0.5 bottom-0.5 rounded border-2 border-dashed border-slate-400 pointer-events-none"
                    style={{ left: `${s.l}%`, width: `${s.w}%` }}
                    title={t("Original plan", "Kế hoạch gốc")}
                  />
                );
              })}

            {vessels
              .filter((v) => v.berth === berth)
              .map((v) => {
                const s = span(v.etaMin, v.etdMin);
                if (s.w <= 0) return null;
                const color = BAR_COLOR[berth];
                const fuzz = span(v.etaMin - 2 * v.etaSigmaMin, v.etaMin + 2 * v.etaSigmaMin);
                const isHi = highlightId === v.id;
                const dim = highlightId !== null && !isHi;
                const tooltip =
                  `${v.name} (${v.code}) · ${t("Berth", "Cầu")} ${v.berth}\n` +
                  `ETA ${minuteLabelWithDay(v.etaMin, lang)} (±${v.etaSigmaMin}′) → ETD ${minuteLabelWithDay(v.etdMin, lang)}\n` +
                  `${planCranes(v)} STS · ${num(v.teu)} TEU · LOA ${v.loaM} m · ${num(v.reefers)} reefer`;
                return (
                  <React.Fragment key={v.id}>
                    {fuzz.w > 0 && (
                      <div
                        className="absolute top-0.5 bottom-0.5 rounded pointer-events-none"
                        style={{
                          left: `${fuzz.l}%`,
                          width: `${fuzz.w}%`,
                          background: `linear-gradient(to right, transparent, ${color}55 50%, transparent)`,
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => onHover(v.id)}
                      onMouseLeave={() => onHover(null)}
                      onFocus={() => onHover(v.id)}
                      onBlur={() => onHover(null)}
                      title={tooltip}
                      className={`absolute top-0.5 bottom-0.5 rounded px-1.5 text-left text-xs font-medium text-white overflow-hidden whitespace-nowrap transition-all cursor-pointer ${
                        isHi ? "ring-2 ring-orange-400 z-10" : ""
                      } ${dim ? "opacity-40" : ""}`}
                      style={{
                        left: `${s.l}%`,
                        width: `${s.w}%`,
                        backgroundColor: isHi ? "#EA580C" : color,
                      }}
                    >
                      {v.etaMin < domain[0] && "◂ "}
                      {v.name} · {planCranes(v)} STS · {num(v.teu)} TEU
                      {v.etdMin > domain[1] && " ▸"}
                    </button>
                  </React.Fragment>
                );
              })}

            {NOW_MINUTE >= domain[0] && NOW_MINUTE <= domain[1] && (
              <div className="absolute -top-1 -bottom-1 w-0.5 bg-slate-900 pointer-events-none" style={{ left: `${timelinePct(NOW_MINUTE, domain)}%` }} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 text-xs text-muted font-semibold">
        {t(
          "Bars: ETA → ETD · faded edge = ETA uncertainty (±2σ from historical ETA–ATA error) · hover a vessel to highlight its load on the chart",
          "Thanh: ETA → ETD · viền mờ = độ bất định ETA (±2σ theo sai số ETA–ATA lịch sử) · rê chuột vào tàu để làm nổi phụ tải của tàu trên biểu đồ"
        )}
      </div>
    </div>
  );
};
