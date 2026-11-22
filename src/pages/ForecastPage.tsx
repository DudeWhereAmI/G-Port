import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { ForecastInterval, TosVesselSchedule, PvSystemStatus, ElectricityTariffTou, SubPageId } from "../types/gport";
import {
  FileText,
  Settings,
  Send,
  ZoomOut,
  Database,
  LayoutGrid,
  List,
  FileSpreadsheet,
  Activity,
  History,
  Download,
  Gauge,
  Search,
  Lock,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import {
  BASE_FORECAST,
  BASE_SCENARIO,
  BASE_VESSELS,
  ForecastWindowRecord,
  MODEL_METRICS,
  ACCURACY_HISTORY,
  SUBSTATION_LIMIT_KW,
  TOU_PRESETS,
  TouBand,
  TouPreset,
  WindowStatus,
  DEFAULT_WHAT_IF,
  WhatIfInput,
  applyWhatIf,
  computeForecast,
  reforecastTriggers,
  FORECAST_DATE,
  FORECAST_VERSION,
  LOCK_MINUTE,
  NOW_MINUTE,
  ISSUE_MINUTE,
  INPUT_DATA_QUALITY,
  minuteLabel,
} from "../data/module1Forecast";
import { downloadForecastCsv, openForecastPdf } from "../utils/exportForecast";
import { ModelHealthPanel } from "../components/forecast/ModelHealthPanel";
import { ReforecastLog } from "../components/forecast/ReforecastLog";
import { estimateM3Dispatch, ForecastHandoff } from "../data/module3PeakShaving";
import { useFormat } from "../utils/format";
import { ForecastDemandChart, ForecastChartLegend, ForecastChartMode } from "../components/forecast/ForecastDemandChart";
import { RiskRibbon } from "../components/forecast/RiskRibbon";
import { BerthGantt } from "../components/forecast/BerthGantt";
import { WhatIfPanel } from "../components/forecast/WhatIfPanel";
import { FeederDrawer } from "../components/forecast/FeederDrawer";
import { FULL_DAY_DOMAIN, TIMELINE_LEFT, TimeDomain } from "../components/forecast/timeline";
import {
  Button,
  Card,
  ChartCard,
  Column,
  DataTable,
  DetailDrawer,
  Input,
  KpiCard,
  KpiRow,
  MetaLine,
  PageHeader,
  SegmentedControl,
  Select,
  StatusBadge,
  Tabs,
  useToast,
} from "../components/ui";
import { breadcrumbOf } from "../components/shell/pages";

interface ForecastPageProps {
  forecastData: ForecastInterval[];
  vessels: TosVesselSchedule[];
  tariff: ElectricityTariffTou;
  pvStatus: PvSystemStatus;
  focusedWindowId?: string | null;
  focusedWindowOpenReport?: boolean;
  onClearFocusedWindow?: () => void;
  onNavigate?: (page: SubPageId) => void;
  onSendToPeakShaving?: (handoff: ForecastHandoff) => void;
}

export type { ForecastWindowRecord };

// ---------------------------------------------------------------------------
// Badges: TOU tariff band and operational status are separate pills
// ---------------------------------------------------------------------------

export function useBadgeLabels() {
  const { t } = useLanguage();
  const tou = (b: TouBand) => (b === "OFF_PEAK" ? t("Off-peak", "Thấp điểm") : b === "PEAK" ? t("Peak", "Cao điểm") : t("Normal", "Bình thường"));
  const status = (s: WindowStatus) =>
    s === "OVERLOAD" ? t("Overload", "Quá tải") : s === "WARNING" ? t("Warning", "Cảnh báo") : s === "HIGH_SOLAR" ? t("Solar peak", "Đỉnh mặt trời") : t("Normal", "Bình thường");
  return { tou, status };
}

export const TouBadge: React.FC<{ band: TouBand }> = ({ band }) => {
  const { t } = useLanguage();
  const labels = useBadgeLabels();
  return (
    <StatusBadge tone={band === "PEAK" ? "danger" : band === "OFF_PEAK" ? "info" : "neutral"} dot={false} title={t("Time-of-use tariff band", "Khung giá điện TOU")}>
      TOU · {labels.tou(band)}
    </StatusBadge>
  );
};

export const WindowStatusBadge: React.FC<{ status: WindowStatus }> = ({ status }) => {
  const { t } = useLanguage();
  const labels = useBadgeLabels();
  return (
    <StatusBadge status={status} title={t("Substation status (net grid import)", "Trạng thái trạm (theo điện lưới thuần)")}>
      {labels.status(status)}
    </StatusBadge>
  );
};

const Toggle: React.FC<{ on: boolean; onClick: () => void; color: string; label: string }> = ({ on, onClick, color, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    className={`h-8 px-2.5 rounded-control border text-label font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
      on ? "bg-white border-slate-300 text-ink" : "bg-white border-line text-muted hover:text-ink"
    }`}
  >
    <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: on ? color : "#CBD5E1" }} aria-hidden="true" />
    {label}
  </button>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-0.5">
    <div className="text-xs text-muted">{label}</div>
    <div className="text-sm text-ink tabular-nums">{children}</div>
  </div>
);

