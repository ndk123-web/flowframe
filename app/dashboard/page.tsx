"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useThemeStore } from "@/store/useThemeStore";
import SiteHeader from "@/components/SiteHeader";
import {
  FolderIcon,
  DiagramIcon,
  StarIcon,
  ZapIcon,
  SandboxIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  ChevronDownIcon,
  CartIcon,
  ChatIcon,
  CreditCardIcon,
  DocsIcon,
} from "@/components/DashboardIcons";

import {
  getUserWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  WorkspaceDTO,
} from "@/services/workspaceApi";
import { getRecentDiagrams, RecentDiagramDTO } from "@/services/diagramApi";
import { formatDate } from "@/utils/formatDate";

type ViewMode = "grid" | "list";
type FilterTab = "all" | "development" | "production" | "starred";

interface WorkspaceItem {
  id: string;
  name: string;
  description: string;
  env: "DEV" | "PROD" | "STAGING";
  diagrams_count: number;
  updated_at: string;
  starred: boolean;
  color: string;
  iconType: "cart" | "chat" | "card" | "zap";
}

export default function DashboardPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [recentDiagrams, setRecentDiagrams] = useState<RecentDiagramDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Workspace modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [newWsEnv, setNewWsEnv] = useState<"DEV" | "PROD" | "STAGING">("DEV");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Workspace modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editWsName, setEditWsName] = useState("");
  const [editWsDesc, setEditWsDesc] = useState("");
  const [editWsEnv, setEditWsEnv] = useState<"DEV" | "PROD" | "STAGING">("DEV");

  // Delete Workspace modal states
  const [deleteWsModalOpen, setDeleteWsModalOpen] = useState(false);
  const [deletingWs, setDeletingWs] = useState<WorkspaceItem | null>(null);
  const [isDeletingWs, setIsDeletingWs] = useState(false);

  const router = useRouter();
  const { user, token, isAuthenticated, _hasHydrated } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  // Auth Guard with Zustand Hydration check
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Fetch workspaces & recent diagrams from API
  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([
        getUserWorkspaces(token),
        getRecentDiagrams(token).catch(() => []),
      ])
        .then(([wsData, recentData]) => {
          const items: WorkspaceItem[] = wsData.map((dto) => ({
            id: dto.id,
            name: dto.name,
            description: dto.description || "",
            env: (dto.env as any) || "DEV",
            diagrams_count: dto.diagrams_count || 0,
            updated_at: dto.updated_at,
            starred: false,
            color: dto.color || "accent",
            iconType: (dto.icon_type as any) || "zap",
          }));
          setWorkspaces(items);
          setRecentDiagrams(recentData);
        })
        .catch((err) => {
          console.error("Failed to load dashboard data:", err);
          showToast("Failed to load dashboard data from server", "error");
        })
        .finally(() => setLoading(false));
    }
  }, [token, showToast]);

  const totalDiagramsCount = useMemo(() => {
    return workspaces.reduce((acc, w) => acc + (w.diagrams_count || 0), 0);
  }, [workspaces]);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === "starred") return matchesSearch && w.starred;
      if (activeTab === "development") return matchesSearch && w.env === "DEV";
      if (activeTab === "production") return matchesSearch && w.env === "PROD";
      return matchesSearch;
    });
  }, [workspaces, searchQuery, activeTab]);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w))
    );
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) {
      showToast("Workspace name is required", "error");
      return;
    }
    if (!token) return;

    setIsSubmitting(true);
    try {
      const created = await createWorkspace(
        {
          name: newWsName.trim(),
          description: newWsDesc.trim() || undefined,
          env: newWsEnv,
        },
        token
      );

      const newWsItem: WorkspaceItem = {
        id: created.id,
        name: created.name,
        description: created.description || "",
        env: (created.env as any) || newWsEnv,
        diagrams_count: 0,
        updated_at: created.updated_at,
        starred: false,
        color: "accent",
        iconType: "zap",
      };

      setWorkspaces((prev) => [newWsItem, ...prev]);
      setCreateModalOpen(false);
      setNewWsName("");
      setNewWsDesc("");
      setNewWsEnv("DEV");
      showToast("Workspace created successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to create workspace", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditWorkspaceModal = (ws: WorkspaceItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingWsId(ws.id);
    setEditWsName(ws.name);
    setEditWsDesc(ws.description);
    setEditWsEnv(ws.env);
    setEditModalOpen(true);
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWsId || !editWsName.trim() || !token) return;

    setIsSubmitting(true);
    try {
      await updateWorkspace(
        editingWsId,
        {
          name: editWsName.trim(),
          description: editWsDesc.trim() || undefined,
          env: editWsEnv,
        },
        token
      );

      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === editingWsId
            ? {
                ...w,
                name: editWsName.trim(),
                description: editWsDesc.trim(),
                env: editWsEnv,
                updated_at: new Date().toISOString(),
              }
            : w
        )
      );

      setEditModalOpen(false);
      showToast("Workspace updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update workspace", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteWorkspaceModal = (ws: WorkspaceItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingWs(ws);
    setDeleteWsModalOpen(true);
  };

  const confirmDeleteWorkspace = async () => {
    if (!deletingWs || !token) return;
    setIsDeletingWs(true);
    try {
      await deleteWorkspace(token, deletingWs.id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== deletingWs.id));
      setDeleteWsModalOpen(false);
      setDeletingWs(null);
      showToast("Workspace deleted", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete workspace", "error");
    } finally {
      setIsDeletingWs(false);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "cart":
        return <CartIcon className="w-4 h-4 text-[color:var(--accent)]" />;
      case "chat":
        return <ChatIcon className="w-4 h-4 text-[color:var(--accent)]" />;
      case "card":
        return <CreditCardIcon className="w-4 h-4 text-[color:var(--accent)]" />;
      default:
        return <ZapIcon className="w-4 h-4 text-[color:var(--accent)]" />;
    }
  };

  if (!_hasHydrated || !isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[color:var(--foreground)] transition-colors duration-200">
      {/* Global Header */}
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} showHomeLink={false} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
        {/* ── 1. Hero / Welcome Section ─────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-mono font-semibold text-[color:var(--accent)]">
              <span>FlowFrame Workspace Hub</span>
              <span>/</span>
              <span className="text-[color:var(--foreground)] font-normal">{user.email}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[color:var(--foreground)] leading-tight">
              Build, simulate, and understand<br />
              <span className="grad-text">distributed systems.</span>
            </h1>

            <p className="text-sm sm:text-base text-[color:var(--muted)] leading-relaxed max-w-2xl">
              Design architectural topologies, configure system components, simulate request routes frame-by-frame,
              and observe deterministic runtime behavior in real time.
            </p>
          </div>

          {/* Background Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[var(--accent)]/10 blur-3xl -z-0" />
        </section>

        {/* ── 2. Primary Actions Bar ────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
            Primary Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Create Architecture */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="group flex flex-col justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 text-left cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[color:var(--accent)] group-hover:scale-105 transition-transform">
                  <PlusIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[color:var(--accent)] border border-[var(--accent)]/20">
                  New System
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Create Architecture
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1">
                  Start a new production workspace with custom environment tags.
                </p>
              </div>
            </button>

            {/* Start with Template */}
            <Link
              href="/scenarios"
              className="group flex flex-col justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 text-left shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <DiagramIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Templates
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Start with Template
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1">
                  Load pre-configured systems like Load Balancers or Cache-Aside.
                </p>
              </div>
            </Link>

            {/* Try AI Architect */}
            <Link
              href="/workspace?ai=true"
              className="group flex flex-col justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 text-left shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <ZapIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Assistant
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Try AI Architect
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1">
                  Prompt AI to generate, inspect, and modify topologies on canvas.
                </p>
              </div>
            </Link>

            {/* Open Demo Sandbox */}
            <Link
              href="/workspace"
              className="group flex flex-col justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 text-left shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <SandboxIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Scratchpad
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Open Demo Sandbox
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1">
                  Experiment freely with components and Monaco DSL code.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* ── 3. Your Workspaces / Systems ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
            <div>
              <h2 className="text-base font-bold text-[color:var(--foreground)]">
                Your Workspaces
              </h2>
              <p className="text-xs text-[color:var(--muted)] mt-0.5">
                Manage your distributed system architectures and component topologies.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative min-w-[180px] sm:min-w-[220px]">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search systems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-1.5 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5 text-xs">
                {(["all", "development", "production", "starred"] as FilterTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                      activeTab === tab
                        ? "bg-[var(--bg-elevated)] text-[color:var(--accent)] font-semibold"
                        : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                    }`}
                  >
                    {tab === "development" ? "DEV" : tab === "production" ? "PROD" : tab}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[var(--bg-elevated)] text-[color:var(--accent)]"
                      : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  }`}
                  title="Grid View"
                >
                  <GridIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[var(--bg-elevated)] text-[color:var(--accent)]"
                      : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)]" />
                    <div className="w-12 h-4 rounded bg-[var(--bg-elevated)]" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 rounded bg-[var(--bg-elevated)]" />
                    <div className="w-full h-3 rounded bg-[var(--bg-elevated)]" />
                  </div>
                  <div className="pt-3 border-t border-[var(--border)] flex justify-between">
                    <div className="w-20 h-3 rounded bg-[var(--bg-elevated)]" />
                    <div className="w-16 h-3 rounded bg-[var(--bg-elevated)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWorkspaces.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/dashboard/workspace/${ws.id}`}
                    className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[var(--accent)]/50 hover:-translate-y-0.5 flex flex-col justify-between"
                  >
                    {/* Top Bar: Icon, Env Tag, Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                          {renderIcon(ws.iconType)}
                        </div>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                            ws.env === "PROD"
                              ? "bg-[var(--red-muted)] border-[var(--red)]/25 text-[color:var(--red)]"
                              : ws.env === "STAGING"
                              ? "bg-[var(--amber-muted)] border-[var(--amber)]/25 text-[color:var(--amber)]"
                              : "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[color:var(--accent)]"
                          }`}
                        >
                          {ws.env}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => openEditWorkspaceModal(ws, e)}
                          className="p-1 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                          title="Edit workspace"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                          className="p-1 rounded-md text-[color:var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="Delete workspace"
                        >
                          🗑️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleStar(ws.id, e)}
                          className={`transition-all cursor-pointer ${
                            ws.starred
                              ? "text-amber-400 opacity-100"
                              : "text-[color:var(--muted)] opacity-50 group-hover:opacity-100"
                          }`}
                          title={ws.starred ? "Unstar" : "Star workspace"}
                        >
                          <StarIcon className="w-4 h-4" filled={ws.starred} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors truncate">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-[color:var(--muted)] line-clamp-2 min-h-[32px] leading-relaxed">
                        {ws.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[color:var(--muted)]">
                        <DiagramIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" /> {ws.diagrams_count} diagram{ws.diagrams_count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] font-mono text-[color:var(--muted)]">
                        {formatDate(ws.updated_at)}
                      </span>
                    </div>
                  </Link>
                ))}

                {/* Create New Workspace Card */}
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="group relative overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)]/60 bg-[var(--surface)]/40 p-5 transition-all duration-200 hover:bg-[var(--surface)] cursor-pointer flex flex-col items-center justify-center gap-2.5 min-h-[180px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[color:var(--accent)] group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                      New Workspace
                    </p>
                    <p className="text-[11px] text-[color:var(--muted)] mt-0.5">
                      Add a new system environment
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              /* List View */
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
                {filteredWorkspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/dashboard/workspace/${ws.id}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[var(--bg-elevated)] transition gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                        {renderIcon(ws.iconType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors truncate">
                            {ws.name}
                          </h3>
                          <span
                            className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                              ws.env === "PROD"
                                ? "bg-[var(--red-muted)] border-[var(--red)]/25 text-[color:var(--red)]"
                                : ws.env === "STAGING"
                                ? "bg-[var(--amber-muted)] border-[var(--amber)]/25 text-[color:var(--amber)]"
                                : "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[color:var(--accent)]"
                            }`}
                          >
                            {ws.env}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--muted)] truncate max-w-md">
                          {ws.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-[color:var(--muted)] shrink-0 justify-between sm:justify-end">
                      <span className="flex items-center gap-1.5">
                        <DiagramIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" /> {ws.diagrams_count}
                      </span>
                      <span>{formatDate(ws.updated_at)}</span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => openEditWorkspaceModal(ws, e)}
                          className="p-1 rounded text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition"
                          title="Edit workspace"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                          className="p-1 rounded text-[color:var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Delete workspace"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[color:var(--accent)] mb-4">
                <FolderIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[color:var(--foreground)] mb-1">
                No systems found
              </h3>
              <p className="text-xs text-[color:var(--muted)] max-w-sm mb-5 leading-relaxed">
                {searchQuery
                  ? `No workspaces match "${searchQuery}". Try clearing your search.`
                  : "You haven't created any workspaces yet. Workspaces help organize your architectures by environment."}
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer shadow-sm"
              >
                <PlusIcon className="w-4 h-4" /> Create Your First System
              </button>
            </div>
          )}
        </section>

        {/* ── 4. Explore FlowFrame ──────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-bold text-[color:var(--foreground)]">
              Explore FlowFrame
            </h2>
            <p className="text-xs text-[color:var(--muted)] mt-0.5">
              Hands-on learning, reference guides, and interactive system design tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scenarios */}
            <Link
              href="/scenarios"
              className="group p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[color:var(--accent)] mb-3">
                  <DiagramIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Scenarios
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed">
                  Interactive system-design experiments with step-by-step frame execution.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--accent)] mt-4">
                Explore Scenarios →
              </span>
            </Link>

            {/* Learn */}
            <Link
              href="/learn"
              className="group p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <ZapIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Learn Academy
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed">
                  Distributed-system concepts explained through visual topology and behavior.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-4">
                Start Learning →
              </span>
            </Link>

            {/* Glossary */}
            <Link
              href="/learn/glossary"
              className="group p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                  <DocsIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Systems Glossary
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed">
                  Searchable dictionary of distributed system terms, protocols, and architectural patterns.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 mt-4">
                Browse Terms →
              </span>
            </Link>

            {/* Docs */}
            <Link
              href="/docs"
              className="group p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <DocsIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                  Documentation
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed">
                  Complete technical guide for the FlowFrame DSL (.flow), components, and simulation engine.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 mt-4">
                Open Docs →
              </span>
            </Link>
          </div>
        </section>

        {/* ── 5. Product Capabilities ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-bold text-[color:var(--foreground)]">
              Product Capabilities
            </h2>
            <p className="text-xs text-[color:var(--muted)] mt-0.5">
              Engineered for deterministic visual simulation, architectural modeling, and active experimentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Architecture Builder */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                  Architecture Builder
                </h3>
              </div>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Build systems visually using distributed-system components including API Gateways, Load Balancers, Redis, RabbitMQ, and relational databases.
              </p>
            </div>

            {/* 2. Interactive Simulation */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                  Interactive Simulation
                </h3>
              </div>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Run simulated requests through your topology and observe packet routing, cache hits/misses, and component state changes frame-by-frame.
              </p>
            </div>

            {/* 3. AI Architecture Assistant */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                  AI Architecture Assistant
                </h3>
              </div>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Generate, review, modify, and understand architectures using AI directly embedded into your visual editor and canvas.
              </p>
            </div>

            {/* 4. FlowFrame DSL */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                  FlowFrame DSL
                </h3>
              </div>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Define and version system topologies declaratively using the FlowFrame DSL with live Monaco code editor syntax highlighting and execution.
              </p>
            </div>

            {/* 5. Learning Scenarios */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                  Learning Scenarios
                </h3>
              </div>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Explore practical distributed-system scenarios including round-robin balancing, cache-aside fallback, and pre-signed valet key flows.
              </p>
            </div>

            {/* 6. Execution Trace */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                  Deterministic Execution Trace
                </h3>
              </div>
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Inspect sequential execution logs for each packet hop with precise microsecond timecodes and service status codes.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Create Workspace Modal ────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[color:var(--foreground)]">
                Create New Architecture Workspace
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Workspace Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Order Processing Pipeline"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Microservices architecture with API Gateway and RabbitMQ."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Environment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setNewWsEnv(env)}
                      className={`py-2 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                        newWsEnv === env
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[color:var(--accent)]"
                          : "border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Workspace Modal ──────────────────────────────────────── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[color:var(--foreground)]">
                Edit Workspace
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={editWsName}
                  onChange={(e) => setEditWsName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editWsDesc}
                  onChange={(e) => setEditWsDesc(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Environment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEditWsEnv(env)}
                      className={`py-2 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                        editWsEnv === env
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[color:var(--accent)]"
                          : "border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Workspace Modal ────────────────────────────────────── */}
      {deleteWsModalOpen && deletingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-bold text-[color:var(--foreground)]">
                  Delete Workspace
                </h3>
                <p className="text-xs text-[color:var(--muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[color:var(--muted)] leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-[color:var(--foreground)]">{deletingWs.name}</span> and all of its associated architecture diagrams?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteWsModalOpen(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteWorkspace}
                disabled={isDeletingWs}
                className="rounded-lg bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isDeletingWs ? "Deleting..." : "Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
