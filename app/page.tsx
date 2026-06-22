"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ComponentIcon } from "@/components/ComponentIcons";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import ShortUniqueId from "short-unique-id";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  BaseEdge,
  Background,
  BackgroundVariant,
  getSmoothStepPath,
  Handle,
  Position,
  type Node,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Ipv4Generator from "@/utils/generateRandomIp";
import Link from "next/link";

type Theme = "light" | "dark";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const animationStyles = `

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); filter: blur(4px); }
    to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
  }
  @keyframes slideLeft {
    from { opacity: 0; transform: translateX(-18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(1.9); opacity: 0;   }
  }
  @keyframes gradShift {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-8px);  }
  }
  @keyframes tickerScroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes orbit {
    from { transform: rotate(0deg)   translateX(38px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(38px) rotate(-360deg); }
  }

  .fade-up   { animation: fadeUp   0.7s cubic-bezier(.22,1,.36,1) forwards; }
  .slide-l   { animation: slideLeft  0.6s cubic-bezier(.22,1,.36,1) forwards; }
  .slide-r   { animation: slideRight 0.6s cubic-bezier(.22,1,.36,1) forwards; }
  .float-anim { animation: float 4s ease-in-out infinite; }

  .grad-text {
    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #60a5fa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ticker-wrap {
    overflow: hidden;
    white-space: nowrap;
  }
  .ticker-track {
    display: inline-flex;
    animation: tickerScroll 22s linear infinite;
  }

  .v1-badge {
    background: linear-gradient(135deg, rgba(99,102,241,.15), rgba(139,92,246,.15));
    border: 1px solid rgba(139,92,246,.35);
  }

  .card-glow:hover {
    box-shadow: 0 0 0 1px rgba(139,92,246,.3), 0 20px 60px -20px rgba(139,92,246,.25);
  }

  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 8px 32px -8px rgba(99,102,241,.5);
    transition: all .2s ease;
  }
  .btn-primary:hover {
    box-shadow: 0 14px 40px -8px rgba(99,102,241,.65);
    transform: translateY(-1px) scale(1.02);
  }
  .btn-primary:active { transform: scale(.97); }

  .btn-outline {
    border: 1.5px solid rgba(139,92,246,.35);
    transition: all .2s ease;
  }
  .btn-outline:hover {
    border-color: rgba(139,92,246,.7);
    background: rgba(139,92,246,.08);
    transform: translateY(-1px);
  }

  .scene-card {
    transition: all .25s ease;
  }
  .scene-card:hover {
    transform: translateY(-4px);
  }

  /* ping ring for active nodes */
  .ping-ring::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 2px solid currentColor;
    animation: pulseRing 1.2s ease-out infinite;
  }

  /* subtle grid bg */
  .dot-grid {
    background-image: radial-gradient(rgba(148,163,184,.12) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 0 2px rgba(52,211,153,.25);
    animation: pulseRing 2s ease infinite;
    display: inline-block;
  }
`;

