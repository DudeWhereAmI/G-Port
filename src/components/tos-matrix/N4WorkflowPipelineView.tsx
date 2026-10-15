import React, { useState } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Ship, 
  Truck, 
  Users, 
  Monitor, 
  Send, 
  RotateCcw, 
  FileSpreadsheet, 
  Settings2, 
  Tv, 
  Smartphone, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Radio 
} from "lucide-react";

interface WorkflowStep {
  stepNumber: number;
  title: string;
  vietnameseTitle: string;
  subtitle: string;
  icon: React.ReactNode;
  status: "COMPLETED" | "ACTIVE" | "PENDING";
  inputs: string[];
  subConfiguration: string;
  outputs: string[];
  twoWayAction?: string;
  details: {
    description: string;
    metrics: { label: string; value: string }[];
    records: string[];
  };
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNumber: 1,
    title: "Vessel & Crane Schedule",
    vietnameseTitle: "Lịch Tàu & Ma trận Cẩu Bến",
    subtitle: "TOS Integration / Excel / Key-In",
    icon: <Ship className="w-5 h-5 text-blue-600" />,
    status: "COMPLETED",
    inputs: ["TOS N4 REST API Sync", "EDI BAPLIE 2.2 Upload", "Direct Dispatcher Key-In"],
    subConfiguration: "Matrix Configuration (Hatch, Bay, Tier split)",
    outputs: ["Voyage CALF-250901 Active", "5 STS Cranes S01-S05 Assigned"],
    details: {
      description: "Ingests berth scheduling and crane moves matrices directly from Navis N4 TOS or Excel manifest files.",
      metrics: [
        { label: "Target Moves", value: "2,227 TEU" },
        { label: "Quay Cranes", value: "5 STS Allocated" },
        { label: "Berth Window", value: "11/02 20:00 - 12/02 09:00" }
      ],
      records: [
        "CALF-250901: Berth 02 confirmed (Depth 12.5m)",
        "S01-S05 Crane split validated by Marine Superintendent",
        "EDI BAPLIE manifest hash matched #OK-9921"
      ]
    }
  },
  {
    stepNumber: 2,
    title: "Other Equipment Schedule",
    vietnameseTitle: "Lịch Thiết bị Bãi (RTG, PM, Stacker)",
    subtitle: "RTG, Stacker & Prime Mover Allocation",
    icon: <Truck className="w-5 h-5 text-indigo-600" />,
    status: "COMPLETED",
    inputs: ["12 e-RTGs on Blocks 01-07", "3 Reach Stackers on P1/P3", "28 Prime Movers (PM)"],
    subConfiguration: "Manning Ratio Configuration (1.5x Operator Ratio)",
    outputs: ["Equipment Rosters Ready", "Microgrid Load Budgeted"],
    details: {
      description: "Calculates equipment requirements based on container move density and applies Manning Ratios for continuous port shift operations.",
      metrics: [
        { label: "e-RTGs Active", value: "12 Cranes (Feeder F02)" },
        { label: "Prime Movers", value: "28 Hauliers (e-ITV)" },
        { label: "Manning Ratio", value: "1.52x Operators/Machine" }
      ],
      records: [
        "Yard Blocks 01D, 05B assigned high-density RTG teams",
        "Stacker #03 allocated to Reefer Zone P1B",
        "Electric ITV fast-charge slots reserved at Station 2"
      ]
    }
  },
  {
    stepNumber: 3,
    title: "Sign Off",
    vietnameseTitle: "Ký Duyệt Tác Vụ & Chức Danh",
    subtitle: "Activity / Task Generation & Authorization",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    status: "COMPLETED",
    inputs: ["QCO (Quay Crane Operator)", "QCC & OBC (Quay & On-Board Checker)", "RTGO & PMO"],
    subConfiguration: "Role Certification & Safety Clearance",
    outputs: ["42 Operational Tasks Generated", "Sign-Off Timestamp #1102-1845"],
    twoWayAction: "Revoke Sign Off (Hủy Ký Duyệt)",
    details: {
      description: "Generates precise role-based work tasks (QCO, QCC, OBC, RTGO, PMO) and executes digital executive sign-off.",
      metrics: [
        { label: "QCO Tasks", value: "10 Certified Operators" },
        { label: "QCC / OBC Tasks", value: "12 Checkers" },
        { label: "RTGO Tasks", value: "18 Crane Drivers" }
      ],
      records: [
        "Executive Superintendent signed off Shift 3",
        "Zero safety non-conformances reported",
        "Digital Certificate ISO 14064 verified"
      ]
    }
  },
  {
    stepNumber: 4,
    title: "Operation Screen",
    vietnameseTitle: "Màn Hình Điều Độ Trung Tâm",
    subtitle: "Finalizing Activity/Task & Manpower Rules",
    icon: <Monitor className="w-5 h-5 text-amber-600" />,
    status: "ACTIVE",
    inputs: ["Real-time Manpower Board", "Shift Fatigue Tracker", "Terminal Weather Feed"],
    subConfiguration: "Employee Leaves & Allocation Rules Configuration & Rank/Rotation",
    outputs: ["Live Dispatch Matrix Active", "Break Rotations Scheduled"],
    details: {
      description: "Central command screen reconciling employee leave records, fatigue limits, rank hierarchies, and equipment rotation policies.",
      metrics: [
        { label: "Available Staff", value: "54 Crew on duty" },
        { label: "On Leave", value: "4 Staff (Covered)" },
        { label: "Fatigue Index", value: "Normal (Score 12/100)" }
      ],
      records: [
        "Automated rotation scheduled every 3 hours for STS operators",
        "Leave substitution rule R-04 executed for RTG Shift 2",
        "Weather alert: Low wind shear, safe for 40-ton lifts"
      ]
    }
  },
  {
    stepNumber: 5,
    title: "Deployment",
    vietnameseTitle: "Bố Trí Nhân Lực & Thiết Bị",
    subtitle: "Assigning Employee to Activity/Task",
    icon: <Users className="w-5 h-5 text-cyan-600" />,
    status: "ACTIVE",
    inputs: ["Biometric Gate Check-in", "Smart Radio Terminal IDs", "CHE Cab Tablet Pairing"],
    subConfiguration: "Asset-to-Worker Binding & GPS Pairing",
    outputs: ["All 42 Tasks Manned", "Live GPS Telemetry Broadcasting"],
    twoWayAction: "Deallocate (Giải Phóng Phân Bổ)",
    details: {
      description: "Locks the 1-to-1 binding between operators, handheld terminals, RFID credentials, and specific container handling equipment.",
      metrics: [
        { label: "Deployed Units", value: "45 Equipment Active" },
        { label: "Tablet Sync", value: "100% Connected" },
        { label: "Response SLA", value: "< 45 seconds" }
      ],
      records: [
        "Operator Nguyen Van A deployed to STS Crane S04",
        "Driver Tran D deployed to Prime Mover PM-14",
        "Checker Le T paired to Bay 51 Hatch OBC"
      ]
    }
  },
  {
    stepNumber: 6,
    title: "Execution",
    vietnameseTitle: "Thực Thi & Điều Chỉnh Trực Tuyến",
    subtitle: "Live Swaps, Add Activity, Equipment Changes",
    icon: <RefreshCw className="w-5 h-5 text-purple-600" />,
    status: "ACTIVE",
    inputs: ["Live Move Orders from TOS N4", "Substation SCADA Feeder Feeds", "Microgrid Load Caps"],
    subConfiguration: "Dynamic Re-planning & Exception Dispatch",
    outputs: ["Real-time Move Execution", "SCADA Power Telemetry Updated"],
    twoWayAction: "Update & Re-broadcast",
    details: {
      description: "Handles live on-the-fly terminal operational adjustments: operator swaps, emergency equipment substitutes, and re-routing around congestion.",
      metrics: [
        { label: "Moves Completed", value: "1,420 / 2,227 TEU" },
        { label: "Current Rate", value: "29.4 Gross Moves/hr" },
        { label: "Dynamic Swaps", value: "2 Executed (Smooth)" }
      ],
      records: [
        "Re-routed PM-08 to Yard Block 03D to prevent bottleneck",
        "Added helper PM-29 to Bay 43 discharge cycle",
        "SCADA Feeder F01 peak load capped at 2,200 kW"
      ]
    }
  },
  {
    stepNumber: 7,
    title: "Broadcast",
    vietnameseTitle: "Phát Sóng & Hiển Thị Đa Nền Tảng",
    subtitle: "Publish Deployment to Display TV & Mobile",
    icon: <Radio className="w-5 h-5 text-rose-600" />,
    status: "ACTIVE",
    inputs: ["Terminal Wall Displays (TV)", "Mobile PWA Driver Apps", "Quayside Digital Boards"],
    subConfiguration: "Multi-channel Push Notification Broker",
    outputs: ["Real-time Status on Big Screens", "PWA Driver Updates Live"],
    details: {
      description: "Broadcasts continuous deployment schedules and real-time operational status to Operations Room wall monitors and worker mobile devices.",
      metrics: [
        { label: "TV Display Hubs", value: "8 Hubs Broadcasting" },
        { label: "Active Mobile PWAs", value: "62 Handhelds" },
        { label: "WebSocket Latency", value: "18 ms" }
      ],
      records: [
        "Cat Lai Operations Center Central TV Stream OK",
        "Driver PWA push notifications confirmed for Shift 3",
        "Quayside LED Bay boards displaying active crane allocations"
      ]
    }
  }
];

