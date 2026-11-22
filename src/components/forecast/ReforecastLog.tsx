import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useFormat } from "../../utils/format";
import { REFORECAST_LOG, ReforecastKind, minuteLabelWithDay } from "../../data/module1Forecast";

const KIND_STYLE: Record<ReforecastKind, string> = {
  DAY_AHEAD: "bg-slate-900 text-white",
  ROLLING: "bg-slate-100 text-slate-700",
  ETA: "bg-orange-100 text-orange-800",
  REEFER: "bg-sky-100 text-sky-800",
  STS_STOP: "bg-red-100 text-red-800",
  RETRAIN: "bg-violet-100 text-violet-800",
};

/** C2 – log of forecast updates with trigger and peak before/after. */
export const ReforecastLog: React.FC = () => {
  const { t, lang } = useLanguage();
  const { num } = useFormat();
  const kindLabel: Record<ReforecastKind, string> = {
    DAY_AHEAD: t("Day-ahead", "Dự báo ngày tới"),
    ROLLING: t("Rolling 15′", "Cuốn chiếu 15′"),
    ETA: t("Event · ETA", "Sự kiện · ETA"),
    REEFER: t("Event · Reefer", "Sự kiện · Reefer"),
    STS_STOP: t("Event · STS stop", "Sự kiện · dừng STS"),
    RETRAIN: t("Retrain", "Tái huấn luyện"),
  };

  return (
    <div className="overflow-x-auto border border-line rounded-card">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-700 font-medium border-b border-line">
          <tr>
            <th className="py-2 px-3">{t("Time", "Thời điểm")}</th>
            <th className="py-2 px-3">{t("Version", "Phiên bản")}</th>
            <th className="py-2 px-3">{t("Type", "Loại")}</th>
            <th className="py-2 px-3">{t("Trigger", "Nguyên nhân kích hoạt")}</th>
            <th className="py-2 px-3 text-right">{t("Forecast peak (net grid)", "Đỉnh dự báo (lưới thuần)")}</th>
            <th className="py-2 px-3">{t("Triggered by", "Người / hệ thống kích hoạt")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {REFORECAST_LOG.map((e, i) => {
            const delta = e.peakBeforeKw === null ? null : e.peakAfterKw - e.peakBeforeKw;
            return (
              <tr key={`${e.minute}-${i}`} className={i === 0 ? "bg-blue-50/60" : ""}>
                <td className="py-2 px-3 font-medium text-ink whitespace-nowrap">{minuteLabelWithDay(e.minute, lang)}</td>
                <td className="py-2 px-3 text-slate-700">#{e.version}</td>
                <td className="py-2 px-3">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${KIND_STYLE[e.kind]}`}>{kindLabel[e.kind]}</span>
                </td>
                <td className="py-2 px-3 text-slate-800">{t(e.cause.en, e.cause.vn)}</td>
                <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">
                  {e.peakBeforeKw === null ? (
                    <b>{num(e.peakAfterKw)} kW</b>
                  ) : (
                    <>
                      {num(e.peakBeforeKw)} → <b>{num(e.peakAfterKw)} kW</b>
                      {delta !== 0 && delta !== null && (
                        <span className={`ml-1 text-xs font-medium ${delta > 0 ? "text-danger" : "text-success"}`}>
                          ({delta > 0 ? "+" : "−"}{num(Math.abs(delta))})
                        </span>
                      )}
                    </>
                  )}
                  <span className="text-muted text-xs"> @{e.peakAfterTime}</span>
                </td>
                <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{t(e.actor.en, e.actor.vn)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 text-xs text-muted border-t border-line bg-slate-50">
        {t(
          "Showing the day-ahead run, event-based re-forecasts and rolling updates that changed inputs; other 15-minute rolling updates only extend the locked history.",
          "Hiển thị lần lập dự báo ngày tới, các lần tái dự báo theo sự kiện và các lần cuốn chiếu có thay đổi đầu vào; các lần cuốn chiếu 15 phút khác chỉ mở rộng phần lịch sử đã khóa."
        )}
      </div>
    </div>
  );
};
