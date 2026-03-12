import type { LoadBalancingConfig } from "./LoadBalancingConfig";

class RoundRobinStrategy implements LoadBalancingConfig {
  private pointer: number = 0;

  selectServer(serverIds: string[]) {
    if (serverIds.length === 0) {
      return -1;
    }

    const selected = serverIds[this.pointer % serverIds.length];
    this.pointer = (this.pointer + 1) % serverIds.length;

    return selected;
  }
}
export default RoundRobinStrategy;
