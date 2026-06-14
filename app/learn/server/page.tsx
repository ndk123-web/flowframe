"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";

type Theme = "light" | "dark";
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Endpoint {
  method: HttpMethod;
  path: string;
  desc: string;
  body?: Record<string, string | undefined>;
}

interface SimResponse {
  status: number;
  statusText: string;
  latency: number;
  headers: Record<string, string>;
  body: unknown;
}

const METHOD_COLORS: Record<HttpMethod, { cls: string; dot: string }> = {
  GET:    { cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", dot: "#34d399" },
  POST:   { cls: "text-blue-400 bg-blue-500/10 border-blue-500/25",          dot: "#60a5fa" },
  PUT:    { cls: "text-amber-400 bg-amber-500/10 border-amber-500/25",        dot: "#fbbf24" },
  PATCH:  { cls: "text-orange-400 bg-orange-500/10 border-orange-500/25",     dot: "#fb923c" },
  DELETE: { cls: "text-red-400 bg-red-500/10 border-red-500/25",              dot: "#f87171" },
};

const STATUS_COLOR = (s: number) => {
  if (s >= 500) return "text-red-400 bg-red-500/10 border-red-500/25";
  if (s >= 400) return "text-amber-400 bg-amber-500/10 border-amber-500/25";
  if (s >= 200) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
  return "text-slate-400 bg-slate-500/10 border-slate-500/25";
};

const ENDPOINT_GROUPS = [
  {
    label: "Users",
    color: "border-violet-500/25",
    endpoints: [
      { method: "GET"    as HttpMethod, path: "/api/v1/users",       desc: "List all users" },
      { method: "POST"   as HttpMethod, path: "/api/v1/users",       desc: "Create a new user", body: { name: "Rohan Sharma", email: "rohan@example.com", role: "user" } },
      { method: "GET"    as HttpMethod, path: "/api/v1/users/:id",   desc: "Get a single user by ID" },
      { method: "PUT"    as HttpMethod, path: "/api/v1/users/:id",   desc: "Replace a user record", body: { name: "Updated Name", email: "updated@example.com" } },
      { method: "PATCH"  as HttpMethod, path: "/api/v1/users/:id",   desc: "Partially update a user", body: { role: "admin" } },
      { method: "DELETE" as HttpMethod, path: "/api/v1/users/:id",   desc: "Delete a user" },
    ],
  },
  {
    label: "Posts",
    color: "border-blue-500/25",
    endpoints: [
      { method: "GET"    as HttpMethod, path: "/api/v1/posts",       desc: "List all blog posts" },
      { method: "POST"   as HttpMethod, path: "/api/v1/posts",       desc: "Create a new post", body: { title: "Hello World", content: "My first post.", authorId: "user-001" } },
      { method: "GET"    as HttpMethod, path: "/api/v1/posts/:id",   desc: "Get a post by ID" },
      { method: "DELETE" as HttpMethod, path: "/api/v1/posts/:id",   desc: "Delete a post" },
    ],
  },
  {
    label: "System",
    color: "border-slate-500/25",
    endpoints: [
      { method: "GET"    as HttpMethod, path: "/api/v1/health",        desc: "Health check — always 200" },
      { method: "GET"    as HttpMethod, path: "/api/v1/unknown-route", desc: "404 — route doesn't exist" },
      { method: "DELETE" as HttpMethod, path: "/api/v1/health",        desc: "405 — wrong method" },
      { method: "POST"   as HttpMethod, path: "/api/v1/users",         desc: "400 — missing body fields", body: {} },
    ],
  },
];

const ALL_ENDPOINTS: Endpoint[] = ENDPOINT_GROUPS.flatMap(g => g.endpoints);

function simulateResponse(ep: Endpoint, bodyStr: string): SimResponse {
  const latency = Math.floor(Math.random() * 80 + 20);
  const base = {
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": `req_${Math.random().toString(36).slice(2, 10)}`,
      "X-Response-Time": `${latency}ms`,
      "Cache-Control": ep.method === "GET" ? "max-age=60" : "no-store",
    },
    latency,
  };
  if (ep.path === "/api/v1/unknown-route") return { ...base, status: 404, statusText: "Not Found", body: { error: "Route not found", path: ep.path } };
  if (ep.method === "DELETE" && ep.path === "/api/v1/health") return { ...base, status: 405, statusText: "Method Not Allowed", body: { error: "DELETE not allowed", allowed: ["GET"] } };
  if (ep.method === "POST" && ep.path === "/api/v1/users") {
    let parsed: any = {}; try { parsed = JSON.parse(bodyStr); } catch { /* */ }
    if (!parsed.name || !parsed.email) return { ...base, status: 400, statusText: "Bad Request", body: { error: "Validation failed", missing: ["name", "email"], received: parsed } };
    return { ...base, status: 201, statusText: "Created", body: { id: `user_${Math.random().toString(36).slice(2, 9)}`, ...parsed, createdAt: new Date().toISOString() } };
  }
  if (ep.method === "POST" && ep.path === "/api/v1/posts") {
    let parsed: any = {}; try { parsed = JSON.parse(bodyStr); } catch { /* */ }
    return { ...base, status: 201, statusText: "Created", body: { id: `post_${Math.random().toString(36).slice(2, 9)}`, ...parsed, createdAt: new Date().toISOString() } };
  }
  if (ep.method === "GET" && ep.path === "/api/v1/users") return { ...base, status: 200, statusText: "OK", body: { users: [{ id: "user_a4f", name: "Rohan Sharma", email: "rohan@example.com" }, { id: "user_b9c", name: "Priya Mehta", email: "priya@example.com" }], total: 2 } };
  if (ep.method === "GET" && ep.path === "/api/v1/users/:id") return { ...base, status: 200, statusText: "OK", body: { id: "user_a4f", name: "Rohan Sharma", email: "rohan@example.com", role: "user", createdAt: "2026-01-15T10:00:00Z" } };
  if (ep.method === "PUT" && ep.path === "/api/v1/users/:id") { let p: any = {}; try { p = JSON.parse(bodyStr); } catch { /* */ } return { ...base, status: 200, statusText: "OK", body: { id: "user_a4f", ...p, updatedAt: new Date().toISOString() } }; }
  if (ep.method === "PATCH" && ep.path === "/api/v1/users/:id") { let p: any = {}; try { p = JSON.parse(bodyStr); } catch { /* */ } return { ...base, status: 200, statusText: "OK", body: { id: "user_a4f", name: "Rohan Sharma", email: "rohan@example.com", ...p, updatedAt: new Date().toISOString() } }; }
  if (ep.method === "DELETE") return { ...base, status: 200, statusText: "OK", body: { deleted: true, id: ep.path.includes("post") ? "post_x91" : "user_a4f" } };
  if (ep.method === "GET" && ep.path === "/api/v1/posts") return { ...base, status: 200, statusText: "OK", body: { posts: [{ id: "post_x91", title: "Hello World", authorId: "user_a4f" }, { id: "post_y73", title: "System Design 101", authorId: "user_b9c" }], total: 2 } };
  if (ep.method === "GET" && ep.path === "/api/v1/posts/:id") return { ...base, status: 200, statusText: "OK", body: { id: "post_x91", title: "Hello World", content: "My first post.", authorId: "user_a4f", createdAt: "2026-02-10T08:30:00Z" } };
  if (ep.method === "GET" && ep.path === "/api/v1/health") return { ...base, status: 200, statusText: "OK", body: { status: "healthy", uptime: "12d 3h 44m", version: "1.0.4", timestamp: new Date().toISOString() } };
  return { ...base, status: 200, statusText: "OK", body: { message: "OK" } };
}

