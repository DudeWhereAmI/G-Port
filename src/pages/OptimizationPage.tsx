import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { ElectricityTariffTou, BessSystemStatus, PvSystemStatus, SubPageId } from "../types/gport";
import { TrendingDown, Zap, Sliders, Leaf, Info, ImageDown, Lock, ArrowRight, Cpu, ShieldCheck, ExternalLink } from "lucide-react";
import { BASE_FORECAST, FORECAST_VERSION, NOW_MINUTE, SUBSTATION_LIMIT_KW, minuteLabel } from "../data/module1Forecast";
import {
  ApprovalState,
  AssetGroup,
  DEFAULT_APPROVALS,
  DEFAULT_DISPATCH_SETTINGS,
  DispatchSettings,
  FLEX_CAPACITY_KW,
  FLEX_GROUPS,
  FlexGroupId,
  MILP_STATS,
  ForecastHandoff,
  PROTECTED_GROUPS,
  REPORT_MVP,
  runDispatch,
} from "../data/module3PeakShaving";
import { useFormat, useMoneyFormat } from "../utils/format";
import { BeforeAfterChart, M3_COLORS, ObjectiveChart, PowerBalanceChart, WaterfallChart } from "../components/peak/PeakCharts";
import { M3WhatIfPanel } from "../components/peak/M3WhatIfPanel";
import { DecisionMatrix } from "../components/peak/DecisionMatrix";
import { ConstraintPanel } from "../components/peak/ConstraintPanel";
import { downloadSvgAsPng } from "../utils/pngExport";
import { GroupDrawer, GroupTable } from "../components/peak/GroupTable";
import { APPROVAL_GROUPS, ApprovalLogEntry, ApprovalQueue } from "../components/peak/ApprovalQueue";
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
          {note && <div className="text-xs text-slate-500 mt-0.5">{note}</div>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const OptimizationPage: React.FC<OptimizationPageProps> = ({
  forecastHandoff,
  onDismissForecastHandoff,
  onBackToForecast,
  onNavigate,
  onVerifyInModule2,
}) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const { vnd, tco2 } = useMoneyFormat();

  const [approvals, setApprovals] = useState<Record<FlexGroupId, ApprovalState>>(DEFAULT_APPROVALS);
  const [decisionLog, setDecisionLog] = useState<ApprovalLogEntry[]>([]);
  const waterfallRef = React.useRef<HTMLDivElement>(null);
  const [pngNotice, setPngNotice] = useState<string | null>(null);
  const [settings, setSettings] = useState<DispatchSettings>(DEFAULT_DISPATCH_SETTINGS);
  const [mode, setMode] = useState<"RECOMMEND" | "CONTROL">("RECOMMEND");
  const baseResult = useMemo(() => runDispatch(BASE_FORECAST, { ...DEFAULT_DISPATCH_SETTINGS, approvals }), [approvals]);
  const [basis, setBasis] = useState<"GRID" | "LOAD">("GRID");
  const [openGroup, setOpenGroup] = useState<AssetGroup | null>(null);

  const result = useMemo(() => runDispatch(BASE_FORECAST, { ...settings, approvals }), [settings, approvals]);
  const approvedCount = APPROVAL_GROUPS.filter((g) => approvals[g] === "APPROVED").length;
  const flexName = (id: FlexGroupId) => {
    const g = FLEX_GROUPS.find((x) => x.id === id);
    return g ? t(g.name.en, g.name.vn) : id;
  };
  const decide = (g: FlexGroupId, action: "APPROVED" | "REJECTED", reasonId?: string) => {
    setApprovals((prev) => ({ ...prev, [g]: action }));
    setDecisionLog((prev) => [{ minute: NOW_MINUTE, group: g, action, reasonId }, ...prev]);
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const exportWaterfall = async () => {
    const ok = await downloadSvgAsPng(waterfallRef.current, "gport-m3-waterfall.png");
    setPngNotice(ok ? t("PNG downloaded.", "Đã tải ảnh PNG.") : t("Could not export the chart.", "Không xuất được biểu đồ."));
  };

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-brand mb-1">
              {t("Peak Shaving & Dispatch (M-3)", "Cắt Đỉnh & Điều Độ Phụ Tải (M-3)")}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t("Dispatch Decision Center", "Trung Tâm Ra Quyết Định Điều Độ")}</h1>
            <div className="text-xs text-slate-600 mt-1">
              {t(
                `MILP · 96 × 15-min intervals · 12 asset groups · flexible ${num(FLEX_CAPACITY_KW)} kW`,
                `MILP · 96 chu kỳ 15 phút · 12 nhóm tài sản · linh hoạt ${num(FLEX_CAPACITY_KW)} kW`
              )}
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            {/* C4 deployment mode */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs" role="group" aria-label={t("Deployment mode", "Chế độ triển khai")}>
              <button
                type="button"
                onClick={() => setMode("RECOMMEND")}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${mode === "RECOMMEND" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}
              >
                {t("Recommendation", "Khuyến nghị")}
              </button>
              <button
                type="button"
                disabled
                title={t("Unlocked after acceptance Gate 2", "Mở sau Cổng 2 nghiệm thu")}
                className="px-3 py-1.5 rounded-lg font-bold text-slate-400 flex items-center gap-1 cursor-not-allowed"
              >
                <Lock className="w-3 h-3" />
                {t("Control", "Điều khiển")}
              </button>
            </div>
            {/* C5 links */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => (onBackToForecast ? onBackToForecast() : onNavigate?.("MODULE_1_FORECAST"))}
                className="px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-brand text-xs font-bold flex items-center gap-1 hover:bg-blue-100 cursor-pointer"
              >
                {t(`Input from M-1: P90 forecast · version #${FORECAST_VERSION}`, `Đầu vào từ M-1: dự báo P90 · phiên bản #${FORECAST_VERSION}`)}
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => (onVerifyInModule2 ? onVerifyInModule2() : onNavigate?.("VESSEL_CARBON_INVOICE"))}
                className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                {t("Verify savings in Module 2 (IPMVP)", "Xác minh tiết kiệm ở Module 2 (IPMVP)")}
              </button>
            </div>
          </div>
        </div>
        {/* C3 rhythms + solver */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-700">
            {[
              t("22:00 day-ahead plan", "22:00 Lập kế hoạch ngày"),
              t("Every 15 min rolling re-plan", "Mỗi 15 phút điều chỉnh cuốn chiếu"),
              t("Edge protection per second", "Bảo vệ tại edge theo giây"),
            ].map((x, i) => (
              <React.Fragment key={x}>
                {i > 0 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                <span className={`px-2 py-0.5 rounded-full border ${i === 1 ? "border-brand bg-blue-50 text-brand" : "border-slate-200 bg-slate-50"}`}>{x}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Cpu className="w-3.5 h-3.5 text-brand" />
            {t(
              `Last solve ${minuteLabel(MILP_STATS.lastSolveMinute)} · ${num(MILP_STATS.solveSec, 2)} s · full pipeline ${MILP_STATS.pipelineSec} s · budget ${num(MILP_STATS.budgetMin, 2)} min`,
              `Lần giải gần nhất ${minuteLabel(MILP_STATS.lastSolveMinute)} · ${num(MILP_STATS.solveSec, 2)} s · toàn luồng ${MILP_STATS.pipelineSec} s · ngân sách ${num(MILP_STATS.budgetMin, 2)} phút`
            )}
          </div>
        </div>
        {mode === "RECOMMEND" && (
          <div className="text-xs text-slate-500">
            {t(
              "Recommendation mode: the plan runs alongside existing procedures; no command is sent to equipment.",
              "Chế độ Khuyến nghị: kế hoạch chạy song song với quy trình hiện hữu; không gửi lệnh tới thiết bị."
            )}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-emerald-50/70 p-4 rounded-xl border-2 border-emerald-300">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-bold mb-1">
            <span>{t("Peak after dispatch", "Đỉnh sau điều độ")}</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 tabular-nums">
            {num(result.peakAfter.kw)} <span className="text-xs font-bold">kW</span>
          </div>
          <div className="text-xs text-emerald-800 font-semibold">
            {kw(result.peakBefore.kw)} → {kw(result.peakAfter.kw)} (−{pct(result.reductionPct)})
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{t("Cost saving / day", "Tiết kiệm chi phí / ngày")}</span>
            <Zap className="w-4 h-4 text-brand" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">{vnd(result.savingVndPerDay)}</div>
          <div className="text-xs text-slate-500">{t("Objective J before − after", "Hàm mục tiêu J trước − sau")}</div>
        </div>
        <button
          type="button"
          onClick={() => scrollTo("m3-approvals")}
          className="text-left bg-white p-4 rounded-xl border border-amber-300 hover:bg-amber-50/50 cursor-pointer"
          title={t("Open the approval queue", "Mở hàng đợi phê duyệt")}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{t("Operator approvals", "Phê duyệt vận hành")}</span>
            <Sliders className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {approvedCount}/{APPROVAL_GROUPS.length}
          </div>
          <div className="text-xs text-amber-700 font-semibold">
            {APPROVAL_GROUPS.length - approvedCount > 0
              ? t(`${APPROVAL_GROUPS.length - approvedCount} pending`, `${APPROVAL_GROUPS.length - approvedCount} chờ duyệt`)
              : t("All approved", "Đã duyệt tất cả")}
          </div>
        </button>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{t("Grid energy & CO₂e saved", "Giảm điện lưới & CO₂e")}</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {num(result.energy.savedKwh)} <span className="text-xs font-bold text-slate-500">kWh</span>
          </div>
          <div className="text-xs text-emerald-700 font-semibold">{tco2(result.co2SavedT * 1000)}/{t("day", "ngày")}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500" />
        <span>
          {t(
            `High-load day shared with M-1. Report MVP (Dataset v2) for reference: ${num(REPORT_MVP.peakBeforeKw, 1)} → ${num(REPORT_MVP.peakAfterKw, 1)} kW (−${pct(REPORT_MVP.reductionPct)}) · ${vnd(REPORT_MVP.savingVndPerDay)}/day · ${num(REPORT_MVP.co2tPerDay, 2)} tCO₂e/day.`,
            `Ngày cao tải dùng chung với M-1. Kết quả MVP trong report (Dataset v2) để tham chiếu: ${num(REPORT_MVP.peakBeforeKw, 1)} → ${num(REPORT_MVP.peakAfterKw, 1)} kW (−${pct(REPORT_MVP.reductionPct)}) · ${vnd(REPORT_MVP.savingVndPerDay)}/ngày · ${num(REPORT_MVP.co2tPerDay, 2)} tCO₂e/ngày.`
          )}
        </span>
      </div>

      {/* B1 / A4 – before vs after + C2 what-if */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
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
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600 pl-12">
          <LegendItem color={M3_COLORS.before} kind="dashed" label={t("Before (M-1)", "Trước (M-1)")} />
          <LegendItem color={M3_COLORS.after} kind="line" label={t("After dispatch", "Sau điều độ")} />
          <LegendItem color={M3_COLORS.reduced} kind="band" label={t("Cut from peak", "Cắt khỏi giờ đỉnh")} />
          <LegendItem color={M3_COLORS.shifted} kind="band" label={t("Shifted to off-peak / PV hours", "Dời sang giờ thấp điểm / có PV")} />
          <LegendItem color={M3_COLORS.target} kind="dashed" label={t("Peak target", "Mục tiêu đỉnh")} />
          <LegendItem color={M3_COLORS.limit} kind="dashed" label={t(`Limit ${num(SUBSTATION_LIMIT_KW)} kW`, `Giới hạn ${num(SUBSTATION_LIMIT_KW)} kW`)} />
        </div>
      </Card>
      <div className="xl:sticky xl:top-4">
        <M3WhatIfPanel
          settings={settings}
          defaults={DEFAULT_DISPATCH_SETTINGS}
          onChange={setSettings}
          result={result}
          base={baseResult}
        />
      </div>
      </div>

      {/* B3 waterfall + B2 power balance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card
          title={t("From forecast peak to peak after dispatch", "Từ đỉnh dự báo đến đỉnh sau điều độ")}
          note={t(`Contribution of each group at ${result.peakBefore.label}`, `Đóng góp của từng nhóm lúc ${result.peakBefore.label}`)}
          right={
            <div className="flex items-center gap-2">
              {pngNotice && <span className="text-xs text-slate-500">{pngNotice}</span>}
              <button
                type="button"
                onClick={exportWaterfall}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <ImageDown className="w-3.5 h-3.5" />
                {t("Download PNG", "Tải ảnh PNG")}
              </button>
            </div>
          }
        >
          <div ref={waterfallRef}>
            <WaterfallChart result={result} />
          </div>
        </Card>
        <Card
          title={t("Power balance after dispatch", "Cân bằng công suất sau điều độ")}
          note={t("Grid + PV self-use + BESS discharge = loads + BESS charge", "Lưới + PV tự dùng + BESS xả = phụ tải + BESS sạc")}
        >
          <PowerBalanceChart result={result} />
        </Card>
      </div>

      {/* B4 decision matrix */}
      <Card
        title={t("Decision matrix · 12 groups × 96 intervals", "Ma trận quyết định · 12 nhóm × 96 chu kỳ")}
        note={t(
          `${MILP_STATS.decisionVariables} decision variables · MILP solved in ${num(MILP_STATS.solveSec, 2)} s`,
          `${MILP_STATS.decisionVariables} biến quyết định · MILP giải trong ${num(MILP_STATS.solveSec, 2)} s`
        )}
      >
        <DecisionMatrix result={result} points={BASE_FORECAST.points} />
      </Card>

      {/* B5 constraints + B6 approvals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <Card title={t("Constraints satisfied", "Ràng buộc đều đạt")} note={t("Checked on the dispatch plan above", "Kiểm tra trên kế hoạch điều độ phía trên")}>
          <ConstraintPanel result={result} />
        </Card>
        <Card
          id="m3-approvals"
          title={t("Approval queue", "Hàng đợi phê duyệt")}
          note={t("Reefer & EV commands need an operator; PV/BESS setpoints are automatic", "Lệnh reefer & sạc xe cần nhân viên duyệt; điểm đặt PV/BESS tự động")}
        >
          <ApprovalQueue result={result} approvals={approvals} log={decisionLog} onDecide={decide} groupName={flexName} />
        </Card>
      </div>

      {/* C1 objective J */}
      <Card
        title={t("Objective J – before vs. after", "Phân rã hàm mục tiêu J – trước và sau")}
        note={t("Daily cost components of the MILP objective", "Các thành phần chi phí ngày của hàm mục tiêu MILP")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
          <ObjectiveChart before={result.cost.before} after={result.cost.after} />
          <div className="space-y-2 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-xs font-bold text-slate-500">{t("TOU energy (largest term)", "Tiền điện TOU (thành phần lớn nhất)")}</div>
              <div className="font-bold text-slate-900 tabular-nums">
                {vnd(result.cost.before.touEnergy)} → {vnd(result.cost.after.touEnergy)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-xs font-bold text-slate-500">{t("Total J", "Tổng J")}</div>
              <div className="font-bold text-slate-900 tabular-nums">
                {vnd(result.cost.before.total)} → {vnd(result.cost.after.total)}
              </div>
              <div className="text-emerald-700 font-bold">−{vnd(result.savingVndPerDay)}/{t("day", "ngày")}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 font-bold text-emerald-900">
              {t(
                `−${num(result.energy.savedKwh)} kWh grid energy · ${num(result.co2SavedT, 2)} tCO₂e/day`,
                `Giảm ${num(result.energy.savedKwh)} kWh điện lưới · ${num(result.co2SavedT, 2)} tCO₂e/ngày`
              )}
              <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                {t(`Plus ${num(result.energy.shiftedKwh)} kWh shifted in time`, `Thêm ${num(result.energy.shiftedKwh)} kWh được dời giờ`)}
              </div>
            </div>
          </div>
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
              className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-help"
            >
              <Lock className="inline w-3 h-3 mr-1 -mt-0.5" aria-hidden="true" />
              {t(g.name.en, g.name.vn)}
            </span>
          ))}
        </div>
        <GroupTable result={result} approvals={approvals} onOpen={setOpenGroup} />
      </Card>

      {openGroup && <GroupDrawer group={openGroup} result={result} onClose={() => setOpenGroup(null)} />}
    </div>
  );
};
