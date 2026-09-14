type NodePositionCoordinates = {
  x?: number;
  y?: number;
  xAxis?: number;
  yAxis?: number;
  x_axis?: number;
  y_axis?: number;
  position?: { x: number; y: number };
};

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

type ClientNodeStructure = NodePositionCoordinates & {
  requests: ClientRequestStructure[];
  label: string;
  type: string;
  valet: boolean;
  technologyOfClient?: string;
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type ServerEndpointStructure = {
  endpoint: string;
  allowedMethods: string[];
  allowedMethod?: string[];
};

type ServerRegisterTopicsForPubSub = {
  topic: string;
};

type ServerNodeStructure = NodePositionCoordinates & {
  acceptedEndpoints: ServerEndpointStructure[];
  tcpConnectionsToPostgres: number;
  capacity: number;
  label: string;
  technologyOfServer: string;
  prefetchLimit: number;
  registeredTopics?: ServerRegisterTopicsForPubSub[];
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type LoadBalancerStructure = NodePositionCoordinates & {
  label: string;
  technologyOfLoadBalancer: string;
  strategy: string;
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type GatewayRouteRules = {
  endpoint: string;
  nameOfService: string;
};

type ServiceMapping = {
  toNode: string;
  nameOfService: string;
};

type ApiGatewayStructure = NodePositionCoordinates & {
  label: string;
  typeOfApiGateway: string;
  strategy: string;
  routeRules: GatewayRouteRules[];
  serviceMapping: ServiceMapping[];
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type RedisKeyValue = {
  key: string;
  value: string;
  val?: string;
};

type RedisStructure = NodePositionCoordinates & {
  label: string;
  technologyOfRedis: string;
  data: RedisKeyValue[];
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type PostgresRow = {
  tableName?: string;
  key: string;
  value?: string;
  val?: string;
};

type PostgresStructure = NodePositionCoordinates & {
  label: string;
  technologyOfPostgres: string;
  table: string;
  data: PostgresRow[];
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type CloudBucket = {
  bucketName: string;
};

type CloudStorage = NodePositionCoordinates & {
  label: string;
  technologyOfCloudStorage: string;
  bucketName: CloudBucket[];
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type overflowTypes = 'REJECT' | 'BLOCK' | 'UNLIMITED' | 'DROP_OLDEST';
type processingTypes = 'FIFO' | 'LIFO' | 'PRIORITY';

type MessageQueueStructure = NodePositionCoordinates & {
  label: string;
  processingType: processingTypes;
  queueSize: number;
  overflowBehavior: overflowTypes;
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

type PubSubSubscribers = {
  idOfNode: string;
  topic: string;
};

type PubSubStructure = NodePositionCoordinates & {
  label: string;
  technologyOfPubSub: string;
  activeSubscribers: PubSubSubscribers[];
  flavor?: string;
  providerStyle?: string;
  provider?: string;
};

export type {
  NodePositionCoordinates,
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
