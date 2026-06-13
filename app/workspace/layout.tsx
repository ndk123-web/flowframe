import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Sandbox Workspace | FlowFrame",
  description: "Design custom distributed architectures from scratch. Add clients, load balancers, servers, Redis caches, Postgres databases, and API gateways to simulate request flows.",
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
