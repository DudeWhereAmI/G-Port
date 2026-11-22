import React, { useState, useEffect } from "react";
import { 
  Home, 
  ChevronDown, 
  Search, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Database, 
  TrendingUp, 
  Leaf, 
  Zap, 
  Sliders
} from "lucide-react";
import { SubPageId } from "../types/gport";
import { useLanguage } from "../context/LanguageContext";

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
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [energyOpen, setEnergyOpen] = useState(true);

  useEffect(() => {
    if (activeSubPage === "ECO_CALCULATOR" || activeSubPage === "VESSEL_SCHEDULE") {
      setScheduleOpen(true);
    } else if (
      activeSubPage === "INPUT_LAYER" || 
      activeSubPage === "MODULE_1_FORECAST" || 
      activeSubPage === "MODULE_3_OPTIMIZATION"
    ) {
      setEnergyOpen(true);
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
              placeholder={t("Search modules...", "Tìm kiếm phân hệ...")}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={collapsed ? t("Expand sidebar", "Mở rộng thanh bên") : t("Collapse sidebar", "Thu gọn thanh bên")}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shrink-0 cursor-pointer"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5 text-xs">
        {/* 1. OVERVIEW */}
        <button
          onClick={() => handleNavigate("OVERVIEW")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeSubPage === "OVERVIEW"
              ? "bg-blue-50/80 text-[#004B91] font-black border-l-3 border-[#004B91]"
              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          }`}
          title={t("Overview", "Tổng quan")}
        >
          <Home className={`w-4 h-4 shrink-0 ${activeSubPage === "OVERVIEW" ? "text-[#004B91]" : "text-slate-600"}`} />
          {!collapsed && <span>{t("Overview", "Tổng quan Cảng")}</span>}
        </button>

        {/* 2. MICROGRID & SCADA */}
        <div className="space-y-0.5 pt-1">
          <button
            onClick={() => {
              if (collapsed) onToggleCollapse();
              setEnergyOpen(!energyOpen);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
              (activeSubPage === "INPUT_LAYER" || activeSubPage === "MODULE_1_FORECAST" || activeSubPage === "MODULE_3_OPTIMIZATION")
                ? "bg-blue-50/70 text-[#004B91]"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            title={t("Microgrid & SCADA", "Lưới điện Cảng & SCADA")}
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              {!collapsed && <span>{t("Microgrid & SCADA", "Lưới điện & SCADA")}</span>}
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
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                  activeSubPage === "INPUT_LAYER"
                    ? "bg-blue-100 text-[#004B91] font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t("Telemetry Feeds", "Telemetry Feed")}</span>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("MODULE_1_FORECAST")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                  activeSubPage === "MODULE_1_FORECAST"
                    ? "bg-indigo-100/80 text-indigo-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t("Load Forecast", "Dự báo Phụ tải")}</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-indigo-100 text-indigo-700 font-bold">M-1</span>
              </button>

              <button
                onClick={() => handleNavigate("MODULE_3_OPTIMIZATION")}
                className={`w-full text-left px-3 py-1.5 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                  activeSubPage === "MODULE_3_OPTIMIZATION"
                    ? "bg-amber-100/80 text-amber-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t("Peak Shaving", "Cắt Đỉnh Phụ Tải")}</span>
                </div>
                <span className="text-[9px] font-mono px-1 rounded bg-amber-100 text-amber-700 font-bold">M-3</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. EMISSIONS & INVOICES */}
        <div className="pt-1">
          <button
            onClick={() => handleNavigate("VESSEL_CARBON_INVOICE")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
              activeSubPage === "VESSEL_CARBON_INVOICE" || activeSubPage === "MODULE_2_MEASUREMENT"
                ? "bg-emerald-50/90 text-emerald-900 font-black border-l-3 border-emerald-600"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            title={t("Emissions & Invoices (Carbon Invoices)", "Phát thải & Hóa đơn Carbon")}
          >
            <div className="flex items-center gap-2.5">
              <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
              {!collapsed && <span>{t("Emissions & Invoices", "Phát thải & Hóa đơn")}</span>}
            </div>
            {!collapsed && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                e-INV
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

