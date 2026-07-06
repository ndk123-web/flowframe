import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import type { Event, Frame, ScenarioRunOptions, SimBundle } from "@/engine/types";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import Ipv4Generator from "@/utils/generateRandomIp";
import PriorityQueue from "@/engine/core/Simulations/ParallelSimulation";

import RandomLoadStrategy from "@/engine/core/Strategy/RandomLoadStrategy";
import IPHashStrategy from "@/engine/core/Strategy/IPHashStrategy";

function shouldKeepFrame(hideResponse: boolean, frame: Frame) {
  if (!hideResponse) {
    return true;
  }

  return !(
    frame.action.includes("SEND_RESPONSE") ||
    frame.action.includes("RETURN_DATA") ||
    frame.action.includes("CACHE_HIT") ||
    frame.action.includes("CACHE_MISS") ||
    frame.action === "RESPONSE_BACKTRACK"
  );
}

/**
 * 
 * @param options - options for the simulation
 * @param options.hideResponse - if true, the response will not be shown
 * @param options.parallelResponse - if true, the response will be shown in parallel
 * @returns - a bundle of the simulation (frames, nodes, edges, debug)
 */
export function createSimpleLoadBalancerSimulationBundle(
  options: ScenarioRunOptions,
): SimBundle {
  const { hideResponse, parallelResponse, nodeConfigs } = options;

  // create the nodes and edges IDs
  const clientId = "client-1";
  const lbId = "lb-1";
  const s1Id = "server-1";
  const s2Id = "server-2";
  const s3Id = "server-3";

  // create the graph, registry, ipv4 generator
  const graph = new GraphManager("graph-1");
  const registry = new NodeRegistry("registry-1");
  const ipv4Instance = new Ipv4Generator();

  // Instantiate LB strategy from config
  const lbConfig = nodeConfigs?.[lbId];
  let strategy = new RoundRobinStrategy();
  if (lbConfig?.strategy === "RANDOM") {
    strategy = new RandomLoadStrategy(lbId, "Random Strategy") as any;
  } else if (lbConfig?.strategy === "IP_HASH") {
    strategy = new IPHashStrategy(lbId, "IP Hash Strategy") as any;
  }

  const client = new ClientModel(clientId, "Client");
  const lb = new LoadBalancerModel(lbId, "LoadBalancer", strategy);
  const s1 = new ServerModel(s1Id, "Server 1");
  const s2 = new ServerModel(s2Id, "Server 2");
  const s3 = new ServerModel(s3Id, "Server 3");

  // Apply server configurations
  const s1Config = nodeConfigs?.[s1Id];
  const s2Config = nodeConfigs?.[s2Id];
  const s3Config = nodeConfigs?.[s3Id];

  if (s1Config) {
    if (typeof s1Config.capacity === "number") s1.capacity = s1Config.capacity;
    if (s1Config.endpoints) s1.endpoints = { ...s1Config.endpoints };
  } else {
    s1.endpoints = {
      "api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    };
  }
  if (s2Config) {
    if (typeof s2Config.capacity === "number") s2.capacity = s2Config.capacity;
    if (s2Config.endpoints) s2.endpoints = { ...s2Config.endpoints };
  } else {
    s2.endpoints = {
      "api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    };
  }
  if (s3Config) {
    if (typeof s3Config.capacity === "number") s3.capacity = s3Config.capacity;
    if (s3Config.endpoints) s3.endpoints = { ...s3Config.endpoints };
  } else {
    s3.endpoints = {
      "api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    };
  }

  graph.addNode(clientId, "Client");
  graph.addNode(lbId, "LoadBalancer");
  graph.addNode(s1Id, "Server 1");
  graph.addNode(s2Id, "Server 2");
  graph.addNode(s3Id, "Server 3");

  graph.addEdge(clientId, lbId);
  graph.addEdge(lbId, s1Id);
  graph.addEdge(lbId, s2Id);
  graph.addEdge(lbId, s3Id);

  // Register Components On Registry
  registry.register(clientId, client);
  registry.register(lbId, lb);
  registry.register(s1Id, s1);
  registry.register(s2Id, s2);
  registry.register(s3Id, s3);

  // This will the actual frame 
  const allFrames: Frame[] = [];
  
  const requestInputs: Array<{ requestId?: string; sourceIp?: string; lookupKey?: string }> = [];
  
  let globalTimestampOffset = 0;

  // Run customized requests if configured, fallback to 3 defaults
  const clientConfig = nodeConfigs?.[clientId];
  const clientRequests = clientConfig?.requests || [
    { endpoint: "/api/v1/posts", method: "GET" },
    { endpoint: "/api/v1/posts", method: "GET" },
    { endpoint: "/api/v1/posts", method: "GET" }
  ];

  for (let i = 0; i < clientRequests.length; i++) {
    const req = clientRequests[i];
    const sourceIp = ipv4Instance.getRandomIpv4() as string;
    const simulation = new SimulationManager(
      graph,
      registry,
      {
        endpoint: req.endpoint,
        method: req.method,
        lookupKey: req.lookupKey,
        body: req.body || "{}",
      },
      sourceIp,
    );
    simulation.runSimulation(clientId);

    const runFrames = (simulation.getFrames() as Frame[]).map((frame) => ({
      ...frame,
      timestamp: parallelResponse
        ? frame.timestamp
        : frame.timestamp + globalTimestampOffset,
      sourceIp,
      payloadSummary: `${req.method} ${req.endpoint}${req.lookupKey ? ` | lookupKey=${req.lookupKey}` : ""}`,
    }));

    // for the first frame, add the request input to the request inputs array because we will need to show it in the UI (each request will have a unique request id)
    const firstFrame = runFrames[0];
    if (firstFrame) {
      requestInputs.push({
        requestId: firstFrame.requestId,
        sourceIp,
        lookupKey: req.lookupKey,
      });
    }
    
    allFrames.push(...runFrames);

    // if the response is not parallel, then we need to increment the global timestamp offset by the length of the frames generated 
    if (!parallelResponse) {
      const rawFrames = simulation.getFrames() as Frame[];
      const maxTime = rawFrames.length > 0
        ? Math.max(...rawFrames.map((f: any) => f.timestamp))
        : -1;
      globalTimestampOffset += (maxTime + 1);
    }
  }

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

  const framesToRender: Frame[] = parallelResponse
    ? (() => {
        const pq = new PriorityQueue();
        pq.pushMultipleIntoQueue(allFrames as Event[]);

        const mergedFrames: Frame[] = [];
        while (!pq.isEmpty()) {
          const event = pq.popMinTimeStampItem();
          if (event) {
            mergedFrames.push(event as Frame);
          }
        }

        return mergedFrames;
      })()
    : allFrames.sort((a, b) => a.timestamp - b.timestamp);

  const filteredFrames = framesToRender.filter((frame) =>
    shouldKeepFrame(hideResponse, frame),
  );

  // return the bundle of the simulation
  return {
    frames: filteredFrames,
    nodes: flowNodes,
    edges: flowEdges,
    debug: {
      parallelResponse, // if true, the response will be shown in parallel
      requestInputs, // request inputs for the simulation (each request will have a unique request id)
    },
  };
}

export default createSimpleLoadBalancerSimulationBundle;
