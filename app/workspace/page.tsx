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
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import Ipv4Generator from "@/utils/generateRandomIp";
import PriorityQueue from "@/engine/core/Simulations/ParallelSimulation";

// Header
import SiteHeader from "@/components/SiteHeader";

type Theme = "light" | "dark";

// Component categories for the sidebar
type ComponentType =
  | "client"
  | "api-gateway"
  | "load-balancer"
  | "server"
  | "redis"
  | "postgres"
  | "storage";

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
        lookupKey: "rohan",
        valetKeyFlow: false,
        fileName: "file.png",
        isThereFileToUpload: true,
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
  };

  const icons: any = {
    client: "💻",
    "api-gateway": "🚪",
    "load-balancer": "⚖️",
    server: "🖥️",
    redis: "💾",
    postgres: "🗄️",
    storage: "☁️",
  };

  const colorClass = typeColors[data.type] || "border-l-slate-400";
  const icon = icons[data.type] || "⚙️";

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
        <span className="text-xl">{icon}</span>
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
            className="w-16 sm:w-20 cursor-pointer"
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
  frameGroups: Array<{ timestamp: number; frames: any[] }>;
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

      <div className="flex gap-1 overflow-x-auto pb-1">
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
    <div ref={containerRef} className="font-mono text-xs space-y-1.5 max-h-64 overflow-y-auto p-1 scroll-smooth">
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

  // Resizable panel states
  const [panelHeight, setPanelHeight] = useState(220);
  const [isDragging, setIsDragging] = useState(false);

  const uid = useMemo(() => new ShortUniqueId({ length: 8 }), []);

  // Quick Load Template
  const loadTemplate = useCallback((templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    
    // Choose connection colors dynamically based on theme
    const inactiveStrokeColor = theme === "dark" ? "#475569" : "#cbd5e1";

    setNodes(
      template.nodes.map((n) => ({
        ...n,
        style: {
          borderRadius: "8px",
        },
      }))
    );
    setEdges(
      template.edges.map((e) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
        style: { stroke: inactiveStrokeColor, strokeWidth: 1.8 },
      }))
    );

    // Seed configurations
    const configs: Record<string, any> = {};
    template.nodes.forEach((n) => {
      configs[n.id] = createDefaultConfig(n.data.type as ComponentType, n.id, n.data.label);
    });
    setNodeConfigs(configs);

    // Stop and Reset playback
    setIsPlaying(false);
    setRawSimulationFrames([]);
    setFrameIndex(0);
    setValidationWarning(null);
    setSelectedNodeId(null);
  }, [setNodes, setEdges, theme]);

  // Load default template on mount
  useEffect(() => {
    loadTemplate("cacheAside");
  }, [loadTemplate]);

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

  // Build model state mappings & Run Simulation
  const handleStartSimulation = (targetClientId?: string) => {
    // 1. Detect Clients
    const clientNodes = nodes.filter((n) => n.data.type === "client");
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
    nodes.forEach((n) => {
      const type = n.data.type as ComponentType;
      const labelStr = (n.data.label as string) || "";
      const config = nodeConfigs[n.id] || createDefaultConfig(type, n.id, labelStr);

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
          const connectedServers = edges
            .filter((e) => e.source === n.id)
            .map((e) => e.target)
            .filter((targetId) => {
              const targetNode = nodes.find((node) => node.id === targetId);
              return targetNode?.data.type === "server";
            });

          const serviceMapping = config.serviceMapping || {};
          const serviceGroups: Record<string, string[]> = {};
          const routesList = config.routes || {};
          const serviceOptions = Array.from(new Set(Object.values(routesList)));

          connectedServers.forEach((serverId) => {
            const serverNode = nodes.find((node) => node.id === serverId);
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
      }

      if (modelInstance) {
        graph.addNode(n.id, labelStr);
        registry.register(n.id, modelInstance);
      }
    });

    // 4. Register edges
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        graph.addEdge(edge.source, edge.target);
      }
    });

    // 5. Check cycles or validations
    const hasCycle = graph.detectCycle(registry);
    if (hasCycle) {
      setValidationWarning("Warning: Cycle detected in graph! Simulation may behave unexpectedly or hang.");
    }

    // 6. Run sequential request queries
    const clientLabelStr = (clientToRun.data.label as string) || "";
    const clientConfig = nodeConfigs[clientId] || createDefaultConfig("client", clientId, clientLabelStr);
    
    const allFrames: any[] = [];
    
    const clientRequests = clientConfig.requests || [
      {
        endpoint: clientConfig.endpoint || "/api/v1/posts",
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
    [nodes, nodeConfigs, edges, parallelResponse, hideResponse]
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

  // Resizable panel logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = document.querySelector("[data-resizable-container]") as HTMLElement;
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
      />

      {/* Main container with resizing tracking */}
      <div className="flex-1 flex min-h-0 overflow-hidden flex-col h-[calc(100vh-70px)]" data-resizable-container>
        
        {/* Scenario-player style Top Header Bar controls */}
        <header className="border-b border-[var(--border)] bg-[var(--surface)]/50 px-4 py-3 backdrop-blur overflow-x-auto shrink-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 flex-wrap sm:gap-4 md:flex-nowrap">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--foreground)]">Workspace Sandbox</p>
                <p className="text-[11px] text-[color:var(--foreground)]/50">Dynamic Simulation Playground</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap md:flex-nowrap">
              <label 
                title="Hide response/return packets flowing back"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[color:var(--foreground)] transition hover:border-violet-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={hideResponse}
                  onChange={() => setHideResponse((prev) => !prev)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span className="hidden sm:inline group-hover:text-violet-300">Hide Response</span>
                <span className="sm:hidden text-[10px]">↔️</span>
              </label>

              <label 
                title="Show parallel requests simultaneously"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[color:var(--foreground)] transition hover:border-blue-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={parallelResponse}
                  onChange={() => setParallelResponse((prev) => !prev)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span className="hidden sm:inline group-hover:text-blue-300">Parallel</span>
                <span className="sm:hidden text-[10px]">⚡</span>
              </label>

              <label 
                title="Show detailed logs panel under graph"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[color:var(--foreground)] transition hover:border-emerald-500/50 hover:bg-[var(--surface)]/80 whitespace-nowrap group"
              >
                <input
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={() => setDebugEnabled((prev) => !prev)}
                  className="accent-violet-500 cursor-pointer"
                />
                <span className="hidden sm:inline group-hover:text-emerald-300">Debug</span>
                <span className="sm:hidden text-[10px]">🐛</span>
              </label>

              <div className="h-6 w-px bg-[var(--border)] hidden md:block" />

              <div className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 sm:px-3 py-1.5 text-xs whitespace-nowrap">
                <span className={`h-2 w-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-[color:var(--foreground)]/30"}`} />
                <span className="text-[color:var(--foreground)]/70 hidden sm:inline">
                  {isPlaying ? "Playing" : simulationFrames.length > 0 ? "Paused" : "Idle"}
                </span>
                <span className="ml-0 sm:ml-1 text-[color:var(--foreground)]/50 text-[10px] sm:text-xs">
                  {frameIndex + 1}/{simulationFrames.length || 0}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body: Sidebar + Canvas + Inspector */}
        <section className="flex min-h-0 flex-1 overflow-hidden flex-col lg:flex-row">
          
          {/* Left Column: Sidebar Component Selector & Templates - FIXED height and scrollable */}
          <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--surface)]/30 backdrop-blur-md flex flex-col h-full min-h-0 shrink-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] shrink-0">
              <h2 className="text-base font-bold tracking-tight text-[color:var(--foreground)]">Component Library</h2>
              <p className="text-xs text-[color:var(--foreground)]/50 mt-1">
                Add system elements to build your distributed design.
              </p>
            </div>

            {/* Quick-load templates */}
            <div className="p-4 border-b border-[var(--border)]/70 shrink-0">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/45 mb-2.5">
                Quick Templates
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => loadTemplate("cacheAside")}
                  className="text-left text-xs p-2 rounded-lg border border-[var(--border)] hover:border-violet-500/50 bg-[var(--surface)]/50 font-semibold transition cursor-pointer"
                >
                  💾 Cache Aside
                </button>
                <button
                  onClick={() => loadTemplate("loadBalancing")}
                  className="text-left text-xs p-2 rounded-lg border border-[var(--border)] hover:border-violet-500/50 bg-[var(--surface)]/50 font-semibold transition cursor-pointer"
                >
                  ⚖️ Load Balancing
                </button>
                <button
                  onClick={() => loadTemplate("valetKey")}
                  className="text-left text-xs p-2 rounded-lg border border-[var(--border)] hover:border-violet-500/50 bg-[var(--surface)]/50 font-semibold transition cursor-pointer"
                >
                  🔑 Valet Key
                </button>
                <button
                  onClick={() => loadTemplate("apiGateway")}
                  className="text-left text-xs p-2 rounded-lg border border-[var(--border)] hover:border-violet-500/50 bg-[var(--surface)]/50 font-semibold transition cursor-pointer"
                >
                  🚪 API Gateway
                </button>
              </div>
            </div>

            {/* Scrollable list content - restricted correctly */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/45 mb-1.5">
                Components
              </p>

              {COMPONENTS_LIBRARY.map((item) => (
                <div
                  key={item.type}
                  className="group relative border border-[var(--border)]/75 rounded-2xl bg-[var(--surface)]/60 p-3 hover:bg-[var(--surface)] hover:border-violet-500/35 transition duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </div>
                    <button
                      onClick={() => addComponent(item.type)}
                      className="rounded-lg bg-gradient-to-r from-violet-500/80 to-violet-600/80 text-white px-2.5 py-1 text-[10px] font-bold hover:from-violet-500 hover:to-violet-600 shadow-sm transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  <p className="text-[11px] text-[color:var(--foreground)]/65 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]/40 flex items-center justify-between shrink-0">
              <button
                onClick={handleClearCanvas}
                className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Clear Canvas 🗑️
              </button>
              <p className="text-[10px] text-[color:var(--foreground)]/40">
                Drag node handles to link them
              </p>
            </div>
          </aside>

          {/* Center: React Flow Canvas */}
          <section className="flex-1 flex flex-col min-h-0 relative h-full overflow-hidden">
            
            {validationWarning && (
              <div className="absolute top-4 left-4 right-4 z-20 rounded-xl border border-amber-500/50 bg-amber-500/10 backdrop-blur px-4 py-3 text-xs text-amber-300 flex items-center justify-between">
                <span>{validationWarning}</span>
                <button onClick={() => setValidationWarning(null)} className="text-amber-400 font-bold ml-2">×</button>
              </div>
            )}

            <div className="flex-1 min-h-0 h-full">
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
              >
                <Background variant={BackgroundVariant.Dots} gap={16} size={0.7} color="rgba(148,163,184,0.15)" />
              </ReactFlow>
            </div>

            {/* Float trigger helper if empty simulation */}
            {simulationFrames.length === 0 && (
              <div className="absolute bottom-4 left-4 right-4 z-10 text-center">
                <div className="inline-block bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] rounded-2xl px-6 py-3 shadow-lg">
                  <p className="text-xs text-[color:var(--foreground)]/75">
                    💻 Click any **Client** node in the diagram or click **⚡ Run Simulation** at the bottom to start!
                  </p>
                </div>
              </div>
            )}

          </section>

          {/* Right Column: Inspector Panel */}
          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--surface)]/30 backdrop-blur-md flex flex-col h-full min-h-0 overflow-y-auto shrink-0">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="text-base font-bold tracking-tight text-[color:var(--foreground)]">Node Inspector</h2>
              <p className="text-xs text-[color:var(--foreground)]/50 mt-1">
                Select any component to configure its settings.
              </p>
            </div>

            {selectedNode ? (
              <div className="p-4 flex-1 space-y-4">
                
                {/* Rename Node section */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1.5">
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
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[color:var(--foreground)] outline-none focus:border-violet-500"
                  />
                </div>

                <div className="h-px bg-[var(--border)]/70" />

                {/* Client specific configuration */}
                {selectedNode.data.type === "client" && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-violet-400">Client Settings</p>
                    
                    <label className="flex items-center gap-2 text-xs text-[color:var(--foreground)]/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nodeConfigs[selectedNode.id]?.valetKeyFlow ?? false}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { valetKeyFlow: e.target.checked })}
                        className="accent-violet-500 cursor-pointer"
                      />
                      <span>Enable Valet Key Direct Upload Flow</span>
                    </label>

                    <div className="h-px bg-[var(--border)]/70" />

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                        Simulated Requests List
                      </label>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {(nodeConfigs[selectedNode.id]?.requests || [
                          {
                            endpoint: nodeConfigs[selectedNode.id]?.endpoint || "/api/v1/posts",
                            lookupKey: nodeConfigs[selectedNode.id]?.lookupKey || "rohan",
                            fileName: nodeConfigs[selectedNode.id]?.fileName || "file.png",
                            isThereFileToUpload: nodeConfigs[selectedNode.id]?.isThereFileToUpload !== false,
                          }
                        ]).map((req: any, idx: number) => (
                          <div key={idx} className="border border-[var(--border)] rounded-lg p-2.5 bg-[var(--surface)]/50 space-y-2 relative group/req">
                            <button
                              onClick={() => {
                                const currentRequests = nodeConfigs[selectedNode.id]?.requests || [
                                  {
                                    endpoint: nodeConfigs[selectedNode.id]?.endpoint || "/api/v1/posts",
                                    lookupKey: nodeConfigs[selectedNode.id]?.lookupKey || "rohan",
                                    fileName: nodeConfigs[selectedNode.id]?.fileName || "file.png",
                                    isThereFileToUpload: nodeConfigs[selectedNode.id]?.isThereFileToUpload !== false,
                                  }
                                ];
                                if (currentRequests.length <= 1) return;
                                const nextRequests = currentRequests.filter((_: any, i: number) => i !== idx);
                                updateNodeConfig(selectedNode.id, { requests: nextRequests });
                              }}
                              className="absolute top-1.5 right-1.5 text-rose-500 hover:text-rose-600 text-xs font-bold px-1.5 cursor-pointer opacity-40 group-hover/req:opacity-100 transition"
                              title="Delete Request"
                            >
                              ×
                            </button>

                            <p className="text-[10px] font-bold text-violet-400">Request #{idx + 1}</p>

                            {!nodeConfigs[selectedNode.id]?.valetKeyFlow ? (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] text-[color:var(--foreground)]/50 block mb-0.5">Path</label>
                                  <input
                                    type="text"
                                    value={req.endpoint}
                                    onChange={(e) => {
                                      const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                      currentRequests[idx].endpoint = e.target.value;
                                      updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono outline-none focus:border-violet-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-[color:var(--foreground)]/50 block mb-0.5">Key</label>
                                  <input
                                    type="text"
                                    value={req.lookupKey}
                                    onChange={(e) => {
                                      const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                      currentRequests[idx].lookupKey = e.target.value;
                                      updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono outline-none focus:border-violet-500"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div>
                                  <label className="text-[9px] text-[color:var(--foreground)]/50 block mb-0.5">Upload File</label>
                                  <input
                                    type="text"
                                    value={req.fileName}
                                    onChange={(e) => {
                                      const currentRequests = [...(nodeConfigs[selectedNode.id]?.requests || [req])];
                                      currentRequests[idx].fileName = e.target.value;
                                      updateNodeConfig(selectedNode.id, { requests: currentRequests });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono outline-none focus:border-violet-500"
                                  />
                                </div>
                                <label className="flex items-center gap-1.5 text-[10px] text-[color:var(--foreground)]/80 cursor-pointer">
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
                            }
                          ];
                          const nextRequests = [
                            ...currentRequests,
                            {
                              endpoint: "/api/v1/posts",
                              lookupKey: `key-${currentRequests.length + 1}`,
                              fileName: `file-${currentRequests.length + 1}.png`,
                              isThereFileToUpload: true,
                            }
                          ];
                          updateNodeConfig(selectedNode.id, { requests: nextRequests });
                        }}
                        className="w-full mt-2 rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                      >
                        + Add Custom Request
                      </button>
                    </div>
                  </div>
                )}

                {/* API Gateway Configuration */}
                {selectedNode.data.type === "api-gateway" && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-fuchsia-400">Gateway Settings</p>
                    
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1.5">Load Balancing Strategy</label>
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
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                        Route Rules (Path ➔ Service)
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {Object.entries(nodeConfigs[selectedNode.id]?.routes || {}).map(([path, svc]: [string, any], idx) => (
                          <div key={path} className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={path}
                              placeholder="Path prefix"
                              onChange={(e) => {
                                const nextRoutes = { ...(nodeConfigs[selectedNode.id]?.routes || {}) };
                                delete nextRoutes[path];
                                nextRoutes[e.target.value] = svc;
                                updateNodeConfig(selectedNode.id, { routes: nextRoutes });
                              }}
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono"
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
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono"
                            />
                            <button
                              onClick={() => {
                                const nextRoutes = { ...(nodeConfigs[selectedNode.id]?.routes || {}) };
                                delete nextRoutes[path];
                                updateNodeConfig(selectedNode.id, { routes: nextRoutes });
                              }}
                              className="text-rose-500 hover:text-rose-600 text-xs px-1.5 cursor-pointer font-bold"
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
                        className="w-full mt-2 rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                      >
                        + Add Route Rule
                      </button>
                    </div>

                    <div className="h-px bg-[var(--border)]/70" />

                    {/* Service Pools Mapping */}
                    {(() => {
                      const connectedServers = edges
                        .filter((e) => e.source === selectedNode.id)
                        .map((e) => e.target)
                        .filter((targetId) => {
                          const targetNode = nodes.find((node) => node.id === targetId);
                          return targetNode?.data.type === "server";
                        });

                      if (connectedServers.length === 0) {
                        return (
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                              Service Pools Mapping
                            </label>
                            <p className="text-[11px] text-[color:var(--foreground)]/50 italic">
                              No servers connected. Link this Gateway to Web Servers.
                            </p>
                          </div>
                        );
                      }

                      const routes = nodeConfigs[selectedNode.id]?.routes || {};
                      const serviceOptions = Array.from(new Set(Object.values(routes)));

                      return (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block">
                            Service Pools Mapping
                          </label>
                          <div className="space-y-3 border border-[var(--border)] rounded-lg p-2.5 bg-[var(--surface)]/50">
                            {connectedServers.map((serverId) => {
                              const serverNode = nodes.find((node) => node.id === serverId);
                              const serverLabel = String(serverNode?.data.label || serverId);
                              const serviceMapping = nodeConfigs[selectedNode.id]?.serviceMapping || {};
                              
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
                                <div key={serverId} className="flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-[color:var(--foreground)]/70 truncate">
                                    🖥️ {serverLabel}
                                  </span>
                                  <select
                                    value={currentVal}
                                    onChange={(e) => {
                                      const nextMapping = {
                                        ...(nodeConfigs[selectedNode.id]?.serviceMapping || {}),
                                        [serverId]: e.target.value,
                                      };
                                      updateNodeConfig(selectedNode.id, { serviceMapping: nextMapping });
                                    }}
                                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs outline-none focus:border-violet-500 cursor-pointer"
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
                    
                    {/* Key-values list */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-[color:var(--foreground)]/65">Cached Pairs</p>
                      {(!nodeConfigs[selectedNode.id]?.data || nodeConfigs[selectedNode.id].data.length === 0) ? (
                        <p className="text-xs italic text-[color:var(--foreground)]/50">No keys stored.</p>
                      ) : (
                        <div className="space-y-1">
                          {nodeConfigs[selectedNode.id].data.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={item.key}
                                placeholder="Key"
                                onChange={(e) => {
                                  const nextList = [...nodeConfigs[selectedNode.id].data];
                                  nextList[idx].key = e.target.value;
                                  updateNodeConfig(selectedNode.id, { data: nextList });
                                }}
                                className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono"
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
                                className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none"
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
                  <p className="text-xs font-semibold text-cyan-400">Database Records</p>
                  
                  <div>
                    <label className="text-[10px] text-[color:var(--foreground)]/60 block mb-1">Target Table Name</label>
                    <input
                      type="text"
                      value={nodeConfigs[selectedNode.id]?.table ?? "users"}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { table: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-[color:var(--foreground)]/65">Row Entries (ID / Payload)</p>
                    {(!nodeConfigs[selectedNode.id]?.data || nodeConfigs[selectedNode.id].data.length === 0) ? (
                      <p className="text-xs italic text-[color:var(--foreground)]/50">No records found.</p>
                    ) : (
                      <div className="space-y-1">
                        {nodeConfigs[selectedNode.id].data.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item.key}
                              placeholder="PK (e.g. doe)"
                              onChange={(e) => {
                                const nextList = [...nodeConfigs[selectedNode.id].data];
                                nextList[idx].key = e.target.value;
                                updateNodeConfig(selectedNode.id, { data: nextList });
                              }}
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono"
                            />
                            <input
                              type="text"
                              value={item.val}
                              placeholder="Record summary"
                              onChange={(e) => {
                                const nextList = [...nodeConfigs[selectedNode.id].data];
                                nextList[idx].val = e.target.value;
                                updateNodeConfig(selectedNode.id, { data: nextList });
                              }}
                              className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none"
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
                    + Add DB Row Record
                  </button>
                </div>
              )}

              {/* Server Specific Configuration */}
              {selectedNode.data.type === "server" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-emerald-400">Server Capacity</p>
                  <div>
                    <label className="text-[10px] text-[color:var(--foreground)]/60 block mb-1">Max Connections Capacity</label>
                    <input
                      type="number"
                      value={nodeConfigs[selectedNode.id]?.capacity ?? 100}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { capacity: Number(e.target.value) })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              )}

              {/* Storage bucket configuration */}
              {selectedNode.data.type === "storage" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-yellow-400">Storage Buckets</p>
                  <div className="space-y-1">
                    {nodeConfigs[selectedNode.id]?.buckets?.map((b: string, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const nextList = [...nodeConfigs[selectedNode.id].buckets];
                            nextList[idx] = e.target.value;
                            updateNodeConfig(selectedNode.id, { buckets: nextList });
                          }}
                          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono"
                        />
                      </div>
                    ))}
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
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center flex-1">
              <span className="text-4xl mb-3">🔍</span>
              <p className="text-xs font-semibold text-[color:var(--foreground)]">No Node Selected</p>
              <p className="text-[11px] text-[color:var(--foreground)]/50 mt-1 max-w-[180px]">
                Click on any node in the canvas to view or modify its database records, routing, and capacities.
              </p>
            </div>
          )}
        </aside>

      </section>

      {/* Playback & Debug Log Panel - Resizable exactly like scenarios detail page */}
      <div
        style={{ height: debugEnabled && simulationFrames.length > 0 ? `${panelHeight}px` : "auto" }}
        className="flex flex-col border-t border-[var(--border)] bg-[var(--surface)]/30 transition-all duration-150 backdrop-blur overflow-hidden shrink-0 z-20"
      >
        {/* Resize Handler bar */}
        {debugEnabled && simulationFrames.length > 0 && (
          <div
            onMouseDown={() => setIsDragging(true)}
            className="h-1 w-full cursor-row-resize bg-[var(--border)] hover:bg-violet-500/60 transition"
            title="Drag to resize debugger"
          />
        )}

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 py-3"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="overflow-x-auto">
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
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 p-3 mt-1">
                  <p className="text-xs uppercase tracking-widest text-[color:var(--foreground)]/50 mb-3">
                    Frame {frameIndex + 1} Debug Details
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
        </motion.section>
      </div>

    </div>
  </main>
);
}
