import React, { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { ForecastWindowRecord, WindowStatus } from "../../data/module1Forecast";

type SortKey = "time" | "load" | "pv" | "grid" | "reefer" | "pPeak" | "status";
const STATUS_RANK: Record<WindowStatus, number> = { NORMAL: 0, HIGH_SOLAR: 1, WARNING: 2, OVERLOAD: 3 };

interface WindowTableProps {
  windows: ForecastWindowRecord[];
  selectedId: string | null;
  onRowClick: (w: ForecastWindowRecord) => void;
  renderTou: (w: ForecastWindowRecord) => React.ReactNode;
  renderStatus: (w: ForecastWindowRecord) => React.ReactNode;
}

/** C4 – compact sortable table view of the 12 windows. */
export const WindowTable: React.FC<WindowTableProps> = ({ windows, selectedId, onRowClick, renderTou, renderStatus }) => {
  const { t } = useLanguage();
  const { num, pct } = useFormat();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "time", dir: 1 });

  const value = (w: ForecastWindowRecord, k: SortKey): number => {
    switch (k) {
      case "time": return w.startMinute;
      case "load": return w.p50Kw;
      case "pv": return w.pvKw;
      case "grid": return w.netGridKw;
      case "reefer": return w.reeferPlugs;
      case "pPeak": return w.maxPPeak;
      case "status": return STATUS_RANK[w.status] * 100000 + w.netGridKw;
    }
  };
  const rows = [...windows].sort((a, b) => (value(a, sort.key) - value(b, sort.key)) * sort.dir);

  const Th: React.FC<{ k: SortKey; label: string; right?: boolean }> = ({ k, label, right }) => {
    const active = sort.key === k;
    return (
      <th className={`py-2 px-2.5 ${right ? "text-right" : ""}`}>
        <button
          type="button"
          onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? ((s.dir * -1) as 1 | -1) : k === "time" ? 1 : -1 }))}
          className={`inline-flex items-center gap-1 font-bold cursor-pointer hover:text-[#004B91] ${active ? "text-[#004B91]" : ""}`}
        >
          {label}
          {active ? sort.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      </th>
    );
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
          <tr>
            <Th k="time" label={t("Window", "Khung giờ")} />
            <th className="py-2 px-2.5 font-bold">{t("Vessels", "Tàu")}</th>
            <Th k="load" label={t("Load P50", "Tải P50")} right />
            <Th k="pv" label="PV" right />
            <Th k="grid" label={t("Net grid", "Lưới thuần")} right />
            <Th k="reefer" label="Reefer" right />
            <Th k="pPeak" label="p_peak" right />
            <th className="py-2 px-2.5 font-bold text-center">TOU</th>
            <Th k="status" label={t("Status", "Trạng thái")} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((w) => {
            const alert = w.status === "OVERLOAD" || w.status === "WARNING";
            return (
              <tr
                key={w.id}
                onClick={() => onRowClick(w)}
                title={t("Click to zoom the chart to this window", "Bấm để phóng biểu đồ tới khung giờ này")}
                className={`cursor-pointer transition-colors ${
                  selectedId === w.id ? "bg-blue-50 font-semibold" : alert ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"
                }`}
              >
                <td className="py-2 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                  {w.timeWindow} <span className="text-slate-400 font-normal">@{w.peakTime}</span>
                </td>
                <td className="py-2 px-2.5 text-slate-600 max-w-[220px]" title={w.vessels.join(" & ")}>
                  <span className="line-clamp-1">{w.vessels.join(" & ") || "—"}</span>
                </td>
                <td className="py-2 px-2.5 text-right font-mono tabular-nums">{num(w.p50Kw)}</td>
                <td className="py-2 px-2.5 text-right font-mono tabular-nums text-emerald-700">{num(w.pvKw)}</td>
                <td className={`py-2 px-2.5 text-right font-mono tabular-nums font-bold ${w.status === "OVERLOAD" ? "text-red-700" : "text-[#004B91]"}`}>
                  {num(w.netGridKw)}
                </td>
                <td className="py-2 px-2.5 text-right font-mono tabular-nums">{num(w.reeferPlugs)}</td>
                <td className={`py-2 px-2.5 text-right font-mono tabular-nums ${alert ? "text-orange-700 font-bold" : "text-slate-600"}`}>
                  {pct(w.maxPPeak * 100, 0)}
                </td>
                <td className="py-2 px-2.5 text-center">{renderTou(w)}</td>
                <td className="py-2 px-2.5">{renderStatus(w)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-1.5 text-[10px] text-slate-500 border-t border-slate-100">
        {t("All values in kW at each window's peak interval.", "Đơn vị kW, lấy tại chu kỳ đỉnh của mỗi khung giờ.")}
      </div>
    </div>
  );
};
