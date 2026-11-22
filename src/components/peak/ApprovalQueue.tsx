import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat, useMoneyFormat } from "../../utils/format";
import { BilingualText, EV_FLEET, INTERVAL_MINUTES, NOW_MINUTE, minuteLabel } from "../../data/module1Forecast";
import { ApprovalState, DispatchResult, FlexGroupId } from "../../data/module3PeakShaving";
import { REEFER_BAND } from "./ConstraintPanel";

export const APPROVAL_GROUPS: FlexGroupId[] = ["ITV", "REEFER", "SWAP", "HVAC"];

export const REJECT_REASONS: { id: string; label: BilingualText }[] = [
  { id: "OPS_PRIORITY", label: { en: "Operational priority (urgent vessel)", vn: "Ưu tiên tác nghiệp (tàu gấp)" } },
  { id: "CARGO_RISK", label: { en: "Reefer cargo risk", vn: "Rủi ro hàng lạnh" } },
  { id: "FLEET", label: { en: "Not enough ready tractors", vn: "Thiếu xe sẵn sàng" } },
  { id: "MAINTENANCE", label: { en: "Equipment under maintenance", vn: "Thiết bị đang bảo trì" } },
  { id: "OTHER", label: { en: "Other", vn: "Khác" } },
];

export interface ApprovalLogEntry {
  minute: number;
  group: FlexGroupId;
  action: "APPROVED" | "REJECTED";
  reasonId?: string;
}

/** Longest contiguous run of reductions for a group → [from, to). */
export function longestRun(result: DispatchResult, key: FlexGroupId): [number, number] | null {
  let best: [number, number] | null = null;
  let start = -1;
  result.intervals.forEach((x, i) => {
    const on = x.adjust[key] < 0;
    if (on && start < 0) start = i;
    if ((!on || i === result.intervals.length - 1) && start >= 0) {
      const end = on ? i + 1 : i;
      if (!best || end - start > best[1] - best[0]) best = [start, end];
      start = -1;
    }
  });
  return best;
}

export function useRecommendation() {
  const { t } = useLanguage();
  const { num, kw } = useFormat();
  return (result: DispatchResult, g: FlexGroupId): { action: string; safety: string } => {
    const run = longestRun(result, g);
    const from = run ? minuteLabel(result.intervals[run[0]].minute) : "—";
    const to = run ? minuteLabel(result.intervals[run[1] - 1].minute + INTERVAL_MINUTES) : "—";
    const st = result.groupStats[g];
    if (g === "ITV") {
      const hours = run ? ((run[1] - run[0]) * INTERVAL_MINUTES) / 60 : 0;
      const minSoc = Math.max(35, Math.round(90 - 11 * hours));
      const slice = run ? result.intervals.slice(run[0], run[1]) : result.intervals;
      const worst = slice.reduce((m, x) => (x.itvReadyVehicles - x.itvRequiredVehicles < m.itvReadyVehicles - m.itvRequiredVehicles ? x : m), slice[0]);
      return {
        action: t(
          `Defer charging of ${result.itvDeferredVehicles} e-ITV (${from}–${to}) to 00:00–05:00`,
          `Hoãn sạc ${result.itvDeferredVehicles} xe e-ITV (${from}–${to}) sang 00:00–05:00`
        ),
        safety: t(
          `Lowest battery ${minSoc}% · still ready ${worst.itvReadyVehicles}/${worst.itvRequiredVehicles} tractors`,
          `Pin thấp nhất còn ${minSoc}% · vẫn sẵn sàng ${worst.itvReadyVehicles}/${worst.itvRequiredVehicles} xe`
        ),
      };
    }
    if (g === "REEFER")
      return {
        action: t(
          `Pre-cool, then cut up to ${kw(st.maxReduceKw)} with staggered compressors (${from}–${to})`,
          `Làm lạnh trước, rồi giảm tối đa ${kw(st.maxReduceKw)} bằng so le máy nén (${from}–${to})`
        ),
        safety: t(
          `≤ 45 min per sub-group · cargo within ${num(REEFER_BAND.min, 1)}…${num(REEFER_BAND.max, 1)} °C`,
          `≤ 45 phút mỗi nhóm con · hàng trong ${num(REEFER_BAND.min, 1)}…${num(REEFER_BAND.max, 1)} °C`
        ),
      };
    if (g === "SWAP")
      return {
        action: t(`Defer swap-station charging ${kw(st.maxReduceKw)} (${from}–${to})`, `Hoãn sạc trạm đổi pin ${kw(st.maxReduceKw)} (${from}–${to})`),
        safety: t("≥ 4 charged packs kept in stock", "Luôn giữ ≥ 4 bộ pin đã sạc"),
      };
    return {
      action: t(`Warehouse HVAC +1.5 °C & corridor dimming (${from}–${to})`, `Điều hòa kho +1,5 °C & giảm sáng hành lang (${from}–${to})`),
      safety: t("Indoor ≤ 26 °C · illuminance ≥ 200 lux", "Trong nhà ≤ 26 °C · độ rọi ≥ 200 lux"),
    };
  };
}

