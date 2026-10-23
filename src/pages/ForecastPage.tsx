import React, { useState } from "react";
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
  CheckCircle2, 
  Zap, 
  Gauge, 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  Layers,
  RefreshCw
} from "lucide-react";
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine,
  Bar
} from "recharts";

interface ForecastPageProps {
  forecastData: ForecastInterval[];
  vessels: TosVesselSchedule[];
  tariff: ElectricityTariffTou;
  pvStatus: PvSystemStatus;
}

export interface ForecastWindowRecord {
  id: string;
  timeWindow: string;
  touBand: "OFF_PEAK" | "STANDARD" | "PEAK";
  status: "THRESHOLD_WARNING" | "SOLAR_OFFSET" | "NOMINAL";
  actualKw: number;
  p10Kw: number;
  p50Kw: number;
  p90Kw: number;
  pvKw: number;
  netKw: number;
  peakProbPercent: number;
  vesselCode: string;
  vesselName: string;
  berth: string;
  stsCranes: number;
  reeferPlugs: number;
  opsKw: number;
  tempAmbC: number;
  ghiWm2: number;
  tosContext: string;
  feeders: {
    f01StsKw: number;
    f02RtgKw: number;
    f03ReeferKw: number;
    f04OpsKw: number;
    f05EvBessKw: number;
    f06AuxKw: number;
  };
}

