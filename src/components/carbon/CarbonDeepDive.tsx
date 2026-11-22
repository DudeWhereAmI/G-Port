import React, { useMemo, useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ExternalLink, Plus } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { SERIES } from "../../theme/tokens";
import { formatKShort, useFormat, useMoneyFormat } from "../../utils/format";
import { minuteLabel } from "../../data/module1Forecast";
import { EMISSION_FACTORS, EmissionFactorVersion } from "../../data/emissionFactors";
import {
  AUX_ENGINE_KG_PER_KWH,
  BALANCE_STATS,
  CALL_RECORDS,
  CallRecord,
  ENERGY_BALANCE,
  IPMVP,
  REPORT_TARGETS,
  SOURCE_KEYS,
  SOURCE_META,
  WHATIF_BASE,
  lineUncertaintyPct,
} from "../../data/module2Carbon";
import { Panel } from "./OverviewTab";

// ---------------------------------------------------------------------------
// C1 – IPMVP savings verification (same numbers as M-3)
// ---------------------------------------------------------------------------

export const IpmvpPanel: React.FC<{ onOpenM3?: () => void }> = ({ onOpenM3 }) => {
  const { t } = useLanguage();
  const { num } = useFormat();
  const { vnd } = useMoneyFormat();
  const data = IPMVP.intervals.map((x) => ({ ...x, saved: x.reporting < x.baseline ? [x.reporting, x.baseline] : [x.baseline, x.baseline] }));
  return (
    <Panel
      id="ipmvp"
      title={t("Savings verification (IPMVP)", "Xác minh tiết kiệm (IPMVP)")}
      note={t(
        `Adjusted baseline (throughput, reefers, temperature) vs. post-dispatch · ${IPMVP.date}`,
        `Mức nền điều chỉnh (sản lượng, reefer, nhiệt độ) so với sau điều độ · ${IPMVP.date}`
      )}
      right={
        onOpenM3 && (
          <button type="button" onClick={onOpenM3} className="px-2.5 py-1.5 rounded-control border border-line text-xs font-medium text-brand hover:bg-blue-50 flex items-center gap-1 whitespace-nowrap cursor-pointer">
            {t("View the M-3 dispatch plan", "Xem lịch điều độ ở M-3")}
            <ExternalLink className="w-3 h-3" />
          </button>
        )
      }
    >
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: t("Grid energy", "Điện lưới"), v: `${num(IPMVP.savedKwh)} kWh/${t("day", "ngày")}` },
          { l: "CO₂e", v: `${num(IPMVP.savedT, 2)} tCO₂e/${t("day", "ngày")}` },
          { l: t("Cost", "Chi phí"), v: `${vnd(IPMVP.savedVnd)}/${t("day", "ngày")}` },
        ].map((x) => (
          <div key={x.l} className="rounded-card bg-emerald-50 border border-emerald-200 p-2.5">
            <div className="text-xs font-medium text-emerald-800">{x.l}</div>
            <div className="font-semibold text-emerald-900 tabular-nums text-sm">{x.v}</div>
          </div>
        ))}
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#EEF0F3" />
            <XAxis dataKey="minute" type="number" domain={[0, 1440]} ticks={Array.from({ length: 13 }, (_, i) => i * 120)} tickFormatter={(m: number) => minuteLabel(m)} fontSize={12} stroke="#94A3B8" tickLine={false} />
            <YAxis domain={[0, 10000]} tickFormatter={(v: number) => formatKShort(v)} fontSize={12} stroke="#94A3B8" tickLine={false} width={40} label={{ value: "kW", position: "top", offset: 8, fontSize: 12 }} />
            <Tooltip formatter={(v: any, k: any) => (k === "saved" ? null : [`${num(Number(v))} kW`, k === "baseline" ? t("Adjusted baseline", "Mức nền điều chỉnh") : t("After dispatch", "Sau điều độ")])} />
            <Legend formatter={(k: any) => (k === "baseline" ? t("Adjusted baseline", "Mức nền điều chỉnh") : k === "reporting" ? t("After dispatch", "Sau điều độ") : t("Verified saving", "Tiết kiệm đã xác minh"))} wrapperStyle={{ fontSize: 12 }} />
            <Area dataKey="saved" fill="#10B981" fillOpacity={0.45} stroke="none" isAnimationActive={false} />
            <Line dataKey="baseline" stroke="#94A3B8" strokeDasharray="4 3" dot={false} strokeWidth={1.75} isAnimationActive={false} />
            <Line dataKey="reporting" stroke="#004B91" dot={false} strokeWidth={2.25} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-muted">
        {t(
          `Peak ${num(IPMVP.peakBefore)} → ${num(IPMVP.peakAfter)} kW. Intervals after the last update are verified as metering arrives.`,
          `Đỉnh ${num(IPMVP.peakBefore)} → ${num(IPMVP.peakAfter)} kW. Các chu kỳ sau lần cập nhật cuối được xác minh khi có số đo.`
        )}
      </div>
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// C2 – versioned emission-factor library
// ---------------------------------------------------------------------------

