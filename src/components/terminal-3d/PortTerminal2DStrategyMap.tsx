import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Ship,
  Anchor,
  Truck,
  Container,
  ZoomIn,
  ZoomOut,
  Crosshair,
  ChevronRight,
  Navigation,
  MapPin,
} from "lucide-react";
import {
  TERMINAL_3D_ENTITIES,
  Terminal3DEntity,
  TerminalEntityCategory,
} from "./terminal3DData";
import { useLanguage } from "../../context/LanguageContext";

export const LOOP_DURATION_SEC = 30;

export interface TerminalStrategyZone {
  id: string;
  name: string;
  subtitle: string;
  quayLengthM: string;
  powerLoadKw: string;
  polygonPoints: string;
  centerX: number;
  centerY: number;
  zoomScale: number;
  accentColor: string;
  entityIds: string[];
}

export interface TimelineWaypoint {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  time: string;
  metricBadge: string;
  state: "COMPLETED" | "ACTIVE" | "UPCOMING";
  mapX: number;
  mapY: number;
  zoomLevel: number;
  modeIcon: "SEA" | "TOWAGE" | "BERTH" | "CRANE" | "TRUCK" | "BAY";
  activeWindowSec?: [number, number];
}

// ============================================================================
// EXPANSIVE 1600x920 TERMINAL MASTERPLAN ZONES WITH REALISTIC SEPARATION
// ============================================================================
export const TERMINAL_STRATEGY_ZONES: TerminalStrategyZone[] = [
  {
    id: "ZONE-SEA-TOWAGE",
    name: "Luồng Hàng Hải & Vũng Quay Tàu",
    subtitle: "Outer Sea Fairway · Pilot Boarding & Tugboat Escort",
    quayLengthM: "3.5 NM Fairway",
    powerLoadKw: "3 Harbor Tugs",
    polygonPoints: "60,18 1540,18 1540,215 60,215",
    centerX: 800,
    centerY: 115,
    zoomScale: 1.55,
    accentColor: "#1A73E8",
    entityIds: ["VSL-01", "VSL-02", "VSL-03"],
  },
  {
    id: "ZONE-B1",
    name: "Bến Thủy Nội Địa & Feeder (Berth B1)",
    subtitle: "MV TAN CANG GLORY · STS-04 & Biofuel Loop",
    quayLengthM: "500 m Quay",
    powerLoadKw: "1,320 kW",
    polygonPoints: "95,225 475,225 475,405 95,405",
    centerX: 285,
    centerY: 315,
    zoomScale: 1.85,
    accentColor: "#0D9488",
    entityIds: ["VSL-03", "STS-04", "TRK-1092"],
  },
  {
    id: "ZONE-B2",
    name: "Bến Container Trung Tâm (Berth B2)",
    subtitle: "MV SPIRIT OF MUMBAI · STS-01, STS-02 & OPS",
    quayLengthM: "750 m Quay",
    powerLoadKw: "2,920 kW",
    polygonPoints: "575,225 1025,225 1025,405 575,405",
    centerX: 800,
    centerY: 315,
    zoomScale: 1.8,
    accentColor: "#1A73E8",
    entityIds: ["VSL-01", "STS-01", "STS-02", "TRK-2481", "TRK-3105"],
  },
  {
    id: "ZONE-B3",
    name: "Bến Nước Sâu Quốc Tế (Berth B3)",
    subtitle: "MV ONE APUS · STS-03 & Towage Berthing",
    quayLengthM: "900 m Quay",
    powerLoadKw: "2,410 kW",
    polygonPoints: "1120,225 1515,225 1515,405 1120,405",
    centerX: 1318,
    centerY: 315,
    zoomScale: 1.85,
    accentColor: "#0284C7",
    entityIds: ["VSL-02", "STS-03", "TRK-4018"],
  },
  {
    id: "ZONE-BAY-A1",
    name: "Bãi Nội Địa & Bến Sà Lan Tây (Bay A1)",
    subtitle: "West Domestic Yard & Inland Barge Depot",
    quayLengthM: "1,200 TEU",
    powerLoadKw: "480 kW",
    polygonPoints: "95,450 475,450 475,795 95,795",
    centerX: 285,
    centerY: 620,
    zoomScale: 1.75,
    accentColor: "#4F46E5",
    entityIds: ["BAY-A1", "TRK-1092"],
  },
  {
    id: "ZONE-YARD-B",
    name: "Bãi Container Khô Bắc – Nam (Bay B2 & Bay C1)",
    subtitle: "North Import Bay B2 · OCR Gate · South Export Bay C1",
    quayLengthM: "1,420 TEU",
    powerLoadKw: "1,260 kW",
    polygonPoints: "575,450 1025,450 1025,795 575,795",
    centerX: 800,
    centerY: 620,
    zoomScale: 1.7,
    accentColor: "#2563EB",
    entityIds: ["BAY-B2", "BAY-C1", "TRK-2481", "TRK-3105"],
  },
  {
    id: "ZONE-REEFER",
    name: "Bãi Lạnh & Trạm PTI Đông (Bay R1)",
    subtitle: "Cold-Chain Reefer Racks (-18.5°C) & PTI Plaza",
    quayLengthM: "480 Plugs",
    powerLoadKw: "1,650 kW",
    polygonPoints: "1120,450 1515,450 1515,795 1120,795",
    centerX: 1318,
    centerY: 620,
    zoomScale: 1.75,
    accentColor: "#059669",
    entityIds: ["BAY-R1", "TRK-4018"],
  },
];

