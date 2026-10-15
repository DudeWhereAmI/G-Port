/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  UserRole, 
  SubPageId, 
  Asset, 
  OpLog, 
  CarbonInvoice, 
  TosVesselSchedule 
} from "./types/gport";
import { 
  MOCK_VESSELS, 
  MOCK_EPORT_CONTAINERS, 
  MOCK_PV_STATUS, 
  MOCK_BESS_STATUS, 
  MOCK_SCADA_STATUS, 
  MOCK_WEATHER, 
  MOCK_TARIFF, 
  MOCK_FEEDERS, 
  MOCK_15MIN_FORECAST, 
  MOCK_ZONE_EMISSIONS, 
  MOCK_CARBON_INVOICES,
  MOCK_INITIAL_ASSETS,
  MOCK_INITIAL_LOGS
} from "./data/mockPortData";
import { 
  DYNAMIC_ACTIVITY_CONFIG, 
  ACTIVITY_CONFIG, 
  ADMIN_ZONES 
} from "./data/activityConfig";

import { EnterpriseHeader } from "./components/EnterpriseHeader";
import { SidebarNavigation } from "./components/SidebarNavigation";
import { OverviewPage } from "./pages/OverviewPage";
import { EcoCalculatorPage } from "./pages/EcoCalculatorPage";
import { InputLayerPage } from "./pages/InputLayerPage";
import { ForecastPage } from "./pages/ForecastPage";
import { MeasurementPage } from "./pages/MeasurementPage";
import { OptimizationPage } from "./pages/OptimizationPage";
import { VesselCarbonInvoicePage } from "./pages/VesselCarbonInvoicePage";
import { VesselSchedulePage } from "./pages/VesselSchedulePage";
import { PartnersPage } from "./pages/PartnersPage";
import { MeterTelemetryModal } from "./components/MeterTelemetryModal";

