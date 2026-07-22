import { lexerFlow } from './flow-interpreter/src/flowLexer/lexer';
import parserFlow from './flow-interpreter/src/flowParser/parser';
import semanticAnalyzer from './flow-interpreter/src/flowSemantic/semantic';
import graphBuilder, {
  FlowFrameGraphOutput,
} from './flow-interpreter/src/flowGraphBuilder/graphBuilder';

export function compileFlowDSL(sourceCode: string): FlowFrameGraphOutput {
  const tokens = lexerFlow(sourceCode);
  const ast = parserFlow(tokens);
  const validatedAst = semanticAnalyzer(ast);
  const graph = graphBuilder(validatedAst);
  return graph;
}

export function generateFlowDSLFromGraph(
  nodes: any[],
  edges: any[],
  nodeConfigs: Record<string, any>
): string {
  if (!nodes || nodes.length === 0) {
    return "// Empty Canvas (.flow)\n";
  }

  const lines: string[] = ["// Auto-Generated Architecture Script (.flow)", ""];

  nodes.forEach((node) => {
    const id = node.id;
    const type = node.data?.type || "server";
    const label = node.data?.label || id;
    const config = nodeConfigs[id] || {};

    let dslKeyword = "server";
    if (type === "client") dslKeyword = "client";
    else if (type === "api-gateway") dslKeyword = "gateway";
    else if (type === "load-balancer") dslKeyword = "loadbalancer";
    else if (type === "server") dslKeyword = "server";
    else if (type === "postgres") dslKeyword = "postgres";
    else if (type === "redis") dslKeyword = "redis";
    else if (type === "message-queue") dslKeyword = "messagequeue";
    else if (type === "pubsub") dslKeyword = "pubsub";

    lines.push(`${dslKeyword} ${id} {`);
    lines.push(`  label: "${label}",`);
    if (node.data?.flavor) {
      lines.push(`  providerStyle: "${node.data.flavor}",`);
    }

    if (type === "client") {
      lines.push(`  type: "${node.data?.flavor || "Web Browser"}",`);
      lines.push(`  valet: ${Boolean(config.valetKeyFlow)},`);
      const reqs = config.requests || [];
      if (reqs.length > 0) {
        lines.push(`  requests: [`);
        reqs.forEach((r: any, idx: number) => {
          const methods = Array.isArray(r.allowedMethods)
            ? JSON.stringify(r.allowedMethods)
            : `["${r.method || "GET"}"]`;
          lines.push(`    {`);
          lines.push(`      endpoint: "${r.endpoint || "/posts"}",`);
          lines.push(`      allowedMethods: ${methods},`);
          lines.push(`      key: "${r.lookupKey || "rohan"}"`);
          lines.push(`    }${idx < reqs.length - 1 ? "," : ""}`);
        });
        lines.push(`  ]`);
      }
    } else if (type === "server") {
      lines.push(`  capacity: ${config.capacity || 100},`);
      lines.push(`  tcpConnectionsToPostgres: ${config.tcpConnections || 10},`);
      lines.push(`  prefetchLimit: ${config.prefetchLimit || 1},`);
      const endpointsMap = config.endpoints || {};
      const epKeys = Object.keys(endpointsMap);
      if (epKeys.length > 0) {
        lines.push(`  acceptedEndpoints: [`);
        epKeys.forEach((ep, idx) => {
          const methods = JSON.stringify(endpointsMap[ep]);
          lines.push(`    {`);
          lines.push(`      endpoint: "${ep}",`);
          lines.push(`      allowedMethod: ${methods}`);
          lines.push(`    }${idx < epKeys.length - 1 ? "," : ""}`);
        });
        lines.push(`  ]`);
      }
    } else if (type === "api-gateway" || type === "load-balancer") {
      lines.push(`  strategy: "${config.strategy || "ROUND_ROBIN"}",`);
      const routes = config.routes || {};
      const routeKeys = Object.keys(routes);
      if (routeKeys.length > 0) {
        lines.push(`  routes: {`);
        routeKeys.forEach((path, idx) => {
          lines.push(`    "${path}": "${routes[path]}"${idx < routeKeys.length - 1 ? "," : ""}`);
        });
        lines.push(`  }`);
      }
    } else if (type === "postgres") {
      lines.push(`  table: "${config.table || "users"}",`);
      lines.push(`  data: ${JSON.stringify(config.data || [{ key: "rohan", val: "db_data" }])}`);
    } else if (type === "redis") {
      lines.push(`  data: ${JSON.stringify(config.data || [{ key: "rohan", val: "cached_data" }])}`);
    } else if (type === "message-queue") {
      lines.push(`  processingType: "${config.processingType || "FIFO"}",`);
      lines.push(`  queueSize: ${config.queueSize || 10},`);
      lines.push(`  overflowBehavior: "${config.overflowBehavior || "REJECT"}"`);
    } else if (type === "pubsub") {
      lines.push(`  topic: "${config.topic || "events"}"`);
    }

    lines.push(`}`);
    lines.push(``);
  });

  if (edges && edges.length > 0) {
    lines.push(`// System Topology Connections`);
    edges.forEach((edge) => {
      lines.push(`${edge.source} -> ${edge.target}`);
    });
  }

  return lines.join("\n");
}

