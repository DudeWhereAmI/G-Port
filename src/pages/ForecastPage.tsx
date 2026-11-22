import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  ForecastInterval,
  TosVesselSchedule,
  PvSystemStatus,
  ElectricityTariffTou
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
  Layers,
  Settings
} from "lucide-react";
import {
  FORECAST_POINTS,
  FORECAST_WINDOWS,
  ForecastWindowRecord,
  MODULE1_KPIS,
  MODEL_METRICS,
  ACCURACY_HISTORY,
  SUBSTATION_LIMIT_KW,
  TouBand,
  WindowStatus
} from "../data/module1Forecast";
import { useFormat } from "../utils/format";
import { ForecastDemandChart, ForecastChartMode } from "../components/forecast/ForecastDemandChart";

interface ForecastPageProps {
  forecastData: ForecastInterval[];
  vessels: TosVesselSchedule[];
  tariff: ElectricityTariffTou;
  pvStatus: PvSystemStatus;
  focusedWindowId?: string | null;
  focusedWindowOpenReport?: boolean;
  onClearFocusedWindow?: () => void;
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

function useBadgeLabels() {
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

const TouBadge: React.FC<{ band: TouBand }> = ({ band }) => {
  const { t } = useLanguage();
  const labels = useBadgeLabels();
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${TOU_BADGE_STYLE[band]}`}
      title={t("Time-of-use tariff band", "Khung giá điện TOU")}
    >
      <span className="opacity-70">TOU</span>
      <span>{labels.tou(band)}</span>
    </span>
  );
};

const StatusBadge: React.FC<{ status: WindowStatus }> = ({ status }) => {
  const { t } = useLanguage();
  const labels = useBadgeLabels();
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${STATUS_BADGE_STYLE[status]}`}
      title={t("Substation status (net grid import)", "Trạng thái trạm (theo điện lưới thuần)")}
    >
      {labels.status(status)}
    </span>
  );
};

