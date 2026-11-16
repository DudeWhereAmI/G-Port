import React, { useState } from "react";
import { 
  Truck, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Clock
} from "lucide-react";
import { SubPageId } from "../../types/gport";
import { CheEventDetailModal } from "./CheEventDetailModal";

export interface CheAnalyticsViewProps {
  onNavigate?: (page: SubPageId) => void;
}

export const CHE_EVENT_COLORS: Record<string, { label: string; plainLabel: string; description: string; color: string; bg: string; isAlert?: boolean }> = {
  CONGESTION: {
    label: "CONGESTION",
    plainLabel: "Traffic Congestion",
    description: "Trucks slowed down in busy container lanes (Block 01D & 03A)",
    color: "#d97706",
    bg: "bg-amber-600",
    isAlert: true
  },
  WAIT: {
    label: "WAIT",
    plainLabel: "Waiting at Crane",
    description: "Trucks waiting in line under Quay Cranes or Yard Cranes",
    color: "#e11d48",
    bg: "bg-rose-600",
    isAlert: true
  },
  MOVE: {
    label: "MOVE",
    plainLabel: "Driving / Hauling",
    description: "Trucks moving containers between ship berth and yard blocks",
    color: "#16a34a",
    bg: "bg-emerald-600"
  },
  PICK: {
    label: "PICK",
    plainLabel: "Lifting Container",
    description: "Cranes lifting containers from ship or yard stacks",
    color: "#0284c7",
    bg: "bg-sky-600"
  },
  PLACE: {
    label: "PLACE",
    plainLabel: "Stacking Container",
    description: "Cranes placing containers onto trucks or yard stacks",
    color: "#7c3aed",
    bg: "bg-purple-600"
  },
  RE_ROUTE: {
    label: "RE-ROUTE",
    plainLabel: "Re-Routed Around Traffic",
    description: "Vehicles directed to an alternate lane to avoid congestion",
    color: "#2563eb",
    bg: "bg-blue-600"
  },
  IDLE: {
    label: "IDLE",
    plainLabel: "Idle / Eco-Standby",
    description: "Equipment paused in low-power Eco-Standby mode (>5 mins idle)",
    color: "#64748b",
    bg: "bg-slate-500"
  },
  RTG: {
    label: "RTG",
    plainLabel: "Yard Crane Gantry Move",
    description: "e-RTG crane moving between yard bays",
    color: "#0d9488",
    bg: "bg-teal-600"
  }
};

const CHE_EVENT_DATA = [
  {
    hour: "09:00",
    events: {
      CONGESTION: 4,
      WAIT: 4,
      MOVE: 10,
      PICK: 8,
      PLACE: 5,
      RE_ROUTE: 6,
      IDLE: 2,
      RTG: 1
    },
    totalPowerKw: 2840
  },
  {
    hour: "10:00",
    events: {
      CONGESTION: 4,
      WAIT: 4,
      MOVE: 9,
      PICK: 8,
      PLACE: 5,
      RE_ROUTE: 4,
      IDLE: 2,
      RTG: 1
    },
    totalPowerKw: 2710
  },
  {
    hour: "11:00",
    events: {
      CONGESTION: 4,
      WAIT: 4,
      MOVE: 9,
      PICK: 9,
      PLACE: 6,
      RE_ROUTE: 6,
      IDLE: 1,
      RTG: 1
    },
    totalPowerKw: 2950
  },
  {
    hour: "12:00",
    events: {
      CONGESTION: 4,
      WAIT: 5,
      MOVE: 9,
      PICK: 5,
      PLACE: 5,
      RE_ROUTE: 6,
      IDLE: 1,
      RTG: 1
    },
    totalPowerKw: 2620
  }
];

