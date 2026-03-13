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
  lookupKey?: string;
  redisKeysSnapshot?: string[];
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

  // we use getSmoothStepPath from reactflow to generate a smooth curved path between the source and target nodes. This function takes into account the positions and orientations of the source and target to create a visually appealing edge path for the animated packet to follow.
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

          // we use different colors and drop shadow effects for forward vs reverse motion to help users visually distinguish between request and response flows in the simulation. Forward motions (requests) are styled with a violet color, while reverse motions (responses) are styled with an orange color. The drop shadow adds a glowing effect to the active packet, making it more visually prominent as it moves along the edge.
          fill={isReverseMotion ? "#f59e0b" : "#8b5cf6"}
          
          // we apply a drop shadow filter to the animated packet to make it stand out more against the background and edges. The color of the drop shadow corresponds to the type of motion (forward or reverse) to enhance visual clarity and help users quickly identify the flow of requests and responses in the simulation.
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

            // if it's a reverse motion, we want the animation to start from the end of the path and move backwards, so we set keyPoints to "1;0". If it's a forward motion, we want it to start from the beginning and move forwards, so we set keyPoints to "0;1". This allows us to use the same edgePath for both forward and reverse animations while controlling the direction of motion based on the type of frame being visualized.
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

function GenerateFrames(hideResponse: boolean, scnenarioId: string): SimBundle {
    const createSimulationBundle: any = ALL_SCENARIOS.get(scnenarioId)
    if (!createSimulationBundle) {
      return {
        frames: [],
        nodes: [],
        edges: [],
      }
    }

    return createSimulationBundle(hideResponse);
}

export default function ScenarioPage({ params }: ScenarioPropsPage) {

  // For simplicity, we're only supporting one scenario in this demo. In a real app, you might fetch scenario data from an API or filesystem based on the scenarioId.
  const { scenarioId } = use(params);

  const [hideResponse, setHideResponse] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);

  // useMemo ensures frames regenerate whenever hideResponse or scenarioId changes.
  const { frames, nodes, edges } = useMemo(
    () => GenerateFrames(hideResponse, scenarioId),
    [hideResponse, scenarioId]
  );

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
  }, [isPlaying, frames.length, speed, hideResponse]);

  // whenever speed changes always start from the first frame, this is because the frames are designed to be played at normal speed, if we change the speed in the middle of the playback, it might cause some frames to be skipped or played too fast, which can lead to a confusing visualization. By resetting to the first frame whenever the speed changes, we ensure that the simulation always starts from a consistent state and plays smoothly at the new speed.
  useEffect(() => {
    setFrameIndex(0);
  }, [speed, hideResponse]);

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
      
    // If the current frame's from-to pair matches a direct edge, we consider it a forward motion. If it matches a reverse edge, we consider it a backward motion. This allows us to use different colors or animations for forward vs backward packet movements, which can help users understand the flow of requests and responses in the simulation more intuitively.
    const isReverseMotion = !hasDirectEdge && hasReverseEdge;

    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        active: edge.id === activeEdgeId,
        reverseMotion: edge.id === activeEdgeId ? isReverseMotion : false,
        packetDuration: edge.id === activeEdgeId ? (1 / speed)  : 2.2,
      },
      style: {
        ...edge.style,
        stroke: edge.id === activeEdgeId ? (isReverseMotion ? "#f59e0b" : "#8b5cf6") : "#60a5fa",
      },
    }));
  }, [currentFrame, edges, speed]);

  if (!ALL_SCENARIOS.has(scenarioId)) {
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
            {currentFrame?.action && (
              <span className="ml-3 text-[color:var(--foreground)]/60">
                Action: {currentFrame.action}
              </span>
            )}
            {currentFrame?.lookupKey && (
              <span className="ml-3 text-[color:var(--foreground)]/60">
                Lookup Key: {currentFrame.lookupKey}
              </span>
            )}
            {currentFrame?.redisKeysSnapshot && (
              <span className="ml-3 text-[color:var(--foreground)]/60">
                Redis Keys: [{currentFrame.redisKeysSnapshot.join(", ")}]
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* now we need input for the check whether hide response or not */}
            <input type="checkbox" id="hideResponse" checked={hideResponse} onChange={() => {
              setHideResponse((prev) => !prev);
            } } className="accent-blue-500" />
            <label htmlFor="hideResponse" className="text-sm text-[color:var(--foreground)]/75">Hide Response</label>
            <button
              type="button"
              onClick={() => {
                setFrameIndex(0);
                setIsPlaying(false);
              }}
              className="rounded-md border border-[var(--border)] px-3 py-1 text-sm"
            >
              Debug
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
