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
import { VesselCarbonInvoicePage, CarbonTab } from "./pages/VesselCarbonInvoicePage";
import { VesselSchedulePage } from "./pages/VesselSchedulePage";
import { PartnersPage } from "./pages/PartnersPage";
import { MeterTelemetryModal, MeterModalMode } from "./components/MeterTelemetryModal";
import { LanguageProvider } from "./context/LanguageContext";
import type { ForecastHandoff } from "./data/module3PeakShaving";

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

  // Automatically collapse the main sidebar when entering Telemetry Feeds to maximize 2D map & timeline space
  React.useEffect(() => {
    if (activeSubPage === "INPUT_LAYER") {
      setSidebarCollapsed(true);
    }
  }, [activeSubPage]);

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

  // Modals & Cross-Page Deep-Linking States
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [meterAssetId, setMeterAssetId] = useState<string>("UC-01");
  const [meterModalMode, setMeterModalMode] = useState<MeterModalMode | undefined>(undefined);
  const [focusedInvoiceId, setFocusedInvoiceId] = useState<string | null>(null);
  const [focusedTelemetryEntityId, setFocusedTelemetryEntityId] = useState<string | null>(null);
  const [focusedTelemetryPopupMode, setFocusedTelemetryPopupMode] = useState<"TURNAROUND" | "BREAKDOWN">("TURNAROUND");
  const [focusedForecastWindowId, setFocusedForecastWindowId] = useState<string | null>(null);
  const [focusedForecastOpenReport, setFocusedForecastOpenReport] = useState<boolean>(false);

  const handleOpenMeterModal = (assetId?: any, mode?: MeterModalMode) => {
    if (typeof assetId === "string" && assetId.trim().length > 0) {
      setMeterAssetId(assetId.trim());
    } else {
      setMeterAssetId("UC-01");
    }
    setMeterModalMode(mode);
    setShowMeterModal(true);
  };

  const handleOpenCarbonInvoice = (invoiceOrUseCaseId?: string) => {
    if (invoiceOrUseCaseId) {
      setFocusedInvoiceId(invoiceOrUseCaseId);
    }
    setActiveSubPage("VESSEL_CARBON_INVOICE");
  };

  const handleTraceVoyageInTelemetry = (
    vesselEntityId: string,
    popupMode: "TURNAROUND" | "BREAKDOWN" = "TURNAROUND"
  ) => {
    setFocusedTelemetryEntityId(vesselEntityId);
    setFocusedTelemetryPopupMode(popupMode);
    setActiveSubPage("INPUT_LAYER");
  };

  const handleInspectForecastWindow = (
    windowId: string,
    openReport: boolean = false
  ) => {
    setFocusedForecastWindowId(windowId);
    setFocusedForecastOpenReport(openReport);
    setActiveSubPage("MODULE_1_FORECAST");
  };

  // Module 3 → Module 2 link (open the IPMVP verification)
  const [carbonInitialTab, setCarbonInitialTab] = useState<CarbonTab | null>(null);

  // Module 1 → Module 3 hand-off (overload window sent to Peak Shaving)
  const [forecastHandoff, setForecastHandoff] = useState<ForecastHandoff | null>(null);

  const handleSendToPeakShaving = (handoff: ForecastHandoff) => {
    setForecastHandoff(handoff);
    setActiveSubPage("MODULE_3_OPTIMIZATION");
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
    <LanguageProvider>
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

        {/* RIGHT MAIN CONTENT AREA - Independent Scrollbar (Full-bleed flex container on INPUT_LAYER) */}
        <main
          className={
            activeSubPage === "INPUT_LAYER"
              ? "flex-1 h-full overflow-hidden bg-slate-50/70 p-2 sm:p-3 flex flex-col min-w-0 min-h-0"
              : "flex-1 h-full overflow-y-auto bg-slate-50/70 p-4 sm:p-6 min-w-0"
          }
        >
          {/* Subpage Routing */}
          <div
            className={
              activeSubPage === "INPUT_LAYER"
                ? "w-full h-full flex-1 min-h-0 flex flex-col"
                : "max-w-7xl mx-auto"
            }
          >
            {activeSubPage === "OVERVIEW" && (
              <OverviewPage
                vessels={vessels}
                tariff={tariff}
                pvStatus={pvStatus}
                bessStatus={bessStatus}
                zoneEmissions={zoneEmissions}
                onNavigate={setActiveSubPage}
                onOpenCarbonInvoice={handleOpenCarbonInvoice}
                onOpenMeterModal={handleOpenMeterModal}
                onTraceEntityInTelemetry={handleTraceVoyageInTelemetry}
                onInspectForecastWindow={handleInspectForecastWindow}
              />
            )}

            {activeSubPage === "ECO_CALCULATOR" && (
              <EcoCalculatorPage onOpenMeterModal={handleOpenMeterModal} />
            )}

            {activeSubPage === "INPUT_LAYER" && (
              <InputLayerPage
                onOpenMeterModal={handleOpenMeterModal}
                onNavigate={setActiveSubPage}
                onOpenCarbonInvoice={handleOpenCarbonInvoice}
                focusedTelemetryEntityId={focusedTelemetryEntityId}
                focusedTelemetryPopupMode={focusedTelemetryPopupMode}
                onClearFocusedTelemetryEntity={() =>
                  setFocusedTelemetryEntityId(null)
                }
              />
            )}

            {activeSubPage === "MODULE_1_FORECAST" && (
              <ForecastPage
                forecastData={forecastData}
                vessels={vessels}
                tariff={tariff}
                pvStatus={pvStatus}
                focusedWindowId={focusedForecastWindowId}
                focusedWindowOpenReport={focusedForecastOpenReport}
                onClearFocusedWindow={() => setFocusedForecastWindowId(null)}
                onNavigate={setActiveSubPage}
                onSendToPeakShaving={handleSendToPeakShaving}
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
                forecastHandoff={forecastHandoff}
                onDismissForecastHandoff={() => setForecastHandoff(null)}
                onBackToForecast={() => setActiveSubPage("MODULE_1_FORECAST")}
                onNavigate={setActiveSubPage}
                onVerifyInModule2={() => {
                  setCarbonInitialTab("METHOD");
                  setActiveSubPage("VESSEL_CARBON_INVOICE");
                }}
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
                focusedInvoiceId={focusedInvoiceId}
                onClearFocusedInvoice={() => setFocusedInvoiceId(null)}
                onTraceVoyageInTelemetry={handleTraceVoyageInTelemetry}
                initialTab={carbonInitialTab}
                onClearInitialTab={() => setCarbonInitialTab(null)}
              />
            )}

            {activeSubPage === "PARTNERS" && (
              <PartnersPage />
            )}
          </div>
        </main>
      </div>

      {/* Floating Eco Routing shortcut temporarily hidden alongside Routing & Schedules */}

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
        initialMode={meterModalMode}
        onOpenCarbonInvoice={(invoiceNo) => handleOpenCarbonInvoice(invoiceNo)}
        onTraceVoyageInTelemetry={(vesselEntityId) =>
          handleTraceVoyageInTelemetry(vesselEntityId)
        }
      />
    </div>
    </LanguageProvider>
  );
}
