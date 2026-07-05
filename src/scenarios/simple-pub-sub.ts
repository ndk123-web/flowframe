import PubSubModel from "@/engine/models/PubSub/PubSubModel";
import ClientModel from "@/engine/models/Client";
import ServerModel from "@/engine/models/server";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { Event, Frame, ScenarioRunOptions, SimBundle } from "@/engine/types";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import Ipv4Generator from "@/utils/generateRandomIp";
import PriorityQueue from "@/engine/core/Simulations/ParallelSimulation";

function shouldKeepFrame(hideResponse: boolean, frame: Frame) {
  if (!hideResponse) {
    return true;
  }
  return !(
    frame.action.includes("SEND_RESPONSE") ||
    frame.action.includes("RETURN_DATA") ||
    frame.action === "RESPONSE_BACKTRACK" ||
    frame.action === "SUBSCRIBER_ACK"
  );
}

function createSimplePubSubSimulationBundle(options: ScenarioRunOptions): SimBundle {
  const { hideResponse, parallelResponse, nodeConfigs } = options;
  const graph = new GraphManager("graph-pubsub");
  const registry = new NodeRegistry("registry-pubsub");
  const ipv4Instance = new Ipv4Generator();

  const clientId = "client-1";
  const serverId = "server-1";
  const brokerId = "pubsub-1";
  const subscriber1Id = "subscriber-1";
  const subscriber2Id = "subscriber-2";

  const client = new ClientModel(clientId, "Client");
  const server = new ServerModel(serverId, "Publisher Server");
  const broker = new PubSubModel(brokerId, "Pub/Sub Broker");
  const subscriber1 = new ServerModel(subscriber1Id, "Email Service");
  const subscriber2 = new ServerModel(subscriber2Id, "Analytics Service");

  // Apply node configs
  const clientConfig = nodeConfigs?.[clientId];
  const serverConfig = nodeConfigs?.[serverId];
  const brokerConfig = nodeConfigs?.[brokerId];
  const subscriber1Config = nodeConfigs?.[subscriber1Id];
  const subscriber2Config = nodeConfigs?.[subscriber2Id];

  // Configure Server capacity and endpoints
  if (serverConfig) {
    if (typeof serverConfig.capacity === "number") server.capacity = serverConfig.capacity;
    if (serverConfig.endpoints) server.endpoints = { ...serverConfig.endpoints };
  } else {
    server.endpoints = {
      "api/v1/getData": ["POST"]
    };
  }

  // Configure subscribers connection and topics
  const sub1Topics = subscriber1Config?.subscriptionTopics || ["order.created"];
  const sub2Topics = subscriber2Config?.subscriptionTopics || ["order.created"];

  sub1Topics.forEach((t: string) => broker.subscribe(t, subscriber1Id));
  sub2Topics.forEach((t: string) => broker.subscribe(t, subscriber2Id));

  // Setup Graph Nodes
  graph.addNode(clientId, "Client");
  graph.addNode(serverId, "Publisher Server");
  graph.addNode(brokerId, "Pub/Sub Broker");
  graph.addNode(subscriber1Id, "Email Service");
  graph.addNode(subscriber2Id, "Analytics Service");

  // Setup Graph Edges
  graph.addEdge(clientId, serverId);
  graph.addEdge(serverId, brokerId);
  graph.addEdge(brokerId, subscriber1Id);
  graph.addEdge(brokerId, subscriber2Id);

  // Register in Registry
  registry.register(clientId, client);
  registry.register(serverId, server);
  registry.register(brokerId, broker);
  registry.register(subscriber1Id, subscriber1);
  registry.register(subscriber2Id, subscriber2);

  // Client requests config
  const clientRequests = clientConfig?.requests || [
    { endpoint: "/api/v1/getData", method: "POST", body: '{\n  "topic": "order.created",\n  "amount": 250\n}' }
  ];

  const allFrames: Frame[] = [];
  const requestInputs: Array<{
    requestId?: string;
    sourceIp?: string;
    lookupKey?: string;
  }> = [];

  let globalTimestampOffset = 0;

  for (let i = 0; i < clientRequests.length; i++) {
    const req = clientRequests[i];
    const sourceIp = ipv4Instance.getRandomIpv4() as string;
    const lookupKey = "order.created";

    let parsedBody = {};
    if (req.body) {
      try {
        parsedBody = JSON.parse(req.body);
      } catch (err) {
        parsedBody = { topic: "order.created" };
      }
    } else {
      parsedBody = { topic: "order.created" };
    }

    const simulation = new SimulationManager(
      graph,
      registry,
      parsedBody,
      sourceIp
    );

    simulation.runSimulation(clientId);

    const generatedFrames = simulation.getFrames() as Frame[];
    const runFrames = generatedFrames.map((frame) => ({
      ...frame,
      timestamp: parallelResponse
        ? frame.timestamp
        : frame.timestamp + globalTimestampOffset,
      sourceIp,
    }));

    const firstFrame = runFrames[0];
    if (firstFrame) {
      requestInputs.push({
        requestId: firstFrame.requestId,
        sourceIp,
        lookupKey,
      });
    }

    allFrames.push(...runFrames);

    if (!parallelResponse) {
      globalTimestampOffset += generatedFrames.length;
    }
  }

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
    shouldKeepFrame(hideResponse, frame)
  );

  // Setup Visual Nodes (React Flow positions)
  const flowNodes: Node[] = [
    {
      id: clientId,
      data: { label: "Client" },
      position: { x: 80, y: 220 },
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
      id: serverId,
      data: { label: "Publisher Server" },
      position: { x: 320, y: 220 },
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
      id: brokerId,
      data: { label: "Pub/Sub Broker" },
      position: { x: 560, y: 220 },
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
      id: subscriber1Id,
      data: { label: "Email Service" },
      position: { x: 800, y: 120 },
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
      id: subscriber2Id,
      data: { label: "Analytics Service" },
      position: { x: 800, y: 320 },
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
      id: `${clientId}->${serverId}`,
      source: clientId,
      target: serverId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${serverId}->${brokerId}`,
      source: serverId,
      target: brokerId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${brokerId}->${subscriber1Id}`,
      source: brokerId,
      target: subscriber1Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${brokerId}->${subscriber2Id}`,
      source: brokerId,
      target: subscriber2Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
  ];

  return {
    frames: filteredFrames,
    nodes: flowNodes,
    edges: flowEdges,
    debug: {
      parallelResponse,
      requestInputs,
    },
  };
}

export default createSimplePubSubSimulationBundle;
