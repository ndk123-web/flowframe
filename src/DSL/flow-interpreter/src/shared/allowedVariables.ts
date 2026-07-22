const ALLOWED_VARIABLES: Record<string, string[]> = {
  client: ['requests', 'label', 'type', 'valet'],
  server: ['acceptedEndpoints', 'label', 'tcpConnectionsToPostgres', 'capacity'],
  loadbalancer: ['label', 'type', 'strategy'],
};

export default ALLOWED_VARIABLES;
