"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import WorkspacePage from "../../../../workspace/page";

export default function DashboardDiagramEditorPage() {
  const params = useParams();
  const workspaceId = params?.id as string;
  const diagramId = params?.did as string;
  const { _hasHydrated } = useAuthStore();

  if (!_hasHydrated || !workspaceId || !diagramId) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-2xl shadow-2xl">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-sm">
              ⚡
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-tight text-[color:var(--foreground)]">Opening Diagram Canvas...</h2>
            <p className="text-xs text-[color:var(--foreground)]/50 font-mono">Initializing workspace & node configurations</p>
          </div>
        </div>
      </div>
    );
  }

  return <WorkspacePage workspaceId={workspaceId} diagramId={diagramId} />;
}
