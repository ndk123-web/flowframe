import { describe, it, expect, beforeEach } from "vitest";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";

describe("GraphManager", () => {
  let graph: GraphManager;
  let registry: NodeRegistry;

  // it will run before each test
  // we have to create new instances of GraphManager and NodeRegistry
  // before each test
  beforeEach(() => {
    graph = new GraphManager("test-graph");
    registry = new NodeRegistry("test-registry");
  });

  it("should add nodes and retrieve graph details correctly", () => {
    graph.addNode("client-1", "Client Node");
    graph.addNode("server-1", "Server Node");

    const details = graph.getDetails();
    expect(details.Nodes).toEqual({
      "client-1": "Client Node",
      "server-1": "Server Node",
    });
  });

  it("should add directed edges between nodes", () => {
    graph.addNode("client-1", "Client Node");
    graph.addNode("server-1", "Server Node");
    graph.addEdge("client-1", "server-1");

    expect(graph.getNextNodes("client-1")).toEqual(["server-1"]);
    expect(graph.getNextNodes("server-1")).toEqual([]);
  });

  it("should correctly detect cycles in an acyclic graph", () => {
    graph.addNode("A", "Node A");
    graph.addNode("B", "Node B");
    graph.addNode("C", "Node C");

    graph.addEdge("A", "B");
    graph.addEdge("B", "C");

    const hasCycle = graph.detectCycle(registry);
    expect(hasCycle).toBe(false);
  });

  it("should correctly detect cycles when a loop exists", () => {
    graph.addNode("A", "Node A");
    graph.addNode("B", "Node B");
    graph.addNode("C", "Node C");

    graph.addEdge("A", "B");
    graph.addEdge("B", "C");
    graph.addEdge("C", "A"); // Creates cycle A -> B -> C -> A

    const hasCycle = graph.detectCycle(registry);
    expect(hasCycle).toBe(true);
  });

  it("should fail graph validity check if a cycle is present", () => {
    graph.addNode("node-1", "Node 1");
    graph.addNode("node-2", "Node 2");

    graph.addEdge("node-1", "node-2");
    graph.addEdge("node-2", "node-1");

    const isValid = graph.checkGraphValidity(registry);
    expect(isValid).toBe(false);
  });
});
