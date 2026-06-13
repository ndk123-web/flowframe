import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Distributed System Scenario Library | FlowFrame",
  description: "Browse pre-configured distributed system scenarios. Explore Round-Robin Load Balancing, Cache-Aside patterns, API Gateway routing, and Valet Key direct uploads.",
};

export default function ScenariosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
