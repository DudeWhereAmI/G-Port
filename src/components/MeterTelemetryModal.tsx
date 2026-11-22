import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { CALL_RECORDS, ENERGY_BALANCE, stamp } from "../data/module2Carbon";
import { activeFactor } from "../data/emissionFactors";
import {
  X,
  Zap,
  Fuel,
  Gauge,
  Activity,
  CheckCircle2,
  Download,
  Clock,
  Ship,
  BarChart3,
  FileText,
  ArrowLeft,
  ShieldCheck,
  Lock,
  ChevronRight,
} from "lucide-react";

export type MeterMedium = "ELECTRICITY" | "FUEL" | "REEFER_THERMAL" | "BATTERY";
export type MeterModalMode = "LIVE_MONITORING" | "COMPLETED_INVOICE";

export interface MeterTimePoint {
  time: string;
  hour: number;
  primaryVal: number; // kW or L/h
  secondaryVal: number; // Voltage (kV) or Pressure (bar) or Temp (°C) or SOC (%)
  tertiaryVal: number; // Current (A) or Temp (°C) or Active Plugs or Cell Temp (°C)
  quaternaryVal: number; // Power Factor (cos φ) or RPM or Excursion Count or SOH (%)
  cumulativeTotal: number; // Cumulative kWh or Liters
  statusText: string;
}

export interface HistoricalPortCallRecord {
  voyage: string;
  vesselName: string;
  invoiceNumber: string;
  date: string;
  teuHandled: number;
  totalQuantity: number;
  unit: "kWh" | "Liters";
  intensityPerTeu: number;
  intensityLabel: string;
  status: "LIVE_ACTIVE" | "COMPLETED_INVOICED";
  berth: string;
}

export interface PortMeterDevice {
  id: string;
  linkedEntityId?: string; // Links to 3D/2D entity ID (e.g., STS-01, TRK-2481, BAY-B2, VSL-01)
  name: string;
  category: "OPS_SHORE" | "STS_CRANE" | "REEFER_YARD" | "BESS_STORAGE" | "TUGBOAT_FUEL" | "TRACTOR_FUEL";
  medium: MeterMedium;
  location: string;
  protocol: string;
  serialNumber: string;
  nominalRating: string;
  primaryUnit: "kW" | "L/h";
  cumulativeUnit: "kWh" | "Liters";
  totalPeriodRecorded: number;
  openingReading: number;
  closingReading: number;
  recordingWindow: string;
  emissionFactorLabel: string;
  scopeType: "SCOPE_1" | "SCOPE_2" | "ZERO_CARBON_OFFSET";
  co2eMetricTons: number;
  recordStatus: "LIVE_RECORDING" | "COMPLETED_SEALED";
  chartYMax: number;
  chartYUnit: string;
  description: string;
  telemetry: MeterTimePoint[];
  historicalCalls: HistoricalPortCallRecord[];
}

export interface PortCallMeterGroup {
  useCaseId: string;
  vesselEntityId: string; // "VSL-01" | "VSL-02" | "VSL-03"
  vesselName: string;
  voyageNumber: string;
  imoNumber: string;
  carrier: string;
  berth: string;
  arrivalWindow: string;
  departureWindow: string;
  hotelingHours: number;
  teuHandled: number;
  invoiceNumber: string;
  portCallState: "LIVE_MONITORING" | "COMPLETED_INVOICE";
  dcsaHash: string;
  totalElectricityKwh: number;
  totalFuelLiters: number;
  totalScope1Tons: number;
  totalScope2Tons: number;
  meters: PortMeterDevice[];
}