// Authentic 24-hour multi-quantile forecast ledger from G-PORT Report Table PL3.4c (Validation Date: 28/09/2026)
const REPORT_FORECAST_WINDOWS: ForecastWindowRecord[] = [
  {
    id: "FW-0000",
    timeWindow: "00:00",
    touBand: "OFF_PEAK",
    status: "NOMINAL",
    actualKw: 2798.0,
    p10Kw: 2587,
    p50Kw: 2766.6,
    p90Kw: 2987,
    pvKw: 0,
    netKw: 2767,
    peakProbPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "TAN CANG GLORY (104S)",
    berth: "Berth B1",
    stsCranes: 2,
    reeferPlugs: 185,
    opsKw: 480,
    tempAmbC: 26.4,
    ghiWm2: 0,
    tosContext: "UC-04 completing cargo operations (2 STS cranes active)",
    feeders: { f01StsKw: 840, f02RtgKw: 420, f03ReeferKw: 680, f04OpsKw: 480, f05EvBessKw: 180, f06AuxKw: 167 }
  },
  {
    id: "FW-0200",
    timeWindow: "02:00",
    touBand: "OFF_PEAK",
    status: "NOMINAL",
    actualKw: 2693.5,
    p10Kw: 2565,
    p50Kw: 2745.2,
    p90Kw: 2965,
    pvKw: 0,
    netKw: 2745,
    peakProbPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "TAN CANG GLORY (104S)",
    berth: "Berth B1",
    stsCranes: 2,
    reeferPlugs: 180,
    opsKw: 480,
    tempAmbC: 25.8,
    ghiWm2: 0,
    tosContext: "Off-peak TOU tariff window; scheduled BESS charging window",
    feeders: { f01StsKw: 760, f02RtgKw: 380, f03ReeferKw: 650, f04OpsKw: 480, f05EvBessKw: 315, f06AuxKw: 160 }
  },
  {
    id: "FW-0400",
    timeWindow: "04:00",
    touBand: "STANDARD",
    status: "NOMINAL",
    actualKw: 2460.8,
    p10Kw: 2310,
    p50Kw: 2489.5,
    p90Kw: 2710,
    pvKw: 0,
    netKw: 2490,
    peakProbPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "TAN CANG GLORY (104S)",
    berth: "Berth B1",
    stsCranes: 1,
    reeferPlugs: 175,
    opsKw: 320,
    tempAmbC: 25.5,
    ghiWm2: 0,
    tosContext: "UC-04 unberthing cast-off; morning shift handover",
    feeders: { f01StsKw: 520, f02RtgKw: 340, f03ReeferKw: 640, f04OpsKw: 320, f05EvBessKw: 490, f06AuxKw: 180 }
  },
  {
    id: "FW-0600",
    timeWindow: "06:00",
    touBand: "STANDARD",
    status: "NOMINAL",
    actualKw: 2424.1,
    p10Kw: 2235,
    p50Kw: 2415.4,
    p90Kw: 2635,
    pvKw: 52,
    netKw: 2363,
    peakProbPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI (056N)",
    berth: "Berth B2",
    stsCranes: 2,
    reeferPlugs: 240,
    opsKw: 620,
    tempAmbC: 26.8,
    ghiWm2: 85,
    tosContext: "UC-01 berths at B2; 6.6 kV shore power OPS synchronized",
    feeders: { f01StsKw: 680, f02RtgKw: 310, f03ReeferKw: 645, f04OpsKw: 620, f05EvBessKw: 0, f06AuxKw: 160 }
  },
  {
    id: "FW-0800",
    timeWindow: "08:00",
    touBand: "STANDARD",
    status: "SOLAR_OFFSET",
    actualKw: 3979.4,
    p10Kw: 3816,
    p50Kw: 3996.2,
    p90Kw: 4216,
    pvKw: 887,
    netKw: 3109,
    peakProbPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI (056N)",
    berth: "Berth B2",
    stsCranes: 4,
    reeferPlugs: 310,
    opsKw: 750,
    tempAmbC: 29.4,
    ghiWm2: 460,
    tosContext: "UC-01 operating 4 STS cranes; Reefer yard load ramp-up",
    feeders: { f01StsKw: 1680, f02RtgKw: 620, f03ReeferKw: 786, f04OpsKw: 750, f05EvBessKw: 0, f06AuxKw: 160 }
  },
  {
    id: "FW-1000",
    timeWindow: "10:00",
    touBand: "PEAK",
    status: "SOLAR_OFFSET",
    actualKw: 4199.7,
    p10Kw: 3965,
    p50Kw: 4144.5,
    p90Kw: 4365,
    pvKw: 1616,
    netKw: 2528,
    peakProbPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI (056N)",
    berth: "Berth B2",
    stsCranes: 4,
    reeferPlugs: 325,
    opsKw: 760,
    tempAmbC: 32.1,
    ghiWm2: 790,
    tosContext: "Morning peak TOU window; Solar PV offsets 1,616 kW load",
    feeders: { f01StsKw: 1740, f02RtgKw: 660, f03ReeferKw: 824, f04OpsKw: 760, f05EvBessKw: 0, f06AuxKw: 160 }
  },
  {
    id: "FW-1200",
    timeWindow: "12:00",
    touBand: "STANDARD",
    status: "SOLAR_OFFSET",
    actualKw: 4008.4,
    p10Kw: 3823,
    p50Kw: 4003.3,
    p90Kw: 4223,
    pvKw: 1880,
    netKw: 2124,
    peakProbPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI (056N)",
    berth: "Berth B2",
    stsCranes: 4,
    reeferPlugs: 330,
    opsKw: 750,
    tempAmbC: 33.8,
    ghiWm2: 920,
    tosContext: "Midday shift change; solar irradiance GHI reaches daily peak",
    feeders: { f01StsKw: 1580, f02RtgKw: 590, f03ReeferKw: 883, f04OpsKw: 750, f05EvBessKw: 40, f06AuxKw: 160 }
  },
  {
    id: "FW-1400",
    timeWindow: "14:00",
    touBand: "STANDARD",
    status: "THRESHOLD_WARNING",
    actualKw: 8144.4,
    p10Kw: 7971,
    p50Kw: 8151.0,
    p90Kw: 8371,
    pvKw: 1612,
    netKw: 6539,
    peakProbPercent: 2.1,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS (012W) & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 5,
    reeferPlugs: 465,
    opsKw: 1480,
    tempAmbC: 34.2,
    ghiWm2: 780,
    tosContext: "UC-02 berths B3; simultaneous 5 STS cranes & dual OPS surge",
    feeders: { f01StsKw: 3420, f02RtgKw: 1410, f03ReeferKw: 1461, f04OpsKw: 1480, f05EvBessKw: 200, f06AuxKw: 180 }
  },
  {
    id: "FW-1600",
    timeWindow: "16:00",
    touBand: "STANDARD",
    status: "THRESHOLD_WARNING",
    actualKw: 8137.3,
    p10Kw: 7849,
    p50Kw: 8028.7,
    p90Kw: 8249,
    pvKw: 883,
    netKw: 7146,
    peakProbPercent: 0.3,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS (012W) & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 5,
    reeferPlugs: 480,
    opsKw: 1490,
    tempAmbC: 32.6,
    ghiWm2: 430,
    tosContext: "Sustained dual-vessel handling & high Reefer yard demand",
    feeders: { f01StsKw: 3340, f02RtgKw: 1380, f03ReeferKw: 1458, f04OpsKw: 1490, f05EvBessKw: 180, f06AuxKw: 180 }
  },
  {
    id: "FW-1800",
    timeWindow: "18:00",
    touBand: "PEAK",
    status: "NOMINAL",
    actualKw: 6678.1,
    p10Kw: 6490,
    p50Kw: 6688.9,
    p90Kw: 6909,
    pvKw: 52,
    netKw: 6637,
    peakProbPercent: 0.0,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS (012W) & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 5,
    reeferPlugs: 450,
    opsKw: 1420,
    tempAmbC: 29.8,
    ghiWm2: 25,
    tosContext: "Evening shift handover; Solar PV generation drops to zero",
    feeders: { f01StsKw: 2790, f02RtgKw: 1120, f03ReeferKw: 1169, f04OpsKw: 1420, f05EvBessKw: 0, f06AuxKw: 190 }
  },
  {
    id: "FW-2000",
    timeWindow: "20:00",
    touBand: "PEAK",
    status: "NOMINAL",
    actualKw: 6160.2,
    p10Kw: 5970,
    p50Kw: 6149.7,
    p90Kw: 6370,
    pvKw: 0,
    netKw: 6150,
    peakProbPercent: 0.0,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS (012W) & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 4,
    reeferPlugs: 430,
    opsKw: 1380,
    tempAmbC: 28.1,
    ghiWm2: 0,
    tosContext: "Steady night-shift container handling across 2 mother vessels",
    feeders: { f01StsKw: 2480, f02RtgKw: 1020, f03ReeferKw: 1080, f04OpsKw: 1380, f05EvBessKw: 0, f06AuxKw: 190 }
  },
  {
    id: "FW-2200",
    timeWindow: "22:00",
    touBand: "OFF_PEAK",
    status: "NOMINAL",
    actualKw: 4554.5,
    p10Kw: 4380,
    p50Kw: 4559.8,
    p90Kw: 4780,
    pvKw: 0,
    netKw: 4560,
    peakProbPercent: 0.0,
    vesselCode: "UC-02",
    vesselName: "ONE APUS (012W)",
    berth: "Berth B3",
    stsCranes: 3,
    reeferPlugs: 390,
    opsKw: 980,
    tempAmbC: 27.2,
    ghiWm2: 0,
    tosContext: "22:00 day-ahead forecast lock; transition to off-peak TOU",
    feeders: { f01StsKw: 1680, f02RtgKw: 740, f03ReeferKw: 920, f04OpsKw: 980, f05EvBessKw: 60, f06AuxKw: 180 }
  }
];

