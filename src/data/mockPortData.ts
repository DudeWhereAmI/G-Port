import { 
  TosVesselSchedule, 
  PvSystemStatus, 
  BessSystemStatus, 
  ScadaFeederMetric, 
  WeatherSensorData, 
  ElectricityTariffTou,
  ForecastInterval,
  ZoneEmissionSummary,
  CarbonInvoice,
  OperationalUseCase
} from "../types/gport";

// ============================================================================
// BỘ 4 CA VẬN HÀNH CỐT LÕI (4 UNIFIED MASTER OPERATIONAL USE CASES)
// Nền tảng xuyên suốt kết nối TOS - SCADA - AI Dự Báo - Đo Lường - Tối Ưu - Eco Quote - Hóa Đơn DCSA
// ============================================================================
export const MASTER_USE_CASES: OperationalUseCase[] = [
  {
    id: "UC-01",
    code: "UC-01-REEFER-ASIA",
    title: "Intra-Asia Route - High-Density Cold Chain (Reefer Cargo)",
    subtitle: "Feeder vessel transporting seafood export connected to 6.6kV OPS Shore Power at Cat Lai Terminal",
    category: "INTRA_ASIA_REEFER",
    vesselName: "SPIRIT OF MUMBAI",
    voyageNumber: "056N",
    imoNumber: "9845210",
    carrierName: "Ocean Network Express (ONE) / Tan Cang Shipping",
    route: {
      origin: "HO CHI MINH (CAT LAI), VIETNAM",
      originCode: "VNSGN",
      destination: "SINGAPORE (PSA PORT AUTHORITY)",
      destinationCode: "SGSIN",
      berth: "Cat Lai Terminal - Berth B2 (OPS Ready)",
      terminal: "Cat Lai Terminal B2",
      distanceKm: 1028
    },
    cargoSummary: {
      totalTeu: 2850,
      handledTeu: 1940,
      reeferUnits: 240,
      commodity: "Frozen Seafood (Black Tiger Shrimp, Pangasius Fillet) - HS: 030389",
      targetMarket: "Singapore & Southeast Asia",
      tempSpec: "-22.0°C (Reefer Yard Zone 3)"
    },
    portEnergyProfile: {
      stsCranesAssigned: 4,
      opsConnected: true,
      opsVoltage: "6.6 kV / 50 Hz",
      opsConsumptionKwh: 18200,
      stsPowerKw: 2480,
      reeferPowerKw: 1650,
      co2SavedByOpsKg: 28400,
      peakHourImpact: "Morning peak load 08:00 - 12:00 with 4 STS cranes and 240 reefer units connected"
    },
    status: "OPERATING",
    timeWindow: {
      eta: "2026-09-28 06:30",
      ata: "2026-09-28 07:15",
      etd: "2026-09-29 18:00",
      hotelingHours: 34.75
    },
    dcsaInvoiceNumber: "GPORT-INV-2026-0901",
    tariffUsd: 1840.00,
    tags: ["Cat Lai B2", "OPS Ready", "Reefer -22°C", "VinaSeafood", "DCSA Hash Verified"]
  },
  {
    id: "UC-02",
    code: "UC-02-DEEP-SEA-EUROPE",
    title: "Deep-Sea Trans-Oceanic Route - Ultra Large Container Vessel (ULCV)",
    subtitle: "14,000 TEU ocean carrier handling electronics & apparel at Cai Mep TCIT with BESS peak shaving",
    category: "EUROPE_DEEP_SEA",
    vesselName: "ONE APUS",
    voyageNumber: "012W",
    imoNumber: "9806079",
    carrierName: "Ocean Network Express (ONE) / The Alliance",
    route: {
      origin: "CAI MEP (TCIT), VIETNAM",
      originCode: "VNCMT",
      destination: "ROTTERDAM (ECT DELTA TERMINAL), NETHERLANDS",
      destinationCode: "NLRTM",
      berth: "Cai Mep TCIT - Berth 01",
      terminal: "TCIT Deep-Sea Terminal",
      distanceKm: 9850
    },
    cargoSummary: {
      totalTeu: 3400,
      handledTeu: 450,
      reeferUnits: 380,
      commodity: "Consumer Electronics & Precision Equipment (EU ETS MRN compliant) - HS: 847130",
      targetMarket: "European Union (Rotterdam / Antwerp Gateway)",
      tempSpec: "Ambient & Chilled Reefer +4.0°C"
    },
    portEnergyProfile: {
      stsCranesAssigned: 5,
      opsConnected: true,
      opsVoltage: "22 kV / 6.6 kV Dual Bus",
      opsConsumptionKwh: 24500,
      stsPowerKw: 3200,
      reeferPowerKw: 1850,
      co2SavedByOpsKg: 38200,
      peakHourImpact: "Induces P90 peak at 14:00 - 16:00 when 5 Super Post-Panamax STS cranes ramp up, triggering 1.5MW BESS discharge"
    },
    status: "BERTHED",
    timeWindow: {
      eta: "2026-09-28 14:00",
      ata: "2026-09-28 14:20",
      etd: "2026-09-30 08:00",
      hotelingHours: 41.67
    },
    dcsaInvoiceNumber: "GPORT-INV-2026-0902",
    tariffUsd: 1760.00,
    tags: ["Cai Mep TCIT", "ULCV 14,000 TEU", "BESS Peak Shaving", "EU ETS Ready", "Net-Zero Port Call"]
  },
  {
    id: "UC-03",
    code: "UC-03-TRANS-PACIFIC-DRY",
    title: "Trans-Pacific & Oceania Route - Industrial Dry Cargo",
    subtitle: "Heavy machinery transport from Akita Japan to New Zealand transshipping via Cat Lai Terminal",
    category: "TRANS_PACIFIC_DRY",
    vesselName: "GSL KITHIRA",
    voyageNumber: "443S",
    imoNumber: "9385609",
    carrierName: "Tan Cang Intermodal & Maersk Partner",
    route: {
      origin: "AKITA PORT, JAPAN",
      originCode: "JPAKT",
      destination: "AUCKLAND (PORTS OF AUCKLAND), NEW ZEALAND",
      destinationCode: "NZAKL",
      berth: "Cat Lai Terminal - Berth B1",
      terminal: "Cat Lai Terminal B1 (Intermodal Hub)",
      distanceKm: 9480
    },
    cargoSummary: {
      totalTeu: 2100,
      handledTeu: 0,
      reeferUnits: 160,
      commodity: "Industrial Machinery, Automotive Parts & Structural Components - HS: 847989",
      targetMarket: "Oceania (Auckland & Melbourne)",
      tempSpec: "Dry General Cargo Standard"
    },
    portEnergyProfile: {
      stsCranesAssigned: 3,
      opsConnected: false,
      opsVoltage: "6.6 kV Grid Ready",
      opsConsumptionKwh: 0,
      stsPowerKw: 1800,
      reeferPowerKw: 720,
      co2SavedByOpsKg: 18600,
      peakHourImpact: "Leverages CFS rooftop solar PV generation (1,820 kW) during peak daylight hours 10:00 - 14:00"
    },
    status: "ARRIVING",
    timeWindow: {
      eta: "2026-09-29 02:00",
      etd: "2026-09-30 22:00",
      hotelingHours: 44.00
    },
    dcsaInvoiceNumber: "GPORT-INV-2026-0903",
    tariffUsd: 22303.36,
    tags: ["Akita - Auckland", "Cat Lai B1 Transshipment", "Solar PV Hub", "e-Truck Intermodal"]
  },
  {
    id: "UC-04",
    code: "UC-04-GREEN-COASTAL-FEEDER",
    title: "Green Coastal Feeder Corridor & Electric Barge Logistics",
    subtitle: "North-South agricultural corridor connecting Hai Phong, Cat Lai and Singapore with night-time BESS charging",
    category: "GREEN_COASTAL_FEEDER",
    vesselName: "TAN CANG GLORY",
    voyageNumber: "104S",
    imoNumber: "9632480",
    carrierName: "Tan Cang Shipping / SNP Domestic",
    route: {
      origin: "HAI PHONG (TC-HICT), VIETNAM",
      originCode: "VNHPH",
      destination: "SINGAPORE (JURONG PORT)",
      destinationCode: "SGSIN",
      berth: "Cat Lai Terminal - Berth B1 / Hiep Phuoc Feeder Wharf",
      terminal: "SNP Feeder & Barge Terminal",
      distanceKm: 1045
    },
    cargoSummary: {
      totalTeu: 1200,
      handledTeu: 1200,
      reeferUnits: 85,
      commodity: "Agricultural Produce, Tropical Fresh Fruits & FMCG - HS: 080450",
      targetMarket: "Domestic North-South & Transshipment via Jurong Singapore",
      tempSpec: "Controlled Atmosphere Chilled +12.0°C"
    },
    portEnergyProfile: {
      stsCranesAssigned: 2,
      opsConnected: true,
      opsVoltage: "400V / 6.6 kV Feeder OPS",
      opsConsumptionKwh: 6400,
      stsPowerKw: 1100,
      reeferPowerKw: 480,
      co2SavedByOpsKg: 14200,
      peakHourImpact: "Stevedoring completed during night hours, utilizing off-peak TOU tariff to charge 3MWh BESS"
    },
    status: "DEPARTED",
    timeWindow: {
      eta: "2026-09-27 10:00",
      ata: "2026-09-27 10:30",
      etd: "2026-09-28 04:00",
      atd: "2026-09-28 04:15",
      hotelingHours: 17.75
    },
    dcsaInvoiceNumber: "GPORT-INV-2026-0904",
    tariffUsd: 1920.00,
    tags: ["North-South Feeder", "Biofuel B24", "BESS Night Charge", "IMO DCS Certified", "Audit Complete"]
  }
];