export const ForecastPage: React.FC<ForecastPageProps> = ({ focusedWindowId, focusedWindowOpenReport, onClearFocusedWindow, onNavigate, onSendToPeakShaving }) => {
  const { t, lang } = useLanguage();
  const { num, kw, pct } = useFormat();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ALERTS" | "HIGH_SOLAR" | "OFF_PEAK">("ALL");

  // Chart controls
  const [chartMode, setChartMode] = useState<ForecastChartMode>("TOTAL");
  const [showPv, setShowPv] = useState(false);
  const [showNetGrid, setShowNetGrid] = useState(true);
  const [showTou, setShowTou] = useState(true);
  const [presetId, setPresetId] = useState<TouPreset["id"]>("CURRENT");
  const [domain, setDomain] = useState<TimeDomain>(FULL_DAY_DOMAIN);
  const [hoverVesselId, setHoverVesselId] = useState<string | null>(null);

  // What-if
  const [whatIf, setWhatIf] = useState<WhatIfInput>(DEFAULT_WHAT_IF);

  // Window list view, analytics tab
  const [windowView, setWindowView] = useState<"CARDS" | "TABLE">("CARDS");
  const [zoomedWindowId, setZoomedWindowId] = useState<string | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<"HEALTH" | "LOG">("HEALTH");
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Drawers
  const [selectedWindow, setSelectedWindow] = useState<ForecastWindowRecord | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [showFeederDrawer, setShowFeederDrawer] = useState(false);
  const [showForecastReportModal, setShowForecastReportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ---------------------------------------------------------------- model ---
  const preset = TOU_PRESETS.find((p) => p.id === presetId) ?? TOU_PRESETS[0];
  const baseResult = useMemo(() => (preset.id === BASE_FORECAST.preset.id ? BASE_FORECAST : computeForecast(BASE_SCENARIO, preset)), [preset]);
  const isDefaultWhatIf = whatIf.etaShiftMin === 0 && whatIf.cranes === null && whatIf.reeferPct === 0 && whatIf.pvReductionPct === 0;
  const result = useMemo(
    () => (isDefaultWhatIf ? baseResult : computeForecast(applyWhatIf(BASE_SCENARIO, whatIf), preset, baseResult)),
    [isDefaultWhatIf, baseResult, whatIf, preset]
  );
  const triggers = reforecastTriggers(whatIf);
  const m3Estimate = useMemo(() => estimateM3Dispatch(result), [result]);
  const kpis = result.kpis;
  const windows = result.windows;
  const limitKw = kw(SUBSTATION_LIMIT_KW);

  const activeAlert =
    kpis.alertWindows.find((w) => w.id === activeAlertId) ?? kpis.alertWindows.find((w) => w.points.includes(kpis.maxPPeak)) ?? kpis.alertWindows[0] ?? null;
  const liveSelected = selectedWindow ? windows.find((w) => w.id === selectedWindow.id) ?? selectedWindow : null;

  React.useEffect(() => {
    if (!focusedWindowId) return;
    const found = BASE_FORECAST.windows.find((w) => w.id === focusedWindowId) || BASE_FORECAST.kpis.peakWindow;
    setSelectedWindow(found);
    if (focusedWindowOpenReport) {
      setShowForecastReportModal(true);
      setShowFeederDrawer(false);
    } else {
      setShowFeederDrawer(true);
      setShowForecastReportModal(false);
    }
    onClearFocusedWindow?.();
  }, [focusedWindowId, focusedWindowOpenReport, onClearFocusedWindow]);

  const filteredWindows = windows.filter((w) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      w.timeWindow.toLowerCase().includes(q) ||
      w.vesselCodes.join(" ").toLowerCase().includes(q) ||
      w.vessels.join(" ").toLowerCase().includes(q) ||
      w.summary.en.toLowerCase().includes(q) ||
      w.summary.vn.toLowerCase().includes(q) ||
      w.berth.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (statusFilter === "ALERTS") return w.status === "OVERLOAD" || w.status === "WARNING";
    if (statusFilter === "HIGH_SOLAR") return w.peakPvKw >= 800;
    if (statusFilter === "OFF_PEAK") return w.touBand === "OFF_PEAK";
    return true;
  });

  const handleOpenFeederDrawer = (record: ForecastWindowRecord) => {
    setSelectedWindow(record);
    setShowFeederDrawer(true);
  };
  const handleOpenForecastReport = (record: ForecastWindowRecord) => {
    setSelectedWindow(record);
    setShowForecastReportModal(true);
  };
  const zoomToWindow = (w: ForecastWindowRecord, scroll = false) => {
    setDomain([Math.max(0, w.startMinute - 60), Math.min(1440, w.startMinute + 180)]);
    setZoomedWindowId(w.id);
    if (scroll) chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportMeta = { lang, simulated: !isDefaultWhatIf };
  const handleExportCsv = () => {
    downloadForecastCsv(result, exportMeta);
    toast(t("CSV with 96 intervals downloaded", "Đã tải CSV gồm 96 chu kỳ"));
  };
  const handleExportPdf = () => {
    const ok = openForecastPdf(result, exportMeta);
    toast(
      ok
        ? t("Report opened in a new tab – use “Save as PDF”", "Đã mở báo cáo ở tab mới – chọn “Lưu dưới dạng PDF”")
        : t("Pop-up blocked – allow pop-ups and try again", "Trình duyệt chặn tab mới – hãy cho phép rồi thử lại"),
      ok ? "success" : "warning"
    );
  };
  const handleSendToM3 = (w: ForecastWindowRecord) => {
    onSendToPeakShaving?.({ windowId: w.id, timeWindow: w.timeWindow, peakTime: w.peakTime, netGridKw: w.netGridKw, maxPPeakPct: w.maxPPeak * 100, estimate: m3Estimate });
  };

  const vesselLabel = (w: ForecastWindowRecord) => w.vessels.join(" & ") || "—";
  const highlightVessel = hoverVesselId ? { id: hoverVesselId, name: result.scenario.vessels.find((v) => v.id === hoverVesselId)?.name ?? "" } : null;
  const isZoomed = domain[0] !== FULL_DAY_DOMAIN[0] || domain[1] !== FULL_DAY_DOMAIN[1];

  const tableColumns: Column<ForecastWindowRecord>[] = [
    { key: "time", header: t("Window", "Khung giờ"), sortValue: (w) => w.startMinute, render: (w) => <span className="font-medium">{w.timeWindow}</span> },
    { key: "peak", header: t("Peak at", "Lúc đỉnh"), render: (w) => <span className="text-muted">{w.peakTime}</span> },
    { key: "vessels", header: t("Vessels", "Tàu"), render: (w) => <span className="text-muted truncate block max-w-[220px]" title={vesselLabel(w)}>{vesselLabel(w)}</span> },
    { key: "load", header: t("Load P50 (kW)", "Tải P50 (kW)"), align: "right", sortValue: (w) => w.p50Kw, render: (w) => num(w.p50Kw) },
    { key: "pv", header: "PV (kW)", align: "right", sortValue: (w) => w.pvKw, render: (w) => num(w.pvKw) },
    { key: "grid", header: t("Net grid (kW)", "Lưới thuần (kW)"), align: "right", sortValue: (w) => w.netGridKw, render: (w) => <span className="font-medium">{num(w.netGridKw)}</span> },
    { key: "reefer", header: "Reefer", align: "right", sortValue: (w) => w.reeferPlugs, render: (w) => num(w.reeferPlugs) },
    { key: "p", header: "p_peak", align: "right", sortValue: (w) => w.maxPPeak, render: (w) => pct(w.maxPPeak * 100, 0) },
    { key: "tou", header: "TOU", render: (w) => <TouBadge band={w.touBand} /> },
    { key: "status", header: t("Status", "Trạng thái"), sortValue: (w) => ({ NORMAL: 0, HIGH_SOLAR: 1, WARNING: 2, OVERLOAD: 3 })[w.status] * 1e5 + w.netGridKw, render: (w) => <WindowStatusBadge status={w.status} /> },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        breadcrumb={breadcrumbOf("MODULE_1_FORECAST", t)}
        title={t("Load forecast", "Dự báo phụ tải")}
        description={t("Net grid demand for the next 24 h in 96 × 15-minute intervals, against the 8,000 kW substation limit.", "Nhu cầu điện lưới 24h tới theo 96 chu kỳ 15 phút, so với giới hạn trạm 8.000 kW.")}
        meta={
          <MetaLine
            items={[
              t(FORECAST_DATE.en, FORECAST_DATE.vn),
              t(`Issued ${minuteLabel(ISSUE_MINUTE)} previous day`, `Lập lúc ${minuteLabel(ISSUE_MINUTE)} hôm trước`),
              t(`Updated ${minuteLabel(LOCK_MINUTE)}`, `Cập nhật lúc ${minuteLabel(LOCK_MINUTE)}`),
              t("Source: TOS N4 · SCADA · weather", "Nguồn: TOS N4 · SCADA · thời tiết"),
              <>
                {t(`Version #${FORECAST_VERSION}`, `Phiên bản #${FORECAST_VERSION}`)}
                {triggers.length > 0 && <span className="text-warning"> → {t(`draft #${FORECAST_VERSION + 1}`, `bản nháp #${FORECAST_VERSION + 1}`)}</span>}
              </>,
              <button key="dq" type="button" onClick={() => onNavigate?.("INPUT_LAYER")} className="inline-flex items-center gap-1 text-brand hover:underline cursor-pointer">
                <Database className="w-3.5 h-3.5" aria-hidden="true" />
                {t(`Input data ${pct(INPUT_DATA_QUALITY.validPct)} valid · ${INPUT_DATA_QUALITY.errorFlags} flags`, `Dữ liệu đầu vào ${pct(INPUT_DATA_QUALITY.validPct)} hợp lệ · ${INPUT_DATA_QUALITY.errorFlags} cờ lỗi`)}
              </button>,
            ]}
          />
        }
        actions={
          <>
            <Button variant="ghost" icon={Settings} onClick={() => setShowSettingsModal(true)}>
              {t("Settings", "Cấu hình")}
            </Button>
            <Button icon={FileSpreadsheet} onClick={handleExportCsv}>
              CSV
            </Button>
            <Button icon={Download} onClick={handleExportPdf}>
              PDF
            </Button>
            <Button variant="primary" icon={FileText} onClick={() => handleOpenForecastReport(kpis.peakWindow)}>
              {t("24h report", "Báo cáo 24h")}
            </Button>
          </>
        }
      />

      {/* KPIs – the overload warning is the page's single colour accent */}
      <KpiRow>
        <KpiCard
          label={t("Peak net grid demand", "Đỉnh điện lưới thuần")}
          value={num(kpis.peakNetGrid.netGrid)}
          unit="kW"
          hint={t(`at ${kpis.peakNetGrid.label} · load P50 ${kw(kpis.peakNetGrid.p50)}`, `lúc ${kpis.peakNetGrid.label} · tải P50 ${kw(kpis.peakNetGrid.p50)}`)}
          spark={result.points.filter((_, i) => i % 4 === 0).map((p) => p.netGrid)}
        />
        <KpiCard
          accent={kpis.alertWindows.length ? "danger" : undefined}
          label={t(`Overload warnings (> ${limitKw})`, `Cảnh báo vượt ngưỡng (> ${limitKw})`)}
          value={String(kpis.alertWindows.length)}
          unit={t("windows", "khung giờ")}
          hint={
            kpis.alertWindows.length
              ? t(`max exceedance ${pct(kpis.maxPPeak.pPeak * 100, 0)} at ${kpis.maxPPeak.label}`, `xác suất vượt cao nhất ${pct(kpis.maxPPeak.pPeak * 100, 0)} lúc ${kpis.maxPPeak.label}`)
              : t("No window above the limit", "Không có khung vượt ngưỡng")
          }
        />
        <KpiCard
          label={t("Peak solar generation", "Đỉnh điện mặt trời")}
          value={num(kpis.peakPv.pv)}
          unit="kW"
          hint={t(`at ${kpis.peakPv.label} · net grid ${kw(kpis.peakPv.netGrid)}`, `lúc ${kpis.peakPv.label} · lưới thuần ${kw(kpis.peakPv.netGrid)}`)}
        />
        <KpiCard
          label={t("Forecast accuracy (30 days)", "Độ chính xác dự báo (30 ngày)")}
          value={num(kpis.accuracyPct, 1)}
          unit="%"
          delta={{ value: `MAPE ${pct(MODEL_METRICS.mapeBaselinePct, 2)} → ${pct(MODEL_METRICS.mapePct, 2)}`, direction: "down", good: true }}
          hint={`RMSE ${kw(MODEL_METRICS.rmseKw, 1)}`}
        />
      </KpiRow>

      {kpis.alertWindows.length > 0 && (
        <Card className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <TrendingDown className="w-5 h-5 text-muted shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">
                {t(
                  `With the M-3 dispatch plan the peak drops ~${pct(m3Estimate.reductionPct, 0)}: ${kw(m3Estimate.peakBeforeKw)} → ${kw(m3Estimate.peakAfterKw)}`,
                  `Nếu áp dụng điều độ M-3, đỉnh giảm ~${pct(m3Estimate.reductionPct, 0)}: ${kw(m3Estimate.peakBeforeKw)} → ${kw(m3Estimate.peakAfterKw)}`
                )}
              </div>
              <div className="text-xs text-muted flex flex-wrap items-center gap-1.5 mt-1">
                {kpis.alertWindows.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setActiveAlertId(w.id);
                      zoomToWindow(w, true);
                    }}
                    className={`h-6 px-2 rounded-full border text-xs cursor-pointer ${activeAlert?.id === w.id ? "border-brand text-brand bg-brand-soft" : "border-line text-muted hover:text-ink"}`}
                  >
                    {w.timeWindow} · {kw(w.netGridKw)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {activeAlert && onSendToPeakShaving && (
            <Button icon={Send} onClick={() => handleSendToM3(activeAlert)}>
              {t(`Send ${activeAlert.id} to peak shaving (M-3)`, `Gửi ${activeAlert.id} sang cắt đỉnh (M-3)`)}
            </Button>
          )}
        </Card>
      )}

      {/* Main chart + what-if */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div ref={chartRef} className="scroll-mt-4 min-w-0">
          <ChartCard
            title={t("24-hour demand curve", "Đường cong phụ tải 24 giờ")}
            description={t("Overload is assessed on net grid import (load − PV)", "Cảnh báo quá tải tính trên điện lưới thuần (tải − PV)")}
            toolbar={
              <SegmentedControl
                ariaLabel={t("Chart view", "Chế độ biểu đồ")}
                value={chartMode}
                onChange={setChartMode}
                items={[
                  { id: "TOTAL", label: t("Total load", "Tổng phụ tải") },
                  { id: "FEEDERS", label: t("By 6 feeders", "Theo 6 lộ") },
                ]}
              />
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Toggle on={showPv} onClick={() => setShowPv((v) => !v)} color="#E0A21B" label={t("PV forecast", "PV dự báo")} />
              <Toggle on={showNetGrid} onClick={() => setShowNetGrid((v) => !v)} color="#7C6BD6" label={t("Net grid", "Điện lưới thuần")} />
              <Toggle on={showTou} onClick={() => setShowTou((v) => !v)} color="#FECACA" label={t("TOU bands", "Khung giá TOU")} />
              <Select label={t("TOU preset", "Preset TOU")} value={presetId} onChange={(e) => setPresetId(e.target.value as TouPreset["id"])} title={t(preset.note.en, preset.note.vn)}>
                {TOU_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(p.name.en, p.name.vn)}
                  </option>
                ))}
              </Select>
              {isZoomed && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={ZoomOut}
                  onClick={() => {
                    setDomain(FULL_DAY_DOMAIN);
                    setZoomedWindowId(null);
                  }}
                >
                  {t(`Show 24 h (${minuteLabel(domain[0])}–${minuteLabel(domain[1])})`, `Xem 24h (${minuteLabel(domain[0])}–${minuteLabel(domain[1])})`)}
                </Button>
              )}
            </div>
            <ForecastDemandChart points={result.points} mode={chartMode} showPv={showPv} showNetGrid={showNetGrid} showTou={showTou} domain={domain} highlightVessel={highlightVessel} />
            <ForecastChartLegend mode={chartMode} showPv={showPv} showNetGrid={showNetGrid} showTou={showTou} highlightVesselName={highlightVessel?.name} />
            <div className="pt-3 border-t border-line">
              <RiskRibbon points={result.points} domain={domain} />
            </div>
            <div className="pt-3 border-t border-line space-y-2">
              <div className="text-label font-medium text-ink" style={{ paddingLeft: TIMELINE_LEFT }}>
                {t("Berth schedule", "Lịch cầu bến")}
              </div>
              <BerthGantt vessels={result.scenario.vessels} baseVessels={BASE_VESSELS} domain={domain} highlightId={hoverVesselId} onHover={setHoverVesselId} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              {t(
                `Intervals before ${minuteLabel(LOCK_MINUTE)} are locked with metered values · now ${minuteLabel(NOW_MINUTE)}`,
                `Các chu kỳ trước ${minuteLabel(LOCK_MINUTE)} đã khóa cùng số thực đo · hiện tại ${minuteLabel(NOW_MINUTE)}`
              )}
            </div>
          </ChartCard>
        </div>
        <div className="xl:sticky xl:top-4">
          <WhatIfPanel value={whatIf} onChange={setWhatIf} onReset={() => setWhatIf(DEFAULT_WHAT_IF)} triggers={triggers} base={baseResult} current={result} />
        </div>
      </div>

      {/* Time windows */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">{t("Two-hour windows", "Khung giờ 2 tiếng")}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Input icon={Search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("Hour, vessel, berth…", "Giờ, tàu, cầu bến…")} aria-label={t("Search windows", "Tìm khung giờ")} className="w-56" />
            <SegmentedControl
              size="sm"
              ariaLabel={t("Filter", "Bộ lọc")}
              value={statusFilter}
              onChange={setStatusFilter}
              items={[
                { id: "ALL", label: t(`All (${windows.length})`, `Tất cả (${windows.length})`) },
                { id: "ALERTS", label: t("Alerts", "Cảnh báo") },
                { id: "HIGH_SOLAR", label: t("High solar", "PV cao") },
                { id: "OFF_PEAK", label: t("Off-peak", "Thấp điểm") },
              ]}
            />
            <SegmentedControl
              size="sm"
              ariaLabel={t("View", "Kiểu xem")}
              value={windowView}
              onChange={setWindowView}
              items={[
                { id: "CARDS", label: t("Cards", "Thẻ"), icon: LayoutGrid },
                { id: "TABLE", label: t("Table", "Bảng"), icon: List },
              ]}
            />
          </div>
        </div>

        {windowView === "TABLE" ? (
          <DataTable
            rows={filteredWindows}
            columns={tableColumns}
            rowKey={(w) => w.id}
            onRowClick={(w) => zoomToWindow(w, true)}
            selectedKey={zoomedWindowId}
            initialSort={{ key: "time", dir: 1 }}
            emptyTitle={t("No window matches", "Không có khung giờ phù hợp")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredWindows.map((win) => {
              const isOverload = win.status === "OVERLOAD";
              return (
                <Card key={win.id} className="flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => zoomToWindow(win, true)} className="text-base font-semibold text-ink hover:text-brand cursor-pointer" title={t("Zoom chart to this window", "Phóng biểu đồ tới khung giờ này")}>
                        {win.timeWindow}
                      </button>
                      <WindowStatusBadge status={win.status} />
                    </div>
                    <div className="text-xs text-muted">
                      <span className="break-words" title={vesselLabel(win)}>
                        {vesselLabel(win)}
                      </span>{" "}
                      · {t("Berth", "Cầu")} {win.berth} · {win.stsCranes} STS
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <Field label={t(`Load P50 · ${win.peakTime}`, `Tải P50 · ${win.peakTime}`)}>{kw(win.p50Kw)}</Field>
                      <Field label="P10–P90">
                        {num(win.p10Kw)}–{num(win.p90Kw)}
                      </Field>
                      <Field label="PV">{win.pvKw > 0 ? `−${kw(win.pvKw)}` : kw(0)}</Field>
                      <Field label={t("Net grid", "Lưới thuần")}>
                        <span className={isOverload ? "text-danger font-semibold" : "font-medium"}>{kw(win.netGridKw)}</span>
                      </Field>
                    </dl>
                    <div className="flex items-center justify-between gap-2">
                      <TouBadge band={win.touBand} />
                      <span className="text-xs text-muted">p_peak {pct(win.maxPPeak * 100, 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-line">
                    <Button size="sm" variant="ghost" icon={Gauge} onClick={() => handleOpenFeederDrawer(win)}>
                      {t("6 feeders", "6 lộ")}
                    </Button>
                    <Button size="sm" variant="ghost" icon={FileText} onClick={() => handleOpenForecastReport(win)}>
                      {t("Report", "Báo cáo")}
                    </Button>
                    {(isOverload || win.status === "WARNING") && onSendToPeakShaving && (
                      <Button size="sm" variant="ghost" icon={ChevronRight} className="ml-auto" onClick={() => handleSendToM3(win)} aria-label={t("Send to peak shaving (M-3)", "Gửi sang cắt đỉnh (M-3)")}>
                        M-3
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Model */}
      <Card className="space-y-4">
        <h2 className="text-base font-semibold text-ink">{t("Forecast model", "Mô hình dự báo")}</h2>
        <Tabs
          value={analyticsTab}
          onChange={setAnalyticsTab}
          items={[
            { id: "HEALTH", label: t("Model health", "Sức khỏe mô hình"), icon: Activity },
            { id: "LOG", label: t("Re-forecast log", "Nhật ký tái dự báo"), icon: History },
          ]}
        />
        {analyticsTab === "HEALTH" ? <ModelHealthPanel /> : <ReforecastLog />}
      </Card>

      {showFeederDrawer && liveSelected && (
        <FeederDrawer
          window={liveSelected}
          onClose={() => setShowFeederDrawer(false)}
          onOpenReport={() => {
            setShowFeederDrawer(false);
            setShowForecastReportModal(true);
          }}
        />
      )}

      {showForecastReportModal && liveSelected && (
        <DetailDrawer
          width={640}
          title={t("24-hour forecast report", "Báo cáo dự báo 24 giờ")}
          subtitle={t(`Version #${FORECAST_VERSION} · ${FORECAST_DATE.en}`, `Phiên bản #${FORECAST_VERSION} · ${FORECAST_DATE.vn}`)}
          onClose={() => setShowForecastReportModal(false)}
          footer={
            <>
              <Button icon={FileSpreadsheet} onClick={handleExportCsv}>
                CSV
              </Button>
              <Button variant="primary" icon={Download} onClick={handleExportPdf}>
                {t("Export PDF", "Xuất PDF")}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-card bg-slate-50 border border-line">
              <Field label={t("Selected window", "Khung giờ chọn")}>
                <span className="font-medium">{liveSelected.timeWindow}</span>
              </Field>
              <Field label={t("Status", "Trạng thái")}>
                <WindowStatusBadge status={liveSelected.status} />
              </Field>
              <Field label="P50 · P10–P90">
                {kw(liveSelected.p50Kw)} · {num(liveSelected.p10Kw)}–{num(liveSelected.p90Kw)}
              </Field>
              <Field label={t("PV · net grid", "PV · lưới thuần")}>
                −{kw(liveSelected.pvKw)} · {kw(liveSelected.netGridKw)}
              </Field>
            </div>
            <DataTable
              rows={windows}
              columns={tableColumns.filter((c) => ["time", "load", "pv", "grid", "status"].includes(c.key))}
              rowKey={(w) => w.id}
              onRowClick={(w) => setSelectedWindow(w)}
              selectedKey={liveSelected.id}
              pageSize={12}
            />
            <div className="text-xs text-muted">
              RMSE {kw(MODEL_METRICS.rmseKw, 1)} · MAPE {pct(MODEL_METRICS.mapePct, 2)} · {t(`limit ${limitKw} on net grid`, `ngưỡng ${limitKw} trên điện lưới thuần`)}
            </div>
          </div>
        </DetailDrawer>
      )}

      {showSettingsModal && (
        <DetailDrawer title={t("Forecast update rules", "Quy tắc cập nhật dự báo")} subtitle={t("Rolling update, event triggers and TOU presets", "Cập nhật cuốn chiếu, sự kiện kích hoạt và preset TOU")} onClose={() => setShowSettingsModal(false)}>
          <div className="space-y-6">
            <ul className="space-y-3">
              {[
                [t("Day-ahead & rolling update", "Dự báo ngày tới & cuốn chiếu"), t("Issued at 22:00; rolls every 15 min, past intervals locked for audit.", "Lập lúc 22:00; cập nhật mỗi 15 phút, phần quá khứ khóa để kiểm toán.")],
                [t("Vessel schedule events", "Sự kiện lịch tàu"), t("ETA deviation ≥ 30 min or berth change.", "ETA lệch ≥ 30 phút hoặc đổi cầu bến.")],
                [t("Volume & reefer change", "Biến động sản lượng & reefer"), t("Throughput ≥ 15% or reefer count ≥ 10%.", "Sản lượng ≥ 15% hoặc số container lạnh ≥ 10%.")],
                [t("STS stop & weekly retraining", "Dừng STS & tự huấn luyện"), t("Immediate re-forecast on STS stop; weekly retrain, window 5 → 30 days.", "Tái dự báo ngay khi STS dừng; huấn luyện hằng tuần, cửa sổ 5 → 30 ngày.")],
              ].map(([h, d]) => (
                <li key={h} className="space-y-0.5">
                  <div className="text-sm font-medium text-ink">{h}</div>
                  <div className="text-label text-muted">{d}</div>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-ink">{t("TOU preset", "Preset khung giá TOU")}</div>
              <SegmentedControl value={presetId} onChange={setPresetId} items={TOU_PRESETS.map((p) => ({ id: p.id, label: t(p.name.en, p.name.vn) }))} />
              <div className="text-label text-muted">{t(preset.note.en, preset.note.vn)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-ink">{t("Accuracy by training window", "Độ chính xác theo cửa sổ huấn luyện")}</div>
              <DataTable
                rows={ACCURACY_HISTORY}
                rowKey={(r) => String(r.windowDays)}
                columns={[
                  { key: "d", header: t("Window", "Cửa sổ"), render: (r) => t(`${r.windowDays} days`, `${r.windowDays} ngày`) },
                  { key: "n", header: t("Samples", "Số mẫu"), align: "right", render: (r) => num(r.samples) },
                  { key: "m", header: "MAPE", align: "right", render: (r) => pct(r.mapePct, 2) },
                  { key: "r", header: "RMSE (kW)", align: "right", render: (r) => num(r.rmseKw, 1) },
                  { key: "c", header: t("Coverage", "Độ phủ"), align: "right", render: (r) => pct(r.coveragePct) },
                ]}
              />
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
};
