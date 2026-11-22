/**
 * Module 3 (M-3) – peak-shaving equipment groups (G-PORT Report Table PL3.6).
 * Shared by the Optimization page and the Module 1 hand-off estimate.
 */
import type { ForecastPoint, ForecastResult, FeederKey } from "./module1Forecast";
import { P_PEAK_SWITCH } from "./module1Forecast";

export type ControlTier = "DIRECT_CONTROL" | "OPERATOR_APPROVAL" | "MUST_RUN";

export interface AssetControlGroup {
  id: string;
  name: string;
  feeder: string;
  zone: string;
  controlTier: ControlTier;
  controlLabel: string;
  pMaxKw: number;
  maxReductionPercent: number;
  unoptimizedPeakKw: number;
  currentLoadKw: number;
  powerSavedKw: number;
  operatorStatus: "AUTO_ACTIVE" | "APPROVED" | "PENDING_REVIEW" | "LOCKED_MUST_RUN";
  currentActionSummary: string;
  safetyConstraintSpec: string;
  fallbackRule: string;
}

// 12 Port Equipment Groups for Peak Shaving (from G-PORT Report Table PL3.6)
export const INITIAL_12_ASSET_GROUPS: AssetControlGroup[] = [
  {
    id: "EQ-01",
    name: "Crane Regenerative Braking & SVC Compensator (1.5 MW)",
    feeder: "Line F-01 / F-02",
    zone: "Zone 1",
    controlTier: "DIRECT_CONTROL",
    controlLabel: "Automatic Regen Power Recovery",
    pMaxKw: 1500,
    maxReductionPercent: 100,
    unoptimizedPeakKw: 0,
    currentLoadKw: -1380,
    powerSavedKw: 1380,
    operatorStatus: "AUTO_ACTIVE",
    currentActionSummary: "Recovering 1,380 kW of kinetic hoist braking power to the port grid during 14:00–16:30 peak surge",
    safetyConstraintSpec: "Captures kinetic braking energy from STS & e-RTG lowering cycles onto the 22kV DC/AC busbar with Static Var Compensation (power factor ≥ 0.98, THD ≤ 3.0%).",
    fallbackRule: "Automatically switches to dynamic resistor braking if substation busbar voltage exceeds 105%."
  },
  {
    id: "EQ-02",
    name: "Electric Truck Chargers (6 Fast Chargers)",
    feeder: "Line F-05",
    zone: "Zone 4",
    controlTier: "OPERATOR_APPROVAL",
    controlLabel: "Flexible Charging Schedule",
    pMaxKw: 420,
    maxReductionPercent: 65,
    unoptimizedPeakKw: 410,
    currentLoadKw: 145,
    powerSavedKw: 265,
    operatorStatus: "APPROVED",
    currentActionSummary: "Moved 265 kW of truck charging to night off-peak & midday solar hours",
    safetyConstraintSummary: "Slows down non-urgent charging during peak hours; guarantees all 28 electric trucks stay ≥ 35% charged during shifts and 100% charged by 05:30 AM.",
    safetyConstraintSpec: "Slows down non-urgent charging during peak hours; guarantees all 28 electric trucks stay ≥ 35% charged during shifts and 100% charged by 05:30 AM.",
    fallbackRule: "Restores full 420 kW charging power immediately if spare trucks drop below minimum."
  } as any,
  {
    id: "EQ-03",
    name: "Rooftop Solar Panels (2,450 kWp)",
    feeder: "Line F-06",
    zone: "Zone 4",
    controlTier: "DIRECT_CONTROL",
    controlLabel: "Automatic Solar Supply",
    pMaxKw: 2450,
    maxReductionPercent: 100,
    unoptimizedPeakKw: 1612,
    currentLoadKw: 1612,
    powerSavedKw: 0,
    operatorStatus: "AUTO_ACTIVE",
    currentActionSummary: "Supplying 1,612 kW of clean solar power directly to port equipment",
    safetyConstraintSpec: "All solar electricity is used inside the port to reduce grid purchases, with automatic protection preventing reverse flow into the public grid.",
    fallbackRule: "Safety relay disconnects inverter within 20 ms if a grid fault occurs."
  },
  {
    id: "EQ-04",
    name: "Reefer Container Yard (480 Plugs)",
    feeder: "Line F-03",
    zone: "Zone 3",
    controlTier: "OPERATOR_APPROVAL",
    controlLabel: "Pre-Cooling & Staggered Cycles",
    pMaxKw: 2300,
    maxReductionPercent: 15,
    unoptimizedPeakKw: 1780,
    currentLoadKw: 1445,
    powerSavedKw: 335,
    operatorStatus: "APPROVED",
    currentActionSummary: "Pre-cooled & staggered compressor cycles saving 335 kW (max 45 mins)",
    safetyConstraintSpec: "Pre-cools containers before peak hours and staggers compressor start times (up to 345 kW saved for ≤ 45 mins). Cargo temperature never varies more than ±0.4 °C.",
    fallbackRule: "Immediately turns 100% cooling back on if any container warms by more than +0.4 °C."
  },
  {
    id: "EQ-05",
    name: "Warehouse Air Conditioning & Hall Lights",
    feeder: "Line F-06",
    zone: "Zone 4",
    controlTier: "OPERATOR_APPROVAL",
    controlLabel: "Eco Temperature & Dimming",
    pMaxKw: 180,
    maxReductionPercent: 25,
    unoptimizedPeakKw: 165,
    currentLoadKw: 120,
    powerSavedKw: 45,
    operatorStatus: "APPROVED",
    currentActionSummary: "A/C adjusted +1.5 °C & warehouse corridors dimmed (-45 kW saved)",
    safetyConstraintSpec: "Adjusts warehouse A/C thermostat by +1.5 °C (staying 24–26 °C) and dims indoor hallways during peak hours. Outdoor yard safety lights are never dimmed.",
    fallbackRule: "Returns A/C to 24.0 °C automatically after the 16:30 peak window."
  },
  {
    id: "EQ-06",
    name: "Empty Handler Fast-Charge Depot",
    feeder: "Line F-05",
    zone: "Zone 2",
    controlTier: "OPERATOR_APPROVAL",
    controlLabel: "Flexible Charging Schedule",
    pMaxKw: 160,
    maxReductionPercent: 50,
    unoptimizedPeakKw: 155,
    currentLoadKw: 80,
    powerSavedKw: 75,
    operatorStatus: "PENDING_REVIEW",
    currentActionSummary: "Charging reduced by 50% (-75 kW saved); 4 active handlers ready for shift",
    safetyConstraintSpec: "Reduces charger draw during peak rate hours as long as at least 4 empty container handlers are ready for the night shift.",
    fallbackRule: "Cancels power reduction immediately if active standby handlers drop below 4 units."
  },
  {
    id: "EQ-07",
    name: "Quay Cranes S01–S05 (5 STS Cranes)",
    feeder: "Line F-01",
    zone: "Zone 1",
    controlTier: "MUST_RUN",
    controlLabel: "Protected (Never Throttled)",
    pMaxKw: 4200,
    maxReductionPercent: 0,
    unoptimizedPeakKw: 3420,
    currentLoadKw: 3420,
    powerSavedKw: 0,
    operatorStatus: "LOCKED_MUST_RUN",
    currentActionSummary: "100% full power guaranteed for ship unloading; hoist brakes recover 26% energy",
    safetyConstraintSpec: "Quay cranes always run at 100% required speed to meet ship departure schedules. Built-in regenerative braking recovers 22%–30% power when lowering containers.",
    fallbackRule: "Hardware-locked: never included in power reduction."
  },
  {
    id: "EQ-08",
    name: "Yard e-RTG Cranes (12 Units)",
    feeder: "Line F-02",
    zone: "Zone 2",
    controlTier: "MUST_RUN",
    controlLabel: "Protected (Eco-Idle Only)",
    pMaxKw: 1900,
    maxReductionPercent: 5,
    unoptimizedPeakKw: 1410,
    currentLoadKw: 1335,
    powerSavedKw: 75,
    operatorStatus: "LOCKED_MUST_RUN",
    currentActionSummary: "Synced with Quay Cranes; -75 kW saved when cranes idle > 5 mins",
    safetyConstraintSpec: "Runs continuously to support Quay Cranes. Only enters automatic Eco-Idle mode (up to 5% savings) when a crane waits more than 5 minutes between lifts.",
    fallbackRule: "Wakes up in 0.2 seconds as soon as a new container move is assigned."
  },
  {
    id: "EQ-09",
    name: "Ship Shore Power (OPS 6.6kV / 22kV)",
    feeder: "Line F-04",
    zone: "Zone 1",
    controlTier: "MUST_RUN",
    controlLabel: "Protected (Never Throttled)",
    pMaxKw: 1850,
    maxReductionPercent: 0,
    unoptimizedPeakKw: 1480,
    currentLoadKw: 1480,
    powerSavedKw: 0,
    operatorStatus: "LOCKED_MUST_RUN",
    currentActionSummary: "Supplying continuous 1,480 kW shore power to berthed ships",
    safetyConstraintSpec: "Provides uninterrupted shore electricity to ships at berth so their diesel engines stay off. Strictly locked at 0% power reduction.",
    fallbackRule: "Protected circuit breaker; zero power reduction permitted."
  },
  {
    id: "EQ-10",
    name: "High-Mast Yard Safety Floodlights (36 Poles)",
    feeder: "Line F-06",
    zone: "Zone 1–2",
    controlTier: "MUST_RUN",
    controlLabel: "Protected Safety Equipment",
    pMaxKw: 190,
    maxReductionPercent: 0,
    unoptimizedPeakKw: 0,
    currentLoadKw: 0,
    powerSavedKw: 0,
    operatorStatus: "LOCKED_MUST_RUN",
    currentActionSummary: "Off during daylight (0 kW); locked at 100% brightness at night",
    safetyConstraintSpec: "Controlled by daylight sensors (18:00–06:00). Maintains full brightness across quayside and container lanes for night worker safety.",
    fallbackRule: "Hardwired daylight sensor override."
  },
  {
    id: "EQ-11",
    name: "Seawater Fire Pump Station (Fire Safety)",
    feeder: "Line F-06",
    zone: "Zone 4",
    controlTier: "MUST_RUN",
    controlLabel: "Protected Safety Equipment",
    pMaxKw: 250,
    maxReductionPercent: 0,
    unoptimizedPeakKw: 25,
    currentLoadKw: 25,
    powerSavedKw: 0,
    operatorStatus: "LOCKED_MUST_RUN",
    currentActionSummary: "100% fire water pressure maintained; backup power armed",
    safetyConstraintSpec: "Dedicated power line with automatic backup switch; 100% availability required by port fire safety code.",
    fallbackRule: "Backup diesel generator starts automatically if grid voltage drops."
  },
  {
    id: "EQ-12",
    name: "Port Radar, Customs Scanners & Control Room UPS",
    feeder: "Line F-06",
    zone: "Zone 4",
    controlTier: "MUST_RUN",
    controlLabel: "Protected Critical IT",
    pMaxKw: 120,
    maxReductionPercent: 0,
    unoptimizedPeakKw: 115,
    currentLoadKw: 115,
    powerSavedKw: 0,
    operatorStatus: "LOCKED_MUST_RUN",
    currentActionSummary: "Continuous 24/7 power to port operations servers & customs scanners",
    safetyConstraintSpec: "Double-conversion UPS battery backup supplying 24/7 uninterrupted power to terminal servers, marine radar, and customs X-ray scanners.",
    fallbackRule: "120-minute internal UPS battery bank + emergency generator bus."
  }
];

