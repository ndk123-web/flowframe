"use client";

import { useParams } from "next/navigation";
import WorkspacePage from "../../../../workspace/page";

export default function DashboardDiagramEditorPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const diagramId = params.did as string;

  return <WorkspacePage workspaceId={workspaceId} diagramId={diagramId} />;
}
