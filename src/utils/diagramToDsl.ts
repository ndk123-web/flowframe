import type { Node, Edge } from "@xyflow/react";

/**
 * Converts live ReactFlow canvas nodes, edges, and nodeConfigs
 * into a clean, canonical FlowFrame Architecture DSL (.flow) script.
 */
export function diagramToDsl(
  nodes: Node[],
  edges: Edge[],
  nodeConfigs: Record<string, any> = {}
): string {
  if (!nodes || nodes.length === 0) {
    return "// FlowFrame Architecture DSL\n// Canvas is empty\n";
  }

  const lines: string[] = [
    "// FlowFrame Architecture DSL Script",
    "// Auto-generated from current live canvas topology",
    "",
  ];

  // Helper to normalize node type to DSL keyword
  const normalizeDslType = (rawType?: string): string => {
    switch (rawType?.toLowerCase()) {
      case "client":
        return "CLIENT";
      case "server":
        return "SERVER";
      case "load-balancer":
      case "loadbalancer":
        return "LOADBALANCER";
      case "api-gateway":
      case "apigateway":
      case "gateway":
        return "GATEWAY";
      case "redis":
        return "REDIS";
      case "postgres":
      case "postgresql":
        return "POSTGRES";
      case "pubsub":
        return "PUBSUB";
      case "message-queue":
      case "messagequeue":
      case "queue":
        return "MESSAGEQUEUE";
      default:
        return "SERVER";
    }
  };

  // 1. Emit Node Definitions
  for (const node of nodes) {
    const rawType = (node.data?.type as string) || node.type || "server";
    const dslType = normalizeDslType(rawType);
    const id = node.id;
    const label = (node.data?.label as string) || id;
    const x = Math.round(node.position.x);
    const y = Math.round(node.position.y);
    const cfg = nodeConfigs[id] || {};

    lines.push(`define ${dslType} ${id} {`);
    lines.push(`  x: ${x},`);
    lines.push(`  y: ${y},`);
    lines.push(`  label: ${JSON.stringify(label)},`);

    // Type-specific configs
    switch (dslType) {
      case "CLIENT":
        if (cfg.valet !== undefined) {
          lines.push(`  valet: ${Boolean(cfg.valet)},`);
        }
        if (Array.isArray(cfg.requests) && cfg.requests.length > 0) {
          lines.push(`  requests: ${JSON.stringify(cfg.requests, null, 4).replace(/\n/g, "\n  ")},`);
        }
        break;

      case "SERVER":
        if (cfg.capacity !== undefined) {
          lines.push(`  capacity: ${Number(cfg.capacity)},`);
        }
        if (cfg.tcpConnections !== undefined || cfg.tcpConnectionsToPostgres !== undefined) {
          lines.push(`  tcpConnectionsToPostgres: ${Number(cfg.tcpConnections || cfg.tcpConnectionsToPostgres || 10)},`);
        }
        if (cfg.prefetchLimit !== undefined) {
          lines.push(`  prefetchLimit: ${Number(cfg.prefetchLimit)},`);
        }
        if (Array.isArray(cfg.endpoints) && cfg.endpoints.length > 0) {
          lines.push(`  endpoints: ${JSON.stringify(cfg.endpoints, null, 4).replace(/\n/g, "\n  ")},`);
        }
        break;

      case "LOADBALANCER":
        lines.push(`  strategy: ${JSON.stringify(cfg.strategy || "ROUND_ROBIN")},`);
        if (Array.isArray(cfg.routes) && cfg.routes.length > 0) {
          lines.push(`  routes: ${JSON.stringify(cfg.routes, null, 4).replace(/\n/g, "\n  ")},`);
        }
        break;

      case "GATEWAY":
        lines.push(`  strategy: ${JSON.stringify(cfg.strategy || "ROUND_ROBIN")},`);
        if (Array.isArray(cfg.routes) && cfg.routes.length > 0) {
          lines.push(`  routes: ${JSON.stringify(cfg.routes, null, 4).replace(/\n/g, "\n  ")},`);
        }
        break;

      case "REDIS":
        lines.push(`  ttl: ${Number(cfg.ttl || 300)},`);
        if (Array.isArray(cfg.data) && cfg.data.length > 0) {
          lines.push(`  data: ${JSON.stringify(cfg.data, null, 4).replace(/\n/g, "\n  ")},`);
        }
        break;

      case "POSTGRES":
        lines.push(`  table: ${JSON.stringify(cfg.table || "users")},`);
        if (Array.isArray(cfg.data) && cfg.data.length > 0) {
          lines.push(`  data: ${JSON.stringify(cfg.data, null, 4).replace(/\n/g, "\n  ")},`);
        }
        break;

      case "MESSAGEQUEUE":
        lines.push(`  queueSize: ${Number(cfg.queueSize || 100)},`);
        lines.push(`  processingType: ${JSON.stringify(cfg.processingType || "FIFO")},`);
        break;

      case "PUBSUB":
        lines.push(`  topic: ${JSON.stringify(cfg.topic || "events")},`);
        break;
    }

    lines.push("}");
    lines.push("");
  }

  // 2. Emit Connections
  if (edges && edges.length > 0) {
    lines.push("// Connections between components");
    for (const edge of edges) {
      if (edge.source && edge.target) {
        lines.push(`connect ${edge.source} -> ${edge.target}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