const RAW_PORT_CALL_METERS: PortCallMeterGroup[] = [
  // ============================================================================
  // UC-01: MV SPIRIT OF MUMBAI (Voyage 056N) — Berth B2 (Container Mainline)
  // ============================================================================
  {
    useCaseId: "UC-01",
    vesselEntityId: "VSL-01",
    vesselName: "MV SPIRIT OF MUMBAI",
    voyageNumber: "056N",
    imoNumber: "9482104",
    carrier: "Maersk Line",
    berth: "Berth B2 (Deep-Water Container Wharf)",
    arrivalWindow: "2026-05-15 08:00",
    departureWindow: "2026-05-16 04:30",
    hotelingHours: 20.5,
    teuHandled: 3420,
    invoiceNumber: "GPORT-INV-2026-0901",
    portCallState: "LIVE_MONITORING",
    dcsaHash: "0x8f4e2c9b10a4d7f3e5c1a9b8d4e6f2a1c3e5b7d9",
    totalElectricityKwh: 56220,
    totalFuelLiters: 4160,
    totalScope1Tons: 11.15,
    totalScope2Tons: 31.93,
    meters: [
      {
        id: "MTR-OPS-B2-01",
        linkedEntityId: "VSL-01",
        name: "Berth B2 Cavotec Shore Power (OPS) Substation",
        category: "OPS_SHORE",
        medium: "ELECTRICITY",
        location: "Quay Substation B2 · Pit #04",
        protocol: "IEC 61850 MMS · Class 0.2S",
        serialNumber: "ABB-M4M-2026-8801",
        nominalRating: "6.6 kV / 60 Hz · 2,500 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 28400,
        openingReading: 814200,
        closingReading: 842600,
        recordingWindow: "15/05 08:30 → 16/05 04:00 (19.5h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (EVN Grid)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 20.51,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 2000,
        chartYUnit: "Active Power (kW)",
        description: "High-voltage 6.6kV Onshore Power Supply feeding MV SPIRIT OF MUMBAI hoteling & onboard reefer racks at Berth B2.",
        telemetry: [
          { time: "08:00", hour: 0, primaryVal: 420, secondaryVal: 6.62, tertiaryVal: 42, quaternaryVal: 0.96, cumulativeTotal: 420, statusText: "Auto-Sync & Breaker Closed" },
          { time: "10:00", hour: 2, primaryVal: 1450, secondaryVal: 6.60, tertiaryVal: 138, quaternaryVal: 0.97, cumulativeTotal: 3320, statusText: "Auxiliary Diesel Engines OFF" },
          { time: "12:00", hour: 4, primaryVal: 1580, secondaryVal: 6.59, tertiaryVal: 151, quaternaryVal: 0.98, cumulativeTotal: 6480, statusText: "Peak Onboard Hotel Load" },
          { time: "16:00", hour: 8, primaryVal: 1490, secondaryVal: 6.60, tertiaryVal: 142, quaternaryVal: 0.97, cumulativeTotal: 12660, statusText: "Steady Hotel & Galley Load" },
          { time: "20:00", hour: 12, primaryVal: 1420, secondaryVal: 6.61, tertiaryVal: 135, quaternaryVal: 0.98, cumulativeTotal: 18520, statusText: "Night Shift Steady OPS" },
          { time: "00:00", hour: 16, primaryVal: 1380, secondaryVal: 6.61, tertiaryVal: 131, quaternaryVal: 0.98, cumulativeTotal: 24200, statusText: "Pre-Departure Load Tapering" },
          { time: "04:00", hour: 20, primaryVal: 840, secondaryVal: 6.63, tertiaryVal: 80, quaternaryVal: 0.96, cumulativeTotal: 28400, statusText: "OPS Disconnection Sequence" },
        ],
        historicalCalls: [
          { voyage: "056N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0901", date: "15 May 2026", teuHandled: 3420, totalQuantity: 28400, unit: "kWh", intensityPerTeu: 8.3, intensityLabel: "8.30 kWh/TEU", status: "LIVE_ACTIVE", berth: "Berth B2" },
          { voyage: "052N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0842", date: "18 Apr 2026", teuHandled: 3290, totalQuantity: 27150, unit: "kWh", intensityPerTeu: 8.25, intensityLabel: "8.25 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B2" },
          { voyage: "048N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0791", date: "21 Mar 2026", teuHandled: 3180, totalQuantity: 26800, unit: "kWh", intensityPerTeu: 8.42, intensityLabel: "8.42 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B2" },
        ],
      },
      {
        id: "MTR-STS-B2-04",
        linkedEntityId: "STS-02",
        name: "STS-01 & STS-02 Quay Cranes Feeder (Berth B2)",
        category: "STS_CRANE",
        medium: "ELECTRICITY",
        location: "Berth B2 Crane Rail Trench",
        protocol: "Modbus TCP/IP · Regen Bi-Directional",
        serialNumber: "SCHNEIDER-PM8000-04",
        nominalRating: "3.3 kV · 3,200 kW Peak",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 18620,
        openingReading: 521040,
        closingReading: 539660,
        recordingWindow: "15/05 08:45 → 16/05 03:45 (19.0h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (-18.4% Regen Credit)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 13.45,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 1600,
        chartYUnit: "Net Crane Demand (kW)",
        description: "Bi-directional meter tracking twin-lift hoist demand and regenerative lowering recovery for STS-01 & STS-02 on Berth B2.",
        telemetry: [
          { time: "08:00", hour: 0, primaryVal: 320, secondaryVal: 3.31, tertiaryVal: 62, quaternaryVal: 0.93, cumulativeTotal: 320, statusText: "Boom Lowered & Gantry Locked" },
          { time: "10:00", hour: 2, primaryVal: 1180, secondaryVal: 3.28, tertiaryVal: 224, quaternaryVal: 0.94, cumulativeTotal: 2680, statusText: "Twin-Lift Bay 14 Discharge" },
          { time: "12:00", hour: 4, primaryVal: 1290, secondaryVal: 3.27, tertiaryVal: 245, quaternaryVal: 0.95, cumulativeTotal: 5260, statusText: "Peak Crane Hoist (68 MPH)" },
          { time: "16:00", hour: 8, primaryVal: 1040, secondaryVal: 3.29, tertiaryVal: 198, quaternaryVal: 0.95, cumulativeTotal: 9640, statusText: "Regen Lowering Recovery (-210 kW)" },
          { time: "20:00", hour: 12, primaryVal: 1120, secondaryVal: 3.28, tertiaryVal: 212, quaternaryVal: 0.94, cumulativeTotal: 14120, statusText: "Export Bay Loading Operations" },
          { time: "00:00", hour: 16, primaryVal: 920, secondaryVal: 3.30, tertiaryVal: 174, quaternaryVal: 0.95, cumulativeTotal: 17500, statusText: "Final Hatch Cover Handling" },
          { time: "04:00", hour: 20, primaryVal: 180, secondaryVal: 3.32, tertiaryVal: 34, quaternaryVal: 0.92, cumulativeTotal: 18620, statusText: "Boom Stowed · Standby" },
        ],
        historicalCalls: [
          { voyage: "056N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0901", date: "15 May 2026", teuHandled: 3420, totalQuantity: 18620, unit: "kWh", intensityPerTeu: 5.44, intensityLabel: "5.44 kWh/TEU", status: "LIVE_ACTIVE", berth: "Berth B2" },
          { voyage: "052N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0842", date: "18 Apr 2026", teuHandled: 3290, totalQuantity: 17980, unit: "kWh", intensityPerTeu: 5.46, intensityLabel: "5.46 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B2" },
          { voyage: "048N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0791", date: "21 Mar 2026", teuHandled: 3180, totalQuantity: 17490, unit: "kWh", intensityPerTeu: 5.50, intensityLabel: "5.50 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B2" },
        ],
      },
      {
        id: "MTR-RF-Y3-02",
        linkedEntityId: "BAY-B2",
        name: "Container Bay B2 e-RTG & Reefer Rack Sub-Meter",
        category: "REEFER_YARD",
        medium: "REEFER_THERMAL",
        location: "Container Bay B2 (Stacking Block B2)",
        protocol: "OPC-UA / PLC Telemetry",
        serialNumber: "SIEMENS-PAC4200-B2",
        nominalRating: "400V 3P · 850 kW Rated",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 9200,
        openingReading: 190400,
        closingReading: 199600,
        recordingWindow: "15/05 08:00 → 16/05 04:30 (20.5h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (Solar Offset Applied)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 6.64,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 700,
        chartYUnit: "Bay B2 Power (kW)",
        description: "Dedicated sub-meter for Container Bay B2 e-RTG stacking gantries and reefer buffer plugs assigned to MV SPIRIT OF MUMBAI (056N).",
        telemetry: [
          { time: "08:00", hour: 0, primaryVal: 380, secondaryVal: -21.8, tertiaryVal: 140, quaternaryVal: 0, cumulativeTotal: 380, statusText: "Bay B2 Pre-Stacking Ready" },
          { time: "12:00", hour: 4, primaryVal: 520, secondaryVal: -21.5, tertiaryVal: 185, quaternaryVal: 0, cumulativeTotal: 2460, statusText: "Peak Container Stacking in Bay B2" },
          { time: "16:00", hour: 8, primaryVal: 490, secondaryVal: -21.7, tertiaryVal: 195, quaternaryVal: 0, cumulativeTotal: 4480, statusText: "Solar PV + Crane Regen Assisting Bay B2" },
          { time: "20:00", hour: 12, primaryVal: 450, secondaryVal: -22.0, tertiaryVal: 210, quaternaryVal: 0, cumulativeTotal: 6360, statusText: "Night Shift Dwell & Stacking" },
          { time: "00:00", hour: 16, primaryVal: 430, secondaryVal: -22.1, tertiaryVal: 210, quaternaryVal: 0, cumulativeTotal: 8120, statusText: "Thermal Equilibrium Held" },
          { time: "04:00", hour: 20, primaryVal: 410, secondaryVal: -22.1, tertiaryVal: 190, quaternaryVal: 0, cumulativeTotal: 9200, statusText: "Voyage 056N Bay B2 Cut-off" },
        ],
        historicalCalls: [
          { voyage: "056N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0901", date: "15 May 2026", teuHandled: 3420, totalQuantity: 9200, unit: "kWh", intensityPerTeu: 2.69, intensityLabel: "2.69 kWh/TEU", status: "LIVE_ACTIVE", berth: "Berth B2 · Bay B2" },
          { voyage: "052N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0842", date: "18 Apr 2026", teuHandled: 3290, totalQuantity: 8940, unit: "kWh", intensityPerTeu: 2.71, intensityLabel: "2.71 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B2 · Bay B2" },
        ],
      },
      {
        id: "MTR-TRK-088",
        linkedEntityId: "TRK-2481",
        name: "Berth B2 ↔ Bay B2 Prime Mover Fleet Fuel Telemetry",
        category: "TRACTOR_FUEL",
        medium: "FUEL",
        location: "TRK-2481 & TRK-2205 (Assigned to Berth B2)",
        protocol: "CAN-Bus J1939 Ultrasonic Fuel Sensor",
        serialNumber: "OMNICOMM-LLS5-088",
        nominalRating: "18 Tractors · Euro V Diesel",
        primaryUnit: "L/h",
        cumulativeUnit: "Liters",
        totalPeriodRecorded: 2280,
        openingReading: 44120,
        closingReading: 46400,
        recordingWindow: "15/05 08:30 → 16/05 04:00 (19.5h)",
        emissionFactorLabel: "2.680 kgCO₂e/L (ISO 14083 Diesel)",
        scopeType: "SCOPE_1",
        co2eMetricTons: 6.11,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 180,
        chartYUnit: "Fleet Burn Rate (L/h)",
        description: "Aggregated CAN-Bus fuel telemetry for terminal tractors (TRK-2481, TRK-2205) shuttling containers strictly between Berth B2 and Container Bay B2.",
        telemetry: [
          { time: "08:00", hour: 0, primaryVal: 45, secondaryVal: 4.1, tertiaryVal: 34, quaternaryVal: 1150, cumulativeTotal: 45, statusText: "Fleet Dispatch to Berth B2 Apron" },
          { time: "12:00", hour: 4, primaryVal: 138, secondaryVal: 4.5, tertiaryVal: 39, quaternaryVal: 1680, cumulativeTotal: 590, statusText: "Peak Shuttle Loop: Berth B2 ↔ Bay B2" },
          { time: "16:00", hour: 8, primaryVal: 126, secondaryVal: 4.4, tertiaryVal: 40, quaternaryVal: 1620, cumulativeTotal: 1110, statusText: "Active Yard Transfer Loop" },
          { time: "20:00", hour: 12, primaryVal: 118, secondaryVal: 4.3, tertiaryVal: 37, quaternaryVal: 1580, cumulativeTotal: 1600, statusText: "Night Shift Container Shuttling" },
          { time: "00:00", hour: 16, primaryVal: 110, secondaryVal: 4.3, tertiaryVal: 36, quaternaryVal: 1520, cumulativeTotal: 2050, statusText: "Final Export Load Shuttle" },
          { time: "04:00", hour: 20, primaryVal: 55, secondaryVal: 4.0, tertiaryVal: 33, quaternaryVal: 1100, cumulativeTotal: 2280, statusText: "Voyage 056N Loop Completed" },
        ],
        historicalCalls: [
          { voyage: "056N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0901", date: "15 May 2026", teuHandled: 3420, totalQuantity: 2280, unit: "Liters", intensityPerTeu: 0.67, intensityLabel: "0.67 L/TEU", status: "LIVE_ACTIVE", berth: "Berth B2 ↔ Bay B2" },
          { voyage: "052N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0842", date: "18 Apr 2026", teuHandled: 3290, totalQuantity: 2190, unit: "Liters", intensityPerTeu: 0.66, intensityLabel: "0.66 L/TEU", status: "COMPLETED_INVOICED", berth: "Berth B2 ↔ Bay B2" },
        ],
      },
      {
        id: "MTR-TUG-012",
        linkedEntityId: "VSL-01",
        name: "Harbor Assist Tugs (TC-01 & TC-02) Coriolis Mass Flow",
        category: "TUGBOAT_FUEL",
        medium: "FUEL",
        location: "Cat Lai Basin",
        protocol: "Endress+Hauser Promass F300 · NMEA 2000",
        serialNumber: "EH-CORIOLIS-2026-12",
        nominalRating: "2 × 4,200 BHP ASD Tugs",
        primaryUnit: "L/h",
        cumulativeUnit: "Liters",
        totalPeriodRecorded: 1880,
        openingReading: 91200,
        closingReading: 93080,
        recordingWindow: "Berthing (07:30–08:30) & Unberthing (03:45–04:30)",
        emissionFactorLabel: "2.680 kgCO₂e/L (Marine MGO)",
        scopeType: "SCOPE_1",
        co2eMetricTons: 5.04,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 950,
        chartYUnit: "Bollard Pull Fuel Flow (L/h)",
        description: "Precision Coriolis fuel mass meter recording tugboat escort, turning basin assist, and berthing/unberthing for MV SPIRIT OF MUMBAI.",
        telemetry: [
          { time: "07:30", hour: 0, primaryVal: 790, secondaryVal: 5.4, tertiaryVal: 41, quaternaryVal: 1760, cumulativeTotal: 790, statusText: "Inbound Berthing Bollard Push (Berth B2)" },
          { time: "08:30", hour: 2, primaryVal: 180, secondaryVal: 4.2, tertiaryVal: 36, quaternaryVal: 950, cumulativeTotal: 970, statusText: "All Fast Berth B2 · Tugs Released" },
          { time: "16:00", hour: 10, primaryVal: 0, secondaryVal: 0, tertiaryVal: 29, quaternaryVal: 0, cumulativeTotal: 970, statusText: "Tugs Standby at Basin" },
          { time: "03:45", hour: 19, primaryVal: 740, secondaryVal: 5.3, tertiaryVal: 40, quaternaryVal: 1710, cumulativeTotal: 1710, statusText: "Outbound Unberthing Pull" },
          { time: "04:30", hour: 20.5, primaryVal: 170, secondaryVal: 4.1, tertiaryVal: 35, quaternaryVal: 900, cumulativeTotal: 1880, statusText: "Vessel Clear of Channel" },
        ],
        historicalCalls: [
          { voyage: "056N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0901", date: "15 May 2026", teuHandled: 3420, totalQuantity: 1880, unit: "Liters", intensityPerTeu: 0.55, intensityLabel: "0.55 L/TEU", status: "LIVE_ACTIVE", berth: "Berth B2" },
          { voyage: "052N", vesselName: "MV SPIRIT OF MUMBAI", invoiceNumber: "GPORT-INV-2026-0842", date: "18 Apr 2026", teuHandled: 3290, totalQuantity: 1840, unit: "Liters", intensityPerTeu: 0.56, intensityLabel: "0.56 L/TEU", status: "COMPLETED_INVOICED", berth: "Berth B2" },
        ],
      },
    ],
  },

  // ============================================================================
  // UC-02: MV ONE APUS (Voyage 012W) — Berth B3 (Reefer Cold-Chain Call)
  // ============================================================================
  {
    useCaseId: "UC-02",
    vesselEntityId: "VSL-02",
    vesselName: "MV ONE APUS",
    voyageNumber: "012W",
    imoNumber: "9806079",
    carrier: "Ocean Network Express (ONE)",
    berth: "Berth B3 (East Deep-Sea Reefer Quay)",
    arrivalWindow: "2026-05-14 06:00",
    departureWindow: "2026-05-15 08:00",
    hotelingHours: 26.0,
    teuHandled: 4850,
    invoiceNumber: "GPORT-INV-2026-0902",
    portCallState: "COMPLETED_INVOICE",
    dcsaHash: "0x3c9a7b2e5d1f8a4c6e0b9d2f4a7c1e3b5d8f0a2c",
    totalElectricityKwh: 89300,
    totalFuelLiters: 5560,
    totalScope1Tons: 14.90,
    totalScope2Tons: 51.05,
    meters: [
      {
        id: "MTR-OPS-B3-01",
        linkedEntityId: "VSL-02",
        name: "Berth B3 Dual-Cable Shore Power (OPS) Feeder",
        category: "OPS_SHORE",
        medium: "ELECTRICITY",
        location: "Quay Substation B3 · Dual Pit #08",
        protocol: "IEC 61850 MMS · Class 0.2S",
        serialNumber: "ABB-M4M-2026-8809",
        nominalRating: "6.6 kV / 60 Hz · 3,500 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 38200,
        openingReading: 612000,
        closingReading: 650200,
        recordingWindow: "14/05 06:30 → 15/05 07:30 (25.0h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (EVN Grid)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 27.58,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 2400,
        chartYUnit: "Active Power (kW)",
        description: "Dual-cable 6.6kV Shore Power supply serving MV ONE APUS high-density reefer racks and hoteling systems at Berth B3.",
        telemetry: [
          { time: "06:00", hour: 0, primaryVal: 950, secondaryVal: 6.61, tertiaryVal: 92, quaternaryVal: 0.97, cumulativeTotal: 950, statusText: "Dual-Cable OPS Connected" },
          { time: "10:00", hour: 4, primaryVal: 1620, secondaryVal: 6.59, tertiaryVal: 155, quaternaryVal: 0.98, cumulativeTotal: 7100, statusText: "Full Reefer Rack Transfer to Shore" },
          { time: "15:00", hour: 9, primaryVal: 1790, secondaryVal: 6.58, tertiaryVal: 171, quaternaryVal: 0.98, cumulativeTotal: 15800, statusText: "Afternoon Ambient Thermal Peak" },
          { time: "21:00", hour: 15, primaryVal: 1540, secondaryVal: 6.60, tertiaryVal: 147, quaternaryVal: 0.98, cumulativeTotal: 25400, statusText: "Steady Overnight Cold-Chain Load" },
          { time: "03:00", hour: 21, primaryVal: 1460, secondaryVal: 6.61, tertiaryVal: 139, quaternaryVal: 0.98, cumulativeTotal: 34200, statusText: "Pre-Sailing Reefer Verification" },
          { time: "08:00", hour: 26, primaryVal: 800, secondaryVal: 6.62, tertiaryVal: 76, quaternaryVal: 0.96, cumulativeTotal: 38200, statusText: "OPS Disconnected & Sealed" },
        ],
        historicalCalls: [
          { voyage: "012W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0902", date: "14 May 2026", teuHandled: 4850, totalQuantity: 38200, unit: "kWh", intensityPerTeu: 7.88, intensityLabel: "7.88 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3" },
          { voyage: "008W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0819", date: "10 Apr 2026", teuHandled: 4620, totalQuantity: 36400, unit: "kWh", intensityPerTeu: 7.87, intensityLabel: "7.87 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3" },
        ],
      },
      {
        id: "MTR-STS-B3-03",
        linkedEntityId: "STS-03",
        name: "STS-03 Quay Crane Feeder (Berth B3)",
        category: "STS_CRANE",
        medium: "ELECTRICITY",
        location: "Berth B3 East Quay Rail",
        protocol: "Modbus TCP/IP · Regen Active",
        serialNumber: "SCHNEIDER-PM8000-09",
        nominalRating: "3.3 kV · 2,800 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 26900,
        openingReading: 410200,
        closingReading: 437100,
        recordingWindow: "14/05 06:45 → 15/05 07:15 (24.5h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh",
        scopeType: "SCOPE_2",
        co2eMetricTons: 19.42,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 1600,
        chartYUnit: "Crane Active Power (kW)",
        description: "High-speed container crane metering on Berth B3 for MV ONE APUS reefer & dry container discharge.",
        telemetry: [
          { time: "06:00", hour: 0, primaryVal: 410, secondaryVal: 3.31, tertiaryVal: 78, quaternaryVal: 0.94, cumulativeTotal: 410, statusText: "STS-03 Boom Lowered" },
          { time: "12:00", hour: 6, primaryVal: 1240, secondaryVal: 3.28, tertiaryVal: 236, quaternaryVal: 0.95, cumulativeTotal: 7400, statusText: "Reefer Bay Priority Discharge" },
          { time: "18:00", hour: 12, primaryVal: 1180, secondaryVal: 3.29, tertiaryVal: 224, quaternaryVal: 0.95, cumulativeTotal: 14600, statusText: "Continuous Twin-Lift Operations" },
          { time: "00:00", hour: 18, primaryVal: 1090, secondaryVal: 3.29, tertiaryVal: 207, quaternaryVal: 0.95, cumulativeTotal: 21400, statusText: "Export Cold-Chain Loading" },
          { time: "08:00", hour: 26, primaryVal: 320, secondaryVal: 3.31, tertiaryVal: 60, quaternaryVal: 0.93, cumulativeTotal: 26900, statusText: "Operations Completed · Boom Up" },
        ],
        historicalCalls: [
          { voyage: "012W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0902", date: "14 May 2026", teuHandled: 4850, totalQuantity: 26900, unit: "kWh", intensityPerTeu: 5.55, intensityLabel: "5.55 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3" },
          { voyage: "008W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0819", date: "10 Apr 2026", teuHandled: 4620, totalQuantity: 25600, unit: "kWh", intensityPerTeu: 5.54, intensityLabel: "5.54 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3" },
        ],
      },
      {
        id: "MTR-RF-R1-01",
        linkedEntityId: "BAY-R1",
        name: "Reefer Bay R1 Cold-Chain Rack Feeder (620 Plugs)",
        category: "REEFER_YARD",
        medium: "REEFER_THERMAL",
        location: "Reefer Bay R1 (East Cold-Chain Block)",
        protocol: "OPC-UA / Danfoss Telematics",
        serialNumber: "SIEMENS-PAC4200-R1",
        nominalRating: "400V 3P · 1,500 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 24200,
        openingReading: 308400,
        closingReading: 332600,
        recordingWindow: "14/05 06:00 → 15/05 08:00 (26.0h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (Off-Peak Pre-Cool Assisted)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 17.47,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 1200,
        chartYUnit: "Reefer Rack Power (kW)",
        description: "Dedicated cold-chain metering for Reefer Bay R1 (-22.4°C setpoints) serving MV ONE APUS pharmaceutical and frozen seafood boxes.",
        telemetry: [
          { time: "06:00", hour: 0, primaryVal: 820, secondaryVal: -22.1, tertiaryVal: 410, quaternaryVal: 0, cumulativeTotal: 820, statusText: "Inbound Reefer Plug-In Wave" },
          { time: "14:00", hour: 8, primaryVal: 1060, secondaryVal: -21.8, tertiaryVal: 620, quaternaryVal: 0, cumulativeTotal: 8900, statusText: "Peak 620 Reefer Plugs Online" },
          { time: "22:00", hour: 16, primaryVal: 940, secondaryVal: -22.4, tertiaryVal: 620, quaternaryVal: 0, cumulativeTotal: 16900, statusText: "Thermal Pre-Cool Setpoint Reached" },
          { time: "08:00", hour: 26, primaryVal: 780, secondaryVal: -22.4, tertiaryVal: 540, quaternaryVal: 0, cumulativeTotal: 24200, statusText: "Voyage 012W Cold-Chain Audit Sealed" },
        ],
        historicalCalls: [
          { voyage: "012W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0902", date: "14 May 2026", teuHandled: 4850, totalQuantity: 24200, unit: "kWh", intensityPerTeu: 4.99, intensityLabel: "4.99 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3 · Reefer Bay R1" },
          { voyage: "008W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0819", date: "10 Apr 2026", teuHandled: 4620, totalQuantity: 22950, unit: "kWh", intensityPerTeu: 4.97, intensityLabel: "4.97 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3 · Reefer Bay R1" },
        ],
      },
      {
        id: "MTR-TRK-B3-01",
        linkedEntityId: "TRK-2319",
        name: "Berth B3 ↔ Reefer Bay R1 Tractor & Tug Fuel Total",
        category: "TRACTOR_FUEL",
        medium: "FUEL",
        location: "TRK-2319 Fleet & Assist Tugs (Berth B3)",
        protocol: "CAN-Bus J1939 + Coriolis Mass Flow",
        serialNumber: "OMNICOMM-B3-2319",
        nominalRating: "Euro V Diesel · Certified MRV",
        primaryUnit: "L/h",
        cumulativeUnit: "Liters",
        totalPeriodRecorded: 5560,
        openingReading: 112400,
        closingReading: 117960,
        recordingWindow: "14/05 06:00 → 15/05 08:00 (26.0h)",
        emissionFactorLabel: "2.680 kgCO₂e/L (ISO 14083 Diesel)",
        scopeType: "SCOPE_1",
        co2eMetricTons: 14.90,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 350,
        chartYUnit: "Fuel Flow Rate (L/h)",
        description: "Consolidated Scope 1 fuel meter for TRK-2319 reefer transfer tractors (Berth B3 ↔ Bay R1) and harbor assist tugs.",
        telemetry: [
          { time: "06:00", hour: 0, primaryVal: 290, secondaryVal: 4.8, tertiaryVal: 38, quaternaryVal: 1650, cumulativeTotal: 290, statusText: "Berthing Assist + Initial Tractor Dispatch" },
          { time: "14:00", hour: 8, primaryVal: 215, secondaryVal: 4.4, tertiaryVal: 39, quaternaryVal: 1580, cumulativeTotal: 2050, statusText: "Berth B3 ↔ Reefer Bay R1 Shuttle" },
          { time: "22:00", hour: 16, primaryVal: 195, secondaryVal: 4.3, tertiaryVal: 37, quaternaryVal: 1520, cumulativeTotal: 3680, statusText: "Night Reefer Transfer Operations" },
          { time: "08:00", hour: 26, primaryVal: 240, secondaryVal: 4.7, tertiaryVal: 38, quaternaryVal: 1620, cumulativeTotal: 5560, statusText: "Unberthing Completed & Meter Sealed" },
        ],
        historicalCalls: [
          { voyage: "012W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0902", date: "14 May 2026", teuHandled: 4850, totalQuantity: 5560, unit: "Liters", intensityPerTeu: 1.15, intensityLabel: "1.15 L/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3 ↔ Bay R1" },
          { voyage: "008W", vesselName: "MV ONE APUS", invoiceNumber: "GPORT-INV-2026-0819", date: "10 Apr 2026", teuHandled: 4620, totalQuantity: 5310, unit: "Liters", intensityPerTeu: 1.15, intensityLabel: "1.15 L/TEU", status: "COMPLETED_INVOICED", berth: "Berth B3 ↔ Bay R1" },
        ],
      },
    ],
  },

  // ============================================================================
  // UC-04: MV TAN CANG GLORY (Voyage 104S) — Berth B1 (Completed Green Corridor)
  // ============================================================================
  {
    useCaseId: "UC-04",
    vesselEntityId: "VSL-03",
    vesselName: "MV TAN CANG GLORY",
    voyageNumber: "104S",
    imoNumber: "9591210",
    carrier: "Tan Cang Shipping (SNP)",
    berth: "Berth B1 (West Domestic & Green Feeder Quay)",
    arrivalWindow: "2026-05-14 10:15",
    departureWindow: "2026-05-15 04:00",
    hotelingHours: 17.75,
    teuHandled: 1200,
    invoiceNumber: "GPORT-INV-2026-0904",
    portCallState: "COMPLETED_INVOICE",
    dcsaHash: "0x1b8e4f6a2c0d9e3f7a5b1c8d4e2f6a0b3c9d1e5f",
    totalElectricityKwh: 18400,
    totalFuelLiters: 2050,
    totalScope1Tons: 4.40,
    totalScope2Tons: 5.20,
    meters: [
      {
        id: "MTR-OPS-B1-01",
        linkedEntityId: "VSL-03",
        name: "Berth B1 Low-Voltage Shore Power (OPS) Dispenser",
        category: "OPS_SHORE",
        medium: "ELECTRICITY",
        location: "Berth B1 West Feeder Quay · Pit #01",
        protocol: "IEC 61850 MMS · Class 0.2S",
        serialNumber: "ABB-M4M-2026-8790",
        nominalRating: "400V / 50 Hz · 1,000 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 6800,
        openingReading: 142810,
        closingReading: 149610,
        recordingWindow: "14/05 10:30 → 15/05 03:45 (17.25h)",
        emissionFactorLabel: "100% Solar + Crane Regen Green Corridor Matched",
        scopeType: "SCOPE_2",
        co2eMetricTons: 1.92,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 600,
        chartYUnit: "Active Power (kW)",
        description: "Finalized OPS electricity record for MV TAN CANG GLORY (Voyage 104S) at Berth B1, matched with rooftop Solar PV and Crane Regenerative recovery.",
        telemetry: [
          { time: "10:15", hour: 0, primaryVal: 260, secondaryVal: 0.40, tertiaryVal: 390, quaternaryVal: 0.97, cumulativeTotal: 260, statusText: "OPS Plugged In at Berth B1" },
          { time: "14:00", hour: 4, primaryVal: 420, secondaryVal: 0.40, tertiaryVal: 630, quaternaryVal: 0.98, cumulativeTotal: 1940, statusText: "100% Solar PV Supplied" },
          { time: "18:00", hour: 8, primaryVal: 410, secondaryVal: 0.40, tertiaryVal: 615, quaternaryVal: 0.98, cumulativeTotal: 3580, statusText: "Crane Regen & Solar Supply" },
          { time: "22:00", hour: 12, primaryVal: 390, secondaryVal: 0.40, tertiaryVal: 585, quaternaryVal: 0.98, cumulativeTotal: 5140, statusText: "Overnight Feeder Hoteling" },
          { time: "04:00", hour: 17.75, primaryVal: 290, secondaryVal: 0.40, tertiaryVal: 435, quaternaryVal: 0.97, cumulativeTotal: 6800, statusText: "OPS Disconnected · Final Index Sealed" },
        ],
        historicalCalls: [
          { voyage: "104S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0904", date: "15 May 2026", teuHandled: 1200, totalQuantity: 6800, unit: "kWh", intensityPerTeu: 5.67, intensityLabel: "5.67 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1" },
          { voyage: "101S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0861", date: "28 Apr 2026", teuHandled: 1150, totalQuantity: 6520, unit: "kWh", intensityPerTeu: 5.67, intensityLabel: "5.67 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1" },
          { voyage: "098S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0804", date: "11 Apr 2026", teuHandled: 1180, totalQuantity: 6710, unit: "kWh", intensityPerTeu: 5.69, intensityLabel: "5.69 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1" },
        ],
      },
      {
        id: "MTR-STS-B1-04",
        linkedEntityId: "STS-04",
        name: "STS-B1-01 & STS-B1-02 Feeder Cranes (Berth B1)",
        category: "STS_CRANE",
        medium: "ELECTRICITY",
        location: "Berth B1 West Feeder Wharf",
        protocol: "Modbus TCP/IP · Regen Verified",
        serialNumber: "SCHNEIDER-PM8000-01",
        nominalRating: "3.3 kV · 1,600 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 8400,
        openingReading: 294100,
        closingReading: 302500,
        recordingWindow: "14/05 10:45 → 15/05 03:15 (16.5h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (Solar Offset)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 2.38,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 800,
        chartYUnit: "Feeder Crane Power (kW)",
        description: "Finalized electricity meter for Berth B1 feeder quay cranes (STS-B1-01/02) discharging and loading 1,200 TEU onto Bay A1.",
        telemetry: [
          { time: "10:15", hour: 0, primaryVal: 220, secondaryVal: 3.31, tertiaryVal: 42, quaternaryVal: 0.94, cumulativeTotal: 220, statusText: "Feeder Cranes Positioned at Berth B1" },
          { time: "14:00", hour: 4, primaryVal: 560, secondaryVal: 3.29, tertiaryVal: 108, quaternaryVal: 0.95, cumulativeTotal: 2460, statusText: "Unloading Feeder Boxes to TRK-2104" },
          { time: "18:00", hour: 8, primaryVal: 540, secondaryVal: 3.29, tertiaryVal: 104, quaternaryVal: 0.95, cumulativeTotal: 4620, statusText: "Steady Berth B1 ↔ Bay A1 Cycle" },
          { time: "22:00", hour: 12, primaryVal: 510, secondaryVal: 3.30, tertiaryVal: 98, quaternaryVal: 0.95, cumulativeTotal: 6660, statusText: "Export Feeder Stowing" },
          { time: "04:00", hour: 17.75, primaryVal: 190, secondaryVal: 3.31, tertiaryVal: 36, quaternaryVal: 0.93, cumulativeTotal: 8400, statusText: "1,200 TEU Completed · Boom Stowed" },
        ],
        historicalCalls: [
          { voyage: "104S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0904", date: "15 May 2026", teuHandled: 1200, totalQuantity: 8400, unit: "kWh", intensityPerTeu: 7.00, intensityLabel: "7.00 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1" },
          { voyage: "101S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0861", date: "28 Apr 2026", teuHandled: 1150, totalQuantity: 8050, unit: "kWh", intensityPerTeu: 7.00, intensityLabel: "7.00 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1" },
        ],
      },
      {
        id: "MTR-BAY-A1-01",
        linkedEntityId: "BAY-A1",
        name: "Container Bay A1 e-RTG & Reefer Plugs Sub-Meter",
        category: "REEFER_YARD",
        medium: "ELECTRICITY",
        location: "Container Bay A1 (West Yard Block)",
        protocol: "OPC-UA / Siemens PAC4200",
        serialNumber: "SIEMENS-PAC4200-A1",
        nominalRating: "400V 3P · 500 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 3200,
        openingReading: 88100,
        closingReading: 91300,
        recordingWindow: "14/05 10:15 → 15/05 04:00 (17.75h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (Solar Offset)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 0.90,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 350,
        chartYUnit: "Bay A1 Power (kW)",
        description: "Finalized sub-meter for Container Bay A1 stacking gantries and domestic cold-chain plugs serving MV TAN CANG GLORY (104S).",
        telemetry: [
          { time: "10:15", hour: 0, primaryVal: 160, secondaryVal: 0.40, tertiaryVal: 240, quaternaryVal: 0.96, cumulativeTotal: 160, statusText: "Bay A1 Receiving Inbound Feeder Boxes" },
          { time: "16:00", hour: 6, primaryVal: 210, secondaryVal: 0.40, tertiaryVal: 315, quaternaryVal: 0.97, cumulativeTotal: 1420, statusText: "Peak Bay A1 Stacking Cycle" },
          { time: "22:00", hour: 12, primaryVal: 180, secondaryVal: 0.40, tertiaryVal: 270, quaternaryVal: 0.97, cumulativeTotal: 2500, statusText: "Bay A1 Export Retrieval" },
          { time: "04:00", hour: 17.75, primaryVal: 120, secondaryVal: 0.40, tertiaryVal: 180, quaternaryVal: 0.96, cumulativeTotal: 3200, statusText: "Voyage 104S Bay A1 Tally Closed" },
        ],
        historicalCalls: [
          { voyage: "104S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0904", date: "15 May 2026", teuHandled: 1200, totalQuantity: 3200, unit: "kWh", intensityPerTeu: 2.67, intensityLabel: "2.67 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1 · Bay A1" },
          { voyage: "101S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0861", date: "28 Apr 2026", teuHandled: 1150, totalQuantity: 3070, unit: "kWh", intensityPerTeu: 2.67, intensityLabel: "2.67 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1 · Bay A1" },
        ],
      },
      {
        id: "MTR-BIO-B1-01",
        linkedEntityId: "TRK-2104",
        name: "Berth B1 ↔ Bay A1 B20 Biofuel Tractors (TRK-2104) & Tug",
        category: "TRACTOR_FUEL",
        medium: "FUEL",
        location: "Berth B1 West Loop (TRK-2104)",
        protocol: "CAN-Bus J1939 + Coriolis Biofuel Blend",
        serialNumber: "OMNICOMM-B1-2104",
        nominalRating: "B20 Bio-Diesel Blend (-20% Lifecycle CO₂)",
        primaryUnit: "L/h",
        cumulativeUnit: "Liters",
        totalPeriodRecorded: 2050,
        openingReading: 31400,
        closingReading: 33450,
        recordingWindow: "14/05 10:15 → 15/05 04:00 (17.75h)",
        emissionFactorLabel: "2.144 kgCO₂e/L (Certified B20 Biofuel)",
        scopeType: "SCOPE_1",
        co2eMetricTons: 4.40,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 220,
        chartYUnit: "Biofuel Flow (L/h)",
        description: "Finalized B20 biofuel consumption record for TRK-2104 yard tractors operating strictly between Berth B1 and Bay A1, plus single tug assist.",
        telemetry: [
          { time: "10:15", hour: 0, primaryVal: 165, secondaryVal: 4.4, tertiaryVal: 36, quaternaryVal: 1550, cumulativeTotal: 165, statusText: "Berth B1 Tug Assist + TRK-2104 Loop Start" },
          { time: "16:00", hour: 6, primaryVal: 115, secondaryVal: 4.2, tertiaryVal: 37, quaternaryVal: 1480, cumulativeTotal: 855, statusText: "Steady Shuttle: Berth B1 ↔ Bay A1" },
          { time: "22:00", hour: 12, primaryVal: 105, secondaryVal: 4.1, tertiaryVal: 35, quaternaryVal: 1420, cumulativeTotal: 1485, statusText: "Night Export Loading to Berth B1" },
          { time: "04:00", hour: 17.75, primaryVal: 140, secondaryVal: 4.3, tertiaryVal: 36, quaternaryVal: 1500, cumulativeTotal: 2050, statusText: "Unberthing Completed & Meter Sealed" },
        ],
        historicalCalls: [
          { voyage: "104S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0904", date: "15 May 2026", teuHandled: 1200, totalQuantity: 2050, unit: "Liters", intensityPerTeu: 1.71, intensityLabel: "1.71 L/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1 ↔ Bay A1" },
          { voyage: "101S", vesselName: "MV TAN CANG GLORY", invoiceNumber: "GPORT-INV-2026-0861", date: "28 Apr 2026", teuHandled: 1150, totalQuantity: 1965, unit: "Liters", intensityPerTeu: 1.71, intensityLabel: "1.71 L/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1 ↔ Bay A1" },
        ],
      },
    ],
  },

  // ============================================================================
  // UC-03: MV HAI AN TIME (Voyage 088S) — Berth B1 (Completed Domestic Feeder)
  // ============================================================================
  {
    useCaseId: "UC-03",
    vesselEntityId: "VSL-03",
    vesselName: "MV HAI AN TIME",
    voyageNumber: "088S",
    imoNumber: "9614288",
    carrier: "Hai An Transport (HATS)",
    berth: "Berth B1 (West Domestic Wharf)",
    arrivalWindow: "2026-05-12 13:30",
    departureWindow: "2026-05-13 01:00",
    hotelingHours: 11.5,
    teuHandled: 820,
    invoiceNumber: "GPORT-INV-2026-0903",
    portCallState: "COMPLETED_INVOICE",
    dcsaHash: "0x7d2a9f4c1e8b3a6d0f5c2e9b4a1d7f3e8c0b5a2d",
    totalElectricityKwh: 5670,
    totalFuelLiters: 2560,
    totalScope1Tons: 6.86,
    totalScope2Tons: 4.09,
    meters: [
      {
        id: "MTR-STS-B1-02",
        linkedEntityId: "STS-04",
        name: "Berth B1 Feeder Quay Cranes (STS-B1-01/02)",
        category: "STS_CRANE",
        medium: "ELECTRICITY",
        location: "Berth B1 West Wharf",
        protocol: "Modbus TCP/IP · Class 0.5S",
        serialNumber: "SCHNEIDER-PM8000-02",
        nominalRating: "3.3 kV · 1,600 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 4420,
        openingReading: 289680,
        closingReading: 294100,
        recordingWindow: "12/05 14:00 → 13/05 00:30 (10.5h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (EVN Grid)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 3.19,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 700,
        chartYUnit: "Crane Power (kW)",
        description: "Finalized crane electricity record for MV HAI AN TIME (088S) domestic container discharge/loading at Berth B1.",
        telemetry: [
          { time: "14:00", hour: 0, primaryVal: 380, secondaryVal: 3.30, tertiaryVal: 72, quaternaryVal: 0.94, cumulativeTotal: 380, statusText: "Voyage 088S Discharge Commenced" },
          { time: "18:00", hour: 4, primaryVal: 460, secondaryVal: 3.29, tertiaryVal: 88, quaternaryVal: 0.95, cumulativeTotal: 2220, statusText: "Peak Feeder Crane Cycle" },
          { time: "22:00", hour: 8, primaryVal: 420, secondaryVal: 3.30, tertiaryVal: 80, quaternaryVal: 0.95, cumulativeTotal: 3900, statusText: "Final Export Loading" },
          { time: "01:00", hour: 11.5, primaryVal: 180, secondaryVal: 3.31, tertiaryVal: 34, quaternaryVal: 0.93, cumulativeTotal: 4420, statusText: "Completed & Sealed" },
        ],
        historicalCalls: [
          { voyage: "088S", vesselName: "MV HAI AN TIME", invoiceNumber: "GPORT-INV-2026-0903", date: "13 May 2026", teuHandled: 820, totalQuantity: 4420, unit: "kWh", intensityPerTeu: 5.39, intensityLabel: "5.39 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1" },
          { voyage: "084S", vesselName: "MV HAI AN TIME", invoiceNumber: "GPORT-INV-2026-0831", date: "25 Apr 2026", teuHandled: 790, totalQuantity: 4260, unit: "kWh", intensityPerTeu: 5.39, intensityLabel: "5.39 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1" },
        ],
      },
      {
        id: "MTR-RF-A1-02",
        linkedEntityId: "BAY-A1",
        name: "Container Bay A1 Yard & Reefer Sub-Meter",
        category: "REEFER_YARD",
        medium: "ELECTRICITY",
        location: "Container Bay A1",
        protocol: "OPC-UA / Siemens PAC4200",
        serialNumber: "SIEMENS-PAC4200-A1",
        nominalRating: "400V 3P · 500 kW",
        primaryUnit: "kW",
        cumulativeUnit: "kWh",
        totalPeriodRecorded: 1250,
        openingReading: 86850,
        closingReading: 88100,
        recordingWindow: "12/05 13:30 → 13/05 01:00 (11.5h)",
        emissionFactorLabel: "0.7221 kgCO₂e/kWh (EVN Grid)",
        scopeType: "SCOPE_2",
        co2eMetricTons: 0.90,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 250,
        chartYUnit: "Bay A1 Load (kW)",
        description: "Finalized yard stacking and reefer sub-meter record for MV HAI AN TIME (088S) in Container Bay A1.",
        telemetry: [
          { time: "14:00", hour: 0, primaryVal: 110, secondaryVal: 0.40, tertiaryVal: 165, quaternaryVal: 0.96, cumulativeTotal: 110, statusText: "Bay A1 Domestic Stacking" },
          { time: "19:00", hour: 5, primaryVal: 125, secondaryVal: 0.40, tertiaryVal: 188, quaternaryVal: 0.97, cumulativeTotal: 735, statusText: "Steady Yard Handling" },
          { time: "01:00", hour: 11.5, primaryVal: 95, secondaryVal: 0.40, tertiaryVal: 142, quaternaryVal: 0.96, cumulativeTotal: 1250, statusText: "Voyage 088S Cut-off Sealed" },
        ],
        historicalCalls: [
          { voyage: "088S", vesselName: "MV HAI AN TIME", invoiceNumber: "GPORT-INV-2026-0903", date: "13 May 2026", teuHandled: 820, totalQuantity: 1250, unit: "kWh", intensityPerTeu: 1.52, intensityLabel: "1.52 kWh/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1 · Bay A1" },
        ],
      },
      {
        id: "MTR-FUEL-B1-03",
        linkedEntityId: "TRK-2104",
        name: "Berth B1 Tractor Fleet & Auxiliary Fuel Meter",
        category: "TRACTOR_FUEL",
        medium: "FUEL",
        location: "Berth B1 ↔ Bay A1",
        protocol: "CAN-Bus J1939 + Coriolis MRV",
        serialNumber: "OMNICOMM-B1-088S",
        nominalRating: "Marine MGO & Euro V Diesel",
        primaryUnit: "L/h",
        cumulativeUnit: "Liters",
        totalPeriodRecorded: 2560,
        openingReading: 28840,
        closingReading: 31400,
        recordingWindow: "12/05 13:30 → 13/05 01:00 (11.5h)",
        emissionFactorLabel: "2.680 kgCO₂e/L (ISO 14083 Diesel)",
        scopeType: "SCOPE_1",
        co2eMetricTons: 6.86,
        recordStatus: "COMPLETED_SEALED",
        chartYMax: 300,
        chartYUnit: "Fuel Flow (L/h)",
        description: "Finalized Scope 1 fuel meter record for MV HAI AN TIME (088S) auxiliary berth generator, tug assist, and Berth B1 ↔ Bay A1 tractors.",
        telemetry: [
          { time: "14:00", hour: 0, primaryVal: 240, secondaryVal: 4.5, tertiaryVal: 38, quaternaryVal: 1580, cumulativeTotal: 240, statusText: "Berthing Assist + Aux Gen Active" },
          { time: "19:00", hour: 5, primaryVal: 215, secondaryVal: 4.3, tertiaryVal: 39, quaternaryVal: 1520, cumulativeTotal: 1315, statusText: "Berth B1 ↔ Bay A1 Shuttle" },
          { time: "01:00", hour: 11.5, primaryVal: 210, secondaryVal: 4.4, tertiaryVal: 38, quaternaryVal: 1540, cumulativeTotal: 2560, statusText: "Unberthing Completed & Meter Sealed" },
        ],
        historicalCalls: [
          { voyage: "088S", vesselName: "MV HAI AN TIME", invoiceNumber: "GPORT-INV-2026-0903", date: "13 May 2026", teuHandled: 820, totalQuantity: 2560, unit: "Liters", intensityPerTeu: 3.12, intensityLabel: "3.12 L/TEU", status: "COMPLETED_INVOICED", berth: "Berth B1 ↔ Bay A1" },
        ],
      },
    ],
  },
];

