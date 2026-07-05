import { GraphManager } from "../engine/core/Graph/graph";
import { NodeRegistry } from "../engine/core/Graph/nodeResgistry";
import ClientModel from "../engine/models/Client";
import ServerModel from "../engine/models/server";
import PubSubModel from "../engine/models/PubSub/PubSubModel";
import { SimulationManager } from "../engine/core/Simulations/Simulation";

function runTest() {
  console.log("=== RUNNING PUB/SUB SIMULATION TEST ===");

  const graph = new GraphManager("graph-pubsub");
  const registry = new NodeRegistry("registry-pubsub");

  // Instantiating nodes
  const clientId = "client-1";
  const clientName = "Client 1";
  const client = new ClientModel(clientId, clientName);

  const publisherId = "server-pub";
  const publisherName = "Publisher Server";
  const publisher = new ServerModel(publisherId, publisherName);
  publisher.endpoints = {
    "/api/v1/getData": ["GET", "POST"]
  };

  const brokerId = "pubsub-broker";
  const brokerName = "PubSub Broker";
  const broker = new PubSubModel(brokerId, brokerName);

  const sub1Id = "sub-server-1";
  const sub1Name = "Subscriber Server 1";
  const sub1 = new ServerModel(sub1Id, sub1Name);

  const sub2Id = "sub-server-2";
  const sub2Name = "Subscriber Server 2";
  const sub2 = new ServerModel(sub2Id, sub2Name);

  // Register nodes in graph
  graph.addNode(clientId, clientName);
  graph.addNode(publisherId, publisherName);
  graph.addNode(brokerId, brokerName);
  graph.addNode(sub1Id, sub1Name);
  graph.addNode(sub2Id, sub2Name);

  // Register edges
  graph.addEdge(clientId, publisherId);
  graph.addEdge(publisherId, brokerId);
  graph.addEdge(brokerId, sub1Id);
  graph.addEdge(brokerId, sub2Id);

  // Register in registry
  registry.register(clientId, client);
  registry.register(publisherId, publisher);
  registry.register(brokerId, broker);
  registry.register(sub1Id, sub1);
  registry.register(sub2Id, sub2);

  // Setup Subscription
  broker.subscribe("order.created", sub1Id);
  broker.subscribe("order.created", sub2Id);
  broker.subscribe("user.updated", sub1Id);

  // Simulation 1: Success Scenario (With valid topic and subscribers)
  console.log("\n--- Scenario 1: Valid topic 'order.created' ---");
  const simPayload1 = {
    endpoint: "/api/v1/getData",
    method: "POST",
    topic: "order.created",
    amount: 250,
  };
  const simulation1 = new SimulationManager(graph, registry, simPayload1);
  simulation1.runSimulation(clientId);

  console.log("Generated Frames:");
  simulation1.getFrames().forEach((frame, idx) => {
    console.log(`[${idx + 1}] (t=${frame.timestamp}) Frame: ${frame.from} -> ${frame.to} | Action: ${frame.action} | Summary: ${frame.payloadSummary || ""}`);
  });

  // Simulation 2: Missing Topic Error Scenario
  console.log("\n--- Scenario 2: Missing Topic payload ---");
  const simPayload2 = {
    endpoint: "/api/v1/getData",
    method: "POST",
  };
  const simulation2 = new SimulationManager(graph, registry, simPayload2);
  simulation2.runSimulation(clientId);

  console.log("Generated Frames:");
  simulation2.getFrames().forEach((frame, idx) => {
    console.log(`[${idx + 1}] (t=${frame.timestamp}) Frame: ${frame.from} -> ${frame.to} | Action: ${frame.action} | Summary: ${frame.payloadSummary || ""}`);
  });

  // Simulation 3: Empty Topic Subscribers Scenario (Message Discarded)
  console.log("\n--- Scenario 3: Topic with no subscribers ('order.deleted') ---");
  const simPayload3 = {
    endpoint: "/api/v1/getData",
    method: "POST",
    topic: "order.deleted",
  };
  const simulation3 = new SimulationManager(graph, registry, simPayload3);
  simulation3.runSimulation(clientId);

  console.log("Generated Frames:");
  simulation3.getFrames().forEach((frame, idx) => {
    console.log(`[${idx + 1}] (t=${frame.timestamp}) Frame: ${frame.from} -> ${frame.to} | Action: ${frame.action} | Summary: ${frame.payloadSummary || ""}`);
  });

  // Simulation 4: Multi-channel Subscription Scenario (Only sub-server-1 should get this message)
  console.log("\n--- Scenario 4: Multi-channel Subscription (Publishing to 'user.updated') ---");
  const simPayload4 = {
    endpoint: "/api/v1/getData",
    method: "POST",
    topic: "user.updated",
  };
  const simulation4 = new SimulationManager(graph, registry, simPayload4);
  simulation4.runSimulation(clientId);

  console.log("Generated Frames:");
  simulation4.getFrames().forEach((frame, idx) => {
    console.log(`[${idx + 1}] (t=${frame.timestamp}) Frame: ${frame.from} -> ${frame.to} | Action: ${frame.action} | Summary: ${frame.payloadSummary || ""}`);
  });
}

runTest();
