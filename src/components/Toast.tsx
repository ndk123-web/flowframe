"use client";

import { useToastStore } from "@/store/useToastStore";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 pointer-events-none select-none">
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        const isSuccess = toast.type === "success";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3 px-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              isError
                ? "bg-[var(--surface)]/95 border-rose-500/30 text-foreground"
                : isSuccess
                ? "bg-[var(--surface)]/95 border-emerald-500/30 text-foreground"
                : "bg-[var(--surface)]/95 border-[var(--border)] text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium min-w-0">
              <span
                className={`size-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isError
                    ? "bg-rose-500/15 border border-rose-500/25 text-rose-400"
                    : isSuccess
                    ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                    : "bg-primary/15 border border-primary/25 text-primary"
                }`}
              >
                {isError ? (
                  <FiAlertCircle className="size-3.5" />
                ) : isSuccess ? (
                  <FiCheckCircle className="size-3.5" />
                ) : (
                  <FiInfo className="size-3.5" />
                )}
              </span>
              <p className="leading-snug text-foreground font-medium text-xs truncate">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="size-6 rounded-lg hover:bg-[var(--bg-elevated)] text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer shrink-0 ml-1"
              aria-label="Close notification"
            >
              <FiX className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
