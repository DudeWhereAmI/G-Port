import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  ForecastInterval,
  TosVesselSchedule,
  PvSystemStatus,
  ElectricityTariffTou,
  SubPageId
} from "../types/gport";
import {
  TrendingUp,
  AlertTriangle,
  SunMedium,
  FileText,
  Search,
  Clock,
  Gauge,
  Printer,
  Download,
  X,
  ShieldCheck,
  Settings,
  Send,
  TrendingDown,
  ZoomOut,
  Lock,
  ChevronRight,
  Database,
  LayoutGrid,
  List,
  FileSpreadsheet,
  Activity,
  History
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
  minuteLabel
} from "../data/module1Forecast";
import { downloadForecastCsv, openForecastPdf } from "../utils/exportForecast";
import { WindowTable } from "../components/forecast/WindowTable";
import { ModelHealthPanel } from "../components/forecast/ModelHealthPanel";
import { ReforecastLog } from "../components/forecast/ReforecastLog";
import { estimateM3Dispatch, ForecastHandoff } from "../data/module3PeakShaving";
import { useFormat } from "../utils/format";
import {
  ForecastDemandChart,
  ForecastChartLegend,
  ForecastChartMode
} from "../components/forecast/ForecastDemandChart";
import { RiskRibbon } from "../components/forecast/RiskRibbon";
import { BerthGantt } from "../components/forecast/BerthGantt";
import { WhatIfPanel } from "../components/forecast/WhatIfPanel";
import { FeederDrawer } from "../components/forecast/FeederDrawer";
import { FULL_DAY_DOMAIN, TimeDomain } from "../components/forecast/timeline";

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
// Badges: TOU tariff band and operational status are shown separately
// ---------------------------------------------------------------------------

const TOU_BADGE_STYLE: Record<TouBand, string> = {
  OFF_PEAK: "bg-sky-50 text-sky-800 border-sky-200",
  STANDARD: "bg-slate-50 text-slate-700 border-slate-200",
  PEAK: "bg-rose-50 text-rose-800 border-rose-200",
};

const STATUS_BADGE_STYLE: Record<WindowStatus, string> = {
  NORMAL: "bg-emerald-50 text-emerald-800 border-emerald-200",
  HIGH_SOLAR: "bg-lime-50 text-lime-800 border-lime-200",
  WARNING: "bg-amber-100 text-amber-900 border-amber-300",
  OVERLOAD: "bg-red-600 text-white border-red-600",
};

export function useBadgeLabels() {
  const { t } = useLanguage();
  const tou = (b: TouBand) =>
    b === "OFF_PEAK" ? t("Off-peak", "Thấp điểm") : b === "PEAK" ? t("Peak", "Cao điểm") : t("Normal", "Bình thường");
  const status = (s: WindowStatus) =>
    s === "OVERLOAD"
      ? t("Overload", "Quá tải")
      : s === "WARNING"
      ? t("Warning", "Cảnh báo")
      : s === "HIGH_SOLAR"
      ? t("Solar peak", "Đỉnh mặt trời")
      : t("Normal", "Bình thường");
  return { tou, status };
}

export const TouBadge: React.FC<{ band: TouBand }> = ({ band }) => {
  const { t } = useLanguage();
  const labels = useBadgeLabels();
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${TOU_BADGE_STYLE[band]}`}
      title={t("Time-of-use tariff band", "Khung giá điện TOU")}
    >
      <span className="opacity-70">TOU</span>
      <span>{labels.tou(band)}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: WindowStatus }> = ({ status }) => {
  const { t } = useLanguage();
  const labels = useBadgeLabels();
  return (
    <span
      className={`inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${STATUS_BADGE_STYLE[status]}`}
      title={t("Substation status (net grid import)", "Trạng thái trạm (theo điện lưới thuần)")}
    >
      {labels.status(status)}
    </span>
  );
};

const Toggle: React.FC<{ on: boolean; onClick: () => void; color: string; label: string }> = ({ on, onClick, color, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
      on ? "bg-white border-slate-300 text-slate-900 shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
    }`}
  >
    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: on ? color : "#CBD5E1" }} />
    {label}
  </button>
);

