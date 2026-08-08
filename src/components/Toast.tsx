"use client";

import { useToastStore } from "@/store/useToastStore";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        const isSuccess = toast.type === "success";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-fade-in-scale ${
              isError
                ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
                : isSuccess
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
                : "bg-[var(--surface)]/90 border-[var(--border)] text-[color:var(--foreground)]"
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <span>
                {isError ? "🚨" : isSuccess ? "✅" : "ℹ️"}
              </span>
              <p className="leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs opacity-60 hover:opacity-100 transition p-1 cursor-pointer"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
