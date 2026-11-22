import React from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Lock } from "lucide-react";
import { NEUTRAL, SERIES, STATUS } from "../../theme/tokens";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat, formatKShort } from "../../utils/format";
import {
  FEEDERS,
  ForecastPoint,
  INTERVAL_MINUTES,
  LOCK_MINUTE,
  NOW_MINUTE,
  P_PEAK_SWITCH,
  SUBSTATION_LIMIT_KW,
  TouBand,
  minuteLabel,
} from "../../data/module1Forecast";
import { TIMELINE_LEFT, TIMELINE_RIGHT, TimeDomain, timelineTicks } from "./timeline";

export type ForecastChartMode = "TOTAL" | "FEEDERS";

export const FORECAST_CHART_COLORS = {
  p50: SERIES.forecast,
  band: SERIES.band,
  actual: SERIES.actual,
  pv: SERIES.pv,
  netGrid: SERIES.netGrid,
  limit: SERIES.limit,
  overArea: STATUS.warning.soft,
  vessel: SERIES.diesel,
  now: NEUTRAL.ink,
};

export const TOU_BG: Record<TouBand, string | null> = {
  OFF_PEAK: STATUS.info.soft,
  STANDARD: null,
  PEAK: STATUS.danger.soft,
};

const Y_MAX = 10000;
const Y_TICKS = [0, 2000, 4000, 6000, 8000, 10000];

interface ForecastDemandChartProps {
  points: ForecastPoint[];
  mode: ForecastChartMode;
  showPv: boolean;
  showNetGrid: boolean;
  showTou: boolean;
  domain: TimeDomain;
  highlightVessel?: { id: string; name: string } | null;
}

/** Filled rectangle for ReferenceArea (its `fill` prop is not typed in recharts 3). */
const fillShape = (fill: string, opacity: number) => (props: any) => (
  <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={fill} fillOpacity={opacity} />
);

export const LegendItem: React.FC<{ color: string; label: string; kind: "line" | "band" | "dashed" | "area" }> = ({
  color,
  label,
  kind,
}) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    {kind === "band" || kind === "area" ? (
      <span
        className="inline-block w-4 h-2.5 rounded-sm border border-black/5"
        style={{ backgroundColor: color, opacity: kind === "band" ? 0.45 : 0.9 }}
      />
    ) : (
      <span
        className="inline-block w-4 h-0 border-t-2"
        style={{ borderColor: color, borderStyle: kind === "dashed" ? "dashed" : "solid" }}
      />
    )}
    <span>{label}</span>
  </span>
);

