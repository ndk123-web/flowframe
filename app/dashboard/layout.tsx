import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | FlowFrame",
  description:
    "Manage your workspaces, diagrams, and architecture simulations from your personal FlowFrame dashboard.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
