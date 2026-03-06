import type { NodeId, RequestPath } from "../types";
import { NodeInstance } from "../contracts";

class RequestManager implements NodeInstance {
  id: string;
  name: string;
  currentNodeId: NodeId;
  path: any[] = [];
  direction: "forward" | "backward" = "forward";
  type: string = "REQUEST";

  constructor(id: string, name: string, startNodeId: NodeId) {
    this.id = id;
    this.name = name;
    this.currentNodeId = startNodeId;
  }

  //move to the next node
  moveTo(nodeId: NodeId) {
    this.currentNodeId = nodeId;
  }

  // go back to the previous node
  goBack() {
    this.currentNodeId = this.path.pop()!;
  }
}

export { RequestManager };
