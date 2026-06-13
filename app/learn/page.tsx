"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { LEARN_TOPICS, LearnTopic } from "@/learn/topics";
import { ComponentIcon } from "@/components/ComponentIcons";
import { motion } from "framer-motion";

type Theme = "light" | "dark";

export default function LearnOverviewPage() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const getTopicIconType = (id: string): string => {
    switch (id) {
      case "load-balancers":
        return "load-balancer";
      case "cache-aside":
        return "redis";
      case "api-gateways":
        return "api-gateway";
      case "valet-key":
        return "storage";
      default:
        return "server";
    }
  };

  const getTopicBadgeColor = (id: string): string => {
    switch (id) {
      case "load-balancers":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "cache-aside":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "api-gateways":
        return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20";
      case "valet-key":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] relative overflow-hidden">
      {/* Background Technical Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-30" />

      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showHomeLink
        badgeText="Learn Academy"
        alwaysGlass={true}
      />

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        {/* Banner Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 uppercase tracking-widest font-mono">
              💡 Interactive System Design Guides
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[color:var(--foreground)] via-violet-400 to-fuchsia-500 bg-clip-text text-transparent"
          >
            Learn Architectures Visually
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base md:text-lg text-[color:var(--foreground)]/60 leading-relaxed"
          >
            Stop reading dry paragraphs. Explore interactive step-by-step documentation powered by our live simulation engine. Click components, run queries, and master system designs.
          </motion.p>
        </div>

        {/* Lessons Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {LEARN_TOPICS.map((topic: LearnTopic) => {
            const iconType = getTopicIconType(topic.id);
            const badgeClass = getTopicBadgeColor(topic.id);
            const totalSections = topic.sections.length;
            const totalCheckpoints = topic.sections.reduce(
              (acc: number, s) => acc + (s.checkpoints?.length || 0),
              0
            );

            return (
              <Link
                key={topic.id}
                href={`/learn/${topic.id}`}
                className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)]/45 p-6 hover:bg-[var(--surface)] hover:border-violet-500/40 transition-all duration-300 flex flex-col justify-between shadow-xl backdrop-blur-md overflow-hidden"
              >
                {/* Glow Effect on Hover */}
                <div className="absolute -inset-px bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-fuchsia-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] group-hover:scale-105 transition-transform duration-300">
                      <ComponentIcon type={iconType} className="w-7 h-7 text-violet-400 group-hover:text-violet-300 transition-colors" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}>
                      {topic.id.replace("-", " ")}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold group-hover:text-violet-400 transition-colors">
                      {topic.title}
                    </h2>
                    <p className="text-xs text-[color:var(--foreground)]/45 font-semibold mt-1 font-mono">
                      {topic.subtitle}
                    </p>
                    <p className="text-xs text-[color:var(--foreground)]/60 mt-3 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-8 pt-4 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px] font-mono text-[color:var(--foreground)]/40 relative z-10">
                  <div className="flex gap-4">
                    <span>📖 {totalSections} Sections</span>
                    {totalCheckpoints > 0 && (
                      <span>⚡ {totalCheckpoints} Checkpoints</span>
                    )}
                  </div>
                  <span className="text-violet-400 group-hover:translate-x-1.5 transition-transform font-bold">
                    Start Guide ➔
                  </span>
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </main>
  );
}
