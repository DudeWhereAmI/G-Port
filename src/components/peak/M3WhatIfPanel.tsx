import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertOctagon, FlaskConical, RotateCcw } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat, useMoneyFormat } from "../../utils/format";
import { minuteLabel } from "../../data/module1Forecast";
import { BESS_OPTION, DispatchResult, DispatchSettings } from "../../data/module3PeakShaving";

interface Props {
  settings: DispatchSettings;
  defaults: DispatchSettings;
  onChange: (s: DispatchSettings) => void;
  result: DispatchResult;
  base: DispatchResult;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void; changed: boolean }> = ({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  changed,
}) => (
  <label className="block space-y-1">
    <div className="flex items-center justify-between text-xs font-bold">
      <span className="text-slate-700">{label}</span>
      <span className={`tabular-nums ${changed ? "text-orange-700" : "text-slate-900"}`}>{display}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand cursor-pointer" />
  </label>
);

/** C2 – what-if for the dispatch (client-side approximation). */
export const M3WhatIfPanel: React.FC<Props> = ({ settings, defaults, onChange, result, base }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const { vnd, tco2 } = useMoneyFormat();
  const isDefault =
    settings.peakTargetKw === defaults.peakTargetKw &&
    settings.carbonVndPerTon === defaults.carbonVndPerTon &&
    settings.reeferFlexPct === defaults.reeferFlexPct &&
    settings.itvReserve === defaults.itvReserve &&
    settings.bessEnabled === defaults.bessEnabled;
  const reset = () =>
    onChange({
      ...settings,
      peakTargetKw: defaults.peakTargetKw,
      carbonVndPerTon: defaults.carbonVndPerTon,
      reeferFlexPct: defaults.reeferFlexPct,
      itvReserve: defaults.itvReserve,
      bessEnabled: defaults.bessEnabled,
    });

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-brand" />
          <h3 className="font-bold text-slate-900 text-sm">{t("What-if", "Mô phỏng What-if")}</h3>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={isDefault}
          className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3 h-3" />
          {t("Reset", "Khôi phục")}
        </button>
      </div>

      <Slider
        label={t("Peak target", "Mục tiêu đỉnh")}
        value={settings.peakTargetKw}
        min={7000}
        max={8800}
        step={10}
        display={kw(settings.peakTargetKw)}
        onChange={(v) => onChange({ ...settings, peakTargetKw: v })}
        changed={settings.peakTargetKw !== defaults.peakTargetKw}
      />
      <Slider
        label={t("Internal carbon price λC", "Giá carbon nội bộ λC")}
        value={settings.carbonVndPerTon}
        min={0}
        max={1_000_000}
        step={50_000}
        display={`${num(settings.carbonVndPerTon)} đ/t`}
        onChange={(v) => onChange({ ...settings, carbonVndPerTon: v })}
        changed={settings.carbonVndPerTon !== defaults.carbonVndPerTon}
      />
      <Slider
        label={t("Reefer flexibility", "% linh hoạt reefer")}
        value={settings.reeferFlexPct}
        min={0}
        max={15}
        step={1}
        display={pct(settings.reeferFlexPct, 0)}
        onChange={(v) => onChange({ ...settings, reeferFlexPct: v })}
        changed={settings.reeferFlexPct !== defaults.reeferFlexPct}
      />
      <Slider
        label={t("Reserve tractors N_res", "Số xe dự phòng N_res")}
        value={settings.itvReserve}
        min={0}
        max={6}
        step={1}
        display={`${settings.itvReserve} ${t("tractors", "xe")}`}
        onChange={(v) => onChange({ ...settings, itvReserve: v })}
        changed={settings.itvReserve !== defaults.itvReserve}
      />
      <label className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 cursor-pointer">
        <span>
          {t("With BESS", "Có BESS")}{" "}
          <span className="font-normal text-slate-500">
            ({kw(BESS_OPTION.powerKw)} / {num(BESS_OPTION.energyKwh)} kWh, {t("not installed", "chưa lắp đặt")})
          </span>
        </span>
        <input type="checkbox" checked={settings.bessEnabled} onChange={(e) => onChange({ ...settings, bessEnabled: e.target.checked })} className="w-4 h-4 accent-brand" />
      </label>

      <AnimatePresence>
        {!result.feasible && result.infeasible && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border-2 border-red-300 bg-red-50 p-2.5 text-xs text-red-900 space-y-0.5">
            <div className="flex items-center gap-1.5 font-black">
              <AlertOctagon className="w-3.5 h-3.5" />
              {t("Infeasible", "Không khả thi")}
            </div>
            <div>
              {t("Violates", "Vi phạm ràng buộc")}: {t(result.infeasible.constraint.en, result.infeasible.constraint.vn)}
            </div>
            <div className="text-red-700">
              {t(
                `Short by ${kw(result.infeasible.shortfallKw)} at ${minuteLabel(result.infeasible.minute)} (P90 planning basis)`,
                `Thiếu ${kw(result.infeasible.shortfallKw)} lúc ${minuteLabel(result.infeasible.minute)} (cơ sở lập kế hoạch P90)`
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        {[
          { l: t("Peak after", "Đỉnh sau"), v: kw(result.peakAfter.kw), d: result.peakAfter.kw - base.peakAfter.kw, unit: "kW", inv: true },
          { l: t("Saving / day", "Tiết kiệm / ngày"), v: vnd(result.savingVndPerDay), d: result.savingVndPerDay - base.savingVndPerDay, unit: "vnd", inv: false },
          { l: t("Grid energy saved", "Điện lưới giảm"), v: `${num(result.energy.savedKwh)} kWh`, d: 0, unit: "", inv: false },
          { l: "CO₂e", v: tco2(result.co2SavedT * 1000), d: 0, unit: "", inv: false },
        ].map((x) => (
          <div key={x.l} className="rounded-lg bg-slate-50 p-2">
            <div className="text-xs font-bold text-slate-500">{x.l}</div>
            <motion.div key={x.v} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-black text-slate-900 tabular-nums">
              {x.v}
            </motion.div>
            {x.d !== 0 && (
              <div className={`text-xs font-bold ${(x.d < 0) === x.inv ? "text-emerald-700" : "text-red-700"}`}>
                {x.d > 0 ? "+" : "−"}
                {x.unit === "vnd" ? vnd(Math.abs(x.d)) : kw(Math.abs(x.d))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