// Self-training window expansion trajectory from Table PL3.4b
const SELF_TRAINING_TRAJECTORY = [
  { windowDays: 5, samples: 480, pinballLoss: 0.01704, mapeV1: 2.91, rmseV1: 174.7, mapeV2: 2.24, rmseV2: 124.6, r2V2: 0.9954, coverage: "96.9%", latencyMs: "0.093" },
  { windowDays: 10, samples: 960, pinballLoss: 0.01411, mapeV1: 1.68, rmseV1: 94.4, mapeV2: 1.49, rmseV2: 82.8, r2V2: 0.9980, coverage: "100.0%", latencyMs: "0.119" },
  { windowDays: 15, samples: 1440, pinballLoss: 0.01348, mapeV1: 2.01, rmseV1: 107.1, mapeV2: 1.38, rmseV2: 81.8, r2V2: 0.9980, coverage: "100.0%", latencyMs: "0.093" },
  { windowDays: 20, samples: 1920, pinballLoss: 0.01284, mapeV1: 1.89, rmseV1: 108.5, mapeV2: 1.16, rmseV2: 62.9, r2V2: 0.9988, coverage: "100.0%", latencyMs: "0.191" },
  { windowDays: 25, samples: 2400, pinballLoss: 0.01297, mapeV1: 1.82, rmseV1: 98.2, mapeV2: 1.30, rmseV2: 63.7, r2V2: 0.9988, coverage: "100.0%", latencyMs: "0.114" },
  { windowDays: 30, samples: 2880, pinballLoss: 0.01222, mapeV1: 1.34, rmseV1: 72.1, mapeV2: 1.31, rmseV2: 66.7, r2V2: 0.9987, coverage: "100.0%", latencyMs: "0.173" }
];

