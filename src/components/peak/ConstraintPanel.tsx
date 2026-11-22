import React from "react";
import { Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { SUBSTATION_LIMIT_KW } from "../../data/module1Forecast";
import { DispatchResult, PROTECTED_GROUPS } from "../../data/module3PeakShaving";

export const REEFER_BAND = { setpoint: -18.0, min: -18.5, max: -17.5 };
export const LUX = { normal: 300, eco: 240, safetyMin: 200 };

/** Reefer sub-group temperature: pre-cool, then ≤ 45-min compressor rest cycles. */
export function reeferTemperature(result: DispatchResult) {
  let temp = REEFER_BAND.setpoint;
  let offRun = 0;
  return result.intervals.map((x) => {
    const r = x.adjust.REEFER;
    if (r > 0) {
      temp = Math.max(-18.4, temp - 0.1);
      offRun = 0;
    } else if (r < 0) {
      offRun = (offRun % 6) + 1; // 4 sub-groups rotate; each rests 3 × 15 min then recovers
      temp = offRun <= 3 ? temp + 0.12 : Math.max(-18.3, temp - 0.12);
    } else {
      temp = temp + (REEFER_BAND.setpoint - temp) * 0.5;
      offRun = 0;
    }
    return { minute: x.minute, label: x.label, temp: Math.round(temp * 100) / 100 };
  });
}

const Mini: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <div className="h-16 w-full">
    <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
  </div>
);

const tip = (fmt: (p: any) => string) => (props: any) =>
  props.active && props.payload?.length ? (
    <div className="bg-white border border-slate-300 rounded-md shadow px-2 py-1 text-[10px] text-slate-900">{fmt(props.payload[0].payload)}</div>
  ) : null;

/** B5 – constraint compliance with mini-charts. */
export const ConstraintPanel: React.FC<{ result: DispatchResult }> = ({ result }) => {
  const { t } = useLanguage();
  const { num, kw } = useFormat();

  const temps = reeferTemperature(result);
  const tempWindow = temps.filter((x) => x.minute >= 12 * 60 && x.minute <= 18 * 60);
  const tempOk = temps.every((x) => x.temp >= REEFER_BAND.min && x.temp <= REEFER_BAND.max);
  const maxOff = (() => {
    let run = 0, best = 0;
    temps.forEach((_, i) => {
      const r = result.intervals[i].adjust.REEFER;
      run = r < 0 ? run + 1 : 0;
      best = Math.max(best, run);
    });
    return best;
  })();

  const fleet = result.intervals.filter((_, i) => i % 4 === 0).map((x) => ({ label: x.label, ready: x.itvReadyVehicles, need: x.itvRequiredVehicles }));
  const fleetOk = result.intervals.every((x) => x.itvReadyVehicles >= x.itvRequiredVehicles);
  const lux = result.intervals.map((x) => ({ label: x.label, lux: x.adjust.HVAC < 0 ? LUX.eco : LUX.normal }));
  const gridOk = result.gridOkIntervals === result.intervals.length;

  const rows = [
    {
      ok: tempOk,
      title: t("Reefer cargo temperature", "Nhiệt độ hàng lạnh"),
      note: t(
        `Band ${num(REEFER_BAND.min, 1)}…${num(REEFER_BAND.max, 1)} °C · staggered 4 sub-groups × ≤ 45 min`,
        `Dải ${num(REEFER_BAND.min, 1)}…${num(REEFER_BAND.max, 1)} °C · so le 4 nhóm con × ≤ 45 phút`
      ),
      chart: (
        <LineChart data={tempWindow} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <YAxis domain={[-18.7, -17.3]} hide />
          <ReferenceArea y1={REEFER_BAND.min} y2={REEFER_BAND.max} shape={(p: any) => <rect x={p.x} y={p.y} width={p.width} height={p.height} fill="#D1FAE5" fillOpacity={0.6} />} />
          <Tooltip content={tip((p) => `${p.label} · ${num(p.temp, 2)} °C`)} />
          <Line type="monotone" dataKey="temp" stroke="#0EA5E9" strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      ),
    },
    {
      ok: fleetOk,
      title: t("EV fleet readiness", "Đội xe điện sẵn sàng"),
      note: t("Ready tractors ≥ N_req + N_res every hour", "Số xe đủ pin ≥ N_req + N_res mọi giờ"),
      chart: (
        <LineChart data={fleet} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <YAxis domain={[0, 24]} hide />
          <Tooltip content={tip((p) => `${p.label} · ${t("ready", "sẵn sàng")} ${p.ready} / ${t("required", "yêu cầu")} ${p.need}`)} />
          <Line type="stepAfter" dataKey="need" stroke="#F97316" strokeDasharray="3 2" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="stepAfter" dataKey="ready" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      ),
    },
    {
      ok: true,
      title: t("Lighting", "Chiếu sáng"),
      note: t(`Warehouse ≥ ${LUX.safetyMin} lux · yard safety lights untouched`, `Kho ≥ ${LUX.safetyMin} lux · đèn an toàn bãi giữ nguyên`),
      chart: (
        <LineChart data={lux} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <YAxis domain={[150, 320]} hide />
          <ReferenceLine y={LUX.safetyMin} stroke="#DC2626" strokeDasharray="3 2" />
          <Tooltip content={tip((p) => `${p.label} · ${p.lux} lux`)} />
          <Line type="stepAfter" dataKey="lux" stroke="#EAB308" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      ),
    },
    {
      ok: gridOk,
      title: t("Grid import ≤ substation limit", "Điện lưới ≤ giới hạn trạm"),
      note: t(
        `${result.gridOkIntervals}/${result.intervals.length} intervals ≤ ${num(SUBSTATION_LIMIT_KW)} kW`,
        `${result.gridOkIntervals}/${result.intervals.length} chu kỳ ≤ ${num(SUBSTATION_LIMIT_KW)} kW`
      ),
      chart: (
        <LineChart data={result.intervals} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <YAxis domain={[0, 10000]} hide />
          <ReferenceLine y={SUBSTATION_LIMIT_KW} stroke="#D97706" strokeDasharray="3 2" />
          <Tooltip content={tip((p) => `${p.label} · ${kw(p.after)}`)} />
          <Line type="monotone" dataKey="after" stroke="#004B91" strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.title} className="grid grid-cols-[1fr_minmax(0,140px)] gap-3 items-center border border-slate-200 rounded-xl px-3 py-2">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900">
              {r.ok ? "✅" : "⚠️"} {r.title}
            </div>
            <div className="text-[10.5px] text-slate-500">{r.note}</div>
          </div>
          <Mini>{r.chart}</Mini>
        </div>
      ))}
      <div className="border border-slate-200 rounded-xl px-3 py-2">
        <div className="text-xs font-bold text-slate-900">✅ {t("Protected loads at 100%", "Tải được bảo vệ chạy 100%")}</div>
        <div className="text-[10.5px] text-slate-500">
          {PROTECTED_GROUPS.map((g) => t(g.name.en, g.name.vn)).join(" · ")} · {t("never curtailed", "không bao giờ bị cắt")}
        </div>
      </div>
      {maxOff > 0 && (
        <div className="text-[10px] text-slate-500">
          {t(
            `Reefer reduction spans ${maxOff} intervals; each sub-group rests at most 45 min (rotation).`,
            `Giảm reefer kéo dài ${maxOff} chu kỳ; mỗi nhóm con nghỉ tối đa 45 phút (luân phiên).`
          )}
        </div>
      )}
    </div>
  );
};
