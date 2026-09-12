"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ArchitectureBackground from "@/components/ArchitectureBackground";
import { ComponentIcon } from "@/components/ComponentIcons";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
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
} from "@/components/DashboardIcons";

// ─── Animated Edge with Glowing Packet ────────────────────────────────────────
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
      <circle r="3.5" fill="#3b82f6" filter="drop-shadow(0 0 3px #3b82f6)">
        <animateMotion dur="2.2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}

const edgeTypes = { animated: AnimatedEdge };

// ─── Clean Architecture Node Component (No IP addresses) ───────────────────────
interface DemoNodeData {
  iconType: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  active?: boolean;
}

function DemoNode({ data }: { data: DemoNodeData }) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-3 shadow-sm min-w-[130px] transition-all select-none ${
        data.active
          ? "border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)]/25"
          : "border-[var(--border-strong)] bg-[var(--surface)]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[var(--accent)] !w-2 !h-2 !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--accent)] !w-2 !h-2 !border-0"
      />

      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <ComponentIcon
            type={data.iconType}
            className="h-4 w-4 text-[color:var(--accent)] shrink-0"
          />
          <span className="text-[11px] font-bold text-[color:var(--foreground)] truncate">
            {data.title}
          </span>
        </div>
        {data.badge && (
          <span
            className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border shrink-0 ${
              data.badgeColor ||
              "text-[color:var(--muted)] border-[var(--border)] bg-[var(--bg-elevated)]"
            }`}
          >
            {data.badge}
          </span>
        )}
      </div>

      {data.subtitle && (
        <div className="text-[10px] font-mono text-[color:var(--muted)]">
          <span className="truncate block">{data.subtitle}</span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { demoNode: DemoNode };

// ─── Single Load Balancer Scenario (Parallel Distribution, No Ports) ─────────
function buildLoadBalancerDemo() {
  const nodes: Node[] = [
    {
      id: "client",
      type: "demoNode",
      position: { x: 30, y: 120 },
      data: {
        iconType: "client",
        title: "Client",
        subtitle: "2 Requests",
      },
    },
    {
      id: "lb",
      type: "demoNode",
      position: { x: 260, y: 120 },
      data: {
        iconType: "load-balancer",
        title: "Load Balancer",
        subtitle: "Distributing",
        active: true,
      },
    },
    {
      id: "s1",
      type: "demoNode",
      position: { x: 500, y: 40 },
      data: {
        iconType: "server",
        title: "Server 1",
        subtitle: "Request #1",
        badge: "Processing",
        badgeColor: "text-[color:var(--accent)] border-[var(--accent)]/25 bg-[var(--accent)]/10",
        active: true,
      },
    },
    {
      id: "s2",
      type: "demoNode",
      position: { x: 500, y: 190 },
      data: {
        iconType: "server",
        title: "Server 2",
        subtitle: "Request #2",
        badge: "Processing",
        badgeColor: "text-[color:var(--accent)] border-[var(--accent)]/25 bg-[var(--accent)]/10",
        active: true,
      },
    },
  ];

  // 2 Parallel animated streams leaving the Load Balancer to Server 1 & Server 2
  const edges: Edge[] = [
    {
      id: "e-client-lb",
      source: "client",
      target: "lb",
      type: "animated",
      style: { stroke: "#3b82f6", strokeWidth: 2, strokeOpacity: 0.9 },
    },
    {
      id: "e-lb-s1",
      source: "lb",
      target: "s1",
      type: "animated",
      style: { stroke: "#3b82f6", strokeWidth: 2, strokeOpacity: 0.9 },
    },
    {
      id: "e-lb-s2",
      source: "lb",
      target: "s2",
      type: "animated",
      style: { stroke: "#3b82f6", strokeWidth: 2, strokeOpacity: 0.9 },
    },
  ];

  return { nodes, edges };
}

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVis(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.5s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Feature Ticker ───────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    { text: "FlowFrame DSL (.flow) — Declarative architecture compiler & engine", icon: <ZapIcon className="w-3 h-3 text-[color:var(--accent)] shrink-0" /> },
    { text: "Monaco Code Editor — Real-time syntax highlighting & autocompletion", icon: <CodeIcon className="w-3 h-3 text-[color:var(--green)] shrink-0" /> },
    { text: "API Gateway — Path-based routing to Server & LoadBalancer clusters", icon: <NodeLinkIcon className="w-3 h-3 text-[color:var(--muted)] shrink-0" /> },
    { text: "Load Balancing — Round Robin & IP Hash traffic distribution", icon: <ScaleIcon className="w-3 h-3 text-[color:var(--amber)] shrink-0" /> },
    { text: "RabbitMQ Queue — Asynchronous message buffering & consumer prefetch", icon: <InboxIcon className="w-3 h-3 text-[color:var(--red)] shrink-0" /> },
    { text: "PubSub Broker — Multi-subscriber event fan-out & topic channels", icon: <BroadcastIcon className="w-3 h-3 text-[color:var(--accent)] shrink-0" /> },
    { text: "Cache-Aside — Redis hit/miss & PostgreSQL database fallback", icon: <DatabaseIcon className="w-3 h-3 text-[color:var(--muted)] shrink-0" /> },
    { text: "Interactive Docs (/docs) — Comprehensive language reference & API schemas", icon: <DocsIcon className="w-3 h-3 text-[color:var(--green)] shrink-0" /> },
  ];
  const all = [...items, ...items];
  return (
    <div className="ticker-wrap border-y border-[var(--border)] bg-[var(--bg-elevated)] py-3">
      <div className="ticker-track hover:[animation-play-state:paused] cursor-default">
        {all.map((t, i) => (
          <span
            key={i}
            className="mx-4 shrink-0 inline-flex items-center gap-2 text-[11px] font-medium text-[color:var(--muted)]"
          >
            {t.icon}
            <span>{t.text}</span>
            <span className="text-[var(--border-strong)] mx-2">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── How it works steps ───────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Build",
      desc: "Drag components onto the visual canvas or write FlowFrame DSL in the Monaco editor. Place clients, gateways, load balancers, caches, databases, and queues.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      ),
    },
    {
      step: "02",
      title: "Configure",
      desc: "Set capacity limits, accepted endpoints, cache TTLs, routing algorithms, Postgres connection pools, and custom HTTP request payloads in the node inspector.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      step: "03",
      title: "Run",
      desc: "Hit play. The engine simulates real request routing: REST calls hop through your topology following deterministic rules that mirror production infrastructure.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <polygon points="5,3 19,12 5,21" fill="currentColor" opacity={0.25} />
          <polygon points="5,3 19,12 5,21" />
        </svg>
      ),
    },
    {
      step: "04",
      title: "Understand",
      desc: "Watch packets animate in real time. Pause at any frame, inspect live node states, verify cache hit rates, inspect connection queues, and read execution logs.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
  ];

  return (
    <Reveal>
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28 overflow-hidden">
        {/* Ambient Vertical Architecture Simulation directly behind the four steps */}
        <ArchitectureBackground variant="section" />

        <div className="relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--accent)] mb-2">
              The Core Experience
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
              From architecture to running system in four steps.
            </h2>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              No static mockups. FlowFrame compiles your topology into an executable simulation graph.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.step} delay={i * 0.06}>
                <div className="relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xs p-5 hover:border-[var(--accent)]/40 hover:-translate-y-0.5 transition-all duration-200 h-full shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[color:var(--accent)]">
                      {s.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[color:var(--muted)] px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">
                      Step {s.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[color:var(--foreground)] mb-2">{s.title}</h3>
                  <p className="text-sm text-[color:var(--muted)] leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ─── What makes it different ──────────────────────────────────────────────────
function WhatItDoes() {
  const points = [
    {
      icon: <ZapIcon className="w-5 h-5" />,
      title: "Real simulation engine",
      body: "Requests actually route through your architecture. Client → Load Balancer → Server → Redis → Postgres — with real rules, not just animated arrows.",
    },
    {
      icon: <FilmIcon className="w-5 h-5" />,
      title: "Frame-by-frame playback",
      body: "Every request hop becomes an inspectable frame. Pause at any moment, scrub backwards, or step forward through the execution graph.",
    },
    {
      icon: <SandboxIcon className="w-5 h-5" />,
      title: "Inspect live node state",
      body: "Click any node's inspector. See Redis key snapshots, Postgres TCP connection pool depths, and load queues updating live as the simulation runs.",
    },
    {
      icon: <DocsIcon className="w-5 h-5" />,
      title: "Learn as you simulate",
      body: "Every core concept has guided learning. Read theory, trigger node overload or failure, and watch recovery mechanisms — all on one screen.",
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-[var(--border)]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--accent)] mb-2">
            Why FlowFrame
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
            Not a diagram tool. A running system.
          </h2>
          <p className="mt-3 text-sm text-[color:var(--muted)] leading-relaxed">
            Most system design tools let you draw static boxes and arrows. FlowFrame executes the actual runtime behavior, captures every hop, and plays it back.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.07}>
              <div className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]/35 transition-all duration-200 h-full">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[color:var(--accent)]">
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[color:var(--foreground)] mb-1.5">{p.title}</h3>
                  <p className="text-sm text-[color:var(--muted)] leading-relaxed">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ─── Scenarios / Templates ────────────────────────────────────────────────────
function Scenarios() {
  const router = useRouter();
  const scenes = [
    {
      id: "simple-load-balancer",
      label: "Load Balancing",
      tag: "Beginner",
      desc: "Round Robin and IP Hash distributing requests across 3 servers. Set server capacity to 0 to watch automatic failover.",
      chips: ["Round Robin", "IP Hash", "Failover"],
    },
    {
      id: "simple-cache",
      label: "Cache-Aside",
      tag: "Beginner",
      desc: "Cache hit, cache miss → PostgreSQL fallback, and TTL invalidation. Redis snapshots update frame-by-frame.",
      chips: ["Redis Hit/Miss", "DB Fallback", "TTL Expiry"],
    },
    {
      id: "simple-api-gateway",
      label: "API Gateway",
      tag: "Intermediate",
      desc: "Path-based routing to microservices & load balancers. Simulates route matching and 503 gateway timeouts.",
      chips: ["Path Routing", "Cluster Targets", "503 Failover"],
    },
    {
      id: "simple-valet-key",
      label: "Valet Key Pattern",
      tag: "Intermediate",
      desc: "Client requests a signed upload token from the server, then uploads directly to cloud storage bypassing proxies.",
      chips: ["Token Issuance", "Direct Upload", "Cloud Storage"],
    },
  ];

  const tagColors: Record<string, string> = {
    Beginner: "text-[color:var(--green)] bg-[var(--green-muted)] border-[var(--green)]/25",
    Intermediate: "text-[color:var(--amber)] bg-[var(--amber-muted)] border-[var(--amber)]/25",
    Advanced: "text-[color:var(--red)] bg-[var(--red-muted)] border-[var(--red)]/25",
  };

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--accent)] mb-2">
              Templates
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
              Pick a scenario. Hit play.
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Pre-wired architectures with real engine logic. Select one and watch the system run.
            </p>
          </div>
          <Link
            href="/scenarios"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[color:var(--accent)] hover:underline shrink-0"
          >
            View all scenarios →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {scenes.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.06}>
              <div
                onClick={() => router.push(`/scenarios/${s.id}`)}
                className="group relative cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                    {s.label}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      tagColors[s.tag] || tagColors.Beginner
                    }`}
                  >
                    {s.tag}
                  </span>
                </div>
                <p className="text-sm text-[color:var(--muted)] mb-4 leading-relaxed">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.chips.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-xs font-semibold text-[color:var(--accent)] opacity-80 group-hover:opacity-100 transition-opacity">
                  Run simulation
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ─── Learn & Sandbox ──────────────────────────────────────────────────────────
function LearnAndSandbox() {
  const router = useRouter();
  const cards = [
    {
      href: "/docs",
      title: "DSL Reference",
      desc: "Complete syntax guide, component node specifications, and copy-pasteable architecture scripts.",
      cta: "Read Docs →",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/learn",
      title: "Guided Learning",
      desc: "Theory on the left, live simulation on the right. Understand cache-aside, load balancing, and queues interactively.",
      cta: "Start Learning →",
      icon: <FilmIcon className="w-5 h-5" />,
    },
    {
      href: "/workspace",
      title: "Free Visual Sandbox",
      desc: "Write DSL or drag & drop nodes. Build and run any distributed architecture in your browser with zero setup.",
      cta: "Open Workspace →",
      icon: <SandboxIcon className="w-5 h-5" />,
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-[var(--border)]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--accent)] mb-2">
            Explore
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
            Three ways to use FlowFrame
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.href} delay={i * 0.06}>
              <div
                onClick={() => router.push(c.href)}
                className="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[color:var(--accent)] mb-4">
                  {c.icon}
                </div>
                <h3 className="text-base font-bold text-[color:var(--foreground)] mb-2">{c.title}</h3>
                <p className="text-sm text-[color:var(--muted)] leading-relaxed flex-1 mb-4">{c.desc}</p>
                <span className="text-xs font-semibold text-[color:var(--accent)] opacity-80 group-hover:opacity-100 transition-opacity">
                  {c.cta}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ─── Engine Simulation Rules ──────────────────────────────────────────────────
function EngineRules() {
  const rules = [
    { num: "01", category: "Data Access", title: "Cache-First Precedence", description: "When a Server is connected to both Redis and PostgreSQL, it always queries Redis first. Only upon CACHE_MISS does it fallback to PostgreSQL." },
    { num: "02", category: "Database Pool", title: "Postgres TCP Pool Limits", description: "Server's tcpConnectionsToPostgres sets maximum active connections. Saturated requests wait in a POSTGRES_POOL_WAIT queue until freed." },
    { num: "03", category: "Traffic Routing", title: "Load Balancer Health Filter", description: "Balancers evaluate server capacity and filter out overloaded targets. If all downstream servers are at capacity, it returns a 503 error." },
    { num: "04", category: "REST Contracts", title: "Endpoint & Method Matching", description: "Servers validate incoming requests against declared acceptedEndpoints and HTTP verbs. Unmatched paths immediately trigger 404 or 405." },
    { num: "05", category: "Async Messaging", title: "Message Queue & 202 Ack", description: "Publishing to a MessageQueue returns an immediate 202 Accepted ack to the client while consumer servers process messages in the background." },
    { num: "06", category: "Event Streaming", title: "PubSub Event Fan-Out", description: "When an event is published to a PubSub broker, it broadcasts to all microservice workers registered to that topic channel." },
    { num: "07", category: "Security", title: "Valet Key Pre-Signed Uploads", description: "Clients request a pre-signed token from the auth server, then upload heavy media assets directly to Cloud Storage bypassing server proxies." },
    { num: "08", category: "Flow Control", title: "Queue Overflow Handling", description: "When MessageQueue reaches capacity, overflow behavior dictates execution: BLOCK halts producer until space frees, or REJECT fails fast." },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-[var(--border)]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--accent)] mb-2">
            Engine Architecture
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
            Deterministic simulation rules & behavior
          </h2>
          <p className="mt-3 text-sm text-[color:var(--muted)] leading-relaxed">
            Every distributed system in FlowFrame executes according to deterministic rules that mirror real-world production infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rules.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent)]/30 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-mono font-bold text-[color:var(--muted)] mt-0.5 shrink-0 px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">
                  {r.num}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent)]">
                      {r.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[color:var(--foreground)] mb-1">{r.title}</h3>
                  <p className="text-xs text-[color:var(--muted)] leading-relaxed">{r.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40 transition-all duration-150"
          >
            Read complete language reference in Docs →
          </Link>
        </div>
      </section>
    </Reveal>
  );
}

