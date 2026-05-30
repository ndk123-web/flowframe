"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  ReactFlow,
  BaseEdge,
  Background,
  BackgroundVariant,
  getSmoothStepPath,
  type Node,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Ipv4Generator from "@/utils/generateRandomIp";
import Link from "next/link";

type Theme = "light" | "dark";

// CSS Animations
const animationStyles = `
  @keyframes fadeInBlur {
    from {
      opacity: 0;
      transform: translateY(32px);
      filter: blur(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0px);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes breatheScale {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideHover {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(4px);
    }
  }

  @keyframes packetSlide {
    0% { left: 0%; opacity: 0; }
    20% { opacity: 1; transform: scale(1.2); }
    80% { opacity: 1; transform: scale(1); }
    100% { left: 100%; opacity: 0; transform: scale(0.8); }
  }

  .animate-packet-slide {
    animation: packetSlide 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes underlineExpand {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 100% 100%;
    }
  }

  @keyframes playIconPulse {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(4px);
    }
  }

  .animate-fade-in-blur {
    animation: fadeInBlur 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .animate-fade-in-scale {
    animation: fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-breathe {
    animation: breatheScale 2s infinite;
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.6s ease-out forwards;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.6s ease-out forwards;
  }

  .animate-play-icon {
    animation: playIconPulse 3s infinite;
  }

  .animate-underline {
    animation: underlineExpand 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .animate-gradient-shift {
    animation: gradientShift 20s linear infinite;
  }

  .hover\:animate-slide-x:hover {
    animation: slideHover 0.3s ease-out forwards;
  }
`;

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={setRef}
      className={isVisible ? "animate-fade-in-blur" : "opacity-0"}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

function AnimatedBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)]/50 bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[color:var(--foreground)]/80 backdrop-blur border-violet-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-blue-400" />
      Distributed System Simulator
    </div>
  );
}

function packetColor(isReverseMotion: boolean) {
  return isReverseMotion ? "#f59e0b" : "#8b5cf6";
}

function PacketEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  const isActive = Boolean(data?.active);
  const duration = Number(data?.packetDuration ?? 1.6);
  const isReverseMotion = Boolean(data?.reverseMotion);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeOpacity: isActive ? 0.95 : 0.3,
          transition: "stroke-opacity 120ms ease",
        }}
      />
      {isActive && (
        <circle
          key={`${props.id}-${edgePath}`}
          r={4.5}
          fill={packetColor(isReverseMotion)}
          cx="0"
          cy="0"
          style={{
            filter: isReverseMotion
              ? "drop-shadow(0 0 5px rgba(245,158,11,0.85))"
              : "drop-shadow(0 0 5px rgba(139,92,246,0.85))",
          }}
        >
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            path={edgePath}
            keyPoints={isReverseMotion ? "1;0" : "0;1"}
            keyTimes="0;1"
            calcMode="linear"
          />
        </circle>
      )}
    </>
  );
}

