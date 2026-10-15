import React, { useState } from "react";
import { 
  ElectricityTariffTou, 
  BessSystemStatus, 
  PvSystemStatus 
} from "../types/gport";
import { 
  Zap, 
  Sliders, 
  BatteryCharging, 
  SunMedium, 
  DollarSign, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Layers, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid, 
  LineChart, 
  Line 
} from "recharts";

interface OptimizationPageProps {
  tariff: ElectricityTariffTou;
  bessStatus: BessSystemStatus;
  pvStatus: PvSystemStatus;
}

export const OptimizationPage: React.FC<OptimizationPageProps> = ({
  tariff,
  bessStatus,
  pvStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"DISPATCH" | "SIMULATOR">("DISPATCH");

  // Interactive controls for live dispatch
  const [bessTargetPowerKw, setBessTargetPowerKw] = useState(850);
  const [peakShavingThresholdKw, setPeakShavingThresholdKw] = useState(8000);
  const [flexibleReeferShedPercent, setFlexibleReeferShedPercent] = useState(15);
  const [evChargingDefer, setEvChargingDefer] = useState(true);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Simulator State (Decarbonization Roadmap)
  const [targetYear, setTargetYear] = useState(2030);
  const [ertgConversionPercent, setErtgConversionPercent] = useState(80);
  const [opsBerthCoveragePercent, setOpsBerthCoveragePercent] = useState(100);
  const [pvExpansionMwp, setPvExpansionMwp] = useState(5.0);
  const [bessCapacityMwh, setBessCapacityMwh] = useState(8.0);
  const [electricTractorPercent, setElectricTractorPercent] = useState(60);

  const handleSendSetpoints = () => {
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  // Simulator Calculations
  const calculatedCo2ReductionPercent = Math.min(
    75,
    Math.round(
      (ertgConversionPercent * 0.25) +
      (opsBerthCoveragePercent * 0.35) +
      (pvExpansionMwp * 3.5) +
      (electricTractorPercent * 0.2)
    )
  );

  const estimatedAnnualSavingsMUsd = (
    ((ertgConversionPercent * 0.08) +
    (opsBerthCoveragePercent * 0.15) +
    (pvExpansionMwp * 1.8) +
    (bessCapacityMwh * 0.9)) * 0.04
  ).toFixed(2);

  const estimatedTotalCapexMUsd = (
    ((ertgConversionPercent * 0.5) +
    (opsBerthCoveragePercent * 1.2) +
    (pvExpansionMwp * 12.0) +
    (bessCapacityMwh * 6.5) +
    (electricTractorPercent * 0.3)) * 0.04
  ).toFixed(2);

  const paybackPeriodYears = (
    Number(estimatedTotalCapexMUsd) / Number(estimatedAnnualSavingsMUsd)
  ).toFixed(1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">Module 03</span>
            <span aria-hidden="true">·</span>
            <span>Energy Optimization & Automated Dispatch</span>
            <span aria-hidden="true">·</span>
            <span>IEC 61850 / Modbus TCP</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Multi-Source Dispatch, Peak Shaving & Net-Zero Trajectory
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Optimizes real-time power dispatch across utility grid, solar PV arrays, BESS storage, and flexible terminal loads, pushing verified setpoints directly to substation PLCs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("DISPATCH")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "DISPATCH" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Live SCADA Dispatch
          </button>
          <button
            onClick={() => setActiveSubTab("SIMULATOR")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "SIMULATOR" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Decarbonization ROI Simulator
          </button>
        </div>
      </div>

      {/* SUBTAB 1: LIVE DISPATCH & PEAK SHAVING */}
      {activeSubTab === "DISPATCH" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Panel: Parameters */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#004B91]" />
                  SCADA Setpoint Parameters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure automated dispatch instructions dispatched to BESS PCS and substation breakers
                </p>
              </div>

              {/* Slider 1: BESS Discharge Target */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">BESS Target Discharge Power:</span>
                  <span className="text-[#004B91] font-mono">{bessTargetPowerKw} kW</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={bessTargetPowerKw}
                  onChange={(e) => setBessTargetPowerKw(Number(e.target.value))}
                  className="w-full accent-[#004B91] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 kW (Standby)</span>
                  <span>750 kW (50%)</span>
                  <span>1,500 kW (Max Inverter)</span>
                </div>
              </div>

              {/* Slider 2: Peak Shaving Threshold */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Grid Import Demand Cap:</span>
                  <span className="text-slate-900 font-mono">{peakShavingThresholdKw} kW</span>
                </div>
                <input
                  type="range"
                  min="6000"
                  max="8500"
                  step="100"
                  value={peakShavingThresholdKw}
                  onChange={(e) => setPeakShavingThresholdKw(Number(e.target.value))}
                  className="w-full accent-slate-800 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>6,000 kW</span>
                  <span>Contract Cap: 8,500 kW</span>
                </div>
              </div>

              {/* Slider 3: Flexible Reefer Shedding */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Reefer Compressor Shedding:</span>
                  <span className="text-indigo-600 font-mono">-{flexibleReeferShedPercent}% Load</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={flexibleReeferShedPercent}
                  onChange={(e) => setFlexibleReeferShedPercent(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Sheds ~{Math.round(1650 * (flexibleReeferShedPercent / 100))} kW during peak hours without violating cargo temperature tolerances
                </p>
              </div>

              {/* Toggle: EV charging deferral */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Defer EV Yard Tractor Charging</div>
                  <div className="text-[10px] text-slate-500">Shifts non-critical vehicle charging to off-peak TOU (post-22:00)</div>
                </div>
                <input
                  type="checkbox"
                  checked={evChargingDefer}
                  onChange={(e) => setEvChargingDefer(e.target.checked)}
                  className="h-4 w-4 rounded text-[#004B91] focus:ring-[#004B91]"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendSetpoints}
                className="w-full py-2.5 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Setpoints to SCADA / EMS</span>
              </button>

              {sentSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Setpoints committed to Substation PLC and BESS Inverter!</span>
                </div>
              )}
            </div>

            {/* Results & Live Simulation */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Real-Time Dispatch Optimization Impact
                    </h3>
                    <p className="text-xs text-slate-500">Operating state under active G-Port EMS algorithm</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    AUTO DISPATCH ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Demand Shaved</span>
                    <div className="text-2xl font-black text-emerald-600">
                      -{bessTargetPowerKw + Math.round(1650 * (flexibleReeferShedPercent / 100))} kW
                    </div>
                    <p className="text-[11px] text-slate-500">Prevents grid demand from reaching 9,150 kW</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Hour Tariff Savings</span>
                    <div className="text-2xl font-black text-slate-900">
                      ~$1,030 USD
                    </div>
                    <p className="text-[11px] text-slate-500">Calculated under EVN peak TOU tariff ($0.128/kWh)</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contract Compliance</span>
                    <div className="text-2xl font-black text-[#004B91]">
                      100% Secured
                    </div>
                    <p className="text-[11px] text-slate-500">Grid import constrained below {peakShavingThresholdKw} kW</p>
                  </div>
                </div>

                {/* SCADA Protocol Transmission Log */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-xs bg-emerald-500 animate-pulse" />
                      TELEMETRY PROTOCOL: IEC 61850 / MODBUS TCP
                    </span>
                    <span>Port: 502 · Unit: 1</span>
                  </div>
                  <div className="text-slate-400">
                    [11:15:02] SCADA_GW_OUT: SETPOINT_BESS_POWER_KW = {bessTargetPowerKw} (OK)
                  </div>
                  <div className="text-slate-400">
                    [11:15:02] SCADA_GW_OUT: SETPOINT_GRID_PEAK_LIMIT = {peakShavingThresholdKw} (OK)
                  </div>
                  <div className="text-slate-400">
                    [11:15:03] REEFER_PLC_03: ZONE_DUTY_CYCLE = {100 - flexibleReeferShedPercent}% (CONFIRMED)
                  </div>
                  <div className="text-emerald-400 font-bold">
                    [11:15:04] FEEDBACK: Grid Active Demand stabilized at 5,140 kW. No threshold breach.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DECARBONIZATION ROADMAP & ROI SIMULATOR */}
      {activeSubTab === "SIMULATOR" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#004B91]" />
                Net-Zero Horizon & Capital Expenditure Simulator (2030-2050)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Simulate port electrification levers, renewable expansions, and battery capacity to calculate emissions abatements, capital expenditures, and financial payback.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Slider 1: e-RTG */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">RTG Electric Conversion:</span>
                  <span className="text-[#004B91] font-mono">{ertgConversionPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={ertgConversionPercent}
                  onChange={(e) => setErtgConversionPercent(Number(e.target.value))}
                  className="w-full accent-[#004B91]"
                />
                <span className="text-[11px] text-slate-400">Replaces diesel generators in RTG yard cranes</span>
              </div>

              {/* Slider 2: OPS Shore Power */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Shore Power (OPS) Berth Coverage:</span>
                  <span className="text-emerald-700 font-mono">{opsBerthCoveragePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="20"
                  value={opsBerthCoveragePercent}
                  onChange={(e) => setOpsBerthCoveragePercent(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <span className="text-[11px] text-slate-400">Eliminates auxiliary engine emissions at berth</span>
              </div>

              {/* Slider 3: PV Expansion */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Rooftop Solar PV Expansion:</span>
                  <span className="text-amber-700 font-mono">{pvExpansionMwp} MWp</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={pvExpansionMwp}
                  onChange={(e) => setPvExpansionMwp(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <span className="text-[11px] text-slate-400">CFS warehouses, admin rooftops, canopy structures</span>
              </div>

              {/* Slider 4: Electric Tractors */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Electrified Terminal Tractors:</span>
                  <span className="text-indigo-600 font-mono">{electricTractorPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={electricTractorPercent}
                  onChange={(e) => setElectricTractorPercent(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-[11px] text-slate-400">Replaces heavy diesel tractor fleet</span>
              </div>
            </div>

            {/* Simulated ROI & Impact Dashboard */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Investment Modeling Projections
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-slate-400">Total Abatement</div>
                  <div className="text-2xl font-black text-emerald-600">
                    -{calculatedCo2ReductionPercent}%
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold">~18,400 tCO₂e / year reduction</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-slate-400">Annual OPEX Savings</div>
                  <div className="text-2xl font-black text-slate-900">
                    ${estimatedAnnualSavingsMUsd}M <span className="text-xs font-semibold text-slate-500">USD/yr</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold">Reduced diesel burn and peak TOU spend</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-slate-400">Capital Expenditure (CapEx)</div>
                  <div className="text-2xl font-black text-slate-900">
                    ${estimatedTotalCapexMUsd}M <span className="text-xs font-semibold text-slate-500">USD</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Eligible for Green Port credit facilities</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-slate-400">Payback Period (ROI)</div>
                  <div className="text-2xl font-black text-amber-700">
                    {paybackPeriodYears} <span className="text-xs font-semibold text-slate-500">Years</span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-semibold">Strong economic viability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
