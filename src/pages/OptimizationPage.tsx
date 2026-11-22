import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { 
  ElectricityTariffTou, 
  BessSystemStatus, 
  PvSystemStatus 
} from "../types/gport";
import { 
  Zap, 
  Sliders, 
  TrendingDown, 
  Search, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Printer, 
  Download, 
  X
} from "lucide-react";
import { 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine 
} from "recharts";
import {
  AssetControlGroup,
  ControlTier,
  INITIAL_12_ASSET_GROUPS,
  ForecastHandoff
} from "../data/module3PeakShaving";
import { useFormat } from "../utils/format";

interface OptimizationPageProps {
  tariff: ElectricityTariffTou;
  bessStatus: BessSystemStatus;
  pvStatus: PvSystemStatus;
  /** Overload window handed over from Module 1 (Forecast) */
  forecastHandoff?: ForecastHandoff | null;
  onDismissForecastHandoff?: () => void;
  onBackToForecast?: () => void;
}

export type { AssetControlGroup, ControlTier };

// 24-Hour Before vs After Peak Shaving curve (Peak reduced from 8,458 kW -> 6,233 kW)
const PEAK_SHAVING_24H_SERIES = [
  { hour: "00:00", beforeKw: 2798, afterKw: 2980 },
  { hour: "02:00", beforeKw: 2694, afterKw: 3420 },
  { hour: "04:00", beforeKw: 2461, afterKw: 3190 },
  { hour: "06:00", beforeKw: 2424, afterKw: 2363 },
  { hour: "08:00", beforeKw: 3979, afterKw: 3109 },
  { hour: "10:00", beforeKw: 4850, afterKw: 3680 },
  { hour: "12:00", beforeKw: 4008, afterKw: 3450 },
  { hour: "14:00", beforeKw: 8458, afterKw: 6233 },
  { hour: "16:00", beforeKw: 8137, afterKw: 6180 },
  { hour: "18:00", beforeKw: 6678, afterKw: 5940 },
  { hour: "20:00", beforeKw: 6160, afterKw: 5890 },
  { hour: "22:00", beforeKw: 4555, afterKw: 5120 }
];

