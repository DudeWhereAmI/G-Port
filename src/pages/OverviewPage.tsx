import React from "react";
import {
  SubPageId,
  TosVesselSchedule,
  PvSystemStatus,
  BessSystemStatus,
  ElectricityTariffTou,
  ZoneEmissionSummary,
} from "../types/gport";
import {
  Zap,
  SunMedium,
  BatteryCharging,
  Ship,
  TrendingDown,
  ShieldCheck,
  Leaf,
  Clock,
  PlugZap,
  Server,
  FileText,
  ArrowRight,
  Flame,
} from "lucide-react";

interface OverviewPageProps {
  onNavigate: (page: SubPageId) => void;
  vessels: TosVesselSchedule[];
  pvStatus: PvSystemStatus;
  bessStatus: BessSystemStatus;
  tariff: ElectricityTariffTou;
  zoneEmissions?: ZoneEmissionSummary[];
  onOpenCarbonInvoice?: (invoiceOrUseCaseId?: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  vessels,
  pvStatus,
  bessStatus,
  tariff,
  zoneEmissions = [],
  onOpenCarbonInvoice,
}) => {
  const totalLoadKw =
    tariff.currentDemandKw + pvStatus.currentPowerKw + bessStatus.currentPowerKw;
  const pContractLimitKw = tariff.contractDemandKw;
  const safetyMarginPercent = Math.round(
    ((pContractLimitKw - tariff.currentDemandKw) / pContractLimitKw) * 100
  );

  const totalScope1Tons =
    zoneEmissions.reduce((acc, z) => acc + z.scope1Co2Kg, 0) / 1000;
  const totalScope2Tons =
    zoneEmissions.reduce((acc, z) => acc + z.scope2Co2Kg, 0) / 1000;
  const totalPortEmissionsTons = totalScope1Tons + totalScope2Tons;

  // Port-wide non-vessel-specific feeders & infrastructure (moved out of Telemetry Feeds)
  const liveFeederLoads = [
    {
      code: "F-01",
      name: "STS Quay Cranes (Berth 1–2)",
      kw: 2480,
      capacityKw: 3500,
      zone: "Quay Zone 1",
      color: "#2E598E",
    },
    {
      code: "F-02",
      name: "Reefer Container Cooling Racks",
      kw: 1650,
      capacityKw: 2400,
      zone: "Yard Zone 3",
      color: "#0284C7",
    },
    {
      code: "F-03",
      name: "e-RTG Yard Gantries (Bays B1–B4)",
      kw: 1260,
      capacityKw: 2000,
      zone: "Yard Zone 2",
      color: "#4A81C9",
    },
    {
      code: "F-04",
      name: "Shore Power (OPS) Substation",
      kw: 1050,
      capacityKw: 2500,
      zone: "Quay Zone 1",
      color: "#10B981",
    },
    {
      code: "F-05",
      name: "EV Yard Truck Fast Chargers",
      kw: 340,
      capacityKw: 800,
      zone: "Gate & Depot",
      color: "#6366F1",
    },
    {
      code: "F-06",
      name: "CFS Warehouses, Lighting & Admin",
      kw: 180,
      capacityKw: 500,
      zone: "Port Admin",
      color: "#64748B",
    },
  ];

  const tariffBands = [
    {
      band: "Off-Peak Window",
      hours: "22:00 – 04:00",
      rate: "1,146 VND/kWh",
      action: "BESS Grid Charging & Pre-Cooling Reefers",
      active: false,
    },
    {
      band: "Standard Window",
      hours: "04:00 – 09:30 · 11:30 – 17:00 · 20:00 – 22:00",
      rate: "1,811 VND/kWh",
      action: "Balanced Grid + Solar PV Self-Consumption",
      active: false,
    },
    {
      band: "Peak Window",
      hours: "09:30 – 11:30 · 17:00 – 20:00",
      rate: "3,076 VND/kWh",
      action: "BESS Peak Shaving Discharge Active",
      active: true,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Clean Minimal Header without duplicate action buttons */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <span className="font-bold text-[#004B91]">Terminal Operations</span>
            <span aria-hidden="true">·</span>
            <span>Cat Lai & Cai Mep Deep-Sea Terminals</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Port Energy & Emissions MRV Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            EVN Peak Tariff · 3,076 VND/kWh
          </span>
        </div>
      </div>

      {/* Top 4 Terminal-Wide KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Terminal Power</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {totalLoadKw.toLocaleString()}{" "}
            <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <SunMedium className="w-3.5 h-3.5" /> 23.9% Solar
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              <BatteryCharging className="w-3.5 h-3.5" /> 8.5% BESS
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Grid Contract Limit</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {tariff.currentDemandKw.toLocaleString()} /{" "}
            {pContractLimitKw.toLocaleString()}{" "}
            <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((tariff.currentDemandKw / pContractLimitKw) * 100)
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
            <span>{safetyMarginPercent}% headroom</span>
            <span className="text-emerald-600 font-bold">Within Limit</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Port Carbon Intensity</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mb-1">
            18.2{" "}
            <span className="text-sm font-semibold text-slate-600">
              kgCO₂e / TEU
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-14.2% YoY · {totalPortEmissionsTons.toFixed(1)} tCO₂e/day</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Calling Vessels at Berth</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {
              vessels.filter(
                (v) => v.status === "OPERATING" || v.status === "BERTHED"
              ).length
            }{" "}
            <span className="text-sm font-semibold text-slate-500">
              Active Vessels
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <PlugZap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Shore Power Connected</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Non-Vessel-Specific Terminal Infrastructure & Power Supply */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Port Power Supply Mix & Substation Feeder Load (F-01 to F-06) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                Port-Wide Power Supply & Substation Feeders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Shared terminal infrastructure and feeder loads not tied to a single vessel
              </p>
            </div>
          </div>

          {/* 3 Power Supply Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                National Grid (110kV)
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {tariff.currentDemandKw.toLocaleString()} kW
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                67.5% of total port demand
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Rooftop Solar PV
              </div>
              <div className="text-lg font-black text-emerald-700 mt-1">
                +{pvStatus.currentPowerKw.toLocaleString()} kW
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                23.9% share · Irradiance 845 W/m²
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                BESS Battery Storage
              </div>
              <div className="text-lg font-black text-amber-700 mt-1">
                +{bessStatus.currentPowerKw.toLocaleString()} kW
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                SOC {bessStatus.socPercent}% · Peak Shaving
              </div>
            </div>
          </div>

          {/* 6 Substation Feeders Breakdown */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Substation Feeder Distribution ({totalLoadKw.toLocaleString()} kW Total)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveFeederLoads.map((feeder) => {
                const utilization = Math.round(
                  (feeder.kw / feeder.capacityKw) * 100
                );
                return (
                  <div
                    key={feeder.code}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                          {feeder.code}
                        </span>
                        <span className="font-bold text-slate-900 truncate">
                          {feeder.name}
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 shrink-0">
                        {feeder.kw.toLocaleString()} kW
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${utilization}%`,
                          backgroundColor: feeder.color,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{feeder.zone}</span>
                      <span>
                        {utilization}% of {feeder.capacityKw.toLocaleString()} kW rated
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: EVN Tariff Schedule & Active Berth Summary */}
        <div className="space-y-6">
          {/* EVN Time-of-Use Schedule */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                EVN Tariff Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Daily electricity pricing windows for terminal dispatch
              </p>
            </div>

            <div className="space-y-2.5">
              {tariffBands.map((item) => (
                <div
                  key={item.band}
                  className={`p-3 rounded-xl border ${
                    item.active
                      ? "bg-amber-50/70 border-amber-200"
                      : "bg-slate-50/70 border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      {item.band}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        item.active ? "text-amber-700" : "text-slate-700"
                      }`}
                    >
                      {item.rate}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.hours}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 mt-1">
                    {item.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Berth Snapshot */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ship className="w-4 h-4 text-blue-600" />
                Berth Occupancy Summary
              </h3>
              <p className="text-xs text-slate-500">
                Current vessels moored at Cat Lai & Cai Mep berths
              </p>
            </div>

            <div className="space-y-2.5">
              {vessels
                .filter(
                  (v) => v.status === "OPERATING" || v.status === "BERTHED"
                )
                .map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        {v.vesselName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {v.berth} · {v.assignedCranes} Cranes · {v.handledTeu}/
                        {v.plannedTeu} TEU
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      {v.status === "OPERATING" ? "Unloading" : "Berthed"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Merged Terminal Emissions MRV by Zone (Scope 1 & Scope 2 Accounting) */}
      {zoneEmissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Terminal Emissions MRV by Operational Zone (ISO 14083)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated Scope 1 (Direct Fuel) and Scope 2 (Grid Electricity · EF 0.7221 kgCO₂e/kWh) accounting across port zones
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Scope 1: {totalScope1Tons.toFixed(2)} tCO₂e</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Scope 2: {totalScope2Tons.toFixed(2)} tCO₂e</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {zoneEmissions.map((z) => {
              const s1Tons = z.scope1Co2Kg / 1000;
              const s2Tons = z.scope2Co2Kg / 1000;
              const totTons = z.totalCo2Kg / 1000;
              return (
                <div
                  key={z.zoneId}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                        {z.zoneId}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {z.sharePercent}% Share
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {z.zoneName}
                    </h4>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Electricity (Scope 2):</span>
                      <strong className="font-mono text-slate-900">
                        {z.electricityKwh.toLocaleString()} kWh ({s2Tons.toFixed(2)}t)
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Diesel / Biofuel (Scope 1):</span>
                      <strong className="font-mono text-slate-900">
                        {z.fuelLiters.toLocaleString()} L ({s1Tons.toFixed(2)}t)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, z.sharePercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Zone Total CO₂e
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        {totTons.toFixed(2)} tCO₂e
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

