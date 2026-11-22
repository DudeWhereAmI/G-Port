/**
 * Design tokens for code that needs raw values (charts, SVG, canvas).
 * Mirrors the CSS variables in src/index.css – keep the two in sync.
 */

export const BRAND = { main: "#0B3B6F", hover: "#082D55", soft: "#E8EEF6" };

export const NEUTRAL = {
  canvas: "#F7F8FA",
  line: "#E5E7EB",
  grid: "#EEF0F3",
  axis: "#64748B",
  ink: "#0F172A",
  muted: "#64748B",
  subtle: "#94A3B8",
};

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export const STATUS: Record<StatusTone, { text: string; soft: string; dot: string }> = {
  success: { text: "#047857", soft: "#ECFDF5", dot: "#10B981" },
  warning: { text: "#B45309", soft: "#FFFBEB", dot: "#F59E0B" },
  danger: { text: "#B91C1C", soft: "#FEF2F2", dot: "#EF4444" },
  info: { text: "#1D4ED8", soft: "#EFF6FF", dot: "#3B82F6" },
  neutral: { text: "#475569", soft: "#F1F5F9", dot: "#94A3B8" },
};

/** 8-colour chart palette. */
export const CHART = ["#1F4E8C", "#3B82C4", "#1FA2B4", "#7C6BD6", "#2E9E6B", "#94A3B8", "#E0A21B", "#D9622B"] as const;

/** Fixed semantic colours – identical on M-1, M-2 and M-3. */
export const SERIES = {
  /** six feeders */
  f01: CHART[0],
  f02: CHART[1],
  f03: CHART[2],
  f04: CHART[3],
  f05: CHART[4],
  f06: CHART[5],
  /** emissions */
  scope1: CHART[7],
  scope2: CHART[1],
  /** energy */
  pv: CHART[6],
  forecast: BRAND.main,
  band: "#9DB8DC",
  actual: "#475569",
  netGrid: CHART[3],
  /** thresholds */
  limit: STATUS.warning.dot,
  target: STATUS.success.dot,
  /** optimisation */
  reduced: STATUS.success.dot,
  shifted: STATUS.info.dot,
  before: NEUTRAL.subtle,
  after: BRAND.main,
  bess: CHART[3],
  diesel: CHART[7],
};

/** Shared Recharts styling. */
export const CHART_THEME = {
  grid: { stroke: NEUTRAL.grid, strokeDasharray: "0", vertical: false },
  axisTick: { fontSize: 12, fill: NEUTRAL.axis },
  axis: { stroke: NEUTRAL.line, tickLine: false, fontSize: 12 },
  line: { strokeWidth: 2, dot: false, activeDot: { r: 4, strokeWidth: 0 } },
  limitLabel: { fontSize: 12, fontWeight: 500, fill: STATUS.warning.text },
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
};