// ============================================================================
// 01. LỊCH TÀU CẬP CẢNG TOS (ALIGNED 100% VỚI 4 USE CASES)
// ============================================================================
export const MOCK_TOS_SCHEDULES: TosVesselSchedule[] = [
  {
    id: "VS-01",
    vesselName: "SPIRIT OF MUMBAI",
    imoNumber: "9845210",
    carrier: "ONE / Tân Cảng Shipping",
    voyage: "056N",
    berth: "Tân Cảng Cát Lái - Bến B2 (OPS Ready)",
    eta: "2026-09-28 06:30",
    ata: "2026-09-28 07:15",
    etd: "2026-09-29 18:00",
    status: "OPERATING",
    plannedTeu: 2850,
    handledTeu: 1940,
    assignedCranes: 4,
    reeferContainers: 240,
    opsEligible: true,
    opsConnected: true,
    serviceType: "MAINLINE"
  },
  {
    id: "VS-02",
    vesselName: "ONE APUS",
    imoNumber: "9806079",
    carrier: "Ocean Network Express (ONE)",
    voyage: "012W",
    berth: "Tân Cảng Cái Mép TCIT - Bến 01",
    eta: "2026-09-28 14:00",
    ata: "2026-09-28 14:20",
    etd: "2026-09-30 08:00",
    status: "BERTHED",
    plannedTeu: 3400,
    handledTeu: 450,
    assignedCranes: 5,
    reeferContainers: 380,
    opsEligible: true,
    opsConnected: true,
    serviceType: "MAINLINE"
  },
  {
    id: "VS-03",
    vesselName: "GSL KITHIRA",
    imoNumber: "9385609",
    carrier: "Tân Cảng Intermodal / Maersk",
    voyage: "443S",
    berth: "Tân Cảng Cát Lái - Bến B1",
    eta: "2026-09-29 02:00",
    etd: "2026-09-30 22:00",
    status: "ARRIVING",
    plannedTeu: 2100,
    handledTeu: 0,
    assignedCranes: 3,
    reeferContainers: 160,
    opsEligible: true,
    opsConnected: false,
    serviceType: "MAINLINE"
  },
  {
    id: "VS-04",
    vesselName: "TAN CANG GLORY",
    imoNumber: "9632480",
    carrier: "Tan Cang Shipping / SNP Domestic",
    voyage: "104S",
    berth: "Tân Cảng Cát Lái Bến B1 / Hiệp Phước",
    eta: "2026-09-27 10:00",
    ata: "2026-09-27 10:30",
    etd: "2026-09-28 04:00",
    atd: "2026-09-28 04:15",
    status: "DEPARTED",
    plannedTeu: 1200,
    handledTeu: 1200,
    assignedCranes: 2,
    reeferContainers: 85,
    opsEligible: true,
    opsConnected: true,
    serviceType: "FEEDER"
  },
  {
    id: "VS-05",
    vesselName: "GSL SYROS",
    imoNumber: "9488102",
    carrier: "Tân Cảng Intermodal / ONE",
    voyage: "444S",
    berth: "Tân Cảng Cát Lái - Bến B2",
    eta: "2026-10-02 18:00",
    etd: "2026-10-04 12:00",
    status: "SCHEDULED",
    plannedTeu: 2450,
    handledTeu: 0,
    assignedCranes: 4,
    reeferContainers: 190,
    opsEligible: true,
    opsConnected: false,
    serviceType: "MAINLINE"
  }
];

