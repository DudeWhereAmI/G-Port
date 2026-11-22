import React, { useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, FilePlus2, Link2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { AUDIT_LEDGER, CallRecord, COMPLIANCE, ISO_CHECKLIST, REPORT_FORMS, dayIso, stamp } from "../../data/module2Carbon";
import { sha256Hex } from "../../utils/sha256";
import { downloadReportingExcel } from "../../utils/carbonExport";
import { Panel } from "./OverviewTab";
import { EmptyState } from "./CallsTab";

/** B4 – deadlines, legal forms, ISO 14064-1 readiness and carrier sharing. */
export const ReportingTab: React.FC<{ calls: CallRecord[]; onOpenCall: (r: CallRecord) => void }> = ({ calls, onOpenCall }) => {
  const { t, lang } = useLanguage();
  const { pct } = useFormat();
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const shared = calls.filter((r) => r.status === "SHARED");

  const statusLabel = (s: (typeof REPORT_FORMS)[number]["status"]) =>
    s === "READY" ? t("Ready", "Sẵn sàng") : s === "IN_PROGRESS" ? t("In progress", "Đang hoàn thiện") : t("Not yet due", "Chưa đến kỳ");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
        <Panel title={t("Next filing deadline", "Hạn nộp gần nhất")}>
          <div className="flex items-center gap-3">
            <CalendarClock className="w-10 h-10 text-brand" />
            <div>
              <div className="text-3xl font-semibold text-ink tabular-nums">
                {COMPLIANCE.daysLeft} <span className="text-sm font-medium text-muted">{t("days", "ngày")}</span>
              </div>
              <div className="text-xs text-slate-700">
                {t("2026 GHG mitigation report – due 31/03/2027 (Decree 119/2025)", "Báo cáo giảm nhẹ KNK năm 2026 – hạn 31/03/2027 (NĐ 119/2025)")}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span>{t("2026 data completeness", "Mức hoàn thiện dữ liệu 2026")}</span>
              <span className="tabular-nums">{pct(COMPLIANCE.dataCompletenessPct)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-brand" style={{ width: `${COMPLIANCE.dataCompletenessPct}%` }} />
            </div>
          </div>
        </Panel>
        <Panel title={t("Regulatory forms", "Biểu mẫu báo cáo")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {REPORT_FORMS.map((f) => (
              <div key={f.id} className="border border-line rounded-card p-3 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-medium text-brand">{f.legal}</div>
                  <div className="text-xs font-medium text-ink">{t(f.name.en, f.name.vn)}</div>
                  <div className="text-xs text-muted">
                    {drafts[f.id] ? t("Draft created", "Đã tạo bản nháp") : statusLabel(f.status)} · {t("due", "hạn")} {f.due.split("-").reverse().join("/")}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDrafts((d) => ({ ...d, [f.id]: true }))}
                    className="px-2 py-1 rounded-control border border-line text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <FilePlus2 className="w-3 h-3" />
                    {t("Create draft", "Tạo bản nháp")}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadReportingExcel(f.id, `${f.legal} – ${t(f.name.en, f.name.vn)}`, lang)}
                    className="px-2 py-1 rounded-control bg-brand text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    {t("Export", "Xuất")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title={t("ISO 14064-1:2018 readiness", "Sẵn sàng ISO 14064-1:2018")} note={t("Third-party verification with GHG Protocol", "Xác minh bên thứ ba cùng GHG Protocol")}>
          <ul className="space-y-1.5">
            {ISO_CHECKLIST.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-xs">
                {c.ok ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />}
                <div>
                  <div className="font-medium text-ink">{t(c.name.en, c.name.vn)}</div>
                  <div className="text-xs text-muted">{t(c.note.en, c.note.vn)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t("Shared with carriers", "Chia sẻ hãng tàu")}>
          {shared.length === 0 ? (
            <EmptyState text={t("No shared records for this filter.", "Không có hồ sơ đã chia sẻ theo bộ lọc.")} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {shared.map((r, i) => {
                const ev = AUDIT_LEDGER.find((e) => e.action.en.startsWith(`${r.recordNo} shared`));
                const confirmed = i % 2 === 0;
                return (
                  <li key={r.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <button type="button" onClick={() => onOpenCall(r)} className="text-left cursor-pointer">
                      <div className="font-medium text-ink hover:text-brand">
                        {r.vessel} <span className="font-code text-xs text-slate-400">{r.recordNo}</span>
                      </div>
                      <div className="text-xs text-muted">
                        {r.sharedWith} · {ev ? stamp(ev.minute) : "—"} ·{" "}
                        <span className={confirmed ? "text-success font-medium" : "text-blue-700 font-medium"}>
                          {confirmed ? t("Confirmed", "Đã xác nhận") : t("Viewed", "Đã xem")}
                        </span>
                      </div>
                      {links[r.id] && <div className="font-code text-xs text-brand break-all">{links[r.id]}</div>}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLinks((l) => ({
                          ...l,
                          [r.id]: `https://share.gport.vn/r/${sha256Hex(r.hash + "|share|" + dayIso(30)).slice(0, 16)}?exp=${dayIso(30)}`,
                        }))
                      }
                      className="self-start px-2 py-1 rounded-control border border-line text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <Link2 className="w-3 h-3" />
                      {t("Time-limited link (30 d)", "Tạo link chia sẻ có thời hạn (30 ngày)")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};