export const OptimizationPage: React.FC<OptimizationPageProps> = ({
  forecastHandoff,
  onDismissForecastHandoff,
  onBackToForecast,
}) => {
  const { t } = useLanguage();
  const { kw, pct } = useFormat();
  const [assetGroups, setAssetGroups] = useState<AssetControlGroup[]>(INITIAL_12_ASSET_GROUPS);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"ALL" | ControlTier>("ALL");

  // Clean Popups
  const [selectedAsset, setSelectedAsset] = useState<AssetControlGroup | null>(null);
  const [showLoadSettingsModal, setShowLoadSettingsModal] = useState(false);
  const [showSavingsReportModal, setShowSavingsReportModal] = useState(false);
  const [showSafetyRulesModal, setShowSafetyRulesModal] = useState(false);

  const filteredAssets = assetGroups.filter((ast) => {
    const matchesSearch =
      ast.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ast.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ast.feeder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ast.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ast.controlLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === "ALL" || ast.controlTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleOpenLoadSettings = (ast: AssetControlGroup) => {
    setSelectedAsset(ast);
    setShowLoadSettingsModal(true);
  };

  const handleOpenSavingsReport = (ast: AssetControlGroup) => {
    setSelectedAsset(ast);
    setShowSavingsReportModal(true);
  };

  const handleToggleApproval = (assetId: string) => {
    setAssetGroups((prev) =>
      prev.map((a) => {
        if (a.id !== assetId || a.controlTier !== "OPERATOR_APPROVAL") return a;
        const nextStatus = a.operatorStatus === "APPROVED" ? "PENDING_REVIEW" : "APPROVED";
        return { ...a, operatorStatus: nextStatus };
      })
    );
    if (selectedAsset && selectedAsset.id === assetId) {
      setSelectedAsset((prev) =>
        prev
          ? {
              ...prev,
              operatorStatus: prev.operatorStatus === "APPROVED" ? "PENDING_REVIEW" : "APPROVED"
            }
          : null
      );
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // Safe fallback in sandboxed frames
    }
  };

  const approvedCount = assetGroups.filter((a) => a.controlTier === "OPERATOR_APPROVAL" && a.operatorStatus === "APPROVED").length;
  const totalApprovalRequired = assetGroups.filter((a) => a.controlTier === "OPERATOR_APPROVAL").length;

  return (
    <div className="space-y-6 pb-12">
      {forecastHandoff && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-black text-amber-900 text-sm">
              {t(
                `Received from Forecast (M-1): window ${forecastHandoff.timeWindow}`,
                `Nhận từ Dự báo (M-1): khung ${forecastHandoff.timeWindow}`
              )}
            </div>
            <div className="text-amber-900">
              {t(
                `Net grid peak ${kw(forecastHandoff.netGridKw)} at ${forecastHandoff.peakTime} · max exceedance probability ${pct(forecastHandoff.maxPPeakPct, 0)}`,
                `Đỉnh điện lưới ${kw(forecastHandoff.netGridKw)} lúc ${forecastHandoff.peakTime} · xác suất vượt cao nhất ${pct(forecastHandoff.maxPPeakPct, 0)}`
              )}
            </div>
            <div className="text-emerald-800 font-semibold">
              {t(
                `Dispatching the ${forecastHandoff.estimate.groupsUsed} flexible equipment groups below: day peak ${kw(forecastHandoff.estimate.peakBeforeKw)} → ${kw(forecastHandoff.estimate.peakAfterKw)} (−${pct(forecastHandoff.estimate.reductionPct)})`,
                `Điều độ ${forecastHandoff.estimate.groupsUsed} nhóm thiết bị linh hoạt bên dưới: đỉnh ngày ${kw(forecastHandoff.estimate.peakBeforeKw)} → ${kw(forecastHandoff.estimate.peakAfterKw)} (−${pct(forecastHandoff.estimate.reductionPct)})`
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
      {/* ================================================================== */}
      {/* 1. CLEAN HEADER BAR */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">{t("Peak Shaving & Smart Load Control", "Cắt Đỉnh Phụ Tải & Điều Khiển Phụ Tải Thông Minh")}</span>
            <span aria-hidden="true">·</span>
            <span>{t("12 Equipment Groups", "12 Nhóm Thiết Bị Cảng")}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-bold">{t("Peak Reduced by 2,225 kW (-26.3%)", "Giảm Đỉnh 2,225 kW (-26.3%)")}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("Peak Power Shaving & Equipment Load Control", "Cắt Đỉnh Phụ Tải & Điều Khiển Thiết Bị Cảng")}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowSafetyRulesModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#004B91]" />
            <span>{t("Safety Rules", "Quy Tắc An Toàn")}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSavingsReport(assetGroups[0])}
            className="px-4 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t("Daily Savings Report", "Báo Cáo Tiết Kiệm Ngày")}</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. TOP 4 HIGHLIGHTED KPI CARDS */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Highlighted Peak Reduction Card */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border-2 border-emerald-300 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-900 text-[11px] font-bold mb-1">
            <span>{t("Peak Power Reduced", "Công Suất Đỉnh Đã Cắt Giảm")}</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono tabular-nums">
            -2,225 <span className="text-xs text-emerald-700 font-sans font-bold">kW (-26.3%)</span>
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-0.5 font-mono">
            8,458 kW → 6,233 kW {t("at 14:00", "lúc 14:00")}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Daily Electricity Cost Saved", "Tiết Kiệm Chi Phí Điện Ngày")}</span>
            <Zap className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            37.66M <span className="text-xs text-slate-500 font-sans font-semibold">{t("VND / Day", "VNĐ / Ngày")}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            {t("+25.59M VND Peak Penalty Avoided", "+25.59 Tr VNĐ Tránh Phạt Vượt Đỉnh")}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Operator Approvals", "Phê Duyệt Vận Hành Ca")}</span>
            <Sliders className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {approvedCount}/{totalApprovalRequired} <span className="text-xs text-slate-500 font-sans font-semibold">{t("Approved", "Đã Duyệt")}</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
            {totalApprovalRequired - approvedCount > 0
              ? `${totalApprovalRequired - approvedCount} ${t("group waiting for approval", "nhóm thiết bị chờ phê duyệt")}`
              : t("All flexible loads approved", "Đã phê duyệt toàn bộ tải linh hoạt")}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>{t("Protected Critical Equipment", "Thiết Bị Trọng Yếu Được Bảo Vệ")}</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono tabular-nums">
            6 <span className="text-xs text-slate-500 font-sans font-semibold">{t("Groups Locked", "Nhóm Khóa Bảo Vệ")}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {t("Cranes & Shore Power at 100% power", "Cẩu STS & Điện Bờ OPS duy trì 100%")}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. CLEAN BEFORE VS AFTER PEAK SHAVING CHART */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              {t("24-Hour Substation Power: Before vs. After Peak Shaving", "Đường Cong Công Suất Trạm 24 Giờ: Trước & Sau Khi Cắt Đỉnh")}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{t("Without Control: 8,458 kW Peak", "Chưa Điều Khiển: Đỉnh 8,458 kW")}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">{t("With Regen & Load Control: 6,233 kW Peak", "Sau Thu Hồi Động Năng & Điều Tải: Đỉnh 6,233 kW")}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
            <span className="text-slate-500 font-mono">● {t("Before Control (8,458 kW)", "Trước Điều Khiển (8,458 kW)")}</span>
            <span className="text-[#004B91] font-mono">● {t("After Control (6,233 kW)", "Sau Điều Khiển (6,233 kW)")}</span>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={PEAK_SHAVING_24H_SERIES} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" domain={[0, 9200]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "0.75rem", color: "#fff", fontSize: "11px" }}
                formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} kW`, name]}
              />
              <Area
                type="monotone"
                dataKey="beforeKw"
                name={t("Power Before Control", "Công Suất Trước Điều Khiển")}
                fill="#CBD5E1"
                fillOpacity={0.25}
                stroke="#64748B"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="afterKw"
                name={t("Power After Control", "Công Suất Sau Điều Khiển")}
                stroke="#004B91"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#004B91" }}
              />
              <ReferenceLine
                y={6500}
                stroke="#16A34A"
                strokeDasharray="5 5"
                strokeWidth={1.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 4. SEARCH & FILTER BAR */}
      {/* ================================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("Search equipment by name (Crane Regen, Reefer, Cranes), line (F-01..F-06)...", "Tìm thiết bị theo tên (Thu hồi động năng, Reefer, Cẩu), lộ (F-01..F-06)...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] mr-1">{t("Control Mode:", "Chế Độ Điều Khiển:")}</span>
          {([
            { id: "ALL", label: t("All Equipment (12)", "Tất Cả Thiết Bị (12)") },
            { id: "DIRECT_CONTROL", label: t("Auto Regen & Solar (2)", "Tự Động Regen & Solar (2)") },
            { id: "OPERATOR_APPROVAL", label: t("Needs Operator Approval (4)", "Cần Phê Duyệt Ca (4)") },
            { id: "MUST_RUN", label: t("Protected / Locked (6)", "Khóa Bảo Vệ 100% (6)") }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTierFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tierFilter === tab.id
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
      {/* 5. 12 EQUIPMENT CARDS GRID (HIGHLIGHTING POWER SAVED & APPROVALS) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAssets.map((ast) => {
          const isPending = ast.operatorStatus === "PENDING_REVIEW";
          const hasSavings = ast.powerSavedKw > 0;
          return (
            <div
              key={ast.id}
              className={`rounded-2xl p-5 border shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                isPending
                  ? "bg-amber-50/40 border-2 border-amber-400"
                  : hasSavings
                  ? "bg-white border-emerald-300/90 hover:border-emerald-400"
                  : "bg-white border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <span className="text-[#004B91] font-mono">{ast.feeder}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ast.zone}</span>
                    </div>
                    <h3 className="font-black text-slate-900 text-sm mt-0.5 line-clamp-1" title={ast.name}>
                      {ast.name}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium">
                      {ast.controlLabel}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                      ast.operatorStatus === "AUTO_ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : ast.operatorStatus === "APPROVED"
                        ? "bg-blue-100 text-[#004B91]"
                        : ast.operatorStatus === "PENDING_REVIEW"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {ast.operatorStatus === "AUTO_ACTIVE"
                      ? t("Auto Active", "Tự Động")
                      : ast.operatorStatus === "APPROVED"
                      ? t("Approved", "Đã Duyệt")
                      : ast.operatorStatus === "PENDING_REVIEW"
                      ? t("Needs Approval", "Chờ Duyệt")
                      : t("Protected", "Bảo Vệ")}
                  </span>
                </div>

                {/* HIGHLIGHTED POWER SAVED BOX */}
                <div className={`my-3 p-3 rounded-xl border ${
                  hasSavings ? "bg-emerald-50/70 border-emerald-200" : "bg-slate-50 border-slate-200/80"
                }`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-slate-600">{t("Peak Power Saved:", "Công Suất Đỉnh Đã Giảm:")}</span>
                    <strong className={`text-lg font-black font-mono tabular-nums ${
                      hasSavings ? "text-emerald-700" : "text-slate-600"
                    }`}>
                      {hasSavings ? `-${ast.powerSavedKw.toLocaleString()} kW` : t("0 kW (Locked)", "0 kW (Khóa)")}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{t("Current Peak Load:", "Tải Đỉnh Hiện Tại:")}</span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">
                      {ast.currentLoadKw.toLocaleString()} kW
                    </span>
                  </div>
                </div>

                {/* Operational Parameters */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Max Equipment Rating:", "Công Suất Định Mức:")}</span>
                    <strong className="text-slate-900 font-mono tabular-nums">
                      {ast.pMaxKw.toLocaleString()} kW
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">{t("Allowed Adjustment:", "Biên Độ Điều Chỉnh:")}</span>
                    <strong className="text-slate-800 font-mono tabular-nums">
                      {ast.maxReductionPercent > 0 ? `${t("Up to", "Tối đa")} ${ast.maxReductionPercent}%` : t("0% (Must-Run)", "0% (Cố Định)")}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-100 line-clamp-2">
                  {ast.currentActionSummary}
                </p>
              </div>

              {/* Clear, Self-Explanatory Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenLoadSettings(ast)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#004B91]" />
                  <span>{t("Load Settings", "Cấu Hình Tải")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSavingsReport(ast)}
                  className="py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t("Savings Report", "Báo Cáo Tiết Kiệm")}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* POPUP 1: LOAD SETTINGS & OPERATOR APPROVAL MODAL */}
      {/* ================================================================== */}
      {showLoadSettingsModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">
                  {t("Equipment Load Settings", "Cấu Hình Điều Khiển Phụ Tải")} — {selectedAsset.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLoadSettingsModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              {/* Equipment Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-[11px] font-bold text-[#004B91]">
                    {selectedAsset.feeder} · {selectedAsset.zone} · {selectedAsset.controlLabel}
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedAsset.name}</h3>
                </div>
                <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                  {t("Allowed Adjustment", "Biên Độ Cho Phép")}: {selectedAsset.maxReductionPercent}%
                </div>
              </div>

              {/* 4 Key Operational Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-bold">{t("Max Capacity", "Công Suất ĐM")}</span>
                  <strong className="text-slate-900 text-sm font-black">{selectedAsset.pMaxKw.toLocaleString()} kW</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-bold">{t("Before Control", "Trước Điều Khiển")}</span>
                  <strong className="text-slate-700 text-sm font-black">{selectedAsset.unoptimizedPeakKw.toLocaleString()} kW</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-bold">{t("Current Power", "Tải Hiện Tại")}</span>
                  <strong className="text-[#004B91] text-sm font-black">{selectedAsset.currentLoadKw.toLocaleString()} kW</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-bold">{t("Power Saved", "Công Suất Giảm")}</span>
                  <strong className="text-emerald-700 text-sm font-black">
                    {selectedAsset.powerSavedKw > 0 ? `-${selectedAsset.powerSavedKw} kW` : t("0 kW (Protected)", "0 kW (Bảo Vệ)")}
                  </strong>
                </div>
              </div>

              {/* Clear Operational Safety Limits */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    {t("How Power Saving Works & Safety Limits", "Cơ Chế Tiết Kiệm Công Suất & Giới Hạn An Toàn")}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedAsset.safetyConstraintSpec}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    {t("Automatic Backup Rule", "Quy Tắc Phục Hồi Dự Phòng Tự Động")}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedAsset.fallbackRule}</p>
                </div>
              </div>

              {/* Shift Operator Approval Control */}
              <div className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div>
                  <div className="font-bold text-slate-900">{t("Shift Operator Approval", "Phê Duyệt Của Trưởng Ca Vận Hành")}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {selectedAsset.controlTier === "OPERATOR_APPROVAL"
                      ? t("Flexible equipment requires operator approval before reducing power during peak hours.", "Thiết bị tải linh hoạt cần phê duyệt của Trưởng ca trước khi giảm tải giờ cao điểm.")
                      : selectedAsset.controlTier === "DIRECT_CONTROL"
                      ? t("Runs automatically within safe crane regen busbar and solar inverter limits.", "Vận hành tự động trong giới hạn an toàn của thanh cái thu hồi động năng cẩu và biến tần Solar.")
                      : t("Protected equipment: locked at 100% power to protect ship schedules and port safety.", "Thiết bị trọng yếu: khóa cứng ở 100% công suất nhằm đảm bảo tiến độ giải phóng tàu và an toàn cảng.")}
                  </div>
                </div>

                {selectedAsset.controlTier === "OPERATOR_APPROVAL" ? (
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(selectedAsset.id)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedAsset.operatorStatus === "APPROVED"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }`}
                  >
                    {selectedAsset.operatorStatus === "APPROVED"
                      ? t("Approved (Click to Pause)", "Đã Duyệt (Bấm Để Tạm Dừng)")
                      : t("Approve Power Saving", "Phê Duyệt Giảm Tải")}
                  </button>
                ) : (
                  <span className="font-mono font-bold text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
                    {selectedAsset.controlTier === "MUST_RUN" ? t("PROTECTED (100% POWER)", "KHÓA BẢO VỆ (100% TẢI)") : t("AUTOMATIC CONTROL", "ĐIỀU KHIỂN TỰ ĐỘNG")}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoadSettingsModal(false);
                    setShowSavingsReportModal(true);
                  }}
                  className="px-4 py-2 bg-[#004B91] text-white rounded-lg font-bold hover:bg-[#00386E] transition-colors cursor-pointer"
                >
                  {t("View Daily Savings Report", "Xem Báo Cáo Tiết Kiệm Ngày")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoadSettingsModal(false)}
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
      {/* POPUP 2: DAILY PEAK SHAVING & COST SAVINGS REPORT */}
      {/* ================================================================== */}
      {showSavingsReportModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#004B91] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm">
                  {t("Daily Peak Power & Cost Savings Report", "Báo Cáo Cắt Đỉnh Công Suất & Tiết Kiệm Chi Phí Điện Hàng Ngày")}
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
                  onClick={() => setShowSavingsReportModal(false)}
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
                    {t("Cat Lai Terminal · Daily Peak Power Shaving & Electricity Cost Savings Report", "Cảng Tân Cảng Cát Lái · Báo Cáo Cắt Đỉnh Phụ Tải & Tiết Kiệm Chi Phí Điện Ngày")}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {t("Main 110/22kV Substation · All 12 Equipment Groups", "Trạm Biến Áp 110/22kV Cát Lái · Tổng Hợp 12 Nhóm Thiết Bị")}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-base font-black text-slate-900">
                    SAVINGS-2026-0928
                  </div>
                  <div className="text-slate-500 font-sans">
                    {t("Peak Window", "Khung Cao Điểm")}: 14:00 – 16:30
                  </div>
                  <div className="text-emerald-700 font-bold text-[11px] mt-0.5">
                    {t("PEAK REDUCED: -2,225.4 kW (-26.3%)", "GIẢM ĐỈNH: -2,225.4 kW (-26.3%)")}
                  </div>
                </div>
              </div>

              {/* Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Power Before Control", "Công Suất Trước Điều Khiển")}</span>
                  <strong className="text-slate-900 text-sm font-black font-mono">8,458.2 kW</strong>
                  <span className="text-[11px] text-slate-500 block">{t("Afternoon dual-ship peak", "Đỉnh phụ tải 2 tàu buổi chiều")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Power After Control", "Công Suất Sau Điều Khiển")}</span>
                  <strong className="text-[#004B91] text-sm font-black font-mono">6,232.8 kW</strong>
                  <span className="text-[11px] text-emerald-700 font-semibold block">{t("Saved: -2,225.4 kW (-26.3%)", "Đã giảm: -2,225.4 kW (-26.3%)")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Total Daily Cost Saved", "Tổng Chi Phí Tiết Kiệm Ngày")}</span>
                  <strong className="text-emerald-700 text-sm font-black font-mono">{t("37.66M VND / Day", "37.66 Tr VNĐ / Ngày")}</strong>
                  <span className="text-[11px] text-slate-500 block">{t("+25.59M VND Peak Penalty Avoided", "+25.59 Tr VNĐ Tránh Phạt Vượt Đỉnh")}</span>
                </div>
              </div>

              {/* Complete 12-Equipment Table */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  {t("Power Savings Breakdown by Equipment Group", "Bảng Phân Bổ Công Suất Tiết Kiệm Theo 12 Nhóm Thiết Bị")}
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">ID</th>
                        <th className="py-2 px-2.5">{t("Equipment Group", "Nhóm Thiết Bị")}</th>
                        <th className="py-2 px-2.5">{t("Line", "Lộ")}</th>
                        <th className="py-2 px-2.5">{t("Control Mode", "Chế Độ Điều Khiển")}</th>
                        <th className="py-2 px-2.5 text-right font-mono">{t("Max Rating", "Công Suất ĐM")}</th>
                        <th className="py-2 px-2.5 text-right font-mono">{t("Power Saved", "Công Suất Giảm")}</th>
                        <th className="py-2 px-2.5 text-right">{t("Status", "Trạng Thái")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assetGroups.map((row) => {
                        const isSelected = row.id === selectedAsset.id;
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedAsset(row)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50/90 font-semibold" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-2 px-2.5 font-mono font-bold text-[#004B91]">{row.id}</td>
                            <td className="py-2 px-2.5 text-slate-900">{row.name}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-600">{row.feeder}</td>
                            <td className="py-2 px-2.5 text-slate-600">{row.controlLabel}</td>
                            <td className="py-2 px-2.5 text-right font-mono tabular-nums">{row.pMaxKw.toLocaleString()} kW</td>
                            <td className={`py-2 px-2.5 text-right font-mono font-bold tabular-nums ${row.powerSavedKw > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                              {row.powerSavedKw > 0 ? `-${row.powerSavedKw} kW` : "0 kW"}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-[10px] font-bold">
                              {row.operatorStatus === "AUTO_ACTIVE"
                                ? t("AUTO", "TỰ ĐỘNG")
                                : row.operatorStatus === "APPROVED"
                                ? t("APPROVED", "ĐÃ DUYỆT")
                                : row.operatorStatus === "PENDING_REVIEW"
                                ? t("NEEDS APPROVAL", "CHỜ DUYỆT")
                                : t("PROTECTED", "BẢO VỆ")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 font-mono">
                      <tr>
                        <td colSpan={5} className="py-2.5 px-3 text-right font-sans">
                          {t("TOTAL PEAK POWER SAVED (14:00 – 16:30):", "TỔNG CÔNG SUẤT ĐỈNH CẮT GIẢM (14:00 – 16:30):")}
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-emerald-700 text-sm tabular-nums">
                          -2,225.4 kW
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-slate-900">
                          {t("100% SAFE", "100% AN TOÀN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSavingsReportModal(false)}
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
      {/* POPUP 3: SAFETY & CONTROL RULES MODAL */}
      {/* ================================================================== */}
      {showSafetyRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">
                  {t("Port Equipment Safety & Control Rules", "Quy Tắc An Toàn & Điều Khiển Phụ Tải Thiết Bị Cảng")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSafetyRulesModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-[#004B91]">{t("1. Automatic Control (Crane Regenerative Braking & Solar Panels)", "1. Điều Khiển Tự Động (Thu Hồi Động Năng Cẩu & Điện Mặt Trời Áp Mái)")}</div>
                  <p className="text-slate-600 mt-1">
                    {t(
                      "The 1.5 MW Crane Regenerative Braking busbar and 2,450 kWp Solar system automatically recover hoist lowering energy and supply clean solar power during afternoon peak hours within strict substation power quality limits (PF ≥ 0.98, THD ≤ 3.0%).",
                      "Hệ thống thanh cái Thu hồi động năng cẩu 1.5 MW và Điện mặt trời áp mái 2,450 kWp tự động thu hồi năng lượng hãm hạ hàng và hòa lưới nội bộ giờ cao điểm chiều theo chuẩn chất lượng điện năng (PF ≥ 0.98, THD ≤ 3.0%)."
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-amber-800">{t("2. Operator-Approved Flexible Loads (Reefers, Truck Chargers, Warehouse A/C)", "2. Phụ Tải Linh Hoạt Cần Trưởng Ca Phê Duyệt (Bãi Reefer, Trạm Sạc EV, Điều Hòa Kho)")}</div>
                  <p className="text-slate-600 mt-1">
                    {t(
                      "Reefer pre-cooling (max 45 mins, cargo temp within ±0.4 °C) and electric truck smart charging require Shift Operator approval. Operators can pause power reduction on any group with a single click.",
                      "Làm lạnh sớm bãi container lạnh (tối đa 45 phút, biên độ nhiệt độ ±0.4 °C) và điều chỉnh sạc xe đầu kéo EV yêu cầu phê duyệt của Trưởng ca. Trưởng ca có thể tạm dừng giảm tải bất cứ lúc nào chỉ với 1 cú nhấp chuột."
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{t("3. Protected Equipment (Quay Cranes, Shore Power, Fire Pumps, Safety Lights)", "3. Thiết Bị Khóa Bảo Vệ 100% (Cẩu Bờ STS, Điện Bờ OPS, Bơm PCCC, Đèn Pha An Toàn)")}</div>
                  <p className="text-slate-600 mt-1">
                    {t(
                      "Quay Cranes (S01–S05), Ship Shore Power (OPS), Yard Safety Floodlights, Seawater Fire Pumps, and IT Servers are hardware-locked at 100% power so ship unloading speed and worker safety are never affected.",
                      "Cẩu bờ STS (S01–S05), Điện bờ cho tàu (OPS), Đèn pha chiếu sáng bãi, Trạm bơm PCCC và Máy chủ điều hành TOS được khóa cứng ở 100% công suất để không bao giờ ảnh hưởng đến tiến độ làm hàng và an toàn lao động."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSafetyRulesModal(false)}
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
