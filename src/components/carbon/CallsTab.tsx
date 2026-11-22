import React, { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from "lucide-react";
import { CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { CallRecord, LEDGER_TOTALS, RecordStatus, stamp } from "../../data/module2Carbon";
import { IntensityBar, MeasuredBar, RecordStatusBadge } from "./CarbonShared";
import { Panel } from "./OverviewTab";

type SortKey = "vessel" | "carrier" | "berth" | "hours" | "teu" | "kwh" | "fuel" | "total" | "intensity" | "measured" | "status";
const STATUS_RANK: Record<RecordStatus, number> = { DRAFT: 0, RECONCILED: 1, LOCKED: 2, SHARED: 3 };

export const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
    <Inbox className="w-8 h-8" />
    <div className="text-xs font-semibold">{text}</div>
  </div>
);

/** B3 – sortable 12-call table and TEU × intensity scatter. */
export const CallsTab: React.FC<{ calls: CallRecord[]; onOpenCall: (r: CallRecord) => void }> = ({ calls, onOpenCall }) => {
  const { t } = useLanguage();
  const { num } = useFormat();
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "intensity", dir: -1 });

  const val = (r: CallRecord, k: SortKey): number | string => {
    switch (k) {
      case "vessel": return r.vessel;
      case "carrier": return r.carrier;
      case "berth": return r.berth;
      case "hours": return r.berthHours;
      case "teu": return r.teu;
      case "kwh": return r.electricityKwh;
      case "fuel": return r.fuelL;
      case "total": return r.totalKg;
      case "intensity": return r.intensity;
      case "measured": return r.measuredPct;
      case "status": return STATUS_RANK[r.status];
    }
  };
  const rows = [...calls].sort((a, b) => {
    const x = val(a, sort.k);
    const y = val(b, sort.k);
    return (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number)) * sort.dir;
  });

  const Th: React.FC<{ k: SortKey; label: string; right?: boolean }> = ({ k, label, right }) => (
    <th className={`py-2 px-2.5 ${right ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : -1 }))}
        className={`inline-flex items-center gap-1 font-bold cursor-pointer hover:text-[#004B91] ${sort.k === k ? "text-[#004B91]" : ""}`}
      >
        {label}
        {sort.k === k ? sort.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </button>
    </th>
  );

  const ops = calls.filter((r) => r.opsKw > 0).map((r) => ({ x: r.teu, y: r.intensity, z: r.totalKg, r }));
  const noOps = calls.filter((r) => r.opsKw === 0).map((r) => ({ x: r.teu, y: r.intensity, z: r.totalKg, r }));

  if (calls.length === 0) return <EmptyState text={t("No vessel calls match the filter.", "Không có lượt tàu nào khớp bộ lọc.")} />;

  return (
    <div className="space-y-4">
      <Panel title={t("Vessel calls", "Lượt tàu")} note={t("Click a row for the call drawer", "Bấm vào dòng để mở chi tiết lượt tàu")}>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <Th k="vessel" label={t("Vessel", "Tàu")} />
                <Th k="carrier" label={t("Carrier", "Hãng")} />
                <Th k="berth" label={t("Berth", "Cầu")} />
                <Th k="hours" label={t("At berth (h)", "Nằm bến (h)")} right />
                <Th k="teu" label="TEU" right />
                <Th k="kwh" label="kWh" right />
                <Th k="fuel" label={t("Diesel (L)", "Dầu (L)")} right />
                <Th k="total" label="tCO₂e" right />
                <Th k="intensity" label="kgCO₂e/TEU" />
                <Th k="measured" label={t("Measured", "Đo trực tiếp")} />
                <Th k="status" label={t("Status", "Trạng thái")} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} onClick={() => onOpenCall(r)} className="cursor-pointer hover:bg-slate-50">
                  <td className="py-2 px-2.5">
                    <div className="font-bold text-slate-900">{r.vessel}</div>
                    <div className="text-[10px] text-slate-400">{stamp(r.etaMin)}</div>
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 max-w-[160px]">{r.carrier}</td>
                  <td className="py-2 px-2.5">{r.berth}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums">{num(r.berthHours, 1)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums">{num(r.teu)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums">{num(r.electricityKwh)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums">{num(r.fuelL)}</td>
                  <td className="py-2 px-2.5 text-right tabular-nums font-bold">{num(r.totalKg / 1000, 2)}</td>
                  <td className="py-2 px-2.5">
                    <IntensityBar value={r.intensity} avg={LEDGER_TOTALS.intensity} label={num(r.intensity, 1)} />
                  </td>
                  <td className="py-2 px-2.5">
                    <MeasuredBar pct={r.measuredPct} />
                  </td>
                  <td className="py-2 px-2.5">
                    <RecordStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title={t("Throughput × intensity", "Sản lượng (TEU) × cường độ (kgCO₂e/TEU)")}
        note={t(`Port average ${num(LEDGER_TOTALS.intensity, 2)} · bubble size = tCO₂e · click a dot`, `Bình quân cảng ${num(LEDGER_TOTALS.intensity, 2)} · kích thước = tCO₂e · bấm vào chấm`)}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" dataKey="x" name="TEU" fontSize={10} stroke="#64748B" tickFormatter={(v: number) => num(v)} label={{ value: "TEU", position: "insideBottomRight", offset: -2, fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="kgCO₂e/TEU" fontSize={10} stroke="#64748B" width={40} domain={[10, 22]} />
              <ZAxis type="number" dataKey="z" range={[60, 360]} />
              <ReferenceLine y={LEDGER_TOTALS.intensity} stroke="#0F172A" strokeDasharray="4 3" label={{ value: num(LEDGER_TOTALS.intensity, 2), position: "right", fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }: any) =>
                  active && payload?.length ? (
                    <div className="bg-white border border-slate-300 rounded-lg shadow px-2.5 py-1.5 text-[11px] text-slate-900">
                      <b>{payload[0].payload.r.vessel}</b> · {num(payload[0].payload.x)} TEU · {num(payload[0].payload.y, 2)} kg/TEU
                    </div>
                  ) : null
                }
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Scatter name={t("Uses OPS", "Có dùng OPS")} data={ops} fill="#7C3AED" onClick={(p: any) => onOpenCall(p.r ?? p.payload?.r)} cursor="pointer">
                {ops.map((p) => (
                  <Cell key={p.r.id} fill="#7C3AED" />
                ))}
              </Scatter>
              <Scatter name={t("No OPS", "Không dùng OPS")} data={noOps} fill="#F59E0B" onClick={(p: any) => onOpenCall(p.r ?? p.payload?.r)} cursor="pointer">
                {noOps.map((p) => (
                  <Cell key={p.r.id} fill="#F59E0B" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
};
