import React, { useEffect, useRef, useState } from "react";
import { Bell, Building2, CalendarRange, ChevronDown, Command, Languages, LogOut, Search, ShieldCheck, User } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { SubPageId, UserRole } from "../../types/gport";
import { GPortEmblem } from "../GPortLogo";
import { IconButton, StatusBadge } from "../ui";

export interface AppNotification {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  page: SubPageId;
}

export type TimeRange = "TODAY" | "7D" | "30D";

interface TopBarProps {
  onOpenPalette: () => void;
  notifications: AppNotification[];
  onNavigate: (p: SubPageId) => void;
  timeRange: TimeRange;
  onTimeRange: (r: TimeRange) => void;
  role: UserRole;
  onRole: (r: UserRole) => void;
  email: string;
  onLogout: () => void;
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const ROLES: { id: Exclude<UserRole, null>; en: string; vn: string }[] = [
  { id: "ADMIN", en: "Administrator", vn: "Quản trị hệ thống" },
  { id: "OPERATIONS_SPECIALIST", en: "Operations", vn: "Chuyên viên vận hành" },
  { id: "TECHNICAL_SPECIALIST", en: "Technical", vn: "Chuyên viên kỹ thuật" },
  { id: "FINANCIAL_ACCOUNTANT", en: "Carbon accountant", vn: "Kế toán carbon" },
  { id: "VIEWER", en: "Viewer", vn: "Chỉ xem" },
];

/** 56px enterprise top bar. */
export const TopBar: React.FC<TopBarProps> = ({ onOpenPalette, notifications, onNavigate, timeRange, onTimeRange, role, onRole, email, onLogout }) => {
  const { t, lang, toggleLang } = useLanguage();
  const notif = usePopover();
  const user = usePopover();
  const roleName = ROLES.find((r) => r.id === role);

  return (
    <header className="h-14 shrink-0 bg-white border-b border-line flex items-center gap-3 px-4">
      <button type="button" onClick={() => onNavigate("OVERVIEW")} className="flex items-center gap-2 pr-3 mr-1 border-r border-line h-8 cursor-pointer" aria-label="G-Port">
        <GPortEmblem className="w-7 h-7" />
        <span className="text-base font-semibold text-ink tracking-tight hidden sm:inline">G-Port</span>
      </button>

      <label className="hidden md:flex items-center gap-1.5 text-sm text-ink">
        <Building2 className="w-4 h-4 text-muted" aria-hidden="true" />
        <span className="sr-only">{t("Terminal", "Cảng")}</span>
        <select className="h-8 rounded-control border border-line bg-white pl-2 pr-7 text-sm cursor-pointer" defaultValue="CATLAI" aria-label={t("Terminal", "Cảng / terminal")}>
          <option value="CATLAI">{t("Cat Lai terminal", "Cảng Cát Lái")}</option>
          <option value="TCIT" disabled>
            {t("Cai Mep TCIT (not connected)", "Cái Mép TCIT (chưa kết nối)")}
          </option>
        </select>
      </label>

      <label className="hidden lg:flex items-center gap-1.5 text-sm text-ink">
        <CalendarRange className="w-4 h-4 text-muted" aria-hidden="true" />
        <select
          value={timeRange}
          onChange={(e) => onTimeRange(e.target.value as TimeRange)}
          className="h-8 rounded-control border border-line bg-white pl-2 pr-7 text-sm cursor-pointer"
          aria-label={t("Time range", "Khoảng thời gian")}
        >
          <option value="TODAY">{t("Today · 23/11/2026", "Hôm nay · 23/11/2026")}</option>
          <option value="7D">{t("Last 7 days", "7 ngày qua")}</option>
          <option value="30D">{t("Last 30 days", "30 ngày qua")}</option>
        </select>
      </label>

      <button
        type="button"
        onClick={onOpenPalette}
        className="ml-auto md:ml-4 flex items-center gap-2 h-8 w-full max-w-xs rounded-control border border-line bg-slate-50 px-3 text-sm text-muted hover:bg-white cursor-pointer"
        aria-label={t("Search (Ctrl+K)", "Tìm kiếm (Ctrl+K)")}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        <span className="flex-1 text-left hidden sm:inline">{t("Search pages…", "Tìm trang…")}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[11px] border border-line rounded px-1 bg-white">
          <Command className="w-3 h-3" aria-hidden="true" />K
        </kbd>
      </button>

      <div className="flex items-center gap-1 md:ml-auto">
        <div className="relative" ref={notif.ref}>
          <IconButton icon={Bell} label={t("Notifications", "Thông báo")} badge={notifications.length} onClick={() => notif.setOpen((o) => !o)} />
          {notif.open && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-line rounded-card shadow-overlay z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-line text-sm font-semibold text-ink">{t("Alerts", "Cảnh báo")}</div>
              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(n.page);
                        notif.setOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-line last:border-0 cursor-pointer space-y-1"
                    >
                      <StatusBadge tone={n.tone}>{n.title}</StatusBadge>
                      <div className="text-xs text-muted">{n.detail}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleLang}
          className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-control text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label={t("Switch language", "Đổi ngôn ngữ")}
        >
          <Languages className="w-4 h-4" aria-hidden="true" />
          {lang === "VN" ? "VI" : "EN"}
        </button>

        <div className="relative" ref={user.ref}>
          <button
            type="button"
            onClick={() => user.setOpen((o) => !o)}
            aria-label={t("User menu", "Menu người dùng")}
            aria-expanded={user.open}
            className="h-9 pl-1 pr-2 inline-flex items-center gap-2 rounded-control hover:bg-slate-100 cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold inline-flex items-center justify-center">AD</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:block" aria-hidden="true" />
          </button>
          {user.open && (
            <div className="absolute right-0 top-11 w-64 bg-white border border-line rounded-card shadow-overlay z-50 py-1.5">
              <div className="px-4 py-2 border-b border-line">
                <div className="text-sm font-medium text-ink truncate">{email}</div>
                <div className="text-xs text-muted">{roleName ? t(roleName.en, roleName.vn) : "—"}</div>
              </div>
              <div className="px-4 pt-2 pb-1 overline">{t("Role", "Vai trò")}</div>
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onRole(r.id)}
                  className={`w-full flex items-center gap-2 px-4 h-8 text-sm text-left hover:bg-slate-50 cursor-pointer ${r.id === role ? "text-brand font-medium" : "text-slate-600"}`}
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  {t(r.en, r.vn)}
                </button>
              ))}
              <div className="my-1.5 border-t border-line" />
              <button type="button" className="w-full flex items-center gap-2 px-4 h-8 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer" onClick={() => onNavigate("USERS")}>
                <User className="w-4 h-4" aria-hidden="true" />
                {t("Profile", "Hồ sơ cá nhân")}
              </button>
              <button type="button" className="w-full flex items-center gap-2 px-4 h-8 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer" onClick={onLogout}>
                <LogOut className="w-4 h-4" aria-hidden="true" />
                {t("Sign out", "Đăng xuất")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
