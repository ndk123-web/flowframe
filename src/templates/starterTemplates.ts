import React from "react";
import {
  FiSliders,
  FiDatabase,
  FiLayers,
  FiCpu,
  FiBox,
  FiZap,
} from "react-icons/fi";
import { ALL_SCENARIOS } from "@/scenarios/all";

export interface StarterTemplateDefinition {
  id: string;
  title: string;
  category:
    | "Traffic Routing"
    | "Data Caching"
    | "Microservices"
    | "Asynchronous"
    | "Storage Offload"
    | "Pub/Sub Fan-Out";
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  nodeCount: number;
  components: string[];
}

export const STARTER_TEMPLATES: StarterTemplateDefinition[] = [
  {
    id: "simple-load-balancer",
    title: "Simple Load Balancer",
    category: "Traffic Routing",
    desc: "Round-robin L7 traffic distribution across 3 backend application servers.",
    icon: FiSliders,
    nodeCount: 5,
    components: ["Client", "Load Balancer", "Server 1", "Server 2", "Server 3"],
  },
  {
    id: "simple-cache",
    title: "Cache-Aside Pattern",
    category: "Data Caching",
    desc: "Redis in-memory caching with PostgreSQL fallback and automatic backfilling.",
    icon: FiDatabase,
    nodeCount: 4,
    components: ["Client", "API Server", "Redis Cache", "PostgreSQL DB"],
  },
  {
    id: "simple-api-gateway",
    title: "API Gateway Routing",
    category: "Microservices",
    desc: "Unified entry point routing /posts and /users to isolated microservices.",
    icon: FiLayers,
    nodeCount: 7,
    components: ["Client", "API Gateway", "Posts Server", "Users Server"],
  },
  {
    id: "simple-message-queue",
    title: "Message Queue Pipeline",
    category: "Asynchronous",
    desc: "FIFO queue buffer leveling traffic spikes across competing worker pools.",
    icon: FiCpu,
    nodeCount: 6,
    components: ["Client", "Producer", "Message Queue", "Worker Consumer"],
  },
  {
    id: "simple-valet-key",
    title: "Valet Key Direct Upload",
    category: "Storage Offload",
    desc: "Pre-signed token negotiation for direct client-to-storage binary streaming.",
    icon: FiBox,
    nodeCount: 3,
    components: ["Client", "Upload Server", "Cloud Storage"],
  },
  {
    id: "event-driven",
    title: "Event-Driven Pub/Sub",
    category: "Pub/Sub Fan-Out",
    desc: "Topic-based pub/sub broker broadcasting parallel message dispatches.",
    icon: FiZap,
    nodeCount: 5,
    components: ["Publisher", "PubSub Broker", "Email Worker", "Analytics Worker"],
  },
];

/**
 * Infer the component type from node data, id, or label.
 */
export function inferNodeType(node: any): string {
  if (node.data?.type && node.data.type !== "default") {
    return node.data.type;
  }
  const id = (node.id || "").toLowerCase();
  const label = (node.data?.label || "").toLowerCase();

  if (id.includes("client") || label.includes("client") || label.includes("browser") || label.includes("user")) {
    return "client";
  }
  if (id.includes("api") || id.includes("gateway") || label.includes("gateway")) {
    return "api-gateway";
  }
  if (id.includes("lb") || label.includes("load balancer")) {
    return "load-balancer";
  }
  if (id.includes("redis") || id.includes("cache") || label.includes("redis") || label.includes("cache")) {
    return "redis";
  }
  if (
    id.includes("postgres") ||
    id.includes("sql") ||
    id.includes("db") ||
    id.includes("database") ||
    label.includes("postgres") ||
    label.includes("db") ||
    label.includes("database")
  ) {
    return "postgres";
  }
  if (id.includes("storage") || id.includes("s3") || id.includes("blob") || label.includes("storage")) {
    return "storage";
  }
  if (id.includes("pubsub") || id.includes("broker") || label.includes("pub/sub") || label.includes("broker")) {
    return "pubsub";
  }
  if (id.includes("queue") || label.includes("queue")) {
    return "message-queue";
  }
  if (id.includes("dns") || label.includes("dns")) {
    return "dns";
  }
  if (id.includes("cdn") || label.includes("cdn")) {
    return "cdn";
  }
  return "server";
}

/**
 * Generate sensible default configuration for a node based on its type and template context.
 */
