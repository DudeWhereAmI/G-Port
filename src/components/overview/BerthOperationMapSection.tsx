import React, { useState, useEffect, useMemo } from "react";
import {
  Ship,
  Play,
  Pause,
  RotateCcw,
  Radio,
  Clock,
  Zap,
  SunMedium,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  FileText,
  ArrowUpRight,
  Anchor,
  Navigation,
  Layers,
  Activity,
  X,
} from "lucide-react";
import { SubPageId } from "../../types/gport";
import { MeterModalMode } from "../MeterTelemetryModal";

// ============================================================================
// SYNCHRONIZED 24-HOUR FORECAST WINDOWS (100% identical to ForecastPage.tsx)
// ============================================================================
export type ScheduleExecutionPhase = "COMPLETED" | "IN_PROGRESS" | "UPCOMING";

export interface BerthForecastScheduleItem {
  id: string; // "00:00", "02:00", ..., "22:00"
  startHour: number;
  endHour: number;
  timeWindow: string;
  phase: ScheduleExecutionPhase;
  touBand: "OFF_PEAK" | "STANDARD" | "PEAK";
  touLabel: string;
  status: "OVERLOAD_WARNING" | "HIGH_SOLAR" | "NORMAL";
  actualKw: number | null; // null for UPCOMING windows that haven't completed
  lowBoundKw: number;
  expectedKw: number;
  highBoundKw: number;
  solarKw: number;
  netGridKw: number;
  overloadRiskPercent: number;
  vesselCode: string;
  vesselName: string;
  berth: string;
  geofenceId: "GF-B1" | "GF-B2" | "GF-B3" | "GF-ANCHOR";
  stsCranes: number;
  reeferPlugs: number;
  shorePowerKw: number;
  operationSummary: string;
  scheduledTasks: string[];
  linkedTelemetryEntityId: string; // VSL-01, VSL-02, VSL-03, STS-01, etc.
  linkedMeters: {
    id: string;
    label: string;
    entityId: string;
    kwOrFlow: string;
  }[];
  feeders: {
    f01StsKw: number;
    f02RtgKw: number;
    f03ReeferKw: number;
    f04OpsKw: number;
    f05EvBessKw: number;
    f06AuxKw: number;
  };
}

