import MessageQueueModel from "@/engine/models/MessageQueue/MessageQueue";
import ClientModel from "@/engine/models/Client";
import ServerModel from "@/engine/models/server";
import PostgresModel from "@/engine/models/Postgres";
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
    frame.action === "CONSUMER_ACK"
  );
}

function createSimpleMessageQueueSimulationBundle(options: ScenarioRunOptions): SimBundle {
  const { hideResponse, parallelResponse, nodeConfigs } = options;
  const graph = new GraphManager("graph-mq");
  const registry = new NodeRegistry("registry-mq");
  const ipv4Instance = new Ipv4Generator();

  const clientId = "client-1";
  const serverId = "server-1";
  const queueId = "queue-1";
  const consumer1Id = "consumer-1";
  const consumer2Id = "consumer-2";
  const dbId = "db-1";

  const client = new ClientModel(clientId, "Client");
  const server = new ServerModel(serverId, "Web Server");
  const queue = new MessageQueueModel(queueId, "Message Queue", "FIFO" as any, 10, "REJECT" as any);
  const consumer1 = new ServerModel(consumer1Id, "Worker Server 1");
  const consumer2 = new ServerModel(consumer2Id, "Worker Server 2");
  const db = new PostgresModel(dbId, "Postgres Database");

  // Apply node configs
  const clientConfig = nodeConfigs?.[clientId];
  const serverConfig = nodeConfigs?.[serverId];
  const queueConfig = nodeConfigs?.[queueId];
  const consumer1Config = nodeConfigs?.[consumer1Id];
  const consumer2Config = nodeConfigs?.[consumer2Id];
  const dbConfig = nodeConfigs?.[dbId];

  // Configure Server capacity and endpoints
  if (serverConfig) {
    if (typeof serverConfig.capacity === "number") server.capacity = serverConfig.capacity;
    if (serverConfig.endpoints) server.endpoints = { ...serverConfig.endpoints };
  } else {
    server.endpoints = {
      "api/v1/posts": ["POST"]
    };
  }

  // Populate Queue Configuration
  if (queueConfig) {
    if (queueConfig.processingType) queue.processingType = queueConfig.processingType;
    if (typeof queueConfig.queueSize === "number") queue.queueSize = queueConfig.queueSize;
    if (queueConfig.overflowBehavior) queue.overflowBehavior = queueConfig.overflowBehavior;
  }

  // Configure consumer connections and processing
  if (consumer1Config && typeof consumer1Config.prefetchLimit === "number") {
    consumer1.addQueueConsumer(queueId, "Message Queue");
  } else {
    consumer1.addQueueConsumer(queueId, "Message Queue");
  }
  if (consumer2Config && typeof consumer2Config.prefetchLimit === "number") {
    consumer2.addQueueConsumer(queueId, "Message Queue");
  } else {
    consumer2.addQueueConsumer(queueId, "Message Queue");
  }

  // Wire up database connection pool
  consumer1.addPostgresConnectionPool(5, db);
  consumer2.addPostgresConnectionPool(5, db);

  // Setup Graph Nodes
  graph.addNode(clientId, "Client");
  graph.addNode(serverId, "Web Server");
  graph.addNode(queueId, "Message Queue");
  graph.addNode(consumer1Id, "Worker Server 1");
  graph.addNode(consumer2Id, "Worker Server 2");
  graph.addNode(dbId, "Postgres Database");

  // Setup Graph Edges
  graph.addEdge(clientId, serverId);
  graph.addEdge(serverId, queueId);
  graph.addEdge(queueId, consumer1Id);
  graph.addEdge(queueId, consumer2Id);
  graph.addEdge(consumer1Id, dbId);
  graph.addEdge(consumer2Id, dbId);

  // Register in Registry
  registry.register(clientId, client);
  registry.register(serverId, server);
  registry.register(queueId, queue);
  registry.register(consumer1Id, consumer1);
  registry.register(consumer2Id, consumer2);
  registry.register(dbId, db);

  // Client requests config
  const clientRequests = clientConfig?.requests || [
    { endpoint: "/api/v1/posts", method: "POST", lookupKey: "key-1" },
    { endpoint: "/api/v1/posts", method: "POST", lookupKey: "key-2" },
    { endpoint: "/api/v1/posts", method: "POST", lookupKey: "key-3" }
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
    const lookupKey = req.lookupKey || `key-${i+1}`;

    const simulation = new SimulationManager(
      graph,
      registry,
      {
        endpoint: req.endpoint || "/api/v1/posts",
        method: req.method || "POST",
        lookupKey,
      },
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
      position: { x: 50, y: 220 },
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
      data: { label: "Web Server" },
      position: { x: 280, y: 220 },
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
      id: queueId,
      data: { label: "Message Queue" },
      position: { x: 500, y: 220 },
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
      id: consumer1Id,
      data: { label: "Worker Server 1" },
      position: { x: 740, y: 120 },
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
      id: consumer2Id,
      data: { label: "Worker Server 2" },
      position: { x: 740, y: 320 },
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
      id: dbId,
      data: { label: "Postgres Database" },
      position: { x: 980, y: 220 },
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
      id: `${serverId}->${queueId}`,
      source: serverId,
      target: queueId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${queueId}->${consumer1Id}`,
      source: queueId,
      target: consumer1Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${queueId}->${consumer2Id}`,
      source: queueId,
      target: consumer2Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${consumer1Id}->${dbId}`,
      source: consumer1Id,
      target: dbId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${consumer2Id}->${dbId}`,
      source: consumer2Id,
      target: dbId,
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

export default createSimpleMessageQueueSimulationBundle;
