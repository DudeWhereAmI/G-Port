export type TerminalEntityCategory = "VESSELS" | "CRANES" | "TRUCKS" | "BAYS";

export interface VesselLifecycleStep {
  label: string;
  time: string;
  state: "COMPLETED" | "ACTIVE" | "UPCOMING";
  detail: string;
}

export interface TelemetryTimeSeriesPoint {
  time: string;
  primaryVal: number; // e.g. Power kW or Fuel L/h
  secondaryVal: number; // e.g. Voltage kV, Temp °C, or Speed km/h
  tertiaryVal: number; // e.g. Current A, Plugs count, or Efficiency
  statusNote: string;
}

export interface EportContainerRecord {
  containerNo: string;
  sizeType: string;
  baySlot: string;
  isReefer: boolean;
  tempSetC: string;
  status: "PLUGGED_IN" | "STACKED_YARD" | "LOADING_VESSEL" | "IN_TRANSIT";
  bookingNo: string;
  commodity: string;
  vesselVoyage: string;
  weightKg: number;
}

export interface HistoricalEfficiencyRow {
  voyageOrShift: string;
  date: string;
  totalEnergyOrFuel: string;
  teuHandled: number;
  intensityMetric: string;
  co2Scope1Kg: number;
  co2Scope2Kg: number;
  verifiedHash: string;
}

export interface SubSystemFeederReport {
  feederCode: string;
  feederName: string;
  protocol: string;
  meterId: string; // Links directly to MeterTelemetryModal!
  voltageKv: string;
  currentAmps: number;
  activePowerKw: number;
  reactivePowerKvar: number;
  powerFactor: number;
  frequencyHz: number;
  totalCumulativeEnergy: string;
  carbonScope1Kg: number;
  carbonScope2Kg: number;
  intensityPerTeu: string;
}

export interface Terminal3DEntity {
  id: string;
  category: TerminalEntityCategory;
  code: string;
  name: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "BLUE" | "GREEN" | "AMBER" | "SLATE";
  statusSubtext: string;
  progressPercent: number;
  distanceOrRemainingText: string;
  linkedVesselId: string;
  linkedVesselName: string;
  useCaseId: "UC-01" | "UC-02" | "UC-03" | "UC-04";
  meterModalId: string; // ID to pass to MeterTelemetryModal
  berthName: string;
  bayAssignment: string;
  speedOrRate: string;
  cargoSummary: string;
  // 3D world coordinates for camera focus & pin placement
  position3D: [number, number, number];
  cameraOffset: [number, number, number];
  // Concise Level-1 Inspector rows (shown ONLY on the Top-Right floating card)
  inspectorRows: { label: string; value: string; highlight?: boolean }[];
  // Level-2 Progressive Breakdown Report (distinct from inspectorRows — no repetition!)
  drillDownTitle: string;
  drillDownSubtitle: string;
  chartTitle: string;
  chartPrimaryLabel: string;
  chartPrimaryUnit: string;
  chartSecondaryLabel: string;
  chartSecondaryUnit: string;
  feederReport: SubSystemFeederReport;
  telemetrySeries: TelemetryTimeSeriesPoint[];
  containersManifest: EportContainerRecord[];
  historicalReports: HistoricalEfficiencyRow[];
}

export const VESSEL_LIFECYCLE_BY_ID: Record<
  string,
  {
    vesselId: string;
    useCaseId: "UC-01" | "UC-02" | "UC-03" | "UC-04";
    invoiceNumber: string;
    vesselName: string;
    imoNumber: string;
    operator: string;
    berth: string;
    statusBadge: string;
    etaText: string;
    opsPowerKw: number;
    opsCumulativeKwh: number;
    stsCumulativeKwh: number;
    reeferCumulativeKwh: number;
    tractorFuelLiters: number;
    tugboatFuelLiters: number;
    scope1Co2Kg: number;
    scope2Co2Kg: number;
    co2SavedByOpsKg: number;
    emissionPerTeuKg: number;
    auditHash: string;
    steps: VesselLifecycleStep[];
  }
> = {
  "VSL-01": {
    vesselId: "VSL-01",
    useCaseId: "UC-01",
    invoiceNumber: "GPORT-INV-2026-0901",
    vesselName: "MV SPIRIT OF MUMBAI",
    imoNumber: "9845210",
    operator: "ONE / Tan Cang Shipping · Voyage 056N",
    berth: "Cat Lai Terminal — Berth B2 (OPS Ready)",
    statusBadge: "Unloading & Loading",
    etaText: "1,940 / 2,850 TEU (68%) · ETD 18:00",
    opsPowerKw: 540,
    opsCumulativeKwh: 18200,
    stsCumulativeKwh: 22800,
    reeferCumulativeKwh: 12400,
    tractorFuelLiters: 2400,
    tugboatFuelLiters: 1800,
    scope1Co2Kg: 11256,
    scope2Co2Kg: 38560,
    co2SavedByOpsKg: 28400,
    emissionPerTeuKg: 17.48,
    auditHash: "3f98c21a44e59079845210056n81b67f1239aa80092c4b57",
    steps: [
      {
        label: "Vessel Arrived",
        time: "06:30",
        state: "COMPLETED",
        detail: "Pilot boarded at Vung Tau buoy; Tug Tan Cang 01 attached (920 L MGO metered)"
      },
      {
        label: "Berthed & Shore Power",
        time: "07:15",
        state: "COMPLETED",
        detail: "Mooring locked at Berth B2; 6.6kV OPS Shore Power synchronized (18,200 kWh)"
      },
      {
        label: "Quay Crane Operations",
        time: "07:30 – Now",
        state: "ACTIVE",
        detail: "Cranes STS-01..03 operating on 22kV Feeder F-01 (2,480 kW active hoist load)"
      },
      {
        label: "Container Bay Stacking",
        time: "In Progress",
        state: "ACTIVE",
        detail: "Yard trucks shuttling 240 VinaSeafood Reefers (-22°C) to Bay R1 & dry cargo to Bay A1/B2"
      },
      {
        label: "Vessel Departure",
        time: "ETA 18:00",
        state: "UPCOMING",
        detail: "Tugboat cast-off scheduled at 17:45; DCSA Carbon Invoice #0901 ready"
      }
    ]
  },
  "VSL-02": {
    vesselId: "VSL-02",
    useCaseId: "UC-02",
    invoiceNumber: "GPORT-INV-2026-0902",
    vesselName: "MV ONE APUS",
    imoNumber: "9806079",
    operator: "Ocean Network Express (ONE) · Voyage 012W",
    berth: "Berth B3 (Deep-Sea Quay)",
    statusBadge: "Arriving to Berth",
    etaText: "180m to Berth B3 · ETA 8 min",
    opsPowerKw: 840,
    opsCumulativeKwh: 24500,
    stsCumulativeKwh: 29000,
    reeferCumulativeKwh: 16800,
    tractorFuelLiters: 2900,
    tugboatFuelLiters: 2100,
    scope1Co2Kg: 13400,
    scope2Co2Kg: 50763,
    co2SavedByOpsKg: 38200,
    emissionPerTeuKg: 18.87,
    auditHash: "e7c10b55694a1239806079012w11b439c09887711d99ef87c",
    steps: [
      {
        label: "Vessel Arrived",
        time: "13:30",
        state: "COMPLETED",
        detail: "Cleared deep-water channel approach with Escort Tug #02 (Coriolis flowmeter active)"
      },
      {
        label: "Berthing at Quay B3",
        time: "13:50 (Active)",
        state: "ACTIVE",
        detail: "Final approach to Berth B3 fenders at 2.4 knots; Dual-Bus 22kV/6.6kV OPS pit ready"
      },
      {
        label: "Quay Crane Operations",
        time: "Starts 14:15",
        state: "UPCOMING",
        detail: "Super Post-Panamax Cranes staged; 1.5MW Crane Regen & Smart Demand Control active"
      },
      {
        label: "Container Bay Stacking",
        time: "Starts 14:20",
        state: "UPCOMING",
        detail: "290 EU-bound electronics containers pre-staged in Bay C1 & Reefer R1"
      },
      {
        label: "Vessel Departure",
        time: "ETA 08:00 (+1)",
        state: "UPCOMING",
        detail: "Scheduled after 3,400 TEU exchange for Rotterdam gateway"
      }
    ]
  },
  "VSL-03": {
    vesselId: "VSL-03",
    useCaseId: "UC-04",
    invoiceNumber: "GPORT-INV-2026-0904",
    vesselName: "MV TAN CANG GLORY",
    imoNumber: "9632480",
    operator: "Tan Cang Shipping / SNP · Voyage 104S",
    berth: "Berth B1 (West Feeder Quay)",
    statusBadge: "Departing Berth",
    etaText: "1,200 / 1,200 TEU (100%) · Unberthing",
    opsPowerKw: 0,
    opsCumulativeKwh: 6400,
    stsCumulativeKwh: 8400,
    reeferCumulativeKwh: 3600,
    tractorFuelLiters: 1100,
    tugboatFuelLiters: 950,
    scope1Co2Kg: 5494,
    scope2Co2Kg: 13287,
    co2SavedByOpsKg: 14200,
    emissionPerTeuKg: 15.65,
    auditHash: "8a4f91b7e651c24df9632480104s91a27e4e11c8b32d4b94f06",
    steps: [
      {
        label: "Vessel Arrived",
        time: "10:00 (-1d)",
        state: "COMPLETED",
        detail: "Arrived from Hai Phong TC-HICT on Green Coastal Corridor"
      },
      {
        label: "Berthed & Shore Power",
        time: "10:30 (-1d)",
        state: "COMPLETED",
        detail: "Connected to Berth B1 6.6kV Feeder OPS (6,400 kWh consumed)"
      },
      {
        label: "Quay Crane Operations",
        time: "Completed",
        state: "COMPLETED",
        detail: "All 1,200 TEU discharged & loaded during off-peak TOU window (8,400 kWh)"
      },
      {
        label: "Container Bay Stacking",
        time: "Completed",
        state: "COMPLETED",
        detail: "Inbound agricultural containers stacked in Bay A1 (Rows E–F)"
      },
      {
        label: "Vessel Departure",
        time: "Now (Active)",
        state: "ACTIVE",
        detail: "Shore power disconnected; departing Berth B1 for Jurong Port Singapore"
      }
    ]
  }
};

