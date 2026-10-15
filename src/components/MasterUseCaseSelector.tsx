import React, { useState } from "react";
import { MASTER_USE_CASES } from "../data/mockPortData";
import { OperationalUseCase, SubPageId } from "../types/gport";
import { 
  Ship, 
  PlugZap, 
  SunMedium, 
  BatteryCharging, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Compass, 
  Zap, 
  Layers, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Snowflake,
  Anchor,
  X
} from "lucide-react";

interface MasterUseCaseSelectorProps {
  selectedUseCaseId?: string | null;
  onSelectUseCase?: (useCase: OperationalUseCase) => void;
  onNavigate: (page: SubPageId) => void;
  compact?: boolean;
}

export const MasterUseCaseSelector: React.FC<MasterUseCaseSelectorProps> = ({
  selectedUseCaseId = null,
  onSelectUseCase,
  onNavigate,
  compact = false
}) => {
  const [activeModalUseCase, setActiveModalUseCase] = useState<OperationalUseCase | null>(null);

  const getCategoryBadge = (cat: OperationalUseCase["category"]) => {
    switch (cat) {
      case "INTRA_ASIA_REEFER":
        return { label: "Nội Á • Chuỗi Lạnh Reefer", bg: "bg-cyan-50 text-cyan-800 border-cyan-200", icon: Snowflake };
      case "EUROPE_DEEP_SEA":
        return { label: "Tàu Mẹ Viễn Dương • EU ETS", bg: "bg-blue-50 text-[#004B91] border-blue-200", icon: Ship };
      case "TRANS_PACIFIC_DRY":
        return { label: "Thái Bình Dương • Hàng Cơ Khí", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: Layers };
      case "GREEN_COASTAL_FEEDER":
        return { label: "Ven Biển Xanh • Biofuel B24", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: SunMedium };
      default:
        return { label: "Vận Hành Cảng", bg: "bg-slate-50 text-slate-700 border-slate-200", icon: Ship };
    }
  };

  return (
    <div className="space-y-3">
      {/* Title Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#004B91]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Hệ Thống Dữ Liệu Đồng Bộ Xuyên Suốt: 4 Ca Vận Hành Cốt Lõi (4 Core Port Use Cases)
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Dữ liệu thống nhất 100% giữa TOS ➔ SCADA ➔ AI Dự Báo ➔ Đo Lường ➔ Tối Ưu BESS ➔ Báo Giá ➔ Hóa Đơn DCSA
        </span>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {MASTER_USE_CASES.map((uc) => {
          const badge = getCategoryBadge(uc.category);
          const BadgeIcon = badge.icon;
          const isSelected = selectedUseCaseId === uc.id;

          return (
            <div
              key={uc.id}
              onClick={() => {
                if (onSelectUseCase) onSelectUseCase(uc);
                setActiveModalUseCase(uc);
              }}
              className={`group cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected 
                  ? "bg-blue-50/70 border-[#004B91] ring-2 ring-[#004B91]/20 shadow-md" 
                  : "bg-white border-slate-200/90 hover:border-slate-400 hover:shadow-sm"
              }`}
            >
              {/* Top Meta */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="px-2 py-0.5 rounded-md font-black text-[11px] bg-slate-900 text-white font-mono">
                    {uc.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}>
                    <BadgeIcon className="w-3 h-3" />
                    <span>{badge.label.split("•")[0]}</span>
                  </span>
                </div>

                <div className="text-sm font-black text-slate-900 group-hover:text-[#004B91] transition-colors leading-snug">
                  {uc.vesselName} <span className="text-xs font-semibold text-slate-500">({uc.voyageNumber})</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                  {uc.carrierName}
                </div>

                {/* Route */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
                    <span className="truncate max-w-[100px]">{uc.route.originCode}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[100px] text-right">{uc.route.destinationCode}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    {uc.route.berth}
                  </div>
                </div>

                {/* Quick specs */}
                <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span><b>{uc.cargoSummary.totalTeu}</b> TEU</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <PlugZap className="w-3 h-3 text-emerald-600" />
                    <span><b>{uc.portEnergyProfile.stsCranesAssigned}</b> Cẩu STS</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  uc.status === "OPERATING" ? "bg-emerald-100 text-emerald-800" :
                  uc.status === "BERTHED" ? "bg-blue-100 text-[#004B91]" :
                  uc.status === "ARRIVING" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                }`}>
                  {uc.status === "OPERATING" ? "Đang xếp dỡ" : uc.status === "BERTHED" ? "Đã cập bến" : uc.status === "ARRIVING" ? "Đang tới" : "Đã rời bến"}
                </span>

                <span className="text-[#004B91] font-bold text-[11px] flex items-center gap-1 group-hover:underline">
                  <span>Chi tiết ca</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL-DETAIL MODAL FOR THE SELECTED OPERATIONAL USE CASE */}
      {activeModalUseCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-black bg-slate-900 text-white">
                    {activeModalUseCase.id}
                  </span>
                  <span className="text-xs font-bold text-[#004B91] uppercase">
                    {activeModalUseCase.code}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {activeModalUseCase.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeModalUseCase.subtitle}
                </p>
              </div>

              <button
                onClick={() => setActiveModalUseCase(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix of 4 Interconnected Layers */}
            <div className="space-y-4 text-xs">
              {/* Layer 1: Vessel & TOS */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                  <span className="flex items-center gap-1.5 text-[#004B91]">
                    <Ship className="w-4 h-4" />
                    <span>01. Thông Số Lịch Tàu TOS & Cầu Bến</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">IMO: {activeModalUseCase.imoNumber}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Tàu / Chuyến:</span>
                    <strong className="text-slate-900">{activeModalUseCase.vesselName} ({activeModalUseCase.voyageNumber})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Hãng Tàu:</span>
                    <strong className="text-slate-900">{activeModalUseCase.carrierName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Cầu Bến Phân Bổ:</span>
                    <strong className="text-slate-900">{activeModalUseCase.route.berth}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Hải Trình:</span>
                    <strong className="text-slate-900">{activeModalUseCase.route.originCode} ➔ {activeModalUseCase.route.destinationCode} ({activeModalUseCase.route.distanceKm.toLocaleString()} km)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Khối Lượng Hàng:</span>
                    <strong className="text-slate-900">{activeModalUseCase.cargoSummary.totalTeu} TEU ({activeModalUseCase.cargoSummary.reeferUnits} Reefer)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Thời Gian Neo Đậu:</span>
                    <strong className="text-slate-900">{activeModalUseCase.timeWindow.hotelingHours} giờ</strong>
                  </div>
                </div>
              </div>

              {/* Layer 2: Energy & Microgrid SCADA */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-blue-200/50 pb-1.5">
                  <span className="flex items-center gap-1.5 text-[#004B91]">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>02. Hồ Sơ Năng Lượng & Phụ Tải SCADA</span>
                  </span>
                  <span className="text-emerald-700 font-bold text-[11px]">
                    {activeModalUseCase.portEnergyProfile.opsConnected ? "OPS Đã Kết Nối" : "OPS Sẵn Sàng"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Cẩu Bờ STS:</span>
                    <strong className="text-slate-900">{activeModalUseCase.portEnergyProfile.stsCranesAssigned} Cẩu ({activeModalUseCase.portEnergyProfile.stsPowerKw} kW)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Trạm Điện Bờ OPS:</span>
                    <strong className="text-emerald-700">{activeModalUseCase.portEnergyProfile.opsVoltage} ({activeModalUseCase.portEnergyProfile.opsConsumptionKwh.toLocaleString()} kWh)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Giàn Lạnh Reefer:</span>
                    <strong className="text-slate-900">{activeModalUseCase.portEnergyProfile.reeferPowerKw} kW</strong>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-blue-100 text-[11px] text-slate-600">
                  <span className="font-bold text-[#004B91]">Tác động phụ tải: </span>
                  {activeModalUseCase.portEnergyProfile.peakHourImpact}
                </div>
              </div>

              {/* Layer 3: Emissions & DCSA Carbon Invoice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-emerald-200/50 pb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>03. Đo Lường Phát Thải & Hóa Đơn Carbon DCSA</span>
                  </span>
                  <span className="font-mono text-[11px] text-emerald-800 font-bold">{activeModalUseCase.dcsaInvoiceNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">CO2 Cắt Giảm Nhờ OPS:</span>
                    <strong className="text-emerald-700 text-sm">{(activeModalUseCase.portEnergyProfile.co2SavedByOpsKg / 1000).toFixed(1)} Tấn CO₂e</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Chuẩn Chứng Nhận:</span>
                    <strong className="text-slate-900">DCSA Electronic Carbon Invoice • IMO DCS</strong>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeModalUseCase.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setActiveModalUseCase(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveModalUseCase(null);
                    onNavigate("VESSEL_SCHEDULE");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Ship className="w-3.5 h-3.5 text-[#004B91]" />
                  <span>Xem Lịch Tàu TOS</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModalUseCase(null);
                    onNavigate("VESSEL_CARBON_INVOICE");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem Hóa Đơn DCSA</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModalUseCase(null);
                    onNavigate("ECO_CALCULATOR");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span>Mở Báo Giá Eco Quote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
