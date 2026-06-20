import type { NodeInstance } from "../contracts";
import PostgresModel from "./Postgres";
import { RequestManager } from "./Request";

type HTTP_VALID_METHODS = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

class ServerModel implements NodeInstance {
  id: string;
  name: string;
  load: number = 0;
  capacity: number = 100;
  type: string = "SERVER";

  /**
   * Number of TCP connections this server has opened to Postgres.
   * Each server maintains a persistent connection pool to Postgres (keep-alive TCP connections).
   * When this is 0, no pool limit is enforced (unlimited connections).
   */
  postgresConnectionPools: number = 0;

  // key is the endpoint, value is the array of valid HTTP methods for that endpoint
  endpoints: { [key: string]: HTTP_VALID_METHODS[] } = {
    // for default endpoint, all methods are valid
    "api/v1/getData": ["GET", "POST", "PUT", "DELETE", "PATCH"],
  };

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  // if load is less than capacity, return true
  canAccepthRequest() {
    return this.load < this.capacity;
  }

  // increament the load
  assignRequest(request: RequestManager) {
    this.load++;
  }

  // decreament the load
  completeRequest() {
    this.load--;
  }

  addEndPoint(endpoint: string, methods: HTTP_VALID_METHODS[]) {
    this.endpoints[endpoint] = methods;
  }

  removeEndPoint(endpoint: string) {
    delete this.endpoints[endpoint];
  }

  // check if the request is valid
  isValidRequest(request: RequestManager) {
    const endpoint = request.endpoint;
    const method = request.method;
    if (this.endpoints[endpoint]) {
      return this.endpoints[endpoint].includes(method);
    }
    return false;
  }

  /**
   * Register a Postgres connection pool for this server.
   * Records how many TCP connections this server has opened to the given Postgres instance.
   * This is called during scenario setup to wire the pool sizes.
   *
   * @param tcpConnections - Number of TCP connections in the pool (e.g. 5, 10, 20)
   * @param postgresModel  - The Postgres instance this server is connecting to
   */
  addPostgresConnectionPool(
    tcpConnections: number,
    postgresModel: PostgresModel,
  ) {
    this.postgresConnectionPools = tcpConnections;
    postgresModel.connectionPools.set(this.id, tcpConnections);
  }

  // remove all tcpConnections
  removePostgresConnectionPool(postgresModel: PostgresModel) {
    this.postgresConnectionPools = 0;
    postgresModel.connectionPools.delete(this.id);
    postgresModel.activeConnections.delete(this.id);
  }

  /**
   * Returns true if this server has a limited connection pool configured for Postgres.
   * Used by the simulation to determine if pool-exhaustion logic should be applied.
   */
  hasLimitedPostgresPool(): boolean {
    return this.postgresConnectionPools > 0;
  }
}

export default ServerModel;
