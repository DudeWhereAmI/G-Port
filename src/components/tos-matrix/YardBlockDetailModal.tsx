import React, { useState } from "react";
import { 
  X, 
  MapPin, 
  Layers, 
  Truck, 
  Clock, 
  Zap, 
  Thermometer, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Download, 
  Activity, 
  Calculator,
  Compass
} from "lucide-react";
import { SubPageId } from "../../types/gport";
import { YardBlockLoad } from "./VesselYardMatrixView";

interface YardBlockDetailModalProps {
  blockData: YardBlockLoad;
  onClose: () => void;
  onNavigate?: (page: SubPageId) => void;
  vesselName?: string;
}

export const YardBlockDetailModal: React.FC<YardBlockDetailModalProps> = ({
  blockData,
  onClose,
  onNavigate,
  vesselName = "MV CALF-250901"
}) => {
  const [activeTab, setActiveTab] = useState<"STACK_MAP" | "LOGISTICS" | "ENERGY_MRV">("STACK_MAP");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Generate realistic 6 bays x 6 rows container stack matrix for this block
  const isReefer = blockData.category === "REEFER";
  const capacityTeu = 360;
  const occupiedTeu = Math.min(Math.round(capacityTeu * 0.78), capacityTeu);
  const utilizationPercent = Math.round((occupiedTeu / capacityTeu) * 100);

  // Estimate electrical & fuel consumption for this block's moves
  const rtgKwh = Math.round(blockData.count * 1.85); // 1.85 kWh per e-RTG lift
  const haulierKwh = Math.round((blockData.distance / 1000) * 1.4); // 1.4 kWh per km e-ITV
  const totalBlockEnergyKwh = rtgKwh + haulierKwh;
  const totalEmissionsKg = (totalBlockEnergyKwh * 0.7221).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* ================================================================== */}
        {/* 1. TOP HEADER */}
        {/* ================================================================== */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-mono font-black text-white text-base shadow-sm">
              {blockData.block}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                  YARD BLOCK TELEMETRY & STACK MATRIX
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                  {blockData.category}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Yard Block {blockData.block}</span>
                <span className="text-xs text-slate-300 font-normal hidden sm:inline">
                  · Connected to Feeder F02 · Assigned Cranes: {blockData.assignedCranes.join(", ")}
                </span>
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
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Allocated Moves</span>
            <strong className="text-sm font-black text-slate-900">{blockData.count} TEU</strong>
            <span className="text-[10px] text-slate-500 block">From {vesselName}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Transfer Distance</span>
            <strong className="text-sm font-black text-[#004B91]">{blockData.distance.toLocaleString()} m</strong>
            <span className="text-[10px] text-slate-500 block">Est: {blockData.estMoveTime}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Stack Capacity</span>
            <strong className="text-sm font-black text-emerald-600">{utilizationPercent}% Full</strong>
            <span className="text-[10px] text-slate-500 block">{occupiedTeu} / {capacityTeu} TEU Slots</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Block Energy & MRV</span>
            <strong className="text-sm font-black text-blue-700">{totalBlockEnergyKwh.toLocaleString()} kWh</strong>
            <span className="text-[10px] text-slate-500 block">{totalEmissionsKg} kg CO2e</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. TABS */}
        {/* ================================================================== */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("STACK_MAP")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors ${
              activeTab === "STACK_MAP"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Ground Slot & Stack Layout</span>
          </button>

          <button
            onClick={() => setActiveTab("LOGISTICS")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors ${
              activeTab === "LOGISTICS"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Haulier Flow & CHE Assignments</span>
          </button>

          <button
            onClick={() => setActiveTab("ENERGY_MRV")}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 px-1 transition-colors ${
              activeTab === "ENERGY_MRV"
                ? "border-[#004B91] text-[#004B91]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Electrical Load & Carbon Accounting</span>
          </button>
        </div>

        {/* ================================================================== */}
        {/* 4. CONTENT */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: 3D CONTAINER STACK LAYOUT */}
          {activeTab === "STACK_MAP" && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="font-bold text-sky-300">Block {blockData.block} Stack Grid (Bay 01 - 06, Row A - F)</span>
                  </div>
                  <span className="text-slate-400">Max Height: 5 Tiers (e-RTG 1-over-5)</span>
                </div>

                {/* Container Stack Grid Visualizer */}
                <div className="grid grid-cols-6 gap-2 text-center font-mono text-[10px]">
                  {["Bay 01", "Bay 02", "Bay 03", "Bay 04", "Bay 05", "Bay 06"].map((bayName, bIdx) => (
                    <div key={bIdx} className="bg-slate-800 rounded-xl p-2 border border-slate-700/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-300 block">{bayName}</span>
                      
                      {/* Rows inside bay */}
                      <div className="grid grid-cols-3 gap-1">
                        {[1, 2, 3, 4, 5, 6].map((slotIdx) => {
                          const slotId = `${blockData.block}-${bIdx + 1}-${slotIdx}`;
                          const isOccupied = (bIdx + slotIdx) % 4 !== 0;
                          const isSlotSelected = selectedSlot === slotId;

                          return (
                            <div
                              key={slotIdx}
                              onClick={() => setSelectedSlot(slotId)}
                              className={`h-10 rounded flex flex-col items-center justify-center p-1 cursor-pointer transition-transform hover:scale-105 ${
                                isSlotSelected
                                  ? "bg-sky-400 text-slate-950 font-black ring-2 ring-white"
                                  : isOccupied
                                  ? isReefer
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 text-white"
                                  : "bg-slate-700/60 text-slate-400 border border-dashed border-slate-600"
                              }`}
                              title={isOccupied ? `Slot ${slotId}: 40ft High Cube Container` : `Slot ${slotId}: Empty`}
                            >
                              <span className="text-[8px] font-bold">R{slotIdx}</span>
                              <span className="text-[7px]">{isOccupied ? (isReefer ? "REEF" : "40HC") : "EMPTY"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs" /> Dry Container</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" /> Reefer Connected</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-700 border border-dashed border-slate-500 rounded-xs" /> Ground Slot Empty</span>
                </div>
              </div>

              {selectedSlot && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">Selected Slot {selectedSlot}:</span>
                    <span className="text-slate-600 font-mono">TCNU-8921820 (40HC Dry) · Dwell Time: 1.4 days · POD: USLAX</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-[#004B91] px-2 py-0.5 rounded">
                    Cleared for Loading
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOGISTICS & HAULIER FLOW */}
          {activeTab === "LOGISTICS" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                    Quay-to-Yard Haulage Route
                  </span>
                  <div className="text-sm font-black text-slate-900">
                    Berth 02 → Block {blockData.block} Bypass Road
                  </div>
                  <p className="text-slate-600">
                    Total haulier transfer distance: <strong>{blockData.distance.toLocaleString()} meters</strong>. Prime Movers (PM) cycle time averaging 14.2 minutes per round-trip.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                    Assigned Crane Coverage
                  </span>
                  <div className="text-sm font-black text-[#004B91]">
                    Quay Cranes: {blockData.assignedCranes.join(", ")}
                  </div>
                  <p className="text-slate-600">
                    Serviced by Yard e-RTG Cranes RTG-04 and RTG-11 on Feeder F02 with automatic anti-collision radar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENERGY & MRV */}
          {activeTab === "ENERGY_MRV" && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800">ISO 14064 Energy & GHG Allocation</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    Tier 3 Certified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">e-RTG Gantry Energy</span>
                    <strong className="text-sm font-black text-slate-900">{rtgKwh.toLocaleString()} kWh</strong>
                    <span className="text-[10px] text-slate-500 block">1.85 kWh / lift</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">e-ITV Haulier Energy</span>
                    <strong className="text-sm font-black text-slate-900">{haulierKwh.toLocaleString()} kWh</strong>
                    <span className="text-[10px] text-slate-500 block">Battery EV transport</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Carbon Intensity</span>
                    <strong className="text-sm font-black text-emerald-700">
                      {(parseFloat(totalEmissionsKg) / blockData.count).toFixed(2)} kgCO2/TEU
                    </strong>
                    <span className="text-[10px] text-emerald-600 block">Zero local tailpipe</span>
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
                    onNavigate("ECO_CALCULATOR");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#004B91] hover:bg-blue-50 font-bold transition-colors shadow-2xs"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Green Booking & Eco Routing</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate("MODULE_1_FORECAST");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 font-bold transition-colors shadow-2xs"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Load Forecast</span>
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
