"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import UserDropdown from "@/components/UserDropdown";
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
} from "@/components/DashboardIcons";

import { getUserWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, WorkspaceDTO } from "@/services/workspaceApi";
import { getRecentDiagrams, RecentDiagramDTO } from "@/services/diagramApi";
import { formatDate } from "@/utils/formatDate";

type Theme = "light" | "dark";
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

export default function PostmanDashboardPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [recentDiagrams, setRecentDiagrams] = useState<RecentDiagramDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [newWsEnv, setNewWsEnv] = useState<"DEV" | "PROD" | "STAGING">("DEV");

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

  const [activeSidebarNav, setActiveSidebarNav] = useState("workspaces");

  const router = useRouter();
  const { user, token, isAuthenticated, _hasHydrated } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

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
    if (_hasHydrated && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Fetch workspaces & recent diagrams from Rust API
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
            env: dto.env as any,
            diagrams_count: dto.diagrams_count,
            updated_at: dto.updated_at,
            starred: false,
            color: dto.color || "from-violet-500/20 to-indigo-500/20",
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

  if (!_hasHydrated || !isAuthenticated || !user) return null;

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w))
    );
  };

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) {
      showToast("Please enter a workspace name.", "error");
      return;
    }

    if (workspaces.length >= 5) {
      showToast("Personal Plan limit reached (5/5 Workspaces). Upgrade your plan for more.", "error");
      return;
    }

    if (!token) return;

    try {
      const created = await createWorkspace(
        {
          name: newWsName.trim(),
          description: newWsDesc.trim() || undefined,
          env: newWsEnv,
          icon_type: "zap",
        },
        token
      );

      const newItem: WorkspaceItem = {
        id: created.id,
        name: created.name,
        description: created.description || "",
        env: created.env as any,
        diagrams_count: 0,
        updated_at: "Just now",
        starred: false,
        color: "from-violet-500/20 to-indigo-500/20",
        iconType: "zap",
      };

      setWorkspaces([newItem, ...workspaces]);
      showToast(`Workspace "${created.name}" created!`, "success");
      setCreateModalOpen(false);
      setNewWsName("");
      setNewWsDesc("");
    } catch (err: any) {
      showToast(err.message || "Failed to create workspace", "error");
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

  const handleUpdateWorkspace = async () => {
    if (!editingWsId || !editWsName.trim() || !token) return;
    try {
      const updated = await updateWorkspace(
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
                name: updated.name,
                description: updated.description || "",
                env: updated.env as any,
              }
            : w
        )
      );

      showToast(`Workspace "${updated.name}" updated successfully!`, "success");
      setEditModalOpen(false);
      setEditingWsId(null);
    } catch (err: any) {
      showToast(err.message || "Failed to update workspace", "error");
    }
  };

  const openDeleteWorkspaceModal = (ws: WorkspaceItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingWs(ws);
    setDeleteWsModalOpen(true);
  };

  const handleDeleteWorkspace = async () => {
    if (!deletingWs || !token) return;
    try {
      setIsDeletingWs(true);
      await deleteWorkspace(deletingWs.id, token);
      setWorkspaces((prev) => prev.filter((w) => w.id !== deletingWs.id));
      showToast(`Workspace "${deletingWs.name}" deleted successfully!`, "success");
      setDeleteWsModalOpen(false);
      setDeletingWs(null);
    } catch (err: any) {
      showToast(err.message || "Failed to delete workspace", "error");
    } finally {
      setIsDeletingWs(false);
    }
  };

  const renderIcon = (type: WorkspaceItem["iconType"]) => {
    switch (type) {
      case "cart":
        return <CartIcon className="w-5 h-5 text-violet-400" />;
      case "chat":
        return <ChatIcon className="w-5 h-5 text-cyan-400" />;
      case "card":
        return <CreditCardIcon className="w-5 h-5 text-emerald-400" />;
      default:
        return <ZapIcon className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[color:var(--foreground)] transition-colors duration-300">
      {/* ── TOPBAR HEADER ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-2.5 max-w-full gap-2">
          {/* Left: Brand + Scope Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="group flex items-center gap-2 shrink-0">
              <div className="rounded-full bg-gradient-to-br from-cyan-500/35 to-blue-500/35 p-[2px] transition-transform duration-300 group-hover:scale-105">
                <div className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <Image
                    src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                    alt="FlowFrame"
                    width={32}
                    height={32}
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <span className="font-bold text-sm tracking-tight hidden sm:inline">FlowFrame</span>
            </Link>

            <span className="text-[color:var(--foreground)]/20 font-light hidden md:inline">/</span>

            {/* Scope / Workspace Dropdown Tag */}
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[color:var(--foreground)]/90 truncate max-w-[130px] sm:max-w-[180px]">
                {user.name || user.email.split("@")[0]}&apos;s Workspace
              </span>
              <ChevronDownIcon className="w-3 h-3 text-[color:var(--foreground)]/40" />
            </div>
          </div>

          {/* Center: Command-K Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--foreground)]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces, diagrams... (⌘K)"
                className="w-full pl-9 pr-12 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition placeholder-[color:var(--foreground)]/30"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[9px] font-mono text-[color:var(--foreground)]/40 border border-[var(--border)]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Actions + User Profile Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/scenarios"
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 px-2 sm:px-3 py-1.5 text-xs font-semibold text-violet-400 transition"
              title="Explore simulation scenarios"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Scenarios</span>
            </Link>

            <Link
              href="/learn"
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 sm:px-3 py-1.5 text-xs font-semibold text-indigo-400 transition"
              title="Interactive system design guides"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="hidden sm:inline">Learn</span>
            </Link>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New Workspace</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* User Dropdown with Avatar & Logout inside */}
            <UserDropdown
              theme={theme}
              onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            />
          </div>
        </div>
      </header>

      {/* ── BODY: SIDEBAR + MAIN AREA ──────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/40 hidden lg:flex flex-col justify-between p-3 space-y-6">
          <div className="space-y-4">
            {/* Quick Stats Banner */}
            <div className="p-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-violet-400">Personal Plan</p>
              <p className="text-xs font-semibold">{workspaces.length} / 5 Workspaces</p>
              <div className="w-full bg-[var(--surface-muted)] h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-violet-500 h-full rounded-full" style={{ width: `${Math.min(100, (workspaces.length / 5) * 100)}%` }} />
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="space-y-1">
              {[
                { id: "workspaces", label: "Workspaces", icon: <FolderIcon className="w-4 h-4 text-violet-400" />, count: workspaces.length },
                { id: "diagrams", label: "All Diagrams", icon: <DiagramIcon className="w-4 h-4 text-cyan-400" />, count: totalDiagramsCount },
                { id: "starred", label: "Starred", icon: <StarIcon className="w-4 h-4 text-amber-400" />, count: workspaces.filter((w) => w.starred).length },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSidebarNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeSidebarNav === item.id
                      ? "bg-violet-500/15 border border-violet-500/25 text-violet-400"
                      : "text-[color:var(--foreground)]/70 hover:bg-[var(--surface-muted)] hover:text-[color:var(--foreground)]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon} {item.label}
                  </span>
                  <span className="text-[10px] font-mono opacity-50">{item.count}</span>
                </button>
              ))}

              <div className="pt-2 border-t border-[var(--border)] space-y-1">
                <Link
                  href="/scenarios"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[color:var(--foreground)]/70 hover:bg-violet-500/10 hover:text-violet-400 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Scenarios</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">LIVE</span>
                </Link>

                <Link
                  href="/learn"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[color:var(--foreground)]/70 hover:bg-indigo-500/10 hover:text-indigo-400 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Learn Center</span>
                  </span>
                </Link>

                <Link
                  href="/docs"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface-muted)] hover:text-[color:var(--foreground)] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>DSL Docs</span>
                  </span>
                </Link>
              </div>
            </nav>
          </div>

          {/* Quick Sandbox Link */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <SandboxIcon className="w-4 h-4" /> Sandbox Mode
            </div>
            <p className="text-[10px] text-[color:var(--foreground)]/50 leading-relaxed">
              Try the canvas simulator without saving to account.
            </p>
            <Link
              href="/workspace"
              className="block w-full text-center py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              Open Sandbox
            </Link>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)]/60 pb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Workspaces Overview
              </h1>
              <p className="text-xs text-[color:var(--foreground)]/55 mt-1">
                Manage your system architecture projects and distributed diagrams.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-500/20 transition cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4" /> New Workspace
            </button>
          </div>

          {/* Search bar on mobile */}
          <div className="md:hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[color:var(--foreground)] focus:outline-none"
            />
          </div>

          {/* Filter Bar & View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-muted)]/80 border border-[var(--border)] overflow-x-auto max-w-full">
              {[
                { id: "all", label: "All Workspaces" },
                { id: "starred", label: "Starred" },
                { id: "development", label: "DEV" },
                { id: "production", label: "PROD" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FilterTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[var(--surface)] text-[color:var(--foreground)] shadow-sm border border-[var(--border)]"
                      : "text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]"
                  }`}
                >
                  {tab.id === "starred" && <StarIcon className="w-3.5 h-3.5 text-amber-400" />}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <span className="text-xs text-[color:var(--foreground)]/40 font-mono">
                {filteredWorkspaces.length} result{filteredWorkspaces.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "grid" ? "bg-[var(--surface)] text-violet-400 shadow-sm" : "opacity-40"
                  }`}
                  title="Grid View"
                >
                  <GridIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "list" ? "bg-[var(--surface)] text-violet-400 shadow-sm" : "opacity-40"
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Workspaces Grid / List View / Skeleton Loader */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 p-5 space-y-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[var(--surface-muted)]" />
                    <div className="w-12 h-4 rounded bg-[var(--surface-muted)]" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 rounded bg-[var(--surface-muted)]" />
                    <div className="w-full h-3 rounded bg-[var(--surface-muted)]" />
                  </div>
                  <div className="pt-3 border-t border-[var(--border)]/50 flex justify-between">
                    <div className="w-20 h-3 rounded bg-[var(--surface-muted)]" />
                    <div className="w-16 h-3 rounded bg-[var(--surface-muted)]" />
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
                    className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-5 transition-all duration-300 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 flex flex-col justify-between"
                  >
                    {/* Environment Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center text-base">
                          {renderIcon(ws.iconType)}
                        </div>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                            ws.env === "PROD"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : ws.env === "STAGING"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                          }`}
                        >
                          {ws.env}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => openEditWorkspaceModal(ws, e)}
                          className="p-1 rounded-lg text-[color:var(--foreground)]/40 hover:text-violet-400 hover:bg-violet-500/10 transition cursor-pointer"
                          title="Edit workspace name & description"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                          className="p-1 rounded-lg text-[color:var(--foreground)]/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Delete workspace"
                        >
                          🗑️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleStar(ws.id, e)}
                          className={`transition-all hover:scale-125 cursor-pointer ${
                            ws.starred ? "text-amber-400 opacity-100" : "text-[color:var(--foreground)]/30 opacity-40 group-hover:opacity-100"
                          }`}
                          title={ws.starred ? "Unstar" : "Star workspace"}
                        >
                          <StarIcon className="w-4 h-4" filled={ws.starred} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h3 className="text-base font-bold group-hover:text-violet-400 transition-colors truncate">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-[color:var(--foreground)]/50 line-clamp-2 min-h-[32px]">
                        {ws.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/50 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[color:var(--foreground)]/50">
                        <DiagramIcon className="w-3.5 h-3.5 text-violet-400" /> {ws.diagrams_count} diagram{ws.diagrams_count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] font-mono text-[color:var(--foreground)]/35">
                        {formatDate(ws.updated_at)}
                      </span>
                    </div>
                  </Link>
                ))}

                {/* Create New Workspace Card */}
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-violet-500/40 bg-[var(--surface)]/30 p-5 transition-all duration-300 hover:bg-[var(--surface)]/50 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[190px]"
                >
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/15 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[color:var(--foreground)]/60 group-hover:text-violet-400 transition-colors">
                      New Workspace
                    </p>
                    <p className="text-[10px] text-[color:var(--foreground)]/35 mt-0.5">
                      Create architecture project
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              /* List View */
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm divide-y divide-[var(--border)] overflow-hidden">
                {filteredWorkspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/dashboard/workspace/${ws.id}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-muted)] transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center">
                        {renderIcon(ws.iconType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold group-hover:text-violet-400 transition-colors truncate">
                            {ws.name}
                          </h3>
                          <span
                            className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                              ws.env === "PROD"
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : ws.env === "STAGING"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                            }`}
                          >
                            {ws.env}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--foreground)]/45 truncate">
                          {ws.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-[color:var(--foreground)]/50 flex items-center gap-1">
                        <DiagramIcon className="w-3.5 h-3.5 text-violet-400" /> {ws.diagrams_count}
                      </span>
                      <span className="text-[10px] font-mono text-[color:var(--foreground)]/35 hidden sm:inline">
                        {formatDate(ws.updated_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => openEditWorkspaceModal(ws, e)}
                        className="p-1 rounded-lg text-[color:var(--foreground)]/40 hover:text-violet-400 hover:bg-violet-500/10 transition cursor-pointer"
                        title="Edit workspace"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                        className="p-1 rounded-lg text-[color:var(--foreground)]/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete workspace"
                      >
                        🗑️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => toggleStar(ws.id, e)}
                        className={`transition-all cursor-pointer ${
                          ws.starred ? "text-amber-400 opacity-100" : "text-[color:var(--foreground)]/30 opacity-40 group-hover:opacity-100"
                        }`}
                        title={ws.starred ? "Unstar" : "Star workspace"}
                      >
                        <StarIcon className="w-4 h-4" filled={ws.starred} />
                      </button>
                      <span className="text-xs text-violet-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
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
              <p className="text-sm font-semibold text-[color:var(--foreground)]/60">No workspaces match your filter</p>
              <p className="text-xs text-[color:var(--foreground)]/35">
                Try resetting filters or search term.
              </p>
            </div>
          )}

          {/* Recent Diagrams Strip */}
          <div className="space-y-3 pt-4 border-t border-[var(--border)]/60">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--foreground)]/40 flex items-center gap-2">
              <ZapIcon className="w-4 h-4 text-cyan-400" /> Recent Diagrams
            </h2>

            {recentDiagrams.length === 0 ? (
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 text-center text-xs text-[color:var(--foreground)]/40">
                No recent diagrams yet. Create a diagram inside any workspace to see it here!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentDiagrams.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/workspace/${d.workspace_id}/${d.id}`}
                    className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] hover:border-cyan-500/30 transition group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold group-hover:text-cyan-400 transition-colors truncate flex items-center gap-1.5">
                        <DiagramIcon className="w-3.5 h-3.5 text-cyan-400" /> {d.title}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        {d.env}
                      </span>
                    </div>
                    <p className="text-[10px] text-[color:var(--foreground)]/40 truncate">
                      {d.workspace_name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── CREATE WORKSPACE MODAL ──────────────────────────── */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Create Workspace</h2>
              <p className="text-xs text-[color:var(--foreground)]/50">
                Postman-style project scope for architecture diagrams.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--foreground)]/70 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g., Microservices Cluster"
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
                      onClick={() => setNewWsEnv(env)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                        newWsEnv === env
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
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Brief description of the architecture stack..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[color:var(--foreground)]/60 hover:bg-[var(--surface-muted)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateWorkspace}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition cursor-pointer"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Edit Workspace</h2>
              <p className="text-xs text-[color:var(--foreground)]/50">
                Update workspace details in MongoDB.
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
                onClick={() => setEditModalOpen(false)}
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

      {/* Delete Workspace Confirmation Modal */}
      {deleteWsModalOpen && deletingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl border border-rose-500/30 bg-[var(--surface)] text-[color:var(--foreground)] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold">Delete Workspace</h3>
            </div>

            <p className="text-xs text-[color:var(--foreground)]/70 leading-relaxed">
              Are you sure you want to delete <strong className="text-[color:var(--foreground)] font-semibold">&quot;{deletingWs.name}&quot;</strong>? This will permanently delete all diagrams and canvas data associated with this workspace.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setDeleteWsModalOpen(false);
                  setDeletingWs(null);
                }}
                disabled={isDeletingWs}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--surface-muted)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWorkspace}
                disabled={isDeletingWs}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingWs ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete Workspace"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
