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
  requestName?: string;
  from: string;
  to: string;
  timestamp: number;
  action: string;
  type?: string;
  sourceIp?: string;
  lookupKey?: string;
  redisKeysSnapshot?: string[];
  payloadSummary?: string;
};

type ScenarioRunOptions = {
  hideResponse: boolean;
  parallelResponse: boolean;
};

type SimDebug = {
  parallelResponse: boolean;
  testCasesForRedis?: string[];
  redisStore?: Record<string, string>;
  postgresStore?: Record<string, string>;
  requestInputs?: Array<{
    requestId?: string;
    sourceIp?: string;
    lookupKey?: string;
  }>;
};

type SimBundle = {
  frames: Frame[];
  nodes: Node[];
  edges: Edge[];
  debug?: SimDebug;
};

type Event = {
  requestId: string;
  requestName?: string;
  from: string;
  to: string;
  timestamp: number;
  action: string;
  type?: string;
  sourceIp?: string;
  lookupKey?: string;
  redisKeysSnapshot?: string[];
  payloadSummary?: string;
};

export type { NodeId, RequestPath, Frame, SimBundle, Event, ScenarioRunOptions, SimDebug };
