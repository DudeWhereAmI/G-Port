/**
 * Module 3 (M-3) – peak shaving & dispatch.
 *
 * Single source for the M-3 page and the M-1 hand-off. The "before" curve is
 * exactly the Module 1 net-grid forecast; the dispatch is a deterministic
 * client-side approximation of the MILP described in the report:
 *   96 × 15-min intervals · 12 asset groups · 673 decision variables
 *   flexible load 838 kW (7.2 % of 11,570 kW), per-group limits below,
 *   STS / OPS / safety lighting / fire pumps / customs UPS / radar never cut,
 *   STS + e-RTG planned on M-1 P90 when p_peak ≥ 10 %.
 */
import {
  BASE_FORECAST,
  BilingualText,
  EV_FLEET,
  FeederKey,
  ForecastResult,
  LOCK_MINUTE,
  P_PEAK_SWITCH,
  SUBSTATION_LIMIT_KW,
  TouBand,
  minuteLabel,
} from "./module1Forecast";
import { GRID_EF_KG_PER_KWH } from "./emissionFactors";

// ---------------------------------------------------------------------------
// Report constants
// ---------------------------------------------------------------------------

export const MILP_STATS = {
  decisionVariables: 673,
  groups: 12,
  intervals: 96,
  solveSec: 0.67,
  pipelineSec: 66,
  budgetMin: 2.25,
  /** last solve = last M-1 rolling update */
  lastSolveMinute: LOCK_MINUTE,
};

/** MVP results published in the report (Dataset v2) – shown as reference. */
export const REPORT_MVP = {
  peakBeforeKw: 7254.3,
  peakAfterKw: 6446.3,
  reductionPct: 11.1,
  savingVndPerDay: 14_810_000,
  co2tPerDay: 0.87,
  gridKwhPerDay: 1320,
  maxDemandKw: 11570,
  flexibleKw: 838,
  flexiblePct: 7.2,
};

/** Tariff & cost parameters of the objective J (VND). */
export const COST_PARAMS = {
  touVndPerKwh: { OFF_PEAK: 1190, STANDARD: 1833, PEAK: 3398 } as Record<TouBand, number>,
  /** peak demand charge c_dem, allocated per day */
  demandVndPerKwDay: 3000,
  carbonVndPerTonDefault: 250_000,
  pvCurtailVndPerKwh: 1500,
  bessWearVndPerKwh: 450,
  modulationVndPerKwh: 120,
  serviceVndPerCommand: 15_000,
  violationVndPerKwh: 8000,
};

// ---------------------------------------------------------------------------
// 12 asset groups
// ---------------------------------------------------------------------------

export type GroupKind = "FLEX" | "SUPPLY" | "PROTECTED";
export type ControlMode = "AUTO" | "APPROVAL" | "LOCKED";
export type FlexGroupId = "ITV" | "SWAP" | "REEFER" | "RTG" | "HVAC";

export interface AssetGroup {
  id: string;
  name: BilingualText;
  feeder: FeederKey | null;
  kind: GroupKind;
  mode: ControlMode;
  /** max adjustment as share of the group's load (flexible groups) */
  maxPct: number;
  /** contribution to the 838 kW flexible capacity */
  flexKw: number;
  ratedKw: number;
  rule: BilingualText;
  safety: BilingualText;
  fallback: BilingualText;
}