export const BERTH_24H_SCHEDULE: BerthForecastScheduleItem[] = [
  {
    id: "00:00",
    startHour: 0,
    endHour: 2,
    timeWindow: "00:00 – 02:00",
    phase: "COMPLETED",
    touBand: "OFF_PEAK",
    touLabel: "Off-Peak Rate",
    status: "NORMAL",
    actualKw: 2798.0,
    lowBoundKw: 2587,
    expectedKw: 2766.6,
    highBoundKw: 2987,
    solarKw: 0,
    netGridKw: 2767,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "MV TAN CANG GLORY",
    berth: "Berth B1 (Feeder Basin 500m)",
    geofenceId: "GF-B1",
    stsCranes: 2,
    reeferPlugs: 185,
    shorePowerKw: 480,
    operationSummary: "Finishing night cargo operations (2 Quay Cranes active at Berth B1)",
    scheduledTasks: [
      "Discharge final 320 domestic TEU from MV TAN CANG GLORY (Voyage 104S)",
      "Shuttle containers via TRK-2104 loop to Container Bay A1",
      "Maintain 480 kW Shore Power connection on Berth B1 substation",
    ],
    linkedTelemetryEntityId: "VSL-03",
    linkedMeters: [
      { id: "MTR-STS-B1-04", label: "Berth B1 Feeder Cranes", entityId: "STS-04", kwOrFlow: "840 kW" },
      { id: "MTR-BAY-A1-01", label: "Bay A1 e-RTG & Reefer", entityId: "BAY-A1", kwOrFlow: "420 kW" },
      { id: "MTR-BIO-B1-01", label: "TRK-2104 Biofuel Loop", entityId: "TRK-2104", kwOrFlow: "115 L/h" },
    ],
    feeders: { f01StsKw: 840, f02RtgKw: 420, f03ReeferKw: 680, f04OpsKw: 480, f05EvBessKw: 180, f06AuxKw: 167 },
  },
  {
    id: "02:00",
    startHour: 2,
    endHour: 4,
    timeWindow: "02:00 – 04:00",
    phase: "COMPLETED",
    touBand: "OFF_PEAK",
    touLabel: "Off-Peak Rate",
    status: "NORMAL",
    actualKw: 2693.5,
    lowBoundKw: 2565,
    expectedKw: 2745.2,
    highBoundKw: 2965,
    solarKw: 0,
    netGridKw: 2745,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "MV TAN CANG GLORY",
    berth: "Berth B1 (Feeder Basin 500m)",
    geofenceId: "GF-B1",
    stsCranes: 2,
    reeferPlugs: 180,
    shorePowerKw: 480,
    operationSummary: "Low-rate night window; EV fast-charging & export stowing at Berth B1",
    scheduledTasks: [
      "Complete 1,200 TEU lashing & hatch cover inspection on MV TAN CANG GLORY",
      "Off-peak EV tractor depot fast-charging (+315 kW) at 1,146 VND/kWh",
      "Prepare tugboat assist for 04:00 unberthing maneuver",
    ],
    linkedTelemetryEntityId: "VSL-03",
    linkedMeters: [
      { id: "MTR-STS-B1-04", label: "Berth B1 Feeder Cranes", entityId: "STS-04", kwOrFlow: "760 kW" },
      { id: "MTR-BAY-A1-01", label: "Bay A1 e-RTG & Reefer", entityId: "BAY-A1", kwOrFlow: "380 kW" },
    ],
    feeders: { f01StsKw: 760, f02RtgKw: 380, f03ReeferKw: 650, f04OpsKw: 480, f05EvBessKw: 315, f06AuxKw: 160 },
  },
  {
    id: "04:00",
    startHour: 4,
    endHour: 6,
    timeWindow: "04:00 – 06:00",
    phase: "COMPLETED",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "NORMAL",
    actualKw: 2460.8,
    lowBoundKw: 2310,
    expectedKw: 2489.5,
    highBoundKw: 2710,
    solarKw: 0,
    netGridKw: 2490,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-04",
    vesselName: "MV TAN CANG GLORY",
    berth: "Berth B1 → Outbound Channel",
    geofenceId: "GF-B1",
    stsCranes: 1,
    reeferPlugs: 175,
    shorePowerKw: 320,
    operationSummary: "MV TAN CANG GLORY departs Berth B1; morning shift handover",
    scheduledTasks: [
      "Disconnect OPS Shore Power & seal Berth B1 meter registers (#GPORT-INV-2026-0904)",
      "Unberth MV TAN CANG GLORY from Berth B1 out to main navigation channel",
      "Pre-position STS-01 & STS-02 cranes at Berth B2 (750m Container Quay)",
    ],
    linkedTelemetryEntityId: "VSL-03",
    linkedMeters: [
      { id: "MTR-STS-B1-04", label: "Berth B1 Feeder Cranes", entityId: "STS-04", kwOrFlow: "520 kW" },
      { id: "MTR-BIO-B1-01", label: "Berth B1 Tug & Tractor", entityId: "TRK-2104", kwOrFlow: "140 L/h" },
    ],
    feeders: { f01StsKw: 520, f02RtgKw: 340, f03ReeferKw: 640, f04OpsKw: 320, f05EvBessKw: 490, f06AuxKw: 180 },
  },
  {
    id: "06:00",
    startHour: 6,
    endHour: 8,
    timeWindow: "06:00 – 08:00",
    phase: "COMPLETED",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "NORMAL",
    actualKw: 2424.1,
    lowBoundKw: 2235,
    expectedKw: 2415.4,
    highBoundKw: 2635,
    solarKw: 52,
    netGridKw: 2363,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "MV SPIRIT OF MUMBAI",
    berth: "Berth B2 (Container Quay 750m)",
    geofenceId: "GF-B2",
    stsCranes: 2,
    reeferPlugs: 240,
    shorePowerKw: 620,
    operationSummary: "SPIRIT OF MUMBAI arrives at Berth B2; shore power connected",
    scheduledTasks: [
      "Tugboat escort from Breakwater (2090m) into Berth B2 (750m North Container Quay)",
      "Synchronize 6.6kV OPS Shore Power (MTR-OPS-CATLAI-B2) at 620 kW",
      "Commence Bay B2 container discharge with STS-01 & STS-02",
    ],
    linkedTelemetryEntityId: "VSL-01",
    linkedMeters: [
      { id: "MTR-OPS-CATLAI-B2", label: "Berth B2 OPS Shore Power", entityId: "VSL-01", kwOrFlow: "620 kW" },
      { id: "MTR-STS-B2-04", label: "Berth B2 STS-01/02 Cranes", entityId: "STS-01", kwOrFlow: "680 kW" },
    ],
    feeders: { f01StsKw: 680, f02RtgKw: 310, f03ReeferKw: 645, f04OpsKw: 620, f05EvBessKw: 0, f06AuxKw: 160 },
  },
  {
    id: "08:00",
    startHour: 8,
    endHour: 10,
    timeWindow: "08:00 – 10:00",
    phase: "COMPLETED",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "HIGH_SOLAR",
    actualKw: 3979.4,
    lowBoundKw: 3816,
    expectedKw: 3996.2,
    highBoundKw: 4216,
    solarKw: 887,
    netGridKw: 3109,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "MV SPIRIT OF MUMBAI",
    berth: "Berth B2 (Container Quay 750m)",
    geofenceId: "GF-B2",
    stsCranes: 4,
    reeferPlugs: 310,
    shorePowerKw: 750,
    operationSummary: "4 Quay Cranes working at Berth B2; reefer yard cooling demand rising",
    scheduledTasks: [
      "Ramp up 4 STS Cranes on MV SPIRIT OF MUMBAI (1,680 kW feeder load)",
      "Connect 70 new inbound reefer containers in Yard Bay B2 (310 plugs active)",
      "Solar PV self-consumption reaches 887 kW across CFS rooftops",
    ],
    linkedTelemetryEntityId: "STS-01",
    linkedMeters: [
      { id: "MTR-STS-B2-04", label: "Berth B2 STS-01/02 Cranes", entityId: "STS-01", kwOrFlow: "1,680 kW" },
      { id: "MTR-RF-Y3-02", label: "Bay B2 Reefer Racks", entityId: "BAY-B2", kwOrFlow: "786 kW" },
      { id: "MTR-TRK-088", label: "TRK-2481 / TRK-2205 Fleet", entityId: "TRK-2481", kwOrFlow: "195 L/h" },
    ],
    feeders: { f01StsKw: 1680, f02RtgKw: 620, f03ReeferKw: 786, f04OpsKw: 750, f05EvBessKw: 0, f06AuxKw: 160 },
  },
  {
    id: "10:00",
    startHour: 10,
    endHour: 12,
    timeWindow: "10:00 – 12:00",
    phase: "COMPLETED",
    touBand: "PEAK",
    touLabel: "Peak Rate",
    status: "HIGH_SOLAR",
    actualKw: 4199.7,
    lowBoundKw: 3965,
    expectedKw: 4144.5,
    highBoundKw: 4365,
    solarKw: 1616,
    netGridKw: 2528,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "MV SPIRIT OF MUMBAI",
    berth: "Berth B2 (Container Quay 750m)",
    geofenceId: "GF-B2",
    stsCranes: 4,
    reeferPlugs: 325,
    shorePowerKw: 760,
    operationSummary: "Morning peak electricity rate; Solar panels cover 1,616 kW",
    scheduledTasks: [
      "Peak tariff window (3,076 VND/kWh): offset 39% of terminal load via 1,616 kW Solar PV",
      "Continuous twin-lift unloading on MV SPIRIT OF MUMBAI (52% TEU progress)",
      "MV ONE APUS enters Anchorage Geofence (Bến Phao) awaiting pilot boarding",
    ],
    linkedTelemetryEntityId: "VSL-01",
    linkedMeters: [
      { id: "MTR-OPS-CATLAI-B2", label: "Berth B2 OPS Shore Power", entityId: "VSL-01", kwOrFlow: "760 kW" },
      { id: "MTR-STS-B2-04", label: "Berth B2 STS-01/02 Cranes", entityId: "STS-01", kwOrFlow: "1,740 kW" },
      { id: "MTR-RF-Y3-02", label: "Bay B2 Reefer Racks", entityId: "BAY-B2", kwOrFlow: "824 kW" },
    ],
    feeders: { f01StsKw: 1740, f02RtgKw: 660, f03ReeferKw: 824, f04OpsKw: 760, f05EvBessKw: 0, f06AuxKw: 160 },
  },
  {
    id: "12:00",
    startHour: 12,
    endHour: 14,
    timeWindow: "12:00 – 14:00",
    phase: "IN_PROGRESS",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "HIGH_SOLAR",
    actualKw: 4008.4,
    lowBoundKw: 3823,
    expectedKw: 4003.3,
    highBoundKw: 4223,
    solarKw: 1880,
    netGridKw: 2124,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01",
    vesselName: "MV SPIRIT OF MUMBAI",
    berth: "Berth B2 (Container Quay 750m)",
    geofenceId: "GF-B2",
    stsCranes: 4,
    reeferPlugs: 330,
    shorePowerKw: 750,
    operationSummary: "Solar power reaches daily high (1,880 kW); MV ONE APUS approaching Berth B3",
    scheduledTasks: [
      "Solar PV peak generation (1,880 kW) cuts net EVN grid draw to 2,124 kW",
      "MV SPIRIT OF MUMBAI reaches 68% turnaround (1,640 / 2,400 TEU handled)",
      "Pilot & 2 azimuth tugs escorting MV ONE APUS from Bến Phao to Berth B3 (900m Quay)",
    ],
    linkedTelemetryEntityId: "VSL-01",
    linkedMeters: [
      { id: "MTR-OPS-CATLAI-B2", label: "Berth B2 OPS Shore Power", entityId: "VSL-01", kwOrFlow: "750 kW" },
      { id: "MTR-STS-B2-04", label: "Berth B2 STS Cranes", entityId: "STS-01", kwOrFlow: "1,580 kW" },
      { id: "MTR-RF-Y3-02", label: "Bay B2 Reefer Racks", entityId: "BAY-B2", kwOrFlow: "883 kW" },
      { id: "MTR-TRK-088", label: "TRK-2481 Yard Shuttle", entityId: "TRK-2481", kwOrFlow: "210 L/h" },
    ],
    feeders: { f01StsKw: 1580, f02RtgKw: 590, f03ReeferKw: 883, f04OpsKw: 750, f05EvBessKw: 40, f06AuxKw: 160 },
  },
  {
    id: "14:00",
    startHour: 14,
    endHour: 16,
    timeWindow: "14:00 – 16:00",
    phase: "IN_PROGRESS",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "OVERLOAD_WARNING",
    actualKw: 8144.4,
    lowBoundKw: 7971,
    expectedKw: 8151.0,
    highBoundKw: 8371,
    solarKw: 1612,
    netGridKw: 6539,
    overloadRiskPercent: 2.1,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 (750m) & Berth B3 (900m)",
    geofenceId: "GF-B3",
    stsCranes: 5,
    reeferPlugs: 465,
    shorePowerKw: 1480,
    operationSummary: "OVERLOAD ALERT: 2 large ships running 5 Quay Cranes + Shore Power (8,151 kW)",
    scheduledTasks: [
      "MV ONE APUS moors at Berth B3 (900m Deep-Draft Quay) & connects 730 kW Shore Power",
      "Simultaneous 5 STS Quay Cranes (STS-01, STS-02, STS-03+) draw 3,420 kW on F-01",
      "Total demand hits 8,151 kW (>8,000 kW Substation Limit) — Crane Regen & Smart Load Control armed",
    ],
    linkedTelemetryEntityId: "VSL-02",
    linkedMeters: [
      { id: "MTR-OPS-B3-01", label: "Berth B3 OPS Shore Power", entityId: "VSL-02", kwOrFlow: "730 kW" },
      { id: "MTR-STS-B3-03", label: "Berth B3 STS-03 Gantt", entityId: "STS-03", kwOrFlow: "1,680 kW" },
      { id: "MTR-RF-R1-01", label: "Reefer Bay R1 Rack", entityId: "BAY-R1", kwOrFlow: "578 kW" },
      { id: "MTR-TRK-B3-01", label: "TRK-2319 Berth B3 Loop", entityId: "TRK-2319", kwOrFlow: "175 L/h" },
    ],
    feeders: { f01StsKw: 3420, f02RtgKw: 1410, f03ReeferKw: 1461, f04OpsKw: 1480, f05EvBessKw: 200, f06AuxKw: 180 },
  },
  {
    id: "16:00",
    startHour: 16,
    endHour: 18,
    timeWindow: "16:00 – 18:00",
    phase: "UPCOMING",
    touBand: "STANDARD",
    touLabel: "Normal Rate",
    status: "OVERLOAD_WARNING",
    actualKw: null,
    lowBoundKw: 7849,
    expectedKw: 8028.7,
    highBoundKw: 8249,
    solarKw: 883,
    netGridKw: 7146,
    overloadRiskPercent: 0.3,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 (750m) & Berth B3 (900m)",
    geofenceId: "GF-B3",
    stsCranes: 5,
    reeferPlugs: 480,
    shorePowerKw: 1490,
    operationSummary: "OVERLOAD ALERT: Heavy dual-ship crane work & 480 reefer containers (8,029 kW)",
    scheduledTasks: [
      "Peak reefer plug occupancy (480 plugs across Bay B2 & Reefer Bay R1 = 1,458 kW)",
      "Continue 5 STS Crane dual-vessel discharge as afternoon solar drops to 883 kW",
      "Crane Regen & Reefer pre-cooling check before 17:00 EVN Peak Tariff window",
    ],
    linkedTelemetryEntityId: "VSL-02",
    linkedMeters: [
      { id: "MTR-STS-B3-03", label: "Berth B3 STS-03 Crane", entityId: "STS-03", kwOrFlow: "1,660 kW est." },
      { id: "MTR-RF-R1-01", label: "Reefer Bay R1 Sub-Meter", entityId: "BAY-R1", kwOrFlow: "620 kW est." },
    ],
    feeders: { f01StsKw: 3340, f02RtgKw: 1380, f03ReeferKw: 1458, f04OpsKw: 1490, f05EvBessKw: 180, f06AuxKw: 180 },
  },
  {
    id: "18:00",
    startHour: 18,
    endHour: 20,
    timeWindow: "18:00 – 20:00",
    phase: "UPCOMING",
    touBand: "PEAK",
    touLabel: "Peak Rate",
    status: "NORMAL",
    actualKw: null,
    lowBoundKw: 6490,
    expectedKw: 6688.9,
    highBoundKw: 6909,
    solarKw: 52,
    netGridKw: 6637,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 (750m) & Berth B3 (900m)",
    geofenceId: "GF-B2",
    stsCranes: 5,
    reeferPlugs: 450,
    shorePowerKw: 1420,
    operationSummary: "Evening shift change; solar power ends for the day; Crane Regen & Smart Load Control active",
    scheduledTasks: [
      "EVN Evening Peak Tariff (3,076 VND/kWh): Crane Regen & Smart Load Control recovers 600 kW to cap grid draw",
      "Final export container loading onto MV SPIRIT OF MUMBAI at Berth B2",
      "MV HAI AN TIME (Voyage 092N) scheduled to enter Anchorage waiting zone (GF-ANCHOR)",
    ],
    linkedTelemetryEntityId: "VSL-01",
    linkedMeters: [
      { id: "MTR-OPS-CATLAI-B2", label: "Berth B2 OPS Shore Power", entityId: "VSL-01", kwOrFlow: "700 kW est." },
      { id: "MTR-OPS-B3-01", label: "Berth B3 OPS Shore Power", entityId: "VSL-02", kwOrFlow: "720 kW est." },
    ],
    feeders: { f01StsKw: 2790, f02RtgKw: 1120, f03ReeferKw: 1169, f04OpsKw: 1420, f05EvBessKw: 0, f06AuxKw: 190 },
  },
  {
    id: "20:00",
    startHour: 20,
    endHour: 22,
    timeWindow: "20:00 – 22:00",
    phase: "UPCOMING",
    touBand: "PEAK",
    touLabel: "Peak Rate",
    status: "NORMAL",
    actualKw: null,
    lowBoundKw: 5970,
    expectedKw: 6149.7,
    highBoundKw: 6370,
    solarKw: 0,
    netGridKw: 6150,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-01 + UC-02",
    vesselName: "ONE APUS & SPIRIT OF MUMBAI",
    berth: "Berth B2 (750m) & Berth B3 (900m)",
    geofenceId: "GF-B2",
    stsCranes: 4,
    reeferPlugs: 430,
    shorePowerKw: 1380,
    operationSummary: "Steady night container unloading across 2 ships; preparing Berth B2 departure",
    scheduledTasks: [
      "Complete 2,400 TEU manifest on MV SPIRIT OF MUMBAI; stow STS-01 boom at 21:30",
      "Steady deep-sea discharge on MV ONE APUS at Berth B3 with 3 Quay Cranes",
      "Pre- departure meter verification for Berth B2 OPS & STS sub-meters",
    ],
    linkedTelemetryEntityId: "VSL-01",
    linkedMeters: [
      { id: "MTR-STS-B2-04", label: "Berth B2 STS-01/02 Cranes", entityId: "STS-01", kwOrFlow: "920 kW est." },
      { id: "MTR-STS-B3-03", label: "Berth B3 STS-03 Crane", entityId: "STS-03", kwOrFlow: "1,560 kW est." },
    ],
    feeders: { f01StsKw: 2480, f02RtgKw: 1020, f03ReeferKw: 1080, f04OpsKw: 1380, f05EvBessKw: 0, f06AuxKw: 190 },
  },
  {
    id: "22:00",
    startHour: 22,
    endHour: 24,
    timeWindow: "22:00 – 24:00",
    phase: "UPCOMING",
    touBand: "OFF_PEAK",
    touLabel: "Off-Peak Rate",
    status: "NORMAL",
    actualKw: null,
    lowBoundKw: 4380,
    expectedKw: 4559.8,
    highBoundKw: 4780,
    solarKw: 0,
    netGridKw: 4560,
    overloadRiskPercent: 0.0,
    vesselCode: "UC-02",
    vesselName: "MV ONE APUS",
    berth: "Berth B3 (Container Quay 900m)",
    geofenceId: "GF-B3",
    stsCranes: 3,
    reeferPlugs: 390,
    shorePowerKw: 980,
    operationSummary: "SPIRIT OF MUMBAI departs Berth B2; off-peak electricity rate begins",
    scheduledTasks: [
      "Unberth MV SPIRIT OF MUMBAI from Berth B2 along outbound fairway channel",
      "MV ONE APUS continues overnight unloading at Berth B3 (3 STS Cranes, 980 kW OPS)",
      "Switch EV Tractor Fast-Charging Hub to Off-Peak night tariff mode (1,146 VND/kWh)",
    ],
    linkedTelemetryEntityId: "VSL-02",
    linkedMeters: [
      { id: "MTR-OPS-B3-01", label: "Berth B3 OPS Shore Power", entityId: "VSL-02", kwOrFlow: "980 kW est." },
      { id: "MTR-STS-B3-03", label: "Berth B3 STS-03 Crane", entityId: "STS-03", kwOrFlow: "1,680 kW est." },
      { id: "MTR-RF-R1-01", label: "Reefer Bay R1 Rack", entityId: "BAY-R1", kwOrFlow: "920 kW est." },
    ],
    feeders: { f01StsKw: 1680, f02RtgKw: 740, f03ReeferKw: 920, f04OpsKw: 980, f05EvBessKw: 60, f06AuxKw: 180 },
  },
];

