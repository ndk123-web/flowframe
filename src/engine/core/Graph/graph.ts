import type { NodeId } from "@/engine/types";
import { NodeRegistry } from "./nodeResgistry";

/**
 * GraphManager is responsible for managing the graph structure, including nodes and edges. It provides functionalities to add nodes and edges, detect cycles, and check the validity of the graph based on certain conditions. The graph is represented using adjacency lists, where each node maintains a list of its outgoing edges. The GraphManager also interacts with the NodeRegistry to access node details when needed.
 */
class GraphManager {
  id: string;
  Nodes: Map<NodeId, string>; // id -> name
  Edges: Map<NodeId, any[]>; // id -> [instanceOfNode1, instanceOfNode2]
  IncomingEdges: Map<NodeId, any[]>; // id -> [instanceOfNode1, instanceOfNode2]
  OutgoingEdges: Map<NodeId, any[]>; // id -> [instanceOfNode1, instanceOfNode2]

  // Overview:
  // 1. Nodes: NodeId -> string(name)
  // 2. Edges: NodeId -> NodeId[]
  // 3. NodeRegistry: NodeId -> NodeInstance
  constructor(id: string) {
    this.id = id;
    this.Nodes = new Map<NodeId, string>();
    this.Edges = new Map<NodeId, NodeId[]>();
    this.IncomingEdges = new Map<NodeId, NodeId[]>();
    this.OutgoingEdges = new Map<NodeId, NodeId[]>();
  }

  addNode(id: NodeId, name: string) {
    this.Nodes.set(id, name);
  }

  addEdge(from: NodeId, to: NodeId) {
    const neighbours = this.Edges.get(from);

    this.OutgoingEdges.set(from, [...(this.OutgoingEdges.get(from) || []), to]);
    this.IncomingEdges.set(to, [...(this.IncomingEdges.get(to) || []), from]);

    if (neighbours) {
      neighbours.push(to);
    } else {
      this.Edges.set(from, [to]);
    }
  }

  getNextNodes(from: NodeId) : NodeId[] {
    return this.Edges.get(from) || [];
  }

  /**
   * 
   * @param registry - Registry for Future Use Case
   * @param visited  - Global visited Set so that we dont need to go through again 
   * @param currentNode - its a current node for which we are checking the cycle
   * @param currentRecursionStack  - its a local visited set for current recursion stack so that we can detect the cycle if we encounter the same node again in the same recursion stack
   * @returns - true if cycle is detected else false
   */
  dfsForDetectCycle(registry: NodeRegistry, visited: Set<NodeId>, currentNode: NodeId, currentRecursionStack: Set<NodeId>): boolean {

    if (currentRecursionStack.has(currentNode)) {
      return true; // Cycle detected
    }

    if (visited.has(currentNode)) {
      return false; // Already visited and no cycle found in previous visits
    }

    // global visited 
    visited.add(currentNode);

    // local visited for current recursion stack
    currentRecursionStack.add(currentNode);

    const neighbours = this.getNextNodes(currentNode);

    for (const neighbour of neighbours) {
      if (this.dfsForDetectCycle(registry, visited, neighbour,currentRecursionStack)) {
        return true; // Cycle detected in the recursive call
      }
    }

    // remove from current recursion stack before backtracking
    currentRecursionStack.delete(currentNode);

    // do not need to remove from visited set as we want to mark it globally visited so that we do not visit it again in future calls

    return false; // No cycle detected in this path
  }

  detectCycle(registry: NodeRegistry) : boolean {
    const visited = new Set<NodeId>();
    const currRecursionStack = new Set<NodeId>();
    
    // why for each node ? because the graph can be disconnected (User bc)
    for (const nodeId of this.Nodes.keys()) {
       if (this.dfsForDetectCycle(registry, visited, nodeId, currRecursionStack)) {
        return true; // Cycle detected
       } 
    }

    return false;
  }

  /**
   * 
   * @param registry - it will be registry for the current Graph to get the type of NodeId
   */
  checkGraphValidity(registry: NodeRegistry): boolean {

    /**
     * 1. Client Must not have outgoing edge 
     * 2. Client Either Connected to the Server or ApiGateway or LoadBalancer 
     * 3. Server At Least have one Connection to Either Database or Cache for now 
     * 4. Api Gateway at least have one connection to Server
     * 5. LoadBalancer at least have one connection to Server
     * 6. Database and Cache should not have outgoing edge
     * 7. No Cycles in the Graph
     * 8. All Nodes in the Graph should be connected to at least one other node (except Client)
     */

    if (this.detectCycle(registry)) {
        return false; // Graph is not valid if it contains a cycle
    }

    return true // Graph is valid if it does not contain any cycle and satisfies all the above conditions (for now we are only checking for cycle, we can add more checks in future)
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
