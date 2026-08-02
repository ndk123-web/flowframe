import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace | FlowFrame",
  description: "View and manage architecture diagrams inside your FlowFrame workspace.",
};

export default function WorkspaceDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
