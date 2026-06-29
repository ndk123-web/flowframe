import { NodeInstance } from "../../contracts";
import Message from "./Message";

enum MessageQueueProccessing {
  FIFO = "FIFO",
  LIFO = "LIFO",
  PRIORITY = "PRIORITY",
}

enum QueueOverflowBehavior {
  REJECT = "REJECT",
  BLOCK = "BLOCK",
  UNLIMITED = "UNLIMITED",
}

class MessageQueueModel implements NodeInstance {
  id: string;
  name: string;
  type: string = "MESSAGE_QUEUE";
  processingType: MessageQueueProccessing;
  queueSize: number;
  overflowBehavior: QueueOverflowBehavior;
  queue: Message[] = [];

  connections: Record<string, string> = {}; // maps producerId -> consumerId

  constructor(
    id: string,
    name: string,
    processingType: MessageQueueProccessing = MessageQueueProccessing.FIFO,
    queueSize: number = 10,
    overflowBehavior: QueueOverflowBehavior = QueueOverflowBehavior.REJECT,
  ) {
    this.id = id;
    this.name = name;
    this.processingType = processingType;
    this.queueSize = queueSize;
    this.overflowBehavior = overflowBehavior;
  }

  isFull(): boolean {
    if (this.overflowBehavior === QueueOverflowBehavior.UNLIMITED) {
      return false;
    }
    return this.queue.length >= this.queueSize;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  addConnection(producerId: string, consumerId: string): void {
    this.connections[producerId] = consumerId;
  }

  removeConnection(producerId: string): void {
    delete this.connections[producerId];
  }

  enqueue(message: Message): boolean {
    if (this.isFull()) {
      return false;
    }
    this.queue.push(message);
    return true;
  }

  dequeue(consumerId: string): Message | null {
    if (this.isEmpty()) {
      return null;
    }

    // Find all producer IDs mapped to this consumer
    const mappedProducers = Object.keys(this.connections).filter(
      (prodId) => this.connections[prodId] === consumerId
    );

    let messageIndex = -1;

    if (mappedProducers.length > 0) {
      // Find the first message matching mapped producers based on processingType
      if (this.processingType === MessageQueueProccessing.FIFO) {
        messageIndex = this.queue.findIndex((m) => mappedProducers.includes(m.producerId));
      } else if (this.processingType === MessageQueueProccessing.LIFO) {
        for (let i = this.queue.length - 1; i >= 0; i--) {
          if (mappedProducers.includes(this.queue[i].producerId)) {
            messageIndex = i;
            break;
          }
        }
      } else if (this.processingType === MessageQueueProccessing.PRIORITY) {
        let bestPriority = -Infinity;
        for (let i = 0; i < this.queue.length; i++) {
          const msg = this.queue[i];
          if (mappedProducers.includes(msg.producerId)) {
            const priority = (msg as any).priority ?? msg.payload?.priority ?? 0;
            if (priority > bestPriority) {
              bestPriority = priority;
              messageIndex = i;
            }
          }
        }
      }
    } else {
      // Fallback: If this consumer has no specific producer mapping,
      // dequeue the next message in the queue based on the processing type.
      if (this.processingType === MessageQueueProccessing.FIFO) {
        messageIndex = 0;
      } else if (this.processingType === MessageQueueProccessing.LIFO) {
        messageIndex = this.queue.length - 1;
      } else if (this.processingType === MessageQueueProccessing.PRIORITY) {
        let bestPriority = -Infinity;
        for (let i = 0; i < this.queue.length; i++) {
          const msg = this.queue[i];
          const priority = (msg as any).priority ?? msg.payload?.priority ?? 0;
          if (priority > bestPriority) {
            bestPriority = priority;
            messageIndex = i;
          }
        }
      }
    }

    if (messageIndex !== -1) {
      const message = this.queue[messageIndex];
      this.queue.splice(messageIndex, 1);
      return message;
    }

    return null;
  }
}

export { MessageQueueProccessing, QueueOverflowBehavior };
export default MessageQueueModel;