// ============================================================================
// 02. HỆ THỐNG ĐIỆN MẶT TRỜI MÁI CẢNG (PV SOLAR) & PIN LƯU TRỮ BESS
// ============================================================================
export const MOCK_PV_STATUS: PvSystemStatus = {
  totalCapacityKwp: 2450, // 2.45 MWp mái kho CFS & nhà điều hành
  currentPowerKw: 1820,
  dailyYieldKwh: 9640,
  monthlyYieldMwh: 284.5,
  inverterEfficiency: 98.4,
  status: "OPTIMAL",
  solarIrradianceGhi: 845 // W/m2
};

export const MOCK_BESS_STATUS: BessSystemStatus = {
  totalCapacityKwh: 3000, // 3 MWh Lithium-Iron Phosphate
  ratedPowerKw: 1500, // 1.5 MW PCS
  socPercent: 78,
  sohPercent: 96.5,
  currentPowerKw: 650, // Đang xả 650 kW hỗ trợ giờ cao điểm trưa
  mode: "PEAK_SHAVING",
  pcsStatus: "ACTIVE",
  cellTempAvgCelsius: 24.8,
  cyclesCount: 642
};

// ============================================================================
// 03. ĐO LƯỜNG LỘ FEEDER TRUNG THẾ SCADA TÂN CẢNG
// Cung cấp phụ tải cho các thiết bị phục vụ trực tiếp 4 Use Cases
// ============================================================================
export const MOCK_SCADA_FEEDERS: ScadaFeederMetric[] = [
  {
    id: "F-01",
    name: "Feeder STS Cát Lái Bến B1 & B2 (Phục vụ SPIRIT OF MUMBAI)",
    zone: "Zone 1 - Quay Crane",
    voltageKv: 22.1,
    currentAmps: 114.5,
    activePowerKw: 2480,
    reactivePowerKvar: 420,
    powerFactor: 0.98,
    frequencyHz: 50.02,
    status: "NORMAL"
  },
  {
    id: "F-02",
    name: "Feeder Bãi e-RTG Block A & B (Phục vụ xếp dỡ ONE APUS)",
    zone: "Zone 2 - Yard Container",
    voltageKv: 22.0,
    currentAmps: 58.2,
    activePowerKw: 1260,
    reactivePowerKvar: 210,
    powerFactor: 0.97,
    frequencyHz: 50.01,
    status: "NORMAL"
  },
  {
    id: "F-03",
    name: "Feeder Giàn Lạnh Reefer Yard 480 Plugs (240 Cont VinaSeafood)",
    zone: "Zone 3 - Cold Chain",
    voltageKv: 21.9,
    currentAmps: 76.4,
    activePowerKw: 1650,
    reactivePowerKvar: 310,
    powerFactor: 0.96,
    frequencyHz: 49.99,
    status: "NORMAL"
  },
  {
    id: "F-04",
    name: "Feeder OPS Điện bờ 6.6kV Bến B2 (Cấp cho SPIRIT OF MUMBAI)",
    zone: "Zone 1 - Shore Power",
    voltageKv: 6.6,
    currentAmps: 98.0,
    activePowerKw: 1050,
    reactivePowerKvar: 180,
    powerFactor: 0.98,
    frequencyHz: 50.00,
    status: "NORMAL"
  },
  {
    id: "F-05",
    name: "Feeder Trạm sạc Xe đầu kéo điện e-Truck & Cổng Cát Lái",
    zone: "Zone 4 - Gate & EV Hub",
    voltageKv: 0.4,
    currentAmps: 520.0,
    activePowerKw: 340,
    reactivePowerKvar: 45,
    powerFactor: 0.99,
    frequencyHz: 50.01,
    status: "NORMAL"
  },
  {
    id: "F-06",
    name: "Feeder Tòa nhà Điều hành & CFS Năng lượng Mặt trời",
    zone: "Zone 4 - Administration",
    voltageKv: 0.4,
    currentAmps: 280.0,
    activePowerKw: 180,
    reactivePowerKvar: 30,
    powerFactor: 0.98,
    frequencyHz: 50.02,
    status: "NORMAL"
  }
];

