import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Link as LinkIcon, ShieldCheck, Upload, XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { AUDIT_LEDGER, CALL_RECORDS, CallRecord, stamp, verifyChain } from "../../data/module2Carbon";
import { sha256Hex } from "../../utils/sha256";
import { Panel } from "./OverviewTab";

/** B5 – boundary matrix, calculation flow, hash-chain ledger and integrity check. */
export const MethodTab: React.FC<{ onOpenCall: (r: CallRecord) => void; top?: React.ReactNode; bottom?: React.ReactNode }> = ({ onOpenCall, top, bottom }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ ok: boolean; record?: CallRecord; hash: string; via: "file" | "hash" } | null>(null);
  const chainOk = verifyChain();

  const check = (hash: string, via: "file" | "hash") => {
    const h = hash.trim().toLowerCase().replace(/^0x/, "");
    const record = CALL_RECORDS.find((r) => r.hash === h);
    const inLedger = AUDIT_LEDGER.some((e) => e.payloadHash === h || e.hash === h);
    setResult({ ok: !!record || inLedger, record, hash: h, via });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    check(sha256Hex(text), "file");
  };

  const columns: { title: string; tone: string; items: string[] }[] = [
    {
      title: t("Measure (Scope 1 & 2 of the port)", "Đo lường (Scope 1 & 2 của cảng)"),
      tone: "border-blue-300 bg-blue-50/50",
      items: [t("Grid electricity – 6 feeders", "Điện lưới – 6 lộ"), t("Shore power (OPS) meters", "Công tơ điện bờ (OPS)"), t("Tug diesel", "Dầu tàu lai"), t("Diesel tractors", "Xe đầu kéo diesel"), t("PV generation (zero-emission supply)", "Điện mặt trời (nguồn không phát thải)")],
    },
    {
      title: t("Control (dispatchable loads, M-3)", "Kiểm soát (phụ tải điều độ, M-3)"),
      tone: "border-emerald-300 bg-emerald-50/50",
      items: [t("e-ITV charging", "Sạc e-ITV"), t("Battery swap station", "Trạm đổi pin"), t("Reefer pre-cooling", "Reefer làm lạnh trước"), t("e-RTG eco-idle", "e-RTG chờ tiết kiệm"), t("Warehouse lighting & HVAC", "Chiếu sáng & điều hòa kho")],
    },
    {
      title: t("Influence (carriers' Scope 3)", "Ảnh hưởng (Scope 3 của hãng tàu)"),
      tone: "border-violet-300 bg-violet-50/50",
      items: [t("Ship auxiliary engines avoided via OPS", "Máy phụ của tàu tránh được nhờ OPS"), t("Vessel fuel at sea (IMO DCS – ship's system)", "Nhiên liệu tàu trên biển (IMO DCS – hệ thống của tàu)"), t("External trucks at the gate", "Xe tải ngoài tại cổng")],
    },
  ];
  const steps = [
    t("Input layer", "Lớp đầu vào"),
    t("Balance & reconciliation", "Cân bằng & đối soát"),
    "Scope 1 / 2",
    t("Vessel-call allocation", "Phân bổ lượt tàu"),
    t("SHA-256 lock", "Khóa SHA-256"),
    t("Reporting", "Báo cáo"),
  ];

  return (
    <div className="space-y-4">
      {top}
      <Panel title={t("Boundary: measure – control – influence", "Ranh giới: Đo lường – Kiểm soát – Ảnh hưởng")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {columns.map((c) => (
            <div key={c.title} className={`rounded-card border-2 p-3 ${c.tone}`}>
              <div className="text-xs font-semibold text-ink mb-2">{c.title}</div>
              <ul className="space-y-1">
                {c.items.map((i) => (
                  <li key={i} className="text-xs bg-white border border-line rounded-control px-2 py-1">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={t("Calculation flow", "Quy trình tính")}>
        <div className="flex flex-wrap items-center gap-1.5">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <ArrowRight className="w-4 h-4 text-slate-400" />}
              <span className="px-3 py-1.5 rounded-card bg-slate-900 text-white text-xs font-medium">
                {i + 1}. {s}
              </span>
            </React.Fragment>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel
          title={t("Integrity ledger (hash chain)", "Sổ cái toàn vẹn SHA-256 (chuỗi hash)")}
          note={t("Each entry contains the hash of the previous one", "Mỗi bản ghi chứa hash của bản ghi trước")}
          right={
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${chainOk ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {chainOk ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" /> : <XCircle className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />} {chainOk ? t(`Chain intact · ${AUDIT_LEDGER.length} entries`, `Chuỗi nguyên vẹn · ${AUDIT_LEDGER.length} bản ghi`) : t("Chain broken", "Chuỗi bị phá vỡ")}
            </span>
          }
        >
          <div className="overflow-x-auto border border-line rounded-card max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0">
                <tr>
                  <th className="py-2 px-2.5">{t("Time", "Thời điểm")}</th>
                  <th className="py-2 px-2.5">{t("Action", "Hành động")}</th>
                  <th className="py-2 px-2.5">{t("By", "Người / hệ thống")}</th>
                  <th className="py-2 px-2.5">{t("Method", "Phiên bản PP")}</th>
                  <th className="py-2 px-2.5">{t("prev → hash", "hash trước → hash")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...AUDIT_LEDGER].reverse().map((e) => (
                  <tr key={e.hash}>
                    <td className="py-1.5 px-2.5 whitespace-nowrap">{stamp(e.minute)}</td>
                    <td className="py-1.5 px-2.5">{t(e.action.en, e.action.vn)}</td>
                    <td className="py-1.5 px-2.5 text-slate-600">{t(e.actor.en, e.actor.vn)}</td>
                    <td className="py-1.5 px-2.5 text-xs text-muted">v1.3</td>
                    <td className="py-1.5 px-2.5 font-code text-xs text-slate-600 whitespace-nowrap">
                      {e.prevHash.slice(0, 8)} → <b className="text-ink">{e.hash.slice(0, 8)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={t("Integrity check", "Kiểm tra toàn vẹn")} note={t("Upload a record file (.json) or paste a SHA-256", "Tải tệp hồ sơ (.json) lên hoặc dán mã SHA-256")}>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-card py-4 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            {t("Choose record file", "Chọn tệp hồ sơ")}
            <input type="file" accept=".json,application/json,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <div className="flex gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="SHA-256…"
              className="flex-1 min-w-0 px-2 py-1.5 border border-line rounded-control font-code text-xs focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button type="button" onClick={() => check(input, "hash")} className="px-3 py-1.5 rounded-control bg-brand text-white text-xs font-medium cursor-pointer">
              {t("Check", "Kiểm tra")}
            </button>
          </div>
          {result && (
            <div className={`rounded-card border-2 p-3 text-xs ${result.ok ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
              <div className={`font-semibold ${result.ok ? "text-emerald-800" : "text-red-800"}`}>
                {result.ok ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" /> : <XCircle className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />}
                {result.ok ? t("Matches the ledger", "Khớp với sổ cái") : t("Not found – the content has been altered", "Không khớp – nội dung đã bị thay đổi")}
              </div>
              {result.record && (
                <button type="button" onClick={() => onOpenCall(result.record!)} className="text-xs text-brand font-medium flex items-center gap-1 mt-1 cursor-pointer">
                  <LinkIcon className="w-3 h-3" />
                  {result.record.recordNo} · {result.record.vessel}
                </button>
              )}
              <div className="font-code text-xs text-muted break-all mt-1">{result.hash}</div>
            </div>
          )}
          <div className="text-xs text-muted flex items-start gap-1">
            <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
            {t("Download a record file from any call drawer, then upload it here; edit one character to see the check fail.", "Tải tệp hồ sơ từ chi tiết lượt tàu rồi tải lên đây; sửa một ký tự để thấy kiểm tra thất bại.")}
          </div>
        </Panel>
      </div>
      {bottom}
    </div>
  );
};
