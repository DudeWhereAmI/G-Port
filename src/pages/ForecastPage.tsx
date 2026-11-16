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
  Gauge, 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  Layers,
  Settings
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
  touLabel: string;
  status: "OVERLOAD_WARNING" | "HIGH_SOLAR" | "NORMAL";
  actualKw: number;
  lowBoundKw: number;
  expectedKw: number;
  highBoundKw: number;
  solarKw: number;
  netGridKw: number;
  overloadRiskPercent: number;
  vesselCode: string;
  vesselName: string;
  berth: string;
  stsCranes: number;
  reeferPlugs: number;
  shorePowerKw: number;
  tempAmbC: number;
  solarIrradianceWm2: number;
  operationSummary: string;
  feeders: {
    f01StsKw: number;
    f02RtgKw: number;
    f03ReeferKw: number;
    f04OpsKw: number;
    f05EvBessKw: number;
    f06AuxKw: number;
  };
}

// 24-hour power demand forecast windows (from G-PORT Report Table PL3.4c)
const FORECAST_WINDOWS: ForecastWindowRecord[] = [
  {
    id: "00:00",
    timeWindow: "00:00 – 02:00",
    touBand: "OFF_PEAK",
    touLabel: "Off-Peak Rate",
    status: "NORMAL",
    actualKw: 2798.0,
    lowBoundKw: 2587,
    expectedKw: 2766.6,
    highBoundKw: 2987,
    solarKw: 0,
    netGridKw: 2767,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "TAN CANG GLORY",
    berth: "Berth B1",
    stsCranes: 2,
    reeferPlugs: 185,
    shorePowerKw: 480,
    tempAmbC: 26.4,
    solarIrradianceWm2: 0,
    operationSummary: "Finishing night cargo operations (2 Quay Cranes active)",
    feeders: { f01StsKw: 840, f02RtgKw: 420, f03ReeferKw: 680, f04OpsKw: 480, f05EvBessKw: 180, f06AuxKw: 167 }
  },
  {
    id: "02:00",
    timeWindow: "02:00 – 04:00",
    touBand: "OFF_PEAK",
    touLabel: "Off-Peak Rate",
    status: "NORMAL",
    actualKw: 2693.5,
    lowBoundKw: 2565,
    expectedKw: 2745.2,
    highBoundKw: 2965,
    solarKw: 0,
    netGridKw: 2745,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "TAN CANG GLORY",
    berth: "Berth B1",
    stsCranes: 2,
    reeferPlugs: 180,
    shorePowerKw: 480,
    tempAmbC: 25.8,
    solarIrradianceWm2: 0,
    operationSummary: "Low-rate night window; battery charging scheduled",
    feeders: { f01StsKw: 760, f02RtgKw: 380, f03ReeferKw: 650, f04OpsKw: 480, f05EvBessKw: 315, f06AuxKw: 160 }
  },
  {
    id: "04:00",
    timeWindow: "04:00 – 06:00",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "NORMAL",
    actualKw: 2460.8,
    lowBoundKw: 2310,
    expectedKw: 2489.5,
    highBoundKw: 2710,
    solarKw: 0,
    netGridKw: 2490,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "TAN CANG GLORY",
    berth: "Berth B1",
    stsCranes: 1,
    reeferPlugs: 175,
    shorePowerKw: 320,
    tempAmbC: 25.5,
    solarIrradianceWm2: 0,
    operationSummary: "Ship departing Berth B1; morning shift handover",
    feeders: { f01StsKw: 520, f02RtgKw: 340, f03ReeferKw: 640, f04OpsKw: 320, f05EvBessKw: 490, f06AuxKw: 180 }
  },
  {
    id: "06:00",
    timeWindow: "06:00 – 08:00",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "NORMAL",
    actualKw: 2424.1,
    lowBoundKw: 2235,
    expectedKw: 2415.4,
    highBoundKw: 2635,
    solarKw: 52,
    netGridKw: 2363,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI",
    berth: "Berth B2",
    stsCranes: 2,
    reeferPlugs: 240,
    shorePowerKw: 620,
    tempAmbC: 26.8,
    solarIrradianceWm2: 85,
    operationSummary: "SPIRIT OF MUMBAI arrives at Berth B2; shore power connected",
    feeders: { f01StsKw: 680, f02RtgKw: 310, f03ReeferKw: 645, f04OpsKw: 620, f05EvBessKw: 0, f06AuxKw: 160 }
  },
  {
    id: "08:00",
    timeWindow: "08:00 – 10:00",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "HIGH_SOLAR",
    actualKw: 3979.4,
    lowBoundKw: 3816,
    expectedKw: 3996.2,
    highBoundKw: 4216,
    solarKw: 887,
    netGridKw: 3109,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI",
    berth: "Berth B2",
    stsCranes: 4,
    reeferPlugs: 310,
    shorePowerKw: 750,
    tempAmbC: 29.4,
    solarIrradianceWm2: 460,
    operationSummary: "4 Quay Cranes working; reefer yard cooling demand rising",
    feeders: { f01StsKw: 1680, f02RtgKw: 620, f03ReeferKw: 786, f04OpsKw: 750, f05EvBessKw: 0, f06AuxKw: 160 }
  },
  {
    id: "10:00",
    timeWindow: "10:00 – 12:00",
    touBand: "PEAK",
    touLabel: "Peak Rate",
    status: "HIGH_SOLAR",
    actualKw: 4199.7,
    lowBoundKw: 3965,
    expectedKw: 4144.5,
    highBoundKw: 4365,
    solarKw: 1616,
    netGridKw: 2528,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI",
    berth: "Berth B2",
    stsCranes: 4,
    reeferPlugs: 325,
    shorePowerKw: 760,
    tempAmbC: 32.1,
    solarIrradianceWm2: 790,
    operationSummary: "Morning peak electricity rate; Solar panels cover 1,616 kW",
    feeders: { f01StsKw: 1740, f02RtgKw: 660, f03ReeferKw: 824, f04OpsKw: 760, f05EvBessKw: 0, f06AuxKw: 160 }
  },
  {
    id: "12:00",
    timeWindow: "12:00 – 14:00",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "HIGH_SOLAR",
    actualKw: 4008.4,
    lowBoundKw: 3823,
    expectedKw: 4003.3,
    highBoundKw: 4223,
    solarKw: 1880,
    netGridKw: 2124,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "SPIRIT OF MUMBAI",
    berth: "Berth B2",
    stsCranes: 4,
    reeferPlugs: 330,
    shorePowerKw: 750,
    tempAmbC: 33.8,
    solarIrradianceWm2: 920,
    operationSummary: "Solar power reaches daily high (1,880 kW), cutting grid draw in half",
    feeders: { f01StsKw: 1580, f02RtgKw: 590, f03ReeferKw: 883, f04OpsKw: 750, f05EvBessKw: 40, f06AuxKw: 160 }
  },
  {
    id: "14:00",
    timeWindow: "14:00 – 16:00",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "OVERLOAD_WARNING",
    actualKw: 8144.4,
    lowBoundKw: 7971,
    expectedKw: 8151.0,
    highBoundKw: 8371,
    solarKw: 1612,
    netGridKw: 6539,
    overloadRiskPercent: 2.1,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 5,
    reeferPlugs: 465,
    shorePowerKw: 1480,
    tempAmbC: 34.2,
    solarIrradianceWm2: 780,
    operationSummary: "OVERLOAD ALERT: 2 large ships running 5 Quay Cranes + Shore Power",
    feeders: { f01StsKw: 3420, f02RtgKw: 1410, f03ReeferKw: 1461, f04OpsKw: 1480, f05EvBessKw: 200, f06AuxKw: 180 }
  },
  {
    id: "16:00",
    timeWindow: "16:00 – 18:00",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "OVERLOAD_WARNING",
    actualKw: 8137.3,
    lowBoundKw: 7849,
    expectedKw: 8028.7,
    highBoundKw: 8249,
    solarKw: 883,
    netGridKw: 7146,
    overloadRiskPercent: 0.3,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 5,
    reeferPlugs: 480,
    shorePowerKw: 1490,
    tempAmbC: 32.6,
    solarIrradianceWm2: 430,
    operationSummary: "OVERLOAD ALERT: Heavy dual-ship crane work & 480 reefer containers",
    feeders: { f01StsKw: 3340, f02RtgKw: 1380, f03ReeferKw: 1458, f04OpsKw: 1490, f05EvBessKw: 180, f06AuxKw: 180 }
  },
  {
    id: "18:00",
    timeWindow: "18:00 – 20:00",
    touBand: "PEAK",
    touLabel: "Peak Rate",
    status: "NORMAL",
    actualKw: 6678.1,
    lowBoundKw: 6490,
    expectedKw: 6688.9,
    highBoundKw: 6909,
    solarKw: 52,
    netGridKw: 6637,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 5,
    reeferPlugs: 450,
    shorePowerKw: 1420,
    tempAmbC: 29.8,
    solarIrradianceWm2: 25,
    operationSummary: "Evening shift change; solar power ends for the day",
    feeders: { f01StsKw: 2790, f02RtgKw: 1120, f03ReeferKw: 1169, f04OpsKw: 1420, f05EvBessKw: 0, f06AuxKw: 190 }
  },
  {
    id: "20:00",
    timeWindow: "20:00 – 22:00",
    touBand: "PEAK",
    touLabel: "Peak Rate",
    status: "NORMAL",
    actualKw: 6160.2,
    lowBoundKw: 5970,
    expectedKw: 6149.7,
    highBoundKw: 6370,
    solarKw: 0,
    netGridKw: 6150,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 & B3",
    stsCranes: 4,
    reeferPlugs: 430,
    shorePowerKw: 1380,
    tempAmbC: 28.1,
    solarIrradianceWm2: 0,
    operationSummary: "Steady night container unloading across 2 ships",
    feeders: { f01StsKw: 2480, f02RtgKw: 1020, f03ReeferKw: 1080, f04OpsKw: 1380, f05EvBessKw: 0, f06AuxKw: 190 }
  },
  {
    id: "22:00",
    timeWindow: "22:00 – 24:00",
    touBand: "OFF_PEAK",
    touLabel: "Off-Peak Rate",
    status: "NORMAL",
    actualKw: 4554.5,
    lowBoundKw: 4380,
    expectedKw: 4559.8,
    highBoundKw: 4780,
    solarKw: 0,
    netGridKw: 4560,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-02",
    vesselName: "ONE APUS",
    berth: "Berth B3",
    stsCranes: 3,
    reeferPlugs: 390,
    shorePowerKw: 980,
    tempAmbC: 27.2,
    solarIrradianceWm2: 0,
    operationSummary: "SPIRIT OF MUMBAI departs; off-peak electricity rate begins",
    feeders: { f01StsKw: 1680, f02RtgKw: 740, f03ReeferKw: 920, f04OpsKw: 980, f05EvBessKw: 60, f06AuxKw: 180 }
  }
];

