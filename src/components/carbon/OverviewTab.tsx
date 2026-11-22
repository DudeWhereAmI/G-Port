import React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { CHART, SERIES } from "../../theme/tokens";
import { ChartCard, KpiCard } from "../ui";
import { useFormat } from "../../utils/format";
import {
  BALANCE_STATS,
  CallRecord,
  DELTA_BAL_PCT,
  FACILITY_SOURCES,
  PeriodKind,
  TARGET_INTENSITY_2026,
  ZONES,
  lineUncertaintyPct,
  periodSeries,
} from "../../data/module2Carbon";

export const Panel: React.FC<{ title: string; note?: string; right?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }> = ({
  title,
  note,
  right,
  children,
  className,
  id,
}) => (
  <ChartCard id={id} title={title} description={note} toolbar={right} className={className}>
    {children}
  </ChartCard>
);

export const Kpi: React.FC<{ label: string; value: string; sub?: React.ReactNode; tone?: "default" | "good" }> = ({ label, value, sub }) => {
  // split "471,79 tCO₂e" into value + unit so all KPI cards share one structure
  const m = value.match(/^([−+-]?[\d.,]+)\s*(.*)$/);
  return <KpiCard label={label} value={m ? m[1] : value} unit={m ? m[2] || undefined : undefined} hint={sub} />;
};

export const PERIODS: { id: PeriodKind; en: string; vn: string }[] = [
  { id: "DAY", en: "Day", vn: "Ngày" },
  { id: "MONTH", en: "Month", vn: "Tháng" },
  { id: "QUARTER", en: "Quarter", vn: "Quý" },
  { id: "YEAR", en: "Year", vn: "Năm" },
];

interface OverviewTabProps {
  period: PeriodKind;
  calls: CallRecord[];
  filtered: boolean;
  onOpenCall: (r: CallRecord) => void;
  extra?: React.ReactNode;
}

