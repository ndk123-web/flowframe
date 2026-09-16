"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { LEARN_TOPICS, LearnTopic } from "@/learn/topics";
import { ComponentIcon } from "@/components/ComponentIcons";
import { useThemeStore } from "@/store/useThemeStore";
import { SearchIcon, ZapIcon, DocsIcon } from "@/components/DashboardIcons";

type FilterCategory = "all" | "routing" | "data" | "foundations";

interface TopicConfig {
  moduleNumber: string;
  icon: string;
  category: "routing" | "data" | "foundations";
  difficulty: "Beginner" | "Intermediate" | "Reference";
  estimatedMin: number;
  topology: { label: string; icon: string }[];
  concepts: string[];
}

const TOPIC_CONFIGS: Record<string, TopicConfig> = {
  "load-balancers": {
    moduleNumber: "MODULE 02",
    icon: "load-balancer",
    category: "routing",
    difficulty: "Beginner",
    estimatedMin: 8,
    topology: [
      { label: "Client", icon: "client" },
      { label: "Load Balancer", icon: "load-balancer" },
      { label: "Server Fleet ×3", icon: "server" },
    ],
    concepts: ["Round Robin", "IP Hash", "Horizontal Scale", "Health Checks"],
  },
  "cache-aside": {
    moduleNumber: "MODULE 03",
    icon: "redis",
    category: "data",
    difficulty: "Beginner",
    estimatedMin: 10,
    topology: [
      { label: "Client", icon: "client" },
      { label: "App Server", icon: "server" },
      { label: "Redis Cache", icon: "redis" },
      { label: "PostgreSQL", icon: "postgres" },
    ],
    concepts: ["Cache Hit / Miss", "TTL Invalidation", "Thundering Herd", "Read Latency"],
  },
  "api-gateways": {
    moduleNumber: "MODULE 04",
    icon: "api-gateway",
    category: "routing",
    difficulty: "Intermediate",
    estimatedMin: 12,
    topology: [
      { label: "Client", icon: "client" },
      { label: "API Gateway", icon: "api-gateway" },
      { label: "Microservices", icon: "server" },
    ],
    concepts: ["Prefix Routing", "Reverse Proxy", "Decoupled Auth", "SSL Termination"],
  },
  "valet-key": {
    moduleNumber: "MODULE 05",
    icon: "storage",
    category: "data",
    difficulty: "Intermediate",
    estimatedMin: 10,
    topology: [
      { label: "Client", icon: "client" },
      { label: "Auth Token API", icon: "server" },
      { label: "Object Storage", icon: "storage" },
    ],
    concepts: ["Pre-Signed URLs", "Bandwidth Offloading", "Direct Upload", "S3 Storage"],
  },
  "message-queues": {
    moduleNumber: "MODULE 06",
    icon: "message-queue",
    category: "data",
    difficulty: "Intermediate",
    estimatedMin: 12,
    topology: [
      { label: "Client", icon: "client" },
      { label: "Web Server", icon: "server" },
      { label: "Message Queue", icon: "message-queue" },
      { label: "Worker Fleet ×2", icon: "server" },
    ],
    concepts: ["Asynchronous Buffer", "Competing Consumers", "Spike Protection", "FIFO Ordering"],
  },
  "pub-sub": {
    moduleNumber: "MODULE 07",
    icon: "pubsub",
    category: "routing",
    difficulty: "Intermediate",
    estimatedMin: 12,
    topology: [
      { label: "Publisher Client", icon: "client" },
      { label: "Ingest Server", icon: "server" },
      { label: "Pub/Sub Broker", icon: "pubsub" },
      { label: "Subscribers ×2", icon: "server" },
    ],
    concepts: ["Event Fanout", "Decoupled Services", "Topic Channels", "Broadcast Sync"],
  },
};

const DIFFICULTY_STYLES = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  Intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  Reference: "bg-amber-500/10 text-amber-400 border-amber-500/25",
};

/**
 * Structured Architecture Blueprint Box inside each card
 */