const TooltipRow: React.FC<{ color: string; label: string; value: string; strong?: boolean; valueClass?: string }> = ({
  color,
  label,
  value,
  strong,
  valueClass,
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="flex items-center gap-1.5 text-slate-700">
      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
    <span className={`tabular-nums ${strong ? "font-medium" : "font-semibold"} ${valueClass ?? ""}`}>{value}</span>
  </div>
);

const ChartTooltip: React.FC<any> = ({ active, payload, mode, highlightVessel }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  if (!active || !payload || payload.length === 0) return null;
  const p: ForecastPoint = payload[0].payload;
  const limitShare = (p.netGrid / SUBSTATION_LIMIT_KW) * 100;
  const over = p.netGrid > SUBSTATION_LIMIT_KW;
  const switched = !p.locked && p.pPeak >= P_PEAK_SWITCH;

  return (
    <div className="bg-white border border-slate-300 rounded-card shadow-lg px-3 py-2.5 text-xs text-ink min-w-[236px]">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="font-medium text-ink">
          {p.label} – {minuteLabel(p.minute + INTERVAL_MINUTES)}
        </span>
        {p.locked ? (
          <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />{t("Locked", "Đã khóa")}</span>
        ) : switched ? (
          <span className="text-xs font-medium text-warning">{t("Planned on P90", "Lập kế hoạch theo P90")}</span>
        ) : null}
      </div>
      <div className="space-y-1">
        {mode === "FEEDERS" ? (
          <>
            {FEEDERS.map((f) => (
              <TooltipRow key={f.key} color={f.color} label={`${f.id} ${t(f.name.en, f.name.vn)}`} value={kw(p.feeders[f.key])} />
            ))}
            <div className="pt-1 mt-1 border-t border-line">
              <TooltipRow color={FORECAST_CHART_COLORS.p50} label={t("Total load P50", "Tổng phụ tải P50")} value={kw(p.p50)} strong />
            </div>
          </>
        ) : (
          <>
            {p.actual !== null && (
              <TooltipRow color={FORECAST_CHART_COLORS.actual} label={t("Metered (actual)", "Thực đo")} value={kw(p.actual)} strong />
            )}
            <TooltipRow color={FORECAST_CHART_COLORS.p50} label={t("Load P50", "Phụ tải P50")} value={kw(p.p50)} strong />
            <TooltipRow color={FORECAST_CHART_COLORS.band} label={t("P10–P90 range", "Dải P10–P90")} value={`${num(p.p10)} – ${kw(p.p90)}`} />
          </>
        )}
        {highlightVessel && (
          <TooltipRow
            color={FORECAST_CHART_COLORS.vessel}
            label={t(`of which ${highlightVessel.name}`, `trong đó ${highlightVessel.name}`)}
            value={kw(p.byVessel[highlightVessel.id] ?? 0)}
          />
        )}
        <TooltipRow color={FORECAST_CHART_COLORS.pv} label={t("Solar PV", "Điện mặt trời (PV)")} value={kw(p.pv)} />
        <TooltipRow color={FORECAST_CHART_COLORS.netGrid} label={t("Net grid import", "Điện lưới thuần")} value={kw(p.netGrid)} strong />
        <div className="pt-1 mt-1 border-t border-line space-y-1">
          <TooltipRow
            color={FORECAST_CHART_COLORS.limit}
            label={t("Of 8,000 kW limit (grid)", "So với ngưỡng 8.000 kW (lưới)")}
            value={pct(limitShare)}
            strong
            valueClass={over ? "text-danger" : ""}
          />
          {!p.locked && (
            <TooltipRow
              color="#F97316"
              label={t("Exceedance probability", "Xác suất vượt ngưỡng")}
              value={pct(p.pPeak * 100, p.pPeak < 0.1 && p.pPeak > 0 ? 1 : 0)}
              valueClass={switched ? "text-warning" : ""}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/** Contiguous runs of the same TOU band → background rectangles. */
function touRuns(points: ForecastPoint[]) {
  const runs: { band: TouBand; from: number; to: number }[] = [];
  for (const p of points) {
    const last = runs[runs.length - 1];
    if (last && last.band === p.tou) last.to = p.minute + INTERVAL_MINUTES;
    else runs.push({ band: p.tou, from: p.minute, to: p.minute + INTERVAL_MINUTES });
  }
  return runs;
}

export const ForecastDemandChart: React.FC<ForecastDemandChartProps> = ({
  points,
  mode,
  showPv,
  showNetGrid,
  showTou,
  domain,
  highlightVessel,
}) => {
  const { t } = useLanguage();
  const { num } = useFormat();
  const limitLabel = t(`Substation limit ${num(SUBSTATION_LIMIT_KW)} kW`, `Giới hạn trạm ${num(SUBSTATION_LIMIT_KW)} kW`);
  const anim = { isAnimationActive: true, animationDuration: 450 } as const;
  const lockVisible = domain[0] < LOCK_MINUTE;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 24, right: TIMELINE_RIGHT, left: 0, bottom: 0 }}>
          {showTou &&
            touRuns(points)
              .filter((r) => TOU_BG[r.band])
              .map((r) => (
                <React.Fragment key={`tou-${r.from}`}>
                  <ReferenceArea x1={r.from} x2={r.to} ifOverflow="hidden" shape={fillShape(TOU_BG[r.band] as string, 0.7)} />
                </React.Fragment>
              ))}

          {lockVisible && (
            <ReferenceArea
              x1={domain[0]}
              x2={Math.min(LOCK_MINUTE, domain[1])}
              ifOverflow="hidden"
              shape={fillShape("#94A3B8", 0.1)}
              label={{
                value: t("Locked – kept for audit", "Đã khóa – phục vụ kiểm toán"),
                position: "insideTop",
                fill: "#334155",
                fontSize: 12,
                fontWeight: 700,
              }}
            />
          )}

          <ReferenceArea y1={SUBSTATION_LIMIT_KW} y2={Y_MAX} ifOverflow="hidden" shape={fillShape(FORECAST_CHART_COLORS.overArea, 0.75)} />

          <CartesianGrid vertical={false} stroke="#EEF0F3" />
          <XAxis
            dataKey="minute"
            type="number"
            domain={domain}
            ticks={timelineTicks(domain)}
            tickFormatter={(m: number) => minuteLabel(m)}
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            allowDataOverflow
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            domain={[0, Y_MAX]}
            ticks={Y_TICKS}
            tickFormatter={(v: number) => formatKShort(v)}
            width={TIMELINE_LEFT}
            allowDataOverflow
            label={{ value: "kW", position: "top", offset: 12, fontSize: 12, fill: "#475569", fontWeight: 700 }}
          />

          <Tooltip
            content={<ChartTooltip mode={mode} highlightVessel={highlightVessel} />}
            cursor={{ stroke: "#94A3B8", strokeDasharray: "3 3" }}
          />

          {mode === "TOTAL" ? (
            <>
              <Area
                type="monotone"
                dataKey={(d: ForecastPoint) => [d.p10, d.p90]}
                name="P10–P90"
                fill={FORECAST_CHART_COLORS.band}
                fillOpacity={0.32}
                stroke="none"
                activeDot={false}
                {...anim}
              />
              <Line type="monotone" dataKey="p50" name="P50" stroke={FORECAST_CHART_COLORS.p50} strokeWidth={2.75} dot={false} {...anim} />
            </>
          ) : (
            FEEDERS.map((f) => (
              <Area
                key={f.key}
                type="monotone"
                dataKey={(d: ForecastPoint) => d.feeders[f.key]}
                name={f.id}
                stackId="feeders"
                fill={f.color}
                fillOpacity={0.75}
                stroke={f.color}
                strokeWidth={0.75}
                {...anim}
              />
            ))
          )}

          {highlightVessel && (
            <Area
              type="monotone"
              dataKey={(d: ForecastPoint) => [d.p50 - (d.byVessel[highlightVessel.id] ?? 0), d.p50]}
              name={highlightVessel.name}
              fill={FORECAST_CHART_COLORS.vessel}
              fillOpacity={0.5}
              stroke={FORECAST_CHART_COLORS.vessel}
              strokeWidth={1.25}
              activeDot={false}
              isAnimationActive={false}
            />
          )}

          {showPv && (
            <Area
              type="monotone"
              dataKey="pv"
              name="PV"
              fill={FORECAST_CHART_COLORS.pv}
              fillOpacity={0.22}
              stroke={FORECAST_CHART_COLORS.pv}
              strokeWidth={1.75}
              {...anim}
            />
          )}
          {showNetGrid && (
            <Line
              type="monotone"
              dataKey="netGrid"
              name="Net grid"
              stroke={FORECAST_CHART_COLORS.netGrid}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              {...anim}
            />
          )}

          {mode === "TOTAL" && (
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={FORECAST_CHART_COLORS.actual}
              strokeWidth={1.75}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}

          <ReferenceLine
            y={SUBSTATION_LIMIT_KW}
            stroke={FORECAST_CHART_COLORS.limit}
            strokeDasharray="6 4"
            strokeWidth={1.75}
            label={{ value: limitLabel, position: "insideTopRight", fill: "#B45309", fontSize: 12, fontWeight: 700 }}
          />

          {NOW_MINUTE >= domain[0] && NOW_MINUTE <= domain[1] && (
            <ReferenceLine
              x={NOW_MINUTE}
              stroke={FORECAST_CHART_COLORS.now}
              strokeWidth={1.5}
              label={{
                value: t(`Now ${minuteLabel(NOW_MINUTE)}`, `Bây giờ ${minuteLabel(NOW_MINUTE)}`),
                position: "top",
                fill: "#0F172A",
                fontSize: 12,
                fontWeight: 800,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ForecastChartLegend: React.FC<{
  mode: ForecastChartMode;
  showPv: boolean;
  showNetGrid: boolean;
  showTou: boolean;
  highlightVesselName?: string | null;
}> = ({ mode, showPv, showNetGrid, showTou, highlightVesselName }) => {
  const { t } = useLanguage();
  const { num } = useFormat();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-600" style={{ paddingLeft: TIMELINE_LEFT }}>
      {mode === "TOTAL" ? (
        <>
          <LegendItem color={FORECAST_CHART_COLORS.actual} kind="line" label={t("Metered (locked)", "Thực đo (đã khóa)")} />
          <LegendItem color={FORECAST_CHART_COLORS.p50} kind="line" label={t("Forecast P50", "Dự báo P50")} />
          <LegendItem color={FORECAST_CHART_COLORS.band} kind="band" label={t("P10–P90 band", "Dải P10–P90")} />
        </>
      ) : (
        FEEDERS.map((f) => <LegendItem key={f.key} color={f.color} kind="area" label={`${f.id} ${t(f.name.en, f.name.vn)}`} />)
      )}
      {showPv && <LegendItem color={FORECAST_CHART_COLORS.pv} kind="area" label={t("PV forecast", "PV dự báo")} />}
      {showNetGrid && <LegendItem color={FORECAST_CHART_COLORS.netGrid} kind="dashed" label={t("Net grid = load − PV", "Điện lưới thuần = tải − PV")} />}
      {highlightVesselName && <LegendItem color={FORECAST_CHART_COLORS.vessel} kind="area" label={t(`Load from ${highlightVesselName}`, `Phụ tải do ${highlightVesselName}`)} />}
      <LegendItem color={FORECAST_CHART_COLORS.limit} kind="dashed" label={t(`Limit ${num(SUBSTATION_LIMIT_KW)} kW`, `Ngưỡng ${num(SUBSTATION_LIMIT_KW)} kW`)} />
      {showTou && (
        <>
          <LegendItem color={TOU_BG.OFF_PEAK as string} kind="area" label={t("Off-peak tariff", "Giờ thấp điểm")} />
          <LegendItem color={TOU_BG.PEAK as string} kind="area" label={t("Peak tariff", "Giờ cao điểm")} />
        </>
      )}
    </div>
  );
};
