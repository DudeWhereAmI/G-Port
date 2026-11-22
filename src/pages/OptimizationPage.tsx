import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { ElectricityTariffTou, BessSystemStatus, PvSystemStatus, SubPageId } from "../types/gport";
import { TrendingDown, Zap, Sliders, Leaf, Info } from "lucide-react";
import { BASE_FORECAST, SUBSTATION_LIMIT_KW } from "../data/module1Forecast";
import {
  ApprovalState,
  AssetGroup,
  DEFAULT_APPROVALS,
  DEFAULT_DISPATCH_SETTINGS,
  DispatchSettings,
  FLEX_CAPACITY_KW,
  FlexGroupId,
  ForecastHandoff,
  PROTECTED_GROUPS,
  REPORT_MVP,
  runDispatch,
} from "../data/module3PeakShaving";
import { useFormat, useMoneyFormat } from "../utils/format";
import { BeforeAfterChart, M3_COLORS } from "../components/peak/PeakCharts";
import { GroupDrawer, GroupTable } from "../components/peak/GroupTable";
import { APPROVAL_GROUPS } from "../components/peak/ApprovalQueue";
import { LegendItem } from "../components/forecast/ForecastDemandChart";

interface OptimizationPageProps {
  tariff: ElectricityTariffTou;
  bessStatus: BessSystemStatus;
  pvStatus: PvSystemStatus;
  /** Overload window handed over from Module 1 (Forecast) */
  forecastHandoff?: ForecastHandoff | null;
  onDismissForecastHandoff?: () => void;
  onBackToForecast?: () => void;
  onNavigate?: (page: SubPageId) => void;
  onVerifyInModule2?: () => void;
}

