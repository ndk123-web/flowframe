"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useThemeStore } from "@/store/useThemeStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardAmbientArchitecture from "@/components/DashboardAmbientArchitecture";
import DashboardSettingsDialog from "@/components/DashboardSettingsDialog";
import DashboardQuickAI from "@/components/DashboardQuickAI";
import {
  FiGrid,
  FiClock,
  FiActivity,
  FiBookOpen,
  FiBookmark,
  FiCode,
  FiChevronDown,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiPlus,
  FiStar,
  FiZap,
  FiEdit2,
  FiTrash2,
  FiSun,
  FiMoon,
  FiLogOut,
  FiMenu,
  FiX,
  FiBox,
  FiArrowRight,
  FiSliders,
  FiLayers,
  FiFolder,
  FiExternalLink,
  FiSettings,
  FiUser,
  FiCheck,
  FiShuffle,
} from "react-icons/fi";
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
import { getRecentDiagrams, getWorkspaceDiagrams, RecentDiagramDTO } from "@/services/diagramApi";
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
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [recentDiagrams, setRecentDiagrams] = useState<RecentDiagramDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Sidebar, Mobile, Navigation & AI prompt states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<"workspaces" | "recent">("workspaces");
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});
  const [workspaceDiagramsMap, setWorkspaceDiagramsMap] = useState<Record<string, RecentDiagramDTO[]>>({});
  const [loadingWsDiagrams, setLoadingWsDiagrams] = useState<Record<string, boolean>>({});

  const toggleWorkspaceExpand = async (wsId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedWorkspaces((prev) => ({ ...prev, [wsId]: !prev[wsId] }));
    if (!workspaceDiagramsMap[wsId] && token) {
      setLoadingWsDiagrams((prev) => ({ ...prev, [wsId]: true }));
      try {
        const diags = await getWorkspaceDiagrams(wsId, token);
        setWorkspaceDiagramsMap((prev) => ({
          ...prev,
          [wsId]: diags.map((d) => ({
            id: d.id,
            workspace_id: d.workspace_id,
            workspace_name: "",
            title: d.title,
            env: "",
            nodes_count: d.nodes_count || 0,
            updated_at: d.updated_at,
          })),
        }));
      } catch (err) {
        console.error("Failed to fetch diagrams for workspace:", err);
      } finally {
        setLoadingWsDiagrams((prev) => ({ ...prev, [wsId]: false }));
      }
    }
  };

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
  const { user, token, isAuthenticated, _hasHydrated, logout, updateUser } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  // Settings Dialog state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);


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
      if (selectedWsId && w.id !== selectedWsId) return false;
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === "starred") return matchesSearch && w.starred;
      if (activeTab === "development") return matchesSearch && w.env === "DEV";
      if (activeTab === "production") return matchesSearch && w.env === "PROD";
      return matchesSearch;
    });
  }, [workspaces, searchQuery, activeTab, selectedWsId]);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w))
    );
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaces.length >= 5) {
      showToast("Workspace limit reached (5/5). Free plan allows up to 5 workspaces.", "error");
      return;
    }
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
    <div className="min-h-screen flex bg-[var(--bg)] text-[color:var(--foreground)] transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Collapsible Left Sidebar (Canva / IDE / ChatGPT style) ────── */}
      <aside
        className={`fixed md:sticky top-0 h-screen shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col transition-all duration-200 z-50 md:z-30 overflow-hidden ${
          sidebarCollapsed ? "md:w-16 w-16" : "md:w-72 w-72"
        } ${
          mobileMenuOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* ── 1. Sidebar Header: Logo & Collapse Button (Pinned Top) ────── */}
        <div className="shrink-0 h-14 px-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
          {sidebarCollapsed && !mobileMenuOpen ? (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition cursor-pointer"
                title="Open and expand sidebar"
              >
                <FiMenu className="size-5 text-primary" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/"
                className="flex items-center gap-2.5 min-w-0 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
                  <Image
                    src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                    alt="FlowFrame"
                    width={32}
                    height={32}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="text-sm font-bold tracking-tight text-[color:var(--foreground)] block truncate">
                    FlowFrame
                  </span>
                  <span className="text-[10px] font-mono text-[color:var(--muted)] block truncate">
                    Architecture Hub
                  </span>
                </div>
              </Link>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:flex p-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                  title="Collapse sidebar"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex md:hidden p-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── 2. Scrollable Navigation Area (Pinned Middle) ───────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
          {sidebarCollapsed && !mobileMenuOpen ? (
            /* Collapsed Icons Only */
            <div className="space-y-2 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setActiveNav("workspaces");
                  setSelectedWsId(null);
                }}
                className={`p-2.5 rounded-lg transition cursor-pointer ${
                  activeNav === "workspaces"
                    ? "bg-[var(--accent)]/15 text-[color:var(--accent)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)]"
                }`}
                title="Workspaces"
              >
                <FiFolder className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveNav("recent");
                  setSelectedWsId(null);
                }}
                className={`p-2.5 rounded-lg transition cursor-pointer ${
                  activeNav === "recent"
                    ? "bg-[var(--accent)]/15 text-[color:var(--accent)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)]"
                }`}
                title="Recent Diagrams"
              >
                <FiClock className="w-4 h-4" />
              </button>

              <div className="w-6 h-px bg-[var(--border)] my-1" />

              <Link
                href="/scenarios"
                className="p-2.5 rounded-lg text-[color:var(--muted)] hover:text-emerald-400 hover:bg-[var(--bg-elevated)] transition"
                title="Interactive Scenarios"
              >
                <FiSliders className="w-4 h-4" />
              </Link>

              <Link
                href="/learn"
                className="p-2.5 rounded-lg text-[color:var(--muted)] hover:text-indigo-400 hover:bg-[var(--bg-elevated)] transition"
                title="Learn Academy"
              >
                <FiBookOpen className="w-4 h-4" />
              </Link>

              <Link
                href="/learn/glossary"
                className="p-2.5 rounded-lg text-[color:var(--muted)] hover:text-amber-400 hover:bg-[var(--bg-elevated)] transition"
                title="Systems Glossary"
              >
                <FiBookmark className="w-4 h-4" />
              </Link>

              <Link
                href="/docs"
                className="p-2.5 rounded-lg text-[color:var(--muted)] hover:text-cyan-400 hover:bg-[var(--bg-elevated)] transition"
                title="Documentation"
              >
                <FiFileText className="w-4 h-4" />
              </Link>

              <div className="w-6 h-px bg-[var(--border)] my-1" />

              <Link
                href="/workspace?tab=editor"
                className="p-2.5 rounded-lg text-[color:var(--muted)] hover:text-blue-400 hover:bg-[var(--bg-elevated)] transition"
                title="Architecture DSL"
              >
                <FiCode className="w-4 h-4" />
              </Link>

              <Link
                href="/scenarios"
                className="p-2.5 rounded-lg text-[color:var(--muted)] hover:text-violet-400 hover:bg-[var(--bg-elevated)] transition"
                title="Templates Library"
              >
                <FiBox className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Expanded Structured Navigation */
            <>
              {/* ── Group 1: Workspaces ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Workspaces
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                        workspaces.length >= 5
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold"
                          : "bg-muted/40 text-muted-foreground border-border/80"
                      }`}
                      title={`${workspaces.length} of 5 workspaces used`}
                    >
                      {workspaces.length}/5
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (workspaces.length >= 5) {
                        showToast("Workspace limit reached (5/5). Free plan allows 5 workspaces.", "error");
                        return;
                      }
                      setCreateModalOpen(true);
                    }}
                    className={`p-1 rounded transition cursor-pointer ${
                      workspaces.length >= 5
                        ? "text-muted-foreground/40 hover:text-muted-foreground/60"
                        : "text-muted-foreground hover:text-primary hover:bg-muted/40"
                    }`}
                    title={workspaces.length >= 5 ? "Limit reached (5/5 Workspaces)" : "Create New Workspace"}
                  >
                    <FiPlus className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {/* All Workspaces Root Filter */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav("workspaces");
                      setSelectedWsId(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      activeNav === "workspaces" && selectedWsId === null
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FiGrid className="size-3.5 shrink-0" />
                      <span className="truncate">All Workspaces</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-muted/30">
                      {loading ? "..." : workspaces.length}
                    </Badge>
                  </button>

                  {/* Workspaces Tree with Loading Skeleton */}
                  {loading ? (
                    <div className="py-2.5 px-3 space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                        <div className="relative size-3.5 shrink-0">
                          <div className="absolute inset-0 rounded-full border border-primary/25" />
                          <div className="absolute inset-0 rounded-full border border-primary border-t-transparent animate-spin" />
                        </div>
                        <span>Loading workspaces...</span>
                      </div>
                      <div className="space-y-1.5 pt-0.5">
                        <div className="h-7 w-full rounded-lg bg-muted/40 animate-pulse" />
                        <div className="h-7 w-5/6 rounded-lg bg-muted/30 animate-pulse" />
                        <div className="h-7 w-4/6 rounded-lg bg-muted/20 animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    workspaces.map((ws) => {
                      const isExpanded = !!expandedWorkspaces[ws.id];
                      const childDiagrams =
                        workspaceDiagramsMap[ws.id] ||
                        recentDiagrams.filter((d) => d.workspace_id === ws.id);
                      const isSelected = activeNav === "workspaces" && selectedWsId === ws.id;

                      return (
                        <div key={ws.id} className="space-y-1">
                          <div
                            className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                : "text-foreground/85 hover:bg-muted/40 hover:text-foreground"
                            }`}
                            onClick={() => {
                              setSelectedWsId(ws.id);
                              setActiveNav("workspaces");
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={(e) => toggleWorkspaceExpand(ws.id, e)}
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground transition cursor-pointer"
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? (
                                  <FiChevronDown className="size-3.5" />
                                ) : (
                                  <FiChevronRight className="size-3.5" />
                                )}
                              </button>
                              <FiFolder className="size-3.5 text-primary shrink-0" />
                              <span className="truncate text-xs font-medium">{ws.name}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-mono font-bold px-1.5 py-0 shrink-0 ml-1.5 ${
                                ws.env === "PROD"
                                  ? "bg-red-500/10 border-red-500/25 text-red-500"
                                  : ws.env === "STAGING"
                                  ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
                                  : "bg-primary/10 border-primary/20 text-primary"
                              }`}
                            >
                              {ws.env}
                            </Badge>
                          </div>

                          {/* Expanded Child Architecture Diagrams */}
                          {isExpanded && (
                            <div className="ml-4 pl-3 py-1 space-y-1 border-l border-border/70 my-1">
                              {loadingWsDiagrams[ws.id] ? (
                                <div className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-muted-foreground font-mono">
                                  <div className="size-3 rounded-full border border-primary/40 border-t-primary animate-spin shrink-0" />
                                  <span>Loading diagrams...</span>
                                </div>
                              ) : childDiagrams.length > 0 ? (
                                childDiagrams.map((diag) => (
                                  <Link
                                    key={diag.id}
                                    href={`/dashboard/workspace/${ws.id}/${diag.id}`}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-muted/40 transition truncate"
                                    title={diag.title}
                                  >
                                    <FiLayers className="size-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{diag.title}</span>
                                  </Link>
                                ))
                              ) : (
                                <div className="px-2 py-1 text-[11px] text-muted-foreground italic flex items-center justify-between">
                                  <span>No diagrams yet</span>
                                  <Link
                                    href={`/dashboard/workspace/${ws.id}`}
                                    className="text-primary hover:underline not-italic font-medium"
                                  >
                                    + Add
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Quick Create Workspace Action */}
                  <button
                    type="button"
                    onClick={() => {
                      if (workspaces.length >= 5) {
                        showToast("Workspace limit reached (5/5). Free plan allows 5 workspaces.", "error");
                        return;
                      }
                      setCreateModalOpen(true);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border border-dashed transition cursor-pointer mt-1 ${
                      workspaces.length >= 5
                        ? "border-amber-500/25 bg-amber-500/5 text-amber-500/80 hover:bg-amber-500/10"
                        : "text-muted-foreground hover:text-primary hover:bg-muted/30 border-border/80 hover:border-primary/40"
                    }`}
                    title={workspaces.length >= 5 ? "Workspace limit reached (5/5)" : "Create Workspace"}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiPlus className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {workspaces.length >= 5 ? "Workspace Limit (5/5)" : "Create Workspace"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 opacity-70">
                      {workspaces.length}/5
                    </span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/60" />

              {/* ── Group 2: Activity ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav("recent");
                      setSelectedWsId(null);
                      setMobileMenuOpen(false);
                    }}
                    className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FiClock className="size-3 text-primary" />
                    <span>Recent Activity</span>
                  </button>
                  {recentDiagrams.length > 0 && (
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-muted/30">
                      {recentDiagrams.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {loading ? (
                    <div className="py-2 px-3 space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                        <div className="relative size-3 shrink-0">
                          <div className="absolute inset-0 rounded-full border border-amber-500/25" />
                          <div className="absolute inset-0 rounded-full border border-amber-500 border-t-transparent animate-spin" />
                        </div>
                        <span>Loading activity...</span>
                      </div>
                      <div className="space-y-1.5 pt-0.5">
                        <div className="h-6 w-full rounded-md bg-muted/30 animate-pulse" />
                        <div className="h-6 w-3/4 rounded-md bg-muted/20 animate-pulse" />
                      </div>
                    </div>
                  ) : recentDiagrams.length > 0 ? (
                    recentDiagrams.slice(0, 4).map((diag) => (
                      <Link
                        key={diag.id}
                        href={`/dashboard/workspace/${diag.workspace_id}/${diag.id}`}
                        className="flex flex-col px-3 py-2 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border/60 transition group"
                        title={`Open ${diag.title}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {diag.title}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                            {formatDate(diag.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate mt-0.5">
                          <span className="truncate">{diag.workspace_name}</span>
                          <span>·</span>
                          <span className="font-mono">{diag.nodes_count || 0} nodes</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-1 text-[11px] text-muted-foreground italic">
                      No recent diagrams opened
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/60" />

              {/* ── Group 3: Learning ── */}
              <div className="space-y-1.5">
                <p className="px-2 mb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Learning
                </p>

                <div className="space-y-1">
                  <Link
                    href="/learn"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    title="Learn Academy"
                  >
                    <FiBookOpen className="size-4 shrink-0 text-indigo-400" />
                    <span>Learn Academy</span>
                  </Link>

                  <Link
                    href="/scenarios"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    title="Scenarios"
                  >
                    <FiSliders className="size-4 shrink-0 text-emerald-400" />
                    <span>Interactive Scenarios</span>
                  </Link>

                  <Link
                    href="/learn/glossary"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    title="Systems Glossary"
                  >
                    <FiBookmark className="size-4 shrink-0 text-amber-400" />
                    <span>Systems Glossary</span>
                  </Link>

                  <Link
                    href="/docs"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    title="Documentation"
                  >
                    <FiFileText className="size-4 shrink-0 text-cyan-400" />
                    <span>Documentation</span>
                  </Link>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/60" />

              {/* ── Group 4: Tools ── */}
              <div className="space-y-1.5">
                <p className="px-2 mb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Tools
                </p>

                <div className="space-y-1">
                  <Link
                    href="/workspace?tab=editor"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    title="DSL / Code Editor"
                  >
                    <FiCode className="size-4 shrink-0 text-blue-400" />
                    <span>Architecture DSL</span>
                  </Link>

                  <Link
                    href="/scenarios"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                    title="Architecture Templates"
                  >
                    <FiBox className="size-4 shrink-0 text-violet-400" />
                    <span>Templates Library</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 3. Sidebar Bottom: Anchored User Profile Card (Pinned Bottom) ── */}
        <div className="shrink-0 p-3 border-t border-[var(--border)] bg-[var(--surface-muted)]/30">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border)] transition cursor-pointer text-left group ${
              sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : "justify-between"
            }`}
            title="Open Account Preferences & Settings"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-[var(--border)] group-hover:ring-[var(--accent)] transition"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-xs select-none ring-1 ring-[var(--border)] group-hover:ring-[var(--accent)] transition">
                    {(user.name || user.email || "FF")
                      .split(" ")
                      .map((s: string) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)]" />
              </div>

              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[color:var(--foreground)] truncate group-hover:text-[color:var(--accent)] transition">
                    {user.name || "Engineer"}
                  </p>
                  <p className="text-[10px] font-mono text-[color:var(--muted)] truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="p-1 rounded-md text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] group-hover:bg-[var(--surface-muted)] transition">
                <FiSettings className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Minimal Header */}
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[color:var(--muted)]"
              title="Open mobile menu"
            >
              <FiMenu className="w-4 h-4" />
            </button>

            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition cursor-pointer text-xs font-medium shadow-xs shrink-0"
                title="Open sidebar"
              >
                <FiMenu className="size-3.5 text-primary" />
                <span className="text-[11px] font-mono">Open Sidebar</span>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                <span>FlowFrame Lab</span>
                <span className="text-[color:var(--border-strong)]">/</span>
                <span className="text-xs font-normal text-[color:var(--muted)] truncate">
                  {selectedWsId
                    ? workspaces.find((w) => w.id === selectedWsId)?.name || "Workspace"
                    : activeNav === "recent"
                    ? "Recent Activity"
                    : "Architecture Workspaces"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-1.5 h-8 text-xs">
              <Link href="/workspace">
                <FiBox className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Open Canvas</span>
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-8 text-xs cursor-pointer shadow-xs"
            >
              <FiPlus className="size-3.5" />
              <span className="hidden sm:inline">New Workspace</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
          {/* ── 1. Personalized User Dashboard Header & Stats ────────────────── */}
          <section className="space-y-6">
            {/* User Greeting Banner with Subtle Ambient Architecture Diagram */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-15 flex items-center justify-end overflow-hidden pr-2">
                <DashboardAmbientArchitecture />
              </div>

              <div className="relative z-10 flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "User"}
                      className="size-12 sm:size-13 rounded-xl object-cover ring-2 ring-primary/20 shadow-xs"
                    />
                  ) : (
                    <div className="size-12 sm:size-13 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-base shadow-xs select-none">
                      {(user.name || user.email || "FF")
                        .split(" ")
                        .map((s: string) => s[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card" title="Online" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      Welcome back, {user.name || "Architect"}
                    </h2>
                    <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.2 bg-primary/10 text-primary border-primary/20 font-medium">
                      Starter Plan
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-normal">
                    Model, simulate, and optimize your distributed system topologies.
                  </p>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="relative z-10 flex items-center gap-2.5 shrink-0">
                <Button
                  onClick={() => {
                    if (workspaces.length >= 5) {
                      showToast("Workspace limit reached (5/5). Free plan allows up to 5 workspaces.", "error");
                      return;
                    }
                    setCreateModalOpen(true);
                  }}
                  disabled={workspaces.length >= 5}
                  size="sm"
                  className={`h-9 px-3.5 gap-2 shadow-xs font-semibold text-xs ${
                    workspaces.length >= 5 ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <FiPlus className="size-3.5" />
                  <span>{workspaces.length >= 5 ? "Limit Reached (5/5)" : "New Workspace"}</span>
                </Button>
                <Button variant="outline" size="sm" asChild className="h-9 px-3.5 gap-2 shadow-xs font-semibold text-xs cursor-pointer">
                  <Link href="/workspace">
                    <FiBox className="size-3.5 text-primary" />
                    <span>Open Canvas</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* 4 Unified Developer Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Workspaces */}
              <div className="rounded-xl border border-border bg-card/90 p-4 shadow-xs hover:border-primary/40 transition-all duration-150 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Workspaces</span>
                  <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FiFolder className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {workspaces.length}
                    </span>
                    <span className="text-xs text-muted-foreground font-sans">/ 5 limit</span>
                  </div>
                  <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden mt-2 mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        workspaces.length >= 5 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, (workspaces.length / 5) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{5 - workspaces.length > 0 ? `${5 - workspaces.length} slots left` : "Limit reached"}</span>
                    <span className="font-mono text-primary/80">{workspaces.filter((w) => w.env === "DEV").length} DEV · {workspaces.filter((w) => w.env === "PROD").length} PROD</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Diagrams Capacity */}
              <div className="rounded-xl border border-border bg-card/90 p-4 shadow-xs hover:border-primary/40 transition-all duration-150 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Diagrams</span>
                  <div className="size-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <DiagramIcon className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {workspaces.reduce((acc, w) => acc + (w.diagrams_count || 0), 0)}
                    </span>
                    <span className="text-xs text-muted-foreground font-sans">
                      / {Math.max(5, workspaces.length * 5)} quota
                    </span>
                  </div>
                  <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden mt-2 mb-1.5">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{
                        width: `${
                          workspaces.length > 0
                            ? Math.min(
                                100,
                                (workspaces.reduce((acc, w) => acc + (w.diagrams_count || 0), 0) /
                                  (workspaces.length * 5)) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>5 per workspace</span>
                    <span className="font-mono text-indigo-400">
                      {Math.max(0, (workspaces.length * 5) - workspaces.reduce((acc, w) => acc + (w.diagrams_count || 0), 0))} available
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Recent Activity */}
              <div className="rounded-xl border border-border bg-card/90 p-4 shadow-xs hover:border-primary/40 transition-all duration-150 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Recent Sessions</span>
                  <div className="size-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <FiClock className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {recentDiagrams.length}
                    </span>
                    <span className="text-xs text-muted-foreground font-sans">diagrams active</span>
                  </div>
                  <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden mt-2 mb-1.5">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (recentDiagrams.length / 5) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground truncate">
                    <span className="truncate">{recentDiagrams[0] ? recentDiagrams[0].title : "No active sessions"}</span>
                    <span className="font-mono text-amber-500/90 shrink-0 ml-1">
                      {recentDiagrams[0] ? formatDate(recentDiagrams[0].updated_at) : "Idle"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Simulation Engine */}
              <div className="rounded-xl border border-border bg-card/90 p-4 shadow-xs hover:border-primary/40 transition-all duration-150 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Simulation Engine</span>
                  <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FiActivity className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      Operational
                    </span>
                  </div>
                  <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden mt-2 mb-1.5">
                    <div className="h-full rounded-full bg-emerald-500 w-full" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Architecture runtime</span>
                    <span className="font-mono text-emerald-400 font-medium">Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick AI Architecture Studio */}
            <DashboardQuickAI />
          </section>

          {/* ── 2. Recent Diagrams Section ───────────────────────────── */}
          {(activeNav === "recent" || recentDiagrams.length > 0) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <FiClock className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Recent Diagrams
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                    {recentDiagrams.length}
                  </Badge>
                </div>
              </div>

              {recentDiagrams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {recentDiagrams.map((diag) => (
                    <Link
                      key={diag.id}
                      href={`/dashboard/workspace/${diag.workspace_id}/${diag.id}`}
                      className="group relative rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
                    >
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 ${
                              diag.env === "PROD"
                                ? "bg-red-500/10 border-red-500/25 text-red-500"
                                : diag.env === "STAGING"
                                ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
                                : "bg-primary/10 border-primary/20 text-primary"
                            }`}
                          >
                            {diag.env || "DEV"}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatDate(diag.updated_at)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
                            {diag.title}
                          </h3>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {diag.workspace_name}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="font-mono text-muted-foreground">
                          {diag.nodes_count || 0} nodes
                        </span>
                        <span className="font-medium text-primary group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Open Canvas <FiArrowRight className="size-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    No recent diagrams opened yet. Select or create an architecture workspace below to begin diagramming.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── 3. Your Workspaces / Systems ─────────────────────────── */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FiGrid className="size-4 text-primary" />
                  <span>Workspaces</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize your distributed system architectures, topologies, and environments.
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative min-w-[180px] sm:min-w-[220px]">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search workspaces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs transition"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
                  {(["all", "development", "production", "starred"] as FilterTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                        activeTab === tab
                          ? "bg-card text-primary font-semibold shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab === "development" ? "DEV" : tab === "production" ? "PROD" : tab}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-card text-primary shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Grid View"
                  >
                    <GridIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      viewMode === "list"
                        ? "bg-card text-primary shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="List View"
                  >
                    <ListIcon className="size-3.5" />
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
                    className="rounded-xl border border-border bg-card p-5 space-y-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-8 rounded-lg bg-muted" />
                      <div className="w-12 h-4 rounded bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-3/4 h-5 rounded bg-muted" />
                      <div className="w-full h-3 rounded bg-muted" />
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between">
                      <div className="w-20 h-3 rounded bg-muted" />
                      <div className="w-16 h-3 rounded bg-muted" />
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
                      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-md flex flex-col justify-between"
                    >
                      {/* Top Bar: Icon, Env Tag, Actions */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            {renderIcon(ws.iconType)}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold font-mono px-2 py-0.2 ${
                              ws.env === "PROD"
                                ? "bg-red-500/10 border-red-500/25 text-red-500"
                                : ws.env === "STAGING"
                                ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
                                : "bg-primary/10 border-primary/20 text-primary"
                            }`}
                          >
                            {ws.env}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => openEditWorkspaceModal(ws, e)}
                            className="p-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                            title="Edit workspace"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                            className="p-1.5 rounded-md text-[color:var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            title="Delete workspace"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => toggleStar(ws.id, e)}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                              ws.starred
                                ? "text-amber-400 opacity-100"
                                : "text-[color:var(--muted)] opacity-50 group-hover:opacity-100"
                            }`}
                            title={ws.starred ? "Unstar" : "Star workspace"}
                          >
                            <StarIcon className="w-3.5 h-3.5" filled={ws.starred} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
                          {ws.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
                          {ws.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <DiagramIcon className="size-3.5 text-primary shrink-0" />
                          <span className="text-[11px] font-mono text-muted-foreground truncate">
                            {ws.diagrams_count} <span className="text-muted-foreground/60">/ 5 diagrams</span>
                          </span>
                          {ws.diagrams_count >= 5 ? (
                            <Badge
                              variant="outline"
                              className="text-[8px] font-mono px-1 py-0 bg-amber-500/10 text-amber-500 border-amber-500/25 shrink-0"
                            >
                              5/5 Full
                            </Badge>
                          ) : (
                            <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">
                              ({5 - ws.diagrams_count} left)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {formatDate(ws.updated_at)}
                        </span>
                      </div>
                    </Link>
                  ))}

                  {/* Create New Workspace Card */}
                  <button
                    type="button"
                    onClick={() => {
                      if (workspaces.length >= 5) {
                        showToast("Workspace limit reached (5/5). Free plan allows 5 workspaces.", "error");
                        return;
                      }
                      setCreateModalOpen(true);
                    }}
                    className={`group relative overflow-hidden rounded-xl border-2 border-dashed p-5 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 min-h-[180px] ${
                      workspaces.length >= 5
                        ? "border-amber-500/30 bg-amber-500/5 cursor-not-allowed hover:border-amber-500/40"
                        : "border-border hover:border-primary/60 bg-card/30 hover:bg-card cursor-pointer"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl border flex items-center justify-center transition-transform ${
                        workspaces.length >= 5
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          : "bg-primary/10 border-primary/20 text-primary group-hover:scale-110"
                      }`}
                    >
                      <PlusIcon className="size-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {workspaces.length >= 5 ? "Workspace Limit Reached" : "New Workspace"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {workspaces.length >= 5
                          ? "5 of 5 workspaces used"
                          : `Add environment (${5 - workspaces.length} slots left)`}
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                /* List View */
                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border shadow-xs">
                  {filteredWorkspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/dashboard/workspace/${ws.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/40 transition gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          {renderIcon(ws.iconType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
                              {ws.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold font-mono px-1.5 py-0.2 shrink-0 ${
                                ws.env === "PROD"
                                  ? "bg-red-500/10 border-red-500/25 text-red-500"
                                  : ws.env === "STAGING"
                                  ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
                                  : "bg-primary/10 border-primary/20 text-primary"
                              }`}
                            >
                              {ws.env}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {ws.description || "No description provided."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground shrink-0 justify-between sm:justify-end">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <DiagramIcon className="size-3.5 text-primary" /> {ws.diagrams_count} / 5
                          {ws.diagrams_count >= 5 && (
                            <span className="text-[9px] text-amber-500 font-bold">(Full)</span>
                          )}
                        </span>
                        <span>{formatDate(ws.updated_at)}</span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => openEditWorkspaceModal(ws, e)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                            title="Edit workspace"
                          >
                            <FiEdit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                            title="Delete workspace"
                          >
                            <FiTrash2 className="size-3.5" />
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

          {/* ── 4. Product Capabilities ──────────────────────────────── */}
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

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                    AI Architecture Copilot
                  </h3>
                </div>
                <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                  Generate, review, modify, and understand architectures using AI directly embedded into your visual editor and canvas.
                </p>
              </div>

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
      </div>

      {/* ── Create Workspace Modal ────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[color:var(--foreground)]">
                  Create New Architecture Workspace
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Plan Quota: <span className="font-mono font-semibold text-foreground">{workspaces.length} / 5</span> Workspaces Used
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {workspaces.length >= 5 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>Workspace Limit Reached (5/5)</span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Your plan allows a maximum of 5 workspaces (with 5 diagrams per workspace). Delete an unused workspace to create a new one.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Workspace Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={workspaces.length >= 5}
                  placeholder="e.g. Order Processing Pipeline"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[color:var(--foreground)]">
                  Description
                </label>
                <textarea
                  rows={3}
                  disabled={workspaces.length >= 5}
                  placeholder="e.g. Microservices architecture with API Gateway and RabbitMQ."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
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
                      disabled={workspaces.length >= 5}
                      onClick={() => setNewWsEnv(env)}
                      className={`py-2 text-xs font-mono font-bold rounded-lg border transition cursor-pointer disabled:opacity-50 ${
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
                  disabled={isSubmitting || workspaces.length >= 5}
                  className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {workspaces.length >= 5
                    ? "Limit Reached (5/5)"
                    : isSubmitting
                    ? "Creating..."
                    : "Create Workspace"}
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
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <FiTrash2 className="w-5 h-5" />
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

      {/* ── Engineering Account Preferences & Settings Dialog ── */}
      <DashboardSettingsDialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </div>
  );
}
