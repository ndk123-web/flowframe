"use client";

import React from "react";
import { FiCpu, FiActivity, FiLayers } from "react-icons/fi";

interface FlowLoaderProps {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg" | "fullscreen" | "hud";
}

export default function FlowLoader({
  label = "Compiling System Architecture...",
  sublabel = "Initializing nodes, network topology, and packet queues",
  size = "md",
}: FlowLoaderProps) {
  if (size === "hud") {
    return (
      <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/95 backdrop-blur-md shadow-xl text-xs font-mono text-[color:var(--foreground)] animate-in fade-in zoom-in-95">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-[color:var(--foreground)] tracking-tight whitespace-nowrap text-[11px]">
            {label}
          </span>
          {sublabel && (
            <span className="text-[10px] text-[color:var(--muted)] hidden md:inline truncate">
              • {sublabel}
            </span>
          )}
        </div>
        <div className="w-12 h-1 rounded-full bg-[var(--surface-muted)] overflow-hidden shrink-0 hidden sm:block">
          <div className="h-full bg-[var(--accent)] w-1/2 animate-[shimmerTrack_1s_linear_infinite]" />
        </div>
      </div>
    );
  }
  if (size === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)] text-[color:var(--foreground)] transition-colors duration-200">
        <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-35" />
        
        <div className="flex flex-col items-center gap-6 p-8 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)]/90 backdrop-blur-xl shadow-2xl max-w-sm w-full mx-4 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Animated Distributed System Node Circuit Loader */}
          <div className="relative w-28 h-16 flex items-center justify-between px-2">
            {/* Horizontal Bus Wire */}
            <div className="absolute left-4 right-4 h-0.5 bg-[var(--border-strong)] top-1/2 -translate-y-1/2" />
            
            {/* Animated Packet traversing the wire */}
            <div className="absolute left-4 h-1.5 w-3 rounded-full bg-[var(--accent)] top-1/2 -translate-y-1/2 animate-[packetSlide_1.6s_ease-in-out_infinite] shadow-[0_0_10px_var(--accent)]" />

            {/* Node 1: Client */}
            <div className="relative z-10 w-8 h-8 rounded-xl border-2 border-violet-500/50 bg-[var(--surface)] flex items-center justify-center shadow-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
            </div>

            {/* Node 2: Server */}
            <div className="relative z-10 w-9 h-9 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface)] flex items-center justify-center shadow-lg">
              <FiCpu className="w-4 h-4 text-[color:var(--accent)] animate-spin [animation-duration:6s]" />
            </div>

            {/* Node 3: Database */}
            <div className="relative z-10 w-8 h-8 rounded-xl border-2 border-cyan-500/50 bg-[var(--surface)] flex items-center justify-center shadow-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            </div>
          </div>

          {/* Technical Labels */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--surface-muted)] text-[color:var(--accent)] border border-[var(--border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
              <span>Engine Status</span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[color:var(--foreground)]">
              {label}
            </h3>
            <p className="text-[11px] text-[color:var(--muted)] font-mono leading-relaxed">
              {sublabel}
            </p>
          </div>

          {/* Shimmer Progress Track */}
          <div className="w-full h-1 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent w-full animate-[shimmerTrack_1.4s_linear_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[color:var(--foreground)] font-mono shadow-xs">
        <div className="relative flex items-center justify-center w-3.5 h-3.5">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
        </div>
        <span className="text-[11px]">{label}</span>
      </div>
    );
  }

  // Default "md" size for overlays / cards
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shadow-2xl text-center max-w-xs w-full">
      {/* Node Circuit Animation */}
      <div className="relative w-24 h-12 flex items-center justify-between px-1">
        <div className="absolute left-3 right-3 h-0.5 bg-[var(--border)] top-1/2 -translate-y-1/2" />
        <div className="absolute left-3 h-1.5 w-2.5 rounded-full bg-[var(--accent)] top-1/2 -translate-y-1/2 animate-[packetSlide_1.4s_ease-in-out_infinite]" />

        <div className="relative z-10 w-7 h-7 rounded-lg border border-violet-500/60 bg-[var(--surface)] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        </div>
        <div className="relative z-10 w-8 h-8 rounded-lg border border-[var(--accent)] bg-[var(--surface)] flex items-center justify-center shadow-sm">
          <FiActivity className="w-3.5 h-3.5 text-[color:var(--accent)] animate-pulse" />
        </div>
        <div className="relative z-10 w-7 h-7 rounded-lg border border-cyan-500/60 bg-[var(--surface)] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-[color:var(--foreground)] tracking-tight">
          {label}
        </p>
        <p className="text-[10px] text-[color:var(--muted)] font-mono leading-normal">
          {sublabel}
        </p>
      </div>

      <div className="w-32 h-0.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
        <div className="h-full bg-[var(--accent)] w-1/2 animate-[shimmerTrack_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
