/**
 * Module 1 – model health data (C1). Static, deterministic values that are
 * consistent with MODEL_METRICS / ACCURACY_HISTORY in module1Forecast.ts.
 */
import { BilingualText } from "./module1Forecast";

export interface FeatureImportance {
  key: string;
  name: BilingualText;
  group: "LAG" | "TOS" | "CALENDAR" | "WEATHER";
  /** normalised gain, all 18 features sum to 1 */
  gain: number;
}

/** 18 input features (LightGBM gain, normalised). */
export const FEATURE_IMPORTANCE: FeatureImportance[] = [
  { key: "lag_1", name: { en: "Load lag t−1 (15 min)", vn: "Phụ tải trễ bậc 1 (15 phút)" }, group: "LAG", gain: 0.214 },
  { key: "sts_cranes", name: { en: "Planned STS cranes", vn: "Số cẩu STS kế hoạch" }, group: "TOS", gain: 0.158 },
  { key: "lag_96", name: { en: "Load lag t−96 (same time yesterday)", vn: "Phụ tải trễ bậc 96 (cùng giờ hôm qua)" }, group: "LAG", gain: 0.121 },
  { key: "teu_plan", name: { en: "Planned TEU moves", vn: "Sản lượng TEU kế hoạch" }, group: "TOS", gain: 0.094 },
  { key: "ops_kw", name: { en: "Shore power (OPS) connections", vn: "Đấu nối điện bờ (OPS)" }, group: "TOS", gain: 0.081 },
  { key: "reefers", name: { en: "Reefer containers plugged", vn: "Số container lạnh cắm điện" }, group: "TOS", gain: 0.072 },
  { key: "lag_4", name: { en: "Load lag t−4 (1 h)", vn: "Phụ tải trễ bậc 4 (1 giờ)" }, group: "LAG", gain: 0.061 },
  { key: "ghi", name: { en: "Irradiance GHI", vn: "Bức xạ GHI" }, group: "WEATHER", gain: 0.048 },
  { key: "temp", name: { en: "Ambient temperature", vn: "Nhiệt độ môi trường" }, group: "WEATHER", gain: 0.041 },
  { key: "vessels", name: { en: "Vessels at berth", vn: "Số tàu tại cầu" }, group: "TOS", gain: 0.033 },
  { key: "hour", name: { en: "Hour of day", vn: "Giờ trong ngày" }, group: "CALENDAR", gain: 0.022 },
  { key: "dow", name: { en: "Day of week", vn: "Ngày trong tuần" }, group: "CALENDAR", gain: 0.014 },
  { key: "humidity", name: { en: "Relative humidity", vn: "Độ ẩm tương đối" }, group: "WEATHER", gain: 0.011 },
  { key: "cloud", name: { en: "Cloud cover", vn: "Độ che phủ mây" }, group: "WEATHER", gain: 0.009 },
  { key: "holiday", name: { en: "Public holiday flag", vn: "Cờ ngày lễ" }, group: "CALENDAR", gain: 0.007 },
  { key: "shift", name: { en: "Shift-change flag", vn: "Cờ giao ca" }, group: "CALENDAR", gain: 0.006 },
  { key: "wind", name: { en: "Wind speed", vn: "Tốc độ gió" }, group: "WEATHER", gain: 0.005 },
  { key: "tide", name: { en: "Tide level", vn: "Mực nước triều" }, group: "WEATHER", gain: 0.004 },
];

export interface DailyBacktest {
  date: string;
  label: BilingualText;
  forecastPeakKw: number;
  actualPeakKw: number;
  mapePct: number;
  rmseKw: number;
}

/** Out-of-sample error of the last 7 days (mean MAPE = 1.31 %). */
export const LAST_7_DAYS: DailyBacktest[] = [
  { date: "2026-11-16", label: { en: "Mon 16/11", vn: "T2 16/11" }, forecastPeakKw: 7980, actualPeakKw: 8046, mapePct: 1.18, rmseKw: 61.2 },
  { date: "2026-11-17", label: { en: "Tue 17/11", vn: "T3 17/11" }, forecastPeakKw: 8120, actualPeakKw: 8034, mapePct: 1.42, rmseKw: 70.5 },
  { date: "2026-11-18", label: { en: "Wed 18/11", vn: "T4 18/11" }, forecastPeakKw: 7860, actualPeakKw: 7911, mapePct: 1.25, rmseKw: 63.8 },
  { date: "2026-11-19", label: { en: "Thu 19/11", vn: "T5 19/11" }, forecastPeakKw: 8310, actualPeakKw: 8402, mapePct: 1.51, rmseKw: 74.9 },
  { date: "2026-11-20", label: { en: "Fri 20/11", vn: "T6 20/11" }, forecastPeakKw: 7745, actualPeakKw: 7702, mapePct: 1.19, rmseKw: 60.4 },
  { date: "2026-11-21", label: { en: "Sat 21/11", vn: "T7 21/11" }, forecastPeakKw: 8050, actualPeakKw: 8133, mapePct: 1.38, rmseKw: 69.1 },
  { date: "2026-11-22", label: { en: "Sun 22/11", vn: "CN 22/11" }, forecastPeakKw: 6180, actualPeakKw: 6145, mapePct: 1.24, rmseKw: 62.0 },
];

export const LAST_RETRAIN = {
  label: { en: "Sun 22/11 02:00", vn: "CN 22/11 02:00" },
  windowDays: 30,
  samples: 2880,
  nextLabel: { en: "Sun 29/11 02:00", vn: "CN 29/11 02:00" },
};