// ============================================================================
// 04. CẢM BIẾN THỜI TIẾT IOT & BIỂU GIÁ ĐIỆN TOU
// ============================================================================
export const MOCK_WEATHER_IOT: WeatherSensorData = {
  solarIrradiance: 845,
  temperatureCelsius: 32.4,
  humidityPercent: 68,
  windSpeedMps: 4.8,
  rainfallMm: 0.0,
  uvIndex: 8.5,
  updatedAt: "2026-09-28 11:15:00"
};

export const MOCK_TARIFF_TOU: ElectricityTariffTou = {
  normalRateVnd: 1685,
  peakRateVnd: 3076,
  offPeakRateVnd: 1100,
  currentPeriod: "PEAK",
  contractDemandKw: 8500, // Hạn mức hợp đồng P_max EVN
  currentDemandKw: 5140, // Đã giảm nhờ PV 1,820 kW và BESS 650 kW
  gridEmissionFactor: 0.7221 // kgCO2e/kWh (Hệ số lưới điện Việt Nam EVN)
};

// ============================================================================
// 05. DỰ BÁO PHỤ TẢI 24H (ALIGNED CHẶT CHẼ VỚI TIẾN TRÌNH CỦA 4 USE CASES)
// ============================================================================
export const MOCK_FORECAST_24H: ForecastInterval[] = [
  { time: "00:00", hour: 0, baselineDemandKw: 3100, lowScenarioKw: 2850, highScenarioKw: 3400, pvGenerationKw: 0, netDemandKw: 3100, thresholdKw: 8500, exceedanceProbabilityPercent: 0, berthActivityFactor: 0.4, note: "[UC-04] TAN CANG GLORY hoàn tất bốc dỡ, chuẩn bị rời bến" },
  { time: "02:00", hour: 2, baselineDemandKw: 2900, lowScenarioKw: 2700, highScenarioKw: 3200, pvGenerationKw: 0, netDemandKw: 2900, thresholdKw: 8500, exceedanceProbabilityPercent: 0, berthActivityFactor: 0.35, note: "[UC-04] Giờ thấp điểm TOU: Nạp đầy pin BESS 1,200 kWh giá rẻ 1,100đ" },
  { time: "04:00", hour: 4, baselineDemandKw: 3400, lowScenarioKw: 3100, highScenarioKw: 3800, pvGenerationKw: 0, netDemandKw: 3400, thresholdKw: 8500, exceedanceProbabilityPercent: 0, berthActivityFactor: 0.5, note: "[UC-04] Tàu rời bến an toàn lúc 04:15" },
  { time: "06:00", hour: 6, baselineDemandKw: 4800, lowScenarioKw: 4300, highScenarioKw: 5400, pvGenerationKw: 120, netDemandKw: 4680, thresholdKw: 8500, exceedanceProbabilityPercent: 1.2, berthActivityFactor: 0.7, note: "[UC-01] SPIRIT OF MUMBAI cập cầu B2, kết nối tủ nguồn điện bờ OPS" },
  { time: "08:00", hour: 8, baselineDemandKw: 6200, lowScenarioKw: 5600, highScenarioKw: 7100, pvGenerationKw: 850, netDemandKw: 5350, thresholdKw: 8500, exceedanceProbabilityPercent: 4.5, berthActivityFactor: 0.85, note: "[UC-01] 4 cẩu STS + 240 giàn lạnh Reefer VinaSeafood tăng tốc xếp dỡ" },
  { time: "10:00", hour: 10, baselineDemandKw: 7400, lowScenarioKw: 6800, highScenarioKw: 8300, pvGenerationKw: 1650, netDemandKw: 5750, thresholdKw: 8500, exceedanceProbabilityPercent: 12.0, berthActivityFactor: 0.95, note: "[UC-01] Phụ tải trưa cao điểm, Solar PV bù trừ 1,650 kW" },
  { time: "12:00", hour: 12, baselineDemandKw: 6800, lowScenarioKw: 6100, highScenarioKw: 7600, pvGenerationKw: 2100, netDemandKw: 4700, thresholdKw: 8500, exceedanceProbabilityPercent: 3.0, berthActivityFactor: 0.8, note: "Solar PV mái cảng đạt cực đại 2,100 kW, giảm phụ tải lưới" },
  { time: "14:00", hour: 14, baselineDemandKw: 8100, lowScenarioKw: 7400, highScenarioKw: 9150, pvGenerationKw: 1750, netDemandKw: 6350, thresholdKw: 8500, exceedanceProbabilityPercent: 38.5, berthActivityFactor: 1.0, note: "[UC-02] ĐỈNH PHỤ TẢI: ONE APUS cập bến Cái Mép, 5 cẩu STS chạy đồng thời. Kích hoạt BESS xả 1.5MW" },
  { time: "16:00", hour: 16, baselineDemandKw: 7600, lowScenarioKw: 6900, highScenarioKw: 8550, pvGenerationKw: 980, netDemandKw: 6620, thresholdKw: 8500, exceedanceProbabilityPercent: 18.2, berthActivityFactor: 0.95, note: "[UC-02] Duy trì cấp điện bờ OPS cho ONE APUS, ghìm tải dưới 8,500 kW" },
  { time: "18:00", hour: 18, baselineDemandKw: 6900, lowScenarioKw: 6200, highScenarioKw: 7800, pvGenerationKw: 60, netDemandKw: 6840, thresholdKw: 8500, exceedanceProbabilityPercent: 8.4, berthActivityFactor: 0.9, note: "[UC-03] Chuẩn bị bãi và ca cẩu đón GSL KITHIRA hành trình từ Akita" },
  { time: "20:00", hour: 20, baselineDemandKw: 5800, lowScenarioKw: 5200, highScenarioKw: 6500, pvGenerationKw: 0, netDemandKw: 5800, thresholdKw: 8500, exceedanceProbabilityPercent: 2.1, berthActivityFactor: 0.75, note: "Ca tối: Duy trì ổn định 2 tàu mẹ đang neo đậu tại Cát Lái và Cái Mép" },
  { time: "22:00", hour: 22, baselineDemandKw: 4200, lowScenarioKw: 3800, highScenarioKw: 4700, pvGenerationKw: 0, netDemandKw: 4200, thresholdKw: 8500, exceedanceProbabilityPercent: 0.5, berthActivityFactor: 0.55, note: "Chuyển sang ca đêm, phụ tải giảm dần" }
];

