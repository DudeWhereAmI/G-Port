import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { 
  CarbonInvoice, 
  TosVesselSchedule,
  SubPageId
} from "../types/gport";
import { MeterModalMode } from "../components/MeterTelemetryModal";
import { 
  FileText, 
  Ship, 
  Search, 
  ShieldCheck, 
  Zap, 
  Fuel, 
  X,
  Gauge,
  QrCode,
  Download,
  Printer,
  Navigation,
  CheckCircle2
} from "lucide-react";

interface VesselCarbonInvoicePageProps {
  invoices: CarbonInvoice[];
  vessels: TosVesselSchedule[];
  onNavigate?: (page: SubPageId) => void;
  onOpenMeterModal?: (assetId?: string, mode?: MeterModalMode) => void;
  focusedInvoiceId?: string | null;
  onClearFocusedInvoice?: () => void;
  onTraceVoyageInTelemetry?: (vesselEntityId: string, voyageNumber: string) => void;
}

function resolveVesselEntityId(inv: CarbonInvoice): string {
  const name = inv.vesselName.toUpperCase();
  if (name.includes("MUMBAI") || inv.useCaseId === "UC-01") return "VSL-01";
  if (name.includes("APUS") || inv.useCaseId === "UC-02") return "VSL-02";
  return "VSL-03";
}

