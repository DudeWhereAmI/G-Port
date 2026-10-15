import React, { useState } from "react";
import { 
  X, 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Layers, 
  Cpu, 
  Download, 
  Sliders, 
  CheckCircle2, 
  TrendingUp, 
  RotateCcw,
  Sparkles
} from "lucide-react";
import { SubPageId, ElectricityTariffTou } from "../../types/gport";

interface FeederDetailModalProps {
  feederId: string;
  onClose: () => void;
  onNavigate?: (page: SubPageId) => void;
  tariff?: ElectricityTariffTou;
}

export const FeederDetailModal: React.FC<FeederDetailModalProps> = ({
  feederId,
  onClose,
  onNavigate,
  tariff
}) => {
  const [activeTab, setActiveTab] = useState<"SLD_DIAGRAM" | "LOAD_CURVE" | "PROTECTION_RELAYS" | "TARIFF_COST">("SLD_DIAGRAM");

  const feederDetails: Record<string, {
    name: string;
    substation: string;
    voltageKv: number;
    currentA: number;
    powerKw: number;
    powerKva: number;
    cosPhi: number;
    thdV: number;
    thdI: number;
    frequencyHz: number;
    ctRatio: string;
    breakerType: string;
    status: string;
    tripRelays: string[];
    connectedAssets: string[];
  }> = {
    F01: {
      name: "Quayside STS Cranes (5 STS)",
      substation: "Substation 110kV/22kV - Trạm Biến Áp Cát Lái",
      voltageKv: 22.0,
      currentA: 58.4,
      powerKw: 2180,
      powerKva: 2320,
      cosPhi: 0.94,
      thdV: 1.4,
      thdI: 2.8,
      frequencyHz: 50.02,
      ctRatio: "100/5A Class 0.5S",
      breakerType: "ABB VD4 Vacuum Circuit Breaker 24kV 1250A",
      status: "CLOSED (NORMAL)",
      tripRelays: ["ANSI 50/51 Overcurrent", "ANSI 50N/51N Earth Fault", "ANSI 87T Differential"],
      connectedAssets: ["STS Crane S01", "STS Crane S02", "STS Crane S03", "STS Crane S04", "STS Crane S05"]
    },
    F02: {
      name: "Yard e-RTG Crane Substation (Blocks 01-07)",
      substation: "Substation 22kV Yard Hub A",
      voltageKv: 22.0,
      currentA: 23.8,
      powerKw: 890,
      powerKva: 968,
      cosPhi: 0.92,
      thdV: 1.6,
      thdI: 3.1,
      frequencyHz: 50.01,
      ctRatio: "50/5A Class 0.5S",
      breakerType: "Schneider Evolis 24kV 630A VCB",
      status: "CLOSED (NORMAL)",
      tripRelays: ["ANSI 50/51 Overcurrent", "ANSI 46 Phase Unbalance"],
      connectedAssets: ["12 Electric Rubber-Tired Gantry Cranes (e-RTG)", "Yard Blocks 01 to 07"]
    },
    F03: {
      name: "Onshore Power Supply (OPS Berth 02)",
      substation: "OPS High-Voltage Shore Connection 6.6kV",
      voltageKv: 6.6,
      currentA: 82.1,
      powerKw: 920,
      powerKva: 958,
      cosPhi: 0.96,
      thdV: 1.1,
      thdI: 1.9,
      frequencyHz: 60.00,
      ctRatio: "150/5A Class 0.2S",
      breakerType: "Siemens SION 12kV 1250A VCB",
      status: "CLOSED (OPS COLD IRONING)",
      tripRelays: ["ANSI 50/51 Overcurrent", "ANSI 27/59 Under/Over Voltage", "ANSI 81 Under/Over Frequency"],
      connectedAssets: ["Vessel CALF-250901 Auxiliary Power", "OPS Shore Connection Cable Reel"]
    },
    F04: {
      name: "Reefer Monitoring Rack (Zones P1 & P3)",
      substation: "Low Voltage 0.4kV Reefer Substation",
      voltageKv: 0.4,
      currentA: 950.0,
      powerKw: 640,
      powerKva: 719,
      cosPhi: 0.89,
      thdV: 2.2,
      thdI: 4.4,
      frequencyHz: 50.02,
      ctRatio: "1200/5A Class 0.5",
      breakerType: "Schneider Masterpact NW 0.4kV 1600A ACB",
      status: "CLOSED (NORMAL)",
      tripRelays: ["Thermal-Magnetic Trip Unit Micrologic 6.0A", "Ground Fault Protection"],
      connectedAssets: ["320 Connected Reefer Sockets", "Cold Chain Temperature Alarms"]
    },
    F05: {
      name: "BESS Storage & EV Fast Charging Racks",
      substation: "Microgrid PCS Inverter Substation",
      voltageKv: 0.4,
      currentA: 620.0,
      powerKw: 420,
      powerKva: 428,
      cosPhi: 0.98,
      thdV: 1.0,
      thdI: 1.5,
      frequencyHz: 50.02,
      ctRatio: "800/5A Class 0.2S",
      breakerType: "ABB Emax2 0.4kV 1000A ACB",
      status: "CLOSED (DISCHARGING)",
      tripRelays: ["Anti-Islanding Protection IEEE 1547", "Reverse Power Relay ANSI 32"],
      connectedAssets: ["2.0 MWh BESS Battery Racks", "6 DC High-Power EV Chargers"]
    },
    F06: {
      name: "Terminal Gate & Central Admin Building",
      substation: "Auxiliary 0.4kV Distribution Hub",
      voltageKv: 0.4,
      currentA: 210.0,
      powerKw: 145,
      powerKva: 159,
      cosPhi: 0.91,
      thdV: 1.8,
      thdI: 3.2,
      frequencyHz: 50.02,
      ctRatio: "400/5A Class 1.0",
      breakerType: "Mitsubishi AE-SW 0.4kV 630A ACB",
      status: "CLOSED (NORMAL)",
      tripRelays: ["ANSI 50/51 Overcurrent", "Earth Leakage Protection"],
      connectedAssets: ["OCR Optical Gates", "Operations Room Command Wall", "Yard Mast Floodlights"]
    }
  };

  const fData = feederDetails[feederId] || feederDetails.F01;

  // 24-hour load points for feeder
  const loadPoints = [
    { time: "00:00", kw: Math.round(fData.powerKw * 0.65) },
    { time: "02:00", kw: Math.round(fData.powerKw * 0.58) },
    { time: "04:00", kw: Math.round(fData.powerKw * 0.70) },
    { time: "06:00", kw: Math.round(fData.powerKw * 0.85) },
    { time: "08:00", kw: Math.round(fData.powerKw * 0.95) },
    { time: "10:00", kw: fData.powerKw },
    { time: "12:00", kw: Math.round(fData.powerKw * 0.92) },
    { time: "14:00", kw: Math.round(fData.powerKw * 0.98) },
    { time: "16:00", kw: Math.round(fData.powerKw * 0.94) },
    { time: "18:00", kw: Math.round(fData.powerKw * 1.02) },
    { time: "20:00", kw: Math.round(fData.powerKw * 0.88) },
    { time: "22:00", kw: Math.round(fData.powerKw * 0.72) }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* ================================================================== */}
        {/* 1. TOP HEADER */}
        {/* ================================================================== */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center font-mono font-black text-slate-950 text-base shadow-sm">
              {feederId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  SUBSTATION PRIMARY FEEDER TELEMETRY
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  ● BREAKER {fData.status}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{feederId}: {fData.name}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================== */}
        {/* 2. KPI SUMMARY BAR */}
        {/* ================================================================== */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/90 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Power (P)</span>
            <strong className="text-sm font-black text-slate-900">{fData.powerKw.toLocaleString()} kW</strong>
            <span className="text-[10px] text-slate-500 block">{fData.powerKva} kVA</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Voltage & Current</span>
            <strong className="text-sm font-black text-slate-900">{fData.voltageKv} kV</strong>
            <span className="text-[10px] text-slate-500 block">{fData.currentA} A</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Power Factor (cosφ)</span>
            <strong className="text-sm font-black text-emerald-600">{fData.cosPhi}</strong>
            <span className="text-[10px] text-emerald-700 block">Optimal</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Frequency</span>
            <strong className="text-sm font-black text-slate-900">{fData.frequencyHz} Hz</strong>
            <span className="text-[10px] text-slate-500 block">Synchronized</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Harmonics (THD)</span>
            <strong className="text-sm font-black text-blue-700">{fData.thdI}% THD-I</strong>
            <span className="text-[10px] text-slate-500 block">THD-V: {fData.thdV}%</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. TABS */}
        {/* ================================================================== */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("SLD_DIAGRAM")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors ${
              activeTab === "SLD_DIAGRAM"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Single Line Diagram (SLD)</span>
          </button>

          <button
            onClick={() => setActiveTab("LOAD_CURVE")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors ${
              activeTab === "LOAD_CURVE"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>24h Load Curve Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("PROTECTION_RELAYS")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors ${
              activeTab === "PROTECTION_RELAYS"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Relay Protection & Tripping</span>
          </button>

          <button
            onClick={() => setActiveTab("TARIFF_COST")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors ${
              activeTab === "TARIFF_COST"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>EVN Tariff & Cost Impact</span>
          </button>
        </div>

        {/* ================================================================== */}
        {/* 4. CONTENT */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: SLD DIAGRAM */}
          {activeTab === "SLD_DIAGRAM" && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4 text-xs font-mono">
                  <span className="font-bold text-sky-300">Single Line Diagram · {fData.substation}</span>
                  <span className="text-slate-400">IEC 61850 Goose Architecture</span>
                </div>

                {/* SVG Single Line Diagram */}
                <div className="w-full h-44 flex items-center justify-center">
                  <svg viewBox="0 0 600 140" className="w-full h-full">
                    {/* 110kV / 22kV Busbar */}
                    <line x1="50" y1="20" x2="550" y2="20" stroke="#f59e0b" strokeWidth="4" />
                    <text x="60" y="14" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      MAIN SUBSTATION BUSBAR (22kV)
                    </text>

                    {/* Disconnector */}
                    <line x1="300" y1="20" x2="300" y2="40" stroke="#cbd5e1" strokeWidth="2" />
                    <circle cx="300" cy="40" r="3" fill="#cbd5e1" />
                    <line x1="300" y1="40" x2="308" y2="52" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="300" cy="55" r="3" fill="#cbd5e1" />

                    {/* Vacuum Circuit Breaker */}
                    <line x1="300" y1="55" x2="300" y2="70" stroke="#cbd5e1" strokeWidth="2" />
                    <rect x="288" y="70" width="24" height="24" rx="3" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
                    <text x="300" y="86" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      VCB
                    </text>

                    {/* Current Transformer */}
                    <line x1="300" y1="94" x2="300" y2="105" stroke="#cbd5e1" strokeWidth="2" />
                    <circle cx="300" cy="110" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="300" cy="116" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x="315" y="115" fill="#94a3b8" fontSize="8" fontFamily="monospace">CT {fData.ctRatio}</text>

                    {/* Outgoing Feeder Cable to Field */}
                    <line x1="300" y1="122" x2="300" y2="138" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 2" />
                  </svg>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 font-mono flex items-center justify-between">
                  <span>Circuit Breaker: <b className="text-white">{fData.breakerType}</b></span>
                  <span className="text-emerald-400 font-bold">● Telecontrol Active</span>
                </div>
              </div>

              {/* Connected Assets List */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                  Downstream Connected Electrical Assets:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {fData.connectedAssets.map((asset, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-800">{asset}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 24H LOAD CURVE */}
          {activeTab === "LOAD_CURVE" && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <span className="font-bold text-sky-300">24-Hour Active Power Profile (kW)</span>
                  <span className="text-amber-400">Peak Demand Cap: 2,500 kW</span>
                </div>

                {/* SVG Load Curve */}
                <div className="h-44 w-full relative">
                  <svg viewBox="0 0 760 160" className="w-full h-full">
                    {/* Grid */}
                    {[0, 1000, 2000, 3000].map((kw) => {
                      const y = 140 - (kw / 3000) * 120;
                      return (
                        <g key={kw}>
                          <line x1="40" y1={y} x2="740" y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                          <text x="32" y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                            {kw}kW
                          </text>
                        </g>
                      );
                    })}

                    {/* Polyline */}
                    {(() => {
                      const pts = loadPoints.map((p, idx) => {
                        const x = 50 + idx * 60;
                        const y = 140 - (p.kw / 3000) * 120;
                        return `${x},${y}`;
                      }).join(" ");
                      return <polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth="2.5" />;
                    })()}

                    {/* Points */}
                    {loadPoints.map((p, idx) => {
                      const x = 50 + idx * 60;
                      const y = 140 - (p.kw / 3000) * 120;
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={y} r="3.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
                          <text x={x} y="155" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                            {p.time}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RELAY PROTECTION */}
          {activeTab === "PROTECTION_RELAYS" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fData.tripRelays.map((relay, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">Protection Loop {idx + 1}</span>
                    <strong className="text-sm font-black text-slate-900 block">{relay}</strong>
                    <span className="text-[10px] text-emerald-600 block flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active & Armed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TARIFF COST */}
          {activeTab === "TARIFF_COST" && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">EVN Time-of-Use Electricity Cost Allocation</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Normal Hours Rate</span>
                    <strong className="text-sm font-black text-slate-900">
                      {tariff?.normalRateVnd ? `${tariff.normalRateVnd.toLocaleString()} đ/kWh` : "1,685 đ/kWh"}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Peak Hours Rate</span>
                    <strong className="text-sm font-black text-rose-600">
                      {tariff?.peakRateVnd ? `${tariff.peakRateVnd.toLocaleString()} đ/kWh` : "3,076 đ/kWh"}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Off-Peak Hours Rate</span>
                    <strong className="text-sm font-black text-emerald-600">
                      {tariff?.offPeakRateVnd ? `${tariff.offPeakRateVnd.toLocaleString()} đ/kWh` : "1,100 đ/kWh"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* 5. FOOTER & CROSS-SCHEDULE LINKS */}
        {/* ================================================================== */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-bold text-slate-700">Cross-Module Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate("MODULE_3_OPTIMIZATION");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-amber-700 hover:bg-amber-50 font-bold transition-colors shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Peak Shaving & BESS</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate("MODULE_2_MEASUREMENT");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 font-bold transition-colors shadow-2xs"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Emissions MRV (ISO 14064)</span>
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
