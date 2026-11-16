import React, { useState, useMemo } from "react";
import {
  Ship,
  Truck,
  Package,
  Clock,
  ChevronRight,
  X,
  ArrowUpRight,
  Crosshair,
  Anchor,
  Container,
  CheckCircle2,
  Layers,
  Zap,
  Activity,
  Gauge,
  FileText,
  Thermometer,
  ShieldCheck,
  Map as MapIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PortTerminal3DScene } from "../components/terminal-3d/PortTerminal3DScene";
import { Historical2DReplayView } from "../components/terminal-3d/Historical2DReplayView";
import {
  TERMINAL_3D_ENTITIES,
  VESSEL_LIFECYCLE_BY_ID,
  Terminal3DEntity,
  TerminalEntityCategory,
} from "../components/terminal-3d/terminal3DData";
import { SubPageId } from "../types/gport";
import { MeterModalMode } from "../components/MeterTelemetryModal";

interface InputLayerPageProps {
  onOpenMeterModal?: (assetId?: string, mode?: MeterModalMode) => void;
  onNavigate?: (page: SubPageId) => void;
  onOpenCarbonInvoice?: (invoiceOrUseCaseId: string) => void;
  focusedTelemetryEntityId?: string | null;
  onClearFocusedTelemetryEntity?: () => void;
}

type BreakdownTab = "TELEMETRY" | "CONTAINERS" | "HISTORY";

