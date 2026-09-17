"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import WorkspacePage from "../../../../workspace/page";
import FlowLoader from "@/components/FlowLoader";

export default function DashboardDiagramEditorPage() {
  const params = useParams();
  const workspaceId = params?.id as string;
  const diagramId = params?.did as string;
  const { _hasHydrated } = useAuthStore();

  if (!_hasHydrated || !workspaceId || !diagramId) {
    return (
      <FlowLoader
        size="fullscreen"
        label="Opening Diagram Canvas..."
        sublabel="Initializing workspace & node configurations"
      />
    );
  }

  return <WorkspacePage workspaceId={workspaceId} diagramId={diagramId} />;
}
