"use client";

import Link from "next/link";
import { useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useThemeStore } from "@/store/useThemeStore";

type ScenarioCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  focus: string[];
  expectedFrames: number;
  updatedAt: string;
  flowDiagram: string;
  systemBehavior: string;
};

const SCENARIOS: ScenarioCard[] = [
  {
    id: "simple-load-balancer",
    title: "Simple Load Balancer",
    description: "Watch round-robin request routing across multiple backend servers and inspect each frame in the sequence.",
    href: "/scenarios/simple-load-balancer",
    difficulty: "Beginner",
    focus: ["Round Robin", "Request Routing", "Traffic Visualization"],
    expectedFrames: 16,
    updatedAt: "2026-03-12",
    flowDiagram: "Client → Load Balancer → Server 1/2/3",
    systemBehavior: "Requests distribute across servers in round-robin order. Each server handles requests sequentially.",
  },
  {
    id: "simple-cache",
    title: "Simple Cache (Redis + Postgres)",
    description: "Observe cache hit, cache miss fallback to Postgres, and invalid-key lookups with per-frame debug details.",
    href: "/scenarios/simple-cache",
    difficulty: "Beginner",
    focus: ["Cache Aside", "Redis Hit/Miss", "DB Fallback"],
    expectedFrames: 6,
    updatedAt: "2026-03-13",
    flowDiagram: "Client → Redis ↔ Postgres",
    systemBehavior: "Requests check Redis first. On miss, they fallback to Postgres and update the cache.",
  },
  {
    id: "simple-api-gateway",
    title: "Simple API Gateway (Routing + Cache)",
    description: "Track endpoint-based routing from API Gateway to backend services with Redis/Postgres flow snapshots.",
    href: "/scenarios/simple-api-gateway",
    difficulty: "Intermediate",
    focus: ["Endpoint Routing", "Round Robin", "Gateway + Data Stores"],
    expectedFrames: 7,
    updatedAt: "2026-03-22",
    flowDiagram: "Client → API Gateway → LB → Servers, Cache, DB",
    systemBehavior: "Gateway routes endpoints to appropriate services. Full chain with caching and persistence.",
  },
  {
    id: "simple-valet-key",
    title: "Simple Valet Key (Direct Upload)",
    description: "Simulate signed URL upload flow where server issues a valet key and client uploads directly to cloud storage.",
    href: "/scenarios/simple-valet-key",
    difficulty: "Intermediate",
    focus: ["Signed URL", "Direct Upload", "Storage Offload"],
    expectedFrames: 24,
    updatedAt: "2026-03-29",
    flowDiagram: "Client → Server → signedURL → Client → Storage",
    systemBehavior: "Client gets a signed URL from server, then uploads directly to storage, offloading traffic from server.",
  },
];

const DIFFICULTY_STYLE: Record<string, string> = {
  Beginner:     "bg-[var(--green-muted)] text-[color:var(--green)] border-[var(--green)]/25",
  Intermediate: "bg-[var(--amber-muted)] text-[color:var(--amber)] border-[var(--amber)]/25",
  Advanced:     "bg-[var(--red-muted)] text-[color:var(--red)] border-[var(--red)]/25",
};

function ScenarioCard({ scenario, index }: { scenario: ScenarioCard; index: number }) {
  const [showFlow, setShowFlow] = useState(false);

  return (
    <article
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/35 hover:-translate-y-0.5 transition-all duration-200"
      style={{
        opacity: 1,
        animation: `fadeIn 0.4s cubic-bezier(.22,1,.36,1) ${index * 0.07}s both`,
      }}
      onMouseEnter={() => setShowFlow(true)}
      onMouseLeave={() => setShowFlow(false)}
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] font-mono font-bold text-[color:var(--muted)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${DIFFICULTY_STYLE[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
        </div>

        {/* Title + description */}
        <div className="flex-1 mb-4">
          <h2 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors mb-1.5">
            {scenario.title}
          </h2>
          <p className="text-xs text-[color:var(--muted)] leading-relaxed">
            {scenario.description}
          </p>
        </div>

        {/* System flow — on hover */}
        <div
          style={{
            maxHeight: showFlow ? "80px" : "0",
            opacity: showFlow ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.2s ease, opacity 0.2s ease",
          }}
          className="mb-3"
        >
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--muted)] mb-1">Flow</p>
            <p className="text-[10px] font-mono text-[color:var(--foreground)]/80">{scenario.flowDiagram}</p>
          </div>
        </div>

        {/* Focus tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {scenario.focus.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-[10px] text-[color:var(--muted)] mb-4">
          <span>{scenario.expectedFrames} frames</span>
          <span>Updated {scenario.updatedAt}</span>
        </div>

        {/* CTA */}
        <Link
          href={scenario.href}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-muted)] px-4 py-2 text-xs font-semibold text-white transition-all duration-150 active:scale-[0.97]"
        >
          <span>Run Simulation</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </article>
  );
}

export default function ScenariosPage() {
  const { theme, toggleTheme } = useThemeStore();

  const stats = {
    total: SCENARIOS.length,
    beginner: SCENARIOS.filter(s => s.difficulty === "Beginner").length,
    avgFrames: Math.round(SCENARIOS.reduce((sum, s) => sum + s.expectedFrames, 0) / SCENARIOS.length),
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[color:var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 -z-10 technical-grid opacity-30" />

      <SiteHeader
        theme={theme}
        showHomeLink
        badgeText="Simulation Library"
        onToggleTheme={toggleTheme}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 sm:px-6 pt-12 pb-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-9">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Scenario Library
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--foreground)] mb-3">
            Pre-built System Simulations
          </h1>

          <p className="max-w-xl text-sm text-[color:var(--muted)] leading-relaxed mb-8">
            Explore pre-configured distributed system scenarios. Hover any card to preview the system flow, then launch it to watch network packets travel across components in real time.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {[
              { label: "Total Scenarios", value: stats.total },
              { label: "Beginner Tier", value: stats.beginner },
              { label: "Avg Frames", value: stats.avgFrames },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--muted)] mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-[color:var(--accent)]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scenario Cards Grid ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 sm:px-6 pb-12">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)] mb-5">
          {SCENARIOS.length} scenarios available
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SCENARIOS.map((scenario, index) => (
            <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
          ))}
        </div>
      </section>

      {/* ── Sandbox CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 sm:px-6 pb-14">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--foreground)] mb-1">Want to design something custom?</p>
            <p className="text-xs text-[color:var(--muted)]">
              Use the Interactive Sandbox to draw any architecture from scratch and run your own simulation.
            </p>
          </div>
          <Link
            href="/workspace"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-4 py-2 text-sm font-semibold text-[color:var(--accent)] hover:bg-[var(--accent)]/15 transition-all duration-150 whitespace-nowrap"
          >
            Launch Workspace →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
