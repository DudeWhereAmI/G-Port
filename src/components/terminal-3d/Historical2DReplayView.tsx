import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
} from "lucide-react";
import { Terminal3DEntity } from "./terminal3DData";

interface Historical2DReplayViewProps {
  entity: Terminal3DEntity;
  selectedLogIdx?: number;
  onSelectLogIdx?: (idx: number) => void;
  onOpenMeterModal?: (meterId: string) => void;
}

interface ActiveCraneConfig {
  code: string;
  x: number;
  roleLabel: string;
}

interface ActiveBayConfig {
  id: "BAY-A1" | "BAY-B2" | "BAY-R1" | "BAY-C1";
  title: string;
  sub: string;
  feeder: string;
  rtgCode: string;
  targetSlotLabel: string;
  x: number;
  w: number;
  stroke: string;
  fill: string;
}

interface ActiveTruckRouteConfig {
  truckCode: string;
  cargoLabel: string;
  color: string;
  dashed?: boolean;
  isLoop: boolean; // false = single trip 0..100%, true = multi-trip shuttle loop across shift/voyage
  totalTripsInLog?: number;
  phaseOffset?: number;
  waypoints: [number, number][];
}

export interface ReplayScenario {
  id: string;
  label: string;
  badge: string;
  date: string;
  durationLabel: string;
  mode: "VOYAGE_FULL" | "SHIFT_SHUTTLE" | "SINGLE_ORDER";
  berthCode: "B1" | "B2" | "B3";
  berthLabel: string;
  berthX: number;
  berthW: number;
  vesselName: string;
  tugName: string;
  opsLabel: string;
  scopeDescription: string;
  // Strictly the entities involved in THIS scenario:
  activeCranes: ActiveCraneConfig[];
  activeBays: ActiveBayConfig[];
  truckRoutes: ActiveTruckRouteConfig[];
  assignedMachines: {
    code: string;
    role: string;
    meterCode: string;
    energyOrFuel: string;
  }[];
  timelinePhases: {
    startPct: number;
    endPct: number;
    timeLabel: string;
    phaseTitle: string;
    activityDetail: string;
  }[];
  meters: {
    id: string;
    name: string;
    protocol: string;
    unit: string;
    secondaryUnit: string;
    totalRecorded: string;
    intensity: string;
    color: string;
    series: { t: string; val: number; sec: number; status: string }[];
  }[];
}

// Waypoint interpolation helper for 2D SVG map paths
function interpolateWaypoints(
  points: [number, number][],
  progress01: number
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0][0], y: points[0][1] };

  const clamped = Math.max(0, Math.min(0.9999, progress01));
  const totalSegs = points.length - 1;
  const exactSeg = clamped * totalSegs;
  const idx = Math.floor(exactSeg);
  const localT = exactSeg - idx;

  const p0 = points[idx];
  const p1 = points[Math.min(idx + 1, points.length - 1)];
  return {
    x: p0[0] + (p1[0] - p0[0]) * localT,
    y: p0[1] + (p1[1] - p0[1]) * localT,
  };
}

// Standard Bay geometry definitions (only included when a scenario actually uses that bay!)
const BAY_DEFINITIONS: Record<
  "BAY-A1" | "BAY-B2" | "BAY-R1" | "BAY-C1",
  ActiveBayConfig
> = {
  "BAY-A1": {
    id: "BAY-A1",
    title: "CONTAINER BAY A1",
    sub: "West Dry Block · Rows A–F",
    feeder: "Feeder F-02 (5.16 kWh/TEU)",
    rtgCode: "e-RTG #01/02",
    targetSlotLabel: "Slot A1-08 / Rows E–F",
    x: 85,
    w: 170,
    stroke: "#38bdf8",
    fill: "#0f172a",
  },
  "BAY-B2": {
    id: "BAY-B2",
    title: "CONTAINER BAY B2",
    sub: "Central Block B · Rows A–F",
    feeder: "Feeder F-02 (5.12 kWh/TEU)",
    rtgCode: "e-RTG #03",
    targetSlotLabel: "Row C · Slot B2-14",
    x: 280,
    w: 175,
    stroke: "#60a5fa",
    fill: "#0f172a",
  },
  "BAY-R1": {
    id: "BAY-R1",
    title: "REEFER BAY R1 (-22°C)",
    sub: "Zone 3 Cold-Chain Racks",
    feeder: "Feeder F-03 (51.6 kWh/Box)",
    rtgCode: "e-RTG #04",
    targetSlotLabel: "Rack R1-12 (380V)",
    x: 470,
    w: 175,
    stroke: "#f59e0b",
    fill: "#0f2942",
  },
  "BAY-C1": {
    id: "BAY-C1",
    title: "CONTAINER BAY C1 + REGEN",
    sub: "East Deep-Sea Block + 1.5MW Regen",
    feeder: "Feeder F-02 + Regen Busbar",
    rtgCode: "e-RTG #05",
    targetSlotLabel: "Row A · Slot C1-02",
    x: 520,
    w: 195,
    stroke: "#10b981",
    fill: "#0f172a",
  },
};

