import React, { useState } from "react";
import { 
  Ship, 
  Eye, 
  EyeOff, 
  Clock, 
  Compass, 
  ExternalLink,
  Zap,
  AlertTriangle
} from "lucide-react";
import { SubPageId } from "../../types/gport";
import { CraneTelemetryDetailModal } from "./CraneTelemetryDetailModal";
import { YardBlockDetailModal } from "./YardBlockDetailModal";
import { VesselCallDetailModal } from "./VesselCallDetailModal";

export interface VesselYardMatrixViewProps {
  onNavigate?: (page: SubPageId) => void;
}

export interface YardBlockLoad {
  block: string;
  count: number;
  distance: number;
  estMoveTime: string;
  assignedCranes: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  category: "STANDARD" | "REEFER" | "CFS" | "EMPTY";
}

export const YARD_BLOCK_LOADS: YardBlockLoad[] = [
  { block: "00A", count: 4, distance: 3162, estMoveTime: "00h 38m", assignedCranes: ["S01"], x: 30, y: 310, w: 22, h: 42, category: "EMPTY" },
  { block: "01A", count: 45, distance: 31102, estMoveTime: "06h 52m", assignedCranes: ["S01", "S02"], x: 65, y: 350, w: 75, h: 16, category: "STANDARD" },
  { block: "01B", count: 101, distance: 62112, estMoveTime: "14h 36m", assignedCranes: ["S01", "S04"], x: 65, y: 326, w: 75, h: 16, category: "STANDARD" },
  { block: "01C", count: 9, distance: 5186, estMoveTime: "01h 16m", assignedCranes: ["S02"], x: 65, y: 302, w: 75, h: 16, category: "STANDARD" },
  { block: "01D", count: 365, distance: 196509, estMoveTime: "50h 13m", assignedCranes: ["S01", "S04", "S05"], x: 65, y: 278, w: 75, h: 16, category: "STANDARD" },
  { block: "03A", count: 126, distance: 75643, estMoveTime: "10h 17m", assignedCranes: ["S02", "S01"], x: 195, y: 350, w: 75, h: 16, category: "STANDARD" },
  { block: "03B", count: 109, distance: 104578, estMoveTime: "26h 11m", assignedCranes: ["S02", "S03"], x: 195, y: 326, w: 75, h: 16, category: "STANDARD" },
  { block: "03C", count: 21, distance: 11064, estMoveTime: "02h 51m", assignedCranes: ["S03"], x: 195, y: 302, w: 75, h: 16, category: "STANDARD" },
  { block: "03D", count: 202, distance: 96949, estMoveTime: "26h 30m", assignedCranes: ["S04", "S01", "S05"], x: 195, y: 278, w: 75, h: 16, category: "STANDARD" },
  { block: "05A", count: 211, distance: 127529, estMoveTime: "30h 18m", assignedCranes: ["S03", "S02", "S01"], x: 365, y: 350, w: 75, h: 16, category: "STANDARD" },
  { block: "05B", count: 234, distance: 137022, estMoveTime: "33h 10m", assignedCranes: ["S02", "S05"], x: 365, y: 326, w: 75, h: 16, category: "STANDARD" },
  { block: "05D", count: 88, distance: 58210, estMoveTime: "12h 40m", assignedCranes: ["S03"], x: 365, y: 278, w: 75, h: 16, category: "STANDARD" },
  { block: "07A", count: 151, distance: 104470, estMoveTime: "23h 00m", assignedCranes: ["S02", "S01"], x: 495, y: 350, w: 75, h: 16, category: "STANDARD" },
  { block: "07B", count: 186, distance: 132609, estMoveTime: "28h 45m", assignedCranes: ["S05", "S04", "S03"], x: 495, y: 326, w: 75, h: 16, category: "STANDARD" },
  { block: "07C", count: 2, distance: 1273, estMoveTime: "00h 17m", assignedCranes: ["S04"], x: 495, y: 302, w: 75, h: 16, category: "STANDARD" },
  { block: "07D", count: 168, distance: 123464, estMoveTime: "27h 58m", assignedCranes: ["S03", "S04"], x: 495, y: 278, w: 75, h: 16, category: "STANDARD" },
  { block: "07E", count: 22, distance: 15097, estMoveTime: "03h 20m", assignedCranes: ["S05"], x: 495, y: 254, w: 75, h: 16, category: "STANDARD" },
  { block: "09B", count: 13, distance: 11077, estMoveTime: "02h 11m", assignedCranes: ["S05"], x: 620, y: 326, w: 60, h: 16, category: "STANDARD" },
  { block: "P1B", count: 68, distance: 48489, estMoveTime: "10h 30m", assignedCranes: ["S02", "S05"], x: 380, y: 105, w: 55, h: 22, category: "REEFER" },
  { block: "P1E", count: 6, distance: 4236, estMoveTime: "00h 55m", assignedCranes: ["S01"], x: 380, y: 135, w: 55, h: 22, category: "REEFER" },
  { block: "P3B", count: 71, distance: 49587, estMoveTime: "10h 51m", assignedCranes: ["S04", "S03"], x: 505, y: 115, w: 65, h: 24, category: "REEFER" }
];

