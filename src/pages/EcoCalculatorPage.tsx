import React, { useState } from "react";
import { 
  Leaf, 
  MapPin, 
  ArrowUpDown, 
  ArrowLeft,
  ArrowRight,
  Calendar, 
  HelpCircle, 
  BookOpen, 
  CheckCircle2, 
  Info, 
  Ship, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter, 
  FileText, 
  FileSearch,
  FileCheck,
  FileQuestion,
  FileCheck2,
  Clock, 
  Download, 
  Zap, 
  Check, 
  ShieldCheck, 
  QrCode, 
  Bookmark as BookmarkIcon, 
  Anchor, 
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Gauge
} from "lucide-react";

interface ScheduleRecord {
  id: string;
  originName: string;
  polName: string;
  destinationName: string;
  podName: string;
  etd: string;
  eta: string;
  durationDays: number;
  transits: number;
  vesselVoyage: string;
  serviceLane: string;
  transportMode: string;
  shippingMethod: string;
  totalDistanceKm: number;
  baseCo2Kg: number;
  usdPrice: number;
  opsEligible: boolean;
  baseEnergyKwh: number;
  isDirect: boolean;
  status: "Available" | "Limited" | "Sold Out";
}

interface EcoCalculatorPageProps {
  initialShowFaq?: boolean;
  onOpenMeterModal?: (assetId?: string) => void;
}