import { 
  X, 
  MessageSquare,
  Activity,
  SunMedium,
  BatteryCharging,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function App() {
  // Navigation & Role states
  const [activeSubPage, setActiveSubPage] = useState<SubPageId>("OVERVIEW");
  const [currentRole, setCurrentRole] = useState<UserRole>("ADMIN");
  const [currentUserEmail, setCurrentUserEmail] = useState("admin@gport.maritime.vn");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Application Data States
  const [vessels, setVessels] = useState<TosVesselSchedule[]>(MOCK_VESSELS);
  const [containers, setContainers] = useState(MOCK_EPORT_CONTAINERS);
  const [pvStatus, setPvStatus] = useState(MOCK_PV_STATUS);
  const [bessStatus, setBessStatus] = useState(MOCK_BESS_STATUS);
  const [scadaStatus, setScadaStatus] = useState(MOCK_SCADA_STATUS);
  const [weather, setWeather] = useState(MOCK_WEATHER);
  const [tariff, setTariff] = useState(MOCK_TARIFF);
  const [feeders, setFeeders] = useState(MOCK_FEEDERS);
  const [forecastData, setForecastData] = useState(MOCK_15MIN_FORECAST);
  const [zoneEmissions, setZoneEmissions] = useState(MOCK_ZONE_EMISSIONS);
  const [invoices, setInvoices] = useState<CarbonInvoice[]>(MOCK_CARBON_INVOICES);
  const [assets, setAssets] = useState<Asset[]>(MOCK_INITIAL_ASSETS);
  const [opLogs, setOpLogs] = useState<OpLog[]>(MOCK_INITIAL_LOGS);

  // Modals
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [meterAssetId, setMeterAssetId] = useState<string>("60H03961_C");

  const handleOpenMeterModal = (assetId?: any) => {
    if (typeof assetId === "string" && assetId.trim().length > 0) {
      setMeterAssetId(assetId.trim());
    } else {
      setMeterAssetId("UC-01");
    }
    setShowMeterModal(true);
  };

  // Asset Form State
  const [selectedActivityId, setSelectedActivityId] = useState<string>("sts_crane");
  const [assetFormData, setAssetFormData] = useState<Record<string, string>>({
    asset_name: "Ship-to-Shore Crane STS #05",
    rated_power_kw: "480",
    power_source: "Grid",
    initial_capex: "5400000"
  });

  // Log Form State
  const [logFormData, setLogFormData] = useState<Record<string, string>>({
    operating_hours: "8",
    electricity_kwh: "1250",
    fuel_liters: "0",
    teu_handled: "160"
  });

  // Handle Add Asset Submission
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsset: Asset = {
      id: `AST-${Date.now().toString().slice(-4)}`,
      activityId: selectedActivityId,
      activityLabel: ACTIVITY_CONFIG.ADMIN.find((a: any) => a.id === selectedActivityId)?.label || "New Asset",
      tenantId: "PORT_AUTHORITY",
      businessType: "G-Port Terminal",
      data: {
        ...assetFormData,
        asset_id: `AST-${Date.now().toString().slice(-4)}`
      },
      createdAt: new Date().toISOString()
    };

    setAssets([newAsset, ...assets]);
    setShowAddAssetModal(false);
  };

  // Handle Add OpLog Submission
  const handleSaveOpLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: OpLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      logActivityId: selectedActivityId,
      activityName: assetFormData.asset_name || "STS Crane Operation",
      activityDate: new Date().toISOString().split("T")[0],
      assetId: assets[0]?.id || "AST-01",
      activityCategoryId: "OPERATIONS",
      activityLabel: "Shift Operations",
      data: { ...logFormData },
      timestamp: new Date().toISOString(),
      shift: "Morning Shift (06:00 - 14:00)",
      source: "MANUAL"
    };

    setOpLogs([newLog, ...opLogs]);
    setShowAddLogModal(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      {/* ENTERPRISE TOP HEADER - Fixed at top, zero scrollbars */}
      <div className="flex-none z-40">
        <EnterpriseHeader
          currentRole={currentRole}
          onChangeRole={setCurrentRole}
          onNavigate={setActiveSubPage}
          activeSubPage={activeSubPage}
          onOpenMeterModal={handleOpenMeterModal}
        />
      </div>

      {/* TWO-COLUMN ENTERPRISE WORKSPACE: SIDEBAR ON LEFT + MAIN SUBPAGE */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT SIDEBAR TOOL NAVIGATION - Independent Scrollbar */}
        <SidebarNavigation
          activeSubPage={activeSubPage}
          onSelectSubPage={setActiveSubPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* RIGHT MAIN CONTENT AREA - Independent Scrollbar */}
        <main className="flex-1 h-full overflow-y-auto bg-slate-50/70 p-4 sm:p-6 lg:p-8">
          {/* Microgrid Quick Telemetry Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Microgrid Live:
              </span>
              <span className="text-slate-600">Grid Demand: <b className="text-slate-900">{scadaStatus.gridActivePowerKw.toLocaleString()} kW</b></span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">Solar PV: <b className="text-emerald-600">+{pvStatus.currentPowerKw.toLocaleString()} kW</b></span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">BESS SOC: <b className="text-blue-600">{bessStatus.socPercent}%</b></span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                GLEC & IMO DCS Certified
              </span>
              <span className="hidden sm:inline">Telemetry Hash: #DCSA-9941-OK</span>
            </div>
          </div>

          {/* Subpage Routing */}
          <div className="max-w-7xl mx-auto">
            {activeSubPage === "OVERVIEW" && (
              <OverviewPage
                vessels={vessels}
                tariff={tariff}
                pvStatus={pvStatus}
                bessStatus={bessStatus}
                scadaStatus={scadaStatus}
                weather={weather}
                forecastData={forecastData}
                zoneEmissions={zoneEmissions}
                invoices={invoices}
                onNavigate={setActiveSubPage}
              />
            )}

            {activeSubPage === "ECO_CALCULATOR" && (
              <EcoCalculatorPage onOpenMeterModal={handleOpenMeterModal} />
            )}

            {activeSubPage === "INPUT_LAYER" && (
              <InputLayerPage
                vessels={vessels}
                containers={containers}
                pvStatus={pvStatus}
                bessStatus={bessStatus}
                scadaStatus={scadaStatus}
                weather={weather}
                tariff={tariff}
                feeders={feeders}
                forecastData={forecastData}
                onUpdateTariff={setTariff}
                onOpenMeterModal={handleOpenMeterModal}
                onNavigate={setActiveSubPage}
              />
            )}

            {activeSubPage === "MODULE_1_FORECAST" && (
              <ForecastPage
                forecastData={forecastData}
                vessels={vessels}
                tariff={tariff}
                pvStatus={pvStatus}
              />
            )}

            {activeSubPage === "MODULE_2_MEASUREMENT" && (
              <MeasurementPage
                zoneEmissions={zoneEmissions}
                assets={assets}
                opLogs={opLogs}
                currentRole={currentRole}
                onAddAsset={() => setShowAddAssetModal(true)}
                onAddOpLog={() => setShowAddLogModal(true)}
              />
            )}

            {activeSubPage === "MODULE_3_OPTIMIZATION" && (
              <OptimizationPage
                tariff={tariff}
                bessStatus={bessStatus}
                pvStatus={pvStatus}
              />
            )}

            {activeSubPage === "VESSEL_SCHEDULE" && (
              <VesselSchedulePage
                vessels={vessels}
                onNavigate={(page) => setActiveSubPage(page)}
              />
            )}

            {activeSubPage === "VESSEL_CARBON_INVOICE" && (
              <VesselCarbonInvoicePage
                invoices={invoices}
                vessels={vessels}
                onNavigate={(page) => setActiveSubPage(page)}
                onOpenMeterModal={handleOpenMeterModal}
              />
            )}

            {activeSubPage === "PARTNERS" && (
              <PartnersPage />
            )}
          </div>
        </main>
      </div>

      {/* FLOATING CHAT / HELP WIDGET */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setActiveSubPage("ECO_CALCULATOR")}
          title="Eco Routing & Technical Support"
          className="w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 bg-[#004B91]"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* MODAL: ADD ASSET */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Register Port Asset</h3>
                <p className="text-xs text-slate-500">Add asset technical specs and baseline energy rating</p>
              </div>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Equipment Category:</label>
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="sts_crane">Ship-to-Shore Crane (STS)</option>
                  <option value="ertg_crane">Electric Rubber-Tired Gantry (e-RTG)</option>
                  <option value="terminal_tractor">Terminal Internal Tractor</option>
                  <option value="reefer_plug">Reefer Yard Monitoring System</option>
                  <option value="tugboat">Harbor Tugboat Service</option>
                  <option value="barge_crane">Barge Heavy Crane</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Equipment Identifier / Tag:</label>
                <input
                  type="text"
                  required
                  value={assetFormData.asset_name || ""}
                  onChange={(e) => setAssetFormData({ ...assetFormData, asset_name: e.target.value })}
                  placeholder="e.g. STS Crane #04 - Berth 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Power Source:</label>
                  <select
                    value={assetFormData.power_source || "Grid"}
                    onChange={(e) => setAssetFormData({ ...assetFormData, power_source: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Grid">Utility Grid Electricity</option>
                    <option value="Diesel">Diesel (DO / MGO)</option>
                    <option value="Solar">Rooftop Solar PV</option>
                    <option value="Hybrid">Hybrid Diesel-Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rated Power (kW):</label>
                  <input
                    type="number"
                    value={assetFormData.rated_power_kw || ""}
                    onChange={(e) => setAssetFormData({ ...assetFormData, rated_power_kw: e.target.value })}
                    placeholder="e.g. 450"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Initial CapEx (USD):</label>
                <input
                  type="number"
                  value={assetFormData.initial_capex || ""}
                  onChange={(e) => setAssetFormData({ ...assetFormData, initial_capex: e.target.value })}
                  placeholder="e.g. 5200000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl font-bold shadow-xs"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD OP LOG */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Record Shift Operations Log</h3>
                <p className="text-xs text-slate-500">Log handled TEU throughput and energy metrics</p>
              </div>
              <button
                onClick={() => setShowAddLogModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Equipment / Asset Tag:</label>
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.data.asset_name || a.id} ({a.activityLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Operating Hours:</label>
                  <input
                    type="number"
                    value={logFormData.operating_hours || "8"}
                    onChange={(e) => setLogFormData({ ...logFormData, operating_hours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Handled TEU:</label>
                  <input
                    type="number"
                    value={logFormData.teu_handled || "120"}
                    onChange={(e) => setLogFormData({ ...logFormData, teu_handled: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Electricity Consumed (kWh):</label>
                  <input
                    type="number"
                    value={logFormData.electricity_kwh || "0"}
                    onChange={(e) => setLogFormData({ ...logFormData, electricity_kwh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fuel Consumed (Liters):</label>
                  <input
                    type="number"
                    value={logFormData.fuel_liters || "0"}
                    onChange={(e) => setLogFormData({ ...logFormData, fuel_liters: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-rose-600 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Shift Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* METER & TELEMETRY USAGE DIAGRAM MODAL */}
      <MeterTelemetryModal
        isOpen={showMeterModal}
        onClose={() => setShowMeterModal(false)}
        initialAssetId={meterAssetId}
      />
    </div>
  );
}
