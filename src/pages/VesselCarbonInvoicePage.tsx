import React, { useState } from "react";
import { 
  CarbonInvoice, 
  TosVesselSchedule,
  SubPageId
} from "../types/gport";
import { 
  FileText, 
  Ship, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Download, 
  Printer, 
  ExternalLink, 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  Zap, 
  Fuel, 
  Layers, 
  Filter,
  X,
  Anchor,
  PlugZap, 
  DollarSign,
  Gauge
} from "lucide-react";

interface VesselCarbonInvoicePageProps {
  invoices: CarbonInvoice[];
  vessels: TosVesselSchedule[];
  onNavigate?: (page: SubPageId) => void;
  onOpenMeterModal?: (assetId?: string) => void;
}

export const VesselCarbonInvoicePage: React.FC<VesselCarbonInvoicePageProps> = ({
  invoices,
  vessels,
  onNavigate,
  onOpenMeterModal
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<CarbonInvoice | null>(invoices[0]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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

  // Aggregated KPIs
  const totalInvoices = invoices.length;
  const verifiedCount = invoices.filter(i => i.status === "VERIFIED_IMO").length;
  const totalPortElectricityKwh = invoices.reduce((acc, i) => acc + (i.totalElectricityKwh || (i.opsElectricityKwh + i.stsCraneElectricityKwh + i.reeferElectricityKwh)), 0);
  const totalMarineFuelLiters = invoices.reduce((acc, i) => acc + (i.totalFuelLiters || (i.terminalTractorFuelLiters + i.tugboatFuelLiters + i.auxEngineBerthFuelLiters)), 0);
  const totalFeesUsd = invoices.reduce((acc, i) => acc + (i.carbonFeeTotalVnd / 25000), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="font-bold text-[#004B91]">DCSA e-INVOICE · IMO DCS</span>
            <span aria-hidden="true">·</span>
            <span>Electronic Energy, Fuel & Carbon Attestation</span>
            <span aria-hidden="true">·</span>
            <span>ISO 14083 Compliant</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Port Call Invoicing: Fuel, Energy & Emissions Attestation
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          {onNavigate && (
            <button
              onClick={() => onNavigate("VESSEL_SCHEDULE")}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Ship className="w-3.5 h-3.5 text-[#004B91]" />
              <span>Vessel Schedule (TOS)</span>
            </button>
          )}

          <button
            onClick={() => handleOpenInvoice(invoices[0])}
            className="px-4 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Latest Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Invoices Generated</span>
            <FileText className="w-4 h-4 text-[#004B91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {totalInvoices} <span className="text-xs text-slate-500 font-semibold">Port Calls</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            100% automated accounting
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>IMO DCS Certified</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {verifiedCount}/{totalInvoices} <span className="text-xs text-slate-500 font-semibold">Attested</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
            DCSA SHA-256 Hash Verified
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Port Electricity (Scope 2)</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            {(totalPortElectricityKwh / 1000).toFixed(1)} <span className="text-xs text-slate-500 font-semibold">MWh</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {totalPortElectricityKwh.toLocaleString()} kWh (OPS + STS + Reefer)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Liquid Fuel (Scope 1)</span>
            <Fuel className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">
            {totalMarineFuelLiters.toLocaleString()} <span className="text-xs text-slate-500 font-semibold">Liters</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {(totalMarineFuelLiters * 0.845 / 1000).toFixed(2)} MT (Tugboats & Tractors)
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vessel, IMO, carrier or invoice ID (e.g., SPIRIT OF MUMBAI, ONE APUS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#004B91] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] uppercase mr-1">Filter:</span>
          {(["ALL", "VERIFIED_IMO", "ISSUED", "DRAFT"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === st
                  ? "bg-[#004B91] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All Invoices" : st === "VERIFIED_IMO" ? "IMO Verified" : st === "ISSUED" ? "Issued" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Invoices Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredInvoices.map((inv) => (
          <div
            key={inv.invoiceNumber}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all flex flex-col justify-between space-y-4"
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
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{inv.invoiceNumber}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm mt-0.5">{inv.vesselName}</h3>
                  <div className="text-xs text-slate-500 font-medium">{inv.carrierName}</div>
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase ${
                  inv.status === "VERIFIED_IMO" ? "text-emerald-700" :
                  inv.status === "ISSUED" ? "text-blue-700" : "text-amber-700"
                }`}>
                  {inv.status === "VERIFIED_IMO" ? "IMO Verified" : inv.status === "ISSUED" ? "Issued" : "Draft"}
                </span>
              </div>

              {/* Voyage parameters */}
              <div className="py-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">IMO / Voyage:</span>
                  <strong className="text-slate-800 font-mono">{inv.imoNumber} · {inv.voyageNumber}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Berth & Stay:</span>
                  <strong className="text-slate-800">{inv.berth} ({inv.hotelingDurationHours}h)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Handled Volume:</span>
                  <strong className="text-slate-800 font-mono">{inv.teuHandled.toLocaleString()} TEU</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Port Electricity:</span>
                  <strong className="text-blue-700 font-bold font-mono">
                    {(inv.totalElectricityKwh || (inv.opsElectricityKwh + inv.stsCraneElectricityKwh + inv.reeferElectricityKwh)).toLocaleString()} kWh
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Tug & Tractor Fuel:</span>
                  <strong className="text-amber-700 font-bold font-mono">
                    {(inv.totalFuelLiters || (inv.terminalTractorFuelLiters + inv.tugboatFuelLiters + inv.auxEngineBerthFuelLiters)).toLocaleString()} Liters
                  </strong>
                </div>
              </div>

              {/* Energy & Carbon Footprint Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Direct Footprint:</span>
                  <strong className="text-slate-900 font-mono text-xs">{(inv.totalEmissionsKg / 1000).toFixed(2)} tCO₂e</strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Scope 1 / Scope 2:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {(inv.scope1EmissionsKg / 1000).toFixed(1)}t fuel · {(inv.scope2EmissionsKg / 1000).toFixed(1)}t grid
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-semibold text-emerald-800">Carbon Intensity:</span>
                  <strong className="text-emerald-800 font-mono font-bold">{inv.emissionPerTeuKg} kgCO₂e/TEU</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenMeterModal) onOpenMeterModal(inv.useCaseId || inv.invoiceNumber);
                }}
                className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                title="View Fuel & Electricity Multi-Meter Diagrams for this Port Call"
              >
                <Gauge className="w-3.5 h-3.5 text-rose-600" />
                <span>Meter Diagram</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenInvoice(inv)}
                className="py-2 bg-[#004B91] hover:bg-[#00386E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>e-Invoice</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 5. MODAL: FORMAL E-CARBON INVOICE VIEW & PRINT CERTIFICATE */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Controls Bar */}
            <div className="bg-[#004B91] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm">ELECTRONIC CARBON INVOICE & AUDIT CERTIFICATE</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
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
                    SAIGON NEWPORT CORPORATION (SNP)
                  </div>
                  <div className="text-slate-600 text-[11px] font-semibold mt-0.5">
                    G-Port Maritime Energy Management · Port Call Emissions Manifest
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    Cat Lai & Cai Mep Deep-Sea Terminals · Compliant with GLEC v3.0, ISO 14083 & EU ETS Maritime
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-slate-500 font-medium">
                    Issue Date: {selectedInvoice.issueDate}
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
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vessel Name:</span>
                  <strong className="text-slate-900 text-sm font-black">{selectedInvoice.vesselName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">IMO Number:</span>
                  <strong className="text-slate-800 font-mono">{selectedInvoice.imoNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Carrier / Line:</span>
                  <strong className="text-slate-800">{selectedInvoice.carrierName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Voyage:</span>
                  <strong className="text-slate-800 font-mono">{selectedInvoice.voyageNumber}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Terminal & Berth:</span>
                  <strong className="text-slate-800">{selectedInvoice.berth}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Hoteling Duration:</span>
                  <strong className="text-slate-800">{selectedInvoice.hotelingDurationHours} Hours</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Handled TEU:</span>
                  <strong className="text-slate-800 font-mono">{selectedInvoice.teuHandled.toLocaleString()} TEU</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">OPS Cold Ironing:</span>
                  <strong className="text-emerald-700 font-bold">
                    {selectedInvoice.opsElectricityKwh > 0 ? "Connected (6.6 kV)" : "Not Connected"}
                  </strong>
                </div>
              </div>

              {/* Energy & Fuel Consumption Breakdown Table */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Metered Fuel & Energy Consumption and Emissions Breakdown
                  </div>
                  {onOpenMeterModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMeterModal(selectedInvoice.useCaseId || selectedInvoice.invoiceNumber);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
                    >
                      <Gauge className="w-3.5 h-3.5 text-rose-600" />
                      <span>Inspect Multi-Meter Diagrams</span>
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
                          <th className="py-2.5 px-3">Port Activity & Equipment</th>
                          <th className="py-2.5 px-3">Energy / Fuel Type</th>
                          <th className="py-2.5 px-3 font-mono">Metered Quantity</th>
                          <th className="py-2.5 px-3 font-mono">Emission Factor</th>
                          <th className="py-2.5 px-3 font-mono">Emissions (kg CO₂e)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Scope 2 Electricity Section */}
                        <tr className="bg-blue-50/50 font-bold text-[#004B91]">
                          <td colSpan={5} className="py-1.5 px-3 text-[11px] uppercase tracking-wider">
                            1. Grid Electricity Consumption (Scope 2)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">Shore Power (OPS Auxiliary Cold Ironing)</td>
                          <td className="py-2 px-3 text-slate-600">Grid Power 6.6kV</td>
                          <td className="py-2 px-3 font-mono font-semibold text-blue-700">{selectedInvoice.opsElectricityKwh.toLocaleString()} kWh</td>
                          <td className="py-2 px-3 font-mono text-slate-500">0.7221 kg/kWh</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.opsElectricityKwh * 0.7221).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">STS Quay Crane Container Handling</td>
                          <td className="py-2 px-3 text-slate-600">Grid Power 22kV</td>
                          <td className="py-2 px-3 font-mono font-semibold text-blue-700">{selectedInvoice.stsCraneElectricityKwh.toLocaleString()} kWh</td>
                          <td className="py-2 px-3 font-mono text-slate-500">0.7221 kg/kWh</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.stsCraneElectricityKwh * 0.7221).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">Reefer Yard Infrastructure Power</td>
                          <td className="py-2 px-3 text-slate-600">Grid Power 380V</td>
                          <td className="py-2 px-3 font-mono font-semibold text-blue-700">{selectedInvoice.reeferElectricityKwh.toLocaleString()} kWh</td>
                          <td className="py-2 px-3 font-mono text-slate-500">0.7221 kg/kWh</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.reeferElectricityKwh * 0.7221).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="bg-slate-50/60 font-semibold text-slate-700 text-[11px]">
                          <td colSpan={2} className="py-1.5 px-3 pl-5 text-slate-600">Subtotal Electricity:</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-blue-800">{elecTotal.toLocaleString()} kWh ({(elecTotal / 1000).toFixed(1)} MWh)</td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">Scope 2 Total</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{selectedInvoice.scope2EmissionsKg.toLocaleString()} kg</td>
                        </tr>

                        {/* Scope 1 Liquid Fuel Section */}
                        <tr className="bg-amber-50/50 font-bold text-amber-900">
                          <td colSpan={5} className="py-1.5 px-3 text-[11px] uppercase tracking-wider">
                            2. Liquid Marine & Fleet Fuel Combustion (Scope 1)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">Harbor Tug Assistance (Berthing & Unberthing)</td>
                          <td className="py-2 px-3 text-slate-600">Marine Gas Oil (MGO)</td>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-800">{selectedInvoice.tugboatFuelLiters.toLocaleString()} Liters</td>
                          <td className="py-2 px-3 font-mono text-slate-500">2.68 kg/L</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.tugboatFuelLiters * 2.68).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 pl-5 font-semibold text-slate-800">Internal Terminal Tractors (Yard Shuttle)</td>
                          <td className="py-2 px-3 text-slate-600">Ultra-Low Sulfur Diesel</td>
                          <td className="py-2 px-3 font-mono font-semibold text-amber-800">{selectedInvoice.terminalTractorFuelLiters.toLocaleString()} Liters</td>
                          <td className="py-2 px-3 font-mono text-slate-500">2.68 kg/L</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {Math.round(selectedInvoice.terminalTractorFuelLiters * 2.68).toLocaleString()}
                          </td>
                        </tr>
                        {selectedInvoice.auxEngineBerthFuelLiters > 0 && (
                          <tr>
                            <td className="py-2 px-3 pl-5 font-semibold text-rose-700">Auxiliary Engine Diesel Combustion (At Berth)</td>
                            <td className="py-2 px-3 text-slate-600">MGO / HFO</td>
                            <td className="py-2 px-3 font-mono font-semibold text-rose-700">{selectedInvoice.auxEngineBerthFuelLiters.toLocaleString()} Liters</td>
                            <td className="py-2 px-3 font-mono text-slate-500">3.11 kg/L</td>
                            <td className="py-2 px-3 font-mono font-bold text-rose-700">
                              {Math.round(selectedInvoice.auxEngineBerthFuelLiters * 3.11).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-50/60 font-semibold text-slate-700 text-[11px]">
                          <td colSpan={2} className="py-1.5 px-3 pl-5 text-slate-600">Subtotal Liquid Fuel:</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-amber-800">{fuelTotal.toLocaleString()} Liters ({(fuelTotal * 0.845 / 1000).toFixed(2)} MT)</td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">Scope 1 Total</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{selectedInvoice.scope1EmissionsKg.toLocaleString()} kg</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="py-3 px-3 text-right">TOTAL DIRECT PORT CALL EMISSIONS (SCOPE 1 + 2):</td>
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
                        <span>Port Electricity (Scope 2):</span>
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
                        <span>Marine & Fleet Fuel (Scope 1):</span>
                      </div>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {fuelTotal.toLocaleString()} <span className="text-xs">Liters</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {(fuelTotal * 0.845 / 1000).toFixed(2)} MT · {(selectedInvoice.scope1EmissionsKg / 1000).toFixed(2)} tCO₂e
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-emerald-800 mb-0.5">
                        Carbon Intensity & Tariff:
                      </div>
                      <div className="text-xl font-black text-emerald-900 font-mono">
                        {selectedInvoice.emissionPerTeuKg} <span className="text-xs">kgCO₂e/TEU</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Fee: ${Math.round(selectedInvoice.carbonFeeTotalVnd / 25000).toLocaleString()} USD (GLEC / DCSA)
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
                    <span>Cryptographic Audit Proof (IMO / DCSA SHA-256 Digest):</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 bg-slate-100 p-2 rounded-lg break-all">
                    {selectedInvoice.auditHash}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Immutable data digest attested by Saigon Newport Corporation, valid for IMO DCS reporting and EU ETS compliance.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-slate-900" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-slate-700 uppercase">DCSA Online Proof</div>
                    <div className="text-[10px] text-slate-500">Scan to verify digest</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-bold">ATTESTED</div>
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
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-[#004B91] text-white rounded-lg text-xs font-bold hover:bg-[#00386E] transition-colors flex items-center gap-2 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF e-Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
