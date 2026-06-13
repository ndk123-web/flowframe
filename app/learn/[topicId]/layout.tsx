import { Metadata } from "next";

type Props = {
  params: Promise<{ topicId: string }>;
};

const TOPIC_META: Record<string, { title: string; description: string }> = {
  "load-balancers": {
    title: "Learn Load Balancing & Request Routing | FlowFrame",
    description: "Interactive tutorial on Load Balancers. Learn how traffic is routed, health checks identify offline servers, and routing algorithms operate.",
  },
  "cache-aside": {
    title: "Learn Cache-Aside (Redis + Database) Patterns | FlowFrame",
    description: "Interactive tutorial on the Cache-Aside pattern. Learn about caching lookups, database fallbacks, cache invalidation, and data consistency.",
  },
  "api-gateways": {
    title: "Learn API Gateway Routing & Policies | FlowFrame",
    description: "Interactive tutorial on API Gateways. Learn about request routing, protocol translation, rate limiting, and centralized security control.",
  },
  "valet-key": {
    title: "Learn Valet Key Pattern (Direct Uploads) | FlowFrame",
    description: "Interactive tutorial on the Valet Key pattern. Learn how to issue signed URLs for client-side storage uploads to optimize network load.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const meta = TOPIC_META[resolvedParams.topicId] || {
    title: "Learn Distributed Systems Architectural Patterns | FlowFrame",
    description: "Interactive guides and visual step-by-step frame simulations of distributed system architectures.",
  };

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function LearnTopicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
