"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  BaseEdge,
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  getSmoothStepPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { SimDebug, ScenarioRunOptions } from "@/engine/types";

// In a real app, you might fetch this from an API or filesystem based on the scenarioId. For this demo, we're hardcoding it.
import { ALL_SCENARIOS } from "@/scenarios/all";

type Theme = "light" | "dark";

type Frame = {
  requestId: string;
  requestName?: string;
  from: string;
  to: string;
  timestamp: number;
  action: string;
  sourceIp?: string;
  lookupKey?: string;
  redisKeysSnapshot?: string[];
  payloadSummary?: string;
};

type SimBundle = {
  frames: Frame[];
  nodes: Node[];
  edges: Edge[];
  debug?: SimDebug;
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
  const packetCount = Math.max(1, Number(data?.packetCount ?? 1));
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
      {isActive &&
        Array.from({ length: Math.min(packetCount, 3) }).map((_, index) => (
          <circle
            key={`${packetDuration}-${isReverseMotion ? "rev" : "fwd"}-${index}`}
            r={5 - index * 0.5}

            // we use different colors and drop shadow effects for forward vs reverse motion to help users visually distinguish between request and response flows in the simulation. Forward motions (requests) are styled with a violet color, while reverse motions (responses) are styled with an orange color. The drop shadow adds a glowing effect to the active packet, making it more visually prominent as it moves along the edge.
            fill={isReverseMotion ? "#f59e0b" : "#8b5cf6"}

            // we apply a drop shadow filter to the animated packet to make it stand out more against the background and edges. The color of the drop shadow corresponds to the type of motion (forward or reverse) to enhance visual clarity and help users quickly identify the flow of requests and responses in the simulation.
            style={{
              filter: isReverseMotion
                ? "drop-shadow(0 0 8px rgba(245,158,11,0.95))"
                : "drop-shadow(0 0 8px rgba(139,92,246,0.95))",
              opacity: Math.max(0.55, 0.95 - index * 0.2),
            }}
          >
            <animateMotion
              dur={`${packetDuration}s`}
              repeatCount="indefinite"
              begin={`${index * 0.12}s`}
              path={edgePath}

              // if it's a reverse motion, we want the animation to start from the end of the path and move backwards, so we set keyPoints to "1;0". If it's a forward motion, we want it to start from the beginning and move forwards, so we set keyPoints to "0;1". This allows us to use the same edgePath for both forward and reverse animations while controlling the direction of motion based on the type of frame being visualized.
              keyPoints={isReverseMotion ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        ))}
    </>
  );
}

function MediaButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
        active
          ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
          : "border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)]/80"
      }`}
    >
      {children}
    </button>
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

function GenerateFrames(options: ScenarioRunOptions, scnenarioId: string): SimBundle {
    const createSimulationBundle: any = ALL_SCENARIOS.get(scnenarioId)
    if (!createSimulationBundle) {
      return {
        frames: [],
        nodes: [],
        edges: [],
      }
    }

    return createSimulationBundle(options);
}

export default function ScenarioPage({ params }: ScenarioPropsPage) {

  // For simplicity, we're only supporting one scenario in this demo. In a real app, you might fetch scenario data from an API or filesystem based on the scenarioId.
  const { scenarioId } = use(params);

  const [hideResponse, setHideResponse] = useState(false);
  const [parallelResponse, setParallelResponse] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * we use useMemo to memoize the generated frames, nodes, edges, debug
   */
  const { frames, nodes, edges, debug } = useMemo(
    () =>
      isMounted
        ? GenerateFrames(
            {
              hideResponse,
              parallelResponse,
            },
            scenarioId,
          )
        : {
            frames: [],
            nodes: [],
            edges: [],
          },
    [hideResponse, parallelResponse, scenarioId, isMounted]
  );

  /**
   * group frames by timestamp, this is useful for parallel frames and also it will work for non-parallel frames
   */
  const frameGroups = useMemo(() => {

    /**
     * groupedByTimestamp is a map of timestamp to frames
     */
    const groupedByTimestamp = new Map<number, Frame[]>();

    /**
     * for each frame if frame.timestamp 
     * timestamp 1 -> [Frame1, Frame2]
     * timestamp 2 -> [Frame3,Frame4, Frame5]
     */
    for (const frame of frames) {
      const existing = groupedByTimestamp.get(frame.timestamp) ?? [];
      existing.push(frame);
      groupedByTimestamp.set(frame.timestamp, existing);
    }
    
    /**
     * example: 
     * 1 -> sort timestamp in ascending order 
     * 2 -> convert the groupedByTimestamp map to an array of { timestamp, frames } objects, where each object represents a group of frames that share the same timestamp. This structure allows us to easily render all frames that occur at the same time together in the visualization, which is especially important for scenarios with parallel events.
     */
    return Array.from(groupedByTimestamp.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, groupFrames]) => ({
        timestamp,
        frames: groupFrames,
      }));
  }, [frames]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showCurrentFlowPanel, setShowCurrentFlowPanel] = useState(true);
  const [showTelemetryPanel, setShowTelemetryPanel] = useState(true);

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
    if (!isPlaying || frameGroups.length === 0) {
      return;
    }

    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameGroups.length);
    }, 1000 / speed);

    return () => clearInterval(id);
  }, [isPlaying, frameGroups.length, speed, hideResponse, parallelResponse]);

  // whenever speed changes always start from the first frame, this is because the frames are designed to be played at normal speed, if we change the speed in the middle of the playback, it might cause some frames to be skipped or played too fast, which can lead to a confusing visualization. By resetting to the first frame whenever the speed changes, we ensure that the simulation always starts from a consistent state and plays smoothly at the new speed.
  useEffect(() => {
    setFrameIndex(0);
  }, [speed, hideResponse, parallelResponse, scenarioId]);

  const goToPreviousFrame = () => {
    setIsPlaying(false);
    setFrameIndex((prev) =>
      frameGroups.length === 0
        ? 0
        : prev === 0
          ? frameGroups.length - 1
          : prev - 1
    );
  };

  const goToNextFrame = () => {
    setIsPlaying(false);
    setFrameIndex((prev) => (prev + 1) % Math.max(frameGroups.length, 1));
  };

  const restartPlayback = () => {
    setFrameIndex(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        const isEditable =
          target.isContentEditable ||
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          tagName === "BUTTON";

        if (isEditable) {
          return;
        }
      }

      if (event.code === "Space") {
        event.preventDefault();
        setIsPlaying((prev) => !prev);
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        goToPreviousFrame();
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        goToNextFrame();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [frameGroups.length]);

  const currentFrameGroup = frameGroups[frameIndex] ?? null;
  const currentFrames = currentFrameGroup?.frames ?? [];
  const currentFrame = currentFrames[0] ?? null;
  const redisStoreEntries = Object.entries(debug?.redisStore ?? {});
  const postgresStoreEntries = Object.entries(debug?.postgresStore ?? {});
  const requestInputById = useMemo(() => {
    const map = new Map<string, { requestId?: string; sourceIp?: string; lookupKey?: string }>();
    for (const entry of debug?.requestInputs ?? []) {
      if (entry.requestId) {
        map.set(entry.requestId, entry);
      }
    }
    return map;
  }, [debug?.requestInputs]);

  const currentRequestData = useMemo(() => {
    const rows: Array<{
      requestId: string;
      sourceIp?: string;
      lookupKey?: string;
      payloadSummary?: string;
      action?: string;
    }> = [];
    const seen = new Set<string>();

    for (const frame of currentFrames) {
      if (seen.has(frame.requestId)) {
        continue;
      }

      const requestInput = requestInputById.get(frame.requestId);
      rows.push({
        requestId: frame.requestId,
        sourceIp: frame.sourceIp ?? requestInput?.sourceIp,
        lookupKey: frame.lookupKey ?? requestInput?.lookupKey,
        payloadSummary: frame.payloadSummary,
        action: frame.action,
      });
      seen.add(frame.requestId);
    }

    return rows;
  }, [currentFrames, requestInputById]);

  // useMemo in react use for expensive calculation and return memoized value, it only recompute the memoized value when one of the dependencies has changed. This optimization helps to avoid expensive calculations on every render when the dependencies haven't changed.
  const animatedEdges = useMemo(() => {
    if (currentFrames.length === 0) {
      return edges;
    }

    /**
     * edgestate of string to { reverseMotion: boolean, packetCount: number }
     * which is 
     */
    const edgeState = new Map<string, { reverseMotion: boolean; packetCount: number }>();

    for (const frame of currentFrames) {
      const directEdgeId = `${frame.from}->${frame.to}`;
      const reverseEdgeId = `${frame.to}->${frame.from}`;
      const hasDirectEdge = edges.some((edge) => edge.id === directEdgeId);
      const hasReverseEdge = edges.some((edge) => edge.id === reverseEdgeId);

      const resolvedEdgeId = hasDirectEdge
        ? directEdgeId
        : hasReverseEdge
          ? reverseEdgeId
          : directEdgeId;

      // If the current frame's from-to pair matches a direct edge, we consider it a forward motion. If it matches a reverse edge, we consider it a backward motion. This allows us to use different colors or animations for forward vs backward packet movements, which can help users understand the flow of requests and responses in the simulation more intuitively.
      const isReverseMotion = !hasDirectEdge && hasReverseEdge;

      const previousState = edgeState.get(resolvedEdgeId);
      if (!previousState) {
        edgeState.set(resolvedEdgeId, {
          reverseMotion: isReverseMotion,
          packetCount: 1,
        });
      } else {
        edgeState.set(resolvedEdgeId, {
          reverseMotion: previousState.reverseMotion && isReverseMotion,
          packetCount: previousState.packetCount + 1,
        });
      }
    }

    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        active: edgeState.has(edge.id),
        reverseMotion: edgeState.get(edge.id)?.reverseMotion ?? false,
        packetCount: edgeState.get(edge.id)?.packetCount ?? 0,
        packetDuration: edgeState.has(edge.id) ? (1 / speed) : 2.2,
      },
      style: {
        ...edge.style,
        stroke: edgeState.has(edge.id)
          ? (edgeState.get(edge.id)?.reverseMotion ? "#f59e0b" : "#8b5cf6")
          : "#60a5fa",
      },
    }));
  }, [currentFrames, edges, speed]);

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--foreground)]/60">View Panels</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCurrentFlowPanel((prev) => !prev)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[color:var(--foreground)]/80"
            >
              {showCurrentFlowPanel ? "Hide" : "Show"} Current Flow
            </button>
            <button
              type="button"
              onClick={() => setShowTelemetryPanel((prev) => !prev)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[color:var(--foreground)]/80"
            >
              {showTelemetryPanel ? "Hide" : "Show"} Playback Telemetry
            </button>
          </div>
        </div>

        {showCurrentFlowPanel && (
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[linear-gradient(140deg,rgba(34,211,238,0.12)_0%,var(--surface)_38%,var(--surface-muted)_100%)] p-4 shadow-[0_16px_40px_-32px_var(--glow)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Current Request Flow</p>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">Live Requests At Active Timestamp</p>
              </div>
              <span className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300">
                {currentRequestData.length} Active
              </span>
            </div>

            {currentRequestData.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {currentRequestData.map((entry) => (
                  <div key={entry.requestId} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm text-[color:var(--foreground)]">{entry.requestId.slice(0, 8)}</p>
                      <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] text-[color:var(--foreground)]/70">
                        {currentFrameGroup?.timestamp ?? "-"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--foreground)]/75">IP: {entry.sourceIp ?? "-"}</p>
                    <p className="text-xs text-[color:var(--foreground)]/75">Lookup: {entry.lookupKey ?? "-"}</p>
                    <p className="text-xs text-[color:var(--foreground)]/75">Payload: {entry.payloadSummary ?? "-"}</p>
                    <p className="mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-medium text-[color:var(--foreground)]/90">
                      {entry.action ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 px-3 py-6 text-center text-sm text-[color:var(--foreground)]/65">
                No active requests on this frame yet.
              </div>
            )}
          </div>
        )}

        {showTelemetryPanel && (
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-muted)_100%)] p-4 shadow-[0_18px_45px_-36px_var(--glow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)]/55">Playback Telemetry</p>
            <span className="rounded-full border border-teal-500/35 bg-teal-500/10 px-2.5 py-1 text-xs text-teal-300">
              {isPlaying ? "Live" : "Paused"}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--foreground)]/55">Frame Group</p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">{frameIndex + 1} / {frameGroups.length || "-"}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--foreground)]/55">Timestamp</p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">{currentFrameGroup?.timestamp ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--foreground)]/55">Parallel Frames</p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">{currentFrames.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--foreground)]/55">Current Route</p>
              <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
                {currentFrame ? `${currentFrame.from} -> ${currentFrame.to}` : "-"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--foreground)]/55">Action</p>
              <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)] overflow-hidden">{currentFrame?.action ?? "-"}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--foreground)]/70">
            {currentFrame?.sourceIp && (
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">
                IP: {currentFrame.sourceIp}
              </span>
            )}
            {currentFrame?.lookupKey && (
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">
                Lookup: {currentFrame.lookupKey}
              </span>
            )}
            {currentFrame?.payloadSummary && (
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">
                Payload: {currentFrame.payloadSummary}
              </span>
            )}
            {currentFrame?.redisKeysSnapshot && (
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1">
                Redis Keys: [{currentFrame.redisKeysSnapshot.join(", ")}]
              </span>
            )}
          </div>
        </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[72vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/65 shadow-[0_20px_50px_-35px_var(--glow)]">
            <ReactFlow
              nodes={nodes}

              // brain of the edges, we determine which edges should be animated based on the current frames being visualized. For each frame, we check if it corresponds to a direct edge (from->to) or a reverse edge (to->from) in the graph. We then create a mapping of edge IDs to their animation state, which includes whether it's a reverse motion and how many packets are currently active on that edge. This allows us to dynamically update the appearance and animation of edges in the ReactFlow visualization based on the simulation data, providing a clear visual representation of the flow of requests and responses in the system. 
              edges={animatedEdges}

              // edge renderer, we use custom edge type "packet" to render the animated packets on the edges. The PacketEdge component uses SVG animations to create moving circles along the edge paths, which represent the flow of requests and responses in the simulation. By defining a custom edge type, we can easily control the appearance and behavior of these animated packets based on the frame data, such as changing colors for forward vs reverse motion and adjusting animation speed based on the simulation speed.
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

          {scenarioId === "simple-cache" && (
            <aside className="h-[72vh] overflow-auto rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,var(--surface)_0%,var(--surface-muted)_100%)] p-4 shadow-[0_20px_50px_-35px_var(--glow)]">
              <div className="sticky top-0 z-10 mb-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground)]/60">Data Stores</p>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">Live Scenario Snapshot</p>
              </div>

              <div className="space-y-4">
                <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-emerald-300">Redis</h3>
                    <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-300/90">
                      {redisStoreEntries.length} keys
                    </span>
                  </div>

                  {redisStoreEntries.length > 0 ? (
                    <div className="space-y-2">
                      {redisStoreEntries.map(([key, value]) => (
                        <div key={`redis-${key}`} className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2">
                          <p className="text-xs text-emerald-200/90">Key: {key}</p>
                          <p className="mt-1 text-xs text-[color:var(--foreground)]/80">Value: {value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[color:var(--foreground)]/65">No Redis keys found.</p>
                  )}
                </section>

                <section className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-sky-300">Postgres (users)</h3>
                    <span className="rounded-full border border-sky-500/30 px-2 py-0.5 text-[11px] text-sky-300/90">
                      {postgresStoreEntries.length} rows
                    </span>
                  </div>

                  {postgresStoreEntries.length > 0 ? (
                    <div className="space-y-2">
                      {postgresStoreEntries.map(([key, value]) => (
                        <div key={`postgres-${key}`} className="rounded-md border border-sky-500/20 bg-sky-500/10 p-2">
                          <p className="text-xs text-sky-200/90">Primary Key: {key}</p>
                          <p className="mt-1 text-xs text-[color:var(--foreground)]/80">Record: {value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[color:var(--foreground)]/65">No Postgres records found.</p>
                  )}
                </section>
              </div>
            </aside>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/78 p-4 shadow-[0_18px_45px_-36px_var(--glow)]">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <MediaButton label="Previous" onClick={goToPreviousFrame}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="6" y1="5" x2="6" y2="19" />
                  <polygon points="18 6 8 12 18 18 18 6" />
                </svg>
              </MediaButton>

              <MediaButton
                label={isPlaying ? "Pause" : "Play"}
                onClick={() => setIsPlaying((prev) => !prev)}
                active={isPlaying}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <polygon points="8 5 19 12 8 19 8 5" />
                  </svg>
                )}
              </MediaButton>

              <MediaButton label="Next" onClick={goToNextFrame}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="6 6 16 12 6 18 6 6" />
                  <line x1="18" y1="5" x2="18" y2="19" />
                </svg>
              </MediaButton>

              <MediaButton label="Restart" onClick={restartPlayback}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <polyline points="3 4 3 9 8 9" />
                </svg>
              </MediaButton>
            </div>

            <div className="flex items-center gap-2 text-xs text-[color:var(--foreground)]/70">
              <span>{speed.toFixed(1)}x</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="w-28 accent-cyan-500"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-3 py-2.5">
            <label htmlFor="hideResponse" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs text-[color:var(--foreground)]/80">
              <input
                type="checkbox"
                id="hideResponse"
                checked={hideResponse}
                onChange={() => {
                  setHideResponse((prev) => !prev);
                }}
                className="accent-cyan-500"
              />
              Hide Response
            </label>

            <label htmlFor="parallelResponse" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs text-[color:var(--foreground)]/80">
              <input
                type="checkbox"
                id="parallelResponse"
                checked={parallelResponse}
                onChange={() => {
                  setParallelResponse((prev) => !prev);
                  setFrameIndex(0);
                }}
                className="accent-cyan-500"
              />
              Parallel Response
            </label>
          </div>
        </div>

        {!parallelResponse && debug?.requestInputs && debug.requestInputs.length > 0 && (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-muted)_100%)] p-4 text-sm text-[color:var(--foreground)]/75">
            <p className="text-xs uppercase tracking-[0.15em] text-[color:var(--foreground)]/55">Request Inputs</p>
            <p className="mt-1 font-medium text-[color:var(--foreground)]">Initial Requests Snapshot</p>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {debug.requestInputs.map((entry, idx) => (
                <div key={`${entry.requestId ?? "req"}-${idx}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">Request</p>
                  <p className="font-mono text-sm text-[color:var(--foreground)]">{entry.requestId?.slice(0, 8) ?? "-"}</p>
                  <p className="mt-1 text-xs text-[color:var(--foreground)]/75">IP: {entry.sourceIp ?? "-"}</p>
                  <p className="text-xs text-[color:var(--foreground)]/75">Lookup: {entry.lookupKey ?? "-"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!parallelResponse && scenarioId === "simple-cache" && debug?.testCasesForRedis && (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 text-sm text-[color:var(--foreground)]/75">
            <p className="font-medium text-[color:var(--foreground)]">Redis Test Cases</p>
            <p className="mt-1">{debug.testCasesForRedis.join(" -> ")}</p>
          </div>
        )}

      </div>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </section>
  );
}