export const N4WorkflowPipelineView: React.FC = () => {
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(3); // Step 4 selected by default
  const [syncedWithTOS, setSyncedWithTOS] = useState(true);

  const currentStep = WORKFLOW_STEPS[selectedStepIdx];

  return (
    <div className="space-y-4">
      {/* ================================================================== */}
      {/* 1. HEADER & PIPELINE OVERVIEW (IMAGE 3) */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-[#004B91]">
                N4 TOS WORKFLOW MATRIX
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                End-to-End Terminal Integration & Equipment Dispatch Pipeline
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Follows the 7-phase operational matrix linking Navis N4 berth schedules, manning ratios, sign-off, deployment, and SCADA execution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSyncedWithTOS(!syncedWithTOS)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncedWithTOS ? "text-emerald-600 animate-spin-slow" : "text-slate-400"}`} />
              <span>{syncedWithTOS ? "TOS N4 Connected (Syncing)" : "TOS Paused"}</span>
            </button>
          </div>
        </div>

        {/* 7 CHEVRON STEPS HORIZONTAL TRACK */}
        <div className="mt-4 overflow-x-auto no-scrollbar py-2">
          <div className="min-w-[900px] grid grid-cols-7 gap-2">
            {WORKFLOW_STEPS.map((s, idx) => {
              const isSelected = selectedStepIdx === idx;
              return (
                <div
                  key={s.stepNumber}
                  onClick={() => setSelectedStepIdx(idx)}
                  className={`rounded-xl p-3 border cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? "bg-blue-50/90 border-[#004B91] shadow-md ring-2 ring-blue-500/20"
                      : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-[#004B91] text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      Stage {s.stepNumber}
                    </span>
                    <span className="p-1 rounded-full bg-white shadow-2xs">
                      {s.icon}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-slate-900 leading-snug truncate">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {s.vietnameseTitle}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-mono">
                    <span className={`font-bold ${
                      s.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      ● {s.status}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. STAGE DRILL-DOWN INSPECTION CARD */}
      {/* ================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left Drill-Down Details */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#004B91]">
                {currentStep.icon}
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[#004B91] uppercase">
                  Stage {currentStep.stepNumber} Execution Detail
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {currentStep.title} ({currentStep.vietnameseTitle})
                </h3>
                <p className="text-xs text-slate-500">
                  {currentStep.details.description}
                </p>
              </div>
            </div>

            {/* Inputs & Outputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block mb-1.5">
                  Direct Ingest / Sources
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {currentStep.inputs.map((inItem, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>{inItem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block mb-1.5">
                  Sub-Configuration & Rules
                </span>
                <div className="text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 mb-2">
                  {currentStep.subConfiguration}
                </div>
                {currentStep.twoWayAction && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Loop: {currentStep.twoWayAction}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Logs & Audit Trails */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-xs space-y-1.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-between border-b border-slate-800 pb-1">
                <span>Verified Operation Records</span>
                <span className="text-emerald-400">● LIVE AUDIT READY</span>
              </div>
              {currentStep.details.records.map((rec, rIdx) => (
                <div key={rIdx} className="text-[11px] flex items-center gap-2">
                  <span className="text-slate-500">&gt;</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Metrics & Quick Actions */}
          <div className="lg:w-80 shrink-0 space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Stage Metrics & SLAs
              </div>
              <div className="space-y-2">
                {currentStep.details.metrics.map((m, mIdx) => (
                  <div key={mIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{m.label}</span>
                    <strong className="text-xs font-black text-slate-900 font-mono">{m.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcaster Quick Status */}
            <div className="bg-gradient-to-br from-[#004B91] to-blue-900 text-white rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Tv className="w-4 h-4 text-sky-300" />
                <span>Publishing Channels</span>
              </div>
              <div className="text-xs text-sky-100">
                Connected to Operations Video Wall & Driver PWA Mobile App.
              </div>
              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mobile PWA: Active</span>
                </span>
                <span className="text-emerald-300 font-bold">62 Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
