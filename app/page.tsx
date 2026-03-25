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

  for (let i = 0; i < 6; i++) {
    simulation.runSimulation(clientId);
  }

  return {
    frames: simulation.getFrames(),
    meta: { lbId, s1Id, s2Id, s3Id, clientId },
  };
}

// ===== HOW IT WORKS SECTION =====
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Choose Scenario",
      description: "Pick a predefined system pattern (cache, load balancer, API gateway)",
    },
    {
      num: "02",
      title: "Run Simulation",
      description: "Watch requests flow through your architecture in real time",
    },
    {
      num: "03",
      title: "Debug & Learn",
      description: "Pause frames, inspect node state, view Redis/DB snapshots",
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            How It Works
          </h2>
          <p className="text-base text-[color:var(--foreground)]/70">
            Three simple steps to understand distributed systems
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.num} delay={index * 0.1}>
              <motion.div whileHover={{ y: -3 }} className="relative">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-blue-500/20 text-lg font-bold text-violet-300">
                    {step.num}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-[color:var(--foreground)]/70">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-0.5 w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-violet-500/50 to-transparent md:block" />
                )}
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ===== CORE CONCEPTS SECTION =====
function CoreConcepts() {
  const concepts = [
    {
      title: "Frame-Based Execution",
      description: "Time moves in discrete frames. Each frame contains one unit of work across the system.",
    },
    {
      title: "Request Tracing",
      description: "Follow a single request as it flows through clients, gateways, servers, caches, and databases.",
    },
    {
      title: "Live State Inspection",
      description: "Pause at any frame to inspect node state, cache contents, and pending requests.",
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Core Concepts
          </h2>
          <p className="text-base text-[color:var(--foreground)]/70">
            Understand the unique approach FlowFrame uses to visualize systems
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {concepts.map((concept, index) => (
            <Reveal key={concept.title} delay={index * 0.08}>
              <motion.div
                whileHover={{ borderColor: "rgba(139, 92, 246, 0.5)" }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-4 transition"
              >
                <h3 className="mb-2 font-semibold">{concept.title}</h3>
                <p className="text-sm text-[color:var(--foreground)]/70">{concept.description}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ===== FEATURES PREVIEW SECTION =====
function FeaturePreview() {
  const features = [
    {
      title: "Graph Visualization",
      description: "See your entire architecture at a glance with live node states",
      icon: "🔗",
    },
    {
      title: "Node Inspector",
      description: "Inspect Redis, Postgres, or server state at any frame",
      icon: "🔍",
    },
    {
      title: "Timeline Playback",
      description: "Step through frames with precise control and real-time speed adjustment",
      icon: "⏱",
    },
    {
      title: "Debug Panel",
      description: "View current request details, flow paths, and system state",
      icon: "🐛",
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Built-in Features
          </h2>
          <p className="text-base text-[color:var(--foreground)]/70">
            Everything you need to understand how your systems work
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08}>
              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-5 transition"
              >
                <div className="mb-3 inline-flex rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 p-2.5 text-xl">
                  {feature.icon}
                </div>
                <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
                <p className="text-sm text-[color:var(--foreground)]/70">{feature.description}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ===== OLD CAPABILITIES (keeping but simplified) =====
function KeyCapabilities() {
  const capabilities = [
    {
      label: "Real-time Tracing",
      description: "Watch request flows propagate through your architecture instantly",
    },
    {
      label: "Smart Routing",
      description: "Visualize load balancing strategies distributing traffic",
    },
    {
      label: "Data Persistence",
      description: "See how Redis caches and databases handle requests",
    },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability, index) => (
            <Reveal key={capability.label} delay={index * 0.08}>
              <motion.div
                whileHover={{ y: -2 }}
                className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-5 transition"
              >
                <h3 className="mb-2 font-semibold">{capability.label}</h3>
                <p className="text-sm text-[color:var(--foreground)]/70">
                  {capability.description}
                </p>

                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: 32 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  className="mt-3 h-0.5 bg-gradient-to-r from-violet-500 to-transparent"
                />
              </motion.div>
            </Reveal>
          ))}
        </div>
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
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-4 max-w-xl text-base text-[color:var(--foreground)]/70 md:text-lg"
            >
              Visualize distributed systems. Watch requests flow through load balancers, caches, and databases in real time.
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
                Start Simulation
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:border-[var(--border)]/80"
                onClick={() => {
                  router.push("/scenarios");
                }}
              >
                View Scenarios
              </motion.button>
            </motion.div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <HeroArchitecture />
        </Reveal>
      </section>

      <HowItWorks />

      <CoreConcepts />

      <FeaturePreview />

      <KeyCapabilities />

      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/60 via-blue-500/50 to-violet-600/60 px-6 py-14 text-center shadow-[0_40px_100px_-50px_rgba(59,130,246,0.4)] backdrop-blur md:px-12"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Start exploring distributed systems visually
            </h2>
            <p className="mt-3 text-base text-white/80">
              Build intuition about how caches, load balancers, and databases interact.
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3"
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
                className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition backdrop-blur hover:bg-white/20"
                onClick={() => {
                  window.open("https://github.com/ndk123-web/flow-frame", "_blank")
                }}
              >
                View on GitHub ↗
              </motion.button>
            </motion.div>
          </motion.div>
        </section>
      </Reveal>

      <SiteFooter />
    </main>
  );
}