// ============================================================================
// GEOFENCE ZONES (Modeled on Masterplan Diagram: Container 750m/900m, Feeder 500m, Anchorage 2090m)
// ============================================================================
interface GeofenceZone {
  id: "GF-B1" | "GF-B2" | "GF-B3" | "GF-ANCHOR";
  code: string;
  name: string;
  vietnameseSub: string;
  dimensionsLabel: string;
  polygonPoints: string;
  labelX: number;
  labelY: number;
  baseColor: string;
  linkedEntityId: string;
}

const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: "GF-B1",
    code: "BERTH B1",
    name: "Inland & Feeder Basin",
    vietnameseSub: "Khu bến thủy nội địa · Bay A1",
    dimensionsLabel: "500 m × 300 m",
    polygonPoints: "145,140 315,215 265,325 105,250",
    labelX: 205,
    labelY: 225,
    baseColor: "#0D9488",
    linkedEntityId: "VSL-03",
  },
  {
    id: "GF-B2",
    code: "BERTH B2",
    name: "North Container Quay",
    vietnameseSub: "Khu bến container Bắc · Bay B2",
    dimensionsLabel: "750 m Quay",
    polygonPoints: "430,52 575,118 492,265 348,198",
    labelX: 465,
    labelY: 155,
    baseColor: "#0284C7",
    linkedEntityId: "VSL-01",
  },
  {
    id: "GF-B3",
    code: "BERTH B3",
    name: "South Deep-Sea Container Quay",
    vietnameseSub: "Khu bến container Nam · Bay R1",
    dimensionsLabel: "900 m Quay",
    polygonPoints: "342,208 488,274 392,445 248,378",
    labelX: 368,
    labelY: 326,
    baseColor: "#2563EB",
    linkedEntityId: "VSL-02",
  },
  {
    id: "GF-ANCHOR",
    code: "ANCHORAGE",
    name: "Breakwater & Mooring Buoys",
    vietnameseSub: "Đê chắn sóng 2090m · Bến phao chờ bến",
    dimensionsLabel: "2,090 m Breakwater",
    polygonPoints: "595,88 865,245 775,435 525,285",
    labelX: 695,
    labelY: 268,
    baseColor: "#D97706",
    linkedEntityId: "VSL-02",
  },
];

// ============================================================================
// VESSEL AIS TRAJECTORY & POSITION COMPUTATION ACROSS 24 HOURS (0..24h)
// ============================================================================
interface ComputedVesselAIS {
  id: string;
  vesselName: string;
  voyage: string;
  imo: string;
  stateLabel: "BERTHED_WORKING" | "ARRIVING_PILOT" | "WAITING_ANCHOR" | "DEPARTING" | "COMPLETED_SAILED";
  stateBadgeText: string;
  color: string;
  x: number;
  y: number;
  headingDeg: number;
  speedKnots: string;
  berthLabel: string;
  teuProgress: string;
  powerKwLabel: string;
  traveledPathD: string; // Solid line (Google Maps style traveled route)
  plannedPathD: string; // Dashed line (Google Maps style projected route)
  linkedTelemetryEntityId: string;
  linkedWindowId: string;
}

function interpolatePt(
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  return [
    p1[0] + (p2[0] - p1[0]) * clamped,
    p1[1] + (p2[1] - p1[1]) * clamped,
  ];
}