// ============================================================================
// 06. PHÂN BỔ PHÁT THẢI THEO 4 ZONE CẢNG (CHUẨN GHG PROTOCOL & GLEC)
// ============================================================================
export const MOCK_ZONE_EMISSIONS: ZoneEmissionSummary[] = [
  {
    zoneId: "ZONE_1",
    zoneName: "Zone 1: Cầu tàu, Cẩu bờ STS & Trạm Điện Bờ OPS (Bến B1, B2, TCIT)",
    electricityKwh: 34500,
    fuelLiters: 1850, // Tàu lai dắt TC-09 hỗ trợ cập cầu
    scope1Co2Kg: 4958,
    scope2Co2Kg: 24912,
    totalCo2Kg: 29870,
    sharePercent: 51.5
  },
  {
    zoneId: "ZONE_2",
    zoneName: "Zone 2: Bãi Container e-RTG & Đội Xe Đầu Kéo e-Truck",
    electricityKwh: 14200,
    fuelLiters: 3200, // Xe đầu kéo diesel & nâng rỗng bãi
    scope1Co2Kg: 8576,
    scope2Co2Kg: 10254,
    totalCo2Kg: 18830,
    sharePercent: 32.4
  },
  {
    zoneId: "ZONE_3",
    zoneName: "Zone 3: Giàn Lạnh Container Lạnh Reefer (240 Cont VinaSeafood)",
    electricityKwh: 10800,
    fuelLiters: 0,
    scope1Co2Kg: 0,
    scope2Co2Kg: 7799,
    totalCo2Kg: 7799,
    sharePercent: 13.4
  },
  {
    zoneId: "ZONE_4",
    zoneName: "Zone 4: Cổng Cảng ePort, Trạm Sạc EV Hub & Tòa Nhà CFS Solar",
    electricityKwh: 2150,
    fuelLiters: 120,
    scope1Co2Kg: 321,
    scope2Co2Kg: 1553,
    totalCo2Kg: 1874,
    sharePercent: 2.7
  }
];

// ============================================================================
// 07. HÓA ĐƠN CARBON ĐIỆN TỬ DCSA (ALIGNED 100% VỚI 4 USE CASES)
// ============================================================================
export const MOCK_CARBON_INVOICES: CarbonInvoice[] = [
  {
    invoiceNumber: "GPORT-INV-2026-0901",
    issueDate: "2026-09-29",
    vesselName: "SPIRIT OF MUMBAI",
    imoNumber: "9845210",
    carrierName: "Ocean Network Express (ONE) / Tân Cảng Shipping",
    voyageNumber: "056N",
    berth: "Tân Cảng Cát Lái - Bến B2 (OPS Ready)",
    arrivalTimestamp: "2026-09-28 07:15",
    departureTimestamp: "2026-09-29 18:00 (Dự kiến)",
    hotelingDurationHours: 34.75,
    teuHandled: 2850,
    servicePackage: "GREEN_OPS_CERTIFIED",
    opsElectricityKwh: 18200,
    stsCraneElectricityKwh: 22800,
    reeferElectricityKwh: 12400,
    totalElectricityKwh: 53400, // 53.4 MWh
    terminalTractorFuelLiters: 2400,
    tugboatFuelLiters: 1800,
    auxEngineBerthFuelLiters: 0,
    totalFuelLiters: 4200, // 4,200 Liters MGO/Diesel
    totalFuelMetricTons: 3.53,
    scope1EmissionsKg: 11256,
    scope2EmissionsKg: 38560,
    totalEmissionsKg: 49816,
    emissionPerTeuKg: 17.48,
    carbonFeeTotalVnd: 99632000,
    auditHash: "3f98c21a44e59079845210056n81b67f1239aa80092c4b57",
    status: "ISSUED",
    useCaseId: "UC-01"
  },
  {
    invoiceNumber: "GPORT-INV-2026-0902",
    issueDate: "2026-09-30",
    vesselName: "ONE APUS",
    imoNumber: "9806079",
    carrierName: "Ocean Network Express (ONE) / The Alliance",
    voyageNumber: "012W",
    berth: "Tân Cảng Cái Mép TCIT - Bến 01",
    arrivalTimestamp: "2026-09-28 14:20",
    departureTimestamp: "2026-09-30 08:00 (Dự kiến)",
    hotelingDurationHours: 41.67,
    teuHandled: 3400,
    servicePackage: "NET_ZERO_PORT_CALL",
    opsElectricityKwh: 24500,
    stsCraneElectricityKwh: 29000,
    reeferElectricityKwh: 16800,
    totalElectricityKwh: 70300, // 70.3 MWh
    terminalTractorFuelLiters: 2900,
    tugboatFuelLiters: 2100,
    auxEngineBerthFuelLiters: 0,
    totalFuelLiters: 5000, // 5,000 Liters MGO/Diesel
    totalFuelMetricTons: 4.20,
    scope1EmissionsKg: 13400,
    scope2EmissionsKg: 50763,
    totalEmissionsKg: 64163,
    emissionPerTeuKg: 18.87,
    carbonFeeTotalVnd: 128326000,
    auditHash: "e7c10b55694a1239806079012w11b439c09887711d99ef87c",
    status: "DRAFT",
    useCaseId: "UC-02"
  },
  {
    invoiceNumber: "GPORT-INV-2026-0903",
    issueDate: "2026-10-01",
    vesselName: "GSL KITHIRA",
    imoNumber: "9385609",
    carrierName: "Tân Cảng Intermodal & Maersk Partner",
    voyageNumber: "443S",
    berth: "Tân Cảng Cát Lái - Bến B1",
    arrivalTimestamp: "2026-09-29 02:00 (Dự kiến)",
    departureTimestamp: "2026-09-30 22:00 (Dự kiến)",
    hotelingDurationHours: 44.00,
    teuHandled: 2100,
    servicePackage: "GREEN_OPS_CERTIFIED",
    opsElectricityKwh: 12000,
    stsCraneElectricityKwh: 16800,
    reeferElectricityKwh: 5800,
    totalElectricityKwh: 34600, // 34.6 MWh
    terminalTractorFuelLiters: 1600,
    tugboatFuelLiters: 1200,
    auxEngineBerthFuelLiters: 0,
    totalFuelLiters: 2800, // 2,800 Liters
    totalFuelMetricTons: 2.35,
    scope1EmissionsKg: 7504,
    scope2EmissionsKg: 24985,
    totalEmissionsKg: 32489,
    emissionPerTeuKg: 15.47,
    carbonFeeTotalVnd: 64978000,
    auditHash: "a1c499e018df9385609443s77b1029cfa08935c102a7b21",
    status: "DRAFT",
    useCaseId: "UC-03"
  },
  {
    invoiceNumber: "GPORT-INV-2026-0904",
    issueDate: "2026-09-28",
    vesselName: "TAN CANG GLORY",
    imoNumber: "9632480",
    carrierName: "Tan Cang Shipping / SNP Domestic",
    voyageNumber: "104S",
    berth: "Tân Cảng Cát Lái Bến B1 / Hiệp Phước",
    arrivalTimestamp: "2026-09-27 10:30",
    departureTimestamp: "2026-09-28 04:15",
    hotelingDurationHours: 17.75,
    teuHandled: 1200,
    servicePackage: "GREEN_OPS_CERTIFIED",
    opsElectricityKwh: 6400,
    stsCraneElectricityKwh: 8400,
    reeferElectricityKwh: 3600,
    totalElectricityKwh: 18400, // 18.4 MWh
    terminalTractorFuelLiters: 1100,
    tugboatFuelLiters: 950,
    auxEngineBerthFuelLiters: 0,
    totalFuelLiters: 2050, // 2,050 Liters
    totalFuelMetricTons: 1.72,
    scope1EmissionsKg: 5494,
    scope2EmissionsKg: 13287,
    totalEmissionsKg: 18781,
    emissionPerTeuKg: 15.65,
    carbonFeeTotalVnd: 37562000,
    auditHash: "8a4f91b7e651c24df9632480104s91a27e4e11c8b32d4b94f06",
    status: "VERIFIED_IMO",
    useCaseId: "UC-04"
  }
];