export const ForecastPage: React.FC<ForecastPageProps> = ({
  focusedWindowId,
  focusedWindowOpenReport,
  onClearFocusedWindow,
}) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ALERTS" | "HIGH_SOLAR" | "OFF_PEAK">("ALL");
  const [chartMode, setChartMode] = useState<ForecastChartMode>("DEMAND_RANGE");

  // Popups
  const [selectedWindow, setSelectedWindow] = useState<ForecastWindowRecord | null>(null);
  const [showPowerBreakdownModal, setShowPowerBreakdownModal] = useState(false);
  const [showForecastReportModal, setShowForecastReportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const kpis = MODULE1_KPIS;
  const limitKw = kw(SUBSTATION_LIMIT_KW);

  React.useEffect(() => {
    if (!focusedWindowId) return;
    const found =
      FORECAST_WINDOWS.find((w) => w.id === focusedWindowId) || kpis.peakWindow;
    setSelectedWindow(found);
    if (focusedWindowOpenReport) {
      setShowForecastReportModal(true);
      setShowPowerBreakdownModal(false);
    } else {
      setShowPowerBreakdownModal(true);
      setShowForecastReportModal(false);
    }
    onClearFocusedWindow?.();
  }, [focusedWindowId, focusedWindowOpenReport, onClearFocusedWindow, kpis.peakWindow]);

  const filteredWindows = FORECAST_WINDOWS.filter((w) => {
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

  const handleOpenPowerBreakdown = (record: ForecastWindowRecord) => {
    setSelectedWindow(record);
    setShowPowerBreakdownModal(true);
  };

  const handleOpenForecastReport = (record: ForecastWindowRecord) => {
    setSelectedWindow(record);
    setShowForecastReportModal(true);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // Safe fallback in sandboxed frames
    }
  };

  const berthLabel = (w: ForecastWindowRecord) => `${t("Berth", "Cầu bến")} ${w.berth}`;
  const vesselLabel = (w: ForecastWindowRecord) => w.vessels.join(" & ");
  const alertWindows = [...kpis.overloadWindows, ...kpis.warningWindows];

  return (
    <div className="space-y-6 pb-12">
      {/* ================================================================== */}
      {/* 1. HEADER BAR */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">
              {t("24-Hour Power Forecast", "Dự Báo Phụ Tải Điện 24 Giờ")}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t("96 intervals × 15 minutes", "96 chu kỳ × 15 phút")}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-bold">
              {t(`Substation limit: ${limitKw} (net grid)`, `Giới hạn trạm biến áp: ${limitKw} (điện lưới thuần)`)}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t(
              "Port Power Demand & Overload Warnings",
              "Dự Báo Phụ Tải Điện Cảng & Cảnh Báo Quá Tải Trạm"
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#004B91]" />
            <span>{t("Forecast Settings", "Cấu Hình Dự Báo")}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenForecastReport(kpis.peakWindow)}
            className="px-4 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t("Export 24h Forecast", "Báo Cáo Dự Báo 24h")}</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. KPI CARDS (all derived from module1Forecast data) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Peak Net Grid Demand", "Đỉnh Điện Lưới Thuần Dự Kiến")}</span>
            <TrendingUp className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {num(kpis.peakNetGrid.netGrid)} <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {t(
              `At ${kpis.peakNetGrid.label} · Load P50 ${kw(kpis.peakNetGrid.p50)} (P90 ${kw(kpis.peakNetGrid.p90)})`,
              `Lúc ${kpis.peakNetGrid.label} · Tải P50 ${kw(kpis.peakNetGrid.p50)} (P90 ${kw(kpis.peakNetGrid.p90)})`
            )}
          </div>
        </div>

        {/* Highlighted Warning Card */}
        <div className="bg-amber-50/70 p-4 rounded-xl border-2 border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between text-amber-900 text-[11px] font-bold mb-1">
            <span>{t(`Grid Overload Warnings (>${limitKw})`, `Cảnh Báo Vượt Ngưỡng Lưới (>${limitKw})`)}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800 font-mono tabular-nums">
            {alertWindows.length}{" "}
            <span className="text-xs text-amber-700 font-sans font-bold">
              {t("time windows", "khung giờ")}
            </span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold mt-0.5">
            {alertWindows.length === 0
              ? t("No window above the limit", "Không có khung giờ vượt ngưỡng")
              : alertWindows.map((w) => `${w.id} (${kw(w.netGridKw)})`).join(" & ")}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Peak Solar Generation", "Đỉnh Phát Điện Mặt Trời")}</span>
            <SunMedium className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums">
            {num(kpis.peakPv.pv)} <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {t(
              `At ${kpis.peakPv.label} · Net grid drops to ${kw(kpis.peakPv.netGrid)}`,
              `Lúc ${kpis.peakPv.label} · Điện lưới giảm còn ${kw(kpis.peakPv.netGrid)}`
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Forecast Accuracy (30-Day)", "Độ Chính Xác Dự Báo (30 Ngày)")}</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono tabular-nums">
            {pct(kpis.accuracyPct)}{" "}
            <span className="text-xs text-slate-500 font-sans font-semibold">
              {t("(1 − MAPE)", "(1 − MAPE)")}
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            RMSE {kw(MODEL_METRICS.rmseKw, 1)} · MAPE {pct(MODEL_METRICS.mapePct, 2)}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. 24-HOUR POWER DEMAND CHART (96 × 15 min) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              {t("24-Hour Power Demand Curve", "Đường Cong Dự Báo Phụ Tải Điện 24 Giờ")}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-0.5">
              <span>
                {t(
                  "Overload is assessed on net grid import (load − PV)",
                  "Cảnh báo quá tải tính trên điện lưới thuần (tải − PV)"
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t(
                  "Click any time card below to inspect power by line",
                  "Bấm vào từng khung giờ bên dưới để xem chi tiết công suất 6 lộ"
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartMode("DEMAND_RANGE")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === "DEMAND_RANGE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t("Load P50 & P10–P90 Range", "Phụ Tải P50 & Dải P10–P90")}
            </button>
            <button
              type="button"
              onClick={() => setChartMode("NET_VS_SOLAR")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === "NET_VS_SOLAR" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t("Net Grid vs. Solar Power", "Điện Lưới Thuần & Điện Mặt Trời")}
            </button>
          </div>
        </div>

        <ForecastDemandChart points={FORECAST_POINTS} mode={chartMode} />
      </div>

      {/* ================================================================== */}
      {/* 4. SEARCH & FILTER BAR */}
      {/* ================================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] mr-1">
            {t("Filter:", "Bộ lọc:")}
          </span>
          {([
            { id: "ALL", label: t(`All Time Windows (${FORECAST_WINDOWS.length})`, `Tất cả Khung giờ (${FORECAST_WINDOWS.length})`) },
            { id: "ALERTS", label: t(`Overload & Warnings (>${limitKw})`, `Quá tải & Cảnh báo (>${limitKw})`) },
            { id: "HIGH_SOLAR", label: t("High Solar Hours", "Giờ Điện mặt trời cao") },
            { id: "OFF_PEAK", label: t("Off-Peak Rate Hours", "Giờ Thấp điểm TOU") }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#004B91] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 5. TIME WINDOW CARDS GRID */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredWindows.map((win) => {
          const isOverload = win.status === "OVERLOAD";
          const isAlert = isOverload || win.status === "WARNING";
          return (
            <div
              key={win.id}
              className={`rounded-2xl p-5 border shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                isAlert
                  ? "bg-amber-50/40 border-2 border-amber-400"
                  : "bg-white border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="border-b border-slate-200/70 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <span>{berthLabel(win)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#004B91]">
                        {win.stsCranes} {t("STS cranes", "cẩu STS")}
                      </span>
                    </div>
                    <StatusBadge status={win.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <h3 className="font-black text-slate-900 text-base font-mono">
                      {win.timeWindow}
                    </h3>
                    <TouBadge band={win.touBand} />
                  </div>
                  <div
                    className="text-xs text-slate-600 font-semibold break-words leading-snug"
                    title={vesselLabel(win)}
                  >
                    {vesselLabel(win)}
                  </div>
                </div>

                {/* PRIMARY POWER METRIC (at the window's peak net-grid interval) */}
                <div className={`my-3 p-3 rounded-xl border ${
                  isAlert ? "bg-amber-100/70 border-amber-300" : "bg-slate-50 border-slate-200/80"
                }`}>
                  <div className="text-[10px] font-bold text-slate-500 mb-1">
                    {t(`Peak interval ${win.peakTime}`, `Chu kỳ đỉnh ${win.peakTime}`)}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      {t("Load P50:", "Phụ tải P50:")}
                    </span>
                    <strong className={`text-lg font-black font-mono tabular-nums ${
                      isAlert ? "text-amber-900" : "text-slate-900"
                    }`}>
                      {kw(win.p50Kw)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{t("P10–P90 range:", "Dải P10–P90:")}</span>
                    <span className="font-mono font-semibold text-slate-700 tabular-nums">
                      {num(win.p10Kw)} – {kw(win.p90Kw)}
                    </span>
                  </div>
                </div>

                {/* Secondary Operational Metrics */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Solar PV offset:", "Bù trừ điện mặt trời:")}</span>
                    <strong className="text-emerald-700 font-mono tabular-nums">
                      {win.pvKw > 0 ? `−${kw(win.pvKw)}` : kw(0)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Net grid import:", "Điện lưới thuần:")}</span>
                    <strong className={`font-mono tabular-nums ${isOverload ? "text-red-700" : "text-[#004B91]"}`}>
                      {kw(win.netGridKw)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Of substation limit:", "So với ngưỡng trạm:")}</span>
                    <strong className={`font-mono tabular-nums ${isOverload ? "text-red-700" : "text-slate-800"}`}>
                      {pct((win.netGridKw / SUBSTATION_LIMIT_KW) * 100)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Reefer containers:", "Container lạnh:")}</span>
                    <strong className="text-slate-800 font-mono tabular-nums">
                      {num(win.reeferPlugs)} {t("plugs", "ổ cắm")}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-100 line-clamp-2" title={t(win.summary.en, win.summary.vn)}>
                  {t(win.summary.en, win.summary.vn)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenPowerBreakdown(win)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#004B91]" />
                  <span>{t("6-Line Breakdown", "Chi Tiết 6 Lộ")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenForecastReport(win)}
                  className="py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t("24h Report", "Báo Cáo 24h")}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* POPUP 1: POWER BREAKDOWN BY SUBSTATION LINE */}
      {/* ================================================================== */}
      {showPowerBreakdownModal && selectedWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm">
                  {t("Power Breakdown by Line", "Phân Bổ Công Suất Theo 6 Lộ Trạm Biến Áp")} — {selectedWindow.timeWindow}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPowerBreakdownModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              {/* Operational Context */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Ships at Berth", "Tàu Cập Bến")}</span>
                  <strong className="text-slate-900 font-bold break-words">{vesselLabel(selectedWindow)}</strong>
                  <span className="text-[11px] text-slate-500 block">{berthLabel(selectedWindow)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Active Equipment", "Thiết Bị Vận Hành")}</span>
                  <strong className="text-slate-900 font-mono">{selectedWindow.stsCranes} {t("STS cranes", "cẩu STS")}</strong>
                  <span className="text-[11px] text-slate-500 block">{num(selectedWindow.reeferPlugs)} {t("reefers", "ổ reefer")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Weather", "Thời Tiết")}</span>
                  <strong className="text-slate-900 font-mono">{num(selectedWindow.tempAmbC, 1)} °C</strong>
                  <span className="text-[11px] text-slate-500 block">{t("Solar", "Điện mặt trời")}: {kw(selectedWindow.pvKw)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Tariff & Status", "Khung Giá & Trạng Thái")}</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <TouBadge band={selectedWindow.touBand} />
                    <StatusBadge status={selectedWindow.status} />
                  </div>
                </div>
              </div>

              {/* 6 Substation Feeders Breakdown Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  {t(
                    `Expected Power by Substation Line (F-01 to F-06) · Peak interval ${selectedWindow.peakTime}`,
                    `Công Suất Dự Báo Theo 6 Lộ (F-01 đến F-06) · Chu kỳ đỉnh ${selectedWindow.peakTime}`
                  )}
                </div>
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">{t("Line", "Lộ")}</th>
                      <th className="py-2 px-3">{t("Port Area & Equipment", "Khu Vực & Thiết Bị Cảng")}</th>
                      <th className="py-2 px-3 text-right font-mono">{t("Expected Power (kW)", "Công Suất Dự Báo (kW)")}</th>
                      <th className="py-2 px-3 text-right font-mono">{t("Share (%)", "Tỷ Trọng (%)")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {[
                      { id: "F-01", name: t("Quay Cranes (STS)", "Cẩu Bờ STS"), kw: selectedWindow.feeders.f01StsKw },
                      { id: "F-02", name: t("Yard e-RTG Cranes (12 units)", "Cẩu Khung Bãi e-RTG (12 cẩu)"), kw: selectedWindow.feeders.f02RtgKw },
                      { id: "F-03", name: t("Reefer Container Yard", "Bãi Container Lạnh"), kw: selectedWindow.feeders.f03ReeferKw },
                      { id: "F-04", name: t("Ship Shore Power (OPS)", "Điện Bờ Cho Tàu (OPS)"), kw: selectedWindow.feeders.f04OpsKw },
                      { id: "F-05", name: t("EV Tractor Fast-Charging Hub", "Trạm Sạc Nhanh Xe Đầu Kéo EV"), kw: selectedWindow.feeders.f05EvBessKw },
                      { id: "F-06", name: t("Warehouse HVAC, Lighting & Fire Pumps", "Kho CFS, Đèn Bãi & Trạm Bơm PCCC"), kw: selectedWindow.feeders.f06AuxKw }
                    ].map((f) => {
                      const share = (f.kw / selectedWindow.p50Kw) * 100;
                      return (
                        <tr key={f.id}>
                          <td className="py-2 px-3 font-bold text-[#004B91]">{f.id}</td>
                          <td className="py-2 px-3 font-sans text-slate-700">{f.name}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{kw(f.kw)}</td>
                          <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{pct(share)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 font-mono">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 font-sans text-right text-slate-700">
                        {t("Total Load P50 / Net Grid Import:", "Tổng Phụ Tải P50 / Điện Lưới Thuần:")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 tabular-nums">
                        {kw(selectedWindow.p50Kw)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#004B91] tabular-nums">
                        {t("Grid", "Lưới")}: {kw(selectedWindow.netGridKw)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPowerBreakdownModal(false);
                    setShowForecastReportModal(true);
                  }}
                  className="px-4 py-2 bg-[#004B91] text-white rounded-lg font-bold hover:bg-[#00386E] transition-colors cursor-pointer"
                >
                  {t("View Full 24h Forecast Report", "Xem Báo Cáo Dự Báo 24h")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPowerBreakdownModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {t("Close", "Đóng")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* POPUP 2: 24-HOUR POWER FORECAST REPORT */}
      {/* ================================================================== */}
      {showForecastReportModal && selectedWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#004B91] text-white px-6 py-4 flex items-center justify-between">
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
                  <span>{t("Print / Save PDF", "In / Lưu PDF")}</span>
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
              {/* Document Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="text-xl font-black text-[#004B91] tracking-tight">
                    {t("SAIGON NEWPORT CORPORATION (SNP)", "TỔNG CÔNG TY TÂN CẢNG SÀI GÒN (SNP)")}
                  </div>
                  <div className="text-slate-600 text-[11px] font-semibold mt-0.5">
                    {t("Cat Lai Terminal · 24-Hour Power Demand & Overload Warning Report", "Cảng Tân Cảng Cát Lái · Báo Cáo Dự Báo Phụ Tải 24 Giờ & Cảnh Báo Quá Tải")}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {t(
                      `Main 110/22kV Substation · Overload threshold (net grid import): ${limitKw}`,
                      `Trạm Biến Áp 110/22kV Cát Lái · Ngưỡng cảnh báo (điện lưới thuần): ${limitKw}`
                    )}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-base font-black text-slate-900">
                    {t("REPORT", "BÁO CÁO")} #{selectedWindow.id.replace(":", "")}
                  </div>
                  <div className="text-slate-500 font-sans">
                    {t("Selected Window", "Khung giờ chọn")}: {selectedWindow.timeWindow}
                  </div>
                  <div className="text-emerald-700 font-bold text-[11px] mt-0.5">
                    RMSE {kw(MODEL_METRICS.rmseKw, 1)} · MAPE {pct(MODEL_METRICS.mapePct, 2)}
                  </div>
                </div>
              </div>

              {/* Selected Window Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Time Window", "Khung Giờ")}</span>
                  <strong className="text-slate-900 text-sm font-black font-mono">{selectedWindow.timeWindow}</strong>
                  <div className="mt-0.5"><TouBadge band={selectedWindow.touBand} /></div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Load P50", "Phụ Tải P50")}</span>
                  <strong className="text-[#004B91] text-sm font-black font-mono">{kw(selectedWindow.p50Kw)}</strong>
                  <span className="text-[11px] text-slate-500 font-mono block">P10–P90: {num(selectedWindow.p10Kw)} – {kw(selectedWindow.p90Kw)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Solar / Net Grid", "Điện Mặt Trời / Lưới Thuần")}</span>
                  <strong className="text-emerald-700 text-sm font-black font-mono">−{kw(selectedWindow.pvKw)}</strong>
                  <span className="text-[11px] text-slate-700 font-mono block">{t("Grid", "Lưới")}: {kw(selectedWindow.netGridKw)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Substation Status", "Trạng Thái Trạm")}</span>
                  <div className="mt-0.5"><StatusBadge status={selectedWindow.status} /></div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {pct((selectedWindow.netGridKw / SUBSTATION_LIMIT_KW) * 100)} {t(`of ${limitKw}`, `so với ${limitKw}`)}
                  </span>
                </div>
              </div>

              {/* Full 24-Hour Table */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  {t("Complete 24-Hour Schedule & Power Forecast (peak interval per window)", "Bảng Tổng Hợp Lịch Tàu & Dự Báo Phụ Tải 24 Giờ (chu kỳ đỉnh mỗi khung)")}
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">{t("Window", "Khung")}</th>
                        <th className="py-2 px-2.5 font-mono">{t("Peak at", "Lúc đỉnh")}</th>
                        <th className="py-2 px-2.5 text-right font-mono">P50 (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">P90 (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">PV (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">{t("Net Grid (kW)", "Lưới thuần (kW)")}</th>
                        <th className="py-2 px-2.5 text-center">TOU</th>
                        <th className="py-2 px-2.5 text-center">{t("Status", "Trạng Thái")}</th>
                        <th className="py-2 px-2.5">{t("Port Activity", "Hoạt Động Cảng")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {FORECAST_WINDOWS.map((row) => {
                        const isSelected = row.id === selectedWindow.id;
                        const isWarn = row.status === "OVERLOAD" || row.status === "WARNING";
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedWindow(row)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50/90 font-semibold" : isWarn ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-2 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">{row.timeWindow}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-600">{row.peakTime}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-[#004B91] tabular-nums">{num(row.p50Kw)}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-600 tabular-nums">{num(row.p90Kw)}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-emerald-700 tabular-nums">{num(row.pvKw)}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums">{num(row.netGridKw)}</td>
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
                onClick={handlePrint}
                className="px-5 py-2 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("Download PDF Report", "Tải Báo Cáo PDF")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* POPUP 3: FORECAST SETTINGS & ACCURACY HISTORY */}
      {/* ================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">
                  {t("Forecast Update Rules & 30-Day Accuracy", "Quy Tắc Cập Nhật Dự Báo & Độ Chính Xác 30 Ngày")}
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
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  {t("When Does the Forecast Automatically Update?", "Khi Nào Hệ Thống Tự Động Cập Nhật Dự Báo?")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">{t("1. Ship Arrival / Departure Change", "1. Thay đổi giờ tàu cập / rời bến")}</div>
                    <div className="text-slate-600 mt-0.5">{t("Updates immediately if a ship arrives ≥ 30 minutes early/late or changes berth.", "Cập nhật ngay khi tàu đến sớm/trễ ≥ 30 phút hoặc đổi cầu bến.")}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">{t("2. Container & Reefer Volume Change", "2. Biến động sản lượng Container & Reefer")}</div>
                    <div className="text-slate-600 mt-0.5">{t("Updates if container moves change by ≥ 15% or plugged reefer containers shift by ≥ 10%.", "Cập nhật khi lượt cẩu thay đổi ≥ 15% hoặc số lượng container lạnh thay đổi ≥ 10%.")}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">{t("3. Regular 15-Minute Updates", "3. Chu kỳ cập nhật 15 phút")}</div>
                    <div className="text-slate-600 mt-0.5">{t("Day-ahead forecast is issued at 22:00; it then rolls forward every 15 minutes and past intervals are locked for audit.", "Dự báo ngày tới lập lúc 22:00; sau đó cập nhật cuốn chiếu mỗi 15 phút, phần quá khứ được khóa để phục vụ kiểm toán.")}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">{t("4. Crane Maintenance or Stoppage", "4. Bảo trì hoặc dừng cẩu STS")}</div>
                    <div className="text-slate-600 mt-0.5">{t("Recalculates power demand immediately if any Quay Crane stops for maintenance.", "Tính toán lại phụ tải tức thì nếu bất kỳ cẩu bờ STS nào tạm dừng bảo trì.")}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  {t("Accuracy by Training Window (5 → 30 days)", "Độ Chính Xác Theo Cửa Sổ Huấn Luyện (5 → 30 ngày)")}
                </div>
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden font-mono">
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
                        <td className="py-2 px-3 text-right text-[#004B91] tabular-nums">{pct(row.mapePct, 2)}</td>
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
