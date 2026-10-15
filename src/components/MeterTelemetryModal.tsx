import React, { useState, useMemo } from "react";
import { 
  X, 
  Calendar, 
  ChevronDown, 
  Search, 
  Fuel, 
  Zap, 
  Clock, 
  Gauge, 
  MapPin, 
  Activity, 
  Download, 
  CheckCircle2, 
  RotateCcw,
  Ship,
  Thermometer,
  BatteryCharging,
  Layers,
  BarChart3,
  TrendingUp,
  FileText,
  Sliders
} from "lucide-react";

// ============================================================================
// TYPES FOR MULTI-METER TELEMETRY SYSTEM
// ============================================================================
export type MeterCategory = 
  | "ELECTRICITY_OPS" 
  | "ELECTRICITY_STS" 
  | "ELECTRICITY_REEFER" 
  | "FUEL_TUGBOAT" 
  | "FUEL_TRACTOR" 
  | "STORAGE_BESS";

export type PhysicalMedium = "ELECTRICITY" | "FUEL" | "REEFER_THERMAL" | "BATTERY";

export interface TelemetryPoint {
  time: string;
  hour: number; // 0 to 24 (or hoteling duration)
  primaryVal: number; // kW for elec, L/h for fuel, kW for reefer/battery
  secondaryVal?: number; // kV for elec, bar for fuel, °C for reefer, SOC % for battery
  tertiaryVal?: number; // Amps for elec, Temp °C for fuel, Plugs count for reefer, Cell Temp °C for battery
  quaternaryVal?: number; // cos φ for elec, RPM for fuel, Excursions for reefer, SOH % for battery
  statusText: string;
  locationNote: string;
}

export interface HistoricalCallRecord {
  voyage: string;
  date: string;
  totalQuantity: number;
  unit: string;
  teuHandled: number;
  intensityLabel: string;
  verified: boolean;
}

export interface MeterDevice {
  id: string;
  name: string;
  category: MeterCategory;
  medium: PhysicalMedium;
  primaryUnit: string; // "kW", "kWh", "L", "L/h", "%"
  chartYMax: number;
  chartYUnit: string;
  nominalRating: string;
  protocol: string;
  totalPeriodRecorded: number;
  totalPeriodUnit: string;
  description: string;
  telemetry: TelemetryPoint[];
  historicalCalls: HistoricalCallRecord[];
}

export interface PortCallMeterGroup {
  useCaseId: "UC-01" | "UC-02" | "UC-03" | "UC-04";
  invoiceNumber: string;
  vesselName: string;
  voyageNumber: string;
  imoNumber: string;
  carrierName: string;
  berth: string;
  hotelingHours: number;
  servicePackage: string;
  totalElectricityKwh: number;
  totalFuelLiters: number;
  meters: MeterDevice[];
}

