/**
 * Module 2 (e-INV) – carbon accounting single source of truth.
 *
 * Dataset v2: 12 vessel calls at Cát Lái, 17–23/11/2026, 28,650 TEU,
 * 471,787 kgCO₂e (report). The four calls of the M-1 forecast day reuse the
 * M-1 vessel definitions (berth, ETA/ETD, cranes, TEU) unchanged.
 *
 * Electricity is allocated from the six feeders, fuel from the tank ledger:
 *   OPS (E_OPS,v) and tug fuel (F_tug,v)  → measured directly
 *   STS: E_F01 × Q·w·(1−η) / Σ            → allocated
 *   e-RTG: E_F02,vessel × Q / ΣQ          → allocated (estimated where no sub-meter)
 *   Reefer: E_F03 × N·H·[1+α(Tamb−Tset)]  → allocated
 *   Diesel tractors: F × Q·d / Σ          → allocated
 * Scope 2 is location-based: grid energy × EF; on-site PV carries no
 * emissions, so each consumer's Scope 2 = E × EF × (E_grid / E_load).
 */
import {
  BASE_FORECAST,
  BASE_VESSELS,
  BilingualText,
  BerthId,
  CraneSegment,
  DAY_MINUTES,
  FeederKey,
  INTERVAL_MINUTES,
  NOW_MINUTE,
  PHYS,
  VesselCall,
  cranesAt,
  minuteLabel,
} from "./module1Forecast";
import { DIESEL_EF_KG_PER_L, EMISSION_FACTORS, GRID_EF_KG_PER_KWH, activeFactor } from "./emissionFactors";
import { BASE_DISPATCH } from "./module3PeakShaving";
import { sha256Hex } from "../utils/sha256";

// ---------------------------------------------------------------------------
// Report constants
// ---------------------------------------------------------------------------

export const REPORT_TARGETS = { calls: 12, teu: 28650, totalKg: 471787, intensity: 16.47 };
export const BALANCE_STATS = { transformerLossPct: 0.42, deltaBalPct: 0.41, rawDeltaBalPct: 11.3, thresholdPct: 1.0 };
export const FUEL_THRESHOLD_PCT = 2.0;
export const METHOD_VERSION = "G-PORT M2 v1.3 · GLEC v3.1 / ISO 14083 · GHG Protocol (location-based)";
export const PORT_NAME: BilingualText = { en: "Tan Cang – Cat Lai Terminal", vn: "Cảng Tân Cảng – Cát Lái" };

/** Day 0 = 23/11/2026 (the M-1 forecast day). */
export const PERIOD = { fromDay: -6, toDay: 0, fromIso: "2026-11-17", toIso: "2026-11-23" };
const DAY0 = new Date(Date.UTC(2026, 10, 23));

