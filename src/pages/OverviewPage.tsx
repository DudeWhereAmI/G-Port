import React from "react";
import {
  SubPageId,
  TosVesselSchedule,
  PvSystemStatus,
  BessSystemStatus,
  ElectricityTariffTou,
  ZoneEmissionSummary,
} from "../types/gport";
import {
  Zap,
  SunMedium,
  BatteryCharging,
  Ship,
  TrendingDown,
  ShieldCheck,
  Leaf,
  Clock,
  PlugZap,
  Server,
  Flame,
} from "lucide-react";

import { MeterModalMode } from "../components/MeterTelemetryModal";
import { useLanguage } from "../context/LanguageContext";
import { MetaLine, PageHeader } from "../components/ui";
import { breadcrumbOf } from "../components/shell/pages";

interface OverviewPageProps {
  onNavigate: (page: SubPageId) => void;
  vessels: TosVesselSchedule[];
  pvStatus: PvSystemStatus;
  bessStatus: BessSystemStatus;
  tariff: ElectricityTariffTou;
  zoneEmissions?: ZoneEmissionSummary[];
  onOpenCarbonInvoice?: (invoiceOrUseCaseId?: string) => void;
  onOpenMeterModal?: (assetId?: string, mode?: MeterModalMode) => void;
  onTraceEntityInTelemetry?: (
    entityId: string,
    popupMode?: "TURNAROUND" | "BREAKDOWN"
  ) => void;
  onInspectForecastWindow?: (windowId: string, openReport?: boolean) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  vessels,
  pvStatus,
  bessStatus,
  tariff,
  zoneEmissions = [],
}) => {
  const { t } = useLanguage();

  const totalLoadKw =
    tariff.currentDemandKw + pvStatus.currentPowerKw + bessStatus.currentPowerKw;
  const pContractLimitKw = tariff.contractDemandKw;
  const safetyMarginPercent = Math.round(
    ((pContractLimitKw - tariff.currentDemandKw) / pContractLimitKw) * 100
  );

  const totalScope1Tons =
    zoneEmissions.reduce((acc, z) => acc + z.scope1Co2Kg, 0) / 1000;
  const totalScope2Tons =
    zoneEmissions.reduce((acc, z) => acc + z.scope2Co2Kg, 0) / 1000;
  const totalPortEmissionsTons = totalScope1Tons + totalScope2Tons;

  // Port-wide non-vessel-specific feeders & infrastructure
  const liveFeederLoads = [
    {
      code: "F-01",
      name: t("STS quay cranes (berth 1–2)", "Cẩu bờ STS (Cầu tàu B1–B2)"),
      kw: 2480,
      capacityKw: 3500,
      zone: t("Quay zone 1", "Khu cầu tàu (zone 1)"),
      color: "#2E598E",
    },
    {
      code: "F-02",
      name: t("Reefer container cooling racks", "Giàn điện container lạnh reefer"),
      kw: 1650,
      capacityKw: 2400,
      zone: t("Yard zone 3", "Bãi lạnh reefer (zone 3)"),
      color: "#0284C7",
    },
    {
      code: "F-03",
      name: t("e-RTG yard gantries (bays B1–B4)", "Cẩu khung bánh lốp e-RTG (Bãi B1–B4)"),
      kw: 1260,
      capacityKw: 2000,
      zone: t("Yard zone 2", "Bãi container (zone 2)"),
      color: "#4A81C9",
    },
    {
      code: "F-04",
      name: t("Shore power (OPS) substation", "Trạm nguồn điện bờ cao áp (OPS)"),
      kw: 1050,
      capacityKw: 2500,
      zone: t("Quay zone 1", "Khu cầu tàu (zone 1)"),
      color: "#10B981",
    },
    {
      code: "F-05",
      name: t("EV yard truck fast chargers", "Trạm sạc nhanh đầu kéo điện EV"),
      kw: 340,
      capacityKw: 800,
      zone: t("Gate & depot", "Trạm sạc & cổng cảng"),
      color: "#6366F1",
    },
    {
      code: "F-06",
      name: t("CFS warehouses, lighting & admin", "Kho CFS, chiếu sáng bãi & điều hành"),
      kw: 180,
      capacityKw: 500,
      zone: t("Port admin", "Khu hành chính & phụ trợ"),
      color: "#64748B",
    },
  ];

  const tariffBands = [
    {
      band: t("Off-Peak window", "Khung giờ thấp điểm"),
      hours: "22:00 – 04:00",
      rate: "1,146 VND/kWh",
      action: t(
        "Off-Peak reefer Pre-Cooling & EV Fast-Charge",
        "Làm lạnh sâu Reefer & Sạc nhanh đội xe đầu kéo điện EV"
      ),
      active: false,
    },
    {
      band: t("Standard window", "Khung giờ bình thường"),
      hours: "04:00 – 09:30 · 11:30 – 17:00 · 20:00 – 22:00",
      rate: "1,811 VND/kWh",
      action: t(
        "Balanced grid + solar PV Self-Consumption",
        "Vận hành cân bằng lưới điện + Tự dùng điện mặt trời mái kho"
      ),
      active: false,
    },
    {
      band: t("Peak window", "Khung giờ cao điểm"),
      hours: "09:30 – 11:30 · 17:00 – 20:00",
      rate: "3,076 VND/kWh",
      action: t(
        "Crane regen recovery & smart load control active",
        "Kích hoạt thu hồi động năng cẩu & Điều tiết phụ tải thông minh"
      ),
      active: true,
    },
  ];

  const translateZoneName = (zoneId: string, rawName: string) => {
    switch (zoneId) {
      case "ZONE_1":
        return t(
          "Zone 1: Berths, STS Quay Cranes & OPS Shore Power (B1, B2, TCIT)",
          rawName
        );
      case "ZONE_2":
        return t(
          "Zone 2: e-RTG Container Yards & Prime Mover Tractor Fleet",
          rawName
        );
      case "ZONE_3":
        return t(
          "Zone 3: Reefer Container Cooling Racks (240 VinaSeafood Units)",
          rawName
        );
      case "ZONE_4":
        return t(
          "Zone 4: ePort Gate, EV Fast-Charging Depot & CFS Solar Building",
          rawName
        );
      default:
        return rawName;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        breadcrumb={breadcrumbOf("OVERVIEW", t)}
        title={t("Port energy & emissions overview", "Tổng quan năng lượng & phát thải")}
        description={t("Live terminal load, substation headroom and emissions across Cat Lai.", "Phụ tải, dư địa trạm biến áp và phát thải toàn cảng Cát Lái theo thời gian thực.")}
        meta={
          <MetaLine
            items={[
              t("Updated 23/11/2026 11:40", "Cập nhật lúc 23/11/2026 11:40"),
              t("Source: SCADA · TOS N4 · meters", "Nguồn: SCADA · TOS N4 · công tơ"),
              t("EVN peak tariff 3,076 VND/kWh", "Giá cao điểm EVN 3.076 đ/kWh"),
            ]}
          />
        }
      />

      {/* Top 4 Terminal-Wide KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{t("Total terminal power", "Tổng công suất phụ tải")}</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {totalLoadKw.toLocaleString()}{" "}
            <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <SunMedium className="w-3.5 h-3.5" />{" "}
              {t("23.9% Solar", "23.9% Điện mặt trời")}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              <BatteryCharging className="w-3.5 h-3.5" />{" "}
              {t("8.5% Crane regen", "8.5% Thu hồi cẩu")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{t("Grid contract limit", "Giới hạn công suất trạm")}</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {tariff.currentDemandKw.toLocaleString()} /{" "}
            {pContractLimitKw.toLocaleString()}{" "}
            <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((tariff.currentDemandKw / pContractLimitKw) * 100)
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
            <span>
              {t(
                `${safetyMarginPercent}% headroom`,
                `Dự phòng an toàn ${safetyMarginPercent}%`
              )}
            </span>
            <span className="text-emerald-600 font-bold">
              {t("Within limit", "Trong ngưỡng an toàn")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{t("Port carbon intensity", "Cường độ phát thải cảng")}</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mb-1">
            18.2{" "}
            <span className="text-sm font-semibold text-slate-600">
              kgCO₂e / TEU
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>
              {t(
                `-14.2% YoY · ${totalPortEmissionsTons.toFixed(1)} tCO₂e/day`,
                `-14.2% so với cùng kỳ · ${totalPortEmissionsTons.toFixed(1)} tCO₂e/ngày`
              )}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>{t("Calling vessels at berth", "Tàu đang cập cầu cảng")}</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {
              vessels.filter(
                (v) => v.status === "OPERATING" || v.status === "BERTHED"
              ).length
            }{" "}
            <span className="text-sm font-semibold text-slate-500">
              {t("Active vessels", "Tàu đang làm hàng")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <PlugZap className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t("Shore power connected", "Đã kết nối điện bờ OPS")}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Non-Vessel-Specific Terminal Infrastructure & Power Supply */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Port Power Supply Mix & Substation Feeder Load (F-01 to F-06) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                {t(
                  "Port-Wide power supply & substation feeders",
                  "Cơ cấu nguồn điện toàn cảng & phụ tải 6 tủ lộ tổng (F-01 – F-06)"
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  "Shared terminal infrastructure and feeder loads not tied to a single vessel",
                  "Hạ tầng lưới điện dùng chung toàn cảng và phân bổ công suất theo từng lộ trạm biến áp 110/22kV"
                )}
              </p>
            </div>
          </div>

          {/* 3 Power Supply Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                {t("National grid (110kV)", "Điện lưới quốc gia (110kV)")}
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {tariff.currentDemandKw.toLocaleString()} kW
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t("67.5% of total port demand", "Chiếm 67.5% tổng phụ tải cảng")}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {t("Rooftop solar PV", "Điện mặt trời mái kho CFS")}
              </div>
              <div className="text-lg font-black text-emerald-700 mt-1">
                +{pvStatus.currentPowerKw.toLocaleString()} kW
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t(
                  "23.9% share · irradiance 845 w/m²",
                  "Tỷ trọng 23.9% · bức xạ 845 w/m²"
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {t("Crane regen & SVC grid", "Thu hồi động năng cẩu & bù SVC")}
              </div>
              <div className="text-lg font-black text-amber-700 mt-1">
                +{bessStatus.currentPowerKw.toLocaleString()} kW
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t(
                  `Efficiency ${bessStatus.socPercent}% · Regen Recovery`,
                  `Hiệu suất ${bessStatus.socPercent}% · Hoàn trả động năng`
                )}
              </div>
            </div>
          </div>

          {/* 6 Substation Feeders Breakdown */}
          <div>
            <div className="text-xs font-bold text-slate-400 mb-3">
              {t(
                `Substation Feeder Distribution (${totalLoadKw.toLocaleString()} kW Total)`,
                `Phân Bổ Công Suất Các Lộ Trạm Biến Áp (Tổng ${totalLoadKw.toLocaleString()} kW)`
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveFeederLoads.map((feeder) => {
                const utilization = Math.round(
                  (feeder.kw / feeder.capacityKw) * 100
                );
                return (
                  <div
                    key={feeder.code}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                          {feeder.code}
                        </span>
                        <span className="font-bold text-slate-900 truncate">
                          {feeder.name}
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-900 shrink-0">
                        {feeder.kw.toLocaleString()} kW
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${utilization}%`,
                          backgroundColor: feeder.color,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{feeder.zone}</span>
                      <span>
                        {t(
                          `${utilization}% of ${feeder.capacityKw.toLocaleString()} kW rated`,
                          `${utilization}% định mức ${feeder.capacityKw.toLocaleString()} kW`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: EVN Tariff Schedule */}
        <div className="space-y-6">
          {/* EVN Time-of-Use Schedule */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  {t("EVN tariff schedule", "Biểu giá điện TOU (EVN)")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    "Daily electricity pricing windows for terminal dispatch",
                    "Khung giờ biểu giá điện 3 bậc trong ngày phục vụ điều độ cảng"
                  )}
                </p>
              </div>

              <div className="space-y-2.5">
                {tariffBands.map((item) => (
                  <div
                    key={item.band}
                    className={`p-3.5 rounded-xl border ${
                      item.active
                        ? "bg-amber-50/70 border-amber-200"
                        : "bg-slate-50/70 border-slate-200/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        {item.band}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          item.active ? "text-amber-700" : "text-slate-700"
                        }`}
                      >
                        {item.rate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.hours}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-1">
                      {item.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>
                {t(
                  "Substation contract limit:",
                  "Giới hạn công suất trạm 110/22kV:"
                )}
              </span>
              <strong className="font-mono text-slate-900">
                8,000 kW (110/22kV)
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Maritime AIS & Geofenced Berth Operations section temporarily hidden per user request */}

      {/* Merged Terminal Emissions MRV by Zone (Scope 1 & Scope 2 Accounting) */}
      {zoneEmissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {t(
                    "Terminal emissions MRV by operational zone (ISO 14083)",
                    "Kiểm kê phát thải MRV theo phân khu vận hành (ISO 14083)"
                  )}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  "Consolidated Scope 1 (Direct Fuel) and Scope 2 (Grid Electricity · EF 0.7221 kgCO₂e/kWh) accounting across port zones",
                  "Tổng hợp phát thải Scope 1 (Nhiên liệu trực tiếp) và Scope 2 (Điện lưới · Hệ số 0.7221 kgCO₂e/kWh) trên 4 phân khu cảng"
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Scope 1: {totalScope1Tons.toFixed(2)} tCO₂e</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Scope 2: {totalScope2Tons.toFixed(2)} tCO₂e</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {zoneEmissions.map((z) => {
              const s1Tons = z.scope1Co2Kg / 1000;
              const s2Tons = z.scope2Co2Kg / 1000;
              const totTons = z.totalCo2Kg / 1000;
              return (
                <div
                  key={z.zoneId}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                        {z.zoneId}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {z.sharePercent}% {t("Share", "Tỷ trọng")}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {translateZoneName(z.zoneId, z.zoneName)}
                    </h4>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{t("Electricity (Scope 2):", "Điện năng (Scope 2):")}</span>
                      <strong className="font-mono text-slate-900">
                        {z.electricityKwh.toLocaleString()} kWh ({s2Tons.toFixed(2)}t)
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{t("Diesel / biofuel (Scope 1):", "Nhiên liệu (Scope 1):")}</span>
                      <strong className="font-mono text-slate-900">
                        {z.fuelLiters.toLocaleString()} L ({s1Tons.toFixed(2)}t)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, z.sharePercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs font-bold text-slate-400">
                        {t("Zone total CO₂e", "Tổng phát thải khu vực")}
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        {totTons.toFixed(2)} tCO₂e
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


