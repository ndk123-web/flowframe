const ALLOWED_VARIABLES: Record<string, string[]> = {
  client: ['id','requests', 'label', 'type', 'valet'],
  server: ['id','acceptedEndpoints', 'label', 'tcpConnectionsToPostgres', 'capacity', 'prefetchLimit', 'registeredTopics'],
  loadbalancer: ['id','label', 'type', 'strategy'],
};

export default ALLOWED_VARIABLES;
