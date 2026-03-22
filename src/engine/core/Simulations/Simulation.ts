import { NodeId } from "../../types";
import { GraphManager } from "../Graph/graph";
import { RequestManager } from "../../models/Request";
import type { Frame } from "../../types";
import { NodeRegistry } from "../Graph/nodeResgistry";
import ShortUniqueId from "short-unique-id";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import RedisModel from "@/engine/models/Redis";
import PostgresModel from "@/engine/models/Postgres";
import ServerModel from "@/engine/models/server";
import ApiGatewayModel from "@/engine/models/ApiGateway";

type SimulationNodeKind =
  | "CLIENT"
  | "LOAD_BALANCER"
  | "SERVER"
  | "REDIS"
  | "POSTGRES"
  | "API_GATEWAY"
  | "UNKNOWN";

class SimulationManager {
  graph: GraphManager;
  from: NodeId;
  to: NodeId;
  frames: Frame[] = [];
  registry: NodeRegistry;
  uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
  timestamp: number = 0;
  payloadForRequest: { [key: string]: any } = {};
  redisLookupCursor: number = 0;
  ipv4: string;

  constructor(
    graph: GraphManager,
    registry: NodeRegistry,

    // means the object.key is string and object.value.key is string and object.value.value can be anything, this is used to pass data from one node to another node in the simulation, for example, client can pass some data to server which will be stored in the registry and then server can pass the same data to redis cache or postgres database, this will help us to simulate cache hit and cache miss scenarios in the simple cache scenario
    payloadForRequest: { [key: string]: any } = {},
    ipv4: string = "0.0.0.0",
  ) {
    this.graph = graph;
    this.registry = registry;
    this.from = "";
    this.to = "";
    this.payloadForRequest = payloadForRequest;
    this.ipv4 = ipv4;
  }

  private normalizeNodeType(type: string): SimulationNodeKind {
    const normalized = String(type || "").toUpperCase();

    if (normalized === "CLIENT") {
      return "CLIENT";
    }

    if (normalized === "LOAD_BALANCER") {
      return "LOAD_BALANCER";
    }

    if (normalized === "SERVER") {
      return "SERVER";
    }

    if (normalized === "REDIS" || normalized === "REDIS_CACHE") {
      return "REDIS";
    }

    if (normalized === "POSTGRES" || normalized === "POSTGRES_DATABASE") {
      return "POSTGRES";
    }

    if (normalized === "API_GATEWAY") {
      return "API_GATEWAY";
    }

    return "UNKNOWN";
  }

  private getNodeKind(nodeId: NodeId): SimulationNodeKind {
    const nodeInstance = this.registry.getInstance(nodeId);
    if (!nodeInstance) {
      return "UNKNOWN";
    }

    return this.normalizeNodeType(nodeInstance.type);
  }

  private pushFrame(
    request: RequestManager,
    from: NodeId,
    to: NodeId,
    action: string,
    extra: Partial<Frame> = {},
  ) {
    this.frames.push({
      requestId: request.id,
      requestName: request.name,
      from,
      to,
      timestamp: this.timestamp++,
      action,
      sourceIp: request.ipAddress,
      lookupKey:
        typeof request.context.lookupKey === "string"
          ? request.context.lookupKey
          : undefined,
      ...extra,
    });
  }

  private getResponseAction(fromNodeId: NodeId): string {
    const kind = this.getNodeKind(fromNodeId);

    switch (kind) {
      case "SERVER":
        return "SERVER_SEND_RESPONSE";
      case "LOAD_BALANCER":
        return "LOAD_BALANCER_SEND_RESPONSE";
      case "API_GATEWAY":
        return "API_GATEWAY_SEND_RESPONSE";
      case "POSTGRES":
        return "POSTGRES_RETURN_DATA";
      default:
        return "RESPONSE_BACKTRACK";
    }
  }