function computeVesselsAtHour(hour24: number): ComputedVesselAIS[] {
  // 1. MV TAN CANG GLORY (VSL-03):
  // 00:00 - 04:00: Working at Berth B1 (272, 268, heading 116 deg)
  // 04:00 - 06:30: Departing Berth B1 -> Turning Basin (318, 395) -> Fairway Exit (475, 505)
  // > 06:30: Sailed / Anchored at outer buoy marker (525, 495)
  const b1BerthPt: [number, number] = [258, 265];
  const b1TurnPt: [number, number] = [310, 395];
  const b1ExitPt: [number, number] = [485, 502];

  let v3Pos: [number, number] = b1BerthPt;
  let v3Heading = 115;
  let v3State: ComputedVesselAIS["stateLabel"] = "BERTHED_WORKING";
  let v3Badge = "Working at Berth B1";
  let v3Speed = "0.0 kn (Moored)";
  let v3Color = "#0D9488";
  let v3Traveled = `M 485 502 L 310 395 L 258 265`;
  let v3Planned = `M 258 265 L 310 395 L 485 502`;

  if (hour24 < 4) {
    v3Pos = b1BerthPt;
    v3Heading = 115;
    v3State = "BERTHED_WORKING";
    v3Badge = "Working · Berth B1";
    v3Speed = "0.0 kn · OPS 480 kW";
    v3Color = "#0D9488";
    v3Traveled = `M 310 395 L 258 265`;
    v3Planned = `M 258 265 L 310 395 L 485 502`;
  } else if (hour24 >= 4 && hour24 <= 6.5) {
    const progress = (hour24 - 4) / 2.5;
    if (progress < 0.5) {
      v3Pos = interpolatePt(b1BerthPt, b1TurnPt, progress * 2);
      v3Heading = 158;
    } else {
      v3Pos = interpolatePt(b1TurnPt, b1ExitPt, (progress - 0.5) * 2);
      v3Heading = 122;
    }
    v3State = "DEPARTING";
    v3Badge = "Departing Berth B1";
    v3Speed = "6.4 kn · Unberthing";
    v3Color = "#F59E0B";
    v3Traveled = `M 258 265 L ${v3Pos[0].toFixed(0)} ${v3Pos[1].toFixed(0)}`;
    v3Planned = `M ${v3Pos[0].toFixed(0)} ${v3Pos[1].toFixed(0)} L 485 502`;
  } else {
    v3Pos = b1ExitPt;
    v3Heading = 125;
    v3State = "COMPLETED_SAILED";
    v3Badge = "Completed & Sailed (04:00)";
    v3Speed = "11.2 kn · Outbound";
    v3Color = "#64748B";
    v3Traveled = `M 258 265 L 310 395 L 485 502`;
    v3Planned = "";
  }

  // 2. MV SPIRIT OF MUMBAI (VSL-01):
  // 00:00 - 05:30: Waiting at Anchorage Buoy #1 (690, 235)
  // 05:30 - 07:00: Approaching Berth B2 (512, 182)
  // 07:00 - 22:00: Working at Berth B2 (512, 182, heading -62 deg / 298 deg)
  // 22:00 - 24:00: Departing Berth B2 -> Fairway (620, 465)
  const v1AnchorPt: [number, number] = [685, 225];
  const v1ChannelPt: [number, number] = [595, 215];
  const v1BerthPt: [number, number] = [516, 184];
  const v1ExitPt: [number, number] = [565, 485];

  let v1Pos: [number, number] = v1BerthPt;
  let v1Heading = -62;
  let v1State: ComputedVesselAIS["stateLabel"] = "BERTHED_WORKING";
  let v1Badge = "Working · Berth B2";
  let v1Speed = "0.0 kn · 4 STS Cranes";
  let v1Color = "#0284C7";
  let v1Traveled = `M 685 225 L 595 215 L 516 184`;
  let v1Planned = `M 516 184 L 460 360 L 565 485`;

  if (hour24 < 5.5) {
    v1Pos = v1AnchorPt;
    v1Heading = -145;
    v1State = "WAITING_ANCHOR";
    v1Badge = "Waiting · Bến Phao #1";
    v1Speed = "0.2 kn · At Anchor";
    v1Color = "#D97706";
    v1Traveled = `M 760 280 L 685 225`;
    v1Planned = `M 685 225 L 595 215 L 516 184`;
  } else if (hour24 >= 5.5 && hour24 < 7.0) {
    const t = (hour24 - 5.5) / 1.5;
    v1Pos = interpolatePt(v1AnchorPt, v1BerthPt, t);
    v1Heading = -155;
    v1State = "ARRIVING_PILOT";
    v1Badge = "Berthing → Berth B2";
    v1Speed = "4.8 kn · Tug Assist";
    v1Color = "#2563EB";
    v1Traveled = `M 685 225 L ${v1Pos[0].toFixed(0)} ${v1Pos[1].toFixed(0)}`;
    v1Planned = `M ${v1Pos[0].toFixed(0)} ${v1Pos[1].toFixed(0)} L 516 184`;
  } else if (hour24 >= 7.0 && hour24 < 22.0) {
    v1Pos = v1BerthPt;
    v1Heading = -62;
    v1State = "BERTHED_WORKING";
    v1Badge = "Operating · Berth B2";
    v1Speed = "0.0 kn · OPS 750 kW";
    v1Color = "#0284C7";
    v1Traveled = `M 685 225 L 595 215 L 516 184`;
    v1Planned = `M 516 184 L 455 375 L 565 485`;
  } else {
    const t = (hour24 - 22.0) / 2.0;
    v1Pos = interpolatePt(v1BerthPt, v1ExitPt, t);
    v1Heading = 148;
    v1State = "DEPARTING";
    v1Badge = "Departing Berth B2";
    v1Speed = "6.8 kn · Outbound";
    v1Color = "#F59E0B";
    v1Traveled = `M 516 184 L ${v1Pos[0].toFixed(0)} ${v1Pos[1].toFixed(0)}`;
    v1Planned = `M ${v1Pos[0].toFixed(0)} ${v1Pos[1].toFixed(0)} L 565 485`;
  }

  // 3. MV ONE APUS (VSL-02):
  // 00:00 - 12:30: Waiting at Anchorage Bến Phao #2 (745, 315)
  // 12:30 - 14:00: Pilotage approach from Bến Phao (745, 315) -> Channel (555, 425) -> Berth B3 (428, 354)
  // 14:00 - 24:00: Berthed & Operating at Berth B3 (428, 354, heading -62 deg)
  const v2AnchorPt: [number, number] = [742, 318];
  const v2TurnPt: [number, number] = [545, 415];
  const v2BerthPt: [number, number] = [432, 352];

  let v2Pos: [number, number] = v2BerthPt;
  let v2Heading = -62;
  let v2State: ComputedVesselAIS["stateLabel"] = "BERTHED_WORKING";
  let v2Badge = "Operating · Berth B3";
  let v2Speed = "0.0 kn · OPS 730 kW";
  let v2Color = "#2563EB";
  let v2Traveled = `M 742 318 L 545 415 L 432 352`;
  let v2Planned = `M 432 352 L 545 495`;

  if (hour24 < 12.2) {
    v2Pos = v2AnchorPt;
    v2Heading = -148;
    v2State = "WAITING_ANCHOR";
    v2Badge = "Waiting · Bến Phao #2";
    v2Speed = "0.3 kn · Scheduled 14:00";
    v2Color = "#D97706";
    v2Traveled = `M 820 370 L 742 318`;
    v2Planned = `M 742 318 L 545 415 L 432 352`;
  } else if (hour24 >= 12.2 && hour24 < 14.0) {
    const t = (hour24 - 12.2) / 1.8;
    if (t < 0.55) {
      v2Pos = interpolatePt(v2AnchorPt, v2TurnPt, t / 0.55);
      v2Heading = -152;
    } else {
      v2Pos = interpolatePt(v2TurnPt, v2BerthPt, (t - 0.55) / 0.45);
      v2Heading = -62;
    }
    v2State = "ARRIVING_PILOT";
    v2Badge = "Approaching Berth B3";
    v2Speed = "5.2 kn · 2 Tugs Escort";
    v2Color = "#2563EB";
    v2Traveled = `M 742 318 L ${v2Pos[0].toFixed(0)} ${v2Pos[1].toFixed(0)}`;
    v2Planned = `M ${v2Pos[0].toFixed(0)} ${v2Pos[1].toFixed(0)} L 432 352`;
  } else {
    v2Pos = v2BerthPt;
    v2Heading = -62;
    v2State = "BERTHED_WORKING";
    v2Badge =
      hour24 >= 14 && hour24 < 18
        ? "Operating · Berth B3 (Overload Window)"
        : "Operating · Berth B3";
    v2Speed = "0.0 kn · 3 STS Cranes";
    v2Color = hour24 >= 14 && hour24 < 18 ? "#D97706" : "#10B981";
    v2Traveled = `M 742 318 L 545 415 L 432 352`;
    v2Planned = `M 432 352 L 545 495`;
  }

  return [
    {
      id: "AIS-VSL-01",
      vesselName: "MV SPIRIT OF MUMBAI",
      voyage: "402W",
      imo: "9811012",
      stateLabel: v1State,
      stateBadgeText: v1Badge,
      color: v1Color,
      x: v1Pos[0],
      y: v1Pos[1],
      headingDeg: v1Heading,
      speedKnots: v1Speed,
      berthLabel: "Berth B2 (750m North Container Quay)",
      teuProgress: "1,640 / 2,400 TEU (68%)",
      powerKwLabel: "2,330 kW (OPS + STS-01/02)",
      traveledPathD: v1Traveled,
      plannedPathD: v1Planned,
      linkedTelemetryEntityId: "VSL-01",
      linkedWindowId: hour24 < 12 ? "10:00" : hour24 < 14 ? "12:00" : "14:00",
    },
    {
      id: "AIS-VSL-02",
      vesselName: "MV ONE APUS",
      voyage: "029E",
      imo: "9806079",
      stateLabel: v2State,
      stateBadgeText: v2Badge,
      color: v2Color,
      x: v2Pos[0],
      y: v2Pos[1],
      headingDeg: v2Heading,
      speedKnots: v2Speed,
      berthLabel: "Berth B3 (900m Deep-Sea Container Quay)",
      teuProgress: hour24 < 14 ? "3,200 TEU (Inbound)" : "1,120 / 3,200 TEU (35%)",
      powerKwLabel: hour24 < 14 ? "420 kW (Tug Escort)" : "2,988 kW (OPS + 3 STS)",
      traveledPathD: v2Traveled,
      plannedPathD: v2Planned,
      linkedTelemetryEntityId: "VSL-02",
      linkedWindowId: hour24 < 14 ? "12:00" : hour24 < 18 ? "14:00" : "20:00",
    },
    {
      id: "AIS-VSL-03",
      vesselName: "MV TAN CANG GLORY",
      voyage: "104S",
      imo: "9528114",
      stateLabel: v3State,
      stateBadgeText: v3Badge,
      color: v3Color,
      x: v3Pos[0],
      y: v3Pos[1],
      headingDeg: v3Heading,
      speedKnots: v3Speed,
      berthLabel: "Berth B1 (500m Feeder Basin)",
      teuProgress: "1,200 / 1,200 TEU (100%)",
      powerKwLabel: hour24 < 6 ? "1,320 kW (Completed)" : "Sealed (#GPORT-INV-0904)",
      traveledPathD: v3Traveled,
      plannedPathD: v3Planned,
      linkedTelemetryEntityId: "VSL-03",
      linkedWindowId: "02:00",
    },
  ];
}

