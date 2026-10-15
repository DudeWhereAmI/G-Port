import React, { useState } from "react";
import { 
  TosVesselSchedule, 
  PvSystemStatus, 
  BessSystemStatus, 
  ScadaFeederMetric, 
  WeatherSensorData, 
  ElectricityTariffTou,
  SubPageId,
  ForecastInterval
} from "../types/gport";
import { 
  RefreshCw, 
  Compass, 
  BarChart3, 
  Activity, 
  Zap, 
  TrendingUp, 
  Sliders
} from "lucide-react";
import { VesselYardMatrixView } from "../components/tos-matrix/VesselYardMatrixView";
import { CheAnalyticsView } from "../components/tos-matrix/CheAnalyticsView";
import { N4WorkflowPipelineView } from "../components/tos-matrix/N4WorkflowPipelineView";
import { ScadaFeedersView } from "../components/tos-matrix/ScadaFeedersView";
import { ForecastPage } from "./ForecastPage";
import { OptimizationPage } from "./OptimizationPage";

interface InputLayerPageProps {
  vessels: TosVesselSchedule[];
  containers?: any[];
  pvStatus: PvSystemStatus;
  bessStatus: BessSystemStatus;
  feeders: ScadaFeederMetric[];
  weather: WeatherSensorData;
  tariff: ElectricityTariffTou;
  scadaStatus?: any;
  forecastData?: ForecastInterval[];
  initialTab?: TosMatrixTab;
  onUpdateTariff?: (tariff: ElectricityTariffTou) => void;
  onOpenMeterModal?: (assetId?: string) => void;
  onNavigate?: (page: SubPageId) => void;
}

export type TosMatrixTab = 
  | "YARD_MATRIX" 
  | "CHE_ANALYTICS" 
  | "N4_PIPELINE" 
  | "SCADA_FEEDERS" 
  | "FORECAST" 
  | "OPTIMIZATION";

export const InputLayerPage: React.FC<InputLayerPageProps> = ({
  vessels,
  pvStatus,
  bessStatus,
  tariff,
  scadaStatus,
  forecastData = [],
  initialTab = "YARD_MATRIX",
  onUpdateTariff,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<TosMatrixTab>(initialTab);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      {/* ================================================================== */}
      {/* 1. COMPACT STREAMLINED STATUS BAR (ZERO TEXTBOOK INTRO TEXT) */}
      {/* ================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              Microgrid SCADA & Operations Matrix
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#004B91] font-bold border border-blue-200">
              IEC 61850 · Navis N4 Active
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
              50.02 Hz · Cat Lai Substation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTriggerSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004B91] hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            title="Force Real-time Sync across TOS N4 & Substation SCADA"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Streams"}</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. UNIFIED MICROGRID SCADA TABS (GOM 3 PHÂN HỆ THÀNH 1) */}
      {/* ================================================================== */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
        {/* Tab 1: Vessel Bay & Yard Matrix */}
        <button
          onClick={() => setActiveTab("YARD_MATRIX")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "YARD_MATRIX"
              ? "bg-white text-[#004B91] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Compass className="w-4 h-4 text-[#004B91]" />
          <span>Bay & Yard Matrix</span>
        </button>

        {/* Tab 2: CHE Operational Analytics */}
        <button
          onClick={() => setActiveTab("CHE_ANALYTICS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "CHE_ANALYTICS"
              ? "bg-white text-[#004B91] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>CHE Analytics</span>
        </button>

        {/* Tab 3: N4 Integration Workflow Pipeline */}
        <button
          onClick={() => setActiveTab("N4_PIPELINE")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "N4_PIPELINE"
              ? "bg-white text-[#004B91] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Activity className="w-4 h-4 text-purple-600" />
          <span>TOS Pipeline</span>
        </button>

        {/* Tab 4: Substation SCADA Feeders */}
        <button
          onClick={() => setActiveTab("SCADA_FEEDERS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "SCADA_FEEDERS"
              ? "bg-white text-[#004B91] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Substation Feeders</span>
        </button>

        {/* Tab 5: 15-Minute Load Forecast (Module 1) */}
        <button
          onClick={() => setActiveTab("FORECAST")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "FORECAST"
              ? "bg-white text-[#004B91] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Load Forecast (P10/P90)</span>
        </button>

        {/* Tab 6: Peak Shaving & BESS Optimization (Module 3) */}
        <button
          onClick={() => setActiveTab("OPTIMIZATION")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "OPTIMIZATION"
              ? "bg-white text-[#004B91] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-600" />
          <span>Peak Shaving & BESS</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* 3. ACTIVE VIEW CONTENT */}
      {/* ================================================================== */}
      {activeTab === "YARD_MATRIX" && (
        <VesselYardMatrixView onNavigate={onNavigate} />
      )}

      {activeTab === "CHE_ANALYTICS" && (
        <CheAnalyticsView onNavigate={onNavigate} />
      )}

      {activeTab === "N4_PIPELINE" && (
        <N4WorkflowPipelineView />
      )}

      {activeTab === "SCADA_FEEDERS" && (
        <ScadaFeedersView
          scadaStatus={scadaStatus || { gridActivePowerKw: 4820 }}
          pvStatus={pvStatus}
          bessStatus={bessStatus}
          tariff={tariff}
          onUpdateTariff={onUpdateTariff}
          onNavigate={onNavigate}
        />
      )}

      {activeTab === "FORECAST" && (
        <ForecastPage
          forecastData={forecastData}
          vessels={vessels}
          tariff={tariff}
          pvStatus={pvStatus}
        />
      )}

      {activeTab === "OPTIMIZATION" && (
        <OptimizationPage
          tariff={tariff}
          bessStatus={bessStatus}
          pvStatus={pvStatus}
        />
      )}
    </div>
  );
};
