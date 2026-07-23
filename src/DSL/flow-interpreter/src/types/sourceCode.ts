type ClientRequestStructure = {
  endpoint: string;
  allowedMethods: string[];
  allowedMethod?: string[];
  body?: Record<string, any> | string;
  key?: string;
  lookupKey?: string;
  fileName?: string;
  isThereFileToUpload?: boolean;
  targetBucket?: string;
};

type ClientNodeStructure = {
  requests: ClientRequestStructure[];
  label: string;
  type: string;
  valet: boolean;
  technologyOfClient?: string;
};

type ServerEndpointStructure = {
  endpoint: string;
  allowedMethods: string[];
  allowedMethod?: string[];
};

type ServerRegisterTopicsForPubSub = {
  topic: string;
};

type ServerNodeStructure = {
  acceptedEndpoints: ServerEndpointStructure[];
  tcpConnectionsToPostgres: number;
  capacity: number;
  label: string;
  technologyOfServer: string;
  prefetchLimit: number;
  registeredTopics?: ServerRegisterTopicsForPubSub[];
};

type LoadBalancerStructure = {
  label: string;
  technologyOfLoadBalancer: string;
  strategy: string;
};

type GatewayRouteRules = {
  endpoint: string;
  nameOfService: string;
};

type ServiceMapping = {
  toNode: string;
  nameOfService: string;
};

type ApiGatewayStructure = {
  label: string;
  typeOfApiGateway: string;
  strategy: string;
  routeRules: GatewayRouteRules[];
  serviceMapping: ServiceMapping[];
};

type RedisKeyValue = {
  key: string;
  value: string;
  val?: string;
};

type RedisStructure = {
  label: string;
  technologyOfRedis: string;
  data: RedisKeyValue[];
};

type PostgresRow = {
  tableName?: string;
  key: string;
  value?: string;
  val?: string;
};

type PostgresStructure = {
  label: string;
  technologyOfPostgres: string;
  table: string;
  data: PostgresRow[];
};

type CloudBucket = {
  bucketName: string;
};

type CloudStorage = {
  label: string;
  technologyOfCloudStorage: string;
  bucketName: CloudBucket[];
};

type overflowTypes = 'REJECT' | 'BLOCK' | 'UNLIMITED' | 'DROP_OLDEST';
type processingTypes = 'FIFO' | 'LIFO' | 'PRIORITY';

type MessageQueueStructure = {
  label: string;
  processingType: processingTypes;
  queueSize: number;
  overflowBehavior: overflowTypes;
};

type PubSubSubscribers = {
  idOfNode: string;
  topic: string;
};

type PubSubStructure = {
  label: string;
  technologyOfPubSub: string;
  activeSubscribers: PubSubSubscribers[];
};

export type {
  ClientRequestStructure,
  ClientNodeStructure,
  ServerEndpointStructure,
  ServerNodeStructure,
  LoadBalancerStructure,
  ApiGatewayStructure,
  RedisStructure,
  PostgresStructure,
  CloudStorage,
  MessageQueueStructure,
  PubSubStructure,
};
