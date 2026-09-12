"use client";

import React, { useState, useRef, useEffect } from "react";
import type { Node, Edge } from "@xyflow/react";
import {
  FiCpu,
  FiX,
  FiSend,
  FiPlus,
  FiHelpCircle,
  FiCheck,
  FiPlay,
  FiTrash2,
  FiLayers,
  FiCopy,
  FiAlertTriangle,
  FiActivity,
  FiSliders,
  FiCheckCircle,
} from "react-icons/fi";

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  nodeConfigs: Record<string, any>;
  onApplyDsl: (code: string, explanation: string) => void;
  onRunSimulation?: () => void;
  theme?: "light" | "dark";
  initialPrompt?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  dsl?: string;
  architectureTitle?: string;
  applied?: boolean;
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
}: AIAssistantDrawerProps) {
  // Mode: "create" (Generate architecture on canvas) or "ask" (Technical Q&A / Canvas explanation)
  const [mode, setMode] = useState<"create" | "ask">("create");
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Architecture Assistant ready. Ask about your current canvas topology, generate distributed systems architectures, or explain simulated request flows.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prefill initial prompt if passed from dashboard quick AI
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
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "Conversation cleared. Context is active for the current canvas topology.",
      },
    ]);
  };

  // Quick action click
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

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
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
  label: "Web Client",
  requests: [
    { endpoint: "/api/v1/orders", allowedMethods: ["GET", "POST"], key: "order:550" }
  ]
}

define LOADBALANCER edge_lb {
  label: "Round-Robin LB",
  strategy: "ROUND_ROBIN"
}

define SERVER app_server_1 {
  label: "App Server Alpha",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/api/v1/orders", allowedMethod: ["GET", "POST"] }
  ]
}

define SERVER app_server_2 {
  label: "App Server Beta",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/api/v1/orders", allowedMethod: ["GET", "POST"] }
  ]
}

define POSTGRES shared_db {
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
  label: "Web Client",
  requests: [
    { endpoint: "/api/v1/tasks", allowedMethods: ["POST"], key: "task:88" }
  ]
}

define SERVER api_gateway {
  label: "Ingestion API",
  capacity: 120,
  acceptedEndpoints: [
    { endpoint: "/api/v1/tasks", allowedMethod: ["POST"] }
  ]
}

define MESSAGEQUEUE task_queue {
  label: "Message Queue",
  queueSize: 100,
  processingType: "FIFO"
}

define SERVER background_worker {
  label: "Worker Instance",
  capacity: 60,
  prefetchLimit: 1
}

define POSTGRES analytics_db {
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
  label: "Web Client",
  requests: [
    { endpoint: "/events/orders", allowedMethods: ["POST"], key: "event:order" }
  ]
}

define SERVER order_service {
  label: "Order Service",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/events/orders", allowedMethod: ["POST"] }
  ]
}

define PUBSUB event_broker {
  label: "PubSub Broker",
  topic: "order.created"
}

define SERVER notification_worker {
  label: "Notification Service",
  capacity: 50
}

define SERVER analytics_worker {
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
  label: "Client App",
  requests: [
    { endpoint: "/api/users", allowedMethods: ["GET"], key: "user:1" },
    { endpoint: "/api/orders", allowedMethods: ["POST"], key: "order:1" }
  ]
}

define GATEWAY api_gw {
  label: "API Gateway",
  strategy: "ROUND_ROBIN"
}

define SERVER user_service {
  label: "User Service",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/api/users", allowedMethod: ["GET"] }
  ]
}

define SERVER order_service {
  label: "Order Service",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/api/orders", allowedMethod: ["POST"] }
  ]
}

define POSTGRES main_db {
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
  label: "Browser Client",
  valet: true,
  requests: [
    { endpoint: "/upload/sign", allowedMethods: ["GET"], key: "file:image.png" }
  ]
}

define SERVER token_issuer {
  label: "Token Issuer Server",
  capacity: 80,
  acceptedEndpoints: [
    { endpoint: "/upload/sign", allowedMethod: ["GET"] }
  ]
}

define SERVER storage_service {
  label: "Cloud Storage Server",
  capacity: 100,
  acceptedEndpoints: [
    { endpoint: "/upload/sign", allowedMethod: ["GET"] }
  ]
}

connect browser_client -> token_issuer
connect token_issuer -> storage_service
connect browser_client -> storage_service
`;
        } else {
          // Default: Cache-Aside with Redis and PostgreSQL
          title = "Cache-Aside Architecture";
          explanation =
            "Cache-aside pattern: in-memory Redis layer handles reads to reduce database query latency and prevent read spikes.";
          generatedDsl = `// Cache-Aside Architecture Template
define CLIENT web_client {
  label: "Web Client",
  requests: [
    { endpoint: "/api/v1/users", allowedMethods: ["GET", "POST"], key: "user:101" }
  ]
}

define SERVER api_server {
  label: "API Server",
  capacity: 150,
  acceptedEndpoints: [
    { endpoint: "/api/v1/users", allowedMethod: ["GET", "POST"] }
  ]
}

