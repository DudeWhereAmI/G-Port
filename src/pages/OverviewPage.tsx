import React from "react";
import { 
  SubPageId, 
  TosVesselSchedule, 
  PvSystemStatus, 
  BessSystemStatus, 
  ElectricityTariffTou 
} from "../types/gport";
import { 
  Zap, 
  SunMedium, 
  BatteryCharging, 
  Ship, 
  ArrowRight, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Leaf, 
  Building2, 
  Clock, 
  CheckCircle2, 
  BarChart3,
  PlugZap,
  Globe2,
  FileText
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { MasterUseCaseSelector } from "../components/MasterUseCaseSelector";

interface OverviewPageProps {
  onNavigate: (page: SubPageId) => void;
  vessels: TosVesselSchedule[];
  pvStatus: PvSystemStatus;
  bessStatus: BessSystemStatus;
  tariff: ElectricityTariffTou;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  vessels,
  pvStatus,
  bessStatus,
  tariff
}) => {
  const totalLoadKw = tariff.currentDemandKw + pvStatus.currentPowerKw + bessStatus.currentPowerKw;
  const pContractLimitKw = tariff.contractDemandKw;
  const safetyMarginPercent = Math.round(((pContractLimitKw - tariff.currentDemandKw) / pContractLimitKw) * 100);

  const realTimeFlowData = [
    { source: "National Grid (EVN 110kV)", kw: tariff.currentDemandKw, color: "#3B82F6", percent: Math.round((tariff.currentDemandKw / totalLoadKw) * 100) },
    { source: "Rooftop Solar PV", kw: pvStatus.currentPowerKw, color: "#10B981", percent: Math.round((pvStatus.currentPowerKw / totalLoadKw) * 100) },
    { source: "BESS Storage Discharge", kw: bessStatus.currentPowerKw, color: "#F59E0B", percent: Math.round((bessStatus.currentPowerKw / totalLoadKw) * 100) }
  ];

  const liveFeederLoads = [
    { name: "STS Quay Cranes (Berth 1-2)", kw: 2480, zone: "Zone 1", color: "#2E598E" },
    { name: "Reefer Container Yard", kw: 1650, zone: "Zone 3", color: "#0284C7" },
    { name: "e-RTG Yard Cranes (Block A&B)", kw: 1260, zone: "Zone 2", color: "#4A81C9" },
    { name: "OPS Shore Power Substation", kw: 1050, zone: "Zone 1", color: "#10B981" },
    { name: "Terminal Tractors & Gate", kw: 340, zone: "Zone 4", color: "#6366F1" },
    { name: "CFS Warehouses & Admin Bldg", kw: 180, zone: "Zone 4", color: "#64748B" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Operational Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <span className="font-bold text-[#004B91]">Terminal Operations</span>
            <span aria-hidden="true">·</span>
            <span>Cat Lai & Cai Mep Deep-Sea Terminals</span>
            <span aria-hidden="true">·</span>
            <span>GLEC Framework v3.0 / ISO 14083</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Port Energy & Decarbonization Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("ECO_CALCULATOR")}
            className="px-3.5 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Eco Quote & Booking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate("VESSEL_CARBON_INVOICE")}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>DCSA Invoices</span>
          </button>
        </div>
      </div>

      {/* 4 Core Master Operational Use Cases Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <MasterUseCaseSelector onNavigate={onNavigate} />
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Active Terminal Demand</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {totalLoadKw.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <SunMedium className="w-3.5 h-3.5" /> 23.9% Solar
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              <BatteryCharging className="w-3.5 h-3.5" /> 8.5% BESS
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Grid Contract / Demand</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {tariff.currentDemandKw.toLocaleString()} / {pContractLimitKw.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="bg-port-medium h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.round((tariff.currentDemandKw / pContractLimitKw) * 100))}%` }} 
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
            <span>Safe ({safetyMarginPercent}% headroom)</span>
            <span className="text-emerald-600 font-bold">No Peak Penalty</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Port Carbon Intensity</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mb-1">
            18.2 <span className="text-sm font-semibold text-slate-600">kgCO₂e / TEU</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-14.2% YoY Reduction</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Active Vessels at Berth</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            2 <span className="text-sm font-semibold text-slate-500">Calling Vessels</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <PlugZap className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% OPS Shore Power Active</span>
          </div>
        </div>
      </div>

      {/* Real-time Energy Balancing & Microgrid Dispatch Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Smart Microgrid Multi-Source Dispatch */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Real-Time Multi-Source Power Dispatch Flow
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuous dynamic load balancing: EVN Grid + Rooftop Solar + BESS Storage feeding terminal demand
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Peak Tariff Window (3,076 VND/kWh)
              </span>
            </div>
          </div>

          {/* Visual Source -> Dispatch -> Sink Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* 1. Power Supply Mix */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Power Supply Mix
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-blue-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> National Grid (110kV)
                  </span>
                  <span className="font-black text-slate-800">{tariff.currentDemandKw.toLocaleString()} kW</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>67.5% total demand</span>
                  <span className="text-slate-400">cosφ = 0.98</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Rooftop Solar PV
                  </span>
                  <span className="font-black text-emerald-600">+{pvStatus.currentPowerKw.toLocaleString()} kW</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>23.9% total demand</span>
                  <span className="text-emerald-600 font-semibold">GHI: 845 W/m²</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> BESS Storage
                  </span>
                  <span className="font-black text-amber-600">+{bessStatus.currentPowerKw.toLocaleString()} kW</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>SOC: {bessStatus.socPercent}%</span>
                  <span className="text-amber-600 font-semibold">Peak shaving discharge</span>
                </div>
              </div>
            </div>

            {/* 2. Automated Dispatch Hub */}
            <div className="bg-linear-to-b from-[#004B91] to-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between shadow-md">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  2. Automated Dispatch (EMS)
                </div>
                <h3 className="text-base font-black mt-1">G-Port Dispatch Hub</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Predictive optimization algorithm continuously synchronizes TOU electricity tariffs, solar irradiance forecasts, and TOS vessel berthing schedules.
                </p>
              </div>

              <div className="space-y-2 py-3 border-y border-white/10 my-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Peak avoided capacity:</span>
                  <span className="font-bold text-emerald-400">2,470 kW</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Daily cost savings:</span>
                  <span className="font-bold text-emerald-400">~18.5M VND</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Scope 2 reduction:</span>
                  <span className="font-bold text-emerald-400">~6.8 tCO₂e</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate("MODULE_3_OPTIMIZATION")}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Configure SCADA Setpoints</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Terminal Load Distribution */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Terminal Load Distribution ({totalLoadKw.toLocaleString()} kW)
              </div>

              <div className="space-y-2">
                {liveFeederLoads.map((feeder) => (
                  <div key={feeder.name} className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="truncate pr-2">{feeder.name}</span>
                      <span className="shrink-0">{feeder.kw.toLocaleString()} kW</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${Math.round((feeder.kw / totalLoadKw) * 100)}%`, 
                          backgroundColor: feeder.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Active Vessels at Berth */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Ship className="w-4 h-4 text-port-medium" />
                  Active Vessels at Berth
                </h3>
                <p className="text-xs text-slate-500">Direct telemetry stream from TOS</p>
              </div>
              <button
                onClick={() => onNavigate("VESSEL_SCHEDULE")}
                className="text-xs font-bold text-[#004B91] hover:underline flex items-center gap-1"
              >
                View full schedule <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {vessels.filter(v => v.status === "OPERATING" || v.status === "BERTHED").map((v) => {
                const ucBadge = v.vesselName.includes("SPIRIT") ? "UC-01" :
                  v.vesselName.includes("APUS") ? "UC-02" :
                  v.vesselName.includes("KITHIRA") ? "UC-03" :
                  v.vesselName.includes("GLORY") ? "UC-04" : null;

                return (
                  <div key={v.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {ucBadge && (
                            <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] bg-[#004B91] text-white">
                              {ucBadge}
                            </span>
                          )}
                          <span className="text-xs font-extrabold text-slate-900">{v.vesselName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{v.carrier} • Voyage {v.voyage}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-emerald-100 text-emerald-800">
                        {v.status === "OPERATING" ? "In Operation" : "Berthed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400">Berth:</span> <strong className="text-slate-700">{v.berth}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Cranes:</span> <strong className="text-slate-700">{v.assignedCranes} STS</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Handled:</span> <strong className="text-slate-700">{v.handledTeu}/{v.plannedTeu} TEU</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">OPS Shore Power:</span>{" "}
                        <span className="text-emerald-600 font-bold">{v.opsConnected ? "Connected" : "No"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>DCSA Digital Carbon Invoices</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Auditable voyage-level energy consumption and cold-ironing emission offsets standardized to GLEC and DCSA specifications.
            </p>
            <button
              onClick={() => onNavigate("VESSEL_CARBON_INVOICE")}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>View Invoices & QR Verification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Architecture Modules Navigation Cards */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Operational Architecture: Ingestion Layer & Core Modules
          </h2>
          <p className="text-xs text-slate-500">
            End-to-end data pipeline from physical terminal sensors to predictive dispatch, emissions inventory, and peak shaving
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Input Layer */}
          <div 
            onClick={() => onNavigate("INPUT_LAYER")}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#004B91] hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                01. Input Layer
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#004B91] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-[#004B91] text-sm">
              Data Ingestion & Integrity
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consolidates synchronized feeds from TOS, ePort, Solar PV, BESS, SCADA, weather IoT, and TOU tariffs.
            </p>
            <div className="text-[11px] font-semibold text-[#004B91] pt-1">
              8 Ingested Streams →
            </div>
          </div>

          {/* Card 2: Module 1 */}
          <div 
            onClick={() => onNavigate("MODULE_1_FORECAST")}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                02. Module 1
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-900 text-sm">
              15-Min Load Forecasting
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Predictive terminal power demand, solar yield forecasting, and ULCV berthing surge warnings.
            </p>
            <div className="text-[11px] font-semibold text-indigo-600 pt-1">
              P10 / Baseline / P90 Scenarios →
            </div>
          </div>

          {/* Card 3: Module 2 */}
          <div 
            onClick={() => onNavigate("MODULE_2_MEASUREMENT")}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                03. Module 2
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-900 text-sm">
              Carbon Accounting & Assets
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Quantified Scope 1 (fuel) and Scope 2 (grid), TEU carbon intensity, and certified asset emissions.
            </p>
            <div className="text-[11px] font-semibold text-emerald-600 pt-1">
              GLEC Audit Verification →
            </div>
          </div>

          {/* Card 4: Module 3 */}
          <div 
            onClick={() => onNavigate("MODULE_3_OPTIMIZATION")}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-600 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                04. Module 3
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-amber-900 text-sm">
              BESS & Peak Shaving
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated peak shaving schedules, multi-source dispatch setpoints, and terminal electrification roadmap.
            </p>
            <div className="text-[11px] font-semibold text-amber-600 pt-1">
              SCADA Dispatch Setpoints →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
