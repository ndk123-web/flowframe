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

  enqueue(message: Message): boolean {
    if (this.isFull()) {
      return false;
    }
    this.queue.push(message);
    return true;
  }

  dequeue(): Message | null {
    if (this.isEmpty()) {
      return null;
    }

    let messageIndex = 0;

    if (this.processingType === MessageQueueProccessing.LIFO) {
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

    const message = this.queue[messageIndex];
    this.queue.splice(messageIndex, 1);
    return message;
  }
}

export { MessageQueueProccessing, QueueOverflowBehavior };
export default MessageQueueModel;
