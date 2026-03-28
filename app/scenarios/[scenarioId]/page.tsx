"use client";

import { motion } from "framer-motion";
import { use, useEffect, useMemo, useState } from "react";
import {
  BaseEdge,
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  getSmoothStepPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import type { SimDebug, ScenarioRunOptions } from "@/engine/types";
import { ALL_SCENARIOS } from "@/scenarios/all";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

type Frame = {
  requestId: string;
  requestName?: string;
  from: string;
  to: string;
  timestamp: number;
  action: string;
  sourceIp?: string;
  lookupKey?: string;
  redisKeysSnapshot?: string[];
  payloadSummary?: string;
};

type SimBundle = {
  frames: Frame[];
  nodes: Node[];
  edges: Edge[];
  debug?: SimDebug;
};

type Theme = "light" | "dark";

type ScenarioPropsPage = {
  params: Promise<{ scenarioId: string }>;
};

type NodeRole =
  | "client"
  | "api-gateway"
  | "load-balancer"
  | "server"
  | "storage"
  | "redis"
  | "postgres"
  | "other";

function getNodeRole(label: string): NodeRole {
  const normalized = label.toLowerCase();

  if (normalized.includes("client")) {
    return "client";
  }

  if (normalized.includes("api") && normalized.includes("gateway")) {
    return "api-gateway";
  }

  if (normalized.includes("load") && normalized.includes("balancer")) {
    return "load-balancer";
  }

  if (normalized.includes("storage") || normalized.includes("cloud")) {
    return "storage";
  }

  if (normalized.includes("upload") && normalized.includes("service")) {
    return "server";
  }

  if (normalized.includes("server")) {
    return "server";
  }

  if (normalized.includes("redis")) {
    return "redis";
  }

  if (normalized.includes("postgres")) {
    return "postgres";
  }

  return "other";
}

function packetColor(isReverseMotion: boolean) {
  return isReverseMotion ? "#f59e0b" : "#8b5cf6";
}

function PacketEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  const isActive = Boolean(data?.active);
  const duration = Number(data?.packetDuration ?? 1.8);
  const isReverseMotion = Boolean(data?.reverseMotion);
  const count = Math.max(1, Math.min(Number(data?.packetCount ?? 1), 4));

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeOpacity: isActive ? 0.95 : 0.28,
          transition: "stroke-opacity 150ms ease",
        }}
      />
      {isActive &&
        Array.from({ length: count }).map((_, index) => (
          <circle
            key={`${props.id}-${index}`}
            r={4.5 - index * 0.5}
            fill={packetColor(isReverseMotion)}
            style={{
              filter: isReverseMotion
                ? "drop-shadow(0 0 5px rgba(245,158,11,0.85))"
                : "drop-shadow(0 0 5px rgba(139,92,246,0.85))",
              opacity: Math.max(0.45, 0.9 - index * 0.15),
            }}
          >
            <animateMotion
              dur={`${duration}s`}
              repeatCount="indefinite"
              begin={`${index * 0.1}s`}
              path={edgePath}
              keyPoints={isReverseMotion ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        ))}
    </>
  );
}

function GraphCanvas({
  nodes,
  edges,
  onNodeSelect,
  theme,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect: (nodeId: string) => void;
  theme: Theme;
}) {
  const bgColor = theme === "dark" ? "#0b0b0c" : "#f8fafc";
  const gridColor = theme === "dark" ? "rgba(100,116,139,0.23)" : "rgba(148,163,184,0.15)";

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      edgeTypes={{ packet: PacketEdge }}
      fitView
      fitViewOptions={{ padding: 0.22 }}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable={false}
      onNodeClick={(_, node) => onNodeSelect(node.id)}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      style={{ background: bgColor }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={16}
        size={0.7}
        color={gridColor}
      />
    </ReactFlow>
  );
}