export const CheAnalyticsView: React.FC<CheAnalyticsViewProps> = ({ onNavigate }) => {
  const [selectedHour, setSelectedHour] = useState<string>("09:00");
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [activeEventDetail, setActiveEventDetail] = useState<{ eventKey: string; hour: string } | null>(null);

  const activeHourData = CHE_EVENT_DATA.find(d => d.hour === selectedHour) || CHE_EVENT_DATA[0];
  const ev = activeHourData.events;
  const totalVehicles = Object.values(ev).reduce((a, b) => a + b, 0);
  const delayedCount = ev.CONGESTION + ev.WAIT;
  const workingCount = ev.MOVE + ev.PICK + ev.PLACE + ev.RE_ROUTE + ev.RTG;

  return (
    <div className="space-y-4">
      {/* ================================================================== */}
      {/* 1. HIGHLIGHTED SUMMARY CARDS FOR YARD VEHICLES & CRANES */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Highlighted Delay Alert Card */}
        <div
          onClick={() => setActiveEventDetail({ eventKey: "CONGESTION", hour: selectedHour })}
          className="bg-amber-50/80 hover:bg-amber-100/70 p-4 rounded-xl border-2 border-amber-400 shadow-2xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-amber-900 text-[11px] font-bold mb-1">
            <span>Delayed / Waiting Vehicles</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800 font-mono tabular-nums">
            {delayedCount} <span className="text-xs font-sans font-bold">Units Delayed</span>
          </div>
          <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
            {ev.CONGESTION} in traffic · {ev.WAIT} waiting at cranes
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Active Working Vehicles</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums">
            {workingCount} <span className="text-xs text-slate-500 font-sans font-semibold">Units Moving</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {ev.MOVE} hauling · {ev.PICK + ev.PLACE} lifting/stacking
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Eco-Idle Standby</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {ev.IDLE} <span className="text-xs text-slate-500 font-sans font-semibold">Units Paused</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Auto power-saving mode active
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Equipment Power Draw</span>
            <Zap className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#004B91] font-mono tabular-nums">
            {activeHourData.totalPowerKw.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-semibold">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Across {totalVehicles} active units at {selectedHour}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. ACTIONABLE STATUS BREAKDOWN CARDS (WITH CLEAR INSPECT BUTTONS) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-[#004B91]">
              Yard Vehicles &amp; Cranes Breakdown
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Equipment Activity &amp; Bottlenecks — Select Hour or Click Any Status to Inspect Vehicles
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-mono">
            {CHE_EVENT_DATA.map((d) => (
              <button
                key={d.hour}
                type="button"
                onClick={() => setSelectedHour(d.hour)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedHour === d.hour ? "bg-[#004B91] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {d.hour}
              </button>
            ))}
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(CHE_EVENT_COLORS).map(([key, info]) => {
            const count = (activeHourData.events as any)[key] as number;
            return (
              <div
                key={key}
                onClick={() => setActiveEventDetail({ eventKey: key, hour: selectedHour })}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  info.isAlert
                    ? "bg-amber-50/50 border-2 border-amber-300 hover:border-amber-400"
                    : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                      <span>{info.plainLabel}</span>
                    </span>
                    {info.isAlert && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-bold uppercase shrink-0">
                        Attention
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {info.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                  <div className="font-mono">
                    <strong className={`text-lg font-black tabular-nums ${info.isAlert ? "text-amber-800" : "text-slate-900"}`}>
                      {count}
                    </strong>{" "}
                    <span className="text-xs text-slate-500 font-sans font-semibold">vehicles</span>
                  </div>

                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-[#004B91] hover:text-white text-slate-700 text-[11px] font-bold transition-colors"
                  >
                    View Vehicles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. HOURLY EQUIPMENT ACTIVITY BAR CHART (09:00 – 12:00) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Hourly Vehicle &amp; Crane Activity Comparison (09:00 – 12:00)
            </h3>
            <p className="text-xs text-slate-500">
              Click any bar to inspect the vehicles in that status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            {Object.entries(CHE_EVENT_COLORS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveEventDetail({ eventKey: key, hour: selectedHour })}
                onMouseEnter={() => setHoveredEvent(key)}
                onMouseLeave={() => setHoveredEvent(null)}
                className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
                  hoveredEvent === key ? "bg-slate-100 border-slate-400 font-black" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                <span>{item.plainLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 w-full overflow-x-auto no-scrollbar">
          <div className="min-w-[680px] h-[210px] relative">
            <svg viewBox="0 0 800 210" className="w-full h-full">
              {[0, 2, 4, 6, 8, 10].map((val) => {
                const y = 175 - (val / 10) * 145;
                return (
                  <g key={val}>
                    <line x1="40" y1={y} x2="780" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="30" y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
                      {val}
                    </text>
                  </g>
                );
              })}

              <line x1="40" y1="175" x2="780" y2="175" stroke="#cbd5e1" strokeWidth="1.5" />

              {CHE_EVENT_DATA.map((hData, gIdx) => {
                const groupX = 80 + gIdx * 175;
                const eventKeys = Object.keys(hData.events);
                const barWidth = 14;

                return (
                  <g key={hData.hour}>
                    <text x={groupX + 56} y="196" fill="#334155" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {hData.hour} ({hData.totalPowerKw} kW)
                    </text>

                    {eventKeys.map((evKey, bIdx) => {
                      const val = (hData.events as any)[evKey] as number;
                      const barH = (val / 10) * 145;
                      const barX = groupX + bIdx * (barWidth + 2);
                      const barY = 175 - barH;
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
                          />
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
      </div>

      {/* ================================================================== */}
      {/* VEHICLE ACTIVITY DETAIL MODAL */}
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