function HeroArchitecture() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [simData, setSimData] = useState<any>(null);

  // Generate simulation on mount
  useEffect(() => {
    const data = buildSimulation();
    setSimData(data);
  }, []);

  const nodes = useMemo<Node[]>(() => {
    if (!simData) {
      return [];
    }

    return [
      {
        id: simData.meta.clientId,
        data: { label: "Client" },
        position: { x: 0, y: -200 },
        style: {
          background: "rgba(139, 92, 246, 0.6)",
          border: "2px solid rgba(139, 92, 246, 0.8)",
          borderRadius: "50%",
          padding: "0",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e2e8f0",
          fontSize: "16px",
          fontWeight: 600,
        },
      },
      {
        id: simData.meta.lbId,
        data: { label: "Load Balancer" },
        position: { x: 0, y: -50 },
        style: {
          background: "rgba(59, 130, 246, 0.6)",
          border: "2px solid rgba(59, 130, 246, 0.8)",
          borderRadius: "50%",
          padding: "0",
          width: "100px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e2e8f0",
          fontSize: "16px",
          fontWeight: 600,
        },
      },
      {
        id: simData.meta.s1Id,
        data: { label: "Server 1" },
        position: { x: -120, y: 100 },
        style: {
          background: "rgba(16, 185, 129, 0.6)",
          border: "2px solid rgba(16, 185, 129, 0.8)",
          borderRadius: "50%",
          padding: "0",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e2e8f0",
          fontSize: "14px",
          fontWeight: 600,
        },
      },
      {
        id: simData.meta.s2Id,
        data: { label: "Server 2" },
        position: { x: 0, y: 100 },
        style: {
          background: "rgba(16, 185, 129, 0.6)",
          border: "2px solid rgba(16, 185, 129, 0.8)",
          borderRadius: "50%",
          padding: "0",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e2e8f0",
          fontSize: "14px",
          fontWeight: 600,
        },
      },
      {
        id: simData.meta.s3Id,
        data: { label: "Server 3" },
        position: { x: 120, y: 100 },
        style: {
          background: "rgba(16, 185, 129, 0.6)",
          border: "2px solid rgba(16, 185, 129, 0.8)",
          borderRadius: "50%",
          padding: "0",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e2e8f0",
          fontSize: "14px",
          fontWeight: 600,
        },
      },
    ];
  }, [simData]);

  const edges = useMemo<Edge[]>(() => {
    if (!simData) {
      return [];
    }

    const inactiveStroke = "rgba(148, 163, 184, 0.35)";
    const currentFrame = simData.frames?.[frameIndex];
    const edgeState = new Map<string, { reverseMotion: boolean }>();

    if (currentFrame?.from && currentFrame?.to) {
      const directEdgeId = `${currentFrame.from}->${currentFrame.to}`;
      const reverseEdgeId = `${currentFrame.to}->${currentFrame.from}`;
      const baseEdgeIds = new Set([
        `${simData.meta.clientId}->${simData.meta.lbId}`,
        `${simData.meta.lbId}->${simData.meta.s1Id}`,
        `${simData.meta.lbId}->${simData.meta.s2Id}`,
        `${simData.meta.lbId}->${simData.meta.s3Id}`,
      ]);

      const hasDirect = baseEdgeIds.has(directEdgeId);
      const hasReverse = baseEdgeIds.has(reverseEdgeId);
      const resolvedEdgeId = hasDirect
        ? directEdgeId
        : hasReverse
          ? reverseEdgeId
          : directEdgeId;

      if (baseEdgeIds.has(resolvedEdgeId)) {
        edgeState.set(resolvedEdgeId, { reverseMotion: !hasDirect && hasReverse });
      }
    }

    const baseEdges: Edge[] = [
      {
        id: `${simData.meta.clientId}->${simData.meta.lbId}`,
        source: simData.meta.clientId,
        target: simData.meta.lbId,
        type: "packet",
      },
      {
        id: `${simData.meta.lbId}->${simData.meta.s1Id}`,
        source: simData.meta.lbId,
        target: simData.meta.s1Id,
        type: "packet",
      },
      {
        id: `${simData.meta.lbId}->${simData.meta.s2Id}`,
        source: simData.meta.lbId,
        target: simData.meta.s2Id,
        type: "packet",
      },
      {
        id: `${simData.meta.lbId}->${simData.meta.s3Id}`,
        source: simData.meta.lbId,
        target: simData.meta.s3Id,
        type: "packet",
      },
    ];

    return baseEdges.map((edge) => {
      const active = edgeState.has(edge.id);
      const reverseMotion = edgeState.get(edge.id)?.reverseMotion ?? false;
      return {
        ...edge,
        data: {
          active,
          reverseMotion,
          packetDuration: 1 / speed,
        },
        style: {
          stroke: active ? packetColor(reverseMotion) : inactiveStroke,
          strokeWidth: active ? 2.2 : 1.5,
          transition: "all 0.2s ease",
        },
      };
    });
  }, [frameIndex, simData, speed]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || !simData) return;
    const baseIntervalMs = 1000;
    const intervalMs = baseIntervalMs / speed;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % (simData.frames.length || 1));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isPlaying, simData, speed]);

  if (!simData || nodes.length === 0) return null;

  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-muted)]/40 p-2 shadow-[0_25px_80px_-40px_var(--glow)] backdrop-blur sm:h-[320px] sm:p-4 lg:h-[360px]">
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg%20width=%2780%27%20height=%2780%27%20viewBox=%270%200%2080%2080%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23888888%27%20fill-opacity=%270.1%27%3E%3Cpath%20d=%27M0%200h80v80H0z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')", backgroundSize: "80px 80px" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5" />

      {/* ReactFlow Container with Zoom/Pan Controls */}
      <div className="relative z-10 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          edgeTypes={{ packet: PacketEdge }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          style={{ 
            background: "transparent",
            width: "100%",
            height: "100%"
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={0.5}
            color="rgba(148, 163, 184, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Help Text */}
      <div className="pointer-events-none absolute right-2 top-2 z-20 hidden text-xs text-[color:var(--foreground)]/50 sm:block">
        <div className="text-center leading-snug">
          <div>🖱️ Drag to pan</div>
          <div>🔍 Scroll to zoom</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)]/50 bg-[var(--surface)]/90 px-2 py-2 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto sm:flex-nowrap sm:px-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="rounded px-2 py-1 text-xs font-medium hover:bg-[var(--surface)]/50 transition"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <span className="text-[11px] text-[color:var(--foreground)]/70 sm:text-xs">
          Frame {frameIndex + 1}/{simData.frames.length}
        </span>
        <input
          type="range"
          min="0"
          max={Math.max(simData.frames.length - 1, 0)}
          value={frameIndex}
          onChange={(e) => {
            setFrameIndex(Number(e.target.value));
            setIsPlaying(false);
          }}
          className="h-1 min-w-0 flex-1 accent-violet-500 sm:w-32 sm:flex-none"
        />
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.25"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="h-1 w-16 accent-blue-500 sm:w-20"
          title="Playback speed"
        />
        <span className="text-[11px] text-[color:var(--foreground)]/70 sm:text-xs">{speed.toFixed(2)}x</span>
      </div>
    </div>
  );
}