export const ASSET_GROUPS: AssetGroup[] = [
  {
    id: "ITV", feeder: "f05", kind: "FLEX", mode: "APPROVAL", maxPct: 65, flexKw: 266, ratedKw: 410,
    name: { en: "e-ITV tractor charging", vn: "Sạc xe đầu kéo điện (e-ITV)" },
    rule: { en: "Shift up to 65% of charging to off-peak", vn: "Dời tối đa 65% công suất sạc sang giờ thấp điểm" },
    safety: { en: "Ready tractors ≥ TOS requirement + reserve at all times", vn: "Số xe đủ pin luôn ≥ nhu cầu TOS + xe dự phòng" },
    fallback: { en: "Full charging restored if ready tractors drop below requirement", vn: "Khôi phục sạc đầy nếu số xe sẵn sàng thấp hơn yêu cầu" },
  },
  {
    id: "SWAP", feeder: "f05", kind: "FLEX", mode: "APPROVAL", maxPct: 50, flexKw: 78, ratedKw: 155,
    name: { en: "Battery swap / empty handlers", vn: "Trạm đổi pin / xe nâng vỏ" },
    rule: { en: "Defer up to 50% of swap-station charging", vn: "Hoãn tối đa 50% công suất trạm đổi pin" },
    safety: { en: "≥ 4 charged battery packs kept in stock", vn: "Luôn giữ ≥ 4 bộ pin đã sạc" },
    fallback: { en: "Deferral cancelled when stock falls below 4 packs", vn: "Hủy hoãn khi tồn pin dưới 4 bộ" },
  },
  {
    id: "REEFER", feeder: "f03", kind: "FLEX", mode: "APPROVAL", maxPct: 15, flexKw: 345, ratedKw: 2300,
    name: { en: "Reefer yard", vn: "Bãi container lạnh" },
    rule: { en: "Pre-cool, then cut ≤ 15% with staggered compressors, ≤ 45 min per sub-group", vn: "Làm lạnh trước, giảm ≤ 15% bằng so le máy nén, mỗi nhóm con ≤ 45 phút" },
    safety: { en: "Cargo temperature stays within [θmin, θmax]", vn: "Nhiệt độ hàng luôn trong dải [θmin, θmax]" },
    fallback: { en: "Full cooling if any container leaves the band", vn: "Làm lạnh 100% nếu bất kỳ container nào ra khỏi dải" },
  },
  {
    id: "RTG", feeder: "f02", kind: "FLEX", mode: "AUTO", maxPct: 5, flexKw: 104, ratedKw: 2080,
    name: { en: "Yard e-RTG cranes", vn: "Cẩu bãi e-RTG" },
    rule: { en: "Eco-idle only, ≤ 5%, when idle > 5 min", vn: "Chỉ chuyển chế độ chờ tiết kiệm, ≤ 5%, khi rỗi trên 5 phút" },
    safety: { en: "Never throttled while lifting", vn: "Không giới hạn khi đang nâng hạ" },
    fallback: { en: "Leaves eco-idle on the next job order", vn: "Thoát chế độ chờ khi có lệnh tác nghiệp" },
  },
  {
    id: "HVAC", feeder: "f06", kind: "FLEX", mode: "APPROVAL", maxPct: 25, flexKw: 45, ratedKw: 180,
    name: { en: "Warehouse lighting & HVAC", vn: "Chiếu sáng & điều hòa kho" },
    rule: { en: "+1.5 °C setpoint and corridor dimming in peak hours", vn: "Tăng điểm đặt +1,5 °C và giảm sáng hành lang trong giờ cao điểm" },
    safety: { en: "Indoor 24–26 °C; illuminance ≥ safety level", vn: "Trong nhà 24–26 °C; độ rọi ≥ mức an toàn" },
    fallback: { en: "Setpoint restored after the peak window", vn: "Trả điểm đặt sau khung đỉnh" },
  },
  {
    id: "PV", feeder: "f06", kind: "SUPPLY", mode: "AUTO", maxPct: 0, flexKw: 0, ratedKw: 2450,
    name: { en: "Rooftop PV (2,450 kWp)", vn: "Điện mặt trời áp mái (2.450 kWp)" },
    rule: { en: "Supply source – setpoint controlled automatically, full self-consumption", vn: "Nguồn cấp – điểm đặt điều khiển tự động, tự dùng toàn bộ" },
    safety: { en: "No reverse power flow to the public grid", vn: "Không phát ngược lên lưới" },
    fallback: { en: "Inverter disconnects within 20 ms on grid fault", vn: "Biến tần cắt trong 20 ms khi sự cố lưới" },
  },
  {
    id: "STS", feeder: "f01", kind: "PROTECTED", mode: "LOCKED", maxPct: 0, flexKw: 0, ratedKw: 4800,
    name: { en: "STS quay cranes", vn: "Cẩu bờ STS" },
    rule: { en: "Never cut · planned on M-1 P90 · regenerative braking (AFE) already in base load", vn: "Không cắt · lập kế hoạch theo P90 của M-1 · năng lượng tái sinh (AFE) đã tính trong phụ tải nền" },
    safety: { en: "Vessel schedule protected", vn: "Bảo vệ lịch tàu" },
    fallback: { en: "Hardware-locked", vn: "Khóa cứng" },
  },
  {
    id: "OPS", feeder: "f04", kind: "PROTECTED", mode: "LOCKED", maxPct: 0, flexKw: 0, ratedKw: 2000,
    name: { en: "Shore power (OPS)", vn: "Điện bờ (OPS)" },
    rule: { en: "Never cut", vn: "Không cắt" },
    safety: { en: "Vessel auxiliary engines stay off", vn: "Máy phụ của tàu luôn tắt" },
    fallback: { en: "Protected breaker", vn: "Máy cắt bảo vệ" },
  },
  {
    id: "SAFETY_LIGHT", feeder: "f06", kind: "PROTECTED", mode: "LOCKED", maxPct: 0, flexKw: 0, ratedKw: 270,
    name: { en: "Safety lighting", vn: "Đèn an toàn" },
    rule: { en: "Never dimmed", vn: "Không giảm sáng" },
    safety: { en: "Yard ≥ 50 lux at night", vn: "Bãi ≥ 50 lux ban đêm" },
    fallback: { en: "—", vn: "—" },
  },
  {
    id: "FIRE", feeder: "f06", kind: "PROTECTED", mode: "LOCKED", maxPct: 0, flexKw: 0, ratedKw: 25,
    name: { en: "Fire pumps", vn: "Bơm PCCC" },
    rule: { en: "Never cut", vn: "Không cắt" },
    safety: { en: "Fire code 100% availability", vn: "Sẵn sàng 100% theo quy chuẩn PCCC" },
    fallback: { en: "Dedicated line + automatic transfer", vn: "Đường cấp riêng + chuyển nguồn tự động" },
  },
  {
    id: "UPS", feeder: "f06", kind: "PROTECTED", mode: "LOCKED", maxPct: 0, flexKw: 0, ratedKw: 110,
    name: { en: "Customs UPS", vn: "UPS Hải quan" },
    rule: { en: "Never cut", vn: "Không cắt" },
    safety: { en: "Servers & X-ray scanners 24/7", vn: "Máy chủ & máy soi 24/7" },
    fallback: { en: "120-min battery + generator", vn: "Ắc quy 120 phút + máy phát" },
  },
  {
    id: "RADAR", feeder: "f06", kind: "PROTECTED", mode: "LOCKED", maxPct: 0, flexKw: 0, ratedKw: 15,
    name: { en: "Radar / VTS", vn: "Radar / VTS" },
    rule: { en: "Never cut", vn: "Không cắt" },
    safety: { en: "Navigation safety", vn: "An toàn hàng hải" },
    fallback: { en: "UPS-backed", vn: "Có UPS dự phòng" },
  },
];

