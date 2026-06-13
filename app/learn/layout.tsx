import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn Distributed Systems Concepts | FlowFrame",
  description: "Master distributed systems fundamentals through interactive step-by-step guides. Learn about Load Balancers, Caching, API Gateways, and Valet Key architectures.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