// ─── Intersection Reveal ──────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [vis, setVis] = useState(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.unobserve(el); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [el]);

  return (
    <div
      ref={setEl}
      className={`${className} ${vis ? "fade-up" : "opacity-0"}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

// ─── Packet Edge (same logic, cleaned up) ────────────────────────────────────
function PacketEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data } = props;
  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 10 });

  const isActive       = Boolean(data?.active);
  const duration       = Number(data?.packetDuration ?? 1.8);
  const isReverse      = Boolean(data?.reverseMotion);
  const count          = Math.max(1, Math.min(Number(data?.packetCount ?? 1), 4));
  const frameIndex     = Number(data?.frameIndex ?? 0);

  const [animationPath] = getSmoothStepPath({
    sourceX: isReverse ? targetX : sourceX,
    sourceY: isReverse ? targetY : sourceY,
    sourcePosition: isReverse ? targetPosition : sourcePosition,
    targetX: isReverse ? sourceX : targetX,
    targetY: isReverse ? sourceY : targetY,
    targetPosition: isReverse ? sourcePosition : targetPosition,
    borderRadius: 10,
  });

  const col = isReverse ? "#f59e0b" : "#8b5cf6";

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd}
        style={{ ...style, strokeOpacity: isActive ? 0.9 : 0.2, transition: "stroke-opacity 150ms" }} />
      {isActive && Array.from({ length: count }).map((_, i) => (
        <circle key={`${props.id}-${i}-${animationPath}-${frameIndex}`} r={4.5 - i * 0.5} fill={col} cx="0" cy="0"
          style={{ filter: `drop-shadow(0 0 5px ${col}cc)`, opacity: Math.max(0.4, 0.9 - i * 0.15) }}>
          <animateMotion dur={`${duration}s`}
            repeatCount="2" fill="freeze" begin={`${i * 0.12}s`} path={animationPath}
            keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </circle>
      ))}
    </>
  );
}

// ─── Custom Node for Hero diagram ─────────────────────────────────────────────
function HeroNode({ data }: any) {
  const border: Record<string, string> = {
    client: "#8b5cf6", "load-balancer": "#3b82f6", server: "#10b981",
  };
  const isActive = Boolean(data.isActive);
  const col = border[data.type] || "#64748b";

  return (
    <div
      className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold backdrop-blur"
      style={{
        background: "var(--surface)",
        border: `1.5px solid ${isActive ? col : "rgba(148,163,184,.25)"}`,
        boxShadow: isActive ? `0 0 18px -4px ${col}99` : "none",
        minWidth: 130,
        transition: "all .15s ease",
      }}
    >
      {data.type !== "client" && (
        <Handle type="target" position={Position.Left}
          style={{ background: col, width: 7, height: 7, border: "none" }} />
      )}
      <ComponentIcon type={data.type} className="w-4 h-4 shrink-0" />
      <div className="leading-tight">
        <p className="text-[9px] font-semibold uppercase tracking-wider opacity-40">{data.type}</p>
        <p className="text-[11px] font-bold truncate max-w-[90px]" style={{ color: "var(--foreground)" }}>{data.label}</p>
      </div>
      {isActive && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: col }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: col }} />
        </span>
      )}
      {data.type !== "server" && (
        <Handle type="source" position={Position.Right}
          style={{ background: col, width: 7, height: 7, border: "none" }} />
      )}
    </div>
  );
}

const NODE_TYPES = { heroNode: HeroNode };

// ─── Hero Live Sim ─────────────────────────────────────────────────────────────
function HeroSim() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false); // starts paused
  const [simData, setSimData]       = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => { setSimData(buildSim()); }, []);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || !simData) return;
    const total = simData.frames.length || 1;
    const id = setInterval(() => {
      setFrameIndex(p => {
        if (p >= total - 1) {
          setIsPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 900);
    return () => clearInterval(id);
  }, [isPlaying, simData]);

  const handleNodeClick = (_: any, node: any) => {
    if (node.id === simData?.ids?.cId) {
      // clicking Client → restart simulation
      setFrameIndex(0);
      setIsPlaying(true);
      setHasStarted(true);
    }
  };

  const nodes = useMemo<Node[]>(() => {
    if (!simData) return [];
    const f = simData.frames[frameIndex];
    const active = (id: string) => f?.from === id || f?.to === id;
    const { cId, lbId, s1, s2, s3 } = simData.ids;
    return [
      { id: cId,  type: "heroNode", position: { x: 20,  y: 165 }, data: { label: "Client",       type: "client",        isActive: active(cId)  }, sourcePosition: Position.Right, targetPosition: Position.Left },
      { id: lbId, type: "heroNode", position: { x: 230, y: 165 }, data: { label: "Load Balancer", type: "load-balancer", isActive: active(lbId) }, sourcePosition: Position.Right, targetPosition: Position.Left },
      { id: s1,   type: "heroNode", position: { x: 450, y: 30  }, data: { label: "Web Server 1",  type: "server",        isActive: active(s1)   }, sourcePosition: Position.Right, targetPosition: Position.Left },
      { id: s2,   type: "heroNode", position: { x: 450, y: 165 }, data: { label: "Web Server 2",  type: "server",        isActive: active(s2)   }, sourcePosition: Position.Right, targetPosition: Position.Left },
      { id: s3,   type: "heroNode", position: { x: 450, y: 300 }, data: { label: "Web Server 3",  type: "server",        isActive: active(s3)   }, sourcePosition: Position.Right, targetPosition: Position.Left },
    ];
  }, [simData, frameIndex]);

  const edges = useMemo<Edge[]>(() => {
    if (!simData) return [];
    const { cId, lbId, s1, s2, s3 } = simData.ids;
    const f = simData.frames[frameIndex];
    const BASE = new Set([`${cId}->${lbId}`, `${lbId}->${s1}`, `${lbId}->${s2}`, `${lbId}->${s3}`]);
    const activeMap = new Map<string, boolean>();
    if (f?.from && f?.to) {
      const d = `${f.from}->${f.to}`, r = `${f.to}->${f.from}`;
      if (BASE.has(d)) activeMap.set(d, false);
      else if (BASE.has(r)) activeMap.set(r, true);
    }
    return [
      { id: `${cId}->${lbId}`, source: cId,  target: lbId, type: "packet" },
      { id: `${lbId}->${s1}`,  source: lbId, target: s1,   type: "packet" },
      { id: `${lbId}->${s2}`,  source: lbId, target: s2,   type: "packet" },
      { id: `${lbId}->${s3}`,  source: lbId, target: s3,   type: "packet" },
    ].map(e => {
      const rev = activeMap.get(e.id);
      const isAct = activeMap.has(e.id);
      return {
        ...e,
        data: { active: isAct, reverseMotion: rev ?? false, packetDuration: 0.9, frameIndex, packetCount: isAct ? 1 : 0 },
        style: { stroke: isAct ? (rev ? "#f59e0b" : "#8b5cf6") : "rgba(148,163,184,.2)", strokeWidth: isAct ? 2 : 1.5, transition: "all .15s ease" },
      };
    });
  }, [simData, frameIndex]);

  if (!simData || nodes.length === 0) return null;

  const { frames } = simData;
  const cur = frames[frameIndex];
  const total = frames.length;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)]/40 bg-[var(--surface-muted)]/30 backdrop-blur"
      style={{ height: 400 }}>
      {/* glow blobs */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-violet-500/10 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-500/10 blur-[50px]" />

      {/* initial state hint */}
      {!hasStarted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-violet-500/25 bg-[var(--surface)]/90 px-6 py-4 backdrop-blur-sm shadow-xl">
            <span className="text-2xl">▶</span>
            <p className="text-xs font-semibold text-violet-400">Click the <b>"Client"</b> node to start</p>
          </div>
        </div>
      )}

      <div className="relative z-10 h-full">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={NODE_TYPES} edgeTypes={{ packet: PacketEdge }}
          fitView fitViewOptions={{ padding: 0.22 }} nodesDraggable={false} nodesConnectable={false}
          elementsSelectable={false} panOnDrag zoomOnScroll zoomOnPinch
          onNodeClick={handleNodeClick}
          style={{ background: "transparent", width: "100%", height: "100%" }}>
          <Background variant={BackgroundVariant.Dots} gap={20} size={0.6} color="rgba(148,163,184,.08)" />
        </ReactFlow>
      </div>

      {/* bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-3
        border-t border-[var(--border)]/30 bg-[var(--surface)]/85 px-4 py-2.5 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-2.5">
          <button onClick={() => { setIsPlaying(p => !p); setHasStarted(true); }}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition text-[11px]">
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={() => { setFrameIndex(0); setIsPlaying(false); setHasStarted(false); }}
            className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]/50 text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] transition font-mono">Reset</button>
          <span className="text-[color:var(--foreground)]/40">Frame {frameIndex + 1}/{total}</span>
          <input type="range" min={0} max={Math.max(total - 1, 0)} value={frameIndex}
            onChange={e => { setFrameIndex(+e.target.value); setIsPlaying(false); setHasStarted(+e.target.value > 0); }}
            className="h-0.5 w-20 accent-violet-500" />
        </div>
        {hasStarted && cur && (
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-[color:var(--foreground)]/50">
            <span className="status-dot" />
            <span className="truncate max-w-[180px]">{cur.from} → {cur.to}</span>
          </div>
        )}
        {!hasStarted && (
          <span className="text-[10px] text-violet-400/70 font-medium hidden sm:block">Click Client node to start</span>
        )}
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-violet-400 bg-violet-500/10">{isPlaying ? "RUNNING" : "READY"}</span>
      </div>
    </div>
  );
}

function buildSim() {
  const uid = new ShortUniqueId({ length: 6 });
  const graph = new GraphManager(uid.rnd(6));
  const registry = new NodeRegistry(uid.rnd(6));
  const ipv4 = new Ipv4Generator();

  const ids = { cId: "c-1", lbId: "lb-1", s1: "s-1", s2: "s-2", s3: "s-3" };
  const { cId, lbId, s1, s2, s3 } = ids;

  const lb = new LoadBalancerModel(lbId, "LB", new RoundRobinStrategy());
  registry.register(cId,  new ClientModel(cId, "Client"));
  registry.register(lbId, lb);
  registry.register(s1,   new ServerModel(s1, "S1"));
  registry.register(s2,   new ServerModel(s2, "S2"));
  registry.register(s3,   new ServerModel(s3, "S3"));

  [cId, lbId, s1, s2, s3].forEach(id => graph.addNode(id, id));
  graph.addEdge(cId, lbId); graph.addEdge(lbId, s1); graph.addEdge(lbId, s2); graph.addEdge(lbId, s3);

  const allFrames: any[] = [];
  for (let i = 0; i < 4; i++) {
    const ip = ipv4.getRandomIpv4() as string;
    const sim = new SimulationManager(graph, registry, {}, ip);
    sim.runSimulation(cId);
    allFrames.push(...(sim.getFrames() as any[]).map(f => ({ ...f, ip })));
  }
  return { frames: allFrames, ids };
}

// ─── Ticker bar ──────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    "⚖️  Load Balancing — Round Robin · IP Hash · Least-Conn",
    "🗄️  Cache-Aside — Redis hit/miss · DB fallback · TTL eviction",
    "🚪  API Gateway — Path routing · Rate limiting · Service pools",
    "🔑  Valet Key — Token issuance · Direct cloud-storage upload",
    "🛠️  Custom Sandbox — Build & test any topology",
    "📚  Interactive Docs — Learn by running live simulations",
  ];
  const all = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="ticker-wrap border-y border-[var(--border)]/30 bg-[var(--surface-muted)]/20 py-2.5 text-[11px] font-medium text-[color:var(--foreground)]/50">
      <div className="ticker-track">
        {all.map((t, i) => (
          <span key={i} className="mx-8 shrink-0">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── What It Does section ─────────────────────────────────────────────────────
function WhatItDoes() {
  const points = [
    {
      icon: "⚡",
      color: "#6366f1",
      title: "Run real simulations",
      body: "The engine actually runs your distributed system. Requests hop from Client → Load Balancer → Server → Redis → Postgres — not just drawn arrows.",
    },
    {
      icon: "🎞️",
      color: "#8b5cf6",
      title: "Frame-by-frame playback",
      body: "Every request hop becomes a playback frame. Pause at any moment, scrub backwards, or fast-forward. See exactly what happened and why.",
    },
    {
      icon: "🔬",
      color: "#06b6d4",
      title: "Inspect node state",
      body: "Open any node's inspector. See Redis key snapshots, server load, capacity, request queues — all updating live as the simulation runs.",
    },
    {
      icon: "📚",
      color: "#10b981",
      title: "Learn as you simulate",
      body: "Each concept has a guided doc page with a live sim embedded. Read the theory, trigger the failure, watch the recovery — all on one screen.",
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-violet-400">What makes it different</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--foreground)" }}>
            Not a diagram tool.<br />A running system.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: "var(--foreground)", opacity: 0.6 }}>
            Most system design tools let you draw boxes and arrows. FlowFrame actually runs the logic, captures every hop, and plays it back so you can see what's happening inside.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="card-glow group flex gap-5 rounded-2xl border border-[var(--border)]/40 bg-[var(--surface)]/40 p-7 backdrop-blur transition-all duration-300">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}>
                  {p.icon}
                </div>
                <div>
                  <h3 className="mb-2 text-base font-bold" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ─── V1 Scenarios section ─────────────────────────────────────────────────────
function V1Scenarios() {
  const router = useRouter();
  const scenes = [
    {
      id: "simple-load-balancer",
      icon: "⚖️",
      color: "#3b82f6",
      accent: "rgba(59,130,246,.12)",
      label: "Load Balancing",
      tag: "v1 · Live",
      desc: "Watch Round Robin and IP Hash distribute requests across 3 servers. Drag capacity to 0 to see failover in action.",
      chips: ["Round Robin", "IP Hash", "Failover"],
    },
    {
      id: "simple-cache",
      icon: "🗄️",
      color: "#f59e0b",
      accent: "rgba(245,158,11,.12)",
      label: "Cache-Aside",
      tag: "v1 · Live",
      desc: "Three deterministic requests: cache hit, cache miss → DB fallback, and invalid key. See Redis snapshots update frame-by-frame.",
      chips: ["Redis Hit/Miss", "DB Fallback", "TTL"],
    },
    {
      id: "simple-api-gateway",
      icon: "🚪",
      color: "#8b5cf6",
      accent: "rgba(139,92,246,.12)",
      label: "API Gateway",
      tag: "v1 · Live",
      desc: "Path-based routing with server pools. Set a server's capacity to 0 and watch the gateway return 503 automatically.",
      chips: ["Path Routing", "Rate Limiting", "503 Failover"],
    },
    {
      id: "simple-valet-key",
      icon: "🔑",
      color: "#10b981",
      accent: "rgba(16,185,129,.12)",
      label: "Valet Key Pattern",
      tag: "v1 · Live",
      desc: "Client requests a signed upload token from the server. Server issues it. Client uploads directly to cloud storage — no proxy.",
      chips: ["Token Issuance", "Direct Upload", "Cloud Storage"],
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-400">Supported in v1</p>
            <span className="v1-badge rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-violet-300">4 SCENARIOS</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--foreground)" }}>
            Pick a scenario. Hit play.
          </h2>
          <p className="mt-3 max-w-lg text-base" style={{ color: "var(--foreground)", opacity: 0.6 }}>
            Each scenario is pre-wired with real engine logic. Just select one and watch the architecture run.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {scenes.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.08}>
              <div
                onClick={() => router.push(`/scenarios/${s.id}`)}
                className="scene-card card-glow group relative cursor-pointer rounded-2xl border border-[var(--border)]/40 p-6 backdrop-blur transition-all"
                style={{ background: `linear-gradient(135deg, ${s.accent}, transparent)` }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: `${s.color}20`, border: `1px solid ${s.color}30` }}>
                    {s.icon}
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider"
                    style={{ background: `${s.color}18`, color: s.color }}>
                    {s.tag}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.label}</h3>
                <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>{s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.chips.map(c => (
                    <span key={c} className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}25` }}>
                      {c}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center text-xs font-bold transition-all"
                  style={{ color: s.color, opacity: 0.7 }}>
                  Open Simulator
                  <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ─── Learn + Sandbox split section ────────────────────────────────────────────
