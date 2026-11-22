import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { SubPageId } from "../../types/gport";
import { Tag } from "../ui";
import { GROUPS, PAGES } from "./pages";

interface SidebarProps {
  active: SubPageId;
  onNavigate: (p: SubPageId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

/** Business-grouped navigation; collapses to icons only. */
export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, collapsed, onToggle }) => {
  const { t } = useLanguage();
  return (
    <aside
      aria-label={t("Main navigation", "Điều hướng chính")}
      className={`h-full bg-white border-r border-line flex flex-col shrink-0 transition-[width] duration-200 ${collapsed ? "w-16" : "w-60"}`}
    >
      <nav className="flex-1 overflow-y-auto py-3">
        {GROUPS.map((g) => (
          <div key={g.id} className="mb-3">
            {!collapsed ? <div className="overline px-5 py-1.5">{t(g.name.en, g.name.vn)}</div> : <div className="mx-4 my-2 border-t border-line" />}
            <ul className="space-y-0.5 px-2">
              {PAGES.filter((p) => p.group === g.id && p.inSidebar).map((p) => {
                const on = p.id === active;
                const label = t(p.name.en, p.name.vn);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(p.id)}
                      aria-current={on ? "page" : undefined}
                      title={collapsed ? label : undefined}
                      className={`w-full flex items-center gap-3 h-9 rounded-control text-sm transition-colors cursor-pointer ${
                        collapsed ? "justify-center px-0" : "px-3"
                      } ${on ? "bg-brand-soft text-brand font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-ink"}`}
                    >
                      <p.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
                      {!collapsed && p.module && <Tag>{p.module}</Tag>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? t("Expand sidebar", "Mở rộng thanh bên") : t("Collapse sidebar", "Thu gọn thanh bên")}
          className={`w-full flex items-center gap-3 h-9 rounded-control text-sm text-muted hover:bg-slate-50 hover:text-ink cursor-pointer ${collapsed ? "justify-center" : "px-3"}`}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" aria-hidden="true" /> : <PanelLeftClose className="w-4 h-4" aria-hidden="true" />}
          {!collapsed && t("Collapse", "Thu gọn")}
        </button>
      </div>
    </aside>
  );
};
