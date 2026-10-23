import React, { useState, useRef, useEffect } from "react";
import { 
  Globe, 
  ChevronDown, 
  CheckCircle2, 
  Search,
  X,
  ArrowRight
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
  onNavigate
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "VN">("EN");

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

  const handleSelectNav = (page: SubPageId) => {
    onNavigate(page);
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
    <header ref={headerRef} className="bg-white border-b border-slate-200/90 select-none w-full sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* LEFT: LOGO & BRANDING */}
        <div 
          onClick={() => handleSelectNav("OVERVIEW")}
          className="flex items-center gap-3 cursor-pointer py-1 select-none shrink-0"
          title="Return to Port Overview"
        >
          <GPortLogo size="md" showText={true} />
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3 text-xs text-slate-500">
            <span className="font-bold text-[#004B91] tracking-tight">SAIGON NEWPORT (SNP)</span>
            <span aria-hidden="true">·</span>
            <span>Port Energy & Emissions Management System</span>
          </div>
        </div>

        {/* RIGHT: SEARCH, LANGUAGE & ROLE SELECTOR (NO DUPLICATE TOP NAVBAR) */}
        <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium shrink-0">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-xs whitespace-nowrap shrink-0"
            title="Quick Lookup"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Quick Lookup</span>
          </button>

          <button
            onClick={() => setLang(lang === "EN" ? "VN" : "EN")}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs whitespace-nowrap shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 pl-2.5 border-l border-slate-200 hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-[#004B91] flex items-center justify-center text-[10px] font-black text-white">
                SNP
              </div>
              <div className="text-left hidden md:block">
                <div className="font-bold text-slate-900 leading-tight text-[11px]">Port Operations</div>
                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  {roleLabels[currentRole || "ADMIN"]}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                  Operational Role View
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

      {/* QUICK LOOKUP MODAL */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Search className="w-4 h-4 text-[#004B91]" />
                <span>Quick Module & Vessel Lookup</span>
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
                placeholder="Jump to module (Telemetry Feeds, Load Forecast, Peak Shaving, Carbon Invoices)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004B91]"
              />
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div className="font-bold text-slate-400 text-[11px] pb-1">Direct Workspace Modules</div>
              <div 
                onClick={() => { handleSelectNav("INPUT_LAYER"); setSearchModalOpen(false); }}
                className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-slate-800 font-semibold"
              >
                <span>Telemetry Feeds (Bay Matrix, CHE & Substation Feeders)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div 
                onClick={() => { handleSelectNav("MODULE_1_FORECAST"); setSearchModalOpen(false); }}
                className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-slate-800 font-semibold"
              >
                <span>Load Forecast & Threshold Alerts (P10 / P50 / P90)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div 
                onClick={() => { handleSelectNav("MODULE_3_OPTIMIZATION"); setSearchModalOpen(false); }}
                className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-slate-800 font-semibold"
              >
                <span>Peak Shaving & 12-Asset Load Control Ledger</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div 
                onClick={() => { handleSelectNav("VESSEL_CARBON_INVOICE"); setSearchModalOpen(false); }}
                className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-slate-800 font-semibold"
              >
                <span>Port Call Carbon Invoices & SHA-256 Attestation</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
