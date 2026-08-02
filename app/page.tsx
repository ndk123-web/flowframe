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
import {
  ZapIcon,
  CodeIcon,
  NodeLinkIcon,
  ScaleIcon,
  InboxIcon,
  BroadcastIcon,
  DatabaseIcon,
  DocsIcon,
  FilmIcon,
  SandboxIcon,
  CartIcon,
  ChatIcon,
  CreditCardIcon,
} from "@/components/DashboardIcons";

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
  }
`;

// ─── Custom Animated Edge ───────────────────────────────────────────────────
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <circle r="4" fill="#a78bfa" className="ping-ring">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}

const edgeTypes = { animated: AnimatedEdge };

// ─── Custom Landing Nodes ─────────────────────────────────────────────────────
function LandingClientNode({ data }: { data: { label: string; sub: string } }) {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg backdrop-blur min-w-[130px] transition hover:scale-105">
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-2.5 !h-2.5" />
      <ComponentIcon type="client" className="h-6 w-6 text-indigo-400 mb-1" />
      <span className="text-xs font-bold text-[color:var(--foreground)]">{data.label}</span>
      <span className="text-[10px] text-[color:var(--foreground)]/50 font-mono">{data.sub}</span>
    </div>
  );
}

function LandingLBNode({ data }: { data: { label: string; sub: string } }) {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-3 shadow-lg backdrop-blur min-w-[140px] transition hover:scale-105">
      <Handle type="target" position={Position.Left} className="!bg-indigo-400 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-2.5 !h-2.5" />
      <ComponentIcon type="load-balancer" className="h-6 w-6 text-indigo-400 mb-1" />
      <span className="text-xs font-bold text-indigo-300">{data.label}</span>
      <span className="text-[10px] text-indigo-200/60 font-mono">{data.sub}</span>
    </div>
  );
}

function LandingServerNode({ data }: { data: { label: string; sub: string; active?: boolean } }) {
  return (
    <div className={`relative flex flex-col items-center justify-center rounded-2xl border p-3 shadow-lg backdrop-blur min-w-[130px] transition hover:scale-105 ${
      data.active ? "border-emerald-500/50 bg-emerald-500/10" : "border-[var(--border)] bg-[var(--surface)]"
    }`}>
      <Handle type="target" position={Position.Left} className="!bg-violet-400 !w-2.5 !h-2.5" />
      <ComponentIcon type="server" className={`h-6 w-6 mb-1 ${data.active ? "text-emerald-400" : "text-violet-400"}`} />
      <span className="text-xs font-bold text-[color:var(--foreground)]">{data.label}</span>
      <span className="text-[10px] text-[color:var(--foreground)]/50 font-mono">{data.sub}</span>
    </div>
  );
}

const nodeTypes = {
  landingClient: LandingClientNode,
  landingLB: LandingLBNode,
  landingServer: LandingServerNode,
};

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVis(true); obs.unobserve(el); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Interactive Hero Simulation ──────────────────────────────────────────────
const uid = new ShortUniqueId({ length: 6 });

function buildDemoNodesAndEdges() {
  const nodes: Node[] = [
    { id: "c1", type: "landingClient", position: { x: 40,  y: 40  }, data: { label: "Client 1", sub: "Web App" } },
    { id: "c2", type: "landingClient", position: { x: 40,  y: 260 }, data: { label: "Client 2", sub: "Mobile"  } },
    { id: "lb", type: "landingLB",     position: { x: 260, y: 150 }, data: { label: "Load Balancer", sub: "Round Robin" } },
    { id: "s1", type: "landingServer", position: { x: 500, y: 20  }, data: { label: "Server A", sub: "Node.js", active: true  } },
    { id: "s2", type: "landingServer", position: { x: 500, y: 150 }, data: { label: "Server B", sub: "Go App",  active: false } },
    { id: "s3", type: "landingServer", position: { x: 500, y: 280 }, data: { label: "Server C", sub: "Rust Server", active: false } },
  ];

  const edges: Edge[] = [
    { id: "e-c1-lb", source: "c1", target: "lb", type: "animated", style: { stroke: "#6366f1", strokeWidth: 2 } },
    { id: "e-c2-lb", source: "c2", target: "lb", type: "animated", style: { stroke: "#6366f1", strokeWidth: 2 } },
    { id: "e-lb-s1", source: "lb", target: "s1", type: "animated", style: { stroke: "#8b5cf6", strokeWidth: 2 } },
    { id: "e-lb-s2", source: "lb", target: "s2", type: "animated", style: { stroke: "#8b5cf6", strokeWidth: 2 } },
    { id: "e-lb-s3", source: "lb", target: "s3", type: "animated", style: { stroke: "#8b5cf6", strokeWidth: 2 } },
  ];

  return { nodes, edges };
}

// ─── Ticker bar ──────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    { text: "FlowFrame DSL (.flow) — Declarative architecture compiler & engine", icon: <ZapIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" /> },
    { text: "Monaco Code Editor — Real-time syntax highlighting & autocompletion", icon: <CodeIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> },
    { text: "API Gateway — Path-based routing to Server & LoadBalancer clusters", icon: <NodeLinkIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> },
    { text: "Load Balancing — Round Robin & IP Hash traffic distribution", icon: <ScaleIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
    { text: "RabbitMQ Queue — Asynchronous message buffering & consumer prefetch", icon: <InboxIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" /> },
    { text: "PubSub Broker — Multi-subscriber event fan-out & topic channels", icon: <BroadcastIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> },
    { text: "Cache-Aside — Redis hit/miss & PostgreSQL database fallback", icon: <DatabaseIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" /> },
    { text: "Interactive Docs (/docs) — FastAPI-style comprehensive language reference", icon: <DocsIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" /> },
  ];
  const all = [...items, ...items];
  return (
    <div className="ticker-wrap border-y border-[var(--border)]/30 bg-[var(--surface-muted)]/20 py-3 text-[11px] font-medium text-[color:var(--foreground)]/70">
      <div className="ticker-track hover:[animation-play-state:paused] cursor-pointer">
        {all.map((t, i) => (
          <span
            key={i}
            className="mx-4 shrink-0 rounded-full border border-[var(--border)]/50 bg-[var(--surface)]/60 px-3.5 py-1 text-xs font-semibold backdrop-blur shadow-sm inline-flex items-center gap-2"
          >
            {t.icon} {t.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── What It Does section ─────────────────────────────────────────────────────
function WhatItDoes() {
  const points = [
    {
      icon: <ZapIcon className="w-6 h-6 text-indigo-400" />,
      color: "#6366f1",
      title: "Run real simulations",
      body: "The engine actually runs your distributed system. Requests hop from Client → Load Balancer → Server → Redis → Postgres — not just drawn arrows.",
    },
    {
      icon: <FilmIcon className="w-6 h-6 text-violet-400" />,
      color: "#8b5cf6",
      title: "Frame-by-frame playback",
      body: "Every request hop becomes a playback frame. Pause at any moment, scrub backwards, or fast-forward. See exactly what happened and why.",
    },
    {
      icon: <SandboxIcon className="w-6 h-6 text-cyan-400" />,
      color: "#06b6d4",
      title: "Inspect node state",
      body: "Open any node's inspector. See Redis key snapshots, server load, capacity, request queues — all updating live as the simulation runs.",
    },
    {
      icon: <DocsIcon className="w-6 h-6 text-emerald-400" />,
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
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

// ─── V2 Scenarios section ─────────────────────────────────────────────────────
function V1Scenarios() {
  const router = useRouter();
  const scenes = [
    {
      id: "simple-load-balancer",
      icon: <ScaleIcon className="w-6 h-6 text-blue-400" />,
      color: "#3b82f6",
      accent: "rgba(59,130,246,.12)",
      label: "Load Balancing",
      tag: "v2.0 · Live",
      desc: "Watch Round Robin and IP Hash distribute requests across 3 servers. Drag capacity to 0 to see failover in action.",
      chips: ["Round Robin", "IP Hash", "Failover"],
    },
    {
      id: "simple-cache",
      icon: <DatabaseIcon className="w-6 h-6 text-amber-400" />,
      color: "#f59e0b",
      accent: "rgba(245,158,11,.12)",
      label: "Cache-Aside",
      tag: "v2.0 · Live",
      desc: "Three deterministic requests: cache hit, cache miss → DB fallback, and invalid key. See Redis snapshots update frame-by-frame.",
      chips: ["Redis Hit/Miss", "DB Fallback", "TTL"],
    },
    {
      id: "simple-api-gateway",
      icon: <NodeLinkIcon className="w-6 h-6 text-purple-400" />,
      color: "#8b5cf6",
      accent: "rgba(139,92,246,.12)",
      label: "API Gateway",
      tag: "v2.0 · Live",
      desc: "Path-based routing with server & LoadBalancer pools. Set a server's capacity to 0 and watch gateway failover.",
      chips: ["Path Routing", "LoadBalancer Target", "503 Failover"],
    },
    {
      id: "simple-valet-key",
      icon: <ZapIcon className="w-6 h-6 text-emerald-400" />,
      color: "#10b981",
      accent: "rgba(16,185,129,.12)",
      label: "Valet Key Pattern",
      tag: "v2.0 · Live",
      desc: "Client requests a signed upload token from the server. Server issues it. Client uploads directly to cloud storage — no proxy.",
      chips: ["Token Issuance", "Direct Upload", "Cloud Storage"],
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-400">Supported in v2.0</p>
            <span className="v1-badge rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-violet-300">v2.0.0 RELEASE</span>
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
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

// ─── Learn & Sandbox section ─────────────────────────────────────────────────
function LearnAndSandbox() {
  const router = useRouter();
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {/* Learn Docs */}
          <div
            className="card-glow group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)]/40 p-8 backdrop-blur transition-all"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,.08), rgba(139,92,246,.04))" }}
            onClick={() => router.push("/docs")}
          >
            <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-violet-500/10 blur-[50px]" />
            <div className="relative z-10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/20">
                <DocsIcon className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>FlowFrame DSL Docs</h3>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                Explore language specifications, syntax rules, schema specs for all 8 component nodes, and copy-pasteable flagship architecture scripts.
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-violet-500/15 px-4 py-2 text-sm font-bold text-violet-400 transition group-hover:bg-violet-500/25">
                Read DSL Docs (/docs) <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>

          {/* Learn Scenarios */}
          <div
            className="card-glow group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)]/40 p-8 backdrop-blur transition-all"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,.08), rgba(192,132,252,.04))" }}
            onClick={() => router.push("/learn")}
          >
            <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-purple-500/10 blur-[50px]" />
            <div className="relative z-10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/20">
                <FilmIcon className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Guided Scenarios</h3>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                Guided learning for each distributed system concept — theory on the left, live simulation on the right.
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-purple-500/15 px-4 py-2 text-sm font-bold text-purple-400 transition group-hover:bg-purple-500/25">
                Start Scenarios <span className="transition-transform group-hover:translate-x-1">→</span>
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
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
                <ZapIcon className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Monaco DSL Sandbox</h3>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                Write code in Monaco Editor using FlowFrame DSL or drag & drop nodes on canvas. Run live system simulations instantly.
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-400 transition group-hover:bg-emerald-500/25">
                Open Workspace <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildDemoNodesAndEdges(), []);

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300 overflow-x-hidden">
      <style>{animationStyles}</style>

      {/* Header */}
      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
        showHomeLink={false}
      />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />

        {/* v1.0 Badge */}
        <div className="fade-up inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300 shadow-sm backdrop-blur mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider text-violet-400 font-bold">FlowFrame v2.0.0 Live</span>
          <span className="text-violet-400/60 font-normal">|</span>
          <span className="text-violet-200">Monaco DSL Compiler & Interactive Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="fade-up mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.08]"
          style={{ animationDelay: ".05s", color: "var(--foreground)" }}>
          Design distributed systems.<br />
          <span className="grad-text">Simulate every frame.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="fade-up mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed"
          style={{ animationDelay: ".1s", color: "var(--foreground)", opacity: 0.65 }}>
          FlowFrame is an interactive visual simulator for distributed architecture logic. Watch requests route through API Gateways, load balancers, server pools, Redis caches, and message queues in real time.
        </p>

        {/* CTAs */}
        <div className="fade-up mt-10 flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: ".15s" }}>
          <button
            onClick={() => router.push("/workspace")}
            className="btn-primary flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-xl cursor-pointer"
          >
            <ZapIcon className="w-4 h-4 text-white" /> Open Sandbox Studio
            <span className="text-xs opacity-75 font-mono">(/workspace)</span>
          </button>
          <button
            onClick={() => router.push("/docs")}
            className="btn-outline flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold cursor-pointer"
            style={{ color: "var(--foreground)", background: "var(--surface)" }}
          >
            <DocsIcon className="w-4 h-4 text-violet-400" /> Read DSL Language Specs
          </button>
        </div>

        {/* Hero Interactive Diagram Preview */}
        <div className="fade-up mt-14 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-3 shadow-2xl backdrop-blur" style={{ animationDelay: ".2s" }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]/40 text-xs font-mono text-[color:var(--foreground)]/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-bold text-[color:var(--foreground)]">demo-cluster.flow</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="status-dot" /> Round-Robin Load Balancing
            </div>
          </div>
          <div className="h-[360px] w-full rounded-2xl overflow-hidden dot-grid">
            <ReactFlow
              nodes={initialNodes}
              edges={initialEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              preventScrolling
              nodesDraggable={false}
              nodesConnectable={false}
              zoomOnScroll={false}
              panOnDrag={false}
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
            </ReactFlow>
          </div>
        </div>
      </section>

      {/* Ticker bar */}
      <Ticker />

      {/* What It Does */}
      <WhatItDoes />

      {/* Scenarios */}
      <V1Scenarios />

      {/* Learn & Sandbox */}
      <LearnAndSandbox />

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
