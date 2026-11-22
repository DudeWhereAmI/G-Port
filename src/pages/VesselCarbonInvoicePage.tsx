import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { CarbonInvoice, TosVesselSchedule, SubPageId } from "../types/gport";
import { MeterModalMode } from "../components/MeterTelemetryModal";
import { LayoutDashboard, Scale, Ship, FileCheck2, ShieldCheck, Filter, FileSpreadsheet, Sheet, X } from "lucide-react";
import { Button, MetaLine, PageHeader, PageSkeleton, Select, Tabs, TabItem, useToast } from "../components/ui";
import { breadcrumbOf } from "../components/shell/pages";
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
  const toast = useToast();
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

  const tabs: TabItem<CarbonTab>[] = [
    { id: "OVERVIEW", label: t("Inventory overview", "Tổng quan kiểm kê"), icon: LayoutDashboard },
    { id: "BALANCE", label: t("Balance & reconciliation", "Cân bằng & đối soát"), icon: Scale },
    { id: "CALLS", label: t("Vessel calls", "Lượt tàu"), icon: Ship },
    { id: "REPORTING", label: t("Reporting & compliance", "Báo cáo & tuân thủ"), icon: FileCheck2 },
    { id: "METHOD", label: t("Methodology & audit", "Phương pháp & kiểm toán"), icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        breadcrumb={breadcrumbOf("VESSEL_CARBON_INVOICE", t)}
        title={t("Carbon accounting", "Kế toán carbon")}
        description={t("Facility inventory and vessel-call emission records (GLEC · ISO 14083)", "Kiểm kê cấp cơ sở và hồ sơ phát thải lượt tàu (GLEC · ISO 14083)")}
        meta={
          <MetaLine
            items={[
              t(`Dataset v2 · ${PERIOD.fromIso} – ${PERIOD.toIso}`, "Dataset v2 · 17/11/2026 – 23/11/2026"),
              t(PORT_NAME.en, PORT_NAME.vn),
              t(`Grid EF ${grid.value} kgCO₂e/kWh (${grid.year})`, `EF lưới ${num(grid.value, 4)} kgCO₂e/kWh (${grid.year})`),
              t("Updated 23/11/2026 11:30", "Cập nhật lúc 23/11/2026 11:30"),
            ]}
          />
        }
        actions={
          <>
            <Button
              icon={FileSpreadsheet}
              onClick={() => {
                downloadLedgerCsv(calls);
                toast(t("Ledger CSV downloaded", "Đã tải CSV sổ cái"));
              }}
            >
              {t("Ledger CSV", "CSV sổ cái")}
            </Button>
            <Button
              variant="primary"
              icon={Sheet}
              onClick={() => {
                downloadReportingExcel("ND06", t("Facility GHG inventory (Decree 06/2022)", "Kiểm kê KNK cấp cơ sở (NĐ 06/2022)"), lang);
                toast(t("Excel form downloaded", "Đã tải biểu mẫu Excel"));
              }}
            >
              {t("Excel form", "Biểu mẫu Excel")}
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <Tabs items={tabs} value={tab} onChange={switchTab} />
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-muted" aria-hidden="true" />
          <Select label={t("Period", "Kỳ báo cáo")} value={period} onChange={(e) => setPeriod(e.target.value as PeriodKind)}>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {t(p.en, p.vn)}
              </option>
            ))}
          </Select>
          <Select label={t("Berth", "Cầu bến")} value={berth} onChange={(e) => setBerth(e.target.value as typeof berth)}>
            <option value="ALL">{t("All", "Tất cả")}</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="B3">B3</option>
          </Select>
          <Select label={t("Carrier", "Hãng tàu")} value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            <option value="ALL">{t("All", "Tất cả")}</option>
            {carriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          {filtered && (
            <Button
              size="sm"
              variant="ghost"
              icon={X}
              onClick={() => {
                setBerth("ALL");
                setCarrier("ALL");
              }}
            >
              {t(`${calls.length}/${CALL_RECORDS.length} calls · clear`, `${calls.length}/${CALL_RECORDS.length} lượt tàu · bỏ lọc`)}
            </Button>
          )}
        </div>
      </div>

      {loading && <PageSkeleton />}

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
