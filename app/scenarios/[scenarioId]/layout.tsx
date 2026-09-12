import { Metadata } from "next";

type Props = {
  params: Promise<{ scenarioId: string }>;
};

// Map scenario IDs to clean SEO titles and descriptions
const SCENARIO_META: Record<string, { title: string; description: string }> = {
  "simple-load-balancer": {
    title: "Load Balancer Flow Simulation | FlowFrame",
    description: "Visualize how a Load Balancer routes incoming client requests across backend servers using a Round-Robin strategy frame-by-frame.",
  },
  "load-balancer": {
    title: "Load Balancer Flow Simulation | FlowFrame",
    description: "Visualize how a Load Balancer routes incoming client requests across backend servers using a Round-Robin strategy frame-by-frame.",
  },
  "simple-cache": {
    title: "Cache-Aside (Redis + Postgres) Flow Simulation | FlowFrame",
    description: "Visualize Redis cache hits, misses, databases fallback (PostgreSQL), and cache population workflows frame-by-frame.",
  },
  "cache-aside": {
    title: "Cache-Aside (Redis + Postgres) Flow Simulation | FlowFrame",
    description: "Visualize Redis cache hits, misses, databases fallback (PostgreSQL), and cache population workflows frame-by-frame.",
  },
  "simple-api-gateway": {
    title: "API Gateway Routing & Caching Simulation | FlowFrame",
    description: "Visualize API Gateway routing policies, load balancing, caching integration, and databases request flows frame-by-frame.",
  },
  "api-gateway": {
    title: "API Gateway Routing & Caching Simulation | FlowFrame",
    description: "Visualize API Gateway routing policies, load balancing, caching integration, and databases request flows frame-by-frame.",
  },
  "simple-valet-key": {
    title: "Valet Key Pattern (Direct Storage Upload) Simulation | FlowFrame",
    description: "Visualize the Valet Key design pattern. Watch how a client requests a signed URL from the server and uploads media directly to cloud storage.",
  },
  "valet-key": {
    title: "Valet Key Pattern (Direct Storage Upload) Simulation | FlowFrame",
    description: "Visualize the Valet Key design pattern. Watch how a client requests a signed URL from the server and uploads media directly to cloud storage.",
  },
  "event-driven": {
    title: "Event-Driven Pub/Sub Fan-Out Simulation | FlowFrame",
    description: "Simulate and inspect how a Pub/Sub Broker distributes published domain events to multiple decoupled subscriber microservices in parallel.",
  },
  "simple-pub-sub": {
    title: "Event-Driven Pub/Sub Fan-Out Simulation | FlowFrame",
    description: "Simulate and inspect how a Pub/Sub Broker distributes published domain events to multiple decoupled subscriber microservices in parallel.",
  },
  "pub-sub": {
    title: "Event-Driven Pub/Sub Fan-Out Simulation | FlowFrame",
    description: "Simulate and inspect how a Pub/Sub Broker distributes published domain events to multiple decoupled subscriber microservices in parallel.",
  },
  "simple-message-queue": {
    title: "Asynchronous Message Queue & Workers Simulation | FlowFrame",
    description: "Visualize asynchronous task buffering with a FIFO message queue, competing worker processing, and PostgreSQL database persistence.",
  },
  "message-queue": {
    title: "Asynchronous Message Queue & Workers Simulation | FlowFrame",
    description: "Visualize asynchronous task buffering with a FIFO message queue, competing worker processing, and PostgreSQL database persistence.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const meta = SCENARIO_META[resolvedParams.scenarioId] || {
    title: "Distributed System Scenario Simulation | FlowFrame",
    description: "Simulate and visualize distributed system request flows frame-by-frame in real-time.",
  };

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function ScenarioIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
