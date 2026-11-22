/**
 * C5 – export the 24h forecast (96 points) as CSV or as a printable PDF report.
 */
import type { AppLanguage } from "../context/LanguageContext";
import {
  FORECAST_DATE,
  FORECAST_VERSION,
  ISSUE_MINUTE,
  LOCK_MINUTE,
  MODEL_METRICS,
  SUBSTATION_LIMIT_KW,
  ForecastResult,
  INTERVAL_MINUTES,
  minuteLabel,
} from "../data/module1Forecast";
import { formatNumber } from "./format";

export interface ExportMeta {
  lang: AppLanguage;
  /** true when the result comes from a what-if simulation */
  simulated: boolean;
}

const L = (lang: AppLanguage, en: string, vn: string) => (lang === "VN" ? vn : en);

function metaLines(r: ForecastResult, m: ExportMeta): [string, string][] {
  const { lang } = m;
  return [
    [L(lang, "Report", "Báo cáo"), L(lang, "G-Port 24h load forecast (Module 1)", "Báo cáo dự báo phụ tải 24h G-Port (Module 1)")],
    [L(lang, "Forecast day", "Ngày dự báo"), FORECAST_DATE.iso],
    [L(lang, "Issued at", "Lập lúc"), `${minuteLabel(ISSUE_MINUTE)} ${L(lang, "previous day", "hôm trước")}`],
    [L(lang, "Last rolling update", "Cập nhật cuốn chiếu lần cuối"), minuteLabel(LOCK_MINUTE)],
    [L(lang, "Forecast version", "Phiên bản dự báo"), `#${FORECAST_VERSION}${m.simulated ? L(lang, " (what-if simulation)", " (mô phỏng what-if)") : ""}`],
    [L(lang, "Model", "Mô hình"), `${MODEL_METRICS.modelVersion} (w_MLP=${MODEL_METRICS.mlpWeight}, w_LightGBM=${MODEL_METRICS.lgbmWeight})`],
    [L(lang, "Accuracy", "Độ chính xác"), `RMSE ${MODEL_METRICS.rmseKw} kW; MAPE ${MODEL_METRICS.mapePct}%`],
    [L(lang, "Substation limit (net grid)", "Giới hạn trạm (điện lưới thuần)"), `${SUBSTATION_LIMIT_KW} kW`],
    [L(lang, "TOU preset", "Preset TOU"), L(lang, r.preset.name.en, r.preset.name.vn)],
  ];
}

const CSV_HEADER = ["start", "end", "p10_kw", "p50_kw", "p90_kw", "pv_kw", "net_grid_kw", "p_peak_pct", "plan_basis", "tou", "actual_kw", "locked"];

export function buildForecastCsv(r: ForecastResult, m: ExportMeta): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines: string[] = metaLines(r, m).map(([k, v]) => `# ${esc(k)},${esc(v)}`);
  lines.push(CSV_HEADER.join(","));
  for (const p of r.points) {
    lines.push(
      [
        p.label,
        minuteLabel(p.minute + INTERVAL_MINUTES),
        p.p10,
        p.p50,
        p.p90,
        p.pv,
        p.netGrid,
        p.locked ? "" : (p.pPeak * 100).toFixed(2),
        p.locked ? "LOCKED" : p.pPeak >= 0.1 ? "P90" : "P50",
        p.tou,
        p.actual ?? "",
        p.locked ? 1 : 0,
      ].join(",")
    );
  }
  return "﻿" + lines.join("\r\n");
}

