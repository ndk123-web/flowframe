import type { NodeInstance } from "../contracts";
import { RequestManager } from "../core/Request";

class ServerModel implements NodeInstance {
  id: string;
  name: string;
  load: number = 0;
  capacity: number = 100;
  type: string = "SERVER";

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
}

export default ServerModel;
