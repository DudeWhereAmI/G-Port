import React, { useState } from "react";
import { 
  Zap, 
  AlertTriangle, 
  Maximize2,
  CheckCircle2
} from "lucide-react";
import { 
  PvSystemStatus, 
  BessSystemStatus, 
  ElectricityTariffTou,
  SubPageId 
} from "../../types/gport";
import { FeederDetailModal } from "./FeederDetailModal";

interface ScadaFeedersViewProps {
  scadaStatus: any;
  pvStatus: PvSystemStatus;
  bessStatus: BessSystemStatus;
  tariff: ElectricityTariffTou;
  onUpdateTariff?: (tariff: ElectricityTariffTou) => void;
  onNavigate?: (page: SubPageId) => void;
}

export const ScadaFeedersView: React.FC<ScadaFeedersViewProps> = ({
  tariff,
  onNavigate
}) => {
  const [selectedFeeder, setSelectedFeeder] = useState<string>("F04");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const feeders = [
    {
      id: "F01",
      name: "Quay Cranes S01–S05 (5 STS Cranes)",
      substation: "Main 22kV Quayside Line",
      voltageKv: 22.0,
      currentA: 58.4,
      powerKw: 2180,
      ratedKw: 3000,
      pf: 0.94,
      status: "ONLINE",
      loadPercent: 72,
      equipmentConnected: "Quay Cranes S01, S02, S03, S04, S05"
    },
    {
      id: "F02",
      name: "Yard e-RTG Cranes (Blocks 01–07)",
      substation: "22kV Container Yard Line",
      voltageKv: 22.0,
      currentA: 23.8,
      powerKw: 890,
      ratedKw: 1850,
      pf: 0.92,
      status: "ONLINE",
      loadPercent: 48,
      equipmentConnected: "12 Electric Rubber-Tired Gantry Cranes (e-RTG)"
    },
    {
      id: "F03",
      name: "Ship Shore Power (OPS Berth 02)",
      substation: "6.6kV Shore Power Connection",
      voltageKv: 6.6,
      currentA: 82.1,
      powerKw: 920,
      ratedKw: 1680,
      pf: 0.96,
      status: "ONLINE",
      loadPercent: 55,
      equipmentConnected: "Ship MV CALF-250901 Shore Power Plug"
    },
    {
      id: "F04",
      name: "Reefer Container Yard (Zones P1 & P3)",
      substation: "0.4kV Cold Chain Substation",
      voltageKv: 0.4,
      currentA: 950.0,
      powerKw: 640,
      ratedKw: 800,
      pf: 0.89,
      status: "HIGH_LOAD",
      loadPercent: 80,
      equipmentConnected: "320 Plugged Reefer Containers"
    },
    {
      id: "F05",
      name: "EV Tractor Fast Chargers & Crane Regen Busbar",
      substation: "0.4kV Microgrid Hub",
      voltageKv: 0.4,
      currentA: 620.0,
      powerKw: 420,
      ratedKw: 1000,
      pf: 0.98,
      status: "ONLINE",
      loadPercent: 42,
      equipmentConnected: "6 Fast Truck Chargers + Crane Regen Converter"
    },
    {
      id: "F06",
      name: "Warehouse HVAC, Yard Lights & Fire Pumps",
      substation: "0.4kV Port Facilities Line",
      voltageKv: 0.4,
      currentA: 210.0,
      powerKw: 145,
      ratedKw: 500,
      pf: 0.91,
      status: "ONLINE",
      loadPercent: 29,
      equipmentConnected: "Gates, Warehouse A/C, Safety Lights & Fire Pumps"
    }
  ];

  const currentFeederObj = feeders.find(f => f.id === selectedFeeder) || feeders[0];
  const totalPowerKw = feeders.reduce((acc, f) => acc + f.powerKw, 0);

  return (
    <div className="space-y-4">
      {/* 1. MAIN POWER LINES TABLE (WITH HIGHLIGHTED LOAD BARS) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-[#004B91]">
              Substation Power Lines (Feeders F01 – F06)
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Live Power Usage &amp; Line Capacity — Lines over 70% capacity are highlighted
            </h2>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200">
              Total Power: <strong className="text-[#004B91]">{totalPowerKw.toLocaleString()} kW</strong>
            </span>
          </div>
        </div>

        {/* CLEAN, JARGON-FREE FEEDERS TABLE */}
        <div className="mt-4 overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Line</th>
                <th className="py-2.5 px-3 font-sans">Connected Port Equipment</th>
                <th className="py-2.5 px-3 text-right">Power Usage</th>
                <th className="py-2.5 px-3">Capacity Used (%)</th>
                <th className="py-2.5 px-2.5 text-right">Voltage</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {feeders.map((f) => {
                const isSelected = selectedFeeder === f.id;
                const isHighLoad = f.loadPercent >= 70;
                return (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedFeeder(f.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/90 text-[#004B91] font-bold"
                        : isHighLoad
                        ? "bg-amber-50/50 hover:bg-amber-50"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <td className="py-3 px-3 font-black text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isHighLoad ? "bg-amber-500" : "bg-emerald-500"}`} />
                        <span>{f.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-slate-900">{f.name}</div>
                      <div className="text-[11px] text-slate-500">{f.equipmentConnected}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 text-sm tabular-nums">
                      {f.powerKw.toLocaleString()} kW
                    </td>
                    <td className="py-3 px-3 w-44">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <strong className={isHighLoad ? "text-amber-800 font-black" : "text-slate-700"}>
                          {f.loadPercent}%
                        </strong>
                        <span className="text-slate-400 text-[10px]">of {f.ratedKw} kW</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            f.loadPercent >= 80
                              ? "bg-amber-500"
                              : f.loadPercent >= 70
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${f.loadPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2.5 text-right text-slate-600 tabular-nums">
                      {f.voltageKv} kV
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      {isHighLoad ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                          <AlertTriangle className="w-3 h-3" />
                          High Load
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Normal
                        </span>
                      )}
                    </td>
                    <td
                      className="py-3 px-3 text-right font-sans"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFeeder(f.id);
                        setIsModalOpen(true);
                      }}
                    >
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-[#004B91] hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Line Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SELECTED POWER LINE SUMMARY & ELECTRICITY RATES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                Selected Power Line
              </div>
              <h3 className="text-base font-black text-slate-900">
                Line {currentFeederObj.id}: {currentFeederObj.name}
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded font-bold text-xs ${
              currentFeederObj.loadPercent >= 70
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}>
              {currentFeederObj.loadPercent}% Capacity Used
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Power</span>
              <strong className="text-base font-black text-slate-900 font-mono">
                {currentFeederObj.powerKw.toLocaleString()} kW
              </strong>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Max: {currentFeederObj.ratedKw.toLocaleString()} kW
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Voltage &amp; Current</span>
              <strong className="text-base font-black text-slate-900 font-mono">
                {currentFeederObj.voltageKv} kV
              </strong>
              <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                {currentFeederObj.currentA} Amps
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Power Efficiency</span>
              <strong className="text-base font-black text-emerald-700 font-mono">
                {(currentFeederObj.pf * 100).toFixed(0)}%
              </strong>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Power Factor {currentFeederObj.pf}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#004B91] hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-sky-300" />
            <span>Open Line Diagram &amp; 24-Hour Power Curve</span>
          </button>
        </div>

        {/* ELECTRICITY TIME-OF-USE RATES */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">EVN Electricity Schedule</div>
              <h3 className="text-sm font-black text-slate-900">Time-of-Use Electricity Rates (VND/kWh)</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
              22kV Rate
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Off-Peak Rate (Night)</span>
                <span className="text-[11px] text-emerald-700 font-mono">22:00 – 04:00</span>
              </div>
              <strong className="text-sm font-black text-emerald-800 font-mono">
                {tariff.offPeakRateVnd.toLocaleString()} VND/kWh
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 block">Normal Rate (Daytime)</span>
                <span className="text-[11px] text-blue-700 font-mono">04:00 – 09:30, 11:30 – 17:00</span>
              </div>
              <strong className="text-sm font-black text-blue-800 font-mono">
                {tariff.normalRateVnd.toLocaleString()} VND/kWh
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-950 block">Peak Rate (Highest Cost)</span>
                <span className="text-[11px] text-rose-700 font-mono">09:30 – 11:30, 17:00 – 20:00</span>
              </div>
              <strong className="text-sm font-black text-rose-800 font-mono">
                {tariff.peakRateVnd.toLocaleString()} VND/kWh
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDER DETAIL SUBPAGE / MODAL */}
      {isModalOpen && (
        <FeederDetailModal
          feederId={selectedFeeder}
          onClose={() => setIsModalOpen(false)}
          onNavigate={onNavigate}
          tariff={tariff}
        />
      )}
    </div>
  );
};
