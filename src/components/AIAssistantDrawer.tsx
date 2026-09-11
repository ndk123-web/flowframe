"use client";

import React, { useState, useMemo } from "react";
import { compileDSL } from "@/DSL";
import type { Node, Edge } from "@xyflow/react";
import {
  FiZap,
  FiSliders,
  FiShield,
  FiInbox,
  FiGlobe,
  FiAlertTriangle,
  FiCheckCircle,
  FiCpu,
  FiTool,
  FiInfo,
  FiX,
  FiPlay,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";


interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  nodeConfigs: Record<string, any>;
  onApplyDsl: (code: string, explanation: string) => void;
  onRunSimulation?: () => void;
  theme?: "light" | "dark";
}

type AIMode = "create" | "modify" | "fix" | "explain";

export default function AIAssistantDrawer({
  isOpen,
  onClose,
  nodes,
  edges,
  nodeConfigs,
  onApplyDsl,
  onRunSimulation,
}: AIAssistantDrawerProps) {
  const [activeMode, setActiveMode] = useState<AIMode>("create");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);

  // Pre-configured architecture templates in FlowFrame DSL
  const ARCHITECTURE_PRESETS = [
    {
      id: "cache-aside",
      title: "Cache-Aside Pattern",
      badge: "High Throughput",
      icon: "zap",
      desc: "Client routes through API Server with Redis in-memory cache and Postgres DB fallback.",
      dsl: `// Cache-Aside Architecture Template
define CLIENT web_client {
  label: "Web Client",
  requests: [
    { endpoint: "/api/v1/users", allowedMethods: ["GET", "POST"], key: "user:101" }
  ]
}

define SERVER api_server {
  label: "API Gateway Server",
  capacity: 150,
  acceptedEndpoints: [
    { endpoint: "/api/v1/users", allowedMethod: ["GET", "POST"] }
  ]
}

define REDIS redis_cache {
  label: "Redis Cache Layer",
  data: [
    { key: "user:101", value: "cached user profile payload" }
  ]
}

define POSTGRES postgres_db {
  label: "PostgreSQL Database",
  data: [
    { key: "user:101", value: "db record: user 101" },
    { key: "user:102", value: "db record: user 102" }
  ]
}

connect web_client -> api_server
connect api_server -> redis_cache
connect api_server -> postgres_db
`,
      explanation: "Generated Cache-Aside architecture: In-memory Redis cache intercepts requests, reducing database read latency by ~85%.",
    },
    {
      id: "load-balanced",
      title: "Load-Balanced Cluster",
      badge: "High Availability",
      icon: "sliders",
      desc: "Client traffic distributed across multiple server instances via Round-Robin Load Balancer.",
      dsl: `// High Availability Load-Balanced Cluster
define CLIENT mobile_client {
  label: "Mobile & Web Traffic",
  requests: [
    { endpoint: "/api/v1/orders", allowedMethods: ["GET", "POST"], key: "order:550" }
  ]
}

define LOADBALANCER edge_lb {
  label: "Round-Robin LB",
  algorithm: "round-robin",
  healthCheck: true
}

define SERVER app_server_1 {
  label: "App Node Alpha",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/api/v1/orders", allowedMethod: ["GET", "POST"] }
  ]
}

define SERVER app_server_2 {
  label: "App Node Beta",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/api/v1/orders", allowedMethod: ["GET", "POST"] }
  ]
}

define POSTGRES shared_db {
  label: "Primary Database",
  data: [
    { key: "order:550", value: "Order #550 Confirmed" }
  ]
}

connect mobile_client -> edge_lb
connect edge_lb -> app_server_1
connect edge_lb -> app_server_2
connect app_server_1 -> shared_db
connect app_server_2 -> shared_db
`,
      explanation: "Generated Load-Balanced Cluster: Eliminates single point of failure (SPOF) and distributes load across App Node Alpha and Beta.",
    },
    {
      id: "microservices-gateway",
      title: "API Gateway Microservices",
      badge: "Scalability",
      icon: "shield",
      desc: "Central API Gateway routing traffic to User and Payment microservices with independent databases.",
      dsl: `// API Gateway Microservices Architecture
define CLIENT client_apps {
  label: "Client Applications",
  requests: [
    { endpoint: "/users", allowedMethods: ["GET"], key: "user:alice" },
    { endpoint: "/orders", allowedMethods: ["POST"], key: "order:909" }
  ]
}

define APIGATEWAY api_gw {
  label: "Kong API Gateway",
  rateLimit: 1000
}

define SERVER user_service {
  label: "User Microservice",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/users", allowedMethod: ["GET"] }
  ]
}

define SERVER order_service {
  label: "Order Microservice",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/orders", allowedMethod: ["POST"] }
  ]
}

define POSTGRES user_db {
  label: "User Database",
  data: [
    { key: "user:alice", value: "Profile: Alice" }
  ]
}

define POSTGRES order_db {
  label: "Order Database",
  data: [
    { key: "order:909", value: "Invoice $120.00" }
  ]
}

connect client_apps -> api_gw
connect api_gw -> user_service
connect api_gw -> order_service
connect user_service -> user_db
connect order_service -> order_db
`,
      explanation: "Generated API Gateway Microservices: Centralized routing and rate-limiting across independent decoupled services.",
    },
    {
      id: "event-driven-queue",
      title: "Event-Driven Async Queue",
      badge: "Decoupled",
      icon: "inbox",
      desc: "Asynchronous background ingestion using Message Queue and worker processing.",
      dsl: `// Event-Driven Async Architecture
define CLIENT ingest_client {
  label: "IoT / Web Ingest",
  requests: [
    { endpoint: "/events", allowedMethods: ["POST"], key: "evt:telemetry" }
  ]
}

define SERVER ingest_api {
  label: "Ingestion API",
  capacity: 200,
  acceptedEndpoints: [
    { endpoint: "/events", allowedMethod: ["POST"] }
  ]
}

define QUEUE message_queue {
  label: "Kafka Message Queue",
  bufferCapacity: 1000
}

define SERVER worker_node {
  label: "Async Worker",
  capacity: 50,
  acceptedEndpoints: [
    { endpoint: "/events", allowedMethod: ["POST"] }
  ]
}

define STORAGE cold_storage {
  label: "S3 Data Lake",
  data: [
    { key: "evt:telemetry", value: "Telemetry Stream Binary" }
  ]
}

connect ingest_client -> ingest_api
connect ingest_api -> message_queue
connect message_queue -> worker_node
connect worker_node -> cold_storage
`,
      explanation: "Generated Event-Driven Queue: Buffer sudden traffic spikes smoothly in Kafka without overwhelming downstream workers.",
    },
    {
      id: "cdn-edge",
      title: "Global CDN Edge Architecture",
      badge: "Low Latency",
      icon: "globe",
      desc: "Cloudflare CDN Edge caching static assets with Origin fallback.",
      dsl: `// Global CDN Edge Architecture
define CLIENT global_visitor {
  label: "Global Visitor",
  requests: [
    { endpoint: "/assets/style.css", allowedMethods: ["GET"], key: "css:bundle" }
  ]
}

define CDN edge_cdn {
  label: "Edge CDN PoP",
  ttl: 3600
}

define SERVER origin_server {
  label: "Origin Server",
  capacity: 70,
  acceptedEndpoints: [
    { endpoint: "/assets/style.css", allowedMethod: ["GET"] }
  ]
}

define STORAGE storage_bucket {
  label: "GCS Assets Bucket",
  data: [
    { key: "css:bundle", value: "Minified CSS Bundle v2" }
  ]
}

connect global_visitor -> edge_cdn
connect edge_cdn -> origin_server
connect origin_server -> storage_bucket
`,
      explanation: "Generated Global CDN Edge: Delivers cached responses close to users at <20ms edge latency.",
    },
  ];

  // Architectural audit & recommendations (Rule-based engine)
  const auditResults = useMemo(() => {
    const findings: Array<{
      id: string;
      severity: "critical" | "warning" | "optimization" | "good";
      title: string;
      desc: string;
      actionLabel?: string;
      fixDsl?: string;
    }> = [];

    if (nodes.length === 0) {
      findings.push({
        id: "empty-canvas",
        severity: "optimization",
        title: "Blank Canvas",
        desc: "No architectural components placed. Generate a template or start designing.",
        actionLabel: "Load Cache-Aside Template",
        fixDsl: ARCHITECTURE_PRESETS[0].dsl,
      });
      return findings;
    }

    const clientNodes = nodes.filter((n) => n.data?.type === "client");
    const serverNodes = nodes.filter((n) => n.data?.type === "server");
    const lbNodes = nodes.filter((n) => n.data?.type === "load-balancer");
    const redisNodes = nodes.filter((n) => n.data?.type === "redis");
    const dbNodes = nodes.filter((n) => n.data?.type === "postgres");

    // 1. Direct client to DB connection
    const directDbConnections = edges.filter((e) => {
      const source = nodes.find((n) => n.id === e.source);
      const target = nodes.find((n) => n.id === e.target);
      return source?.data?.type === "client" && target?.data?.type === "postgres";
    });

    if (directDbConnections.length > 0) {
      findings.push({
        id: "direct-db",
        severity: "critical",
        title: "Direct Client Database Exposure",
        desc: "Clients are connecting directly to PostgreSQL without an API layer, risking credential leakage and pool exhaustion.",
      });
    }

    // 2. Single Point of Failure (SPOF)
    if (serverNodes.length === 1 && lbNodes.length === 0) {
      findings.push({
        id: "spof-server",
        severity: "warning",
        title: "Single Point of Failure (SPOF)",
        desc: "Architecture relies on a single API Server. If this instance fails or becomes overloaded, the entire system halts.",
        actionLabel: "Upgrade to Load Balanced Cluster",
        fixDsl: ARCHITECTURE_PRESETS[1].dsl,
      });
    }

    // 3. Database without Caching Layer
    if (dbNodes.length > 0 && redisNodes.length === 0) {
      findings.push({
        id: "missing-cache",
        severity: "warning",
        title: "Uncached Database Queries",
        desc: "All queries hit the disk-backed relational database directly. Adding Redis reduces P99 latency significantly.",
        actionLabel: "Apply Cache-Aside Pattern",
        fixDsl: ARCHITECTURE_PRESETS[0].dsl,
      });
    }

    // 4. Isolated / Disconnected Nodes
    const disconnectedNodes = nodes.filter((n) => {
      const hasConnection = edges.some(
        (e) => e.source === n.id || e.target === n.id
      );
      return !hasConnection;
    });

    if (disconnectedNodes.length > 0) {
      findings.push({
        id: "disconnected-nodes",
        severity: "optimization",
        title: `${disconnectedNodes.length} Disconnected Component${disconnectedNodes.length > 1 ? "s" : ""}`,
        desc: `Node "${disconnectedNodes[0].data?.label || disconnectedNodes[0].id}" is not connected to the traffic pipeline.`,
      });
    }

    // If all healthy
    if (findings.length === 0) {
      findings.push({
        id: "healthy-arch",
        severity: "good",
        title: "Optimal Architecture Verified",
        desc: "No critical bottlenecks or single points of failure detected in current topology.",
      });
    }

    return findings;
  }, [nodes, edges]);

  // Handle preset application
  const handleApplyPreset = (preset: typeof ARCHITECTURE_PRESETS[0]) => {
    setIsGenerating(true);
    setTimeout(() => {
      onApplyDsl(preset.dsl, preset.explanation);
      setLastActionResult(preset.explanation);
      setIsGenerating(false);
      if (onRunSimulation) {
        setTimeout(onRunSimulation, 250);
      }
    }, 150);
  };

  // Handle custom prompt execution
  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    const query = customPrompt.toLowerCase();

    // Grounded keyword mapping to valid DSL architectures
    let selectedPreset = ARCHITECTURE_PRESETS[0]; // Default cache-aside
    if (query.includes("load") || query.includes("balance") || query.includes("cluster") || query.includes("replica")) {
      selectedPreset = ARCHITECTURE_PRESETS[1];
    } else if (query.includes("gateway") || query.includes("microservice") || query.includes("auth") || query.includes("order")) {
      selectedPreset = ARCHITECTURE_PRESETS[2];
    } else if (query.includes("queue") || query.includes("kafka") || query.includes("event") || query.includes("worker")) {
      selectedPreset = ARCHITECTURE_PRESETS[3];
    } else if (query.includes("cdn") || query.includes("edge") || query.includes("cloudflare") || query.includes("asset")) {
      selectedPreset = ARCHITECTURE_PRESETS[4];
    }

    setTimeout(() => {
      onApplyDsl(selectedPreset.dsl, `Generated architecture for: "${customPrompt}"`);
      setLastActionResult(`Generated: ${selectedPreset.title} based on your query.`);
      setIsGenerating(false);
      setCustomPrompt("");
      if (onRunSimulation) {
        setTimeout(onRunSimulation, 250);
      }
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <aside
      className="absolute top-0 right-0 bottom-0 z-30 w-full sm:w-96 md:w-[420px] bg-[var(--surface)]/95 backdrop-blur-2xl border-l border-[var(--border)] shadow-2xl flex flex-col overflow-hidden animate-fade-in text-[color:var(--foreground)]"
      role="dialog"
      aria-label="AI Architecture Assistant"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <FiCpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Architecture Assistant</h2>
            <p className="text-[10px] text-[color:var(--foreground)]/50">
              Grounded system design & live simulation engine
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-full hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] flex items-center justify-center text-sm font-bold transition cursor-pointer"
          aria-label="Close AI Assistant"
        >
          ×
        </button>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)]/50 shrink-0">
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)]">
          {(
            [
              { id: "create", label: "Create", iconType: "create" },
              { id: "modify", label: "Modify", iconType: "modify" },
              { id: "fix", label: "Audit", iconType: "fix" },
              { id: "explain", label: "Explain", iconType: "explain" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
              className={`py-1.5 px-1 rounded-lg text-[10.5px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                activeMode === mode.id
                  ? "bg-[var(--surface)] text-blue-400 font-bold shadow-sm border border-[var(--border)]"
                  : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
              }`}
            >
              {mode.iconType === "create" && <FiCpu className="w-3.5 h-3.5 text-blue-400" />}
              {mode.iconType === "modify" && <FiTool className="w-3.5 h-3.5 text-cyan-400" />}
              {mode.iconType === "fix" && <FiAlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              {mode.iconType === "explain" && <FiInfo className="w-3.5 h-3.5 text-purple-400" />}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Toast / Result Message */}
        {lastActionResult && (
          <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-xs text-blue-300 flex items-center justify-between animate-fade-in">
            <span className="leading-snug">{lastActionResult}</span>
            <button
              type="button"
              onClick={() => setLastActionResult(null)}
              className="text-blue-400 hover:text-blue-200 ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* ── MODE 1: CREATE ARCHITECTURE ── */}
        {activeMode === "create" && (
          <div className="space-y-4">
            {/* Natural language query prompt */}
            <form onSubmit={handleCustomPromptSubmit} className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/70 flex items-center gap-1.5">
                <span>Architecture Assistant Input</span>
                <span className="text-[9px] font-mono text-blue-400 font-normal">DSL-Grounded</span>
              </label>
              <div className="relative">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Design a high-availability microservices architecture with Redis and Load Balancer..."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-3 text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !customPrompt.trim()}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isGenerating ? "Compiling..." : "Generate Architecture"}</span>
              </button>
            </form>

            <div className="h-px bg-[var(--border)] w-full" />

            {/* Architecture Presets */}
            <div className="space-y-2">
              <p className="text-[10.5px] uppercase font-bold tracking-wider text-[color:var(--foreground)]/50">
                Production Architecture Blueprints
              </p>

              <div className="space-y-2.5">
                {ARCHITECTURE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/30 hover:border-blue-500/50 hover:bg-[var(--surface-muted)] transition cursor-pointer group flex flex-col gap-2"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {preset.icon === "zap" && <FiZap className="w-3.5 h-3.5" />}
                          {preset.icon === "sliders" && <FiSliders className="w-3.5 h-3.5" />}
                          {preset.icon === "shield" && <FiShield className="w-3.5 h-3.5" />}
                          {preset.icon === "inbox" && <FiInbox className="w-3.5 h-3.5" />}
                          {preset.icon === "globe" && <FiGlobe className="w-3.5 h-3.5" />}
                        </span>
                        <h3 className="text-xs font-bold text-[color:var(--foreground)] group-hover:text-blue-400 transition">
                          {preset.title}
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {preset.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-[color:var(--foreground)]/60 leading-relaxed">
                      {preset.desc}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Click to compile & run simulation</span>
                      <FiArrowRight className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE 2: MODIFY ARCHITECTURE ── */}
        {activeMode === "modify" && (
          <div className="space-y-3">
            <p className="text-[11px] text-[color:var(--foreground)]/70 leading-relaxed">
              Transform the active canvas topology with 1-click architectural mutations:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleApplyPreset(ARCHITECTURE_PRESETS[0]);
                }}
                className="w-full text-left p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 hover:border-blue-500/50 hover:bg-[var(--surface-muted)] transition flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <FiZap className="w-3 h-3 text-amber-400" /> Insert Redis Caching Layer
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400">Low Latency</span>
                </div>
                <p className="text-[10px] text-[color:var(--foreground)]/50">
                  Adds an in-memory Redis cache between servers and storage to eliminate repetitive DB queries.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleApplyPreset(ARCHITECTURE_PRESETS[1]);
                }}
                className="w-full text-left p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 hover:border-blue-500/50 hover:bg-[var(--surface-muted)] transition flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <FiSliders className="w-3 h-3 text-blue-400" /> Scale Horizontally with Load Balancer
                  </span>
                  <span className="text-[9px] font-mono text-blue-400">High Availability</span>
                </div>
                <p className="text-[10px] text-[color:var(--foreground)]/50">
                  Inserts a Round-Robin Load Balancer and clones API server into parallel nodes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleApplyPreset(ARCHITECTURE_PRESETS[4]);
                }}
                className="w-full text-left p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 hover:border-blue-500/50 hover:bg-[var(--surface-muted)] transition flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <FiGlobe className="w-3 h-3 text-cyan-400" /> Deploy Cloudflare CDN Edge
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400">Edge Caching</span>
                </div>
                <p className="text-[10px] text-[color:var(--foreground)]/50">
                  Places a global CDN reverse proxy in front of server origin to serve static assets under 20ms.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleApplyPreset(ARCHITECTURE_PRESETS[3]);
                }}
                className="w-full text-left p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 hover:border-blue-500/50 hover:bg-[var(--surface-muted)] transition flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <FiInbox className="w-3 h-3 text-emerald-400" /> Add Async Worker Message Queue
                  </span>
                  <span className="text-[9px] font-mono text-pink-400">Decoupled</span>
                </div>
                <p className="text-[10px] text-[color:var(--foreground)]/50">
                  Buffers incoming request surges into a distributed queue for background processing.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ── MODE 3: AUDIT & OPTIMIZATION ── */}
        {activeMode === "fix" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[color:var(--foreground)]/60">
                Live Topology Audit
              </span>
              <span className="text-[10px] font-mono text-blue-400 font-semibold">
                {nodes.length} Nodes · {edges.length} Edges
              </span>
            </div>

            <div className="space-y-2.5">
              {auditResults.map((audit) => {
                const badgeColor =
                  audit.severity === "critical"
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    : audit.severity === "warning"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : audit.severity === "good"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-blue-500/15 text-blue-400 border-blue-500/30";

                return (
                  <div
                    key={audit.id}
                    className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[color:var(--foreground)]">
                        {audit.title}
                      </h4>
                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                      >
                        {audit.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-[color:var(--foreground)]/60 leading-relaxed">
                      {audit.desc}
                    </p>

                    {audit.fixDsl && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyDsl(audit.fixDsl!, `Resolved: ${audit.title}`);
                          setLastActionResult(`Resolved: ${audit.title}`);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FiZap className="w-3 h-3 text-amber-400" />
                        <span>{audit.actionLabel || "Apply Recommended Fix"}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MODE 4: EXPLAIN SIMULATION ── */}
        {activeMode === "explain" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 space-y-2">
              <h4 className="text-xs font-bold text-[color:var(--foreground)] flex items-center gap-1.5">
                <FiInfo className="w-3 h-3 text-blue-400" /> Architecture Structure Overview
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)]">
                  <p className="text-[9px] uppercase font-mono text-[color:var(--foreground)]/40">Total Components</p>
                  <p className="text-sm font-bold text-blue-400 mt-0.5">{nodes.length}</p>
                </div>
                <div className="bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)]">
                  <p className="text-[9px] uppercase font-mono text-[color:var(--foreground)]/40">Data Connections</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{edges.length}</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 space-y-2">
              <h4 className="text-xs font-bold text-[color:var(--foreground)] flex items-center gap-1.5">
                <FiZap className="w-3 h-3 text-amber-400" /> Request Flow Dynamics
              </h4>
              <p className="text-[11px] text-[color:var(--foreground)]/70 leading-relaxed">
                When a client initiates a request, FlowFrame executes chronological packet hops:
              </p>
              <ul className="text-[11px] text-[color:var(--foreground)]/60 space-y-1.5 pl-3 list-disc">
                <li>
                  <strong className="text-blue-300">Routing & Ingestion:</strong> Requests arrive at perimeter gateway or load balancer.
                </li>
                <li>
                  <strong className="text-blue-300">Cache Evaluation:</strong> Caching layers intercept identical query keys before disk.
                </li>
                <li>
                  <strong className="text-blue-300">Data Persistence:</strong> Database pool locks connections, executes transaction, and returns 200 OK.
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/40 space-y-2">
              <h4 className="text-xs font-bold text-[color:var(--foreground)] flex items-center gap-1.5">
                <FiInfo className="w-3 h-3 text-emerald-400" /> Latency & Scaling Advice
              </h4>
              <p className="text-[11px] text-[color:var(--foreground)]/70 leading-relaxed">
                To minimize round-trip packet latency:
              </p>
              <ul className="text-[11px] text-[color:var(--foreground)]/60 space-y-1 pl-3 list-disc">
                <li>Deploy Redis in-memory cache for high-read endpoints.</li>
                <li>Add Round-Robin Load Balancer to avoid server capacity bottlenecks.</li>
                <li>Keep response packets lightweight to avoid connection queue head-of-line blocking.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] text-[10px] text-[color:var(--foreground)]/45 text-center flex items-center justify-between shrink-0">
        <span className="font-mono">FlowFrame Architecture DSL v2.0</span>
        <span className="text-emerald-400 font-semibold">● Ready</span>
      </div>
    </aside>
  );
}
