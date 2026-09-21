import type { Node, Edge } from "@xyflow/react";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import Ipv4Generator from "@/utils/generateRandomIp";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import RandomLoadStrategy from "@/engine/core/Strategy/RandomLoadStrategy";
import IPHashStrategy from "@/engine/core/Strategy/IPHashStrategy";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import PriorityQueue from "@/engine/core/Simulations/ParallelSimulation";

import ClientModel from "@/engine/models/Client";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import RedisModel from "@/engine/models/Redis";
import PostgresModel from "@/engine/models/Postgres";
import ApiGatewayModel from "@/engine/models/ApiGateway";
import StorageModel from "@/engine/models/Storage";
import DnsModel from "@/engine/models/Dns";
import CdnModel from "@/engine/models/Cdn";
import MessageQueueModel from "@/engine/models/MessageQueue/MessageQueue";
import PubSubModel from "@/engine/models/PubSub/PubSubModel";

export type ComponentType =
  | "client"
  | "api-gateway"
  | "load-balancer"
  | "server"
  | "redis"
  | "postgres"
  | "storage"
  | "dns"
  | "cdn"
  | "message-queue"
  | "pubsub";

export function shouldKeepSimulationFrame(hideResponse: boolean, frame: any) {
  if (!hideResponse) return true;
  return !(
    frame.action?.includes("SEND_RESPONSE") ||
    frame.action?.includes("RETURN_DATA") ||
    frame.action?.includes("CACHE_HIT") ||
    frame.action?.includes("CACHE_MISS") ||
    frame.action === "RESPONSE_BACKTRACK"
  );
}

export interface CompileSimulationOptions {
  activeNodes: Node[];
  activeEdges: Edge[];
  activeConfigs: Record<string, any>;
  targetClientId?: string;
  isParallel?: boolean;
  hideResponse?: boolean;
}

export interface CompileSimulationResult {
  clientId: string;
  rawSimulationFrames: Array<{ runIndex: number; frames: any[] }>;
  simulationFrames: any[];
  frameGroups: Array<{ timestamp: number; frames: any[] }>;
}

