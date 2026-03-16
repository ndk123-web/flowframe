interface LoadBalancingConfig {
  selectServer(serverIds: any[], clientIp?: string): any 
}

export type { LoadBalancingConfig };
