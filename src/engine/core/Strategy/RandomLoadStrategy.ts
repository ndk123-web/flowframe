import { LoadBalancingConfig } from "./LoadBalancingConfig";

class RandomLoadBalancerStrategy implements LoadBalancingConfig {
  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  selectServer(serverIds: any[]): any {
    const index = Math.floor(Math.random() * serverIds.length);
    return serverIds[index];
  }
}

export default RandomLoadBalancerStrategy;
