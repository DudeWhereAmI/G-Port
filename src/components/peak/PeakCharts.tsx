import React from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { formatKShort, useFormat, useMoneyFormat } from "../../utils/format";
import { INTERVAL_MINUTES, SUBSTATION_LIMIT_KW, TouBand, minuteLabel } from "../../data/module1Forecast";
import { AdjustKey, CostBreakdown, DispatchInterval, DispatchResult } from "../../data/module3PeakShaving";
import { TOU_BG } from "../forecast/ForecastDemandChart";
import { SERIES } from "../../theme/tokens";

export const M3_COLORS = {
  before: SERIES.before,
  after: SERIES.after,
  reduced: SERIES.reduced,
  shifted: SERIES.shifted,
  target: SERIES.target,
  limit: SERIES.limit,
  pv: SERIES.pv,
  grid: SERIES.forecast,
  bess: SERIES.bess,
};

export const ADJUST_COLORS: Record<AdjustKey, string> = {
  ITV: SERIES.f05,
  SWAP: "#86CBA8",
  REEFER: SERIES.f03,
  RTG: SERIES.f02,
  HVAC: SERIES.f06,
  BESS: SERIES.bess,
};

export function useAdjustLabels() {
  const { t } = useLanguage();
  return {
    ITV: t("e-ITV charging", "Sạc e-ITV"),
    SWAP: t("Battery swap", "Đổi pin"),
    REEFER: t("Reefer pre-cool", "Reefer làm lạnh trước"),
    RTG: t("e-RTG eco-idle", "e-RTG chờ tiết kiệm"),
    HVAC: t("Lighting / HVAC", "Chiếu sáng / HVAC"),
    BESS: t("BESS discharge", "Xả BESS"),
  } as Record<AdjustKey, string>;
}

const shape = (fill: string, opacity: number) => (props: any) => (
  <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={fill} fillOpacity={opacity} />
);

const X_TICKS = Array.from({ length: 13 }, (_, i) => i * 120);

function touRuns(intervals: { minute: number; tou: TouBand }[]) {
  const runs: { band: TouBand; from: number; to: number }[] = [];
  for (const p of intervals) {
    const last = runs[runs.length - 1];
    if (last && last.band === p.tou) last.to = p.minute + INTERVAL_MINUTES;
    else runs.push({ band: p.tou, from: p.minute, to: p.minute + INTERVAL_MINUTES });
  }
  return runs;
}

const Box: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border border-slate-300 rounded-card shadow-lg px-3 py-2 text-xs text-ink space-y-0.5 min-w-[200px]">{children}</div>
);
const Row: React.FC<{ c: string; l: string; v: string; b?: boolean }> = ({ c, l, v, b }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="flex items-center gap-1.5 text-slate-700">
      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
      {l}
    </span>
    <span className={`tabular-nums ${b ? "font-medium" : "font-semibold"}`}>{v}</span>
  </div>
);

// ---------------------------------------------------------------------------
// B1 – before / after story chart
// ---------------------------------------------------------------------------