function buildSimulation() {
  const uid = new ShortUniqueId({ length: 10 });
  const graph = new GraphManager(uid.rnd(10));
  const registry = new NodeRegistry(uid.rnd(10));
  const ipv4Instance = new Ipv4Generator();
  const strategy = new RoundRobinStrategy();

  const lbId = "lb-1";
  const s1Id = "server-1";
  const s2Id = "server-2";
  const s3Id = "server-3";
  const clientId = "client-1";

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

  const allFrames: any[] = [];
  
  for (let i = 0; i < 3; i++) {
    const sourceIp = ipv4Instance.getRandomIpv4() as string;
    const simulation = new SimulationManager(
      graph,
      registry,
      {},
      sourceIp,
    );
    simulation.runSimulation(clientId);

    const runFrames = (simulation.getFrames() as any[]).map((frame) => ({
      ...frame,
      sourceIp,
      payloadSummary: "{}",
    }));

    allFrames.push(...runFrames);
  }

  return {
    frames: allFrames,
    meta: { lbId, s1Id, s2Id, s3Id, clientId },
  };
}

// ===== HOW IT WORKS SECTION =====
function HowItWorks() {
  const steps = [
    { num: "01", title: "Choose a Scenario", description: "Select from predefined distributed system patterns like load balancing, caching, or rate limiting.", icon: "🎯" },
    { num: "02", title: "Watch the Flow", description: "See requests travel through your architecture in real-time. Understand bottlenecks and latencies.", icon: "🌊" },
    { num: "03", title: "Inspect State", description: "Pause the simulation at any frame. Check Redis cache, Postgres data, or server loads instantly.", icon: "🔍" },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-20 text-center animate-fade-in-blur">
          <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            How FlowFrame Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[color:var(--foreground)]/70">
            A visual, interactive approach to mastering complex backend architectures.
          </p>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3">
          <div className="absolute top-12 left-10 hidden h-0.5 w-[calc(100%-5rem)] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent md:block" />

          {steps.map((step, index) => (
            <Reveal key={step.num} delay={index * 0.15}>
              <div className="group relative z-10 mx-auto flex flex-col items-center text-center">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--surface)] border-2 border-[var(--border)] shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-violet-500/50 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]">
                  <span className="text-4xl">{step.icon}</span>
                </div>
                <div className="rounded-3xl border border-[var(--border)]/50 bg-[var(--surface)]/40 p-8 backdrop-blur-sm transition-all duration-300 group-hover:bg-[var(--surface)]/80 hover:border-violet-500/30">
                  <div className="mb-3 text-xs font-bold tracking-widest text-violet-400">STEP {step.num}</div>
                  <h3 className="mb-4 text-2xl font-bold text-[color:var(--foreground)]">{step.title}</h3>
                  <p className="text-base leading-relaxed text-[color:var(--foreground)]/70">{step.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ===== MODERN BENTO GRID FEATURES =====
function FeaturesBentoGrid() {
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 animate-fade-in-blur md:w-2/3">
          <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Powerful Simulation Engine
          </h2>
          <p className="text-lg text-[color:var(--foreground)]/70">
            Explore concepts that are usually hidden behind terminal logs and metrics dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-2">
          <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-[2.5rem] border border-[var(--border)]/50 bg-[var(--surface)]/30 p-10 transition-all hover:bg-[var(--surface)]/50 hover:border-blue-500/30">
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[80px] transition-all group-hover:bg-blue-500/20" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="mb-10">
                <span className="mb-6 inline-block rounded-2xl bg-blue-500/20 p-4 text-3xl">⚡</span>
                <h3 className="mb-4 text-3xl font-bold tracking-tight">Real-time Visualization</h3>
                <p className="max-w-md text-lg leading-relaxed text-[color:var(--foreground)]/70">
                  Watch packets travel across your network. See exactly how load balancers distribute traffic and how databases handle concurrent requests in real-time.
                </p>
              </div>
              <div className="relative mt-2 h-56 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 shadow-inner flex flex-col justify-center">
                {/* Status Bar */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 font-mono text-xs backdrop-blur-md border border-white/5">
                  <span className="text-emerald-400 animate-pulse">●</span>
                  <span className="text-[color:var(--foreground)]/80">Live Traffic</span>
                </div>
                
                {/* Abstract grid background */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg%20width=%2730%27%20height=%2730%27%20viewBox=%270%200%2030%2030%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath%20d=%27M0%200h30v30H0z%27%20fill=%27none%27/%3E%3Cpath%20d=%27M0%2029h30M29%200v30%27%20stroke=%27%23fff%27%20stroke-width=%271%27/%3E%3C/svg%3E')" }} />
                
                <div className="relative flex w-full max-w-[85%] mx-auto items-center justify-between z-10">
                  {/* Flow Path 1 */}
                  <div className="absolute left-[3rem] right-[50%] top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-violet-500/20 to-blue-500/20">
                    <div className="absolute top-1/2 h-2 w-6 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)] animate-packet-slide" />
                  </div>

                  {/* Client Node */}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/50 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-md">
                    <span className="text-xl">💻</span>
                  </div>

                  {/* Flow Path 2 (to servers) */}
                  <div className="absolute left-[50%] right-[3rem] top-[30%] h-[2px] bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rotate-[15deg] origin-left">
                     <div className="absolute top-1/2 h-2 w-6 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-packet-slide" style={{ animationDelay: "1s" }} />
                  </div>
                  <div className="absolute left-[50%] right-[3rem] top-[70%] h-[2px] bg-gradient-to-r from-blue-500/20 to-emerald-500/20 -rotate-[15deg] origin-left">
                     <div className="absolute top-1/2 h-2 w-6 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-packet-slide" style={{ animationDelay: "2s" }} />
                  </div>

                  {/* Load Balancer */}
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.3)] backdrop-blur-md">
                    <span className="text-2xl animate-breathe">⚖️</span>
                  </div>

                  {/* Servers */}
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="relative flex w-12 h-12 items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md">
                      <span className="text-xs font-bold text-emerald-400">S1</span>
                    </div>
                    <div className="relative flex w-12 h-12 items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md">
                      <span className="text-xs font-bold text-emerald-400">S2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--border)]/50 bg-[var(--surface)]/30 p-8 transition-all hover:bg-[var(--surface)]/50 hover:border-violet-500/30">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-[50px] transition-all group-hover:bg-violet-500/20" />
            <div className="relative z-10">
               <span className="mb-5 inline-block rounded-2xl bg-violet-500/20 p-3 text-2xl">💾</span>
               <h3 className="mb-3 text-xl font-bold">State Inspection</h3>
               <p className="text-base leading-relaxed text-[color:var(--foreground)]/70">
                 Pause the timeline. Inspect Redis memory limits, Postgres connections, and queue lengths globally.
               </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--border)]/50 bg-[var(--surface)]/30 p-8 transition-all hover:bg-[var(--surface)]/50 hover:border-emerald-500/30">
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-[50px] transition-all group-hover:bg-emerald-500/20" />
            <div className="relative z-10">
               <span className="mb-5 inline-block rounded-2xl bg-emerald-500/20 p-3 text-2xl">🎮</span>
               <h3 className="mb-3 text-xl font-bold">Interactive Playback</h3>
               <p className="text-base leading-relaxed text-[color:var(--foreground)]/70">
                 Rewind mistakes. Fast-forward simulations. Learn at your own pace with precise timeline controls.
               </p>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ===== WHAT YOU CAN BUILD / SCENARIOS =====
