import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat, useMoneyFormat } from "../../utils/format";
import { FEEDERS } from "../../data/module1Forecast";
import { ApprovalState, AssetGroup, DispatchResult, FLEX_GROUPS, FlexGroupId } from "../../data/module3PeakShaving";
import { ADJUST_COLORS } from "./PeakCharts";
import { useRecommendation } from "./ApprovalQueue";
import { DetailDrawer, StatusBadge } from "../ui";

const Sparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  const max = Math.max(1, ...values.map(Math.abs));
  const w = 120;
  const h = 24;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h / 2 - (v / max) * (h / 2 - 1)}`).join(" ");
  return (
    <svg width={w} height={h} className="block">
      <line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke="#E2E8F0" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
};

export function useModeLabel() {
  const { t } = useLanguage();
  return (g: AssetGroup) => (g.mode === "AUTO" ? t("Automatic", "Tự động") : g.mode === "APPROVAL" ? t("Needs approval", "Cần duyệt") : t("Locked", "Khóa"));
}

interface GroupTableProps {
  result: DispatchResult;
  approvals: Record<FlexGroupId, ApprovalState>;
  onOpen: (g: AssetGroup) => void;
}

/** B8 – compact dispatch-group table (replaces the card grid). */
export const GroupTable: React.FC<GroupTableProps> = ({ result, approvals, onOpen }) => {
  const { t } = useLanguage();
  const { kw } = useFormat();
  const modeLabel = useModeLabel();
  const atPeak = (id: FlexGroupId) => -(result.waterfall.find((w) => w.key === id)?.kw ?? 0);
  const stateLabel: Record<ApprovalState, string> = {
    PENDING: t("Pending", "Chờ duyệt"),
    APPROVED: t("Approved", "Đã duyệt"),
    REJECTED: t("Rejected", "Đã từ chối"),
  };
  return (
    <div className="overflow-x-auto border border-line rounded-card">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-700 font-medium border-b border-line">
          <tr>
            <th className="py-2 px-3">{t("Group", "Nhóm")}</th>
            <th className="py-2 px-3">{t("Feeder", "Lộ")}</th>
            <th className="py-2 px-3">{t("Mode", "Chế độ")}</th>
            <th className="py-2 px-3 text-right">{t("Peak cut", "Mức giảm đỉnh")}</th>
            <th className="py-2 px-3">{t("24h adjustment", "Điều chỉnh 24h")}</th>
            <th className="py-2 px-3 text-right">{t("Limit", "Giới hạn")}</th>
            <th className="py-2 px-3">{t("Status", "Trạng thái")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {FLEX_GROUPS.map((g) => {
            const id = g.id as FlexGroupId;
            const state = approvals[id];
            return (
              <tr key={g.id} onClick={() => onOpen(g)} className="cursor-pointer hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-ink">{t(g.name.en, g.name.vn)}</td>
                <td className="py-2 px-3 text-slate-600">{FEEDERS.find((f) => f.key === g.feeder)?.id}</td>
                <td className="py-2 px-3">
                  <StatusBadge tone={g.mode === "AUTO" ? "info" : "neutral"} dot={false}>{modeLabel(g)}</StatusBadge>
                </td>
                <td className="py-2 px-3 text-right font-medium tabular-nums text-success">{atPeak(id) > 0 ? `−${kw(atPeak(id))}` : kw(0)}</td>
                <td className="py-2 px-3">
                  <Sparkline values={result.intervals.map((x) => x.adjust[id])} color={ADJUST_COLORS[id]} />
                </td>
                <td className="py-2 px-3 text-right tabular-nums">{g.maxPct}%</td>
                <td className="py-2 px-3">
                  <StatusBadge status={g.mode === "AUTO" ? "RUNNING" : state}>{g.mode === "AUTO" ? t("Running", "Đang chạy") : stateLabel[state]}</StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Drawer with the long-form details moved out of the old cards. */
export const GroupDrawer: React.FC<{ group: AssetGroup; result: DispatchResult; onClose: () => void }> = ({ group, result, onClose }) => {
  const { t } = useLanguage();
  const { kw, num } = useFormat();
  const { vnd } = useMoneyFormat();
  const modeLabel = useModeLabel();
  const rec = useRecommendation();
  const id = group.id as FlexGroupId;
  const st = result.groupStats[id];
  const r = rec(result, id);
  return (
    <DetailDrawer width={480} title={t(group.name.en, group.name.vn)} subtitle={modeLabel(group)} onClose={onClose}>
        <div className="space-y-5 text-sm text-ink">
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: t("Mode", "Chế độ"), v: modeLabel(group) },
              { l: t("Feeder", "Lộ"), v: FEEDERS.find((f) => f.key === group.feeder)?.id ?? "—" },
              { l: t("Limit", "Giới hạn"), v: `${group.maxPct}% · ${kw(group.flexKw)}` },
              { l: t("Rated", "Công suất định mức"), v: kw(group.ratedKw) },
              { l: t("Max reduction", "Giảm tối đa"), v: kw(st.maxReduceKw) },
              { l: t("Energy reduced / shifted in", "Điện giảm / dời vào"), v: `${num(st.reducedKwh)} / ${num(st.shiftedInKwh)} kWh` },
              { l: t("Benefit", "Lợi ích"), v: `${vnd(st.benefitVnd)}/${t("day", "ngày")}` },
            ].map((x) => (
              <div key={x.l} className="bg-slate-50 border border-line rounded-control p-2">
                <div className="text-xs font-medium text-muted">{x.l}</div>
                <div className="font-medium text-ink">{x.v}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700">{t("Current recommendation", "Khuyến nghị hiện tại")}</div>
            <div>{r.action}</div>
            <div className="text-muted">{r.safety}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700">{t("Control rule", "Quy tắc điều khiển")}</div>
            <div>{t(group.rule.en, group.rule.vn)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700">{t("Safety constraint", "Ràng buộc an toàn")}</div>
            <div>{t(group.safety.en, group.safety.vn)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700">{t("Fallback", "Cơ chế dự phòng")}</div>
            <div>{t(group.fallback.en, group.fallback.vn)}</div>
          </div>
        </div>
    </DetailDrawer>
  );
};
