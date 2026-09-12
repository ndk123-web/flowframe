"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FiZap,
  FiCpu,
  FiArrowRight,
  FiDatabase,
  FiServer,
  FiLayers,
  FiSliders,
  FiX,
} from "react-icons/fi";

const QUICK_SUGGESTIONS = [
  {
    label: "Cache-Aside",
    icon: <FiDatabase className="size-3 text-rose-400" />,
    prompt: "API Gateway routing to a User Service with Redis read-through caching and PostgreSQL fallback",
  },
  {
    label: "Load Balancer",
    icon: <FiServer className="size-3 text-blue-400" />,
    prompt: "Client sending requests to a Round-Robin Load Balancer distributing across 3 backend application servers",
  },
  {
    label: "API Gateway",
    icon: <FiLayers className="size-3 text-indigo-400" />,
    prompt: "API Gateway routing /posts and /users to separate microservices with isolated buffers",
  },
  {
    label: "Message Queue",
    icon: <FiSliders className="size-3 text-amber-400" />,
    prompt: "Order Producer publishing events into a FIFO Message Queue processed by worker consumer",
  },
];

export default function DashboardQuickAI() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleGenerate = (customPrompt?: string) => {
    const finalPrompt = (customPrompt || prompt).trim();
    const query = finalPrompt ? `&prompt=${encodeURIComponent(finalPrompt)}` : "";
    router.push(`/workspace?ai=true${query}`);
  };

  return (
    <div className="relative rounded-xl border border-border bg-card/85 p-4 sm:p-4.5 shadow-xs space-y-3 transition-all hover:border-primary/30">
      {/* ── Top Row: Header & Subtle Indicator ─────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <FiCpu className="size-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
              Architecture AI Copilot
            </h3>
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
            >
              Beta
            </Badge>
          </div>
        </div>

        <span className="text-[11px] text-muted-foreground hidden md:inline truncate">
          Generate system architecture directly from text
        </span>
      </div>

      {/* ── Command Input Bar ───────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1 flex items-center min-w-0">
          <FiZap className="absolute left-3 size-3.5 text-primary shrink-0 pointer-events-none" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your system (e.g. API Gateway with Redis cache and Postgres DB)..."
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          />
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt("")}
              className="absolute right-2.5 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear input"
            >
              <FiX className="size-3" />
            </button>
          )}
        </div>

        <Button
          type="submit"
          size="sm"
          className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer shadow-xs"
        >
          <span>Generate</span>
          <FiArrowRight className="size-3" />
        </Button>
      </form>

      {/* ── Quick Pattern Chips ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 scrollbar-thin">
        <span className="text-[10px] font-mono uppercase text-muted-foreground shrink-0 mr-0.5">
          Quick:
        </span>
        {QUICK_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleGenerate(item.prompt)}
            className="px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/50 text-[11px] font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5"
            title={item.prompt}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
