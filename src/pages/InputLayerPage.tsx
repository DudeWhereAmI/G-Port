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
  Zap
} from "lucide-react";
import { VesselYardMatrixView } from "../components/tos-matrix/VesselYardMatrixView";
import { CheAnalyticsView } from "../components/tos-matrix/CheAnalyticsView";
import { N4WorkflowPipelineView } from "../components/tos-matrix/N4WorkflowPipelineView";
import { ScadaFeedersView } from "../components/tos-matrix/ScadaFeedersView";

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
  | "SCADA_FEEDERS";

export const InputLayerPage: React.FC<InputLayerPageProps> = ({
  pvStatus,
  bessStatus,
  tariff,
  scadaStatus,
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
    <div className="space-y-4 pb-12">
      {/* 1. COMPACT STREAMLINED STATUS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="font-bold text-[#004B91]">Input Layer (L-01)</span>
            <span aria-hidden="true">·</span>
            <span>IEC 61850 & Navis N4 TOS Telemetry</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Δbal = 0.41% (197 Raw Cols → 136 Reconciled)</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
            Microgrid SCADA & Terminal Telemetry Feeds
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTriggerSync}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004B91] hover:bg-blue-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing Streams..." : "Sync Telemetry"}</span>
          </button>
        </div>
      </div>

      {/* 2. TELEMETRY FEED TABS */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("YARD_MATRIX")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "YARD_MATRIX"
              ? "bg-white text-[#004B91] shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Compass className="w-4 h-4 text-[#004B91]" />
          <span>Bay & Yard Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("CHE_ANALYTICS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "CHE_ANALYTICS"
              ? "bg-white text-[#004B91] shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>CHE Telemetry (600 CAN-Bus)</span>
        </button>

        <button
          onClick={() => setActiveTab("N4_PIPELINE")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "N4_PIPELINE"
              ? "bg-white text-[#004B91] shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>TOS N4 Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab("SCADA_FEEDERS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "SCADA_FEEDERS"
              ? "bg-white text-[#004B91] shadow-2xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Substation 6 Feeders (F-01–F-06)</span>
        </button>
      </div>

      {/* 3. ACTIVE TELEMETRY VIEW */}
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
    </div>
  );
};
