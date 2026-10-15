import React, { useState } from "react";
import { 
  BarChart3, 
  Clock, 
  Activity, 
  Truck, 
  Zap, 
  Navigation, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Info
} from "lucide-react";
import { SubPageId } from "../../types/gport";
import { CheEventDetailModal } from "./CheEventDetailModal";

export interface CheAnalyticsViewProps {
  onNavigate?: (page: SubPageId) => void;
}

// Authentic CHE Event colors matching Image 2
export const CHE_EVENT_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  CONGESTION: { label: "CONGESTION", color: "#0284c7", bg: "bg-sky-600" },
  IDLE: { label: "IDLE", color: "#f97316", bg: "bg-orange-500" },
  MOVE: { label: "MOVE", color: "#22c55e", bg: "bg-emerald-500" },
  PICK: { label: "PICK", color: "#ef4444", bg: "bg-red-500" },
  PLACE: { label: "PLACE", color: "#8b5cf6", bg: "bg-purple-500" },
  RE_ROUTE: { label: "RE-ROUTE", color: "#b45309", bg: "bg-amber-700" },
  RTG: { label: "RTG", color: "#ec4899", bg: "bg-pink-500" },
  WAIT: { label: "WAIT", color: "#64748b", bg: "bg-slate-500" }
};

// Data directly extracted from Image 2 top chart
const CHE_EVENT_DATA = [
  {
    hour: "09:00",
    events: {
      CONGESTION: 4,
      IDLE: 2,
      MOVE: 10,
      PICK: 8,
      PLACE: 5,
      RE_ROUTE: 6,
      RTG: 1,
      WAIT: 4
    },
    totalPowerKw: 2840
  },
  {
    hour: "10:00",
    events: {
      CONGESTION: 4,
      IDLE: 2,
      MOVE: 9,
      PICK: 8,
      PLACE: 5,
      RE_ROUTE: 4,
      RTG: 1,
      WAIT: 4
    },
    totalPowerKw: 2710
  },
  {
    hour: "11:00",
    events: {
      CONGESTION: 4,
      IDLE: 1,
      MOVE: 9,
      PICK: 9,
      PLACE: 6,
      RE_ROUTE: 6,
      RTG: 1,
      WAIT: 4
    },
    totalPowerKw: 2950
  },
  {
    hour: "12:00",
    events: {
      CONGESTION: 4,
      IDLE: 1,
      MOVE: 9,
      PICK: 5,
      PLACE: 5,
      RE_ROUTE: 6,
      RTG: 1,
      WAIT: 5
    },
    totalPowerKw: 2620
  }
];

// Sub-chart data matching Image 2
const CHE_SOLUTION_DATA = [
  { hour: "09:00", reAssign: 2, reLocation: 6, rePlan: 3 },
  { hour: "10:00", reAssign: 2, reLocation: 6, rePlan: 3 },
  { hour: "11:00", reAssign: 2, reLocation: 4, rePlan: 3 },
  { hour: "12:00", reAssign: 2, reLocation: 6, rePlan: 6 }
];

const CHE_MOTYPE_DATA = [
  { hour: "09:00", disch: 26, load: 17 },
  { hour: "10:00", disch: 23, load: 17 },
  { hour: "11:00", disch: 23, load: 18 },
  { hour: "12:00", disch: 20, load: 17 }
];

const CHE_VESSEL_DATA = [
  { hour: "09:00", all: 2, man: 4, msc: 34 },
  { hour: "10:00", all: 7, man: 2, msc: 28 },
  { hour: "11:00", all: 6, man: 6, msc: 28 },
  { hour: "12:00", all: 1, man: 8, msc: 27 }
];