// ─── YouTube Showcase ─────────────────────────────────────────────────────────
function YouTubeShowcase() {
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-[var(--border)]">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--accent)] mb-2">
            Architecture Walkthrough
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
            See Event-Driven Systems in Action
          </h2>
          <p className="mt-3 text-sm text-[color:var(--muted)] leading-relaxed">
            Follow a full implementation of message queues, connection pools, and distributed request traces modeled in FlowFrame.
          </p>
        </div>

        {/* Technical Window Card */}
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-xl overflow-hidden">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]/70 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
              </div>
              <span className="text-[11px] text-[color:var(--muted)] ml-2">
                demo // event-driven-microservices.sim
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--accent)]/10 text-[color:var(--accent)] border border-[var(--accent)]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Live Architecture Trace
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Content Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--border)]">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-mono font-bold text-[color:var(--accent)] mb-4 w-fit">
                  <span>SYSTEM DESIGN LAB</span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-[color:var(--foreground)] mb-3 leading-snug">
                  Building Event-Driven Microservices From Scratch
                </h3>

                <p className="text-xs text-[color:var(--muted)] leading-relaxed mb-6">
                  Complete walkthrough covering API Gateway ingress, Round-Robin load distribution, RabbitMQ pub/sub fan-out, and PostgreSQL connection pool starvation.
                </p>

                {/* Architecture Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex flex-col">
                    <span className="text-[9px] font-mono uppercase text-[color:var(--muted)]">Message Broker</span>
                    <span className="text-[11px] font-semibold text-[color:var(--foreground)] mt-0.5">RabbitMQ Fan-Out</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex flex-col">
                    <span className="text-[9px] font-mono uppercase text-[color:var(--muted)]">Cache Tier</span>
                    <span className="text-[11px] font-semibold text-[color:var(--foreground)] mt-0.5">Redis Cache-Aside</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex flex-col">
                    <span className="text-[9px] font-mono uppercase text-[color:var(--muted)]">Persistence</span>
                    <span className="text-[11px] font-semibold text-[color:var(--foreground)] mt-0.5">PostgreSQL Pool Limits</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex flex-col">
                    <span className="text-[9px] font-mono uppercase text-[color:var(--muted)]">Telemetry</span>
                    <span className="text-[11px] font-semibold text-[color:var(--foreground)] mt-0.5">Packet Frame Tracing</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/workspace"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-muted)] text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all duration-150 text-center"
                >
                  <SandboxIcon className="w-3.5 h-3.5" />
                  Try on Canvas →
                </Link>

                <a
                  href="https://www.youtube.com/watch?v=XQxFZg6RcTI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--surface-muted)] text-[color:var(--foreground)] px-4 py-2.5 text-xs font-semibold transition-all duration-150 text-center group"
                >
                  <svg className="w-3.5 h-3.5 text-[color:var(--muted)] group-hover:text-red-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  Watch Deep Dive
                </a>
              </div>
            </div>

            {/* Right Video Player Column */}
            <div className="lg:col-span-7 p-3 sm:p-5 flex items-center justify-center bg-[var(--surface-muted)]/40">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black shadow-inner">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/XQxFZg6RcTI"
                  title="FlowFrame - Microservices Event Driven Architecture"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ─── Open Source Banner ───────────────────────────────────────────────────────
