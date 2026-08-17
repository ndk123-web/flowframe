"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type Theme = "light" | "dark";

const FLAGSHIP_BLUEPRINT_CODE = `// ==========================================
// FLOWFRAME ARCHITECTURE DSL v2.0.0
// Flagship Enterprise Microservices Blueprint
// ==========================================

// 1. End-User Mobile Client Definition
define CLIENT c1 {
  label: "Mobile Client",
  requests: [
    {
      endpoint: "/api/v1/orders",
      allowedMethods: ["POST"],
      key: "rohan"
    },
    {
      endpoint: "/api/v1/orders",
      allowedMethods: ["POST"],
      key: "rohan"
    },
    {
      endpoint: "/api/v1/users",
      allowedMethods: ["POST"],
      key: "rohan",
      body: {
        topic: "post.created"
      }
    },
    {
      endpoint: "/api/v1/users",
      allowedMethods: ["POST"],
      key: "rohan",
      body: {
        topic: "post.created"
      }
    },
    {
      endpoint: "/api/v1/posts",
      allowedMethods: ["POST"],
      key: "rohan"
    }
  ]
}

// 2. Central API Gateway Routing Definition
define GATEWAY gw1 {
  label: "AWS API Gateway",
  strategy: "ROUND_ROBIN",
  routes: [
    {
      path: "/api/v1/orders",
      target: lb1
    },
    {
      path: "/api/v1/posts",
      target: s3
    },
    {
      path: "/api/v1/users",
      target: lb2
    }
  ]
}

// 3. Service Cluster Load Balancers
define LOADBALANCER lb1 {
  label: "Order Service LoadBalancer",
  strategy: "ROUND_ROBIN"
}

define LOADBALANCER lb2 {
  label: "User Service LoadBalancer",
  strategy: "ROUND_ROBIN"
}

// 4. Order Microservice Application Servers
define SERVER s1 {
  label: "Order Server Instance 1",
  capacity: 50,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/orders",
      allowedMethod: ["POST"]
    }
  ]
}

define SERVER s2 {
  label: "Order Server Instance 2",
  capacity: 50,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/orders",
      allowedMethod: ["POST"]
    }
  ]
}

// 5. Posts Microservice Server
define SERVER s3 {
  label: "Posts Server Instance",
  capacity: 50,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["POST"]
    }
  ]
}

// 6. User Microservice Application Servers
define SERVER s4 {
  label: "User Server Instance 1",
  capacity: 50,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/users",
      allowedMethod: ["POST"]
    }
  ]
}

define SERVER s5 {
  label: "User Server Instance 2",
  capacity: 50,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/users",
      allowedMethod: ["POST"]
    }
  ]
}

// 7. Asynchronous RabbitMQ Message Queue
define MESSAGEQUEUE mq1 {
  label: "Post Queue"
}

// 8. Queue Consumer Processing Servers
define SERVER producerPostQueue1 {
  label: "Consumer Post Server 1",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ],
  prefetchLimit: 10
}

define SERVER producerPostQueue2 {
  label: "Consumer Post Server 2",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ],
  prefetchLimit: 10
}

// 9. Primary Database & Cache Clusters (Set 1)
define POSTGRES db1 {
  label: "Postgres Database 1",
  table: "users",
  data: [
    {
      key: "rohan",
      value: "db record data"
    }
  ]
}

define REDIS r1 {
  label: "Redis Cache 1",
  data: [
    {
      key: "rohan",
      value: "cached data for rohan"
    }
  ]
}

// 10. Secondary Database & Cache Clusters (Set 2)
define POSTGRES db2 {
  label: "Postgres Database 2",
  table: "users",
  data: [
    {
      key: "rohan",
      value: "db record data"
    }
  ]
}

define REDIS r2 {
  label: "Redis Cache 2",
  data: [
    {
      key: "rohan",
      value: "cached data for rohan"
    }
  ]
}

// 11. PubSub Event Broker & Subscriber Servers
define PUBSUB postPubsub {
  label: "PostPubSub 1"
}

define SERVER pubsubConsumer1 {
  label: "PubSub Consumer 1",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ],
  registeredTopics: ["post.created"]
}

define SERVER pubsubConsumer2 {
  label: "PubSub Consumer 2",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ],
  registeredTopics: ["post.created"]
}

// ==========================================
// TOPOLOGY NETWORK CONNECTIONS & DATA FLOWS
// ==========================================

// Client to API Gateway and Load Balancers
connect c1 -> gw1 -> lb1 -> s1
connect lb1 -> s2
connect gw1 -> s3
connect gw1 -> lb2
connect lb2 -> s4
connect lb2 -> s5

// Order Servers to Message Queue & Consumers
s1 -> mq1
s2 -> mq1
mq1 -> producerPostQueue1
mq1 -> producerPostQueue2
producerPostQueue1 -> db1
producerPostQueue1 -> r1
producerPostQueue2 -> db1
producerPostQueue2 -> r1

// User Servers to PubSub Broker & Subscribers
s4 -> postPubsub
s5 -> postPubsub
postPubsub -> pubsubConsumer2
postPubsub -> pubsubConsumer1
pubsubConsumer1 -> r2
pubsubConsumer1 -> db2
pubsubConsumer2 -> db2
pubsubConsumer2 -> r2`;

