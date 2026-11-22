import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface DetailDrawerProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  width?: 480 | 560 | 640;
  children: React.ReactNode;
}

/** Right-side panel (480–640px) used instead of large modals. Esc closes it. */
export const DetailDrawer: React.FC<DetailDrawerProps> = ({ title, subtitle, onClose, footer, width = 560, children }) => {
  const { t } = useLanguage();
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16 }}
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        className="relative h-full w-full bg-white border-l border-line shadow-overlay flex flex-col outline-none"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-line">
          <div className="min-w-0">
            <div className="text-base font-semibold text-ink">{title}</div>
            {subtitle && <div className="text-label text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close", "Đóng")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-control text-muted hover:bg-slate-100 hover:text-ink cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-ink">{children}</div>
        {footer && <div className="px-6 py-3 border-t border-line flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </motion.aside>
    </div>
  );
};