/** Triggers a CSV download in the browser. */
export function downloadForecastCsv(r: ForecastResult, m: ExportMeta): void {
  const blob = new Blob([buildForecastCsv(r, m)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gport-m1-forecast-${FORECAST_DATE.iso}-v${FORECAST_VERSION}${m.simulated ? "-whatif" : ""}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const htmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Opens a print-ready report (Save as PDF from the print dialog). Returns false if the popup was blocked. */
export function openForecastPdf(r: ForecastResult, m: ExportMeta): boolean {
  const { lang } = m;
  const n = (v: number, d = 0) => formatNumber(v, lang, d);
  const k = r.kpis;
  const touLabel = (b: string) =>
    b === "PEAK" ? L(lang, "Peak", "Cao điểm") : b === "OFF_PEAK" ? L(lang, "Off-peak", "Thấp điểm") : L(lang, "Normal", "Bình thường");
  const rows = r.points
    .map((p) => {
      const warn = !p.locked && p.pPeak >= 0.1;
      return `<tr class="${p.locked ? "locked" : warn ? "warn" : ""}"><td>${p.label}–${minuteLabel(p.minute + INTERVAL_MINUTES)}</td><td>${n(p.p10)}</td><td><b>${n(p.p50)}</b></td><td>${n(p.p90)}</td><td>${n(p.pv)}</td><td><b>${n(p.netGrid)}</b></td><td>${
        p.locked ? L(lang, "Locked", "Đã khóa") : `${n(p.pPeak * 100, 1)}%`
      }</td><td>${p.actual === null ? "" : n(p.actual)}</td><td>${touLabel(p.tou)}</td></tr>`;
    })
    .join("");
  const meta = metaLines(r, m)
    .map(([a, b]) => `<div><span>${htmlEsc(a)}</span><b>${htmlEsc(b)}</b></div>`)
    .join("");
  const alerts = k.alertWindows.length
    ? k.alertWindows.map((w) => `${w.timeWindow} (${n(w.netGridKw)} kW @${w.peakTime})`).join(" · ")
    : L(lang, "none", "không có");

  const html = `<!doctype html><html lang="${lang === "VN" ? "vi" : "en"}"><head><meta charset="utf-8"><title>G-Port M-1 ${FORECAST_DATE.iso} #${FORECAST_VERSION}</title>
<style>
body{font-family:Inter,system-ui,sans-serif;color:#0f172a;margin:24px;font-size:11px}
h1{font-size:18px;margin:0 0 4px;color:#004B91}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 16px;margin:12px 0;padding:10px;border:1px solid #cbd5e1;border-radius:8px}
.meta div{display:flex;flex-direction:column}.meta span{color:#64748b;font-size:10px}
.kpi{margin:8px 0 12px;font-size:12px}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #e2e8f0;padding:2px 6px;text-align:right}
th{background:#f1f5f9}td:first-child,th:first-child{text-align:left}
tr.locked td{color:#64748b}tr.warn td{background:#fff7ed}
@media print{body{margin:10mm}tr{page-break-inside:avoid}}
</style></head><body>
<h1>${htmlEsc(L(lang, "24h Load Forecast Report – Module 1", "Báo cáo dự báo phụ tải 24h – Module 1"))}</h1>
<div>${htmlEsc(L(lang, FORECAST_DATE.en, FORECAST_DATE.vn))}</div>
<div class="meta">${meta}</div>
<div class="kpi">${htmlEsc(L(lang, "Peak net grid", "Đỉnh điện lưới thuần"))}: <b>${n(k.peakNetGrid.netGrid)} kW</b> @${k.peakNetGrid.label} · ${htmlEsc(
    L(lang, "Alert windows", "Khung cảnh báo")
  )}: <b>${htmlEsc(alerts)}</b> · ${htmlEsc(L(lang, "Intervals planned on P90", "Chu kỳ lập kế hoạch theo P90"))}: <b>${k.switchIntervals}</b></div>
<table><thead><tr><th>${htmlEsc(L(lang, "Interval", "Chu kỳ"))}</th><th>P10 (kW)</th><th>P50 (kW)</th><th>P90 (kW)</th><th>PV (kW)</th><th>${htmlEsc(
    L(lang, "Net grid (kW)", "Lưới thuần (kW)")
  )}</th><th>p_peak</th><th>${htmlEsc(L(lang, "Metered (kW)", "Thực đo (kW)"))}</th><th>TOU</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