export function registerFlowLanguage(monaco: any) {
  if (!monaco || !monaco.languages) return;

  // Avoid duplicate registration
  if (monaco.languages.getLanguages().some((lang: any) => lang.id === 'flow-lang')) {
    return;
  }

  // 1. Register Language
  monaco.languages.register({ id: 'flow-lang', extensions: ['.flow'] });

  // 2. Language Configuration for Brackets, Quotes, and Auto-closing
  monaco.languages.setLanguageConfiguration('flow-lang', {
    comments: {
      lineComment: '//',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  // 3. Syntax Highlighting Tokens (Monarch Provider)
  monaco.languages.setMonarchTokensProvider('flow-lang', {
    keywords: [
      'client',
      'server',
      'gateway',
      'loadbalancer',
      'pubsub',
      'postgres',
      'redis',
      'messagequeue',
    ],
    booleans: ['true', 'false'],
    operators: ['->', ':'],

    tokenizer: {
      root: [
        [/\/\/.*/, 'comment'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\d+(\.\d+)?/, 'number'],
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@booleans': 'type',
              '@default': 'identifier',
            },
          },
        ],
        [/->/, 'operator'],
        [/[:=]/, 'operator'],
        [/[{}()\[\]]/, 'delimiter'],
      ],
    },
  });

  // 4. Autocomplete / IntelliSense Provider
  monaco.languages.registerCompletionItemProvider('flow-lang', {
    provideCompletionItems: (model: any, position: any) => {
      const suggestions: any[] = [];
      const wordInfo = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      const keywords = [
        'client',
        'server',
        'gateway',
        'loadbalancer',
        'pubsub',
        'postgres',
        'redis',
        'messagequeue',
      ];

      keywords.forEach((kw) => {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        });
      });

      const properties = [
        'requests',
        'endpoint',
        'allowedMethods',
        'allowedMethod',
        'body',
        'key',
        'label',
        'type',
        'valet',
        'acceptedEndpoints',
        'tcpConnectionsToPostgres',
        'capacity',
        'prefetchLimit',
        'table',
        'data',
        'strategy',
        'routes',
        'queueSize',
        'overflowBehavior',
      ];

      properties.forEach((prop) => {
        suggestions.push({
          label: prop,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `${prop}: `,
          range,
        });
      });

      // Snippets
      suggestions.push({
        label: 'client-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'client c1 {',
          '  label: "${1:Client}",',
          '  type: "Web Browser",',
          '  valet: false,',
          '  requests: [',
          '    {',
          '      endpoint: "/posts",',
          '      allowedMethods: ["GET", "POST"],',
          '      key: "rohan"',
          '    }',
          '  ]',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a Client node block',
        range,
      });

      suggestions.push({
        label: 'server-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'server s1 {',
          '  label: "${1:Post Server}",',
          '  capacity: 100,',
          '  tcpConnectionsToPostgres: 10,',
          '  acceptedEndpoints: [',
          '    {',
          '      endpoint: "/posts",',
          '      allowedMethod: ["GET", "POST"]',
          '    }',
          '  ]',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a Server node block',
        range,
      });

      suggestions.push({
        label: 'postgres-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'postgres db1 {',
          '  label: "${1:Postgres DB}",',
          '  table: "users",',
          '  data: [',
          '    { key: "rohan", val: "db_data" }',
          '  ]',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a Postgres DB node block',
        range,
      });

      suggestions.push({
        label: 'redis-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'redis r1 {',
          '  label: "${1:Redis Cache}",',
          '  data: [',
          '    { key: "rohan", val: "cached_data" }',
          '  ]',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a Redis Cache node block',
        range,
      });

      suggestions.push({
        label: 'gateway-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'gateway g1 {',
          '  label: "${1:API Gateway}",',
          '  strategy: "ROUND_ROBIN"',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define an API Gateway node block',
        range,
      });

      suggestions.push({
        label: 'loadbalancer-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'loadbalancer lb1 {',
          '  label: "${1:Load Balancer}",',
          '  strategy: "ROUND_ROBIN"',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a Load Balancer node block',
        range,
      });

      suggestions.push({
        label: 'messagequeue-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'messagequeue mq1 {',
          '  label: "${1:RabbitMQ Queue}",',
          '  processingType: "FIFO",',
          '  queueSize: 50,',
          '  overflowBehavior: "REJECT"',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a Message Queue node block',
        range,
      });

      suggestions.push({
        label: 'pubsub-node',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'pubsub ps1 {',
          '  label: "${1:Redis PubSub}",',
          '  topic: "user-events"',
          '}',
        ].join('\n'),
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a PubSub Event Bus node block',
        range,
      });

      suggestions.push({
        label: 'connect-arrow',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '${1:c1} -> ${2:s1}',
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Connect two nodes with arrow ->',
        range,
      });

      return { suggestions };
    },
  });
}