// ============================================================================
// 08. TRA CỨU HẢI TRÌNH POINT-TO-POINT CHUẨN DCSA
// ============================================================================
export const MOCK_POINT_TO_POINT_ROUTES = [
  {
    id: "R-01",
    useCaseId: "UC-01",
    originPort: "Ho Chi Minh (Cat Lai Terminal B2)",
    originCode: "VNSGN",
    destinationPort: "Singapore PSA Terminal",
    destinationCode: "SGSIN",
    vesselName: "SPIRIT OF MUMBAI",
    voyage: "056N",
    carrier: "ONE / Tân Cảng Shipping",
    etd: "28 Sep 2026",
    eta: "30 Sep 2026",
    transitDays: 2,
    transitHours: 0,
    serviceType: "Direct (TI1 InterAsia Express)",
    carbonEmissionEstKgPerTeu: 58.4,
    greenCorridor: true
  },
  {
    id: "R-02",
    useCaseId: "UC-02",
    originPort: "Cai Mep (TCIT Deep-Sea)",
    originCode: "VNCMT",
    destinationPort: "Rotterdam ECT Delta Terminal, Netherlands",
    destinationCode: "NLRTM",
    vesselName: "ONE APUS",
    voyage: "012W",
    carrier: "Ocean Network Express (ONE)",
    etd: "30 Sep 2026",
    eta: "24 Oct 2026",
    transitDays: 24,
    transitHours: 6,
    serviceType: "Direct (Europe-Asia Deep Sea)",
    carbonEmissionEstKgPerTeu: 54.1,
    greenCorridor: true
  },
  {
    id: "R-03",
    useCaseId: "UC-03",
    originPort: "Akita Port Container Terminal, Japan",
    originCode: "JPAKT",
    destinationPort: "Ports of Auckland (Fergusson Wharf), New Zealand",
    destinationCode: "NZAKL",
    vesselName: "GSL KITHIRA",
    voyage: "443S",
    carrier: "Tân Cảng Intermodal / Maersk",
    etd: "25 Nov 2026",
    eta: "27 Dec 2026",
    transitDays: 32,
    transitHours: 0,
    serviceType: "1 Transit (Chuyển tải qua Tân Cảng Cát Lái B1)",
    carbonEmissionEstKgPerTeu: 342.5,
    greenCorridor: true
  },
  {
    id: "R-04",
    useCaseId: "UC-04",
    originPort: "Hai Phong (TC-HICT Terminal)",
    originCode: "VNHPH",
    destinationPort: "Singapore Jurong Port",
    destinationCode: "SGSIN",
    vesselName: "TAN CANG GLORY",
    voyage: "104S",
    carrier: "Tan Cang Shipping / SNP Domestic",
    etd: "30 Sep 2026",
    eta: "02 Oct 2026",
    transitDays: 2,
    transitHours: 0,
    serviceType: "Direct (ASEAN-1 Coastal Corridor)",
    carbonEmissionEstKgPerTeu: 61.2,
    greenCorridor: true
  }
];

