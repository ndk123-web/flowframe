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
  pointer: number = 0; // for any strategy that needs to keep track of the last used server (like round robin)

  /**
   * The Routes objects defines the mapping between incoming request path and the corresponding service nodeId
   */
  routes: { [key: string]: string } = {
    '/api/v1/posts': "POST_SERVICE",
  };

  services: { [key: string]: string[] } = {
  };

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * @returns nextNodeId of the service (server)
   */
  runGateway(request: RequestManager): string {
    const endpoint = request.endpoint;

    for (const route in this.routes) {
      const serviceName = this.routes[route];
      if (endpoint.startsWith(route) && this.services[serviceName]) {
        switch (this.strategy) {
          case "ROUND_ROBIN": {
            return this.roundRobinStrategy(serviceName);
          }
          case "RANDOM": {
            return this.randomStrategy(serviceName);
          }
          case "IP_HASH": {
            return this.iphashStrategy(request.ipAddress, serviceName);
          }
          case "LEAST_CONNECTIONS": {
            return this.leastConnectionsStrategy(serviceName);
          }
        }
      }
    }

    return "";
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
  roundRobinStrategy(serviceName: string) {
    const servers = this.services[serviceName];
    if (!servers || servers.length === 0) {
      throw new Error(`No servers available for service: ${serviceName}`);
    }

    const server = servers[this.pointer];
    this.pointer = (this.pointer + 1) % servers.length; // Move pointer to the next server
    return server;
  }

  iphashStrategy(clientIp: string, serviceName: string) {
    const servers = this.services[serviceName];
    if (!servers || servers.length === 0) {
      throw new Error(`No servers available for service: ${serviceName}`);
    }

    const hash = this.hashIp(clientIp);
    const serverIndex = hash % servers.length;
    return servers[serverIndex];
  }

  randomStrategy(serviceName: string) {
    const servers = this.services[serviceName];

    if (!servers || servers.length === 0) {
      throw new Error(`No servers available for service: ${serviceName}`);
    }
    const randomIndex = Math.floor(Math.random() * servers.length);
    return servers[randomIndex];
  }

  leastConnectionsStrategy(serviceName: string) {
    //
    const servers = this.services[serviceName];

    if (!servers || servers.length === 0) {
      throw new Error(`No servers available for service: ${serviceName}`);
    }

    // For simplicity, we will just return the first server in the list. In a real implementation, you would need to track the number of active connections to each server and return the one with the least connections.
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
  }

  deleteService(serviceName: string) {
    delete this.services[serviceName];
  }

  clearServices() {
    this.services = {};
  }
}

export default ApiGatewayModel;