export const CRANE_CONFIGS = [
  { id: "S05", name: "Quay Crane S05", moves: 411, color: "#8b5cf6", bg: "bg-purple-600", text: "text-purple-700", lightBg: "bg-purple-50", border: "border-purple-300", kwRate: 520 },
  { id: "S04", name: "Quay Crane S04", moves: 443, color: "#06b6d4", bg: "bg-cyan-600", text: "text-cyan-700", lightBg: "bg-cyan-50", border: "border-cyan-300", kwRate: 580 },
  { id: "S03", name: "Quay Crane S03", moves: 358, color: "#22c55e", bg: "bg-emerald-600", text: "text-emerald-700", lightBg: "bg-emerald-50", border: "border-emerald-300", kwRate: 460 },
  { id: "S02", name: "Quay Crane S02", moves: 341, color: "#f97316", bg: "bg-orange-500", text: "text-orange-700", lightBg: "bg-orange-50", border: "border-orange-300", kwRate: 490 },
  { id: "S01", name: "Quay Crane S01", moves: 402, color: "#eab308", bg: "bg-amber-500", text: "text-amber-700", lightBg: "bg-amber-50", border: "border-amber-300", kwRate: 430 }
];

const BAY_PROFILE = [
  { bay: "87", moves: 35, upperCrane: "S04", lowerCrane: "S04", upperMoves: 20, lowerMoves: 15 },
  { bay: "83", moves: 42, upperCrane: "S04", lowerCrane: "S04", upperMoves: 22, lowerMoves: 20 },
  { bay: "79", moves: 65, upperCrane: "S04", lowerCrane: "S04", upperMoves: 35, lowerMoves: 30 },
  { bay: "75", moves: 156, upperCrane: "S04", lowerCrane: "S04", upperMoves: 82, lowerMoves: 74 },
  { bay: "71", moves: 88, upperCrane: null, lowerCrane: null, upperMoves: 45, lowerMoves: 43 },
  { bay: "67", moves: 202, upperCrane: "S03", lowerCrane: "S03", upperMoves: 104, lowerMoves: 98 },
  { bay: "63", moves: 222, upperCrane: "S03", lowerCrane: "S03", upperMoves: 112, lowerMoves: 110 },
  { bay: "55", moves: 125, upperCrane: "S03", lowerCrane: "S03", upperMoves: 65, lowerMoves: 60 },
  { bay: "51", moves: 356, upperCrane: "S03", lowerCrane: "S03", upperMoves: 180, lowerMoves: 176 },
  { bay: "43", moves: 264, upperCrane: "S03", lowerCrane: "S03", upperMoves: 134, lowerMoves: 130 },
  { bay: "35", moves: 144, upperCrane: "S02", lowerCrane: "S02", upperMoves: 74, lowerMoves: 70 },
  { bay: "31", moves: 98, upperCrane: "S02", lowerCrane: "S02", upperMoves: 50, lowerMoves: 48 },
  { bay: "23", moves: 158, upperCrane: "S01", lowerCrane: "S01", upperMoves: 80, lowerMoves: 78 },
  { bay: "15", moves: 121, upperCrane: "S01", lowerCrane: "S01", upperMoves: 62, lowerMoves: 59 },
  { bay: "07", moves: 261, upperCrane: "S01", lowerCrane: "S01", upperMoves: 135, lowerMoves: 126 },
  { bay: "03", moves: 4, upperCrane: "S01", lowerCrane: "S01", upperMoves: 2, lowerMoves: 2 }
];