// ============================================================================
// 09. DANH MỤC THIẾT BỊ CẢNG & NHẬT KÝ VẬN HÀNH (ALIGNED VỚI 4 USE CASES)
// ============================================================================
export const MOCK_INITIAL_ASSETS = [
  {
    id: "AST-01",
    activityId: "sts_crane",
    activityLabel: "Cẩu bờ STS Tân Cảng #01 (Bến B2)",
    tenantId: "PORT_AUTHORITY",
    businessType: "Cảng Biển Tân Cảng Cát Lái",
    zoneId: "ZONE_1",
    data: {
      asset_name: "Cẩu bờ STS Tân Cảng #01 (Bến B2)",
      asset_id: "STS-B2-01",
      power_source: "Grid",
      rated_power_kw: "450",
      initial_capex: "125000000000"
    },
    createdAt: "2026-09-01T08:00:00Z"
  },
  {
    id: "AST-02",
    activityId: "ertg_crane",
    activityLabel: "Cẩu bãi e-RTG #08 (Điện Bãi Block A)",
    tenantId: "PORT_AUTHORITY",
    businessType: "Cảng Biển Tân Cảng",
    zoneId: "ZONE_2",
    data: {
      asset_name: "Cẩu bãi e-RTG #08 (Block A)",
      asset_id: "RTG-E08",
      power_source: "Grid",
      rated_power_kw: "220",
      initial_capex: "42000000000"
    },
    createdAt: "2026-09-01T08:00:00Z"
  },
  {
    id: "AST-03",
    activityId: "terminal_tractor",
    activityLabel: "Xe đầu kéo điện bãi e-Truck TT-12",
    tenantId: "PORT_AUTHORITY",
    businessType: "Logistics Xanh Tân Cảng",
    zoneId: "ZONE_2",
    data: {
      asset_name: "Xe đầu kéo điện e-Truck TT-12",
      asset_id: "TT-12",
      fuel_type: "Electric (Pin LFP 280 kWh)",
      engine_max_power_kw: "180",
      initial_capex: "5200000000"
    },
    createdAt: "2026-09-01T08:00:00Z"
  },
  {
    id: "AST-04",
    activityId: "tugboat",
    activityLabel: "Tàu lai dắt Tân Cảng 09 (Cái Mép TCIT)",
    tenantId: "PORT_MARINE_SERVICES",
    businessType: "Dịch vụ Hàng hải Tân Cảng",
    zoneId: "ZONE_1",
    data: {
      asset_name: "Tàu lai dắt TC-09 (4000 BHP)",
      asset_id: "TUG-TC09",
      fuel_type: "Diesel B24 Biofuel",
      engine_max_power_kw: "2980",
      initial_capex: "85000000000"
    },
    createdAt: "2026-09-01T08:00:00Z"
  }
];

export const MOCK_INITIAL_LOGS = [
  {
    id: "LOG-01",
    logActivityId: "sts_crane",
    activityName: "Bốc dỡ tàu SPIRIT OF MUMBAI 056N [UC-01] (Ca sáng)",
    activityDate: "2026-09-28",
    assetId: "AST-01",
    activityCategoryId: "ZONE_1",
    activityLabel: "Cẩu bờ STS #01 Bến B2",
    data: {
      operating_hours: "8",
      electricity_kwh: "1850",
      fuel_liters: "0",
      teu_handled: "240"
    },
    timestamp: "2026-09-28T14:00:00Z",
    shift: "Ca sáng (06:00 - 14:00)",
    source: "AUTO" as const
  },
  {
    id: "LOG-02",
    logActivityId: "ertg_crane",
    activityName: "Xếp dỡ bãi container phục vụ tàu ONE APUS 012W [UC-02]",
    activityDate: "2026-09-28",
    assetId: "AST-02",
    activityCategoryId: "ZONE_2",
    activityLabel: "Cẩu bãi e-RTG #08 Block A",
    data: {
      operating_hours: "8",
      electricity_kwh: "980",
      fuel_liters: "0",
      teu_handled: "190"
    },
    timestamp: "2026-09-28T14:00:00Z",
    shift: "Ca sáng (06:00 - 14:00)",
    source: "AUTO" as const
  },
  {
    id: "LOG-03",
    logActivityId: "terminal_tractor",
    activityName: "Kéo 240 container lạnh VinaSeafood cho tàu SPIRIT OF MUMBAI [UC-01]",
    activityDate: "2026-09-28",
    assetId: "AST-03",
    activityCategoryId: "ZONE_2",
    activityLabel: "Xe đầu kéo e-Truck TT-12",
    data: {
      operating_hours: "7.5",
      electricity_kwh: "240",
      fuel_liters: "0",
      idling_time_hrs: "0.5"
    },
    timestamp: "2026-09-28T14:00:00Z",
    shift: "Ca sáng (06:00 - 14:00)",
    source: "AUTO" as const
  },
  {
    id: "LOG-04",
    logActivityId: "tugboat",
    activityName: "Lai dắt hỗ trợ cập cầu Cái Mép cho tàu ONE APUS 012W [UC-02]",
    activityDate: "2026-09-28",
    assetId: "AST-04",
    activityCategoryId: "ZONE_1",
    activityLabel: "Tàu lai dắt TC-09",
    data: {
      operating_hours: "3.0",
      electricity_kwh: "0",
      fuel_liters: "380",
      idling_time_hrs: "0.4"
    },
    timestamp: "2026-09-28T15:00:00Z",
    shift: "Ca chiều (14:00 - 22:00)",
    source: "MANUAL" as const
  }
];

