import { Ast } from '../contracts/ast';
import { DefineNodeAst } from '../flowAst/defineNode';
import { ConnectionAst } from '../flowAst/connectionNode';
import {
  StringLiteralAst,
  NumberLiteralAst,
  BooleanLiteralAst,
  IdentifierLiteralAst,
  ArrayAst,
  ObjectAst,
} from '../flowAst/ast';

function astToJs(astNode: any): any {
  if (!astNode) return null;
  if (astNode instanceof StringLiteralAst) return astNode.value;
  if (astNode instanceof NumberLiteralAst) return astNode.value;
  if (astNode instanceof BooleanLiteralAst) return astNode.value;
  if (astNode instanceof IdentifierLiteralAst) return astNode.value;
  if (astNode instanceof ArrayAst) {
    return astNode.elements.map((el) => astToJs(el));
  }
  if (astNode instanceof ObjectAst) {
    const obj: Record<string, any> = {};
    for (const prop of astNode.properties) {
      obj[prop.key] = astToJs(prop.value);
    }
    return obj;
  }
  return null;
}

function mapNodeType(typeOfNode: string): { type: string; flavor: string } {
  switch (typeOfNode) {
    case 'CLIENT_NODE':
      return { type: 'client', flavor: 'browser' };
    case 'SERVER_NODE':
      return { type: 'server', flavor: 'nodejs' };
    case 'GATEWAY_NODE':
      return { type: 'api-gateway', flavor: 'aws-apigw' };
    case 'LOADBALANCER_NODE':
      return { type: 'load-balancer', flavor: 'nginx' };
    case 'PUBSUB_NODE':
      return { type: 'pubsub', flavor: 'redis-pubsub' };
    case 'POSTGRES_NODE':
      return { type: 'postgres', flavor: 'postgres' };
    case 'REDIS_NODE':
      return { type: 'redis', flavor: 'redis' };
    case 'MESSAGE_QUEUE_NODE':
      return { type: 'messagequeue', flavor: 'rabbitmq' };
    default:
      return { type: 'server', flavor: 'nodejs' };
  }
}

function normalizeFlavor(providerStr: string, type: string): string {
  const norm = String(providerStr || '').toLowerCase().trim();

  // Common aliases mapping
  if (norm === 'aws') {
    if (type === 'api-gateway') return 'aws-apigw';
    if (type === 'load-balancer') return 'aws-alb';
    if (type === 'postgres') return 'aws-rds';
    if (type === 'redis') return 'elasticache';
    if (type === 'messagequeue' || type === 'message-queue') return 'aws-sqs';
    if (type === 'pubsub') return 'aws-sns';
    return 'aws-alb';
  }
  if (norm === 'gcp' || norm === 'google') {
    if (type === 'load-balancer') return 'gcp-lb';
    if (type === 'storage') return 'gcs';
    if (type === 'pubsub') return 'gcp-pubsub';
    return 'gcp-lb';
  }
  if (norm === 'azure') {
    if (type === 'load-balancer') return 'azure-lb';
    if (type === 'storage') return 'azure-blob';
    return 'azure-lb';
  }

  return norm;
}

export interface FlowFrameGraphOutput {
  version: string;
  nodes: any[];
  edges: any[];
  nodeConfigs: Record<string, any>;
}