export const ForecastPage: React.FC<ForecastPageProps> = ({
  focusedWindowId,
  focusedWindowOpenReport,
  onClearFocusedWindow,
  onNavigate,
  onSendToPeakShaving,
}) => {
  const { t, lang } = useLanguage();
  const { num, kw, pct } = useFormat();
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

  // Window list view (C4), analytics tab (C1/C2), export feedback (C5)
  const [windowView, setWindowView] = useState<"CARDS" | "TABLE">("CARDS");
  const [zoomedWindowId, setZoomedWindowId] = useState<string | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<"HEALTH" | "LOG">("HEALTH");
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Popups
  const [selectedWindow, setSelectedWindow] = useState<ForecastWindowRecord | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [showFeederDrawer, setShowFeederDrawer] = useState(false);
  const [showForecastReportModal, setShowForecastReportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ---------------------------------------------------------------- model ---
  const preset = TOU_PRESETS.find((p) => p.id === presetId) ?? TOU_PRESETS[0];
  const baseResult = useMemo(
    () => (preset.id === BASE_FORECAST.preset.id ? BASE_FORECAST : computeForecast(BASE_SCENARIO, preset)),
    [preset]
  );
  const isDefaultWhatIf =
    whatIf.etaShiftMin === 0 && whatIf.cranes === null && whatIf.reeferPct === 0 && whatIf.pvReductionPct === 0;
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
    kpis.alertWindows.find((w) => w.id === activeAlertId) ??
    kpis.alertWindows.find((w) => w.points.includes(kpis.maxPPeak)) ??
    kpis.alertWindows[0] ??
    null;

  // keep an open window in sync with what-if / preset changes
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
    setExportNotice(t("CSV with 96 intervals downloaded.", "Đã tải CSV gồm 96 chu kỳ."));
  };
  const handleExportPdf = () => {
    const ok = openForecastPdf(result, exportMeta);
    setExportNotice(
      ok
        ? t("Report opened in a new tab – choose “Save as PDF” in the print dialog.", "Đã mở báo cáo ở tab mới – chọn “Lưu dưới dạng PDF” trong hộp thoại in.")
        : t("The browser blocked the new tab. Allow pop-ups for this site and try again.", "Trình duyệt đã chặn tab mới. Hãy cho phép cửa sổ bật lên cho trang này rồi thử lại.")
    );
  };

  const handleSendToM3 = (w: ForecastWindowRecord) => {
    onSendToPeakShaving?.({
      windowId: w.id,
      timeWindow: w.timeWindow,
      peakTime: w.peakTime,
      netGridKw: w.netGridKw,
      maxPPeakPct: w.maxPPeak * 100,
      estimate: m3Estimate,
    });
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // Safe fallback in sandboxed frames
    }
  };

  const berthLabel = (w: ForecastWindowRecord) => `${t("Berth", "Cầu bến")} ${w.berth}`;
  const vesselLabel = (w: ForecastWindowRecord) => w.vessels.join(" & ") || "—";
  const highlightVessel = hoverVesselId
    ? { id: hoverVesselId, name: result.scenario.vessels.find((v) => v.id === hoverVesselId)?.name ?? "" }
    : null;
  const isZoomed = domain[0] !== FULL_DAY_DOMAIN[0] || domain[1] !== FULL_DAY_DOMAIN[1];

  return (
    <div className="space-y-6 pb-12">
      {/* ================================================================== */}
      {/* 1. HEADER BAR (B1: issue time, rolling update, version) */}
      {/* ================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-brand">
              {t("24-Hour Power Forecast", "Dự Báo Phụ Tải Điện 24 Giờ")} · {t(FORECAST_DATE.en, FORECAST_DATE.vn)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-bold">
              {t(`Substation limit: ${limitKw} (net grid)`, `Giới hạn trạm biến áp: ${limitKw} (điện lưới thuần)`)}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("Port Power Demand & Overload Warnings", "Dự Báo Phụ Tải Điện Cảng & Cảnh Báo Quá Tải Trạm")}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 mt-1.5">
            <span>{t(`Issued at ${minuteLabel(ISSUE_MINUTE)} the previous day`, `Lập lúc ${minuteLabel(ISSUE_MINUTE)} hôm trước`)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t(`Last rolling update ${minuteLabel(LOCK_MINUTE)}`, `Cập nhật cuốn chiếu lần cuối ${minuteLabel(LOCK_MINUTE)}`)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-slate-800">
              {t(`Forecast version #${FORECAST_VERSION}`, `Phiên bản dự báo #${FORECAST_VERSION}`)}
              {triggers.length > 0 && (
                <span className="ml-1 text-orange-700">
                  {t(`→ draft #${FORECAST_VERSION + 1} (simulation)`, `→ bản nháp #${FORECAST_VERSION + 1} (mô phỏng)`)}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.("INPUT_LAYER")}
            className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 cursor-pointer"
            title={t("Open Telemetry Feeds", "Mở trang Telemetry Feed")}
          >
            <Database className="w-3.5 h-3.5" />
            {t(
              `Input data: ${pct(INPUT_DATA_QUALITY.validPct)} valid · ${INPUT_DATA_QUALITY.errorFlags} error flags`,
              `Dữ liệu đầu vào: ${pct(INPUT_DATA_QUALITY.validPct)} hợp lệ · ${INPUT_DATA_QUALITY.errorFlags} cờ lỗi`
            )}
            <ChevronRight className="w-3 h-3" />
          </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            {t("Export CSV", "Xuất CSV")}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-red-700" />
            {t("Export PDF", "Xuất PDF")}
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-brand" />
            <span>{t("Forecast Settings", "Cấu Hình Dự Báo")}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenForecastReport(kpis.peakWindow)}
            className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t("24h Forecast Report", "Báo Cáo Dự Báo 24h")}</span>
          </button>
        </div>
        {exportNotice && (
          <div className="text-xs text-slate-600 flex items-center gap-2">
            {exportNotice}
            <button type="button" onClick={() => setExportNotice(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label={t("Close", "Đóng")}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. KPI CARDS */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{t("Peak Net Grid Demand", "Đỉnh Điện Lưới Thuần Dự Kiến")}</span>
            <TrendingUp className="w-4 h-4 text-brand" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {num(kpis.peakNetGrid.netGrid)} <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            {t(
              `At ${kpis.peakNetGrid.label} · Load P50 ${kw(kpis.peakNetGrid.p50)} (P90 ${kw(kpis.peakNetGrid.p90)})`,
              `Lúc ${kpis.peakNetGrid.label} · Tải P50 ${kw(kpis.peakNetGrid.p50)} (P90 ${kw(kpis.peakNetGrid.p90)})`
            )}
          </div>
        </div>

        {/* Warning card (B3 + B7) */}
        <div className="bg-amber-50/70 p-4 rounded-xl border-2 border-amber-300 shadow-2xs flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center justify-between text-amber-900 text-xs font-bold mb-1">
              <span>{t(`Grid Overload Warnings (>${limitKw})`, `Cảnh Báo Vượt Ngưỡng Lưới (>${limitKw})`)}</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-800 tabular-nums leading-tight">
              {kpis.alertWindows.length === 0
                ? t("No alert window", "Không có khung cảnh báo")
                : t(
                    `${kpis.alertWindows.length} windows · max exceedance ${pct(kpis.maxPPeak.pPeak * 100, 0)} at ${kpis.maxPPeak.label}`,
                    `${kpis.alertWindows.length} khung giờ · xác suất vượt cao nhất ${pct(kpis.maxPPeak.pPeak * 100, 0)} lúc ${kpis.maxPPeak.label}`
                  )}
            </div>
            {kpis.alertWindows.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {kpis.alertWindows.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setActiveAlertId(w.id);
                      zoomToWindow(w);
                    }}
                    className={`px-1.5 py-0.5 rounded text-xs font-bold border cursor-pointer ${
                      activeAlert?.id === w.id ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
                    }`}
                    title={t("Select & zoom", "Chọn & phóng to")}
                  >
                    {w.timeWindow} · {kw(w.netGridKw)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {activeAlert && onSendToPeakShaving && (
            <button
              type="button"
              onClick={() => handleSendToM3(activeAlert)}
              className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {t(`Send to Peak Shaving (M-3) · ${activeAlert.id}`, `Gửi sang Cắt Đỉnh (M-3) · ${activeAlert.id}`)}
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{t("Peak Solar Generation", "Đỉnh Phát Điện Mặt Trời")}</span>
            <SunMedium className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
            {num(kpis.peakPv.pv)} <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            {t(
              `At ${kpis.peakPv.label} · Net grid drops to ${kw(kpis.peakPv.netGrid)}`,
              `Lúc ${kpis.peakPv.label} · Điện lưới giảm còn ${kw(kpis.peakPv.netGrid)}`
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>{t("Forecast Accuracy (30-Day)", "Độ Chính Xác Dự Báo (30 Ngày)")}</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 tabular-nums">
            {pct(kpis.accuracyPct)}{" "}
            <span className="text-xs text-slate-500 font-sans font-semibold">(1 − MAPE)</span>
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">
            RMSE {kw(MODEL_METRICS.rmseKw, 1)} · MAPE {pct(MODEL_METRICS.mapePct, 2)}
          </div>
        </div>
      </div>

      {/* B7: M-3 dispatch summary (from the same equipment data as the M-3 page) */}
      {kpis.alertWindows.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-emerald-900">
                {t(
                  `If the M-3 dispatch plan is applied: expected peak down ~${pct(m3Estimate.reductionPct, 0)}`,
                  `Nếu áp dụng điều độ M-3: đỉnh dự kiến giảm ~${pct(m3Estimate.reductionPct, 0)}`
                )}
              </div>
              <div className="text-emerald-800 tabular-nums">
                {kw(m3Estimate.peakBeforeKw)} ({m3Estimate.peakBeforeTime}) → {kw(m3Estimate.peakAfterKw)} ({m3Estimate.peakAfterTime})
                <span className="font-sans">
                  {" · "}
                  {t(
                    `${m3Estimate.groupsUsed} flexible equipment groups · ${m3Estimate.dispatchedIntervals} intervals with p_peak ≥ 10%`,
                    `${m3Estimate.groupsUsed} nhóm thiết bị linh hoạt · ${m3Estimate.dispatchedIntervals} chu kỳ có p_peak ≥ 10%`
                  )}
                </span>
              </div>
            </div>
          </div>
          {activeAlert && onSendToPeakShaving && (
            <button
              type="button"
              onClick={() => handleSendToM3(activeAlert)}
              className="self-start md:self-auto px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-100 flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              {t("Open in M-3", "Mở trong M-3")}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* 3. CHART + WHAT-IF */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <div ref={chartRef} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3 min-w-0 scroll-mt-4">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  {t("24-Hour Power Demand Curve", "Đường Cong Dự Báo Phụ Tải Điện 24 Giờ")}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t(
                    "96 intervals × 15 min · overload assessed on net grid import (load − PV)",
                    "96 chu kỳ × 15 phút · cảnh báo quá tải tính trên điện lưới thuần (tải − PV)"
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs self-start">
                {([
                  { id: "TOTAL", label: t("Total load", "Tổng phụ tải") },
                  { id: "FEEDERS", label: t("By 6 feeders", "Theo 6 lộ") },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setChartMode(m.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      chartMode === m.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Toggle on={showPv} onClick={() => setShowPv((v) => !v)} color="#059669" label={t("PV forecast", "PV dự báo")} />
              <Toggle on={showNetGrid} onClick={() => setShowNetGrid((v) => !v)} color="#7C3AED" label={t("Net grid", "Điện lưới thuần")} />
              <Toggle on={showTou} onClick={() => setShowTou((v) => !v)} color="#FCA5A5" label={t("TOU bands", "Khung giá TOU")} />
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                {t("TOU preset", "Preset TOU")}
                <select
                  value={presetId}
                  onChange={(e) => setPresetId(e.target.value as TouPreset["id"])}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                  title={t(preset.note.en, preset.note.vn)}
                >
                  {TOU_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {t(p.name.en, p.name.vn)}
                    </option>
                  ))}
                </select>
              </label>
              {isZoomed && (
                <button
                  type="button"
                  onClick={() => {
                    setDomain(FULL_DAY_DOMAIN);
                    setZoomedWindowId(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-brand text-brand text-xs font-bold flex items-center gap-1 hover:bg-blue-50 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  {t(`Show 24h (zoomed ${minuteLabel(domain[0])}–${minuteLabel(domain[1])})`, `Xem 24h (đang phóng ${minuteLabel(domain[0])}–${minuteLabel(domain[1])})`)}
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500">{t(preset.note.en, preset.note.vn)}</div>
          </div>

          <ForecastDemandChart
            points={result.points}
            mode={chartMode}
            showPv={showPv}
            showNetGrid={showNetGrid}
            showTou={showTou}
            domain={domain}
            highlightVessel={highlightVessel}
          />
          <ForecastChartLegend
            mode={chartMode}
            showPv={showPv}
            showNetGrid={showNetGrid}
            showTou={showTou}
            highlightVesselName={highlightVessel?.name}
          />

          <div className="pt-2 border-t border-slate-100">
            <RiskRibbon points={result.points} domain={domain} />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="text-xs font-bold text-slate-700" style={{ paddingLeft: 48 }}>
              {t("Berth schedule (vessel calls)", "Lịch cầu bến (lượt tàu)")}
            </div>
            <BerthGantt
              vessels={result.scenario.vessels}
              baseVessels={BASE_VESSELS}
              domain={domain}
              highlightId={hoverVesselId}
              onHover={setHoverVesselId}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
            <Lock className="w-3 h-3" />
            {t(
              `Intervals before ${minuteLabel(LOCK_MINUTE)} are locked with their metered values for audit · now ${minuteLabel(NOW_MINUTE)}`,
              `Các chu kỳ trước ${minuteLabel(LOCK_MINUTE)} đã khóa cùng số thực đo để phục vụ kiểm toán · hiện tại ${minuteLabel(NOW_MINUTE)}`
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-4">
          <WhatIfPanel
            value={whatIf}
            onChange={setWhatIf}
            onReset={() => setWhatIf(DEFAULT_WHAT_IF)}
            triggers={triggers}
            base={baseResult}
            current={result}
          />
        </div>
      </div>

      {/* ================================================================== */}
      {/* 4. SEARCH & FILTER BAR */}
      {/* ================================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t(
              "Search by hour (14:00), ship name (ONE APUS, SPIRIT OF MUMBAI), berth...",
              "Tìm kiếm theo khung giờ (14:00), tên tàu (ONE APUS, SPIRIT OF MUMBAI), cầu bến..."
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg mr-2">
            {([
              { id: "CARDS", icon: LayoutGrid, label: t("Cards", "Thẻ") },
              { id: "TABLE", icon: List, label: t("Table", "Bảng") },
            ] as const).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setWindowView(v.id)}
                aria-pressed={windowView === v.id}
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  windowView === v.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            ))}
          </div>
          <span className="text-slate-500 font-bold text-xs mr-1">{t("Filter:", "Bộ lọc:")}</span>
          {([
            { id: "ALL", label: t(`All Time Windows (${windows.length})`, `Tất cả Khung giờ (${windows.length})`) },
            { id: "ALERTS", label: t(`Overload & Warnings (>${limitKw})`, `Quá tải & Cảnh báo (>${limitKw})`) },
            { id: "HIGH_SOLAR", label: t("High Solar Hours", "Giờ Điện mặt trời cao") },
            { id: "OFF_PEAK", label: t("Off-Peak Rate Hours", "Giờ Thấp điểm TOU") }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 5. TIME WINDOW CARDS */}
      {/* ================================================================== */}
      {windowView === "TABLE" ? (
        <WindowTable
          windows={filteredWindows}
          selectedId={zoomedWindowId}
          onRowClick={(w) => zoomToWindow(w, true)}
          renderTou={(w) => <TouBadge band={w.touBand} />}
          renderStatus={(w) => <StatusBadge status={w.status} />}
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredWindows.map((win) => {
          const isOverload = win.status === "OVERLOAD";
          const isAlert = isOverload || win.status === "WARNING";
          return (
            <div
              key={win.id}
              className={`rounded-2xl p-5 border shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                isAlert ? "bg-amber-50/40 border-2 border-amber-400" : "bg-white border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="border-b border-slate-200/70 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <span>{berthLabel(win)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-brand">
                        {win.stsCranes} {t("STS cranes", "cẩu STS")}
                      </span>
                    </div>
                    <StatusBadge status={win.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => zoomToWindow(win, true)}
                      className="font-black text-slate-900 text-base hover:text-brand cursor-pointer"
                      title={t("Zoom chart to this window", "Phóng biểu đồ tới khung giờ này")}
                    >
                      {win.timeWindow}
                    </button>
                    <TouBadge band={win.touBand} />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold break-words leading-snug" title={vesselLabel(win)}>
                    {vesselLabel(win)}
                  </div>
                </div>

                <div className={`my-3 p-3 rounded-xl border ${isAlert ? "bg-amber-100/70 border-amber-300" : "bg-slate-50 border-slate-200/80"}`}>
                  <div className="text-xs font-bold text-slate-500 mb-1">
                    {t(`Peak interval ${win.peakTime}`, `Chu kỳ đỉnh ${win.peakTime}`)}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-600">{t("Load P50:", "Phụ tải P50:")}</span>
                    <strong className={`text-lg font-black tabular-nums ${isAlert ? "text-amber-900" : "text-slate-900"}`}>
                      {kw(win.p50Kw)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                    <span>{t("P10–P90 range:", "Dải P10–P90:")}</span>
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {num(win.p10Kw)} – {kw(win.p90Kw)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Solar PV offset:", "Bù trừ điện mặt trời:")}</span>
                    <strong className="text-emerald-700 tabular-nums">{win.pvKw > 0 ? `−${kw(win.pvKw)}` : kw(0)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Net grid import:", "Điện lưới thuần:")}</span>
                    <strong className={`tabular-nums ${isOverload ? "text-red-700" : "text-brand"}`}>{kw(win.netGridKw)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Of substation limit:", "So với ngưỡng trạm:")}</span>
                    <strong className={`tabular-nums ${isOverload ? "text-red-700" : "text-slate-800"}`}>
                      {pct((win.netGridKw / SUBSTATION_LIMIT_KW) * 100)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Max exceedance prob.:", "Xác suất vượt cao nhất:")}</span>
                    <strong className={`tabular-nums ${isAlert ? "text-orange-700" : "text-slate-800"}`}>
                      {pct(win.maxPPeak * 100, 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Reefer containers:", "Container lạnh:")}</span>
                    <strong className="text-slate-800 tabular-nums">
                      {num(win.reeferPlugs)} {t("plugs", "ổ cắm")}
                    </strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100 line-clamp-2" title={t(win.summary.en, win.summary.vn)}>
                  {t(win.summary.en, win.summary.vn)}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenFeederDrawer(win)}
                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Gauge className="w-3.5 h-3.5 text-brand" />
                    <span>{t("6-Line Detail", "Chi Tiết 6 Lộ")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenForecastReport(win)}
                    className="py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t("24h Report", "Báo Cáo 24h")}</span>
                  </button>
                </div>
                {isAlert && onSendToPeakShaving && (
                  <button
                    type="button"
                    onClick={() => handleSendToM3(win)}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t("Send to Peak Shaving (M-3)", "Gửi sang Cắt Đỉnh (M-3)")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* ================================================================== */}
      {/* 6. MODEL HEALTH (C1) & RE-FORECAST LOG (C2) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-sm">{t("Forecast model", "Mô hình dự báo")}</h2>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs self-start">
            {([
              { id: "HEALTH", icon: Activity, label: t("Model health", "Sức khỏe mô hình") },
              { id: "LOG", icon: History, label: t("Re-forecast log", "Nhật ký tái dự báo") },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAnalyticsTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  analyticsTab === tab.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {analyticsTab === "HEALTH" ? <ModelHealthPanel /> : <ReforecastLog />}
      </div>

      {/* ================================================================== */}
      {/* DRAWER: 6-LINE BREAKDOWN (B5) */}
      {/* ================================================================== */}
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

      {/* ================================================================== */}
      {/* POPUP: 24-HOUR POWER FORECAST REPORT */}
      {/* ================================================================== */}
      {showForecastReportModal && liveSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm">
                  {t("24-Hour Port Power Forecast Report", "Báo Cáo Dự Báo Công Suất Phụ Tải Cảng 24 Giờ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t("Print", "In")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowForecastReportModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-xs max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
                <div>
                  <div className="text-xl font-black text-brand tracking-tight">
                    {t("SAIGON NEWPORT CORPORATION (SNP)", "TỔNG CÔNG TY TÂN CẢNG SÀI GÒN (SNP)")}
                  </div>
                  <div className="text-slate-600 text-xs font-semibold mt-0.5">
                    {t("Cat Lai Terminal · 24-Hour Power Demand & Overload Warning Report", "Cảng Tân Cảng Cát Lái · Báo Cáo Dự Báo Phụ Tải 24 Giờ & Cảnh Báo Quá Tải")}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {t(
                      `Main 110/22kV Substation · Overload threshold (net grid import): ${limitKw}`,
                      `Trạm Biến Áp 110/22kV Cát Lái · Ngưỡng cảnh báo (điện lưới thuần): ${limitKw}`
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-slate-900">
                    {t("VERSION", "PHIÊN BẢN")} #{FORECAST_VERSION}
                  </div>
                  <div className="text-slate-500 font-sans">
                    {t(FORECAST_DATE.en, FORECAST_DATE.vn)} · {t("Selected", "Khung chọn")}: {liveSelected.timeWindow}
                  </div>
                  <div className="text-emerald-700 font-bold text-xs mt-0.5">
                    RMSE {kw(MODEL_METRICS.rmseKw, 1)} · MAPE {pct(MODEL_METRICS.mapePct, 2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-xs font-bold">{t("Time Window", "Khung Giờ")}</span>
                  <strong className="text-slate-900 text-sm font-black">{liveSelected.timeWindow}</strong>
                  <div className="mt-0.5"><TouBadge band={liveSelected.touBand} /></div>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">{t("Load P50", "Phụ Tải P50")}</span>
                  <strong className="text-brand text-sm font-black">{kw(liveSelected.p50Kw)}</strong>
                  <span className="text-xs text-slate-500 block">P10–P90: {num(liveSelected.p10Kw)} – {kw(liveSelected.p90Kw)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">{t("Solar / Net Grid", "Điện Mặt Trời / Lưới Thuần")}</span>
                  <strong className="text-emerald-700 text-sm font-black">−{kw(liveSelected.pvKw)}</strong>
                  <span className="text-xs text-slate-700 block">{t("Grid", "Lưới")}: {kw(liveSelected.netGridKw)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">{t("Substation Status", "Trạng Thái Trạm")}</span>
                  <div className="mt-0.5"><StatusBadge status={liveSelected.status} /></div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {pct((liveSelected.netGridKw / SUBSTATION_LIMIT_KW) * 100)} {t(`of ${limitKw}`, `so với ${limitKw}`)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-extrabold text-slate-900 text-xs">
                  {t("Complete 24-Hour Schedule & Power Forecast (peak interval per window)", "Bảng Tổng Hợp Lịch Tàu & Dự Báo Phụ Tải 24 Giờ (chu kỳ đỉnh mỗi khung)")}
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">{t("Window", "Khung")}</th>
                        <th className="py-2 px-2.5">{t("Peak at", "Lúc đỉnh")}</th>
                        <th className="py-2 px-2.5 text-right">P50 (kW)</th>
                        <th className="py-2 px-2.5 text-right">P90 (kW)</th>
                        <th className="py-2 px-2.5 text-right">PV (kW)</th>
                        <th className="py-2 px-2.5 text-right">{t("Net Grid (kW)", "Lưới thuần (kW)")}</th>
                        <th className="py-2 px-2.5 text-center">TOU</th>
                        <th className="py-2 px-2.5 text-center">{t("Status", "Trạng Thái")}</th>
                        <th className="py-2 px-2.5">{t("Port Activity", "Hoạt Động Cảng")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {windows.map((row) => {
                        const isSelected = row.id === liveSelected.id;
                        const isWarn = row.status === "OVERLOAD" || row.status === "WARNING";
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedWindow(row)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50/90 font-semibold" : isWarn ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">{row.timeWindow}</td>
                            <td className="py-2 px-2.5 text-slate-600">{row.peakTime}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-brand tabular-nums">{num(row.p50Kw)}</td>
                            <td className="py-2 px-2.5 text-right text-slate-600 tabular-nums">{num(row.p90Kw)}</td>
                            <td className="py-2 px-2.5 text-right text-emerald-700 tabular-nums">{num(row.pvKw)}</td>
                            <td className="py-2 px-2.5 text-right font-bold tabular-nums">{num(row.netGridKw)}</td>
                            <td className="py-2 px-2.5 text-center"><TouBadge band={row.touBand} /></td>
                            <td className="py-2 px-2.5 text-center"><StatusBadge status={row.status} /></td>
                            <td className="py-2 px-2.5 text-slate-600 truncate max-w-[210px]" title={t(row.summary.en, row.summary.vn)}>
                              {t(row.summary.en, row.summary.vn)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForecastReportModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t("Close", "Đóng")}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t("Export CSV (96 intervals)", "Xuất CSV (96 chu kỳ)")}</span>
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-5 py-2 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand-hover transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("Export PDF (96 intervals)", "Xuất PDF (96 chu kỳ)")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* POPUP: FORECAST SETTINGS & ACCURACY HISTORY */}
      {/* ================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">
                  {t("Forecast Update Rules & Accuracy", "Quy Tắc Cập Nhật Dự Báo & Độ Chính Xác")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs">
                  {t("When Does the Forecast Automatically Update?", "Khi Nào Hệ Thống Tự Động Cập Nhật Dự Báo?")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      h: t("1. Day-ahead & rolling update", "1. Dự báo ngày tới & cập nhật cuốn chiếu"),
                      d: t(
                        "Issued at 22:00 for the next 24 h; rolls forward every 15 minutes, past intervals locked for audit.",
                        "Lập lúc 22:00 cho 24h tới; cập nhật cuốn chiếu mỗi 15 phút, phần quá khứ khóa để phục vụ kiểm toán."
                      ),
                    },
                    {
                      h: t("2. Vessel schedule events", "2. Sự kiện lịch tàu"),
                      d: t("Re-forecast when ETA deviates ≥ 30 min or the berth changes.", "Tái dự báo khi ETA lệch ≥ 30 phút hoặc đổi cầu bến."),
                    },
                    {
                      h: t("3. Volume & reefer change", "3. Biến động sản lượng & container lạnh"),
                      d: t("Re-forecast when throughput changes ≥ 15% or reefer count ≥ 10%.", "Tái dự báo khi sản lượng biến động ≥ 15% hoặc số container lạnh thay đổi ≥ 10%."),
                    },
                    {
                      h: t("4. STS stoppage & weekly retraining", "4. Cẩu STS dừng & tự huấn luyện hằng tuần"),
                      d: t(
                        "Re-forecast immediately when an STS crane stops; model retrains weekly, window extended 5 → 30 days.",
                        "Tái dự báo ngay khi cẩu STS dừng do sự cố; mô hình tự huấn luyện hằng tuần, cửa sổ mở rộng 5 → 30 ngày."
                      ),
                    },
                  ].map((r) => (
                    <div key={r.h} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">{r.h}</div>
                      <div className="text-slate-600 mt-0.5">{r.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs">{t("TOU presets", "Preset khung giá TOU")}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TOU_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresetId(p.id)}
                      className={`text-left p-3 rounded-xl border cursor-pointer ${
                        p.id === presetId ? "border-brand bg-blue-50/60" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold text-slate-900">
                        {t(p.name.en, p.name.vn)} {p.id === "CURRENT" && <span className="text-xs text-slate-500">({t("default", "mặc định")})</span>}
                      </div>
                      <div className="text-slate-600 mt-0.5">{t(p.note.en, p.note.vn)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs">
                  {t("Accuracy by Training Window (5 → 30 days)", "Độ Chính Xác Theo Cửa Sổ Huấn Luyện (5 → 30 ngày)")}
                </div>
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-sans">
                    <tr>
                      <th className="py-2 px-3">{t("Training Window", "Cửa Sổ Huấn Luyện")}</th>
                      <th className="py-2 px-3 text-right">{t("15-Min Samples", "Số Mẫu 15 Phút")}</th>
                      <th className="py-2 px-3 text-right">MAPE</th>
                      <th className="py-2 px-3 text-right">RMSE (kW)</th>
                      <th className="py-2 px-3 text-right">{t("P10–P90 Coverage", "Độ Phủ P10–P90")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ACCURACY_HISTORY.map((row) => (
                      <tr key={row.windowDays} className={row.windowDays === 30 ? "bg-emerald-50/70 font-bold" : ""}>
                        <td className="py-2 px-3">{row.windowDays} {t("days", "ngày")}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(row.samples)}</td>
                        <td className="py-2 px-3 text-right text-brand tabular-nums">{pct(row.mapePct, 2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(row.rmseKw, 1)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 tabular-nums">{pct(row.coveragePct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t("Close", "Đóng")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
