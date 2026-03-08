"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BaseEdge,
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
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
import ShortUniqueId from "short-unique-id";

type Frame = {
  requestId: string;
  requestName: string;
  from: string;
  to: string;
  timestamp: number;
};

type SimBundle = {
  frames: Frame[];
  nodes: Node[];
  edges: Edge[];
};

function PacketEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data } = props;
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
        <circle r="5" fill="#8b5cf6" style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.95))" }}>
          <animateMotion dur={`${packetDuration}s`} repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

const edgeTypes = { packet: PacketEdge };

function createSimulationBundle(): SimBundle {
  const uid = new ShortUniqueId({ length: 10 });
  const graph = new GraphManager(uid.rnd(10));
  const registry = new NodeRegistry(uid.rnd(10));
  const simulation = new SimulationManager(graph, registry);
  const strategy = new RoundRobinStrategy();

  const clientId = uid.rnd(10);
  const lbId = uid.rnd(10);
  const s1Id = uid.rnd(10);
  const s2Id = uid.rnd(10);
  const s3Id = uid.rnd(10);

  const client = new ClientModel(clientId, "Client");
  const lb = new LoadBalancerModel(lbId, "LoadBalancer", strategy);
  const s1 = new ServerModel(s1Id, "Server 1");
  const s2 = new ServerModel(s2Id, "Server 2");
  const s3 = new ServerModel(s3Id, "Server 3");

  graph.addNode(clientId, "Client");
  graph.addNode(lbId, "LoadBalancer");
  graph.addNode(s1Id, "Server 1");
  graph.addNode(s2Id, "Server 2");
  graph.addNode(s3Id, "Server 3");

  graph.addEdge(clientId, lbId);
  graph.addEdge(lbId, s1Id);
  graph.addEdge(lbId, s2Id);
  graph.addEdge(lbId, s3Id);

  registry.register(clientId, client);
  registry.register(lbId, lb);
  registry.register(s1Id, s1);
  registry.register(s2Id, s2);
  registry.register(s3Id, s3);

  for (let i = 0; i < 8; i++) {
    simulation.runTest(clientId);
  }

  const flowNodes: Node[] = [
    { id: clientId, data: { label: "Client" }, position: { x: 40, y: 210 }, type: "default" },
    { id: lbId, data: { label: "Load Balancer" }, position: { x: 320, y: 210 }, type: "default" },
    { id: s1Id, data: { label: "Server 1" }, position: { x: 700, y: 60 }, type: "default" },
    { id: s2Id, data: { label: "Server 2" }, position: { x: 700, y: 210 }, type: "default" },
    { id: s3Id, data: { label: "Server 3" }, position: { x: 700, y: 360 }, type: "default" },
  ];

  const edgeBaseStyle = {
    stroke: "#60a5fa",
    strokeWidth: 1.8,
  };

  const flowEdges: Edge[] = [
    {
      id: `${clientId}->${lbId}`,
      source: clientId,
      target: lbId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 1.9 },
    },
    {
      id: `${lbId}->${s1Id}`,
      source: lbId,
      target: s1Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${lbId}->${s2Id}`,
      source: lbId,
      target: s2Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${lbId}->${s3Id}`,
      source: lbId,
      target: s3Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
  ];

  return {
    frames: simulation.getFrames() as Frame[],
    nodes: flowNodes,
    edges: flowEdges,
  };
}

export default function DashboardPage() {
  const [{ frames, nodes, edges }] = useState<SimBundle>(createSimulationBundle);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      return;
    }
    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1000 / speed);

    return () => clearInterval(id);
  }, [isPlaying, speed, frames.length]);

  const currentFrame = frames[frameIndex] ?? null;

  const animatedEdges = useMemo(() => {
    if (!currentFrame) {
      return edges;
    }
    const activeEdgeId = `${currentFrame.from}->${currentFrame.to}`;
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        active: edge.id === activeEdgeId,
        packetDuration: edge.id === activeEdgeId ? 1.1 / speed : 2.2,
      },
      style: {
        ...edge.style,
        stroke: edge.id === activeEdgeId ? "#8b5cf6" : "#60a5fa",
      },
    }));
  }, [currentFrame, edges, speed]);

  return (
    <section className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-4 py-3">
        <div className="text-sm text-[color:var(--foreground)]/75">
          Frame {frameIndex + 1} / {frames.length || "-"}
          {currentFrame && (
            <span className="ml-3 text-[color:var(--foreground)]/60">
              {currentFrame.from.slice(0, 6)} {"->"} {currentFrame.to.slice(0, 6)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
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
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="ml-1 w-24"
          />
        </div>
      </div>

      <div className="mx-auto h-[72vh] max-w-6xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/65">
        <ReactFlow
          nodes={nodes}
          edges={animatedEdges}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.28 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
        >
          <MiniMap
            nodeColor="rgba(99,102,241,0.7)"
            maskColor="rgba(11,11,12,0.2)"
            position="bottom-right"
          />
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="rgba(148,163,184,0.2)" />
        </ReactFlow>
      </div>
    </section>
  );
}