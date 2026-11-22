import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Sankey, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { FEEDERS, minuteLabel } from "../../data/module1Forecast";
import {
  BALANCE_STATS,
  CALL_RECORDS,
  CallRecord,
  DELTA_BAL_PCT,
  DISCREPANCIES,
  ENERGY_BALANCE,
  FUEL_RECON,
  FUEL_THRESHOLD_PCT,
  QUALITY_DAY,
  QUALITY_GRID,
  QUALITY_VALID_PCT,
  QualityFlag,
} from "../../data/module2Carbon";
import { Panel } from "./OverviewTab";

const Q_COLOR: Record<QualityFlag, string> = { VALID: "#D1FAE5", INTERPOLATED: "#BFDBFE", MISSING: "#FECACA", ANOMALY: "#F97316" };

/** Semi-circular gauge for Δbal. */
const Gauge: React.FC<{ value: number; max: number; threshold: number; label: string }> = ({ value, max, threshold, label }) => {
  const angle = (v: number) => Math.PI * (1 - Math.min(v, max) / max);
  const pt = (v: number, r: number) => [100 + r * Math.cos(angle(v)), 100 - r * Math.sin(angle(v))];
  const arc = (from: number, to: number, color: string) => {
    const [x1, y1] = pt(from, 80);
    const [x2, y2] = pt(to, 80);
    return <path d={`M ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2}`} stroke={color} strokeWidth={16} fill="none" />;
  };
  const [nx, ny] = pt(value, 66);
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[240px]">
      {arc(0, threshold, "#10B981")}
      {arc(threshold, max, "#FCA5A5")}
      <line x1={100} y1={100} x2={nx} y2={ny} stroke="#0F172A" strokeWidth={3} strokeLinecap="round" />
      <circle cx={100} cy={100} r={5} fill="#0F172A" />
      <text x={100} y={92} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0F172A">
        {label}
      </text>
      <text x={18} y={116} fontSize={12} fill="#64748B">0</text>
      <text x={182} y={116} fontSize={12} fill="#64748B" textAnchor="end">{max}%</text>
    </svg>
  );
};

interface BalanceTabProps {
  calls: CallRecord[];
  onOpenCall: (r: CallRecord) => void;
}

