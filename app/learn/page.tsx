"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { LEARN_TOPICS, LearnTopic } from "@/learn/topics";
import { ComponentIcon } from "@/components/ComponentIcons";
import { useThemeStore } from "@/store/useThemeStore";

const TOPIC_META: Record<string, {
  icon: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMin: number;
}> = {
  "load-balancers": {
    icon: "load-balancer",
    difficulty: "Beginner",
    estimatedMin: 8,
  },
  "cache-aside": {
    icon: "redis",
    difficulty: "Beginner",
    estimatedMin: 10,
  },
  "api-gateways": {
    icon: "api-gateway",
    difficulty: "Intermediate",
    estimatedMin: 12,
  },
  "valet-key": {
    icon: "storage",
    difficulty: "Intermediate",
    estimatedMin: 10,
  },
};

const DIFFICULTY_BADGES = {
  Beginner: "bg-[var(--green-muted)] text-[color:var(--green)] border-[var(--green)]/25",
  Intermediate: "bg-[var(--amber-muted)] text-[color:var(--amber)] border-[var(--amber)]/25",
  Advanced: "bg-[var(--red-muted)] text-[color:var(--red)] border-[var(--red)]/25",
};

export default function LearnOverviewPage() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[color:var(--foreground)] relative overflow-x-hidden transition-colors duration-200">
      <div className="pointer-events-none absolute inset-0 -z-10 dot-grid opacity-30" />

      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showHomeLink
        badgeText="Interactive Academy"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        {/* ── Hero ──────────────────────────────────── */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)] font-mono shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Interactive Learning Center
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Learn by Simulating,<br />
            <span className="grad-text">Not Just Reading.</span>
          </h1>
          <p className="text-sm sm:text-base text-[color:var(--muted)] leading-relaxed">
            Understand distributed systems through live interactive models — click components, run checkpoints, inspect packet hops, and watch recovery mechanisms in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-2">
            {[
              { v: String(LEARN_TOPICS.length), l: "Topics" },
              { v: String(LEARN_TOPICS.reduce((a, t) => a + t.sections.reduce((b, s) => b + (s.checkpoints?.length || 0), 0), 0)), l: "Checkpoints" },
              { v: "100%", l: "Free & Open" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-extrabold text-[color:var(--foreground)]">{s.v}</p>
                <p className="text-[10px] font-semibold text-[color:var(--muted)] uppercase tracking-wider mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Foundations ─────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Foundations
            </p>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Server Deep-Dive Card */}
            <Link
              href="/learn/server"
              className="group relative flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]/50 hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[color:var(--accent)]">
                    <ComponentIcon type="server" className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-[var(--green-muted)] text-[color:var(--green)] border-[var(--green)]/20">
                      Interactive
                    </span>
                    <p className="text-xs text-[color:var(--muted)] mt-0.5 font-mono">/learn/server</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-[var(--green-muted)] text-[color:var(--green)] border-[var(--green)]/25">
                  Beginner
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Web Server Explorer
                </h2>
                <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed">
                  What is a server? What are endpoints? Send real HTTP requests to a simulated server and observe status codes, headers, and payload validation live.
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                <div className="flex gap-3 text-[10px] font-mono text-[color:var(--muted)]">
                  <span>Live Endpoint Explorer</span>
                  <span>~5 min</span>
                </div>
                <span className="text-xs font-semibold text-[color:var(--accent)] group-hover:translate-x-0.5 transition-transform">
                  Explore →
                </span>
              </div>
            </Link>

            {/* Glossary Card */}
            <Link
              href="/learn/glossary"
              className="group relative flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]/50 hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[color:var(--accent)]">
                    <span className="text-lg">📖</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-[var(--accent)]/10 text-[color:var(--accent)] border-[var(--accent)]/20">
                      Searchable
                    </span>
                    <p className="text-xs text-[color:var(--muted)] mt-0.5 font-mono">/learn/glossary</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-[var(--bg-elevated)] text-[color:var(--muted)] border-[var(--border)]">
                  Reference
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Distributed Systems Glossary
                </h2>
                <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed">
                  Essential distributed systems terms defined clearly: Latency, Throughput, Partitioning, Load Balancers, Redis Cache-Aside, Message Queues, and 50+ more.
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                <div className="flex gap-3 text-[10px] font-mono text-[color:var(--muted)]">
                  <span>50+ Concepts</span>
                  <span>8 Categories</span>
                </div>
                <span className="text-xs font-semibold text-[color:var(--accent)] group-hover:translate-x-0.5 transition-transform">
                  Browse →
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Guided Simulation Topics ─────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Guided Simulations
            </p>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LEARN_TOPICS.map((topic: LearnTopic) => {
              const meta = TOPIC_META[topic.id] ?? {
                icon: "server",
                difficulty: "Beginner" as const,
                estimatedMin: 10,
              };
              const totalSections = topic.sections.length;
              const totalCheckpoints = topic.sections.reduce((a, s) => a + (s.checkpoints?.length || 0), 0);

              return (
                <Link
                  key={topic.id}
                  href={`/learn/${topic.id}`}
                  className="group relative flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]/50 hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[color:var(--accent)]">
                        <ComponentIcon type={meta.icon} className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)]">
                        {topic.id.replace(/-/g, " ")}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${DIFFICULTY_BADGES[meta.difficulty]}`}>
                      {meta.difficulty}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <h2 className="text-base font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                      {topic.title}
                    </h2>
                    <p className="text-xs font-semibold font-mono text-[color:var(--accent)] opacity-80">
                      {topic.subtitle}
                    </p>
                    <p className="text-xs text-[color:var(--muted)] leading-relaxed pt-1">
                      {topic.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                    <div className="flex gap-3 text-[10px] font-mono text-[color:var(--muted)]">
                      <span>📖 {totalSections} sections</span>
                      {totalCheckpoints > 0 && <span>⚡ {totalCheckpoints} checkpoints</span>}
                    </div>
                    <span className="text-xs font-semibold text-[color:var(--accent)] group-hover:translate-x-0.5 transition-transform">
                      Start Guide →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Sandbox Callout ────────────────────────── */}
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-base font-bold text-[color:var(--foreground)]">Ready to build your own?</p>
            <p className="text-xs text-[color:var(--muted)] max-w-md">
              Launch the Interactive Sandbox to drag, configure, and connect nodes from scratch. Zero limits, real execution.
            </p>
          </div>
          <Link
            href="/workspace"
            className="btn-primary shrink-0 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition"
          >
            Open Sandbox
            <span className="text-sm">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