define REDIS redis_cache {
  label: "Redis Cache Layer",
  data: [
    { key: "user:101", value: "cached user profile payload" }
  ]
}

define POSTGRES postgres_db {
  label: "PostgreSQL Database",
  data: [
    { key: "user:101", value: "db record: user 101" }
  ]
}

connect web_client -> api_server
connect api_server -> redis_cache
connect api_server -> postgres_db
`;
        }

        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          sender: "assistant",
          text: `Generated **${title}** architecture definition:\n\n${explanation}`,
          dsl: generatedDsl,
          architectureTitle: title,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Technical Architecture Analysis & Q&A
        let responseText = "";

        const clientCount = nodes.filter((n) => n.data.type === "client").length;
        const serverCount = nodes.filter((n) => n.data.type === "server").length;
        const dbCount = nodes.filter((n) => n.data.type === "postgres").length;
        const cacheCount = nodes.filter((n) => n.data.type === "redis").length;
        const queueCount = nodes.filter(
          (n) => n.data.type === "message-queue" || n.data.type === "messagequeue"
        ).length;
        const lbCount = nodes.filter((n) => n.data.type === "loadbalancer").length;

        if (
          lower.includes("canvas") ||
          lower.includes("current") ||
          lower.includes("diagram") ||
          lower.includes("my architecture") ||
          lower.includes("understand") ||
          lower.includes("breakdown")
        ) {
          responseText = `**Active Topology Breakdown:**\n\n` +
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
            responseText = "**Topology Validation:**\n\nNo components detected on canvas. Place nodes or generate an architecture to validate.";
          } else if (disconnectedNodes.length > 0) {
            responseText = `**Validation Advisory:**\n\nFound **${disconnectedNodes.length}** disconnected component(s):\n` +
              disconnectedNodes.map((n) => `- **${(n.data.label as string) || n.id}** (${n.data.type})`).join("\n") +
              "\n\nConnect these nodes to active ingress or downstream services so simulated packets can reach them.";
          } else if (serverCount > 1 && lbCount === 0) {
            responseText = `**Architecture Recommendation:**\n\nYou have **${serverCount}** application servers without an upstream Load Balancer or API Gateway. Add a Load Balancer with round-robin routing to distribute traffic evenly across instances.`;
          } else {
            responseText = `**Architecture Health Check:**\n\nAll ${nodes.length} nodes are connected with ${edges.length} edges. Component routes and endpoints are structured correctly. Run the simulation to check packet latency.`;
          }
        } else if (lower.includes("simulate") || lower.includes("flow") || lower.includes("packet")) {
          responseText = `**Simulation Execution Dynamics:**\n\n` +
            `1. **Ingress**: Client initiates HTTP requests with defined endpoints and payload keys.\n` +
            `2. **Hop Evaluation**: Load Balancers pick healthy target instances; Caches check key hits (1-frame response) vs misses.\n` +
            `3. **State Mutation**: Databases process reads/writes deterministically.\n` +
            `4. **Inspection**: Click the play/pause button or step through frame-by-frame in the top toolbar to trace packet progression.`;
        } else if (lower.includes("redis") || lower.includes("cache")) {
          responseText = "**Cache-Aside Pattern Specification:**\n\nIn-memory key-value storage delivers sub-millisecond retrieval. Application servers query Redis first. On a cache miss, the server falls back to PostgreSQL and populates Redis for future requests.";
        } else if (lower.includes("load balancer") || lower.includes("round robin")) {
          responseText = "**Load Balancing Algorithms:**\n\n- **ROUND_ROBIN**: Sequentially steps through backend instances.\n- **LEAST_CONNECTIONS**: Forwards requests to the instance with the lowest active load.\n- **IP_HASH**: Maps client identifiers to deterministic server targets for session stickiness.";
        } else {
          responseText = `**Architecture Guidance on "${textToSubmit}":**\n\nIn distributed systems design, components must balance latency, throughput, and fault tolerance. You can model this pattern in FlowFrame, configure server capacities, and observe packet routing directly.`;
        }

        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          sender: "assistant",
          text: responseText,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
      setIsGenerating(false);
    }, 400);
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
      className="
        fixed inset-y-0 right-0 z-40 w-full sm:w-96
        md:static md:z-20 md:w-84 lg:w-96 md:h-full md:max-h-full
        bg-[var(--surface)] border-l border-[var(--border)]
        shadow-2xl md:shadow-none flex flex-col shrink-0 transition-all duration-200 select-text
      "
      data-testid="architecture-assistant-panel"
    >
      {/* ── 1. Clear Professional Header ── */}
      <div className="h-12 px-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[color:var(--accent)] shrink-0">
            <FiCpu className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[color:var(--foreground)] truncate">
              Architecture Assistant
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--muted)] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{nodes.length} nodes · {edges.length} edges</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 rounded-md text-[color:var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Clear Conversation"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title="Close Assistant Panel"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. Contextual Capabilities Quick Bar ── */}
      <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]/40 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickAction("Explain current canvas architecture and data flow", "ask")}
            className="text-[10px] px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[var(--accent)] transition whitespace-nowrap cursor-pointer shrink-0"
          >
            Understand
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickAction("Build a Cache-Aside pattern with Redis and PostgreSQL", "create")}
            className="text-[10px] px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[var(--accent)] transition whitespace-nowrap cursor-pointer shrink-0"
          >
            Create Cache
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickAction("Create a Round-Robin Load-Balanced Cluster", "create")}
            className="text-[10px] px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[var(--accent)] transition whitespace-nowrap cursor-pointer shrink-0"
          >
            Create LB
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickAction("Validate architecture bottlenecks and unrouted nodes", "ask")}
            className="text-[10px] px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[var(--accent)] transition whitespace-nowrap cursor-pointer shrink-0"
          >
            Validate & Fix
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickAction("Explain simulation request progression and packet routing", "ask")}
            className="text-[10px] px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[var(--accent)] transition whitespace-nowrap cursor-pointer shrink-0"
          >
            Explain Simulation
          </button>
        </div>
      </div>

      {/* ── 3. Conversation Messages Stream ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            {m.sender === "user" ? (
              /* User Bubble */
              <div className="bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[color:var(--foreground)] text-xs px-3.5 py-2.5 rounded-xl rounded-tr-xs shadow-xs max-w-[88%] leading-relaxed">
                {m.text}
              </div>
            ) : (
              /* Assistant Bubble */
              <div className="bg-[var(--bg-elevated)] text-[color:var(--foreground)] border border-[var(--border)] text-xs px-3.5 py-2.5 rounded-xl rounded-tl-xs shadow-xs max-w-[96%] leading-relaxed space-y-2.5">
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                {/* If DSL was synthesized, render code block & action controls */}
                {m.dsl && (
                  <div className="pt-2 border-t border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[color:var(--muted)]">
                      <span className="font-semibold text-[color:var(--accent)] flex items-center gap-1.5">
                        <FiLayers className="w-3 h-3" />
                        <span>{m.architectureTitle}</span>
                      </span>
                      <span>FlowFrame DSL</span>
                    </div>

                    <pre className="p-2.5 rounded-lg bg-[#161b22] border border-[var(--border)] font-mono text-[10px] leading-relaxed text-[#c9d1d9] overflow-x-auto max-h-48 scrollbar-thin">
                      <code>{m.dsl}</code>
                    </pre>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyArchitecture(
                            m.id,
                            m.dsl!,
                            `${m.architectureTitle} applied to canvas`
                          )
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          m.applied
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "btn-primary text-white shadow-xs"
                        }`}
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>{m.applied ? "Applied" : "Apply to Canvas"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyDsl(m.id, m.dsl!)}
                        className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-xs font-medium text-[color:var(--foreground)] transition cursor-pointer"
                        title="Copy DSL Code"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                        <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                      </button>

                      {onRunSimulation && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!m.applied) {
                              handleApplyArchitecture(
                                m.id,
                                m.dsl!,
                                `${m.architectureTitle} applied to canvas`
                              );
                            }
                            setTimeout(() => onRunSimulation(), 250);
                          }}
                          className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-xs font-medium text-[color:var(--foreground)] transition cursor-pointer"
                          title="Run Simulation"
                        >
                          <FiPlay className="w-3 h-3 fill-current text-[color:var(--accent)]" />
                          <span>Run</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading / Generating State */}
        {isGenerating && (
          <div className="flex flex-col items-start animate-in fade-in duration-150">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] text-xs px-3.5 py-2.5 rounded-xl rounded-tl-xs shadow-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="font-mono text-[11px] font-semibold text-[color:var(--accent)]">
                  {mode === "create" ? "Synthesizing Topology..." : "Analyzing Architecture..."}
                </span>
              </div>
              <p className="text-[10px] text-[color:var(--muted)] font-mono">
                {mode === "create" ? "Generating nodes, endpoints and routes" : "Evaluating components and flow paths"}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 4. Input Area ── */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 space-y-2">
        {/* Clean Mode Switcher: Create vs Ask */}
        <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-0.5 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setMode("create")}
            className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === "create"
                ? "bg-[var(--surface)] text-[color:var(--accent)] font-semibold shadow-xs"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
          >
            <FiPlus className="w-3 h-3" />
            <span>Create Architecture</span>
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setMode("ask")}
            className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === "ask"
                ? "bg-[var(--surface)] text-[color:var(--accent)] font-semibold shadow-xs"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
          >
            <FiHelpCircle className="w-3 h-3" />
            <span>Ask & Analyze</span>
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isGenerating) submitPrompt();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            disabled={isGenerating}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isGenerating
                ? "Analyzing..."
                : mode === "create"
                ? "Describe topology (e.g. Add Redis cache to server)..."
                : "Ask about your architecture or simulation..."
            }
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)] transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-1.5 p-1 rounded-md bg-[var(--accent)] text-white hover:brightness-110 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
            title="Send (Enter)"
          >
            {isGenerating ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <FiSend className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}
