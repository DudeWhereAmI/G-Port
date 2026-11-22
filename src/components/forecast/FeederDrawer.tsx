import React from "react";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { FEEDERS, ForecastWindowRecord } from "../../data/module1Forecast";
import { Button, ChartTooltipBox, DetailDrawer } from "../ui";

interface FeederDrawerProps {
  window: ForecastWindowRecord;
  onClose: () => void;
  onOpenReport: () => void;
}

/** 6-feeder split (donut + bars) at the window's peak interval. */
export const FeederDrawer: React.FC<FeederDrawerProps> = ({ window: w, onClose, onOpenReport }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const rows = FEEDERS.map((f) => ({ ...f, kw: w.feeders[f.key], label: t(f.name.en, f.name.vn) }));
  const total = rows.reduce((a, r) => a + r.kw, 0);
  const max = Math.max(...rows.map((r) => r.kw));

  return (
    <DetailDrawer
      width={480}
      title={t(`6 feeders · ${w.timeWindow}`, `6 lộ · ${w.timeWindow}`)}
      subtitle={t(`Peak interval ${w.peakTime}`, `Chu kỳ đỉnh ${w.peakTime}`)}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onOpenReport}>
          {t("View 24h report", "Xem báo cáo 24h")}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted">{t("Load P50", "Phụ tải P50")}</div>
            <div className="text-base font-semibold text-ink">{kw(w.p50Kw)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">{t("Net grid", "Điện lưới thuần")}</div>
            <div className="text-base font-semibold text-ink">{kw(w.netGridKw)}</div>
          </div>
        </div>

        <div className="relative h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey="kw" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={1} stroke="none" isAnimationActive animationDuration={200}>
                {rows.map((r) => (
                  <Cell key={r.key} fill={r.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) =>
                  active && payload?.length ? (
                    <ChartTooltipBox title={`${payload[0].payload.id} · ${payload[0].payload.label}`}>
                      <div className="tabular-nums">{kw(payload[0].value)}</div>
                    </ChartTooltipBox>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted">{t("Total", "Tổng")}</span>
            <span className="text-xl font-semibold text-ink tabular-nums">{num(total)}</span>
            <span className="text-xs text-muted">kW</span>
          </div>
        </div>

        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: r.color }} aria-hidden="true" />
                  <span className="text-muted">{r.id}</span> {r.label}
                </span>
                <span className="tabular-nums text-ink">
                  {kw(r.kw)} <span className="text-muted">· {pct(total ? (r.kw / total) * 100 : 0)}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${max ? (r.kw / max) * 100 : 0}%` }} transition={{ duration: 0.2 }} className="h-full rounded-full" style={{ backgroundColor: r.color }} />
              </div>
            </li>
          ))}
        </ul>

        <div className="text-xs text-muted border-t border-line pt-3 space-y-1">
          <div>
            {t("Vessels", "Tàu")}: <span className="text-ink">{w.vessels.join(" & ") || "—"}</span> · {w.stsCranes} STS · {num(w.reeferPlugs)} reefer
          </div>
          <div>
            PV {kw(w.pvKw)} · {t("ambient", "nhiệt độ")} {num(w.tempAmbC, 1)} °C
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
};