// ============================================================================
// 10. CONTAINER THỰC TẾ TRÊN HỆ THỐNG EPORT (ALIGNED VỚI 4 USE CASES)
// ============================================================================
export const MOCK_EPORT_CONTAINERS = [
  { 
    containerNo: "TCLU9821041", 
    sizeType: "40HC", 
    isReefer: true, 
    setTempC: -22, 
    status: "PLUGGED_IN", 
    gateInTime: "2026-09-28 07:30", 
    bookingNo: "BKG-VINASEAFOOD-01", 
    vesselVoyage: "SPIRIT OF MUMBAI 056N [UC-01]",
    commodity: "Thủy sản đông lạnh xuất Singapore"
  },
  { 
    containerNo: "ONEY8401923", 
    sizeType: "40HC", 
    isReefer: false, 
    setTempC: null, 
    status: "LOADED_VESSEL", 
    gateInTime: "2026-09-28 09:15", 
    bookingNo: "BKG-SAMSUNG-EU02", 
    vesselVoyage: "ONE APUS 012W [UC-02]",
    commodity: "Linh kiện điện thoại xuất Rotterdam"
  },
  { 
    containerNo: "GSLU4412990", 
    sizeType: "40GP", 
    isReefer: false, 
    setTempC: null, 
    status: "STACKED_YARD", 
    gateInTime: "2026-09-28 10:00", 
    bookingNo: "BKG-MACHINERY-03", 
    vesselVoyage: "GSL KITHIRA 443S [UC-03]",
    commodity: "Máy móc cơ khí Akita - Auckland"
  },
  { 
    containerNo: "TCGU1120034", 
    sizeType: "20GP", 
    isReefer: true, 
    setTempC: 12, 
    status: "LOADED_VESSEL", 
    gateInTime: "2026-09-27 11:45", 
    bookingNo: "BKG-AGRI-SNP04", 
    vesselVoyage: "TAN CANG GLORY 104S [UC-04]",
    commodity: "Trái cây tươi nhiệt đới Bắc Nam"
  },
  { 
    containerNo: "VNLU5520188", 
    sizeType: "40HC", 
    isReefer: true, 
    setTempC: -25, 
    status: "PLUGGED_IN", 
    gateInTime: "2026-09-28 06:10", 
    bookingNo: "BKG-TUNA-EXP05", 
    vesselVoyage: "SPIRIT OF MUMBAI 056N [UC-01]",
    commodity: "Cá ngừ đại dương Phú Yên"
  }
];

export const MOCK_SCADA_STATUS = {
  gridActivePowerKw: 5140,
  powerFactor: 0.96,
  gridFrequencyHz: 50.02,
  mainBusVoltageKv: 22.05,
  peakDemandContractKw: 8500,
  controlMode: "AUTO_PEAK_SHAVING"
};

// ============================================================================
// 11. ĐỐI TÁC CÔNG NGHỆ & THIẾT BỊ XANH
// ============================================================================
export const MOCK_PARTNERS = [
  {
    id: "p1",
    name: "Kalmar Global",
    category: "Equipment",
    logoText: "KALMAR",
    tagline: "Eco Reachstackers & Electric Terminal Tractors",
    description: "Leading manufacturer of electrified cargo handling equipment including heavy-duty e-Reachstackers and zero-emission terminal tractors.",
    impactMetric: "-85% Scope 1 Fuel Emissions",
    roiYears: "3.2 years",
    featuredTech: "Kalmar Electric Reachstacker (ERGO)",
    contactEmail: "decarb.vn@kalmarglobal.com"
  },
  {
    id: "p2",
    name: "ABB Marine & Ports",
    category: "Infrastructure",
    logoText: "ABB",
    tagline: "Onshore Power Supply (OPS) & Microgrid Control",
    description: "High-voltage shore connection solutions delivering zero-emission power directly to vessels at berth, eliminating auxiliary diesel emissions.",
    impactMetric: "-100% Hoteling Emissions at Berth",
    roiYears: "4.5 years",
    featuredTech: "ABB Shore Connection System 6.6kV/11kV",
    contactEmail: "shorepower@abb.com"
  },
  {
    id: "p3",
    name: "Siemens Energy",
    category: "Energy",
    logoText: "SIEMENS",
    tagline: "Battery Energy Storage System (BESS) & Smart Microgrid",
    description: "Grid-scale battery energy storage systems engineered for peak demand shaving, frequency regulation, and terminal solar PV smoothing.",
    impactMetric: "35% TOU electricity cost reduction",
    roiYears: "4.1 years",
    featuredTech: "Siemens SIESTORAGE BESS 3MWh",
    contactEmail: "smartport.vn@siemens-energy.com"
  },
  {
    id: "p4",
    name: "Navis / Kaleris",
    category: "Software",
    logoText: "NAVIS",
    tagline: "TOS Integration & Berth Planning Optimization",
    description: "Navis N4 terminal operating system integrated with G-Port via DCSA API standards for synchronized crane assignment and peak power forecasting.",
    impactMetric: "Audit-ready real-time synchronization",
    roiYears: "Immediate upon API link",
    featuredTech: "Navis N4 Open API for Green Energy",
    contactEmail: "integrations@kaleris.com"
  },
  {
    id: "p5",
    name: "Schneider Electric",
    category: "Infrastructure",
    logoText: "SCHNEIDER",
    tagline: "EcoStruxure Grid & Substation Automation",
    description: "Intelligent medium-voltage switchgear, revenue-grade feeder sub-metering, and native IEC 61850 / Modbus SCADA protocol integration.",
    impactMetric: "99.8% energy metering precision",
    roiYears: "2.8 years",
    featuredTech: "Premset SM6 & PowerLogic ION Meters",
    contactEmail: "port.solutions@se.com"
  }
];

// Aliases for convenience across older components
export const MOCK_VESSELS = MOCK_TOS_SCHEDULES;
export const MOCK_TARIFF = MOCK_TARIFF_TOU;
export const MOCK_WEATHER = MOCK_WEATHER_IOT;
export const MOCK_FEEDERS = MOCK_SCADA_FEEDERS;
export const MOCK_15MIN_FORECAST = MOCK_FORECAST_24H;