/**
 * Align the illustrative meter data with the Module 2 ledger (single source):
 * call totals, window, berth, TEU, record number and SHA-256 come from the
 * ledger; meter readings are scaled so electricity and fuel meters add up to
 * the ledger quantities; factors come from the versioned library.
 */
function alignWithLedger(group: PortCallMeterGroup): PortCallMeterGroup {
  const name = group.vesselName.replace(/^MV\s+/i, "").toUpperCase();
  const rec = CALL_RECORDS.find((r) => r.vessel.toUpperCase() === name);
  if (!rec) {
    // not one of the 12 ledger calls: keep its readings, but apply the library factors
    const g = activeFactor("GRID");
    const dsl = activeFactor("DIESEL");
    const eff = ENERGY_BALANCE.effectiveGridEf;
    const meters = group.meters.map((m) => {
      if (m.scopeType === "ZERO_CARBON_OFFSET") return m;
      const isFuel = m.medium === "FUEL";
      return {
        ...m,
        emissionFactorLabel: isFuel ? `${dsl.value} ${dsl.unit} (${dsl.id})` : `${g.value} ${g.unit} (${g.id})`,
        co2eMetricTons: Math.round(((m.totalPeriodRecorded * (isFuel ? dsl.value : eff)) / 1000) * 100) / 100,
      };
    });
    return {
      ...group,
      totalScope1Tons: Math.round(((group.totalFuelLiters * dsl.value) / 1000) * 100) / 100,
      totalScope2Tons: Math.round(((group.totalElectricityKwh * eff) / 1000) * 100) / 100,
      meters,
    };
  }
  const elecMeters = group.meters.filter((m) => m.medium !== "FUEL" && m.scopeType !== "ZERO_CARBON_OFFSET");
  const fuelMeters = group.meters.filter((m) => m.medium === "FUEL");
  const elecSum = elecMeters.reduce((a, m) => a + m.totalPeriodRecorded, 0) || 1;
  const fuelSum = fuelMeters.reduce((a, m) => a + m.totalPeriodRecorded, 0) || 1;
  const grid = activeFactor("GRID");
  const diesel = activeFactor("DIESEL");
  const effEf = ENERGY_BALANCE.effectiveGridEf;
  const window = `${stamp(rec.etaMin)} → ${stamp(rec.etdMin)} (${rec.berthHours.toFixed(1)}h)`;
  const meters = group.meters.map((m) => {
    if (m.scopeType === "ZERO_CARBON_OFFSET") return { ...m, recordingWindow: window };
    const isFuel = m.medium === "FUEL";
    const k = isFuel ? rec.fuelL / fuelSum : rec.electricityKwh / elecSum;
    const total = Math.round(m.totalPeriodRecorded * k);
    return {
      ...m,
      totalPeriodRecorded: total,
      closingReading: m.openingReading + total,
      recordingWindow: window,
      emissionFactorLabel: isFuel
        ? `${diesel.value} ${diesel.unit} (${diesel.id})`
        : `${grid.value} ${grid.unit} (${grid.id}) × ${(ENERGY_BALANCE.gridShare * 100).toFixed(1)}% ${"grid"}`,
      co2eMetricTons: Math.round(((total * (isFuel ? diesel.value : effEf)) / 1000) * 100) / 100,
      telemetry: m.telemetry.map((p) => ({ ...p, primaryVal: Math.round(p.primaryVal * k * 10) / 10, cumulativeTotal: Math.round(p.cumulativeTotal * k) })),
    };
  });
  return {
    ...group,
    vesselName: rec.vessel,
    voyageNumber: rec.voyage,
    imoNumber: rec.imo,
    carrier: rec.carrier,
    berth: `Berth ${rec.berth} · Cat Lai`,
    arrivalWindow: stamp(rec.etaMin),
    departureWindow: stamp(rec.etdMin),
    hotelingHours: Math.round(rec.berthHours * 10) / 10,
    teuHandled: rec.teu,
    invoiceNumber: rec.recordNo,
    portCallState: rec.complete ? "COMPLETED_INVOICE" : "LIVE_MONITORING",
    dcsaHash: rec.hash,
    totalElectricityKwh: Math.round(rec.electricityKwh),
    totalFuelLiters: Math.round(rec.fuelL),
    totalScope1Tons: Math.round(rec.scope1Kg / 10) / 100,
    totalScope2Tons: Math.round(rec.scope2Kg / 10) / 100,
    meters,
  };
}

