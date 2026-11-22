import React from "react";
import { motion } from "motion/react";
import { Layers, X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { FEEDERS, ForecastWindowRecord } from "../../data/module1Forecast";

interface FeederDrawerProps {
  window: ForecastWindowRecord;
  onClose: () => void;
  onOpenReport: () => void;
}

/** Right-hand drawer: 6-feeder split (donut + bars) at the window's peak interval. */
export const FeederDrawer: React.FC<FeederDrawerProps> = ({ window: w, onClose, onOpenReport }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const rows = FEEDERS.map((f) => ({ ...f, kw: w.feeders[f.key], label: t(f.name.en, f.name.vn) }));
  const total = rows.reduce((a, r) => a + r.kw, 0);
  const max = Math.max(...rows.map((r) => r.kw));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.button
        type="button"
        aria-label={t("Close", "Đóng")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/50 cursor-default"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.22 }}
        className="relative h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col"
      >
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm">
              {t("6-line breakdown", "Chi tiết 6 lộ")} — {w.timeWindow}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-800">
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Peak interval", "Chu kỳ đỉnh")}</div>
              <div className="font-mono font-black text-slate-900">{w.peakTime}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Load P50", "Phụ tải P50")}</div>
              <div className="font-mono font-black text-slate-900">{kw(w.p50Kw)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Net grid", "Điện lưới thuần")}</div>
              <div className="font-mono font-black text-[#004B91]">{kw(w.netGridKw)}</div>
            </div>
          </div>

          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="kw" nameKey="label" innerRadius="58%" outerRadius="88%" paddingAngle={1.5} isAnimationActive>
                  {rows.map((r) => (
                    <Cell key={r.key} fill={r.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) =>
                    active && payload?.length ? (
                      <div className="bg-white border border-slate-300 rounded-lg shadow px-2.5 py-1.5 text-[11px] text-slate-900">
                        <b>{payload[0].payload.id}</b> {payload[0].payload.label}: <b className="font-mono">{kw(payload[0].value)}</b>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-500">{t("Total", "Tổng")}</span>
              <span className="font-mono font-black text-slate-900 text-base">{num(total)}</span>
              <span className="text-[10px] text-slate-500">kW</span>
            </div>
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: r.color }} />
                    <b className="text-[#004B91]">{r.id}</b> {r.label}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {kw(r.kw)} <span className="text-slate-500 font-semibold">· {pct(total ? (r.kw / total) * 100 : 0)}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${max ? (r.kw / max) * 100 : 0}%` }}
                    transition={{ duration: 0.4 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3 space-y-0.5">
            <div>
              {t("Vessels", "Tàu")}: <b className="text-slate-800">{w.vessels.join(" & ") || "—"}</b> · {w.stsCranes} STS · {num(w.reeferPlugs)} reefer
            </div>
            <div>
              PV: <b className="text-emerald-700">{kw(w.pvKw)}</b> · {t("Ambient", "Nhiệt độ")} {num(w.tempAmbC, 1)} °C
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onOpenReport}
            className="px-4 py-2 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] cursor-pointer"
          >
            {t("View 24h report", "Xem báo cáo 24h")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 cursor-pointer"
          >
            {t("Close", "Đóng")}
          </button>
        </div>
      </motion.aside>
    </div>
  );
};