// ============================================================================
// MULTI-METER DATABASE ACROSS 4 CORE OPERATIONAL PORT CALLS
// ============================================================================
export const PORT_CALL_METERS: PortCallMeterGroup[] = [
  // --------------------------------------------------------------------------
  // UC-01: SPIRIT OF MUMBAI (High-Density Reefer - Cat Lai B2)
  // --------------------------------------------------------------------------
  {
    useCaseId: "UC-01",
    invoiceNumber: "GPORT-INV-2026-0901",
    vesselName: "SPIRIT OF MUMBAI",
    voyageNumber: "056N",
    imoNumber: "9845210",
    carrierName: "Ocean Network Express (ONE) / Tan Cang Shipping",
    berth: "Cat Lai Terminal - Berth B2 (OPS Ready)",
    hotelingHours: 34.75,
    servicePackage: "GREEN_OPS_CERTIFIED",
    totalElectricityKwh: 53400,
    totalFuelLiters: 4200,
    meters: [
      {
        id: "MTR-OPS-CATLAI-B2",
        name: "Shore Power (OPS) 6.6kV Substation Meter",
        category: "ELECTRICITY_OPS",
        medium: "ELECTRICITY",
        primaryUnit: "kW",
        chartYMax: 700,
        chartYUnit: "kW (Active Load)",
        nominalRating: "6.6 kV / 1,500 kVA / 50 Hz",
        protocol: "IEC 61850 MMS & Modbus TCP",
        totalPeriodRecorded: 18200,
        totalPeriodUnit: "kWh",
        description: "Auxiliary cold ironing connection eliminating vessel auxiliary generator combustion at berth.",
        telemetry: [
          { time: "07:15", hour: 7.25, primaryVal: 0, secondaryVal: 6.6, tertiaryVal: 0, quaternaryVal: 0.95, statusText: "Cables connecting", locationNote: "Berth B2 Quay Pit" },
          { time: "08:00", hour: 8.0, primaryVal: 380, secondaryVal: 6.61, tertiaryVal: 33.2, quaternaryVal: 0.94, statusText: "Synchronized & energized", locationNote: "OPS Substation B2" },
          { time: "10:00", hour: 10.0, primaryVal: 540, secondaryVal: 6.59, tertiaryVal: 47.3, quaternaryVal: 0.95, statusText: "Aux steady hoteling", locationNote: "Vessel Switchboard" },
          { time: "12:00", hour: 12.0, primaryVal: 520, secondaryVal: 6.60, tertiaryVal: 45.5, quaternaryVal: 0.95, statusText: "Aux steady hoteling", locationNote: "Vessel Switchboard" },
          { time: "14:00", hour: 14.0, primaryVal: 580, secondaryVal: 6.58, tertiaryVal: 50.8, quaternaryVal: 0.96, statusText: "Peak hoteling + blowers", locationNote: "Vessel Switchboard" },
          { time: "16:00", hour: 16.0, primaryVal: 530, secondaryVal: 6.60, tertiaryVal: 46.4, quaternaryVal: 0.95, statusText: "Aux steady hoteling", locationNote: "Vessel Switchboard" },
          { time: "18:00", hour: 18.0, primaryVal: 520, secondaryVal: 6.61, tertiaryVal: 45.5, quaternaryVal: 0.95, statusText: "Aux steady hoteling", locationNote: "Vessel Switchboard" },
          { time: "20:00", hour: 20.0, primaryVal: 510, secondaryVal: 6.60, tertiaryVal: 44.6, quaternaryVal: 0.95, statusText: "Aux steady hoteling", locationNote: "Vessel Switchboard" },
          { time: "22:00", hour: 22.0, primaryVal: 490, secondaryVal: 6.62, tertiaryVal: 42.8, quaternaryVal: 0.94, statusText: "Night baseline load", locationNote: "Vessel Switchboard" },
          { time: "02:00", hour: 26.0, primaryVal: 480, secondaryVal: 6.62, tertiaryVal: 41.9, quaternaryVal: 0.94, statusText: "Night baseline load", locationNote: "Vessel Switchboard" },
          { time: "06:00", hour: 30.0, primaryVal: 510, secondaryVal: 6.60, tertiaryVal: 44.6, quaternaryVal: 0.95, statusText: "Morning readiness", locationNote: "Vessel Switchboard" },
          { time: "12:00", hour: 36.0, primaryVal: 530, secondaryVal: 6.59, tertiaryVal: 46.4, quaternaryVal: 0.95, statusText: "Final cargo moves", locationNote: "Vessel Switchboard" },
          { time: "17:30", hour: 41.5, primaryVal: 120, secondaryVal: 6.60, tertiaryVal: 10.5, quaternaryVal: 0.92, statusText: "Disconnection ramp down", locationNote: "Berth B2 Quay Pit" }
        ],
        historicalCalls: [
          { voyage: "Voyage 056N (Current)", date: "28/09/2026", totalQuantity: 18200, unit: "kWh", teuHandled: 2850, intensityLabel: "6.39 kWh/TEU", verified: true },
          { voyage: "Voyage 055N", date: "14/09/2026", totalQuantity: 17950, unit: "kWh", teuHandled: 2800, intensityLabel: "6.41 kWh/TEU", verified: true },
          { voyage: "Voyage 054N", date: "31/08/2026", totalQuantity: 18600, unit: "kWh", teuHandled: 2910, intensityLabel: "6.39 kWh/TEU", verified: true },
          { voyage: "Voyage 053N", date: "17/08/2026", totalQuantity: 17400, unit: "kWh", teuHandled: 2720, intensityLabel: "6.40 kWh/TEU", verified: true }
        ]
      },
      {
        id: "MTR-STS-CATLAI-B2",
        name: "STS Quay Crane Substation Feeder #04-#07",
        category: "ELECTRICITY_STS",
        medium: "ELECTRICITY",
        primaryUnit: "kW",
        chartYMax: 3200,
        chartYUnit: "kW (Total Hoist Power)",
        nominalRating: "22 kV / 4 x 800 kW Drives",
        protocol: "Profinet / Modbus RTU",
        totalPeriodRecorded: 22800,
        totalPeriodUnit: "kWh",
        description: "High-voltage electricity consumed by 4 quay cranes during discharge & loading cycles.",
        telemetry: [
          { time: "07:30", hour: 7.5, primaryVal: 200, secondaryVal: 22.1, tertiaryVal: 24, quaternaryVal: 0.88, statusText: "Positioning spreaders", locationNote: "STS #04-#07" },
          { time: "08:30", hour: 8.5, primaryVal: 2450, secondaryVal: 21.9, tertiaryVal: 64, quaternaryVal: 0.90, statusText: "Full-speed twin-lift hoisting", locationNote: "Quayside Berth B2" },
          { time: "10:30", hour: 10.5, primaryVal: 2680, secondaryVal: 21.8, tertiaryVal: 70, quaternaryVal: 0.91, statusText: "Peak loading cycles", locationNote: "Quayside Berth B2" },
          { time: "12:00", hour: 12.0, primaryVal: 650, secondaryVal: 22.2, tertiaryVal: 17, quaternaryVal: 0.85, statusText: "Shift handover lull", locationNote: "Cabin standby" },
          { time: "13:30", hour: 13.5, primaryVal: 2520, secondaryVal: 21.9, tertiaryVal: 66, quaternaryVal: 0.90, statusText: "Afternoon discharge run", locationNote: "Quayside Berth B2" },
          { time: "15:30", hour: 15.5, primaryVal: 2780, secondaryVal: 21.8, tertiaryVal: 73, quaternaryVal: 0.92, statusText: "Peak loading cycles", locationNote: "Quayside Berth B2" },
          { time: "18:00", hour: 18.0, primaryVal: 1100, secondaryVal: 22.0, tertiaryVal: 29, quaternaryVal: 0.87, statusText: "Hatch cover repositioning", locationNote: "Bay 12-16" },
          { time: "20:00", hour: 20.0, primaryVal: 2350, secondaryVal: 21.9, tertiaryVal: 61, quaternaryVal: 0.89, statusText: "Night shift container moves", locationNote: "Quayside Berth B2" },
          { time: "23:00", hour: 23.0, primaryVal: 2100, secondaryVal: 22.0, tertiaryVal: 55, quaternaryVal: 0.89, statusText: "Steady twin hoisting", locationNote: "Quayside Berth B2" },
          { time: "03:00", hour: 27.0, primaryVal: 1850, secondaryVal: 22.1, tertiaryVal: 48, quaternaryVal: 0.88, statusText: "Graveyard shift cycles", locationNote: "Quayside Berth B2" },
          { time: "07:00", hour: 31.0, primaryVal: 2400, secondaryVal: 21.9, tertiaryVal: 63, quaternaryVal: 0.90, statusText: "Morning outbound loading", locationNote: "Quayside Berth B2" },
          { time: "12:00", hour: 36.0, primaryVal: 2150, secondaryVal: 22.0, tertiaryVal: 56, quaternaryVal: 0.89, statusText: "Last tier stacking", locationNote: "Quayside Berth B2" },
          { time: "16:00", hour: 40.0, primaryVal: 350, secondaryVal: 22.2, tertiaryVal: 9, quaternaryVal: 0.86, statusText: "Lashing & securing completed", locationNote: "Quayside Berth B2" }
        ],
        historicalCalls: [
          { voyage: "Voyage 056N (Current)", date: "28/09/2026", totalQuantity: 22800, unit: "kWh", teuHandled: 2850, intensityLabel: "8.00 kWh/TEU", verified: true },
          { voyage: "Voyage 055N", date: "14/09/2026", totalQuantity: 21900, unit: "kWh", teuHandled: 2800, intensityLabel: "7.82 kWh/TEU", verified: true },
          { voyage: "Voyage 054N", date: "31/08/2026", totalQuantity: 23400, unit: "kWh", teuHandled: 2910, intensityLabel: "8.04 kWh/TEU", verified: true },
          { voyage: "Voyage 053N", date: "17/08/2026", totalQuantity: 20800, unit: "kWh", teuHandled: 2720, intensityLabel: "7.65 kWh/TEU", verified: true }
        ]
      },
      {
        id: "MTR-REEFER-ZONE3",
        name: "Reefer Yard Substation Meter (Zone 03 Cold Chain)",
        category: "ELECTRICITY_REEFER",
        medium: "REEFER_THERMAL",
        primaryUnit: "kW",
        chartYMax: 600,
        chartYUnit: "kW (Cooling Load)",
        nominalRating: "380 V / 450 Plug Receptacles",
        protocol: "Modbus TCP / Cold-Chain IoT",
        totalPeriodRecorded: 12400,
        totalPeriodUnit: "kWh",
        description: "Continuous power and thermal compliance for 240 seafood export containers at -22.0°C.",
        telemetry: [
          { time: "07:15", hour: 7.25, primaryVal: 280, secondaryVal: -22.1, tertiaryVal: 210, quaternaryVal: 0, statusText: "210 active reefer plugs", locationNote: "Zone 3 Rows A-D" },
          { time: "09:00", hour: 9.0, primaryVal: 340, secondaryVal: -22.0, tertiaryVal: 225, quaternaryVal: 0, statusText: "225 active plugs plugged", locationNote: "Zone 3 Rows A-D" },
          { time: "11:00", hour: 11.0, primaryVal: 380, secondaryVal: -21.9, tertiaryVal: 240, quaternaryVal: 0, statusText: "All 240 units connected", locationNote: "Zone 3 Complete" },
          { time: "13:00", hour: 13.0, primaryVal: 420, secondaryVal: -21.8, tertiaryVal: 240, quaternaryVal: 0, statusText: "Diurnal midday heat peak", locationNote: "Zone 3 Complete" },
          { time: "15:00", hour: 15.0, primaryVal: 410, secondaryVal: -22.0, tertiaryVal: 240, quaternaryVal: 0, statusText: "Compressors modulating", locationNote: "Zone 3 Complete" },
          { time: "18:00", hour: 18.0, primaryVal: 360, secondaryVal: -22.1, tertiaryVal: 240, quaternaryVal: 0, statusText: "Cooling stabilized", locationNote: "Zone 3 Complete" },
          { time: "22:00", hour: 22.0, primaryVal: 320, secondaryVal: -22.2, tertiaryVal: 240, quaternaryVal: 0, statusText: "Night ambient temperature", locationNote: "Zone 3 Complete" },
          { time: "04:00", hour: 28.0, primaryVal: 310, secondaryVal: -22.2, tertiaryVal: 240, quaternaryVal: 0, statusText: "Night ambient temperature", locationNote: "Zone 3 Complete" },
          { time: "09:00", hour: 33.0, primaryVal: 370, secondaryVal: -22.0, tertiaryVal: 240, quaternaryVal: 0, statusText: "Daytime ramp", locationNote: "Zone 3 Complete" },
          { time: "14:00", hour: 38.0, primaryVal: 290, secondaryVal: -22.1, tertiaryVal: 180, quaternaryVal: 0, statusText: "Transferring to vessel hold", locationNote: "Zone 3 Loading Out" },
          { time: "17:00", hour: 41.0, primaryVal: 80, secondaryVal: -22.0, tertiaryVal: 45, quaternaryVal: 0, statusText: "Final containers loaded", locationNote: "Zone 3 Cleared" }
        ],
        historicalCalls: [
          { voyage: "Voyage 056N (Current)", date: "28/09/2026", totalQuantity: 12400, unit: "kWh", teuHandled: 240, intensityLabel: "51.6 kWh/Box", verified: true },
          { voyage: "Voyage 055N", date: "14/09/2026", totalQuantity: 12100, unit: "kWh", teuHandled: 235, intensityLabel: "51.5 kWh/Box", verified: true },
          { voyage: "Voyage 054N", date: "31/08/2026", totalQuantity: 12850, unit: "kWh", teuHandled: 245, intensityLabel: "52.4 kWh/Box", verified: true },
          { voyage: "Voyage 053N", date: "17/08/2026", totalQuantity: 11900, unit: "kWh", teuHandled: 230, intensityLabel: "51.7 kWh/Box", verified: true }
        ]
      },
      {
        id: "MTR-TUG-TANCANG01",
        name: "Harbor Tug Tan Cang 01 (Coriolis Mass Flowmeter)",
        category: "FUEL_TUGBOAT",
        medium: "FUEL",
        primaryUnit: "L",
        chartYMax: 35,
        chartYUnit: "L/min (Fuel Flow Rate)",
        nominalRating: "Twin CAT 3516C (4,000 BHP) · MGO 0.1%S",
        protocol: "Micro Motion Coriolis / NMEA 0183",
        totalPeriodRecorded: 1800,
        totalPeriodUnit: "Liters MGO",
        description: "Direct metered bunker burn for inward berthing push (920 L) and outward cast-off assist (880 L).",
        telemetry: [
          { time: "06:30", hour: 6.5, primaryVal: 8.5, secondaryVal: 4.8, tertiaryVal: 38.2, quaternaryVal: 850, statusText: "Departing tug jetty", locationNote: "Cat Lai Tug Basin" },
          { time: "07:00", hour: 7.0, primaryVal: 28.5, secondaryVal: 5.2, tertiaryVal: 39.5, quaternaryVal: 1650, statusText: "Full push into Berth B2", locationNote: "Berth B2 Starboard" },
          { time: "07:20", hour: 7.33, primaryVal: 24.0, secondaryVal: 5.1, tertiaryVal: 39.1, quaternaryVal: 1480, statusText: "Holding vessel along quay", locationNote: "Mooring lines fast" },
          { time: "07:45", hour: 7.75, primaryVal: 4.2, secondaryVal: 4.6, tertiaryVal: 37.8, quaternaryVal: 650, statusText: "Standby idle at berth", locationNote: "Standby Zone" },
          { time: "08:30", hour: 8.5, primaryVal: 2.1, secondaryVal: 4.5, tertiaryVal: 36.5, quaternaryVal: 500, statusText: "Engines secured at jetty", locationNote: "Tug Jetty Cat Lai" },
          { time: "16:00", hour: 40.0, primaryVal: 7.8, secondaryVal: 4.7, tertiaryVal: 38.0, quaternaryVal: 800, statusText: "Engine warm-up & transit", locationNote: "Cat Lai Reach" },
          { time: "17:15", hour: 41.25, primaryVal: 26.5, secondaryVal: 5.2, tertiaryVal: 39.4, quaternaryVal: 1600, statusText: "Pulling vessel into fairway", locationNote: "Fairway Turning Basin" },
          { time: "17:50", hour: 41.83, primaryVal: 18.0, secondaryVal: 5.0, tertiaryVal: 38.8, quaternaryVal: 1200, statusText: "Escort to pilot station", locationNote: "Vung Tau Channel Entrance" },
          { time: "18:15", hour: 42.25, primaryVal: 4.0, secondaryVal: 4.5, tertiaryVal: 37.5, quaternaryVal: 650, statusText: "Returning to jetty", locationNote: "Cat Lai Tug Basin" }
        ],
        historicalCalls: [
          { voyage: "Voyage 056N (Current)", date: "28/09/2026", totalQuantity: 1800, unit: "Liters", teuHandled: 2850, intensityLabel: "0.63 L/TEU", verified: true },
          { voyage: "Voyage 055N", date: "14/09/2026", totalQuantity: 1750, unit: "Liters", teuHandled: 2800, intensityLabel: "0.62 L/TEU", verified: true },
          { voyage: "Voyage 054N", date: "31/08/2026", totalQuantity: 1920, unit: "Liters", teuHandled: 2910, intensityLabel: "0.66 L/TEU", verified: true },
          { voyage: "Voyage 053N", date: "17/08/2026", totalQuantity: 1810, unit: "Liters", teuHandled: 2720, intensityLabel: "0.67 L/TEU", verified: true }
        ]
      },
      {
        id: "MTR-TRK-FLEET-B2",
        name: "Terminal Tractor Fleet Telemetry (32 Haulers)",
        category: "FUEL_TRACTOR",
        medium: "FUEL",
        primaryUnit: "L",
        chartYMax: 2600,
        chartYUnit: "Liters (Cumulative Tank Burn)",
        nominalRating: "Cummins QSB6.7 Diesel (220 HP) · Kalmar Ottawa",
        protocol: "CAN Bus J1939 / Teltonika FMB640",
        totalPeriodRecorded: 2400,
        totalPeriodUnit: "Liters Diesel",
        description: "Cumulative diesel fuel consumed by 32 internal tractors shuttling containers between STS quay and Reefer Block 3.",
        telemetry: [
          { time: "07:30", hour: 7.5, primaryVal: 120, secondaryVal: 12.0, tertiaryVal: 32, quaternaryVal: 0, statusText: "Initial queue deployment", locationNote: "Quayside Berth B2" },
          { time: "09:30", hour: 9.5, primaryVal: 480, secondaryVal: 19.5, tertiaryVal: 32, quaternaryVal: 0, statusText: "Continuous shuttle cycles", locationNote: "Transfer Route R1" },
          { time: "12:00", hour: 12.0, primaryVal: 820, secondaryVal: 8.5, tertiaryVal: 16, quaternaryVal: 0, statusText: "Lunch break rotation", locationNote: "Yard C Buffer" },
          { time: "15:00", hour: 15.0, primaryVal: 1350, secondaryVal: 21.0, tertiaryVal: 32, quaternaryVal: 0, statusText: "Full cycle haulage", locationNote: "Transfer Route R1" },
          { time: "18:00", hour: 18.0, primaryVal: 1680, secondaryVal: 17.5, tertiaryVal: 28, quaternaryVal: 0, statusText: "Evening shift handoff", locationNote: "Gate 2 Transit" },
          { time: "22:00", hour: 22.0, primaryVal: 1980, secondaryVal: 16.0, tertiaryVal: 24, quaternaryVal: 0, statusText: "Night shuttle loading", locationNote: "Berth B2 Quay" },
          { time: "04:00", hour: 28.0, primaryVal: 2180, secondaryVal: 14.5, tertiaryVal: 20, quaternaryVal: 0, statusText: "Graveyard shift moves", locationNote: "Berth B2 Quay" },
          { time: "11:00", hour: 35.0, primaryVal: 2360, secondaryVal: 11.0, tertiaryVal: 12, quaternaryVal: 0, statusText: "Final yard stowage", locationNote: "Reefer Zone 3" },
          { time: "16:00", hour: 40.0, primaryVal: 2400, secondaryVal: 0.0, tertiaryVal: 0, quaternaryVal: 0, statusText: "Operation complete", locationNote: "Fleet Parking D" }
        ],
        historicalCalls: [
          { voyage: "Voyage 056N (Current)", date: "28/09/2026", totalQuantity: 2400, unit: "Liters", teuHandled: 2850, intensityLabel: "0.84 L/TEU", verified: true },
          { voyage: "Voyage 055N", date: "14/09/2026", totalQuantity: 2350, unit: "Liters", teuHandled: 2800, intensityLabel: "0.84 L/TEU", verified: true },
          { voyage: "Voyage 054N", date: "31/08/2026", totalQuantity: 2510, unit: "Liters", teuHandled: 2910, intensityLabel: "0.86 L/TEU", verified: true },
          { voyage: "Voyage 053N", date: "17/08/2026", totalQuantity: 2290, unit: "Liters", teuHandled: 2720, intensityLabel: "0.84 L/TEU", verified: true }
        ]
      }
    ]
  },

  // --------------------------------------------------------------------------
  // UC-02: ONE APUS (14,000 TEU ULCV - Cai Mep TCIT Berth 01)
  // --------------------------------------------------------------------------
  {
    useCaseId: "UC-02",
    invoiceNumber: "GPORT-INV-2026-0902",
    vesselName: "ONE APUS",
    voyageNumber: "012W",
    imoNumber: "9806079",
    carrierName: "Ocean Network Express (ONE) / The Alliance",
    berth: "Cai Mep TCIT - Berth 01",
    hotelingHours: 41.67,
    servicePackage: "NET_ZERO_PORT_CALL",
    totalElectricityKwh: 70300,
    totalFuelLiters: 5000,
    meters: [
      {
        id: "MTR-OPS-TCIT-B01",
        name: "Deep-Sea Dual-Bus Shore Power OPS Meter (22kV/6.6kV)",
        category: "ELECTRICITY_OPS",
        medium: "ELECTRICITY",
        primaryUnit: "kW",
        chartYMax: 1200,
        chartYUnit: "kW (Active Load)",
        nominalRating: "22 kV / 6.6 kV Dual-Bus / 4.0 MVA",
        protocol: "IEC 61850 Station Bus",
        totalPeriodRecorded: 24500,
        totalPeriodUnit: "kWh",
        description: "ULCV 14,000 TEU high-capacity shore power supply covering massive refrigeration and hoteling loads.",
        telemetry: [
          { time: "14:20", hour: 14.33, primaryVal: 0, secondaryVal: 6.6, tertiaryVal: 0, quaternaryVal: 0.95, statusText: "Dual cable booms connected", locationNote: "TCIT Berth 01 Pit" },
          { time: "15:30", hour: 15.5, primaryVal: 680, secondaryVal: 6.6, tertiaryVal: 59.5, quaternaryVal: 0.96, statusText: "Main breaker synchronized", locationNote: "OPS Station TCIT" },
          { time: "18:00", hour: 18.0, primaryVal: 840, secondaryVal: 6.58, tertiaryVal: 73.8, quaternaryVal: 0.96, statusText: "Reefer holds online", locationNote: "Vessel Switchboard" },
          { time: "22:00", hour: 22.0, primaryVal: 790, secondaryVal: 6.60, tertiaryVal: 69.1, quaternaryVal: 0.96, statusText: "Steady auxiliary load", locationNote: "Vessel Switchboard" },
          { time: "06:00", hour: 30.0, primaryVal: 810, secondaryVal: 6.60, tertiaryVal: 70.8, quaternaryVal: 0.96, statusText: "Steady auxiliary load", locationNote: "Vessel Switchboard" },
          { time: "14:00", hour: 38.0, primaryVal: 860, secondaryVal: 6.57, tertiaryVal: 75.8, quaternaryVal: 0.96, statusText: "Air conditioning peak load", locationNote: "Vessel Switchboard" },
          { time: "20:00", hour: 44.0, primaryVal: 780, secondaryVal: 6.60, tertiaryVal: 68.2, quaternaryVal: 0.96, statusText: "Cargo holds closing", locationNote: "Vessel Switchboard" },
          { time: "06:30", hour: 54.5, primaryVal: 150, secondaryVal: 6.61, tertiaryVal: 13.1, quaternaryVal: 0.93, statusText: "Disconnecting shore power", locationNote: "TCIT Berth 01 Pit" }
        ],
        historicalCalls: [
          { voyage: "Voyage 012W (Current)", date: "28/09/2026", totalQuantity: 24500, unit: "kWh", teuHandled: 3400, intensityLabel: "7.21 kWh/TEU", verified: true },
          { voyage: "Voyage 011W", date: "10/09/2026", totalQuantity: 24100, unit: "kWh", teuHandled: 3350, intensityLabel: "7.19 kWh/TEU", verified: true },
          { voyage: "Voyage 010W", date: "24/08/2026", totalQuantity: 25200, unit: "kWh", teuHandled: 3480, intensityLabel: "7.24 kWh/TEU", verified: true }
        ]
      },
      {
        id: "MTR-STS-TCIT-SPP",
        name: "5 Super Post-Panamax STS Cranes Feeder Meter",
        category: "ELECTRICITY_STS",
        medium: "ELECTRICITY",
        primaryUnit: "kW",
        chartYMax: 4500,
        chartYUnit: "kW (5 Cranes Total)",
        nominalRating: "22 kV / 5 x 1,200 kW Inverters",
        protocol: "IEC 61850 / SCADA Feeder F01",
        totalPeriodRecorded: 29000,
        totalPeriodUnit: "kWh",
        description: "Simultaneous container handling across 5 cranes. Peak spikes at 14:00-16:00 trigger Cai Mep BESS discharge.",
        telemetry: [
          { time: "14:30", hour: 14.5, primaryVal: 500, secondaryVal: 22.0, tertiaryVal: 13.1, quaternaryVal: 0.88, statusText: "Boom down position", locationNote: "Cai Mep TCIT Quay" },
          { time: "16:00", hour: 16.0, primaryVal: 3400, secondaryVal: 21.8, tertiaryVal: 90.1, quaternaryVal: 0.91, statusText: "5 Cranes intensive unloading", locationNote: "Bays 18-42" },
          { time: "20:00", hour: 20.0, primaryVal: 3650, secondaryVal: 21.7, tertiaryVal: 97.2, quaternaryVal: 0.92, statusText: "Maximum hoist ramp", locationNote: "Bays 18-42" },
          { time: "02:00", hour: 26.0, primaryVal: 2800, secondaryVal: 22.0, tertiaryVal: 73.5, quaternaryVal: 0.90, statusText: "Night shift loading", locationNote: "Bays 18-42" },
          { time: "08:00", hour: 32.0, primaryVal: 3200, secondaryVal: 21.8, tertiaryVal: 84.8, quaternaryVal: 0.91, statusText: "Day shift loading", locationNote: "Bays 18-42" },
          { time: "14:30", hour: 38.5, primaryVal: 3950, secondaryVal: 21.6, tertiaryVal: 105.4, quaternaryVal: 0.93, statusText: "P90 Peak (BESS Peak Shaving Active)", locationNote: "Bays 18-42" },
          { time: "22:00", hour: 46.0, primaryVal: 2600, secondaryVal: 22.0, tertiaryVal: 68.2, quaternaryVal: 0.90, statusText: "Last hold completion", locationNote: "Bays 18-42" },
          { time: "05:00", hour: 53.0, primaryVal: 400, secondaryVal: 22.2, tertiaryVal: 10.4, quaternaryVal: 0.86, statusText: "Securing cranes", locationNote: "Cai Mep TCIT Quay" }
        ],
        historicalCalls: [
          { voyage: "Voyage 012W (Current)", date: "28/09/2026", totalQuantity: 29000, unit: "kWh", teuHandled: 3400, intensityLabel: "8.53 kWh/TEU", verified: true },
          { voyage: "Voyage 011W", date: "10/09/2026", totalQuantity: 28400, unit: "kWh", teuHandled: 3350, intensityLabel: "8.48 kWh/TEU", verified: true },
          { voyage: "Voyage 010W", date: "24/08/2026", totalQuantity: 29800, unit: "kWh", teuHandled: 3480, intensityLabel: "8.56 kWh/TEU", verified: true }
        ]
      },
      {
        id: "MTR-BESS-TCIT-1.5MW",
        name: "Cai Mep BESS Storage Substation (1.5MW / 3MWh)",
        category: "STORAGE_BESS",
        medium: "BATTERY",
        primaryUnit: "kW",
        chartYMax: 1600,
        chartYUnit: "kW (Discharge Power)",
        nominalRating: "1.5 MW / 3.0 MWh LFP Cells",
        protocol: "Modbus TCP / BESS EMS",
        totalPeriodRecorded: 3450,
        totalPeriodUnit: "kWh Discharged",
        description: "Utility-scale BESS discharging 1,500 kW during EVN peak tariff and STS crane spikes to shave demand charges.",
        telemetry: [
          { time: "14:00", hour: 14.0, primaryVal: 0, secondaryVal: 92.5, tertiaryVal: 26.5, quaternaryVal: 99.2, statusText: "SOC 92.5% - Standby", locationNote: "BESS Container #01-#02" },
          { time: "14:15", hour: 14.25, primaryVal: 1450, secondaryVal: 84.0, tertiaryVal: 28.2, quaternaryVal: 99.2, statusText: "Discharging Peak Shaving", locationNote: "PCS 1.5MW Online" },
          { time: "15:30", hour: 15.5, primaryVal: 1500, secondaryVal: 62.0, tertiaryVal: 31.0, quaternaryVal: 99.2, statusText: "Discharging Peak Shaving", locationNote: "PCS 1.5MW Online" },
          { time: "16:00", hour: 16.0, primaryVal: 450, secondaryVal: 55.0, tertiaryVal: 29.5, quaternaryVal: 99.2, statusText: "Tapering discharge", locationNote: "PCS Standby Mode" },
          { time: "22:00", hour: 22.0, primaryVal: -600, secondaryVal: 72.0, tertiaryVal: 26.0, quaternaryVal: 99.2, statusText: "Charging on Off-Peak Tariff", locationNote: "Grid Infeed 1,100 VND" },
          { time: "04:00", hour: 28.0, primaryVal: -600, secondaryVal: 95.0, tertiaryVal: 25.5, quaternaryVal: 99.2, statusText: "Charging complete (95%)", locationNote: "Ready for Day Shift" }
        ],
        historicalCalls: [
          { voyage: "Voyage 012W (Current)", date: "28/09/2026", totalQuantity: 3450, unit: "kWh", teuHandled: 3400, intensityLabel: "Peak Shaved: 1.5MW", verified: true },
          { voyage: "Voyage 011W", date: "10/09/2026", totalQuantity: 3200, unit: "kWh", teuHandled: 3350, intensityLabel: "Peak Shaved: 1.4MW", verified: true },
          { voyage: "Voyage 010W", date: "24/08/2026", totalQuantity: 3600, unit: "kWh", teuHandled: 3480, intensityLabel: "Peak Shaved: 1.5MW", verified: true }
        ]
      },
      {
        id: "MTR-TUG-CAIMEP-02",
        name: "Cai Mep Deep-Sea Escort Tug #02 (Coriolis Flowmeter)",
        category: "FUEL_TUGBOAT",
        medium: "FUEL",
        primaryUnit: "L",
        chartYMax: 40,
        chartYUnit: "L/min (Fuel Flow)",
        nominalRating: "Twin Yanmar 6EY26W (5,000 BHP / 65T BP)",
        protocol: "Emerson Coriolis / NMEA",
        totalPeriodRecorded: 2100,
        totalPeriodUnit: "Liters MGO",
        description: "Heavy escort through Cai Mep deep-water fairway and precision docking maneuver for 14,000 TEU vessel.",
        telemetry: [
          { time: "13:30", hour: 13.5, primaryVal: 12.0, secondaryVal: 5.0, tertiaryVal: 40.1, quaternaryVal: 950, statusText: "Transit to fairway buoy 0", locationNote: "Cai Mep Fairway" },
          { time: "14:15", hour: 14.25, primaryVal: 34.0, secondaryVal: 5.4, tertiaryVal: 42.5, quaternaryVal: 1750, statusText: "Heavy pushing against ebb current", locationNote: "Berth 01 Starboard" },
          { time: "14:45", hour: 14.75, primaryVal: 22.0, secondaryVal: 5.1, tertiaryVal: 41.2, quaternaryVal: 1300, statusText: "Securing alongside", locationNote: "TCIT Berth 01" },
          { time: "15:15", hour: 15.25, primaryVal: 3.5, secondaryVal: 4.6, tertiaryVal: 38.0, quaternaryVal: 600, statusText: "Standby idle", locationNote: "TCIT Jetty" }
        ],
        historicalCalls: [
          { voyage: "Voyage 012W (Current)", date: "28/09/2026", totalQuantity: 2100, unit: "Liters", teuHandled: 3400, intensityLabel: "0.62 L/TEU", verified: true },
          { voyage: "Voyage 011W", date: "10/09/2026", totalQuantity: 2050, unit: "Liters", teuHandled: 3350, intensityLabel: "0.61 L/TEU", verified: true },
          { voyage: "Voyage 010W", date: "24/08/2026", totalQuantity: 2200, unit: "Liters", teuHandled: 3480, intensityLabel: "0.63 L/TEU", verified: true }
        ]
      }
    ]
  },

  // --------------------------------------------------------------------------
  // UC-03: GSL KITHIRA (Trans-Pacific Dry Cargo - Cat Lai Berth B1)
  // --------------------------------------------------------------------------
  {
    useCaseId: "UC-03",
    invoiceNumber: "GPORT-INV-2026-0903",
    vesselName: "GSL KITHIRA",
    voyageNumber: "443S",
    imoNumber: "9385609",
    carrierName: "Tan Cang Intermodal & Maersk Partner",
    berth: "Cat Lai Terminal - Berth B1",
    hotelingHours: 44.0,
    servicePackage: "GREEN_OPS_CERTIFIED",
    totalElectricityKwh: 34600,
    totalFuelLiters: 2800,
    meters: [
      {
        id: "MTR-OPS-CATLAI-B1",
        name: "Shore Power OPS Feeder Berth B1 (6.6kV)",
        category: "ELECTRICITY_OPS",
        medium: "ELECTRICITY",
        primaryUnit: "kW",
        chartYMax: 600,
        chartYUnit: "kW (Active Load)",
        nominalRating: "6.6 kV / 1,000 kVA",
        protocol: "Modbus TCP",
        totalPeriodRecorded: 12000,
        totalPeriodUnit: "kWh",
        description: "Auxiliary power supply to GSL KITHIRA during transshipment of industrial machinery.",
        telemetry: [
          { time: "02:00", hour: 2.0, primaryVal: 0, secondaryVal: 6.6, tertiaryVal: 0, quaternaryVal: 0.94, statusText: "Cable connection", locationNote: "Berth B1 Pit" },
          { time: "03:00", hour: 3.0, primaryVal: 320, secondaryVal: 6.61, tertiaryVal: 28.0, quaternaryVal: 0.94, statusText: "Auxiliary load online", locationNote: "Vessel Switchboard" },
          { time: "12:00", hour: 12.0, primaryVal: 350, secondaryVal: 6.59, tertiaryVal: 30.6, quaternaryVal: 0.95, statusText: "Steady hoteling", locationNote: "Vessel Switchboard" },
          { time: "21:00", hour: 45.0, primaryVal: 100, secondaryVal: 6.61, tertiaryVal: 8.7, quaternaryVal: 0.92, statusText: "Ramp down", locationNote: "Berth B1 Pit" }
        ],
        historicalCalls: [
          { voyage: "Voyage 443S (Current)", date: "29/09/2026", totalQuantity: 12000, unit: "kWh", teuHandled: 2100, intensityLabel: "5.71 kWh/TEU", verified: true },
          { voyage: "Voyage 442S", date: "15/09/2026", totalQuantity: 11800, unit: "kWh", teuHandled: 2050, intensityLabel: "5.75 kWh/TEU", verified: true },
          { voyage: "Voyage 441S", date: "01/09/2026", totalQuantity: 12300, unit: "kWh", teuHandled: 2150, intensityLabel: "5.72 kWh/TEU", verified: true }
        ]
      },
      {
        id: "MTR-STS-CATLAI-B1",
        name: "STS Cranes Berth B1 (3 Units)",
        category: "ELECTRICITY_STS",
        medium: "ELECTRICITY",
        primaryUnit: "kW",
        chartYMax: 2400,
        chartYUnit: "kW (Total Hoist Power)",
        nominalRating: "22 kV / 3 x 800 kW",
        protocol: "Profinet / SCADA",
        totalPeriodRecorded: 16800,
        totalPeriodUnit: "kWh",
        description: "Heavy machinery and dry container handling at Cat Lai Berth B1.",
        telemetry: [
          { time: "03:30", hour: 3.5, primaryVal: 1650, secondaryVal: 22.0, tertiaryVal: 43.3, quaternaryVal: 0.89, statusText: "Heavy hoist cycles", locationNote: "Quayside B1" },
          { time: "11:00", hour: 11.0, primaryVal: 1850, secondaryVal: 21.9, tertiaryVal: 48.8, quaternaryVal: 0.90, statusText: "Out-of-gauge handling", locationNote: "Quayside B1" },
          { time: "20:00", hour: 20.0, primaryVal: 1400, secondaryVal: 22.1, tertiaryVal: 36.6, quaternaryVal: 0.88, statusText: "Standard dry 40ft loading", locationNote: "Quayside B1" }
        ],
        historicalCalls: [
          { voyage: "Voyage 443S (Current)", date: "29/09/2026", totalQuantity: 16800, unit: "kWh", teuHandled: 2100, intensityLabel: "8.00 kWh/TEU", verified: true },
          { voyage: "Voyage 442S", date: "15/09/2026", totalQuantity: 16400, unit: "kWh", teuHandled: 2050, intensityLabel: "8.00 kWh/TEU", verified: true }
        ]
      },
      {
        id: "MTR-TUG-TANCANG05",
        name: "Harbor Tug Tan Cang 05 (Coriolis Flowmeter)",
        category: "FUEL_TUGBOAT",
        medium: "FUEL",
        primaryUnit: "L",
        chartYMax: 25,
        chartYUnit: "L/min (Fuel Flow)",
        nominalRating: "3,200 BHP / MGO 0.1%S",
        protocol: "Coriolis Mass Flow",
        totalPeriodRecorded: 1200,
        totalPeriodUnit: "Liters MGO",
        description: "Tug assistance for berthing and unberthing at Cat Lai B1.",
        telemetry: [
          { time: "01:30", hour: 1.5, primaryVal: 18.5, secondaryVal: 4.9, tertiaryVal: 38.5, quaternaryVal: 1400, statusText: "Berthing assist push", locationNote: "Cat Lai B1 Basin" },
          { time: "02:15", hour: 2.25, primaryVal: 2.8, secondaryVal: 4.5, tertiaryVal: 36.0, quaternaryVal: 550, statusText: "Idle at berth", locationNote: "Tug Jetty" }
        ],
        historicalCalls: [
          { voyage: "Voyage 443S (Current)", date: "29/09/2026", totalQuantity: 1200, unit: "Liters", teuHandled: 2100, intensityLabel: "0.57 L/TEU", verified: true },
          { voyage: "Voyage 442S", date: "15/09/2026", totalQuantity: 1180, unit: "Liters", teuHandled: 2050, intensityLabel: "0.58 L/TEU", verified: true }
        ]
      }
    ]
  },

  // --------------------------------------------------------------------------
  // UC-04: TAN CANG GLORY (Domestic Coastal Feeder - Cat Lai / Hiep Phuoc)
  // --------------------------------------------------------------------------
  {
    useCaseId: "UC-04",
    invoiceNumber: "GPORT-INV-2026-0904",
    vesselName: "TAN CANG GLORY",
    voyageNumber: "104S",
    imoNumber: "9632480",
    carrierName: "Tan Cang Shipping / SNP Domestic",
    berth: "Cat Lai B1 / Hiep Phuoc Terminal",
    hotelingHours: 17.75,
    servicePackage: "GREEN_OPS_CERTIFIED",
    totalElectricityKwh: 18400,
    totalFuelLiters: 2050,
    meters: [
      {
        id: "MTR-OPS-HIEPPHUOC",
        name: "Shore Power OPS Feeder Hiep Phuoc (6.6kV)",
        category: "ELECTRICITY_OPS",
        medium: "ELECTRICITY",
        primaryUnit: "kW",
        chartYMax: 500,
        chartYUnit: "kW (Active Load)",
        nominalRating: "6.6 kV / 800 kVA",
        protocol: "Modbus TCP",
        totalPeriodRecorded: 6400,
        totalPeriodUnit: "kWh",
        description: "Shore power connected for domestic feeder ship hoteling.",
        telemetry: [
          { time: "10:30", hour: 10.5, primaryVal: 0, secondaryVal: 6.6, tertiaryVal: 0, quaternaryVal: 0.94, statusText: "Shore cable energized", locationNote: "Hiep Phuoc Berth" },
          { time: "11:30", hour: 11.5, primaryVal: 380, secondaryVal: 6.6, tertiaryVal: 33.2, quaternaryVal: 0.95, statusText: "Aux engine secured", locationNote: "Feeder Switchboard" },
          { time: "18:00", hour: 18.0, primaryVal: 390, secondaryVal: 6.59, tertiaryVal: 34.1, quaternaryVal: 0.95, statusText: "Stevedoring hoteling", locationNote: "Feeder Switchboard" },
          { time: "03:30", hour: 27.5, primaryVal: 90, secondaryVal: 6.61, tertiaryVal: 7.9, quaternaryVal: 0.92, statusText: "Disconnecting", locationNote: "Hiep Phuoc Berth" }
        ],
        historicalCalls: [
          { voyage: "Voyage 104S (Current)", date: "27/09/2026", totalQuantity: 6400, unit: "kWh", teuHandled: 1200, intensityLabel: "5.33 kWh/TEU", verified: true },
          { voyage: "Voyage 103S", date: "20/09/2026", totalQuantity: 6200, unit: "kWh", teuHandled: 1180, intensityLabel: "5.25 kWh/TEU", verified: true },
          { voyage: "Voyage 102S", date: "13/09/2026", totalQuantity: 6500, unit: "kWh", teuHandled: 1220, intensityLabel: "5.33 kWh/TEU", verified: true }
        ]
      },
      {
        id: "TC-GLORY_AUX",
        name: "Tân Cảng Glory (Aux Marine Gas Oil Meter)",
        category: "FUEL_TUGBOAT",
        medium: "FUEL",
        primaryUnit: "L",
        chartYMax: 20,
        chartYUnit: "L/min (Aux Flow)",
        nominalRating: "Daihatsu 6DL-16 Marine Aux (450 kW)",
        protocol: "Pulse Flow Sensor / Modbus RTU",
        totalPeriodRecorded: 0, // Turned off thanks to OPS!
        totalPeriodUnit: "Liters MGO (0L - 100% Cold Ironing)",
        description: "Auxiliary engine meter confirming 0 Liters fuel consumed while berthed thanks to 100% OPS shore power connection.",
        telemetry: [
          { time: "10:30", hour: 10.5, primaryVal: 4.5, secondaryVal: 4.5, tertiaryVal: 37.0, quaternaryVal: 600, statusText: "Docking engine test", locationNote: "Aux Generator #1" },
          { time: "11:30", hour: 11.5, primaryVal: 0.0, secondaryVal: 0.0, tertiaryVal: 28.0, quaternaryVal: 0, statusText: "Secured · OPS Active", locationNote: "Zero Fuel Combustion" },
          { time: "18:00", hour: 18.0, primaryVal: 0.0, secondaryVal: 0.0, tertiaryVal: 28.0, quaternaryVal: 0, statusText: "Secured · OPS Active", locationNote: "Zero Fuel Combustion" },
          { time: "03:30", hour: 27.5, primaryVal: 0.0, secondaryVal: 0.0, tertiaryVal: 28.0, quaternaryVal: 0, statusText: "Secured · OPS Active", locationNote: "Zero Fuel Combustion" }
        ],
        historicalCalls: [
          { voyage: "Voyage 104S (Current)", date: "27/09/2026", totalQuantity: 0, unit: "Liters", teuHandled: 1200, intensityLabel: "0.0 L/TEU (100% OPS)", verified: true },
          { voyage: "Voyage 103S", date: "20/09/2026", totalQuantity: 0, unit: "Liters", teuHandled: 1180, intensityLabel: "0.0 L/TEU (100% OPS)", verified: true }
        ]
      },
      {
        id: "60H03961_C",
        name: "Tractor 60H03961_C (Container Haulage)",
        category: "FUEL_TRACTOR",
        medium: "FUEL",
        primaryUnit: "L",
        chartYMax: 380,
        chartYUnit: "Liters (Tank Volume)",
        nominalRating: "Heavy Tractor 400L Tank · QL53 Route",
        protocol: "GPS & Ultrasonic Fuel Sensor",
        totalPeriodRecorded: 1100,
        totalPeriodUnit: "Liters Diesel",
        description: "Direct vehicle fuel level drop and speed profile over 122.69 km haulage route.",
        telemetry: [
          { time: "00:00", hour: 0.0, primaryVal: 365, secondaryVal: 0, tertiaryVal: 0, quaternaryVal: 0, statusText: "Parked at Gate 2", locationNote: "Cat Lai Gate 2" },
          { time: "01:00", hour: 1.0, primaryVal: 355, secondaryVal: 38, tertiaryVal: 12.4, quaternaryVal: 0, statusText: "Highway transit", locationNote: "Long Thanh Expressway" },
          { time: "02:00", hour: 2.0, primaryVal: 310, secondaryVal: 45, tertiaryVal: 58.1, quaternaryVal: 0, statusText: "Haulage running", locationNote: "QL1A Tien Giang" },
          { time: "03:00", hour: 3.0, primaryVal: 286, secondaryVal: 0, tertiaryVal: 104.5, quaternaryVal: 0, statusText: "Rest stop idling", locationNote: "Vinh Long Rest Area" },
          { time: "07:55", hour: 7.92, primaryVal: 281.8, secondaryVal: 0, tertiaryVal: 117.2, quaternaryVal: 0, statusText: "Engine off at depot", locationNote: "X. Nhi Long, Vinh Long" },
          { time: "15:00", hour: 15.0, primaryVal: 262, secondaryVal: 25, tertiaryVal: 122.69, quaternaryVal: 0, statusText: "Return journey", locationNote: "National Route 53" },
          { time: "17:30", hour: 17.5, primaryVal: 128, secondaryVal: 50, tertiaryVal: 195.2, quaternaryVal: 0, statusText: "Express haul", locationNote: "Ben Tre - QL60" },
          { time: "21:00", hour: 21.0, primaryVal: 69.5, secondaryVal: 0, tertiaryVal: 275.0, quaternaryVal: 0, statusText: "Arrived at port", locationNote: "Cat Lai Port Yard D" }
        ],
        historicalCalls: [
          { voyage: "Voyage 104S (Current)", date: "27/09/2026", totalQuantity: 1100, unit: "Liters", teuHandled: 1200, intensityLabel: "0.92 L/TEU", verified: true },
          { voyage: "Voyage 103S", date: "20/09/2026", totalQuantity: 1080, unit: "Liters", teuHandled: 1180, intensityLabel: "0.91 L/TEU", verified: true }
        ]
      }
    ]
  }
];

