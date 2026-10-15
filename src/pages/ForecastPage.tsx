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
  Ship, 
  ShieldAlert, 
  Clock, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Zap,
  Info,
  Maximize2
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

export const ForecastPage: React.FC<ForecastPageProps> = ({
  forecastData,
  vessels,
  tariff,
  pvStatus
}) => {
  const [selectedScenario, setSelectedScenario] = useState<"ALL" | "BASELINE" | "P90" | "P10">("ALL");
  const [includeVesselArrivalSpike, setIncludeVesselArrivalSpike] = useState(true);

  const contractLimitKw = tariff.contractDemandKw; // 8500 kW

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">Module 01</span>
            <span aria-hidden="true">·</span>
            <span>15-Minute Load & Solar PV Forecasting</span>
            <span aria-hidden="true">·</span>
            <span>TOS-Synchronized Dispatch</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Terminal Electrical Demand & Solar Generation Forecast
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Multi-horizon AI forecasting driven by TOS vessel manifests (crane allocations, TEU moves, reefer quantities) combined with solar irradiance telemetry to predict grid exceedance risks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-amber-900">Peak Demand Warning</div>
              <div className="text-amber-800">
                14:00 - 15:30: Projected peak of <strong className="text-amber-950 font-bold">9,150 kW</strong> (+650 kW exceedance)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip: Scenario Selection & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Forecast Scenarios:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setSelectedScenario("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedScenario === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Bands (P10 - Baseline - P90)
            </button>
            <button
              onClick={() => setSelectedScenario("BASELINE")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedScenario === "BASELINE" ? "bg-white text-[#004B91] shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Baseline Model
            </button>
            <button
              onClick={() => setSelectedScenario("P90")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedScenario === "P90" ? "bg-white text-rose-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              High Demand (P90)
            </button>
            <button
              onClick={() => setSelectedScenario("P10")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedScenario === "P10" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Low Demand (P10)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={includeVesselArrivalSpike}
              onChange={(e) => setIncludeVesselArrivalSpike(e.target.checked)}
              className="rounded text-[#004B91] focus:ring-[#004B91] h-4 w-4"
            />
            <span>Simulate ONE APUS (UC-02) 5-Crane Arrival Surge at 14:00</span>
          </label>
        </div>
      </div>

      {/* Main Forecasting Chart: 24h Load vs Threshold & Solar Generation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#004B91]" />
              24-Hour Forecast Profile vs Utility Contract Limit (15-Minute Intervals)
            </h2>
            <p className="text-xs text-slate-500">
              Shaded band reflects the P10-P90 confidence envelope. The dashed threshold marks the EVN contract demand limit (8,500 kW).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-indigo-500/20 border border-indigo-500" />
              <span className="text-slate-600">P10 - P90 Band</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600" />
              <span className="text-slate-600">Baseline Demand</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-400" />
              <span className="text-slate-600">Solar PV Yield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-t border-dashed" />
              <span className="text-rose-600 font-bold">Contract Limit (8,500 kW)</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" domain={[0, 10000]} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "0.75rem", color: "#fff", fontSize: "11px" }} 
                formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} kW`, name]}
              />
              
              {/* P10 to P90 Confidence Band */}
              {(selectedScenario === "ALL" || selectedScenario === "P90") && (
                <Area 
                  type="monotone" 
                  dataKey="highScenarioKw" 
                  name="High Scenario (P90)" 
                  fill="#818CF8" 
                  fillOpacity={0.15} 
                  stroke="#6366F1" 
                  strokeWidth={1} 
                />
              )}
              
              {/* Baseline Load */}
              {(selectedScenario === "ALL" || selectedScenario === "BASELINE") && (
                <Line 
                  type="monotone" 
                  dataKey="baselineDemandKw" 
                  name="Baseline Demand" 
                  stroke="#4338CA" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: "#4338CA" }} 
                />
              )}

              {/* Low Scenario */}
              {(selectedScenario === "ALL" || selectedScenario === "P10") && (
                <Line 
                  type="monotone" 
                  dataKey="lowScenarioKw" 
                  name="Low Scenario (P10)" 
                  stroke="#10B981" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  dot={false} 
                />
              )}

              {/* PV Solar Forecast */}
              <Bar 
                dataKey="pvGenerationKw" 
                name="Solar PV Generation" 
                fill="#34D399" 
                radius={[4, 4, 0, 0]} 
                opacity={0.7} 
              />

              {/* Contract Limit Line */}
              <ReferenceLine 
                y={contractLimitKw} 
                label={{ value: "Contract Limit (8,500 kW)", fill: "#EF4444", fontSize: 10, position: "top" }} 
                stroke="#EF4444" 
                strokeDasharray="5 5" 
                strokeWidth={2} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3 Detail Cards: Exceedance Probability, Breakdown by Zone, and Key Mitigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Exceedance Risk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Grid Overload Risk Assessment
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>

          <div className="text-2xl font-black text-rose-600">
            38.5% <span className="text-xs font-semibold text-slate-500">Exceedance Probability</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Critical window identified between <strong className="text-slate-900">14:00 – 16:30</strong> when <em>ONE APUS (UC-02)</em> berths at Cai Mep TCIT, engaging 5 Super Post-Panamax STS cranes alongside 380 connected reefer units.
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Projected Peak Demand:</span>
            <span className="font-extrabold text-slate-800">9,150 kW (+7.6% over contract)</span>
          </div>
        </div>

        {/* Card 2: Peak Demand by Substation Zone */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Peak Load Distribution by Zone
            </span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Zone 1 (STS Cranes & Shore OPS):</span>
              <strong className="text-slate-900 font-mono">4,200 kW (46%)</strong>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: "46%" }} />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Zone 3 (Reefer Container Yard):</span>
              <strong className="text-slate-900 font-mono">2,300 kW (25%)</strong>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "25%" }} />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Zone 2 (e-RTG Yard Blocks):</span>
              <strong className="text-slate-900 font-mono">1,900 kW (21%)</strong>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: "21%" }} />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Zone 4 (Gate, Admin & Fleet EV):</span>
              <strong className="text-slate-900 font-mono">750 kW (8%)</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Automated Dispatch Setpoint Actions */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              <span>Automated Dispatch Recommendations</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-black mt-1 text-white">Peak Shaving Strategy</h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Based on the 15-minute load simulation, automated setpoints are staged for Module 03 dispatch:
            </p>
            <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
              <li>Discharge 3MWh BESS at <strong className="text-amber-300">1,200 kW</strong> from 13:45 to 16:30</li>
              <li>Extend compressor duty cycles by 45 minutes on 120 reefer units</li>
              <li>Defer charging on 8 electric terminal tractors until after 17:00</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="text-slate-400">Projected Tariff Penalty Avoidance:</span>
            <span className="font-extrabold text-emerald-400">$1,350 USD (32.4M VND)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