function Controls({
  isPlaying,
  onPlayToggle,
  onPrev,
  onNext,
  onReset,
  debugEnabled,
  onDebugToggle,
  speed,
  onSpeedChange,
  theme,
}: {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  debugEnabled: boolean;
  onDebugToggle: () => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  theme: Theme;
}) {
  const btnBg = theme === "dark" ? "bg-slate-950" : "bg-slate-100";
  const btnBorder = theme === "dark" ? "border-slate-700 hover:border-slate-600" : "border-slate-300 hover:border-slate-400";
  const btnText = theme === "dark" ? "text-slate-300" : "text-slate-700";
  const buttonClass = `rounded-md border ${btnBorder} ${btnBg} px-3 py-1.5 text-xs ${btnText} transition hover:bg-${theme === "dark" ? "slate-900" : "slate-200"}`;

  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <button type="button" onClick={onPlayToggle} className={buttonClass}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={onPrev} className={buttonClass}>
            ← Prev
          </button>
          <button type="button" onClick={onNext} className={buttonClass}>
            Next →
          </button>
          <button type="button" onClick={onReset} className={buttonClass}>
            Reset
          </button>
        </div>
        
        <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
        
        <div className="flex items-center gap-1 sm:gap-2">
          <label className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
            <span className="hidden sm:inline">Speed: </span><span className="font-semibold">{speed?.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-16 sm:w-20"
            style={{ accentColor: "#8b5cf6" }}
          />
        </div>
      </div>
    </div>
  );
}