/** B2 – energy balance, Sankey, data quality and fuel reconciliation. */
export const BalanceTab: React.FC<BalanceTabProps> = ({ calls, onOpenCall }) => {
  const { t } = useLanguage();
  const { num, pct } = useFormat();
  const [cell, setCell] = useState<{ f: number; i: number } | null>(null);

  const sankey = useMemo(() => {
    const visible = new Set(calls.map((c) => c.id));
    const nodes: { name: string; callId?: string }[] = [];
    const idx = (name: string, callId?: string) => {
      let i = nodes.findIndex((n) => n.name === name);
      if (i < 0) {
        nodes.push({ name, callId });
        i = nodes.length - 1;
      }
      return i;
    };
    const links: { source: number; target: number; value: number }[] = [];
    const add = (a: number, b: number, v: number) => v > 1 && links.push({ source: a, target: b, value: Math.round(v / 1000) || 1 });
    const fb = ENERGY_BALANCE.feeders;
    const grid = idx(t("Grid", "Lưới điện"));
    const pv = idx("PV");
    const pcc = idx("PCC 22 kV");
    add(grid, pcc, ENERGY_BALANCE.eGridExpected);
    add(pv, pcc, ENERGY_BALANCE.ePv);
    add(pcc, idx(t("Transformer losses", "Tổn thất MBA")), ENERGY_BALANCE.eLoss);
    const unalloc = t("Unallocated", "Không phân bổ");
    const others = t("Other calls", "Lượt tàu khác");
    const callNode = (r: CallRecord) => (visible.has(r.id) ? idx(r.vessel, r.id) : idx(others));
    FEEDERS.forEach((f) => {
      const total = fb[f.key].allocated + fb[f.key].unallocated;
      const fn = idx(`${f.id}`);
      add(pcc, fn, total);
      if (f.key === "f01") {
        (["B1", "B2", "B3"] as const).forEach((b) => {
          const eq = idx(`STS ${b}`);
          const kwh = CALL_RECORDS.filter((r) => r.berth === b).reduce((a, r) => a + (r.lines.find((l) => l.source === "STS")?.quantity ?? 0), 0);
          add(fn, eq, kwh);
          CALL_RECORDS.filter((r) => r.berth === b).forEach((r) => add(eq, callNode(r), r.lines.find((l) => l.source === "STS")?.quantity ?? 0));
        });
        add(fn, idx(unalloc), fb.f01.unallocated);
      } else {
        const eqName = { f02: "e-RTG", f03: "Reefer", f04: "OPS", f05: t("EV charging", "Trạm sạc"), f06: t("Auxiliary", "Phụ trợ") }[f.key as "f02"];
        const eq = idx(eqName);
        add(fn, eq, total);
        const src = { f02: "RTG", f03: "REEFER", f04: "OPS" }[f.key as "f02"] as "RTG" | undefined;
        if (src) CALL_RECORDS.forEach((r) => add(eq, callNode(r), r.lines.find((l) => l.source === src)?.quantity ?? 0));
        add(eq, idx(unalloc), fb[f.key].unallocated);
      }
    });
    return { nodes, links };
  }, [calls, t]);

  const SankeyNode: React.FC<any> = ({ x, y, width, height, payload }) => {
    const isCall = !!payload.callId;
    const right = x > 500;
    return (
      <g
        style={{ cursor: isCall ? "pointer" : "default" }}
        onClick={() => {
          const r = CALL_RECORDS.find((c) => c.id === payload.callId);
          if (r) onOpenCall(r);
        }}
      >
        <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={isCall ? "#004B91" : "#4A81C9"} fillOpacity={0.9} />
        <text x={right ? x - 4 : x + width + 4} y={y + height / 2} dy={3} textAnchor={right ? "end" : "start"} fontSize={12} fill="#0F172A" fontWeight={isCall ? 700 : 500}>
          {payload.name} · {num(payload.value)} MWh
        </text>
      </g>
    );
  };

  const fuelSteps = (() => {
    const s: { name: string; base: number; value: number; color: string; delta: number }[] = [];
    let lvl = 0;
    const push = (name: string, delta: number, color: string, total = false) => {
      const next = total ? delta : lvl + delta;
      s.push({ name, base: total ? 0 : Math.min(lvl, next), value: total ? delta : Math.abs(delta), color, delta });
      lvl = next;
    };
    push(t("Opening stock", "Tồn đầu"), FUEL_RECON.opening, "#94A3B8", true);
    push(t("Receipts", "Nhập"), FUEL_RECON.receipts, "#4A81C9");
    push(t("Closing stock", "Tồn cuối"), -FUEL_RECON.closing, "#F59E0B");
    push(t("Adjustment", "Hiệu chỉnh"), FUEL_RECON.adjustment, "#A78BFA");
    s.push({ name: "F_tot", base: 0, value: FUEL_RECON.totL, color: "#004B91", delta: FUEL_RECON.totL });
    s.push({ name: t("ΣF_k (activity)", "ΣF_k (hoạt động)"), base: 0, value: FUEL_RECON.activityL, color: "#10B981", delta: FUEL_RECON.activityL });
    return s;
  })();
  const fuelOk = Math.abs(FUEL_RECON.diffPct) <= FUEL_THRESHOLD_PCT;

  const flagLabel = (q: QualityFlag) =>
    q === "VALID" ? t("Valid", "Hợp lệ") : q === "INTERPOLATED" ? t("Interpolated", "Nội suy") : q === "MISSING" ? t("Missing", "Thiếu") : t("Anomaly", "Bất thường");

  return (
    <div className="space-y-4">
      <Panel
        title={t("Energy flow: grid + PV → PCC → 6 feeders → equipment → vessel calls", "Dòng năng lượng: Lưới + PV → PCC → 6 lộ → thiết bị → lượt tàu")}
        note={t("Dataset v2, MWh · click a vessel to open its record", "Dataset v2, MWh · bấm vào tàu để mở hồ sơ")}
      >
        <div className="overflow-x-auto">
          <div className="h-[560px] min-w-[860px]">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey data={sankey} node={<SankeyNode />} nodePadding={10} nodeWidth={10} margin={{ top: 8, right: 170, left: 10, bottom: 8 }} link={{ stroke: "#94A3B8", strokeOpacity: 0.35 }}>
                <Tooltip formatter={(v: any) => [`${num(Number(v))} MWh`, ""]} />
              </Sankey>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
        <Panel title={t("Reconciliation error Δbal", "Sai số đối soát Δbal")} note={t(`Limit ${BALANCE_STATS.thresholdPct}%`, `Ngưỡng ${BALANCE_STATS.thresholdPct}%`)}>
          <div className="flex flex-col items-center gap-2">
            <Gauge value={DELTA_BAL_PCT} max={2} threshold={BALANCE_STATS.thresholdPct} label={pct(DELTA_BAL_PCT, 2)} />
            <div className="text-xs text-center">
              <span className="font-medium text-danger">{pct(BALANCE_STATS.rawDeltaBalPct, 2)}</span> {t("raw data", "dữ liệu thô")} →{" "}
              <span className="font-medium text-success">{pct(DELTA_BAL_PCT, 2)}</span> {t("after cleaning", "sau làm sạch")}
            </div>
            <div className="text-xs text-muted text-center">Δbal = |E_grid − (Σ6 − E_PV + E_loss)| / E_grid</div>
          </div>
        </Panel>
        <Panel
          title={t(`Data quality · 6 feeders × 96 intervals (${QUALITY_DAY})`, `Chất lượng dữ liệu · 6 lộ × 96 chu kỳ (${QUALITY_DAY})`)}
          note={t(`${pct(QUALITY_VALID_PCT, 2)} valid (incl. interpolated) · click a cell`, `${pct(QUALITY_VALID_PCT, 2)} hợp lệ (gồm nội suy) · bấm vào ô`)}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[640px] space-y-[2px]">
              {QUALITY_GRID.map((row, f) => (
                <div key={f} className="flex items-center gap-2 h-4">
                  <span className="w-10 text-xs font-medium text-slate-600">{FEEDERS[f].id}</span>
                  <div className="flex-1 grid h-full" style={{ gridTemplateColumns: "repeat(96, minmax(0, 1fr))" }}>
                    {row.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCell({ f, i })}
                        title={`${FEEDERS[f].id} ${minuteLabel(i * 15)} · ${flagLabel(q)}`}
                        className={`h-full border-r border-white/60 cursor-pointer ${cell && cell.f === f && cell.i === i ? "outline outline-2 outline-slate-900" : ""}`}
                        style={{ backgroundColor: Q_COLOR[q] }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
            {(Object.keys(Q_COLOR) as QualityFlag[]).map((q) => (
              <span key={q} className="inline-flex items-center gap-1">
                <span className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: Q_COLOR[q] }} />
                {flagLabel(q)}
              </span>
            ))}
          </div>
          {cell && (
            <div className="text-xs bg-slate-50 border border-line rounded-control px-3 py-2">
              <b>
                {FEEDERS[cell.f].id} · {minuteLabel(cell.i * 15)}–{minuteLabel(cell.i * 15 + 15)}
              </b>{" "}
              · {flagLabel(QUALITY_GRID[cell.f][cell.i])}
              {QUALITY_GRID[cell.f][cell.i] !== "VALID" &&
                (() => {
                  const dsc = DISCREPANCIES.find((d) => d.meter.startsWith(FEEDERS[cell.f].id));
                  return dsc ? ` · ${t(dsc.action.en, dsc.action.vn)}` : ` · ${t("Gap filled from neighbouring intervals", "Bù khoảng trống từ chu kỳ lân cận")}`;
                })()}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel
          title={t("Fuel reconciliation", "Đối soát nhiên liệu")}
          note={t("Opening + receipts − closing ± adjustment = F_tot vs ΣF_k", "Tồn đầu + Nhập − Tồn cuối ± Hiệu chỉnh = F_tot so với ΣF_k")}
          right={
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${fuelOk ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {fuelOk ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />} {t("Difference", "Chênh lệch")} {pct(FUEL_RECON.diffPct)} ({t("limit", "ngưỡng")} {FUEL_THRESHOLD_PCT}%)
            </span>
          }
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelSteps} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF0F3" />
                <XAxis dataKey="name" fontSize={12} stroke="#94A3B8" tickLine={false} interval={0} />
                <YAxis fontSize={12} stroke="#94A3B8" tickLine={false} width={48} tickFormatter={(v: number) => num(v)} label={{ value: "L", position: "top", offset: 8, fontSize: 12 }} />
                <Tooltip formatter={(v: any, k: any, p: any) => (k === "base" ? null : [`${num(p.payload.delta)} L`, p.payload.name])} />
                <Bar dataKey="base" stackId="w" fill="transparent" />
                <Bar dataKey="value" stackId="w" radius={[3, 3, 0, 0]}>
                  {fuelSteps.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                  <LabelList dataKey="delta" position="top" formatter={(v: any) => num(Number(v))} style={{ fontSize: 12, fontWeight: 700, fill: "#0F172A" }} />
                </Bar>
                <ReferenceLine y={0} stroke="#0F172A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("Discrepancies to review", "Chênh lệch cần kiểm tra")}>
          <div className="overflow-x-auto border border-line rounded-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="py-2 px-3">{t("When", "Thời điểm")}</th>
                  <th className="py-2 px-3">{t("Meter", "Công tơ")}</th>
                  <th className="py-2 px-3">{t("Deviation", "Mức lệch")}</th>
                  <th className="py-2 px-3">{t("Status", "Trạng thái")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DISCREPANCIES.map((d) => (
                  <tr key={d.when + d.meter}>
                    <td className="py-2 px-3 whitespace-nowrap">{d.when}</td>
                    <td className="py-2 px-3">{d.meter}</td>
                    <td className="py-2 px-3">
                      {t(d.deviation.en, d.deviation.vn)}
                      <div className="text-xs text-muted">{t(d.action.en, d.action.vn)}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${d.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                        {d.status === "RESOLVED" ? t("Resolved", "Đã xử lý") : t("Investigating", "Đang kiểm tra")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
};