const ACCURACY_HISTORY = [
  { windowDays: 5, samples: 480, accuracyPercent: "97.8%", avgErrorKw: 124.6, rangeCoverage: "96.9%" },
  { windowDays: 10, samples: 960, accuracyPercent: "98.5%", avgErrorKw: 82.8, rangeCoverage: "100.0%" },
  { windowDays: 15, samples: 1440, accuracyPercent: "98.6%", avgErrorKw: 81.8, rangeCoverage: "100.0%" },
  { windowDays: 20, samples: 1920, accuracyPercent: "98.8%", avgErrorKw: 62.9, rangeCoverage: "100.0%" },
  { windowDays: 25, samples: 2400, accuracyPercent: "98.7%", avgErrorKw: 63.7, rangeCoverage: "100.0%" },
  { windowDays: 30, samples: 2880, accuracyPercent: "98.7%", avgErrorKw: 66.7, rangeCoverage: "100.0%" }
];

export const ForecastPage: React.FC<ForecastPageProps> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OVERLOAD_WARNING" | "HIGH_SOLAR" | "OFF_PEAK">("ALL");
  const [chartMode, setChartMode] = useState<"DEMAND_RANGE" | "NET_VS_SOLAR">("DEMAND_RANGE");

  // Clean Popups
  const [selectedWindow, setSelectedWindow] = useState<ForecastWindowRecord | null>(null);
  const [showPowerBreakdownModal, setShowPowerBreakdownModal] = useState(false);
  const [showForecastReportModal, setShowForecastReportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const substationLimitKw = 8000;

  const filteredWindows = FORECAST_WINDOWS.filter((w) => {
    const matchesSearch =
      w.timeWindow.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.vesselCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.operationSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.berth.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "OVERLOAD_WARNING") return w.status === "OVERLOAD_WARNING";
    if (statusFilter === "HIGH_SOLAR") return w.solarKw >= 800;
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

  return (
    <div className="space-y-6 pb-12">
      {/* ================================================================== */}
      {/* 1. CLEAN HEADER BAR */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">24-Hour Power Forecast</span>
            <span aria-hidden="true">·</span>
            <span>Updated every 15 minutes</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-bold">Substation Limit: 8,000 kW</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Port Power Demand & Overload Warnings
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#004B91]" />
            <span>Forecast Settings</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenForecastReport(FORECAST_WINDOWS[7])}
            className="px-4 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export 24h Forecast</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. TOP 4 HIGHLIGHTED KPI CARDS */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Peak Expected Power</span>
            <TrendingUp className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            8,151 <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            At 14:00 · Max range up to 8,371 kW
          </div>
        </div>

        {/* Highlighted Warning Card */}
        <div className="bg-amber-50/70 p-4 rounded-xl border-2 border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between text-amber-900 text-[11px] font-bold mb-1">
            <span>Overload Warnings (&gt;8,000 kW)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800 font-mono tabular-nums">
            2 Hours <span className="text-xs text-amber-700 font-sans font-bold">Flagged</span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold mt-0.5">
            14:00 (8,151 kW) &amp; 16:00 (8,029 kW)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Peak Solar Generation</span>
            <SunMedium className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums">
            1,880 <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            At 12:00 · Reduces grid draw to 2,124 kW
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Forecast Accuracy (30-Day)</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono tabular-nums">
            98.7% <span className="text-xs text-slate-500 font-sans font-semibold">±1.3% error</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Avg deviation: ±66.7 kW
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. CLEAN 24-HOUR POWER DEMAND CHART */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              24-Hour Power Demand Curve (kW)
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Dashed orange line shows 8,000 kW Substation Overload Limit</span>
              <span aria-hidden="true">·</span>
              <span>Click any time card below to inspect power by line</span>
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
              Expected vs. High Load Range
            </button>
            <button
              type="button"
              onClick={() => setChartMode("NET_VS_SOLAR")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === "NET_VS_SOLAR" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Grid Power vs. Solar Power
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={FORECAST_WINDOWS} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="id" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" domain={[0, 9200]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "0.75rem", color: "#fff", fontSize: "11px" }}
                formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} kW`, name]}
              />

              {chartMode === "DEMAND_RANGE" ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="highBoundKw"
                    name="Worst-Case High Load"
                    fill="#93C5FD"
                    fillOpacity={0.18}
                    stroke="#2563EB"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="expectedKw"
                    name="Expected Power Demand"
                    stroke="#004B91"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#004B91" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualKw"
                    name="Actual Metered Power"
                    stroke="#0F172A"
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: "#0F172A" }}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="solarKw"
                    name="Solar Power Generated"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                  />
                  <Line
                    type="monotone"
                    dataKey="netGridKw"
                    name="Net Grid Power Needed"
                    stroke="#004B91"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#004B91" }}
                  />
                </>
              )}

              <ReferenceLine
                y={substationLimitKw}
                stroke="#D97706"
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
            placeholder="Search by hour (14:00), ship name (ONE APUS, SPIRIT OF MUMBAI), berth..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] mr-1">Filter:</span>
          {([
            { id: "ALL", label: "All Time Windows (12)" },
            { id: "OVERLOAD_WARNING", label: "Overload Warnings (>8,000 kW)" },
            { id: "HIGH_SOLAR", label: "High Solar Hours" },
            { id: "OFF_PEAK", label: "Off-Peak Rate Hours" }
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
      {/* 5. TIME WINDOW CARDS GRID (HIGHLIGHTING CRITICAL OVERLOAD DATA) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredWindows.map((win) => {
          const isOverload = win.status === "OVERLOAD_WARNING";
          return (
            <div
              key={win.id}
              className={`rounded-2xl p-5 border shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                isOverload
                  ? "bg-amber-50/40 border-2 border-amber-400"
                  : "bg-white border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <span>{win.berth}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#004B91]">{win.stsCranes} Cranes</span>
                    </div>
                    <h3 className="font-black text-slate-900 text-base font-mono mt-0.5">
                      {win.timeWindow}
                    </h3>
                    <div className="text-xs text-slate-600 font-semibold line-clamp-1">
                      {win.vesselName}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isOverload
                        ? "bg-amber-500 text-white"
                        : win.status === "HIGH_SOLAR"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isOverload
                      ? "Overload Alert"
                      : win.status === "HIGH_SOLAR"
                      ? "Solar Active"
                      : win.touLabel}
                  </span>
                </div>

                {/* HIGHLIGHTED PRIMARY POWER METRIC */}
                <div className={`my-3 p-3 rounded-xl border ${
                  isOverload ? "bg-amber-100/70 border-amber-300" : "bg-slate-50 border-slate-200/80"
                }`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-slate-600">Expected Power:</span>
                    <strong className={`text-lg font-black font-mono tabular-nums ${
                      isOverload ? "text-amber-900" : "text-slate-900"
                    }`}>
                      {win.expectedKw.toLocaleString()} kW
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Possible Range:</span>
                    <span className="font-mono font-semibold text-slate-700 tabular-nums">
                      {win.lowBoundKw.toLocaleString()} – {win.highBoundKw.toLocaleString()} kW
                    </span>
                  </div>
                </div>

                {/* Secondary Operational Metrics */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">Solar Power Offset:</span>
                    <strong className="text-emerald-700 font-mono tabular-nums">
                      {win.solarKw > 0 ? `-${win.solarKw.toLocaleString()} kW` : "0 kW"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">Net Grid Power Needed:</span>
                    <strong className="text-[#004B91] font-mono tabular-nums">
                      {win.netGridKw.toLocaleString()} kW
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">Reefer Containers:</span>
                    <strong className="text-slate-800 font-mono tabular-nums">
                      {win.reeferPlugs} Plugs
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-100 line-clamp-2">
                  {win.operationSummary}
                </p>
              </div>

              {/* Clear, Self-Explanatory Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenPowerBreakdown(win)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#004B91]" />
                  <span>Power Breakdown</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenForecastReport(win)}
                  className="py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Forecast Report</span>
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
                  Power Breakdown by Line — {selectedWindow.timeWindow}
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
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ships at Berth</span>
                  <strong className="text-slate-900 font-bold">{selectedWindow.vesselName}</strong>
                  <span className="text-[11px] text-slate-500 block">{selectedWindow.berth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Equipment</span>
                  <strong className="text-slate-900 font-mono">{selectedWindow.stsCranes} Quay Cranes</strong>
                  <span className="text-[11px] text-slate-500 block">{selectedWindow.reeferPlugs} Reefers</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Weather</span>
                  <strong className="text-slate-900 font-mono">{selectedWindow.tempAmbC} °C</strong>
                  <span className="text-[11px] text-slate-500 block">Solar: {selectedWindow.solarKw} kW</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Electricity Rate</span>
                  <strong className="text-[#004B91] font-mono">{selectedWindow.touLabel}</strong>
                  <span className="text-[11px] text-slate-500 block">
                    {selectedWindow.status === "OVERLOAD_WARNING" ? "Over 8,000 kW limit" : "Within limit"}
                  </span>
                </div>
              </div>

              {/* 6 Substation Feeders Breakdown Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Expected Power by Substation Line (Feeders F-01 to F-06)
                </div>
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Line</th>
                      <th className="py-2 px-3">Port Area &amp; Equipment</th>
                      <th className="py-2 px-3 text-right font-mono">Expected Power (kW)</th>
                      <th className="py-2 px-3 text-right font-mono">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {[
                      { id: "F-01", name: "Quay Cranes (S01–S05)", kw: selectedWindow.feeders.f01StsKw },
                      { id: "F-02", name: "Yard e-RTG Cranes (12 Units)", kw: selectedWindow.feeders.f02RtgKw },
                      { id: "F-03", name: "Reefer Container Yard (480 Plugs)", kw: selectedWindow.feeders.f03ReeferKw },
                      { id: "F-04", name: "Ship Shore Power (OPS)", kw: selectedWindow.feeders.f04OpsKw },
                      { id: "F-05", name: "Electric Trucks & Battery System", kw: selectedWindow.feeders.f05EvBessKw },
                      { id: "F-06", name: "Warehouse HVAC, Lighting & Fire Pumps", kw: selectedWindow.feeders.f06AuxKw }
                    ].map((f) => {
                      const share = ((f.kw / selectedWindow.expectedKw) * 100).toFixed(1);
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
                        Total Port Demand / Net Grid Power Needed:
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 tabular-nums">
                        {selectedWindow.expectedKw.toLocaleString()} kW
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#004B91] tabular-nums">
                        Grid: {selectedWindow.netGridKw.toLocaleString()} kW
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
                  View Full 24h Forecast Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowPowerBreakdownModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
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
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#004B91] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm">
                  24-Hour Port Power Forecast Report
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
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
                    SAIGON NEWPORT CORPORATION (SNP)
                  </div>
                  <div className="text-slate-600 text-[11px] font-semibold mt-0.5">
                    Cat Lai Terminal · 24-Hour Power Demand &amp; Overload Warning Report
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    Main 110/22kV Substation · Overload Warning Threshold: 8,000 kW
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-base font-black text-slate-900">
                    REPORT #{selectedWindow.id.replace(":", "")}
                  </div>
                  <div className="text-slate-500 font-sans">
                    Selected Window: {selectedWindow.timeWindow}
                  </div>
                  <div className="text-emerald-700 font-bold text-[11px] mt-0.5">
                    30-Day Accuracy: 98.7%
                  </div>
                </div>
              </div>

              {/* Selected Window Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Time Window</span>
                  <strong className="text-slate-900 text-sm font-black font-mono">{selectedWindow.timeWindow}</strong>
                  <span className="text-[11px] text-slate-500 block">{selectedWindow.touLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected Power</span>
                  <strong className="text-[#004B91] text-sm font-black font-mono">{selectedWindow.expectedKw.toLocaleString()} kW</strong>
                  <span className="text-[11px] text-slate-500 font-mono block">Max: {selectedWindow.highBoundKw.toLocaleString()} kW</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Solar / Net Grid</span>
                  <strong className="text-emerald-700 text-sm font-black font-mono">-{selectedWindow.solarKw.toLocaleString()} kW</strong>
                  <span className="text-[11px] text-slate-700 font-mono block">Grid: {selectedWindow.netGridKw.toLocaleString()} kW</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Substation Status</span>
                  <strong className={`text-sm font-black font-mono ${selectedWindow.status === "OVERLOAD_WARNING" ? "text-amber-700" : "text-emerald-700"}`}>
                    {selectedWindow.status === "OVERLOAD_WARNING" ? "OVERLOAD ALERT" : "NORMAL"}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">Limit: 8,000 kW</span>
                </div>
              </div>

              {/* Full 24-Hour Table */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Complete 24-Hour Schedule &amp; Power Forecast
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Time</th>
                        <th className="py-2 px-2.5 text-right font-mono">Expected (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">High Range (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">Solar (kW)</th>
                        <th className="py-2 px-2.5 text-right font-mono">Net Grid (kW)</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                        <th className="py-2 px-2.5">Port Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {FORECAST_WINDOWS.map((row) => {
                        const isSelected = row.id === selectedWindow.id;
                        const isWarn = row.status === "OVERLOAD_WARNING";
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedWindow(row)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50/90 font-semibold" : isWarn ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-2 px-2.5 font-mono font-bold text-slate-900">{row.id}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-[#004B91] tabular-nums">{row.expectedKw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-600 tabular-nums">{row.highBoundKw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-emerald-700 tabular-nums">{row.solarKw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums">{row.netGridKw.toLocaleString()}</td>
                            <td className="py-2 px-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isWarn ? "bg-amber-500 text-white" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {isWarn ? "OVER 8,000 kW" : "NORMAL"}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-600 truncate max-w-[210px]">{row.operationSummary}</td>
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
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
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
                  Forecast Update Rules &amp; 30-Day Accuracy
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
                  When Does the Forecast Automatically Update?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">1. Ship Arrival / Departure Change</div>
                    <div className="text-slate-600 mt-0.5">Updates immediately if a ship arrives ≥ 30 minutes early/late or changes berth.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">2. Container &amp; Reefer Volume Change</div>
                    <div className="text-slate-600 mt-0.5">Updates if container moves change by ≥ 15% or plugged reefer containers shift by ≥ 10%.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">3. Regular 15-Minute Updates</div>
                    <div className="text-slate-600 mt-0.5">Refreshes every 15 minutes and locks the next-day schedule at 22:00 each night.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">4. Crane Maintenance or Stoppage</div>
                    <div className="text-slate-600 mt-0.5">Recalculates power demand immediately if any Quay Crane stops for maintenance.</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  30-Day Forecast Accuracy History
                </div>
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden font-mono">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-sans">
                    <tr>
                      <th className="py-2 px-3">History Window</th>
                      <th className="py-2 px-3 text-right">15-Min Readings</th>
                      <th className="py-2 px-3 text-right">Accuracy</th>
                      <th className="py-2 px-3 text-right">Avg Error (kW)</th>
                      <th className="py-2 px-3 text-right">Within Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ACCURACY_HISTORY.map((row) => (
                      <tr key={row.windowDays} className={row.windowDays === 30 ? "bg-emerald-50/70 font-bold" : ""}>
                        <td className="py-2 px-3">{row.windowDays} Days</td>
                        <td className="py-2 px-3 text-right tabular-nums">{row.samples.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-[#004B91] tabular-nums">{row.accuracyPercent}</td>
                        <td className="py-2 px-3 text-right tabular-nums">±{row.avgErrorKw} kW</td>
                        <td className="py-2 px-3 text-right text-emerald-700 tabular-nums">{row.rangeCoverage}</td>
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