// ── Client → Server Diagram ─────────────────────────────────────────────────
function FlowDiagram({ activeEp, isLoading, response }: { activeEp: Endpoint; isLoading: boolean; response: SimResponse | null }) {
  const methodDot = METHOD_COLORS[activeEp.method].dot;
  const isSuccess = response && response.status < 400;
  const isError   = response && response.status >= 400;

  return (
    <div className="px-4 sm:px-6 py-4 border-b border-[var(--border)]/60 bg-[var(--surface)]/30">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/30 mb-3 font-mono">Request Flow</p>

      <div className="flex items-stretch gap-0 min-w-0">
        {/* Client box */}
        <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2.5 min-w-[72px] gap-1">
          <span className="text-xl">💻</span>
          <p className="text-[9px] font-bold text-[color:var(--foreground)]/60 uppercase tracking-wide">Client</p>
        </div>

        {/* Arrow channel */}
        <div className="flex-1 flex flex-col justify-center gap-1 px-2 min-w-0 relative">
          {/* Request arrow */}
          <div className="relative flex items-center gap-1.5 h-5">
            <div className="flex-1 h-px bg-[var(--border)]/60 relative overflow-hidden">
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    key="req-packet"
                    className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full shadow-lg"
                    style={{ backgroundColor: methodDot, boxShadow: `0 0 6px ${methodDot}` }}
                    initial={{ left: "0%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="shrink-0 text-[10px] text-[color:var(--foreground)]/30">→</div>
            <div className="shrink-0">
              <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${METHOD_COLORS[activeEp.method].cls}`}>
                {activeEp.method}
              </span>
            </div>
          </div>

          {/* Path label */}
          <p className="text-[9px] font-mono text-center text-[color:var(--foreground)]/35 truncate px-1">{activeEp.path}</p>

          {/* Response arrow */}
          <div className="relative flex items-center gap-1.5 h-5 flex-row-reverse">
            <div className="flex-1 h-px bg-[var(--border)]/60 relative overflow-hidden">
              <AnimatePresence>
                {response && !isLoading && (
                  <motion.div
                    key="res-packet"
                    className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full shadow-lg"
                    style={{ backgroundColor: isError ? "#f87171" : "#34d399", boxShadow: `0 0 6px ${isError ? "#f87171" : "#34d399"}` }}
                    initial={{ left: "100%" }}
                    animate={{ left: "0%" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="shrink-0 text-[10px] text-[color:var(--foreground)]/30">←</div>
            {response && !isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shrink-0">
                <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${STATUS_COLOR(response.status)}`}>
                  {response.status}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Server box */}
        <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 overflow-hidden min-w-[130px] max-w-[180px]">
          <div className="px-2.5 py-1.5 border-b border-[var(--border)]/50 flex items-center gap-1.5">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400/70" />
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
            </div>
            <p className="text-[8px] font-bold font-mono text-[color:var(--foreground)]/40">api.myapp.com</p>
          </div>
          <div className="py-1 max-h-[100px] overflow-y-auto scrollbar-thin">
            {ALL_ENDPOINTS.slice(0, 10).map((ep, i) => {
              const isActive = ep.path === activeEp.path && ep.method === activeEp.method;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2 py-0.5 transition-colors duration-150 ${isActive ? "bg-violet-500/15" : ""}`}
                >
                  <span className={`text-[7px] font-bold font-mono w-8 text-center shrink-0 ${METHOD_COLORS[ep.method].cls.split(" ")[0]}`}>
                    {ep.method}
                  </span>
                  <span className={`text-[7px] font-mono truncate ${isActive ? "text-violet-400" : "text-[color:var(--foreground)]/35"}`}>
                    {ep.path}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to parse bold, code, and links in descriptions
function parseTextWithLinks(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.*?)\*\*|`(.*?)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let match;
  let lastIndex = 0;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[1];
    if (fullMatch.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-[color:var(--foreground)]/90">
          {match[2]}
        </strong>
      );
    } else if (fullMatch.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[0.82em] bg-[var(--surface-muted)] px-1 py-0.5 rounded border border-[var(--border)] text-violet-400"
        >
          {match[3]}
        </code>
      );
    } else if (fullMatch.startsWith("[")) {
      const isExternal = match[5].startsWith("http");
      parts.push(
        <Link
          key={key++}
          href={match[5]}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-violet-400 hover:text-violet-300 underline font-semibold transition-colors duration-150"
        >
          {match[4]}
        </Link>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// ── Concept Accordion ────────────────────────────────────────────────────────
const CONCEPTS = [
  { id: "what-is-server",    icon: "🖥️", title: "What is a Web Server?",      content: `A [web server](/learn/glossary/server) is a program that **listens** on a port for incoming HTTP requests, processes them, and sends back a response.\n\nThink of it like a waiter:\n- You (the [client](/learn/glossary/request-response)) say: "I'd like a list of users."\n- The server fetches the data and brings it back.\n- You receive a [response](/learn/glossary/request-response) with the data.` },
  { id: "what-is-endpoint",  icon: "🔌", title: "What is an Endpoint?",       content: `An [endpoint](/learn/glossary/endpoint) is a specific URL + HTTP method the server listens on:\n\n- \`GET /api/v1/users\` → "Give me all users"\n- \`POST /api/v1/users\` → "Create a new user"\n- \`DELETE /api/v1/users/:id\` → "Delete user by ID"\n\nThe **path** = what. The **method** = how.` },
  { id: "http-methods",      icon: "⚡", title: "HTTP Methods",               content: `**GET** — Read data. Never changes anything. See details under [HTTP](/learn/glossary/http).\n**POST** — Create something new. Body required.\n**PUT** — Replace a full resource. Body required.\n**PATCH** — Update only specific fields. Body required.\n**DELETE** — Remove a resource.\n\nRule: GET = read, POST = create, PUT/PATCH = update, DELETE = remove.` },
  { id: "status-codes",      icon: "🚦", title: "HTTP Status Codes",          content: `**2xx — Success:** \`200 OK\` / \`201 Created\`\n**4xx — Client Error:** See [Status Codes](/learn/glossary/status-codes).\n- \`400\` Bad Request — wrong body\n- \`401\` Unauthorized — not logged in\n- \`403\` Forbidden — no permission\n- \`404\` Not Found — route doesn't exist\n- \`405\` Method Not Allowed — wrong verb\n**5xx — Server Error:** \`500\` Internal Server Error` },
  { id: "request-response",  icon: "📦", title: "Request & Response Anatomy", content: `**Request (client → server):**\n- Method + URL + Headers + optional Body. See [Request / Response](/learn/glossary/request-response).\n\n**Response (server → client):**\n- Status Code + Headers + Body (JSON)\n\nHeaders = metadata envelope. Body = the actual data.\n\nEvery interaction follows this cycle, taking ~20–200ms.` },
  { id: "json",              icon: "{}", title: "What is JSON?",              content: `[JSON](/learn/glossary/json) (JavaScript Object Notation) is the universal format for sending structured data:\n\n\`\`\`\n{"id":"user_a4f","name":"Rohan","active":true}\n\`\`\`\n\nSupports: strings, numbers, booleans, null, arrays, nested objects.\nEvery programming language can read it. APIs use it everywhere.` },
];

const CHALLENGES = [
  {
    id: "fetchUsers",
    title: "1. Read User Database",
    desc: "Fetch list of all users. Select GET method and send request to `/api/v1/users`.",
    expectedMethod: "GET" as HttpMethod,
    expectedPath: "/api/v1/users",
    expectedStatus: 200,
    setup: { method: "GET" as HttpMethod, path: "/api/v1/users" }
  },
  {
    id: "createUser",
    title: "2. Create a User",
    desc: "Add a new user record. Select POST and send to `/api/v1/users` with name and email body.",
    expectedMethod: "POST" as HttpMethod,
    expectedPath: "/api/v1/users",
    expectedStatus: 201,
    setup: { method: "POST" as HttpMethod, path: "/api/v1/users", body: { name: "Rohan Sharma", email: "rohan@example.com", role: "user" } }
  },
  {
    id: "validationError",
    title: "3. Trigger Validation Error",
    desc: "Send POST `/api/v1/users` with missing required fields (empty body {}) to trigger 400 Bad Request.",
    expectedMethod: "POST" as HttpMethod,
    expectedPath: "/api/v1/users",
    expectedStatus: 400,
    setup: { method: "POST" as HttpMethod, path: "/api/v1/users", body: {} }
  },
  {
    id: "getUserById",
    title: "4. Query Specific User",
    desc: "Retrieve a single user details. Send GET to `/api/v1/users/:id`.",
    expectedMethod: "GET" as HttpMethod,
    expectedPath: "/api/v1/users/:id",
    expectedStatus: 200,
    setup: { method: "GET" as HttpMethod, path: "/api/v1/users/:id" }
  },
  {
    id: "routeNotFound",
    title: "5. Hit an Unknown Route",
    desc: "Request a path that does not exist. Send GET to `/api/v1/unknown-route` to trigger a 404 Not Found.",
    expectedMethod: "GET" as HttpMethod,
    expectedPath: "/api/v1/unknown-route",
    expectedStatus: 404,
    setup: { method: "GET" as HttpMethod, path: "/api/v1/unknown-route" }
  },
  {
    id: "methodNotAllowed",
    title: "6. Method Not Allowed",
    desc: "Attempt an unsupported verb. Send DELETE to `/api/v1/health` to trigger 405 Method Not Allowed.",
    expectedMethod: "DELETE" as HttpMethod,
    expectedPath: "/api/v1/health",
    expectedStatus: 405,
    setup: { method: "DELETE" as HttpMethod, path: "/api/v1/health" }
  },
  {
    id: "checkHealth",
    title: "7. Verify System Health",
    desc: "Monitor system health status. Send GET request to `/api/v1/health` (expected 200 OK).",
    expectedMethod: "GET" as HttpMethod,
    expectedPath: "/api/v1/health",
    expectedStatus: 200,
    setup: { method: "GET" as HttpMethod, path: "/api/v1/health" }
  },
  {
    id: "deleteUser",
    title: "8. Delete User Record",
    desc: "Remove a record from user database. Send DELETE to `/api/v1/users/:id`.",
    expectedMethod: "DELETE" as HttpMethod,
    expectedPath: "/api/v1/users/:id",
    expectedStatus: 200,
    setup: { method: "DELETE" as HttpMethod, path: "/api/v1/users/:id" }
  }
];

function ConceptCard({ c, active, onClick }: { c: typeof CONCEPTS[0]; active: boolean; onClick: () => void }) {
  const renderLine = (line: string, i: number) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-1" />;
    if (trimmed.startsWith("```")) return null;
    const parts = parseTextWithLinks(trimmed || line);

    if (trimmed.startsWith("- ")) {
      return <li key={i} className="ml-4 list-disc text-[0.82em] text-[color:var(--foreground)]/60 leading-relaxed">{parseTextWithLinks(trimmed.slice(2))}</li>;
    }
    return <p key={i} className="text-[0.82em] text-[color:var(--foreground)]/60 leading-relaxed">{parts}</p>;
  };
  return (
    <button type="button" onClick={onClick} className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 ${active ? "border-violet-500/40 bg-violet-500/8" : "border-[var(--border)] bg-[var(--surface)]/40 hover:bg-[var(--surface)]/70"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{c.icon}</span>
        <span className={`text-xs font-bold ${active ? "text-violet-400" : "text-[color:var(--foreground)]"} transition-colors`}>{c.title}</span>
        <span className={`ml-auto text-[color:var(--foreground)]/25 transition-transform duration-200 text-xs ${active ? "rotate-90" : ""}`}>▶</span>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} className="overflow-hidden">
            <div className="pt-2.5 space-y-1 border-t border-violet-500/15 mt-1.5">
              {c.content.split("\n").map((l, i) => renderLine(l, i))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function ServerLearnPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeEp, setActiveEp] = useState<Endpoint>(ALL_ENDPOINTS[0]);
  const [activeConcept, setActiveConcept] = useState<string>("what-is-server");
  const [bodyStr, setBodyStr] = useState(JSON.stringify(ALL_ENDPOINTS[0].body ?? {}, null, 2));
  const [response, setResponse] = useState<SimResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"headers" | "body">("body");
  const [sidebarTab, setSidebarTab] = useState<"lessons" | "challenges">("lessons");
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});
  const [mobileView, setMobileView] = useState<"academy" | "endpoints" | "explorer">("academy");
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) setTheme("light");

    try {
      const savedChallenges = window.localStorage.getItem("FF_COMPLETED_CHALLENGES");
      if (savedChallenges) {
        setCompletedChallenges(JSON.parse(savedChallenges));
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  const selectEndpoint = (ep: Endpoint) => {
    setActiveEp(ep);
    setBodyStr(JSON.stringify(ep.body ?? {}, null, 2));
    setResponse(null);
    setMobileView("explorer");
  };

  const loadChallenge = (ch: typeof CHALLENGES[0]) => {
    const found = ALL_ENDPOINTS.find(e => e.method === ch.setup.method && e.path === ch.setup.path);
    if (found) {
      setActiveEp(found);
      if (ch.setup.body !== undefined) {
        setBodyStr(JSON.stringify(ch.setup.body, null, 2));
      } else {
        setBodyStr(JSON.stringify(found.body ?? {}, null, 2));
      }
      setResponse(null);
      setMobileView("explorer");
    }
  };

  const completedCount = Object.values(completedChallenges).filter(Boolean).length;

  const sendRequest = () => {
    setIsLoading(true); setResponse(null);
    setTimeout(() => {
      const res = simulateResponse(activeEp, bodyStr);
      setResponse(res); setIsLoading(false);

      // Check challenges
      setCompletedChallenges(prev => {
        const next = { ...prev };
        let changed = false;

        CHALLENGES.forEach(ch => {
          if (next[ch.id]) return;
          if (activeEp.method === ch.expectedMethod && activeEp.path === ch.expectedPath && res.status === ch.expectedStatus) {
            next[ch.id] = true;
            changed = true;
          }
        });

        if (changed) {
          window.localStorage.setItem("FF_COMPLETED_CHALLENGES", JSON.stringify(next));
        }
        return next;
      });

      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
    }, Math.floor(Math.random() * 60 + 50));
  };

  const hasBody = ["POST", "PUT", "PATCH"].includes(activeEp.method);

  return (
    <main className="h-[100dvh] bg-[var(--background)] text-[color:var(--foreground)] flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-20" />
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />

      <SiteHeader theme={theme} onToggleTheme={() => setTheme(p => p === "dark" ? "light" : "dark")} showHomeLink badgeText="Learn Academy" alwaysGlass />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)]/60 bg-[var(--surface)]/40 backdrop-blur shrink-0">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-10 flex items-center text-xs text-[color:var(--foreground)]/40 font-mono">
          <div className="flex items-center gap-2">
            <Link href="/learn" className="hover:text-emerald-400 transition-colors">← Learn</Link>
            <span>/</span>
            <span className="text-emerald-400">Web Server Explorer</span>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Tab Bar */}
      <div className="lg:hidden border-b border-[var(--border)]/60 bg-[var(--surface)]/10 p-2 flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setMobileView("academy")}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg border transition-all ${
            mobileView === "academy"
              ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
              : "border-transparent text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]/70"
          }`}
        >
          📖 Academy
        </button>
        <button
          type="button"
          onClick={() => setMobileView("endpoints")}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg border transition-all ${
            mobileView === "endpoints"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "border-transparent text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]/70"
          }`}
        >
          🔌 Endpoints
        </button>
        <button
          type="button"
          onClick={() => setMobileView("explorer")}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg border transition-all ${
            mobileView === "explorer"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "border-transparent text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]/70"
          }`}
        >
          ⚡ Explorer
        </button>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Col 1 — Lessons & Challenges */}
        <aside
          className={`border-r border-[var(--border)]/60 bg-[var(--background)] flex-col lg:w-[280px] lg:xl:w-[300px] shrink-0 overflow-hidden ${
            mobileView === "academy" ? "flex w-full" : "hidden lg:flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-[var(--border)]/60 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[color:var(--foreground)]/30 font-mono">Academy</p>
              {sidebarTab === "challenges" && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {completedCount}/{CHALLENGES.length} Done
                </span>
              )}
            </div>
            
            <div className="mt-2 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex shrink-0">
              <button
                type="button"
                onClick={() => setSidebarTab("lessons")}
                className={`flex-1 text-center py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  sidebarTab === "lessons"
                    ? "bg-[var(--surface)] border border-[var(--border)] text-[color:var(--foreground)]"
                    : "text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)]/70"
                }`}
              >
                📖 Lessons
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("challenges")}
                className={`flex-1 text-center py-1 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === "challenges"
                    ? "bg-[var(--surface)] border border-[var(--border)] text-[color:var(--foreground)]"
                    : "text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)]/70"
                }`}
              >
                🎯 Challenges
                {completedCount === CHALLENGES.length && (
                  <span className="text-emerald-400 text-[10px]">✓</span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
            {sidebarTab === "lessons" ? (
              <>
                {CONCEPTS.map(c => (
                  <ConceptCard key={c.id} c={c} active={activeConcept === c.id} onClick={() => setActiveConcept(p => p === c.id ? "" : c.id)} />
                ))}
                <div className="pt-2">
                  <Link href="/learn/glossary" className="flex items-center justify-between gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 px-3 py-2.5 text-xs font-bold text-violet-400 transition-all duration-200">
                    <span>📖 Systems Glossary</span>
                    <span>→</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--surface)]/25 p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-[color:var(--foreground)]/50">
                    <span>Academy Progress</span>
                    <span className="font-bold">{Math.round((completedCount / CHALLENGES.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(completedCount / CHALLENGES.length) * 100}%` }}
                    />
                  </div>
                </div>

                {CHALLENGES.map(ch => {
                  const isDone = completedChallenges[ch.id];
                  return (
                    <div
                      key={ch.id}
                      className={`rounded-xl border p-3 flex flex-col gap-1.5 transition-all duration-200 ${
                        isDone
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-[var(--border)] bg-[var(--surface)]/30 hover:bg-[var(--surface)]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[11px] font-bold leading-tight ${isDone ? "text-emerald-400/80 line-through decoration-emerald-500/30" : "text-[color:var(--foreground)]"}`}>
                          {ch.title}
                        </p>
                        {isDone ? (
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">✓ Done</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => loadChallenge(ch)}
                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-violet-500/20 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10 cursor-pointer"
                          >
                            Load
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-[color:var(--foreground)]/50 leading-relaxed font-sans">
                        {ch.desc}
                      </p>
                    </div>
                  );
                })}

                {completedCount === CHALLENGES.length && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
                    <p className="text-xl">🏆</p>
                    <p className="text-xs font-bold text-emerald-400">All Challenges Completed!</p>
                    <p className="text-[10px] text-[color:var(--foreground)]/65 leading-relaxed">
                      You've successfully simulated requests, triggered errors, and queried endpoints. Now, build custom architectures in the sandbox!
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/workspace"
                        target="_blank"
                        className="inline-block text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition-all cursor-pointer"
                      >
                        Go to Sandbox
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Col 2 — Endpoint List */}
        <aside
          className={`border-r border-[var(--border)]/60 flex-col bg-[var(--background)] overflow-hidden lg:w-[220px] lg:xl:w-[250px] shrink-0 ${
            mobileView === "endpoints" ? "flex w-full" : "hidden lg:flex"
          }`}
        >
          <div className="px-3 py-3.5 border-b border-[var(--border)]/60 shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[color:var(--foreground)]/30 font-mono">Endpoints</p>
            <p className="text-[10px] text-[color:var(--foreground)]/40 mt-0.5">Select to explore</p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {ENDPOINT_GROUPS.map(group => (
              <div key={group.label}>
                <p className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[color:var(--foreground)]/25 font-mono">{group.label}</p>
                {group.endpoints.map((ep, i) => {
                  const isActive = ep.path === activeEp.path && ep.method === activeEp.method;
                  return (
                    <button key={i} type="button" onClick={() => selectEndpoint(ep)} className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors duration-150 border-l-2 ${isActive ? "bg-[var(--surface)]/70 border-l-emerald-400" : "border-l-transparent hover:bg-[var(--surface)]/40"}`}>
                      <span className={`shrink-0 mt-0.5 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border w-[42px] text-center ${METHOD_COLORS[ep.method].cls}`}>{ep.method}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-[color:var(--foreground)]/75 truncate">{ep.path}</p>
                        <p className="text-[9px] text-[color:var(--foreground)]/35 mt-0.5 leading-snug truncate">{ep.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Col 3 — Request / Response + Diagram */}
        <main
          className={`flex-1 flex flex-col overflow-hidden min-w-0 ${
            mobileView === "explorer" ? "flex" : "hidden lg:flex"
          }`}
        >

          {/* Flow Diagram */}
          <FlowDiagram activeEp={activeEp} isLoading={isLoading} response={response} />

          {/* URL bar + body editor */}
          <div className="border-b border-[var(--border)]/60 bg-[var(--surface)]/15 shrink-0">
            <div className="px-4 sm:px-5 py-3 flex items-center gap-2.5">
              <span className={`shrink-0 text-[10px] font-bold font-mono px-2 py-1 rounded-lg border ${METHOD_COLORS[activeEp.method].cls}`}>{activeEp.method}</span>
              <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1.5 font-mono text-xs text-[color:var(--foreground)]/75 truncate">
                http://api.myapp.com{activeEp.path}
              </div>
              <button type="button" onClick={sendRequest} disabled={isLoading} className="shrink-0 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-4 py-1.5 text-sm font-bold text-white transition-all duration-150 hover:shadow-[0_4px_16px_-8px_rgba(52,211,153,0.6)] active:scale-95 cursor-pointer whitespace-nowrap">
                {isLoading ? "Sending…" : "Send →"}
              </button>
            </div>
            <div className="px-4 sm:px-5 pb-2">
              <p className="text-[10px] text-[color:var(--foreground)]/35">{activeEp.desc}</p>
            </div>
            {hasBody && (
              <div className="px-4 sm:px-5 pb-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--foreground)]/30 font-mono">Request Body</p>
                  <span className="text-[8px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[color:var(--foreground)]/25 font-mono">application/json</span>
                </div>
                <textarea value={bodyStr} onChange={e => setBodyStr(e.target.value)} rows={5} spellCheck={false} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3.5 py-2.5 font-mono text-xs text-[color:var(--foreground)]/80 resize-none outline-none focus:border-emerald-500/40 transition-colors duration-150 scrollbar-thin" />
                <p className="text-[9px] text-[color:var(--foreground)]/25">Edit the JSON — try sending with missing fields to trigger a 400 error.</p>
              </div>
            )}
          </div>

          {/* Response */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-5" ref={responseRef}>
            {!response && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-35">
                <div className="text-4xl">↑</div>
                <p className="text-sm font-semibold">Select an endpoint and hit Send</p>
                <p className="text-xs text-[color:var(--foreground)]/60 max-w-xs">Watch the packet travel through the Client → Server diagram above, then the response comes back.</p>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-3 text-sm text-[color:var(--foreground)]/50 font-mono">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Sending request…
              </div>
            )}
            {response && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`text-sm font-bold font-mono px-3 py-1 rounded-lg border ${STATUS_COLOR(response.status)}`}>{response.status} {response.statusText}</span>
                  <span className="text-xs text-[color:var(--foreground)]/35 font-mono">{response.latency}ms</span>
                  <span className="text-xs text-[color:var(--foreground)]/35 font-mono">{JSON.stringify(response.body).length}B</span>
                </div>
                <div className={`rounded-xl border px-4 py-2.5 text-xs leading-relaxed ${response.status >= 400 ? "border-amber-500/20 bg-amber-500/5 text-amber-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}>
                  {response.status === 200 && "✅  200 OK — Request succeeded. Data is in the response body."}
                  {response.status === 201 && "✅  201 Created — New resource was created. Server generated the ID."}
                  {response.status === 400 && "⚠️  400 Bad Request — Invalid request body. Check for missing or wrong fields."}
                  {response.status === 404 && "❌  404 Not Found — No route matched this path on the server."}
                  {response.status === 405 && "❌  405 Method Not Allowed — Route exists but doesn't support this HTTP method."}
                  {response.status >= 500 && "💥  500 Server Error — Something crashed server-side."}
                </div>
                <div className="border-b border-[var(--border)]/60 flex">
                  {(["body", "headers"] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-xs font-bold capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-emerald-400 text-emerald-400" : "border-transparent text-[color:var(--foreground)]/35 hover:text-[color:var(--foreground)]/60"}`}>{tab}</button>
                  ))}
                </div>
                {activeTab === "body" && <pre className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3.5 font-mono text-xs text-[color:var(--foreground)]/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">{JSON.stringify(response.body, null, 2)}</pre>}
                {activeTab === "headers" && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 overflow-hidden divide-y divide-[var(--border)]/40">
                    {Object.entries(response.headers).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-4 px-4 py-2">
                        <span className="text-[10px] font-mono font-bold text-[color:var(--foreground)]/45 w-40 shrink-0">{k}</span>
                        <span className="text-[10px] font-mono text-emerald-400">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-xl border border-[var(--border)]/40 bg-[var(--surface)]/25 p-3 text-[10px] text-[color:var(--foreground)]/40 leading-relaxed">
                  <span className="font-bold text-[color:var(--foreground)]/55">💡 </span>
                  {response.status === 201 ? "The server generated a unique ID and timestamp — you didn't send those." : response.status === 400 ? "Validation failed before any DB write. Fast, cheap, protective." : response.status === 404 ? "Server searched its routing table and found no match." : response.status === 405 ? "Route exists — but this HTTP method is not registered on it." : "Response body is JSON — every language can parse and use it."}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </main>
  );
}
