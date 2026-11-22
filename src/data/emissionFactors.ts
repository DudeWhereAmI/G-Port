/**
 * Versioned emission-factor library (Module 2 · C2), shared by M-2 and M-3.
 * Locked records keep the factor version they were computed with; new periods
 * use the active version. Never hard-code factors elsewhere – import them here.
 */
import type { BilingualText } from "./module1Forecast";

export type FactorKind = "GRID" | "DIESEL" | "DIESEL_DENSITY";
export type FactorStatus = "ACTIVE" | "ARCHIVED";

export interface EmissionFactorVersion {
  id: string;
  kind: FactorKind;
  name: BilingualText;
  value: number;
  unit: string;
  source: BilingualText;
  year: number;
  effectiveFrom: string;
  status: FactorStatus;
}

export const EMISSION_FACTORS: EmissionFactorVersion[] = [
  {
    id: "EF-GRID-2023",
    kind: "GRID",
    name: { en: "Vietnam grid EF (location-based)", vn: "Hệ số phát thải lưới điện Việt Nam (location-based)" },
    value: 0.6592,
    unit: "kgCO₂e/kWh",
    source: { en: "Dept. of Climate Change (MONRE), 2023", vn: "Cục Biến đổi khí hậu (Bộ TN&MT), năm 2023" },
    year: 2023,
    effectiveFrom: "2024-12-01",
    status: "ACTIVE",
  },
  {
    id: "EF-GRID-2022",
    kind: "GRID",
    name: { en: "Vietnam grid EF (location-based)", vn: "Hệ số phát thải lưới điện Việt Nam (location-based)" },
    value: 0.6766,
    unit: "kgCO₂e/kWh",
    source: { en: "Dept. of Climate Change (MONRE), 2022", vn: "Cục Biến đổi khí hậu (Bộ TN&MT), năm 2022" },
    year: 2022,
    effectiveFrom: "2023-11-01",
    status: "ARCHIVED",
  },
  {
    id: "EF-DO-2024",
    kind: "DIESEL",
    name: { en: "Diesel oil (DO), combined CO₂e", vn: "Dầu DO, hệ số gộp CO₂e" },
    value: 2.68,
    unit: "kgCO₂e/L",
    source: { en: "IPCC 2006 (stationary/mobile combustion), report value", vn: "IPCC 2006 (đốt nhiên liệu), giá trị theo report" },
    year: 2024,
    effectiveFrom: "2024-01-01",
    status: "ACTIVE",
  },
  {
    id: "RHO-DO-2024",
    kind: "DIESEL_DENSITY",
    name: { en: "Diesel density ρ", vn: "Khối lượng riêng dầu DO ρ" },
    value: 0.845,
    unit: "kg/L",
    source: { en: "TCVN 5689, report value", vn: "TCVN 5689, giá trị theo report" },
    year: 2024,
    effectiveFrom: "2024-01-01",
    status: "ACTIVE",
  },
];

export function activeFactor(kind: FactorKind): EmissionFactorVersion {
  const f = EMISSION_FACTORS.find((x) => x.kind === kind && x.status === "ACTIVE");
  if (!f) throw new Error(`No active factor for ${kind}`);
  return f;
}

export const GRID_EF_KG_PER_KWH = activeFactor("GRID").value;
export const DIESEL_EF_KG_PER_L = activeFactor("DIESEL").value;
export const DIESEL_DENSITY_KG_PER_L = activeFactor("DIESEL_DENSITY").value;