export const FLEX_GROUPS = ASSET_GROUPS.filter((g) => g.kind === "FLEX");
export const PROTECTED_GROUPS = ASSET_GROUPS.filter((g) => g.kind === "PROTECTED");
export const FLEX_CAPACITY_KW = FLEX_GROUPS.reduce((a, g) => a + g.flexKw, 0);

/** Optional battery (not installed in the MVP; what-if only). */
export const BESS_OPTION = { powerKw: 500, energyKwh: 1000, socMin: 0.2, socMax: 0.9, socStart: 0.5, efficiency: 0.92 };

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export type ApprovalState = "APPROVED" | "PENDING" | "REJECTED";

export interface DispatchSettings {
  peakTargetKw: number;
  carbonVndPerTon: number;
  reeferFlexPct: number;
  itvReserve: number;
  bessEnabled: boolean;
  approvals: Partial<Record<FlexGroupId, ApprovalState>>;
}

export const DEFAULT_APPROVALS: Record<FlexGroupId, ApprovalState> = {
  ITV: "APPROVED",
  REEFER: "APPROVED",
  HVAC: "APPROVED",
  SWAP: "PENDING",
  RTG: "APPROVED", // automatic group
};

export const DEFAULT_DISPATCH_SETTINGS: DispatchSettings = {
  peakTargetKw: 8000, // replaced below by the lowest feasible target
  carbonVndPerTon: COST_PARAMS.carbonVndPerTonDefault,
  reeferFlexPct: 15,
  itvReserve: EV_FLEET.itvReserveDefault,
  bessEnabled: false,
  approvals: DEFAULT_APPROVALS,
};