// Monaco-style Syntax Highlighter Component (Theme-Adaptive for Light & Dark modes)
function FlowCodeBlock({ code }: { code: string }) {
  const highlightLine = (line: string, index: number) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) {
      return (
        <span key={index} className="text-emerald-600 dark:text-emerald-400 italic font-mono">
          {line}
        </span>
      );
    }

    // Token replacement logic for DSL syntax highlighting
    const parts = line.split(/(\s+|[{}[\](),:->"])/);

    return (
      <span key={index} className="font-mono text-[color:var(--foreground)]">
        {parts.map((part, pIdx) => {
          if (!part) return null;
          const upper = part.toUpperCase();

          if (["DEFINE", "CONNECT"].includes(upper)) {
            return (
              <span key={pIdx} className="text-violet-600 dark:text-violet-400 font-bold">
                {part}
              </span>
            );
          }

          if (
            [
              "CLIENT",
              "SERVER",
              "GATEWAY",
              "LOADBALANCER",
              "REDIS",
              "POSTGRES",
              "MESSAGEQUEUE",
              "PUBSUB",
            ].includes(upper)
          ) {
            return (
              <span key={pIdx} className="text-sky-600 dark:text-sky-400 font-semibold">
                {part}
              </span>
            );
          }

          if (
            [
              "LABEL:",
              "REQUESTS:",
              "ROUTES:",
              "ACCEPTEDENDPOINTS:",
              "STRATEGY:",
              "DATA:",
              "TABLE:",
              "ENDPOINT:",
              "ALLOWEDMETHODS:",
              "KEY:",
              "VALUE:",
              "BODY:",
              "REGISTEREDTOPICS:",
              "PATH:",
              "TARGET:",
              "CAPACITY:",
              "PREFETCHLIMIT:",
            ].includes(upper)
          ) {
            return (
              <span key={pIdx} className="text-blue-600 dark:text-blue-300 font-semibold">
                {part}
              </span>
            );
          }

          if (part.startsWith('"') || part.endsWith('"')) {
            return (
              <span key={pIdx} className="text-emerald-700 dark:text-emerald-300 font-medium">
                {part}
              </span>
            );
          }

          if (part === "->") {
            return (
              <span key={pIdx} className="text-amber-600 dark:text-amber-400 font-bold">
                {part}
              </span>
            );
          }

          if (/^\d+$/.test(part)) {
            return (
              <span key={pIdx} className="text-orange-600 dark:text-orange-300 font-mono">
                {part}
              </span>
            );
          }

          if (["c1", "gw1", "lb1", "lb2", "s1", "s2", "s3", "s4", "s5", "mq1", "db1", "r1", "db2", "r2", "postPubsub", "producerPostQueue1", "producerPostQueue2", "pubsubConsumer1", "pubsubConsumer2"].includes(part)) {
            return (
              <span key={pIdx} className="text-amber-600 dark:text-amber-300 font-semibold">
                {part}
              </span>
            );
          }

          return <span key={pIdx} className="text-[color:var(--foreground)]">{part}</span>;
        })}
      </span>
    );
  };

  const lines = code.split("\n");

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)] p-4 text-xs font-mono overflow-x-auto shadow-sm leading-relaxed scrollbar-thin transition-colors">
      {lines.map((line, idx) => (
        <div key={idx} className="table-row">
          <span className="table-cell text-right pr-4 text-[color:var(--foreground)]/30 select-none text-[10px]">
            {idx + 1}
          </span>
          <span className="table-cell whitespace-pre">{highlightLine(line, idx)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DocsPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("flowframe-theme") as Theme | null;
    if (s === "light" || s === "dark") {
      setTheme(s);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((p) => (p === "dark" ? "light" : "dark"));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(FLAGSHIP_BLUEPRINT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] transition-colors duration-300">
      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showHomeLink={true}
        badgeText="Documentation v2.0.0"
        alwaysGlass={true}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sticky Left Navigation Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-20 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl p-4 shadow-sm space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                  Documentation v2.0.0
                </span>
                <h2 className="text-base font-bold text-[color:var(--foreground)] mt-0.5">
                  FlowFrame DSL
                </h2>
              </div>

              <nav className="space-y-1 text-xs">
                <a
                  href="#overview"
                  className="block rounded-lg px-3 py-2 text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition font-medium"
                >
                  Overview
                </a>
                <a
                  href="#system-rules"
                  className="block rounded-lg px-3 py-2 text-violet-400 bg-violet-500/10 hover:bg-violet-500/15 transition font-semibold"
                >
                  System Simulation Rules
                </a>
                <a
                  href="#syntax-rules"
                  className="block rounded-lg px-3 py-2 text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition font-medium"
                >
                  Syntax & Token Rules
                </a>
                <a
                  href="#node-schemas"
                  className="block rounded-lg px-3 py-2 text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition font-medium"
                >
                  Node Schemas (8 Types)
                </a>
                <a
                  href="#flagship-blueprint"
                  className="block rounded-lg px-3 py-2 text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition font-medium"
                >
                  Flagship Enterprise Blueprint
                </a>
                <a
                  href="#video-deepdive"
                  className="block rounded-lg px-3 py-2 text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition font-medium"
                >
                  Video Deep Dive (YouTube)
                </a>
                <a
                  href="#error-diagnostics"
                  className="block rounded-lg px-3 py-2 text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition font-medium"
                >
                  Error Diagnostics & License
                </a>
              </nav>

              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <a
                  href="https://github.com/ndk123-web/flowframe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] py-2 text-xs font-semibold transition text-[color:var(--foreground)]"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub Repository</span>
                </a>
                <Link
                  href="/workspace"
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white py-2 text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Launch Workspace</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-12 min-w-0">
            {/* Overview */}
            <section id="overview" className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
                <span>FlowFrame DSL Specifications v2.0.0</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[color:var(--foreground)]">
                FlowFrame Architecture DSL Reference
              </h1>
              <p className="text-sm sm:text-base text-[color:var(--foreground)]/70 leading-relaxed">
                FlowFrame Domain Specific Language (<code className="text-violet-400 font-mono">.flow</code>) is a declarative infrastructure-as-code language built to design, compile, visualize, and simulate complex distributed systems and microservices architectures in real time.
              </p>
            </section>

            {/* ── SYSTEM SIMULATION RULES ────────────────────────────────────── */}
            <section id="system-rules" className="space-y-6 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] flex items-center gap-2">
                    <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                    <span>System Simulation Rules & Runtime Behavior</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[color:var(--foreground)]/70 mt-1">
                    Every user building architectures in FlowFrame should understand these 8 core simulation rules enforced by the engine runtime:
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                  8 Engine Rules
                </span>
              </div>

              <div className="space-y-4">
                {/* Rule 1 */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2.5 transition hover:border-violet-500/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">01</span>
                      <span>Cache-First Precedence (Redis + Postgres)</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">
                      Data Access
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                    When a Server node is connected to both a <strong>Redis</strong> cache and a <strong>PostgreSQL</strong> database, the engine <strong>always queries Redis first</strong>. If the lookup key exists in Redis (<code className="text-violet-400 font-mono">CACHE_HIT</code>), the request backtracks immediately. Only on <code className="text-violet-400 font-mono">CACHE_MISS</code> does the server forward the request to Postgres.
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2.5 transition hover:border-violet-500/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">02</span>
                      <span>Postgres TCP Connection Pool Limits</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">
                      Database
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                    Each server maintains a bounded connection pool defined by <code className="text-violet-400 font-mono">tcpConnectionsToPostgres</code>. When concurrent requests exceed the pool size, excess queries enter a <code className="text-violet-400 font-mono">POSTGRES_POOL_WAIT</code> queue state until active connections are released.
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2.5 transition hover:border-violet-500/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">03</span>
                      <span>Load Balancer Health Verification</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">
                      Traffic Balancing
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                    Load balancers inspect downstream server <code className="text-violet-400 font-mono">capacity</code>. If all server nodes in a pool are exhausted, the load balancer rejects the request with a <code className="text-violet-400 font-mono">503 Service Unavailable</code> error.
                  </p>
                </div>

                {/* Rule 4 */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2.5 transition hover:border-violet-500/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">04</span>
                      <span>Endpoint & Method Matching Contracts</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">
                      REST Routing
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                    Servers validate that incoming requests match one of their declared <code className="text-violet-400 font-mono">acceptedEndpoints</code> and allowed HTTP verbs (<code className="font-mono">GET, POST, PUT, DELETE</code>). Unmatched paths trigger <code className="text-violet-400 font-mono">404 Not Found</code> or <code className="text-violet-400 font-mono">405 Method Not Allowed</code>.
                  </p>
                </div>

                {/* Rule 5 & 6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 transition hover:border-violet-500/40">
                    <h4 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">05</span>
                      <span>Async Message Queue Ack</span>
                    </h4>
                    <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                      Publishing to a MessageQueue sends an immediate <code className="text-violet-400 font-mono">202 Accepted</code> ack back to the client while worker servers process messages in the background.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 transition hover:border-violet-500/40">
                    <h4 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">06</span>
                      <span>PubSub Event Fan-Out</span>
                    </h4>
                    <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                      PubSub brokers broadcast published event messages to all subscribed servers registered with the matching <code className="text-violet-400 font-mono">topic</code> channel.
                    </p>
                  </div>
                </div>

                {/* Rule 7 & 8 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 transition hover:border-violet-500/40">
                    <h4 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">07</span>
                      <span>Valet Key Pre-Signed Uploads</span>
                    </h4>
                    <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                      When <code className="text-violet-400 font-mono">valet: true</code>, the client first requests an upload token from the server, then streams data directly to cloud storage.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 transition hover:border-violet-500/40">
                    <h4 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">08</span>
                      <span>Queue Overflow Controls</span>
                    </h4>
                    <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                      MessageQueue buffers that exceed <code className="text-violet-400 font-mono">queueSize</code> adhere to <code className="font-mono text-violet-400">BLOCK</code> (producer waits) or <code className="font-mono text-violet-400">REJECT</code> (503 error).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Syntax Rules */}
            <section id="syntax-rules" className="space-y-4 pt-6 border-t border-[var(--border)]">
              <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                Syntax & Token Rules
              </h2>
              <p className="text-xs sm:text-sm text-[color:var(--foreground)]/70">
                The DSL follows a concise, JSON-like key-value structure with loose keyword tolerances for maximum developer productivity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
                  <h3 className="text-sm font-bold text-violet-400">
                    Node Declarations
                  </h3>
                  <FlowCodeBlock
                    code={`// Optional define keyword & flexible casing
define CLIENT c1 {
  label: "Mobile Client",
  requests: [{ endpoint: "/api/v1/posts", key: "rohan" }]
}`}
                  />
                  <ul className="text-xs text-[color:var(--foreground)]/60 space-y-1 list-disc list-inside mt-2">
                    <li>The <code className="font-mono text-violet-400">define</code> keyword is optional.</li>
                    <li>Node types can be uppercase or lowercase (e.g. <code className="font-mono">CLIENT</code> or <code className="font-mono">client</code>).</li>
                    <li>Identifiers are unique string names (e.g. <code className="font-mono">c1</code>, <code className="font-mono">s1</code>, <code className="font-mono">lb1</code>).</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
                  <h3 className="text-sm font-bold text-violet-400">
                    Connection Syntax
                  </h3>
                  <FlowCodeBlock
                    code={`// Option 1: Direct arrow chaining
c1 -> gw1 -> lb1 -> s1

// Option 2: Connect keyword
connect lb1 -> s2`}
                  />
                  <ul className="text-xs text-[color:var(--foreground)]/60 space-y-1 list-disc list-inside mt-2">
                    <li>Chained connections (<code className="font-mono">{"a -> b -> c"}</code>) split into directed edges (<code className="font-mono">{"a -> b"}</code> and <code className="font-mono">{"b -> c"}</code>).</li>
                    <li>The <code className="font-mono text-violet-400">connect</code> keyword is optional.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Node Schemas */}
            <section id="node-schemas" className="space-y-6 pt-6 border-t border-[var(--border)]">
              <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                Supported Node Schemas (8 Components)
              </h2>
              <p className="text-xs sm:text-sm text-[color:var(--foreground)]/70">
                FlowFrame supports 8 core infrastructure component types across frontends, gateways, balancers, workers, caches, databases, queues, and pubsub event brokers.
              </p>

              <div className="space-y-4">
                {/* Client & Server */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-violet-400">
                      1. CLIENT & 2. SERVER
                    </h3>
                    <span className="text-[10px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                      Core Runtimes
                    </span>
                  </div>
                  <FlowCodeBlock
                    code={`// Client definition with HTTP request payload
define CLIENT c1 {
  label: "Mobile Client",
  requests: [
    { endpoint: "/api/v1/orders", allowedMethods: ["POST"], key: "rohan" }
  ]
}

// Server definition with capacity and endpoint configuration
define SERVER s1 {
  label: "Order Server Instance 1",
  capacity: 50,
  prefetchLimit: 10,
  acceptedEndpoints: [
    { endpoint: "/api/v1/orders", allowedMethod: ["POST"] }
  ],
  registeredTopics: ["post.created"]
}`}
                  />
                </div>

                {/* Gateway & LoadBalancer */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-violet-400">
                      3. GATEWAY & 4. LOADBALANCER
                    </h3>
                    <span className="text-[10px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                      Traffic Management
                    </span>
                  </div>
                  <FlowCodeBlock
                    code={`// API Gateway with path-based LoadBalancer routing
define GATEWAY gw1 {
  label: "AWS API Gateway",
  strategy: "ROUND_ROBIN",
  routes: [
    { path: "/api/v1/orders", target: lb1 },
    { path: "/api/v1/posts", target: s3 }
  ]
}

// Load Balancer with Round-Robin strategy
define LOADBALANCER lb1 {
  label: "Order Service LoadBalancer",
  strategy: "ROUND_ROBIN"
}`}
                  />
                </div>

                {/* Redis & Postgres */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-violet-400">
                      5. REDIS & 6. POSTGRES
                    </h3>
                    <span className="text-[10px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                      State & Storage
                    </span>
                  </div>
                  <FlowCodeBlock
                    code={`// Redis in-memory cache pre-populated data
define REDIS r1 {
  label: "Redis Cache 1",
  data: [{ key: "rohan", value: "cached data for rohan" }]
}

// PostgreSQL database relational table data
define POSTGRES db1 {
  label: "Postgres Database 1",
  table: "users",
  data: [{ key: "rohan", value: "db record data" }]
}`}
                  />
                </div>

                {/* Queue & PubSub */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-violet-400">
                      7. MESSAGEQUEUE & 8. PUBSUB
                    </h3>
                    <span className="text-[10px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                      Asynchronous Messaging
                    </span>
                  </div>
                  <FlowCodeBlock
                    code={`// Asynchronous RabbitMQ message queue broker
define MESSAGEQUEUE mq1 {
  label: "Post Queue",
  processingType: "FIFO",
  queueSize: 50,
  overflowBehavior: "REJECT"
}

// Redis PubSub event broker for broadcast channels
define PUBSUB postPubsub {
  label: "PostPubSub 1",
  topic: "post.created"
}`}
                  />
                </div>
              </div>
            </section>

            {/* Flagship Blueprint */}
            <section id="flagship-blueprint" className="space-y-4 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                    Flagship Enterprise Microservices Blueprint
                  </h2>
                  <p className="text-xs sm:text-sm text-[color:var(--foreground)]/70">
                    A complete full-scale microservices system featuring API Gateway, 2 Load Balancers, 7 Servers, RabbitMQ Queue, PubSub Broker, Redis Caches, and PostgreSQL Databases.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/30 px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {copied ? "Copied" : "Copy Script"}
                </button>
              </div>

              <FlowCodeBlock code={FLAGSHIP_BLUEPRINT_CODE} />
            </section>

            {/* Video Deep Dive */}
            <section id="video-deepdive" className="space-y-4 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] flex items-center gap-2">
                    <svg className="w-5 h-5 text-violet-400 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Video Deep Dive — Event-Driven Architecture from Scratch</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[color:var(--foreground)]/70 mt-1">
                    Watch the comprehensive full-stack walkthrough building and simulating a production-grade microservices system.
                  </p>
                </div>
                <a
                  href="https://www.youtube.com/watch?v=XQxFZg6RcTI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-xs font-bold transition shrink-0 hidden sm:inline-flex items-center gap-1.5"
                >
                  <span>Open on YouTube</span>
                </a>
              </div>

              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-black/60 shadow-xl">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/XQxFZg6RcTI"
                  title="FlowFrame Event-Driven Architecture Walkthrough"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>

            {/* Error Diagnostics & License */}
            <section id="error-diagnostics" className="space-y-6 pt-6 border-t border-[var(--border)]">
              <h2 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                Error Diagnostics & Open Source License
              </h2>
              <p className="text-xs sm:text-sm text-[color:var(--foreground)]/70">
                The FlowFrame compiler performs strict Lexer, Parser, and Semantic checks prior to visual rendering or simulation execution.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
                  <h4 className="font-bold text-violet-400">Syntax Errors</h4>
                  <p className="text-[color:var(--foreground)]/60">
                    Catches unexpected tokens, unclosed braces, or missing identifiers.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
                  <h4 className="font-bold text-violet-400">Duplicate Checks</h4>
                  <p className="text-[color:var(--foreground)]/60">
                    Prevents re-declaration of duplicate node identifier names.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
                  <h4 className="font-bold text-violet-400">Strict Schema Rules</h4>
                  <p className="text-[color:var(--foreground)]/60">
                    Enforces valid property names per node type using <code className="font-mono">ALLOWED_VARIABLES</code> dictionary.
                  </p>
                </div>
              </div>

              {/* License Card */}
              <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/20 to-[var(--surface)] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>PolyForm Noncommercial License 1.0.0</span>
                  </h3>
                  <a
                    href="https://github.com/ndk123-web/flowframe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400 hover:underline font-mono"
                  >
                    ndk123-web/flowframe
                  </a>
                </div>
                <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
                  FlowFrame source code is available for educational, personal, and non-commercial research purposes under the PolyForm Noncommercial License 1.0.0. Feel free to inspect the Rust backend, TypeScript compiler pipeline, and simulation runtime.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
