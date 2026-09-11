"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useThemeStore } from "@/store/useThemeStore";

type ScenarioCard = {
  id: string;
  title: string;
  problemStatement: string;
  concept: string;
  investigation: string;
  href: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  focus: string[];
  expectedFrames: number;
  flowDiagram: string;
};

const SCENARIOS: ScenarioCard[] = [
  {
    id: "simple-load-balancer",
    title: "Simple Load Balancer",
    problemStatement: "How do you distribute high-volume web traffic across multiple backend servers without creating single points of failure?",
    concept: "Round-Robin L7 Traffic Balancing",
    investigation: "Inspect how sequential incoming HTTP requests alternate between Server 1, Server 2, and Server 3 in deterministic order.",
    href: "/scenarios/simple-load-balancer",
    difficulty: "Beginner",
    focus: ["Round Robin", "Request Routing", "Traffic Distribution"],
    expectedFrames: 16,
    flowDiagram: "Client → Load Balancer → Server 1 / 2 / 3",
  },
  {
    id: "simple-cache",
    title: "Simple Cache (Redis + Postgres)",
    problemStatement: "How can a system avoid hitting the primary database on every read request while maintaining cache consistency?",
    concept: "Cache-Aside Pattern & DB Fallback",
    investigation: "Observe cache hits returning instantly from Redis memory versus cache misses that query PostgreSQL and backfill the cache.",
    href: "/scenarios/simple-cache",
    difficulty: "Beginner",
    focus: ["Cache Aside", "Redis Hit/Miss", "DB Fallback"],
    expectedFrames: 6,
    flowDiagram: "Client → Redis Cache ↔ Postgres DB",
  },
  {
    id: "simple-api-gateway",
    title: "Simple API Gateway (Routing + Cache)",
    problemStatement: "How do client applications communicate with multiple microservices through a unified, secure entry point?",
    concept: "Unified Path Routing & Microservices Gateway",
    investigation: "Track URL path matching (/api/users/* vs /api/orders/*), downstream routing, and cached response multiplexing.",
    href: "/scenarios/simple-api-gateway",
    difficulty: "Intermediate",
    focus: ["Path Routing", "Gateway Proxy", "Microservices"],
    expectedFrames: 7,
    flowDiagram: "Client → API Gateway → LB → Services",
  },
  {
    id: "simple-valet-key",
    title: "Simple Valet Key (Direct Upload)",
    problemStatement: "How can clients upload large multimedia files directly to cloud storage without overwhelming backend application servers?",
    concept: "Pre-Signed Valet Keys & Storage Offload",
    investigation: "Step through client token negotiation, signed URL generation, and direct client-to-storage binary streaming.",
    href: "/scenarios/simple-valet-key",
    difficulty: "Intermediate",
    focus: ["Signed URL", "Direct Upload", "Storage Offload"],
    expectedFrames: 24,
    flowDiagram: "Client → Auth Server → Pre-Signed URL → Cloud Storage",
  },
];

const DIFFICULTY_STYLE: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function ScenariosPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [filterDifficulty, setFilterDifficulty] = useState<string>("All");

  const filteredScenarios = useMemo(() => {
    if (filterDifficulty === "All") return SCENARIOS;
    return SCENARIOS.filter((s) => s.difficulty === filterDifficulty);
  }, [filterDifficulty]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[color:var(--foreground)] transition-colors duration-200">
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} showHomeLink={false} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* ── Header / Hero ─────────────────────────────────────────── */}
        <section className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1 text-xs font-mono text-[color:var(--muted)] shadow-xs">
            <span className="font-semibold text-[color:var(--foreground)]">System Design Lab</span>
            <span>/</span>
            <span className="text-[color:var(--accent)] font-medium">Interactive Scenarios</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--foreground)] leading-tight">
            Practical system-design experiments.
          </h1>

          <p className="text-sm sm:text-base text-[color:var(--muted)] leading-relaxed">
            Step through pre-configured distributed architectures. Run real request sequences, inspect
            frame-by-frame state transitions, and observe how systems behave under real-world conditions.
          </p>
        </section>

        {/* ── Filters Bar ───────────────────────────────────────────── */}
        <section className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            {["All", "Beginner", "Intermediate"].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setFilterDifficulty(diff)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterDifficulty === diff
                    ? "bg-[var(--accent)]/10 text-[color:var(--accent)] border border-[var(--accent)]/25 font-semibold"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface)] border border-transparent"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-[color:var(--muted)]">
            Showing {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? "s" : ""}
          </span>
        </section>

        {/* ── Scenarios Grid ────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredScenarios.map((scenario, index) => (
            <article
              key={scenario.id}
              className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]/50 hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
            >
              <div className="space-y-4">
                {/* Header: Number & Difficulty */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[color:var(--muted)]">
                    Scenario {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[color:var(--muted)]">
                      {scenario.expectedFrames} frames
                    </span>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        DIFFICULTY_STYLE[scenario.difficulty]
                      }`}
                    >
                      {scenario.difficulty}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-base font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                    {scenario.title}
                  </h2>
                  <p className="text-xs font-mono text-[color:var(--accent)] mt-0.5">
                    {scenario.concept}
                  </p>
                </div>

                {/* Problem Statement Box */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
                    Problem Statement
                  </p>
                  <p className="text-xs text-[color:var(--foreground)]/90 leading-relaxed">
                    {scenario.problemStatement}
                  </p>
                </div>

                {/* Investigation Details */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
                    What You Will Investigate
                  </p>
                  <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                    {scenario.investigation}
                  </p>
                </div>

                {/* Architecture Preview Flow */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[color:var(--muted)] mb-0.5">
                    Topology Preview
                  </p>
                  <p className="text-xs font-mono text-[color:var(--foreground)] font-semibold truncate">
                    {scenario.flowDiagram}
                  </p>
                </div>

                {/* Focus Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {scenario.focus.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-5 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-xs font-mono text-[color:var(--muted)]">
                  Interactive Simulator
                </span>
                <Link
                  href={scenario.href}
                  className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                >
                  Start Scenario →
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