export type AdjustKey = FlexGroupId | "BESS";

export interface DispatchInterval {
  minute: number;
  label: string;
  tou: TouBand;
  /** M-1 net grid P50 (= "before") */
  before: number;
  /** total load P50 before / after */
  loadBefore: number;
  loadAfter: number;
  /** planning value (STS + e-RTG on P90 when p_peak ≥ 10 %) */
  plan: number;
  after: number;
  pv: number;
  /** per group: negative = reduced, positive = shifted in */
  adjust: Record<AdjustKey, number>;
  reduced: number;
  shiftedIn: number;
  soc: number | null;
  /** after-dispatch load composition (for the power-balance chart) */
  balance: { stsRtg: number; reefer: number; ev: number; lighting: number; base: number; ops: number };
  itvReadyVehicles: number;
  itvRequiredVehicles: number;
}

export interface InfeasibleInfo {
  minute: number;
  shortfallKw: number;
  constraint: BilingualText;
}

export interface CostBreakdown {
  touEnergy: number;
  peakDemand: number;
  carbon: number;
  pvCurtail: number;
  bessWear: number;
  modulation: number;
  service: number;
  violation: number;
  total: number;
}

export interface DispatchResult {
  settings: DispatchSettings;
  intervals: DispatchInterval[];
  peakBefore: { kw: number; label: string; minute: number };
  peakAfter: { kw: number; label: string; minute: number };
  reductionKw: number;
  reductionPct: number;
  /** waterfall: group contributions at the "before" peak interval (sum + shift = reduction) */
  waterfall: { key: AdjustKey; kw: number }[];
  /** after(t_before) → after(t_after) when the new peak moves */
  peakShiftKw: number;
  feasible: boolean;
  infeasible: InfeasibleInfo | null;
  gridOkIntervals: number;
  energy: { beforeKwh: number; afterKwh: number; savedKwh: number; shiftedKwh: number };
  co2SavedT: number;
  cost: { before: CostBreakdown; after: CostBreakdown };
  savingVndPerDay: number;
  groupStats: Record<AdjustKey, { maxReduceKw: number; maxShiftInKw: number; reducedKwh: number; shiftedInKwh: number; benefitVnd: number }>;
  itvDeferredVehicles: number;
  commands: number;
}

const ADJUST_KEYS: AdjustKey[] = ["ITV", "SWAP", "REEFER", "RTG", "HVAC", "BESS"];
const zeroAdjust = (): Record<AdjustKey, number> => ({ ITV: 0, SWAP: 0, REEFER: 0, RTG: 0, HVAC: 0, BESS: 0 });
const NIGHT_FROM = 0;
const NIGHT_TO = 5 * 60; // shifted charging goes to 00:00–05:00
const PRECOOL_INTERVALS = 8; // 2 h before the first reefer cut
const PRECOOL_FACTOR = 1.05;

