import { NodeId } from "../../types";
import { GraphManager } from "../Graph/graph";
import { RequestManager } from "../../models/Request";
import type { FrameObject } from "../../types";
import { NodeRegistry } from "../Graph/nodeResgistry";
import ShortUniqueId from "short-unique-id";
import { NodeInstance } from "@/engine/contracts";
import LoadBalancerModel from "@/engine/models/LoadBalancer";

class SimulationManager {
  graph: GraphManager;
  from: NodeId;
  to: NodeId;
  frames: FrameObject[] = [];
  registry: NodeRegistry;
  uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
  timestamp: number = 0;

  constructor(graph: GraphManager, registry: NodeRegistry) {
    this.graph = graph;
    this.registry = registry;
    this.from = "";
    this.to = "";
  }

  // the logic is:
  // we first compute all and store into the frameManager
  // now ui will fetch accordingly to the frame path
  step(request: RequestManager) {
    this.from = request.currentNodeId;

    if (request.direction === "forward") {
      // before check current node is LOAD BALANCER, then implement load balancing logic

      const currentNode: NodeInstance | null = this.registry.getInstance(
        this.from,
      );

      if (currentNode?.type === "LOAD_BALANCER") {
        // fetch all the servers

        const servers = this.graph.getNextNodes(this.from);
        if (servers.length <= 0) {
          // no servers available, switch direction
          request.direction = "backward";
          return;
        } else {
          // implement load balancing logic
          const selectedServer = (
            currentNode as LoadBalancerModel
          ).runLoadBalancer(servers);
          if (selectedServer === null || selectedServer === -1) {
            // no server available, switch direction
            request.direction = "backward";
            return;
          } else {
            this.frames.push({
              requestId: request.id,
              requestName: request.name,
              from: this.from,
              to: String(selectedServer), // convert to string for storage
              timestamp: ++this.timestamp,
            });
            // Update the current node to the selected server
            request.path.push(this.from);
            request.currentNodeId = String(selectedServer);
            return;
          }
        }
      }

      const nextNodes = this.graph.getNextNodes(this.from);

      // if no next nodes, switch direction
      if (nextNodes.length === 0) {
        request.direction = "backward";
        return;
      }

      let nextFirst = nextNodes[0];
      const instance = this.registry.getInstance(nextFirst);

      this.frames.push({
        requestId: request.id,
        requestName: request.name,
        from: this.from,
        to: nextFirst,
        timestamp: ++this.timestamp,
      });

      request.path.push(this.from);
      request.currentNodeId = nextFirst;
    }
  }

  runTest(startNode: NodeId) {
    const request_id = this.uid.rnd(10);
    const request_name = `Request_${request_id}`;
    const request = new RequestManager(request_id, request_name, startNode);

    // register the request in the registry
    this.registry.register(request_id, request);

    // run the simulation
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

  getFrames() {
    return this.frames;
  }
}

export { SimulationManager };
