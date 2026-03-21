import RedisModel from "@/engine/models/Redis";
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

/**
 * Helper function to determine whether to keep a frame for renderring or not
 */
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

function createSimpleCacheScenario(options: ScenarioRunOptions): SimBundle {
  const { hideResponse, parallelResponse } = options;
  const graph = new GraphManager("graph-cache");
  const registry = new NodeRegistry("registry-cache");
  const ipv4Instance = new Ipv4Generator();

  // we will have 1 client and 1 server and 1 redis cache in between them
  // client -> server
  // server -> redis cache
  // server -> either fetch from cache or fetch from server and update cache

  const clientId = "client-1";
  const clientName = "Client 1";
  const clientInstance = new ClientModel(clientId, clientName);

  const redisTestCases = ["rohan", "doe", "invalid-user"];

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

  /**
   * Snapshot of the data in Redis into the redisStoreSnapshot object
   */
  const redisStoreSnapshot: Record<string, string> = Object.fromEntries(
    Array.from(redisInstance.data.entries()).map(([key, value]) => [
      String(key),
      String(value),
    ]),
  );

  /**
   * Snapshot of the data in Postgres into the postgresStoreSnapshot object
   */
  const usersDb = postgresInstance.data.get("users") as
    | Map<string, unknown>
    | undefined;
  const postgresStoreSnapshot: Record<string, string> = Object.fromEntries(
    Array.from((usersDb ?? new Map<string, unknown>()).entries()).map(
      ([key, value]) => [String(key), String(value)],
    ),
  );

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

  /**
   * AllFrames will hold the frames for all simulations we run for the scenario
   */
  const allFrames: Frame[] = [];
  const requestInputs: Array<{
    requestId?: string;
    sourceIp?: string;
    lookupKey?: string;
  }> = [];

  let globalTimestampOffset = 0;

  for (let i = 0; i < 3; i++) {
    /**
     * each loop iteration i % 3 then (0-2) means first 0 then 1 then 2 index of testcases
     */
    const lookupKey = redisTestCases[i % redisTestCases.length];

    /**
     * get the random source ip for client request
     */
    const sourceIp = ipv4Instance.getRandomIpv4() as string;

    /**
     * create a new simulation manager
     * with data lookupkey and test cases for redis if needed in future
     */
    const simulation = new SimulationManager(
      graph,
      registry,
      {
        lookupKey,
        testCasesForRedis: {
          data: redisTestCases,
        },
      },
      sourceIp,
    );

    /**
     * run the simulation from client node and create for i = 0,1,2 it stores the frames for each simulation in frames
     */
    simulation.runSimulation(clientId);
    console.log(
      "frames for simulation with lookupKey",
      lookupKey,
      simulation.getFrames(),
    );

    /**
     * for each simulation frames for i request, runFrames will be the
     */
    const runFrames = (simulation.getFrames() as Frame[]).map((frame) => ({
      ...frame,
      timestamp: parallelResponse
        ? frame.timestamp
        : frame.timestamp + globalTimestampOffset,
      sourceIp,
      lookupKey,
      payloadSummary: `lookupKey=${lookupKey}`,
    }));
    console.log("runFrames for lookupKey", lookupKey, runFrames);

    const firstFrame = runFrames[0];
    if (firstFrame) {
      requestInputs.push({
        requestId: firstFrame.requestId,
        sourceIp,
        lookupKey,
      });
    }

    /**
     * store each frames for each simulation in allFrames which will be used later to merge and sort frames based on timestamp for final rendering of the scenario
     */
    allFrames.push(...runFrames);

    /**
     * for non parallel response we will add the timestamp offset to make sure the frames are rendered one after another based on the order of simulations we ran, for parallel response we will keep the original timestamps and later merge and sort them based on timestamp to simulate parallel execution of requests
     */
    if (!parallelResponse) {
      globalTimestampOffset += (simulation.getFrames() as Frame[]).length;
    }
  }

  /**
   * for parallel response we will merge the frames from different simulations and sort them based on timestamp to simulate interleaving of frames from different requests, for non parallel response we will keep the order of frames as is since we already added timestamp offset to ensure they are rendered one after another
   */
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
    frames: filteredFrames,
    nodes: flowNodes,
    edges: flowEdges,
    debug: {
      parallelResponse,
      testCasesForRedis: redisTestCases,
      redisStore: redisStoreSnapshot,
      postgresStore: postgresStoreSnapshot,
      requestInputs,
    },
  };
}

export default createSimpleCacheScenario;
