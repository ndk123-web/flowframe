import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { NodeId } from "@/engine/types";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import ShortUniqueId from "short-unique-id";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import type { LoadBalancingConfig } from "@/engine/core/Strategy/LoadBalancingConfig";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import { RequestManager } from "@/engine/models/Request";

// it simply means 1 LoadBalancer and 2 Servers
class Test {
  count: number;

  constructor(count: number) {
    this.count = count || 1;
  }

  async Test1LB2S(): Promise<{ graph: any; registry: any }> {
    const uid = new ShortUniqueId();
    const graph = new GraphManager(uid.rnd(10));
    const registry = new NodeRegistry(uid.rnd(10));
    const simulation = new SimulationManager(graph, registry);

    const requestId = uid.rnd(10);

    // strategy default RoundRobin
    const strategy: LoadBalancingConfig = new RoundRobinStrategy();

    // 1 LoadBalancer
    const load_balancer_id = uid.rnd(10);
    const load_balancer_name = `LoadBalancer_${this.count++}`;
    const loadBalancer_1_instance = new LoadBalancerModel(
      load_balancer_id,
      load_balancer_name,
      strategy,
    );

    // 2 Server
    const server_1_id = uid.rnd(10);
    const server_1_name = `Server_${this.count++}`;
    const server_1_instance = new ServerModel(server_1_id, server_1_name);
    const server_2_id = uid.rnd(10);
    const server_2_name = `Server_${this.count++}`;
    const server_2_instance = new ServerModel(server_2_id, server_2_name);

    // 1 client
    const client_id = uid.rnd(10);
    const client_name = `Client_${this.count++}`;
    const client_instance = new ClientModel(client_id, client_name);

    // add Nodes to the graph
    graph.addNode(load_balancer_id, load_balancer_name);
    graph.addNode(server_1_id, server_1_name);
    graph.addNode(server_2_id, server_2_name);
    graph.addNode(client_id, client_name);

    // now add edges
    graph.addEdge(load_balancer_id, server_1_id);
    graph.addEdge(load_balancer_id, server_2_id);
    graph.addEdge(client_id, load_balancer_id);

    // add each nodeId -> instances
    registry.register(load_balancer_id, loadBalancer_1_instance);
    registry.register(server_1_id, server_1_instance);
    registry.register(server_2_id, server_2_instance);
    registry.register(client_id, client_instance);

    const request = new RequestManager(requestId, `Request_${requestId}`, client_id);

    return {
      graph: graph.getDetails(),
      registry: registry.getDetails(),
    };
  }
}

export default Test;