function buildPersonalizedScenarios(entity: Terminal3DEntity): ReplayScenario[] {
  const id = entity.id;

  // =========================================================================
  // CASE 1: CONTAINER BAY B2 ("BAY-B2") OR CRANE STS-02 ("STS-02")
  // Strictly involves ONLY: Berth B2 + STS-02 + TRK-2481 + Container Bay B2!
  // (No Bay A1, No Reefer Bay R1, No Bay C1!)
  // =========================================================================
  if (id === "BAY-B2" || id === "STS-02") {
    return [
      {
        id: `${id}-LOG-1`,
        label: "28/09 · Voyage 056N (STS-02 → Container Bay B2)",
        badge: "1,008 TEU · Active Today",
        date: "28/09/2026 (08:00 – 16:30)",
        durationLabel: "32 moves/h · 5.12 kWh/TEU",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (056N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (540 kW)",
        scopeDescription:
          "Chỉ hiển thị các chủ thể trực tiếp tham gia luồng hàng Container Bay B2: Tàu MV SPIRIT OF MUMBAI tại Bến B2, Cẩu bờ STS-02, Xe đầu kéo TRK-2481 và Cẩu khung e-RTG #03 tại Container Bay B2.",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "Midship Bay 35 Unloading" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-B2"],
            x: 270,
            w: 220,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-2481",
            cargoLabel: "#MSCU-8921040 → Slot B2-14",
            color: "#3b82f6",
            isLoop: true,
            totalTripsInLog: 42,
            phaseOffset: 0,
            waypoints: [
              [380, 104], // Under STS-02 at Berth B2
              [380, 148], // Central Spine Lane
              [345, 148],
              [345, 194], // Into Container Bay B2 Slot 14
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-02 (Berth B2)",
            role: "Discharging Ship Hold Bay 35",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "8,120 kWh (8.05 kWh/TEU)",
          },
          {
            code: "TRK-2481 Shuttle",
            role: "STS-02 → Bay B2 Direct Loop",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "33.6 L Diesel (42 Trips)",
          },
          {
            code: "Bay B2 (e-RTG #03)",
            role: "Stacking Rows A–D (Slot B2-14)",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "5,160 kWh (5.12 kWh/TEU)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 33,
            timeLabel: "08:00 – 10:30",
            phaseTitle: "1. STS-02 Upper Tier Discharge to TRK-2481",
            activityDetail:
              "Cẩu bờ STS-02 (Bến B2) hạ container từ hầm Bay 35 xuống xe TRK-2481 chuyển thẳng vào Container Bay B2 Rows A–B.",
          },
          {
            startPct: 33,
            endPct: 70,
            timeLabel: "10:30 – 13:45",
            phaseTitle: "2. Peak Twin-Stacking by e-RTG #03 in Bay B2",
            activityDetail:
              "Cẩu bãi e-RTG #03 (Feeder F-02 · 580 kW) đón xe TRK-2481 tại làn giao nhận và xếp chồng lên Row C Slot B2-14.",
          },
          {
            startPct: 70,
            endPct: 100,
            timeLabel: "13:45 – 16:30",
            phaseTitle: "3. Final Hold Batch & Slot Verification",
            activityDetail:
              "Hoàn tất 1,008 TEU tại Container Bay B2 (độ lấp đầy 365/450 TEU); đồng bộ vị trí slot lên ePort & Navis N4.",
          },
        ],
        meters: [
          {
            id: "MTR-STS-CATLAI-B2",
            name: "Bay B2 e-RTG #03 & Crane STS-02 Feeder",
            protocol: "IEC 61850 / Feeder F-01 & F-02",
            unit: "kW",
            secondaryUnit: "moves/h",
            totalRecorded: "5,160 kWh (Bay B2) + 8,120 kWh (STS-02)",
            intensity: "5.12 kWh / TEU (Bay B2)",
            color: "#2563eb",
            series: [
              { t: "08:00", val: 490, sec: 28, status: "STS-02 → Bay B2 Row A" },
              { t: "10:00", val: 610, sec: 34, status: "e-RTG #03 peak stacking" },
              { t: "12:00", val: 540, sec: 30, status: "Steady Row B/C stacking" },
              { t: "13:45", val: 580, sec: 32, status: "Stacking #MSCU8921040 at B2-14" },
              { t: "16:00", val: 460, sec: 26, status: "Batch 056N completed" },
            ],
          },
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-2481 Shuttle (STS-02 ↔ Bay B2)",
            protocol: "CAN Bus J1939 / GPS",
            unit: "L/h",
            secondaryUnit: "km/h",
            totalRecorded: "33.6 L Diesel (42 Trips)",
            intensity: "0.40 L / TEU",
            color: "#10b981",
            series: [
              { t: "08:00", val: 16.5, sec: 18, status: "Trip #01 to Bay B2" },
              { t: "10:00", val: 19.2, sec: 19, status: "Trip #14 to Bay B2" },
              { t: "12:00", val: 17.8, sec: 17, status: "Trip #26 to Bay B2" },
              { t: "13:45", val: 18.2, sec: 18, status: "Hauling #MSCU8921040" },
              { t: "16:00", val: 14.0, sec: 16, status: "Trip #42 completed" },
            ],
          },
        ],
      },
      {
        id: `${id}-LOG-2`,
        label: "14/09 · Voyage 055N (STS-02 → Container Bay B2)",
        badge: "990 TEU · Historical",
        date: "14/09/2026 (07:00 – 15:30)",
        durationLabel: "31 moves/h · 5.09 kWh/TEU",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (055N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (520 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 14/09/2026 (Voyage 055N): Tuyến vận chuyển khép kín từ Cẩu bờ STS-02 (Bến B2) về Container Bay B2 (990 TEU).",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "Voyage 055N Discharge" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-B2"],
            x: 270,
            w: 220,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-2481",
            cargoLabel: "Voyage 055N → Bay B2 Rows A–E",
            color: "#3b82f6",
            isLoop: true,
            totalTripsInLog: 39,
            phaseOffset: 0,
            waypoints: [
              [380, 104],
              [380, 148],
              [345, 148],
              [345, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-02 (Berth B2)",
            role: "Voyage 055N Midship Unloading",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "7,890 kWh (7.97 kWh/TEU)",
          },
          {
            code: "TRK-2481 Shuttle",
            role: "39 Loops STS-02 ↔ Bay B2",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "31.8 L Diesel",
          },
          {
            code: "Bay B2 (e-RTG #03)",
            role: "990 TEU Stacked in Block B",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "5,040 kWh (5.09 kWh/TEU)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 50,
            timeLabel: "07:00 – 11:15",
            phaseTitle: "1. Morning Discharge Batch (STS-02 → Bay B2)",
            activityDetail:
              "Hạ 520 TEU từ tàu SPIRIT OF MUMBAI (chuyến 055N) về xếp tại Container Bay B2 Rows A–C.",
          },
          {
            startPct: 50,
            endPct: 100,
            timeLabel: "11:15 – 15:30",
            phaseTitle: "2. Afternoon Batch & Audit Verification",
            activityDetail:
              "Hoàn tất 990 TEU với suất tiêu hao 5.09 kWh/TEU tại Bay B2; mã kiểm toán BAYB2-V055N.",
          },
        ],
        meters: [
          {
            id: "MTR-STS-CATLAI-B2",
            name: "Bay B2 e-RTG #03 Power (14/09 Log)",
            protocol: "IEC 61850 / Feeder F-02",
            unit: "kW",
            secondaryUnit: "moves/h",
            totalRecorded: "5,040 kWh",
            intensity: "5.09 kWh / TEU",
            color: "#2563eb",
            series: [
              { t: "07:00", val: 470, sec: 27, status: "Start Voyage 055N batch" },
              { t: "09:30", val: 590, sec: 33, status: "Peak stacking Row B" },
              { t: "11:30", val: 530, sec: 30, status: "Midday steady operation" },
              { t: "13:30", val: 560, sec: 31, status: "Stacking Row D" },
              { t: "15:30", val: 420, sec: 25, status: "990 TEU completed" },
            ],
          },
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-2481 Fuel Telemetry (14/09 Log)",
            protocol: "CAN Bus J1939",
            unit: "L/h",
            secondaryUnit: "km/h",
            totalRecorded: "31.8 L Diesel",
            intensity: "0.39 L / TEU",
            color: "#10b981",
            series: [
              { t: "07:00", val: 15.8, sec: 18, status: "Morning shuttle start" },
              { t: "09:30", val: 18.6, sec: 19, status: "Continuous B2 loops" },
              { t: "11:30", val: 17.2, sec: 18, status: "Midday transfer" },
              { t: "13:30", val: 18.0, sec: 18, status: "Afternoon transfer" },
              { t: "15:30", val: 12.5, sec: 15, status: "Final trip to Bay B2" },
            ],
          },
        ],
      },
      {
        id: `${id}-LOG-3`,
        label: "31/08 · Voyage 054N (STS-02 → Container Bay B2)",
        badge: "1,030 TEU · Historical",
        date: "31/08/2026 (06:30 – 15:15)",
        durationLabel: "33 moves/h · 5.13 kWh/TEU",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (054N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (550 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 31/08/2026 (Voyage 054N): Phục vụ 1,030 TEU giữa Cẩu bờ STS-02 (Bến B2) và Container Bay B2.",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "Voyage 054N Discharge" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-B2"],
            x: 270,
            w: 220,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-2481",
            cargoLabel: "Voyage 054N → Bay B2",
            color: "#3b82f6",
            isLoop: true,
            totalTripsInLog: 44,
            phaseOffset: 0,
            waypoints: [
              [380, 104],
              [380, 148],
              [345, 148],
              [345, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-02 (Berth B2)",
            role: "1,030 TEU Discharged",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "8,290 kWh",
          },
          {
            code: "Bay B2 (e-RTG #03)",
            role: "5,280 kWh Yard Stacking",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "5.13 kWh/TEU",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "06:30 – 15:15",
            phaseTitle: "Full Voyage 054N Transfer (STS-02 → Bay B2)",
            activityDetail:
              "Xếp dỡ hoàn tất 1,030 TEU vào Container Bay B2 với 44 vòng chạy của TRK-2481.",
          },
        ],
        meters: [
          {
            id: "MTR-STS-CATLAI-B2",
            name: "Bay B2 e-RTG #03 Power (31/08 Log)",
            protocol: "IEC 61850 / Feeder F-02",
            unit: "kW",
            secondaryUnit: "moves/h",
            totalRecorded: "5,280 kWh",
            intensity: "5.13 kWh / TEU",
            color: "#2563eb",
            series: [
              { t: "06:30", val: 480, sec: 28, status: "Morning start" },
              { t: "09:00", val: 620, sec: 34, status: "Peak yard stacking" },
              { t: "11:30", val: 575, sec: 32, status: "Midday transfer" },
              { t: "13:30", val: 590, sec: 33, status: "Row E stacking" },
              { t: "15:15", val: 440, sec: 26, status: "1,030 TEU verified" },
            ],
          },
        ],
      },
    ];
  }

  // =========================================================================
  // CASE 2: CONTAINER BAY A1 ("BAY-A1") OR CRANE STS-01 ("STS-01") OR TRK-1092
  // Strictly involves ONLY: Container Bay A1 + either Berth B2 (STS-01) or Berth B1 (STS-B1-01)
  // =========================================================================
  if (id === "BAY-A1" || id === "STS-01" || id === "TRK-1092") {
    return [
      {
        id: `${id}-LOG-1`,
        label:
          id === "TRK-1092"
            ? "Đơn #CMAU-4920182 (STS-01 → Bay A1 Slot 08)"
            : "28/09 · Voyage 056N (STS-01 → Container Bay A1)",
        badge: id === "TRK-1092" ? "Single Order" : "240 TEU Shift",
        date: "28/09/2026 (Ca Sáng 06:00 – 14:00)",
        durationLabel: "e-Truck Zero-Emission Loop",
        mode: id === "TRK-1092" ? "SINGLE_ORDER" : "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (FORWARD QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (056N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (540 kW)",
        scopeDescription:
          "Chỉ hiển thị các chủ thể liên quan trực tiếp đến luồng Container Bay A1 hôm nay: Bến B2 (Hầm mũi Bay 15), Cẩu bờ STS-01, Xe đầu kéo điện TRK-1092 và Cẩu bãi e-RTG #01/02 tại Container Bay A1.",
        activeCranes: [
          { code: "STS-01", x: 315, roleLabel: "Forward Hold Bay 15" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-A1"],
            x: 90,
            w: 210,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-1092",
            cargoLabel: "#CMAU-4920182 → Bay A1-08",
            color: "#0284c7",
            isLoop: id !== "TRK-1092",
            totalTripsInLog: 40,
            phaseOffset: 0,
            waypoints: [
              [315, 104], // Under STS-01 at Berth B2
              [315, 148], // Central Spine Lane
              [175, 148], // West to Bay A1
              [175, 194], // Into Container Bay A1 Slot 08
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-01 (Berth B2)",
            role: "Unloading Ship Hold Bay 15",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "1,850 kWh (7.71 kWh/TEU)",
          },
          {
            code: "TRK-1092 (e-Tractor)",
            role: "STS-01 → Bay A1 Electric Shuttle",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "80.0 kWh LFP Battery",
          },
          {
            code: "Bay A1 (e-RTG #01/02)",
            role: "Stacking Row B Slot A1-08",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "4,680 kWh (Feeder F-02)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 35,
            timeLabel: "13:40:00",
            phaseTitle: "1. STS-01 Discharges #CMAU-4920182 onto TRK-1092",
            activityDetail:
              "Cẩu STS-01 hạ container linh kiện điện tử #CMAU-4920182 (21.4 tấn) từ hầm mũi Bay 15 xuống xe điện TRK-1092.",
          },
          {
            startPct: 35,
            endPct: 75,
            timeLabel: "13:41:30",
            phaseTitle: "2. Zero-Emission Transit to West Yard Bay A1",
            activityDetail:
              "Xe đầu kéo điện TRK-1092 (SOC 84%) di chuyển dọc làn trung tâm về phía Tây vào Container Bay A1.",
          },
          {
            startPct: 75,
            endPct: 100,
            timeLabel: "13:43:15",
            phaseTitle: "3. e-RTG #01 Stacks Container at Bay A1 Row B Slot 08",
            activityDetail:
              "Cẩu khung e-RTG #01 nâng container xếp vào Bay A1 Row B Slot 08; hoàn tất chu trình không phát thải Scope 1.",
          },
        ],
        meters: [
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-1092 Electric Tractor (Feeder F-05)",
            protocol: "OCPP 2.0.1 / CAN Bus",
            unit: "kW",
            secondaryUnit: "% SOC",
            totalRecorded: "80.0 kWh (40 Trips)",
            intensity: "1.00 kWh / TEU",
            color: "#0284c7",
            series: [
              { t: "06:00", val: 45, sec: 98, status: "Departed EV Hub F-05" },
              { t: "09:00", val: 68, sec: 88, status: "STS-01 → Bay A1 shuttle" },
              { t: "12:00", val: 120, sec: 94, status: "30m Opportunity Charge" },
              { t: "13:41", val: 62, sec: 84, status: "Hauling #CMAU4920182" },
              { t: "14:00", val: 54, sec: 81, status: "Stacked at Bay A1-08" },
            ],
          },
          {
            id: "MTR-STS-CATLAI-B2",
            name: "STS-01 & Bay A1 e-RTG #01/02 Power",
            protocol: "IEC 61850 / Feeder F-01 & F-02",
            unit: "kW",
            secondaryUnit: "moves/h",
            totalRecorded: "6,530 kWh Combined",
            intensity: "5.14 kWh / TEU (Bay A1)",
            color: "#10b981",
            series: [
              { t: "06:00", val: 680, sec: 28, status: "e-RTG #01/02 energized" },
              { t: "09:00", val: 1180, sec: 35, status: "Receiving from STS-01" },
              { t: "12:00", val: 920, sec: 30, status: "Midday shift handover" },
              { t: "13:41", val: 1210, sec: 36, status: "Slot A1-08 stacking" },
              { t: "14:00", val: 1150, sec: 34, status: "Steady West Block load" },
            ],
          },
        ],
      },
      {
        id: `${id}-LOG-2`,
        label: "27/09 · Voyage 104S (Berth B1 STS-B1-01 → Bay A1)",
        badge: "1,200 TEU · Berth B1",
        date: "27/09/2026 (Ca Đêm 10:30 – 04:15)",
        durationLabel: "Berth B1 ↔ Bay A1 Direct",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B1",
        berthLabel: "BERTH B1 (WEST FEEDER QUAY)",
        berthX: 85,
        berthW: 175,
        vesselName: "MV TAN CANG GLORY (104S)",
        tugName: "Tug TC-03",
        opsLabel: "OPS-B1 (310 kW)",
        scopeDescription:
          "Nhật ký ngày 27/09/2026 phục vụ tàu MV TAN CANG GLORY tại Bến B1: Chỉ hiển thị Bến B1, Cẩu bờ STS-B1-01 ngay tại Bến B1, xe đầu kéo và Container Bay A1 nằm thẳng trục phía nam Bến B1.",
        activeCranes: [
          { code: "STS-B1-01", x: 165, roleLabel: "Berth B1 Feeder Unloading" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-A1"],
            x: 90,
            w: 210,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-1092",
            cargoLabel: "Berth B1 (STS-B1-01) → Bay A1 Rows E–F",
            color: "#0284c7",
            isLoop: true,
            totalTripsInLog: 36,
            phaseOffset: 0,
            waypoints: [
              [165, 104], // Directly under STS-B1-01 at Berth B1!
              [165, 148],
              [175, 148],
              [175, 194], // Directly into Container Bay A1!
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-B1-01 (Berth B1)",
            role: "West Feeder Quay Hoisting",
            meterCode: "MTR-OPS-CATLAI-B1",
            energyOrFuel: "8,400 kWh (7.00 kWh/TEU)",
          },
          {
            code: "TRK-1092 & 60H03961_C",
            role: "Short-Haul Berth B1 → Bay A1",
            meterCode: "60H03961_C",
            energyOrFuel: "72 kWh EV + 520 L Diesel",
          },
          {
            code: "Bay A1 (e-RTG #01/02)",
            role: "Stacked 1,200 TEU in Rows E–F",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "6,190 kWh (5.16 kWh/TEU)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 50,
            timeLabel: "10:30 – 20:00",
            phaseTitle: "1. Berth B1 Crane STS-B1-01 Unloading to Bay A1",
            activityDetail:
              "Cẩu STS-B1-01 tại Bến B1 dỡ hàng FMCG & nông sản từ tàu TAN CANG GLORY, xe đầu kéo chạy trục thẳng 120m vào thẳng Container Bay A1.",
          },
          {
            startPct: 50,
            endPct: 100,
            timeLabel: "20:00 – 04:15 (+1)",
            phaseTitle: "2. Off-Peak Night Stacking in Bay A1 Rows E–F",
            activityDetail:
              "Hoàn tất 1,200 TEU tại Bay A1 trong khung giờ điện thấp điểm ban đêm; tàu rời Bến B1 đúng 04:15.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-CATLAI-B1",
            name: "Berth B1 STS-B1-01 & OPS Sub-Meter",
            protocol: "Modbus TCP / Feeder F-01",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "14,800 kWh (OPS + STS-B1)",
            intensity: "15.65 kgCO₂e / TEU",
            color: "#10b981",
            series: [
              { t: "10:30", val: 310, sec: 6.6, status: "OPS connected at B1" },
              { t: "14:00", val: 890, sec: 6.59, status: "STS-B1-01 peak unloading" },
              { t: "22:00", val: 740, sec: 6.61, status: "Night off-peak stevedoring" },
              { t: "02:00", val: 420, sec: 6.62, status: "Final lashing at B1" },
              { t: "04:15", val: 0, sec: 6.6, status: "Vessel departed Berth B1" },
            ],
          },
        ],
      },
      {
        id: `${id}-LOG-3`,
        label: "21/09 · Voyage 103S (Berth B1 STS-B1-01 → Bay A1)",
        badge: "1,180 TEU · Berth B1",
        date: "21/09/2026 (09:00 – 02:30)",
        durationLabel: "17.5h Turnaround",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B1",
        berthLabel: "BERTH B1 (WEST FEEDER QUAY)",
        berthX: 85,
        berthW: 175,
        vesselName: "MV TAN CANG GLORY (103S)",
        tugName: "Tug TC-03",
        opsLabel: "OPS-B1 (305 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 21/09/2026 (Voyage 103S): Tuyến vận chuyển trực tiếp từ Bến B1 (Cẩu STS-B1-01) vào Container Bay A1.",
        activeCranes: [
          { code: "STS-B1-01", x: 165, roleLabel: "Berth B1 Feeder Crane" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-A1"],
            x: 90,
            w: 210,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-1092",
            cargoLabel: "Voyage 103S → Bay A1",
            color: "#0284c7",
            isLoop: true,
            totalTripsInLog: 35,
            phaseOffset: 0,
            waypoints: [
              [165, 104],
              [165, 148],
              [175, 148],
              [175, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-B1-01 (Berth B1)",
            role: "1,180 TEU Handled at Berth B1",
            meterCode: "MTR-OPS-CATLAI-B1",
            energyOrFuel: "8,250 kWh",
          },
          {
            code: "Bay A1 (e-RTG #01/02)",
            role: "West Block Stacking",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "6,080 kWh (5.15 kWh/TEU)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "09:00 – 02:30 (+1)",
            phaseTitle: "Voyage 103S Direct Transfer (Berth B1 ↔ Bay A1)",
            activityDetail:
              "Xếp dỡ 1,180 TEU giữa Bến B1 và Container Bay A1; mã xác thực BAYA1-V103S.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-CATLAI-B1",
            name: "Berth B1 Power Profile (21/09 Log)",
            protocol: "Modbus TCP",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "18,100 kWh Total",
            intensity: "15.63 kgCO₂e / TEU",
            color: "#10b981",
            series: [
              { t: "09:30", val: 305, sec: 6.6, status: "OPS connected at B1" },
              { t: "13:00", val: 870, sec: 6.59, status: "STS-B1-01 unloading" },
              { t: "19:00", val: 760, sec: 6.6, status: "Evening stevedoring" },
              { t: "01:00", val: 390, sec: 6.61, status: "Lashing completed" },
              { t: "02:30", val: 0, sec: 6.6, status: "Departed Berth B1" },
            ],
          },
        ],
      },
    ];
  }

  // =========================================================================
  // CASE 3: REEFER BAY R1 ("BAY-R1") OR COLD-CHAIN TRUCK ("TRK-4018")
  // Strictly involves ONLY: Reefer Bay R1 + TRK-4018 + Origin Berth (B2 or B3)
  // =========================================================================
  if (id === "BAY-R1" || id === "TRK-4018") {
    return [
      {
        id: `${id}-LOG-1`,
        label:
          id === "TRK-4018"
            ? "Đơn Lạnh #VNLU-5520188 (STS-02 → Reefer Bay R1-12)"
            : "28/09 · Voyage 056N Cold-Chain (STS-02 → Reefer Bay R1)",
        badge: "6m Unplugged SLA · -25.0°C",
        date: "28/09/2026 (13:32 – 13:38)",
        durationLabel: "240 VinaSeafood Reefers",
        mode: id === "TRK-4018" ? "SINGLE_ORDER" : "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (056N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (540 kW)",
        scopeDescription:
          "Chỉ hiển thị các chủ thể thuộc chuỗi cung ứng lạnh (Cold-Chain): Tàu MV SPIRIT OF MUMBAI tại Bến B2, Cẩu bờ STS-02, Xe chuyên dụng lạnh TRK-4018 và Trạm điện lạnh Reefer Bay R1 (-22°C đến -25°C).",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "Reefer Bay 23 Discharge" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-R1"],
            x: 430,
            w: 225,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-4018",
            cargoLabel: "#VNLU-5520188 (-25°C) → Rack R1-12",
            color: "#f59e0b",
            isLoop: id !== "TRK-4018",
            totalTripsInLog: 30,
            phaseOffset: 0,
            waypoints: [
              [380, 104], // Under STS-02 at Berth B2
              [380, 148],
              [525, 148], // East along Cold-Chain Priority Lane
              [525, 194], // Into Reefer Bay R1 Rack R1-12
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-02 (Berth B2)",
            role: "Priority Reefer Discharge (Bay 23)",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "1m 50s Hoist Cycle",
          },
          {
            code: "TRK-4018 Express",
            role: "6-Min Unplugged Transfer Window",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "0.65 L Diesel / Trip",
          },
          {
            code: "Reefer Bay R1 (Feeder F-03)",
            role: "353 Active 380V Cooling Racks",
            meterCode: "MTR-REEFER-ZONE3",
            energyOrFuel: "12,400 kWh (-22°C to -25°C)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 30,
            timeLabel: "13:32",
            phaseTitle: "1. Unplug on Vessel Bay 23 & STS-02 Hoist",
            activityDetail:
              "Rút điện container cá ngừ #VNLU-5520188 (-25.0°C) trên tàu SPIRIT OF MUMBAI; Cẩu STS-02 hạ thẳng xuống xe TRK-4018.",
          },
          {
            startPct: 30,
            endPct: 75,
            timeLabel: "13:35",
            phaseTitle: "2. Priority Cold-Chain Transit to Reefer Bay R1",
            activityDetail:
              "Xe TRK-4018 chạy làn ưu tiên thẳng về Reefer Bay R1 (nhiệt độ bảo ôn nội bộ giữ ở -24.9°C).",
          },
          {
            startPct: 75,
            endPct: 100,
            timeLabel: "13:38",
            phaseTitle: "3. Plugged into 380V Rack R1-12 (Feeder F-03)",
            activityDetail:
              "Cẩu RTG-04 xếp vào Rack R1-12 và cấp nguồn 380V sau đúng 6 phút (đạt chuẩn SLA < 15 phút, 0% đứt gãy chuỗi lạnh).",
          },
        ],
        meters: [
          {
            id: "MTR-REEFER-ZONE3",
            name: "Reefer Bay R1 Feeder F-03 & Thermal IoT",
            protocol: "Modbus TCP / Cold-Chain IoT",
            unit: "kW",
            secondaryUnit: "°C",
            totalRecorded: "12,400 kWh (240 Boxes)",
            intensity: "51.6 kWh / Reefer Box",
            color: "#f59e0b",
            series: [
              { t: "13:32", val: 1380, sec: -25.0, status: "Unplugged from Ship Bay 23" },
              { t: "13:34", val: 1410, sec: -25.0, status: "Lowered onto TRK-4018" },
              { t: "13:36", val: 1540, sec: -24.9, status: "Transit to Zone 3 Racks" },
              { t: "13:38", val: 1650, sec: -25.0, status: "Plugged into Rack R1-12" },
              { t: "14:00", val: 1590, sec: -25.0, status: "Solar PV offsetting 42%" },
            ],
          },
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-4018 Cold-Chain Shuttle Telemetry",
            protocol: "CAN Bus J1939",
            unit: "L/h",
            secondaryUnit: "km/h",
            totalRecorded: "21.0 L (30 Reefer Trips)",
            intensity: "0.70 L / Box",
            color: "#10b981",
            series: [
              { t: "13:32", val: 3.1, sec: 0, status: "Aligned under STS-02" },
              { t: "13:34", val: 21.0, sec: 16, status: "Departing Berth B2" },
              { t: "13:36", val: 17.5, sec: 18, status: "Entering Reefer Bay R1" },
              { t: "13:38", val: 3.5, sec: 0, status: "Unloaded at Rack R1-12" },
              { t: "14:00", val: 14.0, sec: 16, status: "Returning to Berth B2" },
            ],
          },
        ],
      },
      {
        id: `${id}-LOG-2`,
        label: "14/09 · Voyage 055N Cold-Chain (235 Reefers → Bay R1)",
        badge: "235 Boxes · 12,100 kWh",
        date: "14/09/2026 (08:00 – 17:00)",
        durationLabel: "51.5 kWh/Box · 100% SLA",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (055N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (520 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 14/09/2026 (Voyage 055N): Chuyển 235 container lạnh từ Cẩu STS-02 (Bến B2) về Reefer Bay R1.",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "Voyage 055N Reefers" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-R1"],
            x: 430,
            w: 225,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-4018",
            cargoLabel: "Voyage 055N Reefers → Bay R1",
            color: "#f59e0b",
            isLoop: true,
            totalTripsInLog: 29,
            phaseOffset: 0,
            waypoints: [
              [380, 104],
              [380, 148],
              [525, 148],
              [525, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-02 (Berth B2)",
            role: "235 Reefer Lifts",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "3,760 kWh",
          },
          {
            code: "Reefer Bay R1",
            role: "Zone 3 Cold-Chain Racks",
            meterCode: "MTR-REEFER-ZONE3",
            energyOrFuel: "12,100 kWh (51.5 kWh/Box)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "08:00 – 17:00",
            phaseTitle: "Voyage 055N Cold-Chain Transfer (STS-02 → Reefer Bay R1)",
            activityDetail:
              "Toàn bộ 235 container thủy sản đông lạnh được chuyển từ Bến B2 về cắm điện tại Reefer Bay R1 an toàn.",
          },
        ],
        meters: [
          {
            id: "MTR-REEFER-ZONE3",
            name: "Reefer Bay R1 Feeder F-03 (14/09 Log)",
            protocol: "Modbus TCP",
            unit: "kW",
            secondaryUnit: "°C",
            totalRecorded: "12,100 kWh",
            intensity: "51.5 kWh / Box",
            color: "#f59e0b",
            series: [
              { t: "08:00", val: 1100, sec: -22.0, status: "Start batch 055N" },
              { t: "10:30", val: 1450, sec: -22.1, status: "180 plugs connected" },
              { t: "13:00", val: 1610, sec: -21.9, status: "Peak ambient cooling" },
              { t: "15:00", val: 1520, sec: -22.0, status: "235 plugs active" },
              { t: "17:00", val: 1460, sec: -22.1, status: "Thermal steady state" },
            ],
          },
        ],
      },
      {
        id: `${id}-LOG-3`,
        label: "10/09 · Voyage 011W Pharma Reefers (Berth B3 → Bay R1)",
        badge: "Berth B3 ↔ Bay R1",
        date: "10/09/2026 (14:00 – 22:00)",
        durationLabel: "+4.0°C Medical Cold Chain",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B3",
        berthLabel: "BERTH B3 (EAST ULCV QUAY)",
        berthX: 500,
        berthW: 210,
        vesselName: "MV ONE APUS (011W)",
        tugName: "Tug TC-09",
        opsLabel: "OPS-B3 (820 kW)",
        scopeDescription:
          "Nhật ký ngày 10/09/2026 phục vụ tàu MV ONE APUS tại Bến B3: Chỉ hiển thị Bến B3, Cẩu STS-04 tại Bến B3, xe TRK-4018 và Reefer Bay R1.",
        activeCranes: [
          { code: "STS-04", x: 585, roleLabel: "Berth B3 Reefer Unloading" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-R1"],
            x: 410,
            w: 220,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-4018",
            cargoLabel: "Berth B3 (STS-04) → Reefer Bay R1",
            color: "#f59e0b",
            isLoop: true,
            totalTripsInLog: 34,
            phaseOffset: 0,
            waypoints: [
              [585, 104], // Under STS-04 at Berth B3!
              [585, 148],
              [510, 148],
              [510, 194], // Into Reefer Bay R1!
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-04 (Berth B3)",
            role: "Discharging Chilled Pharma Boxes",
            meterCode: "MTR-STS-TCIT-SPP",
            energyOrFuel: "2,890 kWh",
          },
          {
            code: "TRK-4018 Shuttle",
            role: "Berth B3 → Reefer Bay R1 Rack D",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "24.5 L Diesel",
          },
          {
            code: "Reefer Bay R1",
            role: "+4.0°C Precision Pharma Racks",
            meterCode: "MTR-REEFER-ZONE3",
            energyOrFuel: "4,820 kWh",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "14:00 – 22:00",
            phaseTitle: "Berth B3 STS-04 to Reefer Bay R1 Transfer",
            activityDetail:
              "Hạ 68 container dược phẩm (+4.0°C) từ tàu ONE APUS tại Bến B3 về Reefer Bay R1 Rack D.",
          },
        ],
        meters: [
          {
            id: "MTR-REEFER-ZONE3",
            name: "Reefer Bay R1 Rack D (+4.0°C Pharma)",
            protocol: "Modbus TCP",
            unit: "kW",
            secondaryUnit: "°C",
            totalRecorded: "4,820 kWh",
            intensity: "100% Thermal SLA",
            color: "#0284c7",
            series: [
              { t: "14:00", val: 1210, sec: 4.0, status: "Unloading from Berth B3" },
              { t: "16:00", val: 1390, sec: 4.0, status: "Plugged into Rack D" },
              { t: "18:00", val: 1420, sec: 3.9, status: "Steady +4.0°C holding" },
              { t: "20:00", val: 1350, sec: 4.0, status: "Night cooling load" },
              { t: "22:00", val: 1310, sec: 4.0, status: "Zero excursion verified" },
            ],
          },
        ],
      },
    ];
  }

  // =========================================================================
  // CASE 4: EXPORT CRANE STS-03 ("STS-03") OR EXPORT TRUCK ("TRK-3105")
  // Strictly involves ONLY: Container Bay A1 -> TRK-3105 -> STS-03 (Berth B2)
  // =========================================================================
  if (id === "STS-03" || id === "TRK-3105") {
    return [
      {
        id: `${id}-LOG-1`,
        label:
          id === "TRK-3105"
            ? "Đơn Xuất #HLXU-6192041 (Bay A1-22 → STS-03 Berth B2)"
            : "Ca Sáng 28/09 · Cấp Hàng Xuất (Bay A1 → STS-03 Berth B2)",
        badge: "Export Loading",
        date: "28/09/2026 (08:00 – 14:00)",
        durationLabel: "30 lifts/h · 7.95 kWh/TEU",
        mode: id === "TRK-3105" ? "SINGLE_ORDER" : "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (AFT QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (056N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (540 kW)",
        scopeDescription:
          "Chỉ hiển thị các chủ thể thuộc luồng xuất khẩu (Outbound Export): Container Bay A1 (Slot 22), Xe đầu kéo TRK-3105 và Cẩu bờ STS-03 xếp hàng lên hầm lái Bay 55 tàu MV SPIRIT OF MUMBAI tại Bến B2.",
        activeCranes: [
          { code: "STS-03", x: 445, roleLabel: "Aft Hold Bay 55 Export Loading" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-A1"],
            x: 90,
            w: 210,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-3105",
            cargoLabel: "#HLXU-6192041 (Bay A1-22 → STS-03)",
            color: "#10b981",
            isLoop: id !== "TRK-3105",
            totalTripsInLog: 36,
            phaseOffset: 0,
            waypoints: [
              [195, 194], // Origin: Container Bay A1 Slot 22
              [195, 148], // Up to Central Spine Road
              [445, 148], // East to STS-03
              [445, 104], // Destination: Under STS-03 at Berth B2!
            ],
          },
        ],
        assignedMachines: [
          {
            code: "Bay A1 (e-RTG #02)",
            role: "Retrieving Export Box from Slot A1-22",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "5.14 kWh/TEU (Feeder F-02)",
          },
          {
            code: "TRK-3105 Tractor",
            role: "Outbound Feed Bay A1 → STS-03",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "29.5 L Diesel (36 Trips)",
          },
          {
            code: "STS-03 (Berth B2)",
            role: "Loading Ship Aft Hold Bay 55",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "7,040 kWh (7.95 kWh/TEU)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 30,
            timeLabel: "13:40",
            phaseTitle: "1. e-RTG #02 Retrieves #HLXU-6192041 at Bay A1-22",
            activityDetail:
              "Cẩu bãi e-RTG #02 gắp container xuất khẩu cà phê & điều (#HLXU-6192041, 26.1 tấn) từ Bay A1 Slot 22 đặt lên xe TRK-3105.",
          },
          {
            startPct: 30,
            endPct: 75,
            timeLabel: "13:42",
            phaseTitle: "2. Outbound Transit from Bay A1 to Berth B2 (STS-03)",
            activityDetail:
              "Xe TRK-3105 chạy tốc độ 16 km/h từ bãi Tây sang chân Cẩu bờ STS-03 tại mạn lái Bến B2.",
          },
          {
            startPct: 75,
            endPct: 100,
            timeLabel: "13:45",
            phaseTitle: "3. STS-03 Hoists Container onto Ship Bay 55 Tier 82",
            activityDetail:
              "Cẩu STS-03 (810 kW) cẩu container từ TRK-3105 xếp lên boong hầm 55 tàu MV SPIRIT OF MUMBAI.",
          },
        ],
        meters: [
          {
            id: "MTR-STS-CATLAI-B2",
            name: "STS-03 Export Loading Drive (Feeder F-01)",
            protocol: "Profinet / IEC 61850",
            unit: "kW",
            secondaryUnit: "lifts/h",
            totalRecorded: "7,040 kWh (885 TEU)",
            intensity: "7.95 kWh / TEU",
            color: "#10b981",
            series: [
              { t: "08:00", val: 740, sec: 29, status: "Loading hold Bay 55" },
              { t: "10:00", val: 820, sec: 31, status: "Steady feed from Bay A1" },
              { t: "12:00", val: 790, sec: 30, status: "Deck Tier 82 loading" },
              { t: "13:45", val: 810, sec: 30, status: "Hoisting #HLXU6192041" },
              { t: "16:00", val: 760, sec: 29, status: "144/200 lifts done" },
            ],
          },
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-3105 Export Shuttle Telemetry",
            protocol: "CAN Bus J1939",
            unit: "L/h",
            secondaryUnit: "km/h",
            totalRecorded: "29.5 L (36 Trips)",
            intensity: "0.41 L / TEU",
            color: "#2563eb",
            series: [
              { t: "13:40", val: 3.4, sec: 0, status: "Loading at Bay A1-22" },
              { t: "13:41", val: 19.8, sec: 15, status: "Exiting Bay A1 lane" },
              { t: "13:43", val: 17.2, sec: 16, status: "Cruising to Berth B2" },
              { t: "13:44", val: 12.0, sec: 10, status: "Aligning under STS-03" },
              { t: "13:45", val: 3.1, sec: 0, status: "Lifted by STS-03" },
            ],
          },
        ],
      },
      {
        id: `${id}-LOG-2`,
        label: "27/09 · Ca Đêm Voyage 104S (Berth B1 STS-B1-01 ↔ Bay A1)",
        badge: "Berth B1 Feeder",
        date: "27/09/2026 (18:00 – 03:00)",
        durationLabel: "68 TEU Export · Berth B1",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B1",
        berthLabel: "BERTH B1 (WEST FEEDER QUAY)",
        berthX: 85,
        berthW: 175,
        vesselName: "MV TAN CANG GLORY (104S)",
        tugName: "Tug TC-03",
        opsLabel: "OPS-B1 (310 kW)",
        scopeDescription:
          "Nhật ký ca đêm 27/09/2026 tại Bến B1: Xe TRK-3105 cấp hàng xuất từ Container Bay A1 lên thẳng Cẩu STS-B1-01 tại Bến B1.",
        activeCranes: [
          { code: "STS-B1-01", x: 165, roleLabel: "Berth B1 Export Loading" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-A1"],
            x: 90,
            w: 210,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-3105",
            cargoLabel: "Bay A1 → Berth B1 (STS-B1-01)",
            color: "#10b981",
            isLoop: true,
            totalTripsInLog: 34,
            phaseOffset: 0,
            waypoints: [
              [175, 194],
              [175, 148],
              [165, 148],
              [165, 104], // Directly to Berth B1!
            ],
          },
        ],
        assignedMachines: [
          {
            code: "Bay A1 (e-RTG #01)",
            role: "Export Retrieval Rows E–F",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "350 kWh",
          },
          {
            code: "TRK-3105 Tractor",
            role: "Bay A1 → Berth B1 Shuttle",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "28.0 L Diesel",
          },
          {
            code: "STS-B1-01 (Berth B1)",
            role: "Loading MV TAN CANG GLORY",
            meterCode: "MTR-OPS-CATLAI-B1",
            energyOrFuel: "540 kWh",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "18:00 – 03:00 (+1)",
            phaseTitle: "Night Export Loading (Bay A1 → Berth B1 STS-B1-01)",
            activityDetail:
              "Cấp 68 TEU hàng xuất khẩu từ Container Bay A1 lên tàu MV TAN CANG GLORY tại Bến B1.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-CATLAI-B1",
            name: "Berth B1 STS-B1-01 Power (27/09 Log)",
            protocol: "Modbus TCP",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "8,400 kWh",
            intensity: "7.00 kWh / TEU",
            color: "#10b981",
            series: [
              { t: "18:00", val: 780, sec: 6.6, status: "Export loading start" },
              { t: "20:00", val: 820, sec: 6.6, status: "Steady Bay A1 feed" },
              { t: "22:00", val: 740, sec: 6.61, status: "Off-peak night tariff" },
              { t: "01:00", val: 680, sec: 6.61, status: "Final deck tiers" },
              { t: "03:00", val: 410, sec: 6.62, status: "Lashing completed" },
            ],
          },
        ],
      },
    ];
  }

  // =========================================================================
  // CASE 5: TRUCK TRK-2481 ("TRK-2481")
  // Strictly involves ONLY: Berth B2 (STS-02) + TRK-2481 + Container Bay B2!
  // =========================================================================
  if (id === "TRK-2481") {
    return [
      {
        id: "TRK2481-ORDER-MSCU",
        label: "Đơn #MSCU-8921040 (STS-02 → Container Bay B2 Slot 14)",
        badge: "Single Order (4m 12s)",
        date: "28/09/2026 · 13:42 – 13:46",
        durationLabel: "0.78 L Diesel · 18 km/h",
        mode: "SINGLE_ORDER",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (056N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (540 kW)",
        scopeDescription:
          "Cá nhân hóa lộ trình đơn hàng #MSCU-8921040 của xe TRK-2481: Chỉ hiển thị Bến B2 (Tàu SPIRIT OF MUMBAI), Cẩu bờ STS-02, Xe TRK-2481 và đích đến duy nhất là Container Bay B2 (Slot 14).",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "Discharging #MSCU-8921040" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-B2"],
            x: 270,
            w: 220,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-2481",
            cargoLabel: "#MSCU-8921040 (24.8t) → Slot B2-14",
            color: "#2563eb",
            isLoop: false,
            waypoints: [
              [380, 104], // Under STS-02 at Berth B2
              [380, 148], // Central Spine Lane
              [345, 148],
              [345, 194], // Into Container Bay B2 Slot 14
            ],
          },
        ],
        assignedMachines: [
          {
            code: "TRK-2481 Tractor",
            role: "Hauling #MSCU-8921040 (24,800 kg)",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "0.78 L Diesel (CAN Bus)",
          },
          {
            code: "STS-02 (Berth B2)",
            role: "Unloaded from Ship Hold Bay 35",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "8.05 kWh/TEU (Feeder F-01)",
          },
          {
            code: "Bay B2 (e-RTG #03)",
            role: "Stacked at Row C Slot B2-14",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "5.12 kWh/TEU (Feeder F-02)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 28,
            timeLabel: "13:42:00",
            phaseTitle: "1. Receive #MSCU-8921040 under Crane STS-02 (Berth B2)",
            activityDetail:
              "Xe TRK-2481 dừng tại Lane 1 dưới chân Cẩu bờ STS-02 (Bến B2); nhận công 40HC #MSCU-8921040 (hàng may mặc xuất khẩu).",
          },
          {
            startPct: 28,
            endPct: 74,
            timeLabel: "13:43:30",
            phaseTitle: "2. Loaded Transit along Central Spine to Bay B2",
            activityDetail:
              "Xe TRK-2481 di chuyển tốc độ 18 km/h (lưu lượng CAN Bus 18.2 L/h) vào thẳng làn giao nhận của Container Bay B2.",
          },
          {
            startPct: 74,
            endPct: 100,
            timeLabel: "13:45:50",
            phaseTitle: "3. e-RTG #03 Lifts & Stacks into Bay B2 Row C Slot 14",
            activityDetail:
              "Cẩu bãi e-RTG #03 nâng container khỏi rơ-moóc TRK-2481 và hạ vào đúng vị trí Bay B2 Row C Slot 14.",
          },
        ],
        meters: [
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-2481 CAN Bus J1939 Fuel & Speed",
            protocol: "CAN Bus J1939 / Teltonika GPS",
            unit: "L/h",
            secondaryUnit: "km/h",
            totalRecorded: "0.78 L Diesel (Single Order)",
            intensity: "0.39 L / TEU",
            color: "#2563eb",
            series: [
              { t: "13:42", val: 3.2, sec: 0, status: "Idle under STS-02" },
              { t: "13:43", val: 22.4, sec: 14, status: "Accelerating from Berth B2" },
              { t: "13:44", val: 18.2, sec: 18, status: "Cruising to Bay B2" },
              { t: "13:45", val: 14.5, sec: 11, status: "Entering Bay B2 lane" },
              { t: "13:46", val: 3.0, sec: 0, status: "Unloaded at Slot B2-14" },
            ],
          },
          {
            id: "MTR-STS-CATLAI-B2",
            name: "STS-02 & Bay B2 e-RTG #03 Power",
            protocol: "Profinet / Feeder F-01 & F-02",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "13.17 kWh Combined Lift",
            intensity: "5.12 kWh / TEU (Bay B2)",
            color: "#10b981",
            series: [
              { t: "13:42", val: 860, sec: 22.0, status: "STS-02 lowering onto TRK-2481" },
              { t: "13:43", val: 420, sec: 22.1, status: "STS-02 trolley return" },
              { t: "13:44", val: 310, sec: 22.1, status: "e-RTG #03 pre-positioning" },
              { t: "13:45", val: 580, sec: 22.0, status: "e-RTG #03 hoisting from truck" },
              { t: "13:46", val: 240, sec: 22.1, status: "Stacked at Bay B2-14" },
            ],
          },
        ],
      },
      {
        id: "TRK2481-SHIFT-MORNING",
        label: "Ca Sáng 28/09 (06:00 – 14:00 · 42 Chuyến STS-02 ↔ Bay B2)",
        badge: "Full Shift (42 Trips)",
        date: "28/09/2026 · Shift 01",
        durationLabel: "33.6 L Diesel · 84 TEU",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV SPIRIT OF MUMBAI (056N)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (540 kW)",
        scopeDescription:
          "Toàn bộ Ca Sáng 28/09 (06:00 – 14:00) của riêng xe TRK-2481: Chạy 42 vòng con thoi khép kín giữa Cẩu bờ STS-02 (Bến B2) và Container Bay B2 (vận chuyển 84 TEU).",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "42 Handovers to TRK-2481" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-B2"],
            x: 270,
            w: 220,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-2481",
            cargoLabel: "42 Shuttle Loops (STS-02 ↔ Bay B2)",
            color: "#2563eb",
            isLoop: true,
            totalTripsInLog: 42,
            phaseOffset: 0,
            waypoints: [
              [380, 104],
              [380, 148],
              [345, 148],
              [345, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "TRK-2481 Tractor",
            role: "42 Loops (84 TEU Hauls)",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "33.6 L Diesel (0.40 L/TEU)",
          },
          {
            code: "STS-02 (Berth B2)",
            role: "Origin Crane at Berth B2",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "676 kWh Allocated",
          },
          {
            code: "Bay B2 (e-RTG #03)",
            role: "Destination Yard Block B",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "430 kWh Allocated",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 50,
            timeLabel: "06:00 – 10:00",
            phaseTitle: "1. First 22 Loops: STS-02 → Container Bay B2 (Rows A–B)",
            activityDetail:
              "Xe TRK-2481 chạy liên tục 22 chuyến đầu ca sáng từ chân Cẩu STS-02 về hạ tại Container Bay B2.",
          },
          {
            startPct: 50,
            endPct: 100,
            timeLabel: "10:00 – 14:00",
            phaseTitle: "2. Remaining 20 Loops: STS-02 → Container Bay B2 (Rows C–D)",
            activityDetail:
              "Hoàn tất 42/42 chuyến trong ca sáng (tổng tiêu thụ 33.6 Lít dầu Diesel, đạt hiệu suất 0.40 L/TEU).",
          },
        ],
        meters: [
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-2481 Shift Cumulative Fuel (Liters)",
            protocol: "CAN Bus J1939",
            unit: "L",
            secondaryUnit: "km/h",
            totalRecorded: "33.6 L (42 Trips)",
            intensity: "0.40 L / TEU",
            color: "#2563eb",
            series: [
              { t: "06:00", val: 1.6, sec: 17, status: "Trip #02 to Bay B2" },
              { t: "08:00", val: 9.2, sec: 18, status: "Trip #12 to Bay B2" },
              { t: "10:00", val: 17.6, sec: 19, status: "Trip #22 to Bay B2" },
              { t: "12:00", val: 25.4, sec: 18, status: "Trip #32 to Bay B2" },
              { t: "14:00", val: 33.6, sec: 18, status: "Trip #42 completed" },
            ],
          },
        ],
      },
      {
        id: "TRK2481-SHIFT-PREV",
        label: "Ca Chiều 27/09 (14:00 – 22:00 · 38 Chuyến STS-02 ↔ Bay B2)",
        badge: "27/09 Shift (38 Trips)",
        date: "27/09/2026 · Shift 02",
        durationLabel: "31.2 L Diesel · 76 TEU",
        mode: "SHIFT_SHUTTLE",
        berthCode: "B2",
        berthLabel: "BERTH B2 (CENTRAL QUAY)",
        berthX: 280,
        berthW: 200,
        vesselName: "MV WAN HAI 512 (884E)",
        tugName: "Tug TC-01",
        opsLabel: "OPS-B2 (480 kW)",
        scopeDescription:
          "Nhật ký Ca Chiều ngày 27/09/2026 của xe TRK-2481: Chạy 38 chuyến giữa Cẩu bờ STS-02 (Bến B2) và Container Bay B2.",
        activeCranes: [
          { code: "STS-02", x: 380, roleLabel: "38 Handovers to TRK-2481" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-B2"],
            x: 270,
            w: 220,
          },
        ],
        truckRoutes: [
          {
            truckCode: "TRK-2481",
            cargoLabel: "38 Shuttle Loops (STS-02 ↔ Bay B2)",
            color: "#2563eb",
            isLoop: true,
            totalTripsInLog: 38,
            phaseOffset: 0,
            waypoints: [
              [380, 104],
              [380, 148],
              [345, 148],
              [345, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "TRK-2481 Tractor",
            role: "38 Loops (76 TEU Hauls)",
            meterCode: "MTR-TRK-FLEET-B2",
            energyOrFuel: "31.2 L Diesel (0.41 L/TEU)",
          },
          {
            code: "Bay B2 (e-RTG #03)",
            role: "Stacking Rows A–D",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "390 kWh",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "14:00 – 22:00",
            phaseTitle: "27/09 Afternoon Shift (38 Loops STS-02 ↔ Bay B2)",
            activityDetail:
              "Vận chuyển 76 TEU từ Bến B2 về Container Bay B2; mã kiểm toán TRK2481-S2.",
          },
        ],
        meters: [
          {
            id: "MTR-TRK-FLEET-B2",
            name: "TRK-2481 Fuel Log (27/09 Shift 2)",
            protocol: "CAN Bus J1939",
            unit: "L",
            secondaryUnit: "km/h",
            totalRecorded: "31.2 L (38 Trips)",
            intensity: "0.41 L / TEU",
            color: "#2563eb",
            series: [
              { t: "14:00", val: 2.1, sec: 18, status: "Shift 2 start" },
              { t: "16:00", val: 9.8, sec: 18, status: "Trip #12 to Bay B2" },
              { t: "18:00", val: 17.5, sec: 17, status: "Trip #22 to Bay B2" },
              { t: "20:00", val: 24.8, sec: 17, status: "Trip #30 to Bay B2" },
              { t: "22:00", val: 31.2, sec: 16, status: "Trip #38 completed" },
            ],
          },
        ],
      },
    ];
  }

  // =========================================================================
  // CASE 6: EAST DEEP-SEA QUAY: VSL-02 ("MV ONE APUS"), STS-04, OR BAY-C1
  // Strictly involves ONLY: Berth B3 + STS-04 & STS-05 (on Berth B3!) + Bay C1 (+ BESS) & Reefer Bay R1!
  // (No Berth B1, No Berth B2, No Bay A1, No Bay B2!)
  // =========================================================================
  if (id === "VSL-02" || id === "STS-04" || id === "BAY-C1") {
    const isSingleBayC1 = id === "BAY-C1" || id === "STS-04";
    return [
      {
        id: `${id}-V012W`,
        label: "28/09 · Voyage 012W — MV ONE APUS (Tại Bến B3 · 3,400 TEU)",
        badge: "Berth B3 ULCV + Regen",
        date: "28/09/2026 13:30 → 30/09/2026 08:00",
        durationLabel: "70,300 kWh · -1.5MW Regen Shaved",
        mode: "VOYAGE_FULL",
        berthCode: "B3",
        berthLabel: "BERTH B3 (EAST ULCV QUAY)",
        berthX: 485,
        berthW: 225,
        vesselName: "MV ONE APUS (012W)",
        tugName: "Escort Tug TC-09",
        opsLabel: "Dual OPS-B3 (840 kW)",
        scopeDescription: isSingleBayC1
          ? "Chỉ hiển thị các chủ thể trực tiếp tham gia luồng Bến B3 ↔ Container Bay C1: Tàu MV ONE APUS cập Bến B3, Cẩu bờ STS-04 ngay tại Bến B3, xe đầu kéo TRK-5204 và Container Bay C1 (+ Thu hồi động năng cẩu 1.5MW)."
          : "Toàn trình chuyến 012W của tàu MV ONE APUS tại Bến B3: Tàu lai TC-09 dẫn luồng cập Bến B3, cấp điện bờ Dual-Bus OPS-B3 (840 kW), Cẩu bờ STS-04 & STS-05 tại Bến B3 xếp dỡ với Container Bay C1 và Reefer Bay R1, kèm Thu hồi động năng cẩu 1.5MW cắt đỉnh.",
        activeCranes: isSingleBayC1
          ? [{ code: "STS-04", x: 585, roleLabel: "Berth B3 Super Post-Panamax" }]
          : [
              { code: "STS-04", x: 545, roleLabel: "Berth B3 Hold Bay 42" },
              { code: "STS-05", x: 635, roleLabel: "Berth B3 Hold Bay 64" },
            ],
        activeBays: isSingleBayC1
          ? [{ ...BAY_DEFINITIONS["BAY-C1"], x: 485, w: 225 }]
          : [
              { ...BAY_DEFINITIONS["BAY-R1"], x: 310, w: 185 },
              { ...BAY_DEFINITIONS["BAY-C1"], x: 515, w: 205 },
            ],
        truckRoutes: isSingleBayC1
          ? [
              {
                truckCode: "TRK-5204",
                cargoLabel: "Berth B3 (STS-04) ↔ Bay C1-02",
                color: "#10b981",
                isLoop: true,
                totalTripsInLog: 48,
                phaseOffset: 0,
                waypoints: [
                  [585, 104], // Under STS-04 at Berth B3!
                  [585, 148],
                  [600, 148],
                  [600, 194], // Directly into Container Bay C1!
                ],
              },
            ]
          : [
              {
                truckCode: "TRK-5204",
                cargoLabel: "STS-05 (Berth B3) ↔ Bay C1",
                color: "#10b981",
                isLoop: true,
                totalTripsInLog: 52,
                phaseOffset: 0,
                waypoints: [
                  [635, 104], // Under STS-05 at Berth B3
                  [635, 148],
                  [615, 148],
                  [615, 194], // Into Bay C1
                ],
              },
              {
                truckCode: "TRK-4018",
                cargoLabel: "STS-04 (Berth B3) → Reefer Bay R1",
                color: "#f59e0b",
                dashed: true,
                isLoop: true,
                totalTripsInLog: 34,
                phaseOffset: 0.45,
                waypoints: [
                  [545, 104], // Under STS-04 at Berth B3
                  [545, 148],
                  [402, 148],
                  [402, 194], // Into Reefer Bay R1
                ],
              },
            ],
        assignedMachines: [
          {
            code: "Dual-Bus OPS B3",
            role: "22kV/6.6kV Shore Power at Berth B3",
            meterCode: "MTR-OPS-TCIT-B01",
            energyOrFuel: "24,500 kWh (-38.2t CO₂)",
          },
          {
            code: isSingleBayC1 ? "STS-04 (Berth B3)" : "STS-04 & STS-05 (Berth B3)",
            role: "Super Post-Panamax Hoisting at B3",
            meterCode: "MTR-STS-TCIT-SPP",
            energyOrFuel: "29,000 kWh (8.53 kWh/TEU)",
          },
          {
            code: "Bay C1 + 1.5MW Crane Regen",
            role: "EU Export Staging & P90 Regen Recovery",
            meterCode: "MTR-REGEN-TCIT-1.5MW",
            energyOrFuel: "3,450 kWh Regen Recovered",
          },
          {
            code: "Escort Tug TC-09",
            role: "Berth B3 Docking & Unberthing",
            meterCode: "MTR-TUG-CAIMEP-02",
            energyOrFuel: "2,100 L MGO (Coriolis)",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 20,
            timeLabel: "13:30 – 14:15",
            phaseTitle: "1. Approach & Escort Tug Docking at Berth B3",
            activityDetail:
              "Tàu mẹ ULCV MV ONE APUS tiến vào luồng sâu, tàu lai TC-09 ép cập chính xác vào Bến B3 và kết nối trạm điện bờ Dual-Bus OPS-B3 (840 kW).",
          },
          {
            startPct: 20,
            endPct: 82,
            timeLabel: "14:15 – 06:00 (+2)",
            phaseTitle:
              "2. Berth B3 Cranes STS-04/05 Handling ↔ Bay C1 & Crane Regen Peak Shaving",
            activityDetail:
              "Cẩu STS-04 & STS-05 tại Bến B3 bốc dỡ container trực tiếp với Container Bay C1 (xe TRK-5204) và Reefer Bay R1; Hệ thống thu hồi động năng cẩu 1.5MW tự động hoàn trả công suất cắt đỉnh phụ tải.",
          },
          {
            startPct: 82,
            endPct: 100,
            timeLabel: "06:00 – 08:00 (+2)",
            phaseTitle: "3. OPS-B3 Disconnect & Departure to Rotterdam",
            activityDetail:
              "Hoàn tất 3,400 TEU tại Bến B3; ngắt cáp OPS-B3, tàu lai TC-09 hỗ trợ rời bến đi châu Âu.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-TCIT-B01",
            name: "Berth B3 Dual-Bus OPS 22kV/6.6kV",
            protocol: "IEC 61850 MMS",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "24,500 kWh",
            intensity: "7.21 kWh / TEU",
            color: "#10b981",
            series: [
              { t: "13:30", val: 0, sec: 6.6, status: "Approaching Berth B3" },
              { t: "14:15", val: 680, sec: 6.6, status: "OPS-B3 synchronized" },
              { t: "18:00", val: 840, sec: 6.58, status: "Full ULCV hoteling" },
              { t: "14:00", val: 860, sec: 6.57, status: "Steady OPS-B3 load" },
              { t: "07:30", val: 150, sec: 6.61, status: "Unberthing from B3" },
            ],
          },
          {
            id: "MTR-REGEN-TCIT-1.5MW",
            name: "Bay C1 1.5MW Crane Regen Recovery",
            protocol: "Modbus TCP EMS",
            unit: "kW",
            secondaryUnit: "% Eff",
            totalRecorded: "3,450 kWh Recovered",
            intensity: "-1.5 MW Peak Cut",
            color: "#f59e0b",
            series: [
              { t: "13:30", val: 0, sec: 96, status: "Regen Busbar Standby" },
              { t: "14:15", val: 1450, sec: 94, status: "Hoist regen recovery as STS-04 starts" },
              { t: "18:00", val: 1500, sec: 95, status: "Shaving Berth B3 crane peak" },
              { t: "14:00", val: 600, sec: 93, status: "Continuous e-RTG regen recovery" },
              { t: "07:30", val: 450, sec: 95, status: "Completed peak shaving" },
            ],
          },
        ],
      },
      {
        id: `${id}-V011W`,
        label: "10/09 · Voyage 011W — MV ONE APUS (Tại Bến B3 · 3,350 TEU)",
        badge: "10/09 Historical",
        date: "10/09/2026 (40.5h Port Call at Berth B3)",
        durationLabel: "68,900 kWh · 18.81 kgCO₂e/TEU",
        mode: "VOYAGE_FULL",
        berthCode: "B3",
        berthLabel: "BERTH B3 (EAST ULCV QUAY)",
        berthX: 485,
        berthW: 225,
        vesselName: "MV ONE APUS (011W)",
        tugName: "Escort Tug TC-09",
        opsLabel: "Dual OPS-B3 (810 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 10/09/2026 (Voyage 011W) tại Bến B3: Xếp dỡ 3,350 TEU giữa Bến B3 (STS-04/05) và Container Bay C1.",
        activeCranes: [
          { code: "STS-04", x: 545, roleLabel: "Berth B3 Crane #04" },
          { code: "STS-05", x: 635, roleLabel: "Berth B3 Crane #05" },
        ],
        activeBays: [{ ...BAY_DEFINITIONS["BAY-C1"], x: 485, w: 225 }],
        truckRoutes: [
          {
            truckCode: "TRK-5204",
            cargoLabel: "Berth B3 (STS-04/05) ↔ Bay C1",
            color: "#10b981",
            isLoop: true,
            totalTripsInLog: 50,
            phaseOffset: 0,
            waypoints: [
              [585, 104],
              [585, 148],
              [600, 148],
              [600, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-04 & STS-05 (Berth B3)",
            role: "3,350 TEU Handled at B3",
            meterCode: "MTR-STS-TCIT-SPP",
            energyOrFuel: "28,400 kWh (8.48 kWh/TEU)",
          },
          {
            code: "Bay C1 + 1.5MW Crane Regen",
            role: "East Block & Regen Shaving",
            meterCode: "MTR-REGEN-TCIT-1.5MW",
            energyOrFuel: "3,200 kWh Recovered",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "10/09 – 12/09",
            phaseTitle: "Voyage 011W Full Turnaround at Berth B3",
            activityDetail:
              "Tàu MV ONE APUS cập Bến B3, bốc dỡ 3,350 TEU với Container Bay C1 và rời cảng đúng tiến độ.",
          },
        ],
        meters: [
          {
            id: "MTR-STS-TCIT-SPP",
            name: "Berth B3 STS-04/05 Power (10/09 Log)",
            protocol: "IEC 61850",
            unit: "kW",
            secondaryUnit: "moves/h",
            totalRecorded: "28,400 kWh",
            intensity: "8.48 kWh / TEU",
            color: "#2563eb",
            series: [
              { t: "08:00", val: 0, sec: 0, status: "Berthing at B3" },
              { t: "10:00", val: 2950, sec: 64, status: "STS-04/05 active" },
              { t: "18:00", val: 3320, sec: 70, status: "Peak ULCV handling" },
              { t: "04:00", val: 2800, sec: 60, status: "Night shift at B3" },
              { t: "16:00", val: 0, sec: 0, status: "Departed Berth B3" },
            ],
          },
        ],
      },
      {
        id: `${id}-V010W`,
        label: "24/08 · Voyage 010W — MV ONE APUS (Tại Bến B3 · 3,480 TEU)",
        badge: "24/08 Historical",
        date: "24/08/2026 (42.0h Port Call at Berth B3)",
        durationLabel: "71,400 kWh · 18.92 kgCO₂e/TEU",
        mode: "VOYAGE_FULL",
        berthCode: "B3",
        berthLabel: "BERTH B3 (EAST ULCV QUAY)",
        berthX: 485,
        berthW: 225,
        vesselName: "MV ONE APUS (010W)",
        tugName: "Escort Tug TC-09",
        opsLabel: "Dual OPS-B3 (850 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 24/08/2026 (Voyage 010W) tại Bến B3: Xếp dỡ 3,480 TEU giữa Bến B3 và Container Bay C1.",
        activeCranes: [
          { code: "STS-04", x: 545, roleLabel: "Berth B3 Crane #04" },
          { code: "STS-05", x: 635, roleLabel: "Berth B3 Crane #05" },
        ],
        activeBays: [{ ...BAY_DEFINITIONS["BAY-C1"], x: 485, w: 225 }],
        truckRoutes: [
          {
            truckCode: "TRK-5204",
            cargoLabel: "Berth B3 ↔ Bay C1 (3,480 TEU)",
            color: "#10b981",
            isLoop: true,
            totalTripsInLog: 54,
            phaseOffset: 0,
            waypoints: [
              [585, 104],
              [585, 148],
              [600, 148],
              [600, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-04 & STS-05 (Berth B3)",
            role: "3,480 TEU Handled at B3",
            meterCode: "MTR-STS-TCIT-SPP",
            energyOrFuel: "29,600 kWh",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "24/08 – 26/08",
            phaseTitle: "Voyage 010W Turnaround at Berth B3",
            activityDetail:
              "Hoàn tất 3,480 TEU tại Bến B3; mã kiểm toán 9f30a18d...3e04.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-TCIT-B01",
            name: "Berth B3 OPS & Crane Total (24/08 Log)",
            protocol: "IEC 61850",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "71,400 kWh",
            intensity: "18.92 kgCO₂e / TEU",
            color: "#10b981",
            series: [
              { t: "07:00", val: 0, sec: 6.6, status: "Arrival at B3" },
              { t: "09:00", val: 850, sec: 6.59, status: "OPS-B3 active" },
              { t: "18:00", val: 870, sec: 6.58, status: "Peak hoteling" },
              { t: "06:00", val: 810, sec: 6.6, status: "Day 2 operations" },
              { t: "23:00", val: 0, sec: 6.61, status: "Departed Berth B3" },
            ],
          },
        ],
      },
    ];
  }

  // =========================================================================
  // CASE 7: WEST FEEDER QUAY: VSL-03 ("MV TAN CANG GLORY" AT BERTH B1)
  // Strictly involves ONLY: Berth B1 + STS-B1-01 & STS-B1-02 (directly on Berth B1!)
  // + Trucks 60H03961_C & TRK-3105 driving strictly Berth B1 <-> Container Bay A1!
  // Zero trucks going to Berth B2! Zero unrelated bays (No Bay B2, No R1, No C1)!
  // =========================================================================
  if (id === "VSL-03") {
    return [
      {
        id: "VSL03-V104S",
        label: "28/09 · Voyage 104S — MV TAN CANG GLORY (Tại Bến B1 · 1,200 TEU)",
        badge: "17.75h Completed at Berth B1",
        date: "27/09/2026 10:00 → 28/09/2026 04:15",
        durationLabel: "18,400 kWh · 15.65 kgCO₂e/TEU",
        mode: "VOYAGE_FULL",
        berthCode: "B1",
        berthLabel: "BERTH B1 (WEST FEEDER QUAY)",
        berthX: 85,
        berthW: 195,
        vesselName: "MV TAN CANG GLORY (104S)",
        tugName: "Tug TC-03 (B24 Biofuel)",
        opsLabel: "OPS-B1 (310 kW)",
        scopeDescription:
          "Mô phỏng chính xác toàn trình chuyến 104S tại Bến B1: Chỉ hiển thị Bến B1 (Tàu MV TAN CANG GLORY + Tàu lai TC-03 + Trạm OPS-B1), 2 Cẩu bờ STS-B1-01 & STS-B1-02 gắn trực tiếp trên Bến B1, và đội xe đầu kéo (60H03961_C, TRK-3105) chạy thẳng giữa Bến B1 và Container Bay A1.",
        activeCranes: [
          { code: "STS-B1-01", x: 140, roleLabel: "Berth B1 Forward Crane" },
          { code: "STS-B1-02", x: 215, roleLabel: "Berth B1 Aft Crane" },
        ],
        activeBays: [
          {
            ...BAY_DEFINITIONS["BAY-A1"],
            x: 85,
            w: 215,
          },
        ],
        truckRoutes: [
          {
            truckCode: "60H03961_C",
            cargoLabel: "STS-B1-01 (Berth B1) → Bay A1 Rows E–F",
            color: "#38bdf8",
            isLoop: true,
            totalTripsInLog: 38,
            phaseOffset: 0,
            waypoints: [
              [140, 104], // Directly under STS-B1-01 on Berth B1!
              [140, 148],
              [155, 148],
              [155, 194], // Directly into Container Bay A1!
            ],
          },
          {
            truckCode: "TRK-3105",
            cargoLabel: "Bay A1 → STS-B1-02 (Berth B1 Export)",
            color: "#10b981",
            dashed: true,
            isLoop: true,
            totalTripsInLog: 32,
            phaseOffset: 0.5,
            waypoints: [
              [225, 194], // From Container Bay A1
              [225, 148],
              [215, 148],
              [215, 104], // Directly under STS-B1-02 on Berth B1!
            ],
          },
        ],
        assignedMachines: [
          {
            code: "MTR-OPS-B1",
            role: "Berth B1 6.6kV Shore Power",
            meterCode: "MTR-OPS-CATLAI-B1",
            energyOrFuel: "6,400 kWh (-14.2t CO₂)",
          },
          {
            code: "STS-B1-01 & STS-B1-02",
            role: "Berth B1 Feeder Quay Cranes",
            meterCode: "MTR-OPS-CATLAI-B1",
            energyOrFuel: "8,400 kWh (7.00 kWh/TEU)",
          },
          {
            code: "Tractor Fleet (60H03961_C)",
            role: "Berth B1 ↔ Container Bay A1",
            meterCode: "60H03961_C",
            energyOrFuel: "1,100 L Diesel (0.92 L/TEU)",
          },
          {
            code: "Container Bay A1 (e-RTG #01)",
            role: "Stacked 1,200 TEU in Rows E–F",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "3,600 kWh Yard & Reefers",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 20,
            timeLabel: "10:00 – 10:30 (-1d)",
            phaseTitle: "1. Arrival at West Berth B1 & 6.6kV OPS-B1 Connection",
            activityDetail:
              "Tàu MV TAN CANG GLORY cập Bến B1 với hỗ trợ của tàu lai TC-03 (chạy nhiên liệu sinh học B24); kết nối trạm điện bờ OPS-B1 (310 kW).",
          },
          {
            startPct: 20,
            endPct: 80,
            timeLabel: "10:30 – 03:00 (+1)",
            phaseTitle:
              "2. Berth B1 Cranes (STS-B1-01/02) & Direct Shuttle to Bay A1",
            activityDetail:
              "Hai cẩu bờ STS-B1-01 và STS-B1-02 tại Bến B1 bốc dỡ 1,200 TEU; xe đầu kéo 60H03961_C và TRK-3105 chạy trục ngắn trực tiếp giữa Bến B1 và Container Bay A1.",
          },
          {
            startPct: 80,
            endPct: 100,
            timeLabel: "03:00 – 04:15 (+1)",
            phaseTitle: "3. OPS-B1 Disconnect & Departure from Berth B1",
            activityDetail:
              "Hoàn tất 1,200/1,200 TEU tại Bến B1; ngắt điện bờ OPS-B1 và rời bến đi Singapore đúng lịch trình 100%.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-CATLAI-B1",
            name: "Berth B1 OPS & STS-B1-01/02 Sub-Meter",
            protocol: "Modbus TCP / Feeder F-01",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "18,400 kWh Total",
            intensity: "15.65 kgCO₂e / TEU",
            color: "#10b981",
            series: [
              { t: "10:30", val: 310, sec: 6.6, status: "OPS-B1 synchronized" },
              { t: "14:00", val: 890, sec: 6.59, status: "STS-B1-01/02 full load" },
              { t: "22:00", val: 740, sec: 6.61, status: "Off-peak night shift" },
              { t: "02:00", val: 420, sec: 6.62, status: "Final lashing at B1" },
              { t: "04:15", val: 0, sec: 6.6, status: "Departed Berth B1" },
            ],
          },
          {
            id: "60H03961_C",
            name: "Tractor 60H03961_C Fuel Tank (Berth B1 ↔ Bay A1)",
            protocol: "Ultrasonic Fuel & GPS",
            unit: "Liters",
            secondaryUnit: "km/h",
            totalRecorded: "1,100 L Consumed",
            intensity: "0.92 L / TEU",
            color: "#38bdf8",
            series: [
              { t: "10:30", val: 365, sec: 18, status: "Full tank at Berth B1" },
              { t: "14:00", val: 310, sec: 20, status: "Shuttling B1 → Bay A1" },
              { t: "22:00", val: 262, sec: 16, status: "Night stacking Bay A1" },
              { t: "02:00", val: 128, sec: 15, status: "Final export feed to B1" },
              { t: "04:15", val: 70, sec: 0, status: "Voyage 104S completed" },
            ],
          },
        ],
      },
      {
        id: "VSL03-V103S",
        label: "21/09 · Voyage 103S — MV TAN CANG GLORY (Tại Bến B1 · 1,180 TEU)",
        badge: "21/09 Completed at Berth B1",
        date: "21/09/2026 (17.5h Port Call at Berth B1)",
        durationLabel: "18,100 kWh · 15.63 kgCO₂e/TEU",
        mode: "VOYAGE_FULL",
        berthCode: "B1",
        berthLabel: "BERTH B1 (WEST FEEDER QUAY)",
        berthX: 85,
        berthW: 195,
        vesselName: "MV TAN CANG GLORY (103S)",
        tugName: "Tug TC-03",
        opsLabel: "OPS-B1 (305 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 21/09/2026 (Voyage 103S) tại Bến B1: Cẩu STS-B1-01 & STS-B1-02 bốc dỡ 1,180 TEU giữa Bến B1 và Container Bay A1.",
        activeCranes: [
          { code: "STS-B1-01", x: 140, roleLabel: "Berth B1 Forward Crane" },
          { code: "STS-B1-02", x: 215, roleLabel: "Berth B1 Aft Crane" },
        ],
        activeBays: [{ ...BAY_DEFINITIONS["BAY-A1"], x: 85, w: 215 }],
        truckRoutes: [
          {
            truckCode: "60H03961_C",
            cargoLabel: "Berth B1 (STS-B1-01) ↔ Bay A1",
            color: "#38bdf8",
            isLoop: true,
            totalTripsInLog: 36,
            phaseOffset: 0,
            waypoints: [
              [140, 104],
              [140, 148],
              [155, 148],
              [155, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-B1-01 & STS-B1-02",
            role: "1,180 TEU Handled at Berth B1",
            meterCode: "MTR-OPS-CATLAI-B1",
            energyOrFuel: "8,250 kWh",
          },
          {
            code: "Container Bay A1",
            role: "West Block Stacking",
            meterCode: "MTR-STS-CATLAI-B2",
            energyOrFuel: "6,080 kWh",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "21/09 (09:00 – 02:30)",
            phaseTitle: "Voyage 103S Turnaround at Berth B1",
            activityDetail:
              "Xếp dỡ 1,180 TEU tại Bến B1 với Container Bay A1; mã kiểm toán 2d90e11c...7a23.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-CATLAI-B1",
            name: "Berth B1 Power Profile (21/09 Log)",
            protocol: "Modbus TCP",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "18,100 kWh",
            intensity: "15.63 kgCO₂e / TEU",
            color: "#10b981",
            series: [
              { t: "09:00", val: 305, sec: 6.6, status: "OPS-B1 connected" },
              { t: "13:00", val: 870, sec: 6.59, status: "STS-B1-01/02 active" },
              { t: "19:00", val: 760, sec: 6.6, status: "Evening stevedoring" },
              { t: "01:00", val: 390, sec: 6.61, status: "Lashing at Berth B1" },
              { t: "02:30", val: 0, sec: 6.6, status: "Departed Berth B1" },
            ],
          },
        ],
      },
      {
        id: "VSL03-V102S",
        label: "14/09 · Voyage 102S — MV TAN CANG GLORY (Tại Bến B1 · 1,150 TEU)",
        badge: "14/09 Completed at Berth B1",
        date: "14/09/2026 (17.0h Port Call at Berth B1)",
        durationLabel: "17,650 kWh · 15.59 kgCO₂e/TEU",
        mode: "VOYAGE_FULL",
        berthCode: "B1",
        berthLabel: "BERTH B1 (WEST FEEDER QUAY)",
        berthX: 85,
        berthW: 195,
        vesselName: "MV TAN CANG GLORY (102S)",
        tugName: "Tug TC-03",
        opsLabel: "OPS-B1 (300 kW)",
        scopeDescription:
          "Nhật ký lịch sử ngày 14/09/2026 (Voyage 102S) tại Bến B1: Xếp dỡ 1,150 TEU giữa Bến B1 và Container Bay A1.",
        activeCranes: [
          { code: "STS-B1-01", x: 140, roleLabel: "Berth B1 Forward Crane" },
          { code: "STS-B1-02", x: 215, roleLabel: "Berth B1 Aft Crane" },
        ],
        activeBays: [{ ...BAY_DEFINITIONS["BAY-A1"], x: 85, w: 215 }],
        truckRoutes: [
          {
            truckCode: "60H03961_C",
            cargoLabel: "Berth B1 ↔ Bay A1 (1,150 TEU)",
            color: "#38bdf8",
            isLoop: true,
            totalTripsInLog: 35,
            phaseOffset: 0,
            waypoints: [
              [140, 104],
              [140, 148],
              [155, 148],
              [155, 194],
            ],
          },
        ],
        assignedMachines: [
          {
            code: "STS-B1-01 & STS-B1-02",
            role: "1,150 TEU Handled at Berth B1",
            meterCode: "MTR-OPS-CATLAI-B1",
            energyOrFuel: "8,050 kWh",
          },
        ],
        timelinePhases: [
          {
            startPct: 0,
            endPct: 100,
            timeLabel: "14/09 (10:00 – 03:00)",
            phaseTitle: "Voyage 102S Turnaround at Berth B1",
            activityDetail:
              "Hoàn tất 1,150 TEU tại Bến B1; mã kiểm toán 6c12f89b...1d40.",
          },
        ],
        meters: [
          {
            id: "MTR-OPS-CATLAI-B1",
            name: "Berth B1 Power Profile (14/09 Log)",
            protocol: "Modbus TCP",
            unit: "kW",
            secondaryUnit: "kV",
            totalRecorded: "17,650 kWh",
            intensity: "15.59 kgCO₂e / TEU",
            color: "#10b981",
            series: [
              { t: "10:00", val: 300, sec: 6.6, status: "OPS-B1 connected" },
              { t: "14:00", val: 850, sec: 6.6, status: "STS-B1-01/02 active" },
              { t: "20:00", val: 730, sec: 6.61, status: "Night stevedoring" },
              { t: "01:30", val: 380, sec: 6.61, status: "Lashing at B1" },
              { t: "03:00", val: 0, sec: 6.6, status: "Departed Berth B1" },
            ],
          },
        ],
      },
    ];
  }

  // =========================================================================
  // CASE 8 (DEFAULT / VSL-01 "MV SPIRIT OF MUMBAI" AT BERTH B2):
  // Strictly involves ONLY: Berth B2 + STS-01, STS-02, STS-03 (on Berth B2)
  // + Bay A1, Bay B2, Reefer Bay R1 (the 3 bays serving MV SPIRIT OF MUMBAI — NO Bay C1!)
  // =========================================================================
  return [
    {
      id: "VSL01-V056N",
      label: "28/09 · Voyage 056N — MV SPIRIT OF MUMBAI (Tại Bến B2 · 2,850 TEU)",
      badge: "34.75h Turnaround at Berth B2",
      date: "28/09/2026 06:30 → 29/09/2026 18:00",
      durationLabel: "53,400 kWh · 17.48 kgCO₂e/TEU",
      mode: "VOYAGE_FULL",
      berthCode: "B2",
      berthLabel: "BERTH B2 (CENTRAL OPS QUAY)",
      berthX: 250,
      berthW: 240,
      vesselName: "MV SPIRIT OF MUMBAI (056N)",
      tugName: "Tug TC-01",
      opsLabel: "OPS-B2 (540 kW)",
      scopeDescription:
        "Toàn trình chuyến 056N của tàu MV SPIRIT OF MUMBAI tại Bến B2: Chỉ hiển thị Bến B2, 3 Cẩu bờ STS-01, STS-02, STS-03 trực tiếp trên Bến B2, và 3 bãi phục vụ chuyến tàu này (Bay A1, Bay B2, Reefer Bay R1).",
      activeCranes: [
        { code: "STS-01", x: 295, roleLabel: "Hold Bay 15 → Bay A1" },
        { code: "STS-02", x: 370, roleLabel: "Hold Bay 35 → Bay B2 & R1" },
        { code: "STS-03", x: 445, roleLabel: "Bay A1 → Hold Bay 55 Export" },
      ],
      activeBays: [
        BAY_DEFINITIONS["BAY-A1"],
        BAY_DEFINITIONS["BAY-B2"],
        BAY_DEFINITIONS["BAY-R1"],
      ],
      truckRoutes: [
        {
          truckCode: "TRK-1092",
          cargoLabel: "STS-01 → Bay A1",
          color: "#38bdf8",
          dashed: true,
          isLoop: true,
          totalTripsInLog: 40,
          phaseOffset: 0,
          waypoints: [
            [295, 104],
            [295, 148],
            [170, 148],
            [170, 194],
          ],
        },
        {
          truckCode: "TRK-2481",
          cargoLabel: "STS-02 → Bay B2",
          color: "#3b82f6",
          isLoop: true,
          totalTripsInLog: 42,
          phaseOffset: 0.3,
          waypoints: [
            [370, 104],
            [370, 148],
            [365, 148],
            [365, 194],
          ],
        },
        {
          truckCode: "TRK-4018",
          cargoLabel: "STS-02 → Reefer Bay R1",
          color: "#f59e0b",
          dashed: true,
          isLoop: true,
          totalTripsInLog: 30,
          phaseOffset: 0.6,
          waypoints: [
            [370, 104],
            [370, 148],
            [555, 148],
            [555, 194],
          ],
        },
        {
          truckCode: "TRK-3105",
          cargoLabel: "Bay A1 → STS-03 Export",
          color: "#10b981",
          dashed: true,
          isLoop: true,
          totalTripsInLog: 36,
          phaseOffset: 0.8,
          waypoints: [
            [210, 194],
            [210, 148],
            [445, 148],
            [445, 104],
          ],
        },
      ],
      assignedMachines: [
        {
          code: "MTR-OPS-B2",
          role: "6.6kV Shore Power at Berth B2",
          meterCode: "MTR-OPS-CATLAI-B2",
          energyOrFuel: "18,200 kWh (-28.4t CO₂)",
        },
        {
          code: "STS-01, STS-02, STS-03",
          role: "Berth B2 Quayside Hoisting",
          meterCode: "MTR-STS-CATLAI-B2",
          energyOrFuel: "22,800 kWh (Feeder F-01)",
        },
        {
          code: "TRK-1092, 2481, 4018, 3105",
          role: "Berth B2 ↔ Bay A1, B2, R1",
          meterCode: "MTR-TRK-FLEET-B2",
          energyOrFuel: "2,400 L Diesel + 240 kWh EV",
        },
        {
          code: "Bay A1, Bay B2 & Reefer R1",
          role: "240 Reefers + 2,610 Dry TEU",
          meterCode: "MTR-REEFER-ZONE3",
          energyOrFuel: "12,400 kWh Reefers + e-RTG",
        },
      ],
      timelinePhases: [
        {
          startPct: 0,
          endPct: 18,
          timeLabel: "06:30 – 07:15",
          phaseTitle: "1. Vessel Arrival & Tug TC-01 Berthing at Berth B2",
          activityDetail:
            "Tàu MV SPIRIT OF MUMBAI tiến vào luồng; Tàu lai TC-01 ép cập Bến B2 an toàn (tiêu thụ 920 L MGO).",
        },
        {
          startPct: 18,
          endPct: 30,
          timeLabel: "07:15 – 08:00",
          phaseTitle: "2. Mooring Locked & 6.6kV OPS-B2 Synchronized",
          activityDetail:
            "Kết nối cáp nguồn bờ 6.6kV từ trạm OPS-B2 (540 kW); tàu tắt hoàn toàn máy phát diesel phụ.",
        },
        {
          startPct: 30,
          endPct: 82,
          timeLabel: "08:00 – 16:30 (+1)",
          phaseTitle:
            "3. Simultaneous STS-01..03 Handling ↔ Bay A1, Bay B2 & Reefer Bay R1",
          activityDetail:
            "STS-01 dỡ hầm mũi về Bay A1 (TRK-1092); STS-02 dỡ hầm giữa về Bay B2 (TRK-2481) & Reefer Bay R1 (TRK-4018); STS-03 xếp hàng xuất từ Bay A1 (TRK-3105).",
        },
        {
          startPct: 82,
          endPct: 100,
          timeLabel: "16:30 – 18:00 (+1)",
          phaseTitle: "4. OPS-B2 Disconnect & Departure from Berth B2",
          activityDetail:
            "Hoàn tất 2,850 TEU; ngắt cáp OPS-B2, tàu lai hỗ trợ rời Bến B2 đi Singapore.",
        },
      ],
      meters: [
        {
          id: "MTR-OPS-CATLAI-B2",
          name: "Berth B2 Shore Power (OPS) 6.6kV",
          protocol: "IEC 61850 MMS",
          unit: "kW",
          secondaryUnit: "kV",
          totalRecorded: "18,200 kWh",
          intensity: "6.39 kWh / TEU",
          color: "#10b981",
          series: [
            { t: "06:30", val: 0, sec: 6.6, status: "Approaching Berth B2" },
            { t: "07:30", val: 380, sec: 6.61, status: "OPS-B2 synchronized" },
            { t: "12:00", val: 540, sec: 6.59, status: "Full hoteling + blowers" },
            { t: "24:00", val: 490, sec: 6.62, status: "Night hoteling load" },
            { t: "17:30", val: 120, sec: 6.6, status: "OPS-B2 ramp-down" },
          ],
        },
        {
          id: "MTR-STS-CATLAI-B2",
          name: "Berth B2 Cranes STS-01..03 (Feeder F-01)",
          protocol: "Profinet 22kV",
          unit: "kW",
          secondaryUnit: "lifts/h",
          totalRecorded: "22,800 kWh",
          intensity: "8.00 kWh / TEU",
          color: "#2563eb",
          series: [
            { t: "06:30", val: 0, sec: 0, status: "Cranes standby at B2" },
            { t: "07:30", val: 1200, sec: 45, status: "Booms lowered onto ship" },
            { t: "12:00", val: 2680, sec: 90, status: "Peak 3-crane operation" },
            { t: "24:00", val: 2100, sec: 78, status: "Night shift stevedoring" },
            { t: "17:30", val: 0, sec: 0, status: "All 2,850 TEU completed" },
          ],
        },
      ],
    },
    {
      id: "VSL01-V055N",
      label: "14/09 · Voyage 055N — MV SPIRIT OF MUMBAI (Tại Bến B2 · 2,800 TEU)",
      badge: "14/09 Historical at B2",
      date: "14/09/2026 (34.0h Port Call at Berth B2)",
      durationLabel: "51,950 kWh · 17.39 kgCO₂e/TEU",
      mode: "VOYAGE_FULL",
      berthCode: "B2",
      berthLabel: "BERTH B2 (CENTRAL OPS QUAY)",
      berthX: 250,
      berthW: 240,
      vesselName: "MV SPIRIT OF MUMBAI (055N)",
      tugName: "Tug TC-01",
      opsLabel: "OPS-B2 (525 kW)",
      scopeDescription:
        "Nhật ký lịch sử ngày 14/09/2026 (Voyage 055N) tại Bến B2: Xếp dỡ 2,800 TEU giữa Bến B2 (STS-01..03) và các bãi Bay A1, Bay B2, Reefer Bay R1.",
      activeCranes: [
        { code: "STS-01", x: 295, roleLabel: "Hold Bay 15" },
        { code: "STS-02", x: 370, roleLabel: "Hold Bay 35" },
        { code: "STS-03", x: 445, roleLabel: "Hold Bay 55" },
      ],
      activeBays: [
        BAY_DEFINITIONS["BAY-A1"],
        BAY_DEFINITIONS["BAY-B2"],
        BAY_DEFINITIONS["BAY-R1"],
      ],
      truckRoutes: [
        {
          truckCode: "TRK-1092",
          cargoLabel: "STS-01 → Bay A1",
          color: "#38bdf8",
          dashed: true,
          isLoop: true,
          totalTripsInLog: 38,
          phaseOffset: 0,
          waypoints: [
            [295, 104],
            [295, 148],
            [170, 148],
            [170, 194],
          ],
        },
        {
          truckCode: "TRK-2481",
          cargoLabel: "STS-02 → Bay B2",
          color: "#3b82f6",
          isLoop: true,
          totalTripsInLog: 39,
          phaseOffset: 0.35,
          waypoints: [
            [370, 104],
            [370, 148],
            [365, 148],
            [365, 194],
          ],
        },
        {
          truckCode: "TRK-4018",
          cargoLabel: "STS-02 → Reefer Bay R1",
          color: "#f59e0b",
          dashed: true,
          isLoop: true,
          totalTripsInLog: 29,
          phaseOffset: 0.7,
          waypoints: [
            [370, 104],
            [370, 148],
            [555, 148],
            [555, 194],
          ],
        },
      ],
      assignedMachines: [
        {
          code: "MTR-OPS-B2",
          role: "17,800 kWh Shore Power",
          meterCode: "MTR-OPS-CATLAI-B2",
          energyOrFuel: "6.36 kWh/TEU",
        },
        {
          code: "STS-01..03 (Berth B2)",
          role: "2,800 TEU Handled",
          meterCode: "MTR-STS-CATLAI-B2",
          energyOrFuel: "22,050 kWh",
        },
      ],
      timelinePhases: [
        {
          startPct: 0,
          endPct: 100,
          timeLabel: "14/09 – 15/09",
          phaseTitle: "Voyage 055N Full Turnaround at Berth B2",
          activityDetail:
            "Hoàn tất 2,800 TEU tại Bến B2; cường độ phát thải đạt 17.39 kgCO₂e/TEU.",
        },
      ],
      meters: [
        {
          id: "MTR-OPS-CATLAI-B2",
          name: "Berth B2 OPS Power (14/09 Log)",
          protocol: "IEC 61850",
          unit: "kW",
          secondaryUnit: "kV",
          totalRecorded: "17,800 kWh",
          intensity: "6.36 kWh / TEU",
          color: "#10b981",
          series: [
            { t: "07:00", val: 0, sec: 6.6, status: "Berthing at B2" },
            { t: "08:00", val: 510, sec: 6.6, status: "OPS-B2 active" },
            { t: "14:00", val: 535, sec: 6.59, status: "Peak hoteling" },
            { t: "02:00", val: 480, sec: 6.61, status: "Night hoteling" },
            { t: "17:00", val: 0, sec: 6.6, status: "Departed Berth B2" },
          ],
        },
      ],
    },
    {
      id: "VSL01-V054N",
      label: "31/08 · Voyage 054N — MV SPIRIT OF MUMBAI (Tại Bến B2 · 2,910 TEU)",
      badge: "31/08 Historical at B2",
      date: "31/08/2026 (35.5h Port Call at Berth B2)",
      durationLabel: "54,850 kWh · 17.69 kgCO₂e/TEU",
      mode: "VOYAGE_FULL",
      berthCode: "B2",
      berthLabel: "BERTH B2 (CENTRAL OPS QUAY)",
      berthX: 250,
      berthW: 240,
      vesselName: "MV SPIRIT OF MUMBAI (054N)",
      tugName: "Tug TC-01",
      opsLabel: "OPS-B2 (550 kW)",
      scopeDescription:
        "Nhật ký lịch sử ngày 31/08/2026 (Voyage 054N) tại Bến B2: Xếp dỡ 2,910 TEU giữa Bến B2 và các bãi Bay A1, Bay B2, Reefer Bay R1.",
      activeCranes: [
        { code: "STS-01", x: 295, roleLabel: "Hold Bay 15" },
        { code: "STS-02", x: 370, roleLabel: "Hold Bay 35" },
        { code: "STS-03", x: 445, roleLabel: "Hold Bay 55" },
      ],
      activeBays: [
        BAY_DEFINITIONS["BAY-A1"],
        BAY_DEFINITIONS["BAY-B2"],
        BAY_DEFINITIONS["BAY-R1"],
      ],
      truckRoutes: [
        {
          truckCode: "TRK-2481",
          cargoLabel: "STS-02 → Bay B2 (1,030 TEU)",
          color: "#3b82f6",
          isLoop: true,
          totalTripsInLog: 44,
          phaseOffset: 0,
          waypoints: [
            [370, 104],
            [370, 148],
            [365, 148],
            [365, 194],
          ],
        },
        {
          truckCode: "TRK-1092",
          cargoLabel: "STS-01 → Bay A1 (980 TEU)",
          color: "#38bdf8",
          dashed: true,
          isLoop: true,
          totalTripsInLog: 41,
          phaseOffset: 0.45,
          waypoints: [
            [295, 104],
            [295, 148],
            [170, 148],
            [170, 194],
          ],
        },
      ],
      assignedMachines: [
        {
          code: "MTR-OPS-B2",
          role: "18,600 kWh Shore Power",
          meterCode: "MTR-OPS-CATLAI-B2",
          energyOrFuel: "6.39 kWh/TEU",
        },
        {
          code: "STS-01..03 (Berth B2)",
          role: "2,910 TEU Handled",
          meterCode: "MTR-STS-CATLAI-B2",
          energyOrFuel: "23,400 kWh",
        },
      ],
      timelinePhases: [
        {
          startPct: 0,
          endPct: 100,
          timeLabel: "31/08 – 01/09",
          phaseTitle: "Voyage 054N Turnaround at Berth B2",
          activityDetail:
            "Hoàn tất 2,910 TEU tại Bến B2; mã kiểm toán 7c44d19e...2a90.",
        },
      ],
      meters: [
        {
          id: "MTR-OPS-CATLAI-B2",
          name: "Berth B2 OPS Power (31/08 Log)",
          protocol: "IEC 61850",
          unit: "kW",
          secondaryUnit: "kV",
          totalRecorded: "18,600 kWh",
          intensity: "6.39 kWh / TEU",
          color: "#10b981",
          series: [
            { t: "06:30", val: 0, sec: 6.6, status: "Arrival at B2" },
            { t: "07:30", val: 540, sec: 6.6, status: "OPS-B2 connected" },
            { t: "15:00", val: 560, sec: 6.59, status: "Peak hoteling" },
            { t: "03:00", val: 500, sec: 6.61, status: "Night hoteling" },
            { t: "18:00", val: 0, sec: 6.6, status: "Departed Berth B2" },
          ],
        },
      ],
    },
  ];
}

export const Historical2DReplayView: React.FC<Historical2DReplayViewProps> = ({
  entity,
  selectedLogIdx,
  onSelectLogIdx,
  onOpenMeterModal,
}) => {
  const scenarios = useMemo(
    () => buildPersonalizedScenarios(entity),
    [entity]
  );

  const [internalIdx, setInternalIdx] = useState<number>(0);
  const activeIdx =
    selectedLogIdx !== undefined && selectedLogIdx < scenarios.length
      ? selectedLogIdx
      : internalIdx;

  const handleSelectIdx = (idx: number) => {
    setInternalIdx(idx);
    onSelectLogIdx?.(idx);
    setProgressPct(35);
  };

  const [progressPct, setProgressPct] = useState<number>(45);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2>(1);

  useEffect(() => {
    setInternalIdx(0);
    setProgressPct(42);
  }, [entity.id]);

  const currentScenario = scenarios[activeIdx] || scenarios[0];

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setProgressPct((prev) => {
        const next = prev + 0.6 * speedMultiplier;
        return next > 100 ? 0 : next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  // Active phase based on progressPct
  const activePhase = useMemo(() => {
    return (
      currentScenario.timelinePhases.find(
        (p) => progressPct >= p.startPct && progressPct <= p.endPct
      ) ||
      currentScenario.timelinePhases[currentScenario.timelinePhases.length - 1]
    );
  }, [currentScenario, progressPct]);

  // Compute vessel & truck positions for ONLY the involved entities in currentScenario
  const animState = useMemo(() => {
    const p = progressPct / 100;
    const berthCenterX = currentScenario.berthX + currentScenario.berthW / 2;

    let shipX = berthCenterX;
    let shipY = 54;
    let tugX = berthCenterX - 65;
    let tugY = 34;
    let opsActive = true;

    if (currentScenario.mode === "VOYAGE_FULL") {
      if (p < 0.18) {
        const t = p / 0.18;
        shipX = berthCenterX + (1 - t) * 120;
        shipY = 22 + t * 32;
        tugX = shipX - 58;
        tugY = shipY - 12;
        opsActive = false;
      } else if (p > 0.82) {
        const t = (p - 0.82) / 0.18;
        shipX = berthCenterX - t * 125;
        shipY = 54 - t * 30;
        tugX = shipX - 58;
        tugY = shipY - 12;
        opsActive = false;
      }
    }

    const animatedTrucks = currentScenario.truckRoutes.map((route) => {
      const localProgress = route.isLoop
        ? (p * 4 + (route.phaseOffset || 0)) % 1
        : p;
      const pos = interpolateWaypoints(route.waypoints, localProgress);
      const currentTripNum = route.totalTripsInLog
        ? Math.max(1, Math.min(route.totalTripsInLog, Math.ceil(p * route.totalTripsInLog)))
        : 1;
      return {
        ...route,
        pos,
        currentTripNum,
      };
    });

    return {
      berthCenterX,
      shipX,
      shipY,
      tugX,
      tugY,
      opsActive,
      animatedTrucks,
    };
  }, [currentScenario, progressPct]);

  const seriesIdx = Math.min(
    (currentScenario.meters[0]?.series.length || 5) - 1,
    Math.floor((progressPct / 100) * 5)
  );

  return (
    <div className="space-y-4">
      {/* 1. COMPACT SINGLE-BAR REPLAY LOG SELECTOR & TIMELINE SCRUBBER */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Compact Dropdown for Replay Log Selection (Zero multi-line wrapping!) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
              Replay Log:
            </label>
            <select
              value={activeIdx}
              onChange={(e) => handleSelectIdx(Number(e.target.value))}
              className="flex-1 min-w-0 max-w-md px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer truncate"
            >
              {scenarios.map((sc, idx) => (
                <option key={sc.id} value={idx}>
                  {sc.label} — [{sc.badge}]
                </option>
              ))}
            </select>
          </div>

          {/* Compact Playback Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : 1)}
              className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {speedMultiplier}x
            </button>
            <button
              type="button"
              onClick={() => setProgressPct(0)}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Restart replay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Scrubber Slider + Active Phase Readout */}
        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-[10px] shrink-0">
                {activePhase.timeLabel}
              </span>
              <span className="font-bold text-slate-900 truncate">
                {activePhase.phaseTitle}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
              {Math.round(progressPct)}% · {currentScenario.durationLabel}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={progressPct}
            onChange={(e) => {
              setIsPlaying(false);
              setProgressPct(Number(e.target.value));
            }}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* 2. ENTITY-SCOPED 2D HISTORICAL TERMINAL SCHEMATIC MAP (SVG)
          ONLY renders the active Berth, assigned STS Crane(s), active Truck(s), and target Container Bay(s) for THIS case! */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-3 shadow-inner overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-[11px] text-slate-300">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Scoped 2D Replay:{" "}
              <strong className="text-white">{entity.code}</strong> ·{" "}
              <span className="text-sky-300">{currentScenario.vesselName}</span>{" "}
              ({currentScenario.berthLabel})
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Showing only involved entities ({currentScenario.activeCranes.map((c) => c.code).join(", ")} ↔{" "}
            {currentScenario.activeBays.map((b) => b.title).join(", ")})
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 760 272"
            className="w-full h-auto min-w-[620px] rounded-xl bg-[#1e293b]"
          >
            {/* A. Navigation Fairway & Quay Wall Line (Top Y: 0..88) */}
            <rect x="0" y="0" width="760" height="86" fill="#0c4a6e" />
            <line
              x1="0"
              y1="86"
              x2="760"
              y2="86"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            <text
              x="14"
              y="18"
              fill="#7dd3fc"
              fontSize="9.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              NAVIGATION CHANNEL · ACTIVE ZONE: {currentScenario.berthLabel}
            </text>

            {/* ONLY Render the Active Berth for this Scenario */}
            <g>
              <rect
                x={currentScenario.berthX}
                y="74"
                width={currentScenario.berthW}
                height="15"
                rx="3"
                fill="#2563eb"
                stroke="#93c5fd"
                strokeWidth="1.2"
              />
              <text
                x={currentScenario.berthX + currentScenario.berthW / 2}
                y="84"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="bold"
              >
                {currentScenario.berthLabel}
              </text>
            </g>

            {/* B. Calling Vessel at its Assigned Berth */}
            <g transform={`translate(${animState.shipX}, ${animState.shipY})`}>
              <polygon
                points="-82,-15 66,-15 86,0 66,15 -82,15"
                fill="#0284c7"
                stroke="#e0f2fe"
                strokeWidth="1.5"
              />
              <rect x="-58" y="-10" width="26" height="20" rx="2" fill="#2563eb" />
              <rect x="-26" y="-10" width="28" height="20" rx="2" fill="#f97316" />
              <rect x="8" y="-10" width="26" height="20" rx="2" fill="#10b981" />
              <rect x="-74" y="-9" width="12" height="18" rx="2" fill="#f8fafc" />
              <text
                x="-6"
                y="3"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="bold"
              >
                {currentScenario.vesselName}
              </text>
            </g>

            {/* Harbor Tugboat Assisting during Arrival / Departure */}
            {(progressPct < 20 || progressPct > 80) &&
              currentScenario.mode === "VOYAGE_FULL" && (
                <g transform={`translate(${animState.tugX}, ${animState.tugY})`}>
                  <rect
                    x="-22"
                    y="-8"
                    width="44"
                    height="16"
                    rx="4"
                    fill="#facc15"
                    stroke="#fef08a"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="7.5"
                    fontWeight="bold"
                  >
                    {currentScenario.tugName}
                  </text>
                </g>
              )}

            {/* 6.6kV OPS Shore Power Station Positioned at the Active Berth */}
            <g>
              <rect
                x={currentScenario.berthX + currentScenario.berthW - 76}
                y="93"
                width="74"
                height="20"
                rx="4"
                fill={animState.opsActive ? "#065f46" : "#334155"}
                stroke="#10b981"
                strokeWidth="1.2"
              />
              <text
                x={currentScenario.berthX + currentScenario.berthW - 39}
                y="106"
                textAnchor="middle"
                fill="#ecfdf5"
                fontSize="7.5"
                fontWeight="bold"
              >
                {currentScenario.opsLabel}
              </text>
              {animState.opsActive && (
                <path
                  d={`M ${
                    currentScenario.berthX + currentScenario.berthW - 39
                  } 93 L ${animState.shipX + 35} ${animState.shipY + 14}`}
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  fill="none"
                />
              )}
            </g>

            {/* C. Internal Terminal Transfer Spine Road (Y = 148) */}
            <rect
              x="40"
              y="140"
              width="680"
              height="16"
              rx="4"
              fill="#1e3a8a"
              opacity="0.85"
            />
            <line
              x1="48"
              y1="148"
              x2="712"
              y2="148"
              stroke="#60a5fa"
              strokeWidth="1.2"
              strokeDasharray="7 5"
            />
            <text
              x="54"
              y="151"
              fill="#bfdbfe"
              fontSize="7.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              INTERNAL TERMINAL TRANSFER LANE
            </text>

            {/* D. ONLY Render the Container Bay(s) Involved in This Scenario! */}
            {currentScenario.activeBays.map((bay) => {
              // Animated e-RTG gantry position inside the active bay
              const rtgX =
                bay.x +
                24 +
                ((Math.sin((progressPct / 100) * Math.PI * 4) + 1) / 2) *
                  (bay.w - 48);

              return (
                <g key={bay.id}>
                  <rect
                    x={bay.x}
                    y="186"
                    width={bay.w}
                    height="72"
                    rx="7"
                    fill={bay.fill}
                    stroke={bay.stroke}
                    strokeWidth="2"
                  />
                  {/* Container Stack Rows inside Bay */}
                  {[0, 1, 2, 3].map((r) => (
                    <rect
                      key={r}
                      x={bay.x + 12 + r * ((bay.w - 24) / 4)}
                      y="222"
                      width={Math.max(24, (bay.w - 44) / 4)}
                      height="13"
                      rx="2"
                      fill={bay.stroke}
                      opacity={r === 2 ? "0.75" : "0.3"}
                    />
                  ))}

                  {/* Animated e-RTG Gantry Bridge Spanning the Bay */}
                  <line
                    x1={rtgX}
                    y1="188"
                    x2={rtgX}
                    y2="256"
                    stroke="#facc15"
                    strokeWidth="2.5"
                  />
                  <rect
                    x={rtgX - 18}
                    y="218"
                    width="36"
                    height="11"
                    rx="2"
                    fill="#facc15"
                  />
                  <text
                    x={rtgX}
                    y="226"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="6.5"
                    fontWeight="bold"
                  >
                    {bay.rtgCode}
                  </text>

                  <text
                    x={bay.x + 10}
                    y="202"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    {bay.title}
                  </text>
                  <text x={bay.x + 10} y="214" fill="#cbd5e1" fontSize="8">
                    {bay.sub} · {bay.targetSlotLabel}
                  </text>
                  <text
                    x={bay.x + 10}
                    y="250"
                    fill={bay.stroke}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {bay.feeder}
                  </text>
                </g>
              );
            })}

            {/* E. ONLY Render the Assigned STS Quay Crane(s) on the Active Berth */}
            {currentScenario.activeCranes.map((cr, idx) => {
              const spreaderY = animState.opsActive
                ? 76 + Math.sin((progressPct / 100) * Math.PI * 8 + idx) * 22
                : 90;
              return (
                <g key={cr.code}>
                  {/* Crane Boom spanning Vessel Hold to Quay Apron */}
                  <line
                    x1={cr.x}
                    y1="50"
                    x2={cr.x}
                    y2="112"
                    stroke="#38bdf8"
                    strokeWidth="4.5"
                  />
                  {/* Animated Spreader Trolley */}
                  <rect
                    x={cr.x - 8}
                    y={spreaderY - 5}
                    width="16"
                    height="10"
                    rx="2"
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  {/* Crane Portal Badge */}
                  <rect
                    x={cr.x - 24}
                    y="106"
                    width="48"
                    height="14"
                    rx="3"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  <text
                    x={cr.x}
                    y="116"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {cr.code}
                  </text>
                </g>
              );
            })}

            {/* F. ONLY Render the Active Truck Route(s) & Moving Yard Trucks */}
            {animState.animatedTrucks.map((trk) => (
              <g key={trk.truckCode}>
                <polyline
                  points={trk.waypoints
                    .map((pt) => `${pt[0]},${pt[1]}`)
                    .join(" ")}
                  fill="none"
                  stroke={trk.color}
                  strokeWidth={trk.isLoop ? "3" : "4"}
                  strokeDasharray={trk.dashed ? "5 3" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Origin & Destination Pin Dots */}
                <circle
                  cx={trk.waypoints[0][0]}
                  cy={trk.waypoints[0][1]}
                  r="4"
                  fill={trk.color}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <circle
                  cx={trk.waypoints[trk.waypoints.length - 1][0]}
                  cy={trk.waypoints[trk.waypoints.length - 1][1]}
                  r="4.5"
                  fill={trk.color}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />

                {/* Moving Truck Icon */}
                <g transform={`translate(${trk.pos.x}, ${trk.pos.y})`}>
                  <circle r="13" fill={trk.color} opacity="0.25" />
                  <rect
                    x="-24"
                    y="-9"
                    width="48"
                    height="18"
                    rx="4"
                    fill={trk.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="7.5"
                    fontWeight="bold"
                  >
                    {trk.truckCode}
                  </text>
                  {trk.totalTripsInLog && (
                    <rect
                      x="-22"
                      y="-21"
                      width="44"
                      height="10"
                      rx="2"
                      fill="#0f172a"
                       opacity="0.9"
                    />
                  )}
                  {trk.totalTripsInLog && (
                    <text
                      x="0"
                      y="-14"
                      textAnchor="middle"
                      fill="#bae6fd"
                      fontSize="6.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Trip {trk.currentTripNum}/{trk.totalTripsInLog}
                    </text>
                  )}
                </g>
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-2 px-1 text-[11px] text-slate-400">
          {currentScenario.scopeDescription}
        </div>
      </div>

      {/* 3. SYNCHRONIZED COMPACT METER BREAKDOWN CARDS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Synchronized Sub-Meter Telemetry Breakdown (Scrubbed to{" "}
              {activePhase.timeLabel})
            </span>
          </h4>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any meter card to open full Meter Diagram
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentScenario.meters.map((meter) => {
            const currentPoint =
              meter.series[seriesIdx] || meter.series[meter.series.length - 1];
            const maxVal = Math.max(
              ...meter.series.map((s) => Math.abs(s.val)),
              10
            );

            return (
              <div
                key={meter.id}
                onClick={() => onOpenMeterModal && onOpenMeterModal(meter.id)}
                className="bg-white hover:bg-blue-50/20 p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-2xs space-y-2.5 cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                        {meter.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {meter.protocol}
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-1 group-hover:text-blue-600 truncate">
                      {meter.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-base font-black font-mono leading-tight"
                      style={{ color: meter.color }}
                    >
                      {currentPoint.val} {meter.unit}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {currentPoint.sec} {meter.secondaryUnit} ·{" "}
                      <strong className="text-slate-700">
                        {currentPoint.t}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Mini Synchronized Bar Strip */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {meter.series.map((pt, idx) => {
                    const isCurrentStep = idx === seriesIdx;
                    const barHeightPct = Math.max(
                      18,
                      Math.round((Math.abs(pt.val) / maxVal) * 100)
                    );
                    return (
                      <div
                        key={pt.t}
                        className={`p-1.5 rounded-lg border text-center transition-all ${
                          isCurrentStep
                            ? "bg-blue-50/90 border-blue-400 ring-1 ring-blue-300"
                            : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div className="h-8 flex items-end justify-center mb-1">
                          <div
                            className="w-full rounded-xs transition-all"
                            style={{
                              height: `${barHeightPct}%`,
                              backgroundColor: isCurrentStep
                                ? meter.color
                                : "#cbd5e1",
                            }}
                          />
                        </div>
                        <div className="text-[9px] font-mono font-bold text-slate-700">
                          {pt.val}
                          {meter.unit}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400">
                          {pt.t}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium truncate">
                    Status:{" "}
                    <strong className="text-slate-900">
                      {currentPoint.status}
                    </strong>
                  </span>
                  <span className="font-mono font-bold text-emerald-700 shrink-0">
                    {meter.totalRecorded} ({meter.intensity})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
