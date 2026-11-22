/**
 * Module 1 (M-1) – 24h load forecast data and client-side approximation model.
 *
 * Fully deterministic: noise terms come from fixed-seed PRNG arrays that are
 * generated once, so every render / build / what-if run produces the same
 * numbers for the same inputs. Everything on the Forecast page (KPIs, chart,
 * risk ribbon, berth Gantt, window cards, table, exports) is derived from
 * `computeForecast()` so the figures always agree with each other.
 *
 * Load model (per 15-minute interval, evaluated at the interval midpoint):
 *   F-01 STS      = Σ vessels: active cranes × kW/crane (shift-change dip)
 *   F-02 e-RTG    = base + Σ vessels: active cranes × kW/crane-equivalent
 *   F-03 Reefer   = reefer count × kW/unit(T_amb)
 *   F-04 OPS      = Σ vessels at berth: shore-power demand
 *   F-05 EV/BESS  = EV tractor charging schedule
 *   F-06 Aux      = base + night lighting + HVAC(T_amb)
 *   PV            = clear-sky profile × cloud factor × (1 − extra reduction)
 *   σ             = f(load, lead time, ETA uncertainty of arriving vessels)
 *   p_peak        = 1 − Φ((P_cap − NetGrid_P50) / σ)
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
export const DAY_MINUTES = 1440;

/** Forecast day (Monday) – fixed so the page is deterministic. */
export const FORECAST_DATE = { iso: "2026-11-23", weekday: 1, vn: "Thứ Hai, 23/11/2026", en: "Monday, 23 Nov 2026" };
/** Day-ahead forecast issued at 22:00 the previous evening (minute −120). */
export const ISSUE_MINUTE = -120;
/** Last 15-minute rolling update; intervals before it are locked for audit. */
export const LOCK_MINUTE = 11 * 60 + 30;
/** Simulated "now" on the page. */
export const NOW_MINUTE = 11 * 60 + 40;

export const MODEL_METRICS = {
  rmseKw: 66.7,
  mapePct: 1.31,
  mapeBaselinePct: 2.24,
  r2: 0.9987,
  coveragePct: 100,
  inferenceMs: 56.2,
  mlpWeight: 0.6,
  lgbmWeight: 0.4,
  modelVersion: "MLP-NN + LightGBM v3.2",
  features: 18,
};

/** Input data quality for the current run (shown in the header badge). */
export const INPUT_DATA_QUALITY = { validPct: 99.6, errorFlags: 0, streams: 14 };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TouBand = "OFF_PEAK" | "STANDARD" | "PEAK";
export type WindowStatus = "NORMAL" | "HIGH_SOLAR" | "WARNING" | "OVERLOAD";
export type BerthId = "B1" | "B2" | "B3";
export type FeederKey = "f01" | "f02" | "f03" | "f04" | "f05" | "f06";

export interface BilingualText {
  en: string;
  vn: string;
}

export interface TouPreset {
  id: "CURRENT" | "QD963";
  name: BilingualText;
  note: BilingualText;
  /** [startMinute, endMinute) ranges */
  peak: [number, number][];
  offPeak: [number, number][];
  /** weekdays (0 = Sunday) on which the peak band applies */
  peakDays: number[];
}

export interface CraneSegment {
  /** absolute minute of day from which this crane count applies */
  fromMin: number;
  cranes: number;
}

export interface VesselCall {
  id: string;
  code: string;
  name: string;
  berth: BerthId;
  /** minutes relative to 00:00 of the forecast day (may be < 0 or > 1440) */
  etaMin: number;
  etdMin: number;
  /** historical ETA − ATA error (1σ, minutes) */
  etaSigmaMin: number;
  teu: number;
  loaM: number;
  reefers: number;
  opsKw: number;
  cranes: CraneSegment[];
}

export interface ForecastScenario {
  vessels: VesselCall[];
  reeferFactor: number;
  /** cloud factor (share of clear-sky PV) at each 2-hour window midpoint */
  cloud: number[];
  /** additional PV reduction 0…0.8 (what-if) */
  pvReduction: number;
}

