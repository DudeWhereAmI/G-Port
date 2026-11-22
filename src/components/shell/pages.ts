import {
  Activity,
  CalendarClock,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  Handshake,
  LayoutDashboard,
  Leaf,
  ScrollText,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Calculator,
  type LucideIcon,
} from "lucide-react";
import type { SubPageId } from "../../types/gport";
import type { BilingualText } from "../../data/module1Forecast";

export interface PageMeta {
  id: SubPageId;
  name: BilingualText;
  icon: LucideIcon;
  group: "OPS" | "ENERGY" | "CARBON" | "SYSTEM";
  /** grey module tag, e.g. M-1 */
  module?: string;
  /** shown in the sidebar (other pages stay reachable from the command palette) */
  inSidebar: boolean;
}

export const GROUPS: { id: PageMeta["group"]; name: BilingualText }[] = [
  { id: "OPS", name: { en: "Operations", vn: "Vận hành" } },
  { id: "ENERGY", name: { en: "Energy", vn: "Năng lượng" } },
  { id: "CARBON", name: { en: "Carbon", vn: "Carbon" } },
  { id: "SYSTEM", name: { en: "System", vn: "Hệ thống" } },
];

export const PAGES: PageMeta[] = [
  { id: "OVERVIEW", name: { en: "Overview", vn: "Tổng quan" }, icon: LayoutDashboard, group: "OPS", inSidebar: true },
  { id: "INPUT_LAYER", name: { en: "Telemetry", vn: "Telemetry" }, icon: Activity, group: "OPS", inSidebar: true },
  { id: "VESSEL_SCHEDULE", name: { en: "Vessel schedule", vn: "Lịch tàu" }, icon: CalendarClock, group: "OPS", inSidebar: true },
  { id: "MODULE_1_FORECAST", name: { en: "Load forecast", vn: "Dự báo phụ tải" }, icon: TrendingUp, group: "ENERGY", module: "M-1", inSidebar: true },
  { id: "MODULE_3_OPTIMIZATION", name: { en: "Dispatch & peak shaving", vn: "Điều độ & cắt đỉnh" }, icon: SlidersHorizontal, group: "ENERGY", module: "M-3", inSidebar: true },
  { id: "VESSEL_CARBON_INVOICE", name: { en: "Carbon accounting", vn: "Kế toán carbon" }, icon: Leaf, group: "CARBON", module: "M-2", inSidebar: true },
  { id: "COMPLIANCE", name: { en: "Compliance reporting", vn: "Báo cáo tuân thủ" }, icon: ClipboardCheck, group: "CARBON", module: "M-2", inSidebar: true },
  { id: "MODULE_2_MEASUREMENT", name: { en: "Asset measurement", vn: "Đo lường tài sản" }, icon: Gauge, group: "CARBON", inSidebar: true },
  { id: "ECO_CALCULATOR", name: { en: "Eco calculator", vn: "Máy tính phát thải" }, icon: Calculator, group: "CARBON", inSidebar: true },
  { id: "SETTINGS", name: { en: "Configuration", vn: "Cấu hình" }, icon: Settings, group: "SYSTEM", inSidebar: true },
  { id: "USERS", name: { en: "Users & permissions", vn: "Người dùng & phân quyền" }, icon: Users, group: "SYSTEM", inSidebar: true },
  { id: "AUDIT_LOG", name: { en: "Audit log", vn: "Nhật ký kiểm toán" }, icon: ScrollText, group: "SYSTEM", inSidebar: true },
  { id: "PARTNERS", name: { en: "Partners", vn: "Đối tác" }, icon: Handshake, group: "SYSTEM", inSidebar: true },
];

export const pageMeta = (id: SubPageId): PageMeta => PAGES.find((p) => p.id === id) ?? PAGES[0];

/** Breadcrumb for a page: group name → page name. */
export function breadcrumbOf(id: SubPageId, t: (en: string, vn: string) => string): string[] {
  const p = pageMeta(id);
  const g = GROUPS.find((x) => x.id === p.group)!;
  return [t(g.name.en, g.name.vn), t(p.name.en, p.name.vn)];
}

export const APP_VERSION = "1.4.0";
export const FlaskIcon = FlaskConical;