export const TERMINAL_3D_ENTITIES: Terminal3DEntity[] = [
  // =========================================================================
  // 1. VESSELS (3 Ships: Berthed/Working, Arriving, Departing)
  // =========================================================================
  {
    id: "VSL-01",
    category: "VESSELS",
    code: "MV SPIRIT OF MUMBAI",
    name: "MV SPIRIT OF MUMBAI",
    subtitle: "ONE / Tan Cang · Berth B2 · Voy 056N",
    statusLabel: "Working at Berth",
    statusTone: "GREEN",
    statusSubtext: "At Berth B2 · OPS 540 kW Active",
    progressPercent: 68,
    distanceOrRemainingText: "910 TEU left",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-OPS-CATLAI-B2",
    berthName: "Berth B2 (Central Quay)",
    bayAssignment: "Bay A1, Bay B2 & Reefer R1",
    speedOrRate: "90 moves/hr (3 STS)",
    cargoSummary: "1,940 / 2,850 TEU handled",
    position3D: [0, 2.2, 23.5],
    cameraOffset: [22, 24, 52],
    inspectorRows: [
      { label: "Voyage & IMO", value: "056N · IMO 9845210", highlight: true },
      { label: "Terminal Berth", value: "Cat Lai Berth B2 (OPS Ready)" },
      { label: "Active Quay Cranes", value: "STS-01, STS-02, STS-03 (90 lifts/h)" },
      { label: "OPS Shore Power", value: "540 kW · 6.6 kV / 50 Hz", highlight: true },
      { label: "Target Yard Bays", value: "Bay A1, Bay B2, Reefer R1" },
      { label: "TEU Progress", value: "1,940 / 2,850 TEU (68%)" }
    ],
    drillDownTitle: "MV SPIRIT OF MUMBAI (056N) — Shore Power & Port Call Telemetry Report",
    drillDownSubtitle: "IEC 61850 6.6kV Onshore Power Supply (OPS) sub-metering, tugboat bunker telemetry, and GLEC carbon audit",
    chartTitle: "6.6kV Shore Power (OPS) Active Load (kW) & Bus Voltage (kV) Across Hoteling Window",
    chartPrimaryLabel: "OPS Active Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Bus Voltage",
    chartSecondaryUnit: "kV",
    feederReport: {
      feederCode: "F-04 / MTR-OPS-B2",
      feederName: "Feeder OPS Shore Power 6.6kV Berth B2",
      protocol: "IEC 61850 MMS & Modbus TCP",
      meterId: "MTR-OPS-CATLAI-B2",
      voltageKv: "6.60 kV",
      currentAmps: 47.3,
      activePowerKw: 540,
      reactivePowerKvar: 95,
      powerFactor: 0.95,
      frequencyHz: 50.0,
      totalCumulativeEnergy: "53,400 kWh (OPS 18.2k + STS 22.8k + Reefer 12.4k)",
      carbonScope1Kg: 11256,
      carbonScope2Kg: 38560,
      intensityPerTeu: "17.48 kgCO₂e / TEU (-28.4t CO₂ saved by OPS)"
    },
    telemetrySeries: [
      { time: "07:15", primaryVal: 120, secondaryVal: 6.6, tertiaryVal: 10.5, statusNote: "OPS cable reel synchronized at Berth B2" },
      { time: "08:00", primaryVal: 380, secondaryVal: 6.61, tertiaryVal: 33.2, statusNote: "Ship diesel generators shut down (Zero aux burn)" },
      { time: "10:00", primaryVal: 540, secondaryVal: 6.59, tertiaryVal: 47.3, statusNote: "Steady hoteling + 240 reefer deck blowers" },
      { time: "12:00", primaryVal: 520, secondaryVal: 6.6, tertiaryVal: 45.5, statusNote: "Solar PV offsetting 38% of berth demand" },
      { time: "14:00", primaryVal: 580, secondaryVal: 6.58, tertiaryVal: 50.8, statusNote: "Peak afternoon hoteling & HVAC load" },
      { time: "16:00", primaryVal: 530, secondaryVal: 6.6, tertiaryVal: 46.4, statusNote: "Steady hoteling load at Berth B2" }
    ],
    containersManifest: [
      { containerNo: "TCLU9821041", sizeType: "40HC", baySlot: "Bay R1 · Slot R1-04", isReefer: true, tempSetC: "-22.0°C", status: "PLUGGED_IN", bookingNo: "BKG-VINASEAFOOD-01", commodity: "Frozen Black Tiger Shrimp (HS 030389)", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 26400 },
      { containerNo: "VNLU5520188", sizeType: "40HC", baySlot: "Bay R1 · Slot R1-12", isReefer: true, tempSetC: "-25.0°C", status: "PLUGGED_IN", bookingNo: "BKG-TUNA-EXP05", commodity: "Ocean Yellowfin Tuna Loin", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 27100 },
      { containerNo: "MSCU8921040", sizeType: "40HC", baySlot: "Bay B2 · Slot B2-14", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-882", commodity: "Apparel & Footwear Export", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 24800 },
      { containerNo: "CMAU4920182", sizeType: "40HC", baySlot: "Bay A1 · Slot A1-08", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-CATLAI-419", commodity: "Electronic Packaging Components", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 21400 }
    ],
    historicalReports: [
      { voyageOrShift: "Voyage 056N (Current)", date: "28/09/2026", totalEnergyOrFuel: "53,400 kWh + 4,200 L", teuHandled: 2850, intensityMetric: "17.48 kgCO₂e/TEU", co2Scope1Kg: 11256, co2Scope2Kg: 38560, verifiedHash: "3f98c21a...4b57" },
      { voyageOrShift: "Voyage 055N", date: "14/09/2026", totalEnergyOrFuel: "51,950 kWh + 4,100 L", teuHandled: 2800, intensityMetric: "17.39 kgCO₂e/TEU", co2Scope1Kg: 10988, co2Scope2Kg: 37513, verifiedHash: "9a12b40c...8e12" },
      { voyageOrShift: "Voyage 054N", date: "31/08/2026", totalEnergyOrFuel: "54,850 kWh + 4,430 L", teuHandled: 2910, intensityMetric: "17.69 kgCO₂e/TEU", co2Scope1Kg: 11872, co2Scope2Kg: 39607, verifiedHash: "7c44d19e...2a90" }
    ]
  },
  {
    id: "VSL-02",
    category: "VESSELS",
    code: "MV ONE APUS",
    name: "MV ONE APUS",
    subtitle: "ONE Line · Approaching Berth B3 · Voy 012W",
    statusLabel: "Arriving",
    statusTone: "BLUE",
    statusSubtext: "To Berth B3 · Escort Tug Attached",
    progressPercent: 25,
    distanceOrRemainingText: "180 m to Berth B3",
    linkedVesselId: "VSL-02",
    linkedVesselName: "MV ONE APUS",
    useCaseId: "UC-02",
    meterModalId: "MTR-OPS-TCIT-B01",
    berthName: "Berth B3 (East Deep-Sea Quay)",
    bayAssignment: "Bay C1 & Reefer R1",
    speedOrRate: "2.4 knots (Approach)",
    cargoSummary: "3,400 TEU scheduled",
    position3D: [34, 2.2, 28],
    cameraOffset: [52, 24, 56],
    inspectorRows: [
      { label: "Voyage & IMO", value: "012W · IMO 9806079", highlight: true },
      { label: "Assigned Berth", value: "Berth B3 (Dual-Bus 22kV/6.6kV OPS)" },
      { label: "Escort Tugboat", value: "Tug TC-09 (34.0 L/min Coriolis Flow)" },
      { label: "Peak Load Control", value: "1.5 MW Crane Regen & Smart Grid Cap", highlight: true },
      { label: "Pre-Staged Yard Bay", value: "Bay C1 (290 TEU) & Reefer R1" },
      { label: "Planned Exchange", value: "3,400 TEU (Rotterdam Gateway)" }
    ],
    drillDownTitle: "MV ONE APUS (012W) — Escort Tug Fuel & ULCV Shore Power Pre-Dispatch Report",
    drillDownSubtitle: "Coriolis mass flowmeter bunker telemetry during berthing approach and 22kV/6.6kV OPS + Crane Regen peak-load balancing plan",
    chartTitle: "Escort Tugboat Fuel Flow (L/min) & Dual-Bus OPS Power Ramp Forecast (kW)",
    chartPrimaryLabel: "OPS / Berthing Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Tug Fuel Flow",
    chartSecondaryUnit: "L/min",
    feederReport: {
      feederCode: "F-04 / MTR-OPS-B3",
      feederName: "Deep-Sea Dual-Bus OPS Substation (22kV/6.6kV)",
      protocol: "IEC 61850 Station Bus & Emerson Coriolis NMEA",
      meterId: "MTR-OPS-TCIT-B01",
      voltageKv: "22.0 / 6.6 kV",
      currentAmps: 73.8,
      activePowerKw: 840,
      reactivePowerKvar: 140,
      powerFactor: 0.96,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "70,300 kWh Planned (OPS 24.5k + STS 29.0k + Reefer 16.8k)",
      carbonScope1Kg: 13400,
      carbonScope2Kg: 50763,
      intensityPerTeu: "18.87 kgCO₂e / TEU (EU ETS MRN Compliant)"
    },
    telemetrySeries: [
      { time: "13:30", primaryVal: 180, secondaryVal: 12.0, tertiaryVal: 40.1, statusNote: "Tug #02 attached at channel buoy 0" },
      { time: "13:50", primaryVal: 320, secondaryVal: 34.0, tertiaryVal: 42.5, statusNote: "Heavy tug push against ebb current into Berth B3" },
      { time: "14:15", primaryVal: 680, secondaryVal: 22.0, tertiaryVal: 59.5, statusNote: "Dual OPS cable booms connected & synchronized" },
      { time: "15:00", primaryVal: 840, secondaryVal: 3.5, tertiaryVal: 73.8, statusNote: "380 Reefer holds online; Solar PV & Crane Regen offsetting 1.5MW" },
      { time: "18:00", primaryVal: 860, secondaryVal: 0.0, tertiaryVal: 75.8, statusNote: "Full ULCV hoteling load on clean shore power" }
    ],
    containersManifest: [
      { containerNo: "ONEY8401923", sizeType: "40HC", baySlot: "Bay C1 · Slot C1-02", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-SAMSUNG-EU02", commodity: "Consumer Electronics (HS 847130 - Rotterdam)", vesselVoyage: "ONE APUS 012W", weightKg: 22900 },
      { containerNo: "ONEU7710294", sizeType: "40HC", baySlot: "Bay C1 · Slot C1-06", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-SAMSUNG-EU02", commodity: "Precision Display Panels (EU ETS Ready)", vesselVoyage: "ONE APUS 012W", weightKg: 21800 },
      { containerNo: "NYKU5091821", sizeType: "40HC", baySlot: "Bay R1 · Slot R1-28", isReefer: true, tempSetC: "+4.0°C", status: "PLUGGED_IN", bookingNo: "BKG-PHARMA-NL09", commodity: "Chilled Medical Diagnostics", vesselVoyage: "ONE APUS 012W", weightKg: 19600 }
    ],
    historicalReports: [
      { voyageOrShift: "Voyage 012W (28/09 · Berth B3)", date: "28/09/2026", totalEnergyOrFuel: "70,300 kWh + 5,000 L", teuHandled: 3400, intensityMetric: "18.87 kgCO₂e/TEU", co2Scope1Kg: 13400, co2Scope2Kg: 50763, verifiedHash: "e7c10b55...f87c" },
      { voyageOrShift: "Voyage 011W (10/09 · Berth B3)", date: "10/09/2026", totalEnergyOrFuel: "68,900 kWh + 4,900 L", teuHandled: 3350, intensityMetric: "18.81 kgCO₂e/TEU", co2Scope1Kg: 13132, co2Scope2Kg: 49752, verifiedHash: "4b81d02a...9c11" },
      { voyageOrShift: "Voyage 010W (24/08 · Berth B3)", date: "24/08/2026", totalEnergyOrFuel: "71,400 kWh + 5,120 L", teuHandled: 3480, intensityMetric: "18.92 kgCO₂e/TEU", co2Scope1Kg: 13721, co2Scope2Kg: 51558, verifiedHash: "9f30a18d...3e04" }
    ]
  },
  {
    id: "VSL-03",
    category: "VESSELS",
    code: "MV TAN CANG GLORY",
    name: "MV TAN CANG GLORY",
    subtitle: "SNP Feeder · Departing Berth B1 · Voy 104S",
    statusLabel: "Departing",
    statusTone: "SLATE",
    statusSubtext: "Leaving Berth B1 · Bound for Singapore",
    progressPercent: 100,
    distanceOrRemainingText: "1,200 / 1,200 TEU Done",
    linkedVesselId: "VSL-03",
    linkedVesselName: "MV TAN CANG GLORY",
    useCaseId: "UC-04",
    meterModalId: "MTR-OPS-CATLAI-B1",
    berthName: "Berth B1 (West Quay)",
    bayAssignment: "Bay A1 (Completed)",
    speedOrRate: "4.1 knots (Outbound)",
    cargoSummary: "1,200 / 1,200 TEU completed",
    position3D: [-34, 2.2, 26.5],
    cameraOffset: [-18, 24, 55],
    inspectorRows: [
      { label: "Voyage & IMO", value: "104S · IMO 9632480", highlight: true },
      { label: "Departure Berth", value: "Berth B1 (West Feeder Wharf)" },
      { label: "Hoteling Duration", value: "17.75 hrs (100% On-Time)" },
      { label: "Certified Energy", value: "18,400 kWh Elec · 2,050 L Biofuel", highlight: true },
      { label: "Stacked Yard Bay", value: "Bay A1 (Rows E–F)" },
      { label: "DCSA Carbon Status", value: "VERIFIED_IMO (#GPORT-INV-0904)" }
    ],
    drillDownTitle: "MV TAN CANG GLORY (104S) — Finalized Port Call Energy & IMO DCS Audit Sheet",
    drillDownSubtitle: "Completed night-shift off-peak stevedoring, B24 biofuel tug telemetry, and certified DCSA Carbon Invoice #0904",
    chartTitle: "Completed Berth B1 OPS & STS Crane Load Profile (kW) During 17.75h Port Call",
    chartPrimaryLabel: "Berth B1 Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Line Voltage",
    chartSecondaryUnit: "kV",
    feederReport: {
      feederCode: "F-01 / MTR-OPS-B1",
      feederName: "Berth B1 Feeder OPS & Stevedoring Sub-Meter",
      protocol: "Modbus TCP / DCSA Immutable Ledger",
      meterId: "MTR-OPS-CATLAI-B1",
      voltageKv: "6.60 kV",
      currentAmps: 0.0,
      activePowerKw: 0,
      reactivePowerKvar: 0,
      powerFactor: 0.98,
      frequencyHz: 50.02,
      totalCumulativeEnergy: "18,400 kWh (OPS 6.4k + STS 8.4k + Reefer 3.6k)",
      carbonScope1Kg: 5494,
      carbonScope2Kg: 13287,
      intensityPerTeu: "15.65 kgCO₂e / TEU (IMO DCS Certified)"
    },
    telemetrySeries: [
      { time: "10:30", primaryVal: 310, secondaryVal: 6.6, tertiaryVal: 27.1, statusNote: "Berth B1 OPS connected; unloading started" },
      { time: "14:00", primaryVal: 890, secondaryVal: 6.59, tertiaryVal: 78.0, statusNote: "2 STS cranes + OPS steady operation" },
      { time: "22:00", primaryVal: 740, secondaryVal: 6.61, tertiaryVal: 64.8, statusNote: "Off-peak night stevedoring & EV tractor fast-charging" },
      { time: "02:00", primaryVal: 420, secondaryVal: 6.62, tertiaryVal: 36.7, statusNote: "Final container lashing & hatch closing" },
      { time: "04:15", primaryVal: 0, secondaryVal: 6.6, tertiaryVal: 0.0, statusNote: "OPS disconnected; vessel cast off on schedule" }
    ],
    containersManifest: [
      { containerNo: "TCGU1120034", sizeType: "20GP", baySlot: "Loaded on Vessel Bay 08", isReefer: true, tempSetC: "+12.0°C", status: "LOADING_VESSEL", bookingNo: "BKG-AGRI-SNP04", commodity: "Tropical Fresh Dragonfruit & Mango (HS 080450)", vesselVoyage: "TAN CANG GLORY 104S", weightKg: 16800 },
      { containerNo: "SNPU3091844", sizeType: "40GP", baySlot: "Bay A1 · Slot A1-42", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-HPH-SGN19", commodity: "North-South FMCG & Retail Goods", vesselVoyage: "TAN CANG GLORY 104S", weightKg: 23100 }
    ],
    historicalReports: [
      { voyageOrShift: "Voyage 104S (28/09 · Berth B1)", date: "28/09/2026", totalEnergyOrFuel: "18,400 kWh + 2,050 L", teuHandled: 1200, intensityMetric: "15.65 kgCO₂e/TEU", co2Scope1Kg: 5494, co2Scope2Kg: 13287, verifiedHash: "8a4f91b7...4f06" },
      { voyageOrShift: "Voyage 103S (21/09 · Berth B1)", date: "21/09/2026", totalEnergyOrFuel: "18,100 kWh + 2,010 L", teuHandled: 1180, intensityMetric: "15.63 kgCO₂e/TEU", co2Scope1Kg: 5386, co2Scope2Kg: 13070, verifiedHash: "2d90e11c...7a23" },
      { voyageOrShift: "Voyage 102S (14/09 · Berth B1)", date: "14/09/2026", totalEnergyOrFuel: "17,650 kWh + 1,960 L", teuHandled: 1150, intensityMetric: "15.59 kgCO₂e/TEU", co2Scope1Kg: 5252, co2Scope2Kg: 12745, verifiedHash: "6c12f89b...1d40" }
    ]
  },

  // =========================================================================
  // 2. QUAY CRANES (4 STS Cranes serving the vessels)
  // =========================================================================
  {
    id: "STS-01",
    category: "CRANES",
    code: "STS-01",
    name: "Quay Crane STS-01 (Berth B2)",
    subtitle: "Unloading MV SPIRIT OF MUMBAI · Ship Bay 15",
    statusLabel: "Unloading",
    statusTone: "GREEN",
    statusSubtext: "Berth B2 (Bay 15) → Yard Bay A1",
    progressPercent: 84,
    distanceOrRemainingText: "28 lifts left",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-STS-CATLAI-B2",
    berthName: "Berth B2 · Ship Bay 15",
    bayAssignment: "Yard Bay A1",
    speedOrRate: "31 lifts/hr",
    cargoSummary: "152 / 180 containers",
    position3D: [-8, 6, 15.8],
    cameraOffset: [-4, 18, 36],
    inspectorRows: [
      { label: "Serving Vessel", value: "MV SPIRIT OF MUMBAI (056N)", highlight: true },
      { label: "Substation Feeder", value: "Feeder F-01 (22.1 kV · 810 kW)" },
      { label: "Ship Position", value: "Berth B2 · Forward Hold Bay 15" },
      { label: "Target Yard Bay", value: "Container Bay A1 (via TRK-1092)", highlight: true },
      { label: "Hoist Productivity", value: "31 moves/hr · 7.82 kWh/TEU" },
      { label: "Regen Recovery", value: "18.4% Lowering Energy Recovered" }
    ],
    drillDownTitle: "Quay Crane STS-01 — 22kV Hoist Drive Telemetry & Lift Efficiency Report",
    drillDownSubtitle: "Profinet / Modbus RTU telemetry from Feeder F-01 (22.1 kV), regenerative lowering recovery, and container discharge log",
    chartTitle: "STS-01 Hoist & Trolley Active Power (kW) vs 22kV Feeder Voltage (kV)",
    chartPrimaryLabel: "Hoist Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Feeder Voltage",
    chartSecondaryUnit: "kV",
    feederReport: {
      feederCode: "F-01 / STS-B2-01",
      feederName: "Feeder STS Cat Lai Berth B1 & B2 (22kV Switchgear)",
      protocol: "Profinet / IEC 61850 MMS",
      meterId: "MTR-STS-CATLAI-B2",
      voltageKv: "22.10 kV",
      currentAmps: 38.4,
      activePowerKw: 810,
      reactivePowerKvar: 135,
      powerFactor: 0.98,
      frequencyHz: 50.02,
      totalCumulativeEnergy: "7,640 kWh (Shift) · 1,410 kWh Regen Recovered",
      carbonScope1Kg: 0,
      carbonScope2Kg: 5516,
      intensityPerTeu: "7.82 kWh / TEU (5.64 kgCO₂e / TEU)"
    },
    telemetrySeries: [
      { time: "07:30", primaryVal: 210, secondaryVal: 22.1, tertiaryVal: 12, statusNote: "Boom lowered; spreader locked on Ship Bay 15" },
      { time: "08:30", primaryVal: 790, secondaryVal: 21.9, tertiaryVal: 31, statusNote: "Twin-lift 20ft hoisting at full speed" },
      { time: "10:30", primaryVal: 860, secondaryVal: 21.8, tertiaryVal: 33, statusNote: "Peak heavy 40ft HC discharge to TRK-1092" },
      { time: "12:00", primaryVal: 240, secondaryVal: 22.2, tertiaryVal: 14, statusNote: "Operator shift rotation & spreader check" },
      { time: "13:30", primaryVal: 810, secondaryVal: 21.9, tertiaryVal: 31, statusNote: "Afternoon discharge run → Container Bay A1" }
    ],
    containersManifest: [
      { containerNo: "CMAU4920182", sizeType: "40HC", baySlot: "Lifted to TRK-1092 → Bay A1-08", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-419", commodity: "Electronic Packaging Components", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 21400 },
      { containerNo: "TCNU8831204", sizeType: "40HC", baySlot: "Stacked in Bay A1 · Row B Tier 3", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-CATLAI-420", commodity: "Industrial Textiles", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 23600 },
      { containerNo: "FCIU3319049", sizeType: "20GP", baySlot: "Stacked in Bay A1 · Row A Tier 2", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-CATLAI-421", commodity: "Machinery Spare Parts", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 18200 }
    ],
    historicalReports: [
      { voyageOrShift: "Ca Sáng 28/09 (STS-01 → Bay A1)", date: "28/09/2026", totalEnergyOrFuel: "1,850 kWh (Regen 18%)", teuHandled: 240, intensityMetric: "7.71 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 1336, verifiedHash: "AST-01-SHIFT1" },
      { voyageOrShift: "Voyage 056N (MV SPIRIT OF MUMBAI)", date: "28/09/2026", totalEnergyOrFuel: "7,640 kWh", teuHandled: 976, intensityMetric: "7.82 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 5516, verifiedHash: "STS01-V056N" },
      { voyageOrShift: "Ca Đêm 27/09 (Voyage 104S · Berth B1)", date: "27/09/2026", totalEnergyOrFuel: "4,320 kWh", teuHandled: 560, intensityMetric: "7.71 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 3119, verifiedHash: "STS01-V104S" }
    ]
  },
  {
    id: "STS-02",
    category: "CRANES",
    code: "STS-02",
    name: "Quay Crane STS-02 (Berth B2)",
    subtitle: "Unloading MV SPIRIT OF MUMBAI · Ship Bay 35",
    statusLabel: "Unloading",
    statusTone: "GREEN",
    statusSubtext: "Berth B2 (Bay 35) → Yard Bay B2",
    progressPercent: 79,
    distanceOrRemainingText: "42 lifts left",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-STS-CATLAI-B2",
    berthName: "Berth B2 · Ship Bay 35",
    bayAssignment: "Yard Bay B2",
    speedOrRate: "29 lifts/hr",
    cargoSummary: "158 / 200 containers",
    position3D: [0, 6, 15.8],
    cameraOffset: [4, 18, 36],
    inspectorRows: [
      { label: "Serving Vessel", value: "MV SPIRIT OF MUMBAI (056N)", highlight: true },
      { label: "Substation Feeder", value: "Feeder F-01 (22.0 kV · 860 kW)" },
      { label: "Ship Position", value: "Berth B2 · Midship Deck Bay 35" },
      { label: "Target Yard Bay", value: "Container Bay B2 (via TRK-2481)", highlight: true },
      { label: "Hoist Productivity", value: "29 moves/hr · 8.05 kWh/TEU" },
      { label: "Active Handover", value: "Loaded #MSCU8921040 onto TRK-2481" }
    ],
    drillDownTitle: "Quay Crane STS-02 — 22kV Drive Telemetry & Midship Bay 35 Discharge Report",
    drillDownSubtitle: "Real-time hoist power curve, regenerative braking telemetry, and container dispatch to Yard Bay B2",
    chartTitle: "STS-02 Active Hoist Power (kW) & Cycle Moves per Hour",
    chartPrimaryLabel: "Hoist Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Lift Rate",
    chartSecondaryUnit: "moves/h",
    feederReport: {
      feederCode: "F-01 / STS-B2-02",
      feederName: "Feeder STS Cat Lai Berth B2 (Midship Drive #02)",
      protocol: "Profinet / Modbus RTU",
      meterId: "MTR-STS-CATLAI-B2",
      voltageKv: "22.00 kV",
      currentAmps: 40.2,
      activePowerKw: 860,
      reactivePowerKvar: 145,
      powerFactor: 0.98,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "8,120 kWh · 1,490 kWh Regen Recovered",
      carbonScope1Kg: 0,
      carbonScope2Kg: 5863,
      intensityPerTeu: "8.05 kWh / TEU (5.81 kgCO₂e / TEU)"
    },
    telemetrySeries: [
      { time: "08:00", primaryVal: 780, secondaryVal: 28, tertiaryVal: 36, statusNote: "Discharging upper deck tiers on Ship Bay 35" },
      { time: "10:00", primaryVal: 890, secondaryVal: 31, tertiaryVal: 41, statusNote: "Twin-lift discharge to Yard Bay B2 shuttle lane" },
      { time: "12:00", primaryVal: 410, secondaryVal: 18, tertiaryVal: 19, statusNote: "Hatch cover lift & placement on quay apron" },
      { time: "13:43", primaryVal: 860, secondaryVal: 29, tertiaryVal: 40, statusNote: "Discharged MSCU8921040 onto Yard Truck TRK-2481" }
    ],
    containersManifest: [
      { containerNo: "MSCU8921040", sizeType: "40HC", baySlot: "On TRK-2481 → Bay B2 Slot 14", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-882", commodity: "Apparel & Footwear Export", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 24800 },
      { containerNo: "MEDU7741290", sizeType: "40HC", baySlot: "Stacked in Bay B2 · Slot B2-12", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-CATLAI-883", commodity: "Home Furniture & Woodwork", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 25900 }
    ],
    historicalReports: [
      { voyageOrShift: "Ca Sáng 28/09 (STS-02 → Bay B2)", date: "28/09/2026", totalEnergyOrFuel: "2,140 kWh", teuHandled: 266, intensityMetric: "8.05 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 1545, verifiedHash: "STS02-SHIFT1" },
      { voyageOrShift: "Voyage 056N (STS-02 → Bay B2 & R1)", date: "28/09/2026", totalEnergyOrFuel: "8,120 kWh", teuHandled: 1008, intensityMetric: "8.05 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 5863, verifiedHash: "STS02-991A" },
      { voyageOrShift: "Voyage 055N (14/09 · Berth B2)", date: "14/09/2026", totalEnergyOrFuel: "7,890 kWh", teuHandled: 990, intensityMetric: "7.97 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 5697, verifiedHash: "STS02-884C" }
    ]
  },
  {
    id: "STS-03",
    category: "CRANES",
    code: "STS-03",
    name: "Quay Crane STS-03 (Berth B2)",
    subtitle: "Loading MV SPIRIT OF MUMBAI · Ship Bay 55",
    statusLabel: "Loading",
    statusTone: "BLUE",
    statusSubtext: "Yard Bay A1 → Berth B2 (Bay 55)",
    progressPercent: 72,
    distanceOrRemainingText: "56 lifts left",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-STS-CATLAI-B2",
    berthName: "Berth B2 · Ship Bay 55",
    bayAssignment: "From Yard Bay A1",
    speedOrRate: "30 lifts/hr",
    cargoSummary: "144 / 200 containers",
    position3D: [8, 6, 15.8],
    cameraOffset: [12, 18, 36],
    inspectorRows: [
      { label: "Serving Vessel", value: "MV SPIRIT OF MUMBAI (056N)", highlight: true },
      { label: "Substation Feeder", value: "Feeder F-01 (22.1 kV · 810 kW)" },
      { label: "Ship Position", value: "Berth B2 · Aft Hold Bay 55" },
      { label: "Source Yard Bay", value: "Container Bay A1 (via TRK-3105)", highlight: true },
      { label: "Hoist Productivity", value: "30 moves/hr · Export Loading" },
      { label: "Completed Lifts", value: "144 / 200 lifts (72%)" }
    ],
    drillDownTitle: "Quay Crane STS-03 — Export Container Loading & Feeder F-01 Telemetry",
    drillDownSubtitle: "Outbound container loading sequence from Yard Bay A1 onto MV SPIRIT OF MUMBAI Aft Bay 55",
    chartTitle: "STS-03 Export Loading Power Profile (kW) & Hoist Speed",
    chartPrimaryLabel: "Hoist Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Moves/hr",
    chartSecondaryUnit: "lifts/h",
    feederReport: {
      feederCode: "F-01 / STS-B2-03",
      feederName: "Feeder STS Cat Lai Berth B2 (Aft Drive #03)",
      protocol: "Profinet / IEC 61850",
      meterId: "MTR-STS-CATLAI-B2",
      voltageKv: "22.10 kV",
      currentAmps: 35.9,
      activePowerKw: 810,
      reactivePowerKvar: 140,
      powerFactor: 0.98,
      frequencyHz: 50.02,
      totalCumulativeEnergy: "7,040 kWh · 1,280 kWh Regen Recovered",
      carbonScope1Kg: 0,
      carbonScope2Kg: 5084,
      intensityPerTeu: "7.95 kWh / TEU (5.74 kgCO₂e / TEU)"
    },
    telemetrySeries: [
      { time: "08:00", primaryVal: 740, secondaryVal: 29, tertiaryVal: 34, statusNote: "Loading bottom hold tiers on Ship Bay 55" },
      { time: "10:00", primaryVal: 820, secondaryVal: 31, tertiaryVal: 38, statusNote: "Continuous export feed from Yard Bay A1" },
      { time: "12:00", primaryVal: 790, secondaryVal: 30, tertiaryVal: 36, statusNote: "Deck lashing verification on Tier 82" },
      { time: "13:45", primaryVal: 810, secondaryVal: 30, tertiaryVal: 36, statusNote: "Receiving HLXU6192041 from Truck TRK-3105" }
    ],
    containersManifest: [
      { containerNo: "HLXU6192041", sizeType: "40HC", baySlot: "On TRK-3105 → Ship Bay 55", isReefer: false, tempSetC: "Ambient", status: "LOADING_VESSEL", bookingNo: "BKG-EXP-SGN901", commodity: "Coffee & Cashew Nuts Export", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 26100 },
      { containerNo: "OOLU5029118", sizeType: "40HC", baySlot: "Loaded on Ship Bay 55 Tier 82", isReefer: false, tempSetC: "Ambient", status: "LOADING_VESSEL", bookingNo: "BKG-EXP-SGN902", commodity: "Natural Rubber Bales", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 27400 }
    ],
    historicalReports: [
      { voyageOrShift: "Ca Sáng 28/09 (Bay A1 → STS-03 Export)", date: "28/09/2026", totalEnergyOrFuel: "1,910 kWh", teuHandled: 240, intensityMetric: "7.95 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 1379, verifiedHash: "STS03-SHIFT1" },
      { voyageOrShift: "Voyage 056N (STS-03 Export Loading)", date: "28/09/2026", totalEnergyOrFuel: "7,040 kWh", teuHandled: 885, intensityMetric: "7.95 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 5084, verifiedHash: "STS03-772B" },
      { voyageOrShift: "Voyage 055N (14/09 · Berth B2)", date: "14/09/2026", totalEnergyOrFuel: "6,820 kWh", teuHandled: 860, intensityMetric: "7.93 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 4925, verifiedHash: "STS03-610A" }
    ]
  },
  {
    id: "STS-04",
    category: "CRANES",
    code: "STS-04",
    name: "Quay Crane STS-04 (Berth B3)",
    subtitle: "Staged at Berth B3 for MV ONE APUS",
    statusLabel: "Staged",
    statusTone: "AMBER",
    statusSubtext: "Waiting for MV ONE APUS (ETA 8m)",
    progressPercent: 100,
    distanceOrRemainingText: "Ready at B3",
    linkedVesselId: "VSL-02",
    linkedVesselName: "MV ONE APUS",
    useCaseId: "UC-02",
    meterModalId: "MTR-STS-TCIT-SPP",
    berthName: "Berth B3 · Ship Bay 42",
    bayAssignment: "Yard Bay C1",
    speedOrRate: "Standby (14:15 Start)",
    cargoSummary: "Assigned 680 TEU moves",
    position3D: [26, 6, 15.8],
    cameraOffset: [28, 18, 36],
    inspectorRows: [
      { label: "Assigned Vessel", value: "MV ONE APUS (012W - Arriving)", highlight: true },
      { label: "Substation Feeder", value: "22kV Super Post-Panamax Feeder" },
      { label: "Target Yard Bay", value: "Container Bay C1 (Pre-Staged)", highlight: true },
      { label: "Regen & Grid Link", value: "1.5 MW Regenerative Drive Bus Active" },
      { label: "Planned Workload", value: "680 TEU Moves (Ship Bay 42)" }
    ],
    drillDownTitle: "Quay Crane STS-04 — Super Post-Panamax Pre-Dispatch & Regenerative Drive Plan",
    drillDownSubtitle: "Scheduled 14:15 hoist ramp for MV ONE APUS (14,000 TEU ULCV) synchronized with 1.5MW Crane Regen & Smart Demand Control",
    chartTitle: "Projected STS-04..05 Ramp Load (kW) & Regenerative Drive Recovery (kW)",
    chartPrimaryLabel: "Projected Crane Load",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Regen Recovery",
    chartSecondaryUnit: "kW",
    feederReport: {
      feederCode: "F-01 / MTR-STS-SPP",
      feederName: "Super Post-Panamax 22kV Crane Bus (Berth B3)",
      protocol: "IEC 61850 / SCADA Auto-Dispatch",
      meterId: "MTR-STS-TCIT-SPP",
      voltageKv: "22.05 kV",
      currentAmps: 13.1,
      activePowerKw: 45,
      reactivePowerKvar: 12,
      powerFactor: 0.95,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "29,000 kWh Scheduled (8.53 kWh/TEU)",
      carbonScope1Kg: 0,
      carbonScope2Kg: 20941,
      intensityPerTeu: "8.53 kWh / TEU (Regen & Smart Control Offsets 1,500 kW)"
    },
    telemetrySeries: [
      { time: "13:45", primaryVal: 45, secondaryVal: 0, tertiaryVal: 92, statusNote: "Gantry positioned at Berth B3 Mark 420m; Regen Bus Ready" },
      { time: "14:15", primaryVal: 1850, secondaryVal: 1450, tertiaryVal: 84, statusNote: "Boom lowered onto ONE APUS; Regen & Solar offset 1,450 kW" },
      { time: "15:30", primaryVal: 3400, secondaryVal: 1500, tertiaryVal: 62, statusNote: "Peak twin-lift unloading; grid demand capped below 8,500 kW" },
      { time: "18:00", primaryVal: 3100, secondaryVal: 450, tertiaryVal: 55, statusNote: "Evening steady container handling to Bay C1" }
    ],
    containersManifest: [
      { containerNo: "ONEY8401923", sizeType: "40HC", baySlot: "Bay C1-02 → Staged for STS-04", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-SAMSUNG-EU02", commodity: "Consumer Electronics (HS 847130)", vesselVoyage: "ONE APUS 012W", weightKg: 22900 }
    ],
    historicalReports: [
      { voyageOrShift: "Voyage 012W (28/09 · Berth B3 → Bay C1)", date: "28/09/2026", totalEnergyOrFuel: "14,500 kWh", teuHandled: 1700, intensityMetric: "8.53 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 10470, verifiedHash: "SPP-B3-PLAN" },
      { voyageOrShift: "Voyage 011W (10/09 · Berth B3 → Bay C1)", date: "10/09/2026", totalEnergyOrFuel: "14,200 kWh", teuHandled: 1675, intensityMetric: "8.48 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 10254, verifiedHash: "SPP-B3-011W" },
      { voyageOrShift: "Voyage 010W (24/08 · Berth B3 → Bay C1)", date: "24/08/2026", totalEnergyOrFuel: "14,800 kWh", teuHandled: 1740, intensityMetric: "8.51 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 10687, verifiedHash: "SPP-B3-010W" }
    ]
  },

  // =========================================================================
  // 3. YARD TRUCKS (Internal Tractors transferring containers to/from Bays)
  // =========================================================================
  {
    id: "TRK-2481",
    category: "TRUCKS",
    code: "TRK-2481",
    name: "Yard Truck TRK-2481",
    subtitle: "Le Quang Minh · Hauling #MSCU-8921040",
    statusLabel: "En route",
    statusTone: "BLUE",
    statusSubtext: "To Container Bay B2 · ETA 1 min",
    progressPercent: 78,
    distanceOrRemainingText: "65 m left",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-TRK-FLEET-B2",
    berthName: "From Crane STS-02 (Berth B2)",
    bayAssignment: "In 2 · Container Bay B2 (Slot 14)",
    speedOrRate: "18 km/h",
    cargoSummary: "1 × 40ft HC (24,800 kg)",
    position3D: [-2, 0.8, 6],
    cameraOffset: [8, 14, 22],
    inspectorRows: [
      { label: "Container ID", value: "#MSCU-8921040 (40ft HC)", highlight: true },
      { label: "Serving Vessel", value: "MV SPIRIT OF MUMBAI (056N)" },
      { label: "Origin Quay Crane", value: "STS-02 (Berth B2 Midship)" },
      { label: "Destination Bay", value: "Container Bay B2 · Slot 14", highlight: true },
      { label: "ETA & Speed", value: "13:46 (1 min) · 18 km/h" },
      { label: "Telemetry Protocol", value: "CAN Bus J1939 / GPS Route R1" }
    ],
    drillDownTitle: "Yard Truck TRK-2481 & Tractor Fleet — CAN Bus J1939 Fuel/EV Telemetry Report",
    drillDownSubtitle: "Internal tractor shuttle telemetry between Berth B2 Quay Cranes and Container Bays (32 Haulers / e-Truck Hub F-05)",
    chartTitle: "Terminal Tractor Fleet Fuel Burn Rate (L/h) & Cumulative Haulage (Liters)",
    chartPrimaryLabel: "Cumulative Fuel",
    chartPrimaryUnit: "L",
    chartSecondaryLabel: "Burn Rate",
    chartSecondaryUnit: "L/h",
    feederReport: {
      feederCode: "F-05 / MTR-TRK-B2",
      feederName: "Terminal Tractor Fleet CAN Bus & EV Fast-Charge Hub F-05",
      protocol: "CAN Bus J1939 / Teltonika FMB640 GPS",
      meterId: "MTR-TRK-FLEET-B2",
      voltageKv: "0.40 kV (EV Hub)",
      currentAmps: 520.0,
      activePowerKw: 340,
      reactivePowerKvar: 45,
      powerFactor: 0.99,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "2,400 L Diesel + 340 kW e-Truck Fast Charging",
      carbonScope1Kg: 6432,
      carbonScope2Kg: 173,
      intensityPerTeu: "0.84 L / TEU (2.25 kgCO₂e / TEU)"
    },
    telemetrySeries: [
      { time: "07:30", primaryVal: 120, secondaryVal: 12.0, tertiaryVal: 18, statusNote: "Initial tractor queue deployed under STS-01..03" },
      { time: "09:30", primaryVal: 480, secondaryVal: 19.5, tertiaryVal: 22, statusNote: "Continuous shuttle cycles on Blue Route Lane" },
      { time: "12:00", primaryVal: 820, secondaryVal: 8.5, tertiaryVal: 15, statusNote: "Midday shift rotation & e-Truck opportunity charging" },
      { time: "13:45", primaryVal: 1190, secondaryVal: 18.2, tertiaryVal: 18, statusNote: "TRK-2481 hauling MSCU8921040 to Container Bay B2 Slot 14" }
    ],
    containersManifest: [
      { containerNo: "MSCU8921040", sizeType: "40HC", baySlot: "On TRK-2481 → Bay B2 Slot 14", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-882", commodity: "Apparel & Footwear Export", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 24800 },
      { containerNo: "CMAU4920182", sizeType: "40HC", baySlot: "On TRK-1092 → Bay A1 Slot 08", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-419", commodity: "Electronic Packaging Components", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 21400 },
      { containerNo: "SZLU9041120", sizeType: "40HC", baySlot: "On TRK-4018 → Reefer Bay R1-12", isReefer: true, tempSetC: "-18.0°C", status: "IN_TRANSIT", bookingNo: "BKG-VINASEAFOOD-08", commodity: "Frozen Pangasius Fillet", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 26800 }
    ],
    historicalReports: [
      { voyageOrShift: "Đơn #MSCU-8921040 (STS-02 → Bay B2-14)", date: "28/09/2026 13:42", totalEnergyOrFuel: "0.78 L Diesel", teuHandled: 2, intensityMetric: "0.39 L/TEU", co2Scope1Kg: 2, co2Scope2Kg: 0, verifiedHash: "ORD-MSCU8921" },
      { voyageOrShift: "Ca Sáng 28/09 (42 Chuyến STS-02 ↔ Bay B2)", date: "28/09/2026", totalEnergyOrFuel: "33.6 L Diesel", teuHandled: 84, intensityMetric: "0.40 L/TEU", co2Scope1Kg: 90, co2Scope2Kg: 0, verifiedHash: "TRK2481-S1" },
      { voyageOrShift: "Ca Chiều 27/09 (38 Chuyến STS-02 ↔ Bay B2)", date: "27/09/2026", totalEnergyOrFuel: "31.2 L Diesel", teuHandled: 76, intensityMetric: "0.41 L/TEU", co2Scope1Kg: 84, co2Scope2Kg: 0, verifiedHash: "TRK2481-S2" }
    ]
  },
  {
    id: "TRK-1092",
    category: "TRUCKS",
    code: "TRK-1092",
    name: "Yard Truck TRK-1092",
    subtitle: "Nguyen Van Hai · Loading under STS-01",
    statusLabel: "Loading",
    statusTone: "GREEN",
    statusSubtext: "At STS-01 (Berth B2) → To Bay A1",
    progressPercent: 45,
    distanceOrRemainingText: "At Quay B2",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-TRK-FLEET-B2",
    berthName: "Berth B2 (Under STS-01)",
    bayAssignment: "Container Bay A1 (Slot A1-08)",
    speedOrRate: "15 km/h (Shuttle)",
    cargoSummary: "Receiving #CMAU-4920182",
    position3D: [-8, 0.8, 13.5],
    cameraOffset: [-2, 14, 28],
    inspectorRows: [
      { label: "Container ID", value: "#CMAU-4920182 (40ft HC)", highlight: true },
      { label: "Serving Vessel", value: "MV SPIRIT OF MUMBAI (056N)" },
      { label: "Current Location", value: "Berth B2 · Under Crane STS-01" },
      { label: "Destination Bay", value: "Container Bay A1 · Slot 08", highlight: true },
      { label: "Powertrain", value: "Kalmar Electric Tractor (LFP 280 kWh)" },
      { label: "Battery SOC", value: "84% · 1.00 kWh/TEU Efficiency" }
    ],
    drillDownTitle: "Electric Yard Tractor TRK-1092 — Zero-Emission e-Truck Telemetry & Charging Log",
    drillDownSubtitle: "Kalmar Electric Terminal Tractor (LFP 280 kWh) operating on Feeder F-05 (340 kW Fast-Charge Hub)",
    chartTitle: "e-Truck Battery SOC (%) & Motor Traction Power (kW) Across Shift",
    chartPrimaryLabel: "Traction Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Battery SOC",
    chartSecondaryUnit: "%",
    feederReport: {
      feederCode: "F-05 / AST-03-TT12",
      feederName: "Feeder EV Yard Tractor Fast-Charge Station (Zone 4)",
      protocol: "OCPP 2.0.1 & CAN Bus J1939",
      meterId: "MTR-TRK-FLEET-B2",
      voltageKv: "0.40 kV",
      currentAmps: 520.0,
      activePowerKw: 340,
      reactivePowerKvar: 45,
      powerFactor: 0.99,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "240 kWh Consumed (7.5h Active / 0.5h Idle)",
      carbonScope1Kg: 0,
      carbonScope2Kg: 173,
      intensityPerTeu: "1.00 kWh / TEU (-85% CO₂ vs Diesel Tractor)"
    },
    telemetrySeries: [
      { time: "06:00", primaryVal: 45, secondaryVal: 98, tertiaryVal: 16, statusNote: "Departed EV Hub F-05 at 98% SOC" },
      { time: "09:00", primaryVal: 68, secondaryVal: 86, tertiaryVal: 18, statusNote: "Shuttling import containers from STS-01 to Bay A1" },
      { time: "12:00", primaryVal: -120, secondaryVal: 92, tertiaryVal: 0, statusNote: "30-min opportunity fast boost at Feeder F-05" },
      { time: "13:45", primaryVal: 62, secondaryVal: 84, tertiaryVal: 15, statusNote: "Receiving CMAU4920182 under STS-01 → Bay A1-08" }
    ],
    containersManifest: [
      { containerNo: "CMAU4920182", sizeType: "40HC", baySlot: "STS-01 → Bay A1 Slot 08", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-419", commodity: "Electronic Packaging Components", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 21400 }
    ],
    historicalReports: [
      { voyageOrShift: "Đơn #CMAU-4920182 (STS-01 → Bay A1-08)", date: "28/09/2026 13:40", totalEnergyOrFuel: "1.95 kWh EV", teuHandled: 2, intensityMetric: "0.98 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 1, verifiedHash: "ORD-CMAU4920" },
      { voyageOrShift: "Ca Sáng 28/09 (40 Chuyến STS-01 ↔ Bay A1)", date: "28/09/2026", totalEnergyOrFuel: "80.0 kWh EV", teuHandled: 80, intensityMetric: "1.00 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 58, verifiedHash: "TRK1092-S1" },
      { voyageOrShift: "Ca Đêm 27/09 (Voyage 104S · Berth B1 → Bay A1)", date: "27/09/2026", totalEnergyOrFuel: "72.0 kWh EV", teuHandled: 72, intensityMetric: "1.00 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 52, verifiedHash: "TRK1092-V104S" }
    ]
  },
  {
    id: "TRK-4018",
    category: "TRUCKS",
    code: "TRK-4018",
    name: "Yard Truck TRK-4018",
    subtitle: "Tran Quoc Tuan · Stacking at Reefer Bay R1",
    statusLabel: "Unloading",
    statusTone: "GREEN",
    statusSubtext: "At Reefer Bay R1 · Cold Chain",
    progressPercent: 92,
    distanceOrRemainingText: "At Bay R1",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-REEFER-ZONE3",
    berthName: "From Berth B2",
    bayAssignment: "Reefer Bay R1 (Slot R1-12)",
    speedOrRate: "14 km/h",
    cargoSummary: "40ft Reefer (-22.0 °C)",
    position3D: [14, 0.8, -3.2],
    cameraOffset: [22, 15, 12],
    inspectorRows: [
      { label: "Container ID", value: "#VNLU-5520188 (40ft Reefer)", highlight: true },
      { label: "Serving Vessel", value: "MV SPIRIT OF MUMBAI (056N)" },
      { label: "Current Location", value: "Reefer Bay R1 · Transfer Lane" },
      { label: "Cold-Chain Temp", value: "-25.0 °C (Ocean Tuna Loin)", highlight: true },
      { label: "Unplugged Window", value: "6 mins (Within 15-min SLA)" }
    ],
    drillDownTitle: "Cold-Chain Shuttle TRK-4018 — Reefer Transfer & Thermal SLA Report",
    drillDownSubtitle: "Continuous thermal tracking from vessel unplugging to Reefer Bay R1 power rack connection",
    chartTitle: "Reefer Container Internal Temperature (°C) & Chassis Power Draw (kW)",
    chartPrimaryLabel: "Cooling Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Internal Temp",
    chartSecondaryUnit: "°C",
    feederReport: {
      feederCode: "F-03 / MTR-REEFER-Z3",
      feederName: "Feeder Reefer Yard 480 Plugs (Zone 3 Cold Chain)",
      protocol: "Modbus TCP / Cold-Chain IoT",
      meterId: "MTR-REEFER-ZONE3",
      voltageKv: "21.90 kV",
      currentAmps: 76.4,
      activePowerKw: 1650,
      reactivePowerKvar: 310,
      powerFactor: 0.96,
      frequencyHz: 49.99,
      totalCumulativeEnergy: "12,400 kWh (240 VinaSeafood Reefers)",
      carbonScope1Kg: 0,
      carbonScope2Kg: 8954,
      intensityPerTeu: "51.6 kWh / Reefer Box (Zero Thermal Excursion)"
    },
    telemetrySeries: [
      { time: "13:32", primaryVal: 6.8, secondaryVal: -25.0, tertiaryVal: 240, statusNote: "Unplugged from Ship Bay 23; hold temp -25.0°C" },
      { time: "13:35", primaryVal: 0.0, secondaryVal: -24.9, tertiaryVal: 240, statusNote: "Lowered onto TRK-4018; transit on Central Lane" },
      { time: "13:38", primaryVal: 7.2, secondaryVal: -25.0, tertiaryVal: 240, statusNote: "Stacked in Reefer Bay R1-12 & plugged into 380V rack" }
    ],
    containersManifest: [
      { containerNo: "VNLU5520188", sizeType: "40HC", baySlot: "Reefer Bay R1 · Slot R1-12", isReefer: true, tempSetC: "-25.0°C", status: "PLUGGED_IN", bookingNo: "BKG-TUNA-EXP05", commodity: "Ocean Yellowfin Tuna Loin", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 27100 },
      { containerNo: "TCLU9821041", sizeType: "40HC", baySlot: "Reefer Bay R1 · Slot R1-04", isReefer: true, tempSetC: "-22.0°C", status: "PLUGGED_IN", bookingNo: "BKG-VINASEAFOOD-01", commodity: "Frozen Black Tiger Shrimp", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 26400 }
    ],
    historicalReports: [
      { voyageOrShift: "Đơn Lạnh #VNLU-5520188 (STS-02 → Bay R1-12)", date: "28/09/2026 13:32", totalEnergyOrFuel: "0.65 L Diesel", teuHandled: 2, intensityMetric: "6m Unplugged SLA", co2Scope1Kg: 2, co2Scope2Kg: 0, verifiedHash: "ORD-VNLU5520" },
      { voyageOrShift: "Ca Sáng 28/09 (30 Chuyến Lạnh STS-02 → Bay R1)", date: "28/09/2026", totalEnergyOrFuel: "21.0 L Diesel", teuHandled: 60, intensityMetric: "100% Cold SLA", co2Scope1Kg: 56, co2Scope2Kg: 0, verifiedHash: "TRK4018-S1" },
      { voyageOrShift: "Voyage 011W (10/09 · Berth B3 → Bay R1)", date: "10/09/2026", totalEnergyOrFuel: "24.5 L Diesel", teuHandled: 68, intensityMetric: "100% Cold SLA", co2Scope1Kg: 66, co2Scope2Kg: 0, verifiedHash: "TRK4018-V011W" }
    ]
  },
  {
    id: "TRK-3105",
    category: "TRUCKS",
    code: "TRK-3105",
    name: "Yard Truck TRK-3105",
    subtitle: "Pham Dinh Nam · Carrying Export to STS-03",
    statusLabel: "En route",
    statusTone: "BLUE",
    statusSubtext: "From Bay A1 → To STS-03 (Berth B2)",
    progressPercent: 64,
    distanceOrRemainingText: "90 m left",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-TRK-FLEET-B2",
    berthName: "To Berth B2 (Crane STS-03)",
    bayAssignment: "From Container Bay A1 (Slot 22)",
    speedOrRate: "16 km/h",
    cargoSummary: "1 × 40ft Export (#HLXU-6192041)",
    position3D: [8, 0.8, 3],
    cameraOffset: [16, 14, 18],
    inspectorRows: [
      { label: "Container ID", value: "#HLXU-6192041 (40ft Export)", highlight: true },
      { label: "Target Vessel", value: "MV SPIRIT OF MUMBAI (Bay 55)" },
      { label: "Origin Yard Bay", value: "Container Bay A1 · Slot 22" },
      { label: "Destination Crane", value: "Quay Crane STS-03 (Berth B2)", highlight: true },
      { label: "Speed & ETA", value: "16 km/h · Arriving in 45 sec" }
    ],
    drillDownTitle: "Yard Truck TRK-3105 — Export Container Retrieval & Shuttle Telemetry",
    drillDownSubtitle: "Outbound export container feed from Yard Bay A1 to Quay Crane STS-03",
    chartTitle: "Shuttle Speed (km/h) & Cumulative Fuel Consumption (L)",
    chartPrimaryLabel: "Cumulative Fuel",
    chartPrimaryUnit: "L",
    chartSecondaryLabel: "Tractor Speed",
    chartSecondaryUnit: "km/h",
    feederReport: {
      feederCode: "F-05 / MTR-TRK-B2",
      feederName: "Terminal Tractor Fleet Telemetry (Berth B2 Export Loop)",
      protocol: "CAN Bus J1939 / GPS",
      meterId: "MTR-TRK-FLEET-B2",
      voltageKv: "0.40 kV",
      currentAmps: 520.0,
      activePowerKw: 340,
      reactivePowerKvar: 45,
      powerFactor: 0.99,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "2,400 Liters Fleet Total (0.84 L/TEU)",
      carbonScope1Kg: 6432,
      carbonScope2Kg: 0,
      intensityPerTeu: "0.84 L / TEU"
    },
    telemetrySeries: [
      { time: "13:40", primaryVal: 42, secondaryVal: 0, tertiaryVal: 1, statusNote: "Positioned at Container Bay A1 Slot 22" },
      { time: "13:42", primaryVal: 43, secondaryVal: 16, tertiaryVal: 1, statusNote: "Loaded HLXU6192041 via e-RTG #02" },
      { time: "13:45", primaryVal: 44, secondaryVal: 16, tertiaryVal: 1, statusNote: "Approaching Quay Crane STS-03 at Berth B2" }
    ],
    containersManifest: [
      { containerNo: "HLXU6192041", sizeType: "40HC", baySlot: "Bay A1-22 → STS-03 (Ship Bay 55)", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-EXP-SGN901", commodity: "Coffee & Cashew Nuts Export", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 26100 }
    ],
    historicalReports: [
      { voyageOrShift: "Đơn Xuất #HLXU-6192041 (Bay A1-22 → STS-03)", date: "28/09/2026 13:40", totalEnergyOrFuel: "0.82 L Diesel", teuHandled: 2, intensityMetric: "0.41 L/TEU", co2Scope1Kg: 2, co2Scope2Kg: 0, verifiedHash: "ORD-HLXU6192" },
      { voyageOrShift: "Ca Sáng 28/09 (36 Chuyến Xuất Bay A1 → STS-03)", date: "28/09/2026", totalEnergyOrFuel: "29.5 L Diesel", teuHandled: 72, intensityMetric: "0.41 L/TEU", co2Scope1Kg: 79, co2Scope2Kg: 0, verifiedHash: "TRK3105-S1" },
      { voyageOrShift: "Ca Đêm 27/09 (Voyage 104S · Berth B1 ↔ Bay A1)", date: "27/09/2026", totalEnergyOrFuel: "28.0 L Diesel", teuHandled: 68, intensityMetric: "0.41 L/TEU", co2Scope1Kg: 75, co2Scope2Kg: 0, verifiedHash: "TRK3105-V104S" }
    ]
  },

  // =========================================================================
  // 4. CONTAINER BAYS (4 Yard Storage Blocks linked to vessels + ePort + Feeders F-02 & F-03)
  // =========================================================================
  {
    id: "BAY-A1",
    category: "BAYS",
    code: "Bay A1",
    name: "Container Bay A1 (West Yard Block A)",
    subtitle: "e-RTG Block A · Serving SPIRIT OF MUMBAI & GLORY",
    statusLabel: "Stacking",
    statusTone: "GREEN",
    statusSubtext: "412 / 500 TEU · Feeder F-02 (1,260 kW)",
    progressPercent: 82,
    distanceOrRemainingText: "88 slots free",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-STS-CATLAI-B2",
    berthName: "Linked to Berth B1 & B2",
    bayAssignment: "Rows A–F · 4 Tiers High · 2 e-RTG",
    speedOrRate: "36 moves/hr (2 e-RTG)",
    cargoSummary: "412 / 500 TEU (82% Full)",
    position3D: [-18, 2.5, -8.5],
    cameraOffset: [-10, 18, 12],
    inspectorRows: [
      { label: "Container Bay", value: "Bay A1 (Dry Import / Export)", highlight: true },
      { label: "Substation Feeder", value: "Feeder F-02 (22.0 kV · 1,260 kW)" },
      { label: "Current Occupancy", value: "412 / 500 TEU (82% Full)", highlight: true },
      { label: "Active Yard Gantries", value: "e-RTG #01 & e-RTG #02 (Busbar)" },
      { label: "Serving Vessels", value: "SPIRIT OF MUMBAI & TAN CANG GLORY" },
      { label: "Yard Efficiency", value: "5.16 kWh / TEU (Zero Diesel)" }
    ],
    drillDownTitle: "Container Bay A1 — ePort Container Manifest & Feeder F-02 (e-RTG) Telemetry",
    drillDownSubtitle: "Electrified Rubber-Tired Gantry (e-RTG) busbar power profile (Feeder F-02) and live ePort container slot inventory",
    chartTitle: "Feeder F-02 e-RTG Yard Gantry Active Power (kW) & Bus Voltage (kV)",
    chartPrimaryLabel: "e-RTG Feeder Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Feeder Voltage",
    chartSecondaryUnit: "kV",
    feederReport: {
      feederCode: "F-02 / RTG-BLOCK-A",
      feederName: "Feeder Yard e-RTG Block A & B (22kV Busbar)",
      protocol: "IEC 61850 / Navis N4 TOS Sync",
      meterId: "MTR-STS-CATLAI-B2",
      voltageKv: "22.00 kV",
      currentAmps: 58.2,
      activePowerKw: 1260,
      reactivePowerKvar: 210,
      powerFactor: 0.97,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "14,200 kWh (Zone 2 Yard Total)",
      carbonScope1Kg: 0,
      carbonScope2Kg: 10254,
      intensityPerTeu: "5.16 kWh / TEU (3.72 kgCO₂e / TEU)"
    },
    telemetrySeries: [
      { time: "06:00", primaryVal: 680, secondaryVal: 22.1, tertiaryVal: 28, statusNote: "Morning shift e-RTG #01 & #02 energized" },
      { time: "08:30", primaryVal: 1180, secondaryVal: 22.0, tertiaryVal: 36, statusNote: "Stacking inbound containers from STS-01" },
      { time: "11:00", primaryVal: 1260, secondaryVal: 21.9, tertiaryVal: 38, statusNote: "Simultaneous import stacking & export retrieval" },
      { time: "13:45", primaryVal: 1210, secondaryVal: 22.0, tertiaryVal: 36, statusNote: "Slot A1-08 reserved for incoming Truck TRK-1092" }
    ],
    containersManifest: [
      { containerNo: "CMAU4920182", sizeType: "40HC", baySlot: "Bay A1 · Row B Slot 08", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-419", commodity: "Electronic Packaging Components", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 21400 },
      { containerNo: "GSLU4412990", sizeType: "40GP", baySlot: "Bay A1 · Row C Slot 19", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-MACHINERY-03", commodity: "Industrial Machinery (Akita - Auckland)", vesselVoyage: "GSL KITHIRA 443S", weightKg: 26900 },
      { containerNo: "TCNU8831204", sizeType: "40HC", baySlot: "Bay A1 · Row B Slot 14", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-CATLAI-420", commodity: "Industrial Textiles", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 23600 },
      { containerNo: "SNPU3091844", sizeType: "40GP", baySlot: "Bay A1 · Row E Slot 42", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-HPH-SGN19", commodity: "North-South FMCG & Retail Goods", vesselVoyage: "TAN CANG GLORY 104S", weightKg: 23100 }
    ],
    historicalReports: [
      { voyageOrShift: "28/09 · Phục vụ Voyage 056N (Berth B2 ↔ Bay A1)", date: "28/09/2026", totalEnergyOrFuel: "4,680 kWh (e-RTG #01/02)", teuHandled: 910, intensityMetric: "5.14 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 3379, verifiedHash: "BAYA1-V056N" },
      { voyageOrShift: "27/09 · Phục vụ Voyage 104S (Berth B1 ↔ Bay A1)", date: "27/09/2026", totalEnergyOrFuel: "6,190 kWh (e-RTG #01/02)", teuHandled: 1200, intensityMetric: "5.16 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 4470, verifiedHash: "BAYA1-V104S" },
      { voyageOrShift: "21/09 · Phục vụ Voyage 103S (Berth B1 ↔ Bay A1)", date: "21/09/2026", totalEnergyOrFuel: "6,080 kWh (e-RTG #01/02)", teuHandled: 1180, intensityMetric: "5.15 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 4390, verifiedHash: "BAYA1-V103S" }
    ]
  },
  {
    id: "BAY-B2",
    category: "BAYS",
    code: "Bay B2",
    name: "Container Bay B2 (Central Yard Block B)",
    subtitle: "Primary Discharge Bay for MV SPIRIT OF MUMBAI",
    statusLabel: "Receiving",
    statusTone: "BLUE",
    statusSubtext: "365 / 450 TEU · TRK-2481 Arriving",
    progressPercent: 81,
    distanceOrRemainingText: "85 slots free",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-STS-CATLAI-B2",
    berthName: "Linked to Berth B2 (STS-02)",
    bayAssignment: "Rows A–F · 4 Tiers High · e-RTG #03",
    speedOrRate: "32 moves/hr",
    cargoSummary: "365 / 450 TEU (81% Full)",
    position3D: [-2, 2.5, -8.5],
    cameraOffset: [6, 18, 12],
    inspectorRows: [
      { label: "Container Bay", value: "Bay B2 (Central Transshipment)", highlight: true },
      { label: "Substation Feeder", value: "Feeder F-02 (22.0 kV · Block B)" },
      { label: "Current Occupancy", value: "365 / 450 TEU (81% Full)", highlight: true },
      { label: "Incoming Truck", value: "TRK-2481 (#MSCU8921040 · ETA 1m)" },
      { label: "Active Yard Gantry", value: "e-RTG #03 (Auto-Positioning)" }
    ],
    drillDownTitle: "Container Bay B2 — ePort Slot Allocation & e-RTG #03 Gantry Telemetry",
    drillDownSubtitle: "Real-time container stacking queue for MV SPIRIT OF MUMBAI and Block B e-RTG energy metrics",
    chartTitle: "Block B e-RTG #03 Power Demand (kW) & Hourly Container Moves",
    chartPrimaryLabel: "e-RTG Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Stacking Rate",
    chartSecondaryUnit: "moves/h",
    feederReport: {
      feederCode: "F-02 / RTG-BLOCK-B",
      feederName: "Feeder Yard e-RTG Block B (Central Yard)",
      protocol: "IEC 61850 / Navis N4 TOS",
      meterId: "MTR-STS-CATLAI-B2",
      voltageKv: "22.00 kV",
      currentAmps: 26.5,
      activePowerKw: 580,
      reactivePowerKvar: 95,
      powerFactor: 0.97,
      frequencyHz: 50.01,
      totalCumulativeEnergy: "6,480 kWh (Block B Today)",
      carbonScope1Kg: 0,
      carbonScope2Kg: 4679,
      intensityPerTeu: "5.12 kWh / TEU"
    },
    telemetrySeries: [
      { time: "08:00", primaryVal: 490, secondaryVal: 28, tertiaryVal: 72, statusNote: "Receiving first discharge batch from STS-02" },
      { time: "10:30", primaryVal: 610, secondaryVal: 34, tertiaryVal: 76, statusNote: "Peak twin-stacking in Rows B & C" },
      { time: "13:45", primaryVal: 580, secondaryVal: 32, tertiaryVal: 81, statusNote: "e-RTG #03 aligned over Slot B2-14 for TRK-2481" }
    ],
    containersManifest: [
      { containerNo: "MSCU8921040", sizeType: "40HC", baySlot: "Bay B2 · Row C Slot 14", isReefer: false, tempSetC: "Ambient", status: "IN_TRANSIT", bookingNo: "BKG-CATLAI-882", commodity: "Apparel & Footwear Export", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 24800 },
      { containerNo: "MEDU7741290", sizeType: "40HC", baySlot: "Bay B2 · Row B Slot 12", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-CATLAI-883", commodity: "Home Furniture & Woodwork", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 25900 },
      { containerNo: "OOLU8812044", sizeType: "20GP", baySlot: "Bay B2 · Row A Slot 04", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-CATLAI-889", commodity: "Ceramic Tiles & Building Materials", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 19400 }
    ],
    historicalReports: [
      { voyageOrShift: "28/09 · Phục vụ Voyage 056N (STS-02 → Bay B2)", date: "28/09/2026", totalEnergyOrFuel: "5,160 kWh (e-RTG #03)", teuHandled: 1008, intensityMetric: "5.12 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 3726, verifiedHash: "BAYB2-V056N" },
      { voyageOrShift: "14/09 · Phục vụ Voyage 055N (STS-02 → Bay B2)", date: "14/09/2026", totalEnergyOrFuel: "5,040 kWh (e-RTG #03)", teuHandled: 990, intensityMetric: "5.09 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 3639, verifiedHash: "BAYB2-V055N" },
      { voyageOrShift: "31/08 · Phục vụ Voyage 054N (STS-02 → Bay B2)", date: "31/08/2026", totalEnergyOrFuel: "5,280 kWh (e-RTG #03)", teuHandled: 1030, intensityMetric: "5.13 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 3812, verifiedHash: "BAYB2-V054N" }
    ]
  },
  {
    id: "BAY-R1",
    category: "BAYS",
    code: "Reefer Bay R1",
    name: "Reefer Bay R1 (Zone 3 Cold Chain Racks)",
    subtitle: "480 Reefer Plugs · VinaSeafood Cold Chain (-22 °C)",
    statusLabel: "Cooling",
    statusTone: "AMBER",
    statusSubtext: "353 / 480 Plugs · Feeder F-03 (1,650 kW)",
    progressPercent: 88,
    distanceOrRemainingText: "127 plugs free",
    linkedVesselId: "VSL-01",
    linkedVesselName: "MV SPIRIT OF MUMBAI",
    useCaseId: "UC-01",
    meterModalId: "MTR-REEFER-ZONE3",
    berthName: "Linked to Berth B2 & B3",
    bayAssignment: "Zone 3 · 480 Reefer Power Racks",
    speedOrRate: "1,650 kW Cooling Load",
    cargoSummary: "240 VinaSeafood + 113 ONE APUS Reefers",
    position3D: [14, 2.5, -8.5],
    cameraOffset: [22, 18, 12],
    inspectorRows: [
      { label: "Container Bay", value: "Reefer Bay R1 (Zone 3 Cold Chain)", highlight: true },
      { label: "Substation Feeder", value: "Feeder F-03 (21.9 kV · 1,650 kW)" },
      { label: "Active Reefer Plugs", value: "353 / 480 Plugs Connected", highlight: true },
      { label: "Set Temperature", value: "-22.0 °C to -25.0 °C (Zero Excursion)" },
      { label: "Cumulative Energy", value: "12,400 kWh (51.6 kWh / Reefer Box)" },
      { label: "Solar PV Offset", value: "Rooftop PV Offsetting 42% Daytime Load" }
    ],
    drillDownTitle: "Reefer Bay R1 (Zone 3) — Cold-Chain Thermal IoT & Feeder F-03 Sub-Meter Report",
    drillDownSubtitle: "Continuous 380V rack power metering and return-air temperature compliance for 240 VinaSeafood export reefers",
    chartTitle: "Feeder F-03 Reefer Cooling Power (kW) & Mean Return-Air Temp (°C)",
    chartPrimaryLabel: "Cooling Load",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Return Temp",
    chartSecondaryUnit: "°C",
    feederReport: {
      feederCode: "F-03 / MTR-REEFER-Z3",
      feederName: "Feeder Reefer Yard 480 Plugs (Zone 3 Cold Chain)",
      protocol: "Modbus TCP / Cold-Chain IoT Sensors",
      meterId: "MTR-REEFER-ZONE3",
      voltageKv: "21.90 kV",
      currentAmps: 76.4,
      activePowerKw: 1650,
      reactivePowerKvar: 310,
      powerFactor: 0.96,
      frequencyHz: 49.99,
      totalCumulativeEnergy: "12,400 kWh (UC-01) · 10,800 kWh (Zone 3 Baseline)",
      carbonScope1Kg: 0,
      carbonScope2Kg: 8954,
      intensityPerTeu: "51.6 kWh / Reefer Box (100% Thermal SLA)"
    },
    telemetrySeries: [
      { time: "07:15", primaryVal: 1120, secondaryVal: -22.1, tertiaryVal: 210, statusNote: "210 reefer plugs active in Rows A–D" },
      { time: "09:00", primaryVal: 1380, secondaryVal: -22.0, tertiaryVal: 285, statusNote: "VinaSeafood shrimp reefers plugged in from Berth B2" },
      { time: "11:00", primaryVal: 1540, secondaryVal: -21.9, tertiaryVal: 353, statusNote: "All 353 units connected; Solar PV supplying 1,650 kW" },
      { time: "13:30", primaryVal: 1650, secondaryVal: -21.8, tertiaryVal: 353, statusNote: "Midday ambient heat peak (32.4°C); compressors modulating" },
      { time: "16:00", primaryVal: 1490, secondaryVal: -22.1, tertiaryVal: 353, statusNote: "Thermal equilibrium stabilized across all racks" }
    ],
    containersManifest: [
      { containerNo: "TCLU9821041", sizeType: "40HC", baySlot: "Bay R1 · Rack A-04", isReefer: true, tempSetC: "-22.0°C", status: "PLUGGED_IN", bookingNo: "BKG-VINASEAFOOD-01", commodity: "Frozen Black Tiger Shrimp (Singapore)", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 26400 },
      { containerNo: "VNLU5520188", sizeType: "40HC", baySlot: "Bay R1 · Rack B-12", isReefer: true, tempSetC: "-25.0°C", status: "PLUGGED_IN", bookingNo: "BKG-TUNA-EXP05", commodity: "Ocean Yellowfin Tuna Loin", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 27100 },
      { containerNo: "SZLU9041120", sizeType: "40HC", baySlot: "Bay R1 · Rack C-08", isReefer: true, tempSetC: "-18.0°C", status: "PLUGGED_IN", bookingNo: "BKG-VINASEAFOOD-08", commodity: "Frozen Pangasius Fillet", vesselVoyage: "SPIRIT OF MUMBAI 056N", weightKg: 26800 },
      { containerNo: "NYKU5091821", sizeType: "40HC", baySlot: "Bay R1 · Rack D-28", isReefer: true, tempSetC: "+4.0°C", status: "PLUGGED_IN", bookingNo: "BKG-PHARMA-NL09", commodity: "Chilled Medical Diagnostics (Rotterdam)", vesselVoyage: "ONE APUS 012W", weightKg: 19600 }
    ],
    historicalReports: [
      { voyageOrShift: "Voyage 056N (Current)", date: "28/09/2026", totalEnergyOrFuel: "12,400 kWh", teuHandled: 240, intensityMetric: "51.6 kWh/Box", co2Scope1Kg: 0, co2Scope2Kg: 8954, verifiedHash: "MTR-REEFER-056N" },
      { voyageOrShift: "Voyage 055N", date: "14/09/2026", totalEnergyOrFuel: "12,100 kWh", teuHandled: 235, intensityMetric: "51.5 kWh/Box", co2Scope1Kg: 0, co2Scope2Kg: 8737, verifiedHash: "MTR-REEFER-055N" },
      { voyageOrShift: "Voyage 054N", date: "31/08/2026", totalEnergyOrFuel: "12,850 kWh", teuHandled: 245, intensityMetric: "52.4 kWh/Box", co2Scope1Kg: 0, co2Scope2Kg: 9279, verifiedHash: "MTR-REEFER-054N" }
    ]
  },
  {
    id: "BAY-C1",
    category: "BAYS",
    code: "Bay C1",
    name: "Container Bay C1 (South-East Export Yard)",
    subtitle: "Pre-Staged for MV ONE APUS (Berth B3) + e-RTG Busbar",
    statusLabel: "Pre-Staged",
    statusTone: "BLUE",
    statusSubtext: "290 / 450 TEU · Feeder F-02 (650 kW)",
    progressPercent: 64,
    distanceOrRemainingText: "160 slots free",
    linkedVesselId: "VSL-02",
    linkedVesselName: "MV ONE APUS",
    useCaseId: "UC-02",
    meterModalId: "MTR-RF-Y3-02",
    berthName: "Linked to Berth B2 & B3",
    bayAssignment: "Rows A–F · South Block · e-RTG #04",
    speedOrRate: "28 moves/hr (e-RTG #04)",
    cargoSummary: "290 / 450 TEU (64% Full)",
    position3D: [28, 2.5, -8.5],
    cameraOffset: [34, 18, 12],
    inspectorRows: [
      { label: "Container Bay", value: "Bay C1 (South Export Staging)", highlight: true },
      { label: "Assigned Vessel", value: "MV ONE APUS (012W) & MUMBAI (056N)" },
      { label: "Pre-Staged Cargo", value: "290 EU-Bound Export TEU Ready", highlight: true },
      { label: "Active Yard Gantry", value: "e-RTG #04 (22kV Regen Busbar)" },
      { label: "Rooftop Solar Feed", value: "+1,820 kW CFS Solar Array (845 W/m²)" }
    ],
    drillDownTitle: "Container Bay C1 — EU ETS Export Manifest & e-RTG #04 Regen Busbar Telemetry",
    drillDownSubtitle: "Pre-staged Rotterdam export containers and e-RTG #04 regenerative lowering power telemetry on Feeder F-02",
    chartTitle: "Bay C1 e-RTG #04 Active Power (kW) & Regenerative Recovery Efficiency (%)",
    chartPrimaryLabel: "e-RTG Power",
    chartPrimaryUnit: "kW",
    chartSecondaryLabel: "Regen Efficiency",
    chartSecondaryUnit: "%",
    feederReport: {
      feederCode: "F-02 / RTG-BLOCK-C1",
      feederName: "Feeder Yard e-RTG Block C1 & Regenerative Busbar (22kV)",
      protocol: "Modbus TCP / IEC 61850 MMS",
      meterId: "MTR-RF-Y3-02",
      voltageKv: "22.00 kV",
      currentAmps: 39.4,
      activePowerKw: 650,
      reactivePowerKvar: 85,
      powerFactor: 0.98,
      frequencyHz: 50.02,
      totalCumulativeEnergy: "3,450 kWh Recorded (Regen Offset 24%)",
      carbonScope1Kg: 0,
      carbonScope2Kg: 2491,
      intensityPerTeu: "5.08 kWh / TEU (Zero Diesel e-RTG Busbar)"
    },
    telemetrySeries: [
      { time: "04:00", primaryVal: 320, secondaryVal: 95.0, tertiaryVal: 25.5, statusNote: "Off-peak export container pre-staging on EVN night tariff" },
      { time: "10:00", primaryVal: 650, secondaryVal: 78.0, tertiaryVal: 24.8, statusNote: "e-RTG #04 marshaling VGM export containers in Rows A–C" },
      { time: "14:15", primaryVal: 740, secondaryVal: 82.0, tertiaryVal: 28.2, statusNote: "High-speed export feeding to Berth B2 & Berth B3" },
      { time: "15:30", primaryVal: 680, secondaryVal: 84.0, tertiaryVal: 31.0, statusNote: "Regenerative hoist recovery capping yard feeder demand" }
    ],
    containersManifest: [
      { containerNo: "ONEY8401923", sizeType: "40HC", baySlot: "Bay C1 · Row A Slot 02", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-SAMSUNG-EU02", commodity: "Consumer Electronics (Rotterdam Gateway)", vesselVoyage: "ONE APUS 012W", weightKg: 22900 },
      { containerNo: "ONEU7710294", sizeType: "40HC", baySlot: "Bay C1 · Row A Slot 06", isReefer: false, tempSetC: "Ambient", status: "STACKED_YARD", bookingNo: "BKG-SAMSUNG-EU02", commodity: "Precision Display Panels (EU ETS Ready)", vesselVoyage: "ONE APUS 012W", weightKg: 21800 }
    ],
    historicalReports: [
      { voyageOrShift: "28/09 · Voyage 012W (Berth B3 ↔ Bay C1 e-RTG)", date: "28/09/2026", totalEnergyOrFuel: "3,450 kWh (Regen 24%)", teuHandled: 680, intensityMetric: "5.07 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 2491, verifiedHash: "BAYC1-V012W" },
      { voyageOrShift: "10/09 · Voyage 011W (Berth B3 ↔ Bay C1 e-RTG)", date: "10/09/2026", totalEnergyOrFuel: "3,200 kWh (Regen 23%)", teuHandled: 630, intensityMetric: "5.08 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 2310, verifiedHash: "BAYC1-V011W" },
      { voyageOrShift: "24/08 · Voyage 010W (Berth B3 ↔ Bay C1 e-RTG)", date: "24/08/2026", totalEnergyOrFuel: "3,510 kWh (Regen 24%)", teuHandled: 690, intensityMetric: "5.09 kWh/TEU", co2Scope1Kg: 0, co2Scope2Kg: 2534, verifiedHash: "BAYC1-V010W" }
    ]
  }
];
