import type { Event } from "@/engine/types";

class PriorityQueue {
  queue: Event[];

  constructor() {
    this.queue = [];
  }

  pushIntoQueue(item: Event) {
    this.queue.push(item);

    // min heap based on timestamp
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
  }

  pushMultipleIntoQueue(items: Event[]) {
    this.queue.push(...items);

    // min heap based on timestamp
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
  }

  popMinTimeStampItem() {
    // automatically pops the item with the minimum timestamp due to sorting in push methods
    return this.queue.shift();
  }

  peekMinTimeStampItem(): Event {
    return this.queue[0];
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}

export default PriorityQueue;
