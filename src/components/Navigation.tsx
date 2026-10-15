import React from "react";
import { GPortLogo } from "./GPortLogo";
import { SubPageId, UserRole } from "../types/gport";
import { 
  LayoutDashboard, 
  Database, 
  TrendingUp, 
  Leaf, 
  Zap, 
  FileText, 
  Handshake, 
  Activity, 
  ShieldCheck, 
  SunMedium, 
  BatteryCharging, 
  Wifi, 
  Users,
  ChevronDown
} from "lucide-react";

interface NavigationProps {
  activeSubPage: SubPageId;
  onSelectSubPage: (page: SubPageId) => void;
  currentRole: UserRole;
  onSelectRole?: (role: UserRole) => void;
  onChangeRole?: (role: UserRole) => void;
  userEmail?: string;
  gridTotalDemandKw?: number;
  pvGenerationKw?: number;
  bessSocPercent?: number;
  systemSummary?: {
    gridPowerKw?: number;
    pvPowerKw?: number;
    bessSoc?: number;
    totalCarbonTodayTons?: number;
  };
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSubPage,
  onSelectSubPage,
  currentRole,
  onSelectRole,
  onChangeRole,
  userEmail,
  gridTotalDemandKw,
  pvGenerationKw,
  bessSocPercent,
  systemSummary
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);
  const handleRoleChange = onSelectRole || onChangeRole || (() => {});

  const gridPower = gridTotalDemandKw ?? systemSummary?.gridPowerKw ?? 5140;
  const pvPower = pvGenerationKw ?? systemSummary?.pvPowerKw ?? 1280;
  const bessSoc = bessSocPercent ?? systemSummary?.bessSoc ?? 82;

  const subPages: { id: SubPageId; label: string; badge?: string; icon: React.ElementType; description: string }[] = [
    {
      id: "OVERVIEW",
      label: "Tổng quan Điều phối",
      icon: LayoutDashboard,
      description: "Sơ đồ dòng năng lượng thời gian thực & KPI phát thải"
    },
    {
      id: "INPUT_LAYER",
      label: "Lớp Đầu Vào",
      badge: "Layer 01",
      icon: Database,
      description: "TOS, ePort, PV, BESS, SCADA, Thời tiết, Biểu giá TOU"
    },
    {
      id: "MODULE_1_FORECAST",
      label: "Dự Báo Năng Lượng",
      badge: "Module 1",
      icon: TrendingUp,
      description: "Dự báo phụ tải 15 phút, kịch bản P10/P90, đỉnh phụ tải tàu"
    },
    {
      id: "MODULE_2_MEASUREMENT",
      label: "Đo Lường Carbon",
      badge: "Module 2",
      icon: Leaf,
      description: "Scope 1 & 2, kgCO2e/TEU, Quản lý tài sản & Nhật ký vận hành"
    },
    {
      id: "MODULE_3_OPTIMIZATION",
      label: "Tối Ưu & Điều Khiển",
      badge: "Module 3",
      icon: Zap,
      description: "Cắt đỉnh phụ tải, Setpoint SCADA, Lộ trình Net-Zero"
    },
    {
      id: "ECO_CALCULATOR",
      label: "Eco Calculator",
      badge: "ONE Flow",
      icon: FileText,
      description: "Quy trình 5 bước Eco Quote tính phát thải & đăng ký dịch vụ xanh"
    },
    {
      id: "VESSEL_SCHEDULE",
      label: "Lịch Tàu & P2P",
      badge: "TOS",
      icon: Activity,
      description: "Tiến độ cầu bến thời gian thực & Tra cứu lịch trình tàu điểm-điểm"
    },
    {
      id: "VESSEL_CARBON_INVOICE",
      label: "Hóa Đơn Carbon",
      badge: "DCSA / IMO",
      icon: FileText,
      description: "Xuất Hóa đơn Carbon điện tử & Chứng chỉ phát thải theo từng lượt tàu"
    },
    {
      id: "PARTNERS",
      label: "Đối Tác Cảng Xanh",
      icon: Handshake,
      description: "Hệ sinh thái công nghệ & Thiết bị chuyển dịch xanh"
    }
  ];

  const roleNames: Record<string, string> = {
    ADMIN: "Ban Quản Lý Cảng (Admin)",
    TECHNICAL_SPECIALIST: "Kỹ Sư Năng Lượng (Technical)",
    OPERATIONS_SPECIALIST: "Điều Hành Khai Thác (Operations)",
    FINANCIAL_ACCOUNTANT: "Kế Toán Tài Chính (Finance)",
    VIEWER: "Khách Xem Báo Cáo (Viewer)"
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Bar: Brand, Realtime System Telemetry & Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <GPortLogo size="sm" showText={true} />
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hệ thống Điều phối Năng lượng & Carbon Cảng biển
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Audit-Ready
            </span>
          </div>
        </div>

        {/* Live Port Microgrid Metrics */}
        <div className="hidden md:flex items-center gap-3 text-xs bg-slate-50/90 border border-slate-200 px-3 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-400">Lưới:</span>
            <span className="font-bold text-slate-800">{gridPower.toLocaleString()} kW</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <SunMedium className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-400">PV:</span>
            <span className="font-bold text-emerald-600">+{pvPower.toLocaleString()} kW</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-400">BESS SOC:</span>
            <span className="font-bold text-slate-800">{bessSoc}%</span>
          </div>
        </div>

        {/* Role Switcher & Live Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold border border-slate-200/70 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-port-medium" />
              <span>{roleNames[currentRole || "ADMIN"] || "Quản trị viên"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Chuyển đổi vai trò người dùng
                </div>
                {(["ADMIN", "TECHNICAL_SPECIALIST", "OPERATIONS_SPECIALIST", "FINANCIAL_ACCOUNTANT", "VIEWER"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      handleRoleChange(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      currentRole === r ? "bg-port-light/20 text-port-dark font-bold" : "text-slate-700"
                    }`}
                  >
                    <span>{roleNames[r || "ADMIN"]}</span>
                    {currentRole === r && <ShieldCheck className="w-3.5 h-3.5 text-port-medium" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subpage Tabs Navigation */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {subPages.map((page) => {
              const Icon = page.icon;
              const isActive = activeSubPage === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => onSelectSubPage(page.id)}
                  title={page.description}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                    isActive
                      ? "bg-port-dark text-white shadow-xs shadow-port-dark/20"
                      : "text-slate-600 hover:text-port-dark hover:bg-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{page.label}</span>
                  {page.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {page.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
