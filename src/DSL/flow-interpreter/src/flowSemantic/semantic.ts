import { Ast } from "../contracts/ast";
import { DefineNodeAst } from "../flowAst/defineNode";
import { ConnectionAst } from "../flowAst/connectionNode";
import {
  StringLiteralAst,
  NumberLiteralAst,
  BooleanLiteralAst,
  IdentifierLiteralAst,
  ArrayAst,
  ObjectAst,
} from "../flowAst/ast";
import ALLOWED_VARIABLES_MAP from "../shared/allowedVariables";

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

const ALLOWED_REQUEST_KEYS = [
  'endpoint',
  'allowedMethods',
  'allowedMethod',
  'body',
  'key',
  'lookupKey',
  'fileName',
  'isThereFileToUpload',
  'targetBucket',
];

const ALLOWED_ENDPOINT_KEYS = [
  'endpoint',
  'allowedMethods',
  'allowedMethod',
];

function semanticAnalyzer(ast: Ast[]): Ast[] {
  const declaredNodes = new Map<string, DefineNodeAst>();
  const connections: ConnectionAst[] = [];

  // 1. Check node declarations & duplicates
  for (const node of ast) {
    if (node instanceof DefineNodeAst) {
      if (declaredNodes.has(node.identiferName)) {
        throw new Error(
          `Semantic Error: Duplicate declaration of node identifier '${node.identiferName}'.`
        );
      }
      declaredNodes.set(node.identiferName, node);
    } else if (node instanceof ConnectionAst) {
      connections.push(node);
    }
  }

  // 2. Validate connection references & topologies
  for (const conn of connections) {
    const sourceNode = declaredNodes.get(conn.from);
    const targetNode = declaredNodes.get(conn.to);

    if (!sourceNode) {
      throw new Error(
        `Semantic Error: Connection source node '${conn.from}' is not declared.`
      );
    }
    if (!targetNode) {
      throw new Error(
        `Semantic Error: Connection target node '${conn.to}' is not declared.`
      );
    }

    // Topology Rule A: Client cannot receive incoming requests
    if (targetNode.typeOfNode === "CLIENT_NODE" || targetNode.typeOfNode === "client") {
      throw new Error(
        `Semantic Error: Client node '${conn.to}' cannot receive incoming connections.`
      );
    }

    // // Topology Rule B: Direct Gateway -> LoadBalancer connection unsupported in simulation
    // if (
    //   (sourceNode.typeOfNode === "GATEWAY_NODE" || sourceNode.typeOfNode === "gateway") &&
    //   (targetNode.typeOfNode === "LOADBALANCER_NODE" || targetNode.typeOfNode === "loadbalancer")
    // ) {
    //   throw new Error(
    //     `Semantic Error: Direct connection from Gateway '${conn.from}' to LoadBalancer '${conn.to}' is not supported.`
    //   );
    // }
  }

  // 3. Validate Node Configs against ALLOWED_VARIABLES and Engine Models
  declaredNodes.forEach((nodeAst, id) => {
    const config = astToJs(nodeAst.config) || {};
    const nodeType = nodeAst.typeOfNode;

    const allowedKeys = ALLOWED_VARIABLES_MAP[nodeType];
    if (allowedKeys) {
      const actualKeys = Object.keys(config);
      for (const key of actualKeys) {
        if (!allowedKeys.includes(key)) {
          throw new Error(
            `Semantic Error: Unknown property '${key}' in ${nodeType} node '${id}'. Allowed properties are: ${allowedKeys.join(", ")}.`
          );
        }
      }
    }

    // Specific Client validation
    if (nodeType === "CLIENT_NODE" || nodeType === "client") {
      if (config.requests !== undefined) {
        if (!Array.isArray(config.requests)) {
          throw new Error(
            `Semantic Error: Client '${id}' property 'requests' must be an array of request objects.`
          );
        }
        config.requests.forEach((reqObj: any, idx: number) => {
          if (typeof reqObj !== "object" || reqObj === null) {
            throw new Error(
              `Semantic Error: Request #${idx + 1} in Client '${id}' must be an object.`
            );
          }
          Object.keys(reqObj).forEach((reqKey) => {
            if (!ALLOWED_REQUEST_KEYS.includes(reqKey)) {
              throw new Error(
                `Semantic Error: Unknown property '${reqKey}' in request #${idx + 1} of Client node '${id}'. Allowed properties: ${ALLOWED_REQUEST_KEYS.join(", ")}.`
              );
            }
          });
        });
      }
    }

    // Specific Server validation
    if (nodeType === "SERVER_NODE" || nodeType === "server") {
      if (config.capacity !== undefined && (typeof config.capacity !== "number" || config.capacity <= 0)) {
        throw new Error(
          `Semantic Error: Server '${id}' capacity must be a positive number.`
        );
      }
      if (
        config.tcpConnectionsToPostgres !== undefined &&
        (typeof config.tcpConnectionsToPostgres !== "number" || config.tcpConnectionsToPostgres <= 0)
      ) {
        throw new Error(
          `Semantic Error: Server '${id}' tcpConnectionsToPostgres must be a positive number.`
        );
      }
      if (config.acceptedEndpoints !== undefined) {
        if (!Array.isArray(config.acceptedEndpoints)) {
          throw new Error(
            `Semantic Error: Server '${id}' property 'acceptedEndpoints' must be an array.`
          );
        }
        config.acceptedEndpoints.forEach((epObj: any, idx: number) => {
          if (typeof epObj !== "object" || epObj === null) {
            throw new Error(
              `Semantic Error: Endpoint #${idx + 1} in Server '${id}' must be an object.`
            );
          }
          Object.keys(epObj).forEach((epKey) => {
            if (!ALLOWED_ENDPOINT_KEYS.includes(epKey)) {
              throw new Error(
                `Semantic Error: Unknown property '${epKey}' in acceptedEndpoint #${idx + 1} of Server node '${id}'. Allowed properties: ${ALLOWED_ENDPOINT_KEYS.join(", ")}.`
              );
            }
          });
        });
      }
    } else if (
      nodeType === "REDIS_NODE" ||
      nodeType === "redis" ||
      nodeType === "POSTGRES_NODE" ||
      nodeType === "postgres"
    ) {
      if (config.data !== undefined) {
        if (!Array.isArray(config.data)) {
          throw new Error(
            `Semantic Error: '${id}' property 'data' must be an array of data key-value objects.`
          );
        }
        const allowedDataKeys = ["key", "value", "val"];
        config.data.forEach((itemObj: any, idx: number) => {
          if (typeof itemObj !== "object" || itemObj === null) {
            throw new Error(
              `Semantic Error: Data item #${idx + 1} in '${id}' must be an object.`
            );
          }
          Object.keys(itemObj).forEach((dKey) => {
            if (!allowedDataKeys.includes(dKey)) {
              throw new Error(
                `Semantic Error: Unknown property '${dKey}' in data item #${idx + 1} of '${id}'. Allowed properties: ${allowedDataKeys.join(", ")}.`
              );
            }
          });
        });
      }
    }
  });

  return ast;
}

export default semanticAnalyzer;