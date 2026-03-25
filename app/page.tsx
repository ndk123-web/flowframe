"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ArchDiagram from "@/components/ArchDiagram";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import ShortUniqueId from "short-unique-id";
import { useRouter } from "next/navigation";

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[color:var(--foreground)]/70"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
      Distributed System Simulator
    </motion.div>
  );
}

function HeroArchitecture() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative h-[330px] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-4 shadow-[0_25px_80px_-40px_var(--glow)] backdrop-blur"
    >
      <div className="technical-grid absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_35%_85%,rgba(124,58,237,0.12),transparent_50%)]" />
      <ArchDiagram active speed={1} className="relative z-10" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute bottom-4 left-4 z-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2 text-xs text-[color:var(--foreground)]/70 backdrop-blur"
      >
        Frame-by-frame simulation
      </motion.div>
    </motion.div>
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
    
    simulation.runSimulation(clientId);
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
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 p-6 shadow-[0_35px_90px_-50px_var(--glow)]"
        >
          <div className="technical-grid absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(124,58,237,0.1),transparent_45%)]" />

          <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4">
            <motion.div initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Live Simulation Playground
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-1.5 text-sm font-medium text-[color:var(--foreground)]/80"
            >
              Frame <span className="text-violet-500 font-semibold">{frameIndex + 1}</span> / {frames.length || "—"}
            </motion.div>
          </div>

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_300px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="relative h-[360px] overflow-hidden rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-muted)]/70 backdrop-blur p-4"
            >
              <ArchDiagram
                active={isPlaying}
                speed={speed}
                frameIndex={frameIndex}
                className="h-full w-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 backdrop-blur"
            >
              <p className="mb-4 text-xs uppercase tracking-[0.15em] font-semibold text-[color:var(--foreground)]/55">
                Playback Controls
              </p>
              <div className="space-y-2.5">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    isPlaying
                      ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                      : "border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)]/80"
                  }`}
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFrameIndex((prev) => (prev + 1) % Math.max(frames.length, 1))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm font-medium text-[color:var(--foreground)]/80 transition hover:border-[var(--border)]/80"
                >
                  Next Frame →
                </motion.button>
                <div>
                  <label className="mb-2 block text-xs text-[color:var(--foreground)]/60">
                    Speed: <span className="font-semibold text-[color:var(--foreground)]">{speed.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                    className="w-full"
                    style={{
                      accentColor: "var(--color-violet-500)",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </Reveal>
  );
}

export default function Home() {
  const router = useRouter();

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

      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      />

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-14 pt-4 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <Reveal>
          <div>
            <AnimatedBadge />
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
            >
              <span className="bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent">
                FlowFrame
              </span>
              <br />
              Watch Systems Come Alive
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-5 max-w-xl text-base text-[color:var(--foreground)]/70 md:text-lg"
            >
              Design distributed architectures and trace every request in real-time. 
              Step through simulations frame-by-frame to understand complex system behavior.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <motion.button
                type="button"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_40px_-20px_var(--glow)] transition hover:shadow-[0_20px_50px_-20px_var(--glow)]"
                onClick={() => {
                  router.push("/scenarios/");
                }}
              >
                Launch Simulator
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:border-[var(--border)]/80"
                onClick={() => {
                  router.push("/scenarios/simple-load-balancer");
                }}
              >
                View Live Demo
              </motion.button>
            </motion.div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <HeroArchitecture />
        </Reveal>
      </section>

      <InteractivePreview />

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
        {[
          {
            title: "Step-by-step Tracing",
            body: "Pause and inspect each frame to see exactly what happens at every stage of request flow.",
            icon: "▶"
          },
          {
            title: "Smart Load Balancing",
            body: "Visualize round-robin, random, and custom strategies distributing load across servers.",
            icon: "⚖️"
          },
          {
            title: "Cache & Database",
            body: "Watch Redis hits/misses and database queries in real time with live data snapshots.",
            icon: "💾"
          },
        ].map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5 shadow-[0_20px_40px_-35px_var(--glow)] transition"
            >
              <div className="mb-4 text-3xl">{feature.icon}</div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--foreground)]/70">{feature.body}</p>
            </motion.div>
          </Reveal>
        ))}
      </section>

      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-white/15 bg-gradient-to-br from-blue-600/80 via-blue-500/70 to-violet-600/80 px-6 py-16 text-center text-white shadow-[0_40px_100px_-50px_rgba(59,130,246,0.5)] backdrop-blur md:px-14"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Ready to explore distributed systems?
            </h2>
            <p className="mt-4 text-base text-white/80 md:text-lg">
              Launch FlowFrame and start building simulations instantly.
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition shadow-lg hover:shadow-xl"
                onClick={() => {
                  router.push("/scenarios");
                }}
              >
                Launch Simulator →
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-white/40 bg-white/15 px-6 py-3 text-sm font-semibold text-white transition backdrop-blur hover:bg-white/20"
                onClick={() => {
                  window.open("https://github.com/ndk123-web/flow-frame", "_blank")
                }}
              >
                GitHub ↗
              </motion.button>
            </motion.div>
          </motion.div>
        </section>
      </Reveal>

      <SiteFooter />
    </main>
  );
}
