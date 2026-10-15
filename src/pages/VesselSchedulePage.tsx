import React, { useState } from "react";
import { 
  TosVesselSchedule, 
  PointToPointSchedule,
  SubPageId
} from "../types/gport";
import { MOCK_POINT_TO_POINT_ROUTES } from "../data/mockPortData";
import { 
  Ship, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Layers, 
  PlugZap, 
  Leaf, 
  ChevronRight, 
  ShieldCheck, 
  Compass,
  FileText
} from "lucide-react";

interface VesselSchedulePageProps {
  vessels: TosVesselSchedule[];
  onNavigate: (page: SubPageId) => void;
}

export const VesselSchedulePage: React.FC<VesselSchedulePageProps> = ({
  vessels,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<"VESSEL_CALLS" | "SCHEDULES_P2P">("VESSEL_CALLS");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // P2P Search State
  const [originPort, setOriginPort] = useState("VNCAT (Cat Lai, Ho Chi Minh)");
  const [destPort, setDestPort] = useState("SGSIN (Singapore)");
  const [p2pFilterCarrier, setP2pFilterCarrier] = useState("ALL");

  // Filters for Live Berth
  const filteredVessels = vessels.filter((v) => {
    const matchesSearch = v.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.berth.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.voyage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filters for P2P Routes
  const filteredRoutes = MOCK_POINT_TO_POINT_ROUTES.filter((r) => {
    const matchesCarrier = p2pFilterCarrier === "ALL" || r.carrier.includes(p2pFilterCarrier);
    return matchesCarrier;
  });

  // Summary Metrics
  const berthedCount = vessels.filter(v => v.status === "BERTHED" || v.status === "OPERATING").length;
  const opsConnectedCount = vessels.filter(v => v.opsConnected).length;
  const totalOperatingTeu = vessels.reduce((acc, v) => acc + v.handledTeu, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">TOS INTEGRATION</span>
            <span aria-hidden="true">·</span>
            <span>Navis / CATOS Live Berth Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>DCSA Standardized API</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Vessel Port Calls & Berth Dispatch Telemetry
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Live synchronization with Terminal Operating System (TOS) manifests, tracking crane gang productivity, shore power (OPS) connections, and container discharge volumes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate("VESSEL_CARBON_INVOICE")}
            className="px-3.5 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Carbon Invoices</span>
          </button>
          <button
            onClick={() => onNavigate("ECO_CALCULATOR")}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eco Quote</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Vessels Berthed</span>
            <Ship className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {berthedCount} <span className="text-xs text-slate-500 font-semibold">Active Berths</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Quay B1, B2 & TCIT at 100% capacity
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>OPS Cold Ironing</span>
            <PlugZap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {opsConnectedCount}/{berthedCount} <span className="text-xs text-slate-500 font-semibold">Electrified</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
            Zero auxiliary smoke at berth
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Shift Throughput</span>
            <Layers className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {totalOperatingTeu.toLocaleString()} <span className="text-xs text-slate-500 font-semibold">TEU</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Container crane moves in current shift
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Standard Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#004B91]">
            DCSA & IMO
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Automated event digest emission ready
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tab Selector */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("VESSEL_CALLS")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "VESSEL_CALLS"
              ? "border-[#004B91] text-[#004B91]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Ship className="w-4 h-4" />
          <span>Live Berth Operations & Vessel Calls ({vessels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("SCHEDULES_P2P")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "SCHEDULES_P2P"
              ? "border-[#004B91] text-[#004B91]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Point-to-Point Schedules ({MOCK_POINT_TO_POINT_ROUTES.length})</span>
        </button>
      </div>

      {/* TAB 1: VESSEL CALLS & BERTH OPERATIONS */}
      {activeTab === "VESSEL_CALLS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vessel, carrier, berth, voyage..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-bold text-[11px] uppercase mr-1">Status:</span>
              {(["ALL", "OPERATING", "BERTHED", "ARRIVING", "SCHEDULED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    statusFilter === st
                      ? "bg-[#004B91] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All" : st === "OPERATING" ? "Operating" : st === "BERTHED" ? "Berthed" : st === "ARRIVING" ? "Arriving" : "Scheduled"}
                </button>
              ))}
            </div>
          </div>

          {/* Vessel Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVessels.map((v) => {
              const progressPct = Math.round((v.handledTeu / (v.plannedTeu || 1)) * 100);
              const ucCode = v.vesselName.includes("SPIRIT") ? "UC-01" :
                v.vesselName.includes("APUS") ? "UC-02" :
                v.vesselName.includes("KITHIRA") ? "UC-03" :
                v.vesselName.includes("GLORY") ? "UC-04" : null;

              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {ucCode && (
                          <span className="text-[10px] font-mono font-bold text-[#004B91]">
                            {ucCode}
                          </span>
                        )}
                        <h3 className="text-base font-black text-slate-900">{v.vesselName}</h3>
                        <span className="text-[10px] font-mono text-slate-500">
                          {v.imoNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Carrier: <strong className="text-slate-800">{v.carrier}</strong> · Voyage {v.voyage} · Service {v.serviceType}
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold uppercase ${
                      v.status === "OPERATING" ? "text-emerald-700" :
                      v.status === "BERTHED" ? "text-blue-700" :
                      v.status === "ARRIVING" ? "text-amber-700" : "text-slate-500"
                    }`}>
                      {v.status === "OPERATING" ? "Operating" : v.status === "BERTHED" ? "Berthed" : v.status === "ARRIVING" ? "Approaching" : "Scheduled"}
                    </span>
                  </div>

                  {/* Operation details 4-grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Berth:</span>
                      <strong className="text-slate-900 font-bold">{v.berth}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Cranes:</span>
                      <strong className="text-[#004B91] font-bold">{v.assignedCranes} STS</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Reefer Load:</span>
                      <strong className="text-blue-700 font-bold font-mono">{v.reeferContainers} units</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">OPS Cold Ironing:</span>
                      <strong className={v.opsConnected ? "text-emerald-700 font-bold" : "text-slate-400"}>
                        {v.opsConnected ? "Connected" : "Disconnected"}
                      </strong>
                    </div>
                  </div>

                  {/* Schedule times */}
                  <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400">ETA / Berth: </span>
                      <strong className="font-mono">{v.ata || v.eta}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">ETD / Departure: </span>
                      <strong className="font-mono">{v.atd || v.etd}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Handling Progress:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {v.handledTeu} / {v.plannedTeu} TEU ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-xs h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#004B91] h-1.5 rounded-xs transition-all duration-300"
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Link to Carbon Invoice & Eco Quote */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Auxiliary status: <strong className="text-emerald-700 font-semibold">{v.opsConnected ? "Zero Engine Emissions" : "Diesel Aux In Use"}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate("ECO_CALCULATOR")}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <span>Eco Quote</span>
                      </button>

                      <button
                        onClick={() => onNavigate("VESSEL_CARBON_INVOICE")}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#004B91] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Carbon Invoice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: POINT-TO-POINT SCHEDULES */}
      {activeTab === "SCHEDULES_P2P" && (
        <div className="space-y-4">
          {/* P2P Search Controls */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Compass className="w-4 h-4 text-[#004B91]" />
              <span>Point-to-Point Maritime Route Inquiries</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Port of Loading (POL):</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={originPort}
                    onChange={(e) => setOriginPort(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Port of Discharge (POD):</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destPort}
                    onChange={(e) => setDestPort(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ocean Carrier:</label>
                <select
                  value={p2pFilterCarrier}
                  onChange={(e) => setP2pFilterCarrier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="ALL">All Carriers (ONE, Maersk, MSC, Tân Cảng)</option>
                  <option value="Maersk">A.P. Moller - Maersk</option>
                  <option value="ONE">Ocean Network Express (ONE)</option>
                  <option value="MSC">Mediterranean Shipping Co. (MSC)</option>
                  <option value="CMA CGM">CMA CGM Group</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#004B91] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {route.carrier}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">
                        {route.vesselName} · Voyage {route.voyage}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Transit Time: <strong className="text-slate-800">{route.transitDays}d {route.transitHours}h</strong> ({route.serviceType})
                      </div>
                    </div>
                  </div>

                  {route.greenCorridor && (
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      Green Shipping Corridor Certified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Departure (ETD)</div>
                    <div className="text-base font-black text-slate-900 font-mono">{route.etd}</div>
                    <div className="text-xs text-slate-600 font-medium">{route.originPort}</div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-[#004B91] font-mono">
                      {route.transitDays}d {route.transitHours}h
                    </span>
                    <div className="w-full flex items-center gap-2 my-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#004B91]" />
                      <div className="flex-1 border-t border-dashed border-slate-300" />
                      <Ship className="w-3.5 h-3.5 text-[#004B91]" />
                      <div className="flex-1 border-t border-dashed border-slate-300" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#004B91]" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">DCSA AIS Telemetry</span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Arrival (ETA)</div>
                    <div className="text-base font-black text-slate-900 font-mono">{route.eta}</div>
                    <div className="text-xs text-slate-600 font-medium">{route.destinationPort}</div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>Vessel Voyage Emissions:</span>
                    <strong className="text-emerald-700 font-mono font-bold">~{route.carbonEmissionEstKgPerTeu} kgCO₂e / TEU</strong>
                  </div>

                  <button
                    onClick={() => onNavigate("VESSEL_CARBON_INVOICE")}
                    className="px-3.5 py-1.5 bg-[#004B91] hover:bg-[#00386E] text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Inspect Carbon Invoice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