const Card: React.FC<{ title?: string; note?: string; right?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }> = ({
  title,
  note,
  right,
  children,
  className,
  id,
}) => (
  <section id={id} className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3 min-w-0 scroll-mt-4 ${className ?? ""}`}>
    {(title || right) && (
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          {title && <h2 className="font-bold text-slate-900 text-sm">{title}</h2>}
          {note && <div className="text-[11px] text-slate-500 mt-0.5">{note}</div>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const OptimizationPage: React.FC<OptimizationPageProps> = ({ forecastHandoff, onDismissForecastHandoff, onBackToForecast }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const { vnd, tco2 } = useMoneyFormat();

  const [approvals] = useState<Record<FlexGroupId, ApprovalState>>(DEFAULT_APPROVALS);
  const [settings] = useState<DispatchSettings>(DEFAULT_DISPATCH_SETTINGS);
  const [basis, setBasis] = useState<"GRID" | "LOAD">("GRID");
  const [openGroup, setOpenGroup] = useState<AssetGroup | null>(null);

  const result = useMemo(() => runDispatch(BASE_FORECAST, { ...settings, approvals }), [settings, approvals]);
  const approvedCount = APPROVAL_GROUPS.filter((g) => approvals[g] === "APPROVED").length;

  return (
    <div className="space-y-6 pb-12">
      {forecastHandoff && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-black text-amber-900 text-sm">
              {t(`Received from Forecast (M-1): window ${forecastHandoff.timeWindow}`, `Nhận từ Dự báo (M-1): khung ${forecastHandoff.timeWindow}`)}
            </div>
            <div className="text-amber-900">
              {t(
                `Net grid peak ${kw(forecastHandoff.netGridKw)} at ${forecastHandoff.peakTime} · max exceedance probability ${pct(forecastHandoff.maxPPeakPct, 0)}`,
                `Đỉnh điện lưới ${kw(forecastHandoff.netGridKw)} lúc ${forecastHandoff.peakTime} · xác suất vượt cao nhất ${pct(forecastHandoff.maxPPeakPct, 0)}`
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {onBackToForecast && (
              <button type="button" onClick={onBackToForecast} className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 cursor-pointer">
                {t("Back to Forecast", "Quay lại Dự báo")}
              </button>
            )}
            {onDismissForecastHandoff && (
              <button type="button" onClick={onDismissForecastHandoff} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer">
                {t("Dismiss", "Đóng")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="text-xs font-bold text-[#004B91] mb-1">
          {t("Peak Shaving & Dispatch (M-3)", "Cắt Đỉnh & Điều Độ Phụ Tải (M-3)")}
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t("Dispatch Decision Center", "Trung Tâm Ra Quyết Định Điều Độ")}</h1>
        <div className="text-[11px] text-slate-600 mt-1">
          {t(
            `MILP · 96 × 15-min intervals · 12 asset groups · flexible ${num(FLEX_CAPACITY_KW)} kW`,
            `MILP · 96 chu kỳ 15 phút · 12 nhóm tài sản · linh hoạt ${num(FLEX_CAPACITY_KW)} kW`
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-emerald-50/70 p-4 rounded-xl border-2 border-emerald-300">
          <div className="flex items-center justify-between text-emerald-900 text-[11px] font-bold mb-1">
            <span>{t("Peak after dispatch", "Đỉnh sau điều độ")}</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 tabular-nums">
            {num(result.peakAfter.kw)} <span className="text-xs font-bold">kW</span>
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold">
            {kw(result.peakBefore.kw)} → {kw(result.peakAfter.kw)} (−{pct(result.reductionPct)})
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Cost saving / day", "Tiết kiệm chi phí / ngày")}</span>
            <Zap className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">{vnd(result.savingVndPerDay)}</div>
          <div className="text-[11px] text-slate-500">{t("Objective J before − after", "Hàm mục tiêu J trước − sau")}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Operator approvals", "Phê duyệt vận hành")}</span>
            <Sliders className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {approvedCount}/{APPROVAL_GROUPS.length}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {APPROVAL_GROUPS.length - approvedCount > 0
              ? t(`${APPROVAL_GROUPS.length - approvedCount} pending`, `${APPROVAL_GROUPS.length - approvedCount} chờ duyệt`)
              : t("All approved", "Đã duyệt tất cả")}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Grid energy & CO₂e saved", "Giảm điện lưới & CO₂e")}</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {num(result.energy.savedKwh)} <span className="text-xs font-bold text-slate-500">kWh</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">{tco2(result.co2SavedT * 1000)}/{t("day", "ngày")}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500" />
        <span>
          {t(
            `High-load day shared with M-1. Report MVP (Dataset v2) for reference: ${num(REPORT_MVP.peakBeforeKw, 1)} → ${num(REPORT_MVP.peakAfterKw, 1)} kW (−${pct(REPORT_MVP.reductionPct)}) · ${vnd(REPORT_MVP.savingVndPerDay)}/day · ${num(REPORT_MVP.co2tPerDay, 2)} tCO₂e/day.`,
            `Ngày cao tải dùng chung với M-1. Kết quả MVP trong report (Dataset v2) để tham chiếu: ${num(REPORT_MVP.peakBeforeKw, 1)} → ${num(REPORT_MVP.peakAfterKw, 1)} kW (−${pct(REPORT_MVP.reductionPct)}) · ${vnd(REPORT_MVP.savingVndPerDay)}/ngày · ${num(REPORT_MVP.co2tPerDay, 2)} tCO₂e/ngày.`
          )}
        </span>
      </div>

      {/* B1 / A4 – before vs after */}
      <Card
        title={t("Before vs. after dispatch", "Trước và sau điều độ")}
        note={t("Before = M-1 net-grid forecast · after = M-3 plan", "Trước = dự báo điện lưới thuần M-1 · sau = kế hoạch M-3")}
        right={
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs self-start">
            {([
              { id: "GRID", label: t("Grid import", "Điện lưới") },
              { id: "LOAD", label: t("Total load", "Tổng phụ tải") },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setBasis(m.id)}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer ${basis === m.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      >
        <BeforeAfterChart result={result} basis={basis} showTou />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-600 pl-12">
          <LegendItem color={M3_COLORS.before} kind="dashed" label={t("Before (M-1)", "Trước (M-1)")} />
          <LegendItem color={M3_COLORS.after} kind="line" label={t("After dispatch", "Sau điều độ")} />
          <LegendItem color={M3_COLORS.reduced} kind="band" label={t("Cut from peak", "Cắt khỏi giờ đỉnh")} />
          <LegendItem color={M3_COLORS.shifted} kind="band" label={t("Shifted to off-peak / PV hours", "Dời sang giờ thấp điểm / có PV")} />
          <LegendItem color={M3_COLORS.target} kind="dashed" label={t("Peak target", "Mục tiêu đỉnh")} />
          <LegendItem color={M3_COLORS.limit} kind="dashed" label={t(`Limit ${num(SUBSTATION_LIMIT_KW)} kW`, `Giới hạn ${num(SUBSTATION_LIMIT_KW)} kW`)} />
        </div>
      </Card>

      {/* Dispatch groups + protected chips */}
      <Card
        title={t("Dispatch groups", "Nhóm điều độ")}
        note={t(
          "PV is a supply source (see power balance); crane regenerative braking (AFE) is already in the base load",
          "PV là nguồn cấp (xem cân bằng công suất); năng lượng tái sinh của cẩu (AFE) đã tính trong phụ tải nền"
        )}
      >
        <div className="flex flex-wrap gap-1.5">
          {PROTECTED_GROUPS.map((g) => (
            <span
              key={g.id}
              title={`${t(g.name.en, g.name.vn)} · ${kw(g.ratedKw)} · ${t(g.rule.en, g.rule.vn)}`}
              className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 cursor-help"
            >
              🔒 {t(g.name.en, g.name.vn)}
            </span>
          ))}
        </div>
        <GroupTable result={result} approvals={approvals} onOpen={setOpenGroup} />
      </Card>

      {openGroup && <GroupDrawer group={openGroup} result={result} onClose={() => setOpenGroup(null)} />}
    </div>
  );
};
