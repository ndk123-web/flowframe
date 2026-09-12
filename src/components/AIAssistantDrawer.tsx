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
  FiCornerDownLeft,
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
}: AIAssistantDrawerProps) {
  // Mode: "create" (Generate architecture on canvas) or "ask" (Technical Q&A / Canvas explanation)
  const [mode, setMode] = useState<"create" | "ask">("create");
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Hello! I am your Architecture Assistant. Select **Create** to build system topologies on your canvas, or **Ask** to inquire about distributed system patterns or your current layout.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        text: "Chat cleared. Select **Create** to generate a new architecture or **Ask** to ask a technical question.",
      },
    ]);
  };

  // Quick suggestion click
  const handleQuickPrompt = (promptText: string, promptMode: "create" | "ask") => {
    setMode(promptMode);
    setInput(promptText);
    setTimeout(() => {
      submitPrompt(promptText, promptMode);
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

    // Generate intelligent assistant response based on mode
    setTimeout(() => {
      const lower = textToSubmit.toLowerCase();

      if (currentMode === "create") {
        // Architecture Generation Engine
        let generatedDsl = "";
        let title = "";
        let explanation = "";

        if (lower.includes("load") || lower.includes("round robin") || lower.includes("balance") || lower.includes("cluster")) {
          title = "Load-Balanced Cluster";
          explanation = "Round-Robin Load Balancer distributing requests evenly across multiple backend application servers to eliminate single point of failure.";
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
        } else if (lower.includes("queue") || lower.includes("rabbit") || lower.includes("sqs") || lower.includes("worker") || lower.includes("kafka")) {
          title = "Asynchronous Message Queue & Worker";
          explanation = "Decoupled architecture using a Message Queue buffer to absorb traffic spikes and asynchronously deliver jobs to background workers.";
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
        } else if (lower.includes("pubsub") || lower.includes("fanout") || lower.includes("sns") || lower.includes("broadcast") || lower.includes("event")) {
          title = "PubSub Event Fanout Architecture";
          explanation = "One-to-many event broadcast pattern routing order events to both notification and analytics subscribers simultaneously.";
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
        } else if (lower.includes("gateway") || lower.includes("microservice") || lower.includes("api gw")) {
          title = "API Gateway Microservices Architecture";
          explanation = "Central API Gateway providing endpoint routing to isolated User and Order microservices with shared database access.";
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
        } else if (lower.includes("valet") || lower.includes("s3") || lower.includes("storage") || lower.includes("upload")) {
          title = "Valet Key Direct Storage Upload";
          explanation = "Direct client-to-cloud upload pattern reducing server bandwidth bottlenecks by issuing short-lived pre-signed URLs.";
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
          // Default to Cache-Aside Pattern (Most requested pattern)
          title = "Cache-Aside Architecture";
          explanation = "High-throughput cache-aside pattern: Redis in-memory cache intercepts read queries to minimize database read pressure.";
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
          text: `I designed a **${title}** architecture for your prompt:\n\n${explanation}`,
          dsl: generatedDsl,
          architectureTitle: title,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Technical Q&A / Canvas Analysis Engine
        let responseText = "";

        if (lower.includes("canvas") || lower.includes("current") || lower.includes("diagram") || lower.includes("my architecture")) {
          const clientCount = nodes.filter((n) => n.data.type === "client").length;
          const serverCount = nodes.filter((n) => n.data.type === "server").length;
          const dbCount = nodes.filter((n) => n.data.type === "postgres").length;
          const cacheCount = nodes.filter((n) => n.data.type === "redis").length;
          const queueCount = nodes.filter((n) => n.data.type === "message-queue" || n.data.type === "messagequeue").length;

          responseText = `**Current Canvas Breakdown:**\n\n- Total Nodes: **${nodes.length}** (${clientCount} Clients, ${serverCount} Servers, ${cacheCount} Caches, ${dbCount} Databases, ${queueCount} Queues)\n- Total Connections: **${edges.length}**\n\n${
            nodes.length === 0
              ? "Your canvas is currently empty. Switch to **Create** mode below and type a system requirement to generate a starter layout!"
              : "Traffic flows from your client nodes through downstream services. Run the simulation from the top toolbar to observe latency and request packet routing in real-time."
          }`;
        } else if (lower.includes("redis") || lower.includes("cache")) {
          responseText = "**Redis Cache in System Design:**\n\nRedis stores key-value pairs in memory (RAM), delivering sub-millisecond retrieval latencies. In a Cache-Aside pattern, the application checks Redis first. On a cache miss, it reads from the SQL database and writes the result back to Redis with a TTL (Time-To-Live).";
        } else if (lower.includes("load balancer") || lower.includes("round robin") || lower.includes("alb")) {
          responseText = "**Load Balancing Strategies:**\n\n- **Round-Robin**: Sequentially distributes each new request to the next server in line.\n- **Least Connections**: Routes traffic to the instance currently servicing the fewest active connections.\n- **IP Hash**: Ensures a specific client consistently routes to the same backend for session affinity.";
        } else if (lower.includes("queue") || lower.includes("kafka") || lower.includes("sqs")) {
          responseText = "**Message Queues vs Pub/Sub:**\n\n- **Message Queue (Point-to-Point)**: Each message in the queue is processed by exactly one worker. Great for asynchronous task execution and background job pipelines.\n- **Pub/Sub (Publish/Subscribe)**: Every subscriber listening to a topic receives a copy of the broadcast event. Ideal for notifications and real-time event feeds.";
        } else {
          responseText = `**Architecture Insight:**\n\nRegarding "${textToSubmit}": Distributed systems balance latency, consistency, and fault tolerance. In FlowFrame, you can model this pattern visually, configure server request concurrency, and simulate packet flow step-by-step.`;
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

  return (
    <aside
      className="fixed right-0 top-0 bottom-0 w-full sm:w-96 md:w-[420px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col transition-all duration-200"
      data-testid="ai-assistant-drawer"
    >
      {/* ── Minimal Header ── */}
      <div className="h-13 px-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[color:var(--accent)] shrink-0">
            <FiCpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[color:var(--foreground)] truncate">
              Architecture Assistant
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Ready</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-[color:var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Clear Chat History"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
            title="Close Assistant"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Chat Messages Stream ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            {m.sender === "user" ? (
              <div className="bg-[var(--accent)] text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-xs shadow-xs max-w-[85%] leading-relaxed">
                {m.text}
              </div>
            ) : (
              <div className="bg-[var(--surface-muted)] text-[color:var(--foreground)] border border-[var(--border)] text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-xs max-w-[95%] leading-relaxed space-y-2.5">
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* If architecture was generated, show 1-click action buttons */}
                {m.dsl && (
                  <div className="pt-2 border-t border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--accent)]">
                      <FiLayers className="w-3.5 h-3.5" />
                      <span>{m.architectureTitle} Ready</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyArchitecture(
                            m.id,
                            m.dsl!,
                            `${m.architectureTitle} applied to canvas`
                          )
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                          m.applied
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-[var(--accent)] hover:brightness-110 text-white shadow-xs"
                        }`}
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>{m.applied ? "Applied ✓" : "Apply to Canvas"}</span>
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
                          className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-xs font-semibold text-[color:var(--foreground)] transition cursor-pointer"
                          title="Run Simulation"
                        >
                          <FiPlay className="w-3 h-3 fill-current text-[color:var(--accent)]" />
                          <span>Simulate</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* High-Tech Assistant Loader Bubble */}
        {isGenerating && (
          <div className="flex flex-col items-start animate-in fade-in duration-200">
            <div className="bg-[var(--surface-muted)] text-[color:var(--foreground)] border border-[var(--border)] text-xs px-3.5 py-3 rounded-2xl rounded-tl-xs shadow-xs max-w-[95%] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
                </span>
                <span className="font-mono text-[11px] font-bold text-[color:var(--accent)]">
                  {mode === "create"
                    ? "Synthesizing Topology..."
                    : "Analyzing System Patterns..."}
                </span>
              </div>
              <p className="text-[10px] text-[color:var(--muted)] font-mono leading-normal">
                {mode === "create"
                  ? "Resolving components, socket bindings & packet flows"
                  : "Evaluating distributed consensus & latency patterns"}
              </p>
              <div className="w-full h-1 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full bg-[var(--accent)] w-1/2 animate-[shimmerTrack_1s_linear_infinite]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Starter Pills ── */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface)]/50 shrink-0">
        <p className="text-[10px] font-mono uppercase font-bold text-[color:var(--muted)] mb-1.5">
          Quick suggestions:
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickPrompt("Build a Cache-Aside pattern with Redis and PostgreSQL", "create")}
            className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)] hover:border-[var(--accent)]/40 transition cursor-pointer disabled:opacity-50"
          >
            + Cache-Aside Architecture
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickPrompt("Create a Load-Balanced Server Cluster", "create")}
            className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)] hover:border-[var(--accent)]/40 transition cursor-pointer disabled:opacity-50"
          >
            + Load Balancer Cluster
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuickPrompt("Explain my current canvas architecture", "ask")}
            className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)] hover:border-[var(--accent)]/40 transition cursor-pointer disabled:opacity-50"
          >
            ? Explain Canvas
          </button>
        </div>
      </div>

      {/* ── Simple Bottom Box: Create / Ask Toggle + Input ── */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 space-y-2">
        {/* Toggle: Create or Ask */}
        <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-xl border border-[var(--border)]">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setMode("create")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === "create"
                ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-xs border border-[var(--border)] font-bold"
                : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
            }`}
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setMode("ask")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === "ask"
                ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-xs border border-[var(--border)] font-bold"
                : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
            }`}
          >
            <FiHelpCircle className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </div>

        {/* Input box */}
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
                ? "Generating response..."
                : mode === "create"
                ? "Describe architecture (e.g. 'Add Redis cache with DB')..."
                : "Ask about distributed systems or this canvas..."
            }
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)]/60 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-1.5 p-1.5 rounded-lg bg-[var(--accent)] text-white hover:brightness-110 disabled:opacity-35 transition cursor-pointer disabled:cursor-not-allowed"
            title={isGenerating ? "Generating..." : "Send Message"}
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
