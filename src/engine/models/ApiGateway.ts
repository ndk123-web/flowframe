import type { NodeInstance } from "../contracts";
import { RequestManager } from "./Request";

/**
 * The Api Gateway node is responsible for:
 * 1. Receiving Incoming Requests
 * 2. Routing Requests to the appropriate services
 * 3. Rate Limiting and Throttling
 * 4. Authentication And Authotization
 * 5. Request and Response Transformation
 * 6. Sometimes Caching Responses
 */
// Define the load balancing strategies that the API Gateway can use to route requests to services
type Strategy = "ROUND_ROBIN" | "LEAST_CONNECTIONS" | "IP_HASH" | "RANDOM";

/**
 * 1. routes will define mapping of endpoint to service name (eg: "/api/v1/users" -> "USER_SERVICE")
 * 2. services will define mapping of service name to array of nodeIds (eg: "USER_SERVICE" -> ["server1-node-id", "server2-node-id"])
 * 3. runGateway method will take incoming request, check endpoint and route it to appropriate service nodeId based on the strategy defined
 * 4. we can also set, clear, delete routes and services at runtime to allow dynamic routing based on different scenarios or conditions.
 * 5. For simplicity, we will implement only a few strategies (ROUND_ROBIN, IP_HASH, RANDOM, LEAST_CONNECTIONS) but in a real implementation, you could have many more strategies and even allow custom strategies to be defined.
 */
class ApiGatewayModel implements NodeInstance {
  id: string;
  name: string;
  type: string = "API_GATEWAY";
  strategy: Strategy = "ROUND_ROBIN"; // or "LEAST_CONNECTIONS", "IP_HASH", etc.
  // Keep one pointer per service so USER_SERVICE traffic does not affect POST_SERVICE RR.
  pointersByService: { [serviceName: string]: number } = {};
  /**
   * The Routes objects defines the mapping between incoming request path and the corresponding service nodeId
   */
  routes: { [key: string]: string } = {
    "/api/v1/posts": "POST_SERVICE",
  };

  services: { [key: string]: string[] } = {};

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * @returns nextNodeId of the service (server)
   */
  runGateway(request: RequestManager, registry?: any): string {
    const normalizePath = (p: string) => p.replace(/^\/+|\/+$/g, "");
    const reqEndpoint = normalizePath(request.endpoint || "");

    for (const route in this.routes) {
      const serviceName = this.routes[route];
      const normRoute = normalizePath(route);
      if (reqEndpoint.startsWith(normRoute) && this.services[serviceName]) {
        switch (this.strategy) {
          case "ROUND_ROBIN": {
            return this.roundRobinStrategy(serviceName, registry);
          }
          case "RANDOM": {
            return this.randomStrategy(serviceName, registry);
          }
          case "IP_HASH": {
            return this.iphashStrategy(request.ipAddress, serviceName, registry);
          }
          case "LEAST_CONNECTIONS": {
            return this.leastConnectionsStrategy(serviceName, registry);
          }
        }
      }
    }

    return "";
  }

  getHealthyServers(serviceName: string, registry?: any): string[] {
    const servers = this.services[serviceName] || [];
    if (!registry) {
      return servers;
    }
    return servers.filter((serverId) => {
      const inst = registry.getInstance(serverId);
      if (inst && (inst.type === "SERVER" || inst.type === "Server")) {
        const serverInst = inst as any;
        return typeof serverInst.canAccepthRequest === "function"
          ? serverInst.canAccepthRequest()
          : true;
      }
      return true;
    });
  }

  /**
   *
   * @param routes An object mapping route prefixes to service names. For example: { "/api/v1/users": "user-service-node-id" }
   * This method allows you to update the routing configuration of the API Gateway at runtime, enabling dynamic routing based on different scenarios or conditions.
   */
  setRoutes(routes: { [key: string]: string }) {
    this.routes = routes;
  }

  clearRoutes() {
    this.routes = {};
  }

  deleteSomeRoute(route: string) {
    delete this.routes[route];
  }

  /**
   *
   * @param serviceName it takes name of service
   * @returns nodeIds where it should be send
   */
  roundRobinStrategy(serviceName: string, registry?: any) {
    const servers = this.getHealthyServers(serviceName, registry);
    if (!servers || servers.length === 0) {
      throw new Error(`503 Service Unavailable: No healthy servers available for service ${serviceName}`);
    }

    const pointer = this.pointersByService[serviceName] ?? 0;
    const index = pointer % servers.length;
    const server = servers[index];
    this.pointersByService[serviceName] = (index + 1) % servers.length;
    return server;
  }

  iphashStrategy(clientIp: string, serviceName: string, registry?: any) {
    const servers = this.getHealthyServers(serviceName, registry);
    if (!servers || servers.length === 0) {
      throw new Error(`503 Service Unavailable: No healthy servers available for service ${serviceName}`);
    }

    const hash = this.hashIp(clientIp);
    const serverIndex = hash % servers.length;
    return servers[serverIndex];
  }

  randomStrategy(serviceName: string, registry?: any) {
    const servers = this.getHealthyServers(serviceName, registry);

    if (!servers || servers.length === 0) {
      throw new Error(`503 Service Unavailable: No healthy servers available for service ${serviceName}`);
    }
    const randomIndex = Math.floor(Math.random() * servers.length);
    return servers[randomIndex];
  }

  leastConnectionsStrategy(serviceName: string, registry?: any) {
    const servers = this.getHealthyServers(serviceName, registry);

    if (!servers || servers.length === 0) {
      throw new Error(`503 Service Unavailable: No healthy servers available for service ${serviceName}`);
    }

    return servers[0];
  }

  hashIp(ip: string): number {
    return ip.split(".").reduce((acc, octet) => acc + parseInt(octet), 0);
  }

  /**
   *
   * @param serviceName take name of service
   * @param nodeIds take array of nodeid and store it
   */
  setServiceNodes(serviceName: string, nodeIds: string[]) {
    this.services[serviceName] = nodeIds;
    // Reset service pointer when backend pool changes.
    this.pointersByService[serviceName] = 0;
  }

  deleteService(serviceName: string) {
    delete this.services[serviceName];
    delete this.pointersByService[serviceName];
  }

  clearServices() {
    this.services = {};
    this.pointersByService = {};
  }
}

export default ApiGatewayModel;
