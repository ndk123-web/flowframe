type RequestStructure = {
  endpoint: string;
  allowedMethod: string[];
  body: Record<string, string>;
  key: string;
};

type ClientNodeStructure = {
  requests: RequestStructure[];
  label: string;
  type: string;
  valet: boolean;
};

type ServerEndpointStructure = {
  endpoint: string;
  allowedMethods: string[];
};

type ServerNodeStructure = {
  acceptedEndpoints: ServerEndpointStructure[];
  tcpConnectionsToPostgres: number;
  capacity: number;
  label: string;
};

export type { ClientNodeStructure, ServerEndpointStructure };
