import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import type { Frame, SimBundle } from "@/engine/types";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import Ipv4Generator from "@/utils/generateRandomIp";

export function createSimpleLoadBalancerSimulationBundle(
  hideResponse: boolean,
): SimBundle {
  const graph = new GraphManager("graph-1");
  const registry = new NodeRegistry("registry-1");
  const ipv4Instance = new Ipv4Generator();
  const simulation = new SimulationManager(
    graph,
    registry,
    {},
    ipv4Instance.getRandomIpv4() as string,
  );
  const strategy = new RoundRobinStrategy();

  const clientId = "client-1";
  const lbId = "lb-1";
  const s1Id = "server-1";
  const s2Id = "server-2";
  const s3Id = "server-3";

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

  for (let i = 0; i < 3; i++) {
    simulation.runSimulation(clientId);
  }

  console.log("Frames generated from simulation:", simulation.getFrames());

  const flowNodes: Node[] = [
    {
      id: clientId,
      data: { label: "Client" },
      position: { x: 40, y: 210 },
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "var(--surface)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "8px 12px",
        fontWeight: 600,
      },
    },
    {
      id: lbId,
      data: { label: "Load Balancer" },
      position: { x: 320, y: 210 },
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "var(--surface)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "8px 12px",
        fontWeight: 600,
      },
    },
    {
      id: s1Id,
      data: { label: "Server 1" },
      position: { x: 700, y: 60 },
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "var(--surface)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "8px 12px",
        fontWeight: 600,
      },
    },
    {
      id: s2Id,
      data: { label: "Server 2" },
      position: { x: 700, y: 210 },
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "var(--surface)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "8px 12px",
        fontWeight: 600,
      },
    },
    {
      id: s3Id,
      data: { label: "Server 3" },
      position: { x: 700, y: 360 },
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "var(--surface)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "8px 12px",
        fontWeight: 600,
      },
    },
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
      data: { active: false, packetDuration: 2.15 },
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

export default createSimpleLoadBalancerSimulationBundle;
