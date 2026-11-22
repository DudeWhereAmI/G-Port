/**
 * Shared horizontal geometry so the main chart, the risk ribbon and the berth
 * Gantt line up on the same time axis. The chart uses margin.left = 0 and a
 * Y axis of TIMELINE_LEFT px, margin.right = TIMELINE_RIGHT px.
 */
export const TIMELINE_LEFT = 48;
export const TIMELINE_RIGHT = 16;

export type TimeDomain = [number, number];
export const FULL_DAY_DOMAIN: TimeDomain = [0, 1440];

/** Position of a minute inside the plotting area, in percent (unclamped). */
export function timelinePct(minute: number, domain: TimeDomain): number {
  return ((minute - domain[0]) / (domain[1] - domain[0])) * 100;
}

export function timelineTicks(domain: TimeDomain): number[] {
  const span = domain[1] - domain[0];
  const step = span > 720 ? 120 : span > 300 ? 60 : span > 150 ? 30 : 15;
  const ticks: number[] = [];
  for (let m = Math.ceil(domain[0] / step) * step; m <= domain[1]; m += step) ticks.push(m);
  return ticks;
}

export function pPeakColor(p: number): string {
  if (p < 0.01) return "#F1F5F9";
  if (p < 0.05) return "#FEF9C3";
  if (p < 0.1) return "#FDE68A";
  if (p < 0.3) return "#FDBA74";
  if (p < 0.6) return "#F97316";
  return "#DC2626";
}
