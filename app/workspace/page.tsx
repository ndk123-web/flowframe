"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  BaseEdge,
  getSmoothStepPath,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  MarkerType,
  Handle,
  type Node,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import ShortUniqueId from "short-unique-id";

// Engine Core and Models
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import ClientModel from "@/engine/models/Client";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import RedisModel from "@/engine/models/Redis";
import PostgresModel from "@/engine/models/Postgres";
import ApiGatewayModel from "@/engine/models/ApiGateway";
import StorageModel from "@/engine/models/Storage";
import DnsModel from "@/engine/models/Dns";
import CdnModel from "@/engine/models/Cdn";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import Ipv4Generator from "@/utils/generateRandomIp";
import PriorityQueue from "@/engine/core/Simulations/ParallelSimulation";

// Header
import SiteHeader from "@/components/SiteHeader";
import { ComponentIcon } from "@/components/ComponentIcons";

type Theme = "light" | "dark";

// Component categories for the sidebar
type ComponentType =
  | "client"
  | "api-gateway"
  | "load-balancer"
  | "server"
  | "redis"
  | "postgres"
  | "storage"
  | "dns"
  | "cdn";

interface ComponentMetadata {
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
  colorClass: string;
}

const COMPONENTS_LIBRARY: ComponentMetadata[] = [
  {
    type: "client",
    label: "Client",
    icon: "💻",
    description: "Generates requests (GET/POST/uploads) to route through the network.",
    colorClass: "border-l-violet-500 shadow-violet-500/10 text-violet-400",
  },
  {
    type: "dns",
    label: "DNS Server",
    icon: "🌐",
    description: "Resolves domain names (like ndkdev.me) to target node IDs or IP addresses.",
    colorClass: "border-l-indigo-500 shadow-indigo-500/10 text-indigo-400",
  },
  {
    type: "cdn",
    label: "CDN Server",
    icon: "🌍",
    description: "Distributed edge server that caches files near users to speed up asset delivery.",
    colorClass: "border-l-teal-500 shadow-teal-500/10 text-teal-400",
  },
  {
    type: "api-gateway",
    label: "API Gateway",
    icon: "🚪",
    description: "Routes requests to specific services based on path prefixes.",
    colorClass: "border-l-fuchsia-500 shadow-fuchsia-500/10 text-fuchsia-400",
  },
  {
    type: "load-balancer",
    label: "Load Balancer",
    icon: "⚖️",
    description: "Balances traffic across multiple backend servers using Round Robin.",
    colorClass: "border-l-blue-500 shadow-blue-500/10 text-blue-400",
  },
  {
    type: "server",
    label: "Web Server",
    icon: "🖥️",
    description: "Handles HTTP queries, reads/writes cache, and fallbacks to DB.",
    colorClass: "border-l-emerald-500 shadow-emerald-500/10 text-emerald-400",
  },
  {
    type: "redis",
    label: "Redis Cache",
    icon: "💾",
    description: "Fast key-value cache layer prioritizing low-latency retrieval.",
    colorClass: "border-l-amber-500 shadow-amber-500/10 text-amber-400",
  },
  {
    type: "postgres",
    label: "Postgres DB",
    icon: "🗄️",
    description: "Persistent SQL database. Primary storage of system records.",
    colorClass: "border-l-cyan-500 shadow-cyan-500/10 text-cyan-400",
  },
  {
    type: "storage",
    label: "Cloud Storage",
    icon: "☁️",
    description: "Object storage bucket for file uploads using valet key URLs.",
    colorClass: "border-l-yellow-500 shadow-yellow-500/10 text-yellow-400",
  },
];

