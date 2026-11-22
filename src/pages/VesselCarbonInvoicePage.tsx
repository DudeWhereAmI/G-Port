import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { CarbonInvoice, TosVesselSchedule, SubPageId } from "../types/gport";
import { MeterModalMode } from "../components/MeterTelemetryModal";
import { LayoutDashboard, Scale, Ship, FileCheck2, ShieldCheck, Filter, FileSpreadsheet, Sheet, X } from "lucide-react";
import { CALL_RECORDS, CallRecord, PERIOD, PORT_NAME, PeriodKind } from "../data/module2Carbon";
import { downloadLedgerCsv, downloadReportingExcel } from "../utils/carbonExport";
import { activeFactor } from "../data/emissionFactors";
import { useFormat } from "../utils/format";
import { CallDrawer } from "../components/carbon/CallDrawer";
import { OverviewTab, PERIODS } from "../components/carbon/OverviewTab";
import { BalanceTab } from "../components/carbon/BalanceTab";
import { CallsTab } from "../components/carbon/CallsTab";
import { ReportingTab } from "../components/carbon/ReportingTab";
import { MethodTab } from "../components/carbon/MethodTab";
import { FactorLibrary, IpmvpPanel, ReductionWhatIf, UncertaintyPanel } from "../components/carbon/CarbonDeepDive";

export type CarbonTab = "OVERVIEW" | "BALANCE" | "CALLS" | "REPORTING" | "METHOD";

interface VesselCarbonInvoicePageProps {
  invoices: CarbonInvoice[];
  vessels: TosVesselSchedule[];
  onNavigate?: (page: SubPageId) => void;
  onOpenMeterModal?: (assetId?: string, mode?: MeterModalMode) => void;
  focusedInvoiceId?: string | null;
  onClearFocusedInvoice?: () => void;
  onTraceVoyageInTelemetry?: (vesselEntityId: string, voyageNumber: string) => void;
  initialTab?: CarbonTab | null;
  onClearInitialTab?: () => void;
}

/** Legacy identifiers used by other pages (use-case ids / invoice numbers) → ledger call. */
const LEGACY_IDS: Record<string, string> = { "UC-01": "SPIRIT OF MUMBAI", "UC-02": "ONE APUS", "UC-03": "GSL KITHIRA", "UC-04": "TAN CANG GLORY" };

export function findCall(identifier: string): CallRecord | undefined {
  const norm = identifier.toUpperCase();
  const legacy = Object.entries(LEGACY_IDS).find(([k]) => norm.includes(k));
  return CALL_RECORDS.find(
    (r) => r.recordNo.toUpperCase() === norm || r.voyage.toUpperCase() === norm || norm.includes(r.vessel.toUpperCase()) || (legacy && legacy[1] === r.vessel)
  );
}