export type FeederValues = Record<FeederKey, number>;

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
  sigma: number;
  /** probability that net grid import exceeds the substation limit (0…1) */
  pPeak: number;
  tou: TouBand;
  feeders: FeederValues;
  /** load contributed by each vessel call (STS + e-RTG share + OPS) */
  byVessel: Record<string, number>;
  cranes: number;
  reefers: number;
  tempC: number;
  /** metered load for locked (past) intervals, null for the future */
  actual: number | null;
  locked: boolean;
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
  feeders: FeederValues;
  points: ForecastPoint[];
}

export interface ForecastKpis {
  peakNetGrid: ForecastPoint;
  peakWindow: ForecastWindowRecord;
  peakPv: ForecastPoint;
  overloadWindows: ForecastWindowRecord[];
  warningWindows: ForecastWindowRecord[];
  alertWindows: ForecastWindowRecord[];
  /** intervals with p_peak ≥ 10 % (planned on P90) */
  switchIntervals: number;
  maxPPeak: ForecastPoint;
  accuracyPct: number;
}

export interface ForecastResult {
  scenario: ForecastScenario;
  preset: TouPreset;
  points: ForecastPoint[];
  windows: ForecastWindowRecord[];
  kpis: ForecastKpis;
}

// ---------------------------------------------------------------------------
// Feeders (6 lines)
// ---------------------------------------------------------------------------

export const FEEDERS: { key: FeederKey; id: string; name: BilingualText; color: string }[] = [
  { key: "f01", id: "F-01", name: { en: "STS quay cranes", vn: "Cẩu bờ STS" }, color: "#004B91" },
  { key: "f02", id: "F-02", name: { en: "Yard e-RTG cranes", vn: "Cẩu khung bãi e-RTG" }, color: "#4A81C9" },
  { key: "f03", id: "F-03", name: { en: "Reefer yard", vn: "Bãi container lạnh" }, color: "#0EA5E9" },
  { key: "f04", id: "F-04", name: { en: "Shore power (OPS)", vn: "Điện bờ (OPS)" }, color: "#7C3AED" },
  { key: "f05", id: "F-05", name: { en: "EV charging hub", vn: "Trạm sạc xe điện" }, color: "#10B981" },
  { key: "f06", id: "F-06", name: { en: "Auxiliary (lighting, HVAC, pumps)", vn: "Phụ trợ (chiếu sáng, HVAC, bơm)" }, color: "#94A3B8" },
];

// ---------------------------------------------------------------------------
// TOU presets
// ---------------------------------------------------------------------------

const hm = (h: number, m = 0) => h * 60 + m;

export const TOU_PRESETS: TouPreset[] = [
  {
    id: "CURRENT",
    name: { en: "Current schedule", vn: "Hiện hành" },
    note: {
      en: "Peak 09:30–11:30 & 17:00–20:00 · Off-peak 22:00–04:00",
      vn: "Cao điểm 09:30–11:30 & 17:00–20:00 · Thấp điểm 22:00–04:00",
    },
    peak: [
      [hm(9, 30), hm(11, 30)],
      [hm(17), hm(20)],
    ],
    offPeak: [
      [hm(22), hm(24)],
      [hm(0), hm(4)],
    ],
    peakDays: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "QD963",
    name: { en: "Decision 963/QĐ-BCT", vn: "QĐ 963/QĐ-BCT" },
    note: {
      en: "Peak 17:30–22:30 Mon–Sat · Off-peak 00:00–06:00 (effective date under revision)",
      vn: "Cao điểm 17:30–22:30 thứ Hai–thứ Bảy · Thấp điểm 00:00–06:00 (thời điểm áp dụng đang sửa đổi)",
    },
    peak: [[hm(17, 30), hm(22, 30)]],
    offPeak: [[hm(0), hm(6)]],
    peakDays: [1, 2, 3, 4, 5, 6],
  },
];

export const DEFAULT_TOU_PRESET = TOU_PRESETS[0];

export function touBandAt(minute: number, preset: TouPreset = DEFAULT_TOU_PRESET, weekday = FORECAST_DATE.weekday): TouBand {
  const inRange = (ranges: [number, number][]) => ranges.some(([s, e]) => minute >= s && minute < e);
  if (preset.peakDays.includes(weekday) && inRange(preset.peak)) return "PEAK";
  if (inRange(preset.offPeak)) return "OFF_PEAK";
  return "STANDARD";
}