export const ForecastPage: React.FC<ForecastPageProps> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "THRESHOLD_WARNING" | "SOLAR_OFFSET" | "OFF_PEAK">("ALL");
  const [chartMode, setChartMode] = useState<"QUANTILES" | "NET_VS_PV">("QUANTILES");

  // Modal states (Carbon Invoice-style multi-popup architecture)
  const [selectedWindow, setSelectedWindow] = useState<ForecastWindowRecord | null>(null);
  const [showFeederModal, setShowFeederModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTriggerRulesModal, setShowTriggerRulesModal] = useState(false);

  const contractThresholdKw = 8000;

  const filteredWindows = REPORT_FORECAST_WINDOWS.filter((w) => {
    const matchesSearch =
      w.timeWindow.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.vesselCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tosContext.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.berth.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "THRESHOLD_WARNING") return w.status === "THRESHOLD_WARNING";
    if (statusFilter === "SOLAR_OFFSET") return w.pvKw >= 800;
    if (statusFilter === "OFF_PEAK") return w.touBand === "OFF_PEAK";
    return true;
  });

  const handleOpenFeederBreakdown = (record: ForecastWindowRecord) => {
    setSelectedWindow(record);
    setShowFeederModal(true);
  };

  const handleOpenAlertReport = (record: ForecastWindowRecord) => {
    setSelectedWindow(record);
    setShowReportModal(true);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // Safe fallback in sandboxed frames
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ================================================================== */}
      {/* 1. MINIMALIST HEADER BAR */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">Module 01</span>
            <span aria-hidden="true">·</span>
            <span>Multi-Quantile Load & Solar PV Forecast</span>
            <span aria-hidden="true">·</span>
            <span>15-Minute Rolling Horizon (96 Intervals)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Load Forecast & Threshold Alert Ledger
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowTriggerRulesModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#004B91]" />
            <span>Re-Forecast Rules & Accuracy</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAlertReport(REPORT_FORECAST_WINDOWS[7])}
            className="px-4 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open 24h Forecast Report</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. TOP 4 TABULAR KPI CARDS */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Peak Forecast (P50 / P90)</span>
            <TrendingUp className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            8,151 <span className="text-xs text-slate-500 font-sans font-semibold">/ 8,371 kW</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Window 14:00 · UC-02 5-STS Surge
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Threshold Alert (&gt;8,000 kW)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono tabular-nums">
            2 <span className="text-xs text-slate-500 font-sans font-semibold">Windows Flagged</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
            14:00 (p_peak 2.1%) · 16:00 (0.3%)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Peak Solar PV Yield</span>
            <SunMedium className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums">
            1,880 <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            12:00 Window · Net Grid 2,124 kW
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Out-of-Sample MAPE</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono tabular-nums">
            1.31% <span className="text-xs text-slate-500 font-sans font-semibold">RMSE 66.7 kW</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            R² = 0.9987 · 100% P10–P90 Coverage
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. MINIMALIST 24-HOUR CHART (CLEAN, ZERO NOISY ANNOTATIONS) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              24-Hour Quantile Load Profile (Table PL3.4c Verification)
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>MLP-NN (0.60) + LightGBM (0.40) Pinball Loss Ensemble</span>
              <span aria-hidden="true">·</span>
              <span>Click any window card below to inspect feeder telemetry</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartMode("QUANTILES")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 ${
                chartMode === "QUANTILES" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              P10 / P50 / P90 Envelope
            </button>
            <button
              type="button"
              onClick={() => setChartMode("NET_VS_PV")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 ${
                chartMode === "NET_VS_PV" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Net Grid Load & Solar PV
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={REPORT_FORECAST_WINDOWS} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="timeWindow" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" domain={[0, 9200]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "0.75rem", color: "#fff", fontSize: "11px" }}
                formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} kW`, name]}
              />

              {chartMode === "QUANTILES" ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="p90Kw"
                    name="P90 Upper Bound"
                    fill="#93C5FD"
                    fillOpacity={0.18}
                    stroke="#2563EB"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="p50Kw"
                    name="P50 Baseline Forecast"
                    stroke="#004B91"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#004B91" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualKw"
                    name="Actual Metered (P_t)"
                    stroke="#0F172A"
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: "#0F172A" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="p10Kw"
                    name="P10 Lower Bound"
                    stroke="#64748B"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="pvKw"
                    name="Solar PV Yield (P_PV)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                  <Line
                    type="monotone"
                    dataKey="netKw"
                    name="Net Grid Demand (P_net)"
                    stroke="#004B91"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#004B91" }}
                  />
                </>
              )}

              <ReferenceLine
                y={contractThresholdKw}
                stroke="#D97706"
                strokeDasharray="5 5"
                strokeWidth={1.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 4. SEARCH & FILTER BAR (CARBON INVOICE WORKFLOW PATTERN) */}
      {/* ================================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by hour (14:00), vessel (UC-01, ONE APUS), berth..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] mr-1">Filter:</span>
          {([
            { id: "ALL", label: "All 24h Windows (12)" },
            { id: "THRESHOLD_WARNING", label: "Threshold Alerts (>8,000 kW)" },
            { id: "SOLAR_OFFSET", label: "High Solar PV Offset" },
            { id: "OFF_PEAK", label: "Off-Peak TOU" }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
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
      {/* 5. FORECAST WINDOW CARDS GRID (CARBON INVOICE CARD STYLE) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredWindows.map((win) => (
          <div
            key={win.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 font-bold">
                    <span>{win.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#004B91]">{win.vesselCode}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base font-mono mt-0.5">
                    Window {win.timeWindow}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium line-clamp-1">
                    {win.vesselName}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold uppercase ${
                    win.status === "THRESHOLD_WARNING"
                      ? "text-amber-700"
                      : win.status === "SOLAR_OFFSET"
                      ? "text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  {win.status === "THRESHOLD_WARNING"
                    ? "Alert Warning"
                    : win.status === "SOLAR_OFFSET"
                    ? "PV Offset"
                    : win.touBand}
                </span>
              </div>

              {/* Operational & Quantile Metrics */}
              <div className="py-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Berth & Cranes:</span>
                  <strong className="text-slate-800 font-mono tabular-nums">
                    {win.berth} · {win.stsCranes} STS
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Forecast P50:</span>
                  <strong className="text-slate-900 font-mono tabular-nums">
                    {win.p50Kw.toLocaleString()} kW
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">P10 – P90 Band:</span>
                  <strong className="text-blue-700 font-mono tabular-nums">
                    {win.p10Kw.toLocaleString()} – {win.p90Kw.toLocaleString()} kW
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Solar PV Yield:</span>
                  <strong className="text-emerald-700 font-mono tabular-nums">
                    {win.pvKw > 0 ? `-${win.pvKw.toLocaleString()} kW` : "0 kW"}
                  </strong>
                </div>
              </div>

              {/* Net Grid & Risk Summary Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Net Grid Load:</span>
                  <strong className="text-slate-900 font-mono tabular-nums">
                    {win.netKw.toLocaleString()} kW
                  </strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Actual Metered (P_t):</span>
                  <span className="font-mono font-semibold text-slate-700 tabular-nums">
                    {win.actualKw.toLocaleString()} kW
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Exceedance Prob:</span>
                  <strong
                    className={`font-mono font-bold tabular-nums ${
                      win.peakProbPercent > 0 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    p_peak = {win.peakProbPercent.toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Bottom 2 Action Buttons (Popup Triggers) */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenFeederBreakdown(win)}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Gauge className="w-3.5 h-3.5 text-[#004B91]" />
                <span>Feeder Split</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAlertReport(win)}
                className="py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Alert Sheet</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================================================================== */}
      {/* POPUP 1: INTERVAL FEEDER SPLIT & 18-FEATURE TELEMETRY MODAL */}
      {/* ================================================================== */}
      {showFeederModal && selectedWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm">
                  WINDOW {selectedWindow.timeWindow} — 6-FEEDER & 18-FEATURE TELEMETRY
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFeederModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              {/* TOS & Environmental Context */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Vessel Call</span>
                  <strong className="text-slate-900 font-bold">{selectedWindow.vesselCode}</strong>
                  <span className="text-[11px] text-slate-500 block">{selectedWindow.berth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">TOS Equipment</span>
                  <strong className="text-slate-900 font-mono">{selectedWindow.stsCranes} STS Cranes</strong>
                  <span className="text-[11px] text-slate-500 block">{selectedWindow.reeferPlugs} Reefers</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Weather Sensor</span>
                  <strong className="text-slate-900 font-mono">{selectedWindow.tempAmbC} °C</strong>
                  <span className="text-[11px] text-slate-500 block">GHI: {selectedWindow.ghiWm2} W/m²</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">TOU Tariff Band</span>
                  <strong className="text-[#004B91] font-mono">{selectedWindow.touBand}</strong>
                  <span className="text-[11px] text-slate-500 block">p_peak: {selectedWindow.peakProbPercent}%</span>
                </div>
              </div>

              {/* 6 Substation Feeders Breakdown Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Substation 22kV / 0.4kV Feeder Demand Allocation (F-01 to F-06)
                </div>
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Feeder ID</th>
                      <th className="py-2 px-3">Terminal Zone & Load Group</th>
                      <th className="py-2 px-3 text-right font-mono">Forecast Demand (kW)</th>
                      <th className="py-2 px-3 text-right font-mono">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {[
                      { id: "F-01", name: "Zone 1 · STS Quay Cranes (S01–S05)", kw: selectedWindow.feeders.f01StsKw },
                      { id: "F-02", name: "Zone 2 · e-RTG Yard Cranes (12 Units)", kw: selectedWindow.feeders.f02RtgKw },
                      { id: "F-03", name: "Zone 3 · Reefer Container Yard (480 Plugs)", kw: selectedWindow.feeders.f03ReeferKw },
                      { id: "F-04", name: "Zone 1 · Onshore Power Supply (OPS 6.6kV)", kw: selectedWindow.feeders.f04OpsKw },
                      { id: "F-05", name: "Zone 4 · e-ITV Chargers & BESS Aux", kw: selectedWindow.feeders.f05EvBessKw },
                      { id: "F-06", name: "Zone 4 · CFS HVAC, High-Mast & PCCC", kw: selectedWindow.feeders.f06AuxKw }
                    ].map((f) => {
                      const share = ((f.kw / selectedWindow.p50Kw) * 100).toFixed(1);
                      return (
                        <tr key={f.id}>
                          <td className="py-2 px-3 font-bold text-[#004B91]">{f.id}</td>
                          <td className="py-2 px-3 font-sans text-slate-700">{f.name}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{f.kw.toLocaleString()} kW</td>
                          <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 font-mono">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 font-sans text-right text-slate-700">
                        Total Gross Terminal Forecast (P50) / Net Grid Import:
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 tabular-nums">
                        {selectedWindow.p50Kw.toLocaleString()} kW
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#004B91] tabular-nums">
                        Net: {selectedWindow.netKw.toLocaleString()} kW
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeederModal(false);
                    setShowReportModal(true);
                  }}
                  className="px-4 py-2 bg-[#004B91] text-white rounded-lg font-bold hover:bg-[#00386E] transition-colors"
                >
                  Open Formal Alert Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeederModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* POPUP 2: FORMAL LOAD FORECAST & THRESHOLD ALERT ATTESTATION MODAL */}
      {/* ================================================================== */}
      {showReportModal && selectedWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#004B91] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm">
                  OPERATIONAL LOAD FORECAST & THRESHOLD ALERT REPORT (MODULE 01)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
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
                    SAIGON NEWPORT CORPORATION (SNP)
                  </div>
                  <div className="text-slate-600 text-[11px] font-semibold mt-0.5">
                    G-Port Module 01 · Day-Ahead & 15-Minute Rolling Load Forecast Bulletin
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    Substation 110/22kV PCC · MLP-NN (0.60) + LightGBM (0.40) Pinball Quantile Ensemble
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-base font-black text-slate-900">
                    REF: M1-{selectedWindow.id}-2026
                  </div>
                  <div className="text-slate-500 font-sans">
                    Target Window: {selectedWindow.timeWindow} (UTC+7)
                  </div>
                  <div className="text-emerald-700 font-bold text-[11px] mt-0.5">
                    MAPE: 1.31% · R²: 0.9987
                  </div>
                </div>
              </div>

              {/* Selected Window Alert Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Window</span>
                  <strong className="text-slate-900 text-sm font-black font-mono">{selectedWindow.timeWindow}</strong>
                  <span className="text-[11px] text-slate-500 block">{selectedWindow.touBand} Tariff</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantile Forecast</span>
                  <strong className="text-[#004B91] text-sm font-black font-mono">{selectedWindow.p50Kw.toLocaleString()} kW</strong>
                  <span className="text-[11px] text-slate-500 font-mono block">P90: {selectedWindow.p90Kw.toLocaleString()} kW</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">PV / Net Import</span>
                  <strong className="text-emerald-700 text-sm font-black font-mono">-{selectedWindow.pvKw.toLocaleString()} kW</strong>
                  <span className="text-[11px] text-slate-700 font-mono block">Net: {selectedWindow.netKw.toLocaleString()} kW</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Overload Risk (p_peak)</span>
                  <strong className={`text-sm font-black font-mono ${selectedWindow.peakProbPercent > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                    {selectedWindow.peakProbPercent.toFixed(1)}%
                  </strong>
                  <span className="text-[11px] text-slate-500 block">Cap: 8,000 kW</span>
                </div>
              </div>

              {/* Full 24-Hour Table PL3.4c Ledger */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  24-Hour Multi-Quantile Load Forecast & Exceedance Probability Ledger (Table PL3.4c)
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Hour</th>
                        <th className="py-2 px-2.5 text-right font-mono">Actual P_t</th>
                        <th className="py-2 px-2.5 text-right font-mono">P10 (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">P50 (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">P90 (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">P_PV</th>
                        <th className="py-2 px-2.5 text-right font-mono">P_net</th>
                        <th className="py-2 px-2.5 text-right font-mono">p_peak</th>
                        <th className="py-2 px-2.5">TOS Operational Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {REPORT_FORECAST_WINDOWS.map((row) => {
                        const isSelected = row.id === selectedWindow.id;
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedWindow(row)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50/90 font-semibold" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-2 px-2.5 font-mono font-bold text-slate-900">{row.timeWindow}</td>
                            <td className="py-2 px-2.5 text-right font-mono tabular-nums">{row.actualKw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-500 tabular-nums">{row.p10Kw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-[#004B91] tabular-nums">{row.p50Kw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-700 tabular-nums">{row.p90Kw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-emerald-700 tabular-nums">{row.pvKw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums">{row.netKw.toLocaleString()}</td>
                            <td className={`py-2 px-2.5 text-right font-mono font-bold tabular-nums ${row.peakProbPercent > 0 ? "text-amber-700" : "text-slate-500"}`}>
                              {row.peakProbPercent.toFixed(1)}%
                            </td>
                            <td className="py-2 px-2.5 text-slate-600 truncate max-w-[190px]">{row.tosContext}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verification Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                <div>
                  <strong className="text-slate-800">Threshold Alert Rule:</strong> When p_peak ≥ 10% or P90 exceeds PCC contract cap, Module 03 switches crane demand baseline from P50 to P90 safety envelope.
                </div>
                <div className="font-mono text-slate-700 font-bold shrink-0">
                  STATUS: LOCKED FOR AUDIT
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] transition-colors flex items-center gap-2 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Forecast Report PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* POPUP 3: EVENT RE-FORECAST TRIGGERS & 30-DAY ACCURACY MODAL */}
      {/* ================================================================== */}
      {showTriggerRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">
                  ROLLING CADENCE, RE-FORECAST TRIGGERS & 30-DAY TRAJECTORY
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTriggerRulesModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              {/* Event Trigger Thresholds (Section 4.4.2) */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Event-Driven Re-Forecast Triggers (Section 4.4.2)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">1. Vessel ETA / ATA Deviation</div>
                    <div className="text-slate-600 mt-0.5">Triggered when AIS/TOS ETA shifts ≥ 30 minutes or berth allocation changes.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">2. Cargo Volume & Reefer Shift</div>
                    <div className="text-slate-600 mt-0.5">Triggered when TEU handling volume changes ≥ 15% or plugged Reefers shift ≥ 10%.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">3. 22:00 Day-Ahead & 15-Min Rolling</div>
                    <div className="text-slate-600 mt-0.5">Generates 96 intervals at 22:00 daily; locks past intervals for ISO 14064 audit.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">4. STS Crane Unplanned Outage</div>
                    <div className="text-slate-600 mt-0.5">Immediate recalculation when any STS crane trips or enters maintenance.</div>
                  </div>
                </div>
              </div>

              {/* Table PL3.4b Self-Training Window Expansion */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Expanding-Window Self-Training Trajectory (5 → 30 Days, Table PL3.4b)
                </div>
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden font-mono">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-sans">
                    <tr>
                      <th className="py-2 px-3">Window (Days)</th>
                      <th className="py-2 px-3 text-right">Samples (15m)</th>
                      <th className="py-2 px-3 text-right">Pinball Loss</th>
                      <th className="py-2 px-3 text-right">MAPE v2 (%)</th>
                      <th className="py-2 px-3 text-right">RMSE v2 (kW)</th>
                      <th className="py-2 px-3 text-right">R² (v2)</th>
                      <th className="py-2 px-3 text-right">P10–P90 Cov.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SELF_TRAINING_TRAJECTORY.map((row) => (
                      <tr key={row.windowDays} className={row.windowDays === 30 ? "bg-emerald-50/70 font-bold" : ""}>
                        <td className="py-2 px-3">{row.windowDays} Days</td>
                        <td className="py-2 px-3 text-right tabular-nums">{row.samples.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{row.pinballLoss}</td>
                        <td className="py-2 px-3 text-right text-[#004B91] tabular-nums">{row.mapeV2}%</td>
                        <td className="py-2 px-3 text-right tabular-nums">{row.rmseV2}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{row.r2V2}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 tabular-nums">{row.coverage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTriggerRulesModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
