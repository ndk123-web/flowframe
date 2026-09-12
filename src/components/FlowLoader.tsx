"use client";

import React from "react";

interface FlowLoaderProps {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg" | "fullscreen" | "hud";
}

export default function FlowLoader({
  label = "Loading FlowFrame...",
  sublabel,
  size = "md",
}: FlowLoaderProps) {
  // Mini inline spinner for buttons & tight spaces
  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <div className="relative size-4 shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        {label && <span className="text-[11px]">{label}</span>}
      </div>
    );
  }

  // Floating HUD pill for top status during compilation
  if (size === "hud") {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/95 backdrop-blur-md shadow-lg text-xs font-medium text-foreground animate-in fade-in zoom-in-95">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="font-semibold text-[11px]">{label}</span>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline truncate">
            • {sublabel}
          </span>
        )}
      </div>
    );
  }

  // Fullscreen page transition loader
  if (size === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md">
        {/* Soft subtle radial ambient glow */}
        <div className="absolute w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col items-center gap-5 text-center px-4 max-w-sm animate-in fade-in zoom-in-95 duration-200">
          {/* Modern Minimal Orbital Spinner */}
          <div className="relative size-16 flex items-center justify-center">
            {/* Outer soft dashed ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/15 border-dashed animate-[spin_8s_linear_infinite]" />
            {/* Inner high-speed spinning gradient ring */}
            <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin [animation-duration:1s]" />
            {/* Center pulsing core beacon */}
            <div className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)] animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              {label}
            </h3>
            {sublabel && (
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs font-mono">
                {sublabel}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default "md" size for canvas overlays and card loading
  return (
    <div className="flex flex-col items-center gap-3.5 p-6 rounded-2xl border border-border/70 bg-card/95 backdrop-blur-md shadow-xl text-center max-w-xs w-full animate-in fade-in zoom-in-95 duration-150">
      {/* Modern Minimal Orbital Spinner */}
      <div className="relative size-12 flex items-center justify-center">
        {/* Outer soft dashed ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/15 border-dashed animate-[spin_8s_linear_infinite]" />
        {/* Inner high-speed spinning gradient ring */}
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin [animation-duration:0.9s]" />
        {/* Center pulsing core beacon */}
        <div className="size-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse" />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-foreground">
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] text-muted-foreground font-mono leading-normal">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