export const PORT_CALL_METERS: PortCallMeterGroup[] = RAW_PORT_CALL_METERS.map(alignWithLedger);

// Helper to resolve which PortCallMeterGroup & specific meter match a given assetId / invoiceId / entityId
export function resolvePortCallFromIdentifier(identifier?: string | null): {
  portCallId: string;
  matchedMeterId: string | null;
  inferredMode: MeterModalMode;
} {
  if (!identifier) {
    return { portCallId: "UC-01", matchedMeterId: null, inferredMode: "LIVE_MONITORING" };
  }
  const norm = identifier.toUpperCase();

  // Check direct Invoice Number or UseCase ID
  for (const call of PORT_CALL_METERS) {
    if (
      norm === call.useCaseId.toUpperCase() ||
      norm === call.invoiceNumber.toUpperCase() ||
      norm.includes(call.invoiceNumber.toUpperCase()) ||
      norm.includes(call.voyageNumber.toUpperCase())
    ) {
      return {
        portCallId: call.useCaseId,
        matchedMeterId: null,
        inferredMode: call.portCallState,
      };
    }
  }

  // Check 3D/2D entity IDs from Telemetry Feeds
  if (norm === "VSL-01" || norm.includes("MUMBAI")) {
    return { portCallId: "UC-01", matchedMeterId: null, inferredMode: "LIVE_MONITORING" };
  }
  if (norm === "STS-01" || norm === "STS-02") {
    return { portCallId: "UC-01", matchedMeterId: "MTR-STS-B2-04", inferredMode: "LIVE_MONITORING" };
  }
  if (norm === "TRK-2481" || norm === "TRK-2205" || norm === "TRK-3105") {
    return { portCallId: "UC-01", matchedMeterId: "MTR-TRK-088", inferredMode: "LIVE_MONITORING" };
  }
  if (norm === "BAY-B2" || norm === "BAY-B1" || norm === "BAY-C1") {
    return { portCallId: "UC-01", matchedMeterId: "MTR-RF-Y3-02", inferredMode: "LIVE_MONITORING" };
  }

  if (norm === "VSL-02" || norm.includes("APUS")) {
    return { portCallId: "UC-02", matchedMeterId: null, inferredMode: "LIVE_MONITORING" };
  }
  if (norm === "STS-03") {
    return { portCallId: "UC-02", matchedMeterId: "MTR-STS-B3-03", inferredMode: "LIVE_MONITORING" };
  }
  if (norm === "TRK-2319" || norm === "TRK-4018") {
    return { portCallId: "UC-02", matchedMeterId: "MTR-TRK-B3-01", inferredMode: "LIVE_MONITORING" };
  }
  if (norm === "BAY-R1") {
    return { portCallId: "UC-02", matchedMeterId: "MTR-RF-R1-01", inferredMode: "LIVE_MONITORING" };
  }

  if (norm === "VSL-03" || norm.includes("GLORY")) {
    return { portCallId: "UC-04", matchedMeterId: null, inferredMode: "COMPLETED_INVOICE" };
  }
  if (norm === "STS-04") {
    return { portCallId: "UC-04", matchedMeterId: "MTR-STS-B1-04", inferredMode: "COMPLETED_INVOICE" };
  }
  if (norm === "TRK-2104" || norm === "TRK-1092") {
    return { portCallId: "UC-04", matchedMeterId: "MTR-BIO-B1-01", inferredMode: "COMPLETED_INVOICE" };
  }
  if (norm === "BAY-A1") {
    return { portCallId: "UC-04", matchedMeterId: "MTR-BAY-A1-01", inferredMode: "COMPLETED_INVOICE" };
  }

  if (norm.includes("HAI AN") || norm.includes("088S")) {
    return { portCallId: "UC-03", matchedMeterId: null, inferredMode: "COMPLETED_INVOICE" };
  }

  return { portCallId: "UC-01", matchedMeterId: null, inferredMode: "LIVE_MONITORING" };
}

