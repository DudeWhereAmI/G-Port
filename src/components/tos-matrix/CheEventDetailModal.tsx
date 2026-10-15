import React from "react";
import { 
  X, 
  Clock, 
  MapPin, 
  Truck, 
  Zap, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Activity,
  Layers
} from "lucide-react";
import { SubPageId } from "../../types/gport";
import { CHE_EVENT_COLORS } from "./CheAnalyticsView";

interface CheEventDetailModalProps {
  eventKey: string;
  hour?: string;
  onClose: () => void;
  onNavigate?: (page: SubPageId) => void;
}

export const CheEventDetailModal: React.FC<CheEventDetailModalProps> = ({
  eventKey,
  hour = "09:00",
  onClose,
  onNavigate
}) => {
  const evInfo = CHE_EVENT_COLORS[eventKey] || { label: eventKey, color: "#0284c7", bg: "bg-sky-600" };

  // Sample machine logs for this event type
  const machineLogs = [
    {
      equipmentId: "PM-14 (Prime Mover)",
      driver: "Nguyen Van Hai",
      location: "Block 01D Lane 2",
      powerKw: 42,
      duration: "6.2 min",
      status: "RESOLVED",
      note: "Slow crawl due to high container stack turnover at Bay 75."
    },
    {
      equipmentId: "PM-22 (e-Haulier)",
      driver: "Le Quang Minh",
      location: "Block 03A North Bypass",
      powerKw: 55,
      duration: "4.8 min",
      status: "ACTIVE",
      note: "Queueing behind STS Crane S02 discharge chassis."
    },
    {
      equipmentId: "RTG-08 (e-RTG)",
      driver: "Tran Quoc Tuan",
      location: "Block 05B Stack Center",
      powerKw: 185,
      duration: "8.1 min",
      status: "MONITORED",
      note: "Twin-lift cycle onto external road tractor."
    },
    {
      equipmentId: "PM-07 (Prime Mover)",
      driver: "Pham Dinh Nam",
      location: "Block 07D Feeder Road",
      powerKw: 38,
      duration: "3.5 min",
      status: "RESOLVED",
      note: "Speed restricted to 15 km/h per terminal safety standard."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-mono font-black shadow-sm"
              style={{ backgroundColor: evInfo.color }}
            >
              CHE
            </span>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: evInfo.color }}>
                CONTAINER HANDLING EQUIPMENT EVENT AUDIT
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Event: {evInfo.label}</span>
                <span className="text-xs text-slate-400 font-normal">· Hour Window: {hour}</span>
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

        {/* LOGS LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
              Event Classification & Telemetry Dispatch Notes:
            </span>
            <p className="text-slate-700">
              During the <strong>{hour}</strong> operational window, <strong>{evInfo.label}</strong> events were recorded by the DCSA/TOS vehicle location engine. Prime movers and RTG cranes report positions via 5G Wi-Fi with sub-second accuracy.
            </p>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
              Machine Telemetry Records:
            </span>
            {machineLogs.map((log, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <strong className="text-slate-900 font-mono text-xs">{log.equipmentId}</strong>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{log.driver}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    {log.duration}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{log.location}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{log.powerKw} kW draw</span>
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{log.status}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg font-mono">
                  &gt; {log.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
