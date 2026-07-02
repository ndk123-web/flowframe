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
import StorageModel from "@/engine/models/Storage";
import MessageQueueModel from "@/engine/models/MessageQueue/MessageQueue";
import Message from "@/engine/models/MessageQueue/Message";

type SimulationNodeKind =
  | "CLIENT"
  | "LOAD_BALANCER"
  | "SERVER"
  | "REDIS"
  | "POSTGRES"
  | "API_GATEWAY"
  | "STORAGE"
  | "MESSAGE_QUEUE"
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

    if (normalized === "STORAGE" || normalized === "STORAGE_SYSTEM" || normalized === "CLOUD_STORAGE") { 
      return "STORAGE";
    }

    if (normalized === "MESSAGE_QUEUE" || normalized === "QUEUE") {
      return "MESSAGE_QUEUE";
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

  private getResponseAction(fromNodeId: NodeId, request?: RequestManager): string {
    const kind = this.getNodeKind(fromNodeId);

    switch (kind) {
      case "SERVER":
        if (request?.context?.dbMiss) {
          return "SERVER_RESPONSE_ERROR";
        }
        if (request?.context?.valetKeyFlow) {
          return "SERVER_RETURN_VALET_KEY";
        }
        if (request?.context?.serverErrorStatus) {
          return `SERVER_RESPONSE_ERROR_${request.context.serverErrorStatus}`;
        }
        return "SERVER_SEND_RESPONSE";
      case "LOAD_BALANCER":
        if (request?.context?.serverErrorStatus) {
          return `LOAD_BALANCER_RESPONSE_ERROR_${request.context.serverErrorStatus}`;
        }
        return "LOAD_BALANCER_SEND_RESPONSE";
      case "API_GATEWAY":
        if (request?.context?.serverErrorStatus) {
          return `API_GATEWAY_RESPONSE_ERROR_${request.context.serverErrorStatus}`;
        }
        return "API_GATEWAY_SEND_RESPONSE";
      case "POSTGRES":
        return "POSTGRES_RETURN_DATA";
      case "STORAGE":
        if (request?.context?.valetKeyFlow) {
          if (request?.context?.uploadCompleted) {
            return "STORAGE_UPLOAD_SUCCESS";
          }
          return "STORAGE_REJECT_MISSING_VALET_KEY";
        }
        return "STORAGE_RETURN_URL";
      case "MESSAGE_QUEUE":
        return "QUEUE_ACK_PUBLISH";
      default:
        return "RESPONSE_BACKTRACK";
    }
  }

  private pushAsyncClientResponse(request: RequestManager, traversalPath: NodeId[]) {
    for (let i = traversalPath.length - 1; i >= 1; i--) {
      const fromNodeId = traversalPath[i];
      const toNodeId = traversalPath[i - 1];
      const action = this.getResponseAction(fromNodeId, request);
      this.pushFrame(request, fromNodeId, toNodeId, action, {
        payloadSummary: "202 Accepted: Message enqueued asynchronously",
      });
    }
  }
  
  /**
   * 
   * @param from - the node id from which the simulation starts
   * @returns - void because it will push the frames to the frames array
   * 
   */
  runSimulation(from: NodeId) {
    const requestId = this.uid.rnd(10);
    const requestName = `Request-${requestId}`;
    let currentNodeId = from;

    // runSimulation Always creates a new Request For each simulation
    const request = new RequestManager(
      requestId,
      requestName,
      currentNodeId, // starting node id
      this.payloadForRequest, // payload for the request
      this.ipv4, // ipv4 address of the request
    );

    // Set method and endpoint from payload if provided, defaulting to GET and /api/v1/getData
    if (typeof this.payloadForRequest?.endpoint === "string" && this.payloadForRequest.endpoint.length > 0) {
      request.endpoint = this.payloadForRequest.endpoint;
    } else {
      request.endpoint = "/api/v1/getData";
    }

    if (typeof this.payloadForRequest?.method === "string" && this.payloadForRequest.method.length > 0) {
      request.method = this.payloadForRequest.method as any;
    } else {
      request.method = "GET";
    }

    // set the task to "METHOD ENDPOINT"
    request.task = `${request.method} ${request.endpoint}`;

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

    // valet-key scenario context:
    // Client asks Server for signed URL, then Client uploads directly to Storage.
    request.context.valetKeyFlow = Boolean(this.payloadForRequest?.valetKeyFlow);
    request.context.signedUrlIssued = false;
    request.context.uploadCompleted = false;
    request.context.fileName =
      typeof this.payloadForRequest?.fileName === "string" &&
      this.payloadForRequest.fileName.length > 0
        ? this.payloadForRequest.fileName
        : "upload.bin";
    request.context.targetBucket =
      typeof this.payloadForRequest?.targetBucket === "string" &&
      this.payloadForRequest.targetBucket.length > 0
        ? this.payloadForRequest.targetBucket
        : "media-uploads";
     
    // set the traversal path to the current node id 
    const traversalPath: NodeId[] = [currentNodeId];

    // set the max steps to 24 
    const maxSteps = 10000;
    let steps = 0;

    // while the steps are less than the max steps, increment the steps
    while (steps < maxSteps) {
      steps++;

      // if request is backward and the traversal path is less than 2, then break the loop because we can't go backward anymore
      // minimum must be 2 because we need to have at least 2 nodes in the traversal path to go backward 
      if (request.direction === "backward") {
        if (
          request.context.valetKeyFlow &&
          traversalPath.length === 1 &&
          this.getNodeKind(currentNodeId) === "CLIENT" &&
          request.context.signedUrlIssued &&
          !request.context.uploadCompleted
        ) {
          request.direction = "forward";
          continue;
        }

        if (traversalPath.length < 2) {
          break;
        }
        
        const responseFrom = traversalPath[traversalPath.length - 1];
        const responseTo = traversalPath[traversalPath.length - 2];

        if (this.getNodeKind(responseTo) === "MESSAGE_QUEUE") {
          const consumerInstance = this.registry.getInstance(responseFrom) as ServerModel;
          if (consumerInstance) {
            consumerInstance.activeQueueMessages = Math.max(0, consumerInstance.activeQueueMessages - 1);
            const interval = consumerInstance.queueProcessingIntervals.find(
              (int) => int.requestId === request.id
            );
            if (interval) {
              interval.end = this.timestamp;
            }
          }

          this.pushFrame(
            request,
            responseFrom,
            responseTo,
            "CONSUMER_ACK",
            {
              payloadSummary: "Message processed successfully. ACK sent to Queue.",
            }
          );
          break;
        }

        const extraPayload: Partial<Frame> = {};
        const kind = this.getNodeKind(responseFrom);
        if (kind === "SERVER" || kind === "STORAGE") {
          extraPayload.payloadSummary = request.context.responsePayloadSummary;
          extraPayload.signedUrl = typeof request.context.signedUrl === "string" ? request.context.signedUrl : undefined;
          
          if (kind === "STORAGE" && request.context.uploadCompleted) {
            extraPayload.storageBucket = request.context.targetBucket || "media-uploads";
            extraPayload.storageFileName = request.context.fileName;
          }
        } else if ((kind === "API_GATEWAY" || kind === "LOAD_BALANCER") && request.context.serverErrorStatus) {
          extraPayload.payloadSummary = request.task || request.endpoint;
        }

        this.pushFrame(
          request,
          responseFrom,
          responseTo,
          this.getResponseAction(responseFrom, request),
          extraPayload,
        );
        
        traversalPath.pop();

        currentNodeId = responseTo;
        continue;
      }

      const nodeInstance = this.registry.getInstance(currentNodeId);
      if (!nodeInstance) {
        break;
      }

      // get the next nodes from the graph manager
      const nextNodes = this.graph.getNextNodes(currentNodeId);

      // normalize the node type 
      const nodeType = this.normalizeNodeType(nodeInstance.type);

      switch (nodeType) {

        /**
         * If the node type is client, then we need to send the request to the next node
         */
        case "CLIENT": {

          // Valet-key client behavior:
          // 1) first hop -> Server for signed URL
          // 2) second hop -> Storage using signed URL
          if (request.context.valetKeyFlow) {
            const entrypointNodeId = nextNodes.find((nodeId) => {
              const kind = this.getNodeKind(nodeId);
              return kind === "SERVER" || kind === "LOAD_BALANCER" || kind === "API_GATEWAY";
            });
            const storageNodeId = nextNodes.find(
              (nodeId) => this.getNodeKind(nodeId) === "STORAGE",
            );

            const shouldRequestSignedUrl = !request.context.signedUrlIssued;
            const targetNodeId = shouldRequestSignedUrl
              ? entrypointNodeId
              : storageNodeId;

            if (!targetNodeId) {
              request.direction = "backward";
              break;
            }

            this.pushFrame(
              request,
              currentNodeId,
              targetNodeId,
              shouldRequestSignedUrl
                ? "CLIENT_REQUEST_UPLOAD_URL"
                : "CLIENT_UPLOAD_USING_VALET_KEY",
              {
                payloadSummary: shouldRequestSignedUrl
                  ? `file=${request.context.fileName}`
                  : `signedUrl=${request.context.signedUrl ?? "missing"}`,
                signedUrl:
                  typeof request.context.signedUrl === "string"
                    ? request.context.signedUrl
                    : undefined,
              },
            );

            request.currentNodeId = targetNodeId;
            traversalPath.push(targetNodeId);
            currentNodeId = targetNodeId;
            break;
          }

          // if there are no next nodes, then return 
          if (nextNodes.length === 0) {
            return;
          }

          // get the first next node
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

          // set nodeId to next nodeId to send req from
          request.currentNodeId = toNodeId;
          
          // assumed as traversed toNodeId as well 
          traversalPath.push(toNodeId);
          currentNodeId = toNodeId;
          break;
        }

        case "LOAD_BALANCER": {

          // if nodes of Load_balancers are empty then set direction as backward 
          if (nextNodes.length === 0) {
            request.direction = "backward";
            break;
          }

          // get instance of LoadBalancer
          const lbInstance = nodeInstance as LoadBalancerModel;
          
          // Filter out servers that are overloaded / capacity = 0
          const healthyNodes = nextNodes.filter((nodeId) => {
            const inst = this.registry.getInstance(nodeId);
            if (inst && (inst.type === "SERVER" || inst.type === "Server")) {
              const serverInst = inst as ServerModel;
              return serverInst.canAccepthRequest();
            }
            return true;
          });

          // used Default Round Robin Strategy By Load Balancer Model
          const selectedNodeId = lbInstance.runLoadBalancer(healthyNodes, request.ipAddress);
          if (!selectedNodeId || selectedNodeId === -1) {
            const previousNodeId = traversalPath[traversalPath.length - 2] ?? currentNodeId;
            this.pushFrame(
              request,
              currentNodeId,
              previousNodeId,
              "LOAD_BALANCER_REJECT_REQUEST",
              {
                payloadSummary: "503 Service Unavailable: No healthy servers available",
              }
            );
            request.context.serverErrorStatus = "503";
            traversalPath.pop();
            request.currentNodeId = previousNodeId;
            currentNodeId = previousNodeId;
            request.direction = "backward";
            break;
          }

          // push the frame lb -> selectedNodeId(server)
          this.pushFrame(
            request,
            currentNodeId,
            selectedNodeId,
            "LOAD_BALANCER_FORWARD_REQUEST",
          );

          // change the current to that serverNodeId
          request.currentNodeId = selectedNodeId;

          // add serverNodeId as traversal
          traversalPath.push(selectedNodeId);
          currentNodeId = selectedNodeId;
          break;
        }

        case "SERVER": {

          const serverInstance = nodeInstance as ServerModel;
          
          // we are checking here load
          if (!serverInstance.canAccepthRequest()) {
            this.pushFrame(request, currentNodeId, "", "SERVER_REJECT_REQUEST");
            return;
          }

          // Check if this server is behaving as a queue consumer in the current step
          const previousHopId = traversalPath[traversalPath.length - 2];
          const isActingAsConsumer = previousHopId && this.getNodeKind(previousHopId) === "MESSAGE_QUEUE";

          // Check endpoint and method validity (only for non-valetKey and non-consumer flows)
          if (!request.context.valetKeyFlow && !isActingAsConsumer) {
            const normalizePath = (p: string) => p.replace(/^\/+|\/+$/g, "");
            const reqEndpoint = normalizePath(request.endpoint || "");
            const reqMethod = request.method;

            // Find matching endpoint
            const matchingEndpointKey = Object.keys(serverInstance.endpoints || {}).find(
              (ep) => normalizePath(ep) === reqEndpoint
            );

            if (!matchingEndpointKey) {
              const previousNodeId = traversalPath[traversalPath.length - 2] ?? currentNodeId;
              this.pushFrame(
                request,
                currentNodeId,
                previousNodeId,
                "SERVER_ENDPOINT_NOT_FOUND",
                {
                  payloadSummary: `404 Not Found: ${reqMethod} ${request.endpoint}`,
                }
              );
              request.context.serverErrorStatus = "404";
              traversalPath.pop();
              request.currentNodeId = previousNodeId;
              currentNodeId = previousNodeId;
              request.direction = "backward";
              break;
            }

            const allowedMethods = serverInstance.endpoints[matchingEndpointKey] || [];
            if (!allowedMethods.includes(reqMethod)) {
              const previousNodeId = traversalPath[traversalPath.length - 2] ?? currentNodeId;
              this.pushFrame(
                request,
                currentNodeId,
                previousNodeId,
                "SERVER_METHOD_NOT_ALLOWED",
                {
                  payloadSummary: `405 Method Not Allowed: ${reqMethod} ${request.endpoint}`,
                }
              );
              request.context.serverErrorStatus = "405";
              traversalPath.pop();
              request.currentNodeId = previousNodeId;
              currentNodeId = previousNodeId;
              request.direction = "backward";
              break;
            }
          }

          // Valet-key server behavior:
          // Server generates signed URL and returns it to previous Client.
          if (request.context.valetKeyFlow) {
            const fileName = String(request.context.fileName ?? "upload.bin");
            const signedUrl =
              `https://storage.example/upload/${fileName}` +
              `?token=signed-url-for-${request.id}`;

            request.context.signedUrl = signedUrl;
            request.context.signedUrlIssued = true;
            request.context.responsePayloadSummary = `ttl=120s file=${fileName}`;

            request.direction = "backward";
            break;
          }

           // check whether message queue is there ?
          const queueNodeId = nextNodes.find(
            (nodeId) => this.getNodeKind(nodeId) === "MESSAGE_QUEUE",
          );

          if (queueNodeId) {
            const queueInstance = this.registry.getInstance(queueNodeId) as MessageQueueModel;
            if (queueInstance) {
              const msgId = `msg-${this.uid.rnd(5)}`;
              const msgName = `Msg-${msgId}`;
              const success = serverInstance.publishMessage(
                queueInstance,
                msgId,
                msgName,
                { ...request.payload, priority: request.payload?.priority ?? 0 }
              );

              if (success) {
                this.pushFrame(
                  request,
                  currentNodeId,
                  queueNodeId,
                  "SERVER_PUBLISH_MESSAGE",
                  {
                    payloadSummary: `Enqueued: ${msgName}`,
                  }
                );

                this.pushFrame(
                  request,
                  queueNodeId,
                  currentNodeId,
                  "QUEUE_ACK_PUBLISH",
                  {
                    payloadSummary: `Publisher Confirm: Acked ${msgName}`,
                  }
                );

                const deliveryStartTimestamp = this.timestamp;

                this.pushAsyncClientResponse(request, traversalPath);

                this.timestamp = deliveryStartTimestamp;

                request.currentNodeId = queueNodeId;
                traversalPath.push(queueNodeId);
                currentNodeId = queueNodeId;
                break;
              } else {
                if (queueInstance.overflowBehavior === "BLOCK") {
                  // 1. Push a blocked wait frame
                  this.pushFrame(
                    request,
                    currentNodeId,
                    queueNodeId,
                    "QUEUE_FULL_WAIT",
                    {
                      payloadSummary: `Queue Full: Producer blocked, waiting for consumer to process...`,
                    }
                  );

                  // 2. Simulate consumer activity by pulling/shifting a message out of the queue
                  if (queueInstance.queue.length > 0) {
                    queueInstance.queue.shift();
                  }

                  // 3. Re-try publishing now that space is freed
                  const retrySuccess = serverInstance.publishMessage(
                    queueInstance,
                    msgId,
                    msgName,
                    { ...request.payload, priority: request.payload?.priority ?? 0 }
                  );

                  if (retrySuccess) {
                    this.pushFrame(
                      request,
                      currentNodeId,
                      queueNodeId,
                      "SERVER_PUBLISH_MESSAGE",
                      {
                        payloadSummary: `Enqueued after wait: ${msgName}`,
                      }
                    );

                    this.pushFrame(
                      request,
                      queueNodeId,
                      currentNodeId,
                      "QUEUE_ACK_PUBLISH",
                      {
                        payloadSummary: `Publisher Confirm: Acked ${msgName}`,
                      }
                    );

                    const deliveryStartTimestamp = this.timestamp;

                    this.pushAsyncClientResponse(request, traversalPath);

                    this.timestamp = deliveryStartTimestamp;

                    request.currentNodeId = queueNodeId;
                    traversalPath.push(queueNodeId);
                    currentNodeId = queueNodeId;
                    break;
                  }
                }

                const previousNodeId = traversalPath[traversalPath.length - 2] ?? currentNodeId;
                this.pushFrame(
                  request,
                  currentNodeId,
                  previousNodeId,
                  "SERVER_QUEUE_FULL_REJECT",
                  {
                    payloadSummary: "503 Service Unavailable: Message Queue is full",
                  }
                );
                request.context.serverErrorStatus = "503";
                traversalPath.pop();
                request.currentNodeId = previousNodeId;
                currentNodeId = previousNodeId;
                request.direction = "backward";
                break;
              }
            }
          }

          // check whether redis is there ? 
          const redisNodeId = nextNodes.find(
            (nodeId) => this.getNodeKind(nodeId) === "REDIS",
          );

          // check whether postgres is there ?
          const postgresNodeId = nextNodes.find(
            (nodeId) => this.getNodeKind(nodeId) === "POSTGRES",
          );

          // 1. If we are awaiting DB lookup (cache miss) OR there is no Redis but Postgres is connected, forward to Postgres:
          if (postgresNodeId && (request.context.awaitingDbLookup || !redisNodeId)) {
            this.pushFrame(
              request,
              currentNodeId,
              postgresNodeId,
              "SERVER_FORWARD_REQUEST_TO_POSTGRES",
            );

            // Reset the flag if it was set
            request.context.awaitingDbLookup = false;
            request.currentNodeId = postgresNodeId;
            traversalPath.push(postgresNodeId);
            currentNodeId = postgresNodeId;
            break;
          }

          /**
           * 2. If the request has not done redis lookup and there is a redis then go to redis
           * because our system prioritizes cache over the database
           */
          if (!request.context.redisLookupDone && redisNodeId) {
            
            // push frame from (server-redis)
            this.pushFrame(
              request,
              currentNodeId,
              redisNodeId,
              "SERVER_FORWARD_REQUEST_TO_REDIS",
            );

            // set redisLookupDone to true so that redis will process the key 
            request.context.redisLookupDone = true;

            // change current to redisNodeId
            request.currentNodeId = redisNodeId;

            // add redis to path traversed
            traversalPath.push(redisNodeId);
            currentNodeId = redisNodeId;
            break;
          }

          // if not then go backward
          request.direction = "backward";
          break;
        }

        case "REDIS": {
          if (traversalPath.length < 2) {
            return;
          }

          const redisInstance = nodeInstance as RedisModel;
          
          // get the lookUpKey From the request context 
          const lookUpKey = request.context.lookupKey as string | undefined;
          const lookUpData = lookUpKey
            ? redisInstance.getData(lookUpKey)
            : null;

          // return back to previousNodeId
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

          // once we used then pop 
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

          const postgresInstance = nodeInstance as PostgresModel;

          // ── Connection Pool Logic ──────────────────────────────────────────
          // Identify the originating server (the node that sent this request to Postgres).
          // That is always the node directly before postgres in the traversal path.
          const originatingServerId = traversalPath[traversalPath.length - 2];
          const originatingServerInstance = this.registry.getInstance(originatingServerId);
          const isServer =
            originatingServerInstance &&
            this.normalizeNodeType(originatingServerInstance.type) === "SERVER";

          if (isServer) {
            const parallel = Boolean(this.payloadForRequest?.parallelResponse);
            const poolSize = postgresInstance.getPoolSize(originatingServerId);

            if (poolSize === 0) {
              this.pushFrame(
                request,
                currentNodeId,
                originatingServerId,
                "POSTGRES_CONNECTION_ERROR",
                {
                  payloadSummary: `Connection failed: 0 TCP connections open from ${originatingServerId} to Postgres`,
                  postgresPoolStatus: {
                    serverId: originatingServerId,
                    poolSize: 0,
                    activeConnections: 0,
                    exhausted: true,
                  },
                },
              );
              request.context.serverErrorStatus = "500";
              traversalPath.pop();
              request.currentNodeId = originatingServerId;
              currentNodeId = originatingServerId;
              request.direction = "backward";
              break;
            }

            // Wait loop for parallel connections
            while (postgresInstance.isPoolExhaustedAt(originatingServerId, this.timestamp - 1, parallel)) {
              const activeConns = postgresInstance.connectionIntervals.filter(
                (int) => int.serverId === originatingServerId && (this.timestamp - 1) >= int.start && (this.timestamp - 1) < int.end
              ).length;

              this.pushFrame(
                request,
                currentNodeId,
                currentNodeId, // stays at postgres — it's waiting here
                "POSTGRES_POOL_WAIT",
                {
                  payloadSummary: `Pool exhausted for ${originatingServerId}: ${activeConns}/${poolSize} connections in use — ${request.name} queued`,
                  postgresPoolStatus: {
                    serverId: originatingServerId,
                    poolSize,
                    activeConnections: activeConns,
                    exhausted: true,
                  },
                },
              );
            }

            // Connection is available! Check it out
            if (parallel) {
              postgresInstance.connectionIntervals.push({
                serverId: originatingServerId,
                requestId: request.id,
                start: this.timestamp - 1,
                end: this.timestamp,
              });
            } else {
              // Fallback for sequential
              const poolExhausted = postgresInstance.isPoolExhausted(originatingServerId);
              if (poolExhausted) {
                const activeConns = postgresInstance.getActiveConnections(originatingServerId);
                this.pushFrame(
                  request,
                  currentNodeId,
                  currentNodeId,
                  "POSTGRES_POOL_WAIT",
                  {
                    payloadSummary: `Pool exhausted for ${originatingServerId}: ${activeConns}/${poolSize} connections in use — ${request.name} queued`,
                    postgresPoolStatus: {
                      serverId: originatingServerId,
                      poolSize,
                      activeConnections: activeConns,
                      exhausted: true,
                    },
                  },
                );
              } else {
                postgresInstance.acquireConnection(originatingServerId);
                request.context.acquiredPostgresPoolFor = originatingServerId;
              }
            }
          }
          // ──────────────────────────────────────────────────────────────────

          const lookUpKey = request.context.lookupKey as string | undefined;
          const lookUpData = postgresInstance.getRecord("users", lookUpKey as string);

          console.log("lookUpData", lookUpData);

          if (lookUpData === null) {
            request.context.dbMiss = true;
          }

          const previousNodeId = traversalPath[traversalPath.length - 2];

          // Attach pool status to the query frame so the UI can show it
          const poolStatusForFrame =
            isServer
              ? {
                  postgresPoolStatus: {
                    serverId: originatingServerId,
                    poolSize: postgresInstance.getPoolSize(originatingServerId),
                    activeConnections: Boolean(this.payloadForRequest?.parallelResponse)
                      ? postgresInstance.connectionIntervals.filter(
                          (int) => int.serverId === originatingServerId && (this.timestamp - 1) >= int.start && (this.timestamp - 1) < int.end
                        ).length
                      : postgresInstance.getActiveConnections(originatingServerId),
                    exhausted: false,
                  },
                }
              : {};

          this.pushFrame(
            request,
            currentNodeId,
            previousNodeId,
            lookUpData === null ? "POSTGRES_QUERY_MISS" : "POSTGRES_QUERY_HIT",
            poolStatusForFrame,
          );

          // ── Release the connection slot after the query completes ──────────
          if (request.context.acquiredPostgresPoolFor) {
            postgresInstance.releaseConnection(request.context.acquiredPostgresPoolFor);
            request.context.acquiredPostgresPoolFor = undefined;
          }
          // ──────────────────────────────────────────────────────────────────

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
            request.context.serverErrorStatus = "404";
            traversalPath.pop();
            request.currentNodeId = previousNodeId;
            currentNodeId = previousNodeId;
            request.direction = "backward";
            break;
          }

          try {
            const selectedNodeId = apiGatewayInstance.runGateway(request, this.registry);
            if (!selectedNodeId || !nextNodes.includes(selectedNodeId)) {
              this.pushFrame(
                request,
                currentNodeId,
                previousNodeId,
                "API_GATEWAY_ROUTE_NOT_FOUND",
              );
              request.context.serverErrorStatus = "404";
              traversalPath.pop();
              request.currentNodeId = previousNodeId;
              currentNodeId = previousNodeId;
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
          } catch (err: any) {
            const errorMsg = err?.message || "";
            const is503 = errorMsg.includes("503");
            this.pushFrame(
              request,
              currentNodeId,
              previousNodeId,
              is503 ? "API_GATEWAY_SERVICE_UNAVAILABLE" : "API_GATEWAY_ROUTE_ERROR",
              {
                payloadSummary: is503 ? "503 Service Unavailable: All backend servers down" : "500 Internal Server Error",
              }
            );
            request.context.serverErrorStatus = is503 ? "503" : "500";
            traversalPath.pop();
            request.currentNodeId = previousNodeId;
            currentNodeId = previousNodeId;
            request.direction = "backward";
          }
          break;
        }
        
        /**
         * if node is Storage , 
         * now we can store the file in storage and return the some signed url to the client for uploading the file to storage, this is simulating the valet key scenario where client can directly upload the file to storage without going through the server after getting the signed url from the server, this is a common pattern used in real world applications to offload the file upload traffic from the server and also to improve the upload performance by allowing client to upload directly to storage, in this flow we are assuming that client will request a signed url from the server and then server will generate a signed url and return it to the client and then client will use that signed url to upload the file directly to storage, so in this case we are simulating the generation of signed url and returning it to the client without actually implementing the file upload functionality because our focus is on simulating the request flow rather than implementing the actual file upload logic
         */
        case "STORAGE": {

          // Valet-key storage behavior:
          // Storage receives direct upload from Client and confirms upload.
          if (request.context.valetKeyFlow) {
            const storageInstance = nodeInstance as StorageModel;
            const fileName = String(request.context.fileName ?? "upload.bin");
            const bucketsList = Array.from(storageInstance.data.keys());
            const targetBucket = request.context.targetBucket || bucketsList[0] || "media-uploads";

            if (request.context.signedUrlIssued) {
              storageInstance.addFileIntoBucket(
                targetBucket,
                fileName,
                {
                  requestId: request.id,
                  sourceIp: request.ipAddress,
                },
              );
              request.context.uploadCompleted = true;
              request.context.responsePayloadSummary = `uploaded file=${fileName} at signedUrl=${request.context.signedUrl ?? "missing"} bucket=${targetBucket}`;
            } else {
              request.context.responsePayloadSummary = `file=${fileName} bucket=${targetBucket}`;
            }

            request.direction = "backward";
            break;
          }
          
          const storageInstance = nodeInstance as StorageModel;
          const file = request.context.isThereFileToUpload ? (request.context.filesToUpload?.[0] || request.context.fileName) : undefined;
          
          const bucketsList = Array.from(storageInstance.data.keys());
          const targetBucket = request.context.targetBucket || bucketsList[0] || "media-uploads";

          if (file === undefined) {
            this.pushFrame(
              request,
              currentNodeId,
              traversalPath[traversalPath.length - 2],
              "STORAGE_NO_FILE_TO_UPLOAD",              
            )
            request.direction = "backward";
            break;
          }

          const signedUrl: string = storageInstance.addFileIntoBucket(targetBucket, file, "file-content-placeholder");
          
          // send the signed url back to client and then client will use that signed url to upload the file directly to storage
          this.pushFrame(
            request, 
            currentNodeId,
            traversalPath[traversalPath.length - 2],
            "STORAGE_RETURN_SIGNED_URL",
            {
              signedUrl,
              storageBucket: targetBucket,
              storageFileName: typeof file === "string" ? file : "upload.bin"
            }
          )

           request.direction = "backward";
          traversalPath.pop();
          request.currentNodeId = traversalPath[traversalPath.length - 1];
          currentNodeId = traversalPath[traversalPath.length - 1];
          break;
        }

        case "MESSAGE_QUEUE": {
          if (traversalPath.length < 2) {
            return;
          }

          const queueInstance = nodeInstance as MessageQueueModel;

          // Get all next nodes that are SERVER
          const connectedConsumerIds = nextNodes.filter((nodeId) => {
            const inst = this.registry.getInstance(nodeId);
            return inst && (inst.type === "SERVER" || inst.type === "Server");
          });

          const parallel = Boolean(this.payloadForRequest?.parallelResponse);

          // Find a free consumer server based on prefetch limits
          // Find a free consumer server based on prefetch limits
          let freeConsumerId = connectedConsumerIds.find((nodeId) => {
            const server = this.registry.getInstance(nodeId) as ServerModel;
            return server && server.isConsumerFreeAt(this.timestamp, parallel);
          });

          let deliveryTime = this.timestamp;

          if (!freeConsumerId && connectedConsumerIds.length > 0) {
            // Buffer the message and wait for a worker to become free
            this.pushFrame(
              request,
              currentNodeId,
              currentNodeId,
              "QUEUE_MESSAGE_BUFFERED",
              {
                payloadSummary: `All consumers busy. Msg buffered in queue (Size: ${queueInstance.queue.length}).`,
              }
            );

            // Wait loop to find next free timestamp
            const maxWait = 1000;
            let waitTicks = 0;
            while (!freeConsumerId && waitTicks < maxWait) {
              deliveryTime++;
              waitTicks++;
              freeConsumerId = connectedConsumerIds.find((nodeId) => {
                const server = this.registry.getInstance(nodeId) as ServerModel;
                if (!server) return false;

                // Lookahead: if the worker is sending an ACK at deliveryTime, we must check if it's free at deliveryTime + 1
                const isAcking = server.queueProcessingIntervals.some(
                  (int) => deliveryTime === int.end
                );
                const targetTime = isAcking ? deliveryTime + 1 : deliveryTime;
                return server.isConsumerFreeAt(targetTime, parallel);
              });
            }
          }

          if (freeConsumerId) {
            const consumerInstance = this.registry.getInstance(freeConsumerId) as ServerModel;
            // Dequeue the message
            const message = queueInstance.dequeue();
            const msgName = message?.name || "Message";

            // If we waited, we deliver at the target time (which might be deliveryTime + 1 if the worker was ACK'ing)
            let finalDeliveryTime = deliveryTime;
            if (deliveryTime > this.timestamp) {
              const isAcking = consumerInstance.queueProcessingIntervals.some(
                (int) => deliveryTime === int.end
              );
              finalDeliveryTime = isAcking ? deliveryTime + 1 : deliveryTime;
            }

            this.timestamp = finalDeliveryTime;

            consumerInstance.activeQueueMessages++;
            consumerInstance.queueProcessingIntervals.push({
              requestId: request.id,
              start: this.timestamp,
              end: 999999,
            });

            this.pushFrame(
              request,
              currentNodeId,
              freeConsumerId,
              "QUEUE_DELIVER_MESSAGE",
              {
                payloadSummary: `Delivered: ${msgName} to Consumer ${consumerInstance.name}`,
              }
            );

            // Forward traversal to the consumer server
            request.currentNodeId = freeConsumerId;
            traversalPath.push(freeConsumerId);
            currentNodeId = freeConsumerId;
          } else {
            // All consumers are busy or none connected
            this.pushFrame(
              request,
              currentNodeId,
              currentNodeId,
              "QUEUE_MESSAGE_BUFFERED",
              {
                payloadSummary: `All consumers busy or none connected. Msg buffered in queue (Size: ${queueInstance.queue.length}).`,
              }
            );

            const previousNodeId = traversalPath[traversalPath.length - 2] ?? currentNodeId;
            traversalPath.pop();
            request.currentNodeId = previousNodeId;
            currentNodeId = previousNodeId;
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