export function compileSimulationPipeline(
  options: CompileSimulationOptions,
): CompileSimulationResult {
  const {
    activeNodes,
    activeEdges,
    activeConfigs,
    targetClientId,
    isParallel = false,
    hideResponse = false,
  } = options;

  // 1. Identify Client node
  const clientNodes = activeNodes.filter((n) => n.data?.type === "client");
  if (clientNodes.length === 0) {
    throw new Error("Canvas has no Client node. Add a Client node to simulate traffic.");
  }

  const clientToRun = targetClientId
    ? clientNodes.find((n) => n.id === targetClientId) || clientNodes[0]
    : clientNodes[0];

  const clientId = clientToRun.id;
  const clientLabelStr = (clientToRun.data?.label as string) || "";
  const clientConfig = activeConfigs[clientId] || {};

  // 2. Initialize simulation engine graph and registry
  const graph = new GraphManager("dynamic-graph");
  const registry = new NodeRegistry("dynamic-registry");
  const ipv4Instance = new Ipv4Generator();
  const rrStrategy = new RoundRobinStrategy();

  // 3. Register all nodes into graph & registry
  activeNodes.forEach((n) => {
    const type = n.data?.type as ComponentType;
    const labelStr = (n.data?.label as string) || n.id;
    const config = activeConfigs[n.id] || {};

    let modelInstance: any = null;

    switch (type) {
      case "client":
        modelInstance = new ClientModel(n.id, labelStr);
        break;

      case "load-balancer": {
        let strategy: any = rrStrategy;
        if (config.strategy === "RANDOM") {
          strategy = new RandomLoadStrategy(n.id, labelStr);
        } else if (config.strategy === "IP_HASH") {
          strategy = new IPHashStrategy(n.id, labelStr);
        }
        modelInstance = new LoadBalancerModel(n.id, labelStr, strategy);
        break;
      }

      case "server": {
        modelInstance = new ServerModel(n.id, labelStr);
        if (typeof config.capacity === "number") {
          modelInstance.capacity = config.capacity;
        }
        if (typeof config.prefetchLimit === "number") {
          modelInstance.prefetchLimit = config.prefetchLimit;
        }
        if (config.endpoints && typeof config.endpoints === "object") {
          modelInstance.endpoints = { ...config.endpoints };
        } else {
          modelInstance.endpoints = {
            "/api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "/api/v1/users": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "/api/v1/getData": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          };
        }
        if (config.endpointPipelines && typeof config.endpointPipelines === "object") {
          modelInstance.endpointPipelines = { ...config.endpointPipelines };
        }
        break;
      }

      case "redis": {
        modelInstance = new RedisModel(n.id, labelStr);
        if (Array.isArray(config.data)) {
          config.data.forEach((item: any) => {
            const val = item.value ?? item.val ?? "cached data";
            if (item.key) modelInstance.addData(item.key, val);
          });
        }
        break;
      }

      case "postgres": {
        modelInstance = new PostgresModel(n.id, labelStr);
        if (Array.isArray(config.data)) {
          config.data.forEach((item: any) => {
            const val = item.value ?? item.val ?? "record data";
            if (item.key) {
              modelInstance.addRecord(config.table || "users", item.key, val);
            }
          });
        }
        break;
      }

      case "api-gateway": {
        modelInstance = new ApiGatewayModel(n.id, labelStr);
        modelInstance.strategy = config.strategy || "ROUND_ROBIN";
        if (config.routes) {
          modelInstance.setRoutes(config.routes);
        }

        const connectedTargets = activeEdges
          .filter((e) => {
            if (e.source === n.id) {
              const tgt = activeNodes.find((node) => node.id === e.target);
              return tgt?.data?.type === "server" || tgt?.data?.type === "load-balancer";
            }
            if (e.target === n.id) {
              const src = activeNodes.find((node) => node.id === e.source);
              return src?.data?.type === "server" || src?.data?.type === "load-balancer";
            }
            return false;
          })
          .map((e) => (e.source === n.id ? e.target : e.source));

        const serviceMapping = config.serviceMapping || {};
        const serviceGroups: Record<string, string[]> = {};
        const routesList = config.routes || {};
        const serviceOptions = Array.from(new Set(Object.values(routesList)));

        connectedTargets.forEach((targetId) => {
          const targetNode = activeNodes.find((node) => node.id === targetId);
          const targetLabel = String(targetNode?.data?.label || targetId);
          let serviceName = serviceMapping[targetId];

          if (!serviceName) {
            const routeTargets = Object.values(routesList).map(String);
            if (routeTargets.includes(targetId)) {
              serviceName = targetId;
            } else {
              const labelLower = targetLabel.toLowerCase();
              if (labelLower.includes("user")) serviceName = "USER_SERVICE";
              else if (labelLower.includes("post")) serviceName = "POST_SERVICE";
              else serviceName = serviceOptions[0] !== undefined ? String(serviceOptions[0]) : targetId;
            }
          }

          if (serviceName !== "UNASSIGNED") {
            if (!serviceGroups[serviceName]) serviceGroups[serviceName] = [];
            if (!serviceGroups[serviceName].includes(targetId)) serviceGroups[serviceName].push(targetId);
          }
        });

        Object.values(routesList).forEach((targetName: any) => {
          const targetStr = String(targetName);
          if (!serviceGroups[targetStr]) {
            const isTarget = activeNodes.some(
              (node) => node.id === targetStr && (node.data?.type === "server" || node.data?.type === "load-balancer"),
            );
            if (isTarget) serviceGroups[targetStr] = [targetStr];
          }
        });

        for (const serviceName in serviceGroups) {
          modelInstance.setServiceNodes(serviceName, serviceGroups[serviceName]);
        }
        break;
      }

      case "storage": {
        modelInstance = new StorageModel(n.id, labelStr);
        if (Array.isArray(config.buckets)) {
          config.buckets.forEach((b: string) => modelInstance.addBucket(b));
        }
        break;
      }

      case "dns": {
        modelInstance = new DnsModel(n.id, labelStr);
        if (config.domains) {
          Object.entries(config.domains).forEach(([domain, subdomains]: [string, any]) => {
            modelInstance.addDomain(domain);
            if (subdomains && typeof subdomains === "object") {
              Object.entries(subdomains).forEach(([sub, subData]: [string, any]) => {
                if (subData && typeof subData === "object") {
                  modelInstance.addSubDomain(
                    domain,
                    sub,
                    subData.to || "",
                    subData.ip || "",
                    subData.typeOfRecord || "A",
                  );
                }
              });
            }
          });
        }
        break;
      }

      case "cdn": {
        modelInstance = new CdnModel(n.id, labelStr);
        if (config.originId) modelInstance.setOriginId(config.originId);
        if (Array.isArray(config.cache)) {
          config.cache.forEach((item: string) => modelInstance.cacheData(item));
        }
        break;
      }

      case "message-queue": {
        modelInstance = new MessageQueueModel(
          n.id,
          labelStr,
          config.processingType || "FIFO",
          typeof config.queueSize === "number" ? config.queueSize : 10,
          config.overflowBehavior || "REJECT",
        );
        break;
      }

      case "pubsub": {
        modelInstance = new PubSubModel(n.id, labelStr);
        break;
      }
    }

    if (modelInstance) {
      graph.addNode(n.id, labelStr);
      registry.register(n.id, modelInstance);
    }
  });

  // 4. Wire Server TCP Connection Pools, Message Queues & PubSub
  activeNodes.forEach((n) => {
    if (n.data?.type === "server") {
      const serverInstance = registry.getInstance(n.id) as ServerModel;
      const config = activeConfigs[n.id] || {};
      const tcpConns = typeof config.tcpConnections === "number" ? config.tcpConnections : 10;

      // Postgres connection pools
      activeEdges
        .filter((e) => (e.source === n.id && activeNodes.find((node) => node.id === e.target)?.data?.type === "postgres") ||
                       (e.target === n.id && activeNodes.find((node) => node.id === e.source)?.data?.type === "postgres"))
        .forEach((edge) => {
          const pgId = edge.source === n.id ? edge.target : edge.source;
          const pgInst = registry.getInstance(pgId) as PostgresModel;
          if (pgInst && serverInstance) {
            serverInstance.addPostgresConnectionPool(tcpConns, pgInst);
          }
        });

      // Message Queue producers / consumers
      activeEdges
        .filter((e) => (e.source === n.id && activeNodes.find((node) => node.id === e.target)?.data?.type === "message-queue") ||
                       (e.target === n.id && activeNodes.find((node) => node.id === e.source)?.data?.type === "message-queue"))
        .forEach((edge) => {
          const isProducer = edge.source === n.id;
          const qId = isProducer ? edge.target : edge.source;
          const qNode = activeNodes.find((node) => node.id === qId);
          const qLabel = String(qNode?.data?.label || qId);
          if (isProducer) serverInstance.addQueueProducer(qId, qLabel);
          else serverInstance.addQueueConsumer(qId, qLabel);
        });

      // PubSub subscriptions
      activeEdges
        .filter((e) => (e.source === n.id && activeNodes.find((node) => node.id === e.target)?.data?.type === "pubsub") ||
                       (e.target === n.id && activeNodes.find((node) => node.id === e.source)?.data?.type === "pubsub"))
        .forEach((edge) => {
          const isProducer = edge.source === n.id;
          const pubSubId = isProducer ? edge.target : edge.source;
          if (!isProducer) {
            const pubSubInst = registry.getInstance(pubSubId) as PubSubModel;
            if (pubSubInst) {
              const subTopicsArray = config.registeredTopics || config.subscriptionTopics;
              if (Array.isArray(subTopicsArray)) {
                subTopicsArray.forEach((t: string) => {
                  if (t?.trim()) pubSubInst.subscribe(t.trim(), n.id);
                });
              } else {
                const subStr = (config.registeredTopics as string) || (config.subscriptionTopic as string) || "order.created";
                subStr.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => pubSubInst.subscribe(t, n.id));
              }
            }
          }
        });
    }
  });

  // 5. Register edges in Graph
  activeEdges.forEach((edge) => {
    const srcNode = activeNodes.find((n) => n.id === edge.source);
    const tgtNode = activeNodes.find((n) => n.id === edge.target);
    if (srcNode && tgtNode) {
      graph.addEdge(edge.source, edge.target);
      if (srcNode.data?.type === "server" && tgtNode.data?.type === "api-gateway") {
        graph.addEdge(edge.target, edge.source);
      }
    }
  });

  const configuredRequests =
    Array.isArray(clientConfig.requests) && clientConfig.requests.length > 0
      ? clientConfig.requests
      : [
          {
            endpoint: clientConfig.endpoint || "/api/v1/posts",
            method: clientConfig.method || "GET",
            lookupKey: clientConfig.lookupKey || "rohan",
            fileName: clientConfig.fileName || "file.png",
            isThereFileToUpload: clientConfig.isThereFileToUpload !== false,
          },
        ];

  const clientRequests = configuredRequests;

  // Clear connection intervals/active states
  activeNodes.forEach((n) => {
    if (n.data?.type === "postgres") {
      const pg = registry.getInstance(n.id) as PostgresModel;
      if (pg) {
        pg.activeConnections.clear();
        pg.connectionIntervals = [];
      }
    }
    if (n.data?.type === "server") {
      const server = registry.getInstance(n.id) as ServerModel;
      if (server) {
        server.activeQueueMessages = 0;
        server.queueProcessingIntervals = [];
      }
    }
  });

  // 7. Run SimulationManager for each request
  const allRuns: Array<{ runIndex: number; frames: any[] }> = [];

  for (let i = 0; i < clientRequests.length; i++) {
    const sourceIp = ipv4Instance.getRandomIpv4();
    const reqItem = clientRequests[i];

    let parsedBody = {};
    if (typeof reqItem.body === "string" && reqItem.body.trim().length > 0) {
      try {
        parsedBody = JSON.parse(reqItem.body);
      } catch (err) {
        console.error("Failed to parse request body JSON:", err);
      }
    }

    const payload: any = {
      valetKeyFlow: clientConfig.valetKeyFlow,
      lookupKey: reqItem.lookupKey,
      fileName: reqItem.fileName,
      isThereFileToUpload: reqItem.isThereFileToUpload,
      endpoint: reqItem.endpoint || "/api/v1/posts",
      method: reqItem.method || "GET",
      targetBucket: reqItem.targetBucket,
      parallelResponse: isParallel,
      ...parsedBody,
    };

    const simulation = new SimulationManager(graph, registry, payload, sourceIp);
    simulation.runSimulation(clientId);

    const runFrames = (simulation.getFrames() as any[]).map((frame) => ({
      ...frame,
      sourceIp,
      payloadSummary: frame.payloadSummary || `lookupKey=${reqItem.lookupKey}`,
    }));

    allRuns.push({
      runIndex: i,
      frames: runFrames,
    });
  }

  // 8. Apply Timing & Merge (PriorityQueue for parallel, offset sort for sequential)
  let globalTimestampOffset = 0;
  const flatFrames: any[] = [];

  allRuns.forEach((run) => {
    const runFrames = run.frames.map((frame: any) => ({
      ...frame,
      timestamp: isParallel ? frame.timestamp : frame.timestamp + globalTimestampOffset,
    }));

    flatFrames.push(...runFrames);

    if (!isParallel) {
      const maxTime = run.frames.length > 0
        ? Math.max(...run.frames.map((f: any) => f.timestamp))
        : -1;
      globalTimestampOffset += maxTime + 1;
    }
  });

  const framesToRender = isParallel
    ? (() => {
        const pq = new PriorityQueue();
        pq.pushMultipleIntoQueue(flatFrames);
        const merged: any[] = [];
        while (!pq.isEmpty()) {
          const item = pq.popMinTimeStampItem();
          if (item) merged.push(item);
        }
        return merged;
      })()
    : flatFrames.sort((a, b) => a.timestamp - b.timestamp);

  // 9. Filter with shouldKeepSimulationFrame
  const filteredFrames = framesToRender.filter((frame) =>
    shouldKeepSimulationFrame(hideResponse, frame),
  );

  // 10. Group by timestamp
  const grouped = new Map<number, any[]>();
  for (const frame of filteredFrames) {
    const list = grouped.get(frame.timestamp) ?? [];
    list.push(frame);
    grouped.set(frame.timestamp, list);
  }

  const frameGroups = Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, frames]) => ({ timestamp, frames }));

  return {
    clientId,
    rawSimulationFrames: allRuns,
    simulationFrames: filteredFrames,
    frameGroups,
  };
}