export const BeforeAfterChart: React.FC<{ result: DispatchResult; basis: "GRID" | "LOAD"; showTou: boolean }> = ({ result, basis, showTou }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const labels = useAdjustLabels();
  const data = result.intervals.map((x) => {
    const b = basis === "GRID" ? x.before : x.loadBefore;
    const a = basis === "GRID" ? x.after : x.loadAfter;
    return { ...x, b, a, cut: a < b ? [a, b] : [b, b], moved: a > b ? [b, a] : [b, b] };
  });
  const pb = result.peakBefore;
  const pa = result.peakAfter;
  const target = result.settings.peakTargetKw;
  const itvShift = result.groupStats.ITV.maxReduceKw;

  const TooltipBody: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const x: DispatchInterval & { b: number; a: number } = payload[0].payload;
    const adj = (Object.keys(x.adjust) as AdjustKey[]).filter((k) => x.adjust[k] !== 0);
    return (
      <Box>
        <div className="font-medium mb-1">
          {x.label} – {minuteLabel(x.minute + INTERVAL_MINUTES)}
        </div>
        <Row c={M3_COLORS.before} l={t("Before (M-1 forecast)", "Trước (dự báo M-1)")} v={kw(x.b)} />
        <Row c={M3_COLORS.after} l={t("After dispatch", "Sau điều độ")} v={kw(x.a)} b />
        {adj.map((k) => (
          <Row key={k} c={ADJUST_COLORS[k]} l={labels[k]} v={`${x.adjust[k] > 0 ? "+" : "−"}${kw(Math.abs(x.adjust[k]))}`} />
        ))}
      </Box>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          {showTou &&
            touRuns(result.intervals)
              .filter((r) => TOU_BG[r.band])
              .map((r) => (
                <React.Fragment key={`tou-${r.from}`}>
                  <ReferenceArea x1={r.from} x2={r.to} ifOverflow="hidden" shape={shape(TOU_BG[r.band] as string, 0.7)} />
                </React.Fragment>
              ))}
          {itvShift > 0 && (
            <ReferenceArea
              x1={0}
              x2={300}
              ifOverflow="hidden"
              shape={shape("#DBEAFE", 0.0)}
              label={{
                value: t(`Shifted ${num(itvShift)} kW of EV charging to off-peak`, `Dời ${num(itvShift)} kW sạc xe sang giờ thấp điểm`),
                position: "insideTop",
                fill: "#1D4ED8",
                fontSize: 12,
                fontWeight: 700,
              }}
            />
          )}
          <CartesianGrid vertical={false} stroke="#EEF0F3" />
          <XAxis dataKey="minute" type="number" domain={[0, 1440]} ticks={X_TICKS} tickFormatter={(m: number) => minuteLabel(m)} stroke="#94A3B8" fontSize={12} tickLine={false} />
          <YAxis
            domain={[0, 10000]}
            ticks={[0, 2000, 4000, 6000, 8000, 10000]}
            tickFormatter={(v: number) => formatKShort(v)}
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            width={48}
            label={{ value: "kW", position: "top", offset: 12, fontSize: 12, fill: "#475569", fontWeight: 700 }}
          />
          <Tooltip content={<TooltipBody />} />
          <Area type="monotone" dataKey="cut" fill={M3_COLORS.reduced} fillOpacity={0.45} stroke="none" activeDot={false} isAnimationActive animationDuration={400} />
          <Area type="monotone" dataKey="moved" fill={M3_COLORS.shifted} fillOpacity={0.4} stroke="none" activeDot={false} isAnimationActive animationDuration={400} />
          <Line type="monotone" dataKey="b" stroke={M3_COLORS.before} strokeWidth={1.75} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="a" stroke={M3_COLORS.after} strokeWidth={2.75} dot={false} isAnimationActive animationDuration={400} />
          <ReferenceLine
            y={SUBSTATION_LIMIT_KW}
            stroke={M3_COLORS.limit}
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: t(`Substation limit ${num(SUBSTATION_LIMIT_KW)} kW`, `Giới hạn trạm ${num(SUBSTATION_LIMIT_KW)} kW`), position: "insideTopRight", fill: "#B45309", fontSize: 12, fontWeight: 700 }}
          />
          {basis === "GRID" && (
            <ReferenceLine
              y={target}
              stroke={M3_COLORS.target}
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{ value: t(`Peak target ${num(target)} kW`, `Mục tiêu đỉnh (peak target) ${num(target)} kW`), position: "insideBottomLeft", fill: "#047857", fontSize: 12, fontWeight: 700 }}
            />
          )}
          {basis === "GRID" && (
            <>
              <ReferenceLine
                segment={[
                  { x: pb.minute, y: pb.kw },
                  { x: pb.minute, y: pb.kw - result.reductionKw },
                ]}
                stroke="#0F172A"
                strokeWidth={1.5}
                label={{
                  value: `−${num(result.reductionKw)} kW (−${pct(result.reductionPct)})`,
                  position: "left",
                  fill: "#0F172A",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              />
              <ReferenceDot x={pb.minute} y={pb.kw} r={5} fill="#fff" stroke={M3_COLORS.before} strokeWidth={2} />
              <ReferenceDot x={pa.minute} y={pa.kw} r={5} fill={M3_COLORS.after} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// B3 – waterfall: forecast peak → contributions → peak after dispatch
// ---------------------------------------------------------------------------

export const WaterfallChart: React.FC<{ result: DispatchResult }> = ({ result }) => {
  const { t } = useLanguage();
  const { num, kw } = useFormat();
  const labels = useAdjustLabels();
  type Step = { name: string; base: number; value: number; total?: boolean; color: string; delta: number };
  const steps: Step[] = [];
  let level = result.peakBefore.kw;
  steps.push({ name: t(`Forecast peak (M-1) ${result.peakBefore.label}`, `Đỉnh dự báo (M-1) ${result.peakBefore.label}`), base: 0, value: level, total: true, color: M3_COLORS.before, delta: level });
  for (const w of result.waterfall) {
    const next = level + w.kw;
    steps.push({ name: labels[w.key], base: Math.min(level, next), value: Math.abs(w.kw), color: w.kw < 0 ? ADJUST_COLORS[w.key] : M3_COLORS.shifted, delta: w.kw });
    level = next;
  }
  if (result.peakShiftKw !== 0) {
    const next = level + result.peakShiftKw;
    steps.push({
      name: t(`Peak moves to ${result.peakAfter.label}`, `Đỉnh mới lúc ${result.peakAfter.label}`),
      base: Math.min(level, next),
      value: Math.abs(result.peakShiftKw),
      color: "#F59E0B",
      delta: result.peakShiftKw,
    });
    level = next;
  }
  steps.push({ name: t("Peak after dispatch", "Đỉnh sau điều độ"), base: 0, value: result.peakAfter.kw, total: true, color: M3_COLORS.after, delta: result.peakAfter.kw });
  const lo = Math.floor((result.peakAfter.kw - 400) / 500) * 500;
  const hi = Math.ceil((result.peakBefore.kw + 150) / 250) * 250;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={steps} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#EEF0F3" />
          <XAxis dataKey="name" fontSize={12} stroke="#94A3B8" tickLine={false} interval={0} height={44} tick={{ width: 80 } as any} />
          <YAxis domain={[lo, hi]} allowDataOverflow fontSize={12} stroke="#94A3B8" tickLine={false} width={48} tickFormatter={(v: number) => num(v)} label={{ value: "kW", position: "top", offset: 10, fontSize: 12, fill: "#475569", fontWeight: 700 }} />
          <ReferenceLine y={SUBSTATION_LIMIT_KW} stroke={M3_COLORS.limit} strokeDasharray="6 4" />
          <Tooltip
            cursor={{ fill: "#F1F5F9" }}
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <Box>
                  <div className="font-medium">{payload[0].payload.name}</div>
                  <div className="tabular-nums">{payload[0].payload.total ? kw(payload[0].payload.delta) : `${payload[0].payload.delta > 0 ? "+" : "−"}${kw(Math.abs(payload[0].payload.delta))}`}</div>
                </Box>
              ) : null
            }
          />
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="w" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={400}>
            {steps.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
            <LabelList
              dataKey="delta"
              position="top"
              formatter={(v: any) => {
                const n = Number(v);
                return n > 1000 ? num(n) : `${n > 0 ? "+" : "−"}${num(Math.abs(n))}`;
              }}
              style={{ fontSize: 12, fontWeight: 700, fill: "#0F172A" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// B2 – power balance after dispatch: sources (+) vs loads (−)
// ---------------------------------------------------------------------------

export const PowerBalanceChart: React.FC<{ result: DispatchResult }> = ({ result }) => {
  const { t } = useLanguage();
  const { kw } = useFormat();
  const bess = result.settings.bessEnabled;
  const data = result.intervals.map((x) => ({
    minute: x.minute,
    label: x.label,
    grid: x.after,
    pv: x.pv,
    bessOut: Math.max(0, -x.adjust.BESS),
    stsRtg: -x.balance.stsRtg,
    reefer: -x.balance.reefer,
    ev: -x.balance.ev,
    lighting: -x.balance.lighting,
    base: -x.balance.base,
    ops: -x.balance.ops,
    bessIn: -Math.max(0, x.adjust.BESS),
  }));
  const series: { key: string; name: string; color: string; side: "src" | "load" }[] = [
    { key: "grid", name: t("Grid", "Lưới"), color: M3_COLORS.grid, side: "src" },
    { key: "pv", name: t("PV self-use", "PV tự dùng"), color: M3_COLORS.pv, side: "src" },
    ...(bess ? [{ key: "bessOut", name: t("BESS discharge", "BESS xả"), color: M3_COLORS.bess, side: "src" as const }] : []),
    { key: "stsRtg", name: t("STS + e-RTG (P90, locked)", "Cẩu STS + RTG (P90, khóa)"), color: SERIES.f01, side: "load" },
    { key: "reefer", name: "Reefer", color: SERIES.f03, side: "load" },
    { key: "ev", name: t("EV charging", "Sạc xe điện"), color: SERIES.f05, side: "load" },
    { key: "lighting", name: t("Lighting", "Chiếu sáng"), color: "#CBD5E1", side: "load" },
    { key: "base", name: t("Base load (incl. losses)", "Phụ tải nền (gồm tổn thất)"), color: SERIES.f06, side: "load" },
    { key: "ops", name: "OPS", color: SERIES.f04, side: "load" },
    ...(bess ? [{ key: "bessIn", name: t("BESS charge", "BESS sạc"), color: "#C4B5FD", side: "load" as const }] : []),
  ];
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} stackOffset="sign" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#EEF0F3" />
          <XAxis dataKey="minute" type="number" domain={[0, 1440]} ticks={X_TICKS} tickFormatter={(m: number) => minuteLabel(m)} stroke="#94A3B8" fontSize={12} tickLine={false} />
          <YAxis domain={[-10000, 10000]} ticks={[-10000, -5000, 0, 5000, 10000]} tickFormatter={(v: number) => formatKShort(Math.abs(v))} stroke="#94A3B8" fontSize={12} tickLine={false} width={40} />
          <ReferenceLine y={0} stroke="#0F172A" />
          <Tooltip
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <Box>
                  <div className="font-medium">{payload[0].payload.label}</div>
                  {series.map((s) => (
                    <Row key={s.key} c={s.color} l={`${s.side === "src" ? "▲" : "▼"} ${s.name}`} v={kw(Math.abs(payload[0].payload[s.key]))} />
                  ))}
                </Box>
              ) : null
            }
          />
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stackId="bal" fill={s.color} stroke={s.color} fillOpacity={0.75} strokeWidth={0.5} isAnimationActive={false} />
          ))}
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// C1 – objective J before / after
// ---------------------------------------------------------------------------

export const ObjectiveChart: React.FC<{ before: CostBreakdown; after: CostBreakdown }> = ({ before, after }) => {
  const { t } = useLanguage();
  const { vnd } = useMoneyFormat();
  const rows: { key: keyof CostBreakdown; name: string }[] = [
    { key: "touEnergy", name: t("TOU energy", "Tiền điện TOU") },
    { key: "peakDemand", name: t("Peak demand c_dem·P_peak", "Phí công suất đỉnh") },
    { key: "carbon", name: t("Internal carbon λC·EF", "Chi phí carbon nội bộ") },
    { key: "pvCurtail", name: t("PV curtailment", "Phạt cắt PV") },
    { key: "bessWear", name: t("BESS wear", "Hao mòn pin") },
    { key: "modulation", name: t("Load modulation", "Phạt điều biến") },
    { key: "service", name: t("Service cost", "Chi phí dịch vụ") },
    { key: "violation", name: t("Constraint violation", "Phạt vi phạm") },
  ];
  // energy dominates; show it on its own scale via millions and a log-free split
  const data = rows.map((r) => ({ name: r.name, before: before[r.key] / 1e6, after: after[r.key] / 1e6 }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(1)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#EEF0F3" />
          <XAxis dataKey="name" fontSize={12} stroke="#94A3B8" tickLine={false} interval={0} height={40} />
          <YAxis fontSize={12} stroke="#94A3B8" tickLine={false} width={40} label={{ value: t("M VND", "triệu đ"), position: "top", offset: 8, fontSize: 12, fill: "#475569" }} />
          <Tooltip
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <Box>
                  <div className="font-medium">{payload[0].payload.name}</div>
                  <Row c={M3_COLORS.before} l={t("Before", "Trước")} v={vnd(payload[0].payload.before * 1e6)} />
                  <Row c={M3_COLORS.after} l={t("After", "Sau")} v={vnd(payload[0].payload.after * 1e6)} b />
                </Box>
              ) : null
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="before" name={t("Before", "Trước")} fill={M3_COLORS.before} radius={[3, 3, 0, 0]} />
          <Bar dataKey="after" name={t("After", "Sau")} fill={M3_COLORS.after} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
