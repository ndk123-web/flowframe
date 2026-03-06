type NodeId = string;

type RequestPath = {
  id: string;
  from: NodeId;
  from_name: string;
  to: NodeId;
  to_name: string;
  currentNode: string;
};

type FrameObject = {
  requestId: string;
  requestName: string;
  from: string;
  to: string;
  timestamp: number;
};

type Frame = {
  requestId: string;
  from: string;
  to: string;
  timestamp: number;
};

export type { NodeId, RequestPath, FrameObject };