function ScenariosShowcase() {
  const scenarios = [
    { title: "Load Balancing", desc: "Round-robin, IP Hash, Least Connections", color: "from-blue-500/10 to-cyan-500/5 hover:border-cyan-500/30", icon: "⚖️" },
    { title: "Caching Layers", desc: "Cache penetration, Redis hit/miss ratios", color: "from-orange-500/10 to-red-500/5 hover:border-orange-500/30", icon: "🚀" },
    { title: "API Gateway", desc: "Authentication, Rate Limiting, Routing", color: "from-violet-500/10 to-fuchsia-500/5 hover:border-fuchsia-500/30", icon: "🚪" },
    { title: "Valet Key Pattern", desc: "Direct client-storage access via tokens", color: "from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30", icon: "🔑" },
  ];

  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-24 border-y border-[var(--border)]/30 bg-[var(--surface-muted)]/10 my-10">
         <div className="mb-14 text-center animate-fade-in-blur">
          <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Simulate Complex Scenarios
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[color:var(--foreground)]/70">
            Pre-built architectural patterns ready for exploration.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((s, i) => (
             <Reveal key={s.title} delay={i * 0.1}>
              <div className={`group flex h-full cursor-pointer flex-col justify-between rounded-[2rem] border border-[var(--border)]/50 bg-gradient-to-br ${s.color} p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]`}>
                <div>
                  <div className="mb-6 text-4xl drop-shadow-md transition-transform group-hover:scale-110 group-hover:rotate-6 origin-bottom-left">{s.icon}</div>
                  <h3 className="mb-3 text-xl font-bold text-[color:var(--foreground)]">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-[color:var(--foreground)]/70">{s.desc}</p>
                </div>
                <div className="mt-8 flex items-center text-sm font-bold text-[color:var(--foreground)]/40 transition-colors group-hover:text-[color:var(--foreground)]" onClick={() => {
                  // Navigate to scenarios page with no loading
                }}>
                  
                   <Link href="/scenarios" className="absolute inset-0 z-10" ></Link>
                  Explore Scenario <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                </div>
              </div>
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
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
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
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              <span className="bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent">
                FlowFrame
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-[color:var(--foreground)]/70 md:text-lg">
              Distributed Systems Made Visible. Watch your architecture breathe.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-8 py-4 text-sm font-bold text-white shadow-[0_15px_40px_-20px_var(--glow)] transition-all hover:shadow-[0_25px_50px_-20px_var(--glow)] hover:scale-105 active:scale-95"
                onClick={() => {
                  router.push("/scenarios");
                }}
              >
                <span>Explore Scenarios</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
              <button
                type="button"
                className="rounded-2xl border-2 border-violet-500/35 bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-8 py-4 text-sm font-bold backdrop-blur transition-all hover:border-violet-500/60 hover:scale-105 active:scale-95 text-violet-400"
                onClick={() => {
                  router.push("/workspace");
                }}
              >
                Interactive Sandbox 🛠️
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <HeroArchitecture />
        </Reveal>
      </section>

      <HowItWorks />
      <FeaturesBentoGrid />
      <ScenariosShowcase />

      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/60 via-blue-500/50 to-violet-600/60 px-6 py-14 text-center shadow-[0_40px_100px_-50px_rgba(59,130,246,0.4)] backdrop-blur transition-all duration-300 hover:shadow-[0_50px_120px_-40px_rgba(59,130,246,0.5)] hover:border-white/20 md:px-12 animate-fade-in-blur">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 animate-gradient-shift" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-white transition-all md:text-4xl group-hover:text-blue-100">
                Start exploring distributed systems visually
              </h2>
              <p className="mt-3 text-base text-white/80 transition-colors group-hover:text-white/90">
                Build intuition about how caches, load balancers, and databases interact.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-fade-in-blur" style={{ animationDelay: "0.3s" }}>
                <button
                  type="button"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:shadow-md active:scale-95"
                  onClick={() => {
                    router.push("/scenarios");
                  }}
                >
                  Launch Simulator →
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition backdrop-blur hover:bg-white/20 hover:scale-105 active:scale-95"
                  onClick={() => {
                    window.open("https://github.com/ndk123-web/flow-frame", "_blank")
                  }}
                >
                  View on GitHub ↗
                </button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <SiteFooter />
    </main>
  );
}
