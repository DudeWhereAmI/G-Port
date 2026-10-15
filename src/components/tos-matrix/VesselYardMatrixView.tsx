import React, { useState } from "react";
import { 
  Ship, 
  Layers, 
  Eye, 
  EyeOff, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Activity, 
  Sparkles, 
  Filter, 
  BarChart3, 
  Compass, 
  Maximize2,
  Info,
  ExternalLink,
  Zap
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

// Authentic Yard Block Moves data matching the N4 Container Terminal Matrix (Image 1)
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
  { id: "S05", name: "STS #05 (Post-Panamax)", moves: 411, color: "#8b5cf6", bg: "bg-purple-500", text: "text-purple-600", lightBg: "bg-purple-50", border: "border-purple-300", kwRate: 520 },
  { id: "S04", name: "STS #04 (Super Post-Panamax)", moves: 443, color: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-600", lightBg: "bg-cyan-50", border: "border-cyan-300", kwRate: 580 },
  { id: "S03", name: "STS #03 (Panamax High-Speed)", moves: 358, color: "#22c55e", bg: "bg-emerald-500", text: "text-emerald-600", lightBg: "bg-emerald-50", border: "border-emerald-300", kwRate: 460 },
  { id: "S02", name: "STS #02 (Dual-Trolley STS)", moves: 341, color: "#f97316", bg: "bg-orange-500", text: "text-orange-600", lightBg: "bg-orange-50", border: "border-orange-300", kwRate: 490 },
  { id: "S01", name: "STS #01 (Quayside Feeder STS)", moves: 402, color: "#eab308", bg: "bg-amber-500", text: "text-amber-600", lightBg: "bg-amber-50", border: "border-amber-300", kwRate: 430 }
];

// Bay Profile definitions across vessel hull (Bays 87 downto 01)
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

// Timeline Gantt rows matching Image 1
const TIMELINE_ROWS = [
  { time: "11/02 20:00", activeBlocks: [{ crane: "S03", bay: "67", w: 55, left: 320, label: "002 (00) S03" }, { crane: "S05", bay: "23", w: 45, left: 710, label: "001 (10)" }] },
  { time: "11/02 21:00", activeBlocks: [{ crane: "S04", bay: "51", w: 45, left: 455, label: "S04" }, { crane: "S03", bay: "07", w: 55, left: 865, label: "002 (00) S03" }] },
  { time: "11/02 22:00", activeBlocks: [{ crane: "S05", bay: "43", w: 50, left: 510, label: "002 S05 (35)" }, { crane: "S04", bay: "31", w: 55, left: 590, label: "S04" }] },
  { time: "11/02 23:00", activeBlocks: [{ crane: "S03", bay: "67", w: 55, left: 320, label: "S03" }, { crane: "S03", bay: "35", w: 55, left: 590, label: "S03" }] },
  { time: "12/02 01:00", activeBlocks: [{ crane: "S03", bay: "75", w: 55, left: 200, label: "S03 (75)" }, { crane: "S03", bay: "43", w: 55, left: 455, label: "S03 (43)" }] },
  { time: "12/02 03:00", activeBlocks: [{ crane: "S03", bay: "75", w: 55, left: 200, label: "S03 (75)" }, { crane: "S04", bay: "55", w: 60, left: 380, label: "S04 (55)" }, { crane: "S04", bay: "23", w: 55, left: 790, label: "S04" }] },
  { time: "12/02 05:00", activeBlocks: [{ crane: "S03", bay: "83", w: 45, left: 120, label: "S03" }, { crane: "S05", bay: "55", w: 60, left: 380, label: "S05" }, { crane: "S05", bay: "31", w: 50, left: 520, label: "S05" }] },
  { time: "12/02 07:00", activeBlocks: [{ crane: "S04", bay: "87", w: 55, left: 70, label: "S04" }, { crane: "S05", bay: "23", w: 55, left: 710, label: "S05 (23)" }] }
];

export const VesselYardMatrixView: React.FC<VesselYardMatrixViewProps> = ({ onNavigate }) => {
  const [selectedVessel, setSelectedVessel] = useState("CALF-250901");
  const [selectedCrane, setSelectedCrane] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"ACTUAL" | "PLANNED">("ACTUAL");
  const [showTraceLines, setShowTraceLines] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<"CRANE" | "DISCHARGE" | "QC_ASSIGN">("CRANE");
  const [highlightedBlock, setHighlightedBlock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Modal Subpage states
  const [activeCraneDetail, setActiveCraneDetail] = useState<string | null>(null);
  const [activeBlockDetail, setActiveBlockDetail] = useState<YardBlockLoad | null>(null);
  const [showVesselDetail, setShowVesselDetail] = useState<boolean>(false);

  const filteredBlocks = YARD_BLOCK_LOADS.filter(b => {
    const matchesSearch = b.block.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrane = selectedCrane === "ALL" || b.assignedCranes.includes(selectedCrane);
    return matchesSearch && matchesCrane;
  });

  const totalMoves = YARD_BLOCK_LOADS.reduce((acc, b) => acc + b.count, 0);
  const totalDistanceMeters = YARD_BLOCK_LOADS.reduce((acc, b) => acc + b.distance, 0);

  // Ship berth coordinates on the SVG map (Quay line)
  const shipX = 330;
  const shipY = 430;

  return (
    <div className="space-y-4">
      {/* ================================================================== */}
      {/* 1. TOP SECTION: QC MOVE BADGES, BAY PROFILE & GANTT MATRIX (IMAGE 1) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        {/* Header Bar with Crane Moves Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-[#004B91]">
              TOS N4 MATRIX
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Quayside Cranes & Vessel Bay Execution Matrix (Bản đồ Lập Kế hoạch Bay & Cẩu)
            </h2>
          </div>

          {/* Crane Move Counts Badges (Matching S05..S01 in Image 1) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold font-mono">
            {CRANE_CONFIGS.map(c => (
              <div key={c.id} className="flex items-center">
                <button
                  onClick={() => setSelectedCrane(prev => prev === c.id ? "ALL" : c.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-l-md border transition-all ${
                    selectedCrane === c.id
                      ? `${c.bg} text-white border-transparent shadow-xs scale-102`
                      : `${c.lightBg} ${c.text} ${c.border} hover:opacity-90`
                  }`}
                  title={`Click to filter view by ${c.name} (${c.moves} container moves)`}
                >
                  <span>{c.id}</span>
                  <span className="opacity-90 font-normal">({c.moves})</span>
                </button>
                <button
                  onClick={() => setActiveCraneDetail(c.id)}
                  className={`px-1.5 py-1 rounded-r-md border border-l-0 text-[10px] transition-colors ${
                    selectedCrane === c.id 
                      ? `${c.bg} text-white hover:brightness-110 border-transparent` 
                      : `${c.lightBg} ${c.text} ${c.border} hover:bg-slate-200`
                  }`}
                  title={`Open detailed telemetry & motor curve for ${c.id}`}
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
            ))}

            <div className="pl-2 border-l border-slate-200 text-slate-500 font-semibold text-[11px] flex items-center gap-2">
              <span>Moves: <strong className="text-slate-900">2,227</strong> / 1,955 TEU</span>
              <button
                onClick={() => setActiveCraneDetail("S04")}
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#004B91] hover:bg-blue-100 text-[10px] font-bold border border-blue-200 transition-colors"
                title="Inspect real-time telemetry across Quay Cranes"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Inspect S01-S05</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vessel Bay Profile Grid (Bays 87 -> 01) */}
        <div className="mt-3 overflow-x-auto no-scrollbar">
          <div className="min-w-[920px] bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 text-[10px]">
            <div className="flex items-center justify-between mb-1.5 text-slate-500 font-mono text-[9px]">
              <span className="font-bold text-slate-700 uppercase">Vessel Bay Hull Cross-Section (Hatch & Tier Structure)</span>
              <span>Aft (Đuôi tàu) ← Bay Orientation → Fwd (Mũi tàu)</span>
            </div>

            {/* Bay Columns */}
            <div className="grid grid-cols-16 gap-1 text-center font-mono">
              {BAY_PROFILE.map((b, idx) => {
                const craneObj = CRANE_CONFIGS.find(c => c.id === b.upperCrane);
                return (
                  <div key={idx} className="flex flex-col gap-1 bg-white rounded-md p-1 border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-800">{b.bay}</span>
                    
                    {/* Upper Tier */}
                    <div 
                      className={`h-7 rounded flex flex-col items-center justify-center text-[9px] font-bold transition-all ${
                        craneObj ? `${craneObj.lightBg} ${craneObj.text} border ${craneObj.border}` : "bg-slate-100 text-slate-400"
                      }`}
                      title={`Bay ${b.bay} Upper: ${b.upperMoves} moves ${craneObj ? `(${craneObj.id})` : ""}`}
                    >
                      <span className="text-[8px] opacity-75">Upper</span>
                      <span>{b.upperMoves}</span>
                    </div>

                    {/* Lower Tier */}
                    <div 
                      className={`h-7 rounded flex flex-col items-center justify-center text-[9px] font-bold transition-all ${
                        craneObj ? `${craneObj.lightBg} ${craneObj.text} border ${craneObj.border}` : "bg-slate-100 text-slate-400"
                      }`}
                      title={`Bay ${b.bay} Lower: ${b.lowerMoves} moves ${craneObj ? `(${craneObj.id})` : ""}`}
                    >
                      <span className="text-[8px] opacity-75">Lower</span>
                      <span>{b.lowerMoves}</span>
                    </div>

                    <div className="text-[9px] font-extrabold text-[#004B91] border-t border-slate-100 pt-0.5">
                      {b.moves}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Operational Timeline Gantt Matrix */}
        <div className="mt-3 overflow-x-auto no-scrollbar">
          <div className="min-w-[920px] bg-slate-900 rounded-xl p-3 text-white text-[10px]">
            <div className="flex items-center justify-between mb-2 text-slate-400 font-mono text-[9px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Clock className="w-3 h-3" />
                Live Gantt Time Horizon (11/02 20:00 - 12/02 09:00 UTC+7)
              </span>
              <span>Quay Crane Split & Simultaneous Discharge Sequencing</span>
            </div>

            <div className="space-y-1.5">
              {TIMELINE_ROWS.map((row, rIdx) => (
                <div key={rIdx} className="flex items-center gap-2 border-b border-slate-800/80 pb-1">
                  <span className="w-20 font-mono text-slate-400 shrink-0 text-[9px]">{row.time}</span>
                  <div className="relative flex-1 h-6 bg-slate-800/70 rounded overflow-hidden">
                    {row.activeBlocks.map((blk, bIdx) => {
                      const cObj = CRANE_CONFIGS.find(c => c.id === blk.crane);
                      return (
                        <div
                          key={bIdx}
                          className="absolute top-0 bottom-0 rounded flex items-center px-2 text-[9px] font-bold shadow-xs cursor-pointer hover:brightness-110 transition-transform"
                          style={{
                            left: `${blk.left / 10}%`,
                            width: `${blk.w / 10}%`,
                            backgroundColor: cObj?.color || "#0284c7"
                          }}
                          title={`Crane ${blk.crane} operating on Bay ${blk.bay}`}
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
      </div>

      {/* ================================================================== */}
      {/* 2. MIDDLE CONTROLS & FILTER TOOLBAR (MATCHING IMAGE 1 TOOLBAR) */}
      {/* ================================================================== */}
      <div className="bg-slate-100 border border-slate-200/90 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Vessel Selector */}
          <div className="flex items-center gap-1.5 font-bold">
            <Ship className="w-3.5 h-3.5 text-[#004B91]" />
            <span className="text-slate-600">Vessel:</span>
            <select
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#004B91]"
            >
              <option value="CALF-250901">CALF-250901 (Cat Lai Feeder)</option>
              <option value="CALF-250902">CALF-250902 (South China Express)</option>
              <option value="MAERSK-EVER">MAERSK-EVER (Intl Transshipment)</option>
            </select>
            <button
              onClick={() => setShowVesselDetail(true)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#004B91] hover:bg-blue-800 text-white font-mono font-bold text-[10px] transition-colors shadow-2xs"
              title="Open Vessel Port Call, Berth Window & Shore Power (OPS) Telemetry"
            >
              <span>Port Call & OPS</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* QC Selector */}
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-slate-600">QC:</span>
            <select
              value={selectedCrane}
              onChange={(e) => setSelectedCrane(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#004B91]"
            >
              <option value="ALL">All Cranes (S01 - S05)</option>
              <option value="S01">S01 (402 moves)</option>
              <option value="S02">S02 (341 moves)</option>
              <option value="S03">S03 (358 moves)</option>
              <option value="S04">S04 (443 moves)</option>
              <option value="S05">S05 (411 moves)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 font-bold pl-2 border-l border-slate-300">
            <span className="text-slate-600">View:</span>
            <button
              onClick={() => setViewMode(viewMode === "ACTUAL" ? "PLANNED" : "ACTUAL")}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 font-bold text-[#004B91] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {viewMode === "ACTUAL" ? "Actual (Thực tế)" : "Planned (Kế hoạch)"}
            </button>
          </div>

          {/* TraceLine Toggle */}
          <button
            onClick={() => setShowTraceLines(!showTraceLines)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border font-bold transition-colors ${
              showTraceLines 
                ? "bg-rose-50 border-rose-300 text-rose-700" 
                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {showTraceLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showTraceLines ? "Hide TraceLine" : "Show TraceLine"}</span>
          </button>
        </div>

        {/* Color Mode Radio Pills */}
        <div className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-600">
          <span className="font-bold">Color:</span>
          <button
            onClick={() => setColorMode("CRANE")}
            className={`px-2 py-0.5 rounded ${colorMode === "CRANE" ? "bg-[#004B91] text-white font-bold" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            Crane Color
          </button>
          <button
            onClick={() => setColorMode("DISCHARGE")}
            className={`px-2 py-0.5 rounded ${colorMode === "DISCHARGE" ? "bg-[#004B91] text-white font-bold" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            Discharge Port
          </button>
          <button
            onClick={() => setColorMode("QC_ASSIGN")}
            className={`px-2 py-0.5 rounded ${colorMode === "QC_ASSIGN" ? "bg-[#004B91] text-white font-bold" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            QC Assignment
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. BOTTOM SECTION: TERMINAL YARD MAP (LEFT) & LOADS TABLE (RIGHT) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: TERMINAL YARD TOP-DOWN MAP & TRACE LINES (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#004B91]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cat Lai Terminal Yard Layout & Real-time CHE Feeder Vectors
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Quayside Berth 02 · 110kV Feeder F01/F02
            </span>
          </div>

          {/* Interactive SVG Yard Canvas */}
          <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex-1 min-h-[460px] select-none">
            <svg viewBox="0 0 720 480" className="w-full h-full">
              {/* Background Terminal Grid Lines */}
              <defs>
                <pattern id="yardGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>
                <linearGradient id="traceGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <rect width="720" height="480" fill="#0f172a" />
              <rect width="720" height="480" fill="url(#yardGrid)" />

              {/* Waterway / River Channel */}
              <rect x="0" y="420" width="720" height="60" fill="#082f49" />
              <line x1="0" y1="420" x2="720" y2="420" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
              <text x="20" y="465" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.7">
                DONG NAI RIVERWAY · BERTH 01 - 04 DRAFT: 12.5M
              </text>

              {/* Berthed Vessel Hull (CALF-250901) */}
              <g transform="translate(180, 412)">
                <path d="M 0 8 L 30 20 L 320 20 L 340 8 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="50" y="2" width="230" height="10" rx="2" fill="#0369a1" />
                {/* Containers on Deck */}
                {[...Array(14)].map((_, i) => (
                  <rect key={i} x={60 + i * 15} y="0" width="12" height="7" rx="1" fill={i % 3 === 0 ? "#eab308" : i % 2 === 0 ? "#22c55e" : "#ef4444"} />
                ))}
                <text x="165" y="17" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  MV CALF-250901 (Cat Lai Feeder)
                </text>
              </g>

              {/* Quay Cranes (S01 - S05) positioned along Quay Line */}
              {CRANE_CONFIGS.map((crane, idx) => {
                const cx = 210 + idx * 60;
                const cy = 412;
                return (
                  <g key={crane.id} className="cursor-pointer">
                    <circle cx={cx} cy={cy} r="6" fill={crane.color} stroke="#ffffff" strokeWidth="1.5" />
                    <text x={cx} y={cy - 9} fill={crane.color} fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="monospace">
                      {crane.id}
                    </text>
                  </g>
                );
              })}

              {/* Dynamic Feeder TraceLines from Berth to Yard Blocks (Matching Image 1) */}
              {showTraceLines && filteredBlocks.map((b) => {
                const isSelected = highlightedBlock === b.block;
                const strokeColor = isSelected ? "#38bdf8" : "#f43f5e";
                const strokeW = isSelected ? 2.5 : 1.2;
                const opacity = highlightedBlock && !isSelected ? 0.2 : 0.65;
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
                    {/* Animated circle pulse along active path */}
                    {isSelected && (
                      <circle cx={(shipX + targetX) / 2} cy={(shipY + targetY) / 2} r="3" fill="#38bdf8">
                        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Yard Stacks / Blocks */}
              {YARD_BLOCK_LOADS.map((b) => {
                const isSelected = highlightedBlock === b.block;
                const isFiltered = filteredBlocks.some(f => f.block === b.block);
                const craneColors = b.assignedCranes.map(cId => CRANE_CONFIGS.find(c => c.id === cId)?.color || "#94a3b8");

                return (
                  <g 
                    key={b.block}
                    onClick={() => setHighlightedBlock(prev => prev === b.block ? null : b.block)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    {/* Yard Block Outline */}
                    <rect
                      x={b.x}
                      y={b.y}
                      width={b.w}
                      height={b.h}
                      rx="3"
                      fill={isSelected ? "#1e293b" : b.category === "REEFER" ? "#064e3b" : "#1e1b4b"}
                      stroke={isSelected ? "#38bdf8" : isFiltered ? "#818cf8" : "#334155"}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={!isFiltered ? 0.35 : 1}
                    />

                    {/* Block Name Label */}
                    <text
                      x={b.x + 3}
                      y={b.y + 11}
                      fill={isSelected ? "#38bdf8" : "#f8fafc"}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {b.block}
                    </text>

                    {/* Assigned Cranes Badges over Block */}
                    <g transform={`translate(${b.x + b.w - (b.assignedCranes.length * 6 + 2)}, ${b.y + 3})`}>
                      {craneColors.map((color, cIdx) => (
                        <circle key={cIdx} cx={cIdx * 6 + 3} cy="3" r="2.5" fill={color} />
                      ))}
                    </g>
                  </g>
                );
              })}

              {/* Ancillary Buildings & Gate Lanes */}
              <rect x="25" y="100" width="40" height="25" rx="2" fill="#334155" stroke="#475569" />
              <text x="45" y="116" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">CFS</text>

              <rect x="25" y="140" width="40" height="20" rx="2" fill="#334155" stroke="#475569" />
              <text x="45" y="153" fill="#94a3b8" fontSize="7" textAnchor="middle" fontFamily="monospace">POB</text>

              <rect x="25" y="170" width="40" height="20" rx="2" fill="#334155" stroke="#475569" />
              <text x="45" y="183" fill="#94a3b8" fontSize="7" textAnchor="middle" fontFamily="monospace">SAN</text>

              {/* Gate In/Out Feeder Highway */}
              <line x1="300" y1="40" x2="300" y2="240" stroke="#475569" strokeWidth="4" strokeDasharray="8 4" />
              <text x="310" y="60" fill="#64748b" fontSize="8" fontFamily="monospace">CENTRAL HAULIER BYPASS</text>
            </svg>

            {/* Floating Map Legend */}
            <div className="absolute top-2.5 right-2.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-lg p-2 text-[10px] text-white flex flex-col gap-1">
              <span className="font-bold text-slate-400 uppercase text-[9px]">Map Legend</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#1e1b4b] border border-indigo-400" />
                <span>Dry Container Stack</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#064e3b] border border-emerald-400" />
                <span>Reefer Plug Area (P1/P3)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-rose-500" />
                <span>Haulier Move Vector</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: YARD BLOCK LOADS & DISTANCE TABLE (5 COLS - MATCHING IMAGE 1 TABLE) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <div>
              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Vessel: <span className="text-[#004B91]">{selectedVessel}</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Loads Matrix & Travel Distance
              </h3>
            </div>

            {/* Quick search input */}
            <div className="relative w-28">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find block..."
                className="w-full pl-2 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#004B91]"
              />
            </div>
          </div>

          {/* Table Container matching Image 1 table */}
          <div className="flex-1 overflow-y-auto max-h-[460px] no-scrollbar border border-slate-200/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[10px] font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5">Block</th>
                  <th className="py-2 px-2 text-right">Count</th>
                  <th className="py-2 px-2.5 text-right">Distance (m)</th>
                  <th className="py-2 px-2.5 text-right">Est. Time</th>
                  <th className="py-2 px-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredBlocks.map((b) => {
                  const isSelected = highlightedBlock === b.block;
                  return (
                    <tr
                      key={b.block}
                      onClick={() => setHighlightedBlock(prev => prev === b.block ? null : b.block)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-blue-50/90 text-[#004B91] font-bold" 
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <td className="py-2 px-2.5 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.assignedCranes[0] ? CRANE_CONFIGS.find(c => c.id === b.assignedCranes[0])?.color : "#94a3b8" }} />
                        <span>{b.block}</span>
                      </td>
                      <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                        {b.count}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-600">
                        {b.distance.toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-semibold text-slate-500">
                        {b.estMoveTime}
                      </td>
                      <td className="py-2 px-1 text-center" onClick={(e) => { e.stopPropagation(); setActiveBlockDetail(b); }}>
                        <button
                          className="p-1 rounded hover:bg-blue-100 text-slate-400 hover:text-[#004B91] transition-colors"
                          title={`Inspect telemetry & stack matrix for Block ${b.block}`}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 text-slate-900 font-bold text-[10px] border-t border-slate-200 sticky bottom-0">
                <tr>
                  <td className="py-2 px-2.5">TOTAL ({filteredBlocks.length})</td>
                  <td className="py-2 px-2 text-right">{totalMoves.toLocaleString()}</td>
                  <td className="py-2 px-2.5 text-right">{totalDistanceMeters.toLocaleString()} m</td>
                  <td className="py-2 px-2.5 text-right">~308h 20m</td>
                  <td></td>
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