export function createDefaultNodeConfig(
  type: string,
  id: string,
  label: string,
  templateId?: string
): Record<string, any> {
  switch (type) {
    case "client":
      if (templateId === "event-driven" || templateId === "pub-sub" || templateId === "simple-pub-sub") {
        return {
          endpoint: "/publish/event",
          method: "POST",
          body: JSON.stringify({ event: "order.created" }),
          requests: [
            {
              endpoint: "/publish/event",
              method: "POST",
              body: JSON.stringify({ event: "order.created" }),
            },
          ],
        };
      }
      if (templateId === "simple-valet-key" || templateId === "valet-key") {
        return {
          endpoint: "/upload",
          method: "POST",
          fileName: "avatar.png",
          valetKeyFlow: true,
          targetBucket: "media-uploads",
          requests: [
            {
              endpoint: "/upload",
              method: "POST",
              fileName: "avatar.png",
              valetKeyFlow: true,
              targetBucket: "media-uploads",
            },
          ],
        };
      }
      if (templateId === "simple-api-gateway" || templateId === "api-gateway") {
        return {
          endpoint: "/api/v1/posts/list",
          method: "GET",
          lookupKey: "bob",
          requests: [
            { endpoint: "/api/v1/posts/list", method: "GET", lookupKey: "bob" },
            { endpoint: "/api/v1/users/profile", method: "GET", lookupKey: "john" },
          ],
        };
      }
      return {
        endpoint: "/api/v1/posts",
        method: "GET",
        lookupKey: "rohan",
        valetKeyFlow: false,
        fileName: "file.png",
        isThereFileToUpload: false,
        targetBucket: "media-uploads",
        body: "",
        requests: [
          {
            endpoint: "/api/v1/posts",
            method: "GET",
            lookupKey: "rohan",
            fileName: "file.png",
            isThereFileToUpload: false,
            targetBucket: "media-uploads",
            body: "",
          },
        ],
      };

    case "api-gateway":
      return {
        strategy: "ROUND_ROBIN",
        routes: {
          "/api/v1/posts": "POST_SERVICE",
          "/api/v1/users": "USER_SERVICE",
        },
      };

    case "load-balancer":
      return {
        strategy: "ROUND_ROBIN",
      };

    case "server":
      return {
        capacity: 100,
        tcpConnections: 10,
        prefetchLimit: 1,
        endpoints: {
          "/api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          "/api/v1/users": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          "/api/v1/getData": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          "/publish/event": ["POST"],
        },
      };

    case "redis":
      return {
        data: [
          { key: "rohan", val: "cached data for rohan" },
          { key: "john", val: "cached data for john" },
          { key: "bob", val: "cached data for bob" },
        ],
      };

    case "postgres":
      return {
        table: "users",
        data: [
          { key: "doe", val: "db data for doe" },
          { key: "john", val: "db data for john" },
          { key: "rohan", val: "db data for rohan" },
        ],
      };

    case "storage":
      return {
        buckets: ["media-uploads"],
      };

    case "dns":
      return {
        domains: {
          "ndkdev.me": {
            www: { to: "", ip: "192.168.1.1", typeOfRecord: "A" },
          },
        },
      };

    case "cdn":
      return {
        originId: "",
        cache: [],
      };

    case "message-queue":
      return {
        processingType: "FIFO",
        queueSize: 10,
        overflowBehavior: "REJECT",
        connections: {},
      };

    case "pubsub":
      return {
        channels: {
          events: ["subscriber-1", "subscriber-2"],
          general: ["subscriber-1", "subscriber-2"],
        },
      };

    default:
      return {};
  }
}

/**
 * Retrieve genuine ReactFlow nodes and edges for a template ID.
 * Normalizes all nodes to type 'customNode', infers component types,
 * strips conflicting inline styles, and seeds full node configs.
 */
export function getTemplateArchitecture(templateId: string): {
  nodes: any[];
  edges: any[];
  configs: Record<string, any>;
} {
  const scenarioCreator = ALL_SCENARIOS.get(templateId);
  if (!scenarioCreator) {
    return { nodes: [], edges: [], configs: {} };
  }

  try {
    const bundle = scenarioCreator({
      hideResponse: false,
      parallelResponse: false,
      nodeConfigs: {},
    });

    const configs: Record<string, any> = {};

    // Normalize nodes: ensure customNode type, valid data.type, and seed configs
    const normalizedNodes = (bundle.nodes || []).map((node: any) => {
      const inferredType = inferNodeType(node);
      const label = (node.data?.label as string) || (inferredType.charAt(0).toUpperCase() + inferredType.slice(1));

      // Seed config for this node
      configs[node.id] = createDefaultNodeConfig(inferredType, node.id, label, templateId);

      return {
        id: node.id,
        type: "customNode", // CRITICAL: NEVER "default"
        position: node.position || { x: 100, y: 100 },
        sourcePosition: node.sourcePosition || "right",
        targetPosition: node.targetPosition || "left",
        data: {
          label,
          type: inferredType,
          isActive: false,
        },
        // Omit conflicting scenario inline styles so CustomNode renders cleanly
      };
    });

    // Clean edge packet animations for initial diagram state
    const cleanEdges = (bundle.edges || []).map((e: any) => ({
      ...e,
      data: {
        ...(e.data || {}),
        active: false,
      },
    }));

    return {
      nodes: normalizedNodes,
      edges: cleanEdges,
      configs,
    };
  } catch (err) {
    console.error(`Failed to generate architecture for template: ${templateId}`, err);
    return { nodes: [], edges: [], configs: {} };
  }
}