function OpenSourceBanner() {
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[color:var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Open Source · Noncommercial License</h3>
              <p className="text-xs text-[color:var(--muted)] mt-0.5">
                Free for education, personal learning, and non-commercial research. Released under PolyForm Noncommercial 1.0.0.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/ndk123-web/flowframe"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-4 py-2 text-sm font-semibold text-[color:var(--accent)] hover:bg-[var(--accent)]/15 transition-all duration-150"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </section>
    </Reveal>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // Single showcase: Load Balancer (clean, basic info, zero text clutter)
  const { nodes: demoNodes, edges: demoEdges } = useMemo(
    () => buildLoadBalancerDemo(),
    []
  );

  return (
    <div className="relative min-h-screen bg-[var(--bg)] transition-colors duration-200 overflow-x-hidden">
      {/* Header */}
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} showHomeLink={false} />

      {/* ── Hero Section (Centered & High Impact) ─────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-14 pb-16 text-center flex flex-col items-center">
        {/* Status Badge */}
        <div className="fade-up inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-1 text-xs font-mono text-[color:var(--muted)] mb-6 shadow-xs">
          <span className="font-semibold text-[color:var(--foreground)]">FlowFrame Engine</span>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="text-[color:var(--accent)] font-medium">v2.0 Declarative Simulator</span>
        </div>

        {/* H1 Title */}
        <h1
          className="fade-up max-w-4xl text-center text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[color:var(--foreground)] leading-[1.12] mb-5"
          style={{ animationDelay: ".04s" }}
        >
          Build, run, and understand<br />
          <span className="grad-text">distributed systems.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="fade-up max-w-2xl text-center text-base sm:text-lg text-[color:var(--muted)] leading-relaxed mb-8"
          style={{ animationDelay: ".08s" }}
        >
          FlowFrame is an interactive visual simulator and learning environment for distributed architectures.
          Design systems on a canvas, configure components, run real requests, and watch execution unfold — frame by frame.
        </p>

        {/* CTAs */}
        <div
          className="fade-up flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6"
          style={{ animationDelay: ".12s" }}
        >
          {_hasHydrated && isAuthenticated ? (
            <>
              <button
                onClick={() => router.push("/workspace")}
                className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md cursor-pointer"
              >
                <ZapIcon className="w-4 h-4" />
                Open Workspace
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-secondary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer"
              >
                Go to Dashboard →
              </button>
              <button
                onClick={() => router.push("/scenarios")}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface)] transition-all cursor-pointer"
              >
                Explore Templates
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/workspace")}
                className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md cursor-pointer"
              >
                <ZapIcon className="w-4 h-4" />
                Try FlowFrame Free →
              </button>
              <button
                onClick={() => router.push("/scenarios")}
                className="btn-secondary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer"
              >
                Explore Scenarios
              </button>
              <Link
                href="/signin"
                className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
              >
                Sign in →
              </Link>
            </>
          )}
        </div>

        {/* Feature quick indicators */}
        <div
          className="fade-up flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[color:var(--muted)] mb-10 font-medium"
          style={{ animationDelay: ".15s" }}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Deterministic routing engine
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Frame-by-frame packet inspection
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Monaco DSL editor (.flow)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            In-browser runtime, zero setup
          </span>
        </div>

        {/* ── Single Hero Showcase: Load Balancer (Clean & Uncluttered) ───── */}
        <div
          className="fade-up w-full max-w-4xl rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl overflow-hidden text-left"
          style={{ animationDelay: ".18s" }}
        >
          {/* Top Window Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            {/* Left: macOS dots & filename */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 font-mono text-xs text-[color:var(--foreground)] font-medium">
                load-balancer.flow
              </span>
            </div>

            {/* Right: Clean status indicator & Open in Workspace */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[color:var(--accent)] text-[10px] font-mono font-semibold">
                Parallel Routing Active
              </div>
              <button
                onClick={() => router.push("/workspace")}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--accent)] hover:underline cursor-pointer"
              >
                Open in Workspace →
              </button>
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="relative h-[340px] sm:h-[380px] w-full dot-grid bg-[var(--bg)]">
            <ReactFlow
              nodes={demoNodes}
              edges={demoEdges}
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
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}
              />
            </ReactFlow>
          </div>
        </div>

        {/* Start options row */}
        <div
          className="fade-up mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[color:var(--muted)]"
          style={{ animationDelay: ".22s" }}
        >
          <span className="font-semibold text-[color:var(--foreground)]">Start directly with:</span>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-medium hover:border-[var(--accent)]/50 hover:text-[color:var(--foreground)] transition-all"
          >
            <SandboxIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" />
            <span>Blank Canvas</span>
          </Link>
          <Link
            href="/scenarios/simple-load-balancer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-medium hover:border-[var(--accent)]/50 hover:text-[color:var(--foreground)] transition-all"
          >
            <ScaleIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" />
            <span>Load Balancer</span>
          </Link>
          <Link
            href="/scenarios/simple-cache"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-medium hover:border-[var(--accent)]/50 hover:text-[color:var(--foreground)] transition-all"
          >
            <ZapIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" />
            <span>Cache-Aside</span>
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-medium hover:border-[var(--accent)]/50 hover:text-[color:var(--foreground)] transition-all"
          >
            <CodeIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" />
            <span>Monaco DSL</span>
          </Link>
        </div>
      </section>

      {/* Feature Ticker */}
      <Ticker />

      {/* How it works */}
      <HowItWorks />

      {/* What makes it different */}
      <WhatItDoes />

      {/* Scenarios / Templates */}
      <Scenarios />

      {/* Learn & Sandbox */}
      <LearnAndSandbox />

      {/* Engine Rules */}
      <EngineRules />

      {/* YouTube Showcase */}
      <YouTubeShowcase />

      {/* Open Source Banner */}
      <OpenSourceBanner />

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