export const VesselCarbonInvoicePage: React.FC<VesselCarbonInvoicePageProps> = ({
  invoices,
  onNavigate,
  onOpenMeterModal,
  focusedInvoiceId,
  onClearFocusedInvoice,
  onTraceVoyageInTelemetry,
}) => {
  const { t } = useLanguage();
  const [selectedInvoice, setSelectedInvoice] = useState<CarbonInvoice | null>(invoices[0]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Highlight/select the invoice if focused, but NEVER auto-open the popup modal
  useEffect(() => {
    if (!focusedInvoiceId) return;
    const norm = focusedInvoiceId.toUpperCase();
    const matched = invoices.find(
      (inv) =>
        inv.invoiceNumber.toUpperCase() === norm ||
        norm.includes(inv.invoiceNumber.toUpperCase()) ||
        (inv.useCaseId && inv.useCaseId.toUpperCase() === norm) ||
        inv.voyageNumber.toUpperCase() === norm ||
        inv.vesselName.toUpperCase().includes(norm)
    );
    if (matched) {
      setSelectedInvoice(matched);
      setStatusFilter("ALL");
      setSearchQuery("");
    }
    onClearFocusedInvoice?.();
  }, [focusedInvoiceId, invoices, onClearFocusedInvoice]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.imoNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenInvoice = (inv: CarbonInvoice) => {
    setSelectedInvoice(inv);
    setShowInvoiceModal(true);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // Safe fallback when printed in sandboxed cross-origin frames
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Clean Minimal Header Banner (No duplicate port-wide totals or extra nav buttons) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">DCSA e-INVOICE · IMO DCS</span>
            <span aria-hidden="true">·</span>
            <span>{t("Completed Port Call Energy, Fuel & Carbon Attestation", "Chứng Nhận Điện Năng, Nhiên Liệu & Phát Thải Carbon Lượt Tàu Đã Hoàn Tất")}</span>
            <span aria-hidden="true">·</span>
            <span>{t("ISO 14083 Compliant", "Tuân Thủ ISO 14083")}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("Vessel Carbon Invoices", "Hóa Đơn Carbon Tàu Biển (DCSA e-Invoice)")}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {t("DCSA SHA-256 Verified Ledger", "Sổ Cái Xác Thực DCSA SHA-256")}
          </span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("Search by vessel, IMO, carrier or invoice ID (e.g., SPIRIT OF MUMBAI, ONE APUS)...", "Tìm theo tên tàu, số IMO, hãng tàu hoặc mã hóa đơn (VD: SPIRIT OF MUMBAI, ONE APUS)...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] uppercase mr-1">{t("Filter:", "Bộ Lọc:")}</span>
          {(["ALL", "VERIFIED_IMO", "ISSUED", "DRAFT"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-[#004B91] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? t("All Invoices", "Tất Cả Hóa Đơn") : st === "VERIFIED_IMO" ? t("IMO Verified", "Đã Xác Thực IMO") : st === "ISSUED" ? t("Issued", "Đã Phát Hành") : t("Draft", "Bản Nháp")}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Invoices Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredInvoices.map((inv) => {
          const isFocusedCard =
            focusedInvoiceId &&
            selectedInvoice?.invoiceNumber === inv.invoiceNumber;
          return (
            <div
              key={inv.invoiceNumber}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                isFocusedCard
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/90 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {inv.useCaseId && (
                        <span className="text-[10px] font-mono font-bold text-[#004B91]">
                          {inv.useCaseId}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-sm mt-0.5">
                      {inv.vesselName}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium">
                      {inv.carrierName}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase ${
                      inv.status === "VERIFIED_IMO"
                        ? "text-emerald-700"
                        : inv.status === "ISSUED"
                        ? "text-blue-700"
                        : "text-amber-700"
                    }`}
                  >
                    {inv.status === "VERIFIED_IMO"
                      ? t("IMO Verified", "Xác Thực IMO")
                      : inv.status === "ISSUED"
                      ? t("Issued", "Đã Phát Hành")
                      : t("Draft", "Bản Nháp")}
                  </span>
                </div>

                {/* Voyage parameters */}
                <div className="py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">{t("IMO / Voyage:", "Số IMO / Chuyến:")}</span>
                    <strong className="text-slate-800 font-mono">
                      {inv.imoNumber} · {inv.voyageNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">{t("Berth & Stay:", "Cầu Bến & Lưu Bến:")}</span>
                    <strong className="text-slate-800">
                      {inv.berth} ({inv.hotelingDurationHours}h)
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">{t("Handled Volume:", "Sản Lượng Xếp Dỡ:")}</span>
                    <strong className="text-slate-800 font-mono">
                      {inv.teuHandled.toLocaleString()} TEU
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">{t("Port Electricity:", "Điện Năng Tiêu Thụ:")}</span>
                    <strong className="text-blue-700 font-bold font-mono">
                      {(
                        inv.totalElectricityKwh ||
                        inv.opsElectricityKwh +
                          inv.stsCraneElectricityKwh +
                          inv.reeferElectricityKwh
                      ).toLocaleString()}{" "}
                      kWh
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">{t("Tug & Tractor Fuel:", "Nhiên Liệu Lai Dắt & Đầu Kéo:")}</span>
                    <strong className="text-amber-700 font-bold font-mono">
                      {(
                        inv.totalFuelLiters ||
                        inv.terminalTractorFuelLiters +
                          inv.tugboatFuelLiters +
                          inv.auxEngineBerthFuelLiters
                      ).toLocaleString()}{" "}
                      {t("Liters", "Lít")}
                    </strong>
                  </div>
                </div>

                {/* Energy & Carbon Footprint Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">
                      {t("Direct Footprint:", "Tổng Phát Thải Trực Tiếp:")}
                    </span>
                    <strong className="text-slate-900 font-mono text-xs">
                      {(inv.totalEmissionsKg / 1000).toFixed(2)} tCO₂e
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Scope 1 / Scope 2:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {(inv.scope1EmissionsKg / 1000).toFixed(1)}t {t("fuel", "nhiên liệu")} ·{" "}
                      {(inv.scope2EmissionsKg / 1000).toFixed(1)}t {t("grid", "điện lưới")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="font-semibold text-emerald-800">
                      {t("Carbon Intensity:", "Cường Độ Phát Thải:")}
                    </span>
                    <strong className="text-emerald-800 font-mono font-bold">
                      {inv.emissionPerTeuKg} kgCO₂e/TEU
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMeterModal)
                      onOpenMeterModal(
                        inv.useCaseId || inv.invoiceNumber,
                        "COMPLETED_INVOICE"
                      );
                  }}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title={t("Inspect completed & sealed meters recorded for this invoice", "Xem hồ sơ các đồng hồ đo đếm đã chốt cho hóa đơn này")}
                >
                  <Gauge className="w-3.5 h-3.5 text-[#002D62]" />
                  <span>{t("Completed Meters", "Đồng Hồ Đã Chốt")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenInvoice(inv)}
                  className="py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t("e-Invoice", "Hóa Đơn Điện Tử")}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. MODAL: FORMAL E-CARBON INVOICE VIEW & PRINT CERTIFICATE */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Controls Bar */}
            <div className="bg-[#004B91] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm">{t("ELECTRONIC CARBON INVOICE & AUDIT CERTIFICATE", "HÓA ĐƠN CARBON ĐIỆN TỬ & CHỨNG NHẬN KIỂM ĐỊNH PHÁT THẢI")}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t("Print / PDF", "In / PDF")}</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Invoice Document Content */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-xs">
              {/* Header: Port Brand & Title */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="text-xl font-black text-[#004B91] tracking-tight">
                    {t("SAIGON NEWPORT CORPORATION (SNP)", "TỔNG CÔNG TY TÂN CẢNG SÀI GÒN (SNP)")}
                  </div>
                  <div className="text-slate-600 text-[11px] font-semibold mt-0.5">
                    {t("G-Port Maritime Energy Management · Port Call Emissions Manifest", "Hệ Thống Quản Trị Năng Lượng G-Port · Bảng Kê Phát Thải Lượt Tàu Cập Cảng")}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {t("Cat Lai & Cai Mep Deep-Sea Terminals · Compliant with GLEC v3.0, ISO 14083 & EU ETS Maritime", "Cảng Tân Cảng Cát Lái & Cái Mép · Tuân Thủ Khung GLEC v3.0, ISO 14083 & EU ETS Hàng Hải")}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-slate-500 font-medium">
                    {t("Issue Date:", "Ngày Phát Hành:")} {selectedInvoice.issueDate}
                  </div>
                  <div className="mt-1">
                    <span className="font-mono text-[11px] font-bold text-emerald-700">
                      {selectedInvoice.servicePackage}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vessel & Voyage Particulars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Vessel Name:", "Tên Tàu:")}</span>
                  <strong className="text-slate-900 text-sm font-black">{selectedInvoice.vesselName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("IMO Number:", "Số IMO:")}</span>
                  <strong className="text-slate-800 font-mono">{selectedInvoice.imoNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Carrier / Line:", "Hãng Tàu:")}</span>
                  <strong className="text-slate-800">{selectedInvoice.carrierName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Voyage:", "Số Chuyến:")}</span>
                  <strong className="text-slate-800 font-mono">{selectedInvoice.voyageNumber}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Terminal & Berth:", "Cảng & Cầu Bến:")}</span>
                  <strong className="text-slate-800">{selectedInvoice.berth}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Hoteling Duration:", "Thời Gian Lưu Bến:")}</span>
                  <strong className="text-slate-800">{selectedInvoice.hotelingDurationHours} {t("Hours", "Giờ")}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("Handled TEU:", "Sản Lượng TEU:")}</span>
                  <strong className="text-slate-800 font-mono">{selectedInvoice.teuHandled.toLocaleString()} TEU</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("OPS Cold Ironing:", "Điện Bờ OPS:")}</span>
                  <strong className="text-emerald-700 font-bold">
                    {selectedInvoice.opsElectricityKwh > 0 ? t("Connected (6.6 kV)", "Đã Kết Nối (6.6 kV)") : t("Not Connected", "Không Kết Nối")}
                  </strong>
                </div>
              </div>

              {/* Energy & Fuel Consumption Breakdown Table */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    {t("Metered Fuel & Energy Consumption and Emissions Breakdown", "Bảng Kê Chi Tiết Điện Năng, Nhiên Liệu Đo Đếm & Phát Thải CO₂e")}
                  </div>
                  {onOpenMeterModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowInvoiceModal(false);
                        onOpenMeterModal(
                          selectedInvoice.useCaseId || selectedInvoice.invoiceNumber,
                          "COMPLETED_INVOICE"
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Gauge className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{t("Completed Meter Records", "Hồ Sơ Đồng Hồ Đã Chốt")}</span>
                    </button>
                  )}
                </div>

                {(() => {
                  const elecTotal = selectedInvoice.totalElectricityKwh || (selectedInvoice.opsElectricityKwh + selectedInvoice.stsCraneElectricityKwh + selectedInvoice.reeferElectricityKwh);
                  const fuelTotal = selectedInvoice.totalFuelLiters || (selectedInvoice.tugboatFuelLiters + selectedInvoice.terminalTractorFuelLiters + selectedInvoice.auxEngineBerthFuelLiters);

                  return (
                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">{t("Port Activity & Equipment", "Hoạt Động & Thiết Bị Cảng")}</th>
                          <th className="py-2.5 px-3">{t("Energy / Fuel Type", "Loại Năng Lượng")}</th>
                          <th className="py-2.5 px-3 font-mono">{t("Metered Quantity", "Sản Lượng Đo Đếm")}</th>
                          <th className="py-2.5 px-3 font-mono">{t("Emission Factor", "Hệ Số Phát Thải")}</th>
                          <th className="py-2.5 px-3 font-mono">{t("Emissions (kg CO₂e)", "Phát Thải (kg CO₂e)")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Scope 2 Electricity Section */}
                        <tr className="bg-blue-50/50 font-bold text-[#004B91]">
                          <td colSpan={5} className="py-1.5 px-3 text-[11px] uppercase tracking-wider">
                            {t("1. Grid Electricity Consumption (Scope 2)", "1. Điện Năng Tiêu Thụ Tại Cảng (Scope 2)")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">{t("Shore Power (OPS Auxiliary Cold Ironing)", "Điện bờ cấp cho tàu (OPS Cold Ironing)")}</td>
                          <td className="py-2 px-3 text-slate-600">{t("Grid Power 6.6kV", "Điện lưới 6.6kV")}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-blue-700">{selectedInvoice.opsElectricityKwh.toLocaleString()} kWh</td>
                          <td className="py-2 px-3 font-mono text-slate-500">0.7221 kg/kWh</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.opsElectricityKwh * 0.7221).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">{t("STS Quay Crane Container Handling", "Cẩu bờ STS xếp dỡ container")}</td>
                          <td className="py-2 px-3 text-slate-600">{t("Grid Power 22kV", "Điện lưới 22kV")}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-blue-700">{selectedInvoice.stsCraneElectricityKwh.toLocaleString()} kWh</td>
                          <td className="py-2 px-3 font-mono text-slate-500">0.7221 kg/kWh</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.stsCraneElectricityKwh * 0.7221).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">{t("Reefer Yard Infrastructure Power", "Điện năng bãi container lạnh & e-RTG")}</td>
                          <td className="py-2 px-3 text-slate-600">{t("Grid Power 380V", "Điện lưới 380V")}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-blue-700">{selectedInvoice.reeferElectricityKwh.toLocaleString()} kWh</td>
                          <td className="py-2 px-3 font-mono text-slate-500">0.7221 kg/kWh</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.reeferElectricityKwh * 0.7221).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="bg-slate-50/60 font-semibold text-slate-700 text-[11px]">
                          <td colSpan={2} className="py-1.5 px-3 pl-5 text-slate-600">{t("Subtotal Electricity:", "Cộng Điện Năng (Scope 2):")}</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-blue-800">{elecTotal.toLocaleString()} kWh ({(elecTotal / 1000).toFixed(1)} MWh)</td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">{t("Scope 2 Total", "Tổng Scope 2")}</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{selectedInvoice.scope2EmissionsKg.toLocaleString()} kg</td>
                        </tr>

                        {/* Scope 1 Liquid Fuel Section */}
                        <tr className="bg-amber-50/50 font-bold text-amber-900">
                          <td colSpan={5} className="py-1.5 px-3 text-[11px] uppercase tracking-wider">
                            {t("2. Liquid Marine & Fleet Fuel Combustion (Scope 1)", "2. Nhiên Liệu Tàu Lai Dắt & Đội Xe Đầu Kéo Nội Bộ (Scope 1)")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">{t("Harbor Tug Assistance (Berthing & Unberthing)", "Tàu lai dắt hỗ trợ cập & rời bến")}</td>
                          <td className="py-2 px-3 text-slate-600">Marine Gas Oil (MGO)</td>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-800">{selectedInvoice.tugboatFuelLiters.toLocaleString()} {t("Liters", "Lít")}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">2.68 kg/L</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.tugboatFuelLiters * 2.68).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">{t("Internal Terminal Tractors (Yard Shuttle)", "Đội xe đầu kéo vận chuyển nội cảng")}</td>
                          <td className="py-2 px-3 text-slate-600">Ultra-Low Sulfur Diesel</td>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-800">{selectedInvoice.terminalTractorFuelLiters.toLocaleString()} {t("Liters", "Lít")}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">2.68 kg/L</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.terminalTractorFuelLiters * 2.68).toLocaleString()}
                          </td>
                        </tr>
                        {selectedInvoice.auxEngineBerthFuelLiters > 0 && (
                          <tr>
                            <td className="py-2 px-3 pl-5 font-semibold text-rose-700">{t("Auxiliary Engine Diesel Combustion (At Berth)", "Máy phát phụ tàu chạy dầu tại bến")}</td>
                            <td className="py-2 px-3 text-slate-600">MGO / HFO</td>
                            <td className="py-2 px-3 font-mono font-semibold text-rose-700">{selectedInvoice.auxEngineBerthFuelLiters.toLocaleString()} {t("Liters", "Lít")}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">3.11 kg/L</td>
                            <td className="py-2 px-3 font-mono font-bold text-rose-700">
                              {Math.round(selectedInvoice.auxEngineBerthFuelLiters * 3.11).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-50/60 font-semibold text-slate-700 text-[11px]">
                          <td colSpan={2} className="py-1.5 px-3 pl-5 text-slate-600">{t("Subtotal Liquid Fuel:", "Cộng Nhiên Liệu Lỏng (Scope 1):")}</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-amber-800">{fuelTotal.toLocaleString()} {t("Liters", "Lít")} ({(fuelTotal * 0.845 / 1000).toFixed(2)} MT)</td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">{t("Scope 1 Total", "Tổng Scope 1")}</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{selectedInvoice.scope1EmissionsKg.toLocaleString()} kg</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="py-3 px-3 text-right">{t("TOTAL DIRECT PORT CALL EMISSIONS (SCOPE 1 + 2):", "TỔNG PHÁT THẢI TRỰC TIẾP LƯỢT TÀU CẬP CẢNG (SCOPE 1 + 2):")}</td>
                          <td className="py-3 px-3 font-mono text-sm text-slate-900">
                            {selectedInvoice.totalEmissionsKg.toLocaleString()} kg CO₂e ({(selectedInvoice.totalEmissionsKg / 1000).toFixed(2)} tCO₂e)
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  );
                })()}
              </div>

              {/* Verified Fuel, Energy & Intensity KPI Box */}
              {(() => {
                const elecTotal = selectedInvoice.totalElectricityKwh || (selectedInvoice.opsElectricityKwh + selectedInvoice.stsCraneElectricityKwh + selectedInvoice.reeferElectricityKwh);
                const fuelTotal = selectedInvoice.totalFuelLiters || (selectedInvoice.tugboatFuelLiters + selectedInvoice.terminalTractorFuelLiters + selectedInvoice.auxEngineBerthFuelLiters);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-blue-700 mb-0.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{t("Port Electricity (Scope 2):", "Điện Năng Cảng (Scope 2):")}</span>
                      </div>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {elecTotal.toLocaleString()} <span className="text-xs">kWh</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {(elecTotal / 1000).toFixed(1)} MWh · {(selectedInvoice.scope2EmissionsKg / 1000).toFixed(2)} tCO₂e
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-700 mb-0.5">
                        <Fuel className="w-3.5 h-3.5" />
                        <span>{t("Marine & Fleet Fuel (Scope 1):", "Nhiên Liệu Tàu Lai & Xe (Scope 1):")}</span>
                      </div>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {fuelTotal.toLocaleString()} <span className="text-xs">{t("Liters", "Lít")}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {(fuelTotal * 0.845 / 1000).toFixed(2)} MT · {(selectedInvoice.scope1EmissionsKg / 1000).toFixed(2)} tCO₂e
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-emerald-800 mb-0.5">
                        {t("Carbon Intensity & Tariff:", "Cường Độ Carbon & Phí:")}
                      </div>
                      <div className="text-xl font-black text-emerald-900 font-mono">
                        {selectedInvoice.emissionPerTeuKg} <span className="text-xs">kgCO₂e/TEU</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        {t("Fee:", "Phí:")} ${Math.round(selectedInvoice.carbonFeeTotalVnd / 25000).toLocaleString()} USD (GLEC / DCSA)
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Verification & QR Code & Digital Signature */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-200">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t("Cryptographic Audit Proof (IMO / DCSA SHA-256 Digest):", "Mã Băm Xác Thực Kiểm Định Điện Tử (IMO / DCSA SHA-256 Digest):")}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 bg-slate-100 p-2 rounded-lg break-all">
                    {selectedInvoice.auditHash}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {t(
                      "Immutable data digest attested by Saigon Newport Corporation, valid for IMO DCS reporting and EU ETS compliance.",
                      "Chuỗi băm dữ liệu bất biến được xác nhận bởi Tổng Công ty Tân Cảng Sài Gòn, hợp lệ cho báo cáo IMO DCS và tuân thủ EU ETS."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-slate-900" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-slate-700 uppercase">{t("DCSA Online Proof", "Chứng Thực DCSA")}</div>
                    <div className="text-[10px] text-slate-500">{t("Scan to verify digest", "Quét mã kiểm tra")}</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-bold">{t("ATTESTED", "ĐÃ XÁC THỰC")}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer button */}
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                {t("Close", "Đóng")}
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] transition-colors flex items-center gap-2 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("Export PDF e-Invoice", "Xuất Hóa Đơn PDF")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
