import React, { useState, useRef, useEffect } from "react";
import { 
  Globe, 
  Bell, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Ship, 
  Database, 
  TrendingUp, 
  Zap, 
  Leaf, 
  Calculator,
  Calendar,
  Handshake,
  Search,
  X,
  Anchor,
  ArrowRight,
  Gauge
} from "lucide-react";
import { GPortLogo } from "./GPortLogo";
import { UserRole, SubPageId } from "../types/gport";

interface EnterpriseHeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onNavigate: (page: SubPageId) => void;
  activeSubPage: SubPageId;
  onOpenMeterModal?: () => void;
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  currentRole,
  onChangeRole,
  onNavigate,
  activeSubPage,
  onOpenMeterModal
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "VN">("EN");

  const headerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setRoleMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setRoleMenuOpen(false);
        setSearchModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => prev === name ? null : name);
    setRoleMenuOpen(false);
  };

  const handleSelectNav = (page: SubPageId) => {
    onNavigate(page);
    setActiveDropdown(null);
    setRoleMenuOpen(false);
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Port Authority Executive (Admin)",
    TECHNICAL_SPECIALIST: "Energy & Shore Power Engineer",
    OPERATIONS_SPECIALIST: "Terminal Operations Controller",
    FINANCIAL_ACCOUNTANT: "Carbon Accounting & DCSA Auditor",
    VIEWER: "Maritime Carrier & Partner (Auditor)"
  };

  return (
    <header ref={headerRef} className="bg-white border-b border-slate-200/90 shadow-2xs select-none w-full sticky top-0 z-40">
      {/* UNIFIED COMPACT ENTERPRISE HEADER (SINGLE ROW) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT: LOGO & OFFICIAL BRANDING */}
        <div 
          onClick={() => handleSelectNav("OVERVIEW")}
          className="flex items-center gap-2.5 cursor-pointer py-1 select-none shrink-0 group"
          title="Return to Port Overview"
        >
          <GPortLogo size="md" showText={true} />
          
          <div className="hidden xl:flex flex-col border-l border-slate-200 pl-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-[#004B91] uppercase">
                SAIGON NEWPORT
              </span>
              <span className="text-[10px] font-bold text-white bg-[#004B91] px-1.5 py-0.2 rounded">
                SNP
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">
              Enterprise Port Energy & Telemetry Platform
            </span>
          </div>
        </div>

        {/* CENTER: STREAMLINED COMPACT NAVIGATION (DIRECT SINGLE-ROW TABS) */}
        <nav className="flex items-center gap-1 text-xs font-semibold text-slate-700 overflow-x-auto no-scrollbar">
          {/* 1. Overview */}
          <button
            onClick={() => handleSelectNav("OVERVIEW")}
            className={`py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === "OVERVIEW" 
                ? "text-[#004B91] font-black bg-blue-50/80 border border-blue-200/80 shadow-2xs" 
                : "text-slate-700 hover:text-[#004B91] hover:bg-slate-50"
            }`}
          >
            Overview
          </button>

          {/* 2. Eco Routing & Booking */}
          <button
            onClick={() => handleSelectNav("ECO_CALCULATOR")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === "ECO_CALCULATOR"
                ? "bg-[#004B91] text-white font-bold shadow-2xs"
                : "text-slate-700 hover:text-[#004B91] hover:bg-slate-50"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Eco Routing</span>
          </button>

          {/* 3. Berth Dispatch Schedule */}
          <button
            onClick={() => handleSelectNav("VESSEL_SCHEDULE")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === "VESSEL_SCHEDULE"
                ? "bg-[#004B91] text-white font-bold shadow-2xs"
                : "text-slate-700 hover:text-[#004B91] hover:bg-slate-50"
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Berth Schedules</span>
          </button>

          {/* 4. Microgrid & SCADA (Gom 3 cái thành 1!) */}
          <button
            onClick={() => handleSelectNav("INPUT_LAYER")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === "INPUT_LAYER" || activeSubPage === "MODULE_1_FORECAST" || activeSubPage === "MODULE_3_OPTIMIZATION"
                ? "bg-[#004B91] text-white font-bold shadow-2xs"
                : "text-slate-700 hover:text-[#004B91] hover:bg-slate-50"
            }`}
            title="Unified Microgrid SCADA: TOS Bay Matrix, CHE Telemetry, Substation Feeders, Load Forecast & Peak Shaving"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Microgrid SCADA</span>
          </button>

          {/* 5. Emissions MRV (ISO 14064) */}
          <button
            onClick={() => handleSelectNav("MODULE_2_MEASUREMENT")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === "MODULE_2_MEASUREMENT"
                ? "bg-[#004B91] text-white font-bold shadow-2xs"
                : "text-slate-700 hover:text-[#004B91] hover:bg-slate-50"
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Emissions MRV</span>
          </button>

          {/* 6. Port Call Invoices */}
          <button
            onClick={() => handleSelectNav("VESSEL_CARBON_INVOICE")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === "VESSEL_CARBON_INVOICE"
                ? "bg-[#004B91] text-white font-bold shadow-2xs"
                : "text-slate-700 hover:text-[#004B91] hover:bg-slate-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Invoices</span>
          </button>

          {/* 7. Partners */}
          <button
            onClick={() => handleSelectNav("PARTNERS")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === "PARTNERS"
                ? "bg-[#004B91] text-white font-bold shadow-2xs"
                : "text-slate-700 hover:text-[#004B91] hover:bg-slate-50"
            }`}
          >
            <Handshake className="w-3.5 h-3.5 text-purple-400" />
            <span>Partners</span>
          </button>
        </nav>

        {/* RIGHT UTILITY ITEMS */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs text-slate-700 font-medium shrink-0">
          {/* Quick Search */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-slate-50/80 hover:bg-slate-100 transition-colors font-bold text-xs"
            title="Quick Search"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#004B91]" />
            <span className="hidden lg:inline text-[11px]">Search</span>
          </button>

          {/* Connected Terminals Status */}
          <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Cat Lai Active</span>
          </div>

          {/* Language selector */}
          <button
            onClick={() => setLang(lang === "EN" ? "VN" : "EN")}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors font-bold px-2 py-1 rounded-md hover:bg-slate-100 text-xs"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang}</span>
          </button>

          {/* User Badge & Perspective Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setRoleMenuOpen(!roleMenuOpen);
                setActiveDropdown(null);
              }}
              className="flex items-center gap-1.5 pl-2 border-l border-slate-200 hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-[#004B91] border border-blue-300 flex items-center justify-center text-[10px] font-black text-white shadow-2xs">
                SNP
              </div>
              <div className="text-left hidden md:block">
                <div className="font-bold text-slate-900 leading-tight text-[11px]">Port Operations</div>
                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                  {roleLabels[currentRole || "ADMIN"]}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Role switch dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Switch Operational Role
                </div>
                {(["ADMIN", "TECHNICAL_SPECIALIST", "OPERATIONS_SPECIALIST", "FINANCIAL_ACCOUNTANT", "VIEWER"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onChangeRole(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      currentRole === r ? "bg-blue-50 text-[#004B91] font-bold" : "text-slate-700"
                    }`}
                  >
                    <span>{roleLabels[r || "ADMIN"]}</span>
                    {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-[#004B91]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH / QUICK LOOKUP MODAL */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#004B91] font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Search Port Operations & Modules</span>
              </div>
              <button 
                onClick={() => setSearchModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search modules (Eco, Cat Lai, OPS Shore Power, DCSA, BESS)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004B91]"
              />
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div className="font-bold text-slate-400 text-[10px] uppercase">Quick Navigation:</div>
              <div 
                onClick={() => { handleSelectNav("ECO_CALCULATOR"); setSearchModalOpen(false); }}
                className="p-2 rounded-lg hover:bg-blue-50 cursor-pointer flex items-center justify-between text-[#004B91] font-bold"
              >
                <span>Eco Calculator & Green Booking Flow (5 Steps)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div 
                onClick={() => { handleSelectNav("MODULE_1_FORECAST"); setSearchModalOpen(false); }}
                className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>15-Minute Load Forecast (P10 / Baseline / P90)</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div 
                onClick={() => { handleSelectNav("VESSEL_CARBON_INVOICE"); setSearchModalOpen(false); }}
                className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>Digital Carbon Invoices & DCSA QR Verification</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
