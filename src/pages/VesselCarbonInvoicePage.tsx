import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { CarbonInvoice, TosVesselSchedule, SubPageId } from "../types/gport";
import { MeterModalMode } from "../components/MeterTelemetryModal";
import { Ship, Leaf, Gauge, Scale } from "lucide-react";
import { CALL_RECORDS, CallRecord, LEDGER_TOTALS, PERIOD, PORT_NAME, REPORT_TARGETS } from "../data/module2Carbon";
import { activeFactor } from "../data/emissionFactors";
import { useFormat } from "../utils/format";
import { CallDrawer } from "../components/carbon/CallDrawer";
import { IntensityBar, MeasuredBar, RecordStatusBadge } from "../components/carbon/CarbonShared";

interface VesselCarbonInvoicePageProps {
  invoices: CarbonInvoice[];
  vessels: TosVesselSchedule[];
  onNavigate?: (page: SubPageId) => void;
  onOpenMeterModal?: (assetId?: string, mode?: MeterModalMode) => void;
  focusedInvoiceId?: string | null;
  onClearFocusedInvoice?: () => void;
  onTraceVoyageInTelemetry?: (vesselEntityId: string, voyageNumber: string) => void;
}

/** Legacy identifiers used by other pages (use-case ids / invoice numbers) → ledger call. */
const LEGACY_IDS: Record<string, string> = { "UC-01": "SPIRIT OF MUMBAI", "UC-02": "ONE APUS", "UC-03": "GSL KITHIRA", "UC-04": "TAN CANG GLORY" };

export function findCall(identifier: string): CallRecord | undefined {
  const norm = identifier.toUpperCase();
  const legacy = Object.entries(LEGACY_IDS).find(([k]) => norm.includes(k));
  return CALL_RECORDS.find(
    (r) =>
      r.recordNo.toUpperCase() === norm ||
      r.voyage.toUpperCase() === norm ||
      norm.includes(r.vessel.toUpperCase()) ||
      (legacy && legacy[1] === r.vessel)
  );
}

export const VesselCarbonInvoicePage: React.FC<VesselCarbonInvoicePageProps> = ({ focusedInvoiceId, onClearFocusedInvoice }) => {
  const { t } = useLanguage();
  const { num, pct } = useFormat();
  const [openCall, setOpenCall] = useState<CallRecord | null>(null);
  const grid = activeFactor("GRID");

  useEffect(() => {
    if (!focusedInvoiceId) return;
    const r = findCall(focusedInvoiceId);
    if (r) setOpenCall(r);
    onClearFocusedInvoice?.();
  }, [focusedInvoiceId, onClearFocusedInvoice]);

  const tiles = useMemo(
    () => [
      { icon: Ship, l: t("Vessel calls · TEU", "Lượt tàu · TEU"), v: `${LEDGER_TOTALS.calls} · ${num(LEDGER_TOTALS.teu)}` },
      {
        icon: Leaf,
        l: t("Total (Scope 1 / Scope 2)", "Tổng (Scope 1 / Scope 2)"),
        v: `${num(LEDGER_TOTALS.totalKg / 1000, 2)} tCO₂e`,
        s: `${num(LEDGER_TOTALS.scope1Kg / 1000, 2)} / ${num(LEDGER_TOTALS.scope2Kg / 1000, 2)} t`,
      },
      { icon: Gauge, l: t("Intensity", "Cường độ"), v: `${num(LEDGER_TOTALS.intensity, 2)} kgCO₂e/TEU` },
      { icon: Scale, l: t("Directly measured", "Đo trực tiếp"), v: pct(LEDGER_TOTALS.measuredPct) },
    ],
    [t, num, pct]
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((x) => (
          <div key={x.l} className="bg-white p-4 rounded-xl border border-slate-200/90">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
              <span>{x.l}</span>
              <x.icon className="w-4 h-4 text-[#004B91]" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">{x.v}</div>
            {x.s && <div className="text-[11px] text-slate-500 tabular-nums">{x.s}</div>}
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
        <div>
          <h2 className="font-bold text-slate-900 text-sm">{t("Vessel-call emission records (GLEC · ISO 14083)", "Hồ sơ phát thải lượt tàu (GLEC · ISO 14083)")}</h2>
          <div className="text-[11px] text-slate-500">
            {t(
              `${REPORT_TARGETS.calls} calls · port average ${num(LEDGER_TOTALS.intensity, 2)} kgCO₂e/TEU (black marker)`,
              `${REPORT_TARGETS.calls} lượt tàu · bình quân cảng ${num(LEDGER_TOTALS.intensity, 2)} kgCO₂e/TEU (vạch đen)`
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {CALL_RECORDS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setOpenCall(r)}
              className="text-left rounded-xl border border-slate-200 hover:border-[#004B91] hover:bg-blue-50/30 p-3 space-y-2 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-black text-slate-900 text-sm leading-tight break-words">{r.vessel}</div>
                  <div className="text-[11px] text-slate-500 break-words">{r.carrier}</div>
                </div>
                <RecordStatusBadge status={r.status} />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] text-slate-500">{num(r.teu)} TEU</span>
                <span className="font-black text-slate-900 tabular-nums">{num(r.totalKg / 1000, 2)} tCO₂e</span>
              </div>
              <IntensityBar value={r.intensity} avg={LEDGER_TOTALS.intensity} label={num(r.intensity, 1)} />
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="whitespace-nowrap">{t("Measured", "Đo trực tiếp")}</span>
                <MeasuredBar pct={r.measuredPct} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {openCall && <CallDrawer record={openCall} onClose={() => setOpenCall(null)} />}
    </div>
  );
};