function graphBuilder(ast: Ast[]): FlowFrameGraphOutput {
  const nodes: any[] = [];
  const edges: any[] = [];
  const nodeConfigs: Record<string, any> = {};

  const nodeMap = new Map<string, DefineNodeAst>();
  const connections: ConnectionAst[] = [];

  // Categorize AST items
  for (const item of ast) {
    if (item instanceof DefineNodeAst) {
      nodeMap.set(item.identiferName, item);
    } else if (item instanceof ConnectionAst) {
      connections.push(item);
    }
  }

  // Calculate DAG layers for auto positioning
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  const layers: Record<string, number> = {};

  nodeMap.forEach((_, id) => {
    inDegree[id] = 0;
    adj[id] = [];
    layers[id] = 0;
  });

  connections.forEach((conn) => {
    if (adj[conn.from]) {
      adj[conn.from].push(conn.to);
    }
    if (inDegree[conn.to] !== undefined) {
      inDegree[conn.to]++;
    }
  });

  // Topological / Layer calculation
  const queue: string[] = [];
  nodeMap.forEach((_, id) => {
    if (inDegree[id] === 0) {
      queue.push(id);
      layers[id] = 0;
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers[current];

    for (const nextNode of adj[current] || []) {
      layers[nextNode] = Math.max(layers[nextNode] || 0, currentLayer + 1);
      inDegree[nextNode]--;
      if (inDegree[nextNode] === 0) {
        queue.push(nextNode);
      }
    }
  }

  // Group nodes by layer to compute Y offsets
  const layerGroups: Record<number, string[]> = {};
  nodeMap.forEach((_, id) => {
    const layer = layers[id] || 0;
    if (!layerGroups[layer]) {
      layerGroups[layer] = [];
    }
    layerGroups[layer].push(id);
  });

  // Construct React Flow Nodes & nodeConfigs
  nodeMap.forEach((nodeAst, id) => {
    const { type, flavor } = mapNodeType(nodeAst.typeOfNode);
    const rawConfig = astToJs(nodeAst.config) || {};

    const layer = layers[id] || 0;
    const group = layerGroups[layer] || [id];
    const indexInLayer = group.indexOf(id);

    // Dynamic coordinates layout
    const x = 80 + layer * 300;
    const y = 180 + indexInLayer * 160;

    const label = rawConfig.label || id;

    // Check providerStyle / provider / flavor / style
    const rawProvider =
      rawConfig.providerStyle ||
      rawConfig.provider ||
      rawConfig.flavor ||
      rawConfig.style ||
      rawConfig.type;

    const finalFlavor = rawProvider ? normalizeFlavor(rawProvider, type) : flavor;

    nodes.push({
      id,
      type: 'customNode',
      position: { x, y },
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        label,
        type,
        flavor: finalFlavor,
        providerStyle: finalFlavor,
        isActive: false,
      },
    });

    // Build model specific nodeConfigs
    const processedConfig: Record<string, any> = {};

    if (type === 'client') {
      const rawRequests = rawConfig.requests || [];
      processedConfig.requests = rawRequests.map((req: any) => ({
        endpoint: req.endpoint || '/posts',
        method: Array.isArray(req.allowedMethods)
          ? req.allowedMethods[0]
          : req.method || 'GET',
        allowedMethods: req.allowedMethods || ['GET', 'POST'],
        lookupKey: req.key || req.lookupKey || 'rohan',
        fileName: req.fileName || 'file.png',
        isThereFileToUpload: Boolean(req.isThereFileToUpload),
        targetBucket: req.targetBucket || 'media-uploads',
        body:
          typeof req.body === 'object'
            ? JSON.stringify(req.body, null, 2)
            : req.body || '',
      }));
      processedConfig.valetKeyFlow = Boolean(rawConfig.valet);
    } else if (type === 'server') {
      processedConfig.capacity = rawConfig.capacity || 100;
      processedConfig.tcpConnections =
        rawConfig.tcpConnectionsToPostgres || rawConfig.tcpConnections || 10;
      processedConfig.prefetchLimit = rawConfig.prefetchLimit || 1;

      // Transform acceptedEndpoints array into endpoints map
      const endpointsMap: Record<string, string[]> = {};
      if (Array.isArray(rawConfig.acceptedEndpoints)) {
        rawConfig.acceptedEndpoints.forEach((item: any) => {
          if (item.endpoint) {
            const methods = item.allowedMethod ||
              item.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
            endpointsMap[item.endpoint] = methods;
          }
        });
      }
      processedConfig.endpoints =
        Object.keys(endpointsMap).length > 0
          ? endpointsMap
          : {
              '/posts': ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            };
    } else if (type === 'postgres') {
      processedConfig.table = rawConfig.table || 'users';
      const rawData = rawConfig.data || [{ key: 'rohan', value: 'db data for rohan' }];
      processedConfig.data = rawData.map((d: any) => ({
        key: d.key,
        value: d.value !== undefined ? d.value : d.val,
        val: d.val !== undefined ? d.val : d.value,
      }));
    } else if (type === 'redis') {
      const rawData = rawConfig.data || [{ key: 'rohan', value: 'cached data for rohan' }];
      processedConfig.data = rawData.map((d: any) => ({
        key: d.key,
        value: d.value !== undefined ? d.value : d.val,
        val: d.val !== undefined ? d.val : d.value,
      }));
    } else if (type === 'api-gateway' || type === 'load-balancer') {
      processedConfig.strategy = rawConfig.strategy || 'ROUND_ROBIN';
      const routesMap: Record<string, string> = {};

      if (Array.isArray(rawConfig.routes)) {
        rawConfig.routes.forEach((r: any) => {
          if (r.path && (r.target || r.service || r.node)) {
            routesMap[r.path] = r.target || r.service || r.node;
          }
        });
      } else if (typeof rawConfig.routes === 'object' && rawConfig.routes !== null) {
        Object.assign(routesMap, rawConfig.routes);
      }

      // Auto-infer route rules from outgoing target nodes if routes map is empty
      if (Object.keys(routesMap).length === 0 && adj[id]) {
        adj[id].forEach((targetNodeId) => {
          const targetAst = nodeMap.get(targetNodeId);
          if (targetAst) {
            const targetRaw = astToJs(targetAst.config) || {};
            if (Array.isArray(targetRaw.acceptedEndpoints)) {
              targetRaw.acceptedEndpoints.forEach((item: any) => {
                if (item.endpoint) {
                  routesMap[item.endpoint] = targetNodeId;
                }
              });
            }
          }
        });
      }

      processedConfig.routes = routesMap;
    } else if (type === 'messagequeue' || type === 'message-queue') {
      processedConfig.processingType = rawConfig.processingType || 'FIFO';
      processedConfig.queueSize = rawConfig.queueSize || 10;
      processedConfig.overflowBehavior = rawConfig.overflowBehavior || 'REJECT';
    } else if (type === 'pubsub') {
      processedConfig.topic = rawConfig.topic || 'events';
      processedConfig.subscribers = rawConfig.subscribers || [];
    }

    nodeConfigs[id] = processedConfig;
  });

  // Construct React Flow Edges matching standard FlowFrame ID format (from->to)
  connections.forEach((conn) => {
    edges.push({
      id: `${conn.from}->${conn.to}`,
      source: conn.from,
      target: conn.to,
      type: 'packet',
      markerEnd: {
        type: 'arrowclosed',
        color: '#60a5fa',
      },
      style: {
        stroke: '#60a5fa',
        strokeWidth: 1.8,
      },
    });
  });

  return {
    version: '1.0',
    nodes,
    edges,
    nodeConfigs,
  };
}

export default graphBuilder;