function costOf(net: number[], tous: TouBand[], s: DispatchSettings, extra: Partial<CostBreakdown> = {}): CostBreakdown {
  let energy = 0;
  let kwh = 0;
  let violation = 0;
  net.forEach((kw, i) => {
    energy += kw * 0.25 * COST_PARAMS.touVndPerKwh[tous[i]];
    kwh += kw * 0.25;
    violation += Math.max(0, kw - SUBSTATION_LIMIT_KW) * 0.25 * COST_PARAMS.violationVndPerKwh;
  });
  const peak = Math.max(...net);
  const c: CostBreakdown = {
    touEnergy: energy,
    peakDemand: peak * COST_PARAMS.demandVndPerKwDay,
    carbon: (kwh * GRID_EF_KG_PER_KWH * s.carbonVndPerTon) / 1000,
    pvCurtail: 0,
    bessWear: extra.bessWear ?? 0,
    modulation: extra.modulation ?? 0,
    service: extra.service ?? 0,
    violation,
    total: 0,
  };
  c.total = c.touEnergy + c.peakDemand + c.carbon + c.pvCurtail + c.bessWear + c.modulation + c.service + c.violation;
  return c;
}

export function runDispatch(forecast: ForecastResult, settings: DispatchSettings = DEFAULT_DISPATCH_SETTINGS): DispatchResult {
  const pts = forecast.points;
  const n = pts.length;
  const ok = (g: FlexGroupId) => (settings.approvals[g] ?? DEFAULT_APPROVALS[g]) !== "REJECTED";
  const adjust = pts.map(() => zeroAdjust());
  const plan = pts.map((p) => {
    const margin = p.pPeak >= P_PEAK_SWITCH ? ((p.p90 - p.p50) * (p.feeders.f01 + p.feeders.f02)) / p.p50 : 0;
    return p.netGrid + margin;
  });

  // e-ITV: tractors that may be deferred given the TOS requirement + reserve
  const deferrableVehicles = Math.max(0, EV_FLEET.itvVehicles - EV_FLEET.itvInMaintenance - EV_FLEET.itvRequired - settings.itvReserve);
  const itvCapKw = Math.min(ASSET_GROUPS[0].flexKw, deferrableVehicles * EV_FLEET.itvKwPerVehicle);
  const swapCap = ASSET_GROUPS[1].flexKw;
  const reeferCapPct = Math.max(0, Math.min(15, settings.reeferFlexPct)) / 100;

  let infeasible: InfeasibleInfo | null = null;
  const residual: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = adjust[i];
    const peakTariff = p.tou === "PEAK";

    // automatic, cost-driven actions
    if (ok("RTG")) a.RTG = -Math.min(0.05 * p.feeders.f02, ASSET_GROUPS[3].flexKw);
    let need = plan[i] + a.RTG - settings.peakTargetKw;

    if (ok("HVAC") && (peakTariff || need > 0)) a.HVAC = -Math.min(0.25 * p.detail.hvacKw, ASSET_GROUPS[4].flexKw);
    need += a.HVAC;

    if (ok("ITV") && (peakTariff || need > 0) && p.minute >= NIGHT_TO) {
      const avail = Math.min(0.65 * p.detail.itvKw, itvCapKw);
      a.ITV = -(peakTariff ? avail : Math.min(avail, need));
    }
    need += a.ITV;

    if (need > 0 && ok("SWAP") && p.minute >= NIGHT_TO) {
      a.SWAP = -Math.min(0.5 * p.detail.swapKw, swapCap, need);
      need += a.SWAP;
    }
    if (need > 0 && ok("REEFER")) {
      a.REEFER = -Math.min(reeferCapPct * p.feeders.f03, ASSET_GROUPS[2].flexKw, need);
      need += a.REEFER;
    }
    residual[i] = need;
  }

  // ---- optional BESS: shave the highest residuals first (water-filling on the residual need)
  let bessDischargedKwh = 0;
  if (settings.bessEnabled) {
    const budgetKwh = BESS_OPTION.energyKwh * (BESS_OPTION.socMax - BESS_OPTION.socMin) * BESS_OPTION.efficiency;
    const dischargeAt = (level: number) => residual.map((r) => Math.min(BESS_OPTION.powerKw, Math.max(0, r - level)));
    const energyAt = (level: number) => dischargeAt(level).reduce((sum, kw) => sum + kw * 0.25, 0);
    let lo = 0;
    let hi = Math.max(0, ...residual);
    if (energyAt(0) > budgetKwh) {
      for (let it = 0; it < 40; it++) {
        const mid = (lo + hi) / 2;
        if (energyAt(mid) > budgetKwh) lo = mid;
        else hi = mid;
      }
    } else hi = 0;
    dischargeAt(hi).forEach((kw, i) => {
      if (kw > 0) {
        adjust[i].BESS = -kw;
        residual[i] -= kw;
        bessDischargedKwh += kw * 0.25;
      }
    });
  }

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const need = residual[i];
    if (need > 0.5 && !infeasible) {
      const reeferLimited = settings.reeferFlexPct < 15;
      infeasible = {
        minute: p.minute,
        shortfallKw: Math.round(need),
        constraint: reeferLimited
          ? { en: `Reefer flexibility limited to ${settings.reeferFlexPct}% – STS, OPS and safety loads cannot be cut`, vn: `Reefer chỉ linh hoạt ${settings.reeferFlexPct}% – không được cắt cẩu STS, OPS và tải an toàn` }
          : { en: "All flexible groups at their limits (838 kW) – STS, OPS and safety loads cannot be cut", vn: "Mọi nhóm linh hoạt đã chạm giới hạn (838 kW) – không được cắt cẩu STS, OPS và tải an toàn" },
      };
    }
  }

  // ---- shift-in: deferred charging → 00:00–05:00, reefer pre-cool → 2 h before, BESS recharge → night
  const night = pts.map((p, i) => (p.minute >= NIGHT_FROM && p.minute < NIGHT_TO ? i : -1)).filter((i) => i >= 0);
  const sumKwh = (k: AdjustKey) => adjust.reduce((s, a) => s + Math.max(0, -a[k]) * 0.25, 0);
  const itvKwh = sumKwh("ITV");
  const swapKwh = sumKwh("SWAP");
  night.forEach((i) => {
    adjust[i].ITV += itvKwh / 0.25 / night.length;
    adjust[i].SWAP += swapKwh / 0.25 / night.length;
  });
  const firstReefer = adjust.findIndex((a) => a.REEFER < 0);
  if (firstReefer > 0) {
    const kwh = sumKwh("REEFER") * PRECOOL_FACTOR;
    const from = Math.max(0, firstReefer - PRECOOL_INTERVALS);
    for (let i = from; i < firstReefer; i++) adjust[i].REEFER += kwh / 0.25 / (firstReefer - from);
  }
  if (bessDischargedKwh > 0) {
    const recharge = bessDischargedKwh / BESS_OPTION.efficiency / BESS_OPTION.efficiency;
    const late = pts.map((p, i) => (p.minute >= 22 * 60 ? i : -1)).filter((i) => i >= 0);
    const preKwh = Math.min(recharge, BESS_OPTION.energyKwh * (BESS_OPTION.socMax - BESS_OPTION.socStart) / BESS_OPTION.efficiency);
    night.forEach((i) => (adjust[i].BESS += preKwh / 0.25 / night.length));
    late.forEach((i) => (adjust[i].BESS += (recharge - preKwh) / 0.25 / late.length));
  }

  // ---- results per interval
  let soc = BESS_OPTION.socStart * BESS_OPTION.energyKwh;
  const intervals: DispatchInterval[] = pts.map((p, i) => {
    const a = Object.fromEntries(ADJUST_KEYS.map((k) => [k, Math.round(adjust[i][k])])) as Record<AdjustKey, number>;
    const total = ADJUST_KEYS.reduce((s, k) => s + a[k], 0);
    const reduced = -ADJUST_KEYS.reduce((s, k) => s + Math.min(0, a[k]), 0);
    const shiftedIn = ADJUST_KEYS.reduce((s, k) => s + Math.max(0, a[k]), 0);
    const loadAdj = total - a.BESS; // BESS is a source, not a load
    if (settings.bessEnabled) soc += a.BESS > 0 ? a.BESS * 0.25 * BESS_OPTION.efficiency : (a.BESS * 0.25) / BESS_OPTION.efficiency;
    const itvAfter = p.detail.itvKw + a.ITV;
    const working = p.minute >= 6 * 60 && p.minute < 22 * 60;
    return {
      minute: p.minute,
      label: p.label,
      tou: p.tou,
      before: p.netGrid,
      loadBefore: p.p50,
      loadAfter: p.p50 + loadAdj,
      plan: Math.round(plan[i]),
      after: p.netGrid + total,
      pv: p.pv,
      adjust: a,
      reduced,
      shiftedIn,
      soc: settings.bessEnabled ? soc / BESS_OPTION.energyKwh : null,
      balance: {
        stsRtg: p.feeders.f01 + p.feeders.f02 + a.RTG,
        reefer: Math.round(p.feeders.f03 + a.REEFER),
        ev: Math.round(p.feeders.f05 + a.ITV + a.SWAP),
        lighting: p.detail.lightingKw,
        base: Math.round(p.feeders.f06 - p.detail.lightingKw + a.HVAC),
        ops: p.feeders.f04,
      },
      itvReadyVehicles: Math.floor(
        EV_FLEET.itvVehicles - EV_FLEET.itvInMaintenance - Math.ceil(Math.max(0, itvAfter - 120) / EV_FLEET.itvKwPerVehicle)
      ),
      itvRequiredVehicles: (working ? EV_FLEET.itvRequired : 6) + settings.itvReserve,
    };
  });

  const peakOf = (key: "before" | "after") =>
    intervals.reduce((m, x) => (x[key] > m.kw ? { kw: x[key], label: x.label, minute: x.minute } : m), { kw: -Infinity, label: "", minute: 0 });
  const peakBefore = peakOf("before");
  const peakAfter = peakOf("after");
  const atBefore = intervals.find((x) => x.minute === peakBefore.minute)!;
  const waterfall = ADJUST_KEYS.filter((k) => atBefore.adjust[k] !== 0).map((k) => ({ key: k, kw: atBefore.adjust[k] }));
  const peakShiftKw = peakAfter.kw - atBefore.after;
  const reductionKw = peakBefore.kw - peakAfter.kw;

  // energy & cost
  const beforeKwh = intervals.reduce((s, x) => s + x.before * 0.25, 0);
  const afterKwh = intervals.reduce((s, x) => s + x.after * 0.25, 0);
  const shiftedKwh = intervals.reduce((s, x) => s + x.shiftedIn * 0.25, 0);
  const tous = intervals.map((x) => x.tou);
  const commands = intervals.filter((x) => x.reduced > 0 || x.shiftedIn > 0).length;
  const modulationKwh = intervals.reduce((s, x) => s + (x.reduced + x.shiftedIn) * 0.25, 0);
  const costBefore = costOf(intervals.map((x) => x.before), tous, settings);
  const costAfter = costOf(intervals.map((x) => x.after), tous, settings, {
    bessWear: settings.bessEnabled ? bessDischargedKwh * 2 * COST_PARAMS.bessWearVndPerKwh : 0,
    modulation: modulationKwh * COST_PARAMS.modulationVndPerKwh,
    service: commands * COST_PARAMS.serviceVndPerCommand,
  });

  // per-group stats & benefit (energy price arbitrage + share of the demand-charge saving)
  const demandSaving = costBefore.peakDemand - costAfter.peakDemand + costBefore.violation - costAfter.violation;
  const totalAtPeak = waterfall.reduce((s, w) => s + Math.max(0, -w.kw), 0) || 1;
  const groupStats = Object.fromEntries(
    ADJUST_KEYS.map((k) => {
      let maxReduce = 0, maxIn = 0, red = 0, inn = 0, energyVnd = 0;
      intervals.forEach((x) => {
        const v = x.adjust[k];
        const price = COST_PARAMS.touVndPerKwh[x.tou];
        if (v < 0) { maxReduce = Math.max(maxReduce, -v); red += -v * 0.25; energyVnd += -v * 0.25 * price; }
        if (v > 0) { maxIn = Math.max(maxIn, v); inn += v * 0.25; energyVnd -= v * 0.25 * price; }
      });
      const share = Math.max(0, -(waterfall.find((w) => w.key === k)?.kw ?? 0)) / totalAtPeak;
      return [k, { maxReduceKw: Math.round(maxReduce), maxShiftInKw: Math.round(maxIn), reducedKwh: Math.round(red), shiftedInKwh: Math.round(inn), benefitVnd: Math.round(energyVnd + share * demandSaving) }];
    })
  ) as DispatchResult["groupStats"];

  return {
    settings,
    intervals,
    peakBefore,
    peakAfter,
    reductionKw,
    reductionPct: (reductionKw / peakBefore.kw) * 100,
    waterfall,
    peakShiftKw,
    feasible: infeasible === null,
    infeasible,
    gridOkIntervals: intervals.filter((x) => x.after <= SUBSTATION_LIMIT_KW).length,
    energy: { beforeKwh, afterKwh, savedKwh: beforeKwh - afterKwh, shiftedKwh },
    co2SavedT: ((beforeKwh - afterKwh) * GRID_EF_KG_PER_KWH) / 1000,
    cost: { before: costBefore, after: costAfter },
    savingVndPerDay: costBefore.total - costAfter.total,
    groupStats,
    itvDeferredVehicles: Math.round(groupStats.ITV.maxReduceKw / EV_FLEET.itvKwPerVehicle),
    commands,
  };
}