// Pre-built Architecture templates
const TEMPLATES = {
  loadBalancing: {
    nodes: [
      { id: "client-1", type: "customNode", position: { x: 40, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Client", type: "client" } },
      { id: "lb-1", type: "customNode", position: { x: 260, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Load Balancer", type: "load-balancer" } },
      { id: "server-1", type: "customNode", position: { x: 500, y: 40 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Server 1", type: "server" } },
      { id: "server-2", type: "customNode", position: { x: 500, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Server 2", type: "server" } },
      { id: "server-3", type: "customNode", position: { x: 500, y: 340 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Server 3", type: "server" } },
    ],
    edges: [
      { id: "client-1->lb-1", source: "client-1", target: "lb-1", type: "packet" },
      { id: "lb-1->server-1", source: "lb-1", target: "server-1", type: "packet" },
      { id: "lb-1->server-2", source: "lb-1", target: "server-2", type: "packet" },
      { id: "lb-1->server-3", source: "lb-1", target: "server-3", type: "packet" },
    ]
  },
  cacheAside: {
    nodes: [
      { id: "client-1", type: "customNode", position: { x: 40, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Client", type: "client" } },
      { id: "server-1", type: "customNode", position: { x: 260, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Server", type: "server" } },
      { id: "redis-1", type: "customNode", position: { x: 520, y: 80 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Redis Cache", type: "redis" } },
      { id: "postgres-1", type: "customNode", position: { x: 520, y: 280 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Postgres Database", type: "postgres" } },
    ],
    edges: [
      { id: "client-1->server-1", source: "client-1", target: "server-1", type: "packet" },
      { id: "server-1->redis-1", source: "server-1", target: "redis-1", type: "packet" },
      { id: "server-1->postgres-1", source: "server-1", target: "postgres-1", type: "packet" },
    ]
  },
  valetKey: {
    nodes: [
      { id: "client-1", type: "customNode", position: { x: 40, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Client", type: "client" } },
      { id: "server-1", type: "customNode", position: { x: 300, y: 70 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Upload Server", type: "server" } },
      { id: "storage-1", type: "customNode", position: { x: 300, y: 290 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Cloud Storage", type: "storage" } },
    ],
    edges: [
      { id: "client-1->server-1", source: "client-1", target: "server-1", type: "packet" },
      { id: "client-1->storage-1", source: "client-1", target: "storage-1", type: "packet" },
    ]
  },
  apiGateway: {
    nodes: [
      { id: "client-1", type: "customNode", position: { x: 40, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Client", type: "client" } },
      { id: "gateway-1", type: "customNode", position: { x: 260, y: 190 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "API Gateway", type: "api-gateway" } },
      { id: "server-1", type: "customNode", position: { x: 500, y: 80 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Post Server", type: "server" } },
      { id: "server-2", type: "customNode", position: { x: 500, y: 280 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "User Server", type: "server" } },
    ],
    edges: [
      { id: "client-1->gateway-1", source: "client-1", target: "gateway-1", type: "packet" },
      { id: "gateway-1->server-1", source: "gateway-1", target: "server-1", type: "packet" },
      { id: "gateway-1->server-2", source: "gateway-1", target: "server-2", type: "packet" },
    ]
  }
};

// Default configurations helper
function createDefaultConfig(type: ComponentType, id: string, label: string) {
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
          }
        ]
      };
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
    case "dns":
      return {
        domains: {
          "ndkdev.me": {
            "www": { to: "", ip: "192.168.1.1", typeOfRecord: "A" }
          }
        }
      };
    case "cdn":
      return {
        originId: "",
        cache: [],
      };
    default:
      return {};
  }
}

// React Flow Custom Node
function CustomNode({ id, data, selected }: any) {
  const typeColors: any = {
    client: "border-l-violet-500 shadow-violet-500/10",
    "api-gateway": "border-l-fuchsia-500 shadow-fuchsia-500/10",
    "load-balancer": "border-l-blue-500 shadow-blue-500/10",
    server: "border-l-emerald-500 shadow-emerald-500/10",
    redis: "border-l-amber-500 shadow-amber-500/10",
    postgres: "border-l-cyan-500 shadow-cyan-500/10",
    storage: "border-l-yellow-500 shadow-yellow-500/10",
    dns: "border-l-indigo-500 shadow-indigo-500/10",
    cdn: "border-l-teal-500 shadow-teal-500/10",
  };

  const colorClass = typeColors[data.type] || "border-l-slate-400";

  // Flow rules
  const hasTarget = data.type !== "client";
  const hasSource = data.type !== "redis" && data.type !== "postgres" && data.type !== "storage";

  return (
    <div
      className={`relative rounded-xl border border-[var(--border)] border-l-4 bg-[var(--surface)] px-4 py-3 shadow-md transition-all duration-300 ${colorClass} ${
        selected ? "ring-2 ring-violet-500 scale-105" : "hover:border-[var(--border)]/80"
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
          <p className="text-xs font-bold text-[color:var(--foreground)] truncate max-w-[100px]">{data.label}</p>
        </div>
      </div>

      {data.isActive && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
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

// React Flow Custom Edge
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

  const animateRefs = useRef<Array<any>>([]);

  useEffect(() => {
    if (isActive) {
      animateRefs.current.forEach((ref, index) => {
        if (ref) {
          try {
            if (typeof ref.beginElementAt === "function") {
              ref.beginElementAt(index * 0.12);
            } else if (typeof ref.beginElement === "function") {
              ref.beginElement();
            }
          } catch (e) {
            console.error("Error starting SMIL animation:", e);
          }
        }
      });
    }
  }, [isActive, frameIndex]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeOpacity: isActive ? 0.95 : 0.4,
          transition: "stroke-opacity 150ms ease",
        }}
      />
      {isActive &&
        Array.from({ length: count }).map((_, index) => (
          <circle
            key={`${props.id}-${index}-${edgePath}-${frameIndex}`}
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
              ref={(el) => {
                animateRefs.current[index] = el;
              }}
              dur={`${duration}s`}
              repeatCount={data?.isPlaying ? "1" : "indefinite"}
              fill="freeze"
              begin={`${index * 0.12}s`}
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

// Scenarios Detail Page Components ported for visual consistency
function shouldKeepFrame(hideResponse: boolean, frame: any) {
  if (!hideResponse) {
    return true;
  }

  return !(
    frame.action.includes("SEND_RESPONSE") ||
    frame.action.includes("RETURN_DATA") ||
    frame.action.includes("CACHE_HIT") ||
    frame.action.includes("CACHE_MISS") ||
    frame.action === "RESPONSE_BACKTRACK"
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
  const buttonClass = `rounded-md border ${btnBorder} ${btnBg} px-3 py-1.5 text-xs ${btnText} transition hover:bg-${theme === "dark" ? "slate-900" : "slate-200"} cursor-pointer font-semibold`;

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
            className="w-16 sm:w-20 cursor-pointer accent-violet-500"
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
  frameGroups: Array<{ timestamp: number; frames: any[] }>;
  onSeek: (index: number) => void;
  theme: Theme;
}) {
  const emptyBg = theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300";
  const emptyText = theme === "dark" ? "text-slate-500" : "text-slate-600";
  const inactiveBg = theme === "dark" ? "bg-slate-950 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-300 text-slate-600";
  const inactiveHover = theme === "dark" ? "hover:border-slate-600 hover:bg-slate-900" : "hover:border-slate-400 hover:bg-slate-200";

  if (frameGroups.length === 0) {
    return (
      <div className={`rounded-lg border ${emptyBg} p-2.5`}>
        <p className={`text-xs ${emptyText}`}>No frames available. Run simulation first.</p>
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

      <div className="flex gap-1 overflow-x-auto pb-1 max-h-12 scrollbar-thin">
        {frameGroups.map((group, index) => {
          const isActive = index === frameIndex;

          return (
            <button
              key={`${group.timestamp}-${index}`}
              type="button"
              onClick={() => onSeek(index)}
              className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] transition cursor-pointer font-medium ${
                isActive
                  ? "border-violet-400 bg-violet-500/25 text-violet-100 shadow-inner"
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

function getFormattedLogText(frame: any) {
  const normAction = frame.action.toUpperCase();
  const flow = `${frame.from} ➔ ${frame.to}`;
  
  if (normAction.includes("CACHE_HIT")) {
    return {
      text: `${flow} | Cache HIT - Key: "${frame.lookupKey || 'N/A'}"`,
      type: "success"
    };
  }
  
  if (normAction.includes("CACHE_MISS")) {
    return {
      text: `${flow} | Cache MISS - Key: "${frame.lookupKey || 'N/A'}"`,
      type: "warn"
    };
  }
  
  if (normAction.includes("DB_READ") || normAction.includes("READ_RECORD")) {
    return {
      text: `${flow} | DB Read - Key: "${frame.lookupKey || 'N/A'}"`,
      type: "warn"
    };
  }
  
  if (normAction.includes("DB_WRITE") || normAction.includes("STORE_FILE") || normAction.includes("WRITE_RECORD") || normAction.includes("UPLOAD_SUCCESS")) {
    const payloadStr = frame.payloadSummary && frame.payloadSummary !== "{}" ? ` - Data: ${frame.payloadSummary}` : "";
    return {
      text: `${flow} | DB Write - Key: "${frame.lookupKey || 'N/A'}"${payloadStr}`,
      type: "info"
    };
  }

  if (normAction.includes("RESPONSE_ERROR")) {
    const payloadStr = frame.payloadSummary && frame.payloadSummary !== "{}" ? ` - Payload: ${frame.payloadSummary}` : "";
    let statusText = "404 Not Found";
    if (normAction.includes("_405")) {
      statusText = "405 Method Not Allowed";
    } else if (normAction.includes("_500")) {
      statusText = "500 Internal Server Error";
    }
    return {
      text: `${flow} | Respond - Status: ${statusText}${payloadStr}`,
      type: "warn"
    };
  }

  if (normAction.includes("ENDPOINT_NOT_FOUND")) {
    return {
      text: `${flow} | 404 Not Found - ${frame.payloadSummary || "Endpoint Not Found"}`,
      type: "warn"
    };
  }

  if (normAction.includes("METHOD_NOT_ALLOWED")) {
    return {
      text: `${flow} | 405 Method Not Allowed - ${frame.payloadSummary || "Method Not Allowed"}`,
      type: "warn"
    };
  }

  if (normAction.includes("SEND_RESPONSE") || normAction.includes("RETURN_DATA")) {
    const payloadStr = frame.payloadSummary && frame.payloadSummary !== "{}" ? ` - Payload: ${frame.payloadSummary}` : "";
    return {
      text: `${flow} | Respond - Status: 200 OK${payloadStr}`,
      type: "success"
    };
  }

  if (normAction.includes("SEND_REQUEST") || normAction.includes("ROUTE_REQUEST")) {
    const payloadStr = frame.payloadSummary && frame.payloadSummary !== "{}" ? ` - Payload: ${frame.payloadSummary}` : "";
    return {
      text: `${flow} | Dispatch Request - Action: ${frame.action}${payloadStr}`,
      type: "default"
    };
  }

  const details = [
    frame.lookupKey ? `Key: "${frame.lookupKey}"` : "",
    frame.payloadSummary && frame.payloadSummary !== "{}" ? `Payload: ${frame.payloadSummary}` : ""
  ].filter(Boolean).join(", ");
  
  return {
    text: `${flow} | ${frame.action}${details ? ` (${details})` : ""}`,
    type: "default"
  };
}

function DebugPanel({
  currentFrames,
  frameIndex,
  theme,
}: {
  currentFrames: any[];
  frameIndex: number;
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
    <div ref={containerRef} className="font-mono text-xs space-y-1.5 max-h-40 overflow-y-auto p-1 scroll-smooth">
      {currentFrames.map((frame, idx) => {
        const formatted = getFormattedLogText(frame);
        const colors: Record<string, string> = {
          success: "text-emerald-400",
          info: "text-blue-400",
          warn: "text-amber-400",
          default: "text-[color:var(--foreground)]/80",
        };
        
        return (
          <div key={`${frame.requestId}-${idx}`} className="flex gap-2 items-start text-[11px] leading-relaxed">
            <span className="text-[color:var(--foreground)]/35 select-none">[t={frame.timestamp}]</span>
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

const nodeTypes = {
  customNode: CustomNode,
};

const edgeTypes = {
  packet: PacketEdge,
};

export default function WorkspacePage() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    return saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  // React Flow States
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Node Configurations State
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Playback Simulation States
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);
  
  // Dynamic top-bar configs
  const [hideResponse, setHideResponse] = useState(false);
  const [parallelResponse, setParallelResponse] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);

  // Raw generated simulation frames list
  const [rawSimulationFrames, setRawSimulationFrames] = useState<any[]>([]);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Floating Panel Visibility States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // Redesigned Sidebar Accordions & Search states
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(true);
  const [isComponentsExpanded, setIsComponentsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Movable / Resizable / Mobile sidebar states
  const [isSidebarFloating, setIsSidebarFloating] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState({ x: 16, y: 16 });
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Hover popover states to avoid overflow clip
  const [hoveredComponent, setHoveredComponent] = useState<ComponentMetadata | null>(null);
  const [hoverTooltipX, setHoverTooltipX] = useState(0);
  const [hoverTooltipY, setHoverTooltipY] = useState(0);

  const dragStartOffset = useRef({ x: 0, y: 0 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!isSidebarFloating) return;
    if ((e.target as HTMLElement).closest("button, input, select")) return;

    setIsDraggingSidebar(true);
    dragStartOffset.current = {
      x: e.clientX - sidebarPosition.x,
      y: e.clientY - sidebarPosition.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartOffset.current.x;
      const newY = e.clientY - dragStartOffset.current.y;
      
      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 200;

      setSidebarPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      setSidebarWidth(Math.max(240, Math.min(newWidth, 480)));
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  const filteredComponents = useMemo(() => {
    return COMPONENTS_LIBRARY.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const uid = useMemo(() => new ShortUniqueId({ length: 8 }), []);

  // Build model state mappings & Run Simulation
  const handleStartSimulation = useCallback((
    targetClientId?: string,
    overrideNodes?: Node[],
    overrideEdges?: Edge[],
    overrideConfigs?: Record<string, any>
  ) => {
    const activeNodes = overrideNodes || nodes;
    const activeEdges = overrideEdges || edges;
    const activeConfigs = overrideConfigs || nodeConfigs;

    // 1. Detect Clients
    const clientNodes = activeNodes.filter((n) => n.data.type === "client");
    if (clientNodes.length === 0) {
      setValidationWarning("Please add at least one Client node to the canvas.");
      return;
    }

    const clientToRun = targetClientId
      ? clientNodes.find((n) => n.id === targetClientId)
      : clientNodes[0];

    if (!clientToRun) {
      setValidationWarning("Valid Client not found.");
      return;
    }

    const clientId = clientToRun.id;
    setValidationWarning(null);

    // 2. Initialize simulation components
    const graph = new GraphManager("dynamic-graph");
    const registry = new NodeRegistry("dynamic-registry");
    const ipv4Instance = new Ipv4Generator();
    const rrStrategy = new RoundRobinStrategy();

    // 3. Register nodes
    activeNodes.forEach((n) => {
      const type = n.data.type as ComponentType;
      const labelStr = (n.data.label as string) || "";
      const config = activeConfigs[n.id] || createDefaultConfig(type, n.id, labelStr);

      let modelInstance: any;

      switch (type) {
        case "client":
          modelInstance = new ClientModel(n.id, labelStr);
          break;
        case "load-balancer":
          modelInstance = new LoadBalancerModel(n.id, labelStr, rrStrategy);
          break;
        case "server":
          modelInstance = new ServerModel(n.id, labelStr);
          if (typeof config.capacity === "number") {
            modelInstance.capacity = config.capacity;
          }
          if (config.endpoints) {
            modelInstance.endpoints = { ...config.endpoints };
          }
          break;
        case "redis":
          modelInstance = new RedisModel(n.id, labelStr);
          if (Array.isArray(config.data)) {
            config.data.forEach((item: any) => {
              if (item.key) modelInstance.addData(item.key, item.val);
            });
          }
          break;
        case "postgres":
          modelInstance = new PostgresModel(n.id, labelStr);
          if (Array.isArray(config.data)) {
            config.data.forEach((item: any) => {
              if (item.key) {
                modelInstance.addRecord(config.table || "users", item.key, item.val);
              }
            });
          }
          break;
        case "api-gateway":
          modelInstance = new ApiGatewayModel(n.id, labelStr);
          modelInstance.strategy = config.strategy || "ROUND_ROBIN";
          if (config.routes) {
            modelInstance.setRoutes(config.routes);
          }

          // Dynamic routing node target registration
          const connectedServers = activeEdges
            .filter((e) => {
              const isSourceGateway = e.source === n.id;
              const isTargetGateway = e.target === n.id;
              if (isSourceGateway) {
                const targetNode = activeNodes.find((node) => node.id === e.target);
                return targetNode?.data.type === "server";
              }
              if (isTargetGateway) {
                const sourceNode = activeNodes.find((node) => node.id === e.source);
                return sourceNode?.data.type === "server";
              }
              return false;
            })
            .map((e) => (e.source === n.id ? e.target : e.source));

          const serviceMapping = config.serviceMapping || {};
          const serviceGroups: Record<string, string[]> = {};
          const routesList = config.routes || {};
          const serviceOptions = Array.from(new Set(Object.values(routesList)));

          connectedServers.forEach((serverId) => {
            const serverNode = activeNodes.find((node) => node.id === serverId);
            const serverLabel = String(serverNode?.data.label || serverId);
            let serviceName = serviceMapping[serverId];

            if (!serviceName) {
              const labelLower = serverLabel.toLowerCase();
              if (labelLower.includes("user")) {
                serviceName = "USER_SERVICE";
              } else if (labelLower.includes("post")) {
                serviceName = "POST_SERVICE";
              } else {
                serviceName = serviceOptions[0] || "DEFAULT_SERVICE";
              }
            }

            if (serviceName !== "UNASSIGNED") {
              if (!serviceGroups[serviceName]) {
                serviceGroups[serviceName] = [];
              }
              serviceGroups[serviceName].push(serverId);
            }
          });

          // Register service groups with gateway
          for (const serviceName in serviceGroups) {
            modelInstance.setServiceNodes(serviceName, serviceGroups[serviceName]);
          }
          break;
        case "storage":
          modelInstance = new StorageModel(n.id, labelStr);
          if (Array.isArray(config.buckets)) {
            config.buckets.forEach((b: string) => modelInstance.addBucket(b));
          }
          break;
        case "dns":
          modelInstance = new DnsModel(n.id, labelStr);
          if (config.domains) {
            Object.entries(config.domains).forEach(([domain, subdomains]: [string, any]) => {
              modelInstance.addDomain(domain);
              if (subdomains && typeof subdomains === "object") {
                Object.entries(subdomains).forEach(([sub, subData]: [string, any]) => {
                  if (subData && typeof subData === "object") {
                    modelInstance.addSubDomain(
                      domain,
                      sub,
                      subData.to || "",
                      subData.ip || "",
                      subData.typeOfRecord || "A"
                    );
                  }
                });
              }
            });
          }
          break;
        case "cdn":
          modelInstance = new CdnModel(n.id, labelStr);
          if (config.originId) {
            modelInstance.setOriginId(config.originId);
          }
          if (Array.isArray(config.cache)) {
            config.cache.forEach((item: string) => modelInstance.cacheData(item));
          }
          break;
      }

      if (modelInstance) {
        graph.addNode(n.id, labelStr);
        registry.register(n.id, modelInstance);
      }
    });

    // 4. Register edges
    activeEdges.forEach((edge) => {
      const sourceNode = activeNodes.find((n) => n.id === edge.source);
      const targetNode = activeNodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        graph.addEdge(edge.source, edge.target);
        
        // Bidirectional routing fallback for gateway -> server in graph
        if (sourceNode.data.type === "server" && targetNode.data.type === "api-gateway") {
          graph.addEdge(edge.target, edge.source);
        }
      }
    });

    // 5. Check cycles or validations
    const hasCycle = graph.detectCycle(registry);
    if (hasCycle) {
      setValidationWarning("Warning: Cycle detected in graph! Simulation may behave unexpectedly or hang.");
    }

    // 6. Run sequential request queries
    const clientLabelStr = (clientToRun.data.label as string) || "";
    const clientConfig = activeConfigs[clientId] || createDefaultConfig("client", clientId, clientLabelStr);
    
    const allFrames: any[] = [];
    
    const clientRequests = clientConfig.requests || [
      {
        endpoint: clientConfig.endpoint || "/api/v1/posts",
        method: clientConfig.method || "GET",
        lookupKey: clientConfig.lookupKey || "rohan",
        fileName: clientConfig.fileName || "file.png",
        isThereFileToUpload: clientConfig.isThereFileToUpload !== false,
      }
    ];

    try {
      for (let i = 0; i < clientRequests.length; i++) {
        const sourceIp = ipv4Instance.getRandomIpv4();
        const reqItem = clientRequests[i];

        const payload: any = {
          valetKeyFlow: clientConfig.valetKeyFlow,
          lookupKey: reqItem.lookupKey,
          fileName: reqItem.fileName,
          isThereFileToUpload: reqItem.isThereFileToUpload,
          endpoint: reqItem.endpoint,
          method: reqItem.method || "GET",
          targetBucket: reqItem.targetBucket,
        };

        const simulation = new SimulationManager(graph, registry, payload, sourceIp);
        simulation.runSimulation(clientId);

        const runFrames = (simulation.getFrames() as any[]).map((frame) => ({
          ...frame,
          sourceIp,
          payloadSummary: frame.payloadSummary || `lookupKey=${reqItem.lookupKey}`,
        }));

        allFrames.push({
          runIndex: i,
          frames: runFrames,
        });
      }

      setRawSimulationFrames(allFrames);
      setFrameIndex(0);
      setIsPlaying(true);
    } catch (err: any) {
      setValidationWarning(`Simulation Error: ${err.message || err}`);
    }
  }, [nodes, nodeConfigs, edges]);

  // Quick Load Template
  const loadTemplate = useCallback((templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    
    // Choose connection colors dynamically based on theme (handled in animatedEdges)
    const defaultInactiveStroke = "#475569";

    const templateNodes = template.nodes.map((n) => ({
      ...n,
      style: {
        borderRadius: "8px",
      },
    }));
    setNodes(templateNodes);

    const templateEdges = template.edges.map((e) => ({
      ...e,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: { stroke: defaultInactiveStroke, strokeWidth: 1.8 },
    }));
    setEdges(templateEdges);

    // Seed configurations
    const configs: Record<string, any> = {};
    template.nodes.forEach((n) => {
      const defaultConfig = createDefaultConfig(n.data.type as ComponentType, n.id, n.data.label);
      if (templateKey === "valetKey" && n.data.type === "client") {
        defaultConfig.valetKeyFlow = true;
      }
      configs[n.id] = defaultConfig;
    });
    setNodeConfigs(configs);

    // Stop and Reset playback
    setIsPlaying(false);
    setRawSimulationFrames([]);
    setFrameIndex(0);
    setValidationWarning(null);
    setSelectedNodeId(null);

    // Synchronously start simulation for the loaded template
    handleStartSimulation("client-1", templateNodes, templateEdges, configs);
  }, [setNodes, setEdges, handleStartSimulation]);

  // Open template selection picker modal on load
  useEffect(() => {
    setShowWelcomeModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add Component to Canvas
  const addComponent = (type: ComponentType) => {
    const id = `${type}-${uid.rnd()}`;
    const label = `${COMPONENTS_LIBRARY.find((c) => c.type === type)?.label} ${nodes.filter((n) => n.data.type === type).length + 1}`;

    const newNode: Node = {
      id,
      type: "customNode",
      position: {
        x: 120 + Math.random() * 250,
        y: 80 + Math.random() * 200,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label,
        type,
        isActive: false,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeConfigs((prev) => ({
      ...prev,
      [id]: createDefaultConfig(type, id, label),
    }));
    setSelectedNodeId(id);
  };

  // Connect Edges
  const onConnect = useCallback(
    (connection: any) => {
      const inactiveStrokeColor = theme === "dark" ? "#475569" : "#cbd5e1";
      const newEdge = {
        ...connection,
        id: `${connection.source}->${connection.target}`,
        type: "packet",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
        style: { stroke: inactiveStrokeColor, strokeWidth: 1.8 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, theme]
  );

  // Selected Node Reference
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  // Update Config Helper
  const updateNodeConfig = (nodeId: string, updatedFields: Partial<any>) => {
    setNodeConfigs((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...updatedFields,
      },
    }));
  };

  // Dynamically calculate and sort frames based on parallelResponse and hideResponse states!
  const simulationFrames = useMemo(() => {
    if (rawSimulationFrames.length === 0) return [];

    let globalTimestampOffset = 0;
    const flatFrames: any[] = [];

    rawSimulationFrames.forEach((run) => {
      const runFrames = run.frames.map((frame: any) => ({
        ...frame,
        timestamp: parallelResponse
          ? frame.timestamp
          : frame.timestamp + globalTimestampOffset,
      }));

      flatFrames.push(...runFrames);

      if (!parallelResponse) {
        globalTimestampOffset += run.frames.length;
      }
    });

    // Merge parallel frames if parallel is checked
    const framesToRender = parallelResponse
      ? (() => {
          const pq = new PriorityQueue();
          pq.pushMultipleIntoQueue(flatFrames);

          const merged: any[] = [];
          while (!pq.isEmpty()) {
            const item = pq.popMinTimeStampItem();
            if (item) merged.push(item);
          }
          return merged;
        })()
      : flatFrames.sort((a, b) => a.timestamp - b.timestamp);

    // Filter hide response frames if hideResponse is checked
    return framesToRender.filter((frame) =>
      shouldKeepFrame(hideResponse, frame)
    );
  }, [rawSimulationFrames, parallelResponse, hideResponse]);

  // Group frames by timestamp
  const frameGroups = useMemo(() => {
    const grouped = new Map<number, any[]>();
    for (const frame of simulationFrames) {
      const list = grouped.get(frame.timestamp) ?? [];
      list.push(frame);
      grouped.set(frame.timestamp, list);
    }
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, frames]) => ({ timestamp, frames }));
  }, [simulationFrames]);

  const currentFrameGroup = frameGroups[frameIndex] ?? null;
  const currentFrames = currentFrameGroup?.frames ?? [];

  const accumulatedFrames = useMemo(() => {
    const acc: any[] = [];
    for (let i = 0; i <= frameIndex; i++) {
      if (frameGroups[i]) {
        acc.push(...frameGroups[i].frames);
      }
    }
    return acc;
  }, [frameGroups, frameIndex]);

  // Dynamically calculate storage files at the current frame index!
  const storageFilesByBucket = useMemo(() => {
    const filesMap: Record<string, Record<string, Array<{ name: string; info: any }>>> = {};

    // 1. Initialize empty buckets for all storage nodes
    nodes.forEach((n) => {
      if (n.data.type === "storage") {
        const config = nodeConfigs[n.id] || {};
        const buckets = config.buckets || ["media-uploads"];
        const filesByBucket: Record<string, Array<{ name: string; info: any }>> = {};
        buckets.forEach((b: string) => {
          filesByBucket[b] = [];
        });
        filesMap[n.id] = filesByBucket;
      }
    });

    // 2. Replay all accumulated frames to add files at their actual trigger timestamps
    accumulatedFrames.forEach((frame) => {
      // Find if this frame involves a storage node
      const fromNode = nodes.find((n) => n.id === frame.from);
      const toNode = nodes.find((n) => n.id === frame.to);

      let storageId: string | null = null;
      if (fromNode?.data.type === "storage") {
        storageId = fromNode.id;
      } else if (toNode?.data.type === "storage") {
        storageId = toNode.id;
      }

      if (storageId && frame.storageBucket && frame.storageFileName) {
        const bucketMap = filesMap[storageId];
        if (bucketMap) {
          // Ensure the bucket list exists
          if (!bucketMap[frame.storageBucket]) {
            bucketMap[frame.storageBucket] = [];
          }

          // Check if file is already added in this bucket for this storage node
          const fileExists = bucketMap[frame.storageBucket].some(
            (f) => f.name === frame.storageFileName
          );

          if (!fileExists) {
            bucketMap[frame.storageBucket].push({
              name: frame.storageFileName,
              info: {
                sourceIp: frame.sourceIp,
                requestId: frame.requestId,
              },
            });
          }
        }
      }
    });

    return filesMap;
  }, [nodes, nodeConfigs, accumulatedFrames]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || frameGroups.length === 0) return;

    const baseInterval = 1000;
    const interval = baseInterval / speed;

    const timerId = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= frameGroups.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timerId);
  }, [isPlaying, frameGroups.length, speed]);

  // Reset frame index if filters change
  useEffect(() => {
    setFrameIndex(0);
  }, [hideResponse, parallelResponse]);

  // Node highlight style mapping
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      const isActive = currentFrames.some((f) => f.from === node.id || f.to === node.id);

      return {
        ...node,
        type: "customNode",
        selected: isSelected,
        style: undefined,
        data: {
          ...node.data,
          isActive,
        },
      };
    });
  }, [nodes, selectedNodeId, currentFrames]);

  // Edge animation speed and high visibility theme-based styling
  const animatedEdges = useMemo(() => {
    const inactiveStroke = theme === "dark" ? "#475569" : "#cbd5e1";

    if (currentFrames.length === 0) {
      return edges.map((edge) => ({
        ...edge,
        style: {
          stroke: inactiveStroke,
          strokeWidth: 1.8,
        },
        data: { active: false },
      }));
    }

    const edgeState = new Map<string, { reverseMotion: boolean; packetCount: number }>();

    for (const frame of currentFrames) {
      const directEdgeId = `${frame.from}->${frame.to}`;
      const reverseEdgeId = `${frame.to}->${frame.from}`;
      const hasDirectEdge = edges.some((e) => e.id === directEdgeId);
      const hasReverseEdge = edges.some((e) => e.id === reverseEdgeId);

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
      const speedAdjustedDuration = active ? 1.0 / speed : 1.8 / speed;

      return {
        ...edge,
        data: {
          active,
          reverseMotion,
          packetCount: edgeState.get(edge.id)?.packetCount ?? 1,
          packetDuration: speedAdjustedDuration,
          isPlaying,
          frameIndex,
        },
        style: {
          stroke: active ? packetColor(reverseMotion) : inactiveStroke,
          strokeWidth: active ? 2.5 : 1.8,
        },
      };
    });
  }, [currentFrames, edges, theme, speed, isPlaying, frameIndex]);

  // Click handler to run client node directly
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedNodeId(node.id);
      if (node.data.type === "client") {
        handleStartSimulation(node.id);
      }
    },
    [handleStartSimulation]
  );

  // Playback control helpers
  const goToPreviousFrame = () => {
    setIsPlaying(false);
    setFrameIndex((prev) =>
      frameGroups.length === 0
        ? 0
        : prev === 0
          ? frameGroups.length - 1
          : prev - 1
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

  // Keyboard controls listener
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

  // Clear Canvas handler
  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setNodeConfigs({});
    setSelectedNodeId(null);
    setRawSimulationFrames([]);
    setFrameIndex(0);
    setIsPlaying(false);
    setValidationWarning(null);
  };

  return (
    <main className="relative min-h-screen h-screen overflow-hidden flex flex-col bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-35" />

      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        showHomeLink
        badgeText="Interactive Sandbox Workspace"
        hideSandboxLink={true}
        alwaysGlass={true}
      />

      {/* Modern Full-Screen Canvas Workspace with Side-by-Side Shapes Sidebar */}
      <div className="flex-1 w-full min-h-0 flex flex-row relative overflow-hidden" data-resizable-container>

        {/* Draw.io / Miro-Style Left Shapes Sidebar */}
        <aside
          className={`flex flex-col z-10 shrink-0 h-full overflow-hidden transition-all duration-300 relative border-r border-[var(--border)] bg-[var(--surface)] ${
            isSidebarFloating 
              ? "absolute rounded-2xl shadow-2xl border" 
              : "relative"
          } ${
            "max-md:fixed max-md:top-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:h-full max-md:shadow-2xl max-md:transition-transform max-md:duration-300"
          } ${
            isSidebarOpenMobile ? "max-md:translate-x-0" : "max-md:-translate-x-full"
          }`}
          style={{
            width: isSidebarFloating ? 288 : sidebarWidth,
            left: isSidebarFloating ? sidebarPosition.x : undefined,
            top: isSidebarFloating ? sidebarPosition.y : undefined,
            height: isSidebarFloating ? "calc(100vh - 160px)" : "100%",
          }}
        >
          {/* Resize Handle (only active in docked mode on desktop) */}
          {!isSidebarFloating && (
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-violet-500/30 cursor-col-resize transition-all z-20 max-md:hidden"
            />
          )}

          {/* Sidebar Title & Search Shape */}
          <div 
            className={`p-3 border-b border-[var(--border)] flex flex-col gap-2 shrink-0 bg-[var(--surface)] ${
              isSidebarFloating ? "cursor-grab active:cursor-grabbing select-none" : ""
            }`}
            onMouseDown={handleHeaderMouseDown}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--foreground)]/70">Shape Library</h2>
              <div className="flex items-center gap-1.5">
                {/* Dock / Float Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSidebarFloating(!isSidebarFloating)}
                  className="rounded hover:bg-[var(--surface-muted)] text-[10px] px-1.5 py-0.5 border border-[var(--border)] font-semibold text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] transition cursor-pointer"
                  title={isSidebarFloating ? "Dock Sidebar" : "Float Sidebar"}
                >
                  {isSidebarFloating ? "📌 Dock" : "✈️ Float"}
                </button>
                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpenMobile(false)}
                  className="md:hidden rounded-full hover:bg-[var(--surface-muted)] text-xs font-bold h-6 w-6 flex items-center justify-center border border-[var(--border)] text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] cursor-pointer"
                  title="Close Sidebar"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-xs text-[color:var(--foreground)]/40">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type / to search shapes..."
                className="w-full pl-8 pr-7 py-1.5 bg-[var(--surface-muted)]/70 hover:bg-[var(--surface-muted)] focus:bg-[var(--surface)] text-xs text-[color:var(--foreground)] placeholder-[color:var(--foreground)]/40 border border-[var(--border)] rounded-lg outline-none focus:border-violet-500/80 transition-all duration-150"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)] font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Accordion Lists */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
            
            {/* 1. Templates Section */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsTemplatesExpanded(!isTemplatesExpanded)}
                className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--surface-muted)] transition duration-150 text-left font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] text-[color:var(--foreground)]/60 transform transition-transform duration-200 ${isTemplatesExpanded ? "rotate-90" : "rotate-0"}`}>
                    ▶
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/70">
                    Templates
                  </span>
                </div>
                <span className="text-[9px] text-[color:var(--foreground)]/40 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-mono">
                  4
                </span>
              </button>

              {isTemplatesExpanded && (
                <div className="grid grid-cols-2 gap-2 p-1">
                  {Object.entries({
                    cacheAside: { label: "Cache Aside", icon: "💾", description: "Write/read path caching strategy prioritizing low latency using Redis Cache and Postgres DB.", color: "hover:border-violet-500/40 text-violet-400" },
                    loadBalancing: { label: "Load Balancer", icon: "⚖️", description: "Distribute client requests across multiple backend web server nodes using Round Robin routing.", color: "hover:border-blue-500/40 text-blue-400" },
                    valetKey: { label: "Valet Key", icon: "🔑", description: "Clients fetch secure signed URLs from server, then upload files directly to Cloud Storage.", color: "hover:border-yellow-500/40 text-yellow-400" },
                    apiGateway: { label: "API Gateway", icon: "🚪", description: "Central entry point routes requests dynamically to Post or User services based on path prefixes.", color: "hover:border-fuchsia-500/40 text-fuchsia-400" },
                  }).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => loadTemplate(key as any)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredComponent({
                          type: key as any,
                          label: value.label,
                          icon: value.icon,
                          description: value.description,
                          colorClass: "",
                        });
                        setHoverTooltipX(rect.right + 12);
                        setHoverTooltipY(rect.top + rect.height / 2);
                      }}
                      onMouseLeave={() => setHoveredComponent(null)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/40 ${value.color} hover:bg-[var(--surface)]/80 transition duration-150 text-center cursor-pointer group shadow-sm`}
                    >
                      <span className="text-xl group-hover:scale-110 transition duration-150">{value.icon}</span>
                      <span className="text-[9px] font-bold text-[color:var(--foreground)]/65 mt-1 truncate max-w-full">
                        {value.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-[var(--border)]/40" />

            {/* 2. Components Section */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsComponentsExpanded(!isComponentsExpanded)}
                className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--surface-muted)] transition duration-150 text-left font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] text-[color:var(--foreground)]/60 transform transition-transform duration-200 ${isComponentsExpanded ? "rotate-90" : "rotate-0"}`}>
                    ▶
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/70">
                    Shapes & Components
                  </span>
                </div>
                <span className="text-[9px] text-[color:var(--foreground)]/40 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-mono">
                  {filteredComponents.length}
                </span>
              </button>

              {isComponentsExpanded && (
                <div className="grid grid-cols-3 gap-2 p-1">
                  {filteredComponents.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addComponent(item.type)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredComponent(item);
                        setHoverTooltipX(rect.right + 12);
                        setHoverTooltipY(rect.top + rect.height / 2);
                      }}
                      onMouseLeave={() => setHoveredComponent(null)}
                      className="aspect-square rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 hover:bg-[var(--surface)] hover:border-violet-500/50 flex flex-col items-center justify-center transition duration-150 cursor-pointer group relative shadow-sm"
                    >
                      <ComponentIcon type={item.type} className="w-6 h-6 group-hover:scale-110 transition duration-150 text-[color:var(--foreground)]/65 group-hover:text-violet-400" />
                      <span className="text-[8px] font-bold text-[color:var(--foreground)]/50 mt-1 truncate max-w-full px-1">
                        {item.label}
                      </span>
                    </button>
                  ))}
                  {filteredComponents.length === 0 && (
                    <div className="col-span-3 text-center py-6 text-xs text-[color:var(--foreground)]/40">
                      No matching components
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Footer Controls */}
          <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]/45 flex flex-col gap-2 shrink-0 bg-[var(--surface)]">
            <button
              type="button"
              onClick={() => setShowWelcomeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/85 hover:bg-[var(--surface-muted)] text-[11px] font-semibold text-[color:var(--foreground)]/75 transition cursor-pointer"
            >
              <span>📁</span>
              <span>Open Templates Picker</span>
            </button>
            <button
              type="button"
              onClick={handleClearCanvas}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/40 text-rose-500 dark:text-rose-400 text-[11px] font-semibold transition cursor-pointer"
            >
              <span>🗑️</span>
              <span>Clear Canvas</span>
            </button>
          </div>
        </aside>

        {/* Right Canvas Area (Fills the rest of screen) */}
        <div className="flex-1 h-full min-w-0 relative z-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpenMobile(true)}
            className="md:hidden absolute top-4 left-4 z-20 bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded-xl shadow-lg hover:bg-[var(--surface-muted)] cursor-pointer flex items-center justify-center text-sm font-bold"
            title="Open Shapes Library"
          >
            ☰
          </button>
          {/* Full-Screen React Flow Canvas */}
          <div className="absolute inset-0 z-0 h-full w-full">
            <ReactFlow
              nodes={styledNodes}
              edges={animatedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              style={{ width: "100%", height: "100%" }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={0.7} color="rgba(148,163,184,0.15)" />
            </ReactFlow>
          </div>

          {/* Floating Warning Message */}
          {validationWarning && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 backdrop-blur-xl px-4 py-3 text-xs text-amber-300 flex items-center justify-between shadow-lg">
                <span>⚠️ {validationWarning}</span>
                <button onClick={() => setValidationWarning(null)} className="text-amber-400 font-bold ml-2 text-base hover:text-amber-300">×</button>
              </div>
            </div>
          )}

        {/* Floating Inspector Panel (Right Column) */}
        {selectedNode && (
          <aside className="absolute md:top-4 md:right-4 md:bottom-auto md:left-auto max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:rounded-t-3xl max-md:rounded-b-none max-md:max-h-[50vh] z-20 w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl shadow-2xl flex flex-col max-h-[calc(100vh-160px)] transition-all duration-300 overflow-y-auto scrollbar-thin">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]/50">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-[color:var(--foreground)]">Node Inspector</h2>
                <p className="text-[10px] text-[color:var(--foreground)]/50">Configure component settings.</p>
              </div>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="text-xs text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] h-6 w-6 rounded-full hover:bg-[var(--surface-muted)] flex items-center justify-center font-bold transition cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-4 flex-1 space-y-4">
              {/* Rename Node section */}
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                  Label / Component Name
                </label>
                <input
                  type="text"
                  value={(selectedNode.data.label as string) || ""}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, label: nextVal } } : n))
                    );
                  }}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[color:var(--foreground)] outline-none focus:border-violet-500 transition"
                />
              </div>

              <div className="h-px bg-[var(--border)]/70" />

              {/* Client specific configuration */}
              {selectedNode.data.type === "client" && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-violet-400 font-mono">Client Settings</p>
                  
                  <label className="flex items-center gap-2 text-xs text-[color:var(--foreground)]/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfigs[selectedNode.id]?.valetKeyFlow ?? false}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { valetKeyFlow: e.target.checked })}
                      className="accent-violet-500 cursor-pointer"
                    />
                    <span>Valet Key Flow</span>
                  </label>

                  <div className="h-px bg-[var(--border)]/70" />

                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                      Simulated Requests
                    </label>
                    
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {(nodeConfigs[selectedNode.id]?.requests || [
                        {
                          endpoint: nodeConfigs[selectedNode.id]?.endpoint || "/api/v1/posts",
                          method: nodeConfigs[selectedNode.id]?.method || "GET",
                          lookupKey: nodeConfigs[selectedNode.id]?.lookupKey || "rohan",
                          fileName: nodeConfigs[selectedNode.id]?.fileName || "file.png",
                          isThereFileToUpload: nodeConfigs[selectedNode.id]?.isThereFileToUpload !== false,
                        }
                      ]).map((req: any, idx: number) => (
                        <div key={idx} className="border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]/50 space-y-1.5 relative group/req">
                          <button
                            onClick={() => {
                              const currentRequests = nodeConfigs[selectedNode.id]?.requests || [
                                {
                                  endpoint: nodeConfigs[selectedNode.id]?.endpoint || "/api/v1/posts",
                                  method: nodeConfigs[selectedNode.id]?.method || "GET",
                                  lookupKey: nodeConfigs[selectedNode.id]?.lookupKey || "rohan",
                                  fileName: nodeConfigs[selectedNode.id]?.fileName || "file.png",
                                  isThereFileToUpload: nodeConfigs[selectedNode.id]?.isThereFileToUpload !== false,
                                }
                              ];
                              if (currentRequests.length <= 1) return;
                              const nextRequests = currentRequests.filter((_: any, i: number) => i !== idx);
                              updateNodeConfig(selectedNode.id, { requests: nextRequests });
                            }}
                            className="absolute top-1 right-1 text-rose-500 hover:text-rose-600 text-xs font-bold px-1 cursor-pointer opacity-40 group-hover/req:opacity-100 transition"
                            title="Delete Request"
                          >
                            ×
                          </button>

                          <p className="text-[9px] font-bold text-violet-400">Request #{idx + 1}</p>

                          {!nodeConfigs[selectedNode.id]?.valetKeyFlow ? (
                            <div className="space-y-1.5">
                              <div className="flex gap-1.5">
                                <div className="w-[70px] shrink-0">
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">Method</label>
                                  <select
                                    value={req.method || "GET"}
                                    onChange={(e) => {
                                      const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                      currentRequests[idx].method = e.target.value;
                                      updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-xs font-mono outline-none focus:border-violet-500 cursor-pointer"
                                  >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                    <option value="PATCH">PATCH</option>
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">Path</label>
                                  <input
                                    type="text"
                                    value={req.endpoint}
                                    onChange={(e) => {
                                      const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                      currentRequests[idx].endpoint = e.target.value;
                                      updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[8px] text-[color:var(--foreground)]/50 block">Key</label>
                                <input
                                  type="text"
                                  value={req.lookupKey}
                                  onChange={(e) => {
                                    const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                    currentRequests[idx].lookupKey = e.target.value;
                                    updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                  }}
                                  className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">Upload File</label>
                                  <input
                                    type="text"
                                    value={req.fileName}
                                    onChange={(e) => {
                                      const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                      currentRequests[idx].fileName = e.target.value;
                                      updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">Target Bucket</label>
                                  <input
                                    type="text"
                                    value={req.targetBucket || "media-uploads"}
                                    onChange={(e) => {
                                      const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                      currentRequests[idx].targetBucket = e.target.value;
                                      updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500"
                                    placeholder="media-uploads"
                                  />
                                </div>
                              </div>
                              <label className="flex items-center gap-1 text-[9px] text-[color:var(--foreground)]/80 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={req.isThereFileToUpload}
                                  onChange={(e) => {
                                    const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                    currentRequests[idx].isThereFileToUpload = e.target.checked;
                                    updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                  }}
                                  className="accent-violet-500"
                                />
                                <span>Attach File Payload</span>
                              </label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const currentRequests = nodeConfigs[selectedNode.id]?.requests || [
                          {
                            endpoint: nodeConfigs[selectedNode.id]?.endpoint || "/api/v1/posts",
                            lookupKey: nodeConfigs[selectedNode.id]?.lookupKey || "rohan",
                            fileName: nodeConfigs[selectedNode.id]?.fileName || "file.png",
                            isThereFileToUpload: nodeConfigs[selectedNode.id]?.isThereFileToUpload !== false,
                            targetBucket: nodeConfigs[selectedNode.id]?.targetBucket || "media-uploads",
                          }
                        ];
                        const nextRequests = [
                          ...currentRequests,
                          {
                            endpoint: "/api/v1/posts",
                            lookupKey: `key-${currentRequests.length + 1}`,
                            fileName: `file-${currentRequests.length + 1}.png`,
                            isThereFileToUpload: true,
                            targetBucket: "media-uploads",
                          }
                        ];
                        updateNodeConfig(selectedNode.id, { requests: nextRequests });
                      }}
                      className="w-full mt-2 rounded-lg border border-[var(--border)] py-1 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                    >
                      + Add Request
                    </button>
                  </div>
                </div>
              )}

              {/* API Gateway Configuration */}
              {selectedNode.data.type === "api-gateway" && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-fuchsia-400 font-mono">Gateway Settings</p>
                  
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">Load Balance Strategy</label>
                    <select
                      value={nodeConfigs[selectedNode.id]?.strategy ?? "ROUND_ROBIN"}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { strategy: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="ROUND_ROBIN">Round Robin</option>
                      <option value="RANDOM">Random Dispatch</option>
                      <option value="IP_HASH">IP Address Hash</option>
                      <option value="LEAST_CONNECTIONS">Least Connections</option>
                    </select>
                  </div>

                  <div className="h-px bg-[var(--border)]/70" />

                  {/* Route Mappings */}
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                      Route Rules
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {Object.entries(nodeConfigs[selectedNode.id]?.routes || {}).map(([path, svc]: [string, any], idx) => (
                        <div key={idx} className="flex gap-1 items-center">
                          <input
                            type="text"
                            value={path}
                            placeholder="Path prefix"
                            onChange={(e) => {
                              const routes = (nodeConfigs[selectedNode.id]?.routes || {}) as Record<string, string>;
                              const nextRoutes: Record<string, string> = {};
                              for (const [k, v] of Object.entries(routes)) {
                                if (k === path) {
                                  nextRoutes[e.target.value] = svc as string;
                                } else {
                                  nextRoutes[k] = v;
                                }
                              }
                              updateNodeConfig(selectedNode.id, { routes: nextRoutes });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                          />
                          <input
                            type="text"
                            value={svc}
                            placeholder="Service name"
                            onChange={(e) => {
                              const nextRoutes = { ...(nodeConfigs[selectedNode.id]?.routes || {}) };
                              nextRoutes[path] = e.target.value;
                              updateNodeConfig(selectedNode.id, { routes: nextRoutes });
                            }}
                            className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                          />
                          <button
                            onClick={() => {
                              const nextRoutes = { ...(nodeConfigs[selectedNode.id]?.routes || {}) };
                              delete nextRoutes[path];
                              updateNodeConfig(selectedNode.id, { routes: nextRoutes });
                            }}
                            className="text-rose-500 hover:text-rose-600 text-xs px-1 cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const routes = nodeConfigs[selectedNode.id]?.routes || {};
                        const nextRoutes = {
                          ...routes,
                          [`/api/v1/route-${Object.keys(routes).length + 1}`]: `NEW_SERVICE`,
                        };
                        updateNodeConfig(selectedNode.id, { routes: nextRoutes });
                      }}
                      className="w-full mt-2 rounded-lg border border-[var(--border)] py-1 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                    >
                      + Add Route Rule
                    </button>
                  </div>

                  <div className="h-px bg-[var(--border)]/70" />

                  {/* Service Pools Mapping */}
                  {(() => {
                    const allServers = nodes.filter((n) => n.data.type === "server");

                    if (allServers.length === 0) {
                      return (
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                            Service Pools Mapping
                          </label>
                          <p className="text-[10px] text-[color:var(--foreground)]/50 italic">
                            No servers on the canvas. Add a Server first.
                          </p>
                        </div>
                      );
                    }

                    const routes = nodeConfigs[selectedNode.id]?.routes || {};
                    const serviceOptions = Array.from(new Set(Object.values(routes)));

                    return (
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block">
                          Service Pools Mapping
                        </label>
                        <div className="space-y-2 border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]/50">
                          {allServers.map((serverNode) => {
                            const serverId = serverNode.id;
                            const serverLabel = String(serverNode.data.label || serverId);
                            const serviceMapping = nodeConfigs[selectedNode.id]?.serviceMapping || {};
                            
                            const isConnectedCorrectly = edges.some((e) => e.source === selectedNode.id && e.target === serverId);
                            const isConnectedBackwards = edges.some((e) => e.source === serverId && e.target === selectedNode.id);
                            const isConnected = isConnectedCorrectly || isConnectedBackwards;

                            let currentVal = serviceMapping[serverId];
                            if (!currentVal) {
                              const labelLower = serverLabel.toLowerCase();
                              if (labelLower.includes("user")) {
                                currentVal = "USER_SERVICE";
                              } else if (labelLower.includes("post")) {
                                currentVal = "POST_SERVICE";
                              } else {
                                currentVal = serviceOptions[0] || "DEFAULT_SERVICE";
                              }
                            }

                            return (
                              <div key={serverId} className="flex flex-col gap-1 border-b border-[var(--border)]/35 pb-2 last:border-b-0 last:pb-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-medium text-[color:var(--foreground)]/70 truncate flex items-center gap-1.5">
                                    <ComponentIcon type="server" className="w-3.5 h-3.5" />
                                    {serverLabel}
                                  </span>
                                  {!isConnected && (
                                    <span className="text-[8px] text-amber-500 font-semibold bg-amber-500/10 px-1 rounded">
                                      ⚠️ Unlinked
                                    </span>
                                  )}
                                  {isConnectedBackwards && (
                                    <span className="text-[8px] text-rose-500 font-semibold bg-rose-500/10 px-1 rounded animate-pulse">
                                      ⚠️ Reverse
                                    </span>
                                  )}
                                  {isConnectedCorrectly && (
                                    <span className="text-[8px] text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded">
                                      ✓ Linked
                                    </span>
                                  )}
                                </div>
                                <select
                                  value={currentVal}
                                  onChange={(e) => {
                                    const nextMapping = {
                                      ...(nodeConfigs[selectedNode.id]?.serviceMapping || {}),
                                      [serverId]: e.target.value,
                                    };
                                    updateNodeConfig(selectedNode.id, { serviceMapping: nextMapping });
                                  }}
                                  className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-xs outline-none focus:border-violet-500 cursor-pointer"
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
                    );
                  })()}
                </div>
              )}

              {/* Redis Configuration */}
              {selectedNode.data.type === "redis" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-amber-400 font-mono">Redis Cache Memory</p>
                  
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-[color:var(--foreground)]/65">Cached Pairs</p>
                    {(!nodeConfigs[selectedNode.id]?.data || nodeConfigs[selectedNode.id].data.length === 0) ? (
                      <p className="text-xs italic text-[color:var(--foreground)]/50">No keys stored.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                        {nodeConfigs[selectedNode.id].data.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={item.key}
                              placeholder="Key"
                              onChange={(e) => {
                                  const nextList = [...nodeConfigs[selectedNode.id].data];
                                  nextList[idx].key = e.target.value;
                                  updateNodeConfig(selectedNode.id, { data: nextList });
                                }}
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={item.val}
                              placeholder="Value"
                              onChange={(e) => {
                                  const nextList = [...nodeConfigs[selectedNode.id].data];
                                  nextList[idx].val = e.target.value;
                                  updateNodeConfig(selectedNode.id, { data: nextList });
                                }}
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none"
                            />
                            <button
                              onClick={() => {
                                  const nextList = nodeConfigs[selectedNode.id].data.filter((_: any, i: number) => i !== idx);
                                  updateNodeConfig(selectedNode.id, { data: nextList });
                                }}
                              className="text-red-500 hover:text-red-600 text-xs px-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      const prevList = nodeConfigs[selectedNode.id]?.data ?? [];
                      updateNodeConfig(selectedNode.id, { data: [...prevList, { key: "", val: "" }] });
                    }}
                    className="w-full rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                  >
                    + Add Cache Key
                  </button>
                </div>
              )}

              {/* Postgres Configuration */}
              {selectedNode.data.type === "postgres" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-cyan-400 font-mono">Database Records</p>
                  
                  <div>
                    <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">Table Name</label>
                    <input
                      type="text"
                      value={nodeConfigs[selectedNode.id]?.table ?? "users"}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { table: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] text-[color:var(--foreground)]/65">Row Entries (ID / Payload)</p>
                    {(!nodeConfigs[selectedNode.id]?.data || nodeConfigs[selectedNode.id].data.length === 0) ? (
                      <p className="text-xs italic text-[color:var(--foreground)]/50">No records found.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                        {nodeConfigs[selectedNode.id].data.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={item.key}
                              placeholder="PK"
                              onChange={(e) => {
                                const nextList = [...nodeConfigs[selectedNode.id].data];
                                nextList[idx].key = e.target.value;
                                updateNodeConfig(selectedNode.id, { data: nextList });
                              }}
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={item.val}
                              placeholder="Summary"
                              onChange={(e) => {
                                  const nextList = [...nodeConfigs[selectedNode.id].data];
                                  nextList[idx].val = e.target.value;
                                  updateNodeConfig(selectedNode.id, { data: nextList });
                                }}
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none"
                            />
                            <button
                              onClick={() => {
                                  const nextList = nodeConfigs[selectedNode.id].data.filter((_: any, i: number) => i !== idx);
                                  updateNodeConfig(selectedNode.id, { data: nextList });
                                }}
                              className="text-red-500 hover:text-red-600 text-xs px-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      const prevList = nodeConfigs[selectedNode.id]?.data ?? [];
                      updateNodeConfig(selectedNode.id, { data: [...prevList, { key: "", val: "" }] });
                    }}
                    className="w-full rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                  >
                    + Add DB Row
                  </button>
                </div>
              )}

              {/* DNS Configuration */}
              {selectedNode.data.type === "dns" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-indigo-400 font-mono">DNS Domain Rules</p>
                    <button
                      type="button"
                      onClick={() => {
                        const domains = nodeConfigs[selectedNode.id]?.domains || {};
                        const newDomain = prompt("Enter domain name (e.g., ndkdev.me):");
                        if (newDomain) {
                          updateNodeConfig(selectedNode.id, {
                            domains: {
                              ...domains,
                              [newDomain]: {},
                            },
                          });
                        }
                      }}
                      className="rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                    >
                      + Add Domain
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                    {Object.entries(nodeConfigs[selectedNode.id]?.domains || {}).map(([domain, subdomains]: [string, any], domIdx) => (
                      <div key={domIdx} className="border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]/50 space-y-2 relative group/dom">
                        <button
                          type="button"
                          onClick={() => {
                            const nextDomains = { ...nodeConfigs[selectedNode.id].domains };
                            delete nextDomains[domain];
                            updateNodeConfig(selectedNode.id, { domains: nextDomains });
                          }}
                          className="absolute top-1.5 right-2 text-rose-500 hover:text-rose-600 text-[9px] font-bold cursor-pointer opacity-40 group-hover/dom:opacity-100 transition"
                          title="Delete Domain"
                        >
                          Delete ×
                        </button>

                        <p className="text-[10px] font-bold text-indigo-400 font-mono">🌐 {domain}</p>

                        <div className="space-y-2 pl-1.5 border-l border-[var(--border)]">
                          {Object.entries(subdomains || {}).map(([sub, subData]: [string, any], subIdx) => (
                            <div key={subIdx} className="bg-[var(--surface)] p-2 rounded border border-[var(--border)]/45 space-y-1.5 relative group/sub">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextDomains = { ...nodeConfigs[selectedNode.id].domains };
                                  const nextSubs = { ...nextDomains[domain] };
                                  delete nextSubs[sub];
                                  nextDomains[domain] = nextSubs;
                                  updateNodeConfig(selectedNode.id, { domains: nextDomains });
                                }}
                                className="absolute top-1 right-1 text-rose-500 hover:text-rose-600 text-xs font-bold cursor-pointer opacity-30 group-hover/sub:opacity-100 transition"
                                title="Delete Record"
                              >
                                ×
                              </button>

                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">Subdomain</label>
                                  <input
                                    type="text"
                                    value={sub}
                                    onChange={(e) => {
                                      const nextDomains = { ...nodeConfigs[selectedNode.id].domains };
                                      const nextSubs = { ...nextDomains[domain] };
                                      const valObj = nextSubs[sub];
                                      delete nextSubs[sub];
                                      nextSubs[e.target.value] = valObj;
                                      nextDomains[domain] = nextSubs;
                                      updateNodeConfig(selectedNode.id, { domains: nextDomains });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-mono outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">Record Type</label>
                                  <select
                                    value={subData.typeOfRecord || "A"}
                                    onChange={(e) => {
                                      const nextDomains = { ...nodeConfigs[selectedNode.id].domains };
                                      nextDomains[domain][sub].typeOfRecord = e.target.value;
                                      updateNodeConfig(selectedNode.id, { domains: nextDomains });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px] outline-none cursor-pointer"
                                  >
                                    {["A", "AAAA", "CNAME", "MX", "PTR", "SOA", "SRV", "TXT", "ANY"].map((t) => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">Target Node</label>
                                  <select
                                    value={subData.to || ""}
                                    onChange={(e) => {
                                      const nextDomains = { ...nodeConfigs[selectedNode.id].domains };
                                      nextDomains[domain][sub].to = e.target.value;
                                      updateNodeConfig(selectedNode.id, { domains: nextDomains });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px] outline-none cursor-pointer"
                                  >
                                    <option value="">-- Target Node --</option>
                                    {nodes.map((n) => (
                                      <option key={n.id} value={n.id}>{String(n.data.label || n.id)}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] text-[color:var(--foreground)]/50 block">IP Address</label>
                                  <input
                                    type="text"
                                    value={subData.ip || ""}
                                    onChange={(e) => {
                                      const nextDomains = { ...nodeConfigs[selectedNode.id].domains };
                                      nextDomains[domain][sub].ip = e.target.value;
                                      updateNodeConfig(selectedNode.id, { domains: nextDomains });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-mono outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              const nextDomains = { ...nodeConfigs[selectedNode.id].domains };
                              const subCount = Object.keys(subdomains || {}).length;
                              nextDomains[domain][`subdomain${subCount + 1}`] = {
                                to: "",
                                ip: "192.168.1.1",
                                typeOfRecord: "A"
                              };
                              updateNodeConfig(selectedNode.id, { domains: nextDomains });
                            }}
                            className="w-full py-1 text-center border border-dashed border-[var(--border)] hover:bg-[var(--surface)] text-[9px] font-bold text-indigo-400/80 rounded transition cursor-pointer"
                          >
                            + Add Record Rule
                          </button>
                        </div>
                      </div>
                    ))}
                    {Object.keys(nodeConfigs[selectedNode.id]?.domains || {}).length === 0 && (
                      <p className="text-xs italic text-[color:var(--foreground)]/50">No domains added yet. Click Add Domain above.</p>
                    )}
                  </div>
                </div>
              )}

              {/* CDN Configuration */}
              {selectedNode.data.type === "cdn" && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-teal-400 font-mono">CDN Settings</p>
                  
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                      Origin Server / Storage
                    </label>
                    <select
                      value={nodeConfigs[selectedNode.id]?.originId ?? ""}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { originId: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">-- Select Origin --</option>
                      {nodes
                        .filter((n) => n.id !== selectedNode.id && (n.data.type === "server" || n.data.type === "storage"))
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {String(n.data.label || n.id)} ({String(n.data.type || "")})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="h-px bg-[var(--border)]/70" />

                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 mb-2">
                      Cached Keys (Static Content)
                    </p>
                    {(!nodeConfigs[selectedNode.id]?.cache || nodeConfigs[selectedNode.id].cache.length === 0) ? (
                      <p className="text-xs italic text-[color:var(--foreground)]/50">CDN Cache is empty.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                        {(nodeConfigs[selectedNode.id]?.cache || []).map((item: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item}
                              placeholder="Cache Key (e.g. file.png)"
                              onChange={(e) => {
                                const nextCache = [...nodeConfigs[selectedNode.id].cache];
                                nextCache[idx] = e.target.value;
                                updateNodeConfig(selectedNode.id, { cache: nextCache });
                              }}
                              className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono focus:border-teal-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextCache = nodeConfigs[selectedNode.id].cache.filter((_: any, i: number) => i !== idx);
                                updateNodeConfig(selectedNode.id, { cache: nextCache });
                              }}
                              className="text-rose-500 hover:text-rose-600 text-xs px-1 cursor-pointer font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const prevCache = nodeConfigs[selectedNode.id]?.cache ?? [];
                        updateNodeConfig(selectedNode.id, { cache: [...prevCache, ""] });
                      }}
                      className="w-full mt-2 rounded-lg border border-[var(--border)] py-1 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                    >
                      + Add Cache Item
                    </button>
                  </div>
                </div>
              )}

              {/* Server Specific Configuration */}
              {selectedNode.data.type === "server" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-emerald-400 font-mono">Server Settings</p>
                  <div>
                    <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">Connections Capacity</label>
                    <input
                      type="number"
                      value={nodeConfigs[selectedNode.id]?.capacity ?? 100}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { capacity: Number(e.target.value) })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="h-px bg-[var(--border)]/70 my-2" />
                  
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                      Exposed Endpoints
                    </label>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {Object.entries(nodeConfigs[selectedNode.id]?.endpoints || {}).map(([path, methods]: [string, any], idx) => {
                        const allHttpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
                        return (
                          <div key={idx} className="border border-[var(--border)] rounded-lg p-2.5 bg-[var(--surface)]/50 space-y-2 relative group/ep">
                            <button
                              type="button"
                              onClick={() => {
                                const nextEndpoints = { ...(nodeConfigs[selectedNode.id]?.endpoints || {}) };
                                delete nextEndpoints[path];
                                updateNodeConfig(selectedNode.id, { endpoints: nextEndpoints });
                              }}
                              className="absolute top-1.5 right-1.5 text-rose-500 hover:text-rose-600 text-xs font-bold px-1 cursor-pointer opacity-40 group-hover/ep:opacity-100 transition"
                              title="Delete Endpoint"
                            >
                              ×
                            </button>
                            
                            <div>
                              <label className="text-[8px] text-[color:var(--foreground)]/50 block mb-0.5">Route Path</label>
                              <input
                                type="text"
                                value={path}
                                placeholder="api/v1/resource"
                                onChange={(e) => {
                                  const endpoints = (nodeConfigs[selectedNode.id]?.endpoints || {}) as Record<string, any>;
                                  const nextEndpoints: Record<string, any> = {};
                                  for (const [k, v] of Object.entries(endpoints)) {
                                    if (k === path) {
                                      nextEndpoints[e.target.value] = v;
                                    } else {
                                      nextEndpoints[k] = v;
                                    }
                                  }
                                  updateNodeConfig(selectedNode.id, { endpoints: nextEndpoints });
                                }}
                                className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono outline-none focus:border-violet-500"
                              />
                            </div>

                            <div>
                              <label className="text-[8px] text-[color:var(--foreground)]/50 block mb-1">Allowed Methods</label>
                              <div className="flex flex-wrap gap-1">
                                {allHttpMethods.map((m) => {
                                  const isSelected = (methods || []).includes(m);
                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        const nextEndpoints = { ...(nodeConfigs[selectedNode.id]?.endpoints || {}) };
                                        const currentMethods = nextEndpoints[path] || [];
                                        let updatedMethods: any[];
                                        if (isSelected) {
                                          updatedMethods = currentMethods.filter((item: string) => item !== m);
                                        } else {
                                          updatedMethods = [...currentMethods, m];
                                        }
                                        nextEndpoints[path] = updatedMethods;
                                        updateNodeConfig(selectedNode.id, { endpoints: nextEndpoints });
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

                    <button
                      type="button"
                      onClick={() => {
                        const endpoints = nodeConfigs[selectedNode.id]?.endpoints || {};
                        const nextEndpoints = {
                          ...endpoints,
                          [`api/v1/endpoint-${Object.keys(endpoints).length + 1}`]: ["GET"],
                        };
                        updateNodeConfig(selectedNode.id, { endpoints: nextEndpoints });
                      }}
                      className="w-full mt-2 rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                    >
                      + Add Endpoint Rule
                    </button>
                  </div>
                </div>
              )}

              {/* Storage bucket configuration */}
              {selectedNode.data.type === "storage" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-yellow-400 font-mono">Storage Buckets</p>
                    <button
                      onClick={() => {
                        const currentBuckets = nodeConfigs[selectedNode.id]?.buckets || ["media-uploads"];
                        const nextBuckets = [...currentBuckets, `bucket-${currentBuckets.length + 1}`];
                        updateNodeConfig(selectedNode.id, { buckets: nextBuckets });
                      }}
                      className="rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                    >
                      + Add Bucket
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {(nodeConfigs[selectedNode.id]?.buckets || ["media-uploads"]).map((b: string, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const nextList = [...(nodeConfigs[selectedNode.id]?.buckets || ["media-uploads"])];
                            nextList[idx] = e.target.value;
                            updateNodeConfig(selectedNode.id, { buckets: nextList });
                          }}
                          className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono focus:border-yellow-500"
                        />
                        <button
                          onClick={() => {
                            const currentBuckets = nodeConfigs[selectedNode.id]?.buckets || ["media-uploads"];
                            if (currentBuckets.length <= 1) return;
                            const nextBuckets = currentBuckets.filter((_: any, i: number) => i !== idx);
                            updateNodeConfig(selectedNode.id, { buckets: nextBuckets });
                          }}
                          className="text-rose-500 hover:text-rose-600 text-xs font-bold px-2 cursor-pointer"
                          title="Delete Bucket"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[var(--border)]/70" />

                  {/* Uploaded Files Section */}
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 mb-2">
                      Live Uploaded Files
                    </p>
                    {(() => {
                      const filesMap = storageFilesByBucket[selectedNode.id] || {};
                      const buckets = nodeConfigs[selectedNode.id]?.buckets || ["media-uploads"];
                      const allFiles = Object.values(filesMap).flat();

                      if (allFiles.length === 0) {
                        return (
                          <div className="text-xs text-[color:var(--foreground)]/50 italic bg-[var(--surface)]/30 rounded-lg p-3 border border-[var(--border)]/50">
                            No files uploaded. Run client simulation to upload.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                          {buckets.map((bucketName: string) => {
                            const filesInBucket = filesMap[bucketName] || [];
                            return (
                              <div key={bucketName} className="border border-[var(--border)] rounded-lg p-2.5 bg-[var(--surface)]/50 space-y-1.5">
                                <div className="flex items-center justify-between border-b border-[var(--border)]/45 pb-1">
                                  <span className="text-[10px] font-bold text-yellow-500 font-mono">
                                    📁 {bucketName}
                                  </span>
                                  <span className="text-[9px] text-[color:var(--foreground)]/55 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-semibold">
                                    {filesInBucket.length} file{filesInBucket.length !== 1 ? "s" : ""}
                                  </span>
                                </div>

                                {filesInBucket.length === 0 ? (
                                  <p className="text-[10px] italic text-[color:var(--foreground)]/45">Empty bucket</p>
                                ) : (
                                  <div className="space-y-1">
                                    {filesInBucket.map((fileObj: any, fileIdx: number) => {
                                      const fileName = typeof fileObj === "string" ? fileObj : fileObj.name;
                                      const info = typeof fileObj === "string" ? null : fileObj.info;

                                      return (
                                        <div key={fileIdx} className="text-[11px] bg-[var(--surface)] p-1.5 rounded border border-[var(--border)]/35 font-mono flex flex-col gap-0.5">
                                          <div className="flex justify-between items-center text-xs font-semibold text-[color:var(--foreground)]/80">
                                            <span>📄 {fileName}</span>
                                          </div>
                                          {info && (
                                            <div className="text-[9px] text-[color:var(--foreground)]/50 mt-0.5 flex flex-col gap-0.5 border-t border-[var(--border)]/20 pt-1">
                                              {info.sourceIp && <span>IP: {info.sourceIp}</span>}
                                              {info.requestId && <span className="truncate">Req: {info.requestId}</span>}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="h-px bg-[var(--border)]/70 pt-2" />

              {/* Delete component helper */}
              <button
                onClick={() => {
                  setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
                  setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
                  setSelectedNodeId(null);
                }}
                className="w-full rounded-lg border border-rose-500/30 text-rose-500 dark:text-rose-400 py-2 text-center text-xs hover:bg-rose-500/10 transition font-semibold cursor-pointer"
              >
                Delete Component 🗑️
              </button>

            </div>
          </aside>
        )}

        {/* Floating Bottom Timeline & Playback Panel */}
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[92%] max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-3 transition-all duration-300 ${selectedNode ? "max-md:hidden" : ""}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 overflow-x-auto min-w-0">
              <Controls
                isPlaying={isPlaying}
                onPlayToggle={() => {
                  if (simulationFrames.length === 0) {
                    handleStartSimulation();
                  } else {
                    setIsPlaying((prev) => !prev);
                  }
                }}
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
            
            <div className="flex items-center gap-1.5 sm:gap-2 self-end md:self-auto shrink-0">
              <label 
                title="Hide response/return packets flowing back"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[color:var(--foreground)] transition hover:border-violet-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={hideResponse}
                  onChange={() => setHideResponse((prev) => !prev)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span className="group-hover:text-violet-300">Hide Response</span>
              </label>

              <label 
                title="Show parallel requests simultaneously"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[color:var(--foreground)] transition hover:border-blue-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={parallelResponse}
                  onChange={() => setParallelResponse((prev) => !prev)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span className="group-hover:text-blue-300">Parallel</span>
              </label>

              <label 
                title="Show detailed logs panel under graph"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[color:var(--foreground)] transition hover:border-emerald-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={() => setDebugEnabled((prev) => !prev)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span className="group-hover:text-emerald-300">Debug logs</span>
              </label>
            </div>
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

          {debugEnabled && simulationFrames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 max-h-48 overflow-y-auto"
            >
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-3 mt-1 shadow-inner">
                <p className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/50 mb-2">
                  Simulation Debug Console
                </p>
                <DebugPanel
                  currentFrames={accumulatedFrames}
                  frameIndex={frameIndex}
                  theme={theme}
                />
              </div>
            </motion.div>
          )}
        </div>

        </div>

        {/* Welcome Modal & Template Picker Dialog */}
        {showWelcomeModal && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto z-50 relative flex flex-col gap-5">
              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="absolute top-4 right-4 text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] h-8 w-8 rounded-full flex items-center justify-center font-bold transition cursor-pointer"
                title="Close"
              >
                ×
              </button>

              <div className="text-center">
                <ComponentIcon type="client" className="w-10 h-10 mx-auto text-violet-400" />
                <h1 className="text-xl font-bold tracking-tight text-[color:var(--foreground)] mt-2">
                  Welcome to FlowFrame Sandbox
                </h1>
                <p className="text-xs text-[color:var(--foreground)]/60 mt-1">
                  Design, simulate, and observe distributed system patterns in real-time.
                </p>
              </div>

              <div className="h-px bg-[var(--border)]/70 w-full" />

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/45">
                  Select an Architecture Template to Start:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      loadTemplate("cacheAside");
                      setShowWelcomeModal(false);
                    }}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-violet-500/60 transition cursor-pointer hover:bg-[var(--surface)] group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💾</span>
                      <span className="font-bold text-xs group-hover:text-violet-400 transition">Cache Aside</span>
                    </div>
                    <p className="text-[10px] text-[color:var(--foreground)]/50 mt-1.5 leading-normal">
                      Write/read path caching strategy prioritizing low latency using Redis Cache and Postgres DB.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadTemplate("loadBalancing");
                      setShowWelcomeModal(false);
                    }}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-blue-500/60 transition cursor-pointer hover:bg-[var(--surface)] group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚖️</span>
                      <span className="font-bold text-xs group-hover:text-blue-400 transition">Load Balancing</span>
                    </div>
                    <p className="text-[10px] text-[color:var(--foreground)]/50 mt-1.5 leading-normal">
                      Distribute client requests across multiple backend web server nodes using Round Robin routing.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadTemplate("valetKey");
                      setShowWelcomeModal(false);
                    }}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-yellow-500/60 transition cursor-pointer hover:bg-[var(--surface)] group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔑</span>
                      <span className="font-bold text-xs group-hover:text-yellow-400 transition">Valet Key</span>
                    </div>
                    <p className="text-[10px] text-[color:var(--foreground)]/50 mt-1.5 leading-normal">
                      Clients fetch secure signed URLs from server, then upload files directly to Cloud Storage.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadTemplate("apiGateway");
                      setShowWelcomeModal(false);
                    }}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] hover:border-fuchsia-500/60 transition cursor-pointer hover:bg-[var(--surface)] group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚪</span>
                      <span className="font-bold text-xs group-hover:text-fuchsia-400 transition">API Gateway</span>
                    </div>
                    <p className="text-[10px] text-[color:var(--foreground)]/50 mt-1.5 leading-normal">
                      Central entry point routes requests dynamically to Post or User services based on path prefixes.
                    </p>
                  </button>
                </div>
              </div>

              <div className="h-px bg-[var(--border)]/70 w-full" />

              <div className="flex justify-between items-center">
                <p className="text-[10px] text-[color:var(--foreground)]/40">
                  Or design your own custom architecture.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWelcomeModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 hover:bg-[var(--surface-muted)] text-xs font-semibold px-4 py-2 transition cursor-pointer"
                >
                  Start with Blank Canvas →
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpenMobile && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20"
          onClick={() => setIsSidebarOpenMobile(false)}
        />
      )}

      {/* Modern Hover Tooltip Popover (Floats at page level, non-clipping) */}
      {hoveredComponent && (
        <div
          className="fixed z-50 w-56 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shadow-2xl pointer-events-none text-left"
          style={{
            left: `${hoverTooltipX}px`,
            top: `${hoverTooltipY}px`,
            transform: "translateY(-50%)",
          }}
        >
          <p className="text-xs font-bold text-violet-400">{hoveredComponent.label}</p>
          <p className="text-[10px] text-[color:var(--foreground)]/75 mt-1 leading-normal">
            {hoveredComponent.description}
          </p>
          <p className="text-[9px] text-violet-300/60 mt-1.5 font-bold uppercase tracking-wider">
            Click to Add +
          </p>
        </div>
      )}
    </main>
  );
}
