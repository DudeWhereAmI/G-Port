export type UserRole = "ADMIN" | "TECHNICAL_SPECIALIST" | "OPERATIONS_SPECIALIST" | "FINANCIAL_ACCOUNTANT" | "VIEWER" | null;
export type TenantType = "TERMINAL_OPERATOR" | "OCEAN_CARRIER" | "LOGISTICS_3PL" | "PORT_MARINE_SERVICES" | null;

export type SubPageId = 
  | "OVERVIEW" 
  | "INPUT_LAYER" 
  | "MODULE_1_FORECAST" 
  | "MODULE_2_MEASUREMENT" 
  | "MODULE_3_OPTIMIZATION" 
  | "VESSEL_SCHEDULE"
  | "VESSEL_CARBON_INVOICE" 
  | "ECO_CALCULATOR"
  | "PARTNERS";

export interface Asset {
  id: string;
  activityId: string;
  activityLabel: string;
  tenantId: string;
  businessType: string;
  zoneId?: string;
  data: Record<string, string>;
  createdAt: string;
}

export interface OpLog {
  id: string;
  logActivityId: string;
  activityName: string;
  activityDate: string;
  assetId: string;
  activityCategoryId: string;
  activityLabel: string;
  data: Record<string, string>;
  timestamp: string;
  shift?: string;
  source: "AUTO" | "BATCH" | "MANUAL";
}

// 01. Lớp Đầu Vào
export interface TosVesselSchedule {
  id: string;
  vesselName: string;
  imoNumber: string;
  carrier: string;
  voyage: string;
  berth: string;
  eta: string;
  ata?: string;
  etd: string;
  atd?: string;
  status: "SCHEDULED" | "ARRIVING" | "BERTHED" | "OPERATING" | "DEPARTED";
  plannedTeu: number;
  handledTeu: number;
  assignedCranes: number;
  reeferContainers: number;
  opsEligible: boolean;
  opsConnected: boolean;
  serviceType: "MAINLINE" | "FEEDER";
}

export interface PointToPointSchedule {
  id: string;
  useCaseId?: string;
  originPort: string;
  originCode: string;
  destinationPort: string;
  destinationCode: string;
  vesselName: string;
  voyage: string;
  carrier: string;
  etd: string;
  eta: string;
  transitDays: number;
  transitHours: number;
  serviceType: string;
  carbonEmissionEstKgPerTeu: number;
  greenCorridor: boolean;
}

export interface PvSystemStatus {
  totalCapacityKwp: number;
  currentPowerKw: number;
  dailyYieldKwh: number;
  monthlyYieldMwh: number;
  inverterEfficiency: number;
  status: "OPTIMAL" | "DERATING" | "OFFLINE";
  solarIrradianceGhi: number; // W/m2
}

export interface BessSystemStatus {
  totalCapacityKwh: number;
  ratedPowerKw: number;
  socPercent: number; // State of Charge 0-100
  sohPercent: number; // State of Health
  currentPowerKw: number; // Positive = discharging, Negative = charging
  mode: "PEAK_SHAVING" | "ARBITRAGE" | "STANDBY" | "MANUAL";
  pcsStatus: "ACTIVE" | "STANDBY" | "FAULT";
  cellTempAvgCelsius: number;
  cyclesCount: number;
}

