import type { NodeId } from "../types";
import { NodeInstance } from "../contracts";

class RequestManager implements NodeInstance {
  id: string;
  name: string;
  currentNodeId: NodeId;
  path: any[] = [];
  direction: "forward" | "backward" = "forward";
  type: string = "REQUEST";
  data: { [key: string]: { [key: string]: any } } = {};

  constructor(
    id: string,
    name: string,
    startNodeId: NodeId,
    data: { [key: string]: { [key: string]: any } } = {},
  ) {
    this.id = id;
    this.name = name;
    this.currentNodeId = startNodeId;
    this.data = data;
  }

  //move to the next node
  moveTo(nodeId: NodeId) {
    this.currentNodeId = nodeId;
  }

  // go back to the previous node
  goBack() {
    this.currentNodeId = this.path.pop()!;
  }

  getRequestData() {
    return this.data;
  }

  getSpecificDataForKey(key: string) {
    return this.data[key] ?? null;
  }
}

export { RequestManager };
