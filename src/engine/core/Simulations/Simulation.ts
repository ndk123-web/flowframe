import { NodeId } from "../../types";
import { GraphManager } from "../Graph/graph";
import { RequestManager } from "../../models/Request";
import type { FrameObject } from "../../types";
import { NodeRegistry } from "../Graph/nodeResgistry";
import ShortUniqueId from "short-unique-id";

class SimulationManager {
  graph: GraphManager;
  from: NodeId;
  to: NodeId;
  frames: FrameObject[] = [];
  registry: NodeRegistry;
  uid: ShortUniqueId = new ShortUniqueId({ length: 10 });

  constructor(graph: GraphManager, registry: NodeRegistry) {
    this.graph = graph;
    this.registry = registry;
    this.from = "";
    this.to = "";
  }

  runSimulation(request: RequestManager) {
    // this.from = request.currentNodeId;
    // this.frames.push({
    //   requestId: request.id,
    //   requestName: request.name,
    //   nodeId: request.currentNodeId,
    // });
    // const next = this.graph.getNextNodes(request.currentNodeId);
    // request.path.push(request.currentNodeId);
    // request.currentNodeId = next[0];
  }

  step(request: RequestManager) {
    const current = request.currentNodeId;

    if (request.direction === "forward") {
      const nextNodes = this.graph.getNextNodes(current);

      // if no next nodes, switch direction
      if (nextNodes.length === 0) {
        request.direction = "backward";
        return;
      }

      let nextFirst = nextNodes[0];
      const instance = this.registry.getInstance(nextFirst);

      if (instance?.type === "LOAD_BALANCER") {
        // TODO: implement load balancing logic
      }

      this.frames.push({
        requestId: request.id,
        requestName: request.name,
        nodeId: nextFirst,
      });

      request.path.push(current);
      request.currentNodeId = nextFirst;
    }
  }

  runTest(startNode: NodeId) {
    const request_id = this.uid.rnd(10);
    const request_name = `Request_${request_id}`;
    const request = new RequestManager(request_id, request_name, startNode);
    this.registry.register(request_id, request);

    while (true) {
      const before = request.currentNodeId;

      this.step(request);

      // means we have reached the start node means there is something buggy
      if (request.path.length === 0 && request.direction === "backward") {
        break;
      }

      // if after step() currentNodeId and before are the same and direction is backward, it means we are stuck
      if (
        request.currentNodeId === before &&
        request.direction === "backward"
      ) {
        break;
      }
    }
  }
}

export { SimulationManager };
