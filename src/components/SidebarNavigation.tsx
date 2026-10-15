import React, { useState, useEffect } from "react";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  FileText, 
  HelpCircle, 
  ChevronDown, 
  Search, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Database, 
  TrendingUp, 
  Leaf, 
  Zap, 
  Handshake, 
  ArrowRight,
  Calculator,
  Ship,
  Sliders,
  Anchor
} from "lucide-react";
import { SubPageId } from "../types/gport";

interface SidebarNavigationProps {
  activeSubPage: SubPageId;
  onSelectSubPage: (page: SubPageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSubPage,
  onSelectSubPage,
  collapsed,
  onToggleCollapse
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  // Collapsible section states (clean single accordion)
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [energyOpen, setEnergyOpen] = useState(true);
  const [carbonOpen, setCarbonOpen] = useState(true);

  // Auto-expand the category of the active page
  useEffect(() => {
    if (activeSubPage === "ECO_CALCULATOR" || activeSubPage === "VESSEL_SCHEDULE") {
      setScheduleOpen(true);
    } else if (
      activeSubPage === "INPUT_LAYER" || 
      activeSubPage === "MODULE_1_FORECAST" || 
      activeSubPage === "MODULE_3_OPTIMIZATION"
    ) {
      setEnergyOpen(true);
    } else if (activeSubPage === "MODULE_2_MEASUREMENT" || activeSubPage === "VESSEL_CARBON_INVOICE") {
      setCarbonOpen(true);
    }
  }, [activeSubPage]);

  const handleNavigate = (page: SubPageId) => {
    onSelectSubPage(page);
  };

  return (
    <aside 
      className={`h-full bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none transition-all duration-200 ${
        collapsed ? "w-16" : "w-64 sm:w-72"
      }`}
    >
      {/* Top Search & Collapse Button */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
        {!collapsed && (
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search modules, schedules..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shrink-0"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Tree with its OWN INDEPENDENT SCROLLBAR */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5 text-xs">
        {/* 1. OVERVIEW */}
        <button
          onClick={() => handleNavigate("OVERVIEW")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            activeSubPage === "OVERVIEW"
              ? "bg-blue-50/80 text-[#004B91] font-black border-l-3 border-[#004B91]"
              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          }`}
          title="Overview"
        >
          <Home className={`w-4 h-4 shrink-0 ${activeSubPage === "OVERVIEW" ? "text-[#004B91]" : "text-slate-600"}`} />
          {!collapsed && <span>Overview</span>}
        </button>

        {/* 2. ROUTING & SCHEDULES */}
        <div className="space-y-0.5 pt-1">
          <button
            onClick={() => {
              if (collapsed) onToggleCollapse();
              setScheduleOpen(!scheduleOpen);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
              (activeSubPage === "ECO_CALCULATOR" || activeSubPage === "VESSEL_SCHEDULE")
                ? "text-[#004B91] bg-blue-50/70"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            title="Routing & Schedules"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#004B91] shrink-0" />
              {!collapsed && <span>Routing & Schedules</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  scheduleOpen ? "" : "-rotate-90"
                }`} 
              />
            )}
          </button>

          {(!collapsed && scheduleOpen) && (
            <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-4 py-0.5">
              <button
                onClick={() => handleNavigate("ECO_CALCULATOR")}
                className={`w-full text-left px-3 py-2 rounded-md font-bold transition-colors flex items-center justify-between ${
                  activeSubPage === "ECO_CALCULATOR"
                    ? "bg-[#004B91] text-white font-black shadow-2xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Eco Routing</span>
                </div>
                {activeSubPage === "ECO_CALCULATOR" ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004B91]" />
                )}
              </button>

              <button
                onClick={() => handleNavigate("VESSEL_SCHEDULE")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  activeSubPage === "VESSEL_SCHEDULE"
                    ? "bg-blue-100 font-bold text-[#004B91]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ship className="w-3.5 h-3.5 text-blue-600" />
                  <span>Berth Schedule</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-blue-100 text-[#004B91] font-bold">TOS</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. MICROGRID & SCADA */}
        <div className="space-y-0.5 pt-1">
          <button
            onClick={() => {
              if (collapsed) onToggleCollapse();
              setEnergyOpen(!energyOpen);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
              (activeSubPage === "INPUT_LAYER" || activeSubPage === "MODULE_1_FORECAST" || activeSubPage === "MODULE_3_OPTIMIZATION")
                ? "bg-blue-50/70 text-[#004B91]"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            title="Microgrid & SCADA"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              {!collapsed && <span>Microgrid & SCADA</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  energyOpen ? "" : "-rotate-90"
                }`} 
              />
            )}
          </button>

          {(!collapsed && energyOpen) && (
            <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-4 py-0.5">
              <button
                onClick={() => handleNavigate("INPUT_LAYER")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  activeSubPage === "INPUT_LAYER"
                    ? "bg-blue-100 text-[#004B91] font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Telemetry Feeds</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-blue-100 text-[#004B91] font-bold">L-01</span>
              </button>

              <button
                onClick={() => handleNavigate("MODULE_1_FORECAST")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  activeSubPage === "MODULE_1_FORECAST"
                    ? "bg-indigo-100/80 text-indigo-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Load Forecast</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-indigo-100 text-indigo-700 font-bold">M-1</span>
              </button>

              <button
                onClick={() => handleNavigate("MODULE_3_OPTIMIZATION")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  activeSubPage === "MODULE_3_OPTIMIZATION"
                    ? "bg-amber-100/80 text-amber-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>Peak Shaving</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-amber-100 text-amber-700 font-bold">M-3</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. EMISSIONS & INVOICES */}
        <div className="space-y-0.5 pt-1">
          <button
            onClick={() => {
              if (collapsed) onToggleCollapse();
              setCarbonOpen(!carbonOpen);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
              (activeSubPage === "MODULE_2_MEASUREMENT" || activeSubPage === "VESSEL_CARBON_INVOICE")
                ? "bg-emerald-50/70 text-emerald-900"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            title="Emissions & Invoices"
          >
            <div className="flex items-center gap-2.5">
              <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
              {!collapsed && <span>Emissions & Invoices</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  carbonOpen ? "" : "-rotate-90"
                }`} 
              />
            )}
          </button>

          {(!collapsed && carbonOpen) && (
            <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-4 py-0.5">
              <button
                onClick={() => handleNavigate("MODULE_2_MEASUREMENT")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  activeSubPage === "MODULE_2_MEASUREMENT"
                    ? "bg-emerald-100/80 text-emerald-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Emissions MRV</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-emerald-100 text-emerald-700 font-bold">M-2</span>
              </button>

              <button
                onClick={() => handleNavigate("VESSEL_CARBON_INVOICE")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  activeSubPage === "VESSEL_CARBON_INVOICE"
                    ? "bg-cyan-100/80 text-cyan-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Carbon Invoices</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-cyan-100 text-cyan-700 font-bold">e-INV</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
