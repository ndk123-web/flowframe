"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
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
import { getWorkspaceDiagrams, createDiagram, updateDiagram, DiagramDTO } from "@/services/diagramApi";
import { formatDate } from "@/utils/formatDate";

type Theme = "light" | "dark";
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
  const [theme, setTheme] = useState<Theme>("dark");
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

  const params = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated, _hasHydrated } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const workspaceId = params.id as string;

  const filteredDiagrams = useMemo(() => {
    if (!searchQuery.trim()) return diagrams;
    const q = searchQuery.toLowerCase();
    return diagrams.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [diagrams, searchQuery]);

  useEffect(() => {
    const saved = localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  // Auth Guard with Zustand Hydration check
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) router.replace("/signin");
  }, [_hasHydrated, isAuthenticated, router]);

  // Fetch Workspace and Diagrams from Rust API
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
            name: d.title,
            description: d.description || "",
            nodes_count: d.nodes_count,
            edges_count: d.edges_count,
            version: d.version,
            updated_at: formatDate(d.updated_at),
          }));
          setDiagrams(items);
        })
        .catch((err) => {
          console.error("Failed to load workspace details:", err);
          showToast("Failed to load workspace details from server", "error");
        })
        .finally(() => setLoading(false));
    }
  }, [workspaceId, token, showToast]);

  const handleCreateDiagram = async () => {
    if (!newDiagramName.trim()) {
      showToast("Please enter a diagram name.", "error");
      return;
    }

    if (diagrams.length >= 5) {
      showToast("Diagram limit reached (5/5 for this workspace). Upgrade your plan for more.", "error");
      return;
    }

    if (!token || !workspaceId) return;

    try {
      const created = await createDiagram(
        workspaceId,
        {
          title: newDiagramName.trim(),
          description: newDiagramDesc.trim() || undefined,
          version: "1.0",
          nodes: [],
          edges: [],
          configs: {},
        },
        token
      );

      showToast(`Diagram "${created.title}" created!`, "success");
      setCreateDiagramOpen(false);
      setNewDiagramName("");
      setNewDiagramDesc("");

      // Navigate directly into canvas editor
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
    if (!workspaceId || !editWsName.trim() || !token) return;
    try {
      const updated = await updateWorkspace(
        workspaceId,
        {
          name: editWsName.trim(),
          description: editWsDesc.trim() || undefined,
          env: editWsEnv,
        },
        token
      );
      setWorkspace(updated);
      showToast("Workspace updated successfully!", "success");
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
    if (!workspaceId || !editingDiagramId || !editDiagramTitle.trim() || !token) return;
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
                name: updated.title,
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

  if (!_hasHydrated || !isAuthenticated || !user) return null;

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <SearchIcon className="w-12 h-12 text-[color:var(--foreground)]/40 mx-auto" />
          <h1 className="text-xl font-bold">Workspace Not Found</h1>
          <p className="text-sm text-[color:var(--foreground)]/50">
            The workspace you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
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
        return <CartIcon className="w-6 h-6 text-violet-400" />;
      case "chat":
        return <ChatIcon className="w-6 h-6 text-cyan-400" />;
      case "card":
        return <CreditCardIcon className="w-6 h-6 text-emerald-400" />;
      default:
        return <ZapIcon className="w-6 h-6 text-amber-400" />;
    }
  };

  const totalNodes = diagrams.reduce((acc, d) => acc + d.nodes_count, 0);
  const totalEdges = diagrams.reduce((acc, d) => acc + d.edges_count, 0);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] transition-colors duration-300">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/78 backdrop-blur-xl shadow-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/75 to-transparent animate-pulse" />
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
          {/* Left: Back + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--foreground)]/70 hover:bg-[var(--surface)] transition"
              title="Back to Dashboard"
            >
              ←
            </Link>
            <Link href="/" className="group flex items-center gap-2 min-w-0">
              <div className="shrink-0 rounded-full bg-gradient-to-br from-cyan-500/35 via-sky-500/20 to-blue-500/35 p-[2px] transition-transform duration-300 group-hover:scale-105">
                <div className="relative h-7 w-7 sm:h-9 sm:w-9 overflow-hidden rounded-full bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/90">
                  <Image
                    src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                    alt="FlowFrame"
                    width={36}
                    height={36}
                    priority
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              </div>
            </Link>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--foreground)]/50 min-w-0 overflow-hidden">
              <Link href="/dashboard" className="hover:text-[color:var(--foreground)] transition shrink-0">
                Dashboard
              </Link>
              <span className="shrink-0">/</span>
              <span className="text-[color:var(--foreground)] truncate max-w-[150px] sm:max-w-[250px]">
                {workspace.name}
              </span>
            </div>
          </div>

          {/* Right: User Profile Dropdown */}
          <UserDropdown
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          />
        </div>
      </header>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Workspace Header */}
        <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/15 flex items-center justify-center shadow-sm">
              {renderIcon((workspace.icon_type as any) || "zap")}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{workspace.name}</h1>
                <button
                  type="button"
                  onClick={openEditWorkspaceModal}
                  className="px-2 py-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-semibold text-[color:var(--foreground)]/60 hover:text-violet-400 hover:bg-violet-500/10 transition cursor-pointer shrink-0"
                  title="Edit workspace"
                >
                  ✏️ Edit
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[color:var(--foreground)]/50 mt-0.5 line-clamp-2">
                {workspace.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start shrink-0">
            <span className="text-[11px] font-mono font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-2 rounded-xl">
              {diagrams.length} / 5 Diagrams
            </span>
            <button
              type="button"
              onClick={() => setCreateDiagramOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> New Diagram
            </button>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "Diagrams Limit", value: `${diagrams.length} / 5`, icon: <DiagramIcon className="w-4 h-4 text-violet-400" /> },
            { label: "Total Nodes", value: totalNodes, icon: <NodeLinkIcon className="w-4 h-4 text-cyan-400" /> },
            { label: "Total Edges", value: totalEdges, icon: <ZapIcon className="w-4 h-4 text-emerald-400" /> },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm p-3 sm:p-4 text-center transition-all hover:border-violet-500/20"
            >
              <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[color:var(--foreground)]/40 mb-0.5">
                {s.icon} {s.label}
              </div>
              <p className="text-lg sm:text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Search, Filter & View Toggle */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--foreground)]/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagrams..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
              />
            </div>

            {/* View Mode Toggle (Grid vs List) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[color:var(--foreground)]/35 font-mono shrink-0">
                {filteredDiagrams.length} diagram{filteredDiagrams.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "grid" ? "bg-[var(--surface)] text-cyan-400 shadow-sm" : "opacity-40"
                  }`}
                  title="Grid View"
                >
                  <GridIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "list" ? "bg-[var(--surface)] text-cyan-400 shadow-sm" : "opacity-40"
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Diagram Cards (Grid vs List View) */}
          {filteredDiagrams.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiagrams.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/workspace/${workspaceId}/${d.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm p-5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1"
                  >
                    {/* Top shimmer */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/12 to-blue-500/12 border border-cyan-500/10 flex items-center justify-center">
                        <DiagramIcon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => openEditDiagramModal(d, e)}
                          className="p-1 rounded-lg text-[color:var(--foreground)]/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition cursor-pointer"
                          title="Edit diagram name & description"
                        >
                          ✏️
                        </button>
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                          v{d.version}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold mb-1 group-hover:text-cyan-400 transition-colors truncate">
                      {d.name}
                    </h3>
                    <p className="text-[11px] text-[color:var(--foreground)]/40 line-clamp-2 mb-3 min-h-[28px]">
                      {d.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--foreground)]/45">
                          <NodeLinkIcon className="w-3 h-3 text-cyan-400" /> {d.nodes_count}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--foreground)]/45">
                          <ZapIcon className="w-3 h-3 text-amber-400" /> {d.edges_count}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[color:var(--foreground)]/30">{d.updated_at}</span>
                    </div>

                    {/* Hover CTA */}
                    <div className="absolute bottom-0 inset-x-0 h-0 group-hover:h-8 overflow-hidden transition-all duration-300 bg-gradient-to-t from-cyan-500/10 to-transparent flex items-end justify-center pb-1.5">
                      <span className="text-[11px] font-semibold text-cyan-400">Open in Editor →</span>
                    </div>
                  </Link>
                ))}

                {/* New Diagram Card */}
                <button
                  type="button"
                  onClick={() => setCreateDiagramOpen(true)}
                  className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-cyan-500/40 bg-[var(--surface)]/30 p-5 transition-all duration-300 hover:bg-[var(--surface)]/50 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[200px]"
                >
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/12 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[color:var(--foreground)]/60 group-hover:text-cyan-400 transition-colors">
                      New Diagram
                    </p>
                    <p className="text-[10px] text-[color:var(--foreground)]/35 mt-0.5">
                      Create an architecture flow
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              /* List View for Diagrams */
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm divide-y divide-[var(--border)] overflow-hidden">
                {filteredDiagrams.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/workspace/${workspaceId}/${d.id}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-muted)] transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border border-cyan-500/20 flex items-center justify-center">
                        <DiagramIcon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold group-hover:text-cyan-400 transition-colors truncate">
                            {d.name}
                          </h3>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            v{d.version}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--foreground)]/45 truncate">
                          {d.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-mono text-[color:var(--foreground)]/50 flex items-center gap-1">
                        <NodeLinkIcon className="w-3.5 h-3.5 text-cyan-400" /> {d.nodes_count} nodes
                      </span>
                      <span className="text-[10px] font-mono text-[color:var(--foreground)]/35">
                        {d.updated_at}
                      </span>
                      <span className="text-xs text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 p-12 text-center space-y-3">
              <SearchIcon className="w-8 h-8 text-[color:var(--foreground)]/30 mx-auto" />
              <p className="text-sm font-semibold text-[color:var(--foreground)]/60">No diagrams found</p>
              <p className="text-xs text-[color:var(--foreground)]/35">
                {searchQuery ? "Try a different search term." : "Create your first diagram to get started."}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* ── CREATE DIAGRAM MODAL ─────────────────────────── */}
      {createDiagramOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setCreateDiagramOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Create New Diagram</h2>
              <p className="text-xs text-[color:var(--foreground)]/50">
                Add a new architecture diagram to <span className="font-semibold text-violet-400">{workspace.name}</span>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Diagram Name
                </label>
                <input
                  type="text"
                  value={newDiagramName}
                  onChange={(e) => setNewDiagramName(e.target.value)}
                  placeholder="e.g., Auth Flow"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newDiagramDesc}
                  onChange={(e) => setNewDiagramDesc(e.target.value)}
                  placeholder="Brief description of the architecture flow..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCreateDiagramOpen(false);
                  setNewDiagramName("");
                  setNewDiagramDesc("");
                }}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[color:var(--foreground)]/60 hover:bg-[var(--surface-muted)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDiagram}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition cursor-pointer"
              >
                Create Diagram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {editWsOpen && workspace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setEditWsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Edit Workspace</h2>
              <p className="text-xs text-[color:var(--foreground)]/50">
                Update details for <span className="font-semibold text-violet-400">{workspace.name}</span>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={editWsName}
                  onChange={(e) => setEditWsName(e.target.value)}
                  placeholder="Workspace Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Environment Tag
                </label>
                <div className="flex gap-2">
                  {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEditWsEnv(env)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                        editWsEnv === env
                          ? "bg-violet-500/15 border-violet-500 text-violet-400"
                          : "border-[var(--border)] text-[color:var(--foreground)]/50 hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Description
                </label>
                <textarea
                  value={editWsDesc}
                  onChange={(e) => setEditWsDesc(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditWsOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[color:var(--foreground)]/60 hover:bg-[var(--surface-muted)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateWorkspace}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Diagram Modal */}
      {editDiagramOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setEditDiagramOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Edit Diagram</h2>
              <p className="text-xs text-[color:var(--foreground)]/50">
                Update diagram title and description.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Diagram Title
                </label>
                <input
                  type="text"
                  value={editDiagramTitle}
                  onChange={(e) => setEditDiagramTitle(e.target.value)}
                  placeholder="Diagram Title"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDiagramDesc}
                  onChange={(e) => setEditDiagramDesc(e.target.value)}
                  placeholder="Brief description of the diagram..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditDiagramOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[color:var(--foreground)]/60 hover:bg-[var(--surface-muted)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateDiagram}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
