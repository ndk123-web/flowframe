import type { NodeId } from "@/engine/types";

class GraphManager {
  id: string;
  Nodes: Map<NodeId, string>; // id -> name
  Edges: Map<NodeId, any[]>; // id -> [instanceOfNode1, instanceOfNode2]

  // Overview:
  // 1. Nodes: NodeId -> string(name)
  // 2. Edges: NodeId -> NodeId[]
  // 3. NodeRegistry: NodeId -> NodeInstance
  constructor(id: string) {
    this.id = id;
    this.Nodes = new Map<NodeId, string>();
    this.Edges = new Map<NodeId, NodeId[]>();
  }

  addNode(id: NodeId, name: string) {
    this.Nodes.set(id, name);
  }

  addEdge(from: NodeId, to: NodeId) {
    const neighbours = this.Edges.get(from);

    if (neighbours) {
      neighbours.push(to);
    } else {
      this.Edges.set(from, [to]);
    }
  }

  getNextNodes(from: NodeId) {
    return this.Edges.get(from) || [];
  }

  // get all Map details
  getDetails() {
    return {
      // it converts Map to json object
      Nodes: Object.fromEntries(this.Nodes),
      Edges: Object.fromEntries(this.Edges),
    };
  }
}

export { GraphManager };
