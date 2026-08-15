import { describe, it, expect, beforeEach } from "vitest";
import PubSubModel from "@/engine/models/PubSub/PubSubModel";

describe("PubSubModel", () => {
  let pubsub: PubSubModel;

  beforeEach(() => {
    pubsub = new PubSubModel("pubsub-1", "Central Broker");
  });

  it("should initialize with correct properties", () => {
    expect(pubsub.id).toBe("pubsub-1");
    expect(pubsub.name).toBe("Central Broker");
    expect(pubsub.type).toBe("PUBSUB_BROKER");
    expect(pubsub.messageHistory).toHaveLength(0);
  });

  it("should subscribe consumers to channels without duplicate registrations", () => {
    pubsub.subscribe("orders.created", "worker-1");
    pubsub.subscribe("orders.created", "worker-2");
    pubsub.subscribe("orders.created", "worker-1"); // Duplicate attempt

    const subscribers = pubsub.channels.get("orders.created");
    expect(subscribers).toEqual(["worker-1", "worker-2"]);
  });

  it("should return correct subscribers when publishing a message", () => {
    pubsub.subscribe("payment.success", "email-service");
    pubsub.subscribe("payment.success", "analytics-service");

    const targetSubscribers = pubsub.publish("payment.success", "checkout-server", {
      orderId: "ORD-123",
      amount: 99.99,
    });

    expect(targetSubscribers).toEqual(["email-service", "analytics-service"]);
    expect(pubsub.messageHistory).toHaveLength(1);
    expect(pubsub.messageHistory[0].channel).toBe("payment.success");
    expect(pubsub.messageHistory[0].publisherId).toBe("checkout-server");
  });

  it("should return an empty array when publishing to a channel with no subscribers", () => {
    const targetSubscribers = pubsub.publish("unused.channel", "publisher-1", { data: true });

    expect(targetSubscribers).toEqual([]);
    expect(pubsub.messageHistory).toHaveLength(1);
  });
});
