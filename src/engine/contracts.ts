import { NodeId } from "./types";

interface NodeInstance {
  type: string;
  id: string;
  name: string;
  // selectServer?: (serverIds: NodeId[]) => NodeId | null;
}

export type { NodeInstance };
