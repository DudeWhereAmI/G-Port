import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { CarbonInvoice, TosVesselSchedule, SubPageId } from "../types/gport";
import { MeterModalMode } from "../components/MeterTelemetryModal";
import { LayoutDashboard, Scale, Ship, FileCheck2, ShieldCheck } from "lucide-react";
import { CALL_RECORDS, CallRecord, PERIOD, PORT_NAME } from "../data/module2Carbon";
import { activeFactor } from "../data/emissionFactors";
import { useFormat } from "../utils/format";
import { CallDrawer } from "../components/carbon/CallDrawer";
import { OverviewTab } from "../components/carbon/OverviewTab";
import { BalanceTab } from "../components/carbon/BalanceTab";
import { CallsTab } from "../components/carbon/CallsTab";
import { ReportingTab } from "../components/carbon/ReportingTab";
import { MethodTab } from "../components/carbon/MethodTab";

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

export const VesselCarbonInvoicePage: React.FC<VesselCarbonInvoicePageProps> = ({ focusedInvoiceId, onClearFocusedInvoice, initialTab, onClearInitialTab }) => {
  const { t } = useLanguage();
  const { num } = useFormat();
  const [tab, setTab] = useState<CarbonTab>("OVERVIEW");
  const [openCall, setOpenCall] = useState<CallRecord | null>(null);
  const grid = activeFactor("GRID");
  const calls = CALL_RECORDS;

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
              onClick={() => setTab(x.id)}
              className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                tab === x.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <x.icon className="w-3.5 h-3.5" />
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "OVERVIEW" && <OverviewTab calls={calls} filtered={false} onOpenCall={setOpenCall} />}
      {tab === "BALANCE" && <BalanceTab calls={calls} onOpenCall={setOpenCall} />}
      {tab === "CALLS" && <CallsTab calls={calls} onOpenCall={setOpenCall} />}
      {tab === "REPORTING" && <ReportingTab calls={calls} onOpenCall={setOpenCall} />}
      {tab === "METHOD" && <MethodTab onOpenCall={setOpenCall} />}

      {openCall && <CallDrawer record={openCall} onClose={() => setOpenCall(null)} />}
    </div>
  );
};