function Timeline({
  frameIndex,
  frameGroups,
  onSeek,
  theme,
}: {
  frameIndex: number;
  frameGroups: Array<{ timestamp: number; frames: Frame[] }>;
  onSeek: (index: number) => void;
  theme: Theme;
}) {
  const emptyBg = theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300";
  const emptyText = theme === "dark" ? "text-slate-500" : "text-slate-600";
  const inactiveBg = theme === "dark" ? "bg-slate-950 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-300 text-slate-600";
  const inactiveHover = theme === "dark" ? "hover:border-slate-600" : "hover:border-slate-400";

  if (frameGroups.length === 0) {
    return (
      <div className={`rounded-md border ${emptyBg} p-2.5`}>
        <p className={`text-xs ${emptyText}`}>No frames available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-x-hidden">
      <input
        type="range"
        min={0}
        max={Math.max(frameGroups.length - 1, 0)}
        value={Math.min(frameIndex, Math.max(frameGroups.length - 1, 0))}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="w-full accent-violet-500"
      />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {frameGroups.map((group, index) => {
          const isActive = index === frameIndex;

          return (
            <button
              key={`${group.timestamp}-${index}`}
              type="button"
              onClick={() => onSeek(index)}
              className={`shrink-0 rounded-sm border px-2 py-1.5 text-[11px] transition ${
                isActive
                  ? "border-violet-400 bg-violet-500/25 text-violet-100"
                  : `${inactiveBg} ${inactiveHover}`
              }`}
              title={`t=${group.timestamp} (${group.frames.length} frame${group.frames.length > 1 ? "s" : ""})`}
            >
              t={group.timestamp}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NodeInspectorPanel({
  selectedNode,
  currentFrames,
  redisStoreEntries,
  postgresStoreEntries,
  storageStoreEntries,
  theme,
}: {
  selectedNode: Node | null;
  currentFrames: Frame[];
  redisStoreEntries: Array<[string, unknown]>;
  postgresStoreEntries: Array<[string, unknown]>;
  storageStoreEntries: Array<[string, { [key: string]: unknown }]>;
  theme: Theme;
}) {
  const bgColor = theme === "dark" ? "bg-slate-950" : "bg-white";
  const textColor = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const headingColor = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const labelColor = theme === "dark" ? "text-slate-600" : "text-slate-500";
  const borderColor = theme === "dark" ? "border-slate-800" : "border-slate-200";
  const cardBg = theme === "dark" ? "bg-slate-900/50" : "bg-slate-50";
  const cardBorder = theme === "dark" ? "border-slate-800" : "border-slate-200";

  if (!selectedNode) {
    return (
      <aside className={`flex h-full flex-col ${bgColor} p-4`}>
        <div>
          <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Inspector</p>
          <p className={`mt-3 text-xs ${textColor}`}>Click a node to inspect details</p>
        </div>
      </aside>
    );
  }

  const label =
    typeof selectedNode.data?.label === "string"
      ? selectedNode.data.label
      : selectedNode.id;
  const role = getNodeRole(label);

  const relatedFrames = currentFrames.filter(
    (frame) => frame.from === selectedNode.id || frame.to === selectedNode.id,
  );

  return (
    <aside className={`flex h-full flex-col overflow-hidden ${bgColor}`}>
      <div className={`border-b ${borderColor} px-4 py-3`}>
        <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Inspector</p>
        <p className={`mt-2 font-mono text-sm ${headingColor}`}>{label}</p>
        <p className={`mt-1 text-xs ${textColor}`}>Type: {role}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 px-4 py-3">
          {role === "redis" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Redis Store</p>
              {redisStoreEntries.length === 0 ? (
                <p className={`mt-2 text-xs ${textColor}`}>Empty</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {redisStoreEntries.map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <p className="truncate text-violet-400">{key}</p>
                      <p className={`truncate ${textColor}`}>{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {role === "postgres" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Database</p>
              {postgresStoreEntries.length === 0 ? (
                <p className={`mt-2 text-xs ${textColor}`}>No records</p>
              ) : (
                <table className="mt-2 w-full text-xs">
                  <tbody className="space-y-1">
                    {postgresStoreEntries.map(([key, value]) => (
                      <tr key={key} className={`border-b ${borderColor}`}>
                        <td className={`truncate pr-2 py-1 ${headingColor}`}>{key}</td>
                        <td className={`truncate ${textColor}`}>{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {role === "server" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Queue Status</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${relatedFrames.length > 0 ? "bg-emerald-400" : (theme === "dark" ? "bg-slate-600" : "bg-slate-400")}`}
                />
                <span className={`text-xs ${textColor}`}>
                  {relatedFrames.length > 0 ? "Busy" : "Idle"}
                </span>
              </div>
              {relatedFrames.length > 0 && (
                <div className="mt-2 space-y-1">
                  {relatedFrames.map((frame) => (
                    <div key={frame.requestId} className={`rounded border ${borderColor} ${theme === "dark" ? "bg-slate-950" : "bg-slate-100"} p-1.5`}>
                      <p className="font-mono text-[11px] text-violet-400">{frame.requestId.slice(0, 8)}</p>
                      <p className={`mt-0.5 text-[10px] ${textColor}`}>{frame.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {role === "storage" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Storage Buckets</p>
              {storageStoreEntries.length === 0 ? (
                <p className={`mt-2 text-xs ${textColor}`}>No buckets found</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {storageStoreEntries.map(([bucketName, bucketFiles]) => {
                    const files = Object.keys(bucketFiles ?? {});

                    return (
                      <div
                        key={bucketName}
                        className={`rounded border ${borderColor} ${theme === "dark" ? "bg-slate-950" : "bg-slate-100"} p-2`}
                      >
                        <p className="font-mono text-[11px] text-violet-400">{bucketName}</p>
                        <p className={`mt-1 text-[10px] ${textColor}`}>
                          {files.length} file{files.length === 1 ? "" : "s"}
                        </p>
                        {files.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {files.map((fileName) => (
                              <span
                                key={`${bucketName}-${fileName}`}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${theme === "dark" ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
                              >
                                {fileName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {role !== "server" && role !== "storage" && role !== "redis" && role !== "postgres" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Activity</p>
              <p className={`mt-2 text-xs ${textColor}`}>{relatedFrames.length} event(s) this frame</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function DebugPanel({
  currentFrames,
  frameIndex,
  theme,
}: {
  currentFrames: Frame[];
  frameIndex: number;
  theme: Theme;
}) {
  const bgColor = theme === "dark" ? "bg-slate-950" : "bg-slate-50";
  const borderColor = theme === "dark" ? "border-slate-800" : "border-slate-300";
  const textColor = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const labelColor = theme === "dark" ? "text-slate-600" : "text-slate-500";
  const headerColor = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const accentBg = theme === "dark" ? "bg-slate-900/50" : "bg-slate-100/50";

  if (currentFrames.length === 0) {
    return (
      <div className={`rounded-md border ${borderColor} ${bgColor} p-3`}>
        <p className={`text-xs ${textColor}`}>No active frames</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {currentFrames.map((frame, idx) => (
        <div key={`${frame.requestId}-${idx}`} className={`rounded-md border ${borderColor} ${accentBg} p-3`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Request</p>
              <p className={`mt-1 font-mono text-xs ${headerColor}`}>{frame.requestName || frame.requestId.slice(0, 12)}</p>
            </div>

            <div>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Action</p>
              <p className={`mt-1 text-xs ${textColor}`}>{frame.action}</p>
            </div>

            <div>
              <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Flow</p>
              <p className={`mt-1 font-mono text-xs ${textColor}`}>
                {frame.from} <span className="text-violet-400">→</span> {frame.to}
              </p>
            </div>

            {frame.sourceIp && (
              <div>
                <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Source IP</p>
                <p className={`mt-1 font-mono text-xs ${textColor}`}>{frame.sourceIp}</p>
              </div>
            )}

            {frame.lookupKey && (
              <div className="col-span-2">
                <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Lookup Key</p>
                <p className={`mt-1 font-mono text-xs text-violet-400`}>{frame.lookupKey}</p>
              </div>
            )}

            {frame.payloadSummary && (
              <div className="col-span-2">
                <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Payload</p>
                <p className={`mt-1 text-xs ${textColor}`}>{frame.payloadSummary}</p>
              </div>
            )}

            {frame.redisKeysSnapshot && frame.redisKeysSnapshot.length > 0 && (
              <div className="col-span-2">
                <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>Redis Keys</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {frame.redisKeysSnapshot.map((key) => (
                    <span
                      key={key}
                      className={`rounded px-2 py-0.5 text-[10px] font-mono ${theme === "dark" ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function generateFrames(options: ScenarioRunOptions, scenarioId: string): SimBundle {
  const createSimulationBundle = ALL_SCENARIOS.get(scenarioId);

  if (!createSimulationBundle) {
    return {
      frames: [],
      nodes: [],
      edges: [],
    };
  }

  return createSimulationBundle(options);
}

export default function ScenarioPage({ params }: ScenarioPropsPage) {
  const router = useRouter();
  const { scenarioId } = use(params);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [hideResponse, setHideResponse] = useState(false);
  const [parallelResponse, setParallelResponse] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [panelHeight, setPanelHeight] = useState(200); // Default height in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [inspectorVisible, setInspectorVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = document.querySelector('[data-resizable-container]') as HTMLElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;

      // Min height 100px, max 80% of container
      const minHeight = 100;
      const maxHeight = containerRect.height * 0.8;

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "auto";
    };
  }, [isDragging]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { frames, nodes, edges, debug } = useMemo(
    () =>
      isMounted
        ? generateFrames(
            {
              hideResponse,
              parallelResponse,
            },
            scenarioId,
          )
        : {
            frames: [],
            nodes: [],
            edges: [],
          },
    [hideResponse, parallelResponse, scenarioId, isMounted],
  );

  const frameGroups = useMemo(() => {
    const groupedByTimestamp = new Map<number, Frame[]>();

    for (const frame of frames) {
      const existing = groupedByTimestamp.get(frame.timestamp) ?? [];
      existing.push(frame);
      groupedByTimestamp.set(frame.timestamp, existing);
    }

    return Array.from(groupedByTimestamp.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, groupedFrames]) => ({
        timestamp,
        frames: groupedFrames,
      }));
  }, [frames]);

  const currentFrameGroup = frameGroups[frameIndex] ?? null;
  const currentFrames = currentFrameGroup?.frames ?? [];
  const redisStoreEntries = Object.entries(debug?.redisStore ?? {});
  const postgresStoreEntries = Object.entries(debug?.postgresStore ?? {});
  const storageStoreEntries = Object.entries(debug?.storageStore ?? {});

  useEffect(() => {
    if (!isPlaying || frameGroups.length === 0) {
      return;
    }

    const baseInterval = 1000;
    const speedAdjustedInterval = baseInterval / speed;
    const timerId = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameGroups.length);
    }, speedAdjustedInterval);

    return () => clearInterval(timerId);
  }, [isPlaying, frameGroups.length, speed]);

  useEffect(() => {
    setFrameIndex(0);
  }, [hideResponse, parallelResponse, scenarioId]);

  useEffect(() => {
    if (nodes.length === 0) {
      setSelectedNodeId(null);
      return;
    }

    const hasSelection = selectedNodeId && nodes.some((node) => node.id === selectedNodeId);
    if (!hasSelection) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const bgColor = theme === "dark" ? "#0f172a" : "#ffffff";
        const textColor = theme === "dark" ? "#e2e8f0" : "#0f172a";
        const borderColor = isSelected ? "#8b5cf6" : (theme === "dark" ? "#334155" : "#e2e8f0");

        return {
          ...node,
          style: {
            ...node.style,
            background: bgColor,
            color: textColor,
            border: isSelected ? `2px solid ${borderColor}` : `1px solid ${borderColor}`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 600,
            boxShadow: isSelected ? "0 0 0 2px rgba(139,92,246,0.2)" : "none",
          },
        };
      }),
    [nodes, selectedNodeId, theme],
  );

  const animatedEdges = useMemo(() => {
    const inactiveStroke = theme === "dark" ? "#64748b" : "#cbd5e1";

    if (currentFrames.length === 0) {
      return edges.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: inactiveStroke,
          strokeWidth: 1.4,
        },
      }));
    }

    const edgeState = new Map<string, { reverseMotion: boolean; packetCount: number }>();

    for (const frame of currentFrames) {
      const directEdgeId = `${frame.from}->${frame.to}`;
      const reverseEdgeId = `${frame.to}->${frame.from}`;
      const hasDirectEdge = edges.some((edge) => edge.id === directEdgeId);
      const hasReverseEdge = edges.some((edge) => edge.id === reverseEdgeId);

      const resolvedEdgeId = hasDirectEdge
        ? directEdgeId
        : hasReverseEdge
          ? reverseEdgeId
          : directEdgeId;

      const isReverseMotion = !hasDirectEdge && hasReverseEdge;
      const previous = edgeState.get(resolvedEdgeId);

      if (!previous) {
        edgeState.set(resolvedEdgeId, { reverseMotion: isReverseMotion, packetCount: 1 });
      } else {
        edgeState.set(resolvedEdgeId, {
          reverseMotion: previous.reverseMotion || isReverseMotion,
          packetCount: previous.packetCount + 1,
        });
      }
    }

    return edges.map((edge) => {
      const active = edgeState.has(edge.id);
      const reverseMotion = edgeState.get(edge.id)?.reverseMotion ?? false;
      const speedAdjustedDuration = active ? 1 / speed : 1.8 / speed;

      return {
        ...edge,
        data: {
          ...edge.data,
          active,
          reverseMotion,
          packetCount: edgeState.get(edge.id)?.packetCount ?? 0,
          packetDuration: speedAdjustedDuration,
        },
        style: {
          ...edge.style,
          stroke: active ? packetColor(reverseMotion) : inactiveStroke,
          strokeWidth: active ? 1.8 : 1.4,
        },
      };
    });
  }, [currentFrames, edges, theme, speed]);

  const goToPreviousFrame = () => {
    setIsPlaying(false);
    setFrameIndex((prev) =>
      frameGroups.length === 0
        ? 0
        : prev === 0
          ? frameGroups.length - 1
          : prev - 1,
    );
  };

  const goToNextFrame = () => {
    setIsPlaying(false);
    setFrameIndex((prev) => (prev + 1) % Math.max(frameGroups.length, 1));
  };

  const resetPlayback = () => {
    setFrameIndex(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target === document.body || e.target === document.documentElement) {
        if (e.code === "Space") {
          e.preventDefault();
          setIsPlaying((p) => !p);
        }
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          goToPreviousFrame();
        }
        if (e.code === "ArrowRight") {
          e.preventDefault();
          goToNextFrame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [frameGroups.length]);

  if (!ALL_SCENARIOS.has(scenarioId)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] text-[color:var(--foreground)]">
        <p className="text-lg">Scenario not found.</p>
        <Link href="/scenarios" className="text-blue-500 underline">
          Back to Scenarios
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)]">
      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        showHomeLink
        badgeText="Simulator"
      />
      <div className="flex h-[calc(100vh-70px)] flex-col overflow-x-hidden" data-resizable-container>
        {/* Top Bar */}
        <header className="border-b border-[var(--border)] bg-[var(--surface)]/50 px-4 py-3 backdrop-blur overflow-x-auto">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 flex-wrap sm:gap-4 md:flex-nowrap">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--foreground)]">{scenarioId}</p>
                <p className="text-[11px] text-[color:var(--foreground)]/50">Simulation</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap md:flex-nowrap">
              <label 
                title="Hide the response/return packets flowing back from servers"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs text-[color:var(--foreground)] transition hover:border-violet-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={hideResponse}
                  onChange={() => setHideResponse((prev) => !prev)}
                  className="accent-violet-500"
                />
                <span className="hidden sm:inline group-hover:text-violet-300">Hide Response</span>
                <span className="sm:hidden text-[10px]">↔️</span>
              </label>

              <label 
                title="Show parallel request and response flows simultaneously"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs text-[color:var(--foreground)] transition hover:border-blue-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={parallelResponse}
                  onChange={() => setParallelResponse((prev) => !prev)}
                  className="accent-violet-500"
                />
                <span className="hidden sm:inline group-hover:text-blue-300">Parallel</span>
                <span className="sm:hidden text-[10px]">⚡</span>
              </label>

              <label 
                title="Show detailed frame-by-frame debug information below the graph"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs text-[color:var(--foreground)] transition hover:border-emerald-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={() => setDebugEnabled((prev) => !prev)}
                  className="accent-violet-500"
                />
                <span className="hidden sm:inline group-hover:text-emerald-300">Debug</span>
                <span className="sm:hidden text-[10px]">🐛</span>
              </label>

              <div className="h-6 w-px bg-[var(--border)] hidden md:block" />

              <div className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 sm:px-3 py-1 sm:py-1.5 text-xs whitespace-nowrap">
                <span className={`h-2 w-2 rounded-full ${isPlaying ? "bg-emerald-400" : "bg-[color:var(--foreground)]/30"}`} />
                <span className="text-[color:var(--foreground)]/70 hidden sm:inline">
                  {isPlaying ? "Playing" : frameGroups.length > 0 ? "Paused" : "Idle"}
                </span>
                <span className="ml-0 sm:ml-1 text-[color:var(--foreground)]/50 text-[10px] sm:text-xs">
                  {frameIndex + 1}/{frameGroups.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Info Section - Show what each control does */}
          <div className="mt-3 hidden sm:grid grid-cols-3 gap-3 text-[11px] text-[color:var(--foreground)]/60 border-t border-[var(--border)]/30 pt-3">
            <div className="flex items-start gap-2">
              <span className="text-violet-400">↔️</span>
              <span><strong>Hide Response:</strong> Toggle response packets from servers</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">⚡</span>
              <span><strong>Parallel:</strong> Show simultaneous request-response flows</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">🐛</span>
              <span><strong>Debug:</strong> Open detailed frame inspection panel</span>
            </div>
          </div>
        </header>

        {/* Main Content: Graph + Inspector */}
        <section className="flex min-h-0 flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Graph Canvas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 border-b lg:border-b-0 lg:border-r border-[var(--border)] min-h-0"
          >
            <GraphCanvas
              nodes={styledNodes}
              edges={animatedEdges}
              onNodeSelect={setSelectedNodeId}
              theme={theme}
            />
          </motion.div>

          {/* Inspector Panel - Hidden on mobile, visible on lg+ */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="hidden lg:flex w-full lg:w-80 overflow-hidden border-l border-[var(--border)] bg-[var(--surface)]/30 flex-col"
          >
            <NodeInspectorPanel
              selectedNode={selectedNode}
              currentFrames={currentFrames}
              redisStoreEntries={redisStoreEntries}
              postgresStoreEntries={postgresStoreEntries}
              storageStoreEntries={storageStoreEntries}
              theme={theme}
            />
          </motion.div>

          {/* Mobile Inspector Toggle Button */}
          <button
            onClick={() => setInspectorVisible(!inspectorVisible)}
            className="lg:hidden px-4 py-2 text-xs font-medium border-t border-[var(--border)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] transition text-[color:var(--foreground)]/70"
          >
            {inspectorVisible ? "Hide Inspector" : "Show Inspector"}
          </button>

          {/* Mobile Inspector Drawer */}
          {inspectorVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden w-full max-h-60 overflow-y-auto border-t border-[var(--border)] bg-[var(--surface)]/30"
            >
              <NodeInspectorPanel
                selectedNode={selectedNode}
                currentFrames={currentFrames}
                redisStoreEntries={redisStoreEntries}
                postgresStoreEntries={postgresStoreEntries}
                storageStoreEntries={storageStoreEntries}
                theme={theme}
              />
            </motion.div>
          )}
        </section>

        {/* Bottom Playback Panel - Resizable */}
        <div
          style={{ height: debugEnabled ? `${panelHeight}px` : "auto" }}
          className="flex flex-col border-t border-[var(--border)] bg-[var(--surface)]/30 transition-all duration-150 backdrop-blur overflow-hidden"
        >
          {/* Drag Handle */}
          {debugEnabled && (
            <div
              onMouseDown={() => setIsDragging(true)}
              className="h-1 w-full cursor-row-resize bg-[var(--border)] hover:bg-violet-500/50 transition-colors"
              title="Drag to resize debug panel"
            />
          )}

          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-3"
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="overflow-x-auto">
                  <Controls
                  isPlaying={isPlaying}
                  onPlayToggle={() => setIsPlaying((prev) => !prev)}
                  onPrev={goToPreviousFrame}
                  onNext={goToNextFrame}
                  onReset={resetPlayback}
                  debugEnabled={debugEnabled}
                  onDebugToggle={() => setDebugEnabled((prev) => !prev)}
                  speed={speed}
                  onSpeedChange={setSpeed}
                  theme={theme}
                />
                </div>
              </div>
              <p className={`text-[11px] ${theme === "dark" ? "text-slate-500" : "text-slate-600"}`}>
                Space: Play/Pause | ←→: Prev/Next | R: Reset
              </p>

              <Timeline
                frameIndex={frameIndex}
                frameGroups={frameGroups}
                onSeek={(index) => {
                  setIsPlaying(false);
                  setFrameIndex(index);
                }}
                theme={theme}
              />

              {debugEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  <div className={`rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 p-3`}>
                    <p className={`text-xs uppercase tracking-widest text-[color:var(--foreground)]/50 mb-3`}>
                      Frame {frameIndex + 1} Debug
                    </p>
                    <DebugPanel
                      currentFrames={currentFrames}
                      frameIndex={frameIndex}
                      theme={theme}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}