"use client";

import { use, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BaseEdge,
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  getSmoothStepPath,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SimDebug, ScenarioRunOptions } from "@/engine/types";
import { ALL_SCENARIOS } from "@/scenarios/all";
import SiteHeader from "@/components/SiteHeader";
import { ComponentIcon } from "@/components/ComponentIcons";
import {
  LEARN_TOPICS,
  LearnTopic,
  Checkpoint,
  LearnSection,
} from "@/learn/topics";

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

type LearnTopicPropsPage = {
  params: Promise<{ topicId: string }>;
};

type FrameGroup = {
  timestamp: number;
  frames: Frame[];
};

type StorageStore = Record<string, { [key: string]: unknown }>;

const DEFAULT_STORAGE_BUCKET = "media-uploads";

function cloneStorageStore(store?: StorageStore): StorageStore {
  const cloned: StorageStore = {};
  for (const [bucketName, bucketData] of Object.entries(store ?? {})) {
    cloned[bucketName] = { ...(bucketData ?? {}) };
  }
  return cloned;
}

function extractBucketName(payloadSummary?: string): string | undefined {
  if (!payloadSummary) return undefined;
  const bucketMatch = payloadSummary.match(/bucket=([^\s]+)/i);
  return bucketMatch?.[1];
}

function extractFileName(frame: Frame): string | undefined {
  const payload = frame.payloadSummary ?? "";

  const explicitFile = payload.match(/file=([^\s]+)/i)?.[1];
  if (explicitFile) return explicitFile;

  const uploadVerb = payload.match(/upload\s+([^\s]+)/i)?.[1];
  if (uploadVerb) return uploadVerb;

  const signedUrl = payload.match(/signedUrl=([^\s]+)/i)?.[1];
  if (signedUrl) {
    const fileInUrl = signedUrl.match(/\/upload\/([^?\s]+)/i)?.[1];
    if (fileInUrl) return decodeURIComponent(fileInUrl);
  }

  if (typeof frame.lookupKey === "string" && frame.lookupKey.length > 0) {
    return frame.lookupKey;
  }

  return undefined;
}

function isStorageMutationFrame(frame: Frame): boolean {
  const normalized = frame.action.toUpperCase();
  return (
    normalized === "STORAGE_UPLOAD_SUCCESS" ||
    normalized.includes("UPLOAD_SUCCESS") ||
    normalized.includes("STORE_FILE")
  );
}

function buildProgressiveStorageStore(
  frameGroups: FrameGroup[],
  uptoGroupIndex: number,
  seedStore?: StorageStore,
): StorageStore {
  const store = cloneStorageStore(seedStore);
  const requestToFile = new Map<string, string>();
  const requestToBucket = new Map<string, string>();

  if (frameGroups.length === 0 || uptoGroupIndex < 0) {
    return store;
  }

  const maxIndex = Math.min(uptoGroupIndex, frameGroups.length - 1);

  for (let groupIdx = 0; groupIdx <= maxIndex; groupIdx++) {
    for (const frame of frameGroups[groupIdx].frames) {
      const maybeBucket = extractBucketName(frame.payloadSummary);
      if (maybeBucket) {
        requestToBucket.set(frame.requestId, maybeBucket);
      }

      const maybeFile = extractFileName(frame);
      if (maybeFile) {
        requestToFile.set(frame.requestId, maybeFile);
      }

      if (!isStorageMutationFrame(frame)) {
        continue;
      }

      const bucket =
        requestToBucket.get(frame.requestId) ??
        extractBucketName(frame.payloadSummary) ??
        DEFAULT_STORAGE_BUCKET;

      const file =
        requestToFile.get(frame.requestId) ??
        extractFileName(frame) ??
        `${frame.requestId}.bin`;

      if (!store[bucket]) {
        store[bucket] = {};
      }

      store[bucket][file] = {
        requestId: frame.requestId,
        action: frame.action,
        timestamp: frame.timestamp,
      };
    }
  }

  return store;
}

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

  if (normalized.includes("client")) return "client";
  if (normalized.includes("api") && normalized.includes("gateway"))
    return "api-gateway";
  if (normalized.includes("load") && normalized.includes("balancer"))
    return "load-balancer";
  if (normalized.includes("storage") || normalized.includes("cloud"))
    return "storage";
  if (normalized.includes("upload") && normalized.includes("service"))
    return "server";
  if (normalized.includes("server")) return "server";
  if (normalized.includes("redis")) return "redis";
  if (normalized.includes("postgres")) return "postgres";

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
  const frameIndex = Number(data?.frameIndex ?? 0);

  const [animationPath] = getSmoothStepPath({
    sourceX: isReverseMotion ? targetX : sourceX,
    sourceY: isReverseMotion ? targetY : sourceY,
    sourcePosition: isReverseMotion ? targetPosition : sourcePosition,
    targetX: isReverseMotion ? sourceX : targetX,
    targetY: isReverseMotion ? sourceY : targetY,
    targetPosition: isReverseMotion ? sourcePosition : targetPosition,
    borderRadius: 10,
  });

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
            key={`${props.id}-${index}-${animationPath}-${frameIndex}`}
            r={4.5 - index * 0.5}
            fill={packetColor(isReverseMotion)}
            cx="0"
            cy="0"
            style={{
              filter: isReverseMotion
                ? "drop-shadow(0 0 5px rgba(245,158,11,0.85))"
                : "drop-shadow(0 0 5px rgba(139,92,246,0.85))",
              opacity: Math.max(0.45, 0.9 - index * 0.15),
            }}
          >
            <animateMotion
              dur={`${duration}s`}
              repeatCount="2"
              fill="freeze"
              begin={`${index * 0.12}s`}
              path={animationPath}
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        ))}
    </>
  );
}

function CustomNode({ id, data, selected }: any) {
  const typeColors: any = {
    client: "border-l-violet-500 shadow-violet-500/10",
    "api-gateway": "border-l-fuchsia-500 shadow-fuchsia-500/10",
    "load-balancer": "border-l-blue-500 shadow-blue-500/10",
    server: "border-l-emerald-500 shadow-emerald-500/10",
    redis: "border-l-amber-500 shadow-amber-500/10",
    postgres: "border-l-cyan-500 shadow-cyan-500/10",
    storage: "border-l-yellow-500 shadow-yellow-500/10",
  };

  let colorClass = typeColors[data.type] || "border-l-slate-400";
  let borderClass = "border-[var(--border)]";

  if (data.status === "error") {
    colorClass = "border-l-rose-500 shadow-rose-500/15 bg-rose-500/[0.03]";
    borderClass = "border-rose-500/50";
  } else if (data.status === "warning") {
    colorClass = "border-l-amber-500 shadow-amber-500/15 bg-amber-500/[0.03]";
    borderClass = "border-amber-500/50";
  }

  const hasTarget = data.type !== "client";
  const hasSource =
    data.type !== "redis" &&
    data.type !== "postgres" &&
    data.type !== "storage";

  return (
    <div
      className={`relative rounded-xl border border-l-4 bg-[var(--surface)] px-4 py-3 shadow-md transition-all duration-300 ${borderClass} ${colorClass} ${
        selected
          ? "ring-2 ring-violet-500 scale-105"
          : "hover:border-[var(--border)]/80"
      } min-w-[145px]`}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: "#8b5cf6", width: 8, height: 8 }}
          id="left"
        />
      )}

      <div className="flex items-center gap-2">
        <ComponentIcon type={data.type} className="w-5 h-5 shrink-0" />
        <div className="leading-tight">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[color:var(--foreground)]/45">
            {data.type}
          </p>
          <p className="text-xs font-bold text-[color:var(--foreground)] truncate max-w-[100px]">
            {data.label}
          </p>
          {data.status === "error" && (
            <p className="text-[9px] font-bold text-rose-400 mt-0.5 animate-pulse flex items-center gap-0.5">
              <span>⚠️</span>{" "}
              <span
                className="truncate max-w-[95px]"
                title={data.statusMessage}
              >
                {data.statusMessage || "Error"}
              </span>
            </p>
          )}
          {data.status === "warning" && (
            <p className="text-[9px] font-bold text-amber-400 mt-0.5 flex items-center gap-0.5">
              <span>⚠️</span>{" "}
              <span
                className="truncate max-w-[95px]"
                title={data.statusMessage}
              >
                {data.statusMessage || "Warning"}
              </span>
            </p>
          )}
        </div>
      </div>

      {data.poolInfo && (
        <div className="mt-2 pt-1.5 border-t border-[var(--border)]/35">
          <div className="flex justify-between text-[8px] font-bold text-cyan-400">
            <span>
              CONNS: {data.poolInfo.activeConnections}/{data.poolInfo.poolSize}
            </span>
          </div>
          <div className="w-full h-1 bg-[var(--surface-muted)] rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                data.poolInfo.exhausted
                  ? "bg-rose-500 animate-pulse"
                  : "bg-cyan-500"
              }`}
              style={{
                width: `${data.poolInfo.poolSize > 0 ? (data.poolInfo.activeConnections / data.poolInfo.poolSize) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {(data.isActive ||
        data.status === "error" ||
        data.status === "warning") && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              data.status === "error"
                ? "bg-rose-400"
                : data.status === "warning"
                  ? "bg-amber-400"
                  : "bg-violet-400"
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              data.status === "error"
                ? "bg-rose-500"
                : data.status === "warning"
                  ? "bg-amber-500"
                  : "bg-violet-500"
            }`}
          ></span>
        </span>
      )}

      {hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: "#8b5cf6", width: 8, height: 8 }}
          id="right"
        />
      )}
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
};

function GraphCanvas({
  nodes,
  edges,
  onNodeSelect,
  theme,
  systemMetrics,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect: (nodeId: string) => void;
  theme: Theme;
  systemMetrics: any;
}) {
  const bgColor = theme === "dark" ? "#0b0b0c" : "#f8fafc";
  const gridColor =
    theme === "dark" ? "rgba(100,116,139,0.23)" : "rgba(148,163,184,0.15)";

  const [showMetrics, setShowMetrics] = useState(true);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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

      {/* System Health & Load Monitor Overlay */}
      {systemMetrics && (
        showMetrics ? (
          <div className="absolute top-16 left-4 z-10 w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md shadow-lg p-3 flex flex-col gap-2.5 font-sans select-none pointer-events-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      systemMetrics.pendingCount > 0 ||
                      systemMetrics.errorRequests.length > 0
                        ? "bg-rose-400"
                        : "bg-emerald-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      systemMetrics.pendingCount > 0 ||
                      systemMetrics.errorRequests.length > 0
                        ? "bg-rose-500"
                        : "bg-emerald-500"
                    }`}
                  ></span>
                </span>
                <h3 className="text-[10px] font-bold text-[color:var(--foreground)] tracking-tight uppercase">
                  System Health & Load
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[color:var(--foreground)]/45">
                  t={systemMetrics.currentTick}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMetrics(false)}
                  className="text-xs text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)]/70 transition p-1 hover:bg-[var(--surface-muted)] rounded cursor-pointer leading-none flex items-center justify-center w-5 h-5 border border-transparent"
                  title="Collapse Overlay"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-center">
              <div className="bg-[var(--surface-muted)]/50 p-1.5 rounded-xl border border-[var(--border)]/35">
                <p className="text-[8px] uppercase font-semibold text-[color:var(--foreground)]/40 tracking-wider">
                  In-Flight Req
                </p>
                <p className="text-xs font-bold text-[color:var(--foreground)] mt-0.5">
                  {systemMetrics.activeCount} / {systemMetrics.totalRequests}
                </p>
              </div>
              <div
                className={`p-1.5 rounded-xl border ${
                  systemMetrics.pendingCount > 0
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-[var(--surface-muted)]/50 border-[var(--border)]/35 text-[color:var(--foreground)]"
                }`}
              >
                <p
                  className={`text-[8px] uppercase font-semibold tracking-wider ${
                    systemMetrics.pendingCount > 0
                      ? "text-rose-400/80"
                      : "text-[color:var(--foreground)]/40"
                  }`}
                >
                  Queue Size
                </p>
                <p className="text-xs font-bold mt-0.5">
                  {systemMetrics.pendingCount}
                </p>
              </div>
            </div>

            {systemMetrics.queuedRequests.length > 0 && (
              <div className="flex flex-col gap-1 rounded-xl bg-rose-500/5 border border-rose-500/15 p-2">
                <p className="text-[8px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                  <span>⏳</span> Bottleneck: Database Wait
                </p>
                <div className="max-h-16 overflow-y-auto space-y-0.5 mt-0.5 scrollbar-thin">
                  {systemMetrics.queuedRequests.map(
                    (req: string, idx: number) => (
                      <p
                        key={idx}
                        className="text-[9px] font-mono text-rose-300/90 leading-tight"
                      >
                        • {req} queued
                      </p>
                    ),
                  )}
                </div>
              </div>
            )}

            {systemMetrics.errorRequests.length > 0 && (
              <div className="flex flex-col gap-1 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2">
                <p className="text-[8px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                  <span>❌</span> Failures Detected
                </p>
                <div className="max-h-16 overflow-y-auto space-y-0.5 mt-0.5 scrollbar-thin">
                  {systemMetrics.errorRequests.map((err: string, idx: number) => (
                    <p
                      key={idx}
                      className="text-[9px] font-mono text-rose-200/90 leading-tight"
                    >
                      • {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {systemMetrics.activeCount > 0 &&
              systemMetrics.queuedRequests.length === 0 &&
              systemMetrics.errorRequests.length === 0 && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-1.5 text-emerald-400">
                  <span className="text-xs">⚡</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider">
                    Processing requests smoothly
                  </span>
                </div>
              )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowMetrics(true)}
            className="absolute top-16 left-4 z-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 hover:bg-[var(--surface-muted)] hover:border-[var(--border)]/80 text-[10px] font-bold text-[color:var(--foreground)]/80 transition px-3 py-1.5 flex items-center gap-1.5 shadow-md cursor-pointer pointer-events-auto"
            title="Expand Health Overlay"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  systemMetrics.pendingCount > 0 ||
                  systemMetrics.errorRequests.length > 0
                    ? "bg-rose-400"
                    : "bg-emerald-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  systemMetrics.pendingCount > 0 ||
                  systemMetrics.errorRequests.length > 0
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                }`}
              ></span>
            </span>
            <span>⚡ Health & Load</span>
          </button>
        )
      )}
    </div>
  );
}

function Controls({
  isPlaying,
  onPlayToggle,
  onPrev,
  onNext,
  onReset,
  speed,
  onSpeedChange,
  theme,
}: {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  theme: Theme;
}) {
  const btnBg = theme === "dark" ? "bg-slate-950" : "bg-slate-100";
  const btnBorder =
    theme === "dark"
      ? "border-slate-700 hover:border-slate-600"
      : "border-slate-300 hover:border-slate-400";
  const btnText = theme === "dark" ? "text-slate-300" : "text-slate-700";
  const buttonClass = `rounded-md border ${btnBorder} ${btnBg} px-3 py-1.5 text-xs ${btnText} transition hover:bg-${theme === "dark" ? "slate-900" : "slate-200"} cursor-pointer`;

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
          <label
            className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
          >
            <span className="hidden sm:inline">Speed: </span>
            <span className="font-semibold">{speed?.toFixed(1)}x</span>
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
  const emptyBg =
    theme === "dark"
      ? "bg-slate-950 border-slate-800"
      : "bg-slate-100 border-slate-300";
  const emptyText = theme === "dark" ? "text-slate-500" : "text-slate-600";
  const inactiveBg =
    theme === "dark"
      ? "bg-slate-950 border-slate-700 text-slate-400"
      : "bg-slate-100 border-slate-300 text-slate-600";
  const inactiveHover =
    theme === "dark" ? "hover:border-slate-600" : "hover:border-slate-400";

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
        className="w-full accent-violet-500 cursor-pointer"
      />

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {frameGroups.map((group, index) => {
          const isActive = index === frameIndex;

          return (
            <button
              key={`${group.timestamp}-${index}`}
              type="button"
              onClick={() => onSeek(index)}
              className={`shrink-0 rounded-sm border px-2 py-1.5 text-[11px] transition cursor-pointer ${
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
  nodeConfigs,
  updateNodeConfig,
  nodes,
  scenarioId,
}: {
  selectedNode: Node | null;
  currentFrames: Frame[];
  redisStoreEntries: Array<[string, unknown]>;
  postgresStoreEntries: Array<[string, unknown]>;
  storageStoreEntries: Array<[string, { [key: string]: unknown }]>;
  theme: Theme;
  nodeConfigs: Record<string, any>;
  updateNodeConfig: (
    nodeId: string,
    updatedFields: Record<string, any>,
  ) => void;
  nodes: Node[];
  scenarioId: string;
}) {
  const [activeReqIdx, setActiveReqIdx] = useState(0);
  const bgColor = theme === "dark" ? "bg-slate-950" : "bg-white";
  const textColor = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const headingColor = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const labelColor = theme === "dark" ? "text-slate-600" : "text-slate-500";
  const borderColor =
    theme === "dark" ? "border-slate-800" : "border-slate-200";
  const cardBg = theme === "dark" ? "bg-slate-900/50" : "bg-slate-50";
  const cardBorder = theme === "dark" ? "border-slate-800" : "border-slate-200";

  if (!selectedNode) {
    return (
      <aside className={`flex h-full flex-col ${bgColor} p-4`}>
        <div>
          <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>
            Inspector
          </p>
          <p className={`mt-3 text-xs ${textColor}`}>
            Click a node to inspect details
          </p>
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
        <p className={`text-[10px] uppercase tracking-widest ${labelColor}`}>
          Inspector
        </p>
        <p className={`mt-2 font-mono text-sm ${headingColor}`}>{label}</p>
        <p className={`mt-1 text-xs ${textColor}`}>Type: {role}</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-3 px-4 py-3">
          {/* Node Config Options */}
          {nodeConfigs && nodeConfigs[selectedNode.id] && (
            <div
              className={`rounded-xl border border-violet-500/25 bg-violet-500/5 p-3.5 space-y-3 shadow-inner`}
            >
              <p
                className={`text-[10px] uppercase tracking-widest text-violet-400 font-bold font-mono`}
              >
                Configure
              </p>

              {role === "client" && (() => {
                const requests = nodeConfigs[selectedNode.id]?.requests || [];
                const activeIdx = Math.max(0, Math.min(activeReqIdx, requests.length - 1));
                const activeReq = requests[activeIdx];

                return (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[color:var(--foreground)]/55 uppercase font-mono">
                          Requests List
                        </label>
                      </div>

                      {/* Horizontal Tabs */}
                      <div className="flex items-center gap-1 border-b border-[var(--border)]/50 overflow-x-auto pb-1.5 scrollbar-thin whitespace-nowrap min-w-0">
                        {requests.map((_: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveReqIdx(idx)}
                            className={`text-[10px] px-2.5 py-1 rounded-t-md font-medium transition cursor-pointer border-t border-x shrink-0 ${
                              idx === activeIdx
                                ? "bg-[var(--surface-muted)] border-[var(--border)] text-violet-400 font-bold -mb-[7px] pb-[7px]"
                                : "border-transparent text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)]/50"
                            }`}
                          >
                            Req #{idx + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const nextReqs = [
                              ...requests,
                              {
                                endpoint: "/api/v1/posts",
                                method: "GET",
                                lookupKey: "rohan",
                                fileName: "file.png",
                                isThereFileToUpload: false,
                                targetBucket: "media-uploads",
                              },
                            ];
                            updateNodeConfig(selectedNode.id, {
                              requests: nextReqs,
                            });
                            setActiveReqIdx(nextReqs.length - 1);
                          }}
                          className="text-[9px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded transition cursor-pointer shrink-0 ml-auto"
                        >
                          + Add
                        </button>
                      </div>

                      {requests.length > 0 && activeReq ? (
                        <div className="bg-[var(--surface-muted)] p-2.5 rounded-lg border border-[var(--border)] relative group/req space-y-1.5 mt-2">
                          {requests.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextReqs = requests.filter(
                                  (_: any, i: number) => i !== activeIdx,
                                );
                                updateNodeConfig(selectedNode.id, {
                                  requests: nextReqs,
                                });
                                setActiveReqIdx(Math.max(0, activeIdx - 1));
                              }}
                              className="absolute top-1 right-2 text-rose-500 hover:text-rose-600 text-xs font-bold cursor-pointer"
                              title="Remove Request"
                            >
                              Remove ×
                            </button>
                          )}
                          <div className="text-[10px] font-bold text-violet-400">
                            Editing Request #{activeIdx + 1}
                          </div>

                          {scenarioId === "simple-valet-key" ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                  File Name
                                </label>
                                <input
                                  type="text"
                                  value={activeReq.fileName || "upload.bin"}
                                  onChange={(e) => {
                                    const nextReqs = [...requests];
                                    nextReqs[activeIdx] = {
                                      ...nextReqs[activeIdx],
                                      fileName: e.target.value,
                                    };
                                    updateNodeConfig(selectedNode.id, {
                                      requests: nextReqs,
                                    });
                                  }}
                                  className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] outline-none font-mono text-xs text-[color:var(--foreground)]"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                  Bucket
                                </label>
                                <input
                                  type="text"
                                  value={activeReq.targetBucket || "media-uploads"}
                                  onChange={(e) => {
                                    const nextReqs = [...requests];
                                    nextReqs[activeIdx] = {
                                      ...nextReqs[activeIdx],
                                      targetBucket: e.target.value,
                                    };
                                    updateNodeConfig(selectedNode.id, {
                                      requests: nextReqs,
                                    });
                                  }}
                                  className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] outline-none font-mono text-xs text-[color:var(--foreground)]"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                    Method
                                  </label>
                                  <select
                                    value={activeReq.method || "GET"}
                                    onChange={(e) => {
                                      const nextReqs = [...requests];
                                      nextReqs[activeIdx] = {
                                        ...nextReqs[activeIdx],
                                        method: e.target.value,
                                      };
                                      updateNodeConfig(selectedNode.id, {
                                        requests: nextReqs,
                                      });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px] outline-none cursor-pointer text-[color:var(--foreground)]"
                                  >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                    <option value="PATCH">PATCH</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                    Lookup Key
                                  </label>
                                  <input
                                    type="text"
                                    value={activeReq.lookupKey || ""}
                                    placeholder="e.g. rohan"
                                    onChange={(e) => {
                                      const nextReqs = [...requests];
                                      nextReqs[activeIdx] = {
                                        ...nextReqs[activeIdx],
                                        lookupKey: e.target.value,
                                      };
                                      updateNodeConfig(selectedNode.id, {
                                        requests: nextReqs,
                                      });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] outline-none font-mono text-xs text-[color:var(--foreground)]"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                  Endpoint Path
                                </label>
                                <input
                                  type="text"
                                  value={activeReq.endpoint || ""}
                                  placeholder="/api/v1/resource"
                                  onChange={(e) => {
                                    const nextReqs = [...requests];
                                    nextReqs[activeIdx] = {
                                      ...nextReqs[activeIdx],
                                      endpoint: e.target.value,
                                    };
                                    updateNodeConfig(selectedNode.id, {
                                      requests: nextReqs,
                                    });
                                  }}
                                  className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] outline-none font-mono text-xs text-[color:var(--foreground)]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[color:var(--foreground)]/50 italic py-4 text-center">
                          No requests configured. Click "+ Add" to add one.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {role === "load-balancer" && (
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                    Load Balancing Strategy
                  </label>
                  <select
                    value={
                      nodeConfigs[selectedNode.id]?.strategy ?? "ROUND_ROBIN"
                    }
                    onChange={(e) =>
                      updateNodeConfig(selectedNode.id, {
                        strategy: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none cursor-pointer focus:border-blue-500 text-[color:var(--foreground)]"
                  >
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="RANDOM">Random Dispatch</option>
                    <option value="IP_HASH">IP Address Hash</option>
                  </select>
                </div>
              )}

              {role === "api-gateway" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                      Load Balance Strategy
                    </label>
                    <select
                      value={
                        nodeConfigs[selectedNode.id]?.strategy ?? "ROUND_ROBIN"
                      }
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, {
                          strategy: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none cursor-pointer focus:border-violet-500 text-[color:var(--foreground)]"
                    >
                      <option value="ROUND_ROBIN">Round Robin</option>
                      <option value="RANDOM">Random Dispatch</option>
                      <option value="IP_HASH">IP Address Hash</option>
                    </select>
                  </div>

                  <div className="h-px bg-[var(--border)]/70" />

                  {/* Route Rules */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55">
                        Route Rules
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const routes =
                            nodeConfigs[selectedNode.id]?.routes || {};
                          const nextRoutes = {
                            ...routes,
                            [`/api/v1/route-${Object.keys(routes).length + 1}`]: `NEW_SERVICE`,
                          };
                          updateNodeConfig(selectedNode.id, {
                            routes: nextRoutes,
                          });
                        }}
                        className="text-[9px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                      >
                        + Add Rule
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {Object.entries(
                        nodeConfigs[selectedNode.id]?.routes || {},
                      ).map(([path, svc]: [string, any], idx) => (
                        <div key={idx} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            value={path}
                            placeholder="Path prefix"
                            onChange={(e) => {
                              const routes = (nodeConfigs[selectedNode.id]
                                ?.routes || {}) as Record<string, string>;
                              const nextRoutes: Record<string, string> = {};
                              for (const [k, v] of Object.entries(routes)) {
                                if (k === path) {
                                  nextRoutes[e.target.value] = svc as string;
                                } else {
                                  nextRoutes[k] = v;
                                }
                              }
                              updateNodeConfig(selectedNode.id, {
                                routes: nextRoutes,
                              });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono text-[color:var(--foreground)]"
                          />
                          <input
                            type="text"
                            value={svc}
                            placeholder="Service name"
                            onChange={(e) => {
                              const nextRoutes = {
                                ...(nodeConfigs[selectedNode.id]?.routes || {}),
                              };
                              nextRoutes[path] = e.target.value;
                              updateNodeConfig(selectedNode.id, {
                                routes: nextRoutes,
                              });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono text-[color:var(--foreground)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextRoutes = {
                                ...(nodeConfigs[selectedNode.id]?.routes || {}),
                              };
                              delete nextRoutes[path];
                              updateNodeConfig(selectedNode.id, {
                                routes: nextRoutes,
                              });
                            }}
                            className="text-rose-500 hover:text-rose-600 text-xs px-1 cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-[var(--border)]/70" />

                  {/* Service Pools Mapping */}
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                      Service Pools Mapping
                    </label>
                    <div className="space-y-2 border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]/50">
                      {nodes
                        .filter((n) => n.id.includes("server"))
                        .map((serverNode) => {
                          const serverId = serverNode.id;
                          const serverLabel = String(
                            serverNode.data?.label || serverId,
                          );
                          const serviceMapping =
                            nodeConfigs[selectedNode.id]?.serviceMapping || {};
                          const routes =
                            nodeConfigs[selectedNode.id]?.routes || {};
                          const serviceOptions = Array.from(
                            new Set(Object.values(routes)),
                          );

                          let currentVal = serviceMapping[serverId];
                          if (!currentVal) {
                            if (serverId.includes("server-1"))
                              currentVal = "USER_SERVICE";
                            else currentVal = "POST_SERVICE";
                          }

                          return (
                            <div
                              key={serverId}
                              className="flex flex-col gap-1 border-b border-[var(--border)]/35 pb-2 last:border-b-0 last:pb-0"
                            >
                              <span className="text-[10px] font-mono flex items-center gap-1.5 text-[color:var(--foreground)]/70">
                                {serverLabel}
                              </span>
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const nextMapping = {
                                    ...(nodeConfigs[selectedNode.id]
                                      ?.serviceMapping || {}),
                                    [serverId]: e.target.value,
                                  };
                                  updateNodeConfig(selectedNode.id, {
                                    serviceMapping: nextMapping,
                                  });
                                }}
                                className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-xs outline-none cursor-pointer text-[color:var(--foreground)]"
                              >
                                {serviceOptions.map((opt: any) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                                <option value="UNASSIGNED">Unassigned</option>
                              </select>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {role === "server" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                      Connections Capacity
                    </label>
                    <input
                      type="number"
                      value={nodeConfigs[selectedNode.id]?.capacity ?? 100}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, {
                          capacity: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-violet-500 text-[color:var(--foreground)]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                      TCP Connections to Postgres
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={
                          nodeConfigs[selectedNode.id]?.tcpConnections ?? 10
                        }
                        onChange={(e) =>
                          updateNodeConfig(selectedNode.id, {
                            tcpConnections: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500 text-[color:var(--foreground)]"
                      />
                      <span className="text-[10px] text-[color:var(--foreground)]/45 shrink-0 font-mono">
                        conns
                      </span>
                    </div>
                    <p className="mt-1 text-[9px] text-[color:var(--foreground)]/40 leading-relaxed">
                      Pool size for parallel Postgres queries. 0 = no
                      connections (blocks queries).
                    </p>
                  </div>

                  <div className="h-px bg-[var(--border)]/70 my-2" />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55">
                        Exposed Endpoints
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const endpoints =
                            nodeConfigs[selectedNode.id]?.endpoints || {};
                          const nextEndpoints = {
                            ...endpoints,
                            [`api/v1/endpoint-${Object.keys(endpoints).length + 1}`]:
                              ["GET"],
                          };
                          updateNodeConfig(selectedNode.id, {
                            endpoints: nextEndpoints,
                          });
                        }}
                        className="text-[9px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                      >
                        + Add Endpoint
                      </button>
                    </div>

                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {Object.entries(
                        nodeConfigs[selectedNode.id]?.endpoints || {},
                      ).map(([path, methods]: [string, any], idx) => {
                        const allHttpMethods = [
                          "GET",
                          "POST",
                          "PUT",
                          "DELETE",
                          "PATCH",
                        ];
                        return (
                          <div
                            key={idx}
                            className="border border-[var(--border)] rounded-lg p-2.5 bg-[var(--surface)]/50 space-y-2 relative group/ep"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const nextEndpoints = {
                                  ...(nodeConfigs[selectedNode.id]?.endpoints ||
                                    {}),
                                };
                                delete nextEndpoints[path];
                                updateNodeConfig(selectedNode.id, {
                                  endpoints: nextEndpoints,
                                });
                              }}
                              className="absolute top-1.5 right-1.5 text-rose-500 hover:text-rose-600 text-xs font-bold px-1 cursor-pointer opacity-50 hover:opacity-100 transition"
                              title="Delete Endpoint"
                            >
                              ×
                            </button>

                            <div>
                              <label className="text-[8px] text-[color:var(--foreground)]/50 block mb-0.5">
                                Route Path
                              </label>
                              <input
                                type="text"
                                value={path}
                                placeholder="api/v1/resource"
                                onChange={(e) => {
                                  const endpoints = (nodeConfigs[
                                    selectedNode.id
                                  ]?.endpoints || {}) as Record<string, any>;
                                  const nextEndpoints: Record<string, any> = {};
                                  for (const [k, v] of Object.entries(
                                    endpoints,
                                  )) {
                                    if (k === path) {
                                      nextEndpoints[e.target.value] = v;
                                    } else {
                                      nextEndpoints[k] = v;
                                    }
                                  }
                                  updateNodeConfig(selectedNode.id, {
                                    endpoints: nextEndpoints,
                                  });
                                }}
                                className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono outline-none focus:border-violet-500 text-[color:var(--foreground)]"
                              />
                            </div>

                            <div>
                              <label className="text-[8px] text-[color:var(--foreground)]/50 block mb-1">
                                Allowed Methods
                              </label>
                              <div className="flex flex-wrap gap-1">
                                {allHttpMethods.map((m) => {
                                  const isSelected = (methods || []).includes(
                                    m,
                                  );
                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        const nextEndpoints = {
                                          ...(nodeConfigs[selectedNode.id]
                                            ?.endpoints || {}),
                                        };
                                        const currentMethods =
                                          nextEndpoints[path] || [];
                                        let updatedMethods: any[];
                                        if (isSelected) {
                                          updatedMethods =
                                            currentMethods.filter(
                                              (item: string) => item !== m,
                                            );
                                        } else {
                                          updatedMethods = [
                                            ...currentMethods,
                                            m,
                                          ];
                                        }
                                        nextEndpoints[path] = updatedMethods;
                                        updateNodeConfig(selectedNode.id, {
                                          endpoints: nextEndpoints,
                                        });
                                      }}
                                      className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold transition cursor-pointer border ${
                                        isSelected
                                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                          : "bg-[var(--surface-muted)] border-[var(--border)] text-[color:var(--foreground)]/55 hover:border-[var(--border)]/80 hover:text-[color:var(--foreground)]"
                                      }`}
                                    >
                                      {m}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {role === "redis" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[color:var(--foreground)]/65 font-bold uppercase font-mono">
                      Cached Pairs
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const prevList =
                          nodeConfigs[selectedNode.id]?.data ?? [];
                        updateNodeConfig(selectedNode.id, {
                          data: [...prevList, { key: "", val: "" }],
                        });
                      }}
                      className="text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      + Add Key
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {(nodeConfigs[selectedNode.id]?.data || []).map(
                      (item: any, idx: number) => (
                        <div key={idx} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            value={item.key}
                            placeholder="Key"
                            onChange={(e) => {
                              const nextList = [
                                ...nodeConfigs[selectedNode.id].data,
                              ];
                              nextList[idx].key = e.target.value;
                              updateNodeConfig(selectedNode.id, {
                                data: nextList,
                              });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono text-[color:var(--foreground)]"
                          />
                          <input
                            type="text"
                            value={item.val}
                            placeholder="Value"
                            onChange={(e) => {
                              const nextList = [
                                ...nodeConfigs[selectedNode.id].data,
                              ];
                              nextList[idx].val = e.target.value;
                              updateNodeConfig(selectedNode.id, {
                                data: nextList,
                              });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none text-[color:var(--foreground)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextList = nodeConfigs[
                                selectedNode.id
                              ].data.filter((_: any, i: number) => i !== idx);
                              updateNodeConfig(selectedNode.id, {
                                data: nextList,
                              });
                            }}
                            className="text-red-500 hover:text-red-600 text-xs px-1 cursor-pointer font-bold font-mono"
                          >
                            ×
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {role === "postgres" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                      Table Name
                    </label>
                    <input
                      type="text"
                      value={nodeConfigs[selectedNode.id]?.table ?? "users"}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, {
                          table: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-violet-500 text-[color:var(--foreground)]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[color:var(--foreground)]/65 font-bold uppercase font-mono">
                      Row Entries
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const prevList =
                          nodeConfigs[selectedNode.id]?.data ?? [];
                        updateNodeConfig(selectedNode.id, {
                          data: [...prevList, { key: "", val: "" }],
                        });
                      }}
                      className="text-[9px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      + Add Row
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {(nodeConfigs[selectedNode.id]?.data || []).map(
                      (item: any, idx: number) => (
                        <div key={idx} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            value={item.key}
                            placeholder="PK"
                            onChange={(e) => {
                              const nextList = [
                                ...nodeConfigs[selectedNode.id].data,
                              ];
                              nextList[idx].key = e.target.value;
                              updateNodeConfig(selectedNode.id, {
                                data: nextList,
                              });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono text-[color:var(--foreground)]"
                          />
                          <input
                            type="text"
                            value={item.val}
                            placeholder="Value"
                            onChange={(e) => {
                              const nextList = [
                                ...nodeConfigs[selectedNode.id].data,
                              ];
                              nextList[idx].val = e.target.value;
                              updateNodeConfig(selectedNode.id, {
                                data: nextList,
                              });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none text-[color:var(--foreground)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextList = nodeConfigs[
                                selectedNode.id
                              ].data.filter((_: any, i: number) => i !== idx);
                              updateNodeConfig(selectedNode.id, {
                                data: nextList,
                              });
                            }}
                            className="text-red-500 hover:text-red-600 text-xs px-1 cursor-pointer font-bold font-mono"
                          >
                            ×
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {role === "storage" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[color:var(--foreground)]/65 font-bold uppercase font-mono">
                      Buckets
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const currentBuckets = nodeConfigs[selectedNode.id]
                          ?.buckets || ["media-uploads"];
                        const nextBuckets = [
                          ...currentBuckets,
                          `bucket-${currentBuckets.length + 1}`,
                        ];
                        updateNodeConfig(selectedNode.id, {
                          buckets: nextBuckets,
                        });
                      }}
                      className="text-[9px] bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      + Add Bucket
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {(
                      nodeConfigs[selectedNode.id]?.buckets || ["media-uploads"]
                    ).map((b: string, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const nextList = [
                              ...(nodeConfigs[selectedNode.id]?.buckets || [
                                "media-uploads",
                              ]),
                            ];
                            nextList[idx] = e.target.value;
                            updateNodeConfig(selectedNode.id, {
                              buckets: nextList,
                            });
                          }}
                          className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono focus:border-yellow-500 text-[color:var(--foreground)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentBuckets = nodeConfigs[selectedNode.id]
                              ?.buckets || ["media-uploads"];
                            if (currentBuckets.length <= 1) return;
                            const nextBuckets = currentBuckets.filter(
                              (_: any, i: number) => i !== idx,
                            );
                            updateNodeConfig(selectedNode.id, {
                              buckets: nextBuckets,
                            });
                          }}
                          className="text-rose-500 hover:text-rose-600 text-xs font-bold px-2 cursor-pointer font-mono"
                          title="Delete Bucket"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {role === "redis" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p
                className={`text-[10px] uppercase tracking-widest ${labelColor}`}
              >
                Redis Store
              </p>
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
              <p
                className={`text-[10px] uppercase tracking-widest ${labelColor}`}
              >
                Database
              </p>
              {postgresStoreEntries.length === 0 ? (
                <p className={`mt-2 text-xs ${textColor}`}>No records</p>
              ) : (
                <table className="mt-2 w-full text-xs">
                  <tbody className="space-y-1">
                    {postgresStoreEntries.map(([key, value]) => (
                      <tr key={key} className={`border-b ${borderColor}`}>
                        <td className={`truncate pr-2 py-1 ${headingColor}`}>
                          {key}
                        </td>
                        <td className={`truncate ${textColor}`}>
                          {String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Connection Pool Status — shown on Postgres node when pool frames are present */}
          {role === "postgres" &&
            (() => {
              const poolFrames = currentFrames.filter(
                (f) =>
                  f.action === "POSTGRES_POOL_WAIT" ||
                  f.action === "POSTGRES_QUERY_HIT" ||
                  f.action === "POSTGRES_QUERY_MISS",
              );
              const poolMap = new Map<
                string,
                {
                  poolSize: number;
                  activeConnections: number;
                  exhausted: boolean;
                }
              >();
              for (const f of poolFrames) {
                const ps = (f as any).postgresPoolStatus;
                if (ps && ps.serverId && ps.poolSize >= 0) {
                  poolMap.set(ps.serverId, {
                    poolSize: ps.poolSize,
                    activeConnections: ps.activeConnections,
                    exhausted: ps.exhausted,
                  });
                }
              }
              if (poolMap.size === 0) return null;
              return (
                <div
                  className={`rounded-md border ${theme === "dark" ? "border-cyan-500/25 bg-cyan-500/5" : "border-cyan-400/30 bg-cyan-50"} p-3`}
                >
                  <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold font-mono mb-2.5">
                    Connection Pool Status
                  </p>
                  <div className="space-y-2.5">
                    {Array.from(poolMap.entries()).map(([serverId, info]) => {
                      const pct =
                        info.poolSize > 0
                          ? Math.round(
                              (info.activeConnections / info.poolSize) * 100,
                            )
                          : 0;
                      const barColor = info.exhausted
                        ? "bg-rose-500"
                        : pct > 70
                          ? "bg-amber-400"
                          : "bg-cyan-400";
                      return (
                        <div key={serverId}>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-[10px] font-mono ${textColor} truncate max-w-[90px]`}
                            >
                              {serverId}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold ${info.exhausted ? "text-rose-400" : "text-cyan-400"}`}
                            >
                              {info.activeConnections}/{info.poolSize}
                              {info.exhausted ? " 🔴 WAIT" : ""}
                            </span>
                          </div>
                          <div
                            className={`h-1.5 w-full rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"} overflow-hidden`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              style={{
                                width: `${Math.max(2, Math.min(pct, 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {role === "server" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p
                className={`text-[10px] uppercase tracking-widest ${labelColor}`}
              >
                Queue Status
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${relatedFrames.length > 0 ? "bg-emerald-400" : theme === "dark" ? "bg-slate-600" : "bg-slate-400"}`}
                />
                <span className={`text-xs ${textColor}`}>
                  {relatedFrames.length > 0 ? "Busy" : "Idle"}
                </span>
              </div>
              {relatedFrames.length > 0 && (
                <div className="mt-2 space-y-1">
                  {relatedFrames.map((frame) => (
                    <div
                      key={frame.requestId}
                      className={`rounded border ${borderColor} ${theme === "dark" ? "bg-slate-950" : "bg-slate-100"} p-1.5`}
                    >
                      <p className="font-mono text-[11px] text-violet-400">
                        {frame.requestId.slice(0, 8)}
                      </p>
                      <p className={`mt-0.5 text-[10px] ${textColor}`}>
                        {frame.action}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {role === "storage" && (
            <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
              <p
                className={`text-[10px] uppercase tracking-widest ${labelColor}`}
              >
                Storage Buckets
              </p>
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
                        <p className="font-mono text-[11px] text-violet-400">
                          {bucketName}
                        </p>
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

          {role !== "server" &&
            role !== "storage" &&
            role !== "redis" &&
            role !== "postgres" && (
              <div className={`rounded-md border ${cardBorder} ${cardBg} p-3`}>
                <p
                  className={`text-[10px] uppercase tracking-widest ${labelColor}`}
                >
                  Activity
                </p>
                <p className={`mt-2 text-xs ${textColor}`}>
                  {relatedFrames.length} event(s) this frame
                </p>
              </div>
            )}
        </div>
      </div>
    </aside>
  );
}

function getFormattedLogText(frame: Frame) {
  const normAction = frame.action.toUpperCase();
  const flow = `${frame.from} ➔ ${frame.to}`;

  if (normAction.includes("CACHE_HIT")) {
    return {
      text: `${flow} | Cache HIT - Key: "${frame.lookupKey || "N/A"}"`,
      type: "success",
    };
  }

  if (normAction.includes("CACHE_MISS")) {
    return {
      text: `${flow} | Cache MISS - Key: "${frame.lookupKey || "N/A"}"`,
      type: "warn",
    };
  }

  if (normAction.includes("DB_READ") || normAction.includes("READ_RECORD")) {
    return {
      text: `${flow} | DB Read - Key: "${frame.lookupKey || "N/A"}"`,
      type: "warn",
    };
  }

  if (
    normAction.includes("DB_WRITE") ||
    normAction.includes("STORE_FILE") ||
    normAction.includes("WRITE_RECORD") ||
    normAction.includes("UPLOAD_SUCCESS")
  ) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Data: ${frame.payloadSummary}`
        : "";
    return {
      text: `${flow} | DB Write - Key: "${frame.lookupKey || "N/A"}"${payloadStr}`,
      type: "info",
    };
  }

  if (normAction.includes("RESPONSE_ERROR")) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Payload: ${frame.payloadSummary}`
        : "";
    let statusText = "404 Not Found";
    if (normAction.includes("_405")) {
      statusText = "405 Method Not Allowed";
    } else if (normAction.includes("_500")) {
      statusText = "500 Internal Server Error";
    }
    return {
      text: `${flow} | Respond - Status: ${statusText}${payloadStr}`,
      type: "warn",
    };
  }

  if (normAction.includes("ENDPOINT_NOT_FOUND")) {
    return {
      text: `${flow} | 404 Not Found - ${frame.payloadSummary || "Endpoint Not Found"}`,
      type: "warn",
    };
  }

  if (normAction.includes("METHOD_NOT_ALLOWED")) {
    return {
      text: `${flow} | 405 Method Not Allowed - ${frame.payloadSummary || "Method Not Allowed"}`,
      type: "warn",
    };
  }

  if (
    normAction.includes("SEND_RESPONSE") ||
    normAction.includes("RETURN_DATA")
  ) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Payload: ${frame.payloadSummary}`
        : "";
    return {
      text: `${flow} | Respond - Status: 200 OK${payloadStr}`,
      type: "success",
    };
  }

  if (
    normAction.includes("SEND_REQUEST") ||
    normAction.includes("ROUTE_REQUEST")
  ) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Payload: ${frame.payloadSummary}`
        : "";
    return {
      text: `${flow} | Dispatch Request - Action: ${frame.action}${payloadStr}`,
      type: "default",
    };
  }

  if (normAction.includes("POSTGRES_POOL_WAIT")) {
    const payloadStr = frame.payloadSummary ? ` — ${frame.payloadSummary}` : "";
    return {
      text: `${flow} | ⏳ POSTGRES POOL WAIT${payloadStr}`,
      type: "error",
    };
  }

  if (normAction.includes("POSTGRES_CONNECTION_ERROR")) {
    const payloadStr = frame.payloadSummary ? ` — ${frame.payloadSummary}` : "";
    return {
      text: `${flow} | ❌ POSTGRES CONNECTION ERROR${payloadStr}`,
      type: "error",
    };
  }

  if (normAction.includes("POSTGRES_QUERY_HIT")) {
    const reqStr = frame.requestName ? ` for ${frame.requestName}` : "";
    const keyStr = frame.lookupKey ? ` (Key: "${frame.lookupKey}")` : "";
    return {
      text: `${flow} | POSTGRES QUERY HIT${reqStr}${keyStr}`,
      type: "success",
    };
  }

  if (normAction.includes("POSTGRES_QUERY_MISS")) {
    const reqStr = frame.requestName ? ` for ${frame.requestName}` : "";
    const keyStr = frame.lookupKey ? ` (Key: "${frame.lookupKey}")` : "";
    return {
      text: `${flow} | POSTGRES QUERY MISS${reqStr}${keyStr}`,
      type: "warn",
    };
  }

  const details = [
    frame.lookupKey ? `Key: "${frame.lookupKey}"` : "",
    frame.payloadSummary && frame.payloadSummary !== "{}"
      ? `Payload: ${frame.payloadSummary}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    text: `${flow} | ${frame.action}${details ? ` (${details})` : ""}`,
    type: "default",
  };
}

function DebugPanel({
  currentFrames,
  theme,
}: {
  currentFrames: Frame[];
  theme: Theme;
}) {
  const textColor = theme === "dark" ? "text-slate-500" : "text-slate-400";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentFrames.length]);

  if (currentFrames.length === 0) {
    return (
      <div className="font-mono text-xs p-1">
        <p className={textColor}>No active frames</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto p-1 scroll-smooth scrollbar-thin"
    >
      {currentFrames.map((frame, idx) => {
        const formatted = getFormattedLogText(frame);
        const colors: Record<string, string> = {
          success: "text-emerald-400",
          info: "text-blue-400",
          warn: "text-amber-400",
          default: "text-[color:var(--foreground)]/80",
        };

        return (
          <div
            key={`${frame.requestId}-${idx}`}
            className="flex gap-2 items-start text-[11px] leading-relaxed"
          >
            <span className="text-[color:var(--foreground)]/35 select-none">
              [t={frame.timestamp}]
            </span>
            <span className="text-violet-400 font-bold select-none">&gt;</span>
            <span className={colors[formatted.type] || colors.default}>
              {formatted.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function generateFrames(
  options: ScenarioRunOptions,
  scenarioId: string,
): SimBundle {
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

function createDefaultConfig(type: string, id: string, label: string) {
  switch (type) {
    case "client":
      return {
        endpoint: "/api/v1/posts",
        method: "GET",
        lookupKey: "rohan",
        valetKeyFlow: false,
        fileName: "file.png",
        isThereFileToUpload: false,
        targetBucket: "media-uploads",
        requests: [
          {
            endpoint: "/api/v1/posts",
            method: "GET",
            lookupKey: "rohan",
            fileName: "file.png",
            isThereFileToUpload: false,
            targetBucket: "media-uploads",
          },
        ],
      } as any;
    case "api-gateway":
      return {
        strategy: "ROUND_ROBIN",
        routes: {
          "/api/v1/posts": "POST_SERVICE",
          "/api/v1/users": "USER_SERVICE",
        },
      };
    case "load-balancer":
      return {
        strategy: "ROUND_ROBIN",
      };
    case "server":
      return {
        capacity: 100,
        tcpConnections: 10,
        endpoints: {
          "api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          "api/v1/users": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          "api/v1/getData": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        },
      };
    case "redis":
      return {
        data: [
          { key: "rohan", val: "cached data for rohan" },
          { key: "john", val: "cached data for john" },
        ],
      };
    case "postgres":
      return {
        table: "users",
        data: [
          { key: "doe", val: "db data for doe" },
          { key: "john", val: "db data for john" },
          { key: "rohan", val: "db data for rohan" },
        ],
      };
    case "storage":
      return {
        buckets: ["media-uploads"],
      };
    default:
      return {};
  }
}

// Inline Markdown Elements Parser
function parseInlineMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.*?)\*\*|`(.*?)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let match;
  let lastIndex = 0;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[1];
    if (fullMatch.startsWith("**")) {
      parts.push(
        <strong
          key={key++}
          className="font-bold text-[color:var(--foreground)]"
        >
          {match[2]}
        </strong>,
      );
    } else if (fullMatch.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="bg-[var(--surface-muted)] text-[0.9em] font-mono px-1 py-0.5 rounded border border-[var(--border)] text-violet-400"
        >
          {match[3]}
        </code>,
      );
    } else if (fullMatch.startsWith("[")) {
      const isExternal = match[5].startsWith("http");
      parts.push(
        <Link
          key={key++}
          href={match[5]}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-violet-400 hover:text-violet-300 underline font-semibold transition-colors duration-150"
        >
          {match[4]}
        </Link>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let codeBuffer: string[] = [];
  let inCodeBlock = false;
  let codeKey = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${codeKey++}`}
            className="my-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 font-mono text-xs text-[color:var(--foreground)]/80 overflow-x-auto whitespace-pre-wrap leading-relaxed"
          >
            {codeBuffer.join("\n")}
          </pre>,
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Table separator row
    if (trimmed.startsWith("|") && trimmed.replace(/[-|:\s]/g, "") === "")
      return;

    // Table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      elements.push(
        <tr key={idx} className="border-b border-[var(--border)]/50">
          {cells.map((cell, ci) => (
            <td
              key={ci}
              className="px-3 py-2 text-xs text-[color:var(--foreground)]/75"
            >
              {parseInlineMarkdown(cell)}
            </td>
          ))}
        </tr>,
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={idx}
          className="text-[0.85em] font-bold uppercase tracking-wider text-violet-400 mt-6 mb-2 font-mono"
        >
          {trimmed.slice(4)}
        </h3>,
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={idx}
          className="text-[1.05em] font-bold uppercase tracking-wider text-[color:var(--foreground)] mt-8 mb-3 border-b border-[var(--border)]/60 pb-2 font-mono"
        >
          {trimmed.slice(3)}
        </h2>,
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={idx}
          className="text-[1.25em] font-extrabold text-[color:var(--foreground)] mt-8 mb-4 tracking-tight"
        >
          {trimmed.slice(2)}
        </h1>,
      );
      return;
    }
    if (trimmed.startsWith("* ")) {
      elements.push(
        <li
          key={idx}
          className="ml-5 list-disc text-[0.92em] text-[color:var(--foreground)]/75 leading-relaxed mb-1.5"
        >
          {parseInlineMarkdown(trimmed.slice(2))}
        </li>,
      );
      return;
    }
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      elements.push(
        <li
          key={idx}
          className="ml-5 list-decimal text-[0.92em] text-[color:var(--foreground)]/75 leading-relaxed mb-1.5"
        >
          {parseInlineMarkdown(numberedMatch[2])}
        </li>,
      );
      return;
    }
    if (trimmed === "---") {
      elements.push(
        <hr key={idx} className="my-6 border-[var(--border)]/60" />,
      );
      return;
    }
    if (trimmed === "") {
      elements.push(<div key={idx} className="h-1.5" />);
      return;
    }
    elements.push(
      <p
        key={idx}
        className="text-[0.92em] text-[color:var(--foreground)]/75 leading-relaxed mb-3"
      >
        {parseInlineMarkdown(line)}
      </p>,
    );
  });

  return elements;
}

export default function LearnTopicPage({ params }: LearnTopicPropsPage) {
  const { topicId } = use(params);

  const [theme, setTheme] = useState<Theme>("dark");

  const [hideResponse, setHideResponse] = useState(false);
  const [parallelResponse, setParallelResponse] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [panelHeight, setPanelHeight] = useState(180);
  const [isDragging, setIsDragging] = useState(false);
  const [docsWidth, setDocsWidth] = useState(520);
  const [isResizingDocs, setIsResizingDocs] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(true);
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});
  const [showDocs, setShowDocs] = useState<boolean>(true);
  const [showCanvas, setShowCanvas] = useState<boolean>(true);

  const topic = useMemo(
    () => LEARN_TOPICS.find((t: LearnTopic) => t.id === topicId) ?? null,
    [topicId],
  );

  const updateNodeConfig = (
    nodeId: string,
    updatedFields: Record<string, any>,
  ) => {
    setNodeConfigs((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...updatedFields,
      },
    }));
  };

  const applyCheckpoint = (cp: Checkpoint) => {
    updateNodeConfig(cp.targetNodeId, cp.configPatch);
    setSelectedNodeId(cp.targetNodeId);
    setFrameIndex(0);
    setIsPlaying(true);

    setNotification(`Applied: ${cp.title}`);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!topic) return;

    const initialBundle = generateFrames(
      {
        hideResponse: false,
        parallelResponse: false,
      },
      topic.scenarioId,
    );

    const initialConfigs: Record<string, any> = {};
    initialBundle.nodes.forEach((n) => {
      const label = typeof n.data?.label === "string" ? n.data.label : n.id;
      const role = getNodeRole(label);
      const defaultConfig = createDefaultConfig(role, n.id, label);

      if (topic.scenarioId === "simple-valet-key") {
        if (role === "client") {
          defaultConfig.requests = [
            { fileName: "avatar-1.png", targetBucket: "media-uploads" },
            { fileName: "invoice-2026.pdf", targetBucket: "media-uploads" },
            { fileName: "portfolio-banner.jpg", targetBucket: "media-uploads" },
          ];
        }
      } else if (topic.scenarioId === "simple-api-gateway") {
        if (role === "client") {
          defaultConfig.requests = [
            { endpoint: "/api/v1/posts/list", lookupKey: "bob", method: "GET" },
            {
              endpoint: "/api/v1/users/profile",
              lookupKey: "john",
              method: "GET",
            },
            {
              endpoint: "/api/v1/posts/list",
              lookupKey: "john",
              method: "GET",
            },
          ];
        } else if (role === "server") {
          if (n.id === "server-1-id") {
            defaultConfig.endpoints = {
              "api/v1/users/profile": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            };
          } else if (n.id === "server-2-id" || n.id === "server-3-id") {
            defaultConfig.endpoints = {
              "api/v1/posts/list": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            };
          }
        }
      } else if (topic.scenarioId === "simple-load-balancer") {
        if (role === "client") {
          defaultConfig.requests = [
            { endpoint: "/api/v1/posts", method: "GET" },
            { endpoint: "/api/v1/posts", method: "GET" },
            { endpoint: "/api/v1/posts", method: "GET" },
          ];
        } else if (role === "server") {
          defaultConfig.endpoints = {
            "api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          };
        }
      } else if (topic.scenarioId === "simple-cache") {
        if (role === "client") {
          defaultConfig.requests = [
            { endpoint: "/api/v1/getData", lookupKey: "rohan", method: "GET" },
            { endpoint: "/api/v1/getData", lookupKey: "john", method: "GET" },
            { endpoint: "/api/v1/getData", lookupKey: "doe", method: "GET" },
          ];
        } else if (role === "server") {
          defaultConfig.endpoints = {
            "api/v1/getData": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          };
        }
      }
      initialConfigs[n.id] = defaultConfig;
    });

    setNodeConfigs(initialConfigs);
  }, [topic]);

  useEffect(() => {
    if (Object.keys(nodeConfigs).length > 0) {
      setFrameIndex(0);
      setIsPlaying(true);
    }
  }, [nodeConfigs]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = document.querySelector(
        "[data-resizable-container]",
      ) as HTMLElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;

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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingDocs) return;

      const minWidth = 320;
      const maxWidth = window.innerWidth * 0.6;

      const newWidth = e.clientX;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setDocsWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingDocs(false);
    };

    if (isResizingDocs) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "auto";
    };
  }, [isResizingDocs]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  useEffect(() => {
    setIsMounted(true);

    // Theme initialization
    const saved = window.localStorage.getItem(
      "flowframe-theme",
    ) as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      setTheme("light");
    }

    // showDocs initialization
    if (window.innerWidth < 1024) {
      setShowDocs(false);
    }
  }, []);

  const { frames, nodes, edges, debug } = useMemo(
    () =>
      isMounted && Object.keys(nodeConfigs).length > 0 && topic
        ? generateFrames(
            {
              hideResponse,
              parallelResponse,
              nodeConfigs,
            },
            topic.scenarioId,
          )
        : {
            frames: [],
            nodes: [],
            edges: [],
          },
    [hideResponse, parallelResponse, topic, isMounted, nodeConfigs],
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

  const accumulatedFrames = useMemo(() => {
    const acc: Frame[] = [];
    for (let i = 0; i <= frameIndex; i++) {
      if (frameGroups[i]) {
        acc.push(...frameGroups[i].frames);
      }
    }
    return acc;
  }, [frameGroups, frameIndex]);

  const redisStoreEntries = Object.entries(debug?.redisStore ?? {});
  const postgresStoreEntries = Object.entries(debug?.postgresStore ?? {});

  const storageStoreForInspector = useMemo(() => {
    const progressiveStore = buildProgressiveStorageStore(
      frameGroups,
      frameIndex,
      debug?.storageInitialStore,
    );

    if (Object.keys(progressiveStore).length > 0) {
      return progressiveStore;
    }

    return debug?.storageStore ?? {};
  }, [
    frameGroups,
    frameIndex,
    debug?.storageInitialStore,
    debug?.storageStore,
  ]);

  const storageStoreEntries = Object.entries(storageStoreForInspector);

  useEffect(() => {
    if (!isPlaying || frameGroups.length === 0) {
      return;
    }

    const baseInterval = 1000;
    const speedAdjustedInterval = baseInterval / speed;
    const timerId = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= frameGroups.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedAdjustedInterval);

    return () => clearInterval(timerId);
  }, [isPlaying, frameGroups.length, speed]);

  useEffect(() => {
    setFrameIndex(0);
  }, [hideResponse, parallelResponse, topic]);

  useEffect(() => {
    if (nodes.length === 0) {
      setSelectedNodeId(null);
      return;
    }

    const hasSelection =
      selectedNodeId && nodes.some((node) => node.id === selectedNodeId);
    if (!hasSelection) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  // System Metrics Hook to analyze simulation health in real-time
  const systemMetrics = useMemo(() => {
    if (frames.length === 0) return null;

    const currentTick = currentFrameGroup?.timestamp ?? 0;
    const requestStats = new Map<
      string,
      {
        start: number;
        end: number;
        label: string;
        key: string;
        isWaiting: boolean;
        hasError: boolean;
        errorMsg?: string;
      }
    >();

    frames.forEach((f) => {
      const existing = requestStats.get(f.requestId);
      const isWait = f.action === "POSTGRES_POOL_WAIT";
      const isError =
        f.action === "POSTGRES_CONNECTION_ERROR" ||
        f.action.includes("REJECT") ||
        f.action.includes("RESPONSE_ERROR");

      if (!existing) {
        requestStats.set(f.requestId, {
          start: f.timestamp,
          end: f.timestamp,
          label: f.requestName || `Req-${f.requestId.slice(0, 4)}`,
          key: f.lookupKey || "",
          isWaiting: isWait,
          hasError: isError,
          errorMsg: isError ? f.payloadSummary : undefined,
        });
      } else {
        existing.end = Math.max(existing.end, f.timestamp);
        if (f.timestamp === currentTick) {
          existing.isWaiting = isWait;
          if (isError) {
            existing.hasError = true;
            existing.errorMsg = f.payloadSummary;
          }
        }
      }
    });

    let activeCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    const queuedRequests: string[] = [];
    const activeRequestsList: string[] = [];
    const errorRequests: string[] = [];

    requestStats.forEach((stats) => {
      if (currentTick >= stats.start && currentTick <= stats.end) {
        activeCount++;
        activeRequestsList.push(
          `${stats.label}${stats.key ? ` (Key: ${stats.key})` : ""}`,
        );

        if (stats.isWaiting) {
          pendingCount++;
          queuedRequests.push(
            `${stats.label}${stats.key ? ` (Key: ${stats.key})` : ""}`,
          );
        }
        if (stats.hasError) {
          errorRequests.push(
            `${stats.label}: ${stats.errorMsg || "Error occurred"}`,
          );
        }
      } else if (currentTick > stats.end) {
        completedCount++;
      }
    });

    return {
      totalRequests: requestStats.size,
      activeCount,
      completedCount,
      pendingCount,
      activeRequestsList,
      queuedRequests,
      errorRequests,
      currentTick,
    };
  }, [frames, currentFrameGroup]);

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const label =
          typeof node.data?.label === "string" ? node.data.label : node.id;
        const role = getNodeRole(label);
        const activeFrames = currentFrames.filter(
          (f) => f.from === node.id || f.to === node.id,
        );
        const isActive = activeFrames.length > 0;

        let status: "normal" | "warning" | "error" = "normal";
        let statusMessage = "";
        let poolInfo: any = null;

        for (const f of activeFrames) {
          const normAction = String(f.action || "").toUpperCase();

          if (role === "postgres") {
            if ((f as any).postgresPoolStatus) {
              poolInfo = (f as any).postgresPoolStatus;
            }
          }

          if (
            normAction.includes("POOL_WAIT") ||
            normAction.includes("CONNECTION_ERROR") ||
            normAction.includes("REJECT") ||
            normAction.includes("RESPONSE_ERROR")
          ) {
            status = "error";
            statusMessage = f.payloadSummary || "High load / error";
          } else if (
            normAction.includes("CACHE_MISS") ||
            normAction.includes("QUERY_MISS")
          ) {
            if (status !== "error") {
              status = "warning";
              statusMessage = normAction.includes("CACHE_MISS")
                ? "Cache Miss"
                : "Database Query Miss";
            }
          }
        }

        // If no active frames on Postgres but poolInfo is not populated, grab latest
        if (role === "postgres" && !poolInfo && currentFrames.length > 0) {
          const poolFrame = currentFrames.find(
            (f) => (f as any).postgresPoolStatus?.serverId,
          );
          if (poolFrame) {
            poolInfo = (poolFrame as any).postgresPoolStatus;
          }
        }

        return {
          ...node,
          type: "customNode",
          selected: isSelected,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          style: undefined,
          data: {
            ...node.data,
            label,
            type: role,
            isActive,
            status,
            statusMessage,
            poolInfo,
          },
        };
      }),
    [nodes, selectedNodeId, currentFrames],
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

    const edgeState = new Map<
      string,
      { reverseMotion: boolean; packetCount: number }
    >();

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
        edgeState.set(resolvedEdgeId, {
          reverseMotion: isReverseMotion,
          packetCount: 1,
        });
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
          isPlaying,
          frameIndex,
        },
        style: {
          ...edge.style,
          stroke: active ? packetColor(reverseMotion) : inactiveStroke,
          strokeWidth: active ? 1.8 : 1.4,
        },
      };
    });
  }, [currentFrames, edges, theme, speed, isPlaying, frameIndex]);

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

  if (!topic) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] text-[color:var(--foreground)]">
        <p className="text-lg">Topic not found.</p>
        <Link href="/learn" className="text-blue-500 underline">
          Back to Academy
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen h-[100dvh] flex flex-col bg-[var(--background)] text-[color:var(--foreground)] overflow-hidden">
      <SiteHeader
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        showHomeLink
        badgeText="Learn Academy"
        alwaysGlass={true}
      />

      {/* Dynamic Toast for Applied Checkpoints */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="absolute top-20 left-1/2 z-50 rounded-xl border border-violet-500/50 bg-slate-950/90 px-4 py-2.5 text-xs text-violet-300 font-mono font-bold flex items-center gap-2 shadow-2xl backdrop-blur"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Split Screen Area */}
      <div
        className="flex-1 flex flex-col lg:flex-row overflow-hidden relative"
        data-resizable-container
      >
        {/* Left Side: Documentation Column */}
        {showDocs && (
          <section
            style={showCanvas ? { width: `${docsWidth}px` } : undefined}
            className={`w-full border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--background)] flex flex-col overflow-hidden relative
            ${
              showCanvas
                ? "h-[calc(100%-48px)] lg:h-auto shrink-0"
                : "flex-1"
            }`}
          >
            {/* Guide Header */}
            <div className="p-3 sm:p-4 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]/20 flex items-start justify-between">
              <div className="min-w-0">
                <Link
                  href="/learn"
                  className="text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-widest font-mono"
                >
                  ← Academy
                </Link>
                <h1 className="text-lg sm:text-xl font-bold text-[color:var(--foreground)] mt-1.5 tracking-tight leading-snug">
                  {topic.title}
                </h1>
                <p className="text-xs sm:text-sm text-[color:var(--foreground)]/55 mt-1 leading-normal">
                  {topic.subtitle}
                </p>
              </div>

              {/* Panel toggle buttons — desktop only */}
              <div className="hidden lg:flex items-center gap-1.5 ml-4 shrink-0">
                {!showCanvas ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocs(true);
                      setShowCanvas(true);
                    }}
                    className="text-[10px] font-bold tracking-wide font-mono px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)] transition cursor-pointer shadow-sm"
                  >
                    Split View
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDocs(false);
                        setInspectorVisible(false);
                      }}
                      className="text-[10px] font-bold tracking-wide font-mono px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-violet-500/10 hover:text-violet-400 text-[color:var(--foreground)]/70 transition cursor-pointer shadow-sm whitespace-nowrap"
                    >
                      Focus Simulator
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCanvas(false)}
                      className="text-[10px] font-bold tracking-wide font-mono px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)] transition cursor-pointer shadow-sm whitespace-nowrap"
                    >
                      Focus Docs
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Guide Content Scroll Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="px-4 sm:px-7 py-4 sm:py-6 max-w-[600px] mx-auto space-y-2">
                {topic.sections.map((section: LearnSection) => (
                  <div key={section.id} className="space-y-3">
                    {renderMarkdown(section.content)}

                    {/* Checkpoints Section */}
                    {section.checkpoints && section.checkpoints.length > 0 && (
                      <div className="mt-4 space-y-2.5">
                        {section.checkpoints.map((cp: Checkpoint) => (
                          <div
                            key={cp.id}
                            onClick={() => applyCheckpoint(cp)}
                            className="cursor-pointer group flex flex-col p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all duration-300 relative shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-violet-400 font-mono group-hover:text-violet-300">
                                {cp.title}
                              </h4>
                              <span className="text-[9px] font-mono uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded group-hover:bg-violet-500/25 group-hover:text-violet-300 transition select-none">
                                Apply
                              </span>
                            </div>
                            <p className="text-[11px] text-[color:var(--foreground)]/60 mt-1 leading-relaxed">
                              {cp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Sandbox CTA — always at the bottom of every guide */}
                <div className="mt-8 pt-6 border-t border-[var(--border)]/60">
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5 text-center space-y-3">
                    <div className="text-2xl">🛠️</div>
                    <div>
                      <p className="text-sm font-bold text-[color:var(--foreground)]">
                        Now Try It Yourself!
                      </p>
                      <p className="text-xs text-[color:var(--foreground)]/55 mt-1 leading-relaxed">
                        Head to the Interactive Sandbox and build this
                        architecture from scratch — drag, drop, connect, and
                        simulate.
                      </p>
                    </div>
                    <a
                      href="/workspace"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      Open Interactive Sandbox
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="11"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
                        />
                        <path
                          fillRule="evenodd"
                          d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
                        />
                      </svg>
                    </a>
                    <p className="text-[10px] text-[color:var(--foreground)]/30 font-mono">
                      Opens in a new tab
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Resizable handle between docs and canvas */}
        {showDocs && showCanvas && (
          <div
            onMouseDown={() => setIsResizingDocs(true)}
            className="hidden lg:block w-[5px] cursor-col-resize hover:bg-violet-500/40 active:bg-violet-500 transition-colors z-30 shrink-0 -mx-[2.5px]"
            title="Drag to resize documentation panel"
          />
        )}

        {/* Floating toggle buttons — desktop only (useless on mobile) */}
        {!showDocs && (
          <button
            type="button"
            onClick={() => setShowDocs(true)}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-b from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-r-2xl border-y border-r border-violet-400/30 px-3 py-5 shadow-2xl hover:translate-x-0.5 transition-all font-bold font-mono text-[11px] cursor-pointer flex-col items-center gap-1.5 select-none"
            style={{ writingMode: "vertical-lr", letterSpacing: "0.1em" }}
          >
            SHOW DOCS
          </button>
        )}

        {!showCanvas && (
          <button
            type="button"
            onClick={() => setShowCanvas(true)}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-b from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-l-2xl border-y border-l border-blue-400/30 px-3 py-5 shadow-2xl hover:-translate-x-0.5 transition-all font-bold font-mono text-[11px] cursor-pointer flex-col items-center gap-1.5 select-none"
            style={{ writingMode: "vertical-lr", letterSpacing: "0.1em" }}
          >
            SHOW CANVAS
          </button>
        )}

        {/* Right Side: Graph Simulator Canvas */}
        {showCanvas && (
          <section className="flex-1 flex flex-col min-h-0 relative">
            {/* Top Bar for Graph Status — desktop only (hidden on mobile to avoid clutter) */}
            <div className="absolute top-3 left-3 z-20 hidden sm:flex gap-2 flex-wrap max-w-[80%]">
              {!showDocs ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowDocs(true);
                    setShowCanvas(true);
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1 text-xs text-[color:var(--foreground)] shadow hover:border-violet-500/40 transition cursor-pointer select-none font-bold font-mono"
                >
                  Split View
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocs(false);
                      setInspectorVisible(false);
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1 text-xs text-[color:var(--foreground)] shadow hover:border-violet-500/40 transition cursor-pointer select-none font-bold font-mono"
                  >
                    Focus Simulator
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCanvas(false)}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1 text-xs text-[color:var(--foreground)] shadow hover:border-blue-500/40 transition cursor-pointer select-none font-bold font-mono"
                  >
                    Focus Docs
                  </button>
                </>
              )}
              <label className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1 text-xs text-[color:var(--foreground)] shadow hover:border-violet-500/40 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideResponse}
                  onChange={() => setHideResponse(!hideResponse)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span>Hide Response</span>
              </label>
              <label className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1 text-xs text-[color:var(--foreground)] shadow hover:border-blue-500/40 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={parallelResponse}
                  onChange={() => setParallelResponse(!parallelResponse)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span>Parallel</span>
              </label>
              <label className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1 text-xs text-[color:var(--foreground)] shadow hover:border-emerald-500/40 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={() => setDebugEnabled(!debugEnabled)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span>Logs</span>
              </label>
            </div>

            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1 text-[11px] font-mono shadow whitespace-nowrap">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-[color:var(--foreground)]/30"}`}
                />
                <span>{isPlaying ? "Running" : "Paused"}</span>
                <span className="text-[color:var(--foreground)]/50 ml-1">
                  {frameIndex + 1}/{frameGroups.length || 0}
                </span>
              </div>
            </div>

            {/* Canvas Wrapper */}
            <div className="flex-1 min-h-0 relative">
              <GraphCanvas
                nodes={styledNodes}
                edges={animatedEdges}
                onNodeSelect={(nodeId) => {
                  setSelectedNodeId(nodeId);
                  setInspectorVisible(true);
                }}
                theme={theme}
                systemMetrics={systemMetrics}
              />

              {/* Inspector Panel — right drawer on desktop, bottom sheet on mobile */}
              {inspectorVisible && selectedNode && (
                <div
                  className="
                  absolute z-20 pointer-events-auto shadow-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl flex flex-col overflow-hidden
                  bottom-0 left-0 right-0 max-h-[50vh] rounded-t-2xl
                  sm:top-12 sm:bottom-3 sm:left-auto sm:right-3 sm:w-80 md:w-96 sm:rounded-2xl sm:max-h-[calc(100%-60px)]
                "
                >
                  <div className="flex justify-between items-center p-2 bg-[var(--surface-muted)] border-b border-[var(--border)] shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--foreground)]/50 font-mono pl-1">
                      {String(selectedNode.data?.label || selectedNode.id)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setInspectorVisible(false)}
                      className="text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <NodeInspectorPanel
                      selectedNode={selectedNode}
                      currentFrames={currentFrames}
                      redisStoreEntries={redisStoreEntries}
                      postgresStoreEntries={postgresStoreEntries}
                      storageStoreEntries={storageStoreEntries}
                      theme={theme}
                      nodeConfigs={nodeConfigs}
                      updateNodeConfig={updateNodeConfig}
                      nodes={nodes}
                      scenarioId={topic.scenarioId}
                    />
                  </div>
                </div>
              )}

              {/* Reopen Inspector Button */}
              {/* {!inspectorVisible && selectedNode && (
                <button
                  type="button"
                  onClick={() => setInspectorVisible(true)}
                  className="absolute bottom-24 right-3 z-20 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-violet-400 font-bold shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer font-mono"
                >
                  Inspect: {String(selectedNode.data?.label || selectedNode.id)}
                </button>
              )} */}
            </div>

            {/* Sticky Timeline / Controls at Bottom - Resizable */}
            <div
              style={{ height: debugEnabled ? `${panelHeight}px` : "auto" }}
              className="border-t border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur flex flex-col overflow-hidden shrink-0 transition-all duration-150"
            >
              {/* Drag Handle */}
              {debugEnabled && (
                <div
                  onMouseDown={() => setIsDragging(true)}
                  className="h-1 w-full cursor-row-resize bg-[var(--border)] hover:bg-violet-500/50 transition-colors shrink-0 mb-1"
                  title="Drag to resize debug panel"
                />
              )}

              <div className="p-3 flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                  <Controls
                    isPlaying={isPlaying}
                    onPlayToggle={() => setIsPlaying(!isPlaying)}
                    onPrev={goToPreviousFrame}
                    onNext={goToNextFrame}
                    onReset={resetPlayback}
                    speed={speed}
                    onSpeedChange={setSpeed}
                    theme={theme}
                  />
                </div>

                <Timeline
                  frameIndex={frameIndex}
                  frameGroups={frameGroups}
                  onSeek={(idx) => {
                    setIsPlaying(false);
                    setFrameIndex(idx);
                  }}
                  theme={theme}
                />

                {debugEnabled && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 p-2.5 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <p className="text-[10px] uppercase tracking-widest text-[color:var(--foreground)]/40 font-bold font-mono mb-2 shrink-0">
                      Console Logs
                    </p>
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                      <DebugPanel
                        currentFrames={accumulatedFrames}
                        theme={theme}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Mobile bottom tab bar: Docs | Sim — only on < lg screens */}
      <div className="lg:hidden shrink-0 flex border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <button
          type="button"
          onClick={() => {
            setShowDocs(true);
            setShowCanvas(false);
          }}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
            showDocs && !showCanvas
              ? "text-violet-400 border-t-2 border-violet-500 bg-violet-500/5"
              : "text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]"
          }`}
        >
          <span className="text-base">&#9776;</span>
          Docs
        </button>
        <div className="w-px bg-[var(--border)]" />
        <button
          type="button"
          onClick={() => {
            setShowDocs(false);
            setShowCanvas(true);
          }}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
            showCanvas && !showDocs
              ? "text-violet-400 border-t-2 border-violet-500 bg-violet-500/5"
              : "text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]"
          }`}
        >
          <span className="text-base">&#9654;</span>
          Simulator
        </button>
      </div>
    </main>
  );
}