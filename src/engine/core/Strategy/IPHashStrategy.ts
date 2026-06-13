import { LoadBalancingConfig } from "./LoadBalancingConfig";

class IPHashStrategy implements LoadBalancingConfig {
  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  selectServer(serverIds: any[], clientIp?: string): any {
    const ip = clientIp || "0.0.0.0";
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      // here >>> 0 is used to convert the result to an unsigned 32-bit integer
      hash = (hash * 31 + ip.charCodeAt(i)) >>> 0;
    }

    const index = hash % serverIds.length;
    return serverIds[index];
  }
}

export default IPHashStrategy