// ---------------------------------------------------------------------------
// Module 1 → Module 3 hand-off: estimate the effect of the M-3 dispatch plan
// on the M-1 forecast. Each equipment group sheds its planned `powerSavedKw`
// on its feeder during intervals flagged by M-1 (p_peak ≥ 10 %), capped by the
// feeder's forecast load × the group's allowed reduction.
// ---------------------------------------------------------------------------

function feederKeyOf(group: AssetControlGroup): FeederKey | null {
  const m = group.feeder.match(/F-0(\d)/);
  return m ? (`f0${m[1]}` as FeederKey) : null;
}

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

export function shedAtPoint(p: ForecastPoint, groups: AssetControlGroup[] = INITIAL_12_ASSET_GROUPS): number {
  const remaining: Record<string, number> = { ...p.feeders };
  let shed = 0;
  for (const g of groups) {
    const key = feederKeyOf(g);
    if (!key || g.powerSavedKw <= 0) continue;
    const cap = (p.feeders[key] * g.maxReductionPercent) / 100;
    const kw = Math.max(0, Math.min(g.powerSavedKw, cap, remaining[key]));
    remaining[key] -= kw;
    shed += kw;
  }
  return Math.round(shed);
}

export function estimateM3Dispatch(
  forecast: ForecastResult,
  groups: AssetControlGroup[] = INITIAL_12_ASSET_GROUPS
): M3DispatchEstimate {
  const before = forecast.points.reduce((a, b) => (b.netGrid > a.netGrid ? b : a));
  let dispatched = 0;
  const after = forecast.points.map((p) => {
    if (p.locked || p.pPeak < P_PEAK_SWITCH) return { label: p.label, net: p.netGrid };
    dispatched++;
    return { label: p.label, net: p.netGrid - shedAtPoint(p, groups) };
  });
  const peakAfter = after.reduce((a, b) => (b.net > a.net ? b : a));
  const reductionKw = before.netGrid - peakAfter.net;
  return {
    peakBeforeKw: before.netGrid,
    peakBeforeTime: before.label,
    peakAfterKw: peakAfter.net,
    peakAfterTime: peakAfter.label,
    reductionKw,
    reductionPct: before.netGrid > 0 ? (reductionKw / before.netGrid) * 100 : 0,
    groupsUsed: groups.filter((g) => g.powerSavedKw > 0 && feederKeyOf(g)).length,
    dispatchedIntervals: dispatched,
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