export function dayIso(dayOffset: number): string {
  return new Date(DAY0.getTime() + dayOffset * 86400000).toISOString().slice(0, 10);
}
/** "dd/mm HH:MM" for minutes relative to 23/11 00:00. */
export function stamp(minute: number): string {
  const day = Math.floor(minute / DAY_MINUTES);
  const [, m, d] = dayIso(day).split("-");
  return `${d}/${m} ${minuteLabel(minute - day * DAY_MINUTES)}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataLevel = "MEASURED" | "ALLOCATED" | "ESTIMATED";
export type RecordStatus = "DRAFT" | "RECONCILED" | "LOCKED" | "SHARED";
export type SourceKey = "STS" | "RTG" | "REEFER" | "OPS" | "TUG" | "TRACTOR";
export const SOURCE_KEYS: SourceKey[] = ["STS", "RTG", "REEFER", "OPS", "TUG", "TRACTOR"];

export const SOURCE_META: Record<SourceKey, { name: BilingualText; scope: 1 | 2; unit: "kWh" | "L"; feeder: FeederKey | null; color: string }> = {
  STS: { name: { en: "STS cranes", vn: "Cẩu STS" }, scope: 2, unit: "kWh", feeder: "f01", color: "#004B91" },
  RTG: { name: { en: "e-RTG cranes", vn: "Cẩu e-RTG" }, scope: 2, unit: "kWh", feeder: "f02", color: "#4A81C9" },
  REEFER: { name: { en: "Reefers", vn: "Container lạnh" }, scope: 2, unit: "kWh", feeder: "f03", color: "#0EA5E9" },
  OPS: { name: { en: "Shore power (OPS)", vn: "Điện bờ (OPS)" }, scope: 2, unit: "kWh", feeder: "f04", color: "#7C3AED" },
  TUG: { name: { en: "Tugs (diesel)", vn: "Tàu lai (dầu DO)" }, scope: 1, unit: "L", feeder: null, color: "#B45309" },
  TRACTOR: { name: { en: "Diesel tractors", vn: "Xe đầu kéo diesel" }, scope: 1, unit: "L", feeder: null, color: "#F59E0B" },
};

export interface CallSpec {
  id: string;
  recordNo: string;
  vessel: string;
  imo: string;
  voyage: string;
  carrier: string;
  berth: BerthId;
  etaMin: number;
  etdMin: number;
  teu: number;
  cranes: CraneSegment[];
  opsKw: number;
  reefers: number;
  /** share of frozen reefers (T_set −18 °C), rest chilled (+2 °C) */
  frozenShare: number;
  /** lift load factor w (share of 40' boxes) */
  liftFactor: number;
  /** STS regenerative (AFE) ratio η */
  regenRatio: number;
  tugs: number;
  status: RecordStatus;
  /** carrier contact the record is shared with */
  sharedWith?: string;
}

export interface EmissionLine {
  source: SourceKey;
  quantity: number;
  unit: "kWh" | "L";
  factorId: string;
  factorValue: number;
  /** effective factor incl. grid share for electricity */
  effectiveFactor: number;
  kg: number;
  level: DataLevel;
  /** allocation weight w_v (0…1) for allocated lines */
  weight: number | null;
  /** pool the line was allocated from (kWh or L) */
  pool: number | null;
}

export interface CallRecord extends CallSpec {
  lines: EmissionLine[];
  scope1Kg: number;
  scope2Kg: number;
  totalKg: number;
  intensity: number;
  measuredPct: number;
  electricityKwh: number;
  fuelL: number;
  berthHours: number;
  complete: boolean;
  factorVersion: string;
  hash: string;
  /** avoided ship auxiliary-engine emissions thanks to OPS (carrier Scope 3, influence only) */
  avoidedAuxKg: number;
  uncertaintyPct: number;
}

// ---------------------------------------------------------------------------
// The 12 calls (first 8 before the M-1 day, last 4 = M-1 BASE_VESSELS)
// ---------------------------------------------------------------------------

const H = 60;
const d = (day: number, h: number, m = 0) => day * DAY_MINUTES + h * H + m;
const seg = (fromMin: number, cranes: number): CraneSegment[] => [{ fromMin, cranes }];

const EARLY_CALLS: CallSpec[] = [
  { id: "C01", recordNo: "HS-2611-01", vessel: "GSL KITHIRA", imo: "9385609", voyage: "443S", carrier: "Maersk / Tân Cảng Intermodal", berth: "B2", etaMin: d(-6, 4), etdMin: d(-6, 21), teu: 2100, cranes: seg(d(-6, 4), 3), opsKw: 0, reefers: 90, frozenShare: 0.6, liftFactor: 1.15, regenRatio: 0.24, tugs: 2, status: "SHARED", sharedWith: "Maersk A/S" },
  { id: "C02", recordNo: "HS-2611-02", vessel: "WAN HAI 357", imo: "9442586", voyage: "S172", carrier: "Wan Hai Lines", berth: "B1", etaMin: d(-6, 14), etdMin: d(-5, 6), teu: 1950, cranes: seg(d(-6, 14), 2), opsKw: 0, reefers: 70, frozenShare: 0.5, liftFactor: 1.05, regenRatio: 0.22, tugs: 2, status: "SHARED", sharedWith: "Wan Hai Lines" },
  { id: "C03", recordNo: "HS-2611-03", vessel: "CMA CGM TAGE", imo: "9454395", voyage: "0FF3NW1", carrier: "CMA CGM", berth: "B3", etaMin: d(-5, 8), etdMin: d(-4, 4), teu: 4100, cranes: seg(d(-5, 8), 4), opsKw: 900, reefers: 210, frozenShare: 0.7, liftFactor: 1.25, regenRatio: 0.28, tugs: 3, status: "SHARED", sharedWith: "CMA CGM" },
  { id: "C04", recordNo: "HS-2611-04", vessel: "GSL SYROS", imo: "9488102", voyage: "219N", carrier: "Maersk / Tân Cảng Intermodal", berth: "B2", etaMin: d(-4, 2), etdMin: d(-4, 20), teu: 2700, cranes: seg(d(-4, 2), 3), opsKw: 0, reefers: 110, frozenShare: 0.6, liftFactor: 1.15, regenRatio: 0.24, tugs: 2, status: "SHARED", sharedWith: "Maersk A/S" },
  { id: "C05", recordNo: "HS-2611-05", vessel: "SITC SHANGHAI", imo: "9632545", voyage: "2247S", carrier: "SITC", berth: "B1", etaMin: d(-4, 12), etdMin: d(-3, 3), teu: 1650, cranes: seg(d(-4, 12), 2), opsKw: 0, reefers: 60, frozenShare: 0.4, liftFactor: 1.0, regenRatio: 0.22, tugs: 2, status: "SHARED", sharedWith: "SITC Container Lines" },
  { id: "C06", recordNo: "HS-2611-06", vessel: "EVER CONCORD", imo: "9811000", voyage: "0451-038S", carrier: "Evergreen", berth: "B3", etaMin: d(-3, 6), etdMin: d(-2, 2), teu: 4250, cranes: seg(d(-3, 6), 4), opsKw: 950, reefers: 220, frozenShare: 0.7, liftFactor: 1.25, regenRatio: 0.28, tugs: 3, status: "LOCKED" },
  { id: "C07", recordNo: "HS-2611-07", vessel: "COSCO PRIDE", imo: "9516416", voyage: "072S", carrier: "COSCO Shipping", berth: "B2", etaMin: d(-2, 5), etdMin: d(-2, 23), teu: 3300, cranes: seg(d(-2, 5), 3), opsKw: 780, reefers: 150, frozenShare: 0.6, liftFactor: 1.2, regenRatio: 0.24, tugs: 3, status: "LOCKED" },
  { id: "C08", recordNo: "HS-2611-08", vessel: "TAN CANG FUTURE", imo: "9701227", voyage: "088N", carrier: "Tân Cảng Shipping", berth: "B1", etaMin: d(-2, 16), etdMin: d(-1, 8), teu: 1250, cranes: seg(d(-2, 16), 2), opsKw: 0, reefers: 50, frozenShare: 0.4, liftFactor: 1.0, regenRatio: 0.22, tugs: 2, status: "RECONCILED" },
];

const M1_EXTRA: Record<string, Pick<CallSpec, "recordNo" | "imo" | "voyage" | "carrier" | "frozenShare" | "liftFactor" | "regenRatio" | "tugs" | "status">> = {
  "V-TCG": { recordNo: "HS-2611-09", imo: "9632480", voyage: "104S", carrier: "Tân Cảng Shipping / SNP", frozenShare: 0.5, liftFactor: 1.05, regenRatio: 0.22, tugs: 2, status: "RECONCILED" },
  "V-SOM": { recordNo: "HS-2611-10", imo: "9845210", voyage: "056N", carrier: "ONE / Tân Cảng Shipping", frozenShare: 0.6, liftFactor: 1.2, regenRatio: 0.24, tugs: 2, status: "DRAFT" },
  "V-APU": { recordNo: "HS-2611-11", imo: "9806079", voyage: "012W", carrier: "ONE (The Alliance)", frozenShare: 0.7, liftFactor: 1.25, regenRatio: 0.28, tugs: 3, status: "DRAFT" },
  "V-TCS": { recordNo: "HS-2611-12", imo: "9744011", voyage: "301N", carrier: "Tân Cảng Shipping", frozenShare: 0.4, liftFactor: 1.0, regenRatio: 0.22, tugs: 2, status: "DRAFT" },
};

const M1_CALLS: CallSpec[] = BASE_VESSELS.map((v: VesselCall, i) => ({
  id: `C${String(9 + i).padStart(2, "0")}`,
  vessel: v.name,
  berth: v.berth,
  etaMin: v.etaMin,
  etdMin: v.etdMin,
  teu: v.teu,
  cranes: v.cranes,
  opsKw: v.opsKw,
  reefers: v.reefers,
  ...M1_EXTRA[v.id],
}));

export const CALL_SPECS: CallSpec[] = [...EARLY_CALLS, ...M1_CALLS];

// ---------------------------------------------------------------------------
// Physical quantities per call (same physics as M-1)
// ---------------------------------------------------------------------------

const OPS_LOAD_FACTOR = 0.8;
const TUG_HOURS = 1.5;
const TUG_L_PER_H = 160;
const TRACTOR_L_PER_TEU = 0.55;
const REEFER_KW_BASE = 1.5;
const REEFER_ALPHA = 0.015;
const T_AMB = 29.5;
const F01_UNALLOCATED_SHARE = 0.03;
const F03_UNALLOCATED_SHARE = 0.08;
/** berths whose e-RTG block has no sub-meter yet → RTG lines are estimates */
const RTG_UNMETERED_BERTHS: BerthId[] = ["B1"];
/** diesel equivalent of 1 kWh from ship auxiliary engines: SFOC 220 g/kWh × 3.206 kgCO₂/kg MGO */
export const AUX_ENGINE_KG_PER_KWH = 0.705;

function asVessel(c: CallSpec): VesselCall {
  return { id: c.id, code: c.recordNo, name: c.vessel, berth: c.berth, etaMin: c.etaMin, etdMin: c.etdMin, etaSigmaMin: 0, teu: c.teu, loaM: 0, reefers: c.reefers, opsKw: c.opsKw, cranes: c.cranes };
}

interface Physical {
  craneHours: number;
  stsKwh: number;
  rtgKwh: number;
  opsKwh: number;
  tugL: number;
  tractorL: number;
  reeferWeight: number;
  berthHours: number;
}

function physical(c: CallSpec): Physical {
  const v = asVessel(c);
  let craneHours = 0;
  for (let m = c.etaMin; m < c.etdMin; m += INTERVAL_MINUTES) craneHours += (cranesAt(v, m + INTERVAL_MINUTES / 2) * INTERVAL_MINUTES) / 60;
  const opsHours = Math.max(0, (c.etdMin - 30 - (c.etaMin + 30)) / 60);
  const tSet = c.frozenShare * -18 + (1 - c.frozenShare) * 2;
  return {
    craneHours,
    stsKwh: craneHours * PHYS.stsKwPerCrane,
    rtgKwh: craneHours * PHYS.rtgKwPerCrane,
    opsKwh: c.opsKw * opsHours * OPS_LOAD_FACTOR,
    tugL: c.tugs * TUG_HOURS * TUG_L_PER_H,
    tractorL: c.teu * TRACTOR_L_PER_TEU,
    reeferWeight: c.reefers * REEFER_KW_BASE * (1 + REEFER_ALPHA * (T_AMB - tSet)),
    berthHours: (c.etdMin - c.etaMin) / 60,
  };
}

const PHYSICAL = CALL_SPECS.map(physical);

// Facility energy that is not allocated to calls, from the M-1 day × 7 days
const m1DayKwh = (f: (p: (typeof BASE_FORECAST.points)[number]) => number) =>
  BASE_FORECAST.points.reduce((s, p) => s + f(p) * (INTERVAL_MINUTES / 60), 0);
const DAYS = PERIOD.toDay - PERIOD.fromDay + 1;
const UNALLOC = {
  f02: PHYS.rtgBaseKw * 24 * DAYS,
  f05: m1DayKwh((p) => p.feeders.f05) * DAYS,
  f06: m1DayKwh((p) => p.feeders.f06) * DAYS,
};
const PV_KWH = m1DayKwh((p) => p.pv) * DAYS * 0.97;

// ---------------------------------------------------------------------------
// Allocation & calibration (average reefer dwell hours solved to the report total)
// ---------------------------------------------------------------------------

interface Solved {
  dwellHours: number;
  feeders: Record<FeederKey, { allocated: number; unallocated: number }>;
  eLoad: number;
  eLoss: number;
  eGrid: number;
  gridShare: number;
  raw: { sts: number[]; rtg: number[]; reefer: number[]; ops: number[]; tug: number[]; tractor: number[] };
  rawTotalKg: number;
}

function solveFor(dwellHours: number): Solved {
  const sumW = (f: (c: CallSpec, i: number) => number) => CALL_SPECS.reduce((s, c, i) => s + f(c, i), 0);
  const stsPool = sumW((_, i) => PHYSICAL[i].stsKwh);
  const stsW = CALL_SPECS.map((c) => c.teu * c.liftFactor * (1 - c.regenRatio));
  const stsWSum = stsW.reduce((a, b) => a + b, 0);
  const rtgPool = sumW((_, i) => PHYSICAL[i].rtgKwh);
  const teuSum = sumW((c) => c.teu);
  const reeferPool = sumW((_, i) => PHYSICAL[i].reeferWeight * dwellHours);
  const reeferWSum = sumW((_, i) => PHYSICAL[i].reeferWeight);

  const sts = stsW.map((w) => (stsPool * w) / stsWSum);
  const rtg = CALL_SPECS.map((c) => (rtgPool * c.teu) / teuSum);
  const reefer = PHYSICAL.map((p) => (reeferPool * p.reeferWeight) / reeferWSum);
  const ops = PHYSICAL.map((p) => p.opsKwh);
  const tug = PHYSICAL.map((p) => p.tugL);
  const tractor = PHYSICAL.map((p) => p.tractorL);

  const feeders: Solved["feeders"] = {
    f01: { allocated: stsPool, unallocated: stsPool * F01_UNALLOCATED_SHARE },
    f02: { allocated: rtgPool, unallocated: UNALLOC.f02 },
    f03: { allocated: reeferPool, unallocated: reeferPool * F03_UNALLOCATED_SHARE },
    f04: { allocated: ops.reduce((a, b) => a + b, 0), unallocated: 0 },
    f05: { allocated: 0, unallocated: UNALLOC.f05 },
    f06: { allocated: 0, unallocated: UNALLOC.f06 },
  };
  const eLoad = Object.values(feeders).reduce((s, f) => s + f.allocated + f.unallocated, 0);
  const eLoss = (eLoad * BALANCE_STATS.transformerLossPct) / 100;
  const eGrid = eLoad - PV_KWH + eLoss;
  const gridShare = eGrid / eLoad;
  const ef2 = GRID_EF_KG_PER_KWH * gridShare;
  const rawTotalKg = CALL_SPECS.reduce(
    (s, _, i) => s + (sts[i] + rtg[i] + reefer[i] + ops[i]) * ef2 + (tug[i] + tractor[i]) * DIESEL_EF_KG_PER_L,
    0
  );
  return { dwellHours, feeders, eLoad, eLoss, eGrid, gridShare, raw: { sts, rtg, reefer, ops, tug, tractor }, rawTotalKg };
}

const SOLVED: Solved = (() => {
  let lo = 1;
  let hi = 400;
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2;
    if (solveFor(mid).rawTotalKg < REPORT_TARGETS.totalKg) lo = mid;
    else hi = mid;
  }
  return solveFor((lo + hi) / 2);
})();

/** Largest-remainder rounding so the rounded parts add up to `total`. */
function roundTo(values: number[], total: number): number[] {
  const floors = values.map(Math.floor);
  let rest = total - floors.reduce((a, b) => a + b, 0);
  const order = values.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r);
  for (const o of order) {
    if (rest <= 0) break;
    floors[o.i]++;
    rest--;
  }
  return floors;
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

const GRID = activeFactor("GRID");
const DIESEL = activeFactor("DIESEL");
const U = { measuredElec: 0.2, measuredFuel: 1.0, allocated: Math.sqrt(0.2 ** 2 + BALANCE_STATS.deltaBalPct ** 2 + 2.5 ** 2), estimated: 10 };

export function lineUncertaintyPct(l: Pick<EmissionLine, "level" | "unit">): number {
  if (l.level === "ESTIMATED") return U.estimated;
  if (l.level === "ALLOCATED") return U.allocated;
  return l.unit === "L" ? U.measuredFuel : U.measuredElec;
}

function canonicalRecord(r: Omit<CallRecord, "hash">): string {
  return JSON.stringify({
    recordNo: r.recordNo,
    vessel: r.vessel,
    imo: r.imo,
    voyage: r.voyage,
    carrier: r.carrier,
    berth: r.berth,
    from: stamp(r.etaMin),
    to: stamp(r.etdMin),
    teu: r.teu,
    lines: r.lines.map((l) => ({ source: l.source, quantity: Math.round(l.quantity), unit: l.unit, factor: l.factorId, kg: l.kg, level: l.level })),
    totalKg: r.totalKg,
    intensity: Math.round(r.intensity * 100) / 100,
    method: METHOD_VERSION,
    factorVersion: r.factorVersion,
  });
}

const ef2 = GRID_EF_KG_PER_KWH * SOLVED.gridShare;
const rawCallKg = CALL_SPECS.map(
  (_, i) =>
    (SOLVED.raw.sts[i] + SOLVED.raw.rtg[i] + SOLVED.raw.reefer[i] + SOLVED.raw.ops[i]) * ef2 +
    (SOLVED.raw.tug[i] + SOLVED.raw.tractor[i]) * DIESEL_EF_KG_PER_L
);
const callKg = roundTo(rawCallKg, REPORT_TARGETS.totalKg);

export const CALL_RECORDS: CallRecord[] = CALL_SPECS.map((c, i) => {
  const complete = c.etdMin <= NOW_MINUTE;
  const qty: Record<SourceKey, number> = {
    STS: SOLVED.raw.sts[i],
    RTG: SOLVED.raw.rtg[i],
    REEFER: SOLVED.raw.reefer[i],
    OPS: SOLVED.raw.ops[i],
    TUG: SOLVED.raw.tug[i],
    TRACTOR: SOLVED.raw.tractor[i],
  };
  const rawKg = SOURCE_KEYS.map((k) => qty[k] * (SOURCE_META[k].unit === "kWh" ? ef2 : DIESEL_EF_KG_PER_L));
  const kg = roundTo(rawKg, callKg[i]);
  const level = (k: SourceKey): DataLevel => {
    if (!complete) return "ESTIMATED";
    if (k === "OPS" || k === "TUG") return "MEASURED";
    if (k === "RTG" && RTG_UNMETERED_BERTHS.includes(c.berth)) return "ESTIMATED";
    return "ALLOCATED";
  };
  const pools: Record<SourceKey, number | null> = {
    STS: SOLVED.feeders.f01.allocated,
    RTG: SOLVED.feeders.f02.allocated,
    REEFER: SOLVED.feeders.f03.allocated,
    OPS: null,
    TUG: null,
    TRACTOR: CALL_SPECS.reduce((s, _, j) => s + SOLVED.raw.tractor[j], 0),
  };
  const lines: EmissionLine[] = SOURCE_KEYS.map((k, j) => ({
    source: k,
    quantity: qty[k],
    unit: SOURCE_META[k].unit,
    factorId: SOURCE_META[k].unit === "kWh" ? GRID.id : DIESEL.id,
    factorValue: SOURCE_META[k].unit === "kWh" ? GRID.value : DIESEL.value,
    effectiveFactor: SOURCE_META[k].unit === "kWh" ? ef2 : DIESEL.value,
    kg: kg[j],
    level: level(k),
    weight: pools[k] ? qty[k] / (pools[k] as number) : null,
    pool: pools[k],
  })).filter((l) => l.quantity > 0);

  const scope1Kg = lines.filter((l) => SOURCE_META[l.source].scope === 1).reduce((s, l) => s + l.kg, 0);
  const scope2Kg = lines.filter((l) => SOURCE_META[l.source].scope === 2).reduce((s, l) => s + l.kg, 0);
  const totalKg = scope1Kg + scope2Kg;
  const measuredKg = lines.filter((l) => l.level === "MEASURED").reduce((s, l) => s + l.kg, 0);
  const uAbs = Math.sqrt(lines.reduce((s, l) => s + (l.kg * lineUncertaintyPct(l)) ** 2, 0));
  const base: Omit<CallRecord, "hash"> = {
    ...c,
    lines,
    scope1Kg,
    scope2Kg,
    totalKg,
    intensity: totalKg / c.teu,
    measuredPct: (measuredKg / totalKg) * 100,
    electricityKwh: lines.filter((l) => l.unit === "kWh").reduce((s, l) => s + l.quantity, 0),
    fuelL: lines.filter((l) => l.unit === "L").reduce((s, l) => s + l.quantity, 0),
    berthHours: PHYSICAL[i].berthHours,
    complete,
    factorVersion: GRID.id,
    avoidedAuxKg: qty.OPS * AUX_ENGINE_KG_PER_KWH,
    uncertaintyPct: uAbs / totalKg,
  };
  return { ...base, hash: sha256Hex(canonicalRecord(base)) };
});

export function recordCanonicalJson(r: CallRecord): string {
  return canonicalRecord(r);
}

// ---------------------------------------------------------------------------
// Totals, balance, facility view
// ---------------------------------------------------------------------------

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const LEDGER_TOTALS = {
  calls: CALL_RECORDS.length,
  teu: sum(CALL_RECORDS.map((r) => r.teu)),
  totalKg: sum(CALL_RECORDS.map((r) => r.totalKg)),
  scope1Kg: sum(CALL_RECORDS.map((r) => r.scope1Kg)),
  scope2Kg: sum(CALL_RECORDS.map((r) => r.scope2Kg)),
  measuredPct: (sum(CALL_RECORDS.flatMap((r) => r.lines.filter((l) => l.level === "MEASURED").map((l) => l.kg))) / REPORT_TARGETS.totalKg) * 100,
  intensity: REPORT_TARGETS.totalKg / REPORT_TARGETS.teu,
  uncertaintyPct:
    Math.sqrt(sum(CALL_RECORDS.flatMap((r) => r.lines.map((l) => (l.kg * lineUncertaintyPct(l)) ** 2)))) / REPORT_TARGETS.totalKg,
};

/** Energy balance of the ledger scope (all six feeders). */
export const ENERGY_BALANCE = {
  feeders: SOLVED.feeders,
  eLoad: SOLVED.eLoad,
  ePv: PV_KWH,
  eLoss: SOLVED.eLoss,
  eGridExpected: SOLVED.eGrid,
  eGridMetered: SOLVED.eGrid * (1 + BALANCE_STATS.deltaBalPct / 100),
  gridShare: SOLVED.gridShare,
  effectiveGridEf: ef2,
  reeferDwellHours: SOLVED.dwellHours,
  unallocatedKwh: sum(Object.values(SOLVED.feeders).map((f) => f.unallocated)),
  unallocatedKg: sum(Object.values(SOLVED.feeders).map((f) => f.unallocated)) * ef2,
};
/** Δbal = |E_grid,metered − E_grid,expected| / E_grid,metered */
export const DELTA_BAL_PCT =
  (Math.abs(ENERGY_BALANCE.eGridMetered - ENERGY_BALANCE.eGridExpected) / ENERGY_BALANCE.eGridMetered) * 100;

/** Facility-level emissions by source for the dataset (calls + unallocated). */
export type FacilitySource = SourceKey | "CHARGING" | "AUX";
export const FACILITY_SOURCES: Record<FacilitySource, { kg: number; name: BilingualText; color: string }> = {
  STS: { kg: sum(CALL_RECORDS.map((r) => r.lines.find((l) => l.source === "STS")?.kg ?? 0)) + SOLVED.feeders.f01.unallocated * ef2, name: SOURCE_META.STS.name, color: SOURCE_META.STS.color },
  RTG: { kg: sum(CALL_RECORDS.map((r) => r.lines.find((l) => l.source === "RTG")?.kg ?? 0)) + SOLVED.feeders.f02.unallocated * ef2, name: SOURCE_META.RTG.name, color: SOURCE_META.RTG.color },
  REEFER: { kg: sum(CALL_RECORDS.map((r) => r.lines.find((l) => l.source === "REEFER")?.kg ?? 0)) + SOLVED.feeders.f03.unallocated * ef2, name: SOURCE_META.REEFER.name, color: SOURCE_META.REEFER.color },
  OPS: { kg: sum(CALL_RECORDS.map((r) => r.lines.find((l) => l.source === "OPS")?.kg ?? 0)), name: SOURCE_META.OPS.name, color: SOURCE_META.OPS.color },
  CHARGING: { kg: SOLVED.feeders.f05.unallocated * ef2, name: { en: "EV charging", vn: "Trạm sạc" }, color: "#10B981" },
  AUX: { kg: SOLVED.feeders.f06.unallocated * ef2, name: { en: "Auxiliary", vn: "Phụ trợ" }, color: "#94A3B8" },
  TUG: { kg: sum(CALL_RECORDS.map((r) => r.lines.find((l) => l.source === "TUG")?.kg ?? 0)), name: SOURCE_META.TUG.name, color: SOURCE_META.TUG.color },
  TRACTOR: { kg: sum(CALL_RECORDS.map((r) => r.lines.find((l) => l.source === "TRACTOR")?.kg ?? 0)), name: SOURCE_META.TRACTOR.name, color: SOURCE_META.TRACTOR.color },
};
export const FACILITY_TOTAL_KG = sum(Object.values(FACILITY_SOURCES).map((s) => s.kg));

/** Emissions by zone (treemap). */
export const ZONES: { id: string; name: BilingualText; kg: number }[] = (() => {
  const byBerth = (b: BerthId) =>
    sum(CALL_RECORDS.filter((r) => r.berth === b).flatMap((r) => r.lines.filter((l) => l.source !== "REEFER").map((l) => l.kg)));
  return [
    { id: "B1", name: { en: "Berth B1", vn: "Cầu B1" }, kg: byBerth("B1") },
    { id: "B2", name: { en: "Berth B2", vn: "Cầu B2" }, kg: byBerth("B2") },
    { id: "B3", name: { en: "Berth B3", vn: "Cầu B3" }, kg: byBerth("B3") },
    { id: "REEFER", name: { en: "Reefer yard", vn: "Bãi lạnh" }, kg: FACILITY_SOURCES.REEFER.kg },
    { id: "YARD", name: { en: "Yard (e-RTG idle, crane aux)", vn: "Bãi (e-RTG chờ, phụ trợ cẩu)" }, kg: (SOLVED.feeders.f02.unallocated + SOLVED.feeders.f01.unallocated) * ef2 },
    { id: "CHARGING", name: { en: "EV charging hub", vn: "Trạm sạc" }, kg: FACILITY_SOURCES.CHARGING.kg },
    { id: "GATE", name: { en: "Gate & buildings", vn: "Cổng & tòa nhà" }, kg: FACILITY_SOURCES.AUX.kg },
  ];
})();

// ---------------------------------------------------------------------------
// Period series (Day = the 7 dataset days, attributed by arrival day)
// ---------------------------------------------------------------------------

export type PeriodKind = "DAY" | "MONTH" | "QUARTER" | "YEAR";
export interface SeriesPoint {
  label: string;
  scope1T: number;
  scope2T: number;
  teu: number;
  intensity: number;
  targetIntensity: number;
  synthetic: boolean;
}

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

/** Intensity target path: 2025 baseline 17.6 kg/TEU, −2 % per year. */
const BASELINE_INTENSITY_2025 = 17.6;
export const TARGET_INTENSITY_2026 = BASELINE_INTENSITY_2025 * 0.98;

const DAILY: SeriesPoint[] = (() => {
  const unalloc2PerDay = ENERGY_BALANCE.unallocatedKg / DAYS;
  return Array.from({ length: DAYS }, (_, k) => {
    const day = PERIOD.fromDay + k;
    const calls = CALL_RECORDS.filter((r) => Math.floor(r.etaMin / DAY_MINUTES) === day);
    const s1 = sum(calls.map((r) => r.scope1Kg));
    const s2 = sum(calls.map((r) => r.scope2Kg)) + unalloc2PerDay;
    const teu = sum(calls.map((r) => r.teu));
    const [, m, dd] = dayIso(day).split("-");
    return { label: `${dd}/${m}`, scope1T: s1 / 1000, scope2T: s2 / 1000, teu, intensity: teu ? (s1 + s2) / teu : 0, targetIntensity: TARGET_INTENSITY_2026, synthetic: false };
  });
})();

function synth(label: string, days: number, rand: () => number, trend = 1): SeriesPoint {
  const avg = { s1: sum(DAILY.map((x) => x.scope1T)) / DAYS, s2: sum(DAILY.map((x) => x.scope2T)) / DAYS, teu: REPORT_TARGETS.teu / DAYS };
  const vol = 0.85 + 0.3 * rand();
  const eff = trend * (0.97 + 0.06 * rand());
  const teu = Math.round(avg.teu * days * vol);
  const s1 = avg.s1 * days * vol * eff;
  const s2 = avg.s2 * days * (0.6 + 0.4 * vol) * eff;
  return { label, scope1T: s1, scope2T: s2, teu, intensity: ((s1 + s2) * 1000) / teu, targetIntensity: TARGET_INTENSITY_2026, synthetic: true };
}

export function periodSeries(kind: PeriodKind): SeriesPoint[] {
  const rand = mulberry32(2026 + kind.length);
  if (kind === "DAY") return DAILY;
  if (kind === "MONTH") {
    const early = Array.from({ length: 16 }, (_, i) => synth(`${String(i + 1).padStart(2, "0")}/11`, 1, rand));
    return [...early, ...DAILY];
  }
  if (kind === "QUARTER") {
    const starts = ["29/09", "06/10", "13/10", "20/10", "27/10", "03/11", "10/11"];
    const weeks = starts.map((s, i) => synth(s, 7, rand, 1.03 - i * 0.004));
    const last = DAILY.reduce(
      (a, x) => ({ ...a, scope1T: a.scope1T + x.scope1T, scope2T: a.scope2T + x.scope2T, teu: a.teu + x.teu }),
      { label: "17/11", scope1T: 0, scope2T: 0, teu: 0, intensity: 0, targetIntensity: TARGET_INTENSITY_2026, synthetic: false }
    );
    last.intensity = ((last.scope1T + last.scope2T) * 1000) / last.teu;
    return [...weeks, last];
  }
  const month = periodSeries("MONTH");
  const nov = month.reduce(
    (a, x) => ({ ...a, scope1T: a.scope1T + x.scope1T, scope2T: a.scope2T + x.scope2T, teu: a.teu + x.teu }),
    { label: "T11", scope1T: 0, scope2T: 0, teu: 0, intensity: 0, targetIntensity: TARGET_INTENSITY_2026, synthetic: true }
  );
  nov.intensity = ((nov.scope1T + nov.scope2T) * 1000) / nov.teu;
  const months = Array.from({ length: 10 }, (_, i) => synth(`T${i + 1}`, 30, rand, 1.06 - i * 0.008));
  return [...months, nov];
}

// ---------------------------------------------------------------------------
// Data quality (22/11, 6 feeders × 96 intervals) & discrepancies
// ---------------------------------------------------------------------------

export type QualityFlag = "VALID" | "INTERPOLATED" | "MISSING" | "ANOMALY";
export const QUALITY_DAY = dayIso(-1);
export const QUALITY_GRID: QualityFlag[][] = (() => {
  const grid: QualityFlag[][] = Array.from({ length: 6 }, () => Array<QualityFlag>(96).fill("VALID"));
  const interp: [number, number][] = [[0, 22], [1, 40], [2, 9], [2, 10], [3, 55], [4, 71], [5, 3], [5, 88]];
  interp.forEach(([f, i]) => (grid[f][i] = "INTERPOLATED"));
  grid[3][13] = "MISSING"; // F-04 03:15
  grid[1][59] = "ANOMALY"; // F-02 14:45
  return grid;
})();
export const QUALITY_VALID_PCT =
  (QUALITY_GRID.flat().filter((q) => q === "VALID" || q === "INTERPOLATED").length / QUALITY_GRID.flat().length) * 100;

export interface Discrepancy {
  when: string;
  meter: string;
  deviation: BilingualText;
  status: "RESOLVED" | "INVESTIGATING";
  action: BilingualText;
}
export const DISCREPANCIES: Discrepancy[] = [
  { when: stamp(d(-1, 14, 45)), meter: "F-02 e-RTG · MTR-F02", deviation: { en: "+18.4% vs model (spike)", vn: "+18,4% so với mô hình (xung)" }, status: "RESOLVED", action: { en: "Replaced by interpolated value", vn: "Thay bằng giá trị nội suy" } },
  { when: stamp(d(-1, 3, 15)), meter: "F-04 OPS B3 · MTR-OPS-B3", deviation: { en: "Missing 15-min reading", vn: "Thiếu số đo 15 phút" }, status: "RESOLVED", action: { en: "Linear interpolation, flagged", vn: "Nội suy tuyến tính, gắn cờ" } },
  { when: stamp(d(-2, 9, 0)), meter: "OPS B3 · MTR-OPS-B3", deviation: { en: "Clock drift 2 min", vn: "Lệch đồng hồ 2 phút" }, status: "RESOLVED", action: { en: "Time re-synchronised (NTP)", vn: "Đồng bộ lại thời gian (NTP)" } },
  { when: stamp(d(0, 7, 0)), meter: "Fuel tank T-02", deviation: { en: "Dip vs issue log 1.6%", vn: "Đo bồn lệch sổ xuất 1,6%" }, status: "INVESTIGATING", action: { en: "Awaiting temperature-corrected dip", vn: "Chờ đo bồn hiệu chỉnh nhiệt độ" } },
];

// ---------------------------------------------------------------------------
// Fuel reconciliation (tank ledger vs activity-based ΣF_k)
// ---------------------------------------------------------------------------

export const FUEL_RECON = (() => {
  const activityL = sum(CALL_RECORDS.map((r) => r.fuelL));
  const totL = activityL * 1.016;
  const opening = 38000;
  const receipts = 24000;
  const adjustment = -120;
  const closing = opening + receipts + adjustment - totL;
  return { opening, receipts, closing, adjustment, totL, activityL, diffPct: ((totL - activityL) / activityL) * 100 };
})();

// ---------------------------------------------------------------------------
// Integrity ledger (hash chain)
// ---------------------------------------------------------------------------

export interface AuditEntry {
  minute: number;
  action: BilingualText;
  actor: BilingualText;
  method: string;
  payloadHash: string;
  prevHash: string;
  hash: string;
}

export const AUDIT_LEDGER: AuditEntry[] = (() => {
  const events: Omit<AuditEntry, "prevHash" | "hash">[] = [
    { minute: d(-7, 0), action: { en: `Factor ${GRID.id} activated (${GRID.value})`, vn: `Kích hoạt hệ số ${GRID.id} (${GRID.value})` }, actor: { en: "Carbon accountant", vn: "Kế toán carbon" }, method: METHOD_VERSION, payloadHash: sha256Hex(JSON.stringify(EMISSION_FACTORS)) },
    { minute: d(-7, 1), action: { en: `Dataset v2 cleaned: Δbal ${BALANCE_STATS.rawDeltaBalPct}% → ${BALANCE_STATS.deltaBalPct}%`, vn: `Làm sạch Dataset v2: Δbal ${BALANCE_STATS.rawDeltaBalPct}% → ${BALANCE_STATS.deltaBalPct}%` }, actor: { en: "Input layer (system)", vn: "Lớp Đầu vào (hệ thống)" }, method: METHOD_VERSION, payloadHash: sha256Hex(`dataset-v2|${BALANCE_STATS.deltaBalPct}`) },
  ];
  for (const r of CALL_RECORDS) {
    if (r.status === "DRAFT") continue;
    events.push({ minute: r.etdMin + 6 * H, action: { en: `${r.recordNo} reconciled`, vn: `${r.recordNo} đã đối soát` }, actor: { en: "System (balance check)", vn: "Hệ thống (kiểm tra cân bằng)" }, method: METHOD_VERSION, payloadHash: sha256Hex(`${r.recordNo}|${r.totalKg}`) });
    if (r.status === "LOCKED" || r.status === "SHARED")
      events.push({ minute: r.etdMin + 24 * H, action: { en: `${r.recordNo} locked (SHA-256)`, vn: `${r.recordNo} đã khóa (SHA-256)` }, actor: { en: "Carbon accountant", vn: "Kế toán carbon" }, method: METHOD_VERSION, payloadHash: r.hash });
    if (r.status === "SHARED")
      events.push({ minute: r.etdMin + 30 * H, action: { en: `${r.recordNo} shared with ${r.sharedWith}`, vn: `${r.recordNo} đã chia sẻ cho ${r.sharedWith}` }, actor: { en: "Commercial dept.", vn: "Phòng thương mại" }, method: METHOD_VERSION, payloadHash: r.hash });
  }
  events.sort((a, b) => a.minute - b.minute);
  let prev = "0".repeat(64);
  return events
    .filter((e) => e.minute <= NOW_MINUTE)
    .map((e) => {
      const hash = sha256Hex([prev, e.minute, e.action.en, e.actor.en, e.method, e.payloadHash].join("|"));
      const entry = { ...e, prevHash: prev, hash };
      prev = hash;
      return entry;
    });
})();

export function verifyChain(entries: AuditEntry[] = AUDIT_LEDGER): boolean {
  let prev = "0".repeat(64);
  return entries.every((e) => {
    const ok = e.prevHash === prev && e.hash === sha256Hex([prev, e.minute, e.action.en, e.actor.en, e.method, e.payloadHash].join("|"));
    prev = e.hash;
    return ok;
  });
}

// ---------------------------------------------------------------------------
// IPMVP verification of the M-3 dispatch (same numbers as M-3)
// ---------------------------------------------------------------------------

export const IPMVP = {
  date: dayIso(0),
  intervals: BASE_DISPATCH.intervals.map((x) => ({ minute: x.minute, label: x.label, baseline: x.before, reporting: x.after })),
  savedKwh: BASE_DISPATCH.energy.savedKwh,
  savedT: BASE_DISPATCH.co2SavedT,
  savedVnd: BASE_DISPATCH.savingVndPerDay,
  peakBefore: BASE_DISPATCH.peakBefore.kw,
  peakAfter: BASE_DISPATCH.peakAfter.kw,
};

// ---------------------------------------------------------------------------
// Reporting & compliance
// ---------------------------------------------------------------------------

export const COMPLIANCE = {
  deadlineIso: "2027-03-31",
  /** days from 23/11/2026 to 31/03/2027 */
  daysLeft: Math.round((Date.UTC(2027, 2, 31) - DAY0.getTime()) / 86400000),
  dataCompletenessPct: ((10 + 23 / 30) / 12) * 100,
};

export const ISO_CHECKLIST: { id: string; name: BilingualText; ok: boolean; note: BilingualText }[] = [
  { id: "ORG", name: { en: "Organisational boundary", vn: "Ranh giới tổ chức" }, ok: true, note: { en: "Operational control – Cat Lai terminal", vn: "Kiểm soát vận hành – cảng Cát Lái" } },
  { id: "OPS", name: { en: "Operational boundary", vn: "Ranh giới hoạt động" }, ok: true, note: { en: "Scope 1 (diesel) & Scope 2 (grid) measured; ship emissions as influence", vn: "Đo Scope 1 (dầu) & Scope 2 (lưới); phát thải tàu thuộc phạm vi ảnh hưởng" } },
  { id: "BASE", name: { en: "Base year", vn: "Năm cơ sở" }, ok: true, note: { en: "2025, recalculation policy defined", vn: "2025, có quy tắc tính lại" } },
  { id: "EF", name: { en: "Emission factors", vn: "Hệ số phát thải" }, ok: true, note: { en: "Versioned library, effective dates", vn: "Thư viện có phiên bản, ngày hiệu lực" } },
  { id: "UNC", name: { en: "Uncertainty assessment", vn: "Đánh giá độ bất định" }, ok: false, note: { en: "Allocation model uncertainty to be validated by verifier", vn: "Độ bất định mô hình phân bổ cần bên xác minh thẩm định" } },
  { id: "EVID", name: { en: "Evidence retention", vn: "Lưu trữ chứng cứ" }, ok: true, note: { en: "SHA-256 hash chain, 10-year retention", vn: "Chuỗi hash SHA-256, lưu 10 năm" } },
];

export const REPORT_FORMS: { id: string; name: BilingualText; legal: string; status: "IN_PROGRESS" | "READY" | "NOT_DUE"; due: string }[] = [
  { id: "ND06", name: { en: "Facility GHG inventory", vn: "Kiểm kê KNK cấp cơ sở" }, legal: "NĐ 06/2022/NĐ-CP", status: "IN_PROGRESS", due: "2027-03-31" },
  { id: "TT63", name: { en: "Maritime sector GHG report", vn: "Báo cáo KNK ngành hàng hải" }, legal: "TT 63/2024/TT-BGTVT", status: "IN_PROGRESS", due: "2027-03-31" },
  { id: "ND119", name: { en: "Annual GHG mitigation report (2026)", vn: "Báo cáo giảm nhẹ KNK năm 2026" }, legal: "NĐ 119/2025/NĐ-CP", status: "NOT_DUE", due: "2027-03-31" },
];

// ---------------------------------------------------------------------------
// What-if (C4) baseline values
// ---------------------------------------------------------------------------

export const WHATIF_BASE = {
  annualFactor: 365 / DAYS,
  opsSharePct: (CALL_RECORDS.filter((r) => r.opsKw > 0).length / CALL_RECORDS.length) * 100,
  electricTractorPct: 40,
  pvSelfUsePct: (ENERGY_BALANCE.ePv / ENERGY_BALANCE.eLoad) * 100,
  gridEf: GRID_EF_KG_PER_KWH,
  kwhPerDieselL: 3.2,
};

// ---------------------------------------------------------------------------
// 15-minute power of a call while at berth (STS + e-RTG + OPS), same physics as M-1
// ---------------------------------------------------------------------------

export function callPowerSeries(r: CallRecord): { minute: number; label: string; kw: number }[] {
  const v = asVessel(r);
  const out: { minute: number; label: string; kw: number }[] = [];
  for (let m = r.etaMin; m < r.etdMin; m += INTERVAL_MINUTES) {
    const mid = m + INTERVAL_MINUTES / 2;
    const c = cranesAt(v, mid);
    const ops = mid >= r.etaMin + 30 && mid < r.etdMin - 30 ? r.opsKw * OPS_LOAD_FACTOR : 0;
    out.push({ minute: m, label: stamp(m), kw: Math.round(c * (PHYS.stsKwPerCrane + PHYS.rtgKwPerCrane) + ops) });
  }
  return out;
}