function LearnAndSandbox() {
  const router = useRouter();
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Learn */}
          <div
            className="card-glow group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)]/40 p-8 backdrop-blur transition-all"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,.08), rgba(139,92,246,.04))" }}
            onClick={() => router.push("/learn")}
          >
            <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-violet-500/10 blur-[50px]" />
            <div className="relative z-10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl border border-violet-500/20">
                📚
              </div>
              <h3 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Interactive Docs</h3>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                Guided learning for each distributed system concept — theory on the left, live simulation on the right. Read the explanation, trigger the scenario, watch it run.
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {["Load Balancers", "Cache-Aside", "API Gateways", "Valet Key"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                    <span className="h-1 w-1 rounded-full bg-violet-400 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-violet-500/15 px-4 py-2 text-sm font-bold text-violet-400 transition group-hover:bg-violet-500/25">
                Start Learning <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>

          {/* Sandbox */}
          <div
            className="card-glow group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)]/40 p-8 backdrop-blur transition-all"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,.08), rgba(6,182,212,.04))" }}
            onClick={() => router.push("/workspace")}
          >
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-[50px]" />
            <div className="relative z-10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl border border-emerald-500/20">
                🛠️
              </div>
              <h3 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Custom Sandbox</h3>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                Drag & drop any component — Clients, Load Balancers, Servers, Redis, Postgres, API Gateways — and wire up your own topology. Then run it.
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {["Drag & drop canvas", "Custom connections", "Run any topology", "Live inspection"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                    <span className="h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-400 transition group-hover:bg-emerald-500/25">
                Open Sandbox <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ─── V1 honest section ────────────────────────────────────────────────────────
function V1Status() {
  const supported = [
    "Round Robin load balancing",
    "IP Hash load balancing",
    "Capacity-based server failover",
    "Cache-Aside pattern (Redis)",
    "Database fallback (Postgres)",
    "API Gateway path routing",
    "Valet Key token issuance",
    "Frame-by-frame playback",
    "Node state inspector",
    "Custom sandbox canvas",
    "Interactive learning docs",
    "Dark / Light mode",
  ];
  const coming = [
    "More LB strategies (Least Conn, Weighted RR)",
    "Circuit Breaker & Retry patterns",
    "Saga / distributed transaction flows",
    "Message Queue simulations (Kafka, RabbitMQ)",
    "Multi-region & CDN scenarios",
    "User-shareable scenario links",
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-[var(--border)]/40 p-8 md:p-10 backdrop-blur"
          style={{ background: "var(--surface-muted)", opacity: 1 }}>
          <div className="mb-8 flex items-center gap-3">
            <div className="v1-badge rounded-full px-3 py-1 text-xs font-bold tracking-wider text-violet-300">Version 1.0</div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)", opacity: 0.7 }}>What's supported right now</p>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.15em] text-emerald-400">✓ Supported</p>
              <ul className="space-y-2.5">
                {supported.map(s => (
                  <li key={s} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--foreground)", opacity: 0.75 }}>
                    <span className="mt-0.5 h-4 w-4 shrink-0 flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[10px]">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.15em] text-amber-400">⏳ Coming next</p>
              <ul className="space-y-2.5">
                {coming.map(s => (
                  <li key={s} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--foreground)", opacity: 0.55 }}>
                    <span className="mt-0.5 h-4 w-4 shrink-0 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-[10px]">○</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function CTA() {
  const router = useRouter();
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-4">
        <div className="relative overflow-hidden rounded-3xl p-10 text-center md:p-16"
          style={{ background: "linear-gradient(135deg, #4f46e5cc, #7c3aedcc, #0891b2cc)" }}>
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to see your architecture run?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-white/75">
              Pick a scenario, hit play, and watch every hop of every request — live.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => router.push("/scenarios")} className="btn-primary rounded-xl px-7 py-3 text-sm font-bold text-white">
                Launch Simulator →
              </button>
              <button onClick={() => router.push("/learn")} className="rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20 transition">
                Start Learning
              </button>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const s = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (s === "light" || s === "dark") {
      setTheme(s);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  return (
    <main className="relative min-h-screen overflow-x-hidden" style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), system-ui, sans-serif)" }}>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {/* ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 dot-grid opacity-60" />
      <div className="pointer-events-none fixed -left-32 -top-32 -z-10 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[100px]" />
      <div className="pointer-events-none fixed -right-24 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 -z-10 h-[300px] w-[300px] rounded-full bg-cyan-600/6 blur-[80px]" />

      <SiteHeader theme={theme} onToggleTheme={() => setTheme(p => p === "dark" ? "light" : "dark")} />

      {/* ── HERO ── */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-6">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* left copy */}
          <div className="slide-l" style={{ animationDelay: ".05s" }}>
            {/* badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-violet-400">
              <span className="status-dot" />
              Distributed System Simulator
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.06] tracking-[-0.02em] md:text-6xl lg:text-[4rem]">
              <span className="grad-text">FlowFrame</span>
            </h1>

            <p className="mt-3 text-xl font-medium" style={{ color: "var(--foreground)", opacity: 0.85 }}>
              See your backend architecture run.
            </p>
            <p className="mt-3 max-w-lg text-base leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.58 }}>
              FlowFrame simulates distributed system patterns — load balancing, caching, API gateways — and plays them back frame by frame. Not just diagrams. Actual running logic you can pause, inspect, and learn from.
            </p>

            {/* who it's for */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["Engineers", "System Design learners", "Tech interviewees", "Educators"].map(r => (
                <span key={r} className="rounded-full border border-[var(--border)]/50 bg-[var(--surface)]/60 px-3 py-1 text-xs font-semibold"
                  style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  {r}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => router.push("/scenarios")}
                className="btn-primary rounded-2xl px-7 py-3.5 text-sm font-bold text-white">
                Explore Scenarios →
              </button>
              <button onClick={() => router.push("/learn")}
                className="btn-outline rounded-2xl px-7 py-3.5 text-sm font-bold"
                style={{ color: "var(--foreground)", background: "var(--surface)" }}>
                Start Learning
              </button>
              <button onClick={() => router.push("/workspace")}
                className="btn-outline rounded-2xl px-7 py-3.5 text-sm font-bold"
                style={{ color: "var(--foreground)", background: "var(--surface)" }}>
                Open Sandbox
              </button>
            </div>

            {/* v1 callout */}
            <p className="mt-6 text-[11px] font-medium" style={{ color: "var(--foreground)", opacity: 0.38 }}>
              v1.0.1 — 4 scenarios supported + Postgres Pools · More patterns coming
            </p>
          </div>

          {/* right: live sim */}
          <div className="slide-r" style={{ animationDelay: ".15s" }}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold" style={{ color: "var(--foreground)", opacity: 0.45 }}>Live simulation preview</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="status-dot" /> Running
              </span>
            </div>
            <HeroSim />
            <p className="mt-2 text-center text-[10px]" style={{ color: "var(--foreground)", opacity: 0.3 }}>
              Round Robin · 3 servers · Real engine output
            </p>
          </div>
        </div>
      </section>

      {/* Featured On Section */}
      {/* Social Proof */}
      <div className="mt-1 mb-8 flex flex-wrap items-center justify-center gap-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Trusted by developers on
        </span>

        <a
          href="https://peerlist.io/ndk18/project/flowframe--distributed-systems-simulator"
          target="_blank"
          rel="noreferrer"
          className="transition-transform hover:scale-105"
        >
          <img
            src={`https://peerlist.io/api/v1/projects/embed/PRJH9OBK9MBOPLMJ8FD6ABOL8LRR6R?showUpvote=false&theme=${theme}`}
            alt="Peerlist"
            className="h-12 md:h-14 w-auto"
          />
        </a>

        <a
          href="https://www.producthunt.com/products/flowframe/reviews/new"
          target="_blank"
          rel="noreferrer"
          className="transition-transform hover:scale-105"
        >
          <img
            src={`https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1247866&theme=${theme}`}
            alt="Product Hunt"
            className="h-10 md:h-12 w-auto"
          />
        </a>
      </div>
              
      {/* ── TICKER ── */}
      <Ticker />

      {/* ── SECTIONS ── */}
      <WhatItDoes />
      <V1Scenarios />
      <LearnAndSandbox />
      <V1Status />
      <CTA />

      <SiteFooter />
    </main>
  );
}
