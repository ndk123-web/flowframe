"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { LEARN_TOPICS, LearnTopic } from "@/learn/topics";
import { ComponentIcon } from "@/components/ComponentIcons";
import { motion } from "framer-motion";

type Theme = "light" | "dark";

const TOPIC_META: Record<string, {
  color: string;
  accent: string;
  accentHover: string;
  badge: string;
  icon: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMin: number;
}> = {
  "load-balancers": {
    color: "border-blue-500/20 hover:border-blue-500/50",
    accent: "text-blue-400",
    accentHover: "group-hover:text-blue-300",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: "load-balancer",
    difficulty: "Beginner",
    estimatedMin: 8,
  },
  "cache-aside": {
    color: "border-amber-500/20 hover:border-amber-500/50",
    accent: "text-amber-400",
    accentHover: "group-hover:text-amber-300",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "redis",
    difficulty: "Beginner",
    estimatedMin: 10,
  },
  "api-gateways": {
    color: "border-fuchsia-500/20 hover:border-fuchsia-500/50",
    accent: "text-fuchsia-400",
    accentHover: "group-hover:text-fuchsia-300",
    badge: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    icon: "api-gateway",
    difficulty: "Intermediate",
    estimatedMin: 12,
  },
  "valet-key": {
    color: "border-yellow-500/20 hover:border-yellow-500/50",
    accent: "text-yellow-400",
    accentHover: "group-hover:text-yellow-300",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: "storage",
    difficulty: "Intermediate",
    estimatedMin: 10,
  },
};

const DIFFICULTY_COLORS = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  Advanced: "bg-red-500/10 text-red-400 border-red-500/25",
};

