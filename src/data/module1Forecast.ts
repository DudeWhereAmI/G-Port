/**
 * Module 1 (M-1) – 24h load forecast data.
 *
 * Fully deterministic: a fixed-seed PRNG drives the small noise term, so every
 * render / build produces the same numbers. Everything the Forecast page shows
 * (KPIs, chart, window cards, report table) is derived from FORECAST_POINTS so
 * the figures always agree with each other.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUBSTATION_LIMIT_KW = 8000;
/** z-score of the 90th percentile: σ = (P90 − P50) / Z90 */
export const Z90 = 1.2816;
/** p_peak threshold at which planning switches from P50 to P90 */
export const P_PEAK_SWITCH = 0.1;
export const INTERVAL_MINUTES = 15;
export const POINTS_PER_DAY = 96;

export const MODEL_METRICS = {
  rmseKw: 66.7,
  mapePct: 1.31,
  r2: 0.9987,
  coveragePct: 100,
  inferenceMs: 56.2,
  mlpWeight: 0.6,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TouBand = "OFF_PEAK" | "STANDARD" | "PEAK";
export type WindowStatus = "NORMAL" | "HIGH_SOLAR" | "WARNING" | "OVERLOAD";

export interface BilingualText {
  en: string;
  vn: string;
}

export interface TouPreset {
  id: string;
  name: BilingualText;
  /** [startMinute, endMinute) ranges */
  peak: [number, number][];
  offPeak: [number, number][];
}

export interface ForecastPoint {
  /** minute of day at the start of the interval (0 … 1425) */
  minute: number;
  /** "HH:MM" start label */
  label: string;
  p10: number;
  p50: number;
  p90: number;
  pv: number;
  /** net grid import (P50) = load − PV */
  netGrid: number;
  /** σ of the load distribution, derived from P90 − P50 */
  sigma: number;
  /** probability that net grid import exceeds the substation limit (0…1) */
  pPeak: number;
  tou: TouBand;
}

export interface FeederBreakdown {
  f01StsKw: number;
  f02RtgKw: number;
  f03ReeferKw: number;
  f04OpsKw: number;
  f05EvBessKw: number;
  f06AuxKw: number;
}

export interface ForecastWindowRecord {
  /** "HH:00" – kept stable for deep links from the Overview page */
  id: string;
  startMinute: number;
  timeWindow: string;
  touBand: TouBand;
  status: WindowStatus;
  /** Representative point = interval with the highest net grid import */
  peakTime: string;
  p10Kw: number;
  p50Kw: number;
  p90Kw: number;
  pvKw: number;
  netGridKw: number;
  /** highest p_peak in the window (0…1) and when */
  maxPPeak: number;
  maxPPeakTime: string;
  /** highest PV output in the window */
  peakPvKw: number;
  vessels: string[];
  vesselCodes: string[];
  berth: string;
  stsCranes: number;
  reeferPlugs: number;
  shorePowerKw: number;
  tempAmbC: number;
  solarIrradianceWm2: number;
  summary: BilingualText;
  feeders: FeederBreakdown;
  points: ForecastPoint[];
}

// ---------------------------------------------------------------------------
// TOU presets
// ---------------------------------------------------------------------------

const hm = (h: number, m = 0) => h * 60 + m;

export const TOU_PRESETS: TouPreset[] = [
  {
    id: "CURRENT",
    name: { en: "Current schedule", vn: "Hiện hành" },
    peak: [
      [hm(9, 30), hm(11, 30)],
      [hm(17), hm(20)],
    ],
    offPeak: [
      [hm(22), hm(24)],
      [hm(0), hm(4)],
    ],
  },
];

export const ACTIVE_TOU_PRESET = TOU_PRESETS[0];

export function touBandAt(minute: number, preset: TouPreset = ACTIVE_TOU_PRESET): TouBand {
  const inRange = (ranges: [number, number][]) =>
    ranges.some(([s, e]) => minute >= s && minute < e);
  if (inRange(preset.peak)) return "PEAK";
  if (inRange(preset.offPeak)) return "OFF_PEAK";
  return "STANDARD";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Abramowitz–Stegun erf approximation (|error| < 1.5e-7) */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** p_peak = 1 − Φ((P_cap − P50) / σ) */
export function exceedanceProbability(p50: number, sigma: number, capKw = SUBSTATION_LIMIT_KW): number {
  if (sigma <= 0) return p50 > capKw ? 1 : 0;
  return 1 - normalCdf((capKw - p50) / sigma);
}

export function minuteLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Cosine interpolation of anchor values placed at each window's midpoint. */
function interpolateAnchors(values: number[], minute: number): number {
  const mids = values.map((_, i) => i * 120 + 60);
  if (minute <= mids[0]) return values[0];
  if (minute >= mids[mids.length - 1]) return values[values.length - 1];
  const i = Math.floor((minute - 60) / 120);
  const t = (minute - mids[i]) / 120;
  const w = (1 - Math.cos(Math.PI * t)) / 2;
  return values[i] * (1 - w) + values[i + 1] * w;
}

// ---------------------------------------------------------------------------
// Scenario (12 two-hour anchors). Afternoon is overcast, so PV is low exactly
// when two large vessels are worked in parallel → net grid exceeds 8,000 kW.
// ---------------------------------------------------------------------------

interface ScenarioAnchor {
  loadKw: number; // P50 load at the window midpoint
  cloudFactor: number; // share of clear-sky PV actually produced
  sigmaKw: number; // forecast σ
  vessels: string[];
  vesselCodes: string[];
  berth: string;
  stsCranes: number;
  reeferPlugs: number;
  shorePowerKw: number;
  tempAmbC: number;
  solarIrradianceWm2: number;
  summary: BilingualText;
  /** feeder weights F-01…F-06 (normalised to the window load) */
  feederWeights: [number, number, number, number, number, number];
}

const PV_CLEAR_SKY_PEAK_KW = 2000;
const PV_SUNRISE = hm(6);
const PV_SUNSET = hm(18);

const SCENARIO: ScenarioAnchor[] = [
  {
    loadKw: 2770, cloudFactor: 1, sigmaKw: 160,
    vessels: ["TAN CANG GLORY"], vesselCodes: ["UC-04"], berth: "B1",
    stsCranes: 2, reeferPlugs: 185, shorePowerKw: 480, tempAmbC: 26.4, solarIrradianceWm2: 0,
    summary: {
      en: "Finishing night cargo operations (2 STS cranes active)",
      vn: "Hoàn tất làm hàng ca đêm (2 cẩu STS hoạt động)",
    },
    feederWeights: [840, 420, 680, 480, 180, 167],
  },
  {
    loadKw: 2740, cloudFactor: 1, sigmaKw: 160,
    vessels: ["TAN CANG GLORY"], vesselCodes: ["UC-04"], berth: "B1",
    stsCranes: 2, reeferPlugs: 180, shorePowerKw: 480, tempAmbC: 25.8, solarIrradianceWm2: 0,
    summary: {
      en: "Off-peak night window; EV tractor charging & reefer pre-cooling",
      vn: "Khung đêm thấp điểm; sạc xe đầu kéo EV và làm lạnh trước container lạnh",
    },
    feederWeights: [760, 380, 650, 480, 315, 160],
  },
  {
    loadKw: 2490, cloudFactor: 1, sigmaKw: 160,
    vessels: ["TAN CANG GLORY"], vesselCodes: ["UC-04"], berth: "B1",
    stsCranes: 1, reeferPlugs: 175, shorePowerKw: 320, tempAmbC: 25.5, solarIrradianceWm2: 0,
    summary: {
      en: "Vessel departing Berth B1; morning shift handover",
      vn: "Tàu rời cầu B1; giao ca sáng",
    },
    feederWeights: [520, 340, 640, 320, 490, 180],
  },
  {
    loadKw: 2420, cloudFactor: 1, sigmaKw: 165,
    vessels: ["SPIRIT OF MUMBAI"], vesselCodes: ["UC-01"], berth: "B2",
    stsCranes: 2, reeferPlugs: 240, shorePowerKw: 620, tempAmbC: 26.8, solarIrradianceWm2: 85,
    summary: {
      en: "SPIRIT OF MUMBAI berths at B2; shore power connected",
      vn: "SPIRIT OF MUMBAI cập cầu B2; đấu nối điện bờ",
    },
    feederWeights: [680, 310, 645, 620, 0, 160],
  },
  {
    loadKw: 4000, cloudFactor: 1, sigmaKw: 170,
    vessels: ["SPIRIT OF MUMBAI"], vesselCodes: ["UC-01"], berth: "B2",
    stsCranes: 4, reeferPlugs: 310, shorePowerKw: 750, tempAmbC: 29.4, solarIrradianceWm2: 460,
    summary: {
      en: "4 STS cranes working; reefer cooling demand rising",
      vn: "4 cẩu STS làm hàng; nhu cầu làm lạnh container tăng",
    },
    feederWeights: [1680, 620, 786, 750, 0, 160],
  },
  {
    loadKw: 4600, cloudFactor: 0.97, sigmaKw: 175,
    vessels: ["SPIRIT OF MUMBAI"], vesselCodes: ["UC-01"], berth: "B2",
    stsCranes: 4, reeferPlugs: 325, shorePowerKw: 760, tempAmbC: 32.1, solarIrradianceWm2: 790,
    summary: {
      en: "Morning peak tariff; rooftop PV covers a large share of demand",
      vn: "Giờ cao điểm buổi sáng; điện mặt trời áp mái bù phần lớn phụ tải",
    },
    feederWeights: [1740, 660, 824, 760, 0, 160],
  },
  {
    loadKw: 5600, cloudFactor: 0.92, sigmaKw: 185,
    vessels: ["SPIRIT OF MUMBAI", "ONE APUS"], vesselCodes: ["UC-01", "UC-02"], berth: "B2 & B3",
    stsCranes: 5, reeferPlugs: 360, shorePowerKw: 1050, tempAmbC: 33.6, solarIrradianceWm2: 880,
    summary: {
      en: "ONE APUS berths at B3; PV at its daily high, clouds building from 14:00",
      vn: "ONE APUS cập cầu B3; điện mặt trời đạt đỉnh ngày, mây tăng dần từ 14:00",
    },
    feederWeights: [1900, 760, 950, 1050, 40, 170],
  },
  {
    loadKw: 8900, cloudFactor: 0.4, sigmaKw: 195,
    vessels: ["ONE APUS", "SPIRIT OF MUMBAI"], vesselCodes: ["UC-02", "UC-01"], berth: "B2 & B3",
    stsCranes: 6, reeferPlugs: 520, shorePowerKw: 1520, tempAmbC: 31.8, solarIrradianceWm2: 310,
    summary: {
      en: "OVERLOAD: 2 large vessels on 6 STS cranes + shore power; overcast sky cuts PV",
      vn: "QUÁ TẢI: 2 tàu lớn chạy 6 cẩu STS + điện bờ; trời nhiều mây làm giảm điện mặt trời",
    },
    feederWeights: [3420, 1410, 1461, 1480, 200, 180],
  },
  {
    loadKw: 8700, cloudFactor: 0.3, sigmaKw: 195,
    vessels: ["ONE APUS", "SPIRIT OF MUMBAI"], vesselCodes: ["UC-02", "UC-01"], berth: "B2 & B3",
    stsCranes: 6, reeferPlugs: 535, shorePowerKw: 1530, tempAmbC: 30.4, solarIrradianceWm2: 120,
    summary: {
      en: "OVERLOAD: heavy dual-vessel crane work, 535 reefers, PV almost gone",
      vn: "QUÁ TẢI: hai tàu làm hàng cường độ cao, 535 container lạnh, điện mặt trời gần như bằng 0",
    },
    feederWeights: [3340, 1380, 1458, 1490, 180, 180],
  },
  {
    loadKw: 6700, cloudFactor: 0.3, sigmaKw: 180,
    vessels: ["ONE APUS", "SPIRIT OF MUMBAI"], vesselCodes: ["UC-02", "UC-01"], berth: "B2 & B3",
    stsCranes: 5, reeferPlugs: 450, shorePowerKw: 1420, tempAmbC: 29.2, solarIrradianceWm2: 15,
    summary: {
      en: "Evening shift change during the peak tariff; solar output ends",
      vn: "Giao ca chiều trong giờ cao điểm; điện mặt trời kết thúc",
    },
    feederWeights: [2790, 1120, 1169, 1420, 0, 190],
  },
  {
    loadKw: 6150, cloudFactor: 1, sigmaKw: 175,
    vessels: ["ONE APUS", "SPIRIT OF MUMBAI"], vesselCodes: ["UC-02", "UC-01"], berth: "B2 & B3",
    stsCranes: 4, reeferPlugs: 430, shorePowerKw: 1380, tempAmbC: 28.1, solarIrradianceWm2: 0,
    summary: {
      en: "Steady night discharge across 2 vessels",
      vn: "Dỡ hàng ổn định ban đêm trên 2 tàu",
    },
    feederWeights: [2480, 1020, 1080, 1380, 0, 190],
  },
  {
    loadKw: 4560, cloudFactor: 1, sigmaKw: 170,
    vessels: ["ONE APUS"], vesselCodes: ["UC-02"], berth: "B3",
    stsCranes: 3, reeferPlugs: 390, shorePowerKw: 980, tempAmbC: 27.2, solarIrradianceWm2: 0,
    summary: {
      en: "SPIRIT OF MUMBAI departs; off-peak tariff begins",
      vn: "SPIRIT OF MUMBAI rời cảng; bắt đầu giờ thấp điểm",
    },
    feederWeights: [1680, 740, 920, 980, 60, 180],
  },
];

// ---------------------------------------------------------------------------
// 96 × 15-minute points
// ---------------------------------------------------------------------------

const SEED = 20251122;

function clearSkyPv(minuteMid: number): number {
  if (minuteMid <= PV_SUNRISE || minuteMid >= PV_SUNSET) return 0;
  const x = Math.sin((Math.PI * (minuteMid - PV_SUNRISE)) / (PV_SUNSET - PV_SUNRISE));
  return PV_CLEAR_SKY_PEAK_KW * Math.pow(x, 1.3);
}

function buildPoints(): ForecastPoint[] {
  const rand = mulberry32(SEED);
  const loads = SCENARIO.map((s) => s.loadKw);
  const clouds = SCENARIO.map((s) => s.cloudFactor);
  const sigmas = SCENARIO.map((s) => s.sigmaKw);

  const points: ForecastPoint[] = [];
  for (let i = 0; i < POINTS_PER_DAY; i++) {
    const minute = i * INTERVAL_MINUTES;
    const mid = minute + INTERVAL_MINUTES / 2;
    const noise = (rand() - 0.5) * 70;
    const p50 = Math.round(interpolateAnchors(loads, mid) + noise);
    const sigma = Math.round(interpolateAnchors(sigmas, mid) * 10) / 10;
    const band = Math.round(Z90 * sigma);
    const pvNoise = 1 + (rand() - 0.5) * 0.06;
    const pv = Math.max(0, Math.round(clearSkyPv(mid) * interpolateAnchors(clouds, mid) * pvNoise));
    const netGrid = p50 - pv;
    points.push({
      minute,
      label: minuteLabel(minute),
      p10: p50 - band,
      p50,
      p90: p50 + band,
      pv,
      netGrid,
      sigma: band / Z90,
      pPeak: exceedanceProbability(netGrid, band / Z90),
      tou: touBandAt(minute),
    });
  }
  return points;
}

export const FORECAST_POINTS: ForecastPoint[] = buildPoints();

// ---------------------------------------------------------------------------
// 12 two-hour windows aggregated from the 96 points
// ---------------------------------------------------------------------------

function distributeFeeders(weights: number[], totalKw: number): FeederBreakdown {
  const sum = weights.reduce((a, b) => a + b, 0);
  const kws = weights.map((w) => Math.round((w / sum) * totalKw));
  // F-06 absorbs rounding so the six lines add up exactly
  const diff = totalKw - kws.reduce((a, b) => a + b, 0);
  kws[5] += diff;
  return {
    f01StsKw: kws[0],
    f02RtgKw: kws[1],
    f03ReeferKw: kws[2],
    f04OpsKw: kws[3],
    f05EvBessKw: kws[4],
    f06AuxKw: kws[5],
  };
}

function majorityTou(points: ForecastPoint[]): TouBand {
  const counts: Record<TouBand, number> = { OFF_PEAK: 0, STANDARD: 0, PEAK: 0 };
  points.forEach((p) => counts[p.tou]++);
  return (Object.keys(counts) as TouBand[]).reduce((a, b) => (counts[b] > counts[a] ? b : a));
}

function buildWindows(points: ForecastPoint[]): ForecastWindowRecord[] {
  return SCENARIO.map((s, i) => {
    const startMinute = i * 120;
    const pts = points.slice(i * 8, i * 8 + 8);
    const rep = pts.reduce((a, b) => (b.netGrid > a.netGrid ? b : a));
    const maxP = pts.reduce((a, b) => (b.pPeak > a.pPeak ? b : a));
    const peakPv = Math.max(...pts.map((p) => p.pv));

    let status: WindowStatus = "NORMAL";
    if (rep.netGrid > SUBSTATION_LIMIT_KW) status = "OVERLOAD";
    else if (maxP.pPeak >= P_PEAK_SWITCH) status = "WARNING";
    else if (peakPv >= 800) status = "HIGH_SOLAR";

    return {
      id: minuteLabel(startMinute),
      startMinute,
      timeWindow: `${minuteLabel(startMinute)} – ${minuteLabel(startMinute + 120)}`,
      touBand: majorityTou(pts),
      status,
      peakTime: rep.label,
      p10Kw: rep.p10,
      p50Kw: rep.p50,
      p90Kw: rep.p90,
      pvKw: rep.pv,
      netGridKw: rep.netGrid,
      maxPPeak: maxP.pPeak,
      maxPPeakTime: maxP.label,
      peakPvKw: peakPv,
      vessels: s.vessels,
      vesselCodes: s.vesselCodes,
      berth: s.berth,
      stsCranes: s.stsCranes,
      reeferPlugs: s.reeferPlugs,
      shorePowerKw: s.shorePowerKw,
      tempAmbC: s.tempAmbC,
      solarIrradianceWm2: s.solarIrradianceWm2,
      summary: s.summary,
      feeders: distributeFeeders(s.feederWeights, rep.p50),
      points: pts,
    };
  });
}

export const FORECAST_WINDOWS: ForecastWindowRecord[] = buildWindows(FORECAST_POINTS);

// ---------------------------------------------------------------------------
// Page-level KPIs (derived, never hard-coded)
// ---------------------------------------------------------------------------

function buildKpis() {
  const peakNet = FORECAST_POINTS.reduce((a, b) => (b.netGrid > a.netGrid ? b : a));
  const peakPv = FORECAST_POINTS.reduce((a, b) => (b.pv > a.pv ? b : a));
  const overloadWindows = FORECAST_WINDOWS.filter((w) => w.status === "OVERLOAD");
  const warningWindows = FORECAST_WINDOWS.filter((w) => w.status === "WARNING");
  const peakWindow =
    FORECAST_WINDOWS.find((w) => w.peakTime === peakNet.label) ?? FORECAST_WINDOWS[0];
  return {
    peakNetGrid: peakNet,
    peakWindow,
    peakPv,
    overloadWindows,
    warningWindows,
    accuracyPct: 100 - MODEL_METRICS.mapePct,
  };
}

export const MODULE1_KPIS = buildKpis();

// ---------------------------------------------------------------------------
// Accuracy history by training window (self-learning curve)
// ---------------------------------------------------------------------------

export interface AccuracyHistoryRow {
  windowDays: number;
  samples: number;
  mapePct: number;
  rmseKw: number;
  coveragePct: number;
}

export const ACCURACY_HISTORY: AccuracyHistoryRow[] = [
  { windowDays: 5, samples: 480, mapePct: 2.24, rmseKw: 124.6, coveragePct: 96.9 },
  { windowDays: 10, samples: 960, mapePct: 1.52, rmseKw: 82.8, coveragePct: 100 },
  { windowDays: 15, samples: 1440, mapePct: 1.44, rmseKw: 81.8, coveragePct: 100 },
  { windowDays: 20, samples: 1920, mapePct: 1.27, rmseKw: 62.9, coveragePct: 100 },
  { windowDays: 25, samples: 2400, mapePct: 1.33, rmseKw: 63.7, coveragePct: 100 },
  { windowDays: 30, samples: 2880, mapePct: 1.31, rmseKw: 66.7, coveragePct: 100 },
];
