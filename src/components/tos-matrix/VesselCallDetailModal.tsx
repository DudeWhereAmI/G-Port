import React from "react";
import { 
  X, 
  Ship, 
  Calendar, 
  MapPin, 
  Clock, 
  Zap, 
  FileText, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Calculator,
  Layers
} from "lucide-react";
import { SubPageId } from "../../types/gport";

interface VesselCallDetailModalProps {
  vesselId?: string;
  onClose: () => void;
  onNavigate?: (page: SubPageId) => void;
}

export const VesselCallDetailModal: React.FC<VesselCallDetailModalProps> = ({
  vesselId = "CALF-250901",
  onClose,
  onNavigate
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                  VESSEL PORT CALL & SHORE POWER TELEMETRY
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  ● BERTHED & WORKING
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>MV CALF-250901</span>
                <span className="text-xs text-slate-300 font-normal">· IMO 9821455 · CMA CGM · Berth 02</span>
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

        {/* SUMMARY STATS */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Planned Moves</span>
            <strong className="text-sm font-black text-slate-900">2,227 TEU</strong>
            <span className="text-[10px] text-slate-500 block">1,420 Disch / 807 Load</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Berth Window</span>
            <strong className="text-sm font-black text-[#004B91]">13 Hours</strong>
            <span className="text-[10px] text-slate-500 block">11/02 20:00 - 12/02 09:00</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Shore Power (OPS)</span>
            <strong className="text-sm font-black text-emerald-600">CONNECTED</strong>
            <span className="text-[10px] text-emerald-700 block">Feeder F03 · 920 kW</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Cranes</span>
            <strong className="text-sm font-black text-slate-900">5 STS (S01 - S05)</strong>
            <span className="text-[10px] text-slate-500 block">29.4 Gross Moves/hr</span>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* OPS COLD IRONING GREEN BENEFIT */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>HIGH-VOLTAGE SHORE POWER CONNECTION (IEC/IEEE 80005-1)</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                Zero Auxiliary Engine Emissions
              </span>
            </div>

            <p className="text-emerald-100/90 text-xs">
              Vessel auxiliary engines have been shut down during hoteling. All vessel hotel loads, galley, navigation, and reefer container circuits are supplied by Cat Lai Substation Feeder F03 (6.6kV, 60Hz).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono">
              <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-300 block">Aux Engine Fuel Saved</span>
                <strong className="text-sm font-black text-white">4.8 Tonnes MGO</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-300 block">GHG Emissions Prevented</span>
                <strong className="text-sm font-black text-white">15.2 Tonnes CO2e</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-300 block">Shore Energy Metered</span>
                <strong className="text-sm font-black text-white">11,960 kWh</strong>
              </div>
            </div>
          </div>

          {/* CRANE ALLOCATION TABLE */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              Quayside Crane Allocation Matrix for CALF-250901:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-amber-600 font-bold block">Crane S01</span>
                <strong className="text-xs font-black text-slate-900">402 Moves</strong>
                <span className="text-[9px] text-slate-500 block">Bays 03-23</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-orange-600 font-bold block">Crane S02</span>
                <strong className="text-xs font-black text-slate-900">341 Moves</strong>
                <span className="text-[9px] text-slate-500 block">Bays 31-35</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-emerald-600 font-bold block">Crane S03</span>
                <strong className="text-xs font-black text-slate-900">358 Moves</strong>
                <span className="text-[9px] text-slate-500 block">Bays 43-67</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-cyan-600 font-bold block">Crane S04</span>
                <strong className="text-xs font-black text-slate-900">443 Moves</strong>
                <span className="text-[9px] text-slate-500 block">Bays 75-87</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-purple-600 font-bold block">Crane S05</span>
                <strong className="text-xs font-black text-slate-900">411 Moves</strong>
                <span className="text-[9px] text-slate-500 block">Bays 23, 31, 55</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-bold text-slate-700">Cross-Schedule Links:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate("VESSEL_CARBON_INVOICE");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-cyan-700 hover:bg-cyan-50 font-bold transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Port Call Carbon Invoice</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate("VESSEL_SCHEDULE");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 font-bold transition-colors shadow-2xs"
                >
                  <Ship className="w-3.5 h-3.5 text-blue-600" />
                  <span>Berth Master Schedule</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate("ECO_CALCULATOR");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 font-bold transition-colors shadow-2xs"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Green Corridor Booking</span>
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
