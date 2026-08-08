import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagram Editor | FlowFrame",
  description: "Design and simulate distributed architecture flows with the FlowFrame visual editor.",
};

export default function DiagramEditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
