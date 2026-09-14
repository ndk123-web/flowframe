"use client";

import React from "react";
import Image from "next/image";

interface FlowLoaderProps {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg" | "fullscreen" | "hud";
}

export default function FlowLoader({
  label = "Loading FlowFrame...",
  sublabel = "Preparing your workspace...",
  size = "md",
}: FlowLoaderProps) {
  // Mini inline loader for buttons (clean 3 bouncing dots)
  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce" />
        </div>
        {label && <span className="text-[11px] font-medium">{label}</span>}
      </div>
    );
  }

  // Floating HUD pill for top status during compilation
  if (size === "hud") {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/95 backdrop-blur-md shadow-md text-xs text-foreground select-none animate-in fade-in zoom-in-95">
        <span className="size-2 rounded-full bg-primary animate-pulse" />
        <span className="font-medium text-[11px]">{label}</span>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline border-l border-border/60 pl-2">
            {sublabel}
          </span>
        )}
      </div>
    );
  }

  // Fullscreen page transition loader (Clean, Minimal, Standard UI/UX)
  if (size === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 select-none">
        <div className="flex flex-col items-center text-center max-w-xs w-full space-y-4 animate-in fade-in duration-200">
          {/* Brand Logo */}
          <div className="relative size-12 rounded-xl overflow-hidden shadow-xs flex items-center justify-center">
            <Image
              src="/logo/flow-frame-dark.png"
              alt="FlowFrame"
              width={48}
              height={48}
              className="size-full object-contain hidden dark:block"
              priority
            />
            <Image
              src="/logo/flow-frame-light.png"
              alt="FlowFrame"
              width={48}
              height={48}
              className="size-full object-contain block dark:hidden"
              priority
            />
          </div>

          {/* Clean Typography */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              {label}
            </h3>
            {sublabel && (
              <p className="text-xs text-muted-foreground font-sans">
                {sublabel}
              </p>
            )}
          </div>

          {/* Sleek Horizontal Linear Loading Bar */}
          <div className="relative w-48 h-1 rounded-full bg-muted/60 overflow-hidden">
            <div className="absolute inset-0 w-1/2 bg-primary rounded-full animate-[progressSlide_1.5s_ease-in-out_infinite]" />
          </div>
        </div>

        <style jsx>{`
          @keyframes progressSlide {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(250%);
            }
          }
        `}</style>
      </div>
    );
  }

  // Default "md" size (Used for Canvas Loading Overlay & Card)
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-lg max-w-xs w-full space-y-3.5 select-none animate-in fade-in duration-150">
      {/* Brand Logo */}
      <div className="relative size-10 rounded-lg overflow-hidden flex items-center justify-center">
        <Image
          src="/logo/flow-frame-dark.png"
          alt="FlowFrame"
          width={40}
          height={40}
          className="size-full object-contain hidden dark:block"
          priority
        />
        <Image
          src="/logo/flow-frame-light.png"
          alt="FlowFrame"
          width={40}
          height={40}
          className="size-full object-contain block dark:hidden"
          priority
        />
      </div>

      {/* Clean Typography */}
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground">
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] text-muted-foreground font-sans">
            {sublabel}
          </p>
        )}
      </div>

      {/* Sleek Horizontal Linear Loading Bar */}
      <div className="relative w-36 h-1 rounded-full bg-muted/60 overflow-hidden">
        <div className="absolute inset-0 w-1/2 bg-primary rounded-full animate-[progressSlide_1.5s_ease-in-out_infinite]" />
      </div>

      <style jsx>{`
        @keyframes progressSlide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(250%);
          }
        }
      `}</style>
    </div>
  );
}