export default function LearnOverviewPage() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-20" />
      <div className="pointer-events-none absolute -left-40 -top-20 -z-10 h-[600px] w-[600px] rounded-full bg-violet-500/6 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 top-[400px] -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/6 blur-[140px]" />

      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme(p => p === "dark" ? "light" : "dark")}
        showHomeLink
        badgeText="Learn Academy"
        alwaysGlass
      />

      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20 space-y-20">

        {/* ── Hero ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-5 max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-violet-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Interactive System Design
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-[color:var(--foreground)] via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
              Learn by Doing,
            </span>
            <br />
            <span className="text-[color:var(--foreground)]">Not Just Reading.</span>
          </h1>
          <p className="text-base sm:text-lg text-[color:var(--foreground)]/55 leading-relaxed">
            Understand distributed systems through live simulations — click components, run checkpoints, and build your own architectures in the sandbox.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 pt-1">
            {[
              { v: String(LEARN_TOPICS.length), l: "Topics" },
              { v: String(LEARN_TOPICS.reduce((a, t) => a + t.sections.reduce((b, s) => b + (s.checkpoints?.length || 0), 0), 0)), l: "Checkpoints" },
              { v: "100%", l: "Free" },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-extrabold text-violet-400">{s.v}</p>
                <p className="text-[11px] font-semibold text-[color:var(--foreground)]/40 uppercase tracking-wider mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Foundations ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--foreground)]/35">Foundations First</p>
            <div className="flex-1 h-px bg-[var(--border)]/50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Server Deep-Dive Card */}
            <Link
              href="/learn/server"
              className="group relative flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-6 hover:border-emerald-500/40 hover:bg-[var(--surface)]/80 transition-all duration-300 hover:shadow-[0_8px_32px_-16px_rgba(52,211,153,0.2)] backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                    <span className="text-xl">🖥️</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Interactive
                    </span>
                    <p className="text-xs text-[color:var(--foreground)]/40 mt-0.5 font-mono">/learn/server</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Beginner</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-[color:var(--foreground)] group-hover:text-emerald-400 transition-colors duration-200">Web Server Explorer</h2>
                <p className="text-sm text-[color:var(--foreground)]/50 mt-1.5 leading-relaxed">
                  What is a server? What are endpoints? Send real HTTP requests to a simulated server and see exactly how it responds — methods, status codes, headers and all.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/50 relative z-10">
                <div className="flex gap-3 text-[10px] font-mono text-[color:var(--foreground)]/35">
                  <span>🔌 Live Endpoint Explorer</span>
                  <span>⏱ ~5 min</span>
                </div>
                <span className="text-sm font-bold text-emerald-400 group-hover:translate-x-1 transition-transform duration-200">Explore →</span>
              </div>
            </Link>

            {/* Glossary Card */}
            <Link
              href="/learn/glossary"
              className="group relative flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-6 hover:border-violet-500/40 hover:bg-[var(--surface)]/80 transition-all duration-300 hover:shadow-[0_8px_32px_-16px_rgba(139,92,246,0.2)] backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/[0.04] to-transparent pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 group-hover:scale-105 transition-transform duration-300">
                    <span className="text-xl">📖</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20">
                      Searchable
                    </span>
                    <p className="text-xs text-[color:var(--foreground)]/40 mt-0.5 font-mono">/learn/glossary</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20">Reference</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-[color:var(--foreground)] group-hover:text-violet-400 transition-colors duration-200">Systems Glossary</h2>
                <p className="text-sm text-[color:var(--foreground)]/50 mt-1.5 leading-relaxed">
                  Every term explained in depth — HTTP, REST, latency, CDN, microservices, DNS, and 50+ more. Search anything. Understand everything.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/50 relative z-10">
                <div className="flex gap-3 text-[10px] font-mono text-[color:var(--foreground)]/35">
                  <span>🔍 50+ Terms</span>
                  <span>📂 8 Categories</span>
                </div>
                <span className="text-sm font-bold text-violet-400 group-hover:translate-x-1 transition-transform duration-200">Browse →</span>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* ── Simulation Topics ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--foreground)]/35">Guided Simulations</p>
            <div className="flex-1 h-px bg-[var(--border)]/50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LEARN_TOPICS.map((topic: LearnTopic) => {
              const meta = TOPIC_META[topic.id] ?? {
                color: "border-violet-500/20 hover:border-violet-500/50",
                accent: "text-violet-400",
                accentHover: "group-hover:text-violet-300",
                badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
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
                  className={`group relative flex flex-col gap-4 rounded-2xl border ${meta.color} bg-[var(--surface)]/50 p-6 hover:bg-[var(--surface)]/80 transition-all duration-300 hover:shadow-lg backdrop-blur-sm overflow-hidden`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.025] to-transparent pointer-events-none" />
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] group-hover:scale-105 transition-transform duration-300">
                        <ComponentIcon type={meta.icon} className={`w-5 h-5 ${meta.accent}`} />
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${meta.badge}`}>
                        {topic.id.replace(/-/g, " ")}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[meta.difficulty]}`}>
                      {meta.difficulty}
                    </span>
                  </div>
                  <div className="relative z-10 flex-1 space-y-1.5">
                    <h2 className={`text-base font-bold text-[color:var(--foreground)] ${meta.accentHover} transition-colors duration-200`}>{topic.title}</h2>
                    <p className={`text-[11px] font-semibold font-mono ${meta.accent} opacity-60`}>{topic.subtitle}</p>
                    <p className="text-sm text-[color:var(--foreground)]/55 leading-relaxed pt-0.5">{topic.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/50 relative z-10">
                    <div className="flex gap-3 text-[10px] font-mono text-[color:var(--foreground)]/35">
                      <span>📖 {totalSections} sections</span>
                      {totalCheckpoints > 0 && <span>⚡ {totalCheckpoints} checkpoints</span>}
                    </div>
                    <span className={`text-sm font-bold ${meta.accent} group-hover:translate-x-1 transition-transform duration-200`}>Start →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* ── Sandbox CTA ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-dashed border-violet-500/25 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="space-y-1.5">
              <p className="text-base font-bold text-[color:var(--foreground)]">Ready to build your own?</p>
              <p className="text-sm text-[color:var(--foreground)]/50 max-w-sm">
                Open the <strong className="text-violet-400">Interactive Sandbox</strong> — drag, drop, connect components, and run your own custom simulations from scratch.
              </p>
            </div>
            <Link
              href="/workspace"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Open Sandbox
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z" />
                <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z" />
              </svg>
            </Link>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
