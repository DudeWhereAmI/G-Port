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
import { useLanguage } from "../../context/LanguageContext";
import { useFormat, formatKShort } from "../../utils/format";
import {
  ForecastPoint,
  INTERVAL_MINUTES,
  SUBSTATION_LIMIT_KW,
  minuteLabel,
} from "../../data/module1Forecast";

export type ForecastChartMode = "DEMAND_RANGE" | "NET_VS_SOLAR";

export const FORECAST_CHART_COLORS = {
  p50: "#004B91",
  band: "#60A5FA",
  pv: "#059669",
  netGrid: "#7C3AED",
  limit: "#D97706",
  overArea: "#FEE2E2",
};

const Y_MAX = 10000;
const Y_TICKS = [0, 2000, 4000, 6000, 8000, 10000];
const X_TICKS = Array.from({ length: 13 }, (_, i) => i * 120);

interface ForecastDemandChartProps {
  points: ForecastPoint[];
  mode: ForecastChartMode;
}

const LegendItem: React.FC<{ color: string; label: string; kind: "line" | "band" | "dashed" | "area" }> = ({
  color,
  label,
  kind,
}) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    {kind === "band" || kind === "area" ? (
      <span
        className="inline-block w-4 h-2.5 rounded-sm"
        style={{ backgroundColor: color, opacity: kind === "band" ? 0.35 : 0.5 }}
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

const ChartTooltip: React.FC<any> = ({ active, payload }) => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  if (!active || !payload || payload.length === 0) return null;
  const p: ForecastPoint = payload[0].payload;
  const rows: { color: string; label: string; value: string; strong?: boolean }[] = [
    { color: FORECAST_CHART_COLORS.p50, label: t("Load P50", "Phụ tải P50"), value: kw(p.p50), strong: true },
    {
      color: FORECAST_CHART_COLORS.band,
      label: t("P10–P90 range", "Dải P10–P90"),
      value: `${num(p.p10)} – ${kw(p.p90)}`,
    },
    { color: FORECAST_CHART_COLORS.pv, label: t("Solar PV", "Điện mặt trời (PV)"), value: kw(p.pv) },
    {
      color: FORECAST_CHART_COLORS.netGrid,
      label: t("Net grid import", "Điện lưới thuần"),
      value: kw(p.netGrid),
      strong: true,
    },
  ];
  const limitShare = (p.netGrid / SUBSTATION_LIMIT_KW) * 100;
  const over = p.netGrid > SUBSTATION_LIMIT_KW;

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-lg px-3 py-2.5 text-[11px] text-slate-900 min-w-[220px]">
      <div className="font-bold text-slate-900 font-mono mb-1.5">
        {p.label} – {minuteLabel(p.minute + INTERVAL_MINUTES)}
      </div>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
              {r.label}
            </span>
            <span className={`font-mono tabular-nums ${r.strong ? "font-bold" : "font-semibold"}`}>{r.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-slate-200">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: FORECAST_CHART_COLORS.limit }} />
            {t("Of 8,000 kW limit (grid)", "So với ngưỡng 8.000 kW (lưới)")}
          </span>
          <span className={`font-mono tabular-nums font-bold ${over ? "text-red-700" : "text-slate-900"}`}>
            {pct(limitShare)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ForecastDemandChart: React.FC<ForecastDemandChartProps> = ({ points, mode }) => {
  const { t } = useLanguage();
  const { num } = useFormat();
  const limitLabel = t(
    `Substation limit ${num(SUBSTATION_LIMIT_KW)} kW`,
    `Giới hạn trạm ${num(SUBSTATION_LIMIT_KW)} kW`
  );

  return (
    <div className="space-y-2">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="minute"
              type="number"
              domain={[0, 1440]}
              ticks={X_TICKS}
              tickFormatter={(m: number) => minuteLabel(m)}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              allowDataOverflow
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              domain={[0, Y_MAX]}
              ticks={Y_TICKS}
              tickFormatter={(v: number) => formatKShort(v)}
              width={44}
              label={{ value: "kW", position: "top", offset: 12, fontSize: 11, fill: "#475569", fontWeight: 700 }}
            />

            <ReferenceArea
              y1={SUBSTATION_LIMIT_KW}
              y2={Y_MAX}
              ifOverflow="hidden"
              shape={(props: any) => (
                <rect
                  x={props.x}
                  y={props.y}
                  width={props.width}
                  height={props.height}
                  fill={FORECAST_CHART_COLORS.overArea}
                  fillOpacity={0.6}
                />
              )}
            />

            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94A3B8", strokeDasharray: "3 3" }} />

            {mode === "DEMAND_RANGE" ? (
              <>
                <Area
                  type="monotone"
                  dataKey={(d: ForecastPoint) => [d.p10, d.p90]}
                  name="P10–P90"
                  fill={FORECAST_CHART_COLORS.band}
                  fillOpacity={0.3}
                  stroke="none"
                  isAnimationActive={false}
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p50"
                  name="P50"
                  stroke={FORECAST_CHART_COLORS.p50}
                  strokeWidth={2.75}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="pv"
                  name="PV"
                  fill={FORECAST_CHART_COLORS.pv}
                  fillOpacity={0.3}
                  stroke={FORECAST_CHART_COLORS.pv}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="netGrid"
                  name="Net grid"
                  stroke={FORECAST_CHART_COLORS.netGrid}
                  strokeWidth={2.75}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="p50"
                  name="P50"
                  stroke={FORECAST_CHART_COLORS.p50}
                  strokeWidth={1.25}
                  strokeOpacity={0.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            <ReferenceLine
              y={SUBSTATION_LIMIT_KW}
              stroke={FORECAST_CHART_COLORS.limit}
              strokeDasharray="6 4"
              strokeWidth={1.75}
              label={{
                value: limitLabel,
                position: "insideTopLeft",
                fill: "#B45309",
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-600 pl-11">
        {mode === "DEMAND_RANGE" ? (
          <>
            <LegendItem color={FORECAST_CHART_COLORS.p50} kind="line" label={t("Load forecast P50", "Dự báo phụ tải P50")} />
            <LegendItem
              color={FORECAST_CHART_COLORS.band}
              kind="band"
              label={t("Uncertainty band P10–P90", "Dải bất định P10–P90")}
            />
          </>
        ) : (
          <>
            <LegendItem color={FORECAST_CHART_COLORS.netGrid} kind="line" label={t("Net grid import (load − PV)", "Điện lưới thuần (tải − PV)")} />
            <LegendItem color={FORECAST_CHART_COLORS.pv} kind="area" label={t("Solar PV forecast", "Điện mặt trời dự báo")} />
            <LegendItem color={FORECAST_CHART_COLORS.p50} kind="line" label={t("Total load P50", "Tổng phụ tải P50")} />
          </>
        )}
        <LegendItem color={FORECAST_CHART_COLORS.limit} kind="dashed" label={limitLabel} />
        <LegendItem
          color="#FCA5A5"
          kind="area"
          label={t("Above substation limit", "Vùng vượt ngưỡng")}
        />
      </div>
    </div>
  );
};
