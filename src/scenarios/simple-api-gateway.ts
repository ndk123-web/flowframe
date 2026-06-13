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
import ApiGatewayModel from "@/engine/models/ApiGateway";

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

function createSimpleApiGatewaySimulation(
  options: ScenarioRunOptions,
): SimBundle {
  /**
   * Get hideResponse and ParallelResponse from options to determine how to handle response frames in the simulation.
   */
  const { hideResponse, parallelResponse, nodeConfigs } = options;

  /**
   * Initialize the GraphManager, NodeRegistry and IPV4generator
   */
  const graph = new GraphManager("graph-1");
  const registry = new NodeRegistry("registry-1");
  const ipv4Instance = new Ipv4Generator();

  /**
   * Create Instance of Client
   */
  const clientId = "client-1-id";
  const clientName = "Client";
  const client = new ClientModel(clientId, clientName);

  /**
   * Create the Instances of Servers
   */
  const server1Id = "server-1-id";
  const server1Name = "Server 1";
  const server1 = new ServerModel(server1Id, server1Name);
  const server2Id = "server-2-id";
  const server2Name = "Server 2";
  const server2 = new ServerModel(server2Id, server2Name);
  const server3Id = "server-3-id";
  const server3Name = "Server 3";
  const server3 = new ServerModel(server3Id, server3Name);

  /**
   * Create the Instance of API Gateway
   */
  const apigateWayId = "apigateway-1-id";
  const apigateWayName = "API Gateway";
  const apiGateway = new ApiGatewayModel(apigateWayId, apigateWayName);

  /**
   * Add Redis And Postgres Models
   */
  const redisId = "redis-1-id";
  const redisName = "Redis Cache";
  const redis = new RedisModel(redisId, redisName);
  const postgresId = "postgres-1-id";
  const postgresName = "Postgres Database";
  const postgres = new PostgresModel(postgresId, postgresName);

  /**
   * Add All Nodes into the Graph
   */
  graph.addNode(clientId, clientName);
  graph.addNode(server1Id, server1Name);
  graph.addNode(server2Id, server2Name);
  graph.addNode(server3Id, server3Name);
  graph.addNode(apigateWayId, apigateWayName);
  graph.addNode(redisId, redisName);
  graph.addNode(postgresId, postgresName);

  /**
   * Add All Nodes instance into the registry
   */
  registry.register(clientId, client);
  registry.register(server1Id, server1);
  registry.register(server2Id, server2);
  registry.register(server3Id, server3);
  registry.register(apigateWayId, apiGateway);
  registry.register(redisId, redis);
  registry.register(postgresId, postgres);

  /**
   * Add Edges between the Nodes to define the flow of request and response in the simulation
   */
  graph.addEdge(clientId, apigateWayId);
  graph.addEdge(apigateWayId, server1Id);
  graph.addEdge(apigateWayId, server2Id);
  graph.addEdge(apigateWayId, server3Id);
  graph.addEdge(server1Id, redisId);
  graph.addEdge(server2Id, redisId);
  graph.addEdge(server3Id, redisId);
  graph.addEdge(server1Id, postgresId);
  graph.addEdge(server2Id, postgresId);
  graph.addEdge(server3Id, postgresId);

  // Seed database and cache from nodeConfigs if provided, otherwise default
  const clientConfig = nodeConfigs?.[clientId];
  const gatewayConfig = nodeConfigs?.[apigateWayId];
  const s1Config = nodeConfigs?.[server1Id];
  const s2Config = nodeConfigs?.[server2Id];
  const s3Config = nodeConfigs?.[server3Id];
  const redisConfig = nodeConfigs?.[redisId];
  const postgresConfig = nodeConfigs?.[postgresId];

  // Configure Web Server node capacities & endpoints
  if (s1Config) {
    if (typeof s1Config.capacity === "number") server1.capacity = s1Config.capacity;
    if (s1Config.endpoints) server1.endpoints = { ...s1Config.endpoints };
  } else {
    server1.endpoints = {
      "api/v1/users/profile": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    };
  }
  if (s2Config) {
    if (typeof s2Config.capacity === "number") server2.capacity = s2Config.capacity;
    if (s2Config.endpoints) server2.endpoints = { ...s2Config.endpoints };
  } else {
    server2.endpoints = {
      "api/v1/posts/list": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    };
  }
  if (s3Config) {
    if (typeof s3Config.capacity === "number") server3.capacity = s3Config.capacity;
    if (s3Config.endpoints) server3.endpoints = { ...s3Config.endpoints };
  } else {
    server3.endpoints = {
      "api/v1/posts/list": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    };
  }

  // Populate Redis Model
  if (redisConfig && Array.isArray(redisConfig.data)) {
    redis.data.clear();
    redisConfig.data.forEach((item: any) => {
      if (item.key) redis.addData(item.key, item.val);
    });
  } else {
    redis.addData("rohan", "cached data for rohan");
    redis.addData("john", "cached data for john");
  }

  // Populate Postgres Model
  if (postgresConfig && Array.isArray(postgresConfig.data)) {
    postgres.data.clear();
    const tableName = postgresConfig.table || "users";
    postgresConfig.data.forEach((item: any) => {
      if (item.key) {
        postgres.addRecord(tableName, item.key, item.val);
      }
    });
  } else {
    postgres.addRecord("users", "doe", "db data for doe");
    postgres.addRecord("users", "alice", "db data for alice");
    postgres.addRecord("users", "bob", "db data for bob");
  }

  // Configure API Gateway route and service mappings
  if (gatewayConfig) {
    apiGateway.strategy = gatewayConfig.strategy || "ROUND_ROBIN";
    if (gatewayConfig.routes) {
      apiGateway.setRoutes(gatewayConfig.routes);
    }

    const serviceMapping = gatewayConfig.serviceMapping || {};
    const serviceGroups: Record<string, string[]> = {};
    const routesList = gatewayConfig.routes || {};
    const serviceOptions = Array.from(new Set(Object.values(routesList)));
    const connectedServers = [server1Id, server2Id, server3Id];

    connectedServers.forEach((serverId) => {
      let serviceName = serviceMapping[serverId];
      if (!serviceName) {
        if (serverId === server1Id) serviceName = "USER_SERVICE";
        else serviceName = "POST_SERVICE";
      }
      if (serviceName !== "UNASSIGNED") {
        if (!serviceGroups[serviceName]) {
          serviceGroups[serviceName] = [];
        }
        serviceGroups[serviceName].push(serverId);
      }
    });

    for (const serviceName in serviceGroups) {
      apiGateway.setServiceNodes(serviceName, serviceGroups[serviceName]);
    }
  } else {
    apiGateway.setRoutes({
      "/api/v1/posts": "POST_SERVICE",
      "/api/v1/users": "USER_SERVICE",
    });
    apiGateway.setServiceNodes("USER_SERVICE", [server1Id]);
    apiGateway.setServiceNodes("POST_SERVICE", [server2Id, server3Id]);
  }

  const allFrames: Frame[] = [];
  const requestInputs: Array<{
    requestId?: string;
    sourceIp?: string;
    lookupKey?: string;
  }> = [];

  let globalOffset = 0;

  // Run requests defined by user or default list
  const clientRequests = clientConfig?.requests || [
    { endpoint: "/api/v1/posts/list", lookupKey: "bob", method: "GET" },
    { endpoint: "/api/v1/users/profile", lookupKey: "john", method: "GET" },
    { endpoint: "/api/v1/posts/list", lookupKey: "john", method: "GET" }
  ];

  const testcases = clientRequests.map((r: any) => r.lookupKey || "bob");

  for (let i = 0; i < clientRequests.length; i++) {
    const req = clientRequests[i];
    const sourceIp = ipv4Instance.getRandomIpv4() as string;
    const lookupKey = req.lookupKey || "bob";
    const endpoint = req.endpoint || "/api/v1/posts/list";

    const simulation = new SimulationManager(
      graph,
      registry,
      {
        lookupKey,
        endpoint,
        method: req.method || "GET",
      },
      sourceIp,
    );

    simulation.runSimulation(clientId);

    const rawFrames = simulation.getFrames() as Frame[];
    const remappedRunFrames = rawFrames.map((frame) => ({
      ...frame,
      timestamp: parallelResponse
        ? frame.timestamp
        : frame.timestamp + globalOffset,
      sourceIp,
      lookupKey,
      payloadSummary: `${req.method || "GET"} ${endpoint} | lookupKey=${lookupKey}`,
    }));

    // Capture the requestId and sourceIp of the first frame to use for rendering and debugging purposes
    const firstFrame = remappedRunFrames[0];
    if (firstFrame) {
      requestInputs.push({
        requestId: firstFrame.requestId,
        sourceIp,
        lookupKey,
      });
    }

    allFrames.push(...remappedRunFrames);

    if (!parallelResponse) {
      globalOffset += rawFrames.length;
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
    shouldKeepFrame(hideResponse, frame),
  );

  const flowNodes: Node[] = [
    {
      id: clientId,
      data: { label: "Client" },
      position: { x: 40, y: 260 },
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
      id: apigateWayId,
      data: { label: "API Gateway" },
      position: { x: 300, y: 260 },
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
      id: server1Id,
      data: { label: "Server 1" },
      position: { x: 620, y: 80 },
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
      id: server2Id,
      data: { label: "Server 2" },
      position: { x: 620, y: 260 },
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
      id: server3Id,
      data: { label: "Server 3" },
      position: { x: 620, y: 440 },
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
      position: { x: 940, y: 190 },
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
      position: { x: 940, y: 330 },
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
      id: `${clientId}->${apigateWayId}`,
      source: clientId,
      target: apigateWayId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${apigateWayId}->${server1Id}`,
      source: apigateWayId,
      target: server1Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${apigateWayId}->${server2Id}`,
      source: apigateWayId,
      target: server2Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${apigateWayId}->${server3Id}`,
      source: apigateWayId,
      target: server3Id,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${server1Id}->${redisId}`,
      source: server1Id,
      target: redisId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${server2Id}->${redisId}`,
      source: server2Id,
      target: redisId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${server3Id}->${redisId}`,
      source: server3Id,
      target: redisId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${server1Id}->${postgresId}`,
      source: server1Id,
      target: postgresId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${server2Id}->${postgresId}`,
      source: server2Id,
      target: postgresId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
    {
      id: `${server3Id}->${postgresId}`,
      source: server3Id,
      target: postgresId,
      type: "packet",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: edgeBaseStyle,
      data: { active: false, packetDuration: 2.15 },
    },
  ];

  const redisStoreSnapshot: Record<string, string> = Object.fromEntries(
    Array.from(redis.data.entries()).map(([key, value]) => [
      String(key),
      String(value),
    ]),
  );

  const usersDb = postgres.data.get("users") as
    | Map<string, unknown>
    | undefined;
  const postgresStoreSnapshot: Record<string, string> = Object.fromEntries(
    Array.from((usersDb ?? new Map<string, unknown>()).entries()).map(
      ([key, value]) => [String(key), String(value)],
    ),
  );

  return {
    frames: filteredFrames,
    nodes: flowNodes,
    edges: flowEdges,
    debug: {
      parallelResponse,
      testCasesForRedis: testcases,
      redisStore: redisStoreSnapshot,
      postgresStore: postgresStoreSnapshot,
      requestInputs,
    },
  };
}

export default createSimpleApiGatewaySimulation;
