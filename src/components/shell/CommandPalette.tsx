import React, { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { SubPageId } from "../../types/gport";
import { Tag } from "../ui";
import { PAGES } from "./pages";

/** Ctrl/⌘+K command palette: jump to any page. */
export const CommandPalette: React.FC<{ open: boolean; onClose: () => void; onNavigate: (p: SubPageId) => void }> = ({ open, onClose, onNavigate }) => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PAGES.filter((p) => !needle || `${p.name.en} ${p.name.vn} ${p.module ?? ""}`.toLowerCase().includes(needle));
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;
  const go = (p: SubPageId) => {
    onNavigate(p);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={t("Command palette", "Bảng lệnh")} className="relative w-full max-w-xl bg-white border border-line rounded-card shadow-overlay overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-line">
          <Search className="w-4 h-4 text-muted" aria-hidden="true" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(items.length - 1, i + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter" && items[idx]) go(items[idx].id);
            }}
            placeholder={t("Go to page…", "Đi tới trang…")}
            aria-label={t("Search pages", "Tìm trang")}
            className="flex-1 h-12 text-sm text-ink placeholder:text-slate-400 outline-none"
          />
          <kbd className="text-[11px] text-muted border border-line rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1.5" role="listbox">
          {items.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === idx}>
              <button
                type="button"
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(p.id)}
                className={`w-full flex items-center gap-3 px-4 h-10 text-sm text-left cursor-pointer ${i === idx ? "bg-slate-50 text-ink" : "text-slate-600"}`}
              >
                <p.icon className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
                <span className="flex-1">{t(p.name.en, p.name.vn)}</span>
                {p.module && <Tag>{p.module}</Tag>}
                {i === idx && <CornerDownLeft className="w-3.5 h-3.5 text-muted" aria-hidden="true" />}
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="px-4 py-6 text-sm text-muted text-center">{t("No matching page", "Không có trang phù hợp")}</li>}
        </ul>
      </div>
    </div>
  );
};