// ---------------------------------------------------------------------------
// Math helpers
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
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
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
  const m = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = minute === DAY_MINUTES ? 24 : Math.floor(m / 60);
  const mm = minute === DAY_MINUTES ? 0 : m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** "HH:MM" plus a day marker for times outside the forecast day. */
export function minuteLabelWithDay(minute: number, lang: "EN" | "VN"): string {
  if (minute < 0) return `${minuteLabel(minute)} (${lang === "VN" ? "hôm trước" : "prev. day"})`;
  if (minute >= DAY_MINUTES) return `${minuteLabel(minute)} (${lang === "VN" ? "hôm sau" : "next day"})`;
  return minuteLabel(minute);
}

/** Cosine interpolation of 12 anchor values placed at each window midpoint. */
function interpolateAnchors(values: number[], minute: number): number {
  const mids = values.map((_, i) => i * 120 + 60);
  if (minute <= mids[0]) return values[0];
  if (minute >= mids[mids.length - 1]) return values[values.length - 1];
  const i = Math.floor((minute - 60) / 120);
  const t = (minute - mids[i]) / 120;
  const w = (1 - Math.cos(Math.PI * t)) / 2;
  return values[i] * (1 - w) + values[i + 1] * w;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// Base scenario – vessel calls & weather
// Afternoon is overcast while three vessels are worked in parallel, so the
// net grid import still exceeds 8,000 kW after PV between 14:00 and 18:00.
// ---------------------------------------------------------------------------

export const BASE_VESSELS: VesselCall[] = [
  {
    id: "V-TCG", code: "UC-04", name: "TAN CANG GLORY", berth: "B1",
    etaMin: hm(-6), etdMin: hm(5, 30), etaSigmaMin: 15,
    teu: 1100, loaM: 222, reefers: 60, opsKw: 480,
    cranes: [{ fromMin: hm(-6), cranes: 2 }],
  },
  {
    id: "V-SOM", code: "UC-01", name: "SPIRIT OF MUMBAI", berth: "B2",
    etaMin: hm(6, 15), etdMin: hm(22, 45), etaSigmaMin: 20,
    teu: 2600, loaM: 300, reefers: 140, opsKw: 750,
    cranes: [
      { fromMin: hm(6, 15), cranes: 4 },
      { fromMin: hm(17), cranes: 2 },
    ],
  },
  {
    id: "V-APU", code: "UC-02", name: "ONE APUS", berth: "B3",
    etaMin: hm(12, 30), etdMin: hm(30), etaSigmaMin: 40,
    teu: 3200, loaM: 364, reefers: 180, opsKw: 820,
    cranes: [{ fromMin: hm(12, 30), cranes: 3 }],
  },
  {
    id: "V-TCS", code: "FD-07", name: "TC SYMPHONY", berth: "B1",
    etaMin: hm(13, 15), etdMin: hm(19), etaSigmaMin: 30,
    teu: 450, loaM: 150, reefers: 30, opsKw: 0,
    cranes: [{ fromMin: hm(13, 15), cranes: 1 }],
  },
];

/** Cloud factor at window midpoints 01:00, 03:00 … 23:00 (overcast afternoon). */
export const BASE_CLOUD = [1, 1, 1, 1, 0.98, 0.95, 0.88, 0.4, 0.3, 0.3, 1, 1];

export const BASE_SCENARIO: ForecastScenario = {
  vessels: BASE_VESSELS,
  reeferFactor: 1,
  cloud: BASE_CLOUD,
  pvReduction: 0,
};

/** Operational context per 2-hour window (base plan, no status wording). */
const WINDOW_SUMMARIES: BilingualText[] = [
  { en: "Night discharge of TAN CANG GLORY at B1 (2 STS cranes)", vn: "Dỡ hàng đêm tàu TAN CANG GLORY tại B1 (2 cẩu STS)" },
  { en: "Off-peak window: EV tractor charging & reefer pre-cooling", vn: "Khung thấp điểm: sạc xe đầu kéo điện và làm lạnh trước container lạnh" },
  { en: "TAN CANG GLORY finishing and leaving B1; morning shift handover", vn: "TAN CANG GLORY hoàn tất và rời B1; giao ca sáng" },
  { en: "SPIRIT OF MUMBAI berths at B2; shore power connected", vn: "SPIRIT OF MUMBAI cập cầu B2; đấu nối điện bờ" },
  { en: "4 STS cranes on SPIRIT OF MUMBAI; reefer cooling demand rising", vn: "4 cẩu STS làm tàu SPIRIT OF MUMBAI; nhu cầu làm lạnh container tăng" },
  { en: "Morning peak tariff; rooftop PV covers a large share of demand", vn: "Giờ cao điểm buổi sáng; điện mặt trời áp mái bù phần lớn phụ tải" },
  { en: "ONE APUS berths at B3, TC SYMPHONY at B1; clouds building from 13:00", vn: "ONE APUS cập B3, TC SYMPHONY cập B1; mây tăng dần từ 13:00" },
  { en: "3 vessels worked in parallel (8 STS) + shore power; overcast sky cuts PV", vn: "3 tàu làm hàng song song (8 cẩu STS) + điện bờ; trời nhiều mây làm giảm điện mặt trời" },
  { en: "Parallel crane work continues, reefer yard near capacity, PV almost gone", vn: "Tiếp tục làm hàng song song, bãi lạnh gần đầy, điện mặt trời gần như bằng 0" },
  { en: "Evening shift change; SPIRIT OF MUMBAI down to 2 STS, TC SYMPHONY departs", vn: "Giao ca chiều; SPIRIT OF MUMBAI giảm còn 2 cẩu STS, TC SYMPHONY rời cảng" },
  { en: "Steady night discharge on 2 vessels", vn: "Dỡ hàng ổn định ban đêm trên 2 tàu" },
  { en: "SPIRIT OF MUMBAI departs B2; off-peak tariff begins", vn: "SPIRIT OF MUMBAI rời B2; bắt đầu giờ thấp điểm" },
];

// ---------------------------------------------------------------------------
// Physical / operational parameters of the approximation model
// ---------------------------------------------------------------------------

const PHYS = {
  stsKwPerCrane: 470,
  rtgKwPerCrane: 190,
  rtgBaseKw: 150,
  reeferBaseCount: 330,
  reeferKwAt28C: 2.55,
  reeferKwPerDeg: 0.06,
  auxBaseKw: 150,
  lightingKw: 270,
  hvacKwPerDeg: 25,
  pvClearSkyPeakKw: 2000,
  pvKwp: 2450,
  mooringMin: 30,
  unmooringMin: 45,
  rampMin: 30,
};

const PV_SUNRISE = hm(6);
const PV_SUNSET = hm(18);

function clearSkyPv(minute: number): number {
  if (minute <= PV_SUNRISE || minute >= PV_SUNSET) return 0;
  const x = Math.sin((Math.PI * (minute - PV_SUNRISE)) / (PV_SUNSET - PV_SUNRISE));
  return PHYS.pvClearSkyPeakKw * Math.pow(x, 1.3);
}

function tempAt(minute: number): number {
  return 29.5 + 4.3 * Math.cos((2 * Math.PI * (minute - hm(14, 30))) / DAY_MINUTES);
}

function shiftFactor(minute: number): number {
  return (minute >= hm(6) && minute < hm(6, 30)) || (minute >= hm(18) && minute < hm(18, 30)) ? 0.6 : 1;
}

function evChargingAt(minute: number): number {
  if (minute >= hm(22) || minute < hm(5)) return 320;
  if (minute < hm(6)) return 160;
  if (minute >= hm(11) && minute < hm(13, 30)) return 180; // midday solar charging
  return 60;
}

function workWindow(v: VesselCall) {
  return { start: v.etaMin + PHYS.mooringMin, end: v.etdMin - PHYS.unmooringMin };
}

export function cranesAt(v: VesselCall, minute: number): number {
  const { start, end } = workWindow(v);
  if (minute < start || minute >= end) return 0;
  let c = v.cranes[0]?.cranes ?? 0;
  for (const seg of v.cranes) if (minute >= seg.fromMin) c = seg.cranes;
  const ramp = Math.min(1, (minute - start) / PHYS.rampMin, (end - minute) / PHYS.rampMin);
  return c * ramp;
}

function opsAt(v: VesselCall, minute: number): number {
  return minute >= v.etaMin + PHYS.mooringMin && minute < v.etdMin - PHYS.mooringMin ? v.opsKw : 0;
}

function dischargeProgress(v: VesselCall, minute: number): number {
  const { start, end } = workWindow(v);
  if (end <= start) return 0;
  return clamp((minute - start) / (end - start), 0, 1);
}

/** Peak load a vessel call can add (used for ETA-uncertainty widening). */
function vesselPeakLoad(v: VesselCall): number {
  const maxCranes = Math.max(...v.cranes.map((c) => c.cranes));
  return maxCranes * (PHYS.stsKwPerCrane + PHYS.rtgKwPerCrane) + v.opsKw;
}

// Deterministic noise (generated once, indexed by interval)
const SEED = 20251123;
const NOISE = (() => {
  const rand = mulberry32(SEED);
  const load: number[] = [];
  const pv: number[] = [];
  const actual: number[] = [];
  let ar = 0;
  for (let i = 0; i < POINTS_PER_DAY; i++) {
    load.push((rand() - 0.5) * 70);
    pv.push(1 + (rand() - 0.5) * 0.06);
    // AR(1) metering error, roughly N(0, 60 kW)
    const u1 = Math.max(rand(), 1e-9);
    const u2 = rand();
    const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    ar = 0.6 * ar + 48 * gauss;
    actual.push(ar);
  }
  return { load, pv, actual };
})();

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

function computePoint(i: number, s: ForecastScenario, preset: TouPreset): ForecastPoint {
  const minute = i * INTERVAL_MINUTES;
  const mid = minute + INTERVAL_MINUTES / 2;
  const locked = minute < LOCK_MINUTE;
  const tempC = tempAt(mid);
  const sf = shiftFactor(mid);

  let sts = 0;
  let rtg = PHYS.rtgBaseKw;
  let ops = 0;
  let cranes = 0;
  let reefers = PHYS.reeferBaseCount;
  const byVessel: Record<string, number> = {};
  for (const v of s.vessels) {
    const c = cranesAt(v, mid) * sf;
    const o = opsAt(v, mid);
    const vSts = c * PHYS.stsKwPerCrane;
    const vRtg = c * PHYS.rtgKwPerCrane;
    sts += vSts;
    rtg += vRtg;
    ops += o;
    cranes += c;
    reefers += v.reefers * dischargeProgress(v, mid);
    byVessel[v.id] = Math.round(vSts + vRtg + o);
  }
  reefers *= s.reeferFactor;
  const reeferKw = reefers * (PHYS.reeferKwAt28C + PHYS.reeferKwPerDeg * (tempC - 28));
  const aux =
    PHYS.auxBaseKw +
    (mid < PV_SUNRISE || mid >= PV_SUNSET ? PHYS.lightingKw : 0) +
    PHYS.hvacKwPerDeg * Math.max(0, tempC - 26);

  const feeders: FeederValues = {
    f01: Math.round(sts),
    f02: Math.max(0, Math.round(rtg + NOISE.load[i])), // e-RTG absorbs model noise
    f03: Math.round(reeferKw),
    f04: Math.round(ops),
    f05: evChargingAt(mid),
    f06: Math.round(aux),
  };
  const p50 = feeders.f01 + feeders.f02 + feeders.f03 + feeders.f04 + feeders.f05 + feeders.f06;

  const pvFactor = locked ? 1 : 1 - s.pvReduction;
  const pv = Math.max(0, Math.round(clearSkyPv(mid) * interpolateAnchors(s.cloud, mid) * NOISE.pv[i] * pvFactor));
  const netGrid = p50 - pv;

  // σ: base share of load, growing with lead time, widened around uncertain ETAs
  let sigma: number;
  if (locked) {
    sigma = 0.012 * p50;
  } else {
    const leadH = (minute - LOCK_MINUTE) / 60;
    sigma = 0.017 * p50 * (1 + 0.02 * leadH);
    for (const v of s.vessels) {
      if (v.etaMin <= LOCK_MINUTE) continue;
      const d = (mid - v.etaMin) / (1.5 * v.etaSigmaMin);
      sigma += vesselPeakLoad(v) * 0.18 * Math.exp(-d * d);
    }
  }
  const band = Math.round(Z90 * sigma);
  sigma = band / Z90;

  return {
    minute,
    label: minuteLabel(minute),
    p10: p50 - band,
    p50,
    p90: p50 + band,
    pv,
    netGrid,
    sigma,
    pPeak: exceedanceProbability(netGrid, sigma),
    tou: touBandAt(minute, preset),
    feeders,
    byVessel,
    cranes: Math.round(cranes * 10) / 10,
    reefers: Math.round(reefers),
    tempC: Math.round(tempC * 10) / 10,
    actual: locked ? Math.round(p50 + NOISE.actual[i]) : null,
    locked,
  };
}

function majorityTou(points: ForecastPoint[]): TouBand {
  const counts: Record<TouBand, number> = { OFF_PEAK: 0, STANDARD: 0, PEAK: 0 };
  points.forEach((p) => counts[p.tou]++);
  return (Object.keys(counts) as TouBand[]).reduce((a, b) => (counts[b] > counts[a] ? b : a));
}

function buildWindows(points: ForecastPoint[], s: ForecastScenario): ForecastWindowRecord[] {
  return WINDOW_SUMMARIES.map((summary, i) => {
    const startMinute = i * 120;
    const endMinute = startMinute + 120;
    const pts = points.slice(i * 8, i * 8 + 8);
    const rep = pts.reduce((a, b) => (b.netGrid > a.netGrid ? b : a));
    const maxP = pts.reduce((a, b) => (b.pPeak > a.pPeak ? b : a));
    const peakPv = Math.max(...pts.map((p) => p.pv));
    const present = s.vessels.filter((v) => v.etaMin < endMinute && v.etdMin > startMinute);

    let status: WindowStatus = "NORMAL";
    if (rep.netGrid > SUBSTATION_LIMIT_KW) status = "OVERLOAD";
    else if (maxP.pPeak >= P_PEAK_SWITCH) status = "WARNING";
    else if (peakPv >= 800) status = "HIGH_SOLAR";

    return {
      id: minuteLabel(startMinute),
      startMinute,
      timeWindow: `${minuteLabel(startMinute)} – ${minuteLabel(endMinute)}`,
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
      vessels: present.map((v) => v.name),
      vesselCodes: present.map((v) => v.code),
      berth: Array.from(new Set(present.map((v) => v.berth))).sort().join(" & ") || "—",
      stsCranes: Math.round(Math.max(...pts.map((p) => p.cranes))),
      reeferPlugs: rep.reefers,
      shorePowerKw: rep.feeders.f04,
      tempAmbC: rep.tempC,
      solarIrradianceWm2: Math.round((rep.pv / (PHYS.pvKwp * 0.8)) * 1000),
      summary,
      feeders: rep.feeders,
      points: pts,
    };
  });
}

function buildKpis(points: ForecastPoint[], windows: ForecastWindowRecord[]): ForecastKpis {
  const peakNet = points.reduce((a, b) => (b.netGrid > a.netGrid ? b : a));
  const peakPv = points.reduce((a, b) => (b.pv > a.pv ? b : a));
  const maxPPeak = points.reduce((a, b) => (b.pPeak > a.pPeak ? b : a));
  const overloadWindows = windows.filter((w) => w.status === "OVERLOAD");
  const warningWindows = windows.filter((w) => w.status === "WARNING");
  const peakWindow = windows.find((w) => w.points.includes(peakNet)) ?? windows[0];
  return {
    peakNetGrid: peakNet,
    peakWindow,
    peakPv,
    overloadWindows,
    warningWindows,
    alertWindows: [...overloadWindows, ...warningWindows].sort((a, b) => a.startMinute - b.startMinute),
    switchIntervals: points.filter((p) => p.pPeak >= P_PEAK_SWITCH).length,
    maxPPeak,
    accuracyPct: 100 - MODEL_METRICS.mapePct,
  };
}

/**
 * Runs the approximation model for a scenario. When `lockedFrom` is given,
 * intervals before LOCK_MINUTE are copied from it (the past is locked).
 */
export function computeForecast(
  scenario: ForecastScenario,
  preset: TouPreset = DEFAULT_TOU_PRESET,
  lockedFrom?: ForecastResult
): ForecastResult {
  const points: ForecastPoint[] = [];
  for (let i = 0; i < POINTS_PER_DAY; i++) {
    const minute = i * INTERVAL_MINUTES;
    if (lockedFrom && minute < LOCK_MINUTE) {
      const p = lockedFrom.points[i];
      points.push({ ...p, tou: touBandAt(minute, preset) });
    } else {
      points.push(computePoint(i, scenario, preset));
    }
  }
  const windows = buildWindows(points, scenario);
  return { scenario, preset, points, windows, kpis: buildKpis(points, windows) };
}

// ---------------------------------------------------------------------------
// What-if simulation
// ---------------------------------------------------------------------------

export interface WhatIfInput {
  vesselId: string;
  /** shift of the whole call (ETA & ETD), minutes, −180…180 */
  etaShiftMin: number;
  /** STS cranes assigned to the selected vessel (null = plan) */
  cranes: number | null;
  /** reefer count change in percent, −20…20 */
  reeferPct: number;
  /** extra cloud cover → PV reduction in percent, 0…80 */
  pvReductionPct: number;
}

/** Vessels whose ETA is after the last update can be shifted. */
export const WHAT_IF_VESSELS = BASE_VESSELS.filter((v) => v.etaMin > LOCK_MINUTE);

export const DEFAULT_WHAT_IF: WhatIfInput = {
  vesselId: WHAT_IF_VESSELS[0]?.id ?? BASE_VESSELS[0].id,
  etaShiftMin: 0,
  cranes: null,
  reeferPct: 0,
  pvReductionPct: 0,
};

export function planCranes(v: VesselCall): number {
  return Math.max(...v.cranes.map((c) => c.cranes));
}

export function applyWhatIf(base: ForecastScenario, w: WhatIfInput): ForecastScenario {
  return {
    ...base,
    reeferFactor: base.reeferFactor * (1 + w.reeferPct / 100),
    pvReduction: w.pvReductionPct / 100,
    vessels: base.vessels.map((v) => {
      if (v.id !== w.vesselId) return v;
      const shift = w.etaShiftMin;
      const cranes = w.cranes ?? null;
      return {
        ...v,
        etaMin: v.etaMin + shift,
        etdMin: v.etdMin + shift,
        cranes: v.cranes.map((c) => ({ fromMin: c.fromMin + shift, cranes: cranes ?? c.cranes })),
      };
    }),
  };
}

export type ReforecastTrigger = "ETA" | "REEFER" | "THROUGHPUT" | "STS_STOP";

/** Event-based re-forecast rules: ETA ≥ 30 min, reefer ≥ 10 %, throughput ≥ 15 %, STS stop. */
export function reforecastTriggers(w: WhatIfInput): ReforecastTrigger[] {
  const out: ReforecastTrigger[] = [];
  if (Math.abs(w.etaShiftMin) >= 30) out.push("ETA");
  if (Math.abs(w.reeferPct) >= 10) out.push("REEFER");
  const v = BASE_VESSELS.find((x) => x.id === w.vesselId);
  if (v && w.cranes !== null) {
    const plan = planCranes(v);
    if (Math.abs(w.cranes - plan) / plan >= 0.15) out.push("THROUGHPUT");
    if (w.cranes < plan) out.push("STS_STOP");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Base result (used by the page, exports and Module 3 hand-off)
// ---------------------------------------------------------------------------

export const BASE_FORECAST: ForecastResult = computeForecast(BASE_SCENARIO);
export const FORECAST_POINTS = BASE_FORECAST.points;
export const FORECAST_WINDOWS = BASE_FORECAST.windows;
export const MODULE1_KPIS = BASE_FORECAST.kpis;

/** 1 day-ahead run + one update every 15 minutes since 22:00. */
export const ROLLING_UPDATES_SINCE_ISSUE = (LOCK_MINUTE - ISSUE_MINUTE) / INTERVAL_MINUTES;

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

/** Event-based re-forecasts already run today (see the re-forecast log). */
export const EVENT_REFORECASTS_TODAY = 3;
/** Version = day-ahead run + rolling updates + event-based re-forecasts. */
export const FORECAST_VERSION = 1 + ROLLING_UPDATES_SINCE_ISSUE + EVENT_REFORECASTS_TODAY;
