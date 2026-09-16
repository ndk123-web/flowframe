import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://flowframe.ndkdev.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static application routes
  const staticRoutes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/dashboard", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/workspace", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/scenarios", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/learn", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/learn/glossary", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/learn/server", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/docs", priority: 0.8, changeFrequency: "weekly" as const },
  ];

  const staticSitemaps = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic interactive scenarios
  const scenarioIds = [
    "simple-load-balancer",
    "simple-cache",
    "simple-api-gateway",
    "simple-valet-key",
    "event-driven",
    "simple-message-queue",
  ];

  const scenarioSitemaps = scenarioIds.map((id) => ({
    url: `${BASE_URL}/scenarios/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic learn topics
  const topicIds = [
    "load-balancers",
    "cache-aside",
    "api-gateways",
    "valet-key",
  ];

  const topicSitemaps = topicIds.map((id) => ({
    url: `${BASE_URL}/learn/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  // Dynamic systems glossary terms
  const termIds = [
    "http",
    "https",
    "rest",
    "endpoint",
    "status-codes",
    "json",
    "request-response",
    "headers",
    "api",
    "server",
    "load-balancer",
    "api-gateway",
    "cdn",
    "reverse-proxy",
    "horizontal-scaling",
    "vertical-scaling",
    "database",
    "sql",
    "postgres",
    "redis",
    "nosql",
    "index",
    "cache",
    "cache-aside",
    "ttl",
    "latency",
    "throughput",
    "rate-limiting",
    "authentication",
    "authorization",
    "jwt",
    "tls",
    "signed-url",
    "microservices",
    "monolith",
    "high-availability",
    "fault-tolerance",
    "circuit-breaker",
    "dns",
    "ip",
    "tcp",
    "websocket",
    "bandwidth",
  ];

  const glossarySitemaps = termIds.map((id) => ({
    url: `${BASE_URL}/learn/glossary/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...staticSitemaps, ...scenarioSitemaps, ...topicSitemaps, ...glossarySitemaps];
}