const TIMELINE_ROWS = [
  { time: "20:00", activeBlocks: [{ crane: "S03", bay: "67", w: 55, left: 320, label: "S03 · Bay 67" }, { crane: "S05", bay: "23", w: 45, left: 710, label: "S05 · Bay 23" }] },
  { time: "21:00", activeBlocks: [{ crane: "S04", bay: "51", w: 45, left: 455, label: "S04 · Bay 51" }, { crane: "S03", bay: "07", w: 55, left: 865, label: "S03 · Bay 07" }] },
  { time: "22:00", activeBlocks: [{ crane: "S05", bay: "43", w: 50, left: 510, label: "S05 · Bay 43" }, { crane: "S04", bay: "31", w: 55, left: 590, label: "S04 · Bay 31" }] },
  { time: "23:00", activeBlocks: [{ crane: "S03", bay: "67", w: 55, left: 320, label: "S03 · Bay 67" }, { crane: "S03", bay: "35", w: 55, left: 590, label: "S03 · Bay 35" }] },
  { time: "01:00", activeBlocks: [{ crane: "S03", bay: "75", w: 55, left: 200, label: "S03 · Bay 75" }, { crane: "S03", bay: "43", w: 55, left: 455, label: "S03 · Bay 43" }] },
  { time: "03:00", activeBlocks: [{ crane: "S03", bay: "75", w: 55, left: 200, label: "S03 · Bay 75" }, { crane: "S04", bay: "55", w: 60, left: 380, label: "S04 · Bay 55" }, { crane: "S04", bay: "23", w: 55, left: 790, label: "S04 · Bay 23" }] }
];

