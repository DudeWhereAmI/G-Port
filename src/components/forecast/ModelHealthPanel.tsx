import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { ACCURACY_HISTORY, MODEL_METRICS } from "../../data/module1Forecast";
import { FEATURE_IMPORTANCE, LAST_7_DAYS, LAST_RETRAIN } from "../../data/module1ModelHealth";

const GROUP_COLOR = { LAG: "#004B91", TOS: "#7C3AED", WEATHER: "#059669", CALENDAR: "#94A3B8" } as const;

const Box: React.FC<{ title: string; children: React.ReactNode; note?: string }> = ({ title, children, note }) => (
  <div className="rounded-xl border border-slate-200 p-3 space-y-2 min-w-0">
    <div className="text-xs font-bold text-slate-800">{title}</div>
    {children}
    {note && <div className="text-xs text-slate-500">{note}</div>}
  </div>
);

const SimpleTooltip: React.FC<any> = ({ active, payload, label, render }) =>
  active && payload?.length ? (
    <div className="bg-white border border-slate-300 rounded-lg shadow px-2.5 py-1.5 text-xs text-slate-900 space-y-0.5">
      {render(payload, label)}
    </div>
  ) : null;

/** C1 – model health: learning curve, metrics, feature importance, 7-day error. */
export const ModelHealthPanel: React.FC = () => {
  const { t } = useLanguage();
  const { num, kw, pct } = useFormat();
  const top10 = [...FEATURE_IMPORTANCE].sort((a, b) => b.gain - a.gain).slice(0, 10);
  const groupLabel = {
    LAG: t("Lagged load", "Phụ tải trễ"),
    TOS: t("TOS plan", "Kế hoạch TOS"),
    WEATHER: t("Weather", "Thời tiết"),
    CALENDAR: t("Calendar", "Lịch"),
  };

  const tiles = [
    { label: "RMSE", value: kw(MODEL_METRICS.rmseKw, 1) },
    { label: "MAPE", value: pct(MODEL_METRICS.mapePct, 2), sub: t(`from ${pct(MODEL_METRICS.mapeBaselinePct, 2)}`, `từ ${pct(MODEL_METRICS.mapeBaselinePct, 2)}`) },
    { label: "R²", value: num(MODEL_METRICS.r2, 4) },
    { label: t("P10–P90 coverage", "Độ phủ P10–P90"), value: pct(MODEL_METRICS.coveragePct, 0) },
    { label: t("Inference (96 steps)", "Suy luận 96 chu kỳ"), value: `${num(MODEL_METRICS.inferenceMs, 1)} ms` },
    {
      label: t("Ensemble weights", "Trọng số tổ hợp"),
      value: `MLP ${num(MODEL_METRICS.mlpWeight, 2)} / LightGBM ${num(MODEL_METRICS.lgbmWeight, 2)}`,
    },
  ];

  const learning = ACCURACY_HISTORY.map((r) => ({ ...r, label: t(`${r.windowDays} d`, `${r.windowDays} ngày`) }));
  const days = LAST_7_DAYS.map((d) => ({ ...d, name: t(d.label.en, d.label.vn), errorKw: d.forecastPeakKw - d.actualPeakKw }));

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
            <div className="text-xs font-bold text-slate-500">{tile.label}</div>
            <div className="font-black text-slate-900 tabular-nums text-sm">{tile.value}</div>
            {tile.sub && <div className="text-xs text-emerald-700 font-semibold">{tile.sub}</div>}
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-600">
        {MODEL_METRICS.modelVersion} · {t("Pinball loss on P10/P50/P90", "Pinball loss trên P10/P50/P90")} ·{" "}
        {t(
          `last weekly retrain ${LAST_RETRAIN.label.en} (${LAST_RETRAIN.windowDays}-day window, ${num(LAST_RETRAIN.samples)} samples) · next ${LAST_RETRAIN.nextLabel.en}`,
          `tự huấn luyện gần nhất ${LAST_RETRAIN.label.vn} (cửa sổ ${LAST_RETRAIN.windowDays} ngày, ${num(LAST_RETRAIN.samples)} mẫu) · lần tới ${LAST_RETRAIN.nextLabel.vn}`
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Box
          title={t("Self-learning curve", "Đường cong tự học")}
          note={t("Out-of-sample MAPE vs training window (5 → 30 days)", "MAPE ngoài mẫu theo cửa sổ huấn luyện (5 → 30 ngày)")}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={learning} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF0F3" />
                <XAxis dataKey="label" fontSize={12} stroke="#94A3B8" tickLine={false} />
                <YAxis fontSize={12} stroke="#94A3B8" tickLine={false} width={36} domain={[0, 2.5]} tickFormatter={(v: number) => pct(v, 1)} />
                <Tooltip
                  content={
                    <SimpleTooltip
                      render={(p: any[]) => (
                        <>
                          <div className="font-bold">{p[0].payload.label}</div>
                          <div>MAPE <b className="">{pct(p[0].payload.mapePct, 2)}</b></div>
                          <div>RMSE <b className="">{kw(p[0].payload.rmseKw, 1)}</b></div>
                        </>
                      )}
                    />
                  }
                />
                <Line type="monotone" dataKey="mapePct" stroke="#004B91" strokeWidth={2.5} dot={{ r: 3, fill: "#004B91" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Box>

        <Box
          title={t("Feature importance (top 10 of 18)", "Mức độ quan trọng đặc trưng (top 10/18)")}
          note={t("Normalised LightGBM gain", "Gain LightGBM đã chuẩn hóa")}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10.map((f) => ({ ...f, label: t(f.name.en, f.name.vn), gainPct: f.gain * 100 }))} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" fontSize={12} stroke="#94A3B8" tickLine={false} tickFormatter={(v: number) => pct(v, 0)} />
                <YAxis type="category" dataKey="label" fontSize={12} stroke="#94A3B8" tickLine={false} width={120} interval={0} />
                <Tooltip
                  content={
                    <SimpleTooltip
                      render={(p: any[]) => (
                        <>
                          <div className="font-bold">{p[0].payload.label}</div>
                          <div>
                            {groupLabel[p[0].payload.group as keyof typeof groupLabel]} · <b className="">{pct(p[0].payload.gainPct, 1)}</b>
                          </div>
                        </>
                      )}
                    />
                  }
                />
                <Bar dataKey="gainPct" radius={[0, 3, 3, 0]}>
                  {top10.map((f) => (
                    <Cell key={f.key} fill={GROUP_COLOR[f.group]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-semibold">
            {(Object.keys(GROUP_COLOR) as (keyof typeof GROUP_COLOR)[]).map((g) => (
              <span key={g} className="inline-flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: GROUP_COLOR[g] }} />
                {groupLabel[g]}
              </span>
            ))}
          </div>
        </Box>

        <Box
          title={t("Forecast vs. actual – last 7 days", "Dự báo so với thực tế – 7 ngày gần nhất")}
          note={t("Bars: daily peak error (forecast − actual); line: daily MAPE", "Cột: sai số đỉnh ngày (dự báo − thực tế); đường: MAPE ngày")}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={days} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF0F3" />
                <XAxis dataKey="name" fontSize={12} stroke="#94A3B8" tickLine={false} interval={0} />
                <YAxis yAxisId="kw" fontSize={12} stroke="#94A3B8" tickLine={false} width={36} domain={[-150, 150]} />
                <YAxis yAxisId="pct" orientation="right" fontSize={12} stroke="#94A3B8" tickLine={false} width={34} domain={[0, 2]} tickFormatter={(v: number) => pct(v, 1)} />
                <Tooltip
                  content={
                    <SimpleTooltip
                      render={(p: any[]) => {
                        const d = p[0].payload;
                        return (
                          <>
                            <div className="font-bold">{d.name}</div>
                            <div>{t("Forecast peak", "Đỉnh dự báo")} <b className="">{kw(d.forecastPeakKw)}</b></div>
                            <div>{t("Actual peak", "Đỉnh thực tế")} <b className="">{kw(d.actualPeakKw)}</b></div>
                            <div>MAPE <b className="">{pct(d.mapePct, 2)}</b> · RMSE <b className="">{kw(d.rmseKw, 1)}</b></div>
                          </>
                        );
                      }}
                    />
                  }
                />
                <Bar yAxisId="kw" dataKey="errorKw" radius={[3, 3, 0, 0]}>
                  {days.map((d) => (
                    <Cell key={d.date} fill={d.errorKw >= 0 ? "#4A81C9" : "#F59E0B"} />
                  ))}
                </Bar>
                <Line yAxisId="pct" type="monotone" dataKey="mapePct" stroke="#0F172A" strokeWidth={2} dot={{ r: 2.5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Box>
      </div>
    </div>
  );
};