// ============================================================================
// MAIN COMPONENT: METER TELEMETRY MODAL
// ============================================================================
interface MeterTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssetId?: string;
}

export const MeterTelemetryModal: React.FC<MeterTelemetryModalProps> = ({
  isOpen,
  onClose,
  initialAssetId = "UC-01"
}) => {
  const safeAssetId = typeof initialAssetId === "string" && initialAssetId.trim().length > 0
    ? initialAssetId.trim()
    : "UC-01";

  // Determine matching port call based on safeAssetId (can be UC ID, invoiceNumber or meter ID)
  const initialPortCall = useMemo(() => {
    // 1. Direct match with useCaseId or invoiceNumber
    const matchCase = PORT_CALL_METERS.find(p => 
      p.useCaseId === safeAssetId || 
      p.invoiceNumber === safeAssetId
    );
    if (matchCase) return matchCase;

    // 2. Match with meter ID inside any port call
    const matchMeter = PORT_CALL_METERS.find(p => 
      p.meters.some(m => m.id === safeAssetId)
    );
    if (matchMeter) return matchMeter;

    return PORT_CALL_METERS[0];
  }, [safeAssetId]);

  const [selectedPortCallId, setSelectedPortCallId] = useState<string>(initialPortCall.useCaseId);
  const [showPortCallDropdown, setShowPortCallDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-Depth Single Meter Popup state: when set, popup is visible over the all-meters view
  const [inDepthMeter, setInDepthMeter] = useState<MeterDevice | null>(() => {
    // If safeAssetId matched a specific meter ID, open its in-depth popup directly
    const directMeter = initialPortCall.meters.find(m => m.id === safeAssetId);
    return directMeter || null;
  });

  const [scrubIndex, setScrubIndex] = useState<number>(3); // Index in telemetry array for scrubber

  // Synchronize when safeAssetId changes
  React.useEffect(() => {
    if (safeAssetId) {
      const matchCase = PORT_CALL_METERS.find(p => 
        p.useCaseId === safeAssetId || 
        p.invoiceNumber === safeAssetId
      );
      if (matchCase) {
        setSelectedPortCallId(matchCase.useCaseId);
        setInDepthMeter(null);
        return;
      }
      const matchMeterCase = PORT_CALL_METERS.find(p => 
        p.meters.some(m => m.id === safeAssetId)
      );
      if (matchMeterCase) {
        setSelectedPortCallId(matchMeterCase.useCaseId);
        const m = matchMeterCase.meters.find(item => item.id === safeAssetId);
        setInDepthMeter(m || null);
        setScrubIndex(2);
      }
    }
  }, [safeAssetId]);

  // Current Port Call Group
  const currentPortCall = useMemo(() => {
    return PORT_CALL_METERS.find(p => p.useCaseId === selectedPortCallId) || PORT_CALL_METERS[0];
  }, [selectedPortCallId]);

  if (!isOpen) return null;

  // Global SVG parameters for charts
  const svgWidth = 520;
  const svgHeight = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div 
        className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] my-4 relative"
        style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* ================================================================== */}
        {/* 1. TOP HEADER: PORT CALL TITLE & SUMMARY */}
        {/* ================================================================== */}
        <div className="bg-[#002D62] text-white px-5 py-3.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-300 border border-white/15">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                  {currentPortCall.useCaseId}
                </span>
                <h2 className="text-sm sm:text-base font-black tracking-tight">
                  All Meters in Invoice / Tổng quan Toàn bộ Đồng hồ Đo đạc
                </h2>
              </div>
              <p className="text-[11px] text-sky-200/80">
                {currentPortCall.vesselName} ({currentPortCall.voyageNumber}) · {currentPortCall.berth} · {currentPortCall.hotelingHours}h Stay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Toast Feedback Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* 2. PORT CALL SELECTOR & QUICK INVOICE TOTALS */}
        {/* ================================================================== */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 relative">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
              Port Call:
            </span>
            <div className="relative">
              <button
                onClick={() => setShowPortCallDropdown(!showPortCallDropdown)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 flex items-center gap-2 hover:bg-slate-100 shadow-2xs transition-colors"
              >
                <Ship className="w-3.5 h-3.5 text-[#002D62]" />
                <span>{currentPortCall.vesselName} · {currentPortCall.voyageNumber}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showPortCallDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-1 text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-100">
                    Switch Port Call / e-Invoice
                  </div>
                  {PORT_CALL_METERS.map((call) => (
                    <button
                      key={call.useCaseId}
                      onClick={() => {
                        setSelectedPortCallId(call.useCaseId);
                        setInDepthMeter(null);
                        setShowPortCallDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-slate-50 transition-colors ${
                        selectedPortCallId === call.useCaseId ? "bg-blue-50 text-[#002D62] font-bold" : "text-slate-700"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 mt-0.5">
                        {call.useCaseId}
                      </span>
                      <div>
                        <div className="font-bold text-xs">{call.vesselName} ({call.voyageNumber})</div>
                        <div className="text-[10px] text-slate-400">{call.berth}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Invoice Totals */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200 text-blue-900 font-semibold">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Electricity:</span>
              <strong className="font-mono">{currentPortCall.totalElectricityKwh.toLocaleString()} kWh</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-semibold">
              <Fuel className="w-3.5 h-3.5 text-amber-600" />
              <span>Fuel:</span>
              <strong className="font-mono">{currentPortCall.totalFuelLiters.toLocaleString()} Liters</strong>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-bold">
              <span>{currentPortCall.meters.length} Active Meters</span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. MAIN BODY: ALL METERS IN INVOICE GRID VIEW */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Synchronized Multi-Meter Energy & Fuel Suite ({currentPortCall.meters.length} Devices)
              </h3>
              <p className="text-xs text-slate-500">
                All physical metering points active during port stay {currentPortCall.vesselName} ({currentPortCall.invoiceNumber}). Click any meter&apos;s &quot;In-Depth Telemetry&quot; to inspect full interval curves and historical records.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Calibrated & Verified</span>
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPortCall.meters.map((meter) => {
              const isElec = meter.medium === "ELECTRICITY";
              const isFl = meter.medium === "FUEL";
              const isRf = meter.medium === "REEFER_THERMAL";
              const isBt = meter.medium === "BATTERY";

              const themeClr = isElec ? "#0284C7" : isFl ? "#D97706" : isRf ? "#0D9488" : "#8B5CF6";
              const badgeBg = isElec 
                ? "bg-blue-50 text-blue-800 border-blue-200" 
                : isFl 
                ? "bg-amber-50 text-amber-800 border-amber-200" 
                : isRf 
                ? "bg-teal-50 text-teal-800 border-teal-200" 
                : "bg-purple-50 text-purple-800 border-purple-200";

              // Generate mini SVG path
              const pts = meter.telemetry;
              const minH = pts[0]?.hour || 0;
              const maxH = pts[pts.length - 1]?.hour || 24;
              const hSpan = Math.max(1, maxH - minH);

              const miniCoords = pts.map(p => {
                const x = padLeft + ((p.hour - minH) / hSpan) * plotW;
                const y = padTop + plotH - (Math.min(p.primaryVal, meter.chartYMax) / meter.chartYMax) * plotH;
                return { x, y, point: p };
              });
              const polyStr = miniCoords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

              return (
                <div
                  key={meter.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-3 group"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeBg}`}>
                            {meter.category.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            {meter.id}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm group-hover:text-[#002D62] transition-colors">
                          {meter.name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Port Call Total:</span>
                        <strong className="text-base font-black font-mono text-slate-900">
                          {meter.totalPeriodRecorded.toLocaleString()} <span className="text-xs font-semibold text-slate-600">{meter.primaryUnit === "kW" ? "kWh" : "L"}</span>
                        </strong>
                      </div>
                    </div>

                    {/* Technical details strip */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] py-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Rating / Medium:</span>
                        <span className="font-semibold text-slate-800 font-mono truncate block" title={meter.nominalRating}>
                          {meter.nominalRating}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Protocol:</span>
                        <span className="font-semibold text-slate-800 font-mono truncate block" title={meter.protocol}>
                          {meter.protocol}
                        </span>
                      </div>
                    </div>

                    {/* Mini SVG Diagram preview */}
                    <div className="w-full h-24 bg-slate-50/70 rounded-xl p-2 border border-slate-100 relative select-none">
                      <div className="absolute top-1.5 right-2 text-[10px] font-mono text-slate-400 font-semibold">
                        Peak: {meter.chartYMax} {meter.primaryUnit}
                      </div>
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                        {/* Horizontal reference baseline */}
                        <line
                          x1={padLeft}
                          y1={padTop + plotH}
                          x2={padLeft + plotW}
                          y2={padTop + plotH}
                          stroke="#CBD5E1"
                          strokeWidth="1"
                        />
                        <polyline
                          points={polyStr}
                          fill="none"
                          stroke={themeClr}
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        {miniCoords.map((c, i) => (
                          <circle
                            key={i}
                            cx={c.x}
                            cy={c.y}
                            r="2"
                            fill={themeClr}
                          />
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* Card Action: IN-DEPTH POPUP TRIGGER */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {meter.historicalCalls.length} Historical calls tracked
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setInDepthMeter(meter);
                        setScrubIndex(Math.min(scrubIndex, meter.telemetry.length - 1));
                      }}
                      className="px-3.5 py-1.5 bg-[#002D62] hover:bg-[#002047] text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 group-hover:scale-[1.02]"
                    >
                      <Sliders className="w-3.5 h-3.5 text-sky-300" />
                      <span>In-Depth Telemetry</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* 4. MODAL FOOTER BAR */}
        {/* ================================================================== */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Telemetry verified against ISO 14083 & IMO DCS requirements. IEC 61850 MMS data integrity active.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setToastMessage(`Exported interval logs for all ${currentPortCall.meters.length} meters (${currentPortCall.invoiceNumber}) to CSV successfully.`);
                setTimeout(() => setToastMessage(null), 4000);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export All Meters CSV</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#002D62] hover:bg-[#002047] text-white font-bold text-xs transition-colors shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 5. IN-DEPTH SINGLE METER POPUP MODAL (NESTED POPUP OVERLAY) */}
        {/* ================================================================== */}
        {inDepthMeter && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[90vh] animate-in zoom-in-95">
              {/* In-Depth Popup Header */}
              {(() => {
                const isElec = inDepthMeter.medium === "ELECTRICITY";
                const isFl = inDepthMeter.medium === "FUEL";
                const isRf = inDepthMeter.medium === "REEFER_THERMAL";
                const isBt = inDepthMeter.medium === "BATTERY";

                const themeColor = isElec ? "#0284C7" : isFl ? "#D97706" : isRf ? "#0D9488" : "#8B5CF6";
                const gradStart = isElec ? "#38BDF8" : isFl ? "#FBBF24" : isRf ? "#2DD4BF" : "#A78BFA";

                const pts = inDepthMeter.telemetry;
                const minHour = pts[0]?.hour || 0;
                const maxHour = pts[pts.length - 1]?.hour || 24;
                const hourSpan = Math.max(1, maxHour - minHour);
                const maxY = inDepthMeter.chartYMax;

                const coordinates = pts.map(p => {
                  const x = padLeft + ((p.hour - minHour) / hourSpan) * plotW;
                  const y = padTop + plotH - (Math.min(p.primaryVal, maxY) / maxY) * plotH;
                  return { x, y, point: p };
                });

                const polylineStr = coordinates.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
                const firstPt = coordinates[0] || { x: padLeft, y: padTop + plotH };
                const lastPt = coordinates[coordinates.length - 1] || { x: padLeft + plotW, y: padTop + plotH };
                const polygonStr = `${firstPt.x.toFixed(1)},${(padTop + plotH).toFixed(1)} ${polylineStr} ${lastPt.x.toFixed(1)},${(padTop + plotH).toFixed(1)}`;

                const safeIdx = Math.min(Math.max(0, scrubIndex), pts.length - 1);
                const currentPt = pts[safeIdx] || pts[0];
                const activeCoord = coordinates[safeIdx] || firstPt;

                return (
                  <>
                    <div className="bg-[#002D62] text-white px-5 py-3.5 flex items-center justify-between shrink-0 select-none">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setInDepthMeter(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/15"
                          title="Back to All Meters"
                        >
                          <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                          <span>All Meters</span>
                        </button>
                        <div className="h-4 w-[1px] bg-white/20" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                              {inDepthMeter.id}
                            </span>
                            <h3 className="text-sm font-black tracking-tight truncate max-w-md">
                              {inDepthMeter.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-sky-200/80">
                            Detailed Physical Telemetry & Profile · {currentPortCall.vesselName} ({currentPortCall.voyageNumber})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInDepthMeter(null)}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                          title="Close In-Depth Popup"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Popup Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                      {/* Meter Metadata Strip */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              isElec ? "bg-blue-500 animate-pulse" :
                              isFl ? "bg-amber-500 animate-pulse" :
                              isRf ? "bg-teal-500 animate-pulse" : "bg-purple-500 animate-pulse"
                            }`} />
                            <h4 className="text-xs font-black text-slate-900 tracking-tight">
                              Device Specifications & Telemetry Description
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 max-w-2xl">
                            {inDepthMeter.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold self-start md:self-auto border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Rating / Medium:</span>
                            <strong className="text-slate-800 font-mono text-xs">{inDepthMeter.nominalRating}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Protocol:</span>
                            <strong className="text-slate-800 font-mono text-xs">{inDepthMeter.protocol}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Port Call Total:</span>
                            <strong className="text-slate-900 font-mono text-xs">{inDepthMeter.totalPeriodRecorded.toLocaleString()} {inDepthMeter.primaryUnit === "kW" ? "kWh" : "L"}</strong>
                          </div>
                        </div>
                      </div>

                      {/* HIGH-FIDELITY TIME-SERIES DIAGRAM CARD */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#002D62]" />
                            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                              Operational Time-Series Telemetry ({inDepthMeter.chartYUnit})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
                              <strong className="text-slate-800">{inDepthMeter.primaryUnit} Telemetry Curve</strong>
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <span>Duration: {currentPortCall.hotelingHours} Hours</span>
                            </span>
                          </div>
                        </div>

                        {/* SVG Time-Series Chart */}
                        <div className="w-full select-none relative">
                          <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-auto overflow-visible"
                          >
                            <defs>
                              <linearGradient id={`meterGrad-${inDepthMeter.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={gradStart} stopOpacity="0.75" />
                                <stop offset="100%" stopColor={themeColor} stopOpacity="0.10" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal Y-Grid lines and values */}
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

                            {/* Plot filled area polygon */}
                            <polygon
                              points={polygonStr}
                              fill={`url(#meterGrad-${inDepthMeter.id})`}
                            />

                            {/* Primary Curve Polyline */}
                            <polyline
                              points={polylineStr}
                              fill="none"
                              stroke={themeColor}
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                            />

                            {/* Data Points on Curve */}
                            {coordinates.map((c, i) => (
                              <circle
                                key={i}
                                cx={c.x}
                                cy={c.y}
                                r={i === scrubIndex ? "5" : "2.5"}
                                fill={i === scrubIndex ? "#FFFFFF" : themeColor}
                                stroke={i === scrubIndex ? themeColor : "#FFFFFF"}
                                strokeWidth="2"
                                className="cursor-pointer transition-all"
                                onClick={() => setScrubIndex(i)}
                              />
                            ))}

                            {/* Active Scrubber Vertical Line */}
                            <line
                              x1={activeCoord.x}
                              y1={padTop}
                              x2={activeCoord.x}
                              y2={padTop + plotH}
                              stroke="#0F172A"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />

                            {/* Scrubber Tooltip Badge */}
                            <g transform={`translate(${Math.min(activeCoord.x, padLeft + plotW - 75)}, ${Math.max(padTop + 10, activeCoord.y - 25)})`}>
                              <rect
                                x="-35"
                                y="-12"
                                width="70"
                                height="20"
                                rx="6"
                                fill="#0F172A"
                                className="shadow-md"
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

                            {/* X-axis Time Marks */}
                            {coordinates.map((c, i) => {
                              if (i % 2 !== 0 && i !== coordinates.length - 1) return null;
                              return (
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
                              );
                            })}
                          </svg>
                        </div>

                        {/* Scrubber Slider Control */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span className="font-semibold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              Interactive Interval Scrubber: <strong className="text-slate-900 font-mono">{currentPt.time}</strong>
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Step {scrubIndex + 1} of {pts.length} recorded intervals
                            </span>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max={pts.length - 1}
                            value={scrubIndex}
                            onChange={(e) => setScrubIndex(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002D62]"
                          />
                        </div>

                        {/* LIVE TELEMETRY READOUT CARDS (TAILORED TO PHYSICAL MEDIUM) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {isElec ? "Active Load (P):" : isFl ? "Instantaneous Flow:" : isRf ? "Cooling Demand:" : "PCS Output:"}
                            </span>
                            <strong className="text-lg font-black text-slate-900 font-mono">
                              {currentPt.primaryVal} <span className="text-xs">{inDepthMeter.primaryUnit}</span>
                            </strong>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                              Status: {currentPt.statusText}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {isElec ? "Bus Voltage:" : isFl ? "Line Pressure:" : isRf ? "Cold Core Temp:" : "Battery SOC:"}
                            </span>
                            <strong className="text-lg font-black text-slate-900 font-mono">
                              {currentPt.secondaryVal} <span className="text-xs">
                                {isElec ? "kV" : isFl ? "bar" : isRf ? "°C" : "%"}
                              </span>
                            </strong>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {isElec ? "Grid Phase Voltage" : isFl ? "Fuel Line Pressure" : isRf ? "Core Target -22°C" : "State of Charge"}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {isElec ? "Active Current (I):" : isFl ? "Fuel Temperature:" : isRf ? "Active Plugs:" : "Cell Temp:"}
                            </span>
                            <strong className="text-lg font-black text-slate-900 font-mono">
                              {currentPt.tertiaryVal} <span className="text-xs">
                                {isElec ? "Amps" : isFl ? "°C" : isRf ? "Units" : "°C"}
                              </span>
                            </strong>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {isElec ? "3-Phase RMS Current" : isFl ? "Fuel Density Guard" : isRf ? "Yard Plugs Online" : "Thermal Guard"}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {isElec ? "Power Factor (cos φ):" : isFl ? "Engine RPM / Speed:" : isRf ? "Temp Excursions:" : "Battery Health:"}
                            </span>
                            <strong className="text-lg font-black text-emerald-700 font-mono">
                              {currentPt.quaternaryVal} <span className="text-xs">
                                {isElec ? "cos φ" : isFl ? "RPM" : isRf ? "Alerts" : "% SOH"}
                              </span>
                            </strong>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                              {isElec ? "Nominal 50.0 Hz" : isFl ? "Marine Governor" : isRf ? "Zero Excursions" : "Cycle Count: 142"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* HISTORICAL PORT CALL COMPARISON FOR THIS EXACT METER */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[#002D62]" />
                            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                              Historical Usage Across Port Calls (Voyages)
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            Verified against Terminal Operating System (TOS)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          {inDepthMeter.historicalCalls.map((hist, idx) => (
                            <div
                              key={hist.voyage}
                              className={`p-3.5 rounded-xl border transition-all ${
                                idx === 0 
                                  ? "bg-blue-50/60 border-blue-300 shadow-2xs" 
                                  : "bg-slate-50/70 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className={`font-mono font-bold ${idx === 0 ? "text-blue-900" : "text-slate-700"}`}>
                                  {hist.voyage}
                                </span>
                                {hist.verified && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <div className="text-base font-black text-slate-900 font-mono">
                                {hist.totalQuantity.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{hist.unit}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-1 flex justify-between">
                                <span>Intensity:</span>
                                <strong className="font-mono text-slate-900">{hist.intensityLabel}</strong>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Date: {hist.date} · {hist.teuHandled.toLocaleString()} TEU
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Popup Footer */}
                    <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>IEC 61850 MMS / Coriolis NMEA Telemetry Record Certified</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setToastMessage(`Exported high-resolution telemetry log for meter ${inDepthMeter.id} to CSV successfully.`);
                            setTimeout(() => setToastMessage(null), 4000);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export Meter CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInDepthMeter(null)}
                          className="px-4 py-1.5 rounded-xl bg-[#002D62] hover:bg-[#002047] text-white font-bold text-xs transition-colors shadow-2xs"
                        >
                          Back to All Meters
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

