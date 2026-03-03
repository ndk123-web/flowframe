import type { GraphNode } from "../../types";

class GraphManager {
  id: string;

  // here -1 represents the root
  Nodes: Map<GraphNode, GraphNode[]> = new Map([
    [{ id: "-1", name: "root" }, []],
  ]);

  constructor(id: string) {
    this.id = id;
  }

  // add into the graph
  addIntoGraph(from: any, to: any) {
    this.Nodes.set(from, to);
    return 1;
  }

  // get all the neighbouts for servers
  getAllNextNodeFromGraph(from: GraphNode): GraphNode[] {
    if (this.Nodes.has(from)) {
      return [{ id: "-1", name: "nothing" }];
    }

    return this.Nodes.get(from) || [];
  }

  // get first one because sometimes we only need first
  getNextImmediateNodeFromGraph(from: GraphNode): GraphNode {
    if (this.Nodes.has(from)) {
      return { id: "-1", name: "nothing" };
    }

    const arr = this.Nodes.get(from);
    return arr ? arr[0] : { id: "-1", name: "nothing" };
  }
}

export { GraphManager };