export interface ScadaFeederMetric {
  id: string;
  name: string;
  zone: string;
  voltageKv: number;
  currentAmps: number;
  activePowerKw: number;
  reactivePowerKvar: number;
  powerFactor: number;
  frequencyHz: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface WeatherSensorData {
  solarIrradiance: number; // W/m2
  temperatureCelsius: number;
  humidityPercent: number;
  windSpeedMps: number;
  rainfallMm: number;
  uvIndex: number;
  updatedAt: string;
}

export interface ElectricityTariffTou {
  normalRateVnd: number; // 1,685 VND/kWh
  peakRateVnd: number;   // 3,076 VND/kWh
  offPeakRateVnd: number;// 1,100 VND/kWh
  currentPeriod: "PEAK" | "NORMAL" | "OFF_PEAK";
  contractDemandKw: number; // 8,500 kW
  currentDemandKw: number;
  gridEmissionFactor: number; // 0.7221 kgCO2e/kWh
}

// 02. Module 1: Dự Báo
export interface ForecastInterval {
  time: string;
  hour: number;
  baselineDemandKw: number;
  lowScenarioKw: number; // P10
  highScenarioKw: number; // P90
  pvGenerationKw: number;
  netDemandKw: number;
  thresholdKw: number;
  exceedanceProbabilityPercent: number;
  berthActivityFactor: number;
  note?: string;
}

// 03. Module 2: Đo Lường & Carbon
export interface ZoneEmissionSummary {
  zoneId: string;
  zoneName: string;
  electricityKwh: number;
  fuelLiters: number;
  scope1Co2Kg: number;
  scope2Co2Kg: number;
  totalCo2Kg: number;
  sharePercent: number;
}

// 04. Module 3: Tối Ưu Hóa & Điều Khiển
export interface DispatchSetpoint {
  timestamp: string;
  targetGridKw: number;
  bessCommandKw: number; // + discharge, - charge
  pvCurtailmentKw: number;
  flexibleLoadReductionKw: number;
  estimatedSavingVnd: number;
  estimatedCo2AvoidedKg: number;
}

// 05. Hóa Đơn Carbon Điện Tử (e-Carbon Invoice)
export interface CarbonInvoice {
  invoiceNumber: string;
  issueDate: string;
  vesselName: string;
  imoNumber: string;
  carrierName: string;
  voyageNumber: string;
  berth: string;
  arrivalTimestamp: string;
  departureTimestamp: string;
  hotelingDurationHours: number;
  teuHandled: number;
  servicePackage: "BASIC" | "GREEN_OPS_CERTIFIED" | "NET_ZERO_PORT_CALL";
  
  // Năng lượng & Nhiên liệu tiêu thụ (Energy & Fuel Consumption)
  opsElectricityKwh: number;
  stsCraneElectricityKwh: number;
  reeferElectricityKwh: number;
  totalElectricityKwh: number; // Tổng điện tiêu thụ (kWh)
  
  terminalTractorFuelLiters: number;
  tugboatFuelLiters: number;
  auxEngineBerthFuelLiters: number;
  totalFuelLiters: number; // Tổng nhiên liệu tiêu thụ (Liters)
  totalFuelMetricTons?: number; // Quy đổi tấn dầu (Metric Tons)
  
  // Phát thải quy đổi đo lường thực tế (Scope 1 Direct Fuel + Scope 2 Indirect Electricity)
  scope1EmissionsKg: number; // Nhiên liệu đốt trực tiếp (Tàu lai + Xe kéo + Máy phụ)
  scope2EmissionsKg: number; // Điện lưới tiêu thụ (STS + Reefer + OPS)
  totalEmissionsKg: number;
  emissionPerTeuKg: number; // kgCO2e/TEU
  emissionSavedByOpsKg?: number; // (Tùy chọn - không áp dụng tính hóa đơn)
  
  // Tài chính & Chứng nhận
  carbonFeeTotalVnd: number;
  auditHash: string; // SHA-256 for IMO/DCSA compliance
  qrCodeUrl?: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "VERIFIED_IMO";
  useCaseId?: "UC-01" | "UC-02" | "UC-03" | "UC-04";
}

// 06. Bộ 4 Ca Vận Hành Trọng Điểm (4 Core Operational Use Cases)
export interface OperationalUseCase {
  id: "UC-01" | "UC-02" | "UC-03" | "UC-04";
  code: string;
  title: string;
  subtitle: string;
  category: "INTRA_ASIA_REEFER" | "EUROPE_DEEP_SEA" | "TRANS_PACIFIC_DRY" | "GREEN_COASTAL_FEEDER";
  vesselName: string;
  voyageNumber: string;
  imoNumber: string;
  carrierName: string;
  route: {
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    berth: string;
    terminal: string;
    distanceKm: number;
  };
  cargoSummary: {
    totalTeu: number;
    handledTeu: number;
    reeferUnits: number;
    commodity: string;
    targetMarket: string;
    tempSpec?: string;
  };
  portEnergyProfile: {
    stsCranesAssigned: number;
    opsConnected: boolean;
    opsVoltage: string;
    opsConsumptionKwh: number;
    stsPowerKw: number;
    reeferPowerKw: number;
    co2SavedByOpsKg: number;
    peakHourImpact: string;
  };
  status: "OPERATING" | "BERTHED" | "ARRIVING" | "DEPARTED";
  timeWindow: {
    eta: string;
    ata?: string;
    etd: string;
    atd?: string;
    hotelingHours: number;
  };
  dcsaInvoiceNumber: string;
  tariffUsd: number;
  tags: string[];
}
