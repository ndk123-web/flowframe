"use client";

import React, { useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useThemeStore } from "@/store/useThemeStore";
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
  Check,
  Sun,
  Moon,
  Palette,
  Terminal,
  FastForward,
  Cpu,
  Share2,
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

type SettingsTab = "canvas" | "simulation" | "specs" | "export" | "appearance";

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
  theme: propTheme,
}: CanvasSettingsSheetProps) {
  const { theme: storeTheme, setTheme } = useThemeStore();
  const currentTheme = propTheme || storeTheme || "dark";
  const [activeTab, setActiveTab] = useState<SettingsTab>("canvas");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Compute component breakdown from real current architecture
  const clientCount = nodes.filter(
    (n) => n.data?.type === "client" || n.type === "client"
  ).length;
  const gatewayCount = nodes.filter(
    (n) => n.data?.type === "api-gateway" || n.data?.type === "apiGateway"
  ).length;
  const lbCount = nodes.filter(
    (n) => n.data?.type === "load-balancer" || n.data?.type === "loadBalancer"
  ).length;
  const serverCount = nodes.filter(
    (n) => n.data?.type === "server" || n.type === "server"
  ).length;
  const dbCount = nodes.filter(
    (n) => n.data?.type === "postgres" || n.data?.type === "database"
  ).length;
  const cacheCount = nodes.filter(
    (n) => n.data?.type === "redis" || n.data?.type === "cache"
  ).length;
  const queueCount = nodes.filter(
    (n) => n.data?.type === "message-queue" || n.data?.type === "messageQueue"
  ).length;
  const pubsubCount = nodes.filter(
    (n) => n.data?.type === "pubsub" || n.data?.type === "pubSub"
  ).length;
  const storageCount = nodes.filter(
    (n) => n.data?.type === "storage"
  ).length;
  const cdnCount = nodes.filter(
    (n) => n.data?.type === "cdn"
  ).length;
  const dnsCount = nodes.filter(
    (n) => n.data?.type === "dns"
  ).length;

  const TABS = [
    {
      id: "canvas" as const,
      label: "Canvas & Grid",
      icon: <Grid3X3 className="size-4 shrink-0" />,
    },
    {
      id: "simulation" as const,
      label: "Simulation & Flow",
      icon: <Activity className="size-4 shrink-0" />,
    },
    {
      id: "specs" as const,
      label: "Architecture Specs",
      icon: <Layers className="size-4 shrink-0" />,
    },
    {
      id: "export" as const,
      label: "Export & Backup",
      icon: <Download className="size-4 shrink-0" />,
    },
    {
      id: "appearance" as const,
      label: "Theme & Styling",
      icon: <Palette className="size-4 shrink-0" />,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 gap-0 overflow-hidden border-border bg-card text-foreground rounded-2xl shadow-2xl">
        <div className="flex flex-col sm:flex-row min-h-[520px] max-h-[85vh]">
          {/* ── Left Sidebar Navigation ──────────────────────────────── */}
          <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-border bg-muted/20 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <div className="px-1">
                <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <span>Canvas Settings</span>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Workspace preferences
                </p>
              </div>

              <nav className="space-y-1">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/25 shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Status summary */}
            <div className="pt-3 border-t border-border/60 text-[11px] font-mono text-muted-foreground hidden sm:block px-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{nodes.length} Nodes · {edges.length} Edges</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Simulator Ready
              </div>
            </div>
          </div>

          {/* ── Right Content Panel ───────────────────────────────────── */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto max-h-[75vh] space-y-5 scrollbar-thin">
            {/* ── TAB 1: Canvas & Grid ──────────────────────────────── */}
            {activeTab === "canvas" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Canvas View & Grid
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure background grid rendering, snap behavior, and minimap radar.
                  </p>
                </div>

                {/* Grid Pattern Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Background Pattern
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { id: "dots", label: "Dots", desc: "Technical dots" },
                        { id: "lines", label: "Lines", desc: "Graph paper" },
                        { id: "cross", label: "Cross", desc: "Crosshair marks" },
                        { id: "none", label: "None", desc: "Clean solid" },
                      ] as const
                    ).map((pat) => {
                      const isSelected = bgPattern === pat.id;
                      return (
                        <div
                          key={pat.id}
                          onClick={() => setBgPattern(pat.id)}
                          className={`rounded-xl border p-3 transition cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border hover:border-border/80 bg-muted/10 hover:bg-muted/30"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="size-2.5 stroke-[3]" />
                            </div>
                          )}
                          <span className="text-xs font-semibold text-foreground">
                            {pat.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {pat.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grid Opacity Slider (when not none) */}
                {bgPattern !== "none" && (
                  <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Pattern Opacity</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {Math.round(bgOpacity * 100)}%
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.40"
                      step="0.05"
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                )}

                {/* Snap to Grid & Size */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Snap to Grid
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Automatically aligns dragged nodes to a uniform {gridSize}px grid.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {snapToGrid && (
                      <select
                        value={gridSize}
                        onChange={(e) => setGridSize(Number(e.target.value))}
                        className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-mono outline-none cursor-pointer"
                      >
                        <option value={15}>15px</option>
                        <option value={20}>20px</option>
                        <option value={30}>30px</option>
                      </select>
                    )}
                    <Button
                      type="button"
                      variant={snapToGrid ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      className="text-xs font-mono h-8 cursor-pointer"
                    >
                      {snapToGrid ? "Enabled" : "Freeform"}
                    </Button>
                  </div>
                </div>

                {/* Radar Minimap */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Bird&apos;s-Eye Minimap
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Displays a floating navigation radar in the bottom corner.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={showMinimap ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowMinimap(!showMinimap)}
                    className="text-xs font-mono h-8 cursor-pointer shrink-0"
                  >
                    {showMinimap ? "Visible" : "Hidden"}
                  </Button>
                </div>

                {/* Viewport Zoom & Fit Controls */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-foreground block">
                    Quick Viewport Controls
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onZoomIn}
                      className="text-xs gap-1.5 h-8 font-medium cursor-pointer"
                    >
                      <ZoomIn className="size-3.5 text-primary" />
                      <span>Zoom In</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onZoomOut}
                      className="text-xs gap-1.5 h-8 font-medium cursor-pointer"
                    >
                      <ZoomOut className="size-3.5 text-primary" />
                      <span>Zoom Out</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onFitView}
                      className="text-xs gap-1.5 h-8 font-medium cursor-pointer"
                    >
                      <Maximize2 className="size-3.5 text-primary" />
                      <span>Fit All</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: Simulation & Flow ──────────────────────────── */}
            {activeTab === "simulation" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Simulation & Engine Rules
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Control execution speeds, response packet behavior, and debug stream.
                  </p>
                </div>

                {/* Speed Multiplier */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Playback Speed
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Time dilation multiplier for animated request packet hops.
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/25">
                      {speed}x
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[0.5, 1, 2, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeed(s)}
                        className={`py-2 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                          speed === s
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Execution Logs Drawer Toggle */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Terminal className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Execution Logs & Timeline
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Bottom docked console showing packet frames, cache hits, and step logs.
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={debugEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDebugEnabled(!debugEnabled)}
                    className="text-xs font-mono h-8 cursor-pointer shrink-0"
                  >
                    {debugEnabled ? "Open" : "Closed"}
                  </Button>
                </div>

                {/* Hide Response Packets */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Hide Response Packets
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Only show forward client request hops without return animations.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={hideResponse ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHideResponse(!hideResponse)}
                    className="text-xs font-mono h-8 cursor-pointer shrink-0"
                  >
                    {hideResponse ? "Hidden" : "Shown"}
                  </Button>
                </div>

                {/* Parallel Requests */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Parallel Request Simulation
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Animate concurrent fanout hops across multiple nodes simultaneously.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={parallelResponse ? "default" : "outline"}
                    size="sm"
                    onClick={() => setParallelResponse(!parallelResponse)}
                    className="text-xs font-mono h-8 cursor-pointer shrink-0"
                  >
                    {parallelResponse ? "Parallel" : "Sequential"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── TAB 3: Architecture Specs ─────────────────────────── */}
            {activeTab === "specs" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Architecture Specifications
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live system topology metrics and component inventory.
                  </p>
                </div>

                {/* Live Node & Edge Counters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Total Nodes
                    </p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {nodes.length}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Configured topology nodes
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Active Connections
                    </p>
                    <p className="text-2xl font-bold font-mono text-primary mt-1">
                      {edges.length}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Directional network edges
                    </p>
                  </div>
                </div>

                {/* Categorized Component Breakdown */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                  <span className="text-xs font-semibold text-foreground block">
                    Component Inventory
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Clients:</span>
                      <span className="font-mono font-bold text-foreground">{clientCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Gateways:</span>
                      <span className="font-mono font-bold text-foreground">{gatewayCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Load Balancers:</span>
                      <span className="font-mono font-bold text-foreground">{lbCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Servers:</span>
                      <span className="font-mono font-bold text-foreground">{serverCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Postgres DBs:</span>
                      <span className="font-mono font-bold text-foreground">{dbCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Redis Caches:</span>
                      <span className="font-mono font-bold text-foreground">{cacheCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Message Queues:</span>
                      <span className="font-mono font-bold text-foreground">{queueCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">PubSub Brokers:</span>
                      <span className="font-mono font-bold text-foreground">{pubsubCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="text-muted-foreground">Storage Buckets:</span>
                      <span className="font-mono font-bold text-foreground">{storageCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: Export & Backup ────────────────────────────── */}
            {activeTab === "export" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Export, Backup & Reset
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Save high-resolution diagram screenshots, export JSON, or reset the workspace.
                  </p>
                </div>

                {/* Export HD PNG Image */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <ImageIcon className="size-4 text-primary" />
                      <span>Export HD Architecture Image</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Renders all canvas nodes and connections as a high-res PNG image.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={onDownloadImage}
                    className="gap-1.5 h-8 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    <Download className="size-3.5" />
                    <span>Download PNG</span>
                  </Button>
                </div>

                {/* Export / Import JSON Flow */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Diagram JSON Backup
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Save or load full topology coordinates, connections, and node configurations.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onExport}
                      className="gap-1.5 h-8 text-xs font-medium cursor-pointer flex-1"
                    >
                      <Download className="size-3.5 text-primary" />
                      <span>Export JSON File</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onImport}
                      className="gap-1.5 h-8 text-xs font-medium cursor-pointer flex-1"
                    >
                      <Upload className="size-3.5 text-primary" />
                      <span>Import JSON File</span>
                    </Button>
                  </div>
                </div>

                {/* Reset / Clear Canvas Action */}
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-destructive block">
                      Clear Entire Canvas
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Removes all nodes, edges, and frames from the current canvas.
                    </span>
                  </div>
                  {confirmClearOpen ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          onClearCanvas();
                          setConfirmClearOpen(false);
                          onOpenChange(false);
                        }}
                        className="h-8 text-xs font-semibold cursor-pointer"
                      >
                        Confirm Clear
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmClearOpen(false)}
                        className="h-8 text-xs cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmClearOpen(true)}
                      className="h-8 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 cursor-pointer shrink-0"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      <span>Clear Canvas</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 5: Theme & Styling ────────────────────────────── */}
            {activeTab === "appearance" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Workspace Theme & Appearance
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize editor canvas dark and light mode aesthetics.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Dark Mode */}
                  <div
                    onClick={() => setTheme("dark")}
                    className={`rounded-xl border p-4 transition cursor-pointer flex flex-col justify-between gap-3 relative ${
                      currentTheme === "dark"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-border/80 bg-muted/10 hover:bg-muted/30"
                    }`}
                  >
                    {currentTheme === "dark" && (
                      <div className="absolute top-3 right-3 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="size-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-100 shadow-xs">
                      <Moon className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Dark Studio Mode
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        High-contrast deep slate canvas optimized for long engineering sessions.
                      </p>
                    </div>
                  </div>

                  {/* Light Mode */}
                  <div
                    onClick={() => setTheme("light")}
                    className={`rounded-xl border p-4 transition cursor-pointer flex flex-col justify-between gap-3 relative ${
                      currentTheme === "light"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-border/80 bg-muted/10 hover:bg-muted/30"
                    }`}
                  >
                    {currentTheme === "light" && (
                      <div className="absolute top-3 right-3 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="size-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-500 shadow-xs">
                      <Sun className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Light Blueprint Mode
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Clean technical white paper appearance for presentation and exports.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