export const InputLayerPage: React.FC<InputLayerPageProps> = ({
  onOpenMeterModal,
  onNavigate,
  onOpenCarbonInvoice,
  focusedTelemetryEntityId,
  onClearFocusedTelemetryEntity,
}) => {
  // Default selected entity: TRK-2481 (matches the WareTrack 3D layout)
  const [selectedEntityId, setSelectedEntityId] = useState<string>("TRK-2481");
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TerminalEntityCategory>("CRANES");
  const [detailModalEntity, setDetailModalEntity] =
    useState<Terminal3DEntity | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>("TELEMETRY");
  const [selectedLogIdx, setSelectedLogIdx] = useState<number>(0);
  const [vesselLifecycleModalId, setVesselLifecycleModalId] = useState<
    string | null
  >(null);

  // When traced back from Carbon Invoices or Meter Modal, focus the target vessel and open its 2D Voyage Replay
  React.useEffect(() => {
    if (!focusedTelemetryEntityId) return;
    const found = TERMINAL_3D_ENTITIES.find(
      (e) => e.id === focusedTelemetryEntityId
    );
    if (found) {
      setSelectedEntityId(found.id);
      setActiveTab(found.category);
      setInspectorOpen(true);
      setVesselLifecycleModalId(found.linkedVesselId);
    }
    onClearFocusedTelemetryEntity?.();
  }, [focusedTelemetryEntityId, onClearFocusedTelemetryEntity]);

  const selectedEntity = useMemo(
    () =>
      TERMINAL_3D_ENTITIES.find((e) => e.id === selectedEntityId) ||
      TERMINAL_3D_ENTITIES[0],
    [selectedEntityId]
  );

  // Linked Vessel for the Bottom-Left Lifecycle Stepper:
  // Always shows the vessel that the currently selected crane, truck, bay, or vessel belongs to
  const activeVesselLifecycle = useMemo(() => {
    const vesselId = selectedEntity?.linkedVesselId || "VSL-01";
    return VESSEL_LIFECYCLE_BY_ID[vesselId] || VESSEL_LIFECYCLE_BY_ID["VSL-01"];
  }, [selectedEntity]);

  const vesselsList = useMemo(
    () => TERMINAL_3D_ENTITIES.filter((e) => e.category === "VESSELS"),
    []
  );
  const cranesList = useMemo(
    () => TERMINAL_3D_ENTITIES.filter((e) => e.category === "CRANES"),
    []
  );
  const trucksList = useMemo(
    () => TERMINAL_3D_ENTITIES.filter((e) => e.category === "TRUCKS"),
    []
  );
  const baysList = useMemo(
    () => TERMINAL_3D_ENTITIES.filter((e) => e.category === "BAYS"),
    []
  );

  const tabEntities = useMemo(() => {
    switch (activeTab) {
      case "VESSELS":
        return vesselsList;
      case "CRANES":
        return cranesList;
      case "TRUCKS":
        return trucksList;
      case "BAYS":
        return baysList;
    }
  }, [activeTab, vesselsList, cranesList, trucksList, baysList]);

  const handleSelectEntity = (entity: Terminal3DEntity) => {
    setSelectedEntityId(entity.id);
    setInspectorOpen(true);
    setActiveTab(entity.category);
  };

  const handleSelectById = (id: string) => {
    const found = TERMINAL_3D_ENTITIES.find((e) => e.id === id);
    if (found) {
      handleSelectEntity(found);
    }
  };

  const openEntityBreakdown = (
    entity: Terminal3DEntity,
    initialTab: BreakdownTab = "TELEMETRY"
  ) => {
    setSelectedLogIdx(0);
    setBreakdownTab(initialTab);
    setDetailModalEntity(entity);
  };

  const getBadgeStyle = (tone: Terminal3DEntity["statusTone"]) => {
    switch (tone) {
      case "GREEN":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "BLUE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "AMBER":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SLATE":
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getProgressColor = (tone: Terminal3DEntity["statusTone"]) => {
    switch (tone) {
      case "GREEN":
        return "bg-emerald-500";
      case "BLUE":
        return "bg-blue-600";
      case "AMBER":
        return "bg-amber-500";
      case "SLATE":
        return "bg-slate-400";
    }
  };

  const getCategoryIcon = (category: TerminalEntityCategory) => {
    switch (category) {
      case "VESSELS":
        return <Ship className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
      case "CRANES":
        return <Anchor className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />;
      case "TRUCKS":
        return <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />;
      case "BAYS":
        return <Container className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />;
    }
  };

  // Short step labels so all 5 steps fit inside any card width without overflow
  const getCompactStepLabel = (label: string) => {
    if (label.includes("Arrived")) return "Vessel Arrived";
    if (label.includes("Berthed") || label.includes("Berthing"))
      return "Berthed & OPS";
    if (label.includes("Quay Crane")) return "Quay Cranes";
    if (label.includes("Container Bay")) return "Bay Stacking";
    if (label.includes("Departure")) return "Departure";
    return label;
  };

  const activeModalVessel = vesselLifecycleModalId
    ? VESSEL_LIFECYCLE_BY_ID[vesselLifecycleModalId]
    : null;

  return (
    <div className="relative w-full h-full flex-1 min-h-0 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-[#dbeafe] select-none">
      {/* 1. Full-Viewport 3D Low-Polygon Port Terminal Map */}
      <PortTerminal3DScene
        selectedEntityId={selectedEntityId}
        onSelectEntity={handleSelectEntity}
        inspectorOpen={inspectorOpen}
      />

      {/* =====================================================================
          2. UNIFIED 2-ROW ADAPTIVE FLEX OVERLAY
          Guarantees zero collision between Top Row and Bottom Row, and zero
          horizontal overlap between Left and Right cards at any viewport size!
      ===================================================================== */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-3.5 gap-2.5 overflow-hidden">
        {/* -------------------------------------------------------------------
            TOP ROW: Left KPI Pills + Right Adaptive Inspector Card
        ------------------------------------------------------------------- */}
        <div className="flex items-start justify-between gap-2.5 min-h-0 flex-1 overflow-hidden">
          {/* TOP-LEFT: 3 Adaptive Terminal Activity KPI Cards */}
          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            {/* Card 1: Containers in Yard Bays */}
            <button
              type="button"
              onClick={() => handleSelectById("BAY-R1")}
              className="pointer-events-auto bg-white/95 hover:bg-white border border-slate-200/90 rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-md flex items-center gap-2.5 transition-all text-left group cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
                  Containers in Yard
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                    1,420
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    ↑ +180
                  </span>
                </div>
                <div className="hidden xl:block text-[10px] text-slate-400 truncate">
                  TEU · 353 Reefer Plugs
                </div>
              </div>
            </button>

            {/* Card 2: Trucks & Cranes on site */}
            <button
              type="button"
              onClick={() => handleSelectById("TRK-2481")}
              className="pointer-events-auto bg-white/95 hover:bg-white border border-slate-200/90 rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-md flex items-center gap-2.5 transition-all text-left group cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
                  Active Fleet
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                    8
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    ↑ +2
                  </span>
                </div>
                <div className="hidden xl:block text-[10px] text-slate-400 truncate">
                  4 Cranes · 4 Yard Trucks
                </div>
              </div>
            </button>

            {/* Card 3: On-time vessel turnaround */}
            <button
              type="button"
              onClick={() => handleSelectById("VSL-01")}
              className="pointer-events-auto bg-white/95 hover:bg-white border border-slate-200/90 rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-md flex items-center gap-2.5 transition-all text-left group cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
                  Turnaround SLA
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                    96.8%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    ↑ +0.6%
                  </span>
                </div>
                <div className="hidden xl:block text-[10px] text-slate-400 truncate">
                  3 Vessels · 100% OPS
                </div>
              </div>
            </button>
          </div>

          {/* TOP-RIGHT: Adaptive Inspector Card (Constrained to Top Row height with internal scroll if needed) */}
          {inspectorOpen && selectedEntity ? (
            <div className="pointer-events-auto w-[270px] xl:w-[320px] max-h-full bg-white/95 border border-slate-200/90 rounded-2xl shadow-lg p-3 sm:p-3.5 text-slate-800 flex flex-col shrink-0 overflow-hidden">
              {/* Header with Icon, Title, and Action Buttons */}
              <div className="flex items-start justify-between gap-2 mb-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                    {getCategoryIcon(selectedEntity.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-blue-600 truncate">
                      {selectedEntity.linkedVesselName}
                    </div>
                    <div className="text-sm font-black text-slate-900 leading-tight truncate">
                      {selectedEntity.code}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {selectedEntity.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectEntity(selectedEntity)}
                    title="Focus in 3D view"
                    className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Crosshair className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openEntityBreakdown(selectedEntity, "TELEMETRY")
                    }
                    title="Open Telemetry, Feeder & ePort Breakdown Report"
                    className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorOpen(false)}
                    title="Minimize inspector"
                    className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Status Pill + Location */}
              <div className="flex items-center gap-1.5 mb-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getBadgeStyle(
                    selectedEntity.statusTone
                  )}`}
                >
                  {selectedEntity.statusLabel}
                </span>
                <span className="text-[11px] text-slate-600 truncate">
                  {selectedEntity.statusSubtext}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                      selectedEntity.statusTone
                    )}`}
                    style={{ width: `${selectedEntity.progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-600 shrink-0">
                  {selectedEntity.distanceOrRemainingText}
                </span>
              </div>

              {/* Scrollable Key-Value Operational Summary Rows (Adapts to available height) */}
              <div className="divide-y divide-slate-100 border-t border-slate-100 text-[11px] overflow-y-auto min-h-0 flex-1 pr-0.5">
                {selectedEntity.inspectorRows.map((row) => (
                  <div
                    key={row.label}
                    className="py-1.5 flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-400 font-medium shrink-0">
                      {row.label}
                    </span>
                    {row.highlight ? (
                      <button
                        type="button"
                        onClick={() =>
                          openEntityBreakdown(selectedEntity, "CONTAINERS")
                        }
                        className="font-bold text-blue-600 hover:underline text-right truncate cursor-pointer"
                      >
                        {row.value}
                      </button>
                    ) : (
                      <span className="font-bold text-slate-800 text-right truncate">
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* 2 Split Progressive Action Buttons */}
              <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openEntityBreakdown(selectedEntity, "TELEMETRY")
                  }
                  className="py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Activity className="w-3 h-3 shrink-0" />
                  <span className="truncate">Telemetry Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMeterModal) {
                      onOpenMeterModal(selectedEntity.id, "LIVE_MONITORING");
                    } else {
                      openEntityBreakdown(selectedEntity, "HISTORY");
                    }
                  }}
                  className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Gauge className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">Meter Diagram</span>
                </button>
              </div>
            </div>
          ) : (
            selectedEntity && (
              <button
                type="button"
                onClick={() => setInspectorOpen(true)}
                className="pointer-events-auto bg-white/95 hover:bg-white border border-slate-200/90 rounded-xl px-3 py-2 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800 shrink-0 cursor-pointer"
              >
                {getCategoryIcon(selectedEntity.category)}
                <span>{selectedEntity.code}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                    selectedEntity.statusTone
                  )}`}
                >
                  {selectedEntity.statusLabel}
                </span>
              </button>
            )
          )}
        </div>

        {/* -------------------------------------------------------------------
            BOTTOM ROW: Side-by-Side Flex Siblings (Never Overlap Horizontally!)
        ------------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-2.5 shrink-0 w-full">
          {/* BOTTOM-LEFT: Vessel Turnaround Lifecycle Stepper (Fluid Flex-1 + 5-Column Equal Grid) */}
          <div className="pointer-events-auto flex-1 min-w-0 max-w-full md:max-w-[740px] bg-white/95 border border-slate-200/90 rounded-2xl shadow-lg p-3 sm:p-3.5 overflow-hidden">
            {/* Compact Header Bar */}
            <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Ship className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-xs font-black text-slate-900 tracking-tight whitespace-nowrap">
                  Vessel Turnaround
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {vesselsList.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectEntity(v)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        activeVesselLifecycle.vesselId === v.id
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {v.name.replace("MV ", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Summary Trigger on < XL screens (prevents vertical stacking overflow) */}
              <button
                type="button"
                onClick={() =>
                  setVesselLifecycleModalId(activeVesselLifecycle.vesselId)
                }
                className="xl:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
              >
                <span>{activeVesselLifecycle.statusBadge}</span>
                <span className="text-blue-400">·</span>
                <span className="font-mono">Audit Sheet</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              {/* 5-Stage Equal-Column Grid Stepper (Guaranteed 100% inside card at any width!) */}
              <div className="flex-1 min-w-0 grid grid-cols-5 gap-1 relative pt-0.5">
                {activeVesselLifecycle.steps.map((step, idx) => {
                  const isDone = step.state === "COMPLETED";
                  const isCurrent = step.state === "ACTIVE";
                  const isLast = idx === activeVesselLifecycle.steps.length - 1;

                  return (
                    <div
                      key={step.label}
                      className="relative flex flex-col items-center text-center min-w-0 px-0.5"
                    >
                      {/* Connector Line to next step */}
                      {!isLast && (
                        <div className="absolute top-3.5 left-1/2 w-full h-0.5 bg-slate-200 z-0">
                          <div
                            className={`h-full ${
                              isDone
                                ? "w-full bg-blue-600"
                                : isCurrent
                                ? "w-1/2 bg-blue-400"
                                : "w-0"
                            }`}
                          />
                        </div>
                      )}

                      {/* Step Circle */}
                      <div
                        className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
                          isCurrent
                            ? "bg-blue-600 text-white ring-3 ring-blue-100 shadow-xs"
                            : isDone
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Step Label (Truncated/Clamped cleanly) */}
                      <div
                        className={`mt-1 text-[10px] sm:text-[11px] font-bold leading-tight w-full truncate ${
                          isCurrent
                            ? "text-slate-900"
                            : isDone
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                        title={step.label}
                      >
                        {getCompactStepLabel(step.label)}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 w-full truncate">
                        {step.time}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Summary Pill Box on XL+ Screens */}
              <button
                type="button"
                onClick={() =>
                  setVesselLifecycleModalId(activeVesselLifecycle.vesselId)
                }
                className="hidden xl:flex w-[205px] bg-slate-50/90 hover:bg-blue-50/50 border border-slate-200/80 rounded-xl p-2.5 items-center justify-between gap-2 transition-colors text-left shrink-0 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {activeVesselLifecycle.vesselName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {activeVesselLifecycle.operator}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 truncate">
                      {activeVesselLifecycle.statusBadge}
                    </span>
                  </div>
                  <div className="text-[9px] font-medium text-slate-500 mt-0.5 truncate">
                    {activeVesselLifecycle.etaText}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* BOTTOM-RIGHT: Adaptive Tabbed Equipment & Bay Switcher */}
          <div className="pointer-events-auto w-full md:w-[300px] lg:w-[335px] xl:w-[375px] shrink-0 bg-white/95 border border-slate-200/90 rounded-2xl shadow-lg p-2.5 sm:p-3 overflow-hidden">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full mb-2">
              <button
                type="button"
                onClick={() => setActiveTab("VESSELS")}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeTab === "VESSELS"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Vessels{" "}
                <span className="text-blue-600">{vesselsList.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("CRANES")}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeTab === "CRANES"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Cranes{" "}
                <span className="text-blue-600">3/{cranesList.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("TRUCKS")}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeTab === "TRUCKS"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Trucks{" "}
                <span className="text-blue-600">{trucksList.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("BAYS")}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeTab === "BAYS"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Bays <span className="text-blue-600">{baysList.length}</span>
              </button>
            </div>

            {/* Rows List */}
            <div className="divide-y divide-slate-100 max-h-[140px] sm:max-h-[160px] overflow-y-auto pr-0.5">
              {tabEntities.map((item) => {
                const isSelected = item.id === selectedEntityId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectEntity(item)}
                    className={`w-full py-1.5 px-2 flex items-center justify-between gap-1.5 text-left transition-colors rounded-xl cursor-pointer ${
                      isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-black text-slate-900 leading-tight truncate">
                        {item.code.replace("MV ", "")}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {item.statusSubtext}
                      </div>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getBadgeStyle(
                        item.statusTone
                      )}`}
                    >
                      {item.statusLabel}
                    </span>

                    <div className="w-9 shrink-0 text-right">
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mb-0.5">
                        <div
                          className={`h-full rounded-full ${getProgressColor(
                            item.statusTone
                          )}`}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                      <div className="text-[9px] font-bold text-slate-600">
                        {item.progressPercent}%
                      </div>
                    </div>

                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          6. LEVEL-2 PROGRESSIVE BREAKDOWN MODAL:
          Splits the rich historical Telemetry Feed reports by entity view
          (1. SCADA Feeder & Telemetry Curve | 2. ePort Container Manifest | 3. Historical Voyage Audit)
          ZERO repetition of the Top-Right Inspector summary rows!
      ===================================================================== */}
      {detailModalEntity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  {getCategoryIcon(detailModalEntity.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[10px]">
                      {detailModalEntity.useCaseId}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Serving {detailModalEntity.linkedVesselName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                        detailModalEntity.statusTone
                      )}`}
                    >
                      {detailModalEntity.statusLabel}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                    {detailModalEntity.drillDownTitle}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {detailModalEntity.drillDownSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalEntity(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Split Sub-Report Tabs Inside Breakdown Modal */}
            <div className="px-4 sm:px-5 pt-2.5 border-b border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setBreakdownTab("TELEMETRY")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    breakdownTab === "TELEMETRY"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>1. SCADA Feeder & Telemetry Curve</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("CONTAINERS")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    breakdownTab === "CONTAINERS"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    2. ePort Container Manifest (
                    {detailModalEntity.containersManifest.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("HISTORY")}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    breakdownTab === "HISTORY"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>3. Historical Voyage & 2D Map Replay</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400 pb-2 hidden sm:inline">
                Sub-Meter ID: {detailModalEntity.feederReport.meterId}
              </span>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
              {/* TAB 1: SCADA FEEDER & LIVE TELEMETRY CURVE */}
              {breakdownTab === "TELEMETRY" && (
                <>
                  {/* Substation Feeder Electrical & Carbon Report Strip */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-black text-slate-900">
                          {detailModalEntity.feederReport.feederCode} —{" "}
                          {detailModalEntity.feederReport.feederName}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono font-bold">
                        Protocol: {detailModalEntity.feederReport.protocol}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Active Power
                        </div>
                        <div className="text-sm font-black text-blue-600 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.activePowerKw.toLocaleString()}{" "}
                          kW
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Bus Voltage
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.voltageKv}
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Line Current
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.currentAmps} A
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          PF (cos φ) / Hz
                        </div>
                        <div className="text-sm font-black text-emerald-700 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.powerFactor} ·{" "}
                          {detailModalEntity.feederReport.frequencyHz}Hz
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 sm:col-span-2">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Recorded Energy / Intensity
                        </div>
                        <div className="text-xs font-black text-slate-900 mt-0.5 truncate">
                          {detailModalEntity.feederReport.intensityPerTeu}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Telemetry Time-Series Chart */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          {detailModalEntity.chartTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Cumulative recorded:{" "}
                          <strong className="text-slate-800">
                            {
                              detailModalEntity.feederReport
                                .totalCumulativeEnergy
                            }
                          </strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-blue-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          {detailModalEntity.chartPrimaryLabel} (
                          {detailModalEntity.chartPrimaryUnit})
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          {detailModalEntity.chartSecondaryLabel} (
                          {detailModalEntity.chartSecondaryUnit})
                        </span>
                      </div>
                    </div>

                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={detailModalEntity.telemetrySeries}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="entityPrimaryGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2563eb"
                                stopOpacity={0.28}
                              />
                              <stop
                                offset="95%"
                                stopColor="#2563eb"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: "#2563eb" }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: "#10b981" }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="primaryVal"
                            name={`${detailModalEntity.chartPrimaryLabel} (${detailModalEntity.chartPrimaryUnit})`}
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            fill="url(#entityPrimaryGrad)"
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="secondaryVal"
                            name={`${detailModalEntity.chartSecondaryLabel} (${detailModalEntity.chartSecondaryUnit})`}
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={0}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Timestamped Telemetry Event Log */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {detailModalEntity.telemetrySeries.map((pt, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-blue-600 mr-2">
                              {pt.time}
                            </span>
                            <span className="text-slate-700 font-medium">
                              {pt.statusNote}
                            </span>
                          </div>
                          <span className="font-mono font-black text-slate-900 shrink-0">
                            {pt.primaryVal} {detailModalEntity.chartPrimaryUnit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: EPORT CONTAINER MANIFEST & SLOT INVENTORY */}
              {breakdownTab === "CONTAINERS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Synchronized ePort & Navis N4 TOS Container Manifest
                      </h4>
                      <p className="text-xs text-slate-500">
                        Containers actively handled or stacked by{" "}
                        <strong className="text-slate-800">
                          {detailModalEntity.name}
                        </strong>{" "}
                        for{" "}
                        <strong className="text-blue-600">
                          {detailModalEntity.linkedVesselName}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                          <th className="py-3 px-3.5">Container No</th>
                          <th className="py-3 px-3">Size / Temp</th>
                          <th className="py-3 px-3">Bay / Slot Position</th>
                          <th className="py-3 px-3">Booking & Commodity</th>
                          <th className="py-3 px-3 text-right">Weight</th>
                          <th className="py-3 px-3.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailModalEntity.containersManifest.map((c) => (
                          <tr
                            key={c.containerNo}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="py-3 px-3.5 font-mono font-black text-slate-900">
                              {c.containerNo}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800">
                                {c.sizeType}
                              </span>
                              {c.isReefer ? (
                                <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                                  <Thermometer className="w-3 h-3" />
                                  {c.tempSetC}
                                </span>
                              ) : (
                                <span className="ml-1.5 text-[10px] text-slate-400">
                                  Dry
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-semibold text-blue-600">
                              {c.baySlot}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-800">
                                {c.commodity}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {c.bookingNo} · {c.vesselVoyage}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                              {c.weightKg.toLocaleString()} kg
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {c.status.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: HISTORICAL VOYAGES, 2D TRAJECTORY REPLAY & SUB-METER BREAKDOWN */}
              {breakdownTab === "HISTORY" && (
                <div className="space-y-5">
                  {/* Interactive 2D Historical Route / Voyage Replay & Sub-Meter Breakdown */}
                  <Historical2DReplayView
                    entity={detailModalEntity}
                    selectedLogIdx={selectedLogIdx}
                    onSelectLogIdx={setSelectedLogIdx}
                    onOpenMeterModal={(mId) => {
                      setDetailModalEntity(null);
                      onOpenMeterModal?.(mId);
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Scope 1 Direct Emissions (Fuel)
                      </div>
                      <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                        {detailModalEntity.feederReport.carbonScope1Kg.toLocaleString()}{" "}
                        kgCO₂e
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Scope 2 Grid Emissions (EVN 0.7221)
                      </div>
                      <div className="text-base font-black text-blue-600 mt-0.5 font-mono">
                        {detailModalEntity.feederReport.carbonScope2Kg.toLocaleString()}{" "}
                        kgCO₂e
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <div className="text-[10px] font-bold uppercase text-emerald-700">
                        Certified Intensity Metric
                      </div>
                      <div className="text-sm font-black text-emerald-900 mt-0.5">
                        {detailModalEntity.feederReport.intensityPerTeu}
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                          <th className="py-3 px-3.5">
                            Voyage / Shift Log (Click to Replay on 2D Map)
                          </th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Metered Energy / Fuel</th>
                          <th className="py-3 px-3 text-right">TEU / Units</th>
                          <th className="py-3 px-3 text-right">Intensity</th>
                          <th className="py-3 px-3.5 text-right">
                            Audit Verification
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailModalEntity.historicalReports.map((h, i) => {
                          const isSelectedRow = i === selectedLogIdx;
                          return (
                            <tr
                              key={i}
                              onClick={() => setSelectedLogIdx(i)}
                              className={`cursor-pointer transition-colors ${
                                isSelectedRow
                                  ? "bg-blue-50/80"
                                  : "hover:bg-slate-50/80"
                              }`}
                            >
                              <td className="py-3 px-3.5 font-black text-slate-900 flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isSelectedRow
                                      ? "bg-blue-600"
                                      : "bg-slate-300"
                                  }`}
                                />
                                <span>{h.voyageOrShift}</span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-500">
                                {h.date}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                {h.totalEnergyOrFuel}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                                {h.teuHandled.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-black text-blue-600">
                                {h.intensityMetric}
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {h.verifiedHash}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Minimal Modal Footer without redundant quick-maneuver buttons */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Sub-Meter: {detailModalEntity.feederReport.meterId} ·{" "}
                {detailModalEntity.feederReport.protocol}
              </span>
              <button
                type="button"
                onClick={() => setDetailModalEntity(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. LEVEL-2 VESSEL TURNAROUND & DCSA CARBON AUDIT MODAL
          Shows the 5-stage turnaround timeline + full port call energy/fuel & Scope 1/2 report
      ===================================================================== */}
      {activeModalVessel && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[10px]">
                    {activeModalVessel.useCaseId}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {activeModalVessel.berth} · IMO{" "}
                    {activeModalVessel.imoNumber}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {activeModalVessel.vesselName} — Port Call 2D Replay & Energy
                  Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalVessel.operator} · DCSA Invoice:{" "}
                  <strong className="font-mono text-slate-700">
                    {activeModalVessel.invoiceNumber}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVesselLifecycleModalId(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
              {/* Interactive 2D Port Call Voyage Lifecycle Animation & Linked Sub-Meter Breakdown */}
              <Historical2DReplayView
                entity={
                  TERMINAL_3D_ENTITIES.find(
                    (e) => e.id === activeModalVessel.vesselId
                  ) || TERMINAL_3D_ENTITIES[0]
                }
                onOpenMeterModal={(mId) => {
                  setVesselLifecycleModalId(null);
                  onOpenMeterModal?.(mId);
                }}
              />

              {/* Port Call Energy & Emissions Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80">
                  <div className="text-[10px] font-bold uppercase text-blue-700">
                    OPS Shore Power
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {activeModalVessel.opsCumulativeKwh.toLocaleString()} kWh
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    Saved{" "}
                    {(activeModalVessel.co2SavedByOpsKg / 1000).toFixed(1)}t CO₂
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Quay Cranes + Reefer
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {(
                      activeModalVessel.stsCumulativeKwh +
                      activeModalVessel.reeferCumulativeKwh
                    ).toLocaleString()}{" "}
                    kWh
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    STS {activeModalVessel.stsCumulativeKwh.toLocaleString()} +
                    Reefer{" "}
                    {activeModalVessel.reeferCumulativeKwh.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Tugboat + Yard Trucks
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {(
                      activeModalVessel.tugboatFuelLiters +
                      activeModalVessel.tractorFuelLiters
                    ).toLocaleString()}{" "}
                    Liters
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Tug {activeModalVessel.tugboatFuelLiters}L · Trucks{" "}
                    {activeModalVessel.tractorFuelLiters}L
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-800">
                    Port Call Carbon Intensity
                  </div>
                  <div className="text-sm font-black text-emerald-900 mt-0.5 font-mono">
                    {activeModalVessel.emissionPerTeuKg} kgCO₂e/TEU
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    Scope 1+2:{" "}
                    {(
                      (activeModalVessel.scope1Co2Kg +
                        activeModalVessel.scope2Co2Kg) /
                      1000
                    ).toFixed(1)}{" "}
                    tCO₂e
                  </div>
                </div>
              </div>

              {/* 5-Stage Detailed Turnaround Timeline */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  5-Stage Terminal Turnaround & Telemetry Milestones
                </div>
                {activeModalVessel.steps.map((step, index) => (
                  <div
                    key={step.label}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      step.state === "ACTIVE"
                        ? "bg-blue-50/70 border-blue-200"
                        : step.state === "COMPLETED"
                        ? "bg-slate-50 border-slate-200/80"
                        : "bg-white border-slate-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          step.state === "COMPLETED" || step.state === "ACTIVE"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          {step.label}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {step.detail}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {step.time}
                      </span>
                      <div className="text-[10px] font-bold uppercase text-blue-600">
                        {step.state === "COMPLETED"
                          ? "Completed"
                          : step.state === "ACTIVE"
                          ? "In Progress"
                          : "Scheduled"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                {activeModalVessel.vesselName} · {activeModalVessel.berth}
              </span>
              <button
                type="button"
                onClick={() => setVesselLifecycleModalId(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
