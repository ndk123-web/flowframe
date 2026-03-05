import { LoadBalancingConfig } from "../core/Strategy/LoadBalancingConfig";
import type { NodeInstance } from "../contracts";

// for the NodeRegistry we will store the instance of the LoadBalancerModel
class LoadBalancerModel implements NodeInstance {
  id: string;
  name: string;
  strategy: LoadBalancingConfig;
  type: string = "LOAD_BALANCER";

  constructor(id: string, name: string, strategy: LoadBalancingConfig) {
    this.id = id;
    this.name = name;
    this.strategy = strategy;
  }

  runLoadBalancer(serverIds: any[]) {
    return this.strategy.selectServer(serverIds);
  }
}

export default LoadBalancerModel;