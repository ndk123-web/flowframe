"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ArchDiagram from "@/components/ArchDiagram";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import ShortUniqueId from "short-unique-id";

type Theme = "light" | "dark";

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function HeroArchitecture() {
  return (
    <div className="relative h-[330px] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-4 shadow-[0_25px_80px_-40px_var(--glow)] backdrop-blur">
      <div className="technical-grid absolute inset-0 opacity-65" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.2),transparent_45%),radial-gradient(circle_at_35%_85%,rgba(124,58,237,0.16),transparent_45%)]" />
      <ArchDiagram active speed={1} className="relative z-10" />
      <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]/85 px-3 py-2 text-xs text-[color:var(--foreground)]/70 backdrop-blur">
        live request stream
      </div>
    </div>
  );
}

function buildSimulation() {
  const uid = new ShortUniqueId({ length: 10 });
  const graph = new GraphManager(uid.rnd(10));
  const registry = new NodeRegistry(uid.rnd(10));
  const simulation = new SimulationManager(graph, registry);
  const strategy = new RoundRobinStrategy();

  const lbId = uid.rnd(10);
  const s1Id = uid.rnd(10);
  const s2Id = uid.rnd(10);
  const s3Id = uid.rnd(10);
  const clientId = uid.rnd(10);

  const lb     = new LoadBalancerModel(lbId, "LoadBalancer", strategy);
  const s1     = new ServerModel(s1Id, "Server 1");
  const s2     = new ServerModel(s2Id, "Server 2");
  const s3     = new ServerModel(s3Id, "Server 3");
  const client = new ClientModel(clientId, "Client");

  graph.addNode(lbId, "LoadBalancer");
  graph.addNode(s1Id, "Server 1");
  graph.addNode(s2Id, "Server 2");
  graph.addNode(s3Id, "Server 3");
  graph.addNode(clientId, "Client");

  graph.addEdge(clientId, lbId);
  graph.addEdge(lbId, s1Id);
  graph.addEdge(lbId, s2Id);
  graph.addEdge(lbId, s3Id);

  registry.register(lbId, lb);
  registry.register(s1Id, s1);
  registry.register(s2Id, s2);
  registry.register(s3Id, s3);
  registry.register(clientId, client);

  // 6 requests × 2 frames each = 12 total, round-robin: S1→S2→S3→S1→S2→S3
  for (let i = 0; i < 6; i++) {
    simulation.runTest(clientId);
  }

  return {
    frames: simulation.getFrames(),
    meta: { lbId, s1Id, s2Id, s3Id, clientId },
  };
}

function InteractivePreview() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);

  // Run simulation once — lazy initialiser avoids setState-in-effect lint rule
  const [{ frames }] = useState<ReturnType<typeof buildSimulation>>(buildSimulation);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 900 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, frames.length]);

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 p-6 shadow-[0_35px_90px_-50px_var(--glow)]">
          <div className="technical-grid absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(59,130,246,0.14),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(124,58,237,0.12),transparent_40%)]" />

          <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Interactive Simulation Preview
            </h2>
            <div className="rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1 text-sm text-[color:var(--foreground)]/70">
              frame {frameIndex + 1} / {frames.length || "—"}
            </div>
          </div>

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="relative h-[360px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/70 p-4">
              <ArchDiagram
                active={isPlaying}
                speed={speed}
                frameIndex={frameIndex}
                className="h-full w-full"
              />
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 backdrop-blur">
              <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[color:var(--foreground)]/55">
                controls
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-left text-sm transition hover:-translate-y-0.5"
                >
                  Play
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying(false)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-left text-sm transition hover:-translate-y-0.5"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() => setFrameIndex((prev) => (prev + 1) % Math.max(frames.length, 1))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-left text-sm transition hover:-translate-y-0.5"
                >
                  Next Frame
                </button>
                <label className="block text-sm">
                  <span className="mb-1 block text-[color:var(--foreground)]/70">
                    Speed: {speed.toFixed(1)}x
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                    className="w-full accent-blue-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-50" />
      <div className="pointer-events-none absolute -left-24 top-[-120px] -z-10 h-[340px] w-[340px] rounded-full bg-blue-500/18 blur-[85px]" />
      <div className="pointer-events-none absolute -right-14 top-[220px] -z-10 h-[320px] w-[320px] rounded-full bg-violet-500/16 blur-[85px]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold tracking-tight">FlowFrame</div>
        <button
          type="button"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-2 text-sm transition hover:-translate-y-0.5"
        >
          {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
        </button>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-14 pt-4 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <Reveal>
          <div>
            <p className="mb-4 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">
              Interactive Distributed System Simulator
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              See Distributed Systems in Motion
            </h1>
            <p className="mt-5 max-w-xl text-base text-[color:var(--foreground)]/70 md:text-lg">
              FlowFrame lets you design architectures and watch requests move
              through your system step-by-step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.01 }}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-medium text-white shadow-[0_15px_40px_-20px_var(--glow)]"
              >
                Open Simulator
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-5 py-3 text-sm font-medium"
              >
                View Demo
              </motion.button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <HeroArchitecture />
        </Reveal>
      </section>

      <InteractivePreview />

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
        {[
          {
            title: "Frame-by-frame simulation",
            body: "Step through distributed systems one request at a time.",
          },
          {
            title: "Strategy-driven behavior",
            body: "Visualize load balancing algorithms like round robin and more.",
          },
          {
            title: "Architecture playground",
            body: "Build and test system designs interactively.",
          },
        ].map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.08}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5 shadow-[0_20px_40px_-35px_var(--glow)]">
              <div className="mb-4 h-28 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <motion.div
                  className="h-2 w-20 rounded-full bg-gradient-to-r from-blue-400 to-violet-500"
                  animate={{ x: [0, 52, 0] }}
                  transition={{ duration: 2.4 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)]" />
                  <div className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)]" />
                  <div className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)]" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--foreground)]/70">{feature.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/75 p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Built for engineers who want to understand systems, not just draw diagrams.
              </h2>
              <p className="mt-4 text-[color:var(--foreground)]/70">
                Model realistic architectures with load balancers, caches, message queues,
                and databases, then trace how every request behaves over time.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-[color:var(--foreground)]/75">
                {[
                  "load balancers",
                  "caches",
                  "message queues",
                  "databases",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative h-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
              <div className="technical-grid absolute inset-0 opacity-60" />
              <ArchDiagram active speed={0.7} className="relative z-10 h-full w-full" />
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600 px-6 py-16 text-center text-white shadow-[0_40px_100px_-50px_rgba(59,130,246,0.55)] md:px-14">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Start exploring system behavior.
            </h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Open Simulator
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/45 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                View GitHub
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-6 py-7 text-sm text-[color:var(--foreground)]/65">
        <span>FlowFrame</span>
        <div className="flex gap-5">
          <a href="#">GitHub</a>
          <a href="#">Docs</a>
          <a href="#">Author</a>
        </div>
      </footer>
    </main>
  );
}
