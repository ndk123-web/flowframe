"use client";

import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { StreamLanguage } from "@codemirror/language";

// ─── FlowFrame Architecture DSL Syntax Lexer for CodeMirror 6 ─────────────────
const flowLanguage = StreamLanguage.define({
  token(stream) {
    // Skip whitespace
    if (stream.eatSpace()) return null;

    // Single-line comments: // ...
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }

    // Strings
    if (stream.match(/^"([^"\\]|\\.)*"/)) return "string";
    if (stream.match(/^'([^'\\]|\\.)*'/)) return "string";

    // Numbers (positive and negative coordinates)
    if (stream.match(/^-?\d+(\.\d+)?/)) return "number";

    // Operators & Arrows
    if (stream.match("->")) return "operator";
    if (stream.match(/^[:=,;]/)) return "punctuation";
    if (stream.match(/^[{}()[\]]/)) return "bracket";

    // Properties followed by colon (e.g. x:, y:, label:)
    if (stream.match(/^[a-zA-Z_]\w*(?=\s*:)/)) {
      return "propertyName";
    }

    // Keywords and DSL constructs
    const keywords = [
      "define",
      "connect",
      "CONNECT",
      "client",
      "server",
      "loadbalancer",
      "gateway",
      "pubsub",
      "postgres",
      "redis",
      "messagequeue",
      "CLIENT",
      "SERVER",
      "LOADBALANCER",
      "GATEWAY",
      "PUBSUB",
      "POSTGRES",
      "REDIS",
      "MESSAGEQUEUE",
      "true",
      "false",
    ];

    if (stream.match(/^[a-zA-Z_]\w*/)) {
      const current = stream.current();
      if (keywords.includes(current)) {
        return "keyword";
      }
      return "variableName";
    }

    stream.next();
    return null;
  },
});

import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
  snippetCompletion,
} from "@codemirror/autocomplete";

