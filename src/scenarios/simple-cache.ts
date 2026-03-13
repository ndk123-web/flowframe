import RedisModel from "@/engine/models/Redis";
import ClientModel from "@/engine/models/Client";
import ServerModel from "@/engine/models/server";
import PostgresModel from "@/engine/models/Postgres";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { Frame, SimBundle } from "@/engine/types";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";

function createSimpleCacheScenario(hideResponse: boolean): SimBundle {
  const graph = new GraphManager("graph-cache");
  const registry = new NodeRegistry("registry-cache");

  // we will have 1 client and 1 server and 1 redis cache in between them
  // client -> server
  // server -> redis cache
  // server -> either fetch from cache or fetch from server and update cache

  const clientId = "client-1";
  const clientName = "Client 1";
  const clientInstance = new ClientModel(clientId, clientName);

  const dataToPass = {
    redis: {
      data: [{ rohan: "cached data for rohan" }],
    },
    testCasesForRedis: {
      // deterministic order in simulation: hit -> db fallback -> invalid key
      data: ["rohan", "doe", "invalid-user"],
    },
  };

  // add some data for redis cache, we will use the same data for postgres database to simulate cache hit and cache miss scenarios
  clientInstance.addDataToPassToNextNode("redis", [
    { rohan: "cached data for rohan" },
    { john: "cached data for john" },
    { doe: "cached data for doe" },
  ]);

  const serverId = "server-1";
  const serverName = "Server 1";
  const serverInstance = new ServerModel(serverId, serverName);

  const redisId = "redis1";
  const redisName = "Redis Cache";
  const redisInstance = new RedisModel(redisId, redisName);
  redisInstance.addData("rohan", "cached data for rohan");
  redisInstance.addData("john", "cached data for john");

  const postgresId = "postgres1";
  const postgresName = "Postgres Database";
  const postgresInstance = new PostgresModel(postgresId, postgresName);
  postgresInstance.addRecord("users", "doe", "db data for doe");
  postgresInstance.addRecord("users", "john", "db data for john");

  // add nodes to graph
  graph.addNode(clientId, clientName);
  graph.addNode(serverId, serverName);
  graph.addNode(redisId, redisName);
  graph.addNode(postgresId, postgresName);

  // add edges to graph
  graph.addEdge(clientId, serverId);
  graph.addEdge(serverId, redisId);
  graph.addEdge(serverId, postgresId);

  // register instances to registry
  registry.register(clientId, clientInstance);
  registry.register(serverId, serverInstance);
  registry.register(redisId, redisInstance);
  registry.register(postgresId, postgresInstance);

  const simulation = new SimulationManager(graph, registry, dataToPass);

  for (let i = 0; i < 3; i++) {
    simulation.runTest(clientId, hideResponse);
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
      id: serverId,
      data: { label: "Server" },
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
      id: redisId,
      data: { label: "Redis Cache" },
      position: { x: 700, y: 120 },
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
      id: postgresId,
      data: { label: "Postgres" },
      position: { x: 700, y: 300 },
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
      id: `${serverId}->${redisId}`,
      source: serverId,
      target: redisId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${serverId}->${postgresId}`,
      source: serverId,
      target: postgresId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
  ];

  // in this simple cache scenario, we will only have 4 nodes and 3 edges, so we can hardcode the positions and styles for simplicity
  return {
    frames: simulation.getFrames() as Frame[],
    nodes: flowNodes,
    edges: flowEdges,
  };
}

export default createSimpleCacheScenario;
