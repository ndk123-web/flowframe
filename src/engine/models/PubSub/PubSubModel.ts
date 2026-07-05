import { NodeInstance } from "@/engine/contracts";

/**
 * Pub/Sub have - There is one broker which handles (Subscribers, Consumers, Producers)
 *
 * @abstract
 * Service Insert Message into the PubSub with Topic (1, N Services can insert into pubsub broker)
 * Multiple Services / Workers Are Subscribed to the same Topic  (1,N can consume the messages)
 * 
 * @summary
 * Message Broker is the One who Manages Topics/Channels (ex: Kafka, ..etc)
 * 
 * @class
 * This Class, Its an Pub Sub Broker
 */
interface PubSubMessage {
  id: string;
  channel: string;
  payload: any;
  publisherId: string;
  timestamp: number;
}

class PubSubModel implements NodeInstance {
  id: string;
  name: string;
  type: string = "PUBSUB_BROKER";

  // channel_name -> consumers Node ids who are subsribed to the channel
  channels: Map<string, string[]> = new Map<string, string[]>();

  // Track historical messages processed by this broker
  messageHistory: PubSubMessage[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Subscribe a consumer node to a specific topic/channel.
   */
  subscribe(channel: string, consumerId: string) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, []);
    }
    const subscribers = this.channels.get(channel)!;
    if (!subscribers.includes(consumerId)) {
      subscribers.push(consumerId);
    }
  }

  /**
   * Publish a message to a specific topic/channel.
   * Returns list of subscriber node IDs.
   */
  publish(channel: string, publisherId: string, payload: any): string[] {
    const msgId = `pubsub-msg-${Math.random().toString(36).substr(2, 5)}`;
    
    this.messageHistory.push({
      id: msgId,
      channel,
      payload,
      publisherId,
      timestamp: Date.now(),
    });

    return this.channels.get(channel) || [];
  }
}

export default PubSubModel;