export const VesselYardMatrixView: React.FC<VesselYardMatrixViewProps> = ({ onNavigate }) => {
  const [selectedVessel, setSelectedVessel] = useState("CALF-250901");
  const [selectedCrane, setSelectedCrane] = useState<string>("ALL");
  const [showTraceLines, setShowTraceLines] = useState<boolean>(true);
  const [highlightedBlock, setHighlightedBlock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScheduleTimeline, setShowScheduleTimeline] = useState<boolean>(false);

  // Detailed Modal Subpage states
  const [activeCraneDetail, setActiveCraneDetail] = useState<string | null>(null);
  const [activeBlockDetail, setActiveBlockDetail] = useState<YardBlockLoad | null>(null);
  const [showVesselDetail, setShowVesselDetail] = useState<boolean>(false);

  const filteredBlocks = YARD_BLOCK_LOADS.filter(b => {
    const matchesSearch = b.block.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrane = selectedCrane === "ALL" || b.assignedCranes.includes(selectedCrane);
    return matchesSearch && matchesCrane;
  });

  const totalMoves = filteredBlocks.reduce((acc, b) => acc + b.count, 0);

  // Ship berth coordinates on the SVG map (Quay line)
  const shipX = 330;
  const shipY = 430;

  return (
    <div className="space-y-4">
      {/* ================================================================== */}
      {/* 1. QUAY CRANES & SHIP BAYS OVERVIEW */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-[#004B91]">
              Quay Cranes &amp; Ship Unloading Plan
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              5 Active Quay Cranes (S01–S05) · Click any crane to filter or inspect power
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScheduleTimeline(!showScheduleTimeline)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-[#004B91]" />
              <span>{showScheduleTimeline ? "Hide Hourly Crane Timeline" : "Show Hourly Crane Timeline"}</span>
            </button>
          </div>
        </div>

        {/* HIGHLIGHTED 5 QUAY CRANE CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CRANE_CONFIGS.map((c) => {
            const isSelected = selectedCrane === c.id;
            const isHighestLoad = c.id === "S04";
            return (
              <div
                key={c.id}
                className={`rounded-xl p-3 border transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "bg-blue-50/90 border-2 border-[#004B91] shadow-xs"
                    : isHighestLoad
                    ? "bg-amber-50/40 border-amber-300"
                    : "bg-slate-50/80 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedCrane(prev => prev === c.id ? "ALL" : c.id)}
                    className="flex items-center gap-1.5 font-mono font-black text-sm text-slate-900 cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.id}</span>
                  </button>
                  {isHighestLoad && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500 text-white">
                      Peak Crane
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Power Draw</span>
                    <strong className="text-sm font-black text-slate-900 tabular-nums">{c.kwRate} kW</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Workload</span>
                    <strong className="text-sm font-black text-[#004B91] tabular-nums">{c.moves} moves</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setSelectedCrane(prev => prev === c.id ? "ALL" : c.id)}
                    className={`py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      isSelected ? "bg-[#004B91] text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected ? "Showing" : "Filter Map"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCraneDetail(c.id)}
                    className="py-1 rounded bg-[#004B91] hover:bg-blue-800 text-white text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ship Bay Workload Bar (Bays 87 -> 03) */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[860px] bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-[10px]">
            <div className="flex items-center justify-between mb-2 text-slate-600 font-semibold text-[11px]">
              <span>Ship Container Bays (Bays 87 to 03) — Highlighted bays have &gt;200 container moves</span>
              <span className="font-mono text-slate-500">Stern (Back) ← Ship Length → Bow (Front)</span>
            </div>

            <div className="grid grid-cols-16 gap-1 text-center font-mono">
              {BAY_PROFILE.map((b, idx) => {
                const craneObj = CRANE_CONFIGS.find(c => c.id === b.upperCrane);
                const isHeavyBay = b.moves >= 200;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col gap-1 rounded-md p-1 border shadow-2xs ${
                      isHeavyBay ? "bg-amber-50 border-amber-400" : "bg-white border-slate-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-800">Bay {b.bay}</span>

                    <div 
                      className={`h-6 rounded flex items-center justify-center text-[9px] font-bold ${
                        craneObj ? `${craneObj.lightBg} ${craneObj.text} border ${craneObj.border}` : "bg-slate-100 text-slate-400"
                      }`}
                      title={`Deck: ${b.upperMoves} moves`}
                    >
                      {b.upperMoves}
                    </div>

                    <div 
                      className={`h-6 rounded flex items-center justify-center text-[9px] font-bold ${
                        craneObj ? `${craneObj.lightBg} ${craneObj.text} border ${craneObj.border}` : "bg-slate-100 text-slate-400"
                      }`}
                      title={`Hold: ${b.lowerMoves} moves`}
                    >
                      {b.lowerMoves}
                    </div>

                    <div className={`text-[10px] font-black border-t border-slate-100 pt-0.5 ${
                      isHeavyBay ? "text-amber-800" : "text-[#004B91]"
                    }`}>
                      {b.moves}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collapsible Hourly Schedule Timeline */}
        {showScheduleTimeline && (
          <div className="overflow-x-auto no-scrollbar">
            <div className="min-w-[860px] bg-slate-900 rounded-xl p-3.5 text-white text-[10px]">
              <div className="flex items-center justify-between mb-2 text-slate-300 font-semibold text-xs">
                <span>Hourly Quay Crane Bay Sequence (20:00 – 03:00)</span>
                <span className="font-mono text-slate-400">Colors match Crane S01–S05</span>
              </div>

              <div className="space-y-1.5">
                {TIMELINE_ROWS.map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2 border-b border-slate-800/80 pb-1">
                    <span className="w-14 font-mono text-slate-400 shrink-0 text-[10px]">{row.time}</span>
                    <div className="relative flex-1 h-6 bg-slate-800/70 rounded overflow-hidden">
                      {row.activeBlocks.map((blk, bIdx) => {
                        const cObj = CRANE_CONFIGS.find(c => c.id === blk.crane);
                        return (
                          <div
                            key={bIdx}
                            className="absolute top-0 bottom-0 rounded flex items-center px-2 text-[9px] font-bold shadow-xs"
                            style={{
                              left: `${blk.left / 10}%`,
                              width: `${blk.w / 10}%`,
                              backgroundColor: cObj?.color || "#0284c7"
                            }}
                          >
                            <span className="truncate">{blk.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 2. SIMPLE SHIP & MAP FILTER BAR */}
      {/* ================================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-bold">
            <Ship className="w-4 h-4 text-[#004B91]" />
            <span className="text-slate-600">Active Ship:</span>
            <select
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#004B91]"
            >
              <option value="CALF-250901">MV CALF-250901 (Cat Lai Feeder)</option>
              <option value="CALF-250902">MV SPIRIT OF MUMBAI (Berth B2)</option>
              <option value="MAERSK-EVER">MV ONE APUS (Berth B3)</option>
            </select>
            <button
              type="button"
              onClick={() => setShowVesselDetail(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004B91] hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <span>Ship &amp; Shore Power Details</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-bold pl-2 border-l border-slate-200">
            <span className="text-slate-600">Crane Filter:</span>
            <select
              value={selectedCrane}
              onChange={(e) => setSelectedCrane(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#004B91]"
            >
              <option value="ALL">All 5 Cranes (S01 – S05)</option>
              <option value="S01">Crane S01 (402 moves · 430 kW)</option>
              <option value="S02">Crane S02 (341 moves · 490 kW)</option>
              <option value="S03">Crane S03 (358 moves · 460 kW)</option>
              <option value="S04">Crane S04 (443 moves · 580 kW)</option>
              <option value="S05">Crane S05 (411 moves · 520 kW)</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTraceLines(!showTraceLines)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer ${
            showTraceLines 
              ? "bg-rose-50 border-rose-300 text-rose-700" 
              : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {showTraceLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showTraceLines ? "Hide Truck Travel Lines" : "Show Truck Travel Lines"}</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* 3. BOTTOM SECTION: TERMINAL YARD MAP (LEFT) & BLOCK TABLE (RIGHT) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: TERMINAL YARD TOP-DOWN MAP (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#004B91]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Terminal Yard Map — Click any Yard Block to highlight route
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-700">
              Amber blocks = High Traffic (&gt;200 moves)
            </span>
          </div>

          {/* Interactive SVG Yard Canvas */}
          <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex-1 min-h-[450px] select-none">
            <svg viewBox="0 0 720 480" className="w-full h-full">
              <defs>
                <pattern id="yardGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="720" height="480" fill="#0f172a" />
              <rect width="720" height="480" fill="url(#yardGrid)" />

              {/* Waterway / River Channel */}
              <rect x="0" y="420" width="720" height="60" fill="#082f49" />
              <line x1="0" y1="420" x2="720" y2="420" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
              <text x="20" y="465" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.8">
                DONG NAI RIVER · BERTH B1 – B4
              </text>

              {/* Berthed Vessel Hull */}
              <g transform="translate(180, 412)" className="cursor-pointer" onClick={() => setShowVesselDetail(true)}>
                <path d="M 0 8 L 30 20 L 320 20 L 340 8 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="50" y="2" width="230" height="10" rx="2" fill="#0369a1" />
                {[...Array(14)].map((_, i) => (
                  <rect key={i} x={60 + i * 15} y="0" width="12" height="7" rx="1" fill={i % 3 === 0 ? "#eab308" : i % 2 === 0 ? "#22c55e" : "#ef4444"} />
                ))}
                <text x="165" y="17" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  MV {selectedVessel} (Click for Shore Power)
                </text>
              </g>

              {/* Quay Cranes (S01 - S05) positioned along Quay Line */}
              {CRANE_CONFIGS.map((crane, idx) => {
                const cx = 210 + idx * 60;
                const cy = 412;
                return (
                  <g key={crane.id} className="cursor-pointer" onClick={() => setActiveCraneDetail(crane.id)}>
                    <circle cx={cx} cy={cy} r="6.5" fill={crane.color} stroke="#ffffff" strokeWidth="1.5" />
                    <text x={cx} y={cy - 10} fill={crane.color} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {crane.id}
                    </text>
                  </g>
                );
              })}

              {/* Truck Route Lines from Berth to Yard Blocks */}
              {showTraceLines && filteredBlocks.map((b) => {
                const isSelected = highlightedBlock === b.block;
                const isHeavy = b.count >= 200;
                const strokeColor = isSelected ? "#38bdf8" : isHeavy ? "#f59e0b" : "#f43f5e";
                const strokeW = isSelected ? 2.5 : isHeavy ? 1.8 : 1.1;
                const opacity = highlightedBlock && !isSelected ? 0.15 : 0.65;
                const targetX = b.x + b.w / 2;
                const targetY = b.y + b.h / 2;

                return (
                  <g key={`trace-${b.block}`}>
                    <line
                      x1={shipX}
                      y1={shipY}
                      x2={targetX}
                      y2={targetY}
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                      strokeDasharray={isSelected ? "none" : "4 2"}
                      opacity={opacity}
                    />
                  </g>
                );
              })}

              {/* Yard Stacks / Blocks */}
              {YARD_BLOCK_LOADS.map((b) => {
                const isSelected = highlightedBlock === b.block;
                const isFiltered = filteredBlocks.some(f => f.block === b.block);
                const isHeavy = b.count >= 200;
                const craneColors = b.assignedCranes.map(cId => CRANE_CONFIGS.find(c => c.id === cId)?.color || "#94a3b8");

                return (
                  <g 
                    key={b.block}
                    onClick={() => setHighlightedBlock(prev => prev === b.block ? null : b.block)}
                    onDoubleClick={() => setActiveBlockDetail(b)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={b.x}
                      y={b.y}
                      width={b.w}
                      height={b.h}
                      rx="3"
                      fill={
                        isSelected
                          ? "#1e293b"
                          : b.category === "REEFER"
                          ? "#064e3b"
                          : isHeavy
                          ? "#78350f"
                          : "#1e1b4b"
                      }
                      stroke={
                        isSelected
                          ? "#38bdf8"
                          : b.category === "REEFER"
                          ? "#34d399"
                          : isHeavy
                          ? "#f59e0b"
                          : isFiltered
                          ? "#818cf8"
                          : "#334155"
                      }
                      strokeWidth={isSelected || isHeavy ? 2 : 1}
                      opacity={!isFiltered ? 0.3 : 1}
                    />

                    <text
                      x={b.x + 4}
                      y={b.y + 11}
                      fill={isSelected ? "#38bdf8" : "#f8fafc"}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {b.block} ({b.count})
                    </text>

                    <g transform={`translate(${b.x + b.w - (b.assignedCranes.length * 6 + 2)}, ${b.y + 3})`}>
                      {craneColors.map((color, cIdx) => (
                        <circle key={cIdx} cx={cIdx * 6 + 3} cy="3" r="2.5" fill={color} />
                      ))}
                    </g>
                  </g>
                );
              })}

              {/* Main Road */}
              <line x1="300" y1="40" x2="300" y2="240" stroke="#475569" strokeWidth="4" strokeDasharray="8 4" />
              <text x="310" y="60" fill="#94a3b8" fontSize="9" fontFamily="monospace">MAIN YARD ROAD</text>
            </svg>

            {/* Clear Map Legend */}
            <div className="absolute top-2.5 right-2.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-lg p-2.5 text-[10px] text-white flex flex-col gap-1.5">
              <span className="font-bold text-slate-300 uppercase text-[9px]">Yard Block Types</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#78350f] border border-amber-400" />
                <span className="text-amber-300 font-semibold">High Activity (&gt;200 moves)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#064e3b] border border-emerald-400" />
                <span>Reefer Cooling Plugs (P1/P3)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#1e1b4b] border border-indigo-400" />
                <span>Standard Dry Containers</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: YARD BLOCK WORKLOAD TABLE (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                Yard Block Container Moves
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Click any Block to inspect stack &amp; power
              </h3>
            </div>

            <div className="relative w-32">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search block..."
                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#004B91]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[450px] no-scrollbar border border-slate-200/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[10px] font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5">Block</th>
                  <th className="py-2 px-2">Type / Status</th>
                  <th className="py-2 px-2 text-right">Moves</th>
                  <th className="py-2 px-2 text-right">Est. Time</th>
                  <th className="py-2 px-2 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredBlocks.map((b) => {
                  const isSelected = highlightedBlock === b.block;
                  const isHeavy = b.count >= 200;
                  const isReefer = b.category === "REEFER";
                  return (
                    <tr
                      key={b.block}
                      onClick={() => setHighlightedBlock(prev => prev === b.block ? null : b.block)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-blue-50/90 text-[#004B91] font-bold" 
                          : isHeavy
                          ? "bg-amber-50/50 hover:bg-amber-50"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <td className="py-2 px-2.5 font-bold flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: b.assignedCranes[0] ? CRANE_CONFIGS.find(c => c.id === b.assignedCranes[0])?.color : "#94a3b8" }}
                        />
                        <span className="text-slate-900">{b.block}</span>
                      </td>
                      <td className="py-2 px-2 font-sans">
                        {isHeavy ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-bold uppercase">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            High Volume
                          </span>
                        ) : isReefer ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase">
                            Reefer Cooling
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Dry Stack</span>
                        )}
                      </td>
                      <td className={`py-2 px-2 text-right font-black tabular-nums ${
                        isHeavy ? "text-amber-800 text-xs" : "text-slate-900"
                      }`}>
                        {b.count}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-500 tabular-nums">
                        {b.estMoveTime}
                      </td>
                      <td
                        className="py-2 px-2 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBlockDetail(b);
                        }}
                      >
                        <button
                          type="button"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-[#004B91] text-slate-700 hover:text-white font-sans font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 text-slate-900 font-bold text-[11px] border-t border-slate-200 sticky bottom-0">
                <tr>
                  <td colSpan={2} className="py-2 px-2.5 font-sans">Total ({filteredBlocks.length} Blocks)</td>
                  <td className="py-2 px-2 text-right tabular-nums">{totalMoves.toLocaleString()} moves</td>
                  <td colSpan={2} className="py-2 px-2.5 text-right text-slate-500 font-sans">Click Inspect for details</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* DETAILED MODAL SUBPAGES (OPENED ON USER CLICK) */}
      {/* ================================================================== */}
      {activeCraneDetail && (
        <CraneTelemetryDetailModal
          craneId={activeCraneDetail}
          vesselName={`MV ${selectedVessel}`}
          onClose={() => setActiveCraneDetail(null)}
          onNavigate={onNavigate}
        />
      )}

      {activeBlockDetail && (
        <YardBlockDetailModal
          blockData={activeBlockDetail}
          vesselName={`MV ${selectedVessel}`}
          onClose={() => setActiveBlockDetail(null)}
          onNavigate={onNavigate}
        />
      )}

      {showVesselDetail && (
        <VesselCallDetailModal
          vesselId={selectedVessel}
          onClose={() => setShowVesselDetail(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