export const FactorLibrary: React.FC = () => {
  const { t } = useLanguage();
  const { num } = useFormat();
  const [factors, setFactors] = useState<EmissionFactorVersion[]>(EMISSION_FACTORS);
  const [form, setForm] = useState({ value: "", year: "2024", from: "2027-01-01" });
  const [open, setOpen] = useState(false);
  const activeGrid = factors.find((f) => f.kind === "GRID" && f.status === "ACTIVE");
  const lockedOnOld = CALL_RECORDS.filter((r) => (r.status === "LOCKED" || r.status === "SHARED") && r.factorVersion !== activeGrid?.id).length;

  const add = () => {
    const v = Number(form.value.replace(",", "."));
    if (!(v > 0 && v < 2)) return;
    const id = `EF-GRID-${form.year}`;
    setFactors((fs) => [
      {
        id,
        kind: "GRID",
        name: { en: "Vietnam grid EF (location-based)", vn: "Hệ số phát thải lưới điện Việt Nam (location-based)" },
        value: v,
        unit: "kgCO₂e/kWh",
        source: { en: "Entered by carbon accountant (pending publication)", vn: "Kế toán carbon nhập (chờ công bố chính thức)" },
        year: Number(form.year),
        effectiveFrom: form.from,
        status: "ACTIVE",
      },
      ...fs.filter((f) => f.id !== id).map((f) => (f.kind === "GRID" ? { ...f, status: "ARCHIVED" as const } : f)),
    ]);
    setOpen(false);
  };

  return (
    <Panel
      title={t("Emission-factor library (versioned)", "Thư viện hệ số phát thải (có phiên bản)")}
      note={t("Locked records keep their factor version; only new periods use a new version", "Hồ sơ đã khóa giữ hệ số cũ; chỉ kỳ mới áp dụng phiên bản mới")}
      right={
        <button type="button" onClick={() => setOpen((o) => !o)} className="px-2.5 py-1.5 rounded-control bg-brand text-white text-xs font-medium flex items-center gap-1 whitespace-nowrap cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          {t("Add grid EF version", "Thêm phiên bản EF lưới")}
        </button>
      }
    >
      {open && (
        <div className="flex flex-wrap items-end gap-2 bg-slate-50 border border-line rounded-card p-3 text-xs">
          <label className="space-y-0.5">
            <div className="font-medium text-slate-600">{t("Value (kgCO₂e/kWh)", "Giá trị (kgCO₂e/kWh)")}</div>
            <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0,6" className="w-24 px-2 py-1 border border-line rounded-control" />
          </label>
          <label className="space-y-0.5">
            <div className="font-medium text-slate-600">{t("Data year", "Năm số liệu")}</div>
            <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-20 px-2 py-1 border border-line rounded-control" />
          </label>
          <label className="space-y-0.5">
            <div className="font-medium text-slate-600">{t("Effective from", "Hiệu lực từ")}</div>
            <input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="px-2 py-1 border border-line rounded-control" />
          </label>
          <button type="button" onClick={add} className="px-3 py-1.5 rounded-control bg-emerald-600 text-white font-medium cursor-pointer">
            {t("Activate", "Kích hoạt")}
          </button>
        </div>
      )}
      {lockedOnOld > 0 && (
        <div className="rounded-card border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 font-semibold">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" /> {t(`${lockedOnOld} locked records use an older factor version and are kept unchanged.`, `${lockedOnOld} hồ sơ dùng phiên bản cũ và được giữ nguyên.`)}
        </div>
      )}
      <div className="overflow-x-auto border border-line rounded-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="py-2 px-2.5">{t("Factor", "Loại hệ số")}</th>
              <th className="py-2 px-2.5 text-right">{t("Value", "Giá trị")}</th>
              <th className="py-2 px-2.5">{t("Unit", "Đơn vị")}</th>
              <th className="py-2 px-2.5">{t("Source", "Nguồn")}</th>
              <th className="py-2 px-2.5">{t("Year", "Năm")}</th>
              <th className="py-2 px-2.5">{t("Effective", "Hiệu lực")}</th>
              <th className="py-2 px-2.5">{t("Status", "Trạng thái")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...factors, { id: "AUX-ENGINE", kind: "GRID", name: { en: "Ship auxiliary engine (influence only)", vn: "Máy phụ của tàu (chỉ dùng cho phạm vi ảnh hưởng)" }, value: AUX_ENGINE_KG_PER_KWH, unit: "kgCO₂e/kWh", source: { en: "SFOC 220 g/kWh × MGO 3.206", vn: "SFOC 220 g/kWh × MGO 3,206" }, year: 2024, effectiveFrom: "2024-01-01", status: "ACTIVE" } as EmissionFactorVersion].map((f) => (
              <tr key={f.id} className={f.status === "ARCHIVED" ? "text-slate-400" : ""}>
                <td className="py-1.5 px-2.5">
                  {t(f.name.en, f.name.vn)}
                  <div className="font-code text-xs text-slate-400">{f.id}</div>
                </td>
                <td className="py-1.5 px-2.5 text-right tabular-nums font-medium">{num(f.value, f.value < 1 ? 4 : 3)}</td>
                <td className="py-1.5 px-2.5">{f.unit}</td>
                <td className="py-1.5 px-2.5 text-xs">{t(f.source.en, f.source.vn)}</td>
                <td className="py-1.5 px-2.5">{f.year}</td>
                <td className="py-1.5 px-2.5 whitespace-nowrap">{f.effectiveFrom.split("-").reverse().join("/")}</td>
                <td className="py-1.5 px-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${f.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-muted"}`}>
                    {f.status === "ACTIVE" ? t("In use", "Đang dùng") : t("Archived", "Lưu trữ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// C3 – uncertainty
// ---------------------------------------------------------------------------

export const UncertaintyPanel: React.FC<{ calls: CallRecord[] }> = ({ calls }) => {
  const { t } = useLanguage();
  const { num, pct } = useFormat();
  const lines = calls.flatMap((r) => r.lines);
  const total = lines.reduce((a, l) => a + l.kg, 0) || 1;
  const varBy = SOURCE_KEYS.map((k) => ({
    k,
    v: lines.filter((l) => l.source === k).reduce((a, l) => a + (l.kg * lineUncertaintyPct(l)) ** 2, 0),
  }));
  const varTotal = varBy.reduce((a, x) => a + x.v, 0) || 1;
  const u = Math.sqrt(varTotal) / total;
  return (
    <Panel
      title={t(`Uncertainty ±${num(u, 2)}%`, `Độ bất định ±${num(u, 2)}%`)}
      note={t(
        `Meters Class 0.2S · Δbal ${BALANCE_STATS.deltaBalPct}% · allocation model 2.5% · estimates 10% · fuel 1%`,
        `Công tơ Class 0,2S · Δbal ${BALANCE_STATS.deltaBalPct}% · mô hình phân bổ 2,5% · ước tính 10% · nhiên liệu 1%`
      )}
    >
      <div className="space-y-1.5">
        {varBy
          .filter((x) => x.v > 0)
          .sort((a, b) => b.v - a.v)
          .map((x) => (
            <div key={x.k} className="flex items-center gap-2 text-xs">
              <span className="w-32 truncate">{t(SOURCE_META[x.k].name.en, SOURCE_META[x.k].name.vn)}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full" style={{ width: `${(x.v / varTotal) * 100}%`, backgroundColor: SOURCE_META[x.k].color }} />
              </div>
              <span className="w-12 text-right tabular-nums text-slate-600">{pct((x.v / varTotal) * 100, 0)}</span>
            </div>
          ))}
      </div>
      <div className="text-xs text-muted">{t("Share of the variance contributed by each source", "Tỷ trọng đóng góp vào phương sai theo nguồn")}</div>
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// C4 – reduction what-if (scenario, not measured)
// ---------------------------------------------------------------------------

export const ReductionWhatIf: React.FC = () => {
  const { t } = useLanguage();
  const { num, pct } = useFormat();
  const [ops, setOps] = useState(Math.round(WHATIF_BASE.opsSharePct));
  const [elec, setElec] = useState(WHATIF_BASE.electricTractorPct);
  const [pv, setPv] = useState(Math.round(WHATIF_BASE.pvSelfUsePct));
  const [ef, setEf] = useState(WHATIF_BASE.gridEf);

  const calc = useMemo(() => {
    const sumKey = (k: string, field: "quantity" | "kg") => CALL_RECORDS.flatMap((r) => r.lines.filter((l) => l.source === k)).reduce((a, l) => a + l[field], 0);
    const base = (opsPct: number, elecPct: number, pvPct: number, gridEf: number) => {
      const opsKwh = sumKey("OPS", "quantity") * (opsPct / WHATIF_BASE.opsSharePct);
      const tractorL = sumKey("TRACTOR", "quantity") * ((100 - elecPct) / (100 - WHATIF_BASE.electricTractorPct));
      const addedKwh = (sumKey("TRACTOR", "quantity") - tractorL) * WHATIF_BASE.kwhPerDieselL;
      const load = ENERGY_BALANCE.eLoad - sumKey("OPS", "quantity") + opsKwh + addedKwh;
      const grid = load * (1 - pvPct / 100) * (1 + BALANCE_STATS.transformerLossPct / 100);
      const s2 = grid * gridEf;
      const s1 = (sumKey("TUG", "quantity") + tractorL) * 2.68;
      return { s1: (s1 * WHATIF_BASE.annualFactor) / 1000, s2: (s2 * WHATIF_BASE.annualFactor) / 1000, avoided: (opsKwh * AUX_ENGINE_KG_PER_KWH * WHATIF_BASE.annualFactor) / 1000 };
    };
    return { now: base(WHATIF_BASE.opsSharePct, WHATIF_BASE.electricTractorPct, WHATIF_BASE.pvSelfUsePct, WHATIF_BASE.gridEf), next: base(ops, elec, pv, ef) };
  }, [ops, elec, pv, ef]);
  const teuYear = REPORT_TARGETS.teu * WHATIF_BASE.annualFactor;
  const total = (x: { s1: number; s2: number }) => x.s1 + x.s2;
  const data = [
    { name: t("Current", "Hiện tại"), s1: calc.now.s1, s2: calc.now.s2 },
    { name: t("Scenario", "Kịch bản"), s1: calc.next.s1, s2: calc.next.s2 },
  ];
  const sliders = [
    { l: t("Vessels using OPS", "% tàu dùng OPS"), v: ops, set: setOps, min: 0, max: 100, step: 5, d: pct(ops, 0) },
    { l: t("Electric tractors", "% xe đầu kéo chuyển sang điện"), v: elec, set: setElec, min: WHATIF_BASE.electricTractorPct, max: 100, step: 5, d: pct(elec, 0) },
    { l: t("PV self-use (share of load)", "% PV tự dùng (trên phụ tải)"), v: pv, set: setPv, min: 0, max: 40, step: 1, d: pct(pv, 0) },
    { l: t("Future grid EF", "EF lưới tương lai"), v: ef, set: setEf, min: 0.3, max: 0.75, step: 0.01, d: `${num(ef, 2)} kg/kWh` },
  ];
  return (
    <Panel
      title={t("Reduction what-if", "Mô phỏng What-if giảm phát thải")}
      note={t("Scenario, not a measured result · annualised from Dataset v2", "Kịch bản, không phải kết quả đo · quy năm từ Dataset v2")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          {sliders.map((s) => (
            <label key={s.l} className="block space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">{s.l}</span>
                <span className="tabular-nums">{s.d}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-brand cursor-pointer" />
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-card bg-slate-50 border border-line p-2">
              <div className="text-xs font-medium text-muted">tCO₂e/{t("year", "năm")}</div>
              <div className="font-semibold tabular-nums">
                {num(total(calc.now))} → {num(total(calc.next))}
              </div>
            </div>
            <div className="rounded-card bg-slate-50 border border-line p-2">
              <div className="text-xs font-medium text-muted">kgCO₂e/TEU</div>
              <div className="font-semibold tabular-nums">
                {num((total(calc.now) * 1000) / teuYear, 2)} → {num((total(calc.next) * 1000) / teuYear, 2)}
              </div>
            </div>
            <div className="rounded-card bg-violet-50 border border-violet-200 p-2">
              <div className="text-xs font-medium text-violet-800">{t("Ship emissions avoided (influence)", "Phát thải tàu tránh được (ảnh hưởng)")}</div>
              <div className="font-semibold tabular-nums text-violet-900">{num(calc.next.avoided)} t/{t("yr", "năm")}</div>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" fontSize={12} stroke="#94A3B8" tickFormatter={(v: number) => num(v)} />
                <YAxis type="category" dataKey="name" fontSize={12} stroke="#94A3B8" width={70} />
                <Tooltip formatter={(v: any, k: any) => [`${num(Number(v))} tCO₂e/${t("yr", "năm")}`, k === "s1" ? "Scope 1" : "Scope 2"]} />
                <Legend formatter={(k: any) => (k === "s1" ? "Scope 1" : "Scope 2")} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="s2" stackId="a" fill={SERIES.scope2} />
                <Bar dataKey="s1" stackId="a" fill={SERIES.scope1} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted">
            {t(
              "More OPS raises the port's Scope 2 but removes ship auxiliary-engine emissions (carriers' Scope 3).",
              "Tăng OPS làm tăng Scope 2 của cảng nhưng loại bỏ phát thải máy phụ của tàu (Scope 3 của hãng tàu)."
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
};
