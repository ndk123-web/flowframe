"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  BaseEdge,
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  getSmoothStepPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

// In a real app, you might fetch this from an API or filesystem based on the scenarioId. For this demo, we're hardcoding it.
import { ALL_SCENARIOS } from "@/scenarios/all";

type Theme = "light" | "dark";

type Frame = {
  requestId: string;
  requestName: string;
  from: string;
  to: string;
  timestamp: number;
  action?: string;
};

type SimBundle = {
  frames: Frame[];
  nodes: Node[];
  edges: Edge[];
};

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
    borderRadius: 14,
  });

  const isActive = Boolean(data?.active);
  const packetDuration = Number(data?.packetDuration ?? 2.4);
  const isReverseMotion = Boolean(data?.reverseMotion);
  const edgeOpacity = isActive ? 0.95 : 0.45;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeOpacity: edgeOpacity,
          transition: "stroke-opacity 220ms ease",
        }}
      />
      {isActive && (
        <circle
          key={`${packetDuration}-${isReverseMotion ? "rev" : "fwd"}`}
          r="5"
          fill={isReverseMotion ? "#f59e0b" : "#8b5cf6"}
          style={{
            filter: isReverseMotion
              ? "drop-shadow(0 0 8px rgba(245,158,11,0.95))"
              : "drop-shadow(0 0 8px rgba(139,92,246,0.95))",
          }}
        >
          <animateMotion
            dur={`${packetDuration}s`}
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

const edgeTypes = { packet: PacketEdge };

// function createSimulationBundle(): SimBundle {
//   const graph = new GraphManager("graph-1");
//   const registry = new NodeRegistry("registry-1");
//   const simulation = new SimulationManager(graph, registry);
//   const strategy = new RoundRobinStrategy();

//   const clientId = "client-1";
//   const lbId = "lb-1";
//   const s1Id = "server-1";
//   const s2Id = "server-2";
//   const s3Id = "server-3";

//   const client = new ClientModel(clientId, "Client");
//   const lb = new LoadBalancerModel(lbId, "LoadBalancer", strategy);
//   const s1 = new ServerModel(s1Id, "Server 1");
//   const s2 = new ServerModel(s2Id, "Server 2");
//   const s3 = new ServerModel(s3Id, "Server 3");

//   graph.addNode(clientId, "Client");
//   graph.addNode(lbId, "LoadBalancer");
//   graph.addNode(s1Id, "Server 1");
//   graph.addNode(s2Id, "Server 2");
//   graph.addNode(s3Id, "Server 3");

//   graph.addEdge(clientId, lbId);
//   graph.addEdge(lbId, s1Id);
//   graph.addEdge(lbId, s2Id);
//   graph.addEdge(lbId, s3Id);

//   registry.register(clientId, client);
//   registry.register(lbId, lb);
//   registry.register(s1Id, s1);
//   registry.register(s2Id, s2);
//   registry.register(s3Id, s3);

//   for (let i = 0; i < 8; i++) {
//     simulation.runTest(clientId);
//   }

//   const flowNodes: Node[] = [
//     {
//       id: clientId,
//       data: { label: "Client" },
//       position: { x: 40, y: 210 },
//       type: "default",
//       style: {
//         background: "var(--surface)",
//         color: "var(--foreground)",
//         border: "1px solid var(--border)",
//         borderRadius: "12px",
//         padding: "8px 12px",
//         fontWeight: 600,
//       },
//     },
//     {
//       id: lbId,
//       data: { label: "Load Balancer" },
//       position: { x: 320, y: 210 },
//       type: "default",
//       style: {
//         background: "var(--surface)",
//         color: "var(--foreground)",
//         border: "1px solid var(--border)",
//         borderRadius: "12px",
//         padding: "8px 12px",
//         fontWeight: 600,
//       },
//     },
//     {
//       id: s1Id,
//       data: { label: "Server 1" },
//       position: { x: 700, y: 60 },
//       type: "default",
//       style: {
//         background: "var(--surface)",
//         color: "var(--foreground)",
//         border: "1px solid var(--border)",
//         borderRadius: "12px",
//         padding: "8px 12px",
//         fontWeight: 600,
//       },
//     },
//     {
//       id: s2Id,
//       data: { label: "Server 2" },
//       position: { x: 700, y: 210 },
//       type: "default",
//       style: {
//         background: "var(--surface)",
//         color: "var(--foreground)",
//         border: "1px solid var(--border)",
//         borderRadius: "12px",
//         padding: "8px 12px",
//         fontWeight: 600,
//       },
//     },
//     {
//       id: s3Id,
//       data: { label: "Server 3" },
//       position: { x: 700, y: 360 },
//       type: "default",
//       style: {
//         background: "var(--surface)",
//         color: "var(--foreground)",
//         border: "1px solid var(--border)",
//         borderRadius: "12px",
//         padding: "8px 12px",
//         fontWeight: 600,
//       },
//     },
//   ];

//   const edgeBaseStyle = {
//     stroke: "#60a5fa",
//     strokeWidth: 1.8,
//   };

//   const flowEdges: Edge[] = [
//     {
//       id: `${clientId}->${lbId}`,
//       source: clientId,
//       target: lbId,
//       type: "packet",
//       markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
//       style: edgeBaseStyle,
//       data: { active: false, packetDuration: 1.9 },
//     },
//     {
//       id: `${lbId}->${s1Id}`,
//       source: lbId,
//       target: s1Id,
//       type: "packet",
//       markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
//       style: edgeBaseStyle,
//       data: { active: false, packetDuration: 2.15 },
//     },
//     {
//       id: `${lbId}->${s2Id}`,
//       source: lbId,
//       target: s2Id,
//       type: "packet",
//       markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
//       style: edgeBaseStyle,
//       data: { active: false, packetDuration: 2.15 },
//     },
//     {
//       id: `${lbId}->${s3Id}`,
//       source: lbId,
//       target: s3Id,
//       type: "packet",
//       markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
//       style: edgeBaseStyle,
//       data: { active: false, packetDuration: 2.15 },
//     },
//   ];

//   return {
//     frames: simulation.getFrames() as Frame[],
//     nodes: flowNodes,
//     edges: flowEdges,
//   };
// }


type ScenarioPropsPage = {
  params : Promise<{ scenarioId: string }>;
}

export default function ScenarioPage({ params }: ScenarioPropsPage) {

  // For simplicity, we're only supporting one scenario in this demo. In a real app, you might fetch scenario data from an API or filesystem based on the scenarioId.
  const { scenarioId } = use(params);

  // This is a bit hacky, but it allows us to keep all the scenario creation logic in separate files while still using React state and hooks in this page component. Each scenario file exports a function that creates the simulation bundle (frames, nodes, edges) for that scenario, and we call it here based on the scenarioId.
  const createSimulationBundle: any = ALL_SCENARIOS.get(scenarioId)

  if (!createSimulationBundle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-lg text-[color:var(--foreground)]/75">Scenario not found.</p>
      </div>
    );
  }


  // We only want to create the simulation bundle once when the component mounts, so we use useState with a function initializer to call the createSimulationBundle function. This way, the simulation is only created once and we can keep all the simulation state (frames, nodes, edges) in React state.
  const [{ frames, nodes, edges }] = useState<SimBundle>(createSimulationBundle);
  
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      return;
    }

    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1000 / speed);

    return () => clearInterval(id);
  }, [isPlaying, frames.length, speed]);

  // whenever speed changes always start from the first frame, this is because the frames are designed to be played at normal speed, if we change the speed in the middle of the playback, it might cause some frames to be skipped or played too fast, which can lead to a confusing visualization. By resetting to the first frame whenever the speed changes, we ensure that the simulation always starts from a consistent state and plays smoothly at the new speed.
  useEffect(() => {
    setFrameIndex(0);
  }, [speed]);

  const currentFrame = frames[frameIndex] ?? null;

  // useMemo in react use for expensive calculation and return memoized value, it only recompute the memoized value when one of the dependencies has changed. This optimization helps to avoid expensive calculations on every render when the dependencies haven't changed.
  const animatedEdges = useMemo(() => {
    if (!currentFrame) {
      return edges;
    }

    const directEdgeId = `${currentFrame.from}->${currentFrame.to}`;
    const reverseEdgeId = `${currentFrame.to}->${currentFrame.from}`;
    const hasDirectEdge = edges.some((edge) => edge.id === directEdgeId);
    const hasReverseEdge = edges.some((edge) => edge.id === reverseEdgeId);

    const activeEdgeId = hasDirectEdge
      ? directEdgeId
      : hasReverseEdge
        ? reverseEdgeId
        : directEdgeId;
    const isReverseMotion = !hasDirectEdge && hasReverseEdge;

    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        active: edge.id === activeEdgeId,
        reverseMotion: edge.id === activeEdgeId ? isReverseMotion : false,
        packetDuration: edge.id === activeEdgeId ? 1 / speed : 2.2,
      },
      style: {
        ...edge.style,
        stroke: edge.id === activeEdgeId ? (isReverseMotion ? "#f59e0b" : "#8b5cf6") : "#60a5fa",
      },
    }));
  }, [currentFrame, edges, speed]);

  if (scenarioId !== "simple-load-balancer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-lg text-[color:var(--foreground)]/75">Scenario not found.</p>
      </div>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="technical-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-20 top-[-120px] h-[300px] w-[300px] rounded-full bg-blue-500/12 blur-[80px]" />
      <div className="pointer-events-none absolute -right-16 top-[180px] h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[80px]" />

      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        showHomeLink
        badgeText="Scenario Playback"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-4 py-3 backdrop-blur">
          <div className="text-sm text-[color:var(--foreground)]/75">
            Frame {frameIndex + 1} / {frames.length || "-"}
            {currentFrame && (
              <span className="ml-3 text-[color:var(--foreground)]/60">
                {currentFrame.from.slice(0, 6)} {"->"} {currentFrame.to.slice(0, 6)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFrameIndex(0);
                setIsPlaying(false);
              }}
              className="rounded-md border border-[var(--border)] px-3 py-1 text-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setFrameIndex(0)
                setIsPlaying((prev) => !prev);
              }}
              className="rounded-md border border-[var(--border)] px-3 py-1 text-sm"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="rounded-md border border-[var(--border)] px-3 py-1 text-sm"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => setFrameIndex((prev) => (prev + 1) % Math.max(frames.length, 1))}
              className="rounded-md border border-[var(--border)] px-3 py-1 text-sm"
            >
              Next
            </button>

            <p className="ml-2 text-sm text-[color:var(--foreground)]/75">{speed.toFixed(1)}x</p>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="ml-1 w-24 accent-blue-500"
            />
          </div>
        </div>

        <div className="h-[72vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/65 shadow-[0_20px_50px_-35px_var(--glow)]">
          <ReactFlow
            nodes={nodes}
            edges={animatedEdges}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.28 }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            nodesFocusable={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.1} color="rgba(100,116,139,0.24)" />
          </ReactFlow>
        </div>
      </div>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </section>
  );
}