/** B1 – facility-level inventory overview. */
export const OverviewTab: React.FC<OverviewTabProps> = ({ period, calls, filtered, extra }) => {
  const { t } = useLanguage();
  const { num, pct } = useFormat();
  const series = periodSeries(period);

  // KPIs: period totals, or the filtered calls when a berth / carrier filter is active
  const s1 = filtered ? calls.reduce((a, r) => a + r.scope1Kg, 0) / 1000 : series.reduce((a, x) => a + x.scope1T, 0);
  const s2 = filtered ? calls.reduce((a, r) => a + r.scope2Kg, 0) / 1000 : series.reduce((a, x) => a + x.scope2T, 0);
  const teu = filtered ? calls.reduce((a, r) => a + r.teu, 0) : series.reduce((a, x) => a + x.teu, 0);
  const lines = calls.flatMap((r) => r.lines);
  const callKg = lines.reduce((a, l) => a + l.kg, 0);
  const measuredPct = callKg ? (lines.filter((l) => l.level === "MEASURED").reduce((a, l) => a + l.kg, 0) / callKg) * 100 : 0;
  const uPct = callKg ? Math.sqrt(lines.reduce((a, l) => a + (l.kg * lineUncertaintyPct(l)) ** 2, 0)) / callKg : 0;

  const donut = Object.entries(FACILITY_SOURCES).map(([k, s]) => ({ key: k, name: t(s.name.en, s.name.vn), value: Math.round(s.kg), color: s.color }));
  const donutTotal = donut.reduce((a, x) => a + x.value, 0);
  const tree = ZONES.map((z) => ({ name: t(z.name.en, z.name.vn), size: Math.round(z.kg) }));
  const year = periodSeries("YEAR");

  const TreeCell: React.FC<any> = (p) => {
    const { x, y, width, height, name, size, index } = p;
    const colors = CHART;
    if (width <= 0 || height <= 0) return null;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={colors[index % colors.length]} stroke="#fff" strokeWidth={2} />
        {width > 70 && height > 34 && (
          <>
            <text x={x + 6} y={y + 16} fill="#fff" fontSize={12} fontWeight={700}>
              {name}
            </text>
            <text x={x + 6} y={y + 30} fill="#fff" fontSize={12}>
              {num(size / 1000, 1)} t
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="text-xs text-muted">
          {filtered
            ? t(`KPIs follow the filter: ${calls.length} vessel calls`, `KPI theo bộ lọc: ${calls.length} lượt tàu`)
            : period === "DAY"
            ? t("Dataset v2 days, calls attributed to their arrival day", "Các ngày Dataset v2, lượt tàu tính theo ngày tàu đến")
            : t("Earlier periods: modelled history (not Dataset v2)", "Các kỳ trước: lịch sử mô hình hóa (không thuộc Dataset v2)")}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          label={t("Total (Scope 1 / Scope 2)", "Tổng (Scope 1 / Scope 2)")}
          value={`${num(s1 + s2, 2)} tCO₂e`}
          sub={
            <>
              {num(s1, 2)} / {num(s2, 2)} t · <span title={t("Combined uncertainty", "Độ bất định tổng hợp")}>±{num(uPct, 1)}%</span>
              {!filtered && period === "DAY" && (
                <div>
                  {t(
                    `facility · of which ${calls.length} calls ${num(callKg / 1000, 2)} t`,
                    `toàn cơ sở · trong đó ${calls.length} lượt tàu ${num(callKg / 1000, 2)} t`
                  )}
                </div>
              )}
            </>
          }
        />
        <Kpi
          label={t("Intensity", "Cường độ")}
          value={`${num(teu ? ((s1 + s2) * 1000) / teu : 0, 2)} kgCO₂e/TEU`}
          sub={
            filtered
              ? `${num(teu)} TEU`
              : t(
                  `facility I_term · call average ${num(callKg / Math.max(1, calls.reduce((a, r) => a + r.teu, 0)), 2)} · ${num(teu)} TEU`,
                  `toàn cảng I_term · bình quân lượt tàu ${num(callKg / Math.max(1, calls.reduce((a, r) => a + r.teu, 0)), 2)} · ${num(teu)} TEU`
                )
          }
        />
        <Kpi label={t("Directly measured data", "Dữ liệu đo trực tiếp")} value={pct(measuredPct)} sub={t("of call-level emissions", "trên phát thải lượt tàu")} />
        <Kpi
          tone="good"
          label={t("Reconciliation Δbal", "Sai số đối soát Δbal")}
          value={pct(DELTA_BAL_PCT, 2)}
          sub={t(`raw ${pct(BALANCE_STATS.rawDeltaBalPct, 2)} before cleaning`, `thô ${pct(BALANCE_STATS.rawDeltaBalPct, 2)} trước làm sạch`)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4">
        <Panel title={t("Scope 1 & Scope 2 over time", "Scope 1 & Scope 2 theo thời gian")} note={t("Bars tCO₂e · line kgCO₂e/TEU (right axis)", "Cột tCO₂e · đường kgCO₂e/TEU (trục phải)")}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF0F3" />
                <XAxis dataKey="label" fontSize={12} stroke="#94A3B8" tickLine={false} />
                <YAxis yAxisId="t" fontSize={12} stroke="#94A3B8" tickLine={false} width={44} tickFormatter={(v: number) => num(v)} />
                <YAxis yAxisId="i" orientation="right" fontSize={12} stroke="#94A3B8" tickLine={false} width={34} domain={[0, 35]} />
                <Tooltip
                  formatter={(v: any, k: any) =>
                    k === "intensity" ? [`${num(Number(v), 2)} kgCO₂e/TEU`, t("Intensity", "Cường độ")] : [`${num(Number(v), 2)} t`, k === "scope1T" ? "Scope 1" : "Scope 2"]
                  }
                />
                <Legend formatter={(k: any) => (k === "scope1T" ? "Scope 1" : k === "scope2T" ? "Scope 2" : t("Intensity", "Cường độ"))} wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="t" dataKey="scope2T" stackId="s" fill={SERIES.scope2} />
                <Bar yAxisId="t" dataKey="scope1T" stackId="s" fill={SERIES.scope1} radius={[3, 3, 0, 0]} />
                <Line yAxisId="i" type="monotone" dataKey="intensity" stroke="#0F172A" strokeWidth={2} dot={{ r: 2 }} />
                <ReferenceLine yAxisId="i" y={TARGET_INTENSITY_2026} stroke="#059669" strokeDasharray="4 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t("Emissions by source", "Phát thải theo nguồn")} note={t("Dataset v2, facility incl. unallocated", "Dataset v2, toàn cơ sở gồm phần không phân bổ")}>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center">
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={1}>
                    {donut.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${num(Number(v) / 1000, 2)} t (${pct((Number(v) / donutTotal) * 100)})`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-semibold text-ink text-sm tabular-nums">{num(donutTotal / 1000, 1)}</span>
                <span className="text-xs text-muted">tCO₂e</span>
              </div>
            </div>
            <ul className="space-y-1 text-xs">
              {donut.map((d) => (
                <li key={d.key} className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="tabular-nums text-slate-600">{pct((d.value / donutTotal) * 100, 0)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title={t("Emissions by zone", "Phát thải theo khu vực")} note={t("Berths, reefer yard, charging hub, gate", "Cầu bến, bãi lạnh, trạm sạc, cổng")}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={tree} dataKey="size" nameKey="name" content={<TreeCell />} isAnimationActive={false}>
                <Tooltip formatter={(v: any) => [`${num(Number(v) / 1000, 2)} tCO₂e`, ""]} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title={t("Intensity trend vs. target", "Xu hướng cường độ so với mục tiêu")}
          note={t(`2026 target ${num(TARGET_INTENSITY_2026, 2)} kgCO₂e/TEU (−2%/yr from 2025)`, `Mục tiêu 2026 ${num(TARGET_INTENSITY_2026, 2)} kgCO₂e/TEU (−2%/năm so với 2025)`)}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={year} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF0F3" />
                <XAxis dataKey="label" fontSize={12} stroke="#94A3B8" tickLine={false} />
                <YAxis fontSize={12} stroke="#94A3B8" tickLine={false} width={34} domain={[14, 22]} />
                <Tooltip formatter={(v: any, k: any) => [`${num(Number(v), 2)} kgCO₂e/TEU`, k === "targetIntensity" ? t("Target", "Mục tiêu") : t("Actual", "Thực tế")]} />
                <Legend formatter={(k: any) => (k === "targetIntensity" ? t("Target", "Mục tiêu") : t("Actual", "Thực tế"))} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="intensity" stroke="#004B91" strokeWidth={2.5} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="targetIntensity" stroke="#059669" strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      {extra}
    </div>
  );
};