function StructuredBlueprintBox({
  nodes,
  accentColor = "text-blue-400",
}: {
  nodes: { label: string; icon: string }[];
  accentColor?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#070c18] p-3.5 space-y-2.5 overflow-hidden select-none">
      <div className="flex items-center justify-between text-[10px] font-mono text-[color:var(--muted)]">
        <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-[color:var(--foreground)]/70">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Topology Blueprint
        </span>
        <span className="text-[9px] font-mono text-blue-400/80">Deterministic Flow</span>
      </div>

      <div className="flex items-center justify-between gap-1.5 py-1 px-0.5">
        {nodes.map((node, i) => (
          <React.Fragment key={i}>
            {/* Component Node Box */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center p-1.5 shadow-sm">
                <ComponentIcon type={node.icon as any} className="w-full h-full" />
              </div>
              <span className="text-[9.5px] font-mono font-medium text-[color:var(--foreground)] text-center max-w-[70px] truncate leading-tight">
                {node.label}
              </span>
            </div>

            {/* Connecting Wire with Continuous Traveling Pulse */}
            {i < nodes.length - 1 && (
              <div className="flex-1 relative flex items-center justify-center min-w-[20px] px-0.5">
                <div className="w-full h-0.5 bg-[var(--border)] relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent w-full animate-flow-pulse" />
                </div>
                <svg className="absolute right-0 w-2.5 h-2.5 fill-blue-400/80 -mr-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function LearnOverviewPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");

  const filteredTopics = useMemo(() => {
    return LEARN_TOPICS.filter((topic: LearnTopic) => {
      const cfg = TOPIC_CONFIGS[topic.id];
      const matchesSearch =
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cfg && cfg.concepts.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;
      if (activeCategory === "routing") return cfg?.category === "routing";
      if (activeCategory === "data") return cfg?.category === "data";
      if (activeCategory === "foundations") return false; // Handled separately
      return true;
    });
  }, [searchQuery, activeCategory]);

  const showFoundations =
    activeCategory === "all" || activeCategory === "foundations";

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[color:var(--foreground)] relative overflow-x-hidden transition-colors duration-200">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-25" />

      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showHomeLink
        badgeText="Interactive Academy"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12 space-y-10">
        {/* ── 1. Structured Engineering Hero ─────────────────────────────────── */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div className="space-y-1.5 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold tracking-widest uppercase text-blue-400">
                <span>SYSTEM ARCHITECTURE CURRICULUM</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[color:var(--foreground)]">
                Learn Distributed Systems by Simulating
              </h1>
              <p className="text-xs sm:text-sm text-[color:var(--muted)] leading-relaxed">
                Step-by-step interactive modules covering core routing patterns, caching strategies, and fault tolerance. Watch request packets unfold across real infrastructure components.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center shrink-0">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 min-w-[90px]">
                <p className="text-base sm:text-lg font-extrabold text-[color:var(--foreground)]">6</p>
                <p className="text-[9px] uppercase font-semibold text-[color:var(--muted)]">Modules</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 min-w-[90px]">
                <p className="text-base sm:text-lg font-extrabold text-blue-400">11</p>
                <p className="text-[9px] uppercase font-semibold text-[color:var(--muted)]">Checkpoints</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 min-w-[90px]">
                <p className="text-base sm:text-lg font-extrabold text-[color:var(--foreground)]">50+</p>
                <p className="text-[9px] uppercase font-semibold text-[color:var(--muted)]">Concepts</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 min-w-[90px]">
                <p className="text-base sm:text-lg font-extrabold text-emerald-400">100%</p>
                <p className="text-[9px] uppercase font-semibold text-[color:var(--muted)]">Interactive</p>
              </div>
            </div>
          </div>

          {/* ── 3-Step Methodology: Concept -> Understand -> Try In Simulator ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* 01: Concept */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-4 space-y-1.5 hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-bold text-blue-400 tracking-wider">01 · CONCEPT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/80" />
              </div>
              <h3 className="text-sm font-bold text-[color:var(--foreground)]">Architectural Logic</h3>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Trade-offs & bottleneck theory
              </p>
            </div>

            {/* 02: Understand */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-4 space-y-1.5 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-bold text-emerald-400 tracking-wider">02 · UNDERSTAND</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              </div>
              <h3 className="text-sm font-bold text-[color:var(--foreground)]">Observe Simulation</h3>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Frame traces & packet inspection
              </p>
            </div>

            {/* 03: Try In Simulator */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-4 space-y-1.5 hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-bold text-amber-400 tracking-wider">03 · TRY IN SIMULATOR</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
              </div>
              <h3 className="text-sm font-bold text-[color:var(--foreground)]">Hands-On Sandbox</h3>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Modify parameters on live canvas
              </p>
            </div>
          </div>

          {/* Search & Category Filter Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1 text-xs font-mono w-full sm:w-auto overflow-x-auto">
              {(
                [
                  { id: "all", label: "All Modules (6)" },
                  { id: "routing", label: "Traffic Routing (2)" },
                  { id: "data", label: "Data & Storage (2)" },
                  { id: "foundations", label: "Foundations (2)" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.id
                      ? "bg-[var(--surface)] text-blue-400 shadow-sm border border-[var(--border)] font-bold"
                      : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--muted)]" />
              <input
                type="text"
                placeholder="Search concepts or patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] pl-9 pr-3 py-1.5 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </section>

        {/* ── 2. Structured Cards Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Foundation Module 1: Web Server Explorer */}
          {showFoundations && (!searchQuery || "web server explorer http".includes(searchQuery.toLowerCase())) && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-blue-500/50 transition-colors">
              <div className="space-y-3.5">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                    MODULE 01 · ~5 MIN
                  </span>
                  <span className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${DIFFICULTY_STYLES.Beginner}`}>
                    Beginner
                  </span>
                </div>

                {/* Title & Icon */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center p-2 shrink-0">
                    <ComponentIcon type="server" className="w-full h-full" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[color:var(--foreground)]">
                      Web Server Explorer
                    </h2>
                    <p className="text-xs font-mono text-emerald-400">
                      HTTP Request / Response Lifecycle
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                  Learn how web servers handle incoming requests. Test GET, POST, PUT, and DELETE methods, inspect headers, and observe status codes in real-time.
                </p>

                {/* Structured Diagram Box */}
                <StructuredBlueprintBox
                  nodes={[
                    { label: "HTTP Client", icon: "client" },
                    { label: "Node.js Server", icon: "server" },
                    { label: "200 OK Status", icon: "server" },
                  ]}
                />

                {/* Concept Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["HTTP Verbs", "Status Codes", "Headers", "JSON Validation"].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-mono text-[color:var(--muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[color:var(--muted)]">
                  Direct Protocol Tester
                </span>
                <Link
                  href="/learn/server"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Launch Explorer</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}

          {/* Dynamic Scenario Modules (Load Balancers, Cache-Aside, API Gateways, Valet Key, Message Queues, Pub/Sub) */}
          {filteredTopics.map((topic) => {
            const cfg = TOPIC_CONFIGS[topic.id] || {
              moduleNumber: "TOPIC",
              icon: "server",
              category: "routing" as const,
              difficulty: "Intermediate" as const,
              estimatedMin: 10,
              topology: [
                { label: "Client", icon: "client" },
                { label: topic.title, icon: "server" },
              ],
              concepts: ["Architecture", "Simulation", "Distributed Systems"],
            };
            const totalSections = topic.sections.length;
            const totalCheckpoints = topic.sections.reduce(
              (a, s) => a + (s.checkpoints?.length || 0),
              0
            );

            return (
              <div
                key={topic.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-blue-500/50 transition-colors"
              >
                <div className="space-y-3.5">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-blue-400 tracking-wider">
                      {cfg.moduleNumber} · ~{cfg.estimatedMin} MIN
                    </span>
                    <span className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${DIFFICULTY_STYLES[cfg.difficulty]}`}>
                      {cfg.difficulty}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center p-2 shrink-0">
                      <ComponentIcon type={cfg.icon as any} className="w-full h-full" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[color:var(--foreground)]">
                        {topic.title}
                      </h2>
                      <p className="text-xs font-mono text-blue-400">
                        {topic.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                    {topic.description}
                  </p>

                  {/* Structured Diagram Box */}
                  <StructuredBlueprintBox nodes={cfg.topology} />

                  {/* Concept Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cfg.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-mono text-[color:var(--muted)]"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-[color:var(--muted)] flex items-center gap-2">
                    <span>{totalSections} steps</span>
                    <span>•</span>
                    <span>{totalCheckpoints} checkpoints</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/scenarios/${topic.scenarioId}`}
                      className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] text-[11px] font-semibold text-[color:var(--foreground)] transition cursor-pointer"
                      title="Open scenario in interactive simulator"
                    >
                      <span>Sandbox</span>
                      <span className="text-[10px] ml-1">↗</span>
                    </Link>

                    <Link
                      href={`/learn/${topic.id}`}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Start Guide</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Foundation Module 2: Distributed Systems Glossary */}
          {showFoundations && (!searchQuery || "glossary terms dictionary cap acid latency".includes(searchQuery.toLowerCase())) && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-amber-500/50 transition-colors">
              <div className="space-y-3.5">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider">
                    MODULE 06 · REFERENCE
                  </span>
                  <span className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${DIFFICULTY_STYLES.Reference}`}>
                    Reference
                  </span>
                </div>

                {/* Title & Icon */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center p-2 shrink-0">
                    <DocsIcon className="w-full h-full" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[color:var(--foreground)]">
                      Distributed Systems Glossary
                    </h2>
                    <p className="text-xs font-mono text-amber-400">
                      50+ Core Architectural Terms & Definitions
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                  Engineering-first definitions for latency, throughput, CAP theorem, circuit breakers, idempotency, and partition tolerance with real code snippets.
                </p>

                {/* Structured Diagram Box */}
                <StructuredBlueprintBox
                  nodes={[
                    { label: "50+ Terms", icon: "dns" },
                    { label: "8 Categories", icon: "storage" },
                    { label: "System Specs", icon: "postgres" },
                  ]}
                />

                {/* Category Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["HTTP & APIs", "Databases", "Performance", "Security", "CAP Theorem", "Architecture"].map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-mono text-[color:var(--muted)]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[color:var(--muted)]">
                  Searchable Technical Dictionary
                </span>
                <Link
                  href="/learn/glossary"
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] text-[color:var(--foreground)] transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Browse Terms</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Bottom Studio Callout Box ───────────────────────────────────── */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              INTERACTIVE ARCHITECTURE STUDIO
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[color:var(--foreground)]">
              Ready to construct your own custom architecture?
            </h3>
            <p className="text-xs text-[color:var(--muted)] max-w-lg leading-relaxed">
              Launch the FlowFrame Studio canvas to place, wire, and simulate any distributed architecture with real-time packet animation.
            </p>
          </div>

          <Link
            href="/workspace"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer flex items-center gap-2 shrink-0"
          >
            <ZapIcon className="w-3.5 h-3.5" />
            <span>Launch Studio Canvas</span>
            <span>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
