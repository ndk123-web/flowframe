import type { NodeInstance } from "../../contracts";
import type { NodeId } from "../../types";

class NodeRegistry {
  private id: string;
  registry: Map<NodeId, NodeInstance> = new Map();

  constructor(id: string) {
    this.id = id;
  }

  register(nodeId: NodeId, instance: NodeInstance) {
    this.registry.set(nodeId, instance);
  }

  removeInstance(nodeId: NodeId) {
    if (this.registry.delete(nodeId)) {
      return 1;
    }

    const instance = this.getInstance(nodeId);
    if (instance !== null) {
      return 1;
    }

    return -1;
  }

  getInstance(nodeId: NodeId) {
    return this.registry.get(nodeId) || null;
  }

  getDetails() {
    return {
      // it converts Map to json object
      registry: Object.fromEntries(this.registry),
    };
  }
}

export { NodeRegistry };
