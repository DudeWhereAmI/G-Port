import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastTone = "success" | "info" | "warning";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

/** Lightweight toasts (approve, export, copy hash …). */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-3), { id, message, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
  }, []);
  const Icon = { success: CheckCircle2, info: Info, warning: TriangleAlert };
  const color = { success: "text-success", info: "text-info", warning: "text-warning" };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-12 right-6 z-[60] flex flex-col gap-2 items-end" aria-live="polite" role="status">
        <AnimatePresence>
          {items.map((x) => {
            const I = Icon[x.tone];
            return (
              <motion.div
                key={x.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="flex items-center gap-2.5 bg-white border border-line rounded-card shadow-overlay pl-3 pr-2 py-2.5 text-sm text-ink max-w-sm"
              >
                <I className={`w-4 h-4 shrink-0 ${color[x.tone]}`} aria-hidden="true" />
                <span className="flex-1">{x.message}</span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setItems((xs) => xs.filter((y) => y.id !== x.id))}
                  className="w-6 h-6 inline-flex items-center justify-center rounded text-muted hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  return useContext(ToastContext);
}
