"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionModalStore } from "@/store/useSessionModalStore";
import { FiLock, FiAlertTriangle, FiArrowRight, FiX } from "react-icons/fi";

export default function SessionExpiredModal() {
  const router = useRouter();
  const { isOpen, message, closeModal } = useSessionModalStore();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  const handleSignIn = () => {
    closeModal();
    router.push("/signin?expired=true");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Icon Button */}
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--surface-muted)] transition cursor-pointer"
        >
          <FiX className="size-4" />
        </button>

        {/* Warning Icon Badge & Title */}
        <div className="flex items-start gap-4">
          <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
            <FiLock className="size-5" />
          </div>
          <div className="space-y-1 pr-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <FiAlertTriangle className="size-3" />
              <span>Authentication Notice</span>
            </div>
            <h2
              id="session-expired-title"
              className="text-lg font-bold tracking-tight text-foreground"
            >
              Session Expired
            </h2>
          </div>
        </div>

        {/* Informative Explanation */}
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed bg-[var(--surface-muted)]/50 p-3.5 rounded-xl border border-[var(--border)]/60 font-sans">
          <p className="text-foreground font-medium">
            {message || "Your access token has expired or is invalid."}
          </p>
          <p className="text-[11px] text-muted-foreground">
            For security purposes, you have been automatically signed out. Please sign in again to continue managing your architecture workspaces and simulations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--surface-muted)] border border-transparent hover:border-[var(--border)] transition cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleSignIn}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-md transition cursor-pointer"
          >
            <span>Sign In Again</span>
            <FiArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
