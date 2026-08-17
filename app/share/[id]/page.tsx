"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import WorkspacePage from "../../workspace/page";

export default function SharedDiagramPage() {
  const params = useParams();
  const diagramId = params?.id as string;

  if (!diagramId) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-2xl shadow-2xl max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold">
            !
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-[color:var(--foreground)]">Invalid Share Link</h2>
            <p className="text-xs text-[color:var(--foreground)]/50">No diagram ID was provided in the share URL.</p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 text-xs font-bold transition shadow-md"
          >
            Go to FlowFrame Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Shared View Top Notification Banner */}
      <div className="z-30 bg-gradient-to-r from-violet-950/80 via-slate-900/90 to-indigo-950/80 border-b border-violet-500/20 px-4 py-1.5 flex items-center justify-between text-xs backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-violet-300 text-[11px] tracking-wide">
            Shared Architecture View
          </span>
          <span className="text-[color:var(--foreground)]/40 hidden sm:inline">|</span>
          <span className="text-[color:var(--foreground)]/60 text-[11px] hidden sm:inline">
            Interactive simulation & node inspection enabled
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/workspace"
            className="rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 px-3 py-1 text-[11px] font-semibold transition"
          >
            Open Sandbox Studio
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 text-[11px] font-bold transition shadow-sm"
          >
            Sign Up Free
          </Link>
        </div>
      </div>

      {/* Main Interactive Canvas Editor */}
      <div className="flex-1 min-h-0 relative">
        <WorkspacePage shareId={diagramId} isSharedView={true} />
      </div>
    </div>
  );
}
