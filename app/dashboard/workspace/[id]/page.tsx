"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useThemeStore } from "@/store/useThemeStore";
import UserDropdown from "@/components/UserDropdown";
import {
  DiagramIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  CartIcon,
  ChatIcon,
  CreditCardIcon,
  ZapIcon,
  NodeLinkIcon,
} from "@/components/DashboardIcons";

import { getWorkspaceById, updateWorkspace, WorkspaceDTO } from "@/services/workspaceApi";
import {
  getWorkspaceDiagrams,
  createDiagram,
  updateDiagram,
  deleteDiagram,
} from "@/services/diagramApi";
import { formatDate } from "@/utils/formatDate";

type ViewMode = "grid" | "list";

interface DiagramItem {
  id: string;
  name: string;
  description: string;
  nodes_count: number;
  edges_count: number;
  version: string;
  updated_at: string;
}

export default function WorkspaceDetailPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [workspace, setWorkspace] = useState<WorkspaceDTO | null>(null);
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDiagramOpen, setCreateDiagramOpen] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState("");
  const [newDiagramDesc, setNewDiagramDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Workspace modal states
  const [editWsOpen, setEditWsOpen] = useState(false);
  const [editWsName, setEditWsName] = useState("");
  const [editWsDesc, setEditWsDesc] = useState("");
  const [editWsEnv, setEditWsEnv] = useState<"DEV" | "PROD" | "STAGING">("DEV");

  // Edit Diagram modal states
  const [editDiagramOpen, setEditDiagramOpen] = useState(false);
  const [editingDiagramId, setEditingDiagramId] = useState<string | null>(null);
  const [editDiagramTitle, setEditDiagramTitle] = useState("");
  const [editDiagramDesc, setEditDiagramDesc] = useState("");

  // Delete Diagram modal states
  const [deleteDiagramModalOpen, setDeleteDiagramModalOpen] = useState(false);
  const [deletingDiagram, setDeletingDiagram] = useState<DiagramItem | null>(null);
  const [isDeletingDiagram, setIsDeletingDiagram] = useState(false);

  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.id as string;

  const { user, token, isAuthenticated, _hasHydrated } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const filteredDiagrams = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return diagrams.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [diagrams, searchQuery]);

  // Auth Guard with Zustand Hydration check
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) router.replace("/signin");
  }, [_hasHydrated, isAuthenticated, router]);

  // Fetch Workspace and Diagrams from API
  useEffect(() => {
    if (token && workspaceId) {
      setLoading(true);
      Promise.all([
        getWorkspaceById(workspaceId, token),
        getWorkspaceDiagrams(workspaceId, token),
      ])
        .then(([wsData, diagramsData]) => {
          setWorkspace(wsData);
          const items: DiagramItem[] = diagramsData.map((d) => ({
            id: d.id,
            name: d.title || (d as any).name || "Untitled Architecture",
            description: d.description || "No description provided.",
            nodes_count: d.nodes_count || (d.nodes ? d.nodes.length : 0),
            edges_count: d.edges_count || (d.edges ? d.edges.length : 0),
            version: d.version || "1.0",
            updated_at: d.updated_at,
          }));
          setDiagrams(items);
        })
        .catch((err) => {
          console.error("Failed to load workspace data:", err);
          showToast("Failed to load workspace from server", "error");
        })
        .finally(() => setLoading(false));
    }
  }, [token, workspaceId, showToast]);

  const handleCreateDiagram = async () => {
    if (!newDiagramName.trim()) {
      showToast("Please enter a diagram name.", "error");
      return;
    }

    if (diagrams.length >= 5) {
      showToast("Personal Plan limit reached (5/5 Diagrams per workspace).", "error");
      return;
    }

    if (!token || !workspaceId) return;

    try {
      const created = await createDiagram(
        workspaceId,
        {
          title: newDiagramName.trim(),
          description: newDiagramDesc.trim() || undefined,
        },
        token
      );

      const newItem: DiagramItem = {
        id: created.id,
        name: created.title || newDiagramName.trim(),
        description: created.description || "No description provided.",
        nodes_count: 0,
        edges_count: 0,
        version: created.version || "1.0",
        updated_at: "Just now",
      };

      setDiagrams([newItem, ...diagrams]);
      showToast(`Diagram "${newItem.name}" created!`, "success");
      setCreateDiagramOpen(false);
      setNewDiagramName("");
      setNewDiagramDesc("");

      router.push(`/dashboard/workspace/${workspaceId}/${created.id}`);
    } catch (err: any) {
      showToast(err.message || "Failed to create diagram", "error");
    }
  };

  const openEditWorkspaceModal = () => {
    if (!workspace) return;
    setEditWsName(workspace.name);
    setEditWsDesc(workspace.description || "");
    setEditWsEnv(workspace.env as any);
    setEditWsOpen(true);
  };

  const handleUpdateWorkspace = async () => {
    if (!workspace || !editWsName.trim() || !token) return;
    try {
      const updated = await updateWorkspace(
        workspace.id,
        {
          name: editWsName.trim(),
          description: editWsDesc.trim() || undefined,
          env: editWsEnv,
        },
        token
      );

      setWorkspace((prev) => (prev ? { ...prev, ...updated } : null));
      showToast(`Workspace "${updated.name}" updated!`, "success");
      setEditWsOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to update workspace", "error");
    }
  };

  const openEditDiagramModal = (d: DiagramItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingDiagramId(d.id);
    setEditDiagramTitle(d.name);
    setEditDiagramDesc(d.description);
    setEditDiagramOpen(true);
  };

  const handleUpdateDiagram = async () => {
    if (!editingDiagramId || !editDiagramTitle.trim() || !token || !workspaceId) return;
    try {
      const updated = await updateDiagram(
        workspaceId,
        editingDiagramId,
        {
          title: editDiagramTitle.trim(),
          description: editDiagramDesc.trim() || undefined,
        },
        token
      );

      setDiagrams((prev) =>
        prev.map((d) =>
          d.id === editingDiagramId
            ? {
                ...d,
                name: updated.title || editDiagramTitle.trim(),
                description: updated.description || "",
              }
            : d
        )
      );

      showToast(`Diagram "${updated.title}" updated!`, "success");
      setEditDiagramOpen(false);
      setEditingDiagramId(null);
    } catch (err: any) {
      showToast(err.message || "Failed to update diagram", "error");
    }
  };

  const openDeleteDiagramModal = (d: DiagramItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingDiagram(d);
    setDeleteDiagramModalOpen(true);
  };

  const handleDeleteDiagram = async () => {
    if (!deletingDiagram || !token || !workspaceId) return;
    try {
      setIsDeletingDiagram(true);
      await deleteDiagram(workspaceId, deletingDiagram.id, token);
      setDiagrams((prev) => prev.filter((d) => d.id !== deletingDiagram.id));
      showToast(`Diagram "${deletingDiagram.name}" deleted!`, "success");
      setDeleteDiagramModalOpen(false);
      setDeletingDiagram(null);
    } catch (err: any) {
      showToast(err.message || "Failed to delete diagram", "error");
    } finally {
      setIsDeletingDiagram(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[color:var(--foreground)] flex items-center justify-center p-6">
        <div className="w-full max-w-5xl space-y-6 animate-pulse">
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
            <div className="space-y-2">
              <div className="w-48 h-7 rounded-lg bg-[var(--surface-muted)]" />
              <div className="w-80 h-4 rounded bg-[var(--surface-muted)]" />
            </div>
            <div className="w-32 h-9 rounded-lg bg-[var(--surface-muted)]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-xl bg-[var(--surface-muted)]" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 rounded-xl bg-[var(--surface-muted)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[color:var(--foreground)] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <SearchIcon className="w-10 h-10 text-[color:var(--muted)] mx-auto" />
          <h1 className="text-lg font-bold text-[color:var(--foreground)]">Workspace Not Found</h1>
          <p className="text-xs text-[color:var(--muted)]">
            The workspace you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const renderIcon = (type: "cart" | "chat" | "card" | "zap") => {
    switch (type) {
      case "cart":
        return <CartIcon className="w-5 h-5 text-[color:var(--accent)]" />;
      case "chat":
        return <ChatIcon className="w-5 h-5 text-[color:var(--accent)]" />;
      case "card":
        return <CreditCardIcon className="w-5 h-5 text-[color:var(--accent)]" />;
      default:
        return <ZapIcon className="w-5 h-5 text-[color:var(--accent)]" />;
    }
  };

  const totalNodes = diagrams.reduce((acc, d) => acc + d.nodes_count, 0);
  const totalEdges = diagrams.reduce((acc, d) => acc + d.edges_count, 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[color:var(--foreground)] transition-colors duration-200">
      {/* ── TOPBAR HEADER ───────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 gap-3">
          {/* Left: Back + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
              title="Back to Dashboard"
            >
              ←
            </Link>

            <Link href="/" className="group flex items-center gap-2 shrink-0">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-lg bg-[var(--surface)] ring-1 ring-[var(--border-strong)]">
                <Image
                  src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                  alt="FlowFrame"
                  width={32}
                  height={32}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            </Link>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--muted)] min-w-0 overflow-hidden">
              <Link href="/dashboard" className="hover:text-[color:var(--foreground)] transition shrink-0">
                Dashboard
              </Link>
              <span className="shrink-0">/</span>
              <span className="text-[color:var(--foreground)] font-semibold truncate max-w-[140px] sm:max-w-[240px]">
                {workspace.name}
              </span>
            </div>
          </div>

          {/* Right: Actions + User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/scenarios"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 px-2.5 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
            >
              <span className="hidden sm:inline">Scenarios</span>
            </Link>

            <Link
              href="/learn"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 px-2.5 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
            >
              <span className="hidden sm:inline">Learn</span>
            </Link>

            <UserDropdown theme={theme} onToggleTheme={toggleTheme} />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Workspace Title Section */}
        <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              {renderIcon((workspace.icon_type as any) || "zap")}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--foreground)] truncate">
                  {workspace.name}
                </h1>
                <span
                  className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                    workspace.env === "PROD"
                      ? "bg-[var(--red-muted)] border-[var(--red)]/25 text-[color:var(--red)]"
                      : workspace.env === "STAGING"
                      ? "bg-[var(--amber-muted)] border-[var(--amber)]/25 text-[color:var(--amber)]"
                      : "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[color:var(--accent)]"
                  }`}
                >
                  {workspace.env}
                </span>
                <button
                  type="button"
                  onClick={openEditWorkspaceModal}
                  className="px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[10px] font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition cursor-pointer"
                  title="Edit workspace details"
                >
                  ✏️ Edit
                </button>
              </div>
              <p className="text-xs text-[color:var(--muted)] mt-1 line-clamp-2">
                {workspace.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)]">
              {diagrams.length} / 5 Diagrams
            </span>
            <button
              type="button"
              onClick={() => setCreateDiagramOpen(true)}
              className="btn-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" /> New Diagram
            </button>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Diagrams Limit", value: `${diagrams.length} / 5`, icon: <DiagramIcon className="w-4 h-4 text-[color:var(--accent)]" /> },
            { label: "Total Nodes", value: totalNodes, icon: <NodeLinkIcon className="w-4 h-4 text-[color:var(--muted)]" /> },
            { label: "Total Edges", value: totalEdges, icon: <ZapIcon className="w-4 h-4 text-[color:var(--green)]" /> },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-center transition hover:border-[var(--accent)]/30"
            >
              <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[color:var(--muted)] mb-0.5">
                {s.icon} {s.label}
              </div>
              <p className="text-lg font-bold text-[color:var(--foreground)]">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Quick Architecture Template Starters */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
              Quick Architecture Starters
            </span>
            <span className="text-[10px] text-[color:var(--muted)] font-mono">1-click template initialization</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { title: "Load Balancer", desc: "Round-robin traffic distribution", icon: "⚖️" },
              { title: "Cache-Aside", desc: "Redis hit/miss with DB fallback", icon: "⚡" },
              { title: "API Gateway", desc: "Microservices path routing", icon: "🚪" },
              { title: "Blank Canvas", desc: "Design from scratch", icon: "📄" },
            ].map((tmpl) => (
              <button
                key={tmpl.title}
                type="button"
                onClick={() => {
                  setNewDiagramName(tmpl.title === "Blank Canvas" ? "New Architecture" : `${tmpl.title} Cluster`);
                  setNewDiagramDesc(tmpl.desc);
                  setCreateDiagramOpen(true);
                }}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] text-left transition cursor-pointer group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{tmpl.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors truncate">
                    {tmpl.title}
                  </p>
                  <p className="text-[10px] text-[color:var(--muted)] truncate">{tmpl.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Search, Filter & View Toggle */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagrams in workspace..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[color:var(--muted)] font-mono shrink-0">
                {filteredDiagrams.length} diagram{filteredDiagrams.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[var(--bg-elevated)] text-[color:var(--accent)] shadow-xs"
                      : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  }`}
                  title="Grid View"
                >
                  <GridIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[var(--bg-elevated)] text-[color:var(--accent)] shadow-xs"
                      : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Diagrams Cards */}
          {filteredDiagrams.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiagrams.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/workspace/${workspaceId}/${d.id}`}
                    className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[var(--accent)]/50 hover:-translate-y-0.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                          <DiagramIcon className="w-4 h-4 text-[color:var(--accent)]" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => openEditDiagramModal(d, e)}
                            className="p-1 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                            title="Edit diagram"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDeleteDiagramModal(d, e)}
                            className="p-1 rounded-md text-[color:var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            title="Delete diagram"
                          >
                            🗑️
                          </button>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)]">
                            v{d.version}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors truncate mb-1">
                        {d.name}
                      </h3>
                      <p className="text-xs text-[color:var(--muted)] line-clamp-2 mb-3 min-h-[30px] leading-relaxed">
                        {d.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--muted)]">
                          <NodeLinkIcon className="w-3 h-3 text-[color:var(--accent)]" /> {d.nodes_count}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--muted)]">
                          <ZapIcon className="w-3 h-3 text-[color:var(--green)]" /> {d.edges_count}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[color:var(--muted)]">{formatDate(d.updated_at)}</span>
                    </div>
                  </Link>
                ))}

                {/* New Diagram Card */}
                <button
                  type="button"
                  onClick={() => setCreateDiagramOpen(true)}
                  className="group relative overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)]/60 bg-[var(--surface)]/40 p-5 transition-all duration-200 hover:bg-[var(--surface)] cursor-pointer flex flex-col items-center justify-center gap-2.5 min-h-[190px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[color:var(--accent)] group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                      New Diagram
                    </p>
                    <p className="text-[10px] text-[color:var(--muted)] mt-0.5">
                      Create architecture flow
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              /* List View */
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
                {filteredDiagrams.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/workspace/${workspaceId}/${d.id}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--bg-elevated)] transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                        <DiagramIcon className="w-4 h-4 text-[color:var(--accent)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors truncate">
                            {d.name}
                          </h3>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)]">
                            v{d.version}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--muted)] truncate">
                          {d.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-[color:var(--muted)] flex items-center gap-1">
                        <NodeLinkIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" /> {d.nodes_count} nodes
                      </span>
                      <span className="text-[10px] font-mono text-[color:var(--muted)] hidden sm:inline">
                        {formatDate(d.updated_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => openEditDiagramModal(d, e)}
                        className="p-1 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                        title="Edit diagram"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDeleteDiagramModal(d, e)}
                        className="p-1 rounded-md text-[color:var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        title="Delete diagram"
                      >
                        🗑️
                      </button>
                      <span className="text-xs text-[color:var(--accent)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center space-y-3">
              <SearchIcon className="w-8 h-8 text-[color:var(--muted)] mx-auto" />
              <p className="text-sm font-semibold text-[color:var(--foreground)]">No diagrams found</p>
              <p className="text-xs text-[color:var(--muted)]">
                {searchQuery ? "Try resetting your search term." : "Create your first diagram to start simulating."}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* ── CREATE DIAGRAM MODAL ─────────────────────────── */}
      {createDiagramOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setCreateDiagramOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-[color:var(--foreground)]">Create New Diagram</h2>
              <p className="text-xs text-[color:var(--muted)]">
                Add an architecture diagram to <span className="font-semibold text-[color:var(--foreground)]">{workspace.name}</span>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                  Diagram Name
                </label>
                <input
                  type="text"
                  value={newDiagramName}
                  onChange={(e) => setNewDiagramName(e.target.value)}
                  placeholder="e.g. Auth & Session Flow"
                  className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={newDiagramDesc}
                  onChange={(e) => setNewDiagramDesc(e.target.value)}
                  placeholder="Brief description of the topology flow..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setCreateDiagramOpen(false);
                  setNewDiagramName("");
                  setNewDiagramDesc("");
                }}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDiagram}
                className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
              >
                Create Diagram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT WORKSPACE MODAL ─────────────────────────── */}
      {editWsOpen && workspace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setEditWsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-[color:var(--foreground)]">Edit Workspace</h2>
              <p className="text-xs text-[color:var(--muted)]">
                Update workspace name, environment tag, and description.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={editWsName}
                  onChange={(e) => setEditWsName(e.target.value)}
                  placeholder="Workspace Name"
                  className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                  Environment Tag
                </label>
                <div className="flex gap-2">
                  {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEditWsEnv(env)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition border cursor-pointer ${
                        editWsEnv === env
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "border-[var(--border)] text-[color:var(--muted)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={editWsDesc}
                  onChange={(e) => setEditWsDesc(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditWsOpen(false)}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateWorkspace}
                className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT DIAGRAM MODAL ───────────────────────────── */}
      {editDiagramOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setEditDiagramOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-[color:var(--foreground)]">Edit Diagram</h2>
              <p className="text-xs text-[color:var(--muted)]">
                Update diagram title and description.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                  Diagram Title
                </label>
                <input
                  type="text"
                  value={editDiagramTitle}
                  onChange={(e) => setEditDiagramTitle(e.target.value)}
                  placeholder="Diagram Title"
                  className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDiagramDesc}
                  onChange={(e) => setEditDiagramDesc(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditDiagramOpen(false)}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateDiagram}
                className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE DIAGRAM CONFIRMATION MODAL ────────────── */}
      {deleteDiagramModalOpen && deletingDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md p-6 rounded-xl border border-red-500/30 bg-[var(--surface)] text-[color:var(--foreground)] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold">Delete Diagram</h3>
            </div>

            <p className="text-xs text-[color:var(--muted)] leading-relaxed">
              Are you sure you want to delete <strong className="text-[color:var(--foreground)] font-semibold">&quot;{deletingDiagram.name}&quot;</strong>? This will permanently delete this architecture diagram and all its configured nodes.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setDeleteDiagramModalOpen(false);
                  setDeletingDiagram(null);
                }}
                disabled={isDeletingDiagram}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDiagram}
                disabled={isDeletingDiagram}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingDiagram ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete Diagram"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
