import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { FlaskConical, RotateCcw, Zap } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import {
  BASE_VESSELS,
  DEFAULT_WHAT_IF,
  ForecastResult,
  ReforecastTrigger,
  WHAT_IF_VESSELS,
  WhatIfInput,
  minuteLabelWithDay,
  planCranes,
} from "../../data/module1Forecast";

interface WhatIfPanelProps {
  value: WhatIfInput;
  onChange: (next: WhatIfInput) => void;
  onReset: () => void;
  triggers: ReforecastTrigger[];
  base: ForecastResult;
  current: ForecastResult;
}

const Slider: React.FC<{
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  changed: boolean;
  hint?: string;
}> = ({ label, valueLabel, min, max, step, value, onChange, changed, hint }) => (
  <label className="block space-y-1">
    <div className="flex items-center justify-between text-xs font-medium">
      <span className="text-slate-700">{label}</span>
      <span className={`tabular-nums ${changed ? "text-warning" : "text-ink"}`}>{valueLabel}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-brand cursor-pointer"
    />
    {hint && <div className="text-xs text-muted">{hint}</div>}
  </label>
);

export const WhatIfPanel: React.FC<WhatIfPanelProps> = ({ value, onChange, onReset, triggers, base, current }) => {
  const { t, lang } = useLanguage();
  const { num, kw, pct } = useFormat();
  const vessel = BASE_VESSELS.find((v) => v.id === value.vesselId) ?? WHAT_IF_VESSELS[0];
  const plan = planCranes(vessel);
  const cranes = value.cranes ?? plan;
  const isDefault =
    value.etaShiftMin === 0 && value.cranes === null && value.reeferPct === 0 && value.pvReductionPct === 0;

  const triggerLabel: Record<ReforecastTrigger, string> = {
    ETA: t("ETA deviation ≥ 30 min", "ETA lệch ≥ 30 phút"),
    REEFER: t("Reefer count change ≥ 10%", "Container lạnh thay đổi ≥ 10%"),
    THROUGHPUT: t("Throughput change ≥ 15%", "Sản lượng biến động ≥ 15%"),
    STS_STOP: t("STS crane stopped", "Cẩu STS dừng"),
  };

  const shift = value.etaShiftMin;
  const shiftLabel = `${shift > 0 ? "+" : shift < 0 ? "−" : "±"}${Math.floor(Math.abs(shift) / 60)}h${String(Math.abs(shift) % 60).padStart(2, "0")}`;

  const bk = base.kpis;
  const ck = current.kpis;
  const delta = ck.peakNetGrid.netGrid - bk.peakNetGrid.netGrid;

  return (
    <div className="bg-white rounded-card p-4 border border-line space-y-4 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-brand" />
          <h3 className="font-medium text-ink text-sm">{t("What-if simulation", "Mô phỏng what-if")}</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={isDefault}
          className="px-2 py-1 rounded-control border border-line text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          {t("Restore original", "Khôi phục kịch bản gốc")}
        </button>
      </div>
      <p className="text-xs text-muted -mt-2">
        {t(
          "Client-side approximation of the forecast model; locked (past) intervals are not changed.",
          "Mô hình xấp xỉ phía trình duyệt; các chu kỳ quá khứ đã khóa không bị thay đổi."
        )}
      </p>

      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-700">{t("Vessel", "Tàu")}</span>
        <select
          value={vessel.id}
          onChange={(e) => onChange({ ...value, vesselId: e.target.value, etaShiftMin: 0, cranes: null })}
          className="w-full px-2 py-1.5 bg-slate-50 border border-line rounded-control text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
        >
          {WHAT_IF_VESSELS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.berth} · ETA {minuteLabelWithDay(v.etaMin, lang)}
            </option>
          ))}
        </select>
      </div>

      <Slider
        label={t("Shift ETA (whole call)", "Dời ETA (cả lượt tàu)")}
        valueLabel={shiftLabel}
        min={-180}
        max={180}
        step={15}
        value={value.etaShiftMin}
        onChange={(v) => onChange({ ...value, etaShiftMin: v })}
        changed={value.etaShiftMin !== 0}
        hint={`ETA ${minuteLabelWithDay(vessel.etaMin + value.etaShiftMin, lang)}`}
      />
      <Slider
        label={t("STS cranes on this vessel", "Số cẩu STS cho tàu này")}
        valueLabel={`${cranes} ${t("cranes", "cẩu")}${cranes !== plan ? ` (${t("plan", "KH")} ${plan})` : ""}`}
        min={1}
        max={6}
        step={1}
        value={cranes}
        onChange={(v) => onChange({ ...value, cranes: v === plan ? null : v })}
        changed={cranes !== plan}
      />
      <Slider
        label={t("Reefer containers", "Số container lạnh")}
        valueLabel={`${value.reeferPct > 0 ? "+" : ""}${pct(value.reeferPct, 0)}`}
        min={-20}
        max={20}
        step={1}
        value={value.reeferPct}
        onChange={(v) => onChange({ ...value, reeferPct: v })}
        changed={value.reeferPct !== 0}
      />
      <Slider
        label={t("Extra cloud cover (PV reduction)", "Mức mây thêm (PV giảm)")}
        valueLabel={`−${pct(value.pvReductionPct, 0)}`}
        min={0}
        max={80}
        step={5}
        value={value.pvReductionPct}
        onChange={(v) => onChange({ ...value, pvReductionPct: v })}
        changed={value.pvReductionPct !== 0}
        hint={t("Weather is handled by the 15-minute rolling update", "Thời tiết được xử lý ở cập nhật cuốn chiếu 15 phút")}
      />

      <AnimatePresence>
        {triggers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-card border border-amber-200 bg-warning-soft p-2.5 space-y-1"
          >
            <div className="flex items-center gap-1.5 font-semibold text-orange-800 text-xs">
              <Zap className="w-3.5 h-3.5" />
              {t("Event-based re-forecast triggered", "Kích hoạt tái dự báo theo sự kiện")}
            </div>
            <ul className="text-xs text-orange-900 list-disc pl-4">
              {triggers.map((tr) => (
                <li key={tr}>{triggerLabel[tr]}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-line">
        <div className="rounded-control bg-slate-50 p-2">
          <div className="text-xs font-medium text-muted">{t("Net grid peak", "Đỉnh điện lưới")}</div>
          <motion.div key={ck.peakNetGrid.netGrid} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-semibold text-ink tabular-nums">
            {kw(ck.peakNetGrid.netGrid)}
          </motion.div>
          <div className={`text-xs font-medium ${delta > 0 ? "text-danger" : delta < 0 ? "text-success" : "text-muted"}`}>
            {delta === 0 ? t("= plan", "= kế hoạch") : `${delta > 0 ? "+" : "−"}${kw(Math.abs(delta))} · ${ck.peakNetGrid.label}`}
          </div>
        </div>
        <div className="rounded-control bg-slate-50 p-2">
          <div className="text-xs font-medium text-muted">{t("Alert windows", "Khung cảnh báo")}</div>
          <motion.div key={ck.alertWindows.length} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-semibold text-ink tabular-nums">
            {ck.alertWindows.length}
            <span className="text-xs text-muted font-sans font-medium"> / {t("plan", "KH")} {bk.alertWindows.length}</span>
          </motion.div>
          <div className="text-xs font-medium text-muted">
            {t(`${num(ck.switchIntervals)} intervals on P90`, `${num(ck.switchIntervals)} chu kỳ theo P90`)}
          </div>
        </div>
      </div>
    </div>
  );
};
