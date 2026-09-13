"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { useToast } from "@/lib/store/useToast";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: "border-magenta-500/40 text-magenta-400 bg-black/90 shadow-[0_0_20px_rgba(255,42,133,0.3)]",
  error: "border-white/30 text-white bg-black/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]",
  info: "border-magenta-500/40 text-magenta-400 bg-black/90 shadow-[0_0_20px_rgba(255,42,133,0.3)]",
  warning: "border-magenta-500/40 text-magenta-400 bg-black/90 shadow-[0_0_20px_rgba(255,42,133,0.3)]",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "pointer-events-auto glass rounded-2xl px-5 py-4 flex items-center gap-3 min-w-[280px] max-w-sm shadow-card border",
                styles[toast.type]
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <p className="text-sm text-kuro-text font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-kuro-text-dim hover:text-kuro-text transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
