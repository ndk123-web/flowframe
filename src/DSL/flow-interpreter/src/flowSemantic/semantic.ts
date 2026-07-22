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
    if (targetNode.typeOfNode === "CLIENT_NODE") {
      throw new Error(
        `Semantic Error: Client node '${conn.to}' cannot receive incoming connections.`
      );
    }

    // Topology Rule B: Direct Gateway -> LoadBalancer connection unsupported in simulation
    if (
      sourceNode.typeOfNode === "GATEWAY_NODE" &&
      targetNode.typeOfNode === "LOADBALANCER_NODE"
    ) {
      throw new Error(
        `Semantic Error: Direct connection from Gateway '${conn.from}' to LoadBalancer '${conn.to}' is not supported.`
      );
    }
  }

  // 3. Validate Node Configs against engine models
  declaredNodes.forEach((nodeAst, id) => {
    const config = astToJs(nodeAst.config) || {};
    const nodeType = nodeAst.typeOfNode;

    if (nodeType === "SERVER_NODE") {
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
    } else if (nodeType === "GATEWAY_NODE" || nodeType === "LOADBALANCER_NODE") {
      const validStrategies = ["ROUND_ROBIN", "LEAST_CONNECTIONS", "IP_HASH", "RANDOM"];
      if (config.strategy !== undefined && !validStrategies.includes(config.strategy)) {
        throw new Error(
          `Semantic Error: '${id}' strategy must be one of ${validStrategies.join(", ")}.`
        );
      }
    } else if (nodeType === "MESSAGE_QUEUE_NODE") {
      if (config.queueSize !== undefined && (typeof config.queueSize !== "number" || config.queueSize <= 0)) {
        throw new Error(
          `Semantic Error: MessageQueue '${id}' queueSize must be a positive number.`
        );
      }
      if (
        config.overflowBehavior !== undefined &&
        !["REJECT", "DROP_OLDEST"].includes(config.overflowBehavior)
      ) {
        throw new Error(
          `Semantic Error: MessageQueue '${id}' overflowBehavior must be 'REJECT' or 'DROP_OLDEST'.`
        );
      }
    }
  });

  return ast;
}

export default semanticAnalyzer;