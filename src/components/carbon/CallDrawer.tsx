import React, { useState } from "react";
import { FileText, FileJson, ChevronDown, ChevronRight, Calculator, Leaf, Copy } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import {
  AUX_ENGINE_KG_PER_KWH,
  CallRecord,
  DataLevel,
  ENERGY_BALANCE,
  LEDGER_TOTALS,
  SOURCE_META,
  callPowerSeries,
  stamp,
} from "../../data/module2Carbon";
import { LevelBadge, MeasuredBar, StatusStepper, useLevelLabel } from "./CarbonShared";
import { downloadRecordJson, openRecordPdf } from "../../utils/carbonExport";
import { Button, DetailDrawer, IconButton, useToast } from "../ui";

const LEVEL_COLOR: Record<DataLevel, string> = { MEASURED: "#10B981", ALLOCATED: "#3B82F6", ESTIMATED: "#F59E0B" };

/** One drawer for a vessel call, opened from any chart / table (D). */
export const CallDrawer: React.FC<{ record: CallRecord; onClose: () => void }> = ({ record: r, onClose }) => {
  const { t, lang } = useLanguage();
  const { num, pct } = useFormat();
  const levelLabel = useLevelLabel();
  const [showMeters, setShowMeters] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const toast = useToast();

  const bars = r.lines.map((l) => ({
    name: t(SOURCE_META[l.source].name.en, SOURCE_META[l.source].name.vn),
    MEASURED: l.level === "MEASURED" ? l.kg : 0,
    ALLOCATED: l.level === "ALLOCATED" ? l.kg : 0,
    ESTIMATED: l.level === "ESTIMATED" ? l.kg : 0,
  }));
  const power = callPowerSeries(r);

  const meters = r.lines.map((l) => {
    const id =
      l.source === "OPS" ? `MTR-OPS-${r.berth}` : l.source === "STS" ? `MTR-F01-${r.berth}` : l.source === "RTG" ? `MTR-F02-${r.berth}` : l.source === "REEFER" ? "MTR-F03-RY" : l.source === "TUG" ? "LOG-TUG" : "FUELCARD-TRK";
    return { id, source: l.source, qty: l.quantity, unit: l.unit, level: l.level };
  });

  return (
    <DetailDrawer
      width={640}
      title={r.vessel}
      subtitle={
        <>
          {r.carrier} · {t("Berth", "Cầu")} {r.berth} · {stamp(r.etaMin)} → {stamp(r.etdMin)} · <span className="font-code">{r.recordNo}</span>
        </>
      }
      onClose={onClose}
      footer={
        <>
          <Button icon={FileJson} onClick={() => { downloadRecordJson(r); toast(t("Record file downloaded", "Đã tải tệp hồ sơ")); }}>
            {t("Record file (.json)", "Tệp hồ sơ (.json)")}
          </Button>
          <Button
            variant="primary"
            icon={FileText}
            onClick={() => {
              const ok = openRecordPdf(r, lang);
              toast(ok ? t("Record opened for printing", "Đã mở hồ sơ để in") : t("Pop-up blocked – allow pop-ups and retry", "Trình duyệt chặn tab mới – hãy cho phép rồi thử lại"), ok ? "success" : "warning");
            }}
          >
            {t("Emission record (PDF)", "Hồ sơ phát thải (PDF)")}
          </Button>
        </>
      }
    >
        <div className="space-y-5 text-sm text-ink">
          <StatusStepper status={r.status} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { l: "TEU", v: num(r.teu) },
              { l: t("Total", "Tổng"), v: `${num(r.totalKg / 1000, 2)} tCO₂e` },
              { l: "kgCO₂e/TEU", v: num(r.intensity, 2) },
              { l: t("Uncertainty", "Độ bất định"), v: `±${num(r.uncertaintyPct, 1)}%` },
            ].map((x) => (
              <div key={x.l} className="bg-slate-50 border border-line rounded-control p-2">
                <div className="text-xs font-medium text-muted">{x.l}</div>
                <div className="font-medium text-ink tabular-nums">{x.v}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">{t("Directly measured share", "Tỷ lệ đo trực tiếp")}</div>
            <MeasuredBar pct={r.measuredPct} />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-700">{t("Emissions by source (kgCO₂e)", "Phát thải theo nguồn (kgCO₂e)")}</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" fontSize={12} stroke="#94A3B8" tickLine={false} tickFormatter={(v: number) => num(v)} />
                  <YAxis type="category" dataKey="name" fontSize={12} stroke="#94A3B8" tickLine={false} width={110} />
                  <Tooltip formatter={(v: any, k: any) => [`${num(Number(v))} kg`, levelLabel(k as DataLevel)]} />
                  <Legend formatter={(k: any) => levelLabel(k as DataLevel)} wrapperStyle={{ fontSize: 12 }} />
                  {(["MEASURED", "ALLOCATED", "ESTIMATED"] as DataLevel[]).map((lv) => (
                    <Bar key={lv} dataKey={lv} stackId="s" fill={LEVEL_COLOR[lv]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border border-line rounded-card">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="py-1.5 px-2">{t("Source", "Nguồn")}</th>
                  <th className="py-1.5 px-2 text-right">{t("Quantity", "Lượng")}</th>
                  <th className="py-1.5 px-2 text-right">{t("Factor", "Hệ số")}</th>
                  <th className="py-1.5 px-2 text-right">kgCO₂e</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.lines.map((l) => (
                  <tr key={l.source}>
                    <td className="py-1.5 px-2">
                      <div className="font-semibold">{t(SOURCE_META[l.source].name.en, SOURCE_META[l.source].name.vn)}</div>
                      <LevelBadge level={l.level} />
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {num(l.quantity)} {l.unit}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {num(l.effectiveFactor, 4)}
                      <div className="text-xs text-slate-400 font-code">{l.factorId}</div>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums font-medium">{num(l.kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-700">{t("At-berth power (15 min)", "Công suất khi nằm bến (15 phút)")}</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={power} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#EEF0F3" />
                  <XAxis dataKey="label" fontSize={12} stroke="#94A3B8" tickLine={false} interval={Math.max(1, Math.floor(power.length / 5))} />
                  <YAxis fontSize={12} stroke="#94A3B8" tickLine={false} width={40} tickFormatter={(v: number) => num(v)} />
                  <Tooltip formatter={(v: any) => [`${num(Number(v))} kW`, t("Power", "Công suất")]} />
                  <Area type="monotone" dataKey="kw" stroke="#004B91" fill="#4A81C9" fillOpacity={0.3} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-line rounded-card">
            <button type="button" onClick={() => setShowMeters((v) => !v)} className="w-full flex items-center justify-between px-3 py-2 font-medium text-slate-800 cursor-pointer">
              <span>{t(`Closed meters & logs (${meters.length})`, `Đồng hồ & sổ đã chốt (${meters.length})`)}</span>
              {showMeters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showMeters && (
              <ul className="px-3 pb-2 space-y-1">
                {meters.map((m) => (
                  <li key={m.id + m.source} className="flex items-center justify-between gap-2">
                    <span className="font-code text-xs">{m.id}</span>
                    <span className="tabular-nums">
                      {num(m.qty)} {m.unit}
                    </span>
                    <LevelBadge level={m.level} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-line rounded-card">
            <button type="button" onClick={() => setShowFormula((v) => !v)} className="w-full flex items-center justify-between px-3 py-2 font-medium text-slate-800 cursor-pointer">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-brand" />
                {t("Show how it was allocated", "Xem cách phân bổ")}
              </span>
              {showFormula ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showFormula && (
              <div className="px-3 pb-3 space-y-1.5 text-xs">
                {r.lines.map((l) => (
                  <div key={l.source}>
                    <b>{t(SOURCE_META[l.source].name.en, SOURCE_META[l.source].name.vn)}:</b>{" "}
                    {l.weight !== null && l.pool !== null ? (
                      <>
                        {l.source === "STS" && "E_F01 × Q·w·(1−η)/Σ"}
                        {l.source === "RTG" && "E_F02 × Q/ΣQ"}
                        {l.source === "REEFER" && "E_F03 × N·H·[1+α(T_amb−T_set)]/Σ"}
                        {l.source === "TRACTOR" && "F_trac × Q·d/Σ"} = {num(l.pool)} {l.unit} × {num(l.weight, 4)} = {num(l.quantity)} {l.unit}
                        {l.source === "STS" && ` (Q=${num(r.teu)}, w=${num(r.liftFactor, 2)}, η=${num(r.regenRatio, 2)})`}
                        {l.source === "REEFER" && ` (N=${r.reefers}, H=${num(ENERGY_BALANCE.reeferDwellHours, 1)} h)`}
                      </>
                    ) : (
                      <>{t("direct reading", "số đọc trực tiếp")} = {num(l.quantity)} {l.unit}</>
                    )}{" "}
                    → × {num(l.effectiveFactor, 4)} = <b>{num(l.kg)} kg</b>
                  </div>
                ))}
                <div className="text-muted">
                  {t(
                    `Electricity factor = 0.6592 × grid share ${num(ENERGY_BALANCE.gridShare * 100, 1)}% (PV-supplied energy carries no emissions).`,
                    `Hệ số điện = 0,6592 × tỷ lệ điện lưới ${num(ENERGY_BALANCE.gridShare * 100, 1)}% (phần do PV cấp không phát thải).`
                  )}
                </div>
              </div>
            )}
          </div>

          {r.opsKw > 0 && (
            <div className="rounded-card border border-violet-200 bg-violet-50 p-3 space-y-0.5">
              <div className="font-medium text-violet-900 flex items-center gap-1.5">
                <Leaf className="w-4 h-4" />
                {t("Influence (carrier Scope 3)", "Ảnh hưởng (Scope 3 của hãng tàu)")}
              </div>
              <div className="text-violet-900">
                {t(
                  `Shore power avoided ≈ ${num(r.avoidedAuxKg)} kgCO₂e from auxiliary engines (${num(AUX_ENGINE_KG_PER_KWH, 3)} kg/kWh).`,
                  `Điện bờ giúp tránh ≈ ${num(r.avoidedAuxKg)} kgCO₂e từ máy phụ của tàu (${num(AUX_ENGINE_KG_PER_KWH, 3)} kg/kWh).`
                )}
              </div>
              <div className="text-xs text-violet-700">
                {t("Influence boundary – not added to the port inventory.", "Thuộc phạm vi ảnh hưởng, không cộng vào kiểm kê của cảng.")}
              </div>
            </div>
          )}

          <div className="text-xs text-muted">
            {t(
              `Port average ${num(LEDGER_TOTALS.intensity, 2)} kgCO₂e/TEU · this call ${pct(((r.intensity - LEDGER_TOTALS.intensity) / LEDGER_TOTALS.intensity) * 100)} vs average`,
              `Bình quân cảng ${num(LEDGER_TOTALS.intensity, 2)} kgCO₂e/TEU · lượt tàu này ${pct(((r.intensity - LEDGER_TOTALS.intensity) / LEDGER_TOTALS.intensity) * 100)} so với bình quân`
            )}
          </div>
          <div className="flex items-start gap-2 text-xs text-muted">
            <span className="break-all">
              SHA-256: <span className="font-code text-ink">{r.hash}</span>
            </span>
            <IconButton
              icon={Copy}
              label={t("Copy hash", "Sao chép mã hash")}
              className="w-7 h-7 shrink-0"
              onClick={() => {
                navigator.clipboard?.writeText(r.hash).then(
                  () => toast(t("Hash copied", "Đã sao chép mã hash")),
                  () => toast(t("Could not copy", "Không sao chép được"), "warning")
                );
              }}
            />
          </div>
        </div>
    </DetailDrawer>
  );
};
