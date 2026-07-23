type ClientRequestStructure = {
  endpoint: string;
  allowedMethod: string[];
  body: Record<string, string>;
  key: string;
};

type ClientNodeStructure = {
  requests: ClientRequestStructure[];
  label: string;
  type: string;
  valet: boolean;
  technologyOfServer: string;
};

type ServerEndpointStructure = {
  endpoint: string;
  allowedMethods: string[];
};

type ServerRegsiterTopicsForPubSub = {
  topic: string;
};

type ServerNodeStructure = {
  acceptedEndpoints: ServerEndpointStructure[];
  tcpConnectionsToPostgres: number;
  capacity: number;
  label: string;
  technologyOfServer: string;
  prefetchLimit: string;
  registeredTopics: ServerRegsiterTopicsForPubSub[];
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
  // ex: /post , toNode is s2, and nameOfServuce: PostService from the Gateway Rules
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
};

type RedisStructure = {
  label: string;
  technologyOfRedis: string;
  data: RedisKeyValue[];
};

type PostgresRow = {
  tableName: string;
  key: string;
  value: string;
};

// check dbName in postgres model before , in simulation may get error
type PostgreStructure = {
  label: string;
  technologyOfPostgres: string;
  dbName: string;
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

type overflowTypes = 'REJECT' | 'BLOCK' | 'UNLIMITED';
type proccesingTypes = 'FIFO' | 'LIFO' | 'PRIORITY';

type MessageQueueStructure = {
  label: string;
  processingType: proccesingTypes;
  queueSizeLimit: string;
  overflowBehavious: overflowTypes;
};

// means pubsub connected to the subsribers ..
type PubSubSubscribers = {
  idOfNode: string;
  topic: string;
};

type PubSubStructure = {
  label: string;
  technologyOfPubSub: string;
  activeSubcribers: PubSubSubscribers[];
};

export type { ClientNodeStructure, ServerEndpointStructure };
