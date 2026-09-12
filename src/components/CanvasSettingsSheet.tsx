"use client";

import React from "react";
import type { Node, Edge } from "@xyflow/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Map,
  Download,
  Upload,
  Image as ImageIcon,
  Trash2,
  Activity,
  Layers,
  SlidersHorizontal,
} from "lucide-react";

interface CanvasSettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // View controls
  bgPattern: "dots" | "lines" | "cross" | "none";
  setBgPattern: (pattern: "dots" | "lines" | "cross" | "none") => void;
  bgOpacity: number;
  setBgOpacity: (opacity: number) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  showMinimap: boolean;
  setShowMinimap: (show: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  // Architecture Stats (Live Read-Only)
  nodes: Node[];
  edges: Edge[];
  // Visualization controls
  speed: number;
  setSpeed: (speed: number) => void;
  hideResponse: boolean;
  setHideResponse: (hide: boolean) => void;
  parallelResponse: boolean;
  setParallelResponse: (parallel: boolean) => void;
  debugEnabled: boolean;
  setDebugEnabled: (enabled: boolean) => void;
  // Export / Import
  onExport: () => void;
  onImport: () => void;
  onDownloadImage: () => void;
  onClearCanvas: () => void;
  theme?: "light" | "dark";
}

export default function CanvasSettingsSheet({
  isOpen,
  onOpenChange,
  bgPattern,
  setBgPattern,
  bgOpacity,
  setBgOpacity,
  snapToGrid,
  setSnapToGrid,
  gridSize,
  setGridSize,
  showMinimap,
  setShowMinimap,
  onZoomIn,
  onZoomOut,
  onFitView,
  nodes,
  edges,
  speed,
  setSpeed,
  hideResponse,
  setHideResponse,
  parallelResponse,
  setParallelResponse,
  debugEnabled,
  setDebugEnabled,
  onExport,
  onImport,
  onDownloadImage,
  onClearCanvas,
}: CanvasSettingsSheetProps) {
  // Compute component breakdown from real current architecture
  const clientCount = nodes.filter(
    (n) => n.data?.type === "client" || n.type === "client"
  ).length;
  const gatewayCount = nodes.filter(
    (n) => n.data?.type === "apiGateway"
  ).length;
  const lbCount = nodes.filter((n) => n.data?.type === "loadBalancer").length;
  const serverCount = nodes.filter((n) => n.data?.type === "server").length;
  const dbCount = nodes.filter(
    (n) => n.data?.type === "postgres" || n.data?.type === "database"
  ).length;
  const cacheCount = nodes.filter(
    (n) => n.data?.type === "redis" || n.data?.type === "cache"
  ).length;
  const queueCount = nodes.filter(
    (n) => n.data?.type === "messageQueue" || n.data?.type === "kafka"
  ).length;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-[var(--surface)] text-[color:var(--foreground)] border-l border-[var(--border)] overflow-hidden"
      >
        <SheetHeader className="px-5 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]/60">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center text-[color:var(--accent)]">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-sm font-bold tracking-tight text-[color:var(--foreground)]">
                Canvas Settings
              </SheetTitle>
              <SheetDescription className="text-xs text-[color:var(--muted)]">
                Viewport, technical grid, architecture statistics, and simulation rules.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-thin">
          {/* ─── 1. View & Navigation ──────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--muted)]">
              <Grid3X3 className="size-3.5" />
              <span>Canvas View & Grid</span>
            </div>

            {/* Grid Pattern */}
            <div className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3">
              <label className="text-xs font-semibold text-[color:var(--foreground)] block">
                Grid Pattern
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(["dots", "lines", "cross", "none"] as const).map((pat) => (
                  <Button
                    key={pat}
                    variant={bgPattern === pat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBgPattern(pat)}
                    className="text-xs capitalize font-mono h-8"
                  >
                    {pat}
                  </Button>
                ))}
              </div>

              {/* Grid Opacity & Size */}
              {bgPattern !== "none" && (
                <div className="pt-2 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                      <span>Opacity</span>
                      <span className="font-mono text-[color:var(--foreground)]">
                        {Math.round(bgOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.50"
                      step="0.05"
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-lg bg-[var(--surface)] appearance-none cursor-pointer accent-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[color:var(--foreground)]">Snap to Grid</span>
                    <Button
                      variant={snapToGrid ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      className="text-xs h-7 px-2.5 font-mono"
                    >
                      {snapToGrid ? "Enabled (20px)" : "Freeform"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Viewport Zoom & Minimap */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3 space-y-2.5">
              <span className="text-xs font-semibold text-[color:var(--foreground)] block">
                Viewport Navigation
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onZoomIn}
                  className="text-xs gap-1.5 h-8"
                  title="Zoom In (Ctrl +)"
                >
                  <ZoomIn className="size-3.5" />
                  <span>Zoom In</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onZoomOut}
                  className="text-xs gap-1.5 h-8"
                  title="Zoom Out (Ctrl -)"
                >
                  <ZoomOut className="size-3.5" />
                  <span>Zoom Out</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFitView}
                  className="text-xs gap-1.5 h-8"
                  title="Fit all nodes in view"
                >
                  <Maximize2 className="size-3.5" />
                  <span>Fit View</span>
                </Button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-xs text-[color:var(--foreground)]">
                  <Map className="size-3.5 text-[color:var(--muted)]" />
                  <span>Radar Minimap</span>
                </div>
                <Button
                  variant={showMinimap ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowMinimap(!showMinimap)}
                  className="text-xs h-7 px-2.5"
                >
                  {showMinimap ? "Visible" : "Hidden"}
                </Button>
              </div>
            </div>
          </section>

          <Separator />

          {/* ─── 2. Architecture Information (Read-Only) ─────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--muted)]">
                <Layers className="size-3.5" />
                <span>Architecture Topology</span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                Live Readout
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3">
                <p className="text-[10px] uppercase font-bold text-[color:var(--muted)]">
                  Total Nodes
                </p>
                <p className="text-2xl font-bold font-mono tracking-tight text-[color:var(--foreground)] mt-0.5">
                  {nodes.length}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3">
                <p className="text-[10px] uppercase font-bold text-[color:var(--muted)]">
                  Active Connections
                </p>
                <p className="text-2xl font-bold font-mono tracking-tight text-[color:var(--accent)] mt-0.5">
                  {edges.length}
                </p>
              </div>
            </div>

            {/* Component Breakdown */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3 space-y-2">
              <span className="text-[11px] font-semibold text-[color:var(--foreground)] block">
                Component Breakdown
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[color:var(--muted)]">Clients:</span>
                  <span className="font-mono font-semibold">{clientCount}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[color:var(--muted)]">Gateways:</span>
                  <span className="font-mono font-semibold">{gatewayCount}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[color:var(--muted)]">Balancers:</span>
                  <span className="font-mono font-semibold">{lbCount}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[color:var(--muted)]">Servers:</span>
                  <span className="font-mono font-semibold">{serverCount}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[color:var(--muted)]">Databases:</span>
                  <span className="font-mono font-semibold">{dbCount}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[color:var(--muted)]">Caches:</span>
                  <span className="font-mono font-semibold">{cacheCount}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[color:var(--muted)]">Queues:</span>
                  <span className="font-mono font-semibold">{queueCount}</span>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* ─── 3. Visualization Controls ────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--muted)]">
              <Activity className="size-3.5" />
              <span>Simulation & Flow Rules</span>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3 space-y-3">
              {/* Playback Speed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[color:var(--foreground)]">Playback Speed</span>
                  <span className="font-mono text-[color:var(--accent)]">{speed}x</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[0.5, 1, 2].map((s) => (
                    <Button
                      key={s}
                      variant={speed === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSpeed(s)}
                      className="text-xs font-mono h-7"
                    >
                      {s}x
                    </Button>
                  ))}
                </div>
              </div>

              {/* Hide Response Packets */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <div>
                  <span className="text-xs font-semibold text-[color:var(--foreground)] block">
                    Hide Response Packets
                  </span>
                  <span className="text-[11px] text-[color:var(--muted)]">
                    Only show forward request hops
                  </span>
                </div>
                <Button
                  variant={hideResponse ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setHideResponse(!hideResponse)}
                  className="text-xs h-7 px-2.5"
                >
                  {hideResponse ? "Hidden" : "Shown"}
                </Button>
              </div>

              {/* Parallel Requests */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <div>
                  <span className="text-xs font-semibold text-[color:var(--foreground)] block">
                    Parallel Simulation
                  </span>
                  <span className="text-[11px] text-[color:var(--muted)]">
                    Animate concurrent branch requests
                  </span>
                </div>
                <Button
                  variant={parallelResponse ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setParallelResponse(!parallelResponse)}
                  className="text-xs h-7 px-2.5"
                >
                  {parallelResponse ? "Enabled" : "Sequential"}
                </Button>
              </div>

              {/* Live Logs */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <div>
                  <span className="text-xs font-semibold text-[color:var(--foreground)] block">
                    Live Execution Logs
                  </span>
                  <span className="text-[11px] text-[color:var(--muted)]">
                    Display frame-by-frame debug panel
                  </span>
                </div>
                <Button
                  variant={debugEnabled ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setDebugEnabled(!debugEnabled)}
                  className="text-xs h-7 px-2.5"
                >
                  {debugEnabled ? "Visible" : "Collapsed"}
                </Button>
              </div>
            </div>
          </section>

          <Separator />

          {/* ─── 4. Export & Management ───────────────────────────────── */}
          <section className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--muted)] block">
              Canvas Actions
            </span>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="text-xs gap-1.5 h-8 justify-start"
              >
                <Download className="size-3.5 text-[color:var(--muted)]" />
                <span>Export JSON</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onImport}
                className="text-xs gap-1.5 h-8 justify-start"
              >
                <Upload className="size-3.5 text-[color:var(--muted)]" />
                <span>Import JSON</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadImage}
                className="text-xs gap-1.5 h-8 justify-start col-span-2"
              >
                <ImageIcon className="size-3.5 text-[color:var(--muted)]" />
                <span>Download Diagram Image (PNG)</span>
              </Button>
            </div>

            {nodes.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm(
                      "Clear all components and connections from the canvas?"
                    )
                  ) {
                    onClearCanvas();
                    onOpenChange(false);
                  }
                }}
                className="w-full text-xs gap-1.5 h-8 mt-1"
              >
                <Trash2 className="size-3.5" />
                <span>Clear Canvas Architecture</span>
              </Button>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