export const VesselCarbonInvoicePage: React.FC<VesselCarbonInvoicePageProps> = ({ focusedInvoiceId, onClearFocusedInvoice, initialTab, onClearInitialTab, onNavigate }) => {
  const { t, lang } = useLanguage();
  const { num } = useFormat();
  const [tab, setTab] = useState<CarbonTab>("OVERVIEW");
  const [openCall, setOpenCall] = useState<CallRecord | null>(null);
  const [period, setPeriod] = useState<PeriodKind>("DAY");
  const [berth, setBerth] = useState<"ALL" | "B1" | "B2" | "B3">("ALL");
  const [carrier, setCarrier] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const grid = activeFactor("GRID");
  const carriers = useMemo(() => Array.from(new Set(CALL_RECORDS.map((r) => r.carrier))).sort(), []);
  const calls = useMemo(
    () => CALL_RECORDS.filter((r) => (berth === "ALL" || r.berth === berth) && (carrier === "ALL" || r.carrier === carrier)),
    [berth, carrier]
  );
  const filtered = berth !== "ALL" || carrier !== "ALL";

  const switchTab = (next: CarbonTab) => {
    if (next === tab) return;
    setLoading(true);
    setTab(next);
    setTimeout(() => setLoading(false), 250);
  };

  useEffect(() => {
    if (!focusedInvoiceId) return;
    const r = findCall(focusedInvoiceId);
    if (r) {
      setTab("CALLS");
      setOpenCall(r);
    }
    onClearFocusedInvoice?.();
  }, [focusedInvoiceId, onClearFocusedInvoice]);

  useEffect(() => {
    if (!initialTab) return;
    setTab(initialTab);
    if (initialTab === "METHOD") setTimeout(() => document.getElementById("ipmvp")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    onClearInitialTab?.();
  }, [initialTab, onClearInitialTab]);

  const tabs: { id: CarbonTab; label: string; icon: React.ElementType }[] = [
    { id: "OVERVIEW", label: t("Inventory overview", "Tổng quan kiểm kê"), icon: LayoutDashboard },
    { id: "BALANCE", label: t("Balance & reconciliation", "Cân bằng & Đối soát"), icon: Scale },
    { id: "CALLS", label: t("Vessel calls", "Lượt tàu"), icon: Ship },
    { id: "REPORTING", label: t("Reporting & compliance", "Báo cáo & Tuân thủ"), icon: FileCheck2 },
    { id: "METHOD", label: t("Methodology & audit", "Phương pháp & Kiểm toán"), icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div>
          <div className="text-xs font-bold text-[#004B91] mb-1">{t("Emissions & records (M-2 · e-INV)", "Phát thải & hồ sơ (M-2 · e-INV)")}</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("Carbon Accounting & Vessel-Call Emission Records", "Kế toán Carbon & Hồ sơ Phát thải Lượt tàu")}
          </h1>
          <div className="text-[11px] text-slate-600 mt-1">
            {t(
              `Dataset v2 · ${PERIOD.fromIso} – ${PERIOD.toIso} · ${PORT_NAME.en} · grid EF ${grid.value} kgCO₂e/kWh (${grid.year})`,
              `Dataset v2 · 17/11 – 23/11/2026 · ${PORT_NAME.vn} · EF lưới ${num(grid.value, 4)} kgCO₂e/kWh (${grid.year})`
            )}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl text-xs" role="tablist">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => switchTab(x.id)}
              className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                tab === x.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <x.icon className="w-3.5 h-3.5" />
              {x.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <label className="flex items-center gap-1 font-bold text-slate-600">
              {t("Period", "Kỳ báo cáo")}
              <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKind)} className="px-2 py-1 border border-slate-200 rounded-lg bg-white font-semibold cursor-pointer">
                {PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(p.en, p.vn)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 font-bold text-slate-600">
              {t("Berth", "Cầu bến")}
              <select value={berth} onChange={(e) => setBerth(e.target.value as typeof berth)} className="px-2 py-1 border border-slate-200 rounded-lg bg-white font-semibold cursor-pointer">
                <option value="ALL">{t("All", "Tất cả")}</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="B3">B3</option>
              </select>
            </label>
            <label className="flex items-center gap-1 font-bold text-slate-600">
              {t("Carrier", "Hãng tàu")}
              <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg bg-white font-semibold cursor-pointer max-w-[200px]">
                <option value="ALL">{t("All", "Tất cả")}</option>
                {carriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setBerth("ALL");
                  setCarrier("ALL");
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                {t(`${calls.length}/${CALL_RECORDS.length} calls · clear`, `${calls.length}/${CALL_RECORDS.length} lượt tàu · bỏ lọc`)}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => downloadLedgerCsv(calls)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              {t("Ledger CSV", "CSV sổ cái")}
            </button>
            <button
              type="button"
              onClick={() => downloadReportingExcel("ND06", t("Facility GHG inventory (Decree 06/2022)", "Kiểm kê KNK cấp cơ sở (NĐ 06/2022)"), lang)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <Sheet className="w-3.5 h-3.5 text-[#004B91]" />
              {t("Excel form", "Excel biểu mẫu")}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse" aria-busy="true">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-200/70" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-200/70" />
        </div>
      )}

      {!loading && tab === "OVERVIEW" && (
        <OverviewTab
          period={period}
          calls={calls}
          filtered={filtered}
          onOpenCall={setOpenCall}
          extra={
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 items-start">
              <UncertaintyPanel calls={calls} />
              <ReductionWhatIf />
            </div>
          }
        />
      )}
      {!loading && tab === "BALANCE" && <BalanceTab calls={calls} onOpenCall={setOpenCall} />}
      {!loading && tab === "CALLS" && <CallsTab calls={calls} onOpenCall={setOpenCall} />}
      {!loading && tab === "REPORTING" && <ReportingTab calls={calls} onOpenCall={setOpenCall} />}
      {!loading && tab === "METHOD" && (
        <MethodTab
          onOpenCall={setOpenCall}
          top={<IpmvpPanel onOpenM3={onNavigate ? () => onNavigate("MODULE_3_OPTIMIZATION") : undefined} />}
          bottom={<FactorLibrary />}
        />
      )}

      {openCall && <CallDrawer record={openCall} onClose={() => setOpenCall(null)} />}
    </div>
  );
};