interface BerthOperationMapSectionProps {
  onNavigate: (page: SubPageId) => void;
  onOpenMeterModal: (assetId?: string, mode?: MeterModalMode) => void;
  onTraceEntityInTelemetry: (
    entityId: string,
    popupMode?: "TURNAROUND" | "BREAKDOWN"
  ) => void;
  onInspectForecastWindow: (windowId: string, openReport?: boolean) => void;
}

export const BerthOperationMapSection: React.FC<
  BerthOperationMapSectionProps
> = ({
  onOpenMeterModal,
  onTraceEntityInTelemetry,
  onInspectForecastWindow,
}) => {
  // Simulation Mode: "LIVE" (runs continuously around current operational window 13.8h–15.5h) or "REPLAY_24H" (00:00 -> 24:00)
  const [simMode, setSimMode] = useState<"LIVE" | "REPLAY_24H">("LIVE");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  // Hour on 0..24 scale. Default live operation starts at 13.6h (showing ONE APUS docking & overload window transition)
  const [simHour, setSimHour] = useState<number>(13.6);

  // Selected Geofence / Vessel on the Map
  const [selectedVesselId, setSelectedVesselId] = useState<string>("AIS-VSL-02");
  const [selectedScheduleItem, setSelectedScheduleItem] =
    useState<BerthForecastScheduleItem | null>(null);
  const [activePhaseTab, setActivePhaseTab] = useState<
    "ALL" | ScheduleExecutionPhase
  >("ALL");

  // Continuous Real-Time / 24h Replay Animation Loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = 80;
    const timer = setInterval(() => {
      setSimHour((prev) => {
        if (simMode === "LIVE") {
          // In LIVE mode, smoothly oscillate through the active 12:30 – 15:45 operational window so ships & cranes visibly move in real time
          const next = prev + 0.018 * playbackSpeed;
          return next > 15.8 ? 12.3 : next;
        } else {
          // In 24H REPLAY mode, sweep across the full 24h day (00:00 -> 24:00)
          const next = prev + 0.06 * playbackSpeed;
          return next >= 24 ? 0 : next;
        }
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, simMode]);

  // Active 2-hour window matching current simHour
  const activeWindow = useMemo(() => {
    const matched = BERTH_24H_SCHEDULE.find(
      (w) => simHour >= w.startHour && simHour < w.endHour
    );
    return matched || BERTH_24H_SCHEDULE[7]; // 14:00 default
  }, [simHour]);

  const vesselsAIS = useMemo(() => computeVesselsAtHour(simHour), [simHour]);

  const selectedVessel = useMemo(
    () =>
      vesselsAIS.find((v) => v.id === selectedVesselId) || vesselsAIS[0],
    [vesselsAIS, selectedVesselId]
  );

  // Formatted clock HH:MM
  const formattedClock = useMemo(() => {
    const hrs = Math.floor(simHour) % 24;
    const mins = Math.floor((simHour - Math.floor(simHour)) * 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }, [simHour]);

  // Consistent 24-Hour Load Forecast Summary Totals (matching ForecastPage.tsx)
  const completedItems = useMemo(
    () => BERTH_24H_SCHEDULE.filter((i) => i.phase === "COMPLETED"),
    []
  );
  const inProgressItems = useMemo(
    () => BERTH_24H_SCHEDULE.filter((i) => i.phase === "IN_PROGRESS"),
    []
  );
  const upcomingItems = useMemo(
    () => BERTH_24H_SCHEDULE.filter((i) => i.phase === "UPCOMING"),
    []
  );

  // Energy (MWh) = sum(expectedKw * 2h) / 1000
  const completedEnergyMwh = useMemo(
    () =>
      (
        completedItems.reduce((acc, w) => acc + w.expectedKw * 2, 0) / 1000
      ).toFixed(1),
    [completedItems]
  );
  const inProgressEnergyMwh = useMemo(
    () =>
      (
        inProgressItems.reduce((acc, w) => acc + w.expectedKw * 2, 0) / 1000
      ).toFixed(1),
    [inProgressItems]
  );
  const upcomingEnergyMwh = useMemo(
    () =>
      (
        upcomingItems.reduce((acc, w) => acc + w.expectedKw * 2, 0) / 1000
      ).toFixed(1),
    [upcomingItems]
  );
  const total24hExpectedMwh = useMemo(
    () =>
      (
        BERTH_24H_SCHEDULE.reduce((acc, w) => acc + w.expectedKw * 2, 0) / 1000
      ).toFixed(1),
    []
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* ==================================================================== */}
      {/* 1. TOP CONTROL HEADER: BERTH OPERATION & 24H REPLAY BAR */}
      {/* ==================================================================== */}
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-sky-300 font-semibold">
            <span>Maritime AIS &amp; Geofenced Berth Operations</span>
            <span aria-hidden="true">·</span>
            <span>Synchronized with 24-Hour Load Forecast &amp; Telemetry Feeds</span>
          </div>
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-400" />
            <span>Berth Operation &amp; Geofenced Event Summary Map</span>
          </h2>
        </div>

        {/* Compact Single-Line Live / 24h Replay Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSimMode("LIVE");
                setSimHour(13.6);
                setIsPlaying(true);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                simMode === "LIVE"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Real-Time Operation</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSimMode("REPLAY_24H");
                setIsPlaying(true);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                simMode === "REPLAY_24H"
                  ? "bg-sky-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>24h Replay</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-300" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-300" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
          >
            {playbackSpeed}x
          </button>

          <button
            type="button"
            onClick={() => setSimHour(simMode === "LIVE" ? 13.4 : 0)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Clock"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. 24-HOUR TIMELINE SCRUBBER BAR & LOAD FORECAST CONSISTENCY STRIP */}
      {/* ==================================================================== */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs shrink-0 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{formattedClock}</span>
            <span className="text-slate-400">|</span>
            <span className="text-sky-300">{activeWindow.timeWindow}</span>
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-[180px]">
            <span className="text-[11px] font-mono text-slate-500">00:00</span>
            <input
              type="range"
              min={0}
              max={23.95}
              step={0.05}
              value={simHour}
              onChange={(e) => {
                setSimMode("REPLAY_24H");
                setSimHour(parseFloat(e.target.value));
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004B91]"
            />
            <span className="text-[11px] font-mono text-slate-500">24:00</span>
          </div>
        </div>

        {/* Synchronized Load Forecast Metrics for Current Window */}
        <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="text-slate-500">Window Expected Load:</span>
            <strong
              className={`font-mono font-black ${
                activeWindow.status === "OVERLOAD_WARNING"
                  ? "text-amber-700"
                  : "text-slate-900"
              }`}
            >
              {activeWindow.expectedKw.toLocaleString()} kW
            </strong>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <SunMedium className="w-3.5 h-3.5 text-emerald-600" />
            <span>Solar:</span>
            <strong className="font-mono text-emerald-700">
              {activeWindow.solarKw.toLocaleString()} kW
            </strong>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Zap className="w-3.5 h-3.5 text-[#004B91]" />
            <span>Net Grid:</span>
            <strong className="font-mono text-[#004B91]">
              {activeWindow.netGridKw.toLocaleString()} kW
            </strong>
          </div>
          <button
            type="button"
            onClick={() => onInspectForecastWindow(activeWindow.id, false)}
            className="px-2.5 py-1 rounded-lg bg-[#004B91] hover:bg-[#00386E] text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Gauge className="w-3 h-3" />
            <span>Feeder Breakdown</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE NAUTICAL GEOFENCE MAP + SELECTED ENTITY INSPECTOR */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
        {/* Left 8 Cols: Nautical Chart & Geofenced Port Basin Map */}
        <div className="lg:col-span-8 relative bg-[#0B2239] overflow-hidden flex flex-col justify-between min-h-[430px]">
          {/* Top Map Legend Overlay */}
          <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
            <div className="bg-slate-950/85 backdrop-blur-xs border border-slate-700/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-200 flex flex-wrap items-center gap-3 pointer-events-auto">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-4 h-0.5 bg-emerald-400 inline-block" />
                <span>Traveled Route (Đã đi)</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-amber-400 inline-block" />
                <span>Planned Route (Dự kiến)</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs border border-sky-400 bg-sky-400/20 inline-block" />
                <span>Geofenced Berth Zone</span>
              </span>
            </div>

            {activeWindow.status === "OVERLOAD_WARNING" && (
              <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-lg pointer-events-auto">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  SUBSTATION OVERLOAD WARNING ({activeWindow.expectedKw.toLocaleString()} kW &gt; 8,000 kW)
                </span>
              </div>
            )}
          </div>

          {/* Main SVG Nautical Chart & Masterplan Geometry (Matching Attached Port Masterplan) */}
          <div className="w-full flex-1 flex items-center justify-center px-2">
            <svg
              viewBox="0 0 900 520"
              className="w-full h-auto max-h-[440px] select-none"
            >
              <defs>
                <linearGradient id="seaWaterGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0C2540" />
                  <stop offset="55%" stopColor="#0F3156" />
                  <stop offset="100%" stopColor="#0A1E36" />
                </linearGradient>
                <pattern
                  id="nauticalGrid"
                  width="45"
                  height="45"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 45 0 L 0 0 0 45"
                    fill="none"
                    stroke="#1E3A5F"
                    strokeWidth="0.6"
                    strokeOpacity="0.45"
                  />
                </pattern>
              </defs>

              {/* Sea Basin & Nautical Grid */}
              <rect width="900" height="520" fill="url(#seaWaterGrad)" />
              <rect width="900" height="520" fill="url(#nauticalGrid)" />

              {/* Bathymetry & Navigation Channel Contours */}
              <path
                d="M 540 520 C 490 420, 560 280, 650 180 L 890 310 L 890 520 Z"
                fill="#133B66"
                fillOpacity="0.35"
              />

              {/* ============================================================ */}
              {/* PORT LANDMASSES (Modeled after Masterplan Image) */}
              {/* ============================================================ */}
              {/* 1. North-West Landmass & Road Network */}
              <polygon
                points="0,0 520,0 440,50 140,120 75,310 120,480 0,520"
                fill="#1E293B"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* 2. Khu Bến Thủy Nội Địa (Inland Waterway / Feeder Terminal — 500m x 300m) */}
              <polygon
                points="145,130 335,215 280,315 110,235"
                fill="#334155"
                stroke="#64748B"
                strokeWidth="1.5"
              />
              {/* Container Yard Bay A1 Blocks inside Inland Terminal */}
              <g fill="#0D9488" fillOpacity="0.45" stroke="#2DD4BF" strokeWidth="0.8">
                <rect x="175" y="168" width="42" height="18" rx="2" transform="rotate(24 175 168)" />
                <rect x="225" y="190" width="42" height="18" rx="2" transform="rotate(24 225 190)" />
                <rect x="160" y="198" width="42" height="18" rx="2" transform="rotate(24 160 198)" />
              </g>

              {/* 3. Khu Bến Tổng Hợp (General Cargo Wharf — 1250m Bottom-Left Peninsula) */}
              <polygon
                points="90,295 395,435 350,508 75,475"
                fill="#293548"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <text
                x="235"
                y="435"
                fill="#94A3B8"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                transform="rotate(23 235 435)"
              >
                KHU BẾN TỔNG HỢP (1,250 m)
              </text>

              {/* 4. Main Container Terminal Peninsula: Khu Bến Container Bắc (750m) & Nam (900m) */}
              <polygon
                points="445,35 555,88 375,425 265,370"
                fill="#334155"
                stroke="#94A3B8"
                strokeWidth="1.8"
              />
              {/* Container Yard Stacking Blocks (Bay B2 & Reefer Bay R1) */}
              <g
                onClick={() => onTraceEntityInTelemetry("BAY-B2", "BREAKDOWN")}
                className="cursor-pointer hover:opacity-90"
              >
                <rect
                  x="445"
                  y="95"
                  width="55"
                  height="95"
                  rx="4"
                  transform="rotate(27 445 95)"
                  fill="#0284C7"
                  fillOpacity="0.35"
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                />
                <text
                  x="452"
                  y="148"
                  fill="#E0F2FE"
                  fontSize="9"
                  fontWeight="800"
                  textAnchor="middle"
                  transform="rotate(-63 452 148)"
                >
                  BAY B2 (750m)
                </text>
              </g>

              <g
                onClick={() => onTraceEntityInTelemetry("BAY-R1", "BREAKDOWN")}
                className="cursor-pointer hover:opacity-90"
              >
                <rect
                  x="362"
                  y="252"
                  width="55"
                  height="110"
                  rx="4"
                  transform="rotate(27 362 252)"
                  fill="#2563EB"
                  fillOpacity="0.35"
                  stroke="#60A5FA"
                  strokeWidth="1.2"
                />
                <text
                  x="365"
                  y="310"
                  fill="#DBEAFE"
                  fontSize="9"
                  fontWeight="800"
                  textAnchor="middle"
                  transform="rotate(-63 365 310)"
                >
                  REEFER BAY R1 (900m)
                </text>
              </g>

              {/* 5. Đê Chắn Sóng (2,090m Breakwater Barrier on Right) */}
              <path
                d="M 520 22 L 605 68 L 875 245 L 865 258 L 595 80 L 512 34 Z"
                fill="#E2E8F0"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              <text
                x="725"
                y="135"
                fill="#F8FAFC"
                fontSize="10"
                fontWeight="800"
                textAnchor="middle"
                transform="rotate(33 725 135)"
              >
                ĐÊ CHẮN SÓNG · 2,090 m
              </text>

              {/* ============================================================ */}
              {/* GOOGLE-MAPS-STYLE GEOFENCED OPERATIONAL ZONES */}
              {/* ============================================================ */}
              {GEOFENCE_ZONES.map((gf) => {
                const isActiveOverload =
                  activeWindow.status === "OVERLOAD_WARNING" &&
                  (gf.id === "GF-B2" || gf.id === "GF-B3");
                const isSelectedZone =
                  activeWindow.geofenceId === gf.id;
                const strokeColor = isActiveOverload
                  ? "#F59E0B"
                  : gf.baseColor;

                return (
                  <g
                    key={gf.id}
                    onClick={() =>
                      onTraceEntityInTelemetry(gf.linkedEntityId, "TURNAROUND")
                    }
                    className="cursor-pointer group"
                  >
                    <polygon
                      points={gf.polygonPoints}
                      fill={strokeColor}
                      fillOpacity={isSelectedZone ? 0.22 : 0.12}
                      stroke={strokeColor}
                      strokeWidth={isSelectedZone ? "2.2" : "1.5"}
                      strokeDasharray="6 4"
                    />
                    <g transform={`translate(${gf.labelX}, ${gf.labelY})`}>
                      <rect
                        x="-58"
                        y="-18"
                        width="116"
                        height="26"
                        rx="5"
                        fill="#0F172A"
                        fillOpacity="0.82"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-6"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="8.5"
                        fontWeight="800"
                        className="font-mono"
                      >
                        {gf.code} · {gf.dimensionsLabel}
                      </text>
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize="7.5"
                        fontWeight="600"
                      >
                        {gf.vietnameseSub}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* ============================================================ */}
              {/* STS QUAY CRANES ALONG BERTHS B1, B2, B3 (Interactive 3D-like Nodes) */}
              {/* ============================================================ */}
              {[
                { id: "STS-01", label: "STS-01", x: 525, y: 145, color: "#38BDF8" },
                { id: "STS-02", label: "STS-02", x: 492, y: 205, color: "#38BDF8" },
                { id: "STS-03", label: "STS-03", x: 438, y: 312, color: "#60A5FA" },
                { id: "STS-04", label: "STS-B1", x: 268, y: 242, color: "#2DD4BF" },
              ].map((crane) => (
                <g
                  key={crane.id}
                  transform={`translate(${crane.x}, ${crane.y})`}
                  onClick={() => onTraceEntityInTelemetry(crane.id, "BREAKDOWN")}
                  className="cursor-pointer"
                >
                  <rect
                    x="-10"
                    y="-6"
                    width="20"
                    height="12"
                    rx="2"
                    fill="#0F172A"
                    stroke={crane.color}
                    strokeWidth="1.5"
                  />
                  <line
                    x1="-14"
                    y1="0"
                    x2="16"
                    y2="8"
                    stroke={crane.color}
                    strokeWidth="2"
                  />
                  <text
                    x="0"
                    y="-10"
                    textAnchor="middle"
                    fill={crane.color}
                    fontSize="7.5"
                    fontWeight="800"
                    className="font-mono"
                  >
                    {crane.label}
                  </text>
                </g>
              ))}

              {/* ============================================================ */}
              {/* VESSEL ROUTE VECTORS (Traveled Solid Line vs. Planned Dashed Line) */}
              {/* ============================================================ */}
              {vesselsAIS.map((v) => {
                const isSelected = v.id === selectedVessel.id;
                return (
                  <g key={`route-${v.id}`}>
                    {/* Traveled Path (Solid Line) */}
                    {v.traveledPathD && (
                      <path
                        d={v.traveledPathD}
                        fill="none"
                        stroke={v.color}
                        strokeWidth={isSelected ? "3" : "2"}
                        strokeOpacity={isSelected ? "0.95" : "0.65"}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Planned / Expected Path (Dashed Line) */}
                    {v.plannedPathD && (
                      <path
                        d={v.plannedPathD}
                        fill="none"
                        stroke={v.color}
                        strokeWidth={isSelected ? "2.5" : "1.8"}
                        strokeDasharray="5 5"
                        strokeOpacity={isSelected ? "0.9" : "0.5"}
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}

              {/* ============================================================ */}
              {/* AIS NAUTICAL STANDARD VESSEL HULLS (Interactive Like 3D Entities) */}
              {/* ============================================================ */}
              {vesselsAIS.map((v) => {
                const isSelected = v.id === selectedVessel.id;
                return (
                  <g
                    key={v.id}
                    transform={`translate(${v.x}, ${v.y})`}
                    onClick={() => setSelectedVesselId(v.id)}
                    className="cursor-pointer"
                  >
                    {/* Selection Pulse Ring */}
                    {isSelected && (
                      <circle
                        r="28"
                        fill={v.color}
                        fillOpacity="0.18"
                        stroke={v.color}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Rotated AIS Standard Pointed Ship Hull Symbol */}
                    <g transform={`rotate(${v.headingDeg})`}>
                      <polygon
                        points="-22,-8 12,-8 24,0 12,8 -22,8"
                        fill={v.color}
                        stroke="#FFFFFF"
                        strokeWidth={isSelected ? "2" : "1.2"}
                      />
                      {/* Container Bays on Deck */}
                      <rect x="-15" y="-5" width="9" height="10" fill="#0F172A" fillOpacity="0.45" />
                      <rect x="-3" y="-5" width="9" height="10" fill="#0F172A" fillOpacity="0.45" />
                      {/* Heading Vector Line out of Bow */}
                      <line
                        x1="24"
                        y1="0"
                        x2="38"
                        y2="0"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </g>

                    {/* Floating AIS Tag Callout */}
                    <g transform="translate(0, -24)">
                      <rect
                        x="-68"
                        y="-18"
                        width="136"
                        height="22"
                        rx="5"
                        fill={isSelected ? "#FFFFFF" : "#0F172A"}
                        fillOpacity="0.94"
                        stroke={v.color}
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="-4"
                        textAnchor="middle"
                        fill={isSelected ? "#0F172A" : "#FFFFFF"}
                        fontSize="8.5"
                        fontWeight="800"
                        className="font-mono"
                      >
                        {v.vesselName.replace("MV ", "")} ({v.voyage})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Quick Vessel Selector Bar inside Map */}
          <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Active AIS Targets:
              </span>
              {vesselsAIS.map((v) => {
                const active = v.id === selectedVessel.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVesselId(v.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                      active
                        ? "bg-white text-slate-950"
                        : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: v.color }}
                    />
                    <span>{v.vesselName.replace("MV ", "")}</span>
                    <span className="text-[10px] opacity-75">
                      · {v.stateBadgeText}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Click any ship, crane, or geofence zone to inspect
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Interactive AIS Vessel & Geofence Inspector Panel */}
        <div className="lg:col-span-4 p-5 bg-slate-50/70 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <span>AIS Target · IMO {selectedVessel.imo}</span>
                  <span aria-hidden="true">·</span>
                  <span>Voyage {selectedVessel.voyage}</span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedVessel.vesselName}
                </h3>
                <div className="text-xs font-semibold text-[#004B91] mt-0.5">
                  {selectedVessel.berthLabel}
                </div>
              </div>

              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: selectedVessel.color }}
              >
                {selectedVessel.stateBadgeText}
              </span>
            </div>

            {/* Key Real-Time Navigation & Load Metrics */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  AIS Speed &amp; Heading
                </span>
                <strong className="font-mono text-slate-900 font-bold block mt-0.5">
                  {selectedVessel.speedKnots}
                </strong>
                <span className="text-[10px] text-slate-500 font-mono">
                  HDG {(selectedVessel.headingDeg + 360) % 360}°T
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Cargo Progress
                </span>
                <strong className="font-mono text-slate-900 font-bold block mt-0.5">
                  {selectedVessel.teuProgress}
                </strong>
                <span className="text-[10px] text-slate-500">
                  TOS Manifest Sync
                </span>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Active Berth Electrical Demand
                  </span>
                  <strong className="font-mono text-sm font-black text-[#004B91]">
                    {selectedVessel.powerKwLabel}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onOpenMeterModal(
                      selectedVessel.linkedTelemetryEntityId,
                      "LIVE_MONITORING"
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#004B91]" />
                  <span>Sub-Meters</span>
                </button>
              </div>
            </div>

            {/* Active Window Feeder Snapshot for Selected Vessel */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                  1-Day Forecast Link ({activeWindow.timeWindow})
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {activeWindow.expectedKw.toLocaleString()} kW
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {activeWindow.operationSummary}
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block">F-01 Cranes</span>
                  <strong className="text-slate-900">
                    {activeWindow.feeders.f01StsKw} kW
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block">F-03 Reefers</span>
                  <strong className="text-slate-900">
                    {activeWindow.feeders.f03ReeferKw} kW
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block">F-04 OPS</span>
                  <strong className="text-slate-900">
                    {activeWindow.feeders.f04OpsKw} kW
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Links to Telemetry Popups & 1-Day Load Forecast Popup */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onTraceEntityInTelemetry(
                    selectedVessel.linkedTelemetryEntityId,
                    "TURNAROUND"
                  )
                }
                className="py-2 px-3 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Ship className="w-3.5 h-3.5" />
                <span>2D Turnaround Popup</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onTraceEntityInTelemetry(
                    selectedVessel.linkedTelemetryEntityId,
                    "BREAKDOWN"
                  )
                }
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Telemetry Report Popup</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onInspectForecastWindow(selectedVessel.linkedWindowId, true)
              }
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#004B91]" />
              <span>Open 1-Day Load Forecast Report ({selectedVessel.linkedWindowId})</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. THREE SYNCHRONIZED SECTIONS: COMPLETED TODAY / ACTIVE NOW / SCHEDULED */}
      {/* ==================================================================== */}
      <div className="p-6 space-y-5 bg-white">
        {/* Header + Consistency Summary Bar matching ForecastPage.tsx */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">
              24-Hour Berth Operation Log &amp; Load Forecast Schedule Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consistent with 1-Day Load Forecast Report (Peak 8,151 kW · 2 Overload Windows at 14:00 &amp; 16:00 · Total {total24hExpectedMwh} MWh/day). Click any slot for full details.
            </p>
          </div>

          {/* Filter Tabs for the 3 Sections */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActivePhaseTab("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activePhaseTab === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All 3 Sections (12 Windows · {total24hExpectedMwh} MWh)
            </button>
            <button
              type="button"
              onClick={() => setActivePhaseTab("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activePhaseTab === "COMPLETED"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Completed Today ({completedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActivePhaseTab("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activePhaseTab === "IN_PROGRESS"
                  ? "bg-white text-[#004B91] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. Active Operations ({inProgressItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActivePhaseTab("UPCOMING")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activePhaseTab === "UPCOMING"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3. Scheduled Upcoming ({upcomingItems.length})
            </button>
          </div>
        </div>

        {/* 3 Columns / Sections: (1) Completed Today, (2) Active Now, (3) Scheduled Upcoming */}
        <div
          className={`grid grid-cols-1 ${
            activePhaseTab === "ALL" ? "lg:grid-cols-3" : "lg:grid-cols-1"
          } gap-5`}
        >
          {/* SECTION 1: COMPLETED TODAY (00:00 – 12:00) */}
          {(activePhaseTab === "ALL" || activePhaseTab === "COMPLETED") && (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        1. Đã Chạy Hôm Nay (Completed · 00:00–12:00)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        6 windows completed · Metered &amp; verified
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <strong className="text-xs font-black text-emerald-700 block">
                      {completedEnergyMwh} MWh
                    </strong>
                    <span className="text-[10px] text-slate-500">Recorded</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {completedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSimMode("REPLAY_24H");
                        setIsPlaying(false);
                        setSimHour(item.startHour + 1);
                        setSelectedScheduleItem(item);
                      }}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-400 transition-all cursor-pointer space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-black font-mono text-slate-900">
                            {item.timeWindow} · {item.vesselName.replace("MV ", "")}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.berth} · {item.stsCranes} Cranes · {item.reeferPlugs} Reefers
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="text-xs font-black text-slate-900">
                            {item.actualKw?.toLocaleString()} kW
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Forecast: {item.expectedKw.toLocaleString()} kW
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        {item.operationSummary}
                      </p>

                      {/* Linked Meters */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {item.linkedMeters.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMeterModal(m.entityId, "LIVE_MONITORING");
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#004B91] font-mono text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            {m.id} ({m.kwOrFlow})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CURRENTLY OPERATING AT BERTH (12:00 – 16:00) */}
          {(activePhaseTab === "ALL" || activePhaseTab === "IN_PROGRESS") && (
            <div className="rounded-2xl border-2 border-blue-300 bg-blue-50/25 p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#004B91] shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        2. Đang Làm Tại Bến (Active Now · 12:00–16:00)
                      </h4>
                      <span className="text-[11px] text-slate-600">
                        Live SCADA telemetry &amp; Peak Overload Alert (8,151 kW)
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <strong className="text-xs font-black text-[#004B91] block">
                      {inProgressEnergyMwh} MWh
                    </strong>
                    <span className="text-[10px] text-slate-500">Active Slot</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {inProgressItems.map((item) => {
                    const isOverload = item.status === "OVERLOAD_WARNING";
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSimMode("LIVE");
                          setSimHour(item.startHour + 0.8);
                          setSelectedScheduleItem(item);
                        }}
                        className={`p-4 rounded-xl bg-white border transition-all cursor-pointer space-y-2.5 shadow-2xs ${
                          isOverload
                            ? "border-2 border-amber-400"
                            : "border-blue-200 hover:border-blue-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#004B91]">
                              <span>LIVE WINDOW</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.berth}</span>
                            </div>
                            <div className="text-sm font-black font-mono text-slate-900 mt-0.5">
                              {item.timeWindow} · {item.vesselName}
                            </div>
                          </div>
                          <div className="text-right font-mono shrink-0">
                            <div
                              className={`text-sm font-black ${
                                isOverload ? "text-amber-700" : "text-slate-900"
                              }`}
                            >
                              {item.expectedKw.toLocaleString()} kW
                            </div>
                            <div className="text-[10px] text-emerald-700">
                              Solar: -{item.solarKw.toLocaleString()} kW
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">
                          {item.operationSummary}
                        </p>

                        {/* Active Tasks Checklist */}
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                          {item.scheduledTasks.map((task, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#004B91] font-bold">•</span>
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>

                        {/* Linked Live Meters */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {item.linkedMeters.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenMeterModal(m.entityId, "LIVE_MONITORING");
                              }}
                              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#004B91] font-mono text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              {m.id} · {m.kwOrFlow}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SCHEDULED / UPCOMING WORK ON SCHEDULE (16:00 – 24:00) */}
          {(activePhaseTab === "ALL" || activePhaseTab === "UPCOMING") && (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        3. Chuẩn Bị Thực Hiện (Scheduled · 16:00–24:00)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        4 upcoming windows queued on TOS &amp; Power Schedule
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <strong className="text-xs font-black text-amber-700 block">
                      {upcomingEnergyMwh} MWh
                    </strong>
                    <span className="text-[10px] text-slate-500">Forecasted</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {upcomingItems.map((item) => {
                    const isOverload = item.status === "OVERLOAD_WARNING";
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSimMode("REPLAY_24H");
                          setIsPlaying(false);
                          setSimHour(item.startHour + 0.5);
                          setSelectedScheduleItem(item);
                        }}
                        className={`p-3.5 rounded-xl bg-white border transition-all cursor-pointer space-y-2 shadow-2xs ${
                          isOverload
                            ? "border-amber-400 bg-amber-50/20"
                            : "border-slate-200/90 hover:border-amber-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-black font-mono text-slate-900">
                              {item.timeWindow} · {item.vesselName.replace("MV ", "")}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.berth} · {item.stsCranes} Cranes · {item.touLabel}
                            </div>
                          </div>
                          <div className="text-right font-mono shrink-0">
                            <div
                              className={`text-xs font-black ${
                                isOverload ? "text-amber-700" : "text-[#004B91]"
                              }`}
                            >
                              {item.expectedKw.toLocaleString()} kW
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Range: {item.lowBoundKw.toLocaleString()}–{item.highBoundKw.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          {item.operationSummary}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>
                            {item.scheduledTasks.length} scheduled work items
                          </span>
                          <span className="font-bold text-[#004B91]">
                            Click to inspect schedule &amp; feeders →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. DETAIL POPUP WHEN CLICKING ANY COMPLETED / ACTIVE / SCHEDULED SLOT */}
      {/* ==================================================================== */}
      {selectedScheduleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-sky-300 font-semibold">
                  {selectedScheduleItem.phase === "COMPLETED"
                    ? "Completed Operation Record"
                    : selectedScheduleItem.phase === "IN_PROGRESS"
                    ? "Active Real-Time Berth Operation"
                    : "Scheduled Upcoming Berth Operation"}{" "}
                  · {selectedScheduleItem.touLabel}
                </div>
                <h3 className="text-base font-black mt-0.5">
                  {selectedScheduleItem.timeWindow} — {selectedScheduleItem.vesselName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedScheduleItem(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              {/* Top 4 Consistent Load Forecast Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Expected Power
                  </span>
                  <strong className="text-slate-900 text-sm font-black font-mono">
                    {selectedScheduleItem.expectedKw.toLocaleString()} kW
                  </strong>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Range: {selectedScheduleItem.lowBoundKw.toLocaleString()}–{selectedScheduleItem.highBoundKw.toLocaleString()} kW
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    {selectedScheduleItem.actualKw
                      ? "Actual Metered"
                      : "Schedule Status"}
                  </span>
                  <strong className="text-emerald-700 text-sm font-black font-mono">
                    {selectedScheduleItem.actualKw
                      ? `${selectedScheduleItem.actualKw.toLocaleString()} kW`
                      : "Queued on TOS"}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    Solar Offset: -{selectedScheduleItem.solarKw.toLocaleString()} kW
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Net Grid Draw
                  </span>
                  <strong className="text-[#004B91] text-sm font-black font-mono">
                    {selectedScheduleItem.netGridKw.toLocaleString()} kW
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    Limit: 8,000 kW
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Berth &amp; Equipment
                  </span>
                  <strong className="text-slate-900 text-xs font-bold block">
                    {selectedScheduleItem.stsCranes} STS Cranes
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedScheduleItem.reeferPlugs} Reefer Plugs
                  </span>
                </div>
              </div>

              {/* Scheduled Work List */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Scheduled Berth Tasks &amp; Operational Events
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  {selectedScheduleItem.scheduledTasks.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consistent F-01 to F-06 Feeder Load Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  1-Day Load Forecast Feeder Breakdown (F-01 to F-06)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                  {[
                    { code: "F-01", name: "STS Quay Cranes", kw: selectedScheduleItem.feeders.f01StsKw },
                    { code: "F-02", name: "Yard e-RTG Cranes", kw: selectedScheduleItem.feeders.f02RtgKw },
                    { code: "F-03", name: "Reefer Container Racks", kw: selectedScheduleItem.feeders.f03ReeferKw },
                    { code: "F-04", name: "Ship Shore Power (OPS)", kw: selectedScheduleItem.feeders.f04OpsKw },
                    { code: "F-05", name: "EV Tractor Fast Chargers", kw: selectedScheduleItem.feeders.f05EvBessKw },
                    { code: "F-06", name: "CFS & Port Aux", kw: selectedScheduleItem.feeders.f06AuxKw },
                  ].map((f) => (
                    <div
                      key={f.code}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-[#004B91] block">
                          {f.code}
                        </span>
                        <span className="font-sans text-[11px] text-slate-600">
                          {f.name}
                        </span>
                      </div>
                      <strong className="text-slate-900">
                        {f.kw.toLocaleString()} kW
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Meters */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Linked Telemetry Sub-Meters
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedScheduleItem.linkedMeters.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedScheduleItem(null);
                        onOpenMeterModal(m.entityId, "LIVE_MONITORING");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Gauge className="w-3.5 h-3.5 text-[#004B91]" />
                      <span>
                        {m.label} ({m.id}) · {m.kwOrFlow}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Footer: Jump to Telemetry Popup or Load Forecast Popup */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const targetEntity =
                        selectedScheduleItem.linkedTelemetryEntityId;
                      setSelectedScheduleItem(null);
                      onTraceEntityInTelemetry(targetEntity, "TURNAROUND");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Ship className="w-3.5 h-3.5" />
                    <span>Open Telemetry Turnaround Popup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const winId = selectedScheduleItem.id;
                      setSelectedScheduleItem(null);
                      onInspectForecastWindow(winId, false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Open in 1-Day Load Forecast</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedScheduleItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