// ---------------------------------------------------------------------------
// Module 1 → Module 3 hand-off
// ---------------------------------------------------------------------------

export interface M3DispatchEstimate {
  peakBeforeKw: number;
  peakBeforeTime: string;
  peakAfterKw: number;
  peakAfterTime: string;
  reductionKw: number;
  reductionPct: number;
  groupsUsed: number;
  dispatchedIntervals: number;
}

export function estimateM3Dispatch(forecast: ForecastResult, settings: DispatchSettings = DEFAULT_DISPATCH_SETTINGS): M3DispatchEstimate {
  const r = runDispatch(forecast, settings);
  return {
    peakBeforeKw: r.peakBefore.kw,
    peakBeforeTime: r.peakBefore.label,
    peakAfterKw: r.peakAfter.kw,
    peakAfterTime: r.peakAfter.label,
    reductionKw: r.reductionKw,
    reductionPct: r.reductionPct,
    groupsUsed: FLEX_GROUPS.filter((g) => r.groupStats[g.id as FlexGroupId].maxReduceKw > 0).length,
    dispatchedIntervals: r.intervals.filter((x) => x.reduced > 0).length,
  };
}

/** Payload carried from M-1 to the M-3 page. */
export interface ForecastHandoff {
  windowId: string;
  timeWindow: string;
  peakTime: string;
  netGridKw: number;
  maxPPeakPct: number;
  estimate: M3DispatchEstimate;
}

export { minuteLabel };

/** Lowest peak target (rounded up to 10 kW) the dispatch can meet on the P90 planning basis. */
export function minFeasibleTargetKw(forecast: ForecastResult, settings: DispatchSettings = DEFAULT_DISPATCH_SETTINGS): number {
  let lo = 5000;
  let hi = 10000;
  for (let it = 0; it < 30; it++) {
    const mid = (lo + hi) / 2;
    if (runDispatch(forecast, { ...settings, peakTargetKw: mid }).feasible) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi / 10) * 10;
}

/** Default plan: lowest feasible target for the shared M-1 base forecast. */
DEFAULT_DISPATCH_SETTINGS.peakTargetKw = minFeasibleTargetKw(BASE_FORECAST);
export const BASE_DISPATCH: DispatchResult = runDispatch(BASE_FORECAST, DEFAULT_DISPATCH_SETTINGS);