// ─── FlowFrame Architecture DSL IntelliSense Completion Source ─────────────────
function flowCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[\w\-.:]*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from).trimStart();

  // Extract all defined node identifiers from document (e.g. "define CLIENT c1")
  const docText = context.state.doc.toString();
  const definedNodes: string[] = [];
  const defineRegex = /\bdefine\s+[A-Za-z_]+\s+([A-Za-z0-9_]+)/gi;
  let match;
  while ((match = defineRegex.exec(docText)) !== null) {
    if (match[1] && !definedNodes.includes(match[1])) {
      definedNodes.push(match[1]);
    }
  }

  const options: Completion[] = [];

  // Contextual: Connecting defined nodes
  if (textBefore.startsWith("connect ") || textBefore.includes("->")) {
    definedNodes.forEach((nodeId) => {
      options.push({
        label: nodeId,
        type: "variable",
        detail: "Defined Node",
        info: `Connect request flows to/from node "${nodeId}"`,
        boost: 30,
      });
    });
  }

  // Contextual: Component types after "define "
  if (textBefore.startsWith("define ")) {
    const componentTypes = [
      { label: "CLIENT", detail: "Client (Ingress)", info: "Originates HTTP requests and client-side interactions in simulation." },
      { label: "SERVER", detail: "Backend Server", info: "Processes application requests with defined capacity and buffer queues." },
      { label: "LOADBALANCER", detail: "Load Balancer", info: "Distributes incoming traffic across downstream servers using Round Robin or Least Connections." },
      { label: "GATEWAY", detail: "API Gateway", info: "Ingress router routing incoming requests based on path prefixes." },
      { label: "REDIS", detail: "In-Memory Cache", info: "High-speed key-value cache layer delivering sub-ms responses." },
      { label: "POSTGRES", detail: "Relational DB", info: "Persistent SQL database processing storage reads and writes." },
      { label: "MESSAGEQUEUE", detail: "Message Queue", info: "Asynchronous task queue with FIFO processing and worker buffers." },
      { label: "PUBSUB", detail: "PubSub Broker", info: "Fan-out event broker delivering topics to decoupled subscriber workers." },
      { label: "STORAGE", detail: "Object Storage", info: "Blob/Cloud storage for assets and valet-key direct uploads." },
      { label: "DNS", detail: "DNS Resolver", info: "Domain name resolution mapping hostnames to upstream IP targets." },
      { label: "CDN", detail: "Content Delivery Network", info: "Edge caching network serving static assets close to users." },
    ];
    componentTypes.forEach((ct) => {
      options.push({
        label: ct.label,
        type: "class",
        detail: ct.detail,
        info: ct.info,
        boost: 25,
      });
    });
  }

  // Snippets with pre-structured properties
  const snippets: Completion[] = [
    snippetCompletion(
      'define CLIENT ${1:client1} {\n  x: ${2:80},\n  y: ${3:220},\n  label: "${4:Web Client}",\n  requests: [\n    { endpoint: "${5:/api/v1/posts}", allowedMethods: ["${6:GET}"], key: "${7:post:1}" }\n  ]\n}',
      {
        label: "define CLIENT",
        detail: "Snippet: Client Node",
        type: "snippet",
        info: "Define an HTTP client node that initiates simulation requests",
        boost: 20,
      }
    ),
    snippetCompletion(
      'define SERVER ${1:api_server} {\n  x: ${2:380},\n  y: ${3:220},\n  label: "${4:API Server}",\n  capacity: ${5:100},\n  acceptedEndpoints: [\n    { endpoint: "${6:/api/v1/posts}", allowedMethod: ["${7:GET}"] }\n  ]\n}',
      {
        label: "define SERVER",
        detail: "Snippet: Application Server",
        type: "snippet",
        info: "Define a backend server instance with capacity and endpoints",
        boost: 20,
      }
    ),
    snippetCompletion(
      'define LOADBALANCER ${1:lb1} {\n  x: ${2:380},\n  y: ${3:220},\n  label: "${4:Load Balancer}",\n  strategy: "${5:ROUND_ROBIN}"\n}',
      {
        label: "define LOADBALANCER",
        detail: "Snippet: Load Balancer",
        type: "snippet",
        info: "Define a traffic load balancer with ROUND_ROBIN or LEAST_CONNECTIONS",
        boost: 20,
      }
    ),
    snippetCompletion(
      'define GATEWAY ${1:gw1} {\n  x: ${2:380},\n  y: ${3:220},\n  label: "${4:API Gateway}",\n  strategy: "${5:ROUND_ROBIN}"\n}',
      {
        label: "define GATEWAY",
        detail: "Snippet: API Gateway",
        type: "snippet",
        info: "Define an API gateway ingress router",
        boost: 20,
      }
    ),
    snippetCompletion(
      'define REDIS ${1:cache1} {\n  x: ${2:680},\n  y: ${3:100},\n  label: "${4:Redis Cache}",\n  data: [\n    { key: "${5:post:1}", value: "${6:cached post data}" }\n  ]\n}',
      {
        label: "define REDIS",
        detail: "Snippet: Redis Cache",
        type: "snippet",
        info: "Define an in-memory key-value cache layer",
        boost: 20,
      }
    ),
    snippetCompletion(
      'define POSTGRES ${1:db1} {\n  x: ${2:680},\n  y: ${3:340},\n  label: "${4:PostgreSQL DB}",\n  data: [\n    { key: "${5:post:1}", value: "${6:stored database record}" }\n  ]\n}',
      {
        label: "define POSTGRES",
        detail: "Snippet: PostgreSQL DB",
        type: "snippet",
        info: "Define a persistent relational database store",
        boost: 20,
      }
    ),
    snippetCompletion(
      'define MESSAGEQUEUE ${1:mq1} {\n  x: ${2:680},\n  y: ${3:240},\n  label: "${4:Message Queue}",\n  queueSize: ${5:100},\n  processingType: "${6:FIFO}"\n}',
      {
        label: "define MESSAGEQUEUE",
        detail: "Snippet: Message Queue",
        type: "snippet",
        info: "Define an asynchronous FIFO message queue buffer",
        boost: 20,
      }
    ),
    snippetCompletion(
      'define PUBSUB ${1:ps1} {\n  x: ${2:380},\n  y: ${3:220},\n  label: "${4:PubSub Broker}",\n  topic: "${5:events.all}"\n}',
      {
        label: "define PUBSUB",
        detail: "Snippet: PubSub Broker",
        type: "snippet",
        info: "Define an event fanout publish-subscribe broker",
        boost: 20,
      }
    ),
    snippetCompletion(
      'connect ${1:source} -> ${2:target}',
      {
        label: "connect ->",
        detail: "Snippet: Connect nodes",
        type: "snippet",
        info: "Connect two nodes in the architecture topology",
        boost: 18,
      }
    ),
    snippetCompletion(
      'x: ${1:120},\ny: ${2:240},',
      {
        label: "x, y coordinates",
        detail: "Snippet: Canvas X & Y Position",
        type: "snippet",
        info: "Set explicit horizontal (x) and vertical (y) coordinates on the canvas",
        boost: 22,
      }
    ),
    snippetCompletion(
      'x: ${1:120},',
      {
        label: "x: coordinate",
        detail: "Snippet: X Axis (Canvas)",
        type: "snippet",
        info: "Set horizontal X axis coordinate on the canvas",
        boost: 21,
      }
    ),
    snippetCompletion(
      'y: ${1:240},',
      {
        label: "y: coordinate",
        detail: "Snippet: Y Axis (Canvas)",
        type: "snippet",
        info: "Set vertical Y axis coordinate on the canvas",
        boost: 21,
      }
    ),
    snippetCompletion(
      'position: {\n  x: ${1:120},\n  y: ${2:240}\n},',
      {
        label: "position: { x, y }",
        detail: "Snippet: Canvas Position Object",
        type: "snippet",
        info: "Set canvas position as a structured object with x and y coordinates",
        boost: 20,
      }
    ),
  ];
  snippets.forEach((s) => options.push(s));

  // DSL Property keywords
  const properties: Completion[] = [
    { label: "x:", type: "property", detail: "Number (X Axis)", info: "Horizontal X coordinate position on the canvas (e.g. x: 120)", boost: 25 },
    { label: "x", type: "property", detail: "X Axis (Canvas)", info: "Insert horizontal X coordinate (e.g. x: 120)", apply: "x: 120,", boost: 25 },
    { label: "y:", type: "property", detail: "Number (Y Axis)", info: "Vertical Y coordinate position on the canvas (e.g. y: 240)", boost: 25 },
    { label: "y", type: "property", detail: "Y Axis (Canvas)", info: "Insert vertical Y coordinate (e.g. y: 240)", apply: "y: 240,", boost: 25 },
    { label: "position:", type: "property", detail: "{ x, y } Object", info: "Canvas 2D coordinate object (e.g. position: { x: 120, y: 240 })", boost: 22 },
    { label: "xAxis:", type: "property", detail: "Number (Alias)", info: "Alternative alias for X axis canvas coordinate", boost: 16 },
    { label: "yAxis:", type: "property", detail: "Number (Alias)", info: "Alternative alias for Y axis canvas coordinate", boost: 16 },
    { label: "x_axis:", type: "property", detail: "Number (Alias)", info: "Alternative alias for X axis canvas coordinate", boost: 16 },
    { label: "y_axis:", type: "property", detail: "Number (Alias)", info: "Alternative alias for Y axis canvas coordinate", boost: 16 },
    { label: "label:", type: "property", detail: "Display string", info: 'Component display name (e.g. label: "Auth Server")', boost: 15 },
    { label: "capacity:", type: "property", detail: "Number", info: "Maximum requests processed concurrently before queueing", boost: 15 },
    { label: "requests:", type: "property", detail: "Array", info: "Client requests to fire during simulation", boost: 15 },
    { label: "acceptedEndpoints:", type: "property", detail: "Array", info: "Route endpoints handled by this application server", boost: 15 },
    { label: "endpoint:", type: "property", detail: "Path string", info: 'HTTP route URL path (e.g. "/api/v1/posts")', boost: 15 },
    { label: "allowedMethods:", type: "property", detail: "String Array", info: 'Allowed HTTP methods (e.g. ["GET", "POST"])', boost: 15 },
    { label: "allowedMethod:", type: "property", detail: "String Array", info: 'Accepted HTTP methods (e.g. ["GET", "POST"])', boost: 15 },
    { label: "strategy:", type: "property", detail: "Algorithm", info: 'Balancing strategy: "ROUND_ROBIN", "LEAST_CONNECTIONS", "IP_HASH"', boost: 15 },
    { label: "data:", type: "property", detail: "Array", info: "Initial stored key-value records", boost: 15 },
    { label: "queueSize:", type: "property", detail: "Number", info: "Max capacity of the buffer queue", boost: 15 },
    { label: "processingType:", type: "property", detail: '"FIFO"', info: 'Queue processing order (e.g. "FIFO")', boost: 15 },
    { label: "topic:", type: "property", detail: "String", info: 'PubSub broadcast topic channel name', boost: 15 },
    { label: "valet:", type: "property", detail: "Boolean", info: "Enable Valet Key pattern for direct storage upload", boost: 15 },
    { label: "ROUND_ROBIN", type: "constant", detail: "Strategy", info: "Sequentially cycles requests across healthy backend instances", boost: 12 },
    { label: "LEAST_CONNECTIONS", type: "constant", detail: "Strategy", info: "Routes requests to instance with lowest active load", boost: 12 },
    { label: "IP_HASH", type: "constant", detail: "Strategy", info: "Maps client IP address deterministically for session persistence", boost: 12 },
    { label: "FIFO", type: "constant", detail: "Discipline", info: "First In, First Out message processing", boost: 12 },
  ];
  properties.forEach((p) => options.push(p));

  return {
    from: word.from,
    options,
    validFor: /^[\w\-.:]*$/,
  };
}

interface FlowFrameCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: "light" | "dark";
  fontSize?: number;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
  onRun?: () => void;
}

export default function FlowFrameCodeEditor({
  value,
  onChange,
  theme = "dark",
  fontSize = 13,
  readOnly = false,
  minHeight = "100%",
  className = "",
  onRun,
}: FlowFrameCodeEditorProps) {
  const extensions = useMemo(() => {
    return [
      flowLanguage,
      autocompletion({
        override: [flowCompletionSource],
        activateOnTyping: true,
        maxRenderedOptions: 30,
        defaultKeymap: true,
      }),
    ];
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && onRun) {
      e.preventDefault();
      onRun();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className={`relative w-full h-full min-h-0 overflow-hidden font-mono text-[${fontSize}px] ${className}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <CodeMirror
        value={value}
        height={minHeight}
        theme={theme === "dark" ? oneDark : "light"}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false, // Managed through our custom extensions flowCompletionSource
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: false,
        }}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
