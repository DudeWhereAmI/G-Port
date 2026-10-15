import React, { useState } from "react";
import { 
  ZoneEmissionSummary, 
  Asset, 
  OpLog, 
  UserRole 
} from "../types/gport";
import { 
  Leaf, 
  Layers, 
  Fuel, 
  Zap, 
  TrendingDown, 
  Plus, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  Ship, 
  Clock, 
  Database,
  ChevronRight
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid 
} from "recharts";

interface MeasurementPageProps {
  zoneEmissions: ZoneEmissionSummary[];
  assets: Asset[];
  opLogs: OpLog[];
  currentRole: UserRole;
  onAddAsset: () => void;
  onAddOpLog: () => void;
}

export const MeasurementPage: React.FC<MeasurementPageProps> = ({
  zoneEmissions,
  assets,
  opLogs,
  currentRole,
  onAddAsset,
  onAddOpLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"EMISSIONS" | "ASSETS" | "OP_LOGS" | "HIERARCHY">("EMISSIONS");

  const totalScope1Kg = zoneEmissions.reduce((acc, curr) => acc + curr.scope1Co2Kg, 0);
  const totalScope2Kg = zoneEmissions.reduce((acc, curr) => acc + curr.scope2Co2Kg, 0);
  const grandTotalCo2Kg = totalScope1Kg + totalScope2Kg;
  const totalElectricityKwh = zoneEmissions.reduce((acc, curr) => acc + curr.electricityKwh, 0);
  const totalFuelLiters = zoneEmissions.reduce((acc, curr) => acc + curr.fuelLiters, 0);

  // Assumption: 3,200 TEU handled in current operational period
  const totalTeu = 3200;
  const emissionIntensityPerTeu = (grandTotalCo2Kg / totalTeu).toFixed(2);

  const pieData = [
    { name: "Scope 1 (Direct Fuel)", value: totalScope1Kg, color: "#E55061" },
    { name: "Scope 2 (Grid Electricity)", value: totalScope2Kg, color: "#004B91" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">Module 02</span>
            <span aria-hidden="true">·</span>
            <span>Energy & Carbon MRV</span>
            <span aria-hidden="true">·</span>
            <span>ISO 14064 & IMO MEPC.308</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Emissions Quantification & Carbon Intensity (kgCO₂e/TEU)
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Real-time energy consumption telemetry aggregated across terminal sub-zones, computing Scope 1 direct combustion and Scope 2 indirect grid emissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onAddOpLog}
            className="px-3.5 py-2 bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Operations</span>
          </button>
          <button
            onClick={onAddAsset}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Total Terminal Emissions</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {(grandTotalCo2Kg / 1000).toFixed(2)} <span className="text-xs font-semibold text-slate-500">tCO₂e</span>
          </div>
          <div className="text-xs text-slate-500">
            {grandTotalCo2Kg.toLocaleString()} kg CO₂ equivalent
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Carbon Intensity</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mb-1">
            {emissionIntensityPerTeu} <span className="text-xs font-semibold text-slate-500">kgCO₂e/TEU</span>
          </div>
          <div className="text-xs text-emerald-700 font-semibold">
            Green Port Class A benchmark (&lt; 20 kg)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Scope 1 (Direct Fuel)</span>
            <Fuel className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {(totalScope1Kg / 1000).toFixed(2)} <span className="text-xs font-semibold text-slate-500">tCO₂e</span>
          </div>
          <div className="text-xs text-slate-500">
            {totalFuelLiters.toLocaleString()} Liters DO/FO consumed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Scope 2 (Grid Power)</span>
            <Zap className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {(totalScope2Kg / 1000).toFixed(2)} <span className="text-xs font-semibold text-slate-500">tCO₂e</span>
          </div>
          <div className="text-xs text-slate-500">
            {totalElectricityKwh.toLocaleString()} kWh (Grid factor: 0.7221)
          </div>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl max-w-fit">
        <button
          onClick={() => setActiveSubTab("EMISSIONS")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === "EMISSIONS"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Zone Analysis (Zones 1-4)
        </button>
        <button
          onClick={() => setActiveSubTab("ASSETS")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === "ASSETS"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Asset Register ({assets.length})
        </button>
        <button
          onClick={() => setActiveSubTab("OP_LOGS")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === "OP_LOGS"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Operational Logs ({opLogs.length})
        </button>
        <button
          onClick={() => setActiveSubTab("HIERARCHY")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === "HIERARCHY"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Hierarchy of Trust (Audit)
        </button>
      </div>

      {/* TAB 1: EMISSIONS BREAKDOWN */}
      {activeSubTab === "EMISSIONS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Scope 1 vs Scope 2 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Scope 1 vs Scope 2 Distribution
                </h3>
                <p className="text-xs text-slate-500">Proportional split between direct fuel burn and grid power</p>
              </div>

              <div className="h-52 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${(Number(value) / 1000).toFixed(2)} tCO₂e`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                    Scope 1 (Direct Fuel):
                  </span>
                  <strong className="text-slate-900">
                    {Math.round((totalScope1Kg / grandTotalCo2Kg) * 100)}% ({(totalScope1Kg / 1000).toFixed(1)} t)
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#004B91]" />
                    Scope 2 (Grid Electricity):
                  </span>
                  <strong className="text-slate-900">
                    {Math.round((totalScope2Kg / grandTotalCo2Kg) * 100)}% ({(totalScope2Kg / 1000).toFixed(1)} t)
                  </strong>
                </div>
              </div>
            </div>

            {/* Zone Comparison Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Emissions by Substation Zone (Zones 1 - 4)
                  </h3>
                  <p className="text-xs text-slate-500">Cross-zonal comparison of Scope 1 and Scope 2 operational footprints</p>
                </div>
                <span className="text-xs font-mono text-slate-400">kg CO₂e</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneEmissions} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="zoneId" 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickFormatter={(val) => val.replace("_", " ")} 
                    />
                    <YAxis stroke="#64748B" fontSize={11} unit=" kg" />
                    <Tooltip formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} kg`, name]} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="scope1Co2Kg" name="Scope 1 (Fuel)" fill="#E55061" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="scope2Co2Kg" name="Scope 2 (Grid)" fill="#004B91" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Zone Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Zonal Energy & Carbon Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="py-2.5 px-3">Zone Identifier</th>
                    <th className="py-2.5 px-3 font-mono">Electricity (kWh)</th>
                    <th className="py-2.5 px-3 font-mono">Fuel (Liters)</th>
                    <th className="py-2.5 px-3 font-mono">Scope 1 (kg CO₂)</th>
                    <th className="py-2.5 px-3 font-mono">Scope 2 (kg CO₂)</th>
                    <th className="py-2.5 px-3 font-mono">Total Footprint</th>
                    <th className="py-2.5 px-3">Zonal Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zoneEmissions.map((z) => (
                    <tr key={z.zoneId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{z.zoneName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{z.electricityKwh.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{z.fuelLiters.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600">{z.scope1Co2Kg.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#004B91]">{z.scope2Co2Kg.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">{z.totalCo2Kg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 font-bold">{z.sharePercent}%</span>
                          <div className="w-16 bg-slate-100 rounded-xs h-1.5 overflow-hidden">
                            <div className="h-1.5 bg-[#004B91] rounded-xs" style={{ width: `${z.sharePercent}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSETS REGISTER */}
      {activeSubTab === "ASSETS" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Equipment & Machinery Energy Profile Register
              </h3>
              <p className="text-xs text-slate-500">
                Audited inventory of electrified and combustion-based port machinery
              </p>
            </div>
            <button
              onClick={onAddAsset}
              className="px-3 py-1.5 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] transition-colors"
            >
              + Register New Asset
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="py-2.5 px-3">Asset Name & ID</th>
                  <th className="py-2.5 px-3">Equipment Class</th>
                  <th className="py-2.5 px-3">Power Source</th>
                  <th className="py-2.5 px-3 font-mono">Rated Power</th>
                  <th className="py-2.5 px-3">Operational Terminal</th>
                  <th className="py-2.5 px-3 font-mono">Capex Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{asset.data.asset_name || asset.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{asset.data.asset_id || asset.id}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{asset.activityLabel}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono text-[11px] font-bold ${
                        asset.data.power_source === "Grid" ? "text-blue-700" :
                        asset.data.fuel_type === "Diesel" ? "text-amber-800" : "text-emerald-700"
                      }`}>
                        {asset.data.power_source || asset.data.fuel_type || "Grid Power"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">
                      {asset.data.rated_power_kw || asset.data.engine_max_power_kw || "N/A"} kW
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{asset.businessType}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {asset.data.initial_capex ? `$${(Number(asset.data.initial_capex) / 25000).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL LOGS */}
      {activeSubTab === "OP_LOGS" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Operational Run-Time & Fuel Consumption Logs
              </h3>
              <p className="text-xs text-slate-500">
                Direct work-shift telemetry from smart meters and fuel bunkering flow sensors
              </p>
            </div>
            <button
              onClick={onAddOpLog}
              className="px-3 py-1.5 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] transition-colors"
            >
              + Record Shift Entry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="py-2.5 px-3">Date & Shift</th>
                  <th className="py-2.5 px-3">Asset / Machinery Activity</th>
                  <th className="py-2.5 px-3 font-mono">Run Time</th>
                  <th className="py-2.5 px-3 font-mono">Electricity (kWh)</th>
                  <th className="py-2.5 px-3 font-mono">Fuel (Liters)</th>
                  <th className="py-2.5 px-3">Ingestion Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{log.activityDate}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.shift || "Day Shift"}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{log.activityName}</div>
                      <div className="text-[10px] text-slate-400">{log.activityLabel}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{log.data.operating_hours || "8"} hrs</td>
                    <td className="py-2.5 px-3 font-mono text-[#004B91] font-bold">{log.data.electricity_kwh || "0"} kWh</td>
                    <td className="py-2.5 px-3 font-mono text-rose-600 font-bold">{log.data.fuel_liters || "0"} L</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {log.source === "AUTO" ? (
                        <span className="text-emerald-700 font-bold">IoT SCADA Stream</span>
                      ) : log.source === "BATCH" ? (
                        <span className="text-blue-700 font-bold">Batch CSV Sync</span>
                      ) : (
                        <span className="text-slate-600">Manual Entry</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HIERARCHY OF TRUST */}
      {activeSubTab === "HIERARCHY" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Data Lineage & Audit Hierarchy (Hierarchy of Trust)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Immutable data verification framework ensuring emissions numbers withstand third-party audit for EU ETS and IMO DCS declarations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Tier 1 • Automated Primary</span>
                <span className="w-2 h-2 rounded-xs bg-emerald-500" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">Hardware-Authenticated Telemetry</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct API streams from TOS (CATOS/Navis), revenue-grade SCADA meters, and smart OPS pedestals with HMAC-SHA256 signatures. Immutable and audit-locked.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#004B91]">Tier 2 • Batch Reconciliation</span>
                <span className="w-2 h-2 rounded-xs bg-[#004B91]" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">Certified Batch Uploads</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aggregated fuel bunkering manifests, contractor tugboat timesheets, and third-party trucking logs uploaded with cryptographic supervisor signatures.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Tier 3 • Manual Audit Trail</span>
                <span className="w-2 h-2 rounded-xs bg-amber-500" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">Supervised Operator Entry</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contingency records for sensor telemetry outages. Automatically triggers an audit trail record capturing operator ID, timestamp, and justification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
