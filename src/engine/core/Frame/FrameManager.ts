import { equal } from "assert";
import type { NodeId } from "../../types";
import { RequestManager } from "../../models/Request";

class FrameTracking {
  id: string;
  requestId: string;
  fromId: NodeId;
  toId: NodeId = "";
  request: RequestManager;

  constructor(id: string, request: RequestManager, startNodeId: NodeId) {
    this.id = id;
    this.request = request;
    this.requestId = this.request.id;
    this.fromId = startNodeId;
  }
}

export default FrameTracking;