  runSimulation(from: NodeId) {
    const requestId = this.uid.rnd(10);
    const requestName = `Request-${requestId}`;
    let currentNodeId = from;

    // runSimulation Always creates a new Request For each simulation
    const request = new RequestManager(
      requestId,
      requestName,
      currentNodeId,
      this.payloadForRequest,
      this.ipv4,
    );
    request.task = "GET_DATA";

    // Optional endpoint comes from scenario payload for API Gateway routing.
    const explicitEndpoint = this.payloadForRequest?.endpoint;
    if (typeof explicitEndpoint === "string" && explicitEndpoint.length > 0) {
      request.endpoint = explicitEndpoint;
      request.task = `GET ${explicitEndpoint}`;
    }

    // deterministic lookup key selection for cache scenarios.
    const explicitLookupKey = this.payloadForRequest?.lookupKey;
    if (typeof explicitLookupKey === "string" && explicitLookupKey.length > 0) {
      request.context.lookupKey = explicitLookupKey;
    } else {
      const testCases = this.payloadForRequest?.testCasesForRedis?.data;
      if (Array.isArray(testCases) && testCases.length > 0) {
        const selectedIndex = this.redisLookupCursor % testCases.length;
        request.context.lookupKey = testCases[selectedIndex];
        this.redisLookupCursor++;
      }
    }

    const traversalPath: NodeId[] = [currentNodeId];
    const maxSteps = 24;
    let steps = 0;

    while (steps < maxSteps) {
      steps++;

      if (request.direction === "backward") {
        if (traversalPath.length < 2) {
          break;
        }

        const responseFrom = traversalPath[traversalPath.length - 1];
        const responseTo = traversalPath[traversalPath.length - 2];
        this.pushFrame(
          request,
          responseFrom,
          responseTo,
          this.getResponseAction(responseFrom),
        );

        traversalPath.pop();
        currentNodeId = responseTo;
        continue;
      }

      const nodeInstance = this.registry.getInstance(currentNodeId);
      if (!nodeInstance) {
        break;
      }

      /**
       * get the next nodes from the graph manager and type and normalize it and  of current node from the registry
       */
      const nextNodes = this.graph.getNextNodes(currentNodeId);
      const nodeType = this.normalizeNodeType(nodeInstance.type);

      /**
       * Simulate bases on the type of Node, because it becomes easier to resone about the behavior of each node type and also it becomes easier to add new node types in the future, for example,
       * if we want to add a new node type called "CACHE" then we can simply add a new case in the switch statement below without affecting the existing logic of other node types.
       */
      switch (nodeType) {
        case "CLIENT": {
          if (nextNodes.length === 0) {
            return;
          }

          const toNodeId = nextNodes[0];
          this.pushFrame(
            request,
            currentNodeId,
            toNodeId,
            "CLIENT_SEND_REQUEST",
            {
              payloadSummary: request.task || "GET_DATA",
            },
          );
          request.currentNodeId = toNodeId;
          traversalPath.push(toNodeId);
          currentNodeId = toNodeId;
          break;
        }

        case "LOAD_BALANCER": {
          if (nextNodes.length === 0) {
            request.direction = "backward";
            break;
          }

          const lbInstance = nodeInstance as LoadBalancerModel;
          const selectedNodeId = lbInstance.runLoadBalancer(nextNodes);
          if (!selectedNodeId) {
            request.direction = "backward";
            break;
          }

          this.pushFrame(
            request,
            currentNodeId,
            selectedNodeId,
            "LOAD_BALANCER_FORWARD_REQUEST",
          );

          request.currentNodeId = selectedNodeId;
          traversalPath.push(selectedNodeId);
          currentNodeId = selectedNodeId;
          break;
        }

        case "SERVER": {
          const serverInstance = nodeInstance as ServerModel;
          if (!serverInstance.canAccepthRequest()) {
            this.pushFrame(request, currentNodeId, "", "SERVER_REJECT_REQUEST");
            return;
          }

          const redisNodeId = nextNodes.find(
            (nodeId) => this.getNodeKind(nodeId) === "REDIS",
          );
          const postgresNodeId = nextNodes.find(
            (nodeId) => this.getNodeKind(nodeId) === "POSTGRES",
          );

          if (request.context.awaitingDbLookup && postgresNodeId) {
            this.pushFrame(
              request,
              currentNodeId,
              postgresNodeId,
              "SERVER_FORWARD_REQUEST_TO_POSTGRES",
            );
            request.context.awaitingDbLookup = false;
            request.currentNodeId = postgresNodeId;
            traversalPath.push(postgresNodeId);
            currentNodeId = postgresNodeId;
            break;
          }

          /**
           * if the request has not done redis lookup and there is a redis then go to redis bro then
           * because our system prioritize cache over the database
           */
          if (!request.context.redisLookupDone && redisNodeId) {
            this.pushFrame(
              request,
              currentNodeId,
              redisNodeId,
              "SERVER_FORWARD_REQUEST_TO_REDIS",
            );
            request.context.redisLookupDone = true;
            request.currentNodeId = redisNodeId;
            traversalPath.push(redisNodeId);
            currentNodeId = redisNodeId;
            break;
          }

          request.direction = "backward";
          break;
        }

        case "REDIS": {
          if (traversalPath.length < 2) {
            return;
          }

          const redisInstance = nodeInstance as RedisModel;
          const lookUpKey = request.context.lookupKey as string | undefined;
          const lookUpData = lookUpKey
            ? redisInstance.getData(lookUpKey)
            : null;

          const previousNodeId = traversalPath[traversalPath.length - 2];
          this.pushFrame(
            request,
            currentNodeId,
            previousNodeId,
            lookUpData === null ? "REDIS_CACHE_MISS" : "REDIS_CACHE_HIT",
            {
              redisKeysSnapshot: Array.from(redisInstance.data.keys()),
            },
          );

          traversalPath.pop();
          request.currentNodeId = previousNodeId;
          currentNodeId = previousNodeId;

          /**
           * trigger point for cache miss and call the database as awaitingDBLookup to true
           */
          if (lookUpData === null) {
            request.context.awaitingDbLookup = true;
            request.direction = "forward";
          } else {
            request.direction = "backward";
          }
          break;
        }

        case "POSTGRES": {
          if (traversalPath.length < 2) {
            return;
          }

          const previousNodeId = traversalPath[traversalPath.length - 2];
          this.pushFrame(
            request,
            currentNodeId,
            previousNodeId,
            "POSTGRES_RETURN_DATA",
          );

          traversalPath.pop();
          request.currentNodeId = previousNodeId;
          currentNodeId = previousNodeId;
          request.direction = "backward";
          break;
        }

        case "API_GATEWAY": {
          /*
           * API Gateway flow:
           * 1) Read request.endpoint and resolve service node using gateway routing config.
           * 2) Validate the selected node is connected from gateway in the graph.
           * 3) Forward request to selected service. If no route is found, switch to backward.
           */
          const apiGatewayInstance = nodeInstance as ApiGatewayModel;
          const previousNodeId = traversalPath[traversalPath.length - 2] ?? currentNodeId;

          if (nextNodes.length === 0) {
            this.pushFrame(
              request,
              currentNodeId,
              previousNodeId,
              "API_GATEWAY_EMPTY_ROUTE_REJECT",
            );
            request.direction = "backward";
            break;
          }

          try {
            const selectedNodeId = apiGatewayInstance.runGateway(request);
            if (!selectedNodeId || !nextNodes.includes(selectedNodeId)) {
              this.pushFrame(
                request,
                currentNodeId,
                previousNodeId,
                "API_GATEWAY_ROUTE_NOT_FOUND",
              );
              request.direction = "backward";
              break;
            }

            this.pushFrame(
              request,
              currentNodeId,
              selectedNodeId,
              "API_GATEWAY_FORWARD_REQUEST",
            );

            request.currentNodeId = selectedNodeId;
            traversalPath.push(selectedNodeId);
            currentNodeId = selectedNodeId;
          } catch (_error) {
            this.pushFrame(
              request,
              currentNodeId,
              previousNodeId,
              "API_GATEWAY_ROUTE_ERROR",
            );
            request.direction = "backward";
          }
          break;
        }

        default:
          return;
      }
    }
  }

  getFrames() {
    return this.frames;
  }
}

export { SimulationManager };
