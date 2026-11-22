import React from "react";
import { CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { CallRecord, LEDGER_TOTALS, RecordStatus, stamp } from "../../data/module2Carbon";
import { IntensityBar, MeasuredBar, RecordStatusBadge } from "./CarbonShared";
import { Panel } from "./OverviewTab";
import { ChartTooltipBox, Column, DataTable, EmptyState as UiEmptyState } from "../ui";
import { NEUTRAL, SERIES } from "../../theme/tokens";

const STATUS_RANK: Record<RecordStatus, number> = { DRAFT: 0, RECONCILED: 1, LOCKED: 2, SHARED: 3 };

export const EmptyState: React.FC<{ text: string }> = ({ text }) => <UiEmptyState compact title={text} />;

/** B3 – sortable 12-call table and TEU × intensity scatter. */
export const CallsTab: React.FC<{ calls: CallRecord[]; onOpenCall: (r: CallRecord) => void }> = ({ calls, onOpenCall }) => {
  const { t } = useLanguage();
  const { num } = useFormat();

  const columns: Column<CallRecord>[] = [
    {
      key: "vessel",
      header: t("Vessel", "Tàu"),
      sortValue: (r) => r.vessel,
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.vessel}</div>
          <div className="text-xs text-muted">{stamp(r.etaMin)}</div>
        </div>
      ),
    },
    { key: "carrier", header: t("Carrier", "Hãng tàu"), sortValue: (r) => r.carrier, render: (r) => <span className="text-muted">{r.carrier}</span> },
    { key: "berth", header: t("Berth", "Cầu"), sortValue: (r) => r.berth, render: (r) => r.berth },
    { key: "hours", header: t("At berth (h)", "Nằm bến (h)"), align: "right", sortValue: (r) => r.berthHours, render: (r) => num(r.berthHours, 1) },
    { key: "teu", header: "TEU", align: "right", sortValue: (r) => r.teu, render: (r) => num(r.teu) },
    { key: "kwh", header: "kWh", align: "right", sortValue: (r) => r.electricityKwh, render: (r) => num(r.electricityKwh) },
    { key: "fuel", header: t("Diesel (L)", "Dầu (L)"), align: "right", sortValue: (r) => r.fuelL, render: (r) => num(r.fuelL) },
    { key: "total", header: "tCO₂e", align: "right", sortValue: (r) => r.totalKg, render: (r) => <span className="font-medium">{num(r.totalKg / 1000, 2)}</span> },
    { key: "intensity", header: "kgCO₂e/TEU", sortValue: (r) => r.intensity, render: (r) => <IntensityBar value={r.intensity} avg={LEDGER_TOTALS.intensity} label={num(r.intensity, 1)} /> },
    { key: "measured", header: t("Measured", "Đo trực tiếp"), sortValue: (r) => r.measuredPct, render: (r) => <MeasuredBar pct={r.measuredPct} /> },
    { key: "status", header: t("Status", "Trạng thái"), sortValue: (r) => STATUS_RANK[r.status], render: (r) => <RecordStatusBadge status={r.status} /> },
  ];

  const ops = calls.filter((r) => r.opsKw > 0).map((r) => ({ x: r.teu, y: r.intensity, z: r.totalKg, r }));
  const noOps = calls.filter((r) => r.opsKw === 0).map((r) => ({ x: r.teu, y: r.intensity, z: r.totalKg, r }));

  if (calls.length === 0) return <EmptyState text={t("No vessel calls match the filter", "Không có lượt tàu nào khớp bộ lọc")} />;

  return (
    <div className="space-y-6">
      <Panel title={t("Vessel calls", "Lượt tàu")} note={t("Click a row to open the call", "Bấm vào dòng để mở chi tiết lượt tàu")}>
        <DataTable
          rows={calls}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={onOpenCall}
          searchable
          searchText={(r) => `${r.vessel} ${r.carrier} ${r.recordNo} ${r.berth}`}
          initialSort={{ key: "intensity", dir: -1 }}
          emptyTitle={t("No vessel calls", "Không có lượt tàu")}
        />
      </Panel>

      <Panel
        title={t("Throughput × intensity", "Sản lượng × cường độ")}
        note={t(`Port average ${num(LEDGER_TOTALS.intensity, 2)} kgCO₂e/TEU · bubble size = tCO₂e`, `Bình quân cảng ${num(LEDGER_TOTALS.intensity, 2)} kgCO₂e/TEU · kích thước = tCO₂e`)}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={NEUTRAL.grid} />
              <XAxis type="number" dataKey="x" name="TEU" fontSize={12} stroke={NEUTRAL.subtle} tickLine={false} tickFormatter={(v: number) => num(v)} />
              <YAxis type="number" dataKey="y" name="kgCO₂e/TEU" fontSize={12} stroke={NEUTRAL.subtle} tickLine={false} width={40} domain={[10, 22]} />
              <ZAxis type="number" dataKey="z" range={[60, 360]} />
              <ReferenceLine y={LEDGER_TOTALS.intensity} stroke={NEUTRAL.muted} strokeDasharray="4 3" label={{ value: num(LEDGER_TOTALS.intensity, 2), position: "right", fontSize: 12, fill: NEUTRAL.muted }} />
              <Tooltip
                content={({ active, payload }: any) =>
                  active && payload?.length ? (
                    <ChartTooltipBox title={payload[0].payload.r.vessel}>
                      <div className="tabular-nums">
                        {num(payload[0].payload.x)} TEU · {num(payload[0].payload.y, 2)} kgCO₂e/TEU
                      </div>
                    </ChartTooltipBox>
                  ) : null
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Scatter name={t("Uses OPS", "Có dùng OPS")} data={ops} fill={SERIES.f04} onClick={(p: any) => onOpenCall(p.r ?? p.payload?.r)} cursor="pointer">
                {ops.map((p) => (
                  <Cell key={p.r.id} fill={SERIES.f04} />
                ))}
              </Scatter>
              <Scatter name={t("No OPS", "Không dùng OPS")} data={noOps} fill={SERIES.f06} onClick={(p: any) => onOpenCall(p.r ?? p.payload?.r)} cursor="pointer">
                {noOps.map((p) => (
                  <Cell key={p.r.id} fill={SERIES.f06} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
};
