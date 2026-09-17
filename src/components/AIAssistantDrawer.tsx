"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import {
  FiCpu,
  FiTerminal,
  FiX,
  FiCheck,
  FiPlay,
  FiTrash2,
  FiCopy,
  FiArrowUp,
  FiArrowRight,
  FiMaximize2,
  FiMinimize2,
  FiSend,
  FiCode,
} from "react-icons/fi";
import { Sparkles } from "lucide-react";

export interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  nodeConfigs: Record<string, any>;
  onApplyDsl: (code: string, explanation: string) => void;
  onRunSimulation?: () => void;
  theme?: "light" | "dark";
  initialPrompt?: string;
  initialThink?: boolean;
  selectedNode?: Node | null;
  onSelectNode?: (nodeId: string | null) => void;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  dsl?: string;
  architectureTitle?: string;
  applied?: boolean;
  thoughtProcess?: string;
  thoughtTime?: string;
  targetComponent?: string;
}

export default function AIAssistantDrawer({
  isOpen,
  onClose,
  nodes,
  edges,
  nodeConfigs,
  onApplyDsl,
  onRunSimulation,
  initialPrompt,
  initialThink,
  selectedNode,
  onSelectNode,
}: AIAssistantDrawerProps) {
  // Mode: "create" (Generate architecture on canvas) or "ask" (Technical Q&A / Canvas explanation)
  const [mode, setMode] = useState<"create" | "ask">("create");
  const [input, setInput] = useState("");
  const [thinkEnabled, setThinkEnabled] = useState(initialThink ?? true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initialThink if changed from outside
  useEffect(() => {
    if (initialThink !== undefined) {
      setThinkEnabled(initialThink);
    }
  }, [initialThink]);

  // Prefill initial prompt if passed from dashboard or URL query
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim().length > 0) {
      setInput(initialPrompt);
      setMode("create");
    }
  }, [isOpen, initialPrompt]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating, isOpen]);

  // Focus input on drawer open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const [isExpanded, setIsExpanded] = useState(false);
  const hasUserChat = messages.length > 0;

  const starterQuestions = useMemo(() => {
    if (selectedNode) {
      const label = (selectedNode.data?.label as string) || selectedNode.id;
      return [
        {
          label: `How do I optimize or scale ${label}?`,
          prompt: `How can we optimize and scale ${label} in this architecture?`,
          mode: "ask" as const,
        },
        {
          label: `Explain role and failure dynamics of ${label}?`,
          prompt: `Explain role and failure dynamics of ${label}`,
          mode: "ask" as const,
        },
        {
          label: `What happens if ${label} times out or fails?`,
          prompt: `What happens if ${label} fails or times out?`,
          mode: "ask" as const,
        },
        {
          label: `How does request and response flow through ${label}?`,
          prompt: `Detail the request and response flow through ${label}`,
          mode: "ask" as const,
        },
      ];
    }

    return [
      {
        label: "Explain current canvas architecture & data flow?",
        prompt: "Explain current canvas architecture and data flow",
        mode: "ask" as const,
      },
      {
        label: "Validate topology bottlenecks & unrouted nodes?",
        prompt: "Validate architecture bottlenecks and unrouted nodes",
        mode: "ask" as const,
      },
      {
        label: "How do I build a Cache-Aside pattern with Redis?",
        prompt: "Build a Cache-Aside pattern with Redis and PostgreSQL",
        mode: "create" as const,
      },
      {
        label: "How do load balancing and failover work here?",
        prompt: "Create a Round-Robin Load-Balanced Cluster",
        mode: "create" as const,
      },
    ];
  }, [selectedNode]);

  if (!isOpen) return null;

  // Clear conversation
  const handleClearChat = () => {
    setMessages([]);
  };

  // Quick action chip click
  const handleQuickAction = (actionPrompt: string, targetMode: "create" | "ask") => {
    setMode(targetMode);
    setInput(actionPrompt);
    setTimeout(() => {
      submitPrompt(actionPrompt, targetMode);
    }, 50);
  };

  // Submit prompt logic
  const submitPrompt = (userPromptText?: string, forcedMode?: "create" | "ask") => {
    const textToSubmit = (userPromptText ?? input).trim();
    if (!textToSubmit) return;

    const currentMode = forcedMode ?? mode;
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSubmit,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    // Generate assistant response
    setTimeout(() => {
      const lower = textToSubmit.toLowerCase();

      if (currentMode === "create") {
        // Architecture Generation Engine
        let generatedDsl = "";
        let title = "";
        let explanation = "";

        if (
          lower.includes("load") ||
          lower.includes("round robin") ||
          lower.includes("balance") ||
          lower.includes("cluster")
        ) {
          title = "Load-Balanced Cluster";
          explanation =
            "Round-Robin Load Balancer distributing incoming traffic across multiple application servers to eliminate single points of failure.";
          generatedDsl = `// High Availability Load-Balanced Cluster
define CLIENT client_node {
  x: 80,
  y: 240,
  label: "Web Client",
  requests: [
    { endpoint: "/api/v1/orders", allowedMethods: ["GET", "POST"], key: "order:550" }
  ]
}

define LOADBALANCER edge_lb {
  x: 380,
  y: 240,
  label: "Round-Robin LB",
  strategy: "ROUND_ROBIN"
}

define SERVER app_server_1 {
  x: 680,
  y: 120,
  label: "App Server Alpha",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/api/v1/orders", allowedMethod: ["GET", "POST"] }
  ]
}

define SERVER app_server_2 {
  x: 680,
  y: 360,
  label: "App Server Beta",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/api/v1/orders", allowedMethod: ["GET", "POST"] }
  ]
}

define POSTGRES shared_db {
  x: 960,
  y: 240,
  label: "Primary Database",
  data: [
    { key: "order:550", value: "Order record #550" }
  ]
}

connect client_node -> edge_lb
connect edge_lb -> app_server_1
connect edge_lb -> app_server_2
connect app_server_1 -> shared_db
connect app_server_2 -> shared_db
`;
        } else if (
          lower.includes("queue") ||
          lower.includes("rabbit") ||
          lower.includes("sqs") ||
          lower.includes("worker") ||
          lower.includes("kafka")
        ) {
          title = "Asynchronous Message Queue & Worker";
          explanation =
            "Decoupled asynchronous processing using a Message Queue buffer to absorb bursts and feed downstream workers.";
          generatedDsl = `// Asynchronous Message Queue Processing
define CLIENT client_node {
  x: 80,
  y: 240,
  label: "Web Client",
  requests: [
    { endpoint: "/api/v1/tasks", allowedMethods: ["POST"], key: "task:88" }
  ]
}

define SERVER api_gateway {
  x: 380,
  y: 240,
  label: "Ingestion API",
  capacity: 120,
  acceptedEndpoints: [
    { endpoint: "/api/v1/tasks", allowedMethod: ["POST"] }
  ]
}

define MESSAGEQUEUE task_queue {
  x: 680,
  y: 240,
  label: "Message Queue",
  queueSize: 100,
  processingType: "FIFO"
}

define SERVER background_worker {
  x: 980,
  y: 240,
  label: "Worker Instance",
  capacity: 60,
  prefetchLimit: 1
}

define POSTGRES analytics_db {
  x: 1280,
  y: 240,
  label: "PostgreSQL Database",
  data: [
    { key: "task:88", value: "processed task data" }
  ]
}

connect client_node -> api_gateway
connect api_gateway -> task_queue
connect task_queue -> background_worker
connect background_worker -> analytics_db
`;
        } else if (
          lower.includes("pubsub") ||
          lower.includes("fanout") ||
          lower.includes("sns") ||
          lower.includes("broadcast") ||
          lower.includes("event")
        ) {
          title = "PubSub Event Fanout Architecture";
          explanation =
            "One-to-many publish-subscribe broker delivering events to decoupled notification and analytics subscribers simultaneously.";
          generatedDsl = `// PubSub Event Broadcast Fanout
define CLIENT client_node {
  x: 80,
  y: 240,
  label: "Web Client",
  requests: [
    { endpoint: "/events/orders", allowedMethods: ["POST"], key: "event:order" }
  ]
}

define SERVER order_service {
  x: 340,
  y: 240,
  label: "Order Service",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/events/orders", allowedMethod: ["POST"] }
  ]
}

define PUBSUB event_broker {
  x: 600,
  y: 240,
  label: "PubSub Broker",
  topic: "order.created"
}

define SERVER notification_worker {
  x: 860,
  y: 120,
  label: "Notification Service",
  capacity: 50
}

define SERVER analytics_worker {
  x: 860,
  y: 360,
  label: "Analytics Service",
  capacity: 50
}

connect client_node -> order_service
connect order_service -> event_broker
connect event_broker -> notification_worker
connect event_broker -> analytics_worker
`;
        } else if (
          lower.includes("gateway") ||
          lower.includes("microservice") ||
          lower.includes("api gw")
        ) {
          title = "API Gateway Microservices Architecture";
          explanation =
            "Central API Gateway providing route routing to isolated User and Order microservices backed by shared PostgreSQL persistence.";
          generatedDsl = `// API Gateway Microservices
define CLIENT web_apps {
  x: 80,
  y: 240,
  label: "Client App",
  requests: [
    { endpoint: "/api/users", allowedMethods: ["GET"], key: "user:1" },
    { endpoint: "/api/orders", allowedMethods: ["POST"], key: "order:1" }
  ]
}

define GATEWAY api_gw {
  x: 360,
  y: 240,
  label: "API Gateway",
  strategy: "ROUND_ROBIN"
}

define SERVER user_service {
  x: 660,
  y: 120,
  label: "User Service",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/api/users", allowedMethod: ["GET"] }
  ]
}

define SERVER order_service {
  x: 660,
  y: 360,
  label: "Order Service",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/api/orders", allowedMethod: ["POST"] }
  ]
}

define POSTGRES main_db {
  x: 940,
  y: 240,
  label: "Shared Postgres DB",
  data: [
    { key: "user:1", value: "User profile #1" },
    { key: "order:1", value: "Order summary #1" }
  ]
}

connect web_apps -> api_gw
connect api_gw -> user_service
connect api_gw -> order_service
connect user_service -> main_db
connect order_service -> main_db
`;
        } else if (
          lower.includes("valet") ||
          lower.includes("s3") ||
          lower.includes("storage") ||
          lower.includes("upload")
        ) {
          title = "Valet Key Direct Storage Upload";
          explanation =
            "Direct client-to-cloud upload pattern reducing server compute and bandwidth pressure by issuing pre-signed tokens.";
          generatedDsl = `// Valet Key Direct Upload Architecture
define CLIENT browser_client {
  x: 80,
  y: 240,
  label: "Browser Client",
  valet: true,
  requests: [
    { endpoint: "/upload/sign", allowedMethods: ["GET"], key: "file:image.png" }
  ]
}

define SERVER token_issuer {
  x: 380,
  y: 140,
  label: "Token Issuer Server",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/upload/sign", allowedMethod: ["GET"] }
  ]
}

define POSTGRES storage_blob {
  x: 680,
  y: 240,
  label: "Cloud Storage Bucket",
  data: [
    { key: "file:image.png", value: "uploaded media binary" }
  ]
}

connect browser_client -> token_issuer
connect browser_client -> storage_blob
`;
        } else {
          // Default: Cache Aside Pattern
          title = "Cache Aside Architecture";
          explanation =
            "Standard high-performance cache-aside pattern routing reads through Redis cache with PostgreSQL database fallback.";
          generatedDsl = `// Cache Aside Architecture
define CLIENT web_client {
  x: 80,
  y: 220,
  label: "Web Client",
  requests: [
    { endpoint: "/api/v1/posts", allowedMethods: ["GET", "POST"], key: "post:1" }
  ]
}

define SERVER api_server {
  x: 380,
  y: 220,
  label: "API Server",
  capacity: 100,
  tcpConnectionsToPostgres: 5,
  acceptedEndpoints: [
    { endpoint: "/api/v1/posts", allowedMethod: ["GET", "POST"] }
  ]
}

define REDIS redis_cache {
  x: 680,
  y: 100,
  label: "Redis Cache",
  data: [
    { key: "post:1", value: "cached post data" }
  ]
}

define POSTGRES postgres_db {
  x: 680,
  y: 340,
  label: "PostgreSQL DB",
  table: "posts",
  data: [
    { key: "post:1", value: "persistent post record" }
  ]
}

connect web_client -> api_server
connect api_server -> redis_cache
connect api_server -> postgres_db
`;
        }

        let thoughtProcess: string | undefined;
        let thoughtTime: string | undefined;

        if (thinkEnabled) {
          thoughtTime = "2.1s";
          thoughtProcess = `Architectural Analysis & Design Plan:
1. Concurrency & Buffers: Calculated ingress load against downstream compute capacity. Sized queue boundaries.
2. Fault Tolerance: Identified single points of failure. Applied redundant paths and failover routes.
3. Caching & Persistence: Configured cache-aside pattern with TTL invalidation to prevent stale reads and protect database connections.
4. Canvas Positioning: Allocated explicit (x, y) coordinates ensuring clean horizontal flow and zero node collisions.`;
        }

        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          sender: "assistant",
          text: `Generated **${title}** architecture definition:\n\n${explanation}`,
          dsl: generatedDsl,
          architectureTitle: title,
          thoughtProcess,
          thoughtTime,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Technical Architecture Analysis & Q&A
        let responseText = "";

        const clientCount = nodes.filter((n) => n.data?.type === "client").length;
        const serverCount = nodes.filter((n) => n.data?.type === "server").length;
        const dbCount = nodes.filter((n) => n.data?.type === "postgres").length;
        const cacheCount = nodes.filter((n) => n.data?.type === "redis").length;
        const queueCount = nodes.filter(
          (n) => n.data?.type === "message-queue" || n.data?.type === "messagequeue"
        ).length;
        const lbCount = nodes.filter((n) => n.data?.type === "loadbalancer").length;

        // Contextual: question about selected component
        if (
          selectedNode &&
          (lower.includes("selected") ||
            lower.includes("this node") ||
            lower.includes("this component") ||
            lower.includes(selectedNode.id.toLowerCase()) ||
            (typeof selectedNode.data?.label === "string" &&
              lower.includes(selectedNode.data.label.toLowerCase())))
        ) {
          const inEdges = edges.filter((e) => e.target === selectedNode.id);
          const outEdges = edges.filter((e) => e.source === selectedNode.id);
          const roleMap: Record<string, string> = {
            client: "HTTP request originator and payload generator",
            server: "Compute, business logic, and database connection pooling",
            redis: "In-memory sub-millisecond cache layer (Cache-Aside)",
            postgres: "Persistent relational ACID storage",
            loadbalancer: "Traffic distribution using Round Robin or Least Connections",
            gateway: "API ingress routing based on path prefixes",
            "message-queue": "Asynchronous FIFO buffer absorbing traffic spikes",
            pubsub: "Event fanout broker delivering to multiple topic subscribers",
          };

          responseText =
            `**Component Context: ${selectedNode.data?.label || selectedNode.id}** (${selectedNode.data?.type})\n\n` +
            `- **Role**: ${roleMap[selectedNode.data?.type as string] || "Distributed node"}\n` +
            `- **Upstream Sources**: ${inEdges.length > 0 ? inEdges.map((e) => e.source).join(", ") : "None (Ingress root)"}\n` +
            `- **Downstream Targets**: ${outEdges.length > 0 ? outEdges.map((e) => e.target).join(", ") : "None (Terminal node)"}\n\n` +
            (lower.includes("fail") || lower.includes("down")
              ? `**Failure Impact**: If this node is partitioned or terminated, upstream requests will fail unless redundant instances or circuit breaker fallbacks are present.`
              : `**Performance**: Incoming requests to this node are processed according to its configured capacity and latency parameters.`);
        } else if (
          lower.includes("canvas") ||
          lower.includes("current") ||
          lower.includes("diagram") ||
          lower.includes("my architecture") ||
          lower.includes("understand") ||
          lower.includes("breakdown")
        ) {
          responseText =
            `**Active Topology Breakdown:**\n\n` +
            `- **Total Components**: ${nodes.length}\n` +
            `  - Clients: ${clientCount}\n` +
            `  - Application Servers: ${serverCount}\n` +
            `  - Load Balancers: ${lbCount}\n` +
            `  - Caches (Redis): ${cacheCount}\n` +
            `  - Databases (Postgres): ${dbCount}\n` +
            `  - Message Queues: ${queueCount}\n` +
            `- **Total Connections**: ${edges.length}\n\n` +
            (nodes.length === 0
              ? "Your canvas is currently empty. Use the quick action below to generate a starter cluster or cache-aside topology."
              : `Ingress traffic originates from ${clientCount} client(s). Packets route downstream across configured edges. You can step through execution using the simulation toolbar.`);
        } else if (lower.includes("fix") || lower.includes("bottleneck") || lower.includes("validate")) {
          const disconnectedNodes = nodes.filter(
            (n) => !edges.some((e) => e.source === n.id || e.target === n.id)
          );
          if (nodes.length === 0) {
            responseText =
              "**Topology Validation:**\n\nNo components detected on canvas. Place nodes or generate an architecture to validate.";
          } else if (disconnectedNodes.length > 0) {
            responseText =
              `**Validation Advisory:**\n\nFound **${disconnectedNodes.length}** disconnected component(s):\n` +
              disconnectedNodes
                .map((n) => `- **${(n.data?.label as string) || n.id}** (${n.data?.type})`)
                .join("\n") +
              "\n\nConnect these nodes to active ingress or downstream services so simulated packets can reach them.";
          } else if (serverCount > 1 && lbCount === 0) {
            responseText = `**Architecture Recommendation:**\n\nYou have **${serverCount}** application servers without an upstream Load Balancer or API Gateway. Add a Load Balancer with round-robin routing to distribute traffic evenly across instances.`;
          } else {
            responseText = `**Architecture Health Check:**\n\nAll ${nodes.length} nodes are connected with ${edges.length} edges. Component routes and endpoints are structured correctly. Run the simulation to check packet latency.`;
          }
        } else if (lower.includes("simulate") || lower.includes("flow") || lower.includes("packet")) {
          responseText =
            `**Simulation Execution Dynamics:**\n\n` +
            `1. **Ingress**: Client initiates HTTP requests with defined endpoints and payload keys.\n` +
            `2. **Hop Evaluation**: Load Balancers pick healthy target instances; Caches check key hits vs misses.\n` +
            `3. **State Updates**: Updates persist to PostgreSQL; async tasks queue up in Message Queue buffers.\n` +
            `4. **Completion**: Responses return along request paths back to initiating clients.`;
        } else {
          responseText =
            `**Analysis of "${textToSubmit}":**\n\n` +
            `In FlowFrame, distributed components interact via explicit edges. ` +
            `To simulate this behavior, you can define nodes in DSL or drag components from the sidebar onto the canvas. ` +
            `Switch to 'Create' mode if you want me to generate complete architecture definitions.`;
        }

        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          sender: "assistant",
          text: responseText,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }

      setIsGenerating(false);
    }, 450);
  };

  const handleApplyArchitecture = (msgId: string, dsl: string, explanation: string) => {
    onApplyDsl(dsl, explanation);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const handleCopyDsl = (msgId: string, dsl: string) => {
    navigator.clipboard.writeText(dsl);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-full transition-all duration-200 ${
        isExpanded
          ? "sm:w-[540px] md:w-[600px] lg:w-[660px]"
          : "sm:w-[380px] md:w-[360px] lg:w-[390px]"
      } md:static md:z-20 md:h-full md:max-h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shrink-0 select-text overflow-hidden shadow-xl md:shadow-none`}
      data-testid="relay-assistant-panel"
      aria-label="Relay Architecture Assistant"
    >
      {/* ── 1. Top Header Matching the User's Screenshot ── */}
      <div className="h-14 px-3.5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with glowing active indicator */}
          <div className="relative size-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <Sparkles className="size-4" />
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500 border-2 border-[var(--surface)]"
              title="Relay online"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground tracking-tight truncate">
                Relay
              </span>
              {selectedNode && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-[90px]">
                  {(selectedNode.data?.label as string) || selectedNode.id}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              Online · Answers from FlowFrame...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--bg-elevated)] transition cursor-pointer"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <FiTrash2 className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title={isExpanded ? "Collapse width" : "Expand width"}
            aria-label={isExpanded ? "Collapse width" : "Expand width"}
          >
            {isExpanded ? (
              <FiMinimize2 className="size-3.5" />
            ) : (
              <FiMaximize2 className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title="Close Assistant (Esc)"
            aria-label="Close Assistant"
          >
            <FiX className="size-4" />
          </button>
        </div>
      </div>

      {/* ── 2. Conversation Stream & Main Body Suggestions ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {!hasUserChat ? (
          /* Main body question suggestions matching the user's uploaded image */
          <div className="max-w-md mx-auto py-4 space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5 select-none">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Ask Relay about your Architecture
              </h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Get answers from the active canvas topology, with failure dynamics.
              </p>
            </div>

            {/* Vertical Stacked Question Cards with right arrows */}
            <div className="space-y-2.5">
              {starterQuestions.map((q) => (
                <button
                  type="button"
                  key={q.prompt}
                  disabled={isGenerating}
                  onClick={() => handleQuickAction(q.prompt, q.mode)}
                  className="w-full p-3.5 px-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/70 hover:bg-[var(--bg-elevated)] hover:border-primary/50 text-left flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span className="text-xs sm:text-[13px] font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                    {q.label}
                  </span>
                  <FiArrowRight className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className="space-y-1.5">
            {m.sender === "user" ? (
              /* User Turn */
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                  <span>You</span>
                </div>
                <div className="text-xs text-foreground font-normal leading-relaxed pl-2.5 border-l-2 border-border/80 whitespace-pre-wrap">
                  {m.text}
                </div>
              </div>
            ) : (
              /* Assistant Turn */
              <div className="space-y-2 pt-2 border-t border-[var(--border)]/50">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-primary select-none">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary" />
                    <span>Relay</span>
                  </div>
                  {m.thoughtTime && (
                    <span className="text-muted-foreground/70 lowercase font-normal">
                      reasoned in {m.thoughtTime}
                    </span>
                  )}
                </div>

                {/* Collapsible Extended Reasoning / Thinking Process */}
                {m.thoughtProcess && (
                  <details className="rounded border border-[var(--border)] bg-[var(--bg-elevated)]/50 text-[11px] font-mono group overflow-hidden">
                    <summary className="px-2.5 py-1.5 cursor-pointer text-foreground/80 font-semibold flex items-center justify-between select-none hover:bg-[var(--bg-elevated)] transition">
                      <span className="flex items-center gap-1.5">
                        <FiCpu className="size-3 text-primary animate-pulse" />
                        <span>Thought for {m.thoughtTime || "2.1s"} (Reasoning)</span>
                      </span>
                      <span className="text-[9px] opacity-70 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="px-3 py-2 text-muted-foreground border-t border-[var(--border)]/60 whitespace-pre-wrap leading-relaxed text-[10.5px]">
                      {m.thoughtProcess}
                    </div>
                  </details>
                )}

                {/* Response Text */}
                <div className="text-xs text-foreground leading-relaxed pl-2.5 border-l-2 border-primary/40 space-y-2">
                  <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                  {/* FlowFrame DSL Code Block */}
                  {m.dsl && (
                    <div className="rounded-md border border-[var(--border)] bg-[#121215] overflow-hidden my-2">
                      <div className="px-2.5 py-1 border-b border-[var(--border)] bg-[#18181b] flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <FiCode className="size-3 text-primary" />
                          <span>{m.architectureTitle || "FlowFrame DSL"}</span>
                        </span>
                        <span>dsl</span>
                      </div>

                      <pre className="p-2.5 text-[10.5px] font-mono leading-relaxed text-[#d4d4d8] overflow-x-auto max-h-52 scrollbar-thin">
                        <code>{m.dsl}</code>
                      </pre>

                      <div className="p-1.5 border-t border-[var(--border)] bg-[#18181b] flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopyDsl(m.id, m.dsl!)}
                          className="px-2 py-1 rounded text-[11px] font-mono font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-foreground flex items-center gap-1 cursor-pointer transition"
                          title="Copy DSL Code"
                        >
                          <FiCopy className="size-3" />
                          <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleApplyArchitecture(
                              m.id,
                              m.dsl!,
                              `${m.architectureTitle || "Architecture"} applied to canvas`
                            )
                          }
                          className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${
                            m.applied
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          <FiCheck className="size-3" />
                          <span>{m.applied ? "Applied" : "Apply to Canvas"}</span>
                        </button>

                        {onRunSimulation && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!m.applied) {
                                handleApplyArchitecture(
                                  m.id,
                                  m.dsl!,
                                  `${m.architectureTitle || "Architecture"} applied to canvas`
                                );
                              }
                              setTimeout(() => onRunSimulation(), 250);
                            }}
                            className="px-2 py-1 rounded text-[11px] font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-foreground flex items-center gap-1 cursor-pointer transition"
                            title="Run Simulation"
                          >
                            <FiPlay className="size-3 text-primary fill-current" />
                            <span>Run</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Subtle Developer Loading State */}
        {isGenerating && (
          <div className="pt-2 border-t border-[var(--border)]/50 space-y-1.5 animate-in fade-in duration-150 select-none">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3 animate-pulse text-primary" />
              <span>Relay</span>
            </div>
            <div className="flex items-center gap-2 pl-2.5 text-xs text-muted-foreground font-mono">
              <div className="size-3 rounded-full border border-primary/40 border-t-primary animate-spin shrink-0" />
              <span>
                {mode === "create" ? "Synthesizing topology…" : "Analyzing architecture…"}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 5. Fixed Developer Composer (Sticky Bottom) ── */}
      <div className="p-2.5 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 space-y-2">
        {/* Mode Selector Bar */}
        <div className="flex items-center justify-between gap-1.5 select-none">
          <div className="flex items-center p-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px]">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setMode("create")}
              className={`px-2.5 py-0.5 rounded text-[10.5px] font-medium transition cursor-pointer ${
                mode === "create"
                  ? "bg-primary/10 text-primary border border-primary/30 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Create
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setMode("ask")}
              className={`px-2.5 py-0.5 rounded text-[10.5px] font-medium transition cursor-pointer ${
                mode === "ask"
                  ? "bg-primary/10 text-primary border border-primary/30 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Ask & Analyze
            </button>
          </div>
        </div>

        {/* Input Textarea Form */}
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-2.5 space-y-1.5 shadow-2xs">
          <textarea
            ref={textareaRef}
            rows={2}
            disabled={isGenerating}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isGenerating && input.trim()) {
                  submitPrompt();
                }
              }
            }}
            placeholder={
              isGenerating
                ? "Analyzing architecture…"
                : mode === "create"
                ? selectedNode
                  ? `Describe change to ${(selectedNode.data?.label as string) || selectedNode.id}…`
                  : "Describe topology to generate (e.g. Add Redis cache to server)…"
                : selectedNode
                ? `Ask Relay about ${(selectedNode.data?.label as string) || selectedNode.id}…`
                : "Ask Relay..."
            }
            className="w-full bg-transparent resize-none text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none leading-relaxed max-h-32 px-1"
          />

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/40 text-[10.5px] font-mono text-muted-foreground select-none">
            <span className="truncate text-muted-foreground/50 text-[10px]">
              Enter to send · Shift+Enter newline
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Think Toggle immediately to the left of Send */}
              <button
                type="button"
                onClick={() => setThinkEnabled(!thinkEnabled)}
                className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] font-medium transition cursor-pointer flex items-center gap-1 select-none ${
                  thinkEnabled
                    ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-2xs ring-1 ring-primary/20"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
                title={thinkEnabled ? "Extended Architecture Reasoning: ON" : "Extended Architecture Reasoning: OFF"}
              >
                <FiCpu className={`size-3 ${thinkEnabled ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                <span>Think</span>
                <span
                  className={`size-1 rounded-full ${
                    thinkEnabled ? "bg-primary" : "bg-muted-foreground/50"
                  }`}
                />
              </button>

              {/* Send Button matching blue theme */}
              <button
                type="button"
                disabled={!input.trim() || isGenerating}
                onClick={() => submitPrompt()}
                className="size-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 font-bold"
                title="Send message"
                aria-label="Send message"
              >
                {isGenerating ? (
                  <div className="size-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                ) : (
                  <FiSend className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer below composer matching screenshot */}
        <p className="text-[10px] text-muted-foreground/60 text-center select-none pt-0.5">
          AI can make mistakes. Verify important details in canvas topology.
        </p>
      </div>
    </aside>
  );
}