export const EcoCalculatorPage: React.FC<EcoCalculatorPageProps> = ({ 
  initialShowFaq = false,
  onOpenMeterModal
}) => {
  // 1. Top Sub-Navigation Bar matching standard workflow: GetQuote | Port Pair List | Bookmark | My Contract
  const [activeMainTab, setActiveMainTab] = useState<"GET_QUOTE" | "PORT_PAIR_LIST" | "BOOKMARK" | "MY_CONTRACT">("GET_QUOTE");

  // 2. The 5-Step Stepper Progress Bar:
  // 1: Search Quote -> 2: GetQuote -> 3: Quote Accepted -> 4: Additional Information -> 5: Booking Submission
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // STEP 1 - INPUT CRITERIA
  const [origin, setOrigin] = useState("HO CHI MINH (CAT LAI), VIETNAM (VNSGN)");
  const [destination, setDestination] = useState("SINGAPORE, SINGAPORE (SGSIN)");
  const [polPodToggle, setPolPodToggle] = useState(false);
  const [selectedPol, setSelectedPol] = useState("CAT LAI TERMINAL B2");
  const [selectedPod, setSelectedPod] = useState("PSA SINGAPORE (PORT OF SINGAPORE AUTHORITY)");

  // Customer Status Declaration
  const [customerDeclaration, setCustomerDeclaration] = useState<"Cargo Owner" | "Agent">("Cargo Owner");
  const [haulageOption, setHaulageOption] = useState<"Merchant Haulage" | "Carrier Haulage">("Carrier Haulage");

  // Equipment & Container
  const [containerType, setContainerType] = useState<"DRY 20" | "DRY 40" | "REEFER 20" | "REEFER 40 HC" | "FOOD GRADE">("REEFER 40 HC");
  const [isFoodGrade, setIsFoodGrade] = useState(true);
  const [containerQty, setContainerQty] = useState<number>(2);
  const [cargoWeightKg, setCargoWeightKg] = useState<number>(24000);
  const [emissionType, setEmissionType] = useState<"TTW" | "WTW">("TTW"); // Tank-to-Wake vs Well-to-Wake

  // Commodity
  const [commodity, setCommodity] = useState("SEAFOOD & FROZEN AQUACULTURE PRODUCTS (HS: 030389)");

  // Date Selection
  const [departureDate, setDepartureDate] = useState("2026-09-28");
  const [dateRange, setDateRange] = useState("2 Weeks");

  // STEP 2 - CONTROLS & FILTERS
  const [sortBy, setSortBy] = useState<"ETD" | "ETA" | "CHEAPEST" | "QUICKEST" | "LOWEST_CO2">("LOWEST_CO2");
  const [serviceLaneFilter, setServiceLaneFilter] = useState("All");
  const [selectedRecordId, setSelectedRecordId] = useState<string>("rec-1");
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>("rec-1");
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Freight View Popover
  const [showFreightViewDropdown, setShowFreightViewDropdown] = useState(false);
  const [freightViewItems, setFreightViewItems] = useState({
    basicOceanFreight: true,
    originCharge: true,
    destinationCharge: true
  });
  const [tempFreightViewItems, setTempFreightViewItems] = useState({
    basicOceanFreight: true,
    originCharge: true,
    destinationCharge: true
  });

  // Tariff & Currency Dropdown
  const [showTariffDropdown, setShowTariffDropdown] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "VND">("USD");

  // Price Alerts Toggle
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(false);

  // STEP 3 - VALUE ADDED SERVICES (OPS, Solar Reefer, Biofuel)
  const [vasOpsSubscribed, setVasOpsSubscribed] = useState(true);
  const [vasSolarReeferSubscribed, setVasSolarReeferSubscribed] = useState(true);
  const [vasBiofuelSubscribed, setVasBiofuelSubscribed] = useState(false);

  // STEP 4 - ADDITIONAL INFORMATION
  const [bookingPartyCompany, setBookingPartyCompany] = useState("SAIGON NEWPORT LOGISTICS & FORWARDING");
  const [shipperName, setShipperName] = useState("VINASEAFOOD CORP VIETNAM");
  const [carrierName, setCarrierName] = useState("OCEAN NETWORK EXPRESS (ONE) / TAN CANG SHIPPING");
  const [contactEmail, setContactEmail] = useState("operations@snp-logistics.com.vn");
  // Reefer Technical Info
  const [reeferTempDegC, setReeferTempDegC] = useState("-22.0");
  const [reeferVentCmH, setReeferVentCmH] = useState("0");
  const [reeferHumidityPct, setReeferHumidityPct] = useState("85");
  const [gensetRequired, setGensetRequired] = useState<"Yes" | "No">("Yes");
  const [drainOption, setDrainOption] = useState<"Close" | "Open">("Close");
  // International Regulatory
  const [imoNumber, setImoNumber] = useState("IMO 9845210");
  const [euEtsMrn, setEuEtsMrn] = useState("26VNSGNETS982103");
  const [taxId, setTaxId] = useState("0300892018");
  const [specialInstruction, setSpecialInstruction] = useState("Connect shore power cable to Substation Berth B2 6.6kV upon all-fast confirmation.");

  // STEP 5 - CONFIRMATION
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [exportedContract, setExportedContract] = useState<string | null>(null);

  // Modals (User Guide & FAQ)
  const [showFaqModal, setShowFaqModal] = useState(initialShowFaq);
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);

  // Recent searches
  const recentSearches = [
    { origin: "HO CHI MINH (CAT LAI), VIETNAM (VNSGN)", destination: "SINGAPORE, SINGAPORE (SGSIN)", type: "REEFER 40 HC", commodity: "SEAFOOD" },
    { origin: "CAI MEP (TCIT), VIETNAM (VNCMT)", destination: "ROTTERDAM, NETHERLANDS (NLRTM)", type: "DRY 40", commodity: "ELECTRONICS" },
    { origin: "HAI PHONG (TC-HICT), VIETNAM (VNHPH)", destination: "LOS ANGELES, USA (USLAX)", type: "REEFER 40 HC", commodity: "FRUITS" },
    { origin: "AKITA, AKITA, JAPAN (JPAKT)", destination: "AUCKLAND, NEW ZEALAND (NZAKL)", type: "DRY 40H", commodity: "ARTICLES FOR CONVEYANCE" }
  ];

  // Schedule records available across Tan Cang berths & alliance service lanes
  const scheduleRecords: ScheduleRecord[] = [
    {
      id: "rec-1",
      originName: "HO CHI MINH (CAT LAI)",
      polName: "TAN CANG CAT LAI - BERTH B2",
      destinationName: "SINGAPORE",
      podName: "PSA SINGAPORE (PORT OF SINGAPORE AUTHORITY)",
      etd: "2026-09-28",
      eta: "2026-09-30",
      durationDays: 2,
      transits: 0,
      vesselVoyage: "SPIRIT OF MUMBAI 056N",
      serviceLane: "TI1 (Tan Cang - InterAsia)",
      transportMode: "Container Vessel + Onshore Power Supply (OPS)",
      shippingMethod: "DIRECT",
      totalDistanceKm: 1028,
      baseCo2Kg: 58.40,
      usdPrice: 1840.00,
      opsEligible: true,
      baseEnergyKwh: 3400,
      isDirect: true,
      status: "Available"
    },
    {
      id: "rec-2",
      originName: "HO CHI MINH (CAT LAI)",
      polName: "TAN CANG CAT LAI - BERTH B1",
      destinationName: "SINGAPORE",
      podName: "PSA SINGAPORE (PORT OF SINGAPORE AUTHORITY)",
      etd: "2026-09-30",
      eta: "2026-10-02",
      durationDays: 2,
      transits: 0,
      vesselVoyage: "TAN CANG GLORY 104S",
      serviceLane: "ASEAN-1 (Tan Cang Express)",
      transportMode: "Feeder Vessel + Onshore Power Supply (OPS)",
      shippingMethod: "DIRECT",
      totalDistanceKm: 1028,
      baseCo2Kg: 62.90,
      usdPrice: 1720.00,
      opsEligible: true,
      baseEnergyKwh: 3550,
      isDirect: true,
      status: "Available"
    },
    {
      id: "rec-3",
      originName: "CAI MEP (TCIT)",
      polName: "TAN CANG CAI MEP TCIT",
      destinationName: "ROTTERDAM",
      podName: "ROTTERDAM ECT DELTA TERMINAL",
      etd: "2026-09-30",
      eta: "2026-10-24",
      durationDays: 24,
      transits: 0,
      vesselVoyage: "ONE APUS 012W",
      serviceLane: "Europe-Asia Express (The Alliance)",
      transportMode: "Ultra Large Container Vessel (ULCV) + OPS",
      shippingMethod: "DIRECT",
      totalDistanceKm: 9850,
      baseCo2Kg: 54.10,
      usdPrice: 1760.00,
      opsEligible: true,
      baseEnergyKwh: 3200,
      isDirect: true,
      status: "Available"
    },
    {
      id: "rec-4",
      originName: "AKITA, AKITA (JPAKT)",
      polName: "AKITA PORT CONTAINER TERMINAL",
      destinationName: "AUCKLAND (NZAKL)",
      podName: "PORTS OF AUCKLAND (FERGUSSON WHARF)",
      etd: "2026-11-25",
      eta: "2026-12-27",
      durationDays: 32,
      transits: 1,
      vesselVoyage: "GSL KITHIRA (443S)",
      serviceLane: "NZJ (New Zealand - Japan Express)",
      transportMode: "Deep Sea Vessel + Hub Transshipment",
      shippingMethod: "1 TRANSIT",
      totalDistanceKm: 9480,
      baseCo2Kg: 342.50,
      usdPrice: 22303.36,
      opsEligible: true,
      baseEnergyKwh: 14200,
      isDirect: false,
      status: "Available"
    },
    {
      id: "rec-5",
      originName: "AKITA, AKITA (JPAKT)",
      polName: "AKITA PORT CONTAINER TERMINAL",
      destinationName: "AUCKLAND (NZAKL)",
      podName: "PORTS OF AUCKLAND (FERGUSSON WHARF)",
      etd: "2026-12-02",
      eta: "2027-01-03",
      durationDays: 32,
      transits: 1,
      vesselVoyage: "GSL SYROS (444S)",
      serviceLane: "NZJ (New Zealand - Japan Express)",
      transportMode: "Deep Sea Vessel + Hub Transshipment",
      shippingMethod: "1 TRANSIT",
      totalDistanceKm: 9480,
      baseCo2Kg: 345.10,
      usdPrice: 22303.36,
      opsEligible: true,
      baseEnergyKwh: 14250,
      isDirect: false,
      status: "Available"
    }
  ];

  const handleSwapPorts = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Operational Presets for 4 Master Operational Scenarios
  const applyUseCasePreset = (ucId: "UC-01" | "UC-02" | "UC-03" | "UC-04") => {
    if (ucId === "UC-01") {
      setOrigin("HO CHI MINH (CAT LAI), VIETNAM (VNSGN)");
      setDestination("SINGAPORE, SINGAPORE (SGSIN)");
      setSelectedPol("CAT LAI TERMINAL B2");
      setSelectedPod("PSA SINGAPORE (PORT OF SINGAPORE AUTHORITY)");
      setContainerType("REEFER 40 HC");
      setIsFoodGrade(true);
      setContainerQty(2);
      setCommodity("SEAFOOD & FROZEN AQUACULTURE PRODUCTS (HS: 030389)");
      setDepartureDate("2026-09-28");
      setSelectedRecordId("rec-1");
      setExpandedDetailId("rec-1");
      setVasOpsSubscribed(true);
      setVasSolarReeferSubscribed(true);
      setVasBiofuelSubscribed(false);
      setReeferTempDegC("-22.0");
      setImoNumber("IMO 9845210");
    } else if (ucId === "UC-02") {
      setOrigin("CAI MEP (TCIT), VIETNAM (VNCMT)");
      setDestination("ROTTERDAM, NETHERLANDS (NLRTM)");
      setSelectedPol("CAI MEP TCIT");
      setSelectedPod("ROTTERDAM ECT DELTA");
      setContainerType("DRY 40");
      setIsFoodGrade(false);
      setContainerQty(10);
      setCommodity("ELECTRONICS & TELECOM EQUIPMENT (HS: 847130)");
      setDepartureDate("2026-09-30");
      setSelectedRecordId("rec-3");
      setExpandedDetailId("rec-3");
      setVasOpsSubscribed(true);
      setVasSolarReeferSubscribed(false);
      setVasBiofuelSubscribed(true);
      setImoNumber("IMO 9806079");
    } else if (ucId === "UC-03") {
      setOrigin("AKITA, AKITA, JAPAN (JPAKT)");
      setDestination("AUCKLAND, NEW ZEALAND (NZAKL)");
      setSelectedPol("AKITA CONTAINER TERMINAL");
      setSelectedPod("PORTS OF AUCKLAND (FERGUSSON WHARF)");
      setContainerType("DRY 40");
      setIsFoodGrade(false);
      setContainerQty(4);
      setCommodity("INDUSTRIAL MACHINERY & AUTOMOTIVE PARTS (HS: 847989)");
      setDepartureDate("2026-11-25");
      setSelectedRecordId("rec-4");
      setExpandedDetailId("rec-4");
      setVasOpsSubscribed(true);
      setVasSolarReeferSubscribed(false);
      setVasBiofuelSubscribed(false);
      setImoNumber("IMO 9385609");
    } else if (ucId === "UC-04") {
      setOrigin("HAI PHONG (TC-HICT), VIETNAM (VNHPH)");
      setDestination("SINGAPORE, SINGAPORE (SGSIN)");
      setSelectedPol("CAT LAI TERMINAL B1");
      setSelectedPod("PSA SINGAPORE (PORT OF SINGAPORE AUTHORITY)");
      setContainerType("REEFER 20");
      setIsFoodGrade(true);
      setContainerQty(2);
      setCommodity("TROPICAL FRUITS & AGRICULTURAL EXPORT (HS: 080450)");
      setDepartureDate("2026-09-30");
      setSelectedRecordId("rec-2");
      setExpandedDetailId("rec-2");
      setVasOpsSubscribed(true);
      setVasSolarReeferSubscribed(true);
      setVasBiofuelSubscribed(true);
      setReeferTempDegC("12.0");
      setImoNumber("IMO 9632480");
    }
  };

  // Multipliers for emission & energy calculation
  const emissionMultiplier = (emissionType === "WTW" ? 1.22 : 1.0) * (containerType.includes("REEFER") ? 1.35 : 1.0) * containerQty;
  const opsCo2SavingKg = vasOpsSubscribed ? (14.2 * 1000) : 0;
  const solarReeferSavingKg = vasSolarReeferSubscribed ? (420 * containerQty) : 0;
  const biofuelSavingKg = vasBiofuelSubscribed ? (2500 * containerQty) : 0;
  const totalCo2SavedKg = opsCo2SavingKg + solarReeferSavingKg + biofuelSavingKg;

  // Currently selected record
  const currentRecord = scheduleRecords.find(r => r.id === selectedRecordId) || scheduleRecords[0];
  const grossCo2Kg = Math.round(currentRecord.baseCo2Kg * emissionMultiplier);
  const netCo2Kg = Math.max(0, grossCo2Kg - Math.round(totalCo2SavedKg / 100));
  const co2PerTeu = (netCo2Kg / containerQty).toFixed(2);

  // Fees calculation
  const baseTariffUsd = currentRecord.usdPrice;
  const opsFeeUsd = vasOpsSubscribed ? 45 : 0;
  const solarReeferFeeUsd = vasSolarReeferSubscribed ? (25 * containerQty) : 0;
  const totalServiceFeeUsd = baseTariffUsd + opsFeeUsd + solarReeferFeeUsd;

  // Sorting logic
  const sortedRecords = [...scheduleRecords].sort((a, b) => {
    if (sortBy === "ETD") return a.etd.localeCompare(b.etd);
    if (sortBy === "ETA") return a.eta.localeCompare(b.eta);
    if (sortBy === "CHEAPEST") return a.usdPrice - b.usdPrice;
    if (sortBy === "QUICKEST") return a.durationDays - b.durationDays;
    return (a.baseCo2Kg - b.baseCo2Kg);
  });

  return (
    <div className="space-y-5 max-w-6xl pb-16">
      {/* 1. TOP SUB-NAVBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-2.5">
            {(["GET_QUOTE", "PORT_PAIR_LIST", "BOOKMARK", "MY_CONTRACT"] as const).map((tab) => {
              const label = tab === "GET_QUOTE" ? "GetQuote" :
                tab === "PORT_PAIR_LIST" ? "Port Pair List" :
                tab === "BOOKMARK" ? "Bookmark" : "My Contract";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveMainTab(tab)}
                  className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all relative whitespace-nowrap ${
                    activeMainTab === tab
                      ? "text-[#004B91] border-b-2 border-[#004B91]"
                      : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 py-2.5 sm:py-0 border-t sm:border-t-0 border-slate-100 justify-end">
            <button
              onClick={() => setShowUserGuideModal(true)}
              title="User Guide"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#004B91] hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowFaqModal(true)}
              title="GLEC / DCSA Standards FAQ"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#004B91] hover:bg-slate-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. THE 5-STAGE PROGRESS STEPPER BAR */}
        {activeMainTab === "GET_QUOTE" && (
          <div className="p-4 sm:p-6 bg-slate-50/40">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute top-4 left-8 right-8 h-0 border-t-2 border-dashed border-slate-300 -z-0" />

              <div className="relative z-10 flex items-center justify-between">
                {[
                  { step: 1, label: "Route", Icon: FileSearch },
                  { step: 2, label: "Rates", Icon: FileText },
                  { step: 3, label: "Decarbonization", Icon: FileCheck },
                  { step: 4, label: "Shipment", Icon: FileQuestion },
                  { step: 5, label: "Submission", Icon: FileCheck2 }
                ].map((s) => {
                  const isCompleted = currentStep > s.step;
                  const isCurrent = currentStep === s.step;
                  const isUpcoming = currentStep < s.step;

                  let iconColorClass = "text-slate-300";
                  let labelColorClass = "text-slate-400";
                  let bgPillClass = "bg-white border-slate-200";

                  if (isCompleted) {
                    iconColorClass = "text-emerald-600";
                    labelColorClass = "text-emerald-700 font-bold";
                    bgPillClass = "bg-white border-emerald-500 shadow-2xs";
                  } else if (isCurrent) {
                    iconColorClass = "text-[#004B91]";
                    labelColorClass = "text-[#004B91] font-bold";
                    bgPillClass = "bg-white border-[#004B91] ring-2 ring-[#004B91]/15 shadow-2xs";
                  }

                  return (
                    <button
                      key={s.step}
                      disabled={isUpcoming}
                      onClick={() => {
                        if (isCompleted) setCurrentStep(s.step as any);
                      }}
                      className={`flex flex-col items-center group transition-all ${
                        isCompleted ? "cursor-pointer hover:scale-105" : isCurrent ? "cursor-default" : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all bg-white ${bgPillClass}`}>
                        <s.Icon className={`w-4 h-4 ${iconColorClass}`} />
                      </div>
                      <div className={`text-[11px] mt-1.5 whitespace-nowrap transition-colors ${labelColorClass}`}>
                        {s.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN WORKFLOW PER STAGE */}
      {activeMainTab === "GET_QUOTE" && (
        <div>
          {/* STAGE 1: SEARCH QUOTE */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#004B91] text-white flex items-center justify-center text-xs font-bold">1</span>
                    <h2 className="text-base font-black text-slate-900">
                      Route & Port Call Parameters
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span>POL/POD Selection:</span>
                    <button
                      onClick={() => setPolPodToggle(!polPodToggle)}
                      className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${polPodToggle ? "bg-[#004B91]" : "bg-slate-300"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${polPodToggle ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>

                {/* 4 Master Operational Scenarios Strip */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#004B91] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#004B91]" />
                      <span>Operational Scenario Presets:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Synchronized across TOS, SCADA, AI Forecast & DCSA Invoices
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => applyUseCasePreset("UC-01")}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-left hover:border-[#004B91] hover:ring-1 hover:ring-[#004B91] transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[10px] text-[#004B91]">
                          UC-01
                        </span>
                        <span className="text-[9px] font-mono font-bold text-cyan-700">
                          Reefer -22°C
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate">SPIRIT OF MUMBAI</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate">Cat Lai B2 ➔ Singapore</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-1">2,850 TEU · OPS 6.6kV</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyUseCasePreset("UC-02")}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-left hover:border-[#004B91] hover:ring-1 hover:ring-[#004B91] transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[10px] text-[#004B91]">
                          UC-02
                        </span>
                        <span className="text-[9px] font-mono font-bold text-indigo-700">
                          EU ETS
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate">ONE APUS (ULCV)</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate">Cai Mep TCIT ➔ Rotterdam</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-1">14k TEU · BESS 1.5MW Peak Shave</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyUseCasePreset("UC-03")}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-left hover:border-[#004B91] hover:ring-1 hover:ring-[#004B91] transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[10px] text-[#004B91]">
                          UC-03
                        </span>
                        <span className="text-[9px] font-mono font-bold text-amber-700">
                          Heavy Machinery
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate">GSL KITHIRA</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate">Akita ➔ Cat Lai ➔ Auckland</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-1">1 Transit · Rooftop Solar PV</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyUseCasePreset("UC-04")}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-left hover:border-[#004B91] hover:ring-1 hover:ring-[#004B91] transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[10px] text-[#004B91]">
                          UC-04
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-700">
                          Biofuel B24
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate">TAN CANG GLORY</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate">Hai Phong ➔ Cat Lai ➔ Jurong</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-1">Perishables · Night BESS Charge</div>
                    </button>
                  </div>
                </div>

                {/* Route: Origin & Destination */}
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="flex-1 w-full relative">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Origin *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          placeholder="Port code or name (VNSGN, CAT LAI, JPAKT...)"
                          className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#004B91] focus:bg-white"
                        />
                        {origin && (
                          <button onClick={() => setOrigin("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSwapPorts}
                      className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#004B91] hover:bg-slate-50 mt-5 shrink-0 transition-colors"
                      title="Swap Origin and Destination"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>

                    <div className="flex-1 w-full relative">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Destination *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          placeholder="Port code or name (SGSIN, NZAKL, ROTTERDAM...)"
                          className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#004B91] focus:bg-white"
                        />
                        {destination && (
                          <button onClick={() => setDestination("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {polPodToggle && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Port of Loading (POL):
                        </label>
                        <select
                          value={selectedPol}
                          onChange={(e) => setSelectedPol(e.target.value)}
                          className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        >
                          <option value="CAT LAI TERMINAL B2">Tan Cang Cat Lai - Berth B2 (OPS Ready)</option>
                          <option value="CAT LAI TERMINAL B1">Tan Cang Cat Lai - Berth B1</option>
                          <option value="CAI MEP TCIT">Tan Cang Cai Mep (TCIT)</option>
                          <option value="AKITA CONTAINER TERMINAL">Akita Port Terminal (JPAKT)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Port of Discharge (POD):
                        </label>
                        <select
                          value={selectedPod}
                          onChange={(e) => setSelectedPod(e.target.value)}
                          className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        >
                          <option value="PSA SINGAPORE (PORT OF SINGAPORE AUTHORITY)">PSA Singapore (SGSIN)</option>
                          <option value="PORTS OF AUCKLAND (FERGUSSON WHARF)">Ports of Auckland (NZAKL)</option>
                          <option value="ROTTERDAM ECT DELTA">Rotterdam ECT Delta Terminal (NLRTM)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Declaration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">
                      Customer Status *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Cargo Owner", "Agent"] as const).map((decl) => (
                        <button
                          key={decl}
                          type="button"
                          onClick={() => setCustomerDeclaration(decl)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                            customerDeclaration === decl
                              ? "bg-[#004B91] text-white border-[#004B91]"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {decl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">
                      Haulage Terms *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Carrier Haulage", "Merchant Haulage"] as const).map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHaulageOption(h)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                            haulageOption === h
                              ? "bg-[#004B91] text-white border-[#004B91]"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Equipment & Container Specs */}
                <div className="space-y-3 pt-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Container Type & Specifications *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(["DRY 20", "DRY 40", "REEFER 20", "REEFER 40 HC", "FOOD GRADE"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setContainerType(t)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                          containerType === t
                            ? "bg-blue-50 text-[#004B91] border-[#004B91] shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Container Count (Units):</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={containerQty}
                        onChange={(e) => setContainerQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Cargo Weight per Unit (kg):</label>
                      <input
                        type="number"
                        step={100}
                        value={cargoWeightKg}
                        onChange={(e) => setCargoWeightKg(parseInt(e.target.value) || 10000)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Emission Accounting Scope:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEmissionType("TTW")}
                          className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                            emissionType === "TTW" ? "bg-[#004B91] text-white border-[#004B91]" : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          TTW (Direct)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmissionType("WTW")}
                          className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                            emissionType === "WTW" ? "bg-[#004B91] text-white border-[#004B91]" : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          WTW (Lifecycle)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commodity */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Commodity & HS Code *
                  </label>
                  <input
                    type="text"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white"
                  />
                </div>

                {/* Select Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Target Vessel Departure Date *
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Schedule Window Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value="1 Week">1 Week (Next 7 days)</option>
                      <option value="2 Weeks">2 Weeks (Next 14 days)</option>
                      <option value="1 Month">1 Month (Next 30 days)</option>
                    </select>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setOrigin("");
                      setDestination("");
                      setContainerQty(1);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
                  >
                    Reset Criteria
                  </button>

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-7 py-2.5 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all"
                  >
                    <span>GetQuote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recent Search List */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Inquiries</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {recentSearches.map((rec, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setOrigin(rec.origin);
                        setDestination(rec.destination);
                        setCommodity(rec.commodity);
                      }}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-[#004B91] cursor-pointer transition-all space-y-1"
                    >
                      <div className="font-bold text-slate-800 text-xs truncate flex items-center gap-1">
                        <span>{rec.origin.split(",")[0]}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{rec.destination.split(",")[0]}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>{rec.type}</span>
                        <span className="font-mono text-[#004B91] font-bold">Apply</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: GETQUOTE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={() => setSortBy("ETD")}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 border transition-colors ${
                      sortBy === "ETD"
                        ? "border-[#004B91] text-[#004B91] bg-blue-50"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>ETD</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setSortBy("ETA")}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 border transition-colors ${
                      sortBy === "ETA"
                        ? "border-[#004B91] text-[#004B91] bg-blue-50"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>ETA</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setSortBy("CHEAPEST")}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                      sortBy === "CHEAPEST"
                        ? "border-[#004B91] text-[#004B91] bg-blue-50"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Cheapest
                  </button>

                  <button
                    onClick={() => setSortBy("QUICKEST")}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                      sortBy === "QUICKEST"
                        ? "border-[#004B91] text-[#004B91] bg-blue-50"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Quickest
                  </button>

                  <button
                    onClick={() => setSortBy("LOWEST_CO2")}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-colors flex items-center gap-1 ${
                      sortBy === "LOWEST_CO2"
                        ? "border-emerald-600 text-emerald-800 bg-emerald-50"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Leaf className="w-3 h-3 text-emerald-600" />
                    <span>Lowest CO2</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 relative">
                  <div className="relative">
                    <button
                      onClick={() => setShowFreightViewDropdown(!showFreightViewDropdown)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-2 shadow-2xs"
                    >
                      <span>Freight View</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {showFreightViewDropdown && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in space-y-3">
                        <div className="space-y-2 text-xs font-bold text-slate-800">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tempFreightViewItems.basicOceanFreight}
                              onChange={(e) => setTempFreightViewItems({ ...tempFreightViewItems, basicOceanFreight: e.target.checked })}
                              className="rounded text-[#004B91] focus:ring-[#004B91]"
                            />
                            <span>BASIC OCEAN FREIGHT</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tempFreightViewItems.originCharge}
                              onChange={(e) => setTempFreightViewItems({ ...tempFreightViewItems, originCharge: e.target.checked })}
                              className="rounded text-[#004B91] focus:ring-[#004B91]"
                            />
                            <span>ORIGIN CHARGE</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tempFreightViewItems.destinationCharge}
                              onChange={(e) => setTempFreightViewItems({ ...tempFreightViewItems, destinationCharge: e.target.checked })}
                              className="rounded text-[#004B91] focus:ring-[#004B91]"
                            />
                            <span>DESTINATION CHARGE</span>
                          </label>
                        </div>

                        {!tempFreightViewItems.basicOceanFreight && !tempFreightViewItems.originCharge && !tempFreightViewItems.destinationCharge && (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                            Select at least one charge tier
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              const reset = { basicOceanFreight: true, originCharge: true, destinationCharge: true };
                              setTempFreightViewItems(reset);
                              setFreightViewItems(reset);
                            }}
                            className="text-xs font-bold text-[#004B91] hover:underline"
                          >
                            Reset
                          </button>
                          <button
                            disabled={!tempFreightViewItems.basicOceanFreight && !tempFreightViewItems.originCharge && !tempFreightViewItems.destinationCharge}
                            onClick={() => {
                              setFreightViewItems(tempFreightViewItems);
                              setShowFreightViewDropdown(false);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-[#004B91] disabled:opacity-50 text-white text-xs font-bold shadow-2xs hover:bg-[#00386E]"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowTariffDropdown(!showTariffDropdown)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Tariff ({selectedCurrency})</span>
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                    </button>

                    {showTariffDropdown && (
                      <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                        <button
                          onClick={() => { setSelectedCurrency("USD"); setShowTariffDropdown(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between ${selectedCurrency === "USD" ? "text-[#004B91] bg-blue-50" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          <span>USD ($)</span>
                          {selectedCurrency === "USD" && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => { setSelectedCurrency("VND"); setShowTariffDropdown(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between ${selectedCurrency === "VND" ? "text-[#004B91] bg-blue-50" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          <span>VND (₫)</span>
                          {selectedCurrency === "VND" && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                    <span className="text-slate-600 font-bold text-[11px] whitespace-nowrap">Price Alerts</span>
                    <button
                      onClick={() => setPriceAlertsEnabled(!priceAlertsEnabled)}
                      className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${priceAlertsEnabled ? "bg-[#004B91]" : "bg-slate-300"}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${priceAlertsEnabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <span className="uppercase text-[11px] tracking-wide text-slate-700">Request Summary</span>
                      <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        title="Bookmark this search"
                        className="text-slate-400 hover:text-[#004B91] transition-colors p-1"
                      >
                        <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? "text-[#004B91] fill-[#004B91]" : ""}`} />
                      </button>
                    </div>

                    <div className="space-y-3 text-slate-600">
                      <div>
                        <span className="font-bold text-slate-400 text-[10px] block uppercase">Origin</span>
                        <span className="font-bold text-slate-900 leading-tight block">{origin}</span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-400 text-[10px] block uppercase">Destination</span>
                        <span className="font-bold text-slate-900 leading-tight block">{destination}</span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-400 text-[10px] block uppercase">Container & Weight</span>
                        <span className="font-bold text-slate-800 block">
                          {containerQty} x {containerType} · {cargoWeightKg.toLocaleString()} kg/unit
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-400 text-[10px] block uppercase">Commodity</span>
                        <span className="font-medium text-slate-700 block truncate">{commodity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3 text-xs">
                    <div className="font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase text-[11px] flex items-center justify-between">
                      <span>Filters</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-700 text-[11px] block">Port of Loading (POL)</span>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                        <input type="checkbox" defaultChecked className="rounded text-[#004B91]" />
                        <span className="truncate">{selectedPol}</span>
                      </label>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-700 text-[11px] block">Port of Discharge (POD)</span>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                        <input type="checkbox" defaultChecked className="rounded text-[#004B91]" />
                        <span className="truncate">{selectedPod}</span>
                      </label>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-700 text-[11px] block">Service Lane</span>
                      <select
                        value={serviceLaneFilter}
                        onChange={(e) => setServiceLaneFilter(e.target.value)}
                        className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="All">All Service Lanes</option>
                        <option value="TI1">TI1 (Tan Cang - InterAsia)</option>
                        <option value="ASEAN-1">ASEAN-1 (Tan Cang Express)</option>
                        <option value="NZJ">NZJ (New Zealand - Japan)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-3">
                  {sortedRecords.map((record) => {
                    const isSelected = selectedRecordId === record.id;
                    const isExpanded = expandedDetailId === record.id;
                    const recCo2Gross = Math.round(record.baseCo2Kg * emissionMultiplier);
                    const formattedPrice = selectedCurrency === "USD"
                      ? `USD ${record.usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `VND ${(record.usdPrice * 25400).toLocaleString()}`;

                    return (
                      <div
                        key={record.id}
                        className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs space-y-3.5 ${
                          isSelected ? "border-[#004B91] ring-2 ring-[#004B91]/15" : "border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Origin</span>
                              <span className="font-bold text-slate-900 text-sm font-mono">{record.etd}</span>
                            </div>

                            <div className="flex flex-col items-center px-2">
                              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap font-mono">
                                {record.durationDays > 0 ? `${record.durationDays} day(s)` : ""}
                              </span>
                              <div className="flex items-center w-28 sm:w-36 my-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                <div className="flex-1 h-0.5 border-t border-slate-300 mx-1" />
                                <span className="text-[10px] text-slate-500 font-bold px-1 whitespace-nowrap">
                                  {record.transits === 0 ? "Direct" : `${record.transits} Transit`}
                                </span>
                                <div className="flex-1 h-0.5 border-t border-slate-300 mx-1" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Destination</span>
                              <span className="font-bold text-slate-900 text-sm font-mono">{record.eta}</span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1">
                            <div className="text-slate-500 text-[10px] font-bold">Service Lane / Vessel Voyage</div>
                            <div className="font-bold text-slate-800">
                              <span className="text-[#004B91]">{record.serviceLane.split(" ")[0]}</span>
                              <span className="mx-1">/</span>
                              <span>{record.vesselVoyage}</span>
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="text-slate-500 text-[10px] font-bold block mb-1">Status</span>
                            <span className="font-mono text-[10px] font-bold text-emerald-700">
                              {record.status}
                            </span>
                          </div>

                          <div className="flex items-center lg:flex-col lg:items-end justify-between gap-3">
                            <div className="text-right">
                              <div className="text-base font-black text-slate-900 font-mono">
                                {formattedPrice}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-mono font-bold">
                                {recCo2Gross.toLocaleString()} kg CO2e
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedRecordId(record.id);
                                setCurrentStep(3);
                              }}
                              className="px-6 py-2 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-black shadow-2xs transition-colors"
                            >
                              Accept
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setExpandedDetailId(isExpanded ? null : record.id)}
                              className="font-bold text-slate-700 hover:text-[#004B91] flex items-center gap-1"
                            >
                              <span>Route Segment Details</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Standard Free Time Included</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-3">
                            <span>POL: <strong>{record.polName.split("-")[0]}</strong></span>
                            <span>·</span>
                            <span>POD: <strong>{record.podName.split("(")[0]}</strong></span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-in fade-in">
                            <div className="font-bold text-slate-700 uppercase text-[10px]">
                              Operational Journey & Shore Power Status:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-500 block">1. Loading Terminal (POL):</span>
                                <span className="font-bold text-slate-800">{record.polName}</span>
                                <p className="text-slate-500 text-[10px] mt-1 font-mono">OPS Cold Ironing active at 6.6kV berth</p>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-500 block">2. Ocean Segment:</span>
                                <span className="font-bold text-slate-800">{record.vesselVoyage}</span>
                                <p className="text-slate-500 text-[10px] mt-1 font-mono">Distance: {record.totalDistanceKm} km · Lane: {record.serviceLane.split(" ")[0]}</p>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-500 block">3. Discharge Terminal (POD):</span>
                                <span className="font-bold text-slate-800">{record.podName}</span>
                                <p className="text-slate-500 text-[10px] mt-1 font-mono">DCSA e-Carbon audit manifest generated upon discharge</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: QUOTE ACCEPTED */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3 text-xs">
                  <div className="font-black text-slate-900 border-b border-slate-100 pb-2 uppercase text-[11px] text-[#004B91]">
                    Acceptance Summary
                  </div>

                  <div className="space-y-2.5 text-slate-600">
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase">Vessel & Voyage:</span>
                      <span className="font-bold text-slate-900">{currentRecord.vesselVoyage}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase">Route:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <span>{currentRecord.originName.split("(")[0]}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{currentRecord.destinationName.split("(")[0]}</span>
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase">Containers:</span>
                      <span className="font-bold text-slate-900">{containerQty} x {containerType}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase">Baseline Gross CO2:</span>
                      <span className="font-bold text-slate-800 font-mono">{grossCo2Kg.toLocaleString()} kg CO2e</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-bold text-emerald-700 text-[10px] block uppercase">Green Service Abatement:</span>
                      <span className="font-bold font-mono text-emerald-600 text-sm">- {Math.round(totalCo2SavedKg / 100).toLocaleString()} kg CO2e</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-500 text-[10px] block uppercase">Net Carbon Output:</span>
                      <span className="font-black text-[#004B91] text-base font-mono">{netCo2Kg.toLocaleString()} kg CO2e</span>
                      <div className="text-[10px] text-slate-500 font-mono font-bold">{co2PerTeu} kgCO2e / TEU</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">
                      Value-Added Maritime Energy & Abatement Services
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select certified quayside decarbonization infrastructure options
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">
                          1. Quayside Cold Ironing (Onshore Power Supply - OPS)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 font-mono">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Connects vessel to the 6.6kV port electrical substation, allowing complete auxiliary diesel generator shutdown for the entire 18h port call duration.
                      </p>
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-2 pt-1 font-mono">
                        <span>Abatement: -14.2 tCO2e / call</span>
                        <span>·</span>
                        <span>Service Fee: $45 USD / call</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setVasOpsSubscribed(!vasOpsSubscribed)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        vasOpsSubscribed
                          ? "bg-[#004B91] text-white shadow-2xs"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {vasOpsSubscribed ? "Subscribed" : "+ Subscribe"}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">
                          2. Solar & BESS-Powered Reefer Yard Slot
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 font-mono">
                          Clean Power
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Prioritized plug-in to reefer racks powered exclusively by the port's 4.2 MWp rooftop solar array and 2.5 MWh battery storage system.
                      </p>
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-2 pt-1 font-mono">
                        <span>Abatement: -420 kg CO2e / TEU</span>
                        <span>·</span>
                        <span>Fee: $25 USD / TEU</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setVasSolarReeferSubscribed(!vasSolarReeferSubscribed)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        vasSolarReeferSubscribed
                          ? "bg-[#004B91] text-white shadow-2xs"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {vasSolarReeferSubscribed ? "Subscribed" : "+ Subscribe"}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">
                          3. ISCC-Certified Biofuel B24 Bunkering
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Guaranteed physical bunkering of sustainable marine fuel blend (ISCC EU certified) at Cai Mep deep-sea berths.
                      </p>
                      <div className="text-[11px] font-mono text-slate-500 pt-1">
                        Recommended for European and North American lanes subject to EU ETS compliance.
                      </div>
                    </div>

                    <button
                      onClick={() => setVasBiofuelSubscribed(!vasBiofuelSubscribed)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        vasBiofuelSubscribed
                          ? "bg-[#004B91] text-white shadow-2xs"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {vasBiofuelSubscribed ? "Subscribed" : "+ Subscribe"}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">Total Energy & Freight Value:</div>
                      <div className="text-lg font-black text-[#004B91] font-mono">
                        ${totalServiceFeeUsd.toLocaleString()} USD
                        <span className="text-xs font-normal text-slate-400 ml-1">
                          (~{(totalServiceFeeUsd * 25400).toLocaleString()} VND)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep(4)}
                        className="px-6 py-2.5 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-black shadow-md flex items-center gap-2"
                      >
                        <span>Technical Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: ADDITIONAL INFORMATION */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Technical Specifications & Carbon Audit Registry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cargo handling requirements, reefer temperature profile, and statutory IMO DCS / EU ETS identifiers
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">STAGE 4 OF 5</span>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004B91] flex items-center justify-center text-[10px] font-black">4.1</span>
                  <span>Booking Stakeholders</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Booking Party:</label>
                    <input
                      type="text"
                      value={bookingPartyCompany}
                      onChange={(e) => setBookingPartyCompany(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Shipper of Record:</label>
                    <input
                      type="text"
                      value={shipperName}
                      onChange={(e) => setShipperName(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ocean Carrier Partner:</label>
                    <input
                      type="text"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004B91] flex items-center justify-center text-[10px] font-black">4.2</span>
                  <span>Reefer Cargo Electrical & Environmental Parameters</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Set Point (°C) *</label>
                    <input
                      type="text"
                      value={reeferTempDegC}
                      onChange={(e) => setReeferTempDegC(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[#004B91] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ventilation (CMH)</label>
                    <input
                      type="text"
                      value={reeferVentCmH}
                      onChange={(e) => setReeferVentCmH(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Relative Humidity (%)</label>
                    <input
                      type="text"
                      value={reeferHumidityPct}
                      onChange={(e) => setReeferHumidityPct(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Road Genset Required *</label>
                    <select
                      value={gensetRequired}
                      onChange={(e) => setGensetRequired(e.target.value as any)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Drain Valve State</label>
                    <select
                      value={drainOption}
                      onChange={(e) => setDrainOption(e.target.value as any)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="Close">Closed</option>
                      <option value="Open">Open</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004B91] flex items-center justify-center text-[10px] font-black">4.3</span>
                  <span>Statutory Compliance Identifiers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Vessel IMO Number *</label>
                    <input
                      type="text"
                      value={imoNumber}
                      onChange={(e) => setImoNumber(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">EU ETS Maritime MRN:</label>
                    <input
                      type="text"
                      value={euEtsMrn}
                      onChange={(e) => setEuEtsMrn(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Corporate Tax ID:</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Terminal Operating Instructions:</label>
                  <textarea
                    rows={2}
                    value={specialInstruction}
                    onChange={(e) => setSpecialInstruction(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-7 py-2.5 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-black shadow-md flex items-center gap-2"
                >
                  <span>Review Booking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 5: BOOKING SUBMISSION */}
          {currentStep === 5 && !isSubmittedSuccess && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Booking Finalization & DCSA Carbon Certificate Issuance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify all parameters prior to generating the cryptographically signed DCSA e-Invoice
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  READY FOR ISSUANCE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#004B91] uppercase text-[10px]">1. Route & Schedule</div>
                  <div className="font-bold text-slate-900">{currentRecord.vesselVoyage}</div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <span>{origin.split(",")[0]}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>{destination.split(",")[0]}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">ETD: {currentRecord.etd} · ETA: {currentRecord.eta}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#004B91] uppercase text-[10px]">2. Commercial Stakeholders</div>
                  <div className="font-bold text-slate-900">{bookingPartyCompany}</div>
                  <div className="text-slate-600">Shipper: {shipperName}</div>
                  <div className="text-[11px] text-slate-500">Carrier: {carrierName}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#004B91] uppercase text-[10px]">3. Equipment & Set Point</div>
                  <div className="font-bold text-slate-900">{containerQty} x {containerType}</div>
                  <div className="text-slate-600 font-mono">Target Temp: {reeferTempDegC}°C (Genset: {gensetRequired})</div>
                  <div className="text-[11px] text-slate-500 font-mono">Payload: {cargoWeightKg.toLocaleString()} kg/unit</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#004B91] uppercase text-[10px]">4. Decarbonization Services</div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Onshore Power Supply (OPS)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Solar-Powered Reefer Rack</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono">Abatement: -{Math.round(totalCo2SavedKg / 100).toLocaleString()} kg CO2e</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#004B91] uppercase text-[10px]">5. Regulatory Identifiers</div>
                  <div className="font-bold text-slate-900 font-mono">{imoNumber}</div>
                  <div className="text-slate-600 font-mono">MRN: {euEtsMrn}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Tax ID: {taxId}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5">
                  <div className="font-bold text-[#004B91] uppercase text-[10px]">6. Net Rate & Emission Output</div>
                  <div className="text-base font-black text-[#004B91] font-mono">${totalServiceFeeUsd.toLocaleString()} USD</div>
                  <div className="font-bold text-emerald-800 font-mono">{netCo2Kg.toLocaleString()} kg CO2e net</div>
                  <div className="text-[10px] text-slate-600 font-mono">Intensity: {co2PerTeu} kgCO2e / TEU</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-[#004B91]"
                  />
                  <span>
                    I hereby certify that all stated operational parameters are accurate. I accept the 
                    <strong> G-Port Maritime Terminal Terms of Carriage</strong> and authorize issuance of the certified DCSA e-Carbon Invoice.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  disabled={!termsAccepted}
                  onClick={() => setIsSubmittedSuccess(true)}
                  className="px-8 py-3 rounded-xl bg-[#004B91] hover:bg-[#00386E] disabled:opacity-50 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Confirm & Generate DCSA Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* SUBMITTED SUCCESSFULLY SCREEN */}
          {currentStep === 5 && isSubmittedSuccess && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-lg text-center space-y-6 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Booking Confirmed & DCSA Carbon Certificate Issued
                </h2>
                <p className="text-xs text-slate-500">
                  Terminal dispatch synchronized, cold ironing slot reserved, and cryptographic audit hash registered.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Contract Reference:</span>
                  <span className="font-mono font-black text-[#004B91]">SNP-GPORT-2026-08819</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Booking Number:</span>
                  <span className="font-mono font-black text-slate-800">BKG-TCL-99210</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Operational Contact:</span>
                  <span className="font-medium text-slate-700 font-mono">{contactEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Certified Carbon Intensity:</span>
                  <span className="font-black text-emerald-700 font-mono">{co2PerTeu} kgCO2e / TEU</span>
                </div>
              </div>

              <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#004B91]" />
                    <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      DCSA Certified e-Carbon Invoice & Audit Hash
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#004B91] text-white px-2 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Vessel:</span>
                    <span className="font-bold text-slate-800">{currentRecord.vesselVoyage}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Assigned Berth:</span>
                    <span className="font-bold text-slate-800">Cat Lai Berth B2</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Net Abatement:</span>
                    <span className="font-bold font-mono text-emerald-600">-14.2 tCO2e</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  <div className="truncate max-w-[280px]">
                    SHA-256: 0x8f2a991bce4710aefc39d8...
                  </div>
                  <div className="flex items-center gap-1 font-bold text-[#004B91]">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>DCSA Standard QR</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveMainTab("MY_CONTRACT")}
                  className="px-5 py-2.5 rounded-xl border border-[#004B91] text-[#004B91] hover:bg-blue-50 text-xs font-bold transition-colors"
                >
                  View in My Contracts
                </button>

                <button
                  onClick={() => {
                    setIsSubmittedSuccess(false);
                    setCurrentStep(1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#004B91] hover:bg-[#00386E] text-white text-xs font-black shadow-md transition-colors"
                >
                  Create New Inquiry
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PORT PAIR LIST */}
      {activeMainTab === "PORT_PAIR_LIST" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Connected Port Pairs Directory
              </h3>
              <p className="text-xs text-slate-500">
                Terminal network routes with shore power (OPS) and electrified reefer storage support
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Service Trade</th>
                  <th className="py-2.5 px-3">Port of Origin (POL)</th>
                  <th className="py-2.5 px-3">Port of Discharge (POD)</th>
                  <th className="py-2.5 px-3">Cold Ironing (OPS)</th>
                  <th className="py-2.5 px-3">Transit Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {[
                  { trade: "Inter-Asia Express", por: "HO CHI MINH (CAT LAI), VIETNAM", del: "SINGAPORE (SGSIN)", ops: "Operational (Berth B2)", days: "2 Days" },
                  { trade: "Trans-Pacific Service", por: "CAI MEP (TCIT), VIETNAM", del: "LOS ANGELES, USA", ops: "Operational (Deep Berth)", days: "14 Days" },
                  { trade: "Asia - Europe Express", por: "CAI MEP (TCTT), VIETNAM", del: "ROTTERDAM, NETHERLANDS", ops: "Operational (Cai Mep)", days: "24 Days" },
                  { trade: "Vietnam - Japan Trade", por: "HO CHI MINH (CAT LAI), VIETNAM", del: "TOKYO, JAPAN", ops: "Operational (Berth B1)", days: "6 Days" }
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-[#004B91]">{item.trade}</td>
                    <td className="py-3 px-3">{item.por}</td>
                    <td className="py-3 px-3">{item.del}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-emerald-700 font-bold text-[10px]">
                        {item.ops}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">{item.days}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setOrigin(item.por);
                          setDestination(item.del);
                          setActiveMainTab("GET_QUOTE");
                          setCurrentStep(1);
                        }}
                        className="px-3 py-1 bg-[#004B91] text-white rounded-lg text-[11px] font-bold hover:bg-[#00386E]"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKMARK */}
      {activeMainTab === "BOOKMARK" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              Saved Inquiry Configurations
            </h3>
            <p className="text-xs text-slate-500">
              Expedited access to recurring liner voyages and equipment profiles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Frozen Seafood Trade - Singapore", origin: "Cat Lai", dest: "PSA Singapore", cont: "2x Reefer 40 HC", temp: "-22°C" },
              { title: "Electronics Export - Rotterdam", origin: "Cai Mep TCIT", dest: "Rotterdam ECT", cont: "5x Dry 40", temp: "Ambient" }
            ].map((bm, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{bm.title}</span>
                  <BookmarkIcon className="w-4 h-4 text-[#004B91] fill-[#004B91]" />
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span>{bm.origin}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{bm.dest}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 font-mono">
                  <span>{bm.cont}</span>
                  <span>·</span>
                  <span>{bm.temp}</span>
                </div>
                <button
                  onClick={() => {
                    setActiveMainTab("GET_QUOTE");
                    setCurrentStep(1);
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#004B91] text-[#004B91] font-bold text-xs"
                >
                  Load Parameters
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MY CONTRACT */}
      {activeMainTab === "MY_CONTRACT" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              Contract Ledger & Verified Carbon Invoices
            </h3>
            <p className="text-xs text-slate-500">
              Auditable records verified under GLEC Framework and ISO 14083
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Contract Reference</th>
                  <th className="py-2.5 px-3">Booking ID</th>
                  <th className="py-2.5 px-3">Vessel & Voyage</th>
                  <th className="py-2.5 px-3">Berth Date</th>
                  <th className="py-2.5 px-3">Intensity (kg/TEU)</th>
                  <th className="py-2.5 px-3">DCSA Status</th>
                  <th className="py-2.5 px-3 text-right">Audit Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {[
                  { contract: "SNP-GPORT-2026-08819", bkg: "BKG-TCL-99210", vessel: "SPIRIT OF MUMBAI 056N", date: "2026-09-28", co2: "29.20", status: "VERIFIED" },
                  { contract: "SNP-GPORT-2026-08742", bkg: "BKG-TCL-98401", vessel: "TAN CANG GLORY 104S", date: "2026-09-20", co2: "31.45", status: "VERIFIED" },
                  { contract: "SNP-GPORT-2026-08630", bkg: "BKG-TCL-97812", vessel: "ONE APUS 012W", date: "2026-09-12", co2: "27.10", status: "VERIFIED" }
                ].map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-[#004B91]">{c.contract}</td>
                    <td className="py-3 px-3 font-mono">{c.bkg}</td>
                    <td className="py-3 px-3 font-bold">{c.vessel}</td>
                    <td className="py-3 px-3 font-mono">{c.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">{c.co2}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#004B91] text-[10px]">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => {
                          setExportedContract(c.contract);
                          setTimeout(() => setExportedContract(null), 3500);
                        }}
                        className={`px-2.5 py-1 rounded font-bold text-[11px] inline-flex items-center gap-1 transition-colors ${
                          exportedContract === c.contract
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {exportedContract === c.contract ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Exported!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Export PDF</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#004B91]" />
                <h3 className="font-black text-slate-900 text-base">
                  Carbon Accounting & Port Energy FAQ
                </h3>
              </div>
              <button 
                onClick={() => setShowFaqModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Q1: How do TTW and WTW emission scopes differ?</span>
                <p className="text-slate-600">
                  - <strong>TTW (Tank-to-Wake):</strong> Quantifies direct emissions emitted strictly during fuel combustion in vessel main/auxiliary engines and cargo equipment (Scope 1).<br/>
                  - <strong>WTW (Well-to-Wake):</strong> Comprehensive lifecycle accounting including feedstock extraction, refining, transport, and bunkering (Scope 3 Upstream) per ISO 14083.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Q2: How does Onshore Power Supply (Cold Ironing) operate?</span>
                <p className="text-slate-600">
                  When a container vessel berths at Cat Lai B2 or TCIT Cai Mep, the dedicated 6.6kV/11kV substation connects directly to the ship's shore connection switchboard, allowing auxiliary diesel generator shutdown and eliminating local port emissions.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Q3: What regulatory standing does the DCSA e-Invoice hold?</span>
                <p className="text-slate-600">
                  Invoices conform to Digital Container Shipping Association (DCSA) data structures, stamped with SHA-256 cryptographic hashes recognized by third-party auditors under IMO DCS and EU ETS Maritime compliance frameworks.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowFaqModal(false)}
                className="px-5 py-2 rounded-xl bg-[#004B91] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER GUIDE MODAL */}
      {showUserGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#004B91]" />
                <h3 className="font-black text-slate-900 text-base">
                  G-Port Operator Workflow Guide
                </h3>
              </div>
              <button 
                onClick={() => setShowUserGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                The dispatch and quote workflow is structured into 5 standardized stages:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-2">
                <li><strong>Stage 1 (Search Quote):</strong> Specify origin and destination ports, equipment type, and scheduled call dates.</li>
                <li><strong>Stage 2 (GetQuote):</strong> Review schedule options, sort by lowest carbon or tariff, and verify transit times.</li>
                <li><strong>Stage 3 (Quote Accepted):</strong> Select decarbonization services (Onshore Power Supply, clean reefer slots, biofuel).</li>
                <li><strong>Stage 4 (Additional Information):</strong> Declare equipment temperature profiles and statutory IMO/EU ETS identifiers.</li>
                <li><strong>Stage 5 (Booking Submission):</strong> Authorize dispatch and generate the cryptographically verified DCSA e-Invoice.</li>
              </ol>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowUserGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-[#004B91] text-white text-xs font-bold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
