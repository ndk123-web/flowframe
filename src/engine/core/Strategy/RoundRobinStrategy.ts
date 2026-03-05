import type { LoadBalancingConfig } from "./LoadBalancingConfig";

class RoundRobinStrategy implements LoadBalancingConfig {
  private pointer: number = 0;

  selectServer(serverIds: any[]) {
    if (serverIds.length == 0) {
      return -1;
    }

    const selected = serverIds[this.pointer];
    this.pointer = (this.pointer + 1) % serverIds.length;

    return selected;
  }
}
export default RoundRobinStrategy;
