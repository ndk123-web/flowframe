import type { NodeInstance } from "../contracts";
import { RequestManager } from "./Request";

type HTTP_VALID_METHODS = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

class ServerModel implements NodeInstance {
  id: string;
  name: string;
  load: number = 0;
  capacity: number = 100;
  type: string = "SERVER";

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
}

export default ServerModel;
