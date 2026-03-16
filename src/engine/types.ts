import type { Edge, Node } from "@xyflow/react";

type NodeId = string;

type RequestPath = {
  id: string;
  from: NodeId;
  from_name: string;
  to: NodeId;
  to_name: string;
  currentNode: string;
};

// type FrameObject = {
//   requestId: string;
//   requestName: string;
//   from: string;
//   to: string;
//   timestamp: number;
//   action?: string;
//   lookupKey?: string;
//   redisKeysSnapshot?: string[];
// };

type Frame = {
  requestId: string;
  from: string;
  to: string;
  timestamp: number;
  action: string;
  type?: string;
};

type SimBundle = {
  frames: Frame[];
  nodes: Node[];
  edges: Edge[];
};

type Event = {
  requestId: string;
  from: string;
  to: string;
  timestamp: number;
  action: string;
  type?: string;
};

export type { NodeId, RequestPath, Frame, SimBundle, Event };
