import React, { useState } from "react";
import { 
  X, 
  Zap, 
  Activity, 
  Clock, 
  Ship, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  Gauge, 
  Cpu, 
  Download, 
  RotateCcw, 
  Sliders, 
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react";
import { SubPageId } from "../../types/gport";

interface CraneTelemetryDetailModalProps {
  craneId: string;
  onClose: () => void;
  onNavigate?: (page: SubPageId) => void;
  vesselName?: string;
}

export const CraneTelemetryDetailModal: React.FC<CraneTelemetryDetailModalProps> = ({
  craneId,
  onClose,
  onNavigate,
  vesselName = "MV CALF-250901"
}) => {
  const [activeTab, setActiveTab] = useState<"SCADA_POWER" | "BAY_MOVES" | "REGEN_ENERGY" | "SPECS">("SCADA_POWER");
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [exportedNotice, setExportedNotice] = useState(false);

  // Crane profiles
  const craneProfiles: Record<string, {
    name: string;
    model: string;
    moves: number;
    color: string;
    ratedKw: number;
    currentKw: number;
    currentAmps: number;
    voltageKv: number;
    cosPhi: number;
    regenKw: number;
    regenTotalKwh: number;
    totalKwh: number;
    operator: string;
    assignedBays: string[];
    grossMph: number;
  }> = {
    S01: {
      name: "Quayside STS #01 (Feeder STS)",
      model: "ZPMC High-Speed Panamax Quayside Gantry",
      moves: 402,
      color: "#eab308",
      ratedKw: 750,
      currentKw: 430,
      currentAmps: 58.2,
      voltageKv: 22.0,
      cosPhi: 0.94,
      regenKw: 110,
      regenTotalKwh: 342,
      totalKwh: 1125,
      operator: "Nguyen Van A (QCO Grade 1 - Shift 3)",
      assignedBays: ["03", "07", "15", "23"],
      grossMph: 28.5
    },
    S02: {
      name: "Quayside STS #02 (Dual-Trolley STS)",
      model: "Mitsui-Paceco Dual-Trolley Super Post-Panamax",
      moves: 341,
      color: "#f97316",
      ratedKw: 820,
      currentKw: 490,
      currentAmps: 64.1,
      voltageKv: 22.0,
      cosPhi: 0.95,
      regenKw: 145,
      regenTotalKwh: 418,
      totalKwh: 1280,
      operator: "Tran Dinh B (QCO Grade 1 - Shift 3)",
      assignedBays: ["31", "35"],
      grossMph: 27.2
    },
    S03: {
      name: "Quayside STS #03 (Panamax High-Speed)",
      model: "Liebherr P124L Quayside Container Gantry",
      moves: 358,
      color: "#22c55e",
      ratedKw: 780,
      currentKw: 460,
      currentAmps: 61.0,
      voltageKv: 22.0,
      cosPhi: 0.93,
      regenKw: 125,
      regenTotalKwh: 390,
      totalKwh: 1190,
      operator: "Pham Minh C (QCO Senior Master)",
      assignedBays: ["43", "51", "55", "63", "67"],
      grossMph: 30.1
    },
    S04: {
      name: "Quayside STS #04 (Super Post-Panamax)",
      model: "ZPMC Super Post-Panamax Twin-Lift 65T",
      moves: 443,
      color: "#06b6d4",
      ratedKw: 950,
      currentKw: 580,
      currentAmps: 76.4,
      voltageKv: 22.0,
      cosPhi: 0.96,
      regenKw: 190,
      regenTotalKwh: 530,
      totalKwh: 1540,
      operator: "Le Hoang D (QCO Lead Instructor)",
      assignedBays: ["75", "79", "83", "87"],
      grossMph: 32.4
    },
    S05: {
      name: "Quayside STS #05 (Post-Panamax)",
      model: "Konecranes Noell Post-Panamax STS",
      moves: 411,
      color: "#8b5cf6",
      ratedKw: 880,
      currentKw: 520,
      currentAmps: 68.8,
      voltageKv: 22.0,
      cosPhi: 0.95,
      regenKw: 160,
      regenTotalKwh: 475,
      totalKwh: 1395,
      operator: "Vo Thanh E (QCO Grade 1 - Shift 3)",
      assignedBays: ["23", "31", "55"],
      grossMph: 29.8
    }
  };

  const currentCrane = craneProfiles[craneId] || craneProfiles.S04;

  // 12-hour hourly telemetry profile for this crane
  const hourlyData = [
    { hour: "20:00", powerKw: 410, regenKw: 95, currentA: 55, moves: 28 },
    { hour: "21:00", powerKw: 520, regenKw: 140, currentA: 68, moves: 34 },
    { hour: "22:00", powerKw: 580, regenKw: 180, currentA: 76, moves: 36 },
    { hour: "23:00", powerKw: 490, regenKw: 130, currentA: 64, moves: 31 },
    { hour: "00:00", powerKw: 340, regenKw: 80, currentA: 45, moves: 22 },
    { hour: "01:00", powerKw: 510, regenKw: 150, currentA: 67, moves: 33 },
    { hour: "02:00", powerKw: 560, regenKw: 175, currentA: 73, moves: 35 },
    { hour: "03:00", powerKw: 540, regenKw: 160, currentA: 71, moves: 34 },
    { hour: "04:00", powerKw: 480, regenKw: 120, currentA: 63, moves: 30 },
    { hour: "05:00", powerKw: 530, regenKw: 155, currentA: 69, moves: 33 },
    { hour: "06:00", powerKw: 590, regenKw: 190, currentA: 77, moves: 37 },
    { hour: "07:00", powerKw: 440, regenKw: 110, currentA: 58, moves: 28 }
  ];

  const handleExport = () => {
    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* ================================================================== */}
        {/* 1. MODAL TOP HEADER */}
        {/* ================================================================== */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-white text-base shadow-sm"
              style={{ backgroundColor: currentCrane.color }}
            >
              {craneId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                  QUAYSIDE STS CRANE TELEMETRY
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  ● IEC 61850 ONLINE
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{currentCrane.name}</span>
                <span className="text-xs text-slate-300 font-normal hidden sm:inline">
                  · Berth 02 · {vesselName}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportedNotice ? "Exported!" : "Export Telemetry"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 2. LIVE KPI SUMMARY BAR */}
        {/* ================================================================== */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/90 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Power Draw</span>
            <strong className="text-sm font-black text-slate-900">{currentCrane.currentKw} kW</strong>
            <span className="text-[10px] text-slate-500 block">Rated: {currentCrane.ratedKw} kW</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Moves</span>
            <strong className="text-sm font-black text-[#004B91]">{currentCrane.moves} TEU</strong>
            <span className="text-[10px] text-emerald-600 block">GMPH: {currentCrane.grossMph}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Regenerative Recovery</span>
            <strong className="text-sm font-black text-emerald-600">+{currentCrane.regenKw} kW</strong>
            <span className="text-[10px] text-emerald-700 block">Total: {currentCrane.regenTotalKwh} kWh</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Substation Line</span>
            <strong className="text-sm font-black text-slate-900">{currentCrane.voltageKv} kV</strong>
            <span className="text-[10px] text-slate-500 block">{currentCrane.currentAmps} A · cosφ {currentCrane.cosPhi}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Energy Intensity</span>
            <strong className="text-sm font-black text-blue-700">
              {(currentCrane.totalKwh / currentCrane.moves).toFixed(2)} kWh/move
            </strong>
            <span className="text-[10px] text-slate-500 block">Total: {currentCrane.totalKwh.toLocaleString()} kWh</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. NAVIGATION TABS */}
        {/* ================================================================== */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setActiveTab("SCADA_POWER")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors whitespace-nowrap ${
              activeTab === "SCADA_POWER"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>SCADA Electrical Waveform</span>
          </button>

          <button
            onClick={() => setActiveTab("BAY_MOVES")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors whitespace-nowrap ${
              activeTab === "BAY_MOVES"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vessel Bay Workload & Productivity</span>
          </button>

          <button
            onClick={() => setActiveTab("REGEN_ENERGY")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors whitespace-nowrap ${
              activeTab === "REGEN_ENERGY"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Regenerative Braking Power</span>
          </button>

          <button
            onClick={() => setActiveTab("SPECS")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors whitespace-nowrap ${
              activeTab === "SPECS"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Technical Specifications</span>
          </button>
        </div>

        {/* ================================================================== */}
        {/* 4. MODAL BODY (SCROLLABLE) */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: SCADA ELECTRICAL WAVEFORM & LOAD CURVE */}
          {activeTab === "SCADA_POWER" && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-sky-300">22kV Feeder F01 Telemetry Trace (12-Hour Shift)</span>
                  </div>
                  <span className="text-slate-400">Sampling Rate: 1000ms (IEC 61850 Goose)</span>
                </div>

                {/* SVG Power Curve */}
                <div className="h-48 w-full relative">
                  <svg viewBox="0 0 760 180" className="w-full h-full">
                    {/* Grid lines */}
                    {[0, 200, 400, 600, 800].map((kw) => {
                      const y = 160 - (kw / 800) * 140;
                      return (
                        <g key={kw}>
                          <line x1="40" y1={y} x2="740" y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                          <text x="32" y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                            {kw}kW
                          </text>
                        </g>
                      );
                    })}

                    {/* Area Gradient under curve */}
                    <defs>
                      <linearGradient id="cranePowerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={currentCrane.color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={currentCrane.color} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Polyline & Polygon */}
                    {(() => {
                      const points = hourlyData.map((d, idx) => {
                        const x = 50 + idx * 60;
                        const y = 160 - (d.powerKw / 800) * 140;
                        return `${x},${y}`;
                      }).join(" ");
                      const areaPoints = `50,160 ${points} ${50 + (hourlyData.length - 1) * 60},160`;
                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#cranePowerGrad)" />
                          <polyline points={points} fill="none" stroke={currentCrane.color} strokeWidth="2.5" />
                        </>
                      );
                    })()}

                    {/* Data Points */}
                    {hourlyData.map((d, idx) => {
                      const x = 50 + idx * 60;
                      const y = 160 - (d.powerKw / 800) * 140;
                      const isHovered = hoveredHour === idx;
                      return (
                        <g 
                          key={idx}
                          onMouseEnter={() => setHoveredHour(idx)}
                          onMouseLeave={() => setHoveredHour(null)}
                          className="cursor-pointer"
                        >
                          <circle cx={x} cy={y} r={isHovered ? 5 : 3.5} fill="#ffffff" stroke={currentCrane.color} strokeWidth="2" />
                          <text x={x} y="174" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                            {d.hour}
                          </text>
                          {isHovered && (
                            <g>
                              <rect x={x - 30} y={y - 25} width="60" height="18" rx="3" fill="#0f172a" stroke="#38bdf8" />
                              <text x={x} y={y - 13} fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                {d.powerKw} kW
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Power Quality Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Harmonic Distortion</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">THD-I: 2.4%</strong>
                  <span className="text-[10px] text-emerald-600 block">IEEE 519 Compliant (&lt;5%)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Power Factor (cosφ)</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">{currentCrane.cosPhi} Lagging</strong>
                  <span className="text-[10px] text-emerald-600 block">Zero EVN penalty</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Motor Inverter DC Bus</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">680 V DC</strong>
                  <span className="text-[10px] text-blue-600 block">AFE Regenerative Drive</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BAY MOVES ALLOCATION */}
          {activeTab === "BAY_MOVES" && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="text-xs font-mono font-bold text-slate-500 mb-2">
                  Assigned Bays on {vesselName}:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentCrane.assignedBays.map(bay => (
                    <div key={bay} className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-mono text-xs font-bold text-[#004B91] shadow-2xs">
                      Bay {bay}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <span className="text-[10px] font-mono text-blue-700 font-bold uppercase">Workload Distribution</span>
                  <div className="text-sm font-black text-slate-900">{currentCrane.moves} Total Moves</div>
                  <p className="text-slate-600 text-xs">
                    65% Discharge moves (Inbound containers to yard blocks) · 35% Export loading.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase">Operator & Shift Roster</span>
                  <div className="text-sm font-black text-slate-900">{currentCrane.operator}</div>
                  <p className="text-slate-600 text-xs">
                    Certified for Twin-Lift & Hazardous Cargo Lifts. Zero safety infractions recorded.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REGENERATIVE BRAKING & MICROGRID BENEFIT */}
          {activeTab === "REGEN_ENERGY" && (
            <div className="space-y-4 text-xs">
              <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>CRANE REGENERATIVE HOIST DRIVE (AFE TECHNOLOGY)</span>
                </div>
                <h3 className="text-base font-black">
                  When lowering loaded 40-foot containers into holds or onto chassis, the hoist motor acts as a generator.
                </h3>
                <p className="text-emerald-100/80 text-xs">
                  This crane has fed back <strong>{currentCrane.regenTotalKwh} kWh</strong> directly into the Cat Lai 22kV Microgrid Busbar, offsetting power required by nearby e-RTGs and Reefers!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Peak Regenerated Power</span>
                  <strong className="text-sm font-black text-emerald-600 font-mono">-{currentCrane.regenKw} kW</strong>
                  <span className="text-[10px] text-slate-500 block">During lowering cycle</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Energy Cost Offset</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">
                    ~{(currentCrane.regenTotalKwh * 2500).toLocaleString()} VND
                  </strong>
                  <span className="text-[10px] text-emerald-600 block">EVN Normal tariff rate</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Avoided Emissions</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">
                    {(currentCrane.regenTotalKwh * 0.7221).toFixed(1)} kgCO2e
                  </strong>
                  <span className="text-[10px] text-emerald-600 block">ISO 14064 MRV credited</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICAL SPECS */}
          {activeTab === "SPECS" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Outreach</span>
                  <strong className="text-sm font-black text-slate-900">52.0 m</strong>
                  <span className="text-[10px] text-slate-500 block">Up to 18 rows across</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Backreach</span>
                  <strong className="text-sm font-black text-slate-900">15.0 m</strong>
                  <span className="text-[10px] text-slate-500 block">Landside buffer</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Safe Working Load</span>
                  <strong className="text-sm font-black text-slate-900">65.0 Tonnes</strong>
                  <span className="text-[10px] text-slate-500 block">Twin-lift spreader</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono block">Hoist Speed</span>
                  <strong className="text-sm font-black text-slate-900">90 / 180 m/min</strong>
                  <span className="text-[10px] text-slate-500 block">Loaded / Empty</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-300 font-mono space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Safety & Interlock Telemetry:</div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Anemometer Wind Limit: 12 m/s (Current: 4.2 m/s - Safe)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Spreader Twistlock Interlock: Engaged & Verified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Anti-Sway Laser Profiler: Active (0.2° Deviation)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* 5. MODAL FOOTER & CROSS-SCHEDULE LINKS */}
        {/* ================================================================== */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-bold text-slate-700">Quick Navigation:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate("VESSEL_SCHEDULE");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#004B91] hover:bg-blue-50 font-bold transition-colors shadow-2xs"
                >
                  <Ship className="w-3.5 h-3.5 text-blue-600" />
                  <span>Berth Schedule</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate("MODULE_3_OPTIMIZATION");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-amber-700 hover:bg-amber-50 font-bold transition-colors shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Peak Shaving & BESS</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate("VESSEL_CARBON_INVOICE");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 font-bold transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Carbon Invoice</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
