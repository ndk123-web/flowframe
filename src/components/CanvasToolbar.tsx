"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  SlidersHorizontal,
  Terminal,
  Save,
  Menu,
  Loader2,
  ChevronDown,
  Code,
  Box,
  Zap,
} from "lucide-react";

interface CanvasToolbarProps {
  // Title & sidebar
  title?: string;
  onToggleSidebar?: () => void;
  nodesCount: number;
  edgesCount: number;
  // Workspace Mode (Canvas vs Full IDE Editor)
  viewMode?: "canvas" | "editor";
  onViewModeChange?: (mode: "canvas" | "editor") => void;
  // Execution Mode (Visual Animation vs Instant Trace)
  executionMode?: "animation" | "instant";
  onExecutionModeChange?: (mode: "animation" | "instant") => void;
  // Playback
  isPlaying: boolean;
  isCompiling: boolean;
  onPlayToggle: () => void;
  onPrevFrame: () => void;
  onNextFrame: () => void;
  onReset: () => void;
  frameIndex: number;
  completedFrames?: number;
  totalFrames: number;
  // Speed
  speed: number;
  onSpeedChange: (speed: number) => void;
  // Requests / API selection
  requestEndpoints?: Array<{ id: string; label: string; method?: string }>;
  selectedRequestId?: string;
  onSelectRequest?: (id: string) => void;
  // Action triggers
  onOpenSettings: () => void;
  debugEnabled: boolean;
  onToggleLogs: () => void;
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export default function CanvasToolbar({
  title = "Architecture Sandbox",
  onToggleSidebar,
  nodesCount,
  edgesCount,
  viewMode = "canvas",
  onViewModeChange,
  executionMode = "animation",
  onExecutionModeChange,
  isPlaying,
  isCompiling,
  onPlayToggle,
  onPrevFrame,
  onNextFrame,
  onReset,
  frameIndex,
  completedFrames,
  totalFrames,
  speed,
  onSpeedChange,
  requestEndpoints,
  selectedRequestId,
  onSelectRequest,
  onOpenSettings,
  debugEnabled,
  onToggleLogs,
  isAssistantOpen,
  onToggleAssistant,
  onSave,
  isSaving = false,
}: CanvasToolbarProps) {
  return (
    <header className="h-12 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md flex items-center justify-between px-2 sm:px-4 z-20 shrink-0 select-none gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
      {/* ─── Left: Mode Switcher (Canvas vs Flow Code) ────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="md:hidden size-8"
            title="Open Components Library"
          >
            <Menu className="size-4" />
          </Button>
        )}

        {/* Dual Mode Switcher: Canvas vs Flow Code */}
        {onViewModeChange && (
          <div className="flex items-center bg-[var(--surface-muted)] p-0.5 rounded-lg border border-[var(--border)] shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange("canvas")}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === "canvas"
                  ? "bg-[var(--surface)] text-[color:var(--foreground)] shadow-xs border border-[var(--border)]/60"
                  : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
              }`}
              title="Switch to visual canvas"
            >
              <Box className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("editor")}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === "editor"
                  ? "bg-[var(--surface)] text-[color:var(--foreground)] shadow-xs border border-[var(--border)]/60"
                  : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
              }`}
              title="Switch to Flow Code editor"
            >
              <Code className="size-3.5 text-blue-400" />
              <span className="hidden sm:inline">Flow Code</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Center: Compact Engineering Simulation Toolbar ─────────────── */}
      <div className="flex items-center gap-1 bg-[var(--surface-muted)]/80 border border-[var(--border)] px-1.5 py-1 rounded-xl shadow-xs">
        {/* Run / Pause */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPlaying ? "destructive" : "default"}
              size="sm"
              disabled={isCompiling}
              onClick={onPlayToggle}
              className={`h-7 px-2.5 text-xs font-semibold gap-1.5 transition ${
                isPlaying
                  ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30"
                  : "bg-[var(--accent)] text-white hover:brightness-110 shadow-xs"
              }`}
            >
              {isCompiling ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="hidden sm:inline">Compiling</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="size-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" />
                  <span className="hidden sm:inline">
                    {totalFrames === 0 ? "Simulate" : "Resume"}
                  </span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isCompiling
              ? "Compiling architecture graph..."
              : isPlaying
              ? "Pause Simulation (Space)"
              : "Run Simulation (Space)"}
          </TooltipContent>
        </Tooltip>

        <div className="h-3.5 w-px bg-[var(--border)] mx-0.5" />

        {/* Step Prev */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrevFrame}
              disabled={totalFrames === 0}
              className="hidden sm:inline-flex size-7 text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
            >
              <SkipBack className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Step Back (←)</TooltipContent>
        </Tooltip>

        {/* Step Next */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNextFrame}
              disabled={totalFrames === 0}
              className="hidden sm:inline-flex size-7 text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
            >
              <SkipForward className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Step Forward (→)</TooltipContent>
        </Tooltip>

        {/* Reset */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onReset}
              disabled={totalFrames === 0 && frameIndex === 0}
              className="size-7 text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Reset Simulation</TooltipContent>
        </Tooltip>

        <div className="h-3.5 w-px bg-[var(--border)] mx-0.5 hidden sm:block" />

        {/* Frame Readout */}
        <div className="hidden sm:flex items-center px-1.5 text-[11px] font-mono text-[color:var(--foreground)]/75 select-none whitespace-nowrap">
          {totalFrames > 0 ? (
            <span>
              Frame{" "}
              <strong className="text-[color:var(--accent)]">
                {completedFrames !== undefined ? completedFrames : frameIndex + 1}
              </strong>
              /{totalFrames}
            </span>
          ) : (
            <span className="text-[color:var(--muted)]">Idle</span>
          )}
        </div>

        <div className="h-3.5 w-px bg-[var(--border)] mx-0.5 hidden md:block" />

        {/* Speed Selector */}
        <div className="hidden md:flex items-center gap-0.5">
          {[0.5, 1, 2].map((s) => (
            <Button
              key={s}
              variant={speed === s ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSpeedChange(s)}
              className={`h-6 px-1.5 text-[10px] font-mono font-bold ${
                speed === s
                  ? "bg-[var(--surface)] text-[color:var(--accent)] border border-[var(--border)]"
                  : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              }`}
            >
              {s}x
            </Button>
          ))}
        </div>

        {/* Execution Mode Toggle: Visual vs Instant Trace */}
        {onExecutionModeChange && (
          <>
            <div className="h-3.5 w-px bg-[var(--border)] mx-0.5 hidden sm:block" />
            <div className="flex items-center bg-[var(--surface)] p-0.5 rounded-lg border border-[var(--border)] shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => onExecutionModeChange("animation")}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  executionMode === "animation"
                    ? "bg-[var(--surface-muted)] text-[color:var(--accent)] border border-[var(--border)] shadow-xs"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                }`}
                title="Visual Packet Animation (Slow-motion step-by-step)"
              >
                <Play className="size-2.5 fill-current" />
                <span className="hidden sm:inline">Visual</span>
              </button>
              <button
                type="button"
                onClick={() => onExecutionModeChange("instant")}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  executionMode === "instant"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                }`}
                title="Instant Trace / Benchmark (Real-time speed & latency metrics)"
              >
                <Zap className="size-2.5 text-emerald-400 fill-current" />
                <span className="hidden sm:inline">Instant</span>
              </button>
            </div>
          </>
        )}

        {/* Request / API Selection Dropdown (if provided) */}
        {requestEndpoints && requestEndpoints.length > 0 && onSelectRequest && (
          <>
            <div className="h-3.5 w-px bg-[var(--border)] mx-0.5 hidden lg:block" />
            <div className="hidden lg:flex items-center">
              <select
                value={selectedRequestId || requestEndpoints[0]?.id}
                onChange={(e) => onSelectRequest(e.target.value)}
                className="h-6 rounded bg-[var(--surface)] border border-[var(--border)] px-1.5 text-[10px] font-mono text-[color:var(--foreground)] focus:outline-none cursor-pointer"
              >
                {requestEndpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.method ? `${ep.method} ` : ""}{ep.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* ─── Right: Settings, Logs, Assistant, Cloud Save ─────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Logs Drawer Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={debugEnabled ? "secondary" : "ghost"}
              size="sm"
              onClick={onToggleLogs}
              className={`h-8 px-2 gap-1.5 text-xs font-semibold hidden md:inline-flex ${
                debugEnabled
                  ? "text-[color:var(--accent)] border border-[var(--accent)]/30"
                  : "text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
              }`}
            >
              <Terminal className="size-3.5" />
              <span className="hidden xl:inline text-[11px]">Logs</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle Live Trace Logs</TooltipContent>
        </Tooltip>


        {/* Dedicated Canvas Settings - Prominent & always visible */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="h-8 px-2 sm:px-2.5 gap-1.5 text-xs font-semibold border-border/80 hover:border-primary/50 bg-card/60 hover:bg-muted/60 text-foreground shrink-0 cursor-pointer shadow-2xs"
            >
              <SlidersHorizontal className="size-3.5 text-primary" />
              <span className="hidden sm:inline text-[11px]">Settings</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Canvas & Grid Settings</TooltipContent>
        </Tooltip>

        {/* Save Diagram (when backend diagram is connected) */}
        {onSave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="h-8 px-2.5 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isSaving ? "Saving..." : "Save"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save Diagram to Cloud (Ctrl+S)</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
