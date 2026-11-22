/**
 * Module 2 exports: vessel-call emission record (printable PDF / JSON),
 * ledger CSV, and the reporting form as an Excel workbook (SpreadsheetML).
 */
import type { AppLanguage } from "../context/LanguageContext";
import {
  CALL_RECORDS,
  CallRecord,
  LEDGER_TOTALS,
  METHOD_VERSION,
  PORT_NAME,
  REPORT_TARGETS,
  SOURCE_META,
  FACILITY_SOURCES,
  ENERGY_BALANCE,
  PERIOD,
  recordCanonicalJson,
  stamp,
} from "../data/module2Carbon";
import { EMISSION_FACTORS } from "../data/emissionFactors";
import { formatNumber } from "./format";

const L = (lang: AppLanguage, en: string, vn: string) => (lang === "VN" ? vn : en);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The canonical record file – its SHA-256 equals the ledger hash. */
export function downloadRecordJson(r: CallRecord) {
  download(recordCanonicalJson(r), `${r.recordNo}.json`, "application/json");
}

export function openRecordPdf(r: CallRecord, lang: AppLanguage): boolean {
  const n = (v: number, dd = 0) => formatNumber(v, lang, dd);
  const level = (l: string) => (l === "MEASURED" ? L(lang, "Measured", "Đo trực tiếp") : l === "ALLOCATED" ? L(lang, "Allocated", "Phân bổ") : L(lang, "Estimated", "Ước tính"));
  const rows = r.lines
    .map(
      (l) => `<tr><td>${esc(L(lang, SOURCE_META[l.source].name.en, SOURCE_META[l.source].name.vn))} <span class="b ${l.level}">${level(l.level)}</span></td>
<td>${n(l.quantity)} ${l.unit}</td><td>${n(l.effectiveFactor, 4)} kgCO₂e/${l.unit}<br><small>${l.factorId}</small></td><td><b>${n(l.kg)}</b></td></tr>`
    )
    .join("");
  const html = `<!doctype html><html lang="${lang === "VN" ? "vi" : "en"}"><head><meta charset="utf-8"><title>${r.recordNo}</title>
<style>body{font-family:Inter,system-ui,sans-serif;color:#0f172a;margin:28px;font-size:12px}h1{font-size:18px;margin:0;color:#004B91}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #e2e8f0;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f1f5f9}
td:nth-child(n+2),th:nth-child(n+2){text-align:right}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 18px;margin:12px 0}
.grid span{display:block;color:#64748b;font-size:10px}.b{font-size:10px;border-radius:4px;padding:1px 4px;margin-left:4px}.MEASURED{background:#d1fae5}.ALLOCATED{background:#dbeafe}.ESTIMATED{background:#fef3c7}
.tot{margin-top:10px;font-size:14px}.hash{font-family:ui-monospace,monospace;font-size:10px;word-break:break-all;background:#f8fafc;padding:6px;border:1px solid #e2e8f0}
@media print{body{margin:12mm}}</style></head><body>
<h1>${esc(L(lang, "Vessel-call emission record (GLEC · ISO 14083)", "Hồ sơ phát thải lượt tàu (GLEC · ISO 14083)"))}</h1>
<div>${esc(L(lang, PORT_NAME.en, PORT_NAME.vn))} · <span style="font-family:monospace">${r.recordNo}</span></div>
<div class="grid">
<div><span>${L(lang, "Vessel", "Tàu")}</span><b>${esc(r.vessel)}</b> (IMO ${r.imo})</div>
<div><span>${L(lang, "Voyage / carrier", "Chuyến / hãng tàu")}</span>${esc(r.voyage)} · ${esc(r.carrier)}</div>
<div><span>${L(lang, "Berth & window", "Cầu bến & thời gian")}</span>${r.berth} · ${stamp(r.etaMin)} → ${stamp(r.etdMin)}</div>
<div><span>TEU</span><b>${n(r.teu)}</b></div>
<div><span>${L(lang, "Electricity / fuel", "Điện / nhiên liệu")}</span>${n(r.electricityKwh)} kWh · ${n(r.fuelL)} L</div>
<div><span>${L(lang, "Directly measured", "Đo trực tiếp")}</span>${n(r.measuredPct, 1)}%</div>
</div>
<table><thead><tr><th>${L(lang, "Source", "Nguồn")}</th><th>${L(lang, "Quantity", "Lượng")}</th><th>${L(lang, "Factor (version)", "Hệ số (phiên bản)")}</th><th>kgCO₂e</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot">${L(lang, "Total", "Tổng")}: <b>${n(r.totalKg / 1000, 2)} tCO₂e</b> (Scope 1 ${n(r.scope1Kg)} kg · Scope 2 ${n(r.scope2Kg)} kg) · ${L(lang, "Intensity", "Cường độ")} <b>${n(r.intensity, 2)} kgCO₂e/TEU</b> · ±${n(r.uncertaintyPct, 1)}%</div>
<p><b>${L(lang, "Method", "Phương pháp")}:</b> ${esc(METHOD_VERSION)}; ${L(lang, "grid EF", "EF lưới")} 0,6592 kgCO₂e/kWh (2023) × ${L(lang, "grid share", "tỷ lệ điện lưới")} ${n(ENERGY_BALANCE.gridShare * 100, 1)}%; ${L(lang, "diesel", "dầu DO")} 2,68 kgCO₂e/L.</p>
${r.opsKw > 0 ? `<p><b>${L(lang, "Influence (carrier Scope 3)", "Ảnh hưởng (Scope 3 của hãng tàu)")}:</b> ${L(lang, "auxiliary-engine emissions avoided by OPS ≈", "phát thải máy phụ tránh được nhờ OPS ≈")} ${n(r.avoidedAuxKg)} kgCO₂e – ${L(lang, "not added to the port inventory", "không cộng vào kiểm kê của cảng")}.</p>` : ""}
<p><b>SHA-256</b></p><div class="hash">${r.hash}</div>
<p style="color:#64748b;font-size:10px">${L(lang, "Verify: upload the record file (.json) to the integrity tool in Methodology & Audit.", "Kiểm tra: tải tệp hồ sơ (.json) lên công cụ kiểm tra toàn vẹn ở tab Phương pháp & Kiểm toán.")}</p>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

export function downloadLedgerCsv(records: CallRecord[] = CALL_RECORDS) {
  const head = ["record_no", "vessel", "imo", "voyage", "carrier", "berth", "from", "to", "teu", "source", "quantity", "unit", "factor_id", "effective_factor", "kgco2e", "data_level", "status", "sha256"];
  const lines = [head.join(",")];
  const q = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  for (const r of records)
    for (const l of r.lines)
      lines.push(
        [r.recordNo, r.vessel, r.imo, r.voyage, r.carrier, r.berth, stamp(r.etaMin), stamp(r.etdMin), r.teu, l.source, l.quantity.toFixed(1), l.unit, l.factorId, l.effectiveFactor.toFixed(5), l.kg, l.level, r.status, r.hash]
          .map(q)
          .join(",")
      );
  download("﻿" + lines.join("\r\n"), `gport-m2-ledger-${PERIOD.fromIso}_${PERIOD.toIso}.csv`, "text/csv;charset=utf-8");
}

/** Reporting form as Excel 2003 XML (opens in Excel without extra libraries). */
export function downloadReportingExcel(formId: string, formName: string, lang: AppLanguage) {
  const cell = (v: string | number) =>
    typeof v === "number" ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>` : `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  const row = (...xs: (string | number)[]) => `<Row>${xs.map(cell).join("")}</Row>`;
  const sources = Object.values(FACILITY_SOURCES);
  const rows = [
    row(formName),
    row(L(lang, "Facility", "Cơ sở"), L(lang, PORT_NAME.en, PORT_NAME.vn)),
    row(L(lang, "Period (Dataset v2)", "Kỳ (Dataset v2)"), `${PERIOD.fromIso} – ${PERIOD.toIso}`),
    row(L(lang, "Method", "Phương pháp"), METHOD_VERSION),
    row(""),
    row(L(lang, "Source", "Nguồn"), "Scope", "kgCO2e"),
    ...Object.entries(FACILITY_SOURCES).map(([k, s]) => row(L(lang, s.name.en, s.name.vn), k === "TUG" || k === "TRACTOR" ? 1 : 2, Math.round(s.kg))),
    row(L(lang, "Facility total", "Tổng cơ sở"), "", Math.round(sources.reduce((a, s) => a + s.kg, 0))),
    row(""),
    row(L(lang, "Vessel calls", "Lượt tàu"), LEDGER_TOTALS.calls),
    row("TEU", REPORT_TARGETS.teu),
    row(L(lang, "Allocated to calls (kgCO2e)", "Phân bổ cho lượt tàu (kgCO2e)"), LEDGER_TOTALS.totalKg),
    row(L(lang, "Intensity (kgCO2e/TEU)", "Cường độ (kgCO2e/TEU)"), Math.round(LEDGER_TOTALS.intensity * 100) / 100),
    row(""),
    row(L(lang, "Emission factors", "Hệ số phát thải"), L(lang, "Value", "Giá trị"), L(lang, "Unit", "Đơn vị"), L(lang, "Version", "Phiên bản"), L(lang, "Status", "Trạng thái")),
    ...EMISSION_FACTORS.map((f) => row(L(lang, f.name.en, f.name.vn), f.value, f.unit, f.id, f.status)),
  ].join("");
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${esc(formId)}"><Table>${rows}</Table></Worksheet></Workbook>`;
  download(xml, `gport-${formId.toLowerCase()}-${PERIOD.toIso}.xls`, "application/vnd.ms-excel");
}
