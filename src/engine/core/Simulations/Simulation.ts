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

type SimulationNodeKind =
  | "CLIENT"
  | "LOAD_BALANCER"
  | "SERVER"
  | "REDIS"
  | "POSTGRES"
  | "API_GATEWAY"
  | "STORAGE"
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
        return "SERVER_SEND_RESPONSE";
      case "LOAD_BALANCER":
        return "LOAD_BALANCER_SEND_RESPONSE";
      case "API_GATEWAY":
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
      default:
        return "RESPONSE_BACKTRACK";
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

    // set the task to "GET_DATA" 
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
    const maxSteps = 500;
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

        const extraPayload: Partial<Frame> = {};
        const kind = this.getNodeKind(responseFrom);
        if (kind === "SERVER" || kind === "STORAGE") {
          extraPayload.payloadSummary = request.context.responsePayloadSummary;
          extraPayload.signedUrl = typeof request.context.signedUrl === "string" ? request.context.signedUrl : undefined;
          
          if (kind === "STORAGE" && request.context.uploadCompleted) {
            extraPayload.storageBucket = request.context.targetBucket || "media-uploads";
            extraPayload.storageFileName = request.context.fileName;
          }
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
          
          // used Default Round Robin Strategy By Load Balancer Model
          const selectedNodeId = lbInstance.runLoadBalancer(nextNodes);
          if (!selectedNodeId) {
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
          const lookUpKey = request.context.lookupKey as string | undefined;
          const lookUpData = postgresInstance.getRecord("users", lookUpKey as string); 

          console.log("lookUpData", lookUpData); 

          if (lookUpData === null) {
            request.context.dbMiss = true;
          }

          const previousNodeId = traversalPath[traversalPath.length - 2];
          this.pushFrame(
            request,
            currentNodeId,
            previousNodeId,
            lookUpData === null ? "POSTGRES_QUERY_MISS" : "POSTGRES_QUERY_HIT",
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
            traversalPath.pop();
            request.currentNodeId = previousNodeId;
            currentNodeId = previousNodeId;
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
          } catch (_error) {
            this.pushFrame(
              request,
              currentNodeId,
              previousNodeId,
              "API_GATEWAY_ROUTE_ERROR",
            );
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
