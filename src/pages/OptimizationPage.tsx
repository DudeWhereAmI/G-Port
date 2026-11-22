import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { ElectricityTariffTou, BessSystemStatus, PvSystemStatus, SubPageId } from "../types/gport";
import { ImageDown, Lock, ArrowRight, Cpu, ShieldCheck, ExternalLink, Info, X } from "lucide-react";
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
import { Button, Card, ChartCard, KpiCard, KpiRow, LegendDot, MetaLine, PageHeader, SegmentedControl, Tooltip, useToast } from "../components/ui";
import { breadcrumbOf } from "../components/shell/pages";

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

export const OptimizationPage: React.FC<OptimizationPageProps> = ({ forecastHandoff, onDismissForecastHandoff, onBackToForecast, onNavigate, onVerifyInModule2 }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const { vnd, tco2 } = useMoneyFormat();
  const toast = useToast();

  const [approvals, setApprovals] = useState<Record<FlexGroupId, ApprovalState>>(DEFAULT_APPROVALS);
  const [decisionLog, setDecisionLog] = useState<ApprovalLogEntry[]>([]);
  const waterfallRef = React.useRef<HTMLDivElement>(null);
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
    toast(
      action === "APPROVED"
        ? t(`${flexName(g)}: approved`, `${flexName(g)}: đã duyệt`)
        : t(`${flexName(g)}: rejected – reason logged for recalibration`, `${flexName(g)}: đã từ chối – lý do được lưu để hiệu chỉnh mô hình`),
      action === "APPROVED" ? "success" : "info"
    );
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const exportWaterfall = async () => {
    const ok = await downloadSvgAsPng(waterfallRef.current, "gport-m3-waterfall.png");
    toast(ok ? t("PNG downloaded", "Đã tải ảnh PNG") : t("Could not export the chart", "Không xuất được biểu đồ"), ok ? "success" : "warning");
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        breadcrumb={breadcrumbOf("MODULE_3_OPTIMIZATION", t)}
        title={t("Dispatch & peak shaving", "Điều độ & cắt đỉnh")}
        description={t(
          `MILP plan for 96 intervals × 12 asset groups · ${num(FLEX_CAPACITY_KW)} kW flexible load`,
          `Kế hoạch MILP cho 96 chu kỳ × 12 nhóm tài sản · ${num(FLEX_CAPACITY_KW)} kW phụ tải linh hoạt`
        )}
        meta={
          <MetaLine
            items={[
              t(`Last solve ${minuteLabel(MILP_STATS.lastSolveMinute)} · ${num(MILP_STATS.solveSec, 2)} s`, `Lần giải gần nhất ${minuteLabel(MILP_STATS.lastSolveMinute)} · ${num(MILP_STATS.solveSec, 2)} s`),
              t(`Pipeline ${MILP_STATS.pipelineSec} s · budget ${num(MILP_STATS.budgetMin, 2)} min`, `Toàn luồng ${MILP_STATS.pipelineSec} s · ngân sách ${num(MILP_STATS.budgetMin, 2)} phút`),
              <button key="m1" type="button" onClick={() => (onBackToForecast ? onBackToForecast() : onNavigate?.("MODULE_1_FORECAST"))} className="inline-flex items-center gap-1 text-brand hover:underline cursor-pointer">
                {t(`Input: M-1 P90 forecast #${FORECAST_VERSION}`, `Đầu vào: dự báo P90 M-1 #${FORECAST_VERSION}`)}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </button>,
            ]}
          />
        }
        actions={
          <>
            <SegmentedControl
              ariaLabel={t("Deployment mode", "Chế độ triển khai")}
              value={mode}
              onChange={setMode}
              items={[
                { id: "RECOMMEND", label: t("Recommendation", "Khuyến nghị") },
                { id: "CONTROL", label: t("Control", "Điều khiển"), icon: Lock, disabled: true, title: t("Unlocked after acceptance Gate 2", "Mở sau Cổng 2 nghiệm thu") },
              ]}
            />
            <Button variant="primary" icon={ShieldCheck} onClick={() => (onVerifyInModule2 ? onVerifyInModule2() : onNavigate?.("VESSEL_CARBON_INVOICE"))}>
              {t("Verify savings (IPMVP)", "Xác minh tiết kiệm (IPMVP)")}
            </Button>
          </>
        }
        extra={
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
            {[t("22:00 day-ahead plan", "22:00 lập kế hoạch ngày"), t("15-min rolling re-plan", "Mỗi 15 phút điều chỉnh cuốn chiếu"), t("Edge protection per second", "Bảo vệ tại edge theo giây")].map((x, i) => (
              <React.Fragment key={x}>
                {i > 0 && <ArrowRight className="w-3 h-3 text-slate-400" aria-hidden="true" />}
                <span className={i === 1 ? "text-ink font-medium" : ""}>{x}</span>
              </React.Fragment>
            ))}
          </div>
        }
      />

      {forecastHandoff && (
        <Card className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4">
          <div className="text-sm">
            <div className="font-medium text-ink">
              {t(`Received from M-1: window ${forecastHandoff.timeWindow}`, `Nhận từ M-1: khung ${forecastHandoff.timeWindow}`)}
            </div>
            <div className="text-xs text-muted">
              {t(
                `Net grid peak ${kw(forecastHandoff.netGridKw)} at ${forecastHandoff.peakTime} · max exceedance ${pct(forecastHandoff.maxPPeakPct, 0)}`,
                `Đỉnh điện lưới ${kw(forecastHandoff.netGridKw)} lúc ${forecastHandoff.peakTime} · xác suất vượt cao nhất ${pct(forecastHandoff.maxPPeakPct, 0)}`
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {onBackToForecast && <Button onClick={onBackToForecast}>{t("Back to forecast", "Quay lại dự báo")}</Button>}
            {onDismissForecastHandoff && <Button variant="ghost" icon={X} onClick={onDismissForecastHandoff} aria-label={t("Dismiss", "Đóng")} />}
          </div>
        </Card>
      )}

      <KpiRow>
        <KpiCard
          accent="success"
          label={t("Peak after dispatch", "Đỉnh sau điều độ")}
          value={num(result.peakAfter.kw)}
          unit="kW"
          delta={{ value: `−${pct(result.reductionPct)}`, direction: "down", good: true }}
          hint={t(`from ${kw(result.peakBefore.kw)} · limit ${kw(SUBSTATION_LIMIT_KW)}`, `từ ${kw(result.peakBefore.kw)} · ngưỡng ${kw(SUBSTATION_LIMIT_KW)}`)}
        />
        <KpiCard label={t("Cost saving per day", "Tiết kiệm chi phí / ngày")} value={vnd(result.savingVndPerDay)} hint={t("Objective J before − after", "Hàm mục tiêu J trước − sau")} />
        <KpiCard
          label={t("Operator approvals", "Phê duyệt vận hành")}
          value={`${approvedCount}/${APPROVAL_GROUPS.length}`}
          hint={APPROVAL_GROUPS.length - approvedCount > 0 ? t(`${APPROVAL_GROUPS.length - approvedCount} pending · open queue`, `${APPROVAL_GROUPS.length - approvedCount} chờ duyệt · mở hàng đợi`) : t("All approved", "Đã duyệt tất cả")}
          onClick={() => scrollTo("m3-approvals")}
        />
        <KpiCard label={t("Grid energy saved", "Điện lưới giảm")} value={num(result.energy.savedKwh)} unit="kWh" hint={`${tco2(result.co2SavedT * 1000)}/${t("day", "ngày")}`} />
      </KpiRow>

      <div className="flex items-start gap-2 text-xs text-muted">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {t(
            `High-load day shared with M-1. Report MVP for reference: ${num(REPORT_MVP.peakBeforeKw, 1)} → ${num(REPORT_MVP.peakAfterKw, 1)} kW (−${pct(REPORT_MVP.reductionPct)}) · ${vnd(REPORT_MVP.savingVndPerDay)}/day.`,
            `Ngày cao tải dùng chung với M-1. Kết quả MVP trong report để tham chiếu: ${num(REPORT_MVP.peakBeforeKw, 1)} → ${num(REPORT_MVP.peakAfterKw, 1)} kW (−${pct(REPORT_MVP.reductionPct)}) · ${vnd(REPORT_MVP.savingVndPerDay)}/ngày.`
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <ChartCard
          title={t("Before vs. after dispatch", "Trước và sau điều độ")}
          description={t("Before = M-1 net-grid forecast · after = M-3 plan", "Trước = dự báo điện lưới thuần M-1 · sau = kế hoạch M-3")}
          toolbar={
            <SegmentedControl
              value={basis}
              onChange={setBasis}
              items={[
                { id: "GRID", label: t("Grid import", "Điện lưới") },
                { id: "LOAD", label: t("Total load", "Tổng phụ tải") },
              ]}
            />
          }
          legend={
            <>
              <LegendDot color={M3_COLORS.before} kind="dashed" label={t("Before (M-1)", "Trước (M-1)")} />
              <LegendDot color={M3_COLORS.after} kind="line" label={t("After dispatch", "Sau điều độ")} />
              <LegendDot color={M3_COLORS.reduced} label={t("Cut from peak", "Cắt khỏi giờ đỉnh")} />
              <LegendDot color={M3_COLORS.shifted} label={t("Shifted to off-peak / PV hours", "Dời sang giờ thấp điểm / có PV")} />
              <LegendDot color={M3_COLORS.target} kind="dashed" label={t("Peak target", "Mục tiêu đỉnh")} />
              <LegendDot color={M3_COLORS.limit} kind="dashed" label={t(`Limit ${num(SUBSTATION_LIMIT_KW)} kW`, `Giới hạn ${num(SUBSTATION_LIMIT_KW)} kW`)} />
            </>
          }
        >
          <BeforeAfterChart result={result} basis={basis} showTou />
        </ChartCard>
        <div className="xl:sticky xl:top-4">
          <M3WhatIfPanel settings={settings} defaults={DEFAULT_DISPATCH_SETTINGS} onChange={setSettings} result={result} base={baseResult} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title={t("From forecast peak to peak after dispatch", "Từ đỉnh dự báo đến đỉnh sau điều độ")}
          description={t(`Contribution of each group at ${result.peakBefore.label}`, `Đóng góp của từng nhóm lúc ${result.peakBefore.label}`)}
          toolbar={
            <Button size="sm" icon={ImageDown} onClick={exportWaterfall}>
              PNG
            </Button>
          }
        >
          <div ref={waterfallRef}>
            <WaterfallChart result={result} />
          </div>
        </ChartCard>
        <ChartCard title={t("Power balance after dispatch", "Cân bằng công suất sau điều độ")} description={t("Grid + PV + BESS discharge = loads + BESS charge", "Lưới + PV + BESS xả = phụ tải + BESS sạc")}>
          <PowerBalanceChart result={result} />
        </ChartCard>
      </div>

      <ChartCard
        title={t("Decision matrix · 12 groups × 96 intervals", "Ma trận quyết định · 12 nhóm × 96 chu kỳ")}
        description={t(`${MILP_STATS.decisionVariables} decision variables · MILP solved in ${num(MILP_STATS.solveSec, 2)} s`, `${MILP_STATS.decisionVariables} biến quyết định · MILP giải trong ${num(MILP_STATS.solveSec, 2)} s`)}
      >
        <DecisionMatrix result={result} points={BASE_FORECAST.points} />
      </ChartCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <ChartCard title={t("Constraints satisfied", "Ràng buộc đều đạt")} description={t("Checked on the dispatch plan above", "Kiểm tra trên kế hoạch điều độ phía trên")}>
          <ConstraintPanel result={result} />
        </ChartCard>
        <ChartCard id="m3-approvals" title={t("Approval queue", "Hàng đợi phê duyệt")} description={t("Reefer & EV commands need an operator; PV/BESS are automatic", "Lệnh reefer & sạc xe cần nhân viên duyệt; PV/BESS tự động")}>
          <ApprovalQueue result={result} approvals={approvals} log={decisionLog} onDecide={decide} groupName={flexName} />
        </ChartCard>
      </div>

      <ChartCard title={t("Objective J – before vs. after", "Phân rã hàm mục tiêu J – trước và sau")} description={t("Daily cost components of the MILP objective", "Các thành phần chi phí ngày của hàm mục tiêu")}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
          <ObjectiveChart before={result.cost.before} after={result.cost.after} />
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-muted">{t("TOU energy (largest term)", "Tiền điện TOU (thành phần lớn nhất)")}</dt>
              <dd className="text-ink tabular-nums">
                {vnd(result.cost.before.touEnergy)} → {vnd(result.cost.after.touEnergy)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("Total j", "Tổng j")}</dt>
              <dd className="text-ink tabular-nums">
                {vnd(result.cost.before.total)} → {vnd(result.cost.after.total)} <span className="text-success">(−{vnd(result.savingVndPerDay)})</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("Grid energy & emissions", "Điện lưới & phát thải")}</dt>
              <dd className="text-ink tabular-nums">
                −{num(result.energy.savedKwh)} kWh · −{num(result.co2SavedT, 2)} tCO₂e/{t("day", "ngày")}
              </dd>
              <dd className="text-xs text-muted">{t(`plus ${num(result.energy.shiftedKwh)} kWh shifted in time`, `thêm ${num(result.energy.shiftedKwh)} kWh được dời giờ`)}</dd>
            </div>
          </dl>
        </div>
      </ChartCard>

      <ChartCard
        title={t("Dispatch groups", "Nhóm điều độ")}
        description={t("PV is a supply source; crane regenerative braking (AFE) is already in the base load", "PV là nguồn cấp; năng lượng tái sinh của cẩu (AFE) đã tính trong phụ tải nền")}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted mr-1">{t("Never curtailed:", "Không bao giờ cắt:")}</span>
          {PROTECTED_GROUPS.map((g) => (
            <Tooltip key={g.id} content={`${kw(g.ratedKw)} · ${t(g.rule.en, g.rule.vn)}`}>
              <span tabIndex={0} className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-slate-100 text-xs text-slate-600">
                <Lock className="w-3 h-3" aria-hidden="true" />
                {t(g.name.en, g.name.vn)}
              </span>
            </Tooltip>
          ))}
        </div>
        <GroupTable result={result} approvals={approvals} onOpen={setOpenGroup} />
      </ChartCard>

      {openGroup && <GroupDrawer group={openGroup} result={result} onClose={() => setOpenGroup(null)} />}
    </div>
  );
};