interface ApprovalQueueProps {
  result: DispatchResult;
  approvals: Record<FlexGroupId, ApprovalState>;
  log: ApprovalLogEntry[];
  onDecide: (g: FlexGroupId, action: "APPROVED" | "REJECTED", reasonId?: string) => void;
  groupName: (g: FlexGroupId) => string;
}

/** B6 – human-in-the-loop approval queue. */
export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ result, approvals, log, onDecide, groupName }) => {
  const { t } = useLanguage();
  const { kw } = useFormat();
  const { vnd } = useMoneyFormat();
  const rec = useRecommendation();
  const [rejecting, setRejecting] = useState<FlexGroupId | null>(null);
  const [reason, setReason] = useState(REJECT_REASONS[0].id);
  const order = [...APPROVAL_GROUPS].sort((a, b) => (approvals[a] === "PENDING" ? -1 : 0) - (approvals[b] === "PENDING" ? -1 : 0));

  const stateStyle: Record<ApprovalState, string> = {
    PENDING: "bg-amber-100 text-amber-900",
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  const stateLabel: Record<ApprovalState, string> = {
    PENDING: t("Pending", "Chờ duyệt"),
    APPROVED: t("Approved", "Đã duyệt"),
    REJECTED: t("Rejected", "Đã từ chối"),
  };

  return (
    <div className="space-y-2">
      {order.map((g) => {
        const r = rec(result, g);
        const st = result.groupStats[g];
        const state = approvals[g];
        // a rejected group is excluded from the dispatch; show its potential from the plan stats
        return (
          <div key={g} className={`border rounded-xl p-3 space-y-1.5 ${state === "PENDING" ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-bold text-slate-900">{groupName(g)}</div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${stateStyle[state]}`}>{stateLabel[state]}</span>
            </div>
            {state === "REJECTED" ? (
              <div className="text-[11px] text-slate-500">{t("Excluded from the dispatch plan.", "Đã loại khỏi kế hoạch điều độ.")}</div>
            ) : (
              <>
                <div className="text-[11px] text-slate-800">{r.action}</div>
                <div className="text-[11px] text-slate-500">{r.safety}</div>
                <div className="text-[11px] font-bold text-emerald-700">
                  −{kw(st.maxReduceKw)} · {vnd(st.benefitVnd)}/{t("day", "ngày")}
                </div>
              </>
            )}
            {rejecting === g ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded-lg text-[11px] bg-white cursor-pointer"
                >
                  {REJECT_REASONS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {t(x.label.en, x.label.vn)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    onDecide(g, "REJECTED", reason);
                    setRejecting(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                >
                  {t("Confirm reject", "Xác nhận từ chối")}
                </button>
                <button type="button" onClick={() => setRejecting(null)} className="px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-bold cursor-pointer">
                  {t("Cancel", "Hủy")}
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5 pt-1">
                {state !== "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => onDecide(g, "APPROVED")}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    {t("Approve", "Duyệt")}
                  </button>
                )}
                {state !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={() => setRejecting(g)}
                    className="px-2.5 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    {t("Reject", "Từ chối")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-1">
        <div className="text-[11px] font-bold text-slate-700">{t("Decision log", "Nhật ký quyết định")}</div>
        {log.length === 0 ? (
          <div className="text-[11px] text-slate-400">{t("No decisions yet in this session.", "Chưa có quyết định nào trong phiên này.")}</div>
        ) : (
          <ul className="text-[11px] text-slate-600 space-y-0.5 max-h-28 overflow-y-auto">
            {log.map((e, i) => (
              <li key={i}>
                {minuteLabel(e.minute)} · {groupName(e.group)} ·{" "}
                <b className={e.action === "REJECTED" ? "text-red-700" : "text-emerald-700"}>{e.action === "REJECTED" ? t("rejected", "từ chối") : t("approved", "duyệt")}</b>
                {e.reasonId && (
                  <>
                    {" "}– {t(REJECT_REASONS.find((r) => r.id === e.reasonId)!.label.en, REJECT_REASONS.find((r) => r.id === e.reasonId)!.label.vn)}{" "}
                    <span className="text-slate-400">({t("used to recalibrate the model", "dùng để hiệu chỉnh mô hình")})</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const DECISION_MINUTE = NOW_MINUTE;
export { EV_FLEET };