interface MeterTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssetId?: string | null;
  initialMode?: MeterModalMode;
  onOpenCarbonInvoice?: (invoiceNumber: string, useCaseId: string) => void;
  onTraceVoyageInTelemetry?: (vesselEntityId: string, voyageNumber: string) => void;
}

export const MeterTelemetryModal: React.FC<MeterTelemetryModalProps> = ({
  isOpen,
  onClose,
  initialAssetId,
  initialMode,
  onOpenCarbonInvoice,
  onTraceVoyageInTelemetry,
}) => {
  const { t } = useLanguage();
  const [selectedPortCallId, setSelectedPortCallId] = useState<string>("UC-01");
  const [viewMode, setViewMode] = useState<MeterModalMode>("LIVE_MONITORING");
  const [inDepthMeterId, setInDepthMeterId] = useState<string | null>(null);
  const [highlightedMeterId, setHighlightedMeterId] = useState<string | null>(null);
  const [scrubIndex, setScrubIndex] = useState<number>(3);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const resolved = resolvePortCallFromIdentifier(initialAssetId);
    setSelectedPortCallId(resolved.portCallId);
    setHighlightedMeterId(resolved.matchedMeterId);
    setViewMode(initialMode || resolved.inferredMode);
    // Always start on the clean overview grid unless a specific single meter was requested
    setInDepthMeterId(null);
    setScrubIndex(3);
  }, [isOpen, initialAssetId, initialMode]);

  const currentPortCall = useMemo(() => {
    return (
      PORT_CALL_METERS.find((p) => p.useCaseId === selectedPortCallId) ||
      PORT_CALL_METERS[0]
    );
  }, [selectedPortCallId]);

  const inDepthMeter = useMemo(() => {
    if (!inDepthMeterId) return null;
    return currentPortCall.meters.find((m) => m.id === inDepthMeterId) || null;
  }, [currentPortCall, inDepthMeterId]);

  if (!isOpen) return null;

  const isCompletedMode = viewMode === "COMPLETED_INVOICE";

  // SVG dimensions for In-Depth Curve
  const svgWidth = 640;
  const svgHeight = 165;
  const padLeft = 44;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 26;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div
        className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] my-auto relative"
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* ================================================================== */}
        {/* 1. CLEAN TOP HEADER WITH CLEAR STATE DISTINCTION (LIVE vs COMPLETED) */}
        {/* ================================================================== */}
        <div
          className={`px-5 py-3.5 text-white flex items-center justify-between gap-3 shrink-0 select-none ${
            isCompletedMode ? "bg-brand-hover" : "bg-slate-900"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {inDepthMeter ? (
              <button
                type="button"
                onClick={() => setInDepthMeterId(null)}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("All voyage meters", "Tất cả đồng hồ chuyến tàu")}</span>
              </button>
            ) : (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                  isCompletedMode
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-sky-500/20 text-sky-300 border-sky-400/30"
                }`}
              >
                {isCompletedMode ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Gauge className="w-5 h-5" />
                )}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {isCompletedMode ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {t("Completed invoice meter records", "Hồ sơ đồng hồ đã chốt hóa đơn")}
                    </span>
                    <span className="text-xs font-mono text-white/75">
                      #{currentPortCall.invoiceNumber}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-mono text-white/75">
                    {currentPortCall.berth} · {t("Voyage", "Chuyến")} {currentPortCall.voyageNumber}
                  </span>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-black tracking-tight truncate mt-0.5">
                {inDepthMeter
                  ? `${inDepthMeter.name} (${inDepthMeter.id})`
                  : `${currentPortCall.vesselName} · ${t("Voyage", "Chuyến")} ${currentPortCall.voyageNumber}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
              title={t("Close", "Đóng")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-5 py-2 text-xs font-bold flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white underline cursor-pointer"
            >
              {t("Dismiss", "Đóng")}
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* 2. VOYAGE SELECTOR & SYNCHRONIZED SUMMARY BAR */}
        {/* ================================================================== */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shrink-0">
          {isCompletedMode ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
              <span className="font-bold text-slate-900">
                {currentPortCall.berth}
              </span>
              <span className="text-slate-300">·</span>
              <span>
                {t("Recorded window:", "Thời gian đo Đếm:")}{" "}
                <strong className="font-mono text-slate-900">
                  {currentPortCall.arrivalWindow} → {currentPortCall.departureWindow}
                </strong>{" "}
                ({currentPortCall.hotelingHours}h)
              </span>
              <span className="text-slate-300">·</span>
              <span>
                {t("Volume:", "Sản lượng:")}{" "}
                <strong className="font-mono text-slate-900">
                  {currentPortCall.teuHandled.toLocaleString()} TEU
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1">
                {t("Terminal vessel:", "Tàu tại cảng:")}
              </span>
              {PORT_CALL_METERS.filter((c) => c.useCaseId !== "UC-03").map(
                (call) => {
                  const isSelected =
                    call.useCaseId === currentPortCall.useCaseId;
                  return (
                    <button
                      key={call.useCaseId}
                      type="button"
                      onClick={() => {
                        setSelectedPortCallId(call.useCaseId);
                        setInDepthMeterId(null);
                        setHighlightedMeterId(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-brand-hover text-white border-brand-hover shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Ship className="w-3 h-3 shrink-0" />
                      <span>
                        {call.vesselName.replace("MV ", "")} ({call.voyageNumber})
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* Certified Totals for this Port Call */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>{t("Scope 2 elec:", "Điện Scope 2:")}</span>
              <strong className="font-mono">
                {currentPortCall.totalElectricityKwh.toLocaleString()} kWh (
                {currentPortCall.totalScope2Tons.toFixed(2)} tCO₂e)
              </strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-600" />
              <span>{t("Scope 1 fuel:", "Nhiên liệu Scope 1:")}</span>
              <strong className="font-mono">
                {currentPortCall.totalFuelLiters.toLocaleString()} L (
                {currentPortCall.totalScope1Tons.toFixed(2)} tCO₂e)
              </strong>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. MAIN CONTENT: EITHER METER OVERVIEW GRID OR IN-DEPTH SINGLE METER */}
        {/* ================================================================== */}
        {!inDepthMeter ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {/* Contextual Banner */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCompletedMode
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-sky-50/70 border-sky-200"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {isCompletedMode ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <Activity className="w-4 h-4 text-sky-700 shrink-0" />
                  )}
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    {isCompletedMode
                      ? t(`Completed & Sealed Meters for Carbon Invoice #${currentPortCall.invoiceNumber}`, `Danh Sách Đồng Hồ Đã Chốt Cho Hóa Đơn Carbon #${currentPortCall.invoiceNumber}`)
                      : t(`SCADA & Fuel Sub-Meters Serving ${currentPortCall.vesselName} (${currentPortCall.voyageNumber})`, `Hệ Thống Đồng Hồ Đo Đếm SCADA & Nhiên Liệu Phục Vụ Tàu ${currentPortCall.vesselName} (${currentPortCall.voyageNumber})`)}
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  {isCompletedMode
                    ? t(`Showing the ${currentPortCall.meters.length} completed meters recorded during ${currentPortCall.arrivalWindow} → ${currentPortCall.departureWindow} (${currentPortCall.hotelingHours}h · ${currentPortCall.teuHandled.toLocaleString()} TEU). Click any meter for full recording audit & voyage history.`, `Hiển thị ${currentPortCall.meters.length} đồng hồ đã chốt chỉ số trong khung giờ ${currentPortCall.arrivalWindow} → ${currentPortCall.departureWindow} (${currentPortCall.hotelingHours}h · ${currentPortCall.teuHandled.toLocaleString()} TEU). Bấm vào từng đồng hồ để xem chi tiết chỉ số và lịch sử chuyến tàu.`)
                    : t(`Real-time power & fuel telemetry at ${currentPortCall.berth}. Click any sub-meter card below to inspect its interval curve and compare past voyages for this vessel.`, `Đo đếm điện năng & nhiên liệu thời gian thực tại ${currentPortCall.berth}. Bấm vào thẻ đồng hồ bên dưới để xem đồ thị phụ tải và đối chiếu các chuyến tàu trước.`)}
                </p>
              </div>
            </div>

            {/* Clean 2-Column Grid of Scoped Meters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPortCall.meters.map((meter) => {
                const isElec = meter.medium === "ELECTRICITY";
                const isFl = meter.medium === "FUEL";
                const isRf = meter.medium === "REEFER_THERMAL";
                const isHighlighted = highlightedMeterId === meter.id;

                const themeClr = isElec
                  ? "#0284C7"
                  : isFl
                  ? "#D97706"
                  : isRf
                  ? "#0D9488"
                  : "#8B5CF6";
                const badgeBg = isElec
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : isFl
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-teal-50 text-teal-800 border-teal-200";

                const latestPt =
                  meter.telemetry[meter.telemetry.length - 1] ||
                  meter.telemetry[0];
                const activeLivePt =
                  meter.telemetry[Math.min(2, meter.telemetry.length - 1)] ||
                  meter.telemetry[0];

                return (
                  <div
                    key={meter.id}
                    onClick={() => {
                      setInDepthMeterId(meter.id);
                      setScrubIndex(Math.min(2, meter.telemetry.length - 1));
                    }}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3.5 cursor-pointer group ${
                      isHighlighted
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                        : "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {/* Top Row: Category Badge, Meter ID, Status Pill */}
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-bold border ${badgeBg}`}
                            >
                              {meter.category.replace("_", " ")}
                            </span>
                            <span className="text-xs font-mono text-slate-400 font-bold">
                              {meter.id}
                            </span>
                            {isHighlighted && (
                              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-bold">
                                Selected Equipment
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-slate-900 text-sm group-hover:text-brand-hover transition-colors leading-snug">
                            {meter.name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {meter.location} · {meter.protocol}
                          </p>
                        </div>

                        {/* Primary Figure: Either Live Reading or Completed Recorded Total */}
                        <div className="text-right shrink-0">
                          {isCompletedMode ? (
                            <>
                              <span className="text-xs font-bold text-emerald-700 block">
                                Certified Total
                              </span>
                              <strong className="text-base font-black font-mono text-slate-900">
                                {meter.totalPeriodRecorded.toLocaleString()}{" "}
                                <span className="text-xs font-semibold text-slate-500">
                                  {meter.cumulativeUnit === "kWh" ? "kWh" : "L"}
                                </span>
                              </strong>
                              <span className="text-xs font-mono font-bold text-emerald-700 block">
                                {meter.co2eMetricTons.toFixed(2)} tCO₂e
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-sky-700 block">
                                Live Load
                              </span>
                              <strong className="text-base font-black font-mono text-slate-900">
                                {activeLivePt.primaryVal.toLocaleString()}{" "}
                                <span className="text-xs font-semibold text-slate-500">
                                  {meter.primaryUnit}
                                </span>
                              </strong>
                              <span className="text-xs font-mono text-slate-500 block">
                                Acc:{" "}
                                {meter.totalPeriodRecorded.toLocaleString()}{" "}
                                {meter.cumulativeUnit === "kWh" ? "kWh" : "L"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Recording Audit Box (Distinct for Completed Invoice vs Live Monitoring) */}
                      {isCompletedMode ? (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-xs font-bold block">
                              Meter Index (Start → End):
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              {meter.openingReading.toLocaleString()} →{" "}
                              {meter.closingReading.toLocaleString()}{" "}
                              {meter.cumulativeUnit === "kWh" ? "kWh" : "L"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-xs font-bold block">
                              Recorded Window:
                            </span>
                            <span className="font-mono font-semibold text-slate-700 truncate block">
                              {meter.recordingWindow}
                            </span>
                          </div>
                          <div className="col-span-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                            <span className="text-slate-500 text-xs">
                              EF: {meter.emissionFactorLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              {t("SHA-256 locked", "Đã khóa SHA-256")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 text-xs font-bold block">
                              Current Operational State:
                            </span>
                            <span className="font-bold text-slate-800">
                              {activeLivePt.statusText}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-slate-400 text-xs font-bold block">
                              Peak / Rating:
                            </span>
                            <span className="font-mono font-semibold text-slate-700">
                              {meter.nominalRating}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Action inside Card */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: themeClr }}
                        />
                        {meter.historicalCalls.length} {t("related voyages for", "chuyến tàu liên quan của")}{" "}
                        {currentPortCall.vesselName.replace("MV ", "")}
                      </span>

                      <span className="font-bold text-brand-hover group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>{t("Inspect In-Depth", "Xem chi tiết")}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================== */
          /* 4. IN-DEPTH SINGLE METER & RELATED VOYAGES VIEW (INSIDE SAME MODAL) */
          /* ================================================================== */
          (() => {
            const isElec = inDepthMeter.medium === "ELECTRICITY";
            const isFl = inDepthMeter.medium === "FUEL";
            const isRf = inDepthMeter.medium === "REEFER_THERMAL";

            const themeColor = isElec
              ? "#0284C7"
              : isFl
              ? "#D97706"
              : isRf
              ? "#0D9488"
              : "#8B5CF6";
            const gradStart = isElec
              ? "#38BDF8"
              : isFl
              ? "#FBBF24"
              : isRf
              ? "#2DD4BF"
              : "#A78BFA";

            const pts = inDepthMeter.telemetry;
            const minHour = pts[0]?.hour || 0;
            const maxHour = pts[pts.length - 1]?.hour || 24;
            const hourSpan = Math.max(1, maxHour - minHour);
            const maxY = inDepthMeter.chartYMax;

            const coordinates = pts.map((p) => {
              const x = padLeft + ((p.hour - minHour) / hourSpan) * plotW;
              const y =
                padTop +
                plotH -
                (Math.min(p.primaryVal, maxY) / maxY) * plotH;
              return { x, y, point: p };
            });

            const polylineStr = coordinates
              .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
              .join(" ");
            const firstPt = coordinates[0] || {
              x: padLeft,
              y: padTop + plotH,
            };
            const lastPt = coordinates[coordinates.length - 1] || {
              x: padLeft + plotW,
              y: padTop + plotH,
            };
            const polygonStr = `${firstPt.x.toFixed(1)},${(
              padTop + plotH
            ).toFixed(1)} ${polylineStr} ${lastPt.x.toFixed(1)},${(
              padTop + plotH
            ).toFixed(1)}`;

            const safeIdx = Math.min(Math.max(0, scrubIndex), pts.length - 1);
            const currentPt = pts[safeIdx] || pts[0];
            const activeCoord = coordinates[safeIdx] || firstPt;

            return (
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {/* SECTION A: HOW THIS METER WAS RECORDED (AUDIT & HARDWARE RECORD) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {inDepthMeter.id}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          SN: {inDepthMeter.serialNumber} · {inDepthMeter.protocol}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 mt-1">
                        {inDepthMeter.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {inDepthMeter.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                          isCompletedMode
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-sky-50 text-sky-800 border-sky-200"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isCompletedMode
                            ? "Sealed for Carbon Invoice"
                            : "Live Telemetry Active"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 4 Audit Metrics explaining exact recording */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-400 block">
                        Meter Index Register
                      </span>
                      <strong className="font-mono text-slate-900 text-xs sm:text-sm block mt-0.5">
                        {inDepthMeter.openingReading.toLocaleString()} →{" "}
                        {inDepthMeter.closingReading.toLocaleString()}
                      </strong>
                      <span className="text-xs text-slate-500">
                        Opening → Closing ({inDepthMeter.cumulativeUnit})
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-400 block">
                        Net Voyage Recorded
                      </span>
                      <strong className="font-mono text-slate-900 text-sm block mt-0.5">
                        {inDepthMeter.totalPeriodRecorded.toLocaleString()}{" "}
                        {inDepthMeter.cumulativeUnit}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {inDepthMeter.recordingWindow}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-400 block">
                        Carbon Accounting
                      </span>
                      <strong className="font-mono text-emerald-700 text-sm block mt-0.5">
                        {inDepthMeter.co2eMetricTons.toFixed(2)} tCO₂e
                      </strong>
                      <span className="text-xs text-slate-500 truncate block">
                        {inDepthMeter.emissionFactorLabel}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-400 block">
                        Voyage Intensity
                      </span>
                      <strong className="font-mono text-slate-900 text-sm block mt-0.5">
                        {(
                          inDepthMeter.totalPeriodRecorded /
                          Math.max(1, currentPortCall.teuHandled)
                        ).toFixed(2)}{" "}
                        {inDepthMeter.cumulativeUnit === "kWh"
                          ? "kWh/TEU"
                          : "L/TEU"}
                      </strong>
                      <span className="text-xs text-slate-500">
                        Across {currentPortCall.teuHandled.toLocaleString()} TEU
                        handled
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION B: INTERACTIVE TIME-SERIES CURVE FOR THIS VOYAGE */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-brand-hover" />
                      <span className="font-extrabold text-slate-900 text-xs">
                        Voyage {currentPortCall.voyageNumber} Interval Telemetry
                        Profile ({inDepthMeter.chartYUnit})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: themeColor }}
                        />
                        <strong className="text-slate-800">
                          {inDepthMeter.primaryUnit} Profile
                        </strong>
                      </span>
                      <span>·</span>
                      <span>{currentPortCall.berth}</span>
                    </div>
                  </div>

                  {/* SVG Curve */}
                  <div className="w-full select-none relative">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-auto overflow-visible"
                    >
                      <defs>
                        <linearGradient
                          id={`meterGrad-${inDepthMeter.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={gradStart}
                            stopOpacity="0.65"
                          />
                          <stop
                            offset="100%"
                            stopColor={themeColor}
                            stopOpacity="0.08"
                          />
                        </linearGradient>
                      </defs>

                      {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                        const val = Math.round(maxY * ratio);
                        const y = padTop + plotH - ratio * plotH;
                        return (
                          <g key={ratio}>
                            <line
                              x1={padLeft}
                              y1={y}
                              x2={padLeft + plotW}
                              y2={y}
                              stroke="#E2E8F0"
                              strokeWidth="1"
                              strokeDasharray={ratio === 0 ? "0" : "2 2"}
                            />
                            <text
                              x={padLeft - 6}
                              y={y + 3.5}
                              textAnchor="end"
                              fontSize="9"
                              fill="#64748B"
                              fontWeight="600"
                              className="font-mono"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      <polygon
                        points={polygonStr}
                        fill={`url(#meterGrad-${inDepthMeter.id})`}
                      />
                      <polyline
                        points={polylineStr}
                        fill="none"
                        stroke={themeColor}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />

                      {coordinates.map((c, i) => (
                        <circle
                          key={i}
                          cx={c.x}
                          cy={c.y}
                          r={i === safeIdx ? "5" : "3"}
                          fill={i === safeIdx ? "#FFFFFF" : themeColor}
                          stroke={i === safeIdx ? themeColor : "#FFFFFF"}
                          strokeWidth="2"
                          className="cursor-pointer transition-all"
                          onClick={() => setScrubIndex(i)}
                        />
                      ))}

                      <line
                        x1={activeCoord.x}
                        y1={padTop}
                        x2={activeCoord.x}
                        y2={padTop + plotH}
                        stroke="#0F172A"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />

                      <g
                        transform={`translate(${Math.min(
                          activeCoord.x,
                          padLeft + plotW - 75
                        )}, ${Math.max(padTop + 10, activeCoord.y - 25)})`}
                      >
                        <rect
                          x="-38"
                          y="-12"
                          width="76"
                          height="20"
                          rx="6"
                          fill="#0F172A"
                        />
                        <text
                          x="0"
                          y="1.5"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#FFFFFF"
                          fontWeight="bold"
                          className="font-mono"
                        >
                          {currentPt.primaryVal} {inDepthMeter.primaryUnit}
                        </text>
                      </g>

                      {coordinates.map((c, i) => (
                        <text
                          key={i}
                          x={c.x}
                          y={padTop + plotH + 16}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#64748B"
                          fontWeight="600"
                          className="font-mono"
                        >
                          {c.point.time}
                        </text>
                      ))}
                    </svg>
                  </div>

                  {/* Scrubber Bar */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Timestamp:{" "}
                        <strong className="text-slate-900 font-mono">
                          {currentPt.time}
                        </strong>{" "}
                        ·{" "}
                        <span className="text-slate-700 font-bold">
                          {currentPt.statusText}
                        </span>
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Cumulative: {currentPt.cumulativeTotal.toLocaleString()}{" "}
                        {inDepthMeter.cumulativeUnit}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={pts.length - 1}
                      value={safeIdx}
                      onChange={(e) => setScrubIndex(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-hover"
                    />
                  </div>

                  {/* 4 Physical Readouts at Scrubbed Interval */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90">
                      <span className="text-slate-400 block text-xs font-bold">
                        {isElec
                          ? "Active Load (P):"
                          : isFl
                          ? "Fuel Flow Rate:"
                          : "Cooling Demand:"}
                      </span>
                      <strong className="text-base font-black text-slate-900 font-mono">
                        {currentPt.primaryVal} {inDepthMeter.primaryUnit}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90">
                      <span className="text-slate-400 block text-xs font-bold">
                        {isElec
                          ? "Bus Voltage:"
                          : isFl
                          ? "Line Pressure:"
                          : "Core Temp:"}
                      </span>
                      <strong className="text-base font-black text-slate-900 font-mono">
                        {currentPt.secondaryVal}{" "}
                        {isElec ? "kV" : isFl ? "bar" : "°C"}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90">
                      <span className="text-slate-400 block text-xs font-bold">
                        {isElec
                          ? "Phase Current (I):"
                          : isFl
                          ? "Fuel Temp:"
                          : "Active Plugs:"}
                      </span>
                      <strong className="text-base font-black text-slate-900 font-mono">
                        {currentPt.tertiaryVal}{" "}
                        {isElec ? "Amps" : isFl ? "°C" : "Plugs"}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90">
                      <span className="text-slate-400 block text-xs font-bold">
                        {isElec
                          ? "Power Factor:"
                          : isFl
                          ? "Engine Speed:"
                          : "Excursions:"}
                      </span>
                      <strong className="text-base font-black text-emerald-700 font-mono">
                        {currentPt.quaternaryVal}{" "}
                        {isElec ? "cos φ" : isFl ? "RPM" : "Alerts"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* SECTION C: RELATED VOYAGES FOR THIS EXACT VESSEL / EQUIPMENT ONLY */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-brand-hover" />
                      <span className="font-extrabold text-slate-900 text-xs">
                        Related Voyages for {currentPortCall.vesselName} on This
                        Meter ({inDepthMeter.id})
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Strictly scoped to {currentPortCall.vesselName} ·{" "}
                      {currentPortCall.berth}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {inDepthMeter.historicalCalls.map((hist) => {
                      const isCurrentVoyage =
                        hist.voyage === currentPortCall.voyageNumber;
                      return (
                        <div
                          key={hist.voyage}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isCurrentVoyage
                              ? "bg-blue-50/70 border-blue-300"
                              : "bg-slate-50/70 border-slate-200"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-xs text-slate-900">
                                {hist.vesselName} · Voyage {hist.voyage}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  hist.status === "LIVE_ACTIVE"
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {hist.status === "LIVE_ACTIVE"
                                  ? "In Progress (Live)"
                                  : "Completed & Invoiced"}
                              </span>
                              <span className="text-xs font-mono text-slate-500">
                                #{hist.invoiceNumber}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {hist.date} · {hist.berth} ·{" "}
                              {hist.teuHandled.toLocaleString()} TEU Handled
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-black font-mono text-slate-900">
                                {hist.totalQuantity.toLocaleString()}{" "}
                                {hist.unit}
                              </div>
                              <div className="text-xs font-mono text-slate-500">
                                Intensity: {hist.intensityLabel}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* ================================================================== */}
        {/* 5. MODAL FOOTER */}
        {/* ================================================================== */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              SHA-256:{" "}
              <code className="font-code text-xs text-slate-800">
                {currentPortCall.dcsaHash.slice(0, 22)}...
              </code>{" "}
              · {t("GLEC · ISO 14083 method", "Phương pháp GLEC · ISO 14083")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setToastMessage(
                  t(
                    `Exported meter log for ${currentPortCall.vesselName} (${currentPortCall.voyageNumber}) to CSV.`,
                    `Đã xuất dữ liệu đồng hồ của tàu ${currentPortCall.vesselName} (${currentPortCall.voyageNumber}) ra CSV.`
                  )
                );
                setTimeout(() => setToastMessage(null), 3500);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("Export CSV", "Xuất CSV")}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-brand-hover hover:bg-[#002047] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {t("Done", "Hoàn tất")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