// ============================================================================
// MINIMAL PORT OPERATIONAL LANDMARKS ON THE 1600x920 MAP
// ============================================================================
interface PortDestinationPOI {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

const PORT_DESTINATION_POIS: PortDestinationPOI[] = [
  { id: "POI-PILOT-W", label: "Phao Hoa Tiêu Tây", x: 215, y: 85, color: "#1967D2" },
  { id: "POI-PILOT-C", label: "Phao Luồng Chính", x: 780, y: 78, color: "#1967D2" },
  { id: "POI-BASIN-E", label: "Vũng Quay Tàu Đông", x: 1365, y: 135, color: "#0284C7" },
  { id: "POI-SLIP-TUG", label: "Âu Tàu Lai Dắt", x: 525, y: 285, color: "#0D9488" },
  { id: "POI-OPS-SUB", label: "Trạm Điện Bờ OPS 6.6kV", x: 1072, y: 325, color: "#1A73E8" },
  { id: "POI-OCR-B", label: "Cổng Quét OCR & Trạm Cân", x: 910, y: 615, color: "#2563EB" },
  { id: "POI-BARGE-W", label: "Bến Sà Lan Nội Địa Tây", x: 295, y: 735, color: "#4F46E5" },
  { id: "POI-PTI-E", label: "Trạm PTI Lạnh & Sạc EV", x: 1315, y: 735, color: "#059669" },
];

// ============================================================================
// CONCISE ENTITY-SPECIFIC TIMELINE CHECKPOINTS (No verbose dwell-second text)
// ============================================================================
export const ENTITY_TIMELINE_WAYPOINTS: Record<string, TimelineWaypoint[]> = {
  "VSL-01": [
    {
      id: "VSL01-SEA",
      stepNumber: 1,
      title: "Đón Hoa Tiêu Luồng Biển",
      subtitle: "Phao số 0 luồng chính · Hoa tiêu lên tàu",
      time: "05:45",
      metricBadge: "12.4 kn · Fairway",
      state: "COMPLETED",
      mapX: 660,
      mapY: 75,
      zoomLevel: 1.95,
      modeIcon: "SEA",
      activeWindowSec: [0, 6],
    },
    {
      id: "VSL01-TOWAGE",
      stepNumber: 2,
      title: "Tàu Lai Hộ Tống Vào Vũng Quay",
      subtitle: "Tàu lai Tân Cảng 01 & 02 bắt cáp lai dắt",
      time: "06:30",
      metricBadge: "2 Tugs · 920 L",
      state: "COMPLETED",
      mapX: 730,
      mapY: 165,
      zoomLevel: 2.0,
      modeIcon: "TOWAGE",
      activeWindowSec: [6, 12],
    },
    {
      id: "VSL01-BERTH",
      stepNumber: 3,
      title: "Cập Cầu B2 & Đấu Điện Bờ OPS",
      subtitle: "Đấu nối trạm điện bờ 6.6kV MTR-OPS-CATLAI-B2",
      time: "07:15",
      metricBadge: "540 kW · 18,200 kWh",
      state: "COMPLETED",
      mapX: 800,
      mapY: 265,
      zoomLevel: 2.05,
      modeIcon: "BERTH",
      activeWindowSec: [12, 18],
    },
    {
      id: "VSL01-CRANE",
      stepNumber: 4,
      title: "Xếp Dỡ Container Cầu B2",
      subtitle: "Cẩu STS-01 & STS-02 xếp dỡ 1,940 / 2,850 TEU",
      time: "Đang làm hàng",
      metricBadge: "1,740 kW · 68%",
      state: "ACTIVE",
      mapX: 800,
      mapY: 315,
      zoomLevel: 2.0,
      modeIcon: "CRANE",
      activeWindowSec: [18, 25],
    },
    {
      id: "VSL01-DEPART",
      stepNumber: 5,
      title: "Rời Bến Ra Luồng Hàng Hải",
      subtitle: "Tàu lai hỗ trợ rời cầu B2 ra luồng chính",
      time: "ETD 18:00",
      metricBadge: "Outbound Plan",
      state: "UPCOMING",
      mapX: 920,
      mapY: 115,
      zoomLevel: 1.9,
      modeIcon: "SEA",
      activeWindowSec: [25, 30],
    },
  ],
  "VSL-02": [
    {
      id: "VSL02-SEA",
      stepNumber: 1,
      title: "Đón Tàu Lai Tại Vũng Quay Đông",
      subtitle: "MV ONE APUS bắt cáp 2 tàu lai Azimuth",
      time: "13:05",
      metricBadge: "0.0 kn · Hookup",
      state: "COMPLETED",
      mapX: 1365,
      mapY: 135,
      zoomLevel: 1.95,
      modeIcon: "SEA",
      activeWindowSec: [0, 7],
    },
    {
      id: "VSL02-TOWAGE",
      stepNumber: 2,
      title: "Lai Dắt Ép Mạn Vào Cầu B3",
      subtitle: "Tàu lai Tân Cảng 01 & 02 đẩy mũi-lái vào bến",
      time: "13:25",
      metricBadge: "3.2 kn · Towage",
      state: "ACTIVE",
      mapX: 1340,
      mapY: 200,
      zoomLevel: 2.0,
      modeIcon: "TOWAGE",
      activeWindowSec: [7, 14],
    },
    {
      id: "VSL02-BERTH",
      stepNumber: 3,
      title: "Cập Cầu B3 & Dỡ Hàng Lạnh",
      subtitle: "Cấp điện bờ 730 kW & cẩu STS-03 dỡ công lạnh",
      time: "13:45",
      metricBadge: "730 kW OPS",
      state: "ACTIVE",
      mapX: 1318,
      mapY: 265,
      zoomLevel: 2.05,
      modeIcon: "BERTH",
      activeWindowSec: [14, 24],
    },
    {
      id: "VSL02-CRANE",
      stepNumber: 4,
      title: "Quay Trở Ra Vũng Quay Đông",
      subtitle: "Tàu lai điều hướng tàu ra luồng nước sâu",
      time: "Chu kỳ kế",
      metricBadge: "4.1 kn · Channel",
      state: "UPCOMING",
      mapX: 1365,
      mapY: 135,
      zoomLevel: 1.95,
      modeIcon: "SEA",
      activeWindowSec: [24, 30],
    },
  ],
  "VSL-03": [
    {
      id: "VSL03-BERTH",
      stepNumber: 1,
      title: "Chốt Hàng & Tháo Cáp OPS Cầu B1",
      subtitle: "Hoàn tất 1,200 TEU · Bắt dây tàu lai Cát Lái 04",
      time: "10:30 – 03:45",
      metricBadge: "18,400 kWh",
      state: "COMPLETED",
      mapX: 295,
      mapY: 265,
      zoomLevel: 2.0,
      modeIcon: "BERTH",
      activeWindowSec: [0, 9],
    },
    {
      id: "VSL03-TOWAGE",
      stepNumber: 2,
      title: "Tàu Lai Kéo Rời Cầu B1",
      subtitle: "Tàu lai Cát Lái 04 dẫn luồng qua Vũng Quay Tây",
      time: "Đang rời bến",
      metricBadge: "5.4 kn · Towage",
      state: "ACTIVE",
      mapX: 255,
      mapY: 175,
      zoomLevel: 2.0,
      modeIcon: "TOWAGE",
      activeWindowSec: [9, 16],
    },
    {
      id: "VSL03-SEA",
      stepNumber: 3,
      title: "Trả Hoa Tiêu Tại Phao Biển Tây",
      subtitle: "Hoa tiêu rời tàu & tháo cáp lai dắt ngoài luồng",
      time: "Ngoài luồng",
      metricBadge: "0.5 kn · Pilot Buoy",
      state: "ACTIVE",
      mapX: 215,
      mapY: 85,
      zoomLevel: 1.95,
      modeIcon: "SEA",
      activeWindowSec: [16, 23.5],
    },
    {
      id: "VSL03-RETURN",
      stepNumber: 4,
      title: "Hành Trình Tuyến Feeder B1",
      subtitle: "Khép kín lộ trình luồng nhánh vào cầu B1",
      time: "Chu kỳ kế",
      metricBadge: "6.0 kn · Feeder",
      state: "UPCOMING",
      mapX: 295,
      mapY: 265,
      zoomLevel: 2.0,
      modeIcon: "BERTH",
      activeWindowSec: [23.5, 30],
    },
  ],

  // QUAY CRANES
  "STS-01": [
    {
      id: "STS01-1",
      stepNumber: 1,
      title: "Gắp Container Hầm Hàng #2",
      subtitle: "Khóa twistlock 2×20' TEU trên tàu SPIRIT OF MUMBAI",
      time: "Chu kỳ 1",
      metricBadge: "510 kW · Hold #2",
      state: "COMPLETED",
      mapX: 710,
      mapY: 265,
      zoomLevel: 2.15,
      modeIcon: "BERTH",
      activeWindowSec: [0, 8],
    },
    {
      id: "STS01-2",
      stepNumber: 2,
      title: "Hạ Công Lên Xe TRK-2481",
      subtitle: "Giao công tại làn 1 cầu B2 & thu hồi điện năng",
      time: "Chu kỳ 2",
      metricBadge: "-92 kW Regen",
      state: "ACTIVE",
      mapX: 710,
      mapY: 365,
      zoomLevel: 2.15,
      modeIcon: "TRUCK",
      activeWindowSec: [8, 19],
    },
    {
      id: "STS01-3",
      stepNumber: 3,
      title: "Trượt Ray Sang Hầm Hàng #3",
      subtitle: "Di chuyển chân đế cẩu dọc ray bờ B2",
      time: "Chu kỳ 3",
      metricBadge: "485 kW · 34 MPH",
      state: "ACTIVE",
      mapX: 750,
      mapY: 315,
      zoomLevel: 2.15,
      modeIcon: "CRANE",
      activeWindowSec: [19, 30],
    },
  ],
  "STS-02": [
    {
      id: "STS02-1",
      stepNumber: 1,
      title: "Móc Công Xuất Từ Xe TRK-2205",
      subtitle: "Nhận 2 công xuất khẩu tại làn số 2 cầu B2",
      time: "Chu kỳ 1",
      metricBadge: "490 kW · Pickup",
      state: "COMPLETED",
      mapX: 890,
      mapY: 365,
      zoomLevel: 2.15,
      modeIcon: "TRUCK",
      activeWindowSec: [0, 11],
    },
    {
      id: "STS02-2",
      stepNumber: 2,
      title: "Hạ Công Xuất Xuống Hầm #5",
      subtitle: "Xếp container xuống hầm #5 tàu SPIRIT OF MUMBAI",
      time: "Chu kỳ 2",
      metricBadge: "310 kW · Hold #5",
      state: "ACTIVE",
      mapX: 890,
      mapY: 265,
      zoomLevel: 2.15,
      modeIcon: "BERTH",
      activeWindowSec: [11, 23],
    },
    {
      id: "STS02-3",
      stepNumber: 3,
      title: "Thu Trolley Về Làn Đón Xe",
      subtitle: "Đưa spreader về làn giao nhận số 2 cầu B2",
      time: "Chu kỳ 3",
      metricBadge: "32 MPH · Return",
      state: "ACTIVE",
      mapX: 890,
      mapY: 315,
      zoomLevel: 2.15,
      modeIcon: "CRANE",
      activeWindowSec: [23, 30],
    },
  ],
  "STS-03": [
    {
      id: "STS03-1",
      stepNumber: 1,
      title: "Trực Chiến Chờ Tàu Cập Cầu B3",
      subtitle: "Giữ vị trí khóa ray an toàn khi tàu ONE APUS cập mạn",
      time: "Chu kỳ 1",
      metricBadge: "45 kW Standby",
      state: "COMPLETED",
      mapX: 1285,
      mapY: 315,
      zoomLevel: 2.15,
      modeIcon: "CRANE",
      activeWindowSec: [0, 12],
    },
    {
      id: "STS03-2",
      stepNumber: 2,
      title: "Gắp Công Lạnh Hầm Hàng #4",
      subtitle: "Dỡ container lạnh -18.5°C từ tàu MV ONE APUS",
      time: "Chu kỳ 2",
      metricBadge: "520 kW · Hoist",
      state: "ACTIVE",
      mapX: 1315,
      mapY: 265,
      zoomLevel: 2.15,
      modeIcon: "BERTH",
      activeWindowSec: [12, 21],
    },
    {
      id: "STS03-3",
      stepNumber: 3,
      title: "Giao Công Lạnh Cho Xe TRK-2319",
      subtitle: "Hạ container lạnh xuống làn xe cầu B3",
      time: "Chu kỳ 3",
      metricBadge: "-88 kW Regen",
      state: "ACTIVE",
      mapX: 1315,
      mapY: 365,
      zoomLevel: 2.15,
      modeIcon: "TRUCK",
      activeWindowSec: [21, 30],
    },
  ],
  "STS-04": [
    {
      id: "STS04-1",
      stepNumber: 1,
      title: "Cẩu Lô Hàng Cuối Tàu Feeder B1",
      subtitle: "Hoàn tất 1,200 TEU tàu MV TAN CANG GLORY",
      time: "Chu kỳ 1",
      metricBadge: "390 kW · Hoist",
      state: "COMPLETED",
      mapX: 295,
      mapY: 265,
      zoomLevel: 2.15,
      modeIcon: "BERTH",
      activeWindowSec: [0, 10],
    },
    {
      id: "STS04-2",
      stepNumber: 2,
      title: "Nâng Cần Khóa Gió Cho Tàu Rời",
      subtitle: "Thu cần an toàn khi tàu lai kéo tàu rời cầu B1",
      time: "Chu kỳ 2",
      metricBadge: "18 kW · Locked",
      state: "ACTIVE",
      mapX: 265,
      mapY: 315,
      zoomLevel: 2.15,
      modeIcon: "CRANE",
      activeWindowSec: [10, 21],
    },
    {
      id: "STS04-3",
      stepNumber: 3,
      title: "Hạ Công Lưu Đệm Lên Xe TRK-2104",
      subtitle: "Bàn giao container cuối ca về bãi nội địa Bay A1",
      time: "Chu kỳ 3",
      metricBadge: "280 kW · Transfer",
      state: "ACTIVE",
      mapX: 295,
      mapY: 365,
      zoomLevel: 2.15,
      modeIcon: "TRUCK",
      activeWindowSec: [21, 30],
    },
  ],

  // YARD TRUCKS
  "TRK-2481": [
    {
      id: "TRK2481-1",
      stepNumber: 1,
      title: "Nhận Công Dưới Cẩu Bờ STS-01",
      subtitle: "Nhận container 40'HC #MSKU9028140 tại làn 1 cầu B2",
      time: "Điểm 1",
      metricBadge: "STS-01 Pad",
      state: "COMPLETED",
      mapX: 710,
      mapY: 365,
      zoomLevel: 2.1,
      modeIcon: "CRANE",
      activeWindowSec: [0, 7.5],
    },
    {
      id: "TRK2481-2",
      stepNumber: 2,
      title: "Vận Chuyển Qua Trục Đường Tây",
      subtitle: "Di chuyển từ Đường Cầu Tàu Bắc vào bãi nhập Bay B2",
      time: "Điểm 2",
      metricBadge: "18 km/h · 42 kW",
      state: "COMPLETED",
      mapX: 530,
      mapY: 470,
      zoomLevel: 2.05,
      modeIcon: "TRUCK",
      activeWindowSec: [7.5, 11.5],
    },
    {
      id: "TRK2481-3",
      stepNumber: 3,
      title: "Hạ Công Tại Bãi Nhập Bay B2",
      subtitle: "Cẩu khung e-RTG-01 nhấc công vào ô B2-R04-T3",
      time: "Điểm 3",
      metricBadge: "Bay B2 Row B",
      state: "ACTIVE",
      mapX: 710,
      mapY: 520,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [11.5, 19.5],
    },
    {
      id: "TRK2481-4",
      stepNumber: 4,
      title: "Quét Cổng OCR & Quay Về STS-01",
      subtitle: "Xác thực eDO tại Đại Lộ Trung Tâm & vòng lại cầu B2",
      time: "Điểm 4",
      metricBadge: "OCR Verified",
      state: "UPCOMING",
      mapX: 910,
      mapY: 615,
      zoomLevel: 2.1,
      modeIcon: "TRUCK",
      activeWindowSec: [19.5, 30],
    },
  ],
  "TRK-3105": [
    {
      id: "TRK3105-1",
      stepNumber: 1,
      title: "Giao Công Xuất Tại Cẩu STS-02",
      subtitle: "Cẩu bờ STS-02 móc 2×20' TEU đưa xuống hầm #5",
      time: "Điểm 1",
      metricBadge: "STS-02 Lane 2",
      state: "COMPLETED",
      mapX: 890,
      mapY: 365,
      zoomLevel: 2.1,
      modeIcon: "CRANE",
      activeWindowSec: [0, 11.5],
    },
    {
      id: "TRK3105-2",
      stepNumber: 2,
      title: "Qua Đại Lộ Trung Tâm Về Bãi Nam",
      subtitle: "Xe rơ-moóc trống chạy xuống khu bãi xuất Bay C1",
      time: "Điểm 2",
      metricBadge: "22 km/h · Transit",
      state: "COMPLETED",
      mapX: 530,
      mapY: 615,
      zoomLevel: 2.0,
      modeIcon: "TRUCK",
      activeWindowSec: [11.5, 16.5],
    },
    {
      id: "TRK3105-3",
      stepNumber: 3,
      title: "Nhận Công Xuất Tại Bãi Nam Bay C1",
      subtitle: "Cẩu e-RTG-04 hạ 2 công xuất khẩu & chốt cân VGM",
      time: "Điểm 3",
      metricBadge: "Bay C1 Row C",
      state: "ACTIVE",
      mapX: 790,
      mapY: 714,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [16.5, 26],
    },
    {
      id: "TRK3105-4",
      stepNumber: 4,
      title: "Theo Đại Lộ Đông Lên Cầu B2",
      subtitle: "Chở 2 công xuất khẩu lên lại chân cẩu STS-02",
      time: "Điểm 4",
      metricBadge: "19 km/h · 2 TEU",
      state: "UPCOMING",
      mapX: 1070,
      mapY: 520,
      zoomLevel: 2.0,
      modeIcon: "TRUCK",
      activeWindowSec: [26, 30],
    },
  ],
  "TRK-4018": [
    {
      id: "TRK4018-1",
      stepNumber: 1,
      title: "Hạ Công Lạnh Tại Reefer Bay R1",
      subtitle: "Đưa container lạnh vào Rack A & cắm nguồn 440V",
      time: "Điểm 1",
      metricBadge: "Reefer R1 (-18.5°C)",
      state: "COMPLETED",
      mapX: 1315,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [0, 6.5],
    },
    {
      id: "TRK4018-2",
      stepNumber: 2,
      title: "Kiểm Định PTI & Sạc Nhanh EV",
      subtitle: "Kiểm tra cảm biến chuỗi lạnh tại Trạm PTI Đông",
      time: "Điểm 2",
      metricBadge: "PTI Plaza · Fast EV",
      state: "ACTIVE",
      mapX: 1315,
      mapY: 735,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [6.5, 17],
    },
    {
      id: "TRK4018-3",
      stepNumber: 3,
      title: "Đón Công Lạnh Dưới Cẩu STS-03",
      subtitle: "Nhận container lạnh nhập khẩu mới từ tàu ONE APUS",
      time: "Điểm 3",
      metricBadge: "Berth B3 Pad",
      state: "UPCOMING",
      mapX: 1315,
      mapY: 365,
      zoomLevel: 2.1,
      modeIcon: "CRANE",
      activeWindowSec: [17, 30],
    },
  ],
  "TRK-1092": [
    {
      id: "TRK1092-1",
      stepNumber: 1,
      title: "Nhận Công Nội Địa Tại Bay A1",
      subtitle: "Cẩu RTG bãi Tây đặt container #CMAU4920182 lên xe",
      time: "Điểm 1",
      metricBadge: "Bay A1 West",
      state: "COMPLETED",
      mapX: 285,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [0, 8],
    },
    {
      id: "TRK1092-2",
      stepNumber: 2,
      title: "Giao Hàng Tại Bến Sà Lan Tây",
      subtitle: "Bàn giao container sang tuyến sà lan nội địa",
      time: "Điểm 2",
      metricBadge: "West Barge Gate",
      state: "ACTIVE",
      mapX: 295,
      mapY: 735,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [8, 18.5],
    },
    {
      id: "TRK1092-3",
      stepNumber: 3,
      title: "Đón Công Cuối Ca Tại Cẩu STS-04",
      subtitle: "Nhận container tại cầu B1 chở về bãi nội địa Bay A1",
      time: "Điểm 3",
      metricBadge: "Berth B1 Pad",
      state: "UPCOMING",
      mapX: 295,
      mapY: 365,
      zoomLevel: 2.1,
      modeIcon: "CRANE",
      activeWindowSec: [18.5, 30],
    },
  ],

  // CONTAINER BAYS
  "BAY-B2": [
    {
      id: "BAYB2-1",
      stepNumber: 1,
      title: "Xếp Chồng Hàng Nhập Row A",
      subtitle: "Khung cẩu e-RTG-01 xếp container tầng 4 chuyến 056N",
      time: "Vị trí 1",
      metricBadge: "410 kW · Row A",
      state: "COMPLETED",
      mapX: 660,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [0, 11],
    },
    {
      id: "BAYB2-2",
      stepNumber: 2,
      title: "Nhấc Công Từ Xe Đầu Kéo TRK-2481",
      subtitle: "e-RTG-01 đón công 40'HC #MSCU8921040 tại làn xe",
      time: "Vị trí 2",
      metricBadge: "365/450 TEU",
      state: "ACTIVE",
      mapX: 732,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "TRUCK",
      activeWindowSec: [11, 21],
    },
    {
      id: "BAYB2-3",
      stepNumber: 3,
      title: "Phân Loại Hàng Hải Quan Row D",
      subtitle: "Đặt công vào khu chờ thông quan điện tử eDO",
      time: "Vị trí 3",
      metricBadge: "81% Occupancy",
      state: "ACTIVE",
      mapX: 805,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [21, 30],
    },
  ],
  "BAY-C1": [
    {
      id: "BAYC1-1",
      stepNumber: 1,
      title: "Đảo Chuyển Gom Hàng Xuất Row B",
      subtitle: "e-RTG-04 sắp xếp 290 TEU theo thứ tự hầm tàu",
      time: "Vị trí 1",
      metricBadge: "650 kW · Row B",
      state: "COMPLETED",
      mapX: 725,
      mapY: 714,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [0, 14],
    },
    {
      id: "BAYC1-2",
      stepNumber: 2,
      title: "Hạ Công Xuất Lên Xe TRK-3105",
      subtitle: "e-RTG-04 cấp 2×20' TEU tại làn giao nhận Nam",
      time: "Vị trí 2",
      metricBadge: "290/450 TEU",
      state: "ACTIVE",
      mapX: 830,
      mapY: 714,
      zoomLevel: 2.1,
      modeIcon: "TRUCK",
      activeWindowSec: [14, 30],
    },
  ],
  "BAY-R1": [
    {
      id: "BAYR1-1",
      stepNumber: 1,
      title: "Đấu Nguồn Lạnh 440V Tại Rack A",
      subtitle: "Nhận công lạnh từ TRK-4018 & giữ nhiệt -18.5°C",
      time: "Vị trí 1",
      metricBadge: "840 kW · Rack A",
      state: "COMPLETED",
      mapX: 1265,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [0, 9],
    },
    {
      id: "BAYR1-2",
      stepNumber: 2,
      title: "Giám Sát Nhiệt & Bù Điện Mặt Trời",
      subtitle: "353/480 ổ cắm ổn định -18.5°C · Bù 320 kW Solar",
      time: "Vị trí 2",
      metricBadge: "353 Plugs Active",
      state: "ACTIVE",
      mapX: 1355,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [9, 30],
    },
  ],
  "BAY-A1": [
    {
      id: "BAYA1-1",
      stepNumber: 1,
      title: "Cấp Công Nội Địa Lên Xe TRK-1092",
      subtitle: "Cẩu RTG bãi Tây hạ công chuyển ra bến sà lan",
      time: "Vị trí 1",
      metricBadge: "160 kW · Lane W",
      state: "COMPLETED",
      mapX: 245,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "TRUCK",
      activeWindowSec: [0, 10],
    },
    {
      id: "BAYA1-2",
      stepNumber: 2,
      title: "Lưu Bãi Lô Hàng Feeder Row F",
      subtitle: "Quản lý 412/500 TEU hàng nội địa chờ xuất cổng",
      time: "Vị trí 2",
      metricBadge: "82% Full · Row F",
      state: "ACTIVE",
      mapX: 325,
      mapY: 522,
      zoomLevel: 2.1,
      modeIcon: "BAY",
      activeWindowSec: [10, 30],
    },
  ],
};

// ============================================================================
// 30-SECOND CONTINUOUS CLOSED-LOOP ENGINE WITH 5–10s PHYSICAL DWELL STOPS
// (Clean, concise labels without verbose "Dừng Xs" text)
// ============================================================================
export interface EntityLoopKeyframe {
  t: number;
  x: number;
  y: number;
  state: "DWELL" | "MOVING";
  destinationLabel: string;
  activityText: string;
  liveMetric: string;
  auxOffset?: number;
}

export interface LiveEntityTelemetryState {
  x: number;
  y: number;
  headingDeg: number;
  isDwelling: boolean;
  dwellRemainingSec: number;
  destinationLabel: string;
  activityText: string;
  liveMetric: string;
  auxOffset: number;
}

const ENTITY_30S_SCHEDULES: Record<string, EntityLoopKeyframe[]> = {
  "VSL-01": [
    {
      t: 0,
      x: 800,
      y: 268,
      state: "DWELL",
      destinationLabel: "Cầu Bến B2 · Trạm OPS 6.6kV",
      activityText: "Neo tại cầu B2 · Cấp điện bờ 540 kW & làm hàng hầm #2, #5",
      liveMetric: "540 kW OPS · 68% TEU",
      auxOffset: -30,
    },
    {
      t: 10,
      x: 800,
      y: 268,
      state: "DWELL",
      destinationLabel: "Cầu Bến B2 · Hầm hàng #2 & #5",
      activityText: "Cẩu STS-01 & STS-02 đang xếp dỡ đôi container 40'HC",
      liveMetric: "1,740 kW · 34 Moves/h",
      auxOffset: 15,
    },
    {
      t: 20,
      x: 800,
      y: 268,
      state: "DWELL",
      destinationLabel: "Cầu Bến B2 · Hầm hàng #3 & #6",
      activityText: "Nhận container xuất khẩu từ xe TRK-2205 xuống hầm #5",
      liveMetric: "538 kW OPS · -18.4% Regen",
      auxOffset: 45,
    },
    {
      t: 30,
      x: 800,
      y: 268,
      state: "DWELL",
      destinationLabel: "Cầu Bến B2 · Trạm OPS 6.6kV",
      activityText: "Neo tại cầu B2 · Cấp điện bờ 540 kW & làm hàng hầm #2, #5",
      liveMetric: "540 kW OPS · 68% TEU",
      auxOffset: -30,
    },
  ],

  "VSL-02": [
    {
      t: 0,
      x: 1365,
      y: 135,
      state: "DWELL",
      destinationLabel: "Vũng Quay Tàu Đông",
      activityText: "Bắt cáp 2 tàu lai Azimuth Tân Cảng 01 & 02 tại vũng quay",
      liveMetric: "0.0 kn · Bắt cáp tàu lai",
    },
    {
      t: 7,
      x: 1365,
      y: 135,
      state: "MOVING",
      destinationLabel: "→ Cầu Bến Nước Sâu B3",
      activityText: "2 tàu lai đang đẩy ép mạn tàu MV ONE APUS vào cầu B3",
      liveMetric: "3.2 kn · Lai dắt vào B3",
    },
    {
      t: 14,
      x: 1318,
      y: 268,
      state: "DWELL",
      destinationLabel: "Cầu Bến Nước Sâu B3",
      activityText: "Đấu nối điện bờ 730 kW & cẩu STS-03 dỡ container lạnh",
      liveMetric: "730 kW OPS · Làm hàng B3",
    },
    {
      t: 24,
      x: 1318,
      y: 268,
      state: "MOVING",
      destinationLabel: "→ Vũng Quay Tàu Đông",
      activityText: "Tàu lai điều hướng rời cầu B3 ra Vũng Quay Tàu Đông",
      liveMetric: "4.1 kn · Rời cầu B3",
    },
    {
      t: 30,
      x: 1365,
      y: 135,
      state: "DWELL",
      destinationLabel: "Vũng Quay Tàu Đông",
      activityText: "Bắt cáp 2 tàu lai Azimuth Tân Cảng 01 & 02 tại vũng quay",
      liveMetric: "0.0 kn · Bắt cáp tàu lai",
    },
  ],

  "VSL-03": [
    {
      t: 0,
      x: 295,
      y: 268,
      state: "DWELL",
      destinationLabel: "Cầu Bến Thủy Nội Địa B1",
      activityText: "Chốt 1,200 TEU, tháo cáp điện bờ OPS & móc dây tàu lai 04",
      liveMetric: "0.0 kn · Chuẩn bị rời B1",
    },
    {
      t: 9,
      x: 295,
      y: 268,
      state: "MOVING",
      destinationLabel: "→ Phao Hoa Tiêu Biển Tây",
      activityText: "Tàu lai Cát Lái 04 kéo tàu rời cầu B1 ra luồng hàng hải",
      liveMetric: "5.4 kn · Rời bến ra biển",
    },
    {
      t: 16,
      x: 215,
      y: 85,
      state: "DWELL",
      destinationLabel: "Phao Hoa Tiêu Biển Tây",
      activityText: "Hoa tiêu rời tàu xuống ca-nô & tháo cáp lai dắt ngoài biển",
      liveMetric: "0.4 kn · Trả hoa tiêu",
    },
    {
      t: 23.5,
      x: 215,
      y: 85,
      state: "MOVING",
      destinationLabel: "→ Cầu Bến Thủy Nội Địa B1",
      activityText: "Hành trình từ Phao Hoa Tiêu Tây tiến vào cầu bến B1",
      liveMetric: "6.2 kn · Vào luồng B1",
    },
    {
      t: 30,
      x: 295,
      y: 268,
      state: "DWELL",
      destinationLabel: "Cầu Bến Thủy Nội Địa B1",
      activityText: "Chốt 1,200 TEU, tháo cáp điện bờ OPS & móc dây tàu lai 04",
      liveMetric: "0.0 kn · Chuẩn bị rời B1",
    },
  ],

  "STS-01": [
    {
      t: 0,
      x: 710,
      y: 315,
      state: "DWELL",
      destinationLabel: "Làn Xe Số 1 Chân Cẩu STS-01",
      activityText: "Hạ container 40'HC #MSKU9028140 lên xe đầu kéo TRK-2481",
      liveMetric: "-92 kW Regen · Giao công",
      auxOffset: 50,
    },
    {
      t: 7.5,
      x: 710,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Hầm Hàng #2 Tàu SPIRIT OF MUMBAI",
      activityText: "Kéo xe con (trolley) vươn 52m ra hầm hàng #2 trên tàu",
      liveMetric: "320 kW · Vươn Trolley",
      auxOffset: 50,
    },
    {
      t: 10.5,
      x: 710,
      y: 315,
      state: "DWELL",
      destinationLabel: "Hầm Hàng #2 Tàu SPIRIT OF MUMBAI",
      activityText: "Khóa twistlock & cẩu đôi 2×20' TEU lên khỏi hầm tàu #2",
      liveMetric: "510 kW · Gắp công hầm #2",
      auxOffset: -48,
    },
    {
      t: 18.5,
      x: 710,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Trượt Ray Sang Hầm Hàng #3",
      activityText: "Trượt chân đế cẩu dọc ray bờ B2 sang hầm hàng #3",
      liveMetric: "140 kW · Trượt ray bờ",
      auxOffset: -20,
    },
    {
      t: 21,
      x: 748,
      y: 315,
      state: "DWELL",
      destinationLabel: "Hầm Hàng #3 Tàu SPIRIT OF MUMBAI",
      activityText: "Gắp container nhập khẩu từ hầm #3 chuẩn bị đưa vào bờ",
      liveMetric: "485 kW · 34 Moves/h",
      auxOffset: -48,
    },
    {
      t: 27.5,
      x: 748,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Làn Xe Số 1 Chân Cẩu STS-01",
      activityText: "Kéo spreader vào làn xe số 1 đón xe TRK-2481",
      liveMetric: "210 kW · Kéo vào bờ",
      auxOffset: -48,
    },
    {
      t: 30,
      x: 710,
      y: 315,
      state: "DWELL",
      destinationLabel: "Làn Xe Số 1 Chân Cẩu STS-01",
      activityText: "Hạ container 40'HC #MSKU9028140 lên xe đầu kéo TRK-2481",
      liveMetric: "-92 kW Regen · Giao công",
      auxOffset: 50,
    },
  ],

  "STS-02": [
    {
      t: 0,
      x: 890,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Làn Xe Số 2 Chân Cẩu STS-02",
      activityText: "Đưa spreader vào làn số 2 đón xe TRK-2205 chở hàng xuất",
      liveMetric: "185 kW · Đón xe",
      auxOffset: -30,
    },
    {
      t: 4,
      x: 890,
      y: 315,
      state: "DWELL",
      destinationLabel: "Làn Xe Số 2 Chân Cẩu STS-02",
      activityText: "Móc 2 công xuất #TCNU4491021 từ rơ-moóc xe TRK-2205",
      liveMetric: "490 kW · Cẩu hàng xuất",
      auxOffset: 50,
    },
    {
      t: 12,
      x: 890,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Hầm Hàng #5 Tàu SPIRIT OF MUMBAI",
      activityText: "Kéo công xuất khẩu ra ngoài mạn tàu vị trí hầm hàng #5",
      liveMetric: "340 kW · Đưa ra tàu",
      auxOffset: 50,
    },
    {
      t: 15.5,
      x: 890,
      y: 315,
      state: "DWELL",
      destinationLabel: "Hầm Hàng #5 Tàu SPIRIT OF MUMBAI",
      activityText: "Hạ 2 công xuất xuống hầm #5 & thu hồi điện năng tái sinh",
      liveMetric: "-84 kW Regen · Xếp hầm #5",
      auxOffset: -48,
    },
    {
      t: 24.5,
      x: 890,
      y: 315,
      state: "DWELL",
      destinationLabel: "Hầm Hàng #6 Tàu SPIRIT OF MUMBAI",
      activityText: "Căn chỉnh khóa gù tầng boong hầm #6 trên tàu",
      liveMetric: "120 kW · Khóa twistlock",
      auxOffset: -30,
    },
    {
      t: 30,
      x: 890,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Làn Xe Số 2 Chân Cẩu STS-02",
      activityText: "Đưa spreader vào làn số 2 đón xe TRK-2205 chở hàng xuất",
      liveMetric: "185 kW · Đón xe",
      auxOffset: -30,
    },
  ],

  "STS-03": [
    {
      t: 0,
      x: 1280,
      y: 315,
      state: "DWELL",
      destinationLabel: "Ray Cầu Bến B3 · Vị Trí Trực Chiến",
      activityText: "Khóa ray an toàn chờ tàu lai ép mạn MV ONE APUS cập cầu B3",
      liveMetric: "45 kW Standby",
      auxOffset: 15,
    },
    {
      t: 11,
      x: 1280,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Hầm Lạnh #4 Tàu MV ONE APUS",
      activityText: "Trượt ray sang hầm #4 & hạ cần đón tàu MV ONE APUS",
      liveMetric: "260 kW · Hạ cần vươn",
      auxOffset: 15,
    },
    {
      t: 14,
      x: 1315,
      y: 315,
      state: "DWELL",
      destinationLabel: "Hầm Lạnh #4 Tàu MV ONE APUS",
      activityText: "Gắp container lạnh -18.5°C #ONEU8821045 từ hầm tàu #4",
      liveMetric: "520 kW · Gắp công lạnh",
      auxOffset: -48,
    },
    {
      t: 21.5,
      x: 1315,
      y: 315,
      state: "DWELL",
      destinationLabel: "Làn Giao Nhận Cầu B3 (STS-03)",
      activityText: "Hạ container lạnh xuống xe TRK-2319 chuyển về Bãi Lạnh R1",
      liveMetric: "-88 kW Regen · Giao TRK-2319",
      auxOffset: 50,
    },
    {
      t: 27.5,
      x: 1315,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Ray Cầu Bến B3 · Vị Trí Trực Chiến",
      activityText: "Đưa cẩu về vị trí chuẩn bị chu kỳ tiếp theo",
      liveMetric: "130 kW · Trượt ray",
      auxOffset: 15,
    },
    {
      t: 30,
      x: 1280,
      y: 315,
      state: "DWELL",
      destinationLabel: "Ray Cầu Bến B3 · Vị Trí Trực Chiến",
      activityText: "Khóa ray an toàn chờ tàu lai ép mạn MV ONE APUS cập cầu B3",
      liveMetric: "45 kW Standby",
      auxOffset: 15,
    },
  ],

  "STS-04": [
    {
      t: 0,
      x: 295,
      y: 315,
      state: "DWELL",
      destinationLabel: "Hầm Hàng Tàu TAN CANG GLORY (B1)",
      activityText: "Gắp container cuối ca (#1,200 TEU) từ tàu TAN CANG GLORY",
      liveMetric: "390 kW · Cẩu công cuối",
      auxOffset: -45,
    },
    {
      t: 8.5,
      x: 295,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Chốt Khóa Gió Cầu B1",
      activityText: "Thu trolley vào bờ để tàu TAN CANG GLORY rời cầu B1",
      liveMetric: "145 kW · Thu cần",
      auxOffset: 0,
    },
    {
      t: 11,
      x: 260,
      y: 315,
      state: "DWELL",
      destinationLabel: "Chốt Khóa Gió Cầu B1",
      activityText: "Nâng cần khóa an toàn trong lúc tàu lai kéo tàu rời cầu B1",
      liveMetric: "18 kW · Khóa cần 80°",
      auxOffset: 10,
    },
    {
      t: 22,
      x: 295,
      y: 315,
      state: "DWELL",
      destinationLabel: "Làn Giao Nhận Cầu B1 (STS-04)",
      activityText: "Hạ container lưu đệm xuống xe TRK-2104 chở về Bãi Nội Địa A1",
      liveMetric: "280 kW · Giao TRK-2104",
      auxOffset: 50,
    },
    {
      t: 27.5,
      x: 295,
      y: 315,
      state: "MOVING",
      destinationLabel: "→ Hầm Hàng Tàu TAN CANG GLORY (B1)",
      activityText: "Vươn spreader ra vị trí cầu B1",
      liveMetric: "190 kW · Vươn cần",
      auxOffset: -45,
    },
    {
      t: 30,
      x: 295,
      y: 315,
      state: "DWELL",
      destinationLabel: "Hầm Hàng Tàu TAN CANG GLORY (B1)",
      activityText: "Gắp container cuối ca (#1,200 TEU) từ tàu TAN CANG GLORY",
      liveMetric: "390 kW · Cẩu công cuối",
      auxOffset: -45,
    },
  ],

  "TRK-2481": [
    {
      t: 0,
      x: 710,
      y: 365,
      state: "DWELL",
      destinationLabel: "Chân Cẩu Bờ STS-01 (Cầu B2)",
      activityText: "Đang nhận container 40'HC #MSKU9028140 dưới chân cẩu STS-01",
      liveMetric: "0 km/h · Nhận công 40'HC",
    },
    {
      t: 7.5,
      x: 710,
      y: 365,
      state: "MOVING",
      destinationLabel: "→ Bãi Container Nhập Bay B2",
      activityText: "Rời chân cẩu STS-01 chở hàng nhập về Bãi Nhập Bay B2",
      liveMetric: "18 km/h · 42 kW EV",
    },
    {
      t: 8.5,
      x: 710,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Bãi Container Nhập Bay B2",
      activityText: "Chạy dọc Đường Cầu Tàu Bắc rẽ xuống Trục Bãi Trung Tâm Tây",
      liveMetric: "20 km/h · 44 kW EV",
    },
    {
      t: 9.7,
      x: 530,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Bãi Container Nhập Bay B2",
      activityText: "Tiến vào làn giao nhận cẩu khung e-RTG-01 tại Bãi Nhập Bay B2",
      liveMetric: "16 km/h · Vào làn bãi B2",
    },
    {
      t: 10.6,
      x: 530,
      y: 520,
      state: "MOVING",
      destinationLabel: "→ Bãi Container Nhập Bay B2",
      activityText: "Căn chỉnh rơ-moóc dưới chân cẩu khung e-RTG-01 (Row B)",
      liveMetric: "10 km/h · Căn vị trí",
    },
    {
      t: 11.5,
      x: 710,
      y: 520,
      state: "DWELL",
      destinationLabel: "Bãi Nhập Bay B2 (Làn e-RTG-01)",
      activityText: "Cẩu khung e-RTG-01 đang nhấc container vào ô B2-R04-T3",
      liveMetric: "0 km/h · Hạ công bãi B2",
    },
    {
      t: 19.5,
      x: 710,
      y: 520,
      state: "MOVING",
      destinationLabel: "→ Cổng Quét OCR & Trạm Cân",
      activityText: "Di chuyển sang Trạm Cân & Cổng Quét OCR Đại Lộ Trung Tâm",
      liveMetric: "19 km/h · Tới cổng OCR",
    },
    {
      t: 21.0,
      x: 910,
      y: 520,
      state: "MOVING",
      destinationLabel: "→ Cổng Quét OCR & Trạm Cân",
      activityText: "Vào làn quét camera OCR trên Đại Lộ Container Trung Tâm",
      liveMetric: "12 km/h · Vào làn OCR",
    },
    {
      t: 22.0,
      x: 910,
      y: 615,
      state: "DWELL",
      destinationLabel: "Cổng Quét OCR & Trạm Cân",
      activityText: "Xác thực hoàn tất eDO & nhận lệnh điều phối chuyến kế tiếp",
      liveMetric: "0 km/h · Quét OCR ePort",
    },
    {
      t: 27.0,
      x: 910,
      y: 615,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-01 (Cầu B2)",
      activityText: "Quay lại làn số 1 dưới chân cẩu STS-01 đón công tiếp theo",
      liveMetric: "22 km/h · Về cẩu STS-01",
    },
    {
      t: 28.5,
      x: 910,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-01 (Cầu B2)",
      activityText: "Rẽ trái trên Đường Cầu Tàu Bắc vào chân cẩu bờ STS-01",
      liveMetric: "16 km/h · Đường Cầu Tàu",
    },
    {
      t: 29.3,
      x: 710,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-01 (Cầu B2)",
      activityText: "Vào vị trí đỗ dưới spreader cẩu bờ STS-01",
      liveMetric: "8 km/h · Vào làn 1",
    },
    {
      t: 30.0,
      x: 710,
      y: 365,
      state: "DWELL",
      destinationLabel: "Chân Cẩu Bờ STS-01 (Cầu B2)",
      activityText: "Đang nhận container 40'HC #MSKU9028140 dưới chân cẩu STS-01",
      liveMetric: "0 km/h · Nhận công 40'HC",
    },
  ],

  "TRK-3105": [
    {
      t: 0,
      x: 1070,
      y: 520,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-02 (Cầu B2)",
      activityText: "Chở 2×20' hàng xuất khẩu theo Đại Lộ Đông lên cầu tàu B2",
      liveMetric: "20 km/h · Chở 2 công xuất",
    },
    {
      t: 1.8,
      x: 1070,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-02 (Cầu B2)",
      activityText: "Rẽ vào Đường Cầu Tàu Bắc tiến tới chân cẩu bờ STS-02",
      liveMetric: "17 km/h · Vào cầu B2",
    },
    {
      t: 3.0,
      x: 890,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-02 (Cầu B2)",
      activityText: "Đưa rơ-moóc vào đúng tâm cẩu bờ STS-02 tại cầu B2",
      liveMetric: "9 km/h · Căn vị trí",
    },
    {
      t: 4.0,
      x: 890,
      y: 365,
      state: "DWELL",
      destinationLabel: "Chân Cẩu Bờ STS-02 (Cầu B2)",
      activityText: "Cẩu bờ STS-02 đang móc 2 công xuất #HLXU6192041 đưa lên tàu",
      liveMetric: "0 km/h · Giao 2 công xuất",
    },
    {
      t: 12.0,
      x: 890,
      y: 365,
      state: "MOVING",
      destinationLabel: "→ Bãi Xuất Khẩu Nam (Bay C1)",
      activityText: "Rơ-moóc trống rời cầu B2, chạy về Bãi Xuất Khẩu Nam Bay C1",
      liveMetric: "23 km/h · Về bãi xuất C1",
    },
    {
      t: 13.0,
      x: 890,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Bãi Xuất Khẩu Nam (Bay C1)",
      activityText: "Rẽ qua Trục Đại Lộ Tây vượt qua Đại Lộ Trung Tâm",
      liveMetric: "24 km/h · Qua trục chính",
    },
    {
      t: 14.3,
      x: 530,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Bãi Xuất Khẩu Nam (Bay C1)",
      activityText: "Chạy thẳng xuống khu Bãi Xuất Khẩu Nam Bay C1",
      liveMetric: "22 km/h · Trục Bắc-Nam",
    },
    {
      t: 15.6,
      x: 530,
      y: 714,
      state: "MOVING",
      destinationLabel: "→ Bãi Xuất Khẩu Nam (Bay C1)",
      activityText: "Tiến vào làn cẩu khung e-RTG-04 tại Bãi Xuất Bay C1",
      liveMetric: "14 km/h · Vào làn Bay C1",
    },
    {
      t: 16.5,
      x: 790,
      y: 714,
      state: "DWELL",
      destinationLabel: "Bãi Xuất Khẩu Nam Bay C1 (Row C)",
      activityText: "Cẩu e-RTG-04 đang hạ 2 công xuất khẩu lên xe & chốt VGM",
      liveMetric: "0 km/h · Bốc hàng xuất C1",
    },
    {
      t: 26.0,
      x: 790,
      y: 714,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-02 (Cầu B2)",
      activityText: "Rẽ ra Đại Lộ Đông hướng lên Cầu Bến B2",
      liveMetric: "19 km/h · Ra Đại Lộ Đông",
    },
    {
      t: 28.0,
      x: 1070,
      y: 714,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-02 (Cầu B2)",
      activityText: "Chạy dọc Đại Lộ Đông qua Trạm Biến Áp OPS lên cầu B2",
      liveMetric: "21 km/h · Lên cầu B2",
    },
    {
      t: 30.0,
      x: 1070,
      y: 520,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-02 (Cầu B2)",
      activityText: "Chở 2×20' hàng xuất khẩu theo Đại Lộ Đông lên cầu tàu B2",
      liveMetric: "20 km/h · Chở 2 công xuất",
    },
  ],

  "TRK-4018": [
    {
      t: 0,
      x: 1315,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Lạnh Reefer Bay R1 (-18.5°C)",
      activityText: "Hạ container lạnh xuống Rack A & đấu nối ổ cắm 440V",
      liveMetric: "0 km/h · Hạ công lạnh R1",
    },
    {
      t: 6.5,
      x: 1315,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Trạm PTI Lạnh & Sạc EV",
      activityText: "Di chuyển xuống Trạm Kiểm Định Lạnh PTI phía Nam",
      liveMetric: "18 km/h · Tới trạm PTI",
    },
    {
      t: 7.8,
      x: 1070,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Trạm PTI Lạnh & Sạc EV",
      activityText: "Chạy dọc trục đường phân khu Đông xuống khu kỹ thuật PTI",
      liveMetric: "20 km/h · Hành lang Đông",
    },
    {
      t: 9.0,
      x: 1070,
      y: 735,
      state: "MOVING",
      destinationLabel: "→ Trạm PTI Lạnh & Sạc EV",
      activityText: "Rẽ vào sân đỗ Trạm Kiểm Định Lạnh PTI & Sạc Nhanh EV",
      liveMetric: "14 km/h · Vào sân PTI",
    },
    {
      t: 10.0,
      x: 1315,
      y: 735,
      state: "DWELL",
      destinationLabel: "Trạm PTI Lạnh & Sạc EV Đông",
      activityText: "Kiểm định cảm biến nhiệt độ chuỗi lạnh IoT & trạm sạc nhanh EV",
      liveMetric: "0 km/h · PTI OK · Fast EV",
    },
    {
      t: 17.5,
      x: 1315,
      y: 735,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-03 (Cầu B3)",
      activityText: "Xuất phát theo Đại Lộ Biên Đông lên Cầu Bến Nước Sâu B3",
      liveMetric: "22 km/h · Lên cầu B3",
    },
    {
      t: 18.8,
      x: 1510,
      y: 735,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-03 (Cầu B3)",
      activityText: "Chạy dọc Đại Lộ Biên Đông hướng thẳng lên cầu tàu B3",
      liveMetric: "24 km/h · Đường Biên Đông",
    },
    {
      t: 20.2,
      x: 1510,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-03 (Cầu B3)",
      activityText: "Rẽ trái vào Đường Cầu Tàu B3 tiếp cận chân cẩu STS-03",
      liveMetric: "16 km/h · Đường Cầu B3",
    },
    {
      t: 21.0,
      x: 1315,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-03 (Cầu B3)",
      activityText: "Đưa rơ-moóc lạnh vào vị trí hạ công dưới chân cẩu STS-03",
      liveMetric: "8 km/h · Căn vị trí",
    },
    {
      t: 21.5,
      x: 1315,
      y: 365,
      state: "DWELL",
      destinationLabel: "Chân Cẩu Bờ STS-03 (Cầu B3)",
      activityText: "Nhận container lạnh -18.5°C #VNLU5520188 từ tàu",
      liveMetric: "0 km/h · Nhận công lạnh",
    },
    {
      t: 27.5,
      x: 1315,
      y: 365,
      state: "MOVING",
      destinationLabel: "→ Bãi Lạnh Reefer Bay R1 (-18.5°C)",
      activityText: "Chở container lạnh vừa nhận về Bãi Lạnh R1",
      liveMetric: "18 km/h · Về bãi lạnh R1",
    },
    {
      t: 30.0,
      x: 1315,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Lạnh Reefer Bay R1 (-18.5°C)",
      activityText: "Hạ container lạnh xuống Rack A & đấu nối ổ cắm 440V",
      liveMetric: "0 km/h · Hạ công lạnh R1",
    },
  ],

  "TRK-1092": [
    {
      t: 0,
      x: 285,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Container Nội Địa (Bay A1)",
      activityText: "Cẩu RTG bãi nội địa hạ container #CMAU4920182 lên rơ-moóc",
      liveMetric: "0 km/h · Bốc công nội địa",
    },
    {
      t: 8.0,
      x: 285,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Bến Sà Lan Nội Địa Tây",
      activityText: "Chở công nội địa theo Đường Biên Tây xuống Bến Sà Lan",
      liveMetric: "19 km/h · e-Truck F-05",
    },
    {
      t: 9.2,
      x: 105,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Bến Sà Lan Nội Địa Tây",
      activityText: "Chạy dọc hành lang xanh phía Tây xuống Bến Sà Lan Nội Địa",
      liveMetric: "21 km/h · Đường Biên Tây",
    },
    {
      t: 10.5,
      x: 105,
      y: 735,
      state: "MOVING",
      destinationLabel: "→ Bến Sà Lan Nội Địa Tây",
      activityText: "Rẽ vào bãi tập kết Trạm Điều Phối Sà Lan & Cổng Nội Địa Tây",
      liveMetric: "14 km/h · Vào bến sà lan",
    },
    {
      t: 11.5,
      x: 295,
      y: 735,
      state: "DWELL",
      destinationLabel: "Bến Sà Lan Nội Địa Tây",
      activityText: "Bàn giao container nội địa sang cẩu sà lan tuyến ĐBSCL",
      liveMetric: "0 km/h · Giao hàng sà lan",
    },
    {
      t: 18.5,
      x: 295,
      y: 735,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-04 (Cầu B1)",
      activityText: "Rời Bến Sà Lan Tây, chạy dọc trục đường Âu Tàu lên Cầu Bến B1",
      liveMetric: "22 km/h · Lên cầu B1",
    },
    {
      t: 19.6,
      x: 475,
      y: 735,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-04 (Cầu B1)",
      activityText: "Đi thẳng qua Đại Lộ Trung Tâm hướng về Cầu Bến B1",
      liveMetric: "23 km/h · Trục Âu Tàu",
    },
    {
      t: 21.0,
      x: 475,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-04 (Cầu B1)",
      activityText: "Rẽ trái vào Đường Cầu Bến B1 tiến vào chân cẩu STS-04",
      liveMetric: "16 km/h · Đường Cầu B1",
    },
    {
      t: 21.6,
      x: 295,
      y: 420,
      state: "MOVING",
      destinationLabel: "→ Chân Cẩu Bờ STS-04 (Cầu B1)",
      activityText: "Đưa xe vào vị trí nhận container dưới chân cẩu STS-04",
      liveMetric: "8 km/h · Căn vị trí",
    },
    {
      t: 22.0,
      x: 295,
      y: 365,
      state: "DWELL",
      destinationLabel: "Chân Cẩu Bờ STS-04 (Cầu B1)",
      activityText: "Nhận container cuối ca từ chân cẩu bờ STS-04 tại cầu B1",
      liveMetric: "0 km/h · Nhận công B1",
    },
    {
      t: 27.5,
      x: 295,
      y: 365,
      state: "MOVING",
      destinationLabel: "→ Bãi Container Nội Địa (Bay A1)",
      activityText: "Chở container từ cầu B1 thẳng về Bãi Nội Địa Bay A1",
      liveMetric: "18 km/h · Về bãi Bay A1",
    },
    {
      t: 30.0,
      x: 285,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Container Nội Địa (Bay A1)",
      activityText: "Cẩu RTG bãi nội địa hạ container #CMAU4920182 lên rơ-moóc",
      liveMetric: "0 km/h · Bốc công nội địa",
    },
  ],

  "BAY-B2": [
    {
      t: 0,
      x: 732,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Nhập Bay B2 · Row A",
      activityText: "Cẩu khung e-RTG-01 đang xếp chồng công nhập tầng 4 tại Row A",
      liveMetric: "580 kW · Row A (81%)",
      auxOffset: -68,
    },
    {
      t: 9,
      x: 732,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Làn Xe TRK-2481 (Row B)",
      activityText: "Khung cẩu e-RTG-01 trượt sang làn đón xe đầu kéo TRK-2481",
      liveMetric: "280 kW · Trượt khung RTG",
      auxOffset: -68,
    },
    {
      t: 11.5,
      x: 732,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Nhập Bay B2 · Làn Xe Row B",
      activityText: "Cẩu e-RTG-01 đang nhấc công 40'HC #MSCU8921040 khỏi xe TRK-2481",
      liveMetric: "580 kW · Nhấc công TRK-2481",
      auxOffset: -25,
    },
    {
      t: 19.5,
      x: 732,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Khu Hàng Hải Quan eDO (Row D)",
      activityText: "e-RTG-01 di chuyển sang Row D đưa công vào ô lưu bãi",
      liveMetric: "310 kW · Sang Row D",
      auxOffset: -25,
    },
    {
      t: 21.5,
      x: 732,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Nhập Bay B2 · Row D (Khu eDO)",
      activityText: "Hạ container vào ô B2-R04-T3 & đồng bộ vị trí trên Navis N4",
      liveMetric: "365/450 TEU · Đã xếp bãi",
      auxOffset: 62,
    },
    {
      t: 28,
      x: 732,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Bãi Nhập Bay B2 · Row A",
      activityText: "Khung cẩu e-RTG-01 quay về Row A",
      liveMetric: "240 kW · Về Row A",
      auxOffset: 62,
    },
    {
      t: 30,
      x: 732,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Nhập Bay B2 · Row A",
      activityText: "Cẩu khung e-RTG-01 đang xếp chồng công nhập tầng 4 tại Row A",
      liveMetric: "580 kW · Row A (81%)",
      auxOffset: -68,
    },
  ],

  "BAY-C1": [
    {
      t: 0,
      x: 790,
      y: 714,
      state: "DWELL",
      destinationLabel: "Bãi Xuất Bay C1 · Row B",
      activityText: "Cẩu e-RTG-04 đảo chuyển gom công xuất đã cân VGM tại Row B",
      liveMetric: "650 kW · Gom hàng VGM",
      auxOffset: -62,
    },
    {
      t: 12,
      x: 790,
      y: 714,
      state: "MOVING",
      destinationLabel: "→ Làn Xe TRK-3105 (Row C)",
      activityText: "e-RTG-04 trượt sang làn giao nhận đón xe đầu kéo TRK-3105",
      liveMetric: "410 kW · Sang làn xe",
      auxOffset: -62,
    },
    {
      t: 16.5,
      x: 790,
      y: 714,
      state: "DWELL",
      destinationLabel: "Bãi Xuất Bay C1 · Làn Xe Row C",
      activityText: "Cẩu e-RTG-04 hạ 2×20' hàng xuất lên xe TRK-3105 chở ra cầu B2",
      liveMetric: "650 kW · Cấp công TRK-3105",
      auxOffset: 38,
    },
    {
      t: 26,
      x: 790,
      y: 714,
      state: "MOVING",
      destinationLabel: "→ Bãi Xuất Bay C1 · Row B",
      activityText: "Khung cẩu e-RTG-04 quay về Row B gắp cặp công xuất tiếp theo",
      liveMetric: "320 kW · Về Row B",
      auxOffset: 38,
    },
    {
      t: 30,
      x: 790,
      y: 714,
      state: "DWELL",
      destinationLabel: "Bãi Xuất Bay C1 · Row B",
      activityText: "Cẩu e-RTG-04 đảo chuyển gom công xuất đã cân VGM tại Row B",
      liveMetric: "650 kW · Gom hàng VGM",
      auxOffset: -62,
    },
  ],

  "BAY-R1": [
    {
      t: 0,
      x: 1315,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Lạnh Reefer R1 · Rack A",
      activityText: "Nhấc công lạnh từ xe TRK-4018 vào Rack A & đấu nguồn 440V (-18.5°C)",
      liveMetric: "1,650 kW · Đấu điện Rack A",
      auxOffset: -45,
    },
    {
      t: 7,
      x: 1315,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Giàn Ổ Cắm Lạnh Rack C",
      activityText: "Khung cẩu bãi lạnh di chuyển sang kiểm tra giàn Rack C",
      liveMetric: "1,610 kW · Solar 42%",
      auxOffset: -45,
    },
    {
      t: 10,
      x: 1315,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Lạnh Reefer R1 · Rack C (-18.5°C)",
      activityText: "Duy trì làm lạnh sâu 353 ổ cắm · Bù 42% điện mặt trời áp mái",
      liveMetric: "353/480 Plugs · -18.5°C",
      auxOffset: 55,
    },
    {
      t: 24,
      x: 1315,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Bãi Lạnh Reefer R1 · Rack A",
      activityText: "Đưa khung cẩu về Rack A đón xe TRK-4018 từ cầu B3 về",
      liveMetric: "1,630 kW · Về Rack A",
      auxOffset: 55,
    },
    {
      t: 30,
      x: 1315,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Lạnh Reefer R1 · Rack A",
      activityText: "Nhấc công lạnh từ xe TRK-4018 vào Rack A & đấu nguồn 440V (-18.5°C)",
      liveMetric: "1,650 kW · Đấu điện Rack A",
      auxOffset: -45,
    },
  ],

  "BAY-A1": [
    {
      t: 0,
      x: 285,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Nội Địa Bay A1 · Làn Tây",
      activityText: "Cẩu RTG bãi nội địa hạ container #CMAU4920182 lên xe TRK-1092",
      liveMetric: "1,260 kW · Cấp công TRK-1092",
      auxOffset: -52,
    },
    {
      t: 8,
      x: 285,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Block Lưu Bãi Nội Địa Row F",
      activityText: "Di chuyển khung cẩu RTG sang Row F sắp xếp lô hàng Feeder",
      liveMetric: "1,180 kW · Sang Row F",
      auxOffset: -52,
    },
    {
      t: 11,
      x: 285,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Nội Địa Bay A1 · Row F",
      activityText: "Quản lý 412 TEU hàng nội địa chờ phân phối tuyến sà lan",
      liveMetric: "412/500 TEU (82%)",
      auxOffset: 52,
    },
    {
      t: 25,
      x: 285,
      y: 522,
      state: "MOVING",
      destinationLabel: "→ Bãi Nội Địa Bay A1 · Làn Tây",
      activityText: "Đưa khung cẩu về làn giao nhận đón xe TRK-1092",
      liveMetric: "1,210 kW · Về làn xe",
      auxOffset: 52,
    },
    {
      t: 30,
      x: 285,
      y: 522,
      state: "DWELL",
      destinationLabel: "Bãi Nội Địa Bay A1 · Làn Tây",
      activityText: "Cẩu RTG bãi nội địa hạ container #CMAU4920182 lên xe TRK-1092",
      liveMetric: "1,260 kW · Cấp công TRK-1092",
      auxOffset: -52,
    },
  ],
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function computeLiveEntityState(
  entityId: string,
  loopSec: number
): LiveEntityTelemetryState {
  const schedule = ENTITY_30S_SCHEDULES[entityId];
  if (!schedule || schedule.length === 0) {
    return {
      x: 800,
      y: 450,
      headingDeg: 0,
      isDwelling: true,
      dwellRemainingSec: 5,
      destinationLabel: "Terminal Zone",
      activityText: "Active monitoring",
      liveMetric: "Online",
      auxOffset: 0,
    };
  }

  const t = ((loopSec % LOOP_DURATION_SEC) + LOOP_DURATION_SEC) % LOOP_DURATION_SEC;

  let segIdx = 0;
  for (let i = 0; i < schedule.length - 1; i++) {
    if (t >= schedule[i].t && t <= schedule[i + 1].t) {
      segIdx = i;
      break;
    }
  }

  const k1 = schedule[segIdx];
  const k2 = schedule[segIdx + 1];
  const duration = Math.max(0.0001, k2.t - k1.t);
  const rawProgress = Math.max(0, Math.min(1, (t - k1.t) / duration));

  const isDwelling = k1.state === "DWELL";
  const progress = isDwelling ? rawProgress : easeInOutCubic(rawProgress);

  const x = k1.x + (k2.x - k1.x) * progress;
  const y = k1.y + (k2.y - k1.y) * progress;
  const aux1 = k1.auxOffset ?? 0;
  const aux2 = k2.auxOffset ?? aux1;
  const auxOffset = aux1 + (aux2 - aux1) * progress;

  let headingDeg = 0;
  if (Math.abs(k2.x - k1.x) > 1 || Math.abs(k2.y - k1.y) > 1) {
    headingDeg = (Math.atan2(k2.y - k1.y, k2.x - k1.x) * 180) / Math.PI;
  }

  const dwellRemainingSec = isDwelling ? Math.max(0, k2.t - t) : 0;

  return {
    x,
    y,
    headingDeg,
    isDwelling,
    dwellRemainingSec,
    destinationLabel: k1.destinationLabel,
    activityText: k1.activityText,
    liveMetric: k1.liveMetric,
    auxOffset,
  };
}

interface PortTerminal2DStrategyMapProps {
  selectedZoneId: string | null;
  onSelectZone: (zone: TerminalStrategyZone | null) => void;
  selectedEntityId: string | null;
  onSelectEntity: (entity: Terminal3DEntity) => void;
  activeCategoryFilter: TerminalEntityCategory | null;
  onSelectCategoryFilter: (cat: TerminalEntityCategory | null) => void;
  focusedWaypoint: TimelineWaypoint | null;
  onSelectWaypoint: (wp: TimelineWaypoint | null) => void;
  onLoopTimeChange?: (loopSec: number) => void;
  leftListCollapsed: boolean;
  onToggleLeftListCollapsed: (collapsed: boolean) => void;
}

export const PortTerminal2DStrategyMap: React.FC<
  PortTerminal2DStrategyMapProps
> = ({
  selectedZoneId,
  onSelectZone,
  selectedEntityId,
  onSelectEntity,
  activeCategoryFilter,
  onSelectCategoryFilter,
  focusedWaypoint,
  onSelectWaypoint,
  onLoopTimeChange,
  leftListCollapsed,
  onToggleLeftListCollapsed,
}) => {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);

  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [loopSec, setLoopSec] = useState<number>(0);

  // High-precision 30-second real-time loop using requestAnimationFrame
  useEffect(() => {
    let rafId: number;
    const startPerf = performance.now();
    let lastParentNotify = 0;

    const tick = (now: number) => {
      const elapsedSec = ((now - startPerf) / 1000) % LOOP_DURATION_SEC;
      setLoopSec(elapsedSec);
      if (onLoopTimeChange && now - lastParentNotify > 250) {
        lastParentNotify = now;
        onLoopTimeChange(elapsedSec);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onLoopTimeChange]);

  const liveStates = useMemo(() => {
    const map: Record<string, LiveEntityTelemetryState> = {};
    for (const entity of TERMINAL_3D_ENTITIES) {
      map[entity.id] = computeLiveEntityState(entity.id, loopSec);
    }
    return map;
  }, [loopSec]);

  // Zoom smoothly to Zone when selectedZoneId changes
  useEffect(() => {
    if (focusedWaypoint) return;
    if (!selectedZoneId) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const zone = TERMINAL_STRATEGY_ZONES.find((z) => z.id === selectedZoneId);
    if (zone) {
      const targetScale = zone.zoomScale;
      const targetPanX = 800 - zone.centerX * targetScale;
      const targetPanY = 440 - zone.centerY * targetScale;
      setZoom(targetScale);
      setPan({ x: targetPanX, y: targetPanY });
    }
  }, [selectedZoneId, focusedWaypoint]);

  // Zoom directly to Historical / Active Waypoint when clicked in the Timeline!
  useEffect(() => {
    if (!focusedWaypoint) return;
    const targetScale = focusedWaypoint.zoomLevel || 2.05;
    const targetPanX = 800 - focusedWaypoint.mapX * targetScale;
    const targetPanY = 390 - focusedWaypoint.mapY * targetScale;
    setZoom(targetScale);
    setPan({ x: targetPanX, y: targetPanY });
  }, [focusedWaypoint]);

  const activeEntityWaypoints = useMemo(() => {
    if (!selectedEntityId) return [];
    return ENTITY_TIMELINE_WAYPOINTS[selectedEntityId] || [];
  }, [selectedEntityId]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }
    setPan({
      x: dragStartRef.current.panX + dx * 1.25,
      y: dragStartRef.current.panY + dy * 1.25,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    setZoom((prev) => {
      const next = Math.max(0.88, Math.min(2.6, prev + delta));
      if (next <= 1.04 && prev > 1.04) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleZoomStep = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(0.88, Math.min(2.6, prev + delta));
      if (next <= 1.04) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetMap = () => {
    onSelectWaypoint(null);
    onSelectZone(null);
    onSelectCategoryFilter(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const vsl02Live = liveStates["VSL-02"];
  const vsl03Live = liveStates["VSL-03"];

  const liveTugboats = [
    {
      id: "TUG-01",
      label: "Tàu lai Tân Cảng 01",
      x: (vsl02Live?.x ?? 1318) - 82,
      y: (vsl02Live?.y ?? 200) - 34,
      targetX: (vsl02Live?.x ?? 1318) - 52,
      targetY: (vsl02Live?.y ?? 200) - 10,
      linkedVesselId: "VSL-02",
    },
    {
      id: "TUG-02",
      label: "Tàu lai Tân Cảng 02",
      x: (vsl02Live?.x ?? 1318) + 86,
      y: (vsl02Live?.y ?? 200) - 32,
      targetX: (vsl02Live?.x ?? 1318) + 52,
      targetY: (vsl02Live?.y ?? 200) - 10,
      linkedVesselId: "VSL-02",
    },
    {
      id: "TUG-03",
      label: "Tàu lai Cát Lái 04",
      x: (vsl03Live?.x ?? 295) - 65,
      y: (vsl03Live?.y ?? 180) - 38,
      targetX: (vsl03Live?.x ?? 295) - 38,
      targetY: (vsl03Live?.y ?? 180) - 12,
      linkedVesselId: "VSL-03",
    },
  ];

  return (
    <div className="relative w-full h-full flex-1 min-h-0 bg-[#AADAFF] overflow-hidden select-none flex">
      {/* ==================================================================== */}
      {/* 1. CLEAN MINIMAL LEFT ZONE LIST (Auto-collapses when any point is clicked) */}
      {/* ==================================================================== */}
      <div
        className={`relative z-20 h-full bg-white border-r border-slate-200/90 flex flex-col transition-all duration-200 shrink-0 shadow-xs ${
          leftListCollapsed ? "w-11" : "w-60 sm:w-64"
        }`}
      >
        <div className="px-2.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
          {!leftListCollapsed && (
            <span className="text-xs font-black text-slate-900 truncate pl-0.5">
              {t("Port Zones", "Khu vực Cảng")} ({TERMINAL_STRATEGY_ZONES.length})
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleLeftListCollapsed(!leftListCollapsed)}
            className="w-6 h-6 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={
              leftListCollapsed
                ? t("Expand port zones list", "Mở danh sách khu vực cảng")
                : t("Collapse port zones", "Thu gọn khu vực cảng")
            }
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                leftListCollapsed ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {!leftListCollapsed ? (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-2 py-1.5 space-y-0.5">
            <button
              type="button"
              onClick={handleResetMap}
              className={`w-full px-2.5 py-2 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer ${
                selectedZoneId === null && !focusedWaypoint
                  ? "bg-blue-50/90 text-[#004B91] font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-[#004B91] flex items-center justify-center shrink-0">
                <Navigation className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">
                  {t("All Terminal Zones", "Toàn bộ Cảng")}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {t("Channel · 3 Berths · 4 Major Bays", "Luồng biển · 3 Cầu bến · 4 Bãi lớn")}
                </div>
              </div>
            </button>

            {TERMINAL_STRATEGY_ZONES.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onMouseEnter={() => setHoveredZoneId(zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => {
                    onSelectWaypoint(null);
                    if (!isSelected) {
                      onToggleLeftListCollapsed(true);
                    }
                    onSelectZone(isSelected ? null : zone);
                  }}
                  className={`w-full px-2.5 py-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#004B91] text-white shadow-2xs"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-[#004B91]"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-bold leading-snug ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {zone.name}
                    </div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelected ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {zone.quayLengthM} · {zone.powerLoadKw}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center py-2 gap-1.5 overflow-y-auto">
            <button
              type="button"
              onClick={handleResetMap}
              title="Toàn bộ Cảng"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                selectedZoneId === null
                  ? "bg-blue-100 text-[#004B91]"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
            {TERMINAL_STRATEGY_ZONES.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  title={zone.name}
                  onClick={() => {
                    onSelectWaypoint(null);
                    onSelectZone(isSelected ? null : zone);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#004B91] text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#004B91]"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 2. EXPANSIVE 1600x920 GOOGLE MAPS DAYTIME 2D PORT TERMINAL CANVAS */}
      {/* ==================================================================== */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col">
        {/* TOP FLOATING CATEGORY PILLS */}
        <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "VESSELS", label: t("Vessels", "Tàu biển"), count: 3, icon: Ship, color: "#1A73E8" },
                { id: "CRANES", label: t("Quay Cranes", "Cẩu bờ STS"), count: 4, icon: Anchor, color: "#0284C7" },
                { id: "TRUCKS", label: t("Yard Trucks", "Xe đầu kéo"), count: 4, icon: Truck, color: "#EA580C" },
                { id: "BAYS", label: t("Container Bays", "Bãi Container"), count: 4, icon: Container, color: "#0D9488" },
              ] as const
            ).map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (!isActive) {
                      onToggleLeftListCollapsed(true);
                    }
                    onSelectCategoryFilter(isActive ? null : cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#004B91] text-white border-[#004B91]"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90"
                  }`}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isActive ? "#FFFFFF" : cat.color }}
                  />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isActive ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG GOOGLE MAPS DAYTIME CARTOGRAPHY (Expanded 1600x920 ViewBox) */}
        <svg
          viewBox="0 0 1600 920"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
          className={`w-full h-full flex-1 ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <rect width="1600" height="920" fill="#AADAFF" />

          <g
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            style={{
              transition: isDragging
                ? "none"
                : "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* 1. OUTER SEA FAIRWAY & HARBOR TURNING BASINS */}
            <path
              d="M 0 15 L 1600 15 L 1600 225 L 0 225 Z"
              fill="#9CC0F9"
              fillOpacity="0.45"
            />
            <line
              x1="60"
              y1="78"
              x2="1540"
              y2="78"
              stroke="#5F97F6"
              strokeWidth="1.8"
              strokeDasharray="10 10"
            />
            <text
              x="800"
              y="55"
              textAnchor="middle"
              fill="#1967D2"
              fontSize="11"
              fontWeight="700"
              letterSpacing="1.2"
              opacity="0.85"
            >
              LUỒNG HÀNG HẢI CÁI MÉP – CÁT LÁI (FAIRWAY &amp; TOWAGE CHANNEL)
            </text>

            <ellipse
              cx="245"
              cy="155"
              rx="130"
              ry="48"
              fill="#8AB4F8"
              fillOpacity="0.24"
              stroke="#5F97F6"
              strokeWidth="1.2"
              strokeDasharray="6 6"
            />
            <ellipse
              cx="1355"
              cy="145"
              rx="150"
              ry="52"
              fill="#8AB4F8"
              fillOpacity="0.24"
              stroke="#5F97F6"
              strokeWidth="1.2"
              strokeDasharray="6 6"
            />

            {/* 2. EXPANSIVE PORT LANDMASS WITH INDENTED SLIPWAY */}
            <path
              d="M 0 310 L 85 310 L 95 290 L 475 290 L 485 340 L 565 340 L 575 290 L 1515 290 L 1530 310 L 1600 310 L 1600 920 L 0 920 Z"
              fill="#F8F9FA"
              stroke="#9AA0A6"
              strokeWidth="2.2"
            />

            {/* Ecological Green Park Buffers */}
            <rect
              x="16"
              y="335"
              width="62"
              height="520"
              rx="12"
              fill="#CEEAD6"
            />
            <rect
              x="95"
              y="842"
              width="1425"
              height="50"
              rx="10"
              fill="#CEEAD6"
            />
            <text
              x="800"
              y="871"
              textAnchor="middle"
              fill="#137333"
              fontSize="10.5"
              fontWeight="700"
            >
              Vành Đai Xanh Cảng &amp; Điện Mặt Trời Áp Mái (Solar PV 3.2 MWp · Trạm Biến Áp 110/22kV)
            </text>

            {/* 3. THREE SEPARATED QUAY BERTH APRONS (B1, B2, B3) */}
            <rect
              x="95"
              y="292"
              width="380"
              height="95"
              rx="4"
              fill="#E8EAED"
              stroke="#DADCE0"
              strokeWidth="1.5"
            />
            <text
              x="285"
              y="308"
              textAnchor="middle"
              fill="#5F6368"
              fontSize="9.5"
              fontWeight="800"
            >
              CẦU BẾN B1 — BẾN FEEDER TÂY (500m)
            </text>

            <rect
              x="575"
              y="292"
              width="450"
              height="95"
              rx="4"
              fill="#E8EAED"
              stroke="#DADCE0"
              strokeWidth="1.5"
            />
            <text
              x="800"
              y="308"
              textAnchor="middle"
              fill="#5F6368"
              fontSize="9.5"
              fontWeight="800"
            >
              CẦU BẾN B2 — BẾN CONTAINER TRUNG TÂM (750m · OPS 6.6kV)
            </text>

            <rect
              x="1034"
              y="298"
              width="78"
              height="85"
              rx="6"
              fill="#E8F0FE"
              stroke="#93C5FD"
              strokeWidth="1.5"
            />

            <rect
              x="1120"
              y="292"
              width="395"
              height="95"
              rx="4"
              fill="#E8EAED"
              stroke="#DADCE0"
              strokeWidth="1.5"
            />
            <text
              x="1318"
              y="308"
              textAnchor="middle"
              fill="#5F6368"
              fontSize="9.5"
              fontWeight="800"
            >
              CẦU BẾN B3 — BẾN NƯỚC SÂU ĐÔNG (900m)
            </text>

            {/* Quay Crane Gantry Rails */}
            {[
              [105, 465],
              [585, 1015],
              [1130, 1505],
            ].map(([x1, x2], idx) => (
              <g key={idx}>
                <line
                  x1={x1}
                  y1="315"
                  x2={x2}
                  y2="315"
                  stroke="#9AA0A6"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />
                <line
                  x1={x1}
                  y1="338"
                  x2={x2}
                  y2="338"
                  stroke="#9AA0A6"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />
              </g>
            ))}

            {/* 4. GOOGLE MAPS WHITE MULTI-LANE PORT ROAD NETWORK */}
            <g
              stroke="#DADCE0"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <line x1="95" y1="420" x2="1515" y2="420" />
              <line x1="95" y1="615" x2="1515" y2="615" />
              <line x1="95" y1="805" x2="1515" y2="805" />
              <line x1="105" y1="365" x2="105" y2="805" />
              <line x1="475" y1="365" x2="475" y2="805" />
              <line x1="530" y1="365" x2="530" y2="805" />
              <line x1="1070" y1="365" x2="1070" y2="805" />
              <line x1="1510" y1="365" x2="1510" y2="805" />
              <line x1="295" y1="355" x2="295" y2="750" />
              <line x1="710" y1="355" x2="710" y2="540" />
              <line x1="890" y1="355" x2="890" y2="615" />
              <line x1="910" y1="520" x2="910" y2="615" />
              <line x1="530" y1="520" x2="910" y2="520" />
              <line x1="530" y1="725" x2="1070" y2="725" />
              <line x1="1315" y1="355" x2="1315" y2="750" />
              <line x1="1070" y1="525" x2="1315" y2="525" />
              <line x1="1070" y1="735" x2="1510" y2="735" />
              <line x1="105" y1="525" x2="295" y2="525" />
              <line x1="105" y1="735" x2="475" y2="735" />
            </g>

            <g
              stroke="#FFFFFF"
              strokeWidth="25"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <line x1="95" y1="420" x2="1515" y2="420" />
              <line x1="95" y1="615" x2="1515" y2="615" />
              <line x1="95" y1="805" x2="1515" y2="805" />
              <line x1="105" y1="365" x2="105" y2="805" />
              <line x1="475" y1="365" x2="475" y2="805" />
              <line x1="530" y1="365" x2="530" y2="805" />
              <line x1="1070" y1="365" x2="1070" y2="805" />
              <line x1="1510" y1="365" x2="1510" y2="805" />
              <line x1="295" y1="355" x2="295" y2="750" />
              <line x1="710" y1="355" x2="710" y2="540" />
              <line x1="890" y1="355" x2="890" y2="615" />
              <line x1="910" y1="520" x2="910" y2="615" />
              <line x1="530" y1="520" x2="910" y2="520" />
              <line x1="530" y1="725" x2="1070" y2="725" />
              <line x1="1315" y1="355" x2="1315" y2="750" />
              <line x1="1070" y1="525" x2="1315" y2="525" />
              <line x1="1070" y1="735" x2="1510" y2="735" />
              <line x1="105" y1="525" x2="295" y2="525" />
              <line x1="105" y1="735" x2="475" y2="735" />
            </g>

            {/* Minimal Road Labels */}
            <text x="285" y="423" textAnchor="middle" fill="#5F6368" fontSize="9.5" fontWeight="700">
              Đường Cầu Tàu B1
            </text>
            <text x="800" y="423" textAnchor="middle" fill="#5F6368" fontSize="9.5" fontWeight="700">
              Đường Cầu Tàu Bắc B2
            </text>
            <text x="1318" y="423" textAnchor="middle" fill="#5F6368" fontSize="9.5" fontWeight="700">
              Đường Cầu Tàu B3
            </text>
            <text x="710" y="618" textAnchor="middle" fill="#5F6368" fontSize="9.5" fontWeight="700">
              Đại Lộ Container Trung Tâm
            </text>
            <text x="800" y="808" textAnchor="middle" fill="#5F6368" fontSize="9.5" fontWeight="700">
              Đường Vành Đai Cổng Nam
            </text>

            {/* 5. TERMINAL GEOFENCE ZONES */}
            {TERMINAL_STRATEGY_ZONES.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const isHovered = hoveredZoneId === zone.id;
              return (
                <g
                  key={zone.id}
                  onMouseEnter={() => setHoveredZoneId(zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragStartRef.current?.moved) return;
                    onSelectWaypoint(null);
                    if (!isSelected) {
                      onToggleLeftListCollapsed(true);
                    }
                    onSelectZone(isSelected ? null : zone);
                  }}
                  className="cursor-pointer"
                >
                  <polygon
                    points={zone.polygonPoints}
                    fill={zone.accentColor}
                    fillOpacity={isSelected ? 0.12 : isHovered ? 0.06 : 0.015}
                    stroke={zone.accentColor}
                    strokeWidth={isSelected ? "2.4" : isHovered ? "1.6" : "0.9"}
                    strokeDasharray={isSelected ? "0" : "6 5"}
                    strokeOpacity={isSelected || isHovered ? 0.85 : 0.35}
                  />
                </g>
              );
            })}

            {/* 6. SEPARATED CONTAINER YARD BLOCKS + ANIMATED e-RTG GANTRIES (Tailored shape per zone) */}
            {TERMINAL_3D_ENTITIES.filter((e) => e.category === "BAYS").map(
              (bay) => {
                const live = liveStates[bay.id];
                if (!live) return null;
                const isSelected = selectedEntityId === bay.id;
                const isReefer = bay.id === "BAY-R1";
                const accent = isReefer
                  ? "#059669"
                  : bay.id === "BAY-A1"
                  ? "#4F46E5"
                  : bay.id === "BAY-C1"
                  ? "#0284C7"
                  : "#1A73E8";

                // Tailored dimensions so Bay B2 (North) and Bay C1 (South) sit cleanly inside their zone blocks
                const lotWidth =
                  bay.id === "BAY-B2"
                    ? 248
                    : bay.id === "BAY-C1"
                    ? 268
                    : bay.id === "BAY-A1"
                    ? 264
                    : 256;
                const lotHeight = 96;

                return (
                  <g
                    key={bay.id}
                    transform={`translate(${live.x}, ${live.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragStartRef.current?.moved) return;
                      onSelectWaypoint(null);
                      onToggleLeftListCollapsed(true);
                      onSelectEntity(bay);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Yard Block Concrete Pad */}
                    <rect
                      x={-lotWidth / 2}
                      y={-lotHeight / 2}
                      width={lotWidth}
                      height={lotHeight}
                      rx="8"
                      fill="#E8EAED"
                      stroke={isSelected ? accent : "#CBD5E1"}
                      strokeWidth={isSelected ? "2.8" : "1.6"}
                    />

                    {/* Top & Bottom e-RTG Runway Beams */}
                    <line
                      x1={-lotWidth / 2 + 8}
                      y1={-lotHeight / 2 + 5}
                      x2={lotWidth / 2 - 8}
                      y2={-lotHeight / 2 + 5}
                      stroke={accent}
                      strokeOpacity="0.4"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <line
                      x1={-lotWidth / 2 + 8}
                      y1={lotHeight / 2 - 5}
                      x2={lotWidth / 2 - 8}
                      y2={lotHeight / 2 - 5}
                      stroke={accent}
                      strokeOpacity="0.4"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />

                    {/* Container Stacking Slots Inside Block */}
                    {[-98, -46, 6, 58]
                      .filter(
                        (rx) =>
                          rx + 40 <= lotWidth / 2 - 8 &&
                          rx >= -lotWidth / 2 + 8
                      )
                      .map((rx, rIdx) =>
                        [-34, -9, 16].map((ry, cIdx) => (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={rx}
                            y={ry}
                            width="42"
                            height="18"
                            rx="2.5"
                            fill={accent}
                            fillOpacity={0.16 + ((rIdx + cIdx) % 3) * 0.08}
                            stroke={accent}
                            strokeOpacity="0.45"
                            strokeWidth="0.9"
                          />
                        ))
                      )}

                    {/* LIVE ANIMATED e-RTG GANTRY CRANE BRIDGE INSIDE THE BAY */}
                    <g transform={`translate(${live.auxOffset}, 0)`}>
                      <rect
                        x="-9"
                        y={-lotHeight / 2 - 3}
                        width="18"
                        height={lotHeight + 6}
                        rx="3.5"
                        fill={accent}
                        fillOpacity="0.22"
                        stroke={accent}
                        strokeWidth="1.8"
                      />
                      <line
                        x1="0"
                        y1={-lotHeight / 2 - 3}
                        x2="0"
                        y2={lotHeight / 2 + 3}
                        stroke={accent}
                        strokeWidth="2.2"
                      />
                      <rect
                        x="-6"
                        y="-9"
                        width="12"
                        height="18"
                        rx="2"
                        fill={live.isDwelling ? "#EA580C" : accent}
                        stroke="#FFFFFF"
                        strokeWidth="1.4"
                      />
                    </g>

                    {/* Clean Minimal Bay Pill */}
                    <g transform="translate(0, 0)">
                      <rect
                        x="-74"
                        y="-14"
                        width="148"
                        height="28"
                        rx="14"
                        fill="#FFFFFF"
                        stroke={isSelected ? accent : "#DADCE0"}
                        strokeWidth={isSelected ? "2.2" : "1.3"}
                      />
                      <circle cx="-55" cy="0" r="10" fill={accent} />
                      <rect
                        x="-60"
                        y="-3.5"
                        width="10"
                        height="7"
                        rx="1.5"
                        fill="#FFFFFF"
                      />
                      <text
                        x="10"
                        y="3.5"
                        textAnchor="middle"
                        fill="#202124"
                        fontSize="9.5"
                        fontWeight="800"
                      >
                        {bay.code} · {bay.progressPercent}%
                      </text>
                    </g>

                    {/* Floating Activity Explanation ONLY when this Bay is clicked */}
                    {isSelected && (
                      <g transform="translate(0, -66)">
                        <rect
                          x="-120"
                          y="-14"
                          width="240"
                          height="24"
                          rx="12"
                          fill="#0F172A"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="1.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="700"
                        >
                          {live.destinationLabel} · {live.liveMetric}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }
            )}

            {/* 7. MINIMAL PORT LANDMARK POIS (Single-line compact pills, no clutter) */}
            {PORT_DESTINATION_POIS.map((poi) => (
              <g key={poi.id} transform={`translate(${poi.x}, ${poi.y})`}>
                <rect
                  x="-66"
                  y="-10"
                  width="132"
                  height="20"
                  rx="10"
                  fill="#FFFFFF"
                  fillOpacity="0.92"
                  stroke={poi.color}
                  strokeWidth="1.2"
                />
                <circle cx="-54" cy="0" r="5" fill={poi.color} />
                <text
                  x="6"
                  y="3"
                  textAnchor="middle"
                  fill="#202124"
                  fontSize="8"
                  fontWeight="700"
                >
                  {poi.label}
                </text>
              </g>
            ))}

            {/* 8. TOWAGE TUGBOATS IN CHANNEL (Clean minimal tug markers) */}
            {liveTugboats.map((tug) => {
              const isParentSelected = selectedEntityId === tug.linkedVesselId;
              return (
                <g
                  key={tug.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = TERMINAL_3D_ENTITIES.find(
                      (e) => e.id === tug.linkedVesselId
                    );
                    if (v) {
                      onToggleLeftListCollapsed(true);
                      onSelectEntity(v);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <line
                    x1={tug.x}
                    y1={tug.y}
                    x2={tug.targetX}
                    y2={tug.targetY}
                    stroke="#1967D2"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                  />
                  <g transform={`translate(${tug.x}, ${tug.y})`}>
                    <rect
                      x="-20"
                      y="-9"
                      width="40"
                      height="18"
                      rx="9"
                      fill="#1967D2"
                      stroke="#FFFFFF"
                      strokeWidth="1.6"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="7.5"
                      fontWeight="800"
                    >
                      {tug.id}
                    </text>
                    {isParentSelected && (
                      <text
                        x="0"
                        y="-13"
                        textAnchor="middle"
                        fill="#174EA6"
                        fontSize="8"
                        fontWeight="700"
                      >
                        {tug.label}
                      </text>
                    )}
                  </g>
                </g>
              );
            })}

            {/* 9. VESSELS (Clean Vessel Pill; Activity callout ONLY when clicked!) */}
            {TERMINAL_3D_ENTITIES.filter((e) => e.category === "VESSELS").map(
              (vessel) => {
                const live = liveStates[vessel.id];
                if (!live) return null;
                const isSelected = selectedEntityId === vessel.id;
                const hullClr =
                  vessel.id === "VSL-01"
                    ? "#004B91"
                    : vessel.id === "VSL-02"
                    ? "#1A73E8"
                    : "#0D9488";

                return (
                  <g
                    key={vessel.id}
                    transform={`translate(${live.x}, ${live.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragStartRef.current?.moved) return;
                      onSelectWaypoint(null);
                      onToggleLeftListCollapsed(true);
                      onSelectEntity(vessel);
                    }}
                    className="cursor-pointer"
                  >
                    {live.y >= 255 && (
                      <path
                        d="M 85 18 Q 115 35 135 50"
                        fill="none"
                        stroke="#16A34A"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                      />
                    )}

                    {isSelected && (
                      <rect
                        x="-148"
                        y="-34"
                        width="296"
                        height="68"
                        rx="34"
                        fill={hullClr}
                        fillOpacity="0.18"
                        stroke={hullClr}
                        strokeWidth="2.4"
                      />
                    )}

                    <polygon
                      points="-132,-22 108,-22 138,0 108,22 -132,22 -142,0"
                      fill={hullClr}
                      stroke="#FFFFFF"
                      strokeWidth="2.4"
                    />

                    {[-95, -52, -9, 34, 72].map((hx, hIdx) => (
                      <rect
                        key={hIdx}
                        x={hx}
                        y="-14"
                        width="32"
                        height="28"
                        rx="3"
                        fill="#FFFFFF"
                        fillOpacity={
                          Math.abs((live.auxOffset ?? 0) - hx) < 35
                            ? "0.35"
                            : "0.15"
                        }
                      />
                    ))}

                    {/* Clean Minimal Vessel Name Pill */}
                    <rect
                      x="-86"
                      y="-11"
                      width="172"
                      height="22"
                      rx="11"
                      fill="#FFFFFF"
                      stroke={hullClr}
                      strokeWidth="1.4"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#202124"
                      fontSize="9.5"
                      fontWeight="800"
                    >
                      {vessel.name.replace("MV ", "")}
                    </text>

                    {/* Floating Activity Explanation ONLY when this Vessel is clicked */}
                    {isSelected && (
                      <g transform="translate(0, -42)">
                        <rect
                          x="-125"
                          y="-13"
                          width="250"
                          height="24"
                          rx="12"
                          fill="#0F172A"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="700"
                        >
                          {live.destinationLabel} · {live.liveMetric}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }
            )}

            {/* 10. STS QUAY CRANES (Clean Circular Marker; Activity Pill ONLY when clicked!) */}
            {TERMINAL_3D_ENTITIES.filter((e) => e.category === "CRANES").map(
              (crane) => {
                const live = liveStates[crane.id];
                if (!live) return null;
                const isSelected = selectedEntityId === crane.id;

                return (
                  <g
                    key={crane.id}
                    transform={`translate(${live.x}, ${live.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragStartRef.current?.moved) return;
                      onSelectWaypoint(null);
                      onToggleLeftListCollapsed(true);
                      onSelectEntity(crane);
                    }}
                    className="cursor-pointer"
                  >
                    <line
                      x1="0"
                      y1="-58"
                      x2="0"
                      y2="56"
                      stroke="#0284C7"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />

                    <g transform={`translate(0, ${live.auxOffset})`}>
                      <rect
                        x="-12"
                        y="-7"
                        width="24"
                        height="14"
                        rx="3"
                        fill={live.isDwelling ? "#EA580C" : "#0284C7"}
                        stroke="#FFFFFF"
                        strokeWidth="1.6"
                      />
                    </g>

                    <circle
                      r="17"
                      fill={isSelected ? "#004B91" : "#0284C7"}
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="800"
                    >
                      {crane.id}
                    </text>

                    {/* Floating Activity Explanation ONLY when this Crane is clicked */}
                    {isSelected && (
                      <g transform="translate(0, -72)">
                        <rect
                          x="-115"
                          y="-13"
                          width="230"
                          height="24"
                          rx="12"
                          fill="#0F172A"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="700"
                        >
                          {live.destinationLabel} · {live.liveMetric}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }
            )}

            {/* 11. YARD TRUCKS (Clean Pill Marker; Activity Callout ONLY when clicked!) */}
            {TERMINAL_3D_ENTITIES.filter((e) => e.category === "TRUCKS").map(
              (truck) => {
                const live = liveStates[truck.id];
                if (!live) return null;
                const isSelected = selectedEntityId === truck.id;

                return (
                  <g
                    key={truck.id}
                    transform={`translate(${live.x}, ${live.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragStartRef.current?.moved) return;
                      onSelectWaypoint(null);
                      onToggleLeftListCollapsed(true);
                      onSelectEntity(truck);
                    }}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        r="26"
                        fill="#004B91"
                        fillOpacity="0.16"
                        stroke="#004B91"
                        strokeWidth="1.8"
                      />
                    )}

                    <rect
                      x="-30"
                      y="-12"
                      width="60"
                      height="24"
                      rx="12"
                      fill={isSelected ? "#004B91" : "#EA580C"}
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="800"
                    >
                      {truck.id}
                    </text>

                    {/* Floating Activity Explanation ONLY when this Truck is clicked */}
                    {isSelected && (
                      <g transform="translate(0, -28)">
                        <rect
                          x="-115"
                          y="-13"
                          width="230"
                          height="23"
                          rx="11.5"
                          fill="#0F172A"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="1.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8.2"
                          fontWeight="700"
                        >
                          {live.destinationLabel} · {live.liveMetric}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }
            )}

            {/* 12. GOOGLE MAPS TIMELINE ("DÒNG THỜI GIAN") TRAJECTORY & PINS */}
            {activeEntityWaypoints.length > 1 && (
              <g>
                <polyline
                  points={activeEntityWaypoints
                    .map((wp) => `${wp.mapX},${wp.mapY}`)
                    .join(" ")}
                  fill="none"
                  stroke="#1A73E8"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={activeEntityWaypoints
                    .map((wp) => `${wp.mapX},${wp.mapY}`)
                    .join(" ")}
                  fill="none"
                  stroke="#E8F0FE"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />

                {activeEntityWaypoints.map((wp) => {
                  const isFocused = focusedWaypoint?.id === wp.id;
                  const isLiveWindow =
                    wp.activeWindowSec &&
                    loopSec >= wp.activeWindowSec[0] &&
                    loopSec < wp.activeWindowSec[1];

                  const pinColor =
                    isFocused || isLiveWindow
                      ? "#004B91"
                      : wp.state === "COMPLETED"
                      ? "#1A73E8"
                      : "#64748B";

                  return (
                    <g
                      key={wp.id}
                      transform={`translate(${wp.mapX}, ${wp.mapY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLeftListCollapsed(true);
                        onSelectWaypoint(wp);
                      }}
                      className="cursor-pointer"
                    >
                      {(isFocused || isLiveWindow) && (
                        <circle
                          r="24"
                          fill="#1A73E8"
                          fillOpacity="0.22"
                          stroke="#1A73E8"
                          strokeWidth="2"
                        />
                      )}
                      <circle
                        r={isFocused ? "14" : "11"}
                        fill={pinColor}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="900"
                      >
                        {wp.stepNumber}
                      </text>

                      {isFocused && (
                        <g transform="translate(0, -32)">
                          <rect
                            x="-115"
                            y="-26"
                            width="230"
                            height="32"
                            rx="9"
                            fill="#0F172A"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                          />
                          <text
                            x="0"
                            y="-12"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="8.5"
                            fontWeight="800"
                          >
                            {wp.title}
                          </text>
                          <text
                            x="0"
                            y="-2"
                            textAnchor="middle"
                            fill="#93C5FD"
                            fontSize="7.8"
                            fontWeight="600"
                          >
                            {wp.metricBadge}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {/* 3. GOOGLE MAPS DAYTIME WHITE ZOOM CONTROLS */}
        <div className="absolute bottom-4 right-3 z-20 flex flex-col items-center bg-white rounded-xl shadow-md border border-slate-200/90 overflow-hidden divide-y divide-slate-200">
          <button
            type="button"
            onClick={handleResetMap}
            title="Reset Map View"
            className="w-9 h-9 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Crosshair className="w-4 h-4 text-[#004B91]" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomStep(0.3)}
            title="Zoom In"
            className="w-9 h-9 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomStep(-0.3)}
            title="Zoom Out"
            className="w-9 h-9 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
