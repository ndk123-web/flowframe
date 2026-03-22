import type { NodeId } from "../types";
import { NodeInstance } from "../contracts";
import Ipv4Generator from "@/utils/generateRandomIp";

class RequestManager implements NodeInstance {
  id: string;
  name: string;
  currentNodeId: NodeId;
  path: any[] = [];
  direction: "forward" | "backward" = "forward";
  type: string = "REQUEST";
  payload: { [key: string]: any } = {};
  task: string = "";
  context: { [key: string]: any } = {};
  ipAddress: string;
  endpoint: string = "";

  constructor(
    id: string,
    name: string,
    startNodeId: NodeId,
    payload: { [key: string]: any } = {},
    ipv4: string,
  ) {
    this.id = id;
    this.name = name;
    this.currentNodeId = startNodeId;
    this.payload = payload;
    this.ipAddress = ipv4;
  }

  //move to the next node
  moveTo(nodeId: NodeId) {
    this.currentNodeId = nodeId;
  }

  getPayload() {
    return this.payload;
  }
}

export { RequestManager };