export const CheAnalyticsView: React.FC<CheAnalyticsViewProps> = ({ onNavigate }) => {
  const [selectedHour, setSelectedHour] = useState<string>("09:00");
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [activeEventDetail, setActiveEventDetail] = useState<{ eventKey: string; hour: string } | null>(null);

  const activeHourData = CHE_EVENT_DATA.find(d => d.hour === selectedHour) || CHE_EVENT_DATA[0];

  return (
    <div className="space-y-4">
      {/* ================================================================== */}
      {/* 1. TOP MAIN CHART: CHE COUNT BY EVENT (MATCHING IMAGE 2 TOP CHART) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                CHE TELEMETRY
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                CHE Count by EVENT (Phân loại Sự kiện Thiết bị Nâng hạ & Xe đầu kéo)
              </h2>
            </div>
          </div>

          {/* Event Legend Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold font-mono">
            {Object.entries(CHE_EVENT_COLORS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setActiveEventDetail({ eventKey: key, hour: selectedHour })}
                onMouseEnter={() => setHoveredEvent(key)}
                onMouseLeave={() => setHoveredEvent(null)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  hoveredEvent === key ? "bg-slate-100 border-slate-400 font-black scale-105" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title={`Click to open telemetry audit for ${item.label}`}
              >
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SVG Multi-Hour Grouped Bar Chart */}
        <div className="mt-4">
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="min-w-[700px] h-[220px] relative">
              <svg viewBox="0 0 800 220" className="w-full h-full">
                {/* Horizontal Grid lines */}
                {[0, 2, 4, 6, 8, 10].map((val) => {
                  const y = 180 - (val / 10) * 150;
                  return (
                    <g key={val}>
                      <line x1="40" y1={y} x2="780" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      <text x="30" y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Baseline */}
                <line x1="40" y1="180" x2="780" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Grouped Bars per Hour */}
                {CHE_EVENT_DATA.map((hData, gIdx) => {
                  const groupX = 80 + gIdx * 175;
                  const eventKeys = Object.keys(hData.events);
                  const barWidth = 14;

                  return (
                    <g key={hData.hour}>
                      {/* Hour Group Bracket / Label */}
                      <text x={groupX + 56} y="200" fill="#334155" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {hData.hour}
                      </text>

                      {/* Individual Bars for each event */}
                      {eventKeys.map((evKey, bIdx) => {
                        const val = (hData.events as any)[evKey] as number;
                        const barH = (val / 10) * 150;
                        const barX = groupX + bIdx * (barWidth + 2);
                        const barY = 180 - barH;
                        const evColor = (CHE_EVENT_COLORS as any)[evKey]?.color || "#94a3b8";
                        const isHovered = hoveredEvent === evKey;

                        return (
                          <g 
                            key={evKey}
                            className="cursor-pointer"
                            onClick={() => setActiveEventDetail({ eventKey: evKey, hour: hData.hour })}
                            onMouseEnter={() => setHoveredEvent(evKey)}
                            onMouseLeave={() => setHoveredEvent(null)}
                          >
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={barH}
                              fill={evColor}
                              rx="2"
                              opacity={hoveredEvent && !isHovered ? 0.35 : 1}
                              className="transition-all hover:brightness-110"
                            />
                            {/* Value label over bar */}
                            <text
                              x={barX + barWidth / 2}
                              y={barY - 4}
                              fill="#475569"
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <div className="text-center font-mono text-[10px] text-slate-400 mt-1">
            Time (in hour) · Cat Lai Shift Cycle · Click any bar or legend item to view detailed machine telemetry
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. SUB-CHARTS GRID (MATCHING IMAGE 2 LOWER PANELS) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* SUB-CHART 1: CHE by SOLUTION (RE-ASSIGN, RE-LOCATION, RE-PLAN) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-800">CHE Count by SOLUTION</span>
            <span className="text-[10px] font-mono text-slate-400">Optimization Solvers</span>
          </div>

          <div className="h-36 flex items-end justify-between px-2 pt-4">
            {CHE_SOLUTION_DATA.map((d) => (
              <div key={d.hour} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-1 h-24">
                  <div className="w-2.5 bg-blue-600 rounded-t" style={{ height: `${(d.reAssign / 8) * 100}%` }} title={`Re-Assign: ${d.reAssign}`} />
                  <div className="w-2.5 bg-orange-500 rounded-t" style={{ height: `${(d.reLocation / 8) * 100}%` }} title={`Re-Location: ${d.reLocation}`} />
                  <div className="w-2.5 bg-emerald-500 rounded-t" style={{ height: `${(d.rePlan / 8) * 100}%` }} title={`Re-Plan: ${d.rePlan}`} />
                </div>
                <span className="text-[10px] font-mono text-slate-500">{d.hour}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-blue-600 font-bold"><span className="w-2 h-2 bg-blue-600 rounded-xs" /> RE-ASSIGN</span>
            <span className="flex items-center gap-1 text-orange-600 font-bold"><span className="w-2 h-2 bg-orange-500 rounded-xs" /> RE-LOCATION</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 bg-emerald-500 rounded-xs" /> RE-PLAN</span>
          </div>
        </div>

        {/* SUB-CHART 2: CHE by MO-TYPE (DISCHARGE VS LOAD) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-800">CHE Count by MO-TYPE</span>
            <span className="text-[10px] font-mono text-slate-400">Move Order Direction</span>
          </div>

          <div className="h-36 flex items-end justify-between px-2 pt-4">
            {CHE_MOTYPE_DATA.map((d) => (
              <div key={d.hour} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-1.5 h-24">
                  <div className="w-4 bg-sky-600 rounded-t text-white text-[8px] flex items-center justify-center font-bold" style={{ height: `${(d.disch / 30) * 100}%` }}>
                    {d.disch}
                  </div>
                  <div className="w-4 bg-amber-500 rounded-t text-white text-[8px] flex items-center justify-center font-bold" style={{ height: `${(d.load / 30) * 100}%` }}>
                    {d.load}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{d.hour}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-100 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-sky-600 font-bold"><span className="w-2 h-2 bg-sky-600 rounded-xs" /> DISCHARGE</span>
            <span className="flex items-center gap-1 text-amber-600 font-bold"><span className="w-2 h-2 bg-amber-500 rounded-xs" /> LOAD</span>
          </div>
        </div>

        {/* SUB-CHART 3: CHE by VESSEL */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-800">CHE Count by VESSEL</span>
            <span className="text-[10px] font-mono text-slate-400">Vessel Workload Allocation</span>
          </div>

          <div className="h-36 flex items-end justify-between px-2 pt-4">
            {CHE_VESSEL_DATA.map((d) => (
              <div key={d.hour} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-1 h-24">
                  <div className="w-3 bg-blue-600 rounded-t text-white text-[7px] flex items-center justify-center" style={{ height: `${(d.all / 35) * 100}%` }}>
                    {d.all}
                  </div>
                  <div className="w-3 bg-amber-500 rounded-t text-white text-[7px] flex items-center justify-center" style={{ height: `${(d.man / 35) * 100}%` }}>
                    {d.man}
                  </div>
                  <div className="w-3 bg-emerald-600 rounded-t text-white text-[7px] flex items-center justify-center" style={{ height: `${(d.msc / 35) * 100}%` }}>
                    {d.msc}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{d.hour}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-blue-600 font-bold"><span className="w-2 h-2 bg-blue-600 rounded-xs" /> CALF</span>
            <span className="flex items-center gap-1 text-amber-600 font-bold"><span className="w-2 h-2 bg-amber-500 rounded-xs" /> MAN</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 bg-emerald-600 rounded-xs" /> MSC</span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. SCADA MICROGRID FEEDER ENERGY LINK (CONNECTING CHE TO POWER) */}
      {/* ================================================================== */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>SCADA FEEDER ELECTRICAL DISPATCH CORRELATION</span>
            </div>
            <h4 className="text-sm sm:text-base font-black tracking-tight">
              Real-time Substation 110kV Demand Driven by CHE Event Matrix
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] text-sky-300 font-mono block">F01 Quay Cranes (5 STS)</span>
              <strong className="text-sm font-black text-white font-mono">2,180 kW</strong>
              <span className="text-[9px] text-emerald-300 block">58 A · cosφ 0.94</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] text-sky-300 font-mono block">F02 Yard e-RTGs (12 Cranes)</span>
              <strong className="text-sm font-black text-white font-mono">890 kW</strong>
              <span className="text-[9px] text-emerald-300 block">24 A · cosφ 0.92</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/15 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-sky-300 font-mono block">e-Haulier Fast Chargers</span>
              <strong className="text-sm font-black text-white font-mono">420 kW</strong>
              <span className="text-[9px] text-amber-300 block">6 DC Racks Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* CHE EVENT AUDIT DETAIL MODAL */}
      {/* ================================================================== */}
      {activeEventDetail && (
        <CheEventDetailModal
          eventKey={activeEventDetail.eventKey}
          hour={activeEventDetail.hour}
          onClose={() => setActiveEventDetail(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
