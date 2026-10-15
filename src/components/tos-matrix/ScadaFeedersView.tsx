import React, { useState } from "react";
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  Settings, 
  RefreshCw, 
  ArrowUpRight, 
  CheckCircle2, 
  Radio,
  Maximize2,
  Info
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
  scadaStatus,
  pvStatus,
  bessStatus,
  tariff,
  onUpdateTariff,
  onNavigate
}) => {
  const [selectedFeeder, setSelectedFeeder] = useState<string>("F01");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const feeders = [
    {
      id: "F01",
      name: "Quayside STS Cranes (5 STS)",
      substation: "Substation 110kV/22kV - Trạm Biến Áp Cát Lái",
      voltageKv: 22.0,
      currentA: 58.4,
      powerKw: 2180,
      pf: 0.94,
      status: "CLOSED",
      loadPercent: 72,
      equipmentConnected: "STS Cranes S01, S02, S03, S04, S05",
      iecProtocol: "IEC 61850 Goose",
      mrvTrust: "ISO 14064 Tier 3"
    },
    {
      id: "F02",
      name: "Yard e-RTG Crane Substation (Blocks 01-07)",
      substation: "Substation 22kV Yard Hub A",
      voltageKv: 22.0,
      currentA: 23.8,
      powerKw: 890,
      pf: 0.92,
      status: "CLOSED",
      loadPercent: 48,
      equipmentConnected: "12 Electric Rubber-Tired Gantry Cranes",
      iecProtocol: "IEC 60870-5-104",
      mrvTrust: "ISO 14064 Tier 3"
    },
    {
      id: "F03",
      name: "Onshore Power Supply (OPS Berth 02)",
      substation: "OPS High-Voltage Shore Connection 6.6kV",
      voltageKv: 6.6,
      currentA: 82.1,
      powerKw: 920,
      pf: 0.96,
      status: "CLOSED",
      loadPercent: 55,
      equipmentConnected: "Vessel CALF-250901 Cold Ironing",
      iecProtocol: "IEC/IEEE 80005-1",
      mrvTrust: "IMO DCS & EU ETS Compliant"
    },
    {
      id: "F04",
      name: "Reefer Monitoring Rack (Zones P1 & P3)",
      substation: "Low Voltage 0.4kV Reefer Substation",
      voltageKv: 0.4,
      currentA: 950.0,
      powerKw: 640,
      pf: 0.89,
      status: "CLOSED",
      loadPercent: 80,
      equipmentConnected: "320 Connected Cold Chain Containers",
      iecProtocol: "Modbus TCP/IP",
      mrvTrust: "ISO 14064 Tier 2"
    },
    {
      id: "F05",
      name: "BESS Storage & EV Fast Charging Racks",
      substation: "Microgrid PCS Inverter Substation",
      voltageKv: 0.4,
      currentA: 620.0,
      powerKw: 420,
      pf: 0.98,
      status: "CLOSED",
      loadPercent: 42,
      equipmentConnected: "6 DC Superchargers + BESS Inverter",
      iecProtocol: "OCPP 2.0.1 / Modbus",
      mrvTrust: "ISO 14064 Tier 3"
    },
    {
      id: "F06",
      name: "Terminal Gate & Central Admin Building",
      substation: "Auxiliary 0.4kV Distribution Hub",
      voltageKv: 0.4,
      currentA: 210.0,
      powerKw: 145,
      pf: 0.91,
      status: "CLOSED",
      loadPercent: 29,
      equipmentConnected: "Automated OCR Gates & Operations HQ",
      iecProtocol: "SNMP v3 / BACnet",
      mrvTrust: "ISO 14064 Tier 1"
    }
  ];

  const currentFeederObj = feeders.find(f => f.id === selectedFeeder) || feeders[0];

  return (
    <div className="space-y-4">
      {/* 1. SCADA SUMMARY STATS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                SCADA 110kV / 22kV
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Substation Primary Feeders & Power Quality Telemetry
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Substation Frequency: 50.02 Hz
            </span>
          </div>
        </div>

        {/* FEEDERS GRID TABLE */}
        <div className="mt-4 overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Feeder ID</th>
                <th className="py-2.5 px-3">Equipment Destination</th>
                <th className="py-2.5 px-2.5 text-right">Voltage</th>
                <th className="py-2.5 px-2.5 text-right">Current</th>
                <th className="py-2.5 px-3 text-right">Active Power</th>
                <th className="py-2.5 px-2.5 text-right">Power Factor</th>
                <th className="py-2.5 px-3 text-center">Breaker</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-2 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {feeders.map((f) => {
                const isSelected = selectedFeeder === f.id;
                return (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedFeeder(f.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/80 text-[#004B91] font-bold" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-black text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{f.id}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {f.name}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-600">
                      {f.voltageKv} kV
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-600">
                      {f.currentA} A
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {f.powerKw.toLocaleString()} kW
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-600">
                      {f.pf}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                      {f.iecProtocol}
                    </td>
                    <td className="py-2.5 px-2 text-center" onClick={(e) => { e.stopPropagation(); setSelectedFeeder(f.id); setIsModalOpen(true); }}>
                      <button
                        className="p-1 rounded hover:bg-blue-100 text-slate-400 hover:text-[#004B91] transition-colors"
                        title={`Inspect Feeder ${f.id} SLD & Load telemetry`}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SELECTED FEEDER DRILL-DOWN & TARIFF SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* FEEDER DETAIL CARD */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                Feeder Inspection
              </div>
              <h3 className="text-base font-black text-slate-900">
                {currentFeederObj.id}: {currentFeederObj.name}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded bg-blue-100 text-[#004B91] font-mono font-bold text-xs">
              {currentFeederObj.mrvTrust}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block">Connected Load</span>
              <strong className="text-sm font-black text-slate-900">{currentFeederObj.loadPercent}% of Rating</strong>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentFeederObj.loadPercent}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block">Substation Line</span>
              <strong className="text-xs font-bold text-slate-900">{currentFeederObj.voltageKv} kV Three-Phase</strong>
              <span className="text-[10px] text-slate-500 block mt-1">Busbar #1</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-mono block">SCADA Protocol</span>
              <strong className="text-xs font-bold text-slate-900">{currentFeederObj.iecProtocol}</strong>
              <span className="text-[10px] text-emerald-600 block mt-1">● Latency: 4ms</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Connected Field Equipment:</div>
            <div className="text-white font-bold">{currentFeederObj.equipmentConnected}</div>
            <div className="text-slate-400 text-[11px] pt-1">
              Automated trip protection: 50/51 Overcurrent & 87T Transformer Differential Protection active.
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#004B91] hover:bg-blue-800 text-white font-mono font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-sky-300" />
            <span>Open Single Line Diagram (SLD) & Power Quality Audit</span>
          </button>
        </div>

        {/* EVN THREE-TIER TARIFF RATES */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">EVN Tariff Structure</div>
              <h3 className="text-sm font-black text-slate-900">Port Electricity Rates (VND/kWh)</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
              Medium Voltage 22kV
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Off-Peak (Giờ Thấp Điểm)</span>
                <span className="text-[10px] text-emerald-700 font-mono">22:00 - 04:00 (Daily)</span>
              </div>
              <strong className="text-sm font-black text-emerald-800 font-mono">
                {tariff.offPeakRateVnd.toLocaleString()} đ
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 block">Normal Hours (Giờ Bình Thường)</span>
                <span className="text-[10px] text-blue-700 font-mono">04:00 - 09:30, 11:30 - 17:00</span>
              </div>
              <strong className="text-sm font-black text-blue-800 font-mono">
                {tariff.normalRateVnd.toLocaleString()} đ
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-950 block">Peak Hours (Giờ Cao Điểm)</span>
                <span className="text-[10px] text-rose-700 font-mono">09:30 - 11:30, 17:00 - 20:00</span>
              </div>
              <strong className="text-sm font-black text-rose-800 font-mono">
                {tariff.peakRateVnd.toLocaleString()} đ
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
        />
      )}
    </div>
  );
};
