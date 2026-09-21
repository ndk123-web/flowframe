import type { Node, Edge } from "@xyflow/react";

export interface PipelineValidationError {
  serverId: string;
  serverLabel: string;
  endpoint: string;
  targetId: string;
  type: "MISSING_NODE" | "DISCONNECTED_EDGE" | "INVALID_TARGET_TYPE";
  message: string;
}

export interface RouteValidationResult {
  isValid: boolean;
  errors: PipelineValidationError[];
}

/**
 * Pre-flight validation for dynamic endpoint pipelines.
 * Checks that every target defined in an acceptedEndpoint's pipeline/steps
 * actually exists in the canvas and has a directed edge from the server to the target.
 */
export function validateEndpointPipelines(
  nodes: Node[],
  edges: Edge[],
  nodeConfigs: Record<string, any>
): RouteValidationResult {
  const errors: PipelineValidationError[] = [];
  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));

  nodes.forEach((node) => {
    const type = (node.data?.type as string)?.toLowerCase();
    if (type !== "server") return;

    const config = nodeConfigs[node.id] || {};
    const pipelines: Record<string, string[]> = config.endpointPipelines || {};
    const serverLabel = (node.data?.label as string) || node.id;

    for (const [endpoint, steps] of Object.entries(pipelines)) {
      if (!Array.isArray(steps)) continue;

      for (const targetId of steps) {
        const targetNode = nodeMap.get(targetId);
        if (!targetNode) {
          errors.push({
            serverId: node.id,
            serverLabel,
            endpoint,
            targetId,
            type: "MISSING_NODE",
            message: `Server "${serverLabel}" endpoint "${endpoint}" references non-existent node "${targetId}".`,
          });
          continue;
        }

        // Check directed edge connectivity from server to target
        const isConnected = edges.some(
          (edge) => edge.source === node.id && edge.target === targetId
        );

        if (!isConnected) {
          errors.push({
            serverId: node.id,
            serverLabel,
            endpoint,
            targetId,
            type: "DISCONNECTED_EDGE",
            message: `Server "${serverLabel}" endpoint "${endpoint}" requires pipeline target "${targetId}", but no edge connects ${node.id} -> ${targetId}.`,
          });
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
