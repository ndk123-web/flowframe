import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://flowframe.taskplexus.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const routes = ["", "/workspace", "/scenarios", "/learn", "/learn/server", "/learn/glossary"];

  const staticSitemaps = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic scenarios
  const scenarioIds = [
    "simple-load-balancer",
    "simple-cache",
    "simple-api-gateway",
    "simple-valet-key",
  ];

  const scenarioSitemaps = scenarioIds.map((id) => ({
    url: `${BASE_URL}/scenarios/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
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
    priority: 0.7,
  }));

  // Dynamic glossary terms
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
    priority: 0.6,
  }));

  return [...staticSitemaps, ...scenarioSitemaps, ...topicSitemaps, ...glossarySitemaps];
}
