import React, { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { MetaLine } from "../components/ui";
import { breadcrumbOf } from "../components/shell/pages";
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
import {
  PortTerminal2DStrategyMap,
  TerminalStrategyZone,
  ENTITY_TIMELINE_WAYPOINTS,
  TimelineWaypoint,
  computeLiveEntityState,
} from "../components/terminal-3d/PortTerminal2DStrategyMap";
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
  focusedTelemetryPopupMode?: "TURNAROUND" | "BREAKDOWN";
  onClearFocusedTelemetryEntity?: () => void;
}

type BreakdownTab = "TELEMETRY" | "CONTAINERS" | "HISTORY";

export const InputLayerPage: React.FC<InputLayerPageProps> = ({
  onOpenMeterModal,
  focusedTelemetryEntityId,
  focusedTelemetryPopupMode = "TURNAROUND",
  onClearFocusedTelemetryEntity,
}) => {
  const { t } = useLanguage();
  // 2D Strategic Map is the primary view; 3D is hidden by default
  const [mapMode, setMapMode] = useState<"2D" | "3D">("2D");
  const [selectedZone, setSelectedZone] = useState<TerminalStrategyZone | null>(
    null
  );
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<TerminalEntityCategory | null>(null);

  // Progressive disclosure: null initially so only the map & selection options appear on load
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TerminalEntityCategory>("VESSELS");
  const [detailModalEntity, setDetailModalEntity] =
    useState<Terminal3DEntity | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>("TELEMETRY");
  const [selectedLogIdx, setSelectedLogIdx] = useState<number>(0);
  const [vesselLifecycleModalId, setVesselLifecycleModalId] = useState<
    string | null
  >(null);
  const [focusedWaypoint, setFocusedWaypoint] =
    useState<TimelineWaypoint | null>(null);
  const [loopSec, setLoopSec] = useState<number>(0);
  const [leftListCollapsed, setLeftListCollapsed] = useState<boolean>(false);
  const [entityListOpen, setEntityListOpen] = useState<boolean>(false);

  // When traced from Overview Berth Operation Map or Carbon Invoices, focus the target entity and open the requested popup
  React.useEffect(() => {
    if (!focusedTelemetryEntityId) return;
    const found = TERMINAL_3D_ENTITIES.find(
      (e) => e.id === focusedTelemetryEntityId
    );
    if (found) {
      setSelectedEntityId(found.id);
      setActiveTab(found.category);
      setActiveCategoryFilter(found.category);
      setInspectorOpen(true);
      setEntityListOpen(true);
      setLeftListCollapsed(true);
      if (focusedTelemetryPopupMode === "BREAKDOWN") {
        setDetailModalEntity(found);
        setBreakdownTab("TELEMETRY");
      } else {
        setVesselLifecycleModalId(found.linkedVesselId);
      }
    }
    onClearFocusedTelemetryEntity?.();
  }, [
    focusedTelemetryEntityId,
    focusedTelemetryPopupMode,
    onClearFocusedTelemetryEntity,
  ]);

  const selectedEntity = useMemo(
    () =>
      selectedEntityId
        ? TERMINAL_3D_ENTITIES.find((e) => e.id === selectedEntityId) || null
        : null,
    [selectedEntityId]
  );

  // Linked Vessel for the Audit Modal:
  const activeVesselLifecycle = useMemo(() => {
    const vesselId = selectedEntity?.linkedVesselId || "VSL-01";
    return VESSEL_LIFECYCLE_BY_ID[vesselId] || VESSEL_LIFECYCLE_BY_ID["VSL-01"];
  }, [selectedEntity]);

  // Entity-specific Google Maps Timeline waypoints (tracks vessels from sea + towage, or crane/truck/bay timeline)
  const activeEntityWaypoints = useMemo(() => {
    if (!selectedEntity) return [];
    return ENTITY_TIMELINE_WAYPOINTS[selectedEntity.id] || [];
  }, [selectedEntity]);

  const selectedEntityLiveState = useMemo(() => {
    if (!selectedEntity) return null;
    return computeLiveEntityState(selectedEntity.id, loopSec);
  }, [selectedEntity, loopSec]);

  const activeTimelinePoint = useMemo(() => {
    if (
      focusedWaypoint &&
      activeEntityWaypoints.some((w) => w.id === focusedWaypoint.id)
    ) {
      return focusedWaypoint;
    }
    const liveMatched = activeEntityWaypoints.find(
      (w) =>
        w.activeWindowSec &&
        loopSec >= w.activeWindowSec[0] &&
        loopSec < w.activeWindowSec[1]
    );
    if (liveMatched) return liveMatched;
    return (
      activeEntityWaypoints.find((w) => w.state === "ACTIVE") ||
      activeEntityWaypoints[activeEntityWaypoints.length - 1] ||
      null
    );
  }, [focusedWaypoint, activeEntityWaypoints, loopSec]);

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
    let baseList: Terminal3DEntity[] = [];
    switch (activeTab) {
      case "VESSELS":
        baseList = vesselsList;
        break;
      case "CRANES":
        baseList = cranesList;
        break;
      case "TRUCKS":
        baseList = trucksList;
        break;
      case "BAYS":
        baseList = baysList;
        break;
    }
    if (selectedZone) {
      const zoneFiltered = baseList.filter((e) =>
        selectedZone.entityIds.includes(e.id)
      );
      if (zoneFiltered.length > 0) return zoneFiltered;
    }
    return baseList;
  }, [activeTab, vesselsList, cranesList, trucksList, baysList, selectedZone]);

  const handleSelectEntity = (entity: Terminal3DEntity) => {
    setSelectedEntityId(entity.id);
    setFocusedWaypoint(null);
    setInspectorOpen(true);
    setEntityListOpen(true);
    setLeftListCollapsed(true);
    setActiveTab(entity.category);
    setActiveCategoryFilter(entity.category);
  };

  const handleSelectCategoryFilter = (cat: TerminalEntityCategory | null) => {
    setActiveCategoryFilter(cat);
    setFocusedWaypoint(null);
    if (cat) {
      setActiveTab(cat);
      setEntityListOpen(true);
      setLeftListCollapsed(true);
    } else {
      setSelectedEntityId(null);
      setInspectorOpen(false);
      setEntityListOpen(false);
    }
  };

  const handleSelectZone = (zone: TerminalStrategyZone | null) => {
    setSelectedZone(zone);
    setFocusedWaypoint(null);
    if (zone) {
      setEntityListOpen(true);
      setLeftListCollapsed(true);
    } else {
      setSelectedEntityId(null);
      setInspectorOpen(false);
      setEntityListOpen(false);
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

  const getEntityTimelineTitle = (category: TerminalEntityCategory) => {
    switch (category) {
      case "VESSELS":
        return t("Vessel Sea-to-Berth & towage turnaround", "Hành trình tàu từ ngoài khơi, lai dắt & cập bến");
      case "CRANES":
        return t("Quay crane shift & hoist timeline", "Tiến độ ca trực & chu kỳ cẩu bờ STS");
      case "TRUCKS":
        return t("Yard truck route & stops timeline", "Lộ trình & điểm dừng xe đầu kéo nội cảng");
      case "BAYS":
        return t("Container bay stacking & cooling timeline", "Chu kỳ xếp chồng & làm lạnh bãi container");
    }
  };

  const activeModalVessel = vesselLifecycleModalId
    ? VESSEL_LIFECYCLE_BY_ID[vesselLifecycleModalId]
    : null;

  const showEntityListPanel =
    entityListOpen &&
    (activeCategoryFilter !== null ||
      selectedZone !== null ||
      selectedEntity !== null);

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 px-1 shrink-0">
        <div className="min-w-0">
          <div className="text-xs text-muted">{breadcrumbOf("INPUT_LAYER", t).join(" / ")}</div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{t("Telemetry", "Telemetry")}</h1>
        </div>
        <div className="text-xs text-muted">
          <MetaLine items={[t("Live 2D / 3D terminal map", "Bản đồ cảng 2D / 3D trực tuyến"), t("Source: SCADA · TOS N4 · meters", "Nguồn: SCADA · TOS N4 · công tơ"), t("Updated 11:40", "Cập nhật lúc 11:40")]} />
        </div>
      </div>
    <div className="relative w-full flex-1 min-h-0 rounded-card overflow-hidden border border-line bg-[#AADAFF] select-none flex flex-col">
      {/* 1. Primary 2D Strategic Port Terminal Map */}
      {mapMode === "2D" ? (
        <PortTerminal2DStrategyMap
          selectedZoneId={selectedZone?.id || null}
          onSelectZone={handleSelectZone}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
          activeCategoryFilter={activeCategoryFilter}
          onSelectCategoryFilter={handleSelectCategoryFilter}
          focusedWaypoint={focusedWaypoint}
          onSelectWaypoint={(wp) => {
            if (wp) setLeftListCollapsed(true);
            setFocusedWaypoint(wp);
          }}
          onLoopTimeChange={setLoopSec}
          leftListCollapsed={leftListCollapsed}
          onToggleLeftListCollapsed={setLeftListCollapsed}
        />
      ) : (
        <PortTerminal3DScene
          selectedEntityId={selectedEntityId || "TRK-2481"}
          onSelectEntity={handleSelectEntity}
          inspectorOpen={inspectorOpen}
        />
      )}

      {/* =====================================================================
          2. PROGRESSIVE DISCLOSURE OVERLAY
          Dynamically adapts left padding when Khu vực Cảng is collapsed so
          Timeline, Inspector, and Entity List cards expand across the freed space.
      ===================================================================== */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-3.5 pr-14 gap-2.5 overflow-hidden transition-all duration-200 ${
          leftListCollapsed ? "pl-13 sm:pl-14" : "pl-62 sm:pl-68"
        }`}
      >
        {/* TOP ROW: Spacer on Left + Right Inspector Card */}
        <div className="flex items-start justify-end gap-2.5 min-h-0 flex-1 overflow-hidden pt-11 sm:pt-12">
          {/* TOP-RIGHT: Adaptive Inspector Card (Appears ONLY when an entity is selected) */}
          {inspectorOpen && selectedEntity ? (
            <div className="pointer-events-auto w-[280px] sm:w-[310px] xl:w-[350px] max-h-full bg-white/95 border border-slate-200/90 rounded-2xl shadow-lg p-3 sm:p-3.5 text-slate-800 flex flex-col shrink-0 overflow-hidden animate-in fade-in transition-all duration-200">
              {/* Header with Icon, Title, and Action Buttons */}
              <div className="flex items-start justify-between gap-2 mb-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                    {getCategoryIcon(selectedEntity.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-blue-600 truncate">
                      {selectedEntity.linkedVesselName}
                    </div>
                    <div className="text-sm font-black text-slate-900 leading-tight truncate">
                      {selectedEntity.code}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {selectedEntity.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectEntity(selectedEntity)}
                    title="Focus unit"
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
                    onClick={() => {
                      setInspectorOpen(false);
                      setSelectedEntityId(null);
                    }}
                    title="Close inspector"
                    className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Concise Live Destination & Status Strip (No verbose dwell-second text) */}
              <div className="mb-2 px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold border shrink-0 ${getBadgeStyle(
                      selectedEntity.statusTone
                    )}`}
                  >
                    {selectedEntity.statusLabel}
                  </span>
                  <span className="text-xs font-mono font-bold text-brand truncate">
                    {selectedEntityLiveState?.liveMetric ||
                      selectedEntity.distanceOrRemainingText}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {selectedEntityLiveState?.destinationLabel ||
                    selectedEntity.statusSubtext}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${getProgressColor(
                      selectedEntity.statusTone
                    )}`}
                    style={{ width: `${selectedEntity.progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  {selectedEntity.distanceOrRemainingText}
                </span>
              </div>

              {/* Scrollable Key-Value Operational Summary Rows */}
              <div className="divide-y divide-slate-100 border-t border-slate-100 text-xs overflow-y-auto min-h-0 flex-1 pr-0.5">
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
                  className="py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Activity className="w-3 h-3 shrink-0" />
                  <span className="truncate">{t("Telemetry report", "Báo cáo telemetry")}</span>
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
                  className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Gauge className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">{t("Meter diagram", "Sơ đồ đồng hồ")}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* -------------------------------------------------------------------
            BOTTOM ROW: Flexibly stretches across freed horizontal space when
            Khu vực Cảng or either bottom card is collapsed/closed!
        ------------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-2.5 shrink-0 w-full">
          {/* BOTTOM-LEFT: Entity-Adapted Timeline Card (Expands flexibly with flex-1, no restrictive max-w cap!) */}
          {selectedEntity ? (
            <div className="pointer-events-auto flex-1 min-w-0 bg-white/95 border border-slate-200/90 rounded-2xl shadow-lg p-3 sm:p-3.5 overflow-hidden animate-in fade-in transition-all duration-200">
              {/* Compact Header Bar */}
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {getCategoryIcon(selectedEntity.category)}
                  <span className="text-xs font-black text-slate-900 tracking-tight whitespace-nowrap">
                    {getEntityTimelineTitle(selectedEntity.category)}
                  </span>

                  {selectedEntity.category === "VESSELS" ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {vesselsList.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectEntity(v)}
                          className={`px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            selectedEntity.id === v.id
                              ? "bg-brand text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {v.name.replace("MV ", "")}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-brand border border-blue-200 text-xs font-bold truncate">
                      {selectedEntity.code} · {selectedEntity.linkedVesselName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!entityListOpen && (
                    <button
                      type="button"
                      onClick={() => setEntityListOpen(true)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      {t("List", "Danh sách")} ({tabEntities.length})
                    </button>
                  )}
                  {focusedWaypoint && (
                    <button
                      type="button"
                      onClick={() => setFocusedWaypoint(null)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      {t("Reset zoom", "Thu nhỏ")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEntity.category === "VESSELS") {
                        setVesselLifecycleModalId(
                          activeVesselLifecycle.vesselId
                        );
                      } else {
                        openEntityBreakdown(selectedEntity, "HISTORY");
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand border border-blue-200 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    <span>
                      {selectedEntity.category === "VESSELS"
                        ? t("Port call audit", "Kiểm toán Lượt tàu")
                        : t("2D Route log", "Nhật ký Lộ trình 2D")}
                    </span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Interactive Timeline Checkpoints — Click any past/active point to zoom the 2D map directly to that checkpoint */}
              <div
                className="grid gap-1.5 relative pt-0.5"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    activeEntityWaypoints.length,
                    1
                  )}, minmax(0, 1fr))`,
                }}
              >
                {activeEntityWaypoints.map((wp, idx) => {
                  const isLiveStep =
                    wp.activeWindowSec &&
                    loopSec >= wp.activeWindowSec[0] &&
                    loopSec < wp.activeWindowSec[1];
                  const isDone =
                    wp.state === "COMPLETED" ||
                    (wp.activeWindowSec && loopSec >= wp.activeWindowSec[1]);
                  const isCurrent = isLiveStep || wp.state === "ACTIVE";
                  const isFocused = focusedWaypoint?.id === wp.id;
                  const isLast = idx === activeEntityWaypoints.length - 1;

                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => {
                        setLeftListCollapsed(true);
                        setFocusedWaypoint(wp);
                      }}
                      className={`group relative flex flex-col items-center text-center min-w-0 px-1.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                        isFocused
                          ? "bg-blue-50/90 ring-1 ring-brand"
                          : isLiveStep
                          ? "bg-blue-50/50 ring-1 ring-blue-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {!isLast && (
                        <div className="absolute top-4.5 left-1/2 w-full h-0.5 bg-slate-200 z-0 pointer-events-none">
                          <div
                            className={`h-full ${
                              isDone
                                ? "w-full bg-brand"
                                : isCurrent
                                ? "w-1/2 bg-blue-400"
                                : "w-0"
                            }`}
                          />
                        </div>
                      )}

                      <div
                        className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                          isFocused || isLiveStep
                            ? "bg-brand text-white ring-3 ring-blue-100 scale-105"
                            : isCurrent
                            ? "bg-brand text-white ring-3 ring-blue-100 shadow-xs"
                            : isDone
                            ? "bg-brand text-white"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isDone && !isFocused && !isLiveStep ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div
                        className={`mt-1 text-xs sm:text-xs font-bold leading-tight w-full truncate ${
                          isFocused || isLiveStep || isCurrent
                            ? "text-brand"
                            : isDone
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                        title={wp.title}
                      >
                        {wp.title}
                      </div>
                      <div className="text-xs sm:text-xs text-slate-400 font-medium mt-0.5 w-full truncate">
                        {wp.time}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Clean Concise Active Point Summary Strip (No "Dừng Xs" text) */}
              {activeTimelinePoint && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold shrink-0 bg-blue-50 text-brand border border-blue-200">
                      {activeTimelinePoint.time}
                    </span>
                    <span className="font-bold text-slate-800 truncate">
                      {!focusedWaypoint && selectedEntityLiveState
                        ? selectedEntityLiveState.destinationLabel
                        : activeTimelinePoint.title}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">·</span>
                    <span className="text-slate-500 truncate hidden sm:inline">
                      {!focusedWaypoint && selectedEntityLiveState
                        ? selectedEntityLiveState.activityText
                        : activeTimelinePoint.subtitle}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold shrink-0">
                    {!focusedWaypoint && selectedEntityLiveState
                      ? selectedEntityLiveState.liveMetric
                      : activeTimelinePoint.metricBadge}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:block flex-1" />
          )}

          {/* BOTTOM-RIGHT: Adaptive Tabbed Equipment & Bay Switcher (Flexibly adapts width/height; closing it lets Timeline stretch full width) */}
          {showEntityListPanel && (
            <div
              className={`pointer-events-auto shrink-0 bg-white/95 border border-slate-200/90 rounded-2xl shadow-lg p-2.5 sm:p-3 overflow-hidden animate-in fade-in transition-all duration-200 ${
                selectedEntity
                  ? "w-full md:w-[300px] lg:w-[340px] xl:w-[380px]"
                  : "w-full md:w-[420px] lg:w-[480px]"
              }`}
            >
              {/* Top Title + Close Button */}
              <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
                <span className="text-xs font-black text-slate-800 truncate">
                  {selectedZone
                    ? `${selectedZone.name}`
                    : t("Terminal entities list", "Danh sách đối tượng terminal")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedEntity) {
                      // Close just the list panel so the Timeline Card stretches across the full bottom width!
                      setEntityListOpen(false);
                    } else {
                      setEntityListOpen(false);
                      setActiveCategoryFilter(null);
                      setSelectedZone(null);
                    }
                  }}
                  className="w-5 h-5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                  title={t("Close list to expand timeline", "Đóng danh sách để mở rộng khung Timeline")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("VESSELS");
                    setActiveCategoryFilter("VESSELS");
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-xs sm:text-xs font-bold transition-all cursor-pointer truncate ${
                    activeTab === "VESSELS"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t("Vessels", "Tàu")}{" "}
                  <span className="text-blue-600">{vesselsList.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("CRANES");
                    setActiveCategoryFilter("CRANES");
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-xs sm:text-xs font-bold transition-all cursor-pointer truncate ${
                    activeTab === "CRANES"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t("Cranes", "Cẩu")}{" "}
                  <span className="text-blue-600">3/{cranesList.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("TRUCKS");
                    setActiveCategoryFilter("TRUCKS");
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-xs sm:text-xs font-bold transition-all cursor-pointer truncate ${
                    activeTab === "TRUCKS"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t("Trucks", "Xe")}{" "}
                  <span className="text-blue-600">{trucksList.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("BAYS");
                    setActiveCategoryFilter("BAYS");
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-xs sm:text-xs font-bold transition-all cursor-pointer truncate ${
                    activeTab === "BAYS"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t("Bays", "Bãi")} <span className="text-blue-600">{baysList.length}</span>
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
                        <div className="text-xs font-black text-slate-900 leading-tight truncate">
                          {item.code.replace("MV ", "")}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate">
                          {item.statusSubtext}
                        </div>
                      </div>

                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-bold border shrink-0 ${getBadgeStyle(
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
                        <div className="text-xs font-bold text-slate-600">
                          {item.progressPercent}%
                        </div>
                      </div>

                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-xs">
                      {detailModalEntity.useCaseId}
                    </span>
                    <span className="text-xs font-bold text-blue-600">
                      Serving {detailModalEntity.linkedVesselName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold border ${getBadgeStyle(
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
                  <span>{t("1. SCADA feeder & telemetry curve", "1. Lộ xuất tuyến SCADA & đồ thị telemetry")}</span>
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
                    {t("2. ePort container manifest", "2. Bảng Kê container ePort")} (
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
                  <span>{t("3. Historical voyage & 2D map replay", "3. Lịch sử chuyến tàu & mô phỏng 2D")}</span>
                </button>
              </div>

              <span className="text-xs font-mono text-slate-400 pb-2 hidden sm:inline">
                {t("Sub-Meter ID:", "Mã đồng hồ:")} {detailModalEntity.feederReport.meterId}
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
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                        Protocol: {detailModalEntity.feederReport.protocol}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-xs font-bold text-slate-400">
                          Active Power
                        </div>
                        <div className="text-sm font-black text-blue-600 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.activePowerKw.toLocaleString()}{" "}
                          kW
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-xs font-bold text-slate-400">
                          Bus Voltage
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.voltageKv}
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-xs font-bold text-slate-400">
                          Line Current
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.currentAmps} A
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <div className="text-xs font-bold text-slate-400">
                          PF (cos φ) / Hz
                        </div>
                        <div className="text-sm font-black text-emerald-700 mt-0.5 font-mono">
                          {detailModalEntity.feederReport.powerFactor} ·{" "}
                          {detailModalEntity.feederReport.frequencyHz}Hz
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 sm:col-span-2">
                        <div className="text-xs font-bold text-slate-400">
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
                        <h4 className="text-xs font-black text-slate-800">
                          {detailModalEntity.chartTitle}
                        </h4>
                        <p className="text-xs text-slate-500">
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
                      <h4 className="text-xs font-black text-slate-800">
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
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
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
                                <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
                                  <Thermometer className="w-3 h-3" />
                                  {c.tempSetC}
                                </span>
                              ) : (
                                <span className="ml-1.5 text-xs text-slate-400">
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
                              <div className="text-xs font-mono text-slate-400">
                                {c.bookingNo} · {c.vesselVoyage}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                              {c.weightKg.toLocaleString()} kg
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                      <div className="text-xs font-bold text-slate-400">
                        Scope 1 Direct Emissions (Fuel)
                      </div>
                      <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                        {detailModalEntity.feederReport.carbonScope1Kg.toLocaleString()}{" "}
                        kgCO₂e
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-400">
                        Scope 2 Grid Emissions (EVN 0.7221)
                      </div>
                      <div className="text-base font-black text-blue-600 mt-0.5 font-mono">
                        {detailModalEntity.feederReport.carbonScope2Kg.toLocaleString()}{" "}
                        kgCO₂e
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-700">
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
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
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
                                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
              <span className="text-xs text-slate-500 font-mono">
                {t("Sub-Meter:", "Đồng hồ phụ:")} {detailModalEntity.feederReport.meterId} ·{" "}
                {detailModalEntity.feederReport.protocol}
              </span>
              <button
                type="button"
                onClick={() => setDetailModalEntity(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                {t("Close", "Đóng")}
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
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-xs">
                    {activeModalVessel.useCaseId}
                  </span>
                  <span className="text-xs font-bold text-blue-600">
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
                  <div className="text-xs font-bold text-blue-700">
                    OPS Shore Power
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {activeModalVessel.opsCumulativeKwh.toLocaleString()} kWh
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                    Saved{" "}
                    {(activeModalVessel.co2SavedByOpsKg / 1000).toFixed(1)}t CO₂
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-400">
                    Quay Cranes + Reefer
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {(
                      activeModalVessel.stsCumulativeKwh +
                      activeModalVessel.reeferCumulativeKwh
                    ).toLocaleString()}{" "}
                    kWh
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    STS {activeModalVessel.stsCumulativeKwh.toLocaleString()} +
                    Reefer{" "}
                    {activeModalVessel.reeferCumulativeKwh.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-400">
                    Tugboat + Yard Trucks
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {(
                      activeModalVessel.tugboatFuelLiters +
                      activeModalVessel.tractorFuelLiters
                    ).toLocaleString()}{" "}
                    Liters
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tug {activeModalVessel.tugboatFuelLiters}L · Trucks{" "}
                    {activeModalVessel.tractorFuelLiters}L
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800">
                    Port Call Carbon Intensity
                  </div>
                  <div className="text-sm font-black text-emerald-900 mt-0.5 font-mono">
                    {activeModalVessel.emissionPerTeuKg} kgCO₂e/TEU
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">
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
                <div className="text-xs font-bold text-slate-400">
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
                        <div className="text-xs text-slate-500">
                          {step.detail}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {step.time}
                      </span>
                      <div className="text-xs font-bold text-blue-600">
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
              <span className="text-xs text-slate-500 font-mono">
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
    </div>
  );
};
