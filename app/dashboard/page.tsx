"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useThemeStore } from "@/store/useThemeStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardSettingsDialog from "@/components/DashboardSettingsDialog";
import GitHubStarButton from "@/components/GitHubStarButton";
import {
  FiGrid,
  FiClock,
  FiActivity,
  FiBookOpen,
  FiBookmark,
  FiCode,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiFileText,
  FiSearch,
  FiPlus,
  FiStar,
  FiZap,
  FiEdit2,
  FiTrash2,
  FiMenu,
  FiX,
  FiBox,
  FiArrowRight,
  FiArrowUp,
  FiSliders,
  FiLayers,
  FiFolder,
  FiSettings,
  FiCpu,
  FiDatabase,
  FiServer,
  FiExternalLink,
  FiCheck,
  FiCompass,
  FiTerminal,
} from "react-icons/fi";
import {
  FolderIcon,
  DiagramIcon,
  StarIcon,
  ZapIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  CartIcon,
  ChatIcon,
  CreditCardIcon,
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

// Pre-built FlowFrame starter templates matching existing scenarios & patterns
const STARTER_TEMPLATES = [
  {
    id: "simple-load-balancer",
    title: "Simple Load Balancer",
    category: "Traffic Routing",
    desc: "Round-robin L7 traffic distribution across 3 backend application servers.",
    icon: FiSliders,
    iconColor: "text-muted-foreground bg-muted/40 border-border/80 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5",
    href: "/scenarios/simple-load-balancer",
    prompt: "Client sending requests to a Round-Robin Load Balancer distributing across 3 backend application servers",
  },
  {
    id: "simple-cache",
    title: "Cache-Aside Pattern",
    category: "Data Caching",
    desc: "Redis in-memory caching with PostgreSQL fallback and automatic backfilling.",
    icon: FiDatabase,
    iconColor: "text-muted-foreground bg-muted/40 border-border/80 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5",
    href: "/scenarios/simple-cache",
    prompt: "API Gateway routing to a User Service with Redis read-through caching and PostgreSQL fallback",
  },
  {
    id: "simple-api-gateway",
    title: "API Gateway Routing",
    category: "Microservices",
    desc: "Unified entry point routing /posts and /users to isolated microservices.",
    icon: FiLayers,
    iconColor: "text-muted-foreground bg-muted/40 border-border/80 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5",
    href: "/scenarios/simple-api-gateway",
    prompt: "API Gateway routing /posts and /users to separate microservices with isolated buffers",
  },
  {
    id: "simple-message-queue",
    title: "Message Queue Pipeline",
    category: "Asynchronous",
    desc: "FIFO queue buffer leveling traffic spikes across competing worker pools.",
    icon: FiCpu,
    iconColor: "text-muted-foreground bg-muted/40 border-border/80 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5",
    href: "/scenarios/simple-message-queue",
    prompt: "Order Producer publishing events into a FIFO Message Queue processed by worker consumer",
  },
  {
    id: "simple-valet-key",
    title: "Valet Key Direct Upload",
    category: "Storage Offload",
    desc: "Pre-signed token negotiation for direct client-to-storage binary streaming.",
    icon: FiBox,
    iconColor: "text-muted-foreground bg-muted/40 border-border/80 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5",
    href: "/scenarios/simple-valet-key",
    prompt: "Client requesting pre-signed valet key from server then uploading directly to S3 Cloud Storage",
  },
  {
    id: "event-driven",
    title: "Event-Driven Pub/Sub",
    category: "Pub/Sub Fan-Out",
    desc: "Topic-based pub/sub broker broadcasting parallel message dispatches.",
    icon: FiZap,
    iconColor: "text-muted-foreground bg-muted/40 border-border/80 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5",
    href: "/scenarios/event-driven",
    prompt: "Publisher dispatching events into PubSub broker fanning out to Email and Analytics services",
  },
];

const QUICK_PROMPTS = [
  {
    label: "Load Balancer",
    prompt: "Client sending requests to a Round-Robin Load Balancer distributing across 3 backend application servers",
  },
  {
    label: "Cache-Aside",
    prompt: "API Gateway routing to a User Service with Redis read-through caching and PostgreSQL fallback",
  },
  {
    label: "API Gateway",
    prompt: "API Gateway routing /posts and /users to separate microservices with isolated buffers",
  },
  {
    label: "Message Queue",
    prompt: "Order Producer publishing events into a FIFO Message Queue processed by worker consumer",
  },
];

export default function DashboardPage() {
  const { theme } = useThemeStore();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [recentDiagrams, setRecentDiagrams] = useState<RecentDiagramDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Conversational prompt composer state
  const [composerPrompt, setComposerPrompt] = useState("");
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isThinkEnabled, setIsThinkEnabled] = useState(true);

  // Subtle rotating prompts for main dashboard heading
  const ROTATING_PROMPTS = useMemo(
    () => [
      "What do you want to build?",
      "What do you want to simulate?",
      "Design a distributed system.",
      "Explore how requests flow.",
      "Build an architecture.",
    ],
    [],
  );
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const [isPromptTransitioning, setIsPromptTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsPromptTransitioning(true);
      setTimeout(() => {
        setActivePromptIdx((prev) => (prev + 1) % ROTATING_PROMPTS.length);
        setIsPromptTransitioning(false);
      }, 250);
    }, 4500);
    return () => clearInterval(timer);
  }, [ROTATING_PROMPTS]);

  // Sidebar, Mobile, Navigation & Workspace states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<"workspaces" | "recent">("workspaces");
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});
  const [workspaceDiagramsMap, setWorkspaceDiagramsMap] = useState<Record<string, RecentDiagramDTO[]>>({});
  const [loadingWsDiagrams, setLoadingWsDiagrams] = useState<Record<string, boolean>>({});

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

  // Submit Prompt to Workspace AI Copilot
  const handlePromptSubmit = (customPrompt?: string) => {
    const finalPrompt = (customPrompt || composerPrompt).trim();
    const query = finalPrompt ? `&prompt=${encodeURIComponent(finalPrompt)}` : "";
    const thinkParam = isThinkEnabled ? "&think=true" : "";
    router.push(`/workspace?ai=true${thinkParam}${query}`);
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
        return <CartIcon className="size-4 text-primary" />;
      case "chat":
        return <ChatIcon className="size-4 text-primary" />;
      case "card":
        return <CreditCardIcon className="size-4 text-primary" />;
      default:
        return <ZapIcon className="size-4 text-primary" />;
    }
  };

  if (!_hasHydrated || !isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200 antialiased selection:bg-primary/20 selection:text-primary">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── 1. LEFT SIDEBAR (Productivity Application Style) ─────────────── */}
      <aside
        className={`fixed md:sticky top-0 h-screen shrink-0 border-r border-border bg-card/95 backdrop-blur-md flex flex-col transition-all duration-200 z-50 md:z-30 overflow-hidden ${
          sidebarCollapsed ? "md:w-16 w-16" : "md:w-80 w-72"
        } ${
          mobileMenuOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        }`}
        aria-label="Dashboard Sidebar Navigation"
      >
        {/* Sidebar Header: Logo & Collapse Button */}
        <div className="shrink-0 h-14 px-3.5 border-b border-border/80 flex items-center justify-between">
          {sidebarCollapsed && !mobileMenuOpen ? (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <FiMenu className="size-4 text-primary" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/"
                className="flex items-center gap-2.5 min-w-0 group focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none rounded-lg p-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative size-7 shrink-0 flex items-center justify-center">
                  <Image
                    src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                    alt="FlowFrame Logo"
                    width={28}
                    height={28}
                    priority
                    className="size-full object-contain"
                  />
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="text-xs font-bold tracking-tight text-foreground block truncate">
                    FlowFrame
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground block truncate">
                    Workspace Hub
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <FiChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                  aria-label="Close menu"
                >
                  <FiX className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-3 py-3.5 space-y-4">
          {sidebarCollapsed && !mobileMenuOpen ? (
            /* Collapsed Icons Only */
            <div className="space-y-1.5 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setActiveNav("workspaces");
                  setSelectedWsId(null);
                }}
                className={`p-2.5 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                  activeNav === "workspaces"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Workspaces"
                aria-label="Workspaces"
              >
                <FiFolder className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveNav("recent");
                  setSelectedWsId(null);
                }}
                className={`p-2.5 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                  activeNav === "recent"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Recent Diagrams"
                aria-label="Recent Diagrams"
              >
                <FiClock className="size-4" />
              </button>

              <div className="w-5 h-px bg-border/80 my-1" />

              <Link
                href="/learn"
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                title="Learn Academy"
                aria-label="Learn Academy"
              >
                <FiBookOpen className="size-4 text-indigo-400" />
              </Link>

              <Link
                href="/scenarios"
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                title="Interactive Scenarios"
                aria-label="Interactive Scenarios"
              >
                <FiSliders className="size-4 text-emerald-400" />
              </Link>

              <Link
                href="/learn/glossary"
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                title="Systems Glossary"
                aria-label="Systems Glossary"
              >
                <FiBookmark className="size-4 text-amber-400" />
              </Link>

              <div className="w-5 h-px bg-border/80 my-1" />

              <Link
                href="/workspace?tab=editor"
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                title="Architecture DSL"
                aria-label="Architecture DSL"
              >
                <FiCode className="size-4 text-blue-400" />
              </Link>

              <Link
                href="/scenarios"
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                title="Templates Library"
                aria-label="Templates Library"
              >
                <FiBox className="size-4 text-violet-400" />
              </Link>

              <Link
                href="/docs"
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                title="Documentation"
                aria-label="Documentation"
              >
                <FiFileText className="size-4 text-cyan-400" />
              </Link>
            </div>
          ) : (
            /* Expanded Productivity Sidebar with Structured Hierarchy */
            <>
              {/* ── Group 1: Workspaces ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pb-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FiFolder className="size-3 text-primary" />
                      <span>Workspaces</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                        workspaces.length >= 5
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold"
                          : "bg-muted text-muted-foreground border-border/80"
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
                    className={`p-1 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                      workspaces.length >= 5
                        ? "text-muted-foreground/40 hover:text-muted-foreground/60"
                        : "text-muted-foreground hover:text-primary hover:bg-muted/60"
                    }`}
                    title={workspaces.length >= 5 ? "Limit reached (5/5 Workspaces)" : "Create New Workspace"}
                    aria-label="Create New Workspace"
                  >
                    <FiPlus className="size-3.5" />
                  </button>
                </div>

                {/* All Workspaces Root Filter */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("workspaces");
                    setSelectedWsId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                    activeNav === "workspaces" && selectedWsId === null
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FiGrid className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">All Workspaces</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-muted/60 border-border/80">
                    {loading ? "…" : workspaces.length}
                  </Badge>
                </button>

                {/* Workspace Items / Realistic Tree Skeletons */}
                {loading ? (
                  <div className="space-y-2 px-1 py-1" aria-label="Loading workspaces…">
                    {/* Item 1 with expanded child branch */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/40 animate-pulse">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="size-3 rounded bg-muted/70 shrink-0" />
                          <div className="size-3.5 rounded bg-muted/80 shrink-0" />
                          <div className="h-3 rounded bg-muted/70 w-28" />
                        </div>
                        <div className="h-3.5 w-8 rounded-full bg-muted/50 shrink-0" />
                      </div>
                      {/* Indented child diagrams skeleton */}
                      <div className="ml-3.5 pl-3 py-1 space-y-1.5 border-l-2 border-border/60">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/25 animate-pulse">
                          <div className="size-2.5 rounded bg-muted/60 shrink-0" />
                          <div className="h-2.5 rounded bg-muted/50 w-24" />
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/25 animate-pulse">
                          <div className="size-2.5 rounded bg-muted/60 shrink-0" />
                          <div className="h-2.5 rounded bg-muted/50 w-20" />
                        </div>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/40 animate-pulse">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="size-3 rounded bg-muted/70 shrink-0" />
                        <div className="size-3.5 rounded bg-muted/80 shrink-0" />
                        <div className="h-3 rounded bg-muted/70 w-32" />
                      </div>
                      <div className="h-3.5 w-10 rounded-full bg-muted/50 shrink-0" />
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/40 animate-pulse">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="size-3 rounded bg-muted/70 shrink-0" />
                        <div className="size-3.5 rounded bg-muted/80 shrink-0" />
                        <div className="h-3 rounded bg-muted/70 w-20" />
                      </div>
                      <div className="h-3.5 w-8 rounded-full bg-muted/50 shrink-0" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {workspaces.map((ws) => {
                      const isExpanded = !!expandedWorkspaces[ws.id];
                      const childDiagrams =
                        workspaceDiagramsMap[ws.id] ||
                        recentDiagrams.filter((d) => d.workspace_id === ws.id);
                      const isSelected = activeNav === "workspaces" && selectedWsId === ws.id;

                      return (
                        <div key={ws.id} className="space-y-0.5">
                          <div
                            className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 text-primary font-semibold border border-primary/25"
                                : "text-foreground/85 hover:bg-muted/60 hover:text-foreground"
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
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                                title={isExpanded ? "Collapse" : "Expand"}
                                aria-label={isExpanded ? `Collapse ${ws.name}` : `Expand ${ws.name}`}
                              >
                                {isExpanded ? (
                                  <FiChevronDown className="size-3" />
                                ) : (
                                  <FiChevronRight className="size-3" />
                                )}
                              </button>
                              <FiFolder className="size-3.5 text-primary shrink-0" />
                              <span className="truncate text-xs font-medium">{ws.name}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[8px] font-mono px-1 py-0 shrink-0 ml-1.5 ${
                                ws.env === "PROD"
                                  ? "bg-red-500/10 border-red-500/20 text-red-500 font-semibold"
                                  : ws.env === "STAGING"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500 font-semibold"
                                  : "bg-primary/10 border-primary/20 text-primary"
                              }`}
                            >
                              {ws.env}
                            </Badge>
                          </div>

                          {/* Child Architecture Diagrams */}
                          {isExpanded && (
                            <div className="ml-3.5 pl-3 py-1 space-y-1 border-l-2 border-border/80 my-1">
                              {loadingWsDiagrams[ws.id] ? (
                                <div className="space-y-1.5 py-0.5" aria-label="Loading diagrams…">
                                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30 animate-pulse">
                                    <div className="size-3 rounded bg-muted/60 shrink-0" />
                                    <div className="h-2.5 rounded bg-muted/50 w-28" />
                                    <div className="size-2 rounded-full bg-primary/60 animate-ping ml-auto shrink-0" />
                                  </div>
                                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/20 animate-pulse">
                                    <div className="size-3 rounded bg-muted/50 shrink-0" />
                                    <div className="h-2.5 rounded bg-muted/40 w-20" />
                                  </div>
                                </div>
                              ) : childDiagrams.length > 0 ? (
                                childDiagrams.map((diag) => (
                                  <Link
                                    key={diag.id}
                                    href={`/dashboard/workspace/${ws.id}/${diag.id}`}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                                    title={diag.title}
                                  >
                                    <FiLayers className="size-3 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate flex-1">{diag.title}</span>
                                  </Link>
                                ))
                              ) : (
                                <div className="px-2 py-1 text-[10px] text-muted-foreground italic flex items-center justify-between">
                                  <span>No diagrams yet</span>
                                  <Link
                                    href={`/dashboard/workspace/${ws.id}`}
                                    className="text-primary hover:underline not-italic font-medium text-[10px]"
                                  >
                                    + Add
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Quick Create Workspace Dashed Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (workspaces.length >= 5) {
                          showToast("Workspace limit reached (5/5). Free plan allows 5 workspaces.", "error");
                          return;
                        }
                        setCreateModalOpen(true);
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-dashed border-border/80 hover:border-primary/50 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <FiPlus className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Create Workspace</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ── Group 2: Recent Activity ── */}
              <div className="pt-2 border-t border-border/60 space-y-1.5">
                <div className="flex items-center justify-between px-2 pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav("recent");
                      setSelectedWsId(null);
                      setMobileMenuOpen(false);
                    }}
                    className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                  >
                    <FiClock className="size-3 text-primary" />
                    <span>Recent Activity</span>
                  </button>
                  {recentDiagrams.length > 0 && (
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-muted/60 border-border/80">
                      {recentDiagrams.length}
                    </Badge>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-1.5 px-1 py-1" aria-label="Loading recent diagrams…">
                    <div className="p-2 rounded-lg bg-muted/30 space-y-1 animate-pulse">
                      <div className="h-3 rounded bg-muted/70 w-32" />
                      <div className="h-2 rounded bg-muted/40 w-24" />
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 space-y-1 animate-pulse">
                      <div className="h-3 rounded bg-muted/60 w-28" />
                      <div className="h-2 rounded bg-muted/40 w-20" />
                    </div>
                  </div>
                ) : recentDiagrams.length > 0 ? (
                  <div className="space-y-1">
                    {recentDiagrams.slice(0, 4).map((diag) => (
                      <Link
                        key={diag.id}
                        href={`/dashboard/workspace/${diag.workspace_id}/${diag.id}`}
                        className="flex flex-col px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-colors group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                        title={`Open ${diag.title}`}
                      >
                        <span className="text-xs font-medium text-foreground/90 group-hover:text-primary transition-colors truncate">
                          {diag.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <span>{diag.workspace_name}</span>
                          <span className="opacity-50">·</span>
                          <span>{formatDate(diag.updated_at)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-2.5 py-1 text-[11px] text-muted-foreground italic">
                    No recent diagrams
                  </p>
                )}
              </div>

              {/* ── Group 3: Learning Hub ── */}
              <div className="pt-2 border-t border-border/60 space-y-1">
                <div className="px-2 pb-0.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FiCompass className="size-3 text-indigo-400" />
                    <span>Learning Hub</span>
                  </span>
                </div>

                <Link
                  href="/learn"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <FiBookOpen className="size-3.5 text-indigo-400 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <span className="truncate block font-medium">Learn Academy</span>
                  </div>
                </Link>

                <Link
                  href="/scenarios"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <FiSliders className="size-3.5 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <span className="truncate block font-medium">Interactive Scenarios</span>
                  </div>
                </Link>

                <Link
                  href="/learn/glossary"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <FiBookmark className="size-3.5 text-amber-400 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <span className="truncate block font-medium">Systems Glossary</span>
                  </div>
                </Link>
              </div>

              {/* ── Group 4: Developer Tools ── */}
              <div className="pt-2 border-t border-border/60 space-y-1">
                <div className="px-2 pb-0.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FiTerminal className="size-3 text-blue-400" />
                    <span>Developer Tools</span>
                  </span>
                </div>

                <Link
                  href="/workspace?tab=editor"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiCode className="size-3.5 text-blue-400 shrink-0 group-hover:scale-105 transition-transform" />
                    <span className="truncate">Architecture DSL</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Editor
                  </Badge>
                </Link>

                <Link
                  href="/scenarios"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiBox className="size-3.5 text-violet-400 shrink-0 group-hover:scale-105 transition-transform" />
                    <span className="truncate">Templates Library</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 bg-violet-500/10 text-violet-400 border-violet-500/20">
                    Presets
                  </Badge>
                </Link>

                <Link
                  href="/docs"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiFileText className="size-3.5 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform" />
                    <span className="truncate">Documentation</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                    Docs
                  </Badge>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Bottom: Anchored User Profile Card */}
        <div className="shrink-0 p-2.5 border-t border-border/80 bg-card/60">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer text-left group focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
              sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : "justify-between"
            }`}
            title="Open Account Preferences & Settings"
            aria-label="Account Settings"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User"}
                    className="size-7 rounded-md object-cover ring-1 ring-border group-hover:ring-primary/50 transition-all"
                  />
                ) : (
                  <div className="size-7 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-[11px] select-none">
                    {(user.name || user.email || "FF")
                      .split(" ")
                      .map((s: string) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-1 ring-card" />
              </div>

              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {user.name || "Architect"}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="p-1 rounded text-muted-foreground group-hover:text-foreground transition-colors">
                <FiSettings className="size-3.5" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ── 2. MAIN DASHBOARD CONTENT (ChatGPT-style Centered Workspace) ──── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Minimal Top Header */}
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md px-4 sm:px-8 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
              aria-label="Open navigation menu"
            >
              <FiMenu className="size-4" />
            </button>

            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <FiMenu className="size-3.5 text-primary" />
                <span className="text-[11px] font-mono">Sidebar</span>
              </button>
            )}

            <div className="min-w-0 flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-foreground">FlowFrame</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-muted-foreground truncate">
                {selectedWsId
                  ? workspaces.find((w) => w.id === selectedWsId)?.name || "Workspace"
                  : activeNav === "recent"
                  ? "Recent Activity"
                  : "Workspace"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GitHubStarButton className="hidden sm:inline-flex" />
            <Button variant="outline" size="sm" asChild className="gap-1.5 h-8 text-xs font-medium">
              <Link href="/workspace">
                <FiBox className="size-3.5 text-primary" />
                <span>Open Canvas</span>
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-8 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <FiPlus className="size-3.5" />
              <span className="hidden sm:inline">New Workspace</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </header>

        {/* Centered Main Canvas / Workspace Content */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
          {/* ── A. TOP / HERO & MAIN PROMPT COMPOSER (ChatGPT Style) ──────── */}
          <section className="space-y-6 text-center max-w-3xl mx-auto">
            {/* Minimal Welcome Heading with Subtle Rotating Prompts */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/80 bg-muted/40 text-muted-foreground text-[11px] font-mono font-medium">
                <span>FlowFrame Engine</span>
                <span className="opacity-60">·</span>
                <span>Distributed Systems Simulator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground text-pretty min-h-[44px] flex items-center justify-center">
                <span
                  className={`transition-all duration-300 ease-out ${
                    isPromptTransitioning
                      ? "opacity-0 -translate-y-1"
                      : "opacity-100 translate-y-0"
                  }`}
                >
                  {ROTATING_PROMPTS[activePromptIdx]}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Describe a distributed architecture to simulate with AI, choose a starter topology, or continue working on your workspaces.
              </p>
            </div>

            {/* ── Conversational Prompt Composer ── */}
            <div className="relative rounded-2xl border border-border bg-card shadow-xs transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 text-left p-3.5 sm:p-4 space-y-3">
              <label htmlFor="dashboard-prompt-composer" className="sr-only">
                Describe your distributed system or simulation
              </label>
              <textarea
                id="dashboard-prompt-composer"
                ref={composerTextareaRef}
                rows={3}
                value={composerPrompt}
                onChange={(e) => setComposerPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (composerPrompt.trim()) {
                      handlePromptSubmit();
                    }
                  }
                }}
                placeholder="Describe your distributed system or what you want to simulate (e.g. API Gateway routing /posts and /users with Redis caching and PostgreSQL fallback)…"
                className="w-full bg-transparent resize-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none leading-relaxed"
              />

              {/* Composer Controls Footer */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-muted-foreground font-mono truncate hidden sm:inline">
                    Enter to simulate · Shift+Enter for new line
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono truncate sm:hidden">
                    Enter to simulate
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Modern AI IDE "Think" Mode Toggle — immediately to the LEFT of Send button */}
                  <button
                    type="button"
                    onClick={() => setIsThinkEnabled((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer select-none ${
                      isThinkEnabled
                        ? "bg-primary/10 border-primary/30 text-primary shadow-xs"
                        : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                    title={
                      isThinkEnabled
                        ? "Deep Architecture Reasoning: ON (Evaluates bottlenecks, CAP trade-offs, queue sizing & failure modes before compiling DSL)"
                        : "Deep Architecture Reasoning: OFF (Fast direct architecture generation)"
                    }
                    aria-pressed={isThinkEnabled}
                  >
                    <FiCpu className={`size-3.5 ${isThinkEnabled ? "text-primary" : "text-muted-foreground"}`} />
                    <span>Think</span>
                    <span
                      className={`size-1.5 rounded-full ${
                        isThinkEnabled ? "bg-primary" : "bg-muted-foreground/40"
                      }`}
                    />
                  </button>

                  {composerPrompt && (
                    <button
                      type="button"
                      onClick={() => setComposerPrompt("")}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                      title="Clear prompt"
                      aria-label="Clear prompt"
                    >
                      <FiX className="size-3.5" />
                    </button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={!composerPrompt.trim()}
                    onClick={() => handlePromptSubmit()}
                    className="size-8 p-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    aria-label="Submit prompt to architecture simulator"
                  >
                    <FiArrowUp className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-mono text-muted-foreground mr-1">
                Quick Starters:
              </span>
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handlePromptSubmit(item.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/60 text-xs font-medium transition-colors cursor-pointer"
                  title={item.prompt}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── B. STARTER ARCHITECTURE TEMPLATES ─────────────────────────── */}
          <section className="space-y-3.5" aria-labelledby="starter-templates-heading">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="starter-templates-heading" className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <FiBox className="size-4 text-primary" />
                  <span>Starter Templates</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Launch standard distributed architectures with pre-configured packet flows.
                </p>
              </div>
              <Link
                href="/scenarios"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <FiArrowRight className="size-3" />
              </Link>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STARTER_TEMPLATES.map((tmpl) => {
                const IconComp = tmpl.icon;
                return (
                  <div
                    key={tmpl.id}
                    className="group relative rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className={`size-8 rounded-lg flex items-center justify-center border ${tmpl.iconColor}`}>
                          <IconComp className="size-4" />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-muted/30 border-border/70 text-muted-foreground">
                          {tmpl.category}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {tmpl.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                          {tmpl.desc}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border/70 flex items-center justify-between text-xs">
                      <Link
                        href={tmpl.href}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Inspect Flow
                      </Link>
                      <button
                        type="button"
                        onClick={() => handlePromptSubmit(tmpl.prompt)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Canvas</span>
                        <FiArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── C. RECENT DIAGRAMS (If any exist) ─────────────────────────── */}
          {recentDiagrams.length > 0 && (
            <section className="space-y-3.5" aria-labelledby="recent-diagrams-heading">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="recent-diagrams-heading" className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <FiClock className="size-4 text-primary" />
                    <span>Recent Activity</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Jump back into your recently edited system diagrams.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentDiagrams.slice(0, 3).map((diag) => (
                  <Link
                    key={diag.id}
                    href={`/dashboard/workspace/${diag.workspace_id}/${diag.id}`}
                    className="group rounded-xl border border-border bg-card p-3.5 hover:border-primary/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatDate(diag.updated_at)}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] font-mono px-1 py-0 bg-primary/10 text-primary border-primary/20"
                        >
                          {diag.env || "DEV"}
                        </Badge>
                      </div>
                      <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {diag.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {diag.workspace_name}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-border/70 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-muted-foreground">
                        {diag.nodes_count || 0} nodes
                      </span>
                      <span className="font-medium text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <FiArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── D. YOUR WORKSPACES (With Filter, Search & Full CRUD) ──────── */}
          <section className="space-y-4" aria-labelledby="workspaces-heading">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <h2 id="workspaces-heading" className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <FiFolder className="size-4 text-primary" />
                  <span>Your Workspaces</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize diagrams by environment and manage team access.
                </p>
              </div>

              {/* Filters, Search & View Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative min-w-[170px] sm:min-w-[200px]">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search workspaces…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                  {(["all", "development", "production", "starred"] as FilterTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-2 py-1 rounded-md capitalize text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === tab
                          ? "bg-card text-primary font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab === "development" ? "DEV" : tab === "production" ? "PROD" : tab}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-card text-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Grid View"
                    aria-label="Grid View"
                  >
                    <GridIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === "list"
                        ? "bg-card text-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="List View"
                    aria-label="List View"
                  >
                    <ListIcon className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Workspaces List / Grid / Skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" aria-label="Loading workspaces…">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-7 rounded bg-muted/60" />
                      <div className="w-10 h-3.5 rounded bg-muted/60" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-3/4 h-4 rounded bg-muted/60" />
                      <div className="w-full h-2.5 rounded bg-muted/50" />
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between">
                      <div className="w-16 h-2.5 rounded bg-muted/40" />
                      <div className="w-12 h-2.5 rounded bg-muted/40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredWorkspaces.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredWorkspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/dashboard/workspace/${ws.id}`}
                      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Top: Icon, Env, Actions */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                              {renderIcon(ws.iconType)}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold font-mono px-1.5 py-0.2 ${
                                ws.env === "PROD"
                                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                                  : ws.env === "STAGING"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                  : "bg-primary/10 border-primary/20 text-primary"
                              }`}
                            >
                              {ws.env}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => openEditWorkspaceModal(ws, e)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Edit workspace"
                              aria-label="Edit workspace"
                            >
                              <FiEdit2 className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Delete workspace"
                              aria-label="Delete workspace"
                            >
                              <FiTrash2 className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => toggleStar(ws.id, e)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                ws.starred
                                  ? "text-amber-400 opacity-100"
                                  : "text-muted-foreground/50 hover:text-amber-400"
                              }`}
                              title={ws.starred ? "Unstar" : "Star workspace"}
                              aria-label={ws.starred ? "Unstar workspace" : "Star workspace"}
                            >
                              <StarIcon className="size-3" filled={ws.starred} />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1 mb-3">
                          <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {ws.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed min-h-[30px]">
                            {ws.description || "No description provided."}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-border/70 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                          <DiagramIcon className="size-3 text-primary shrink-0" />
                          <span>{ws.diagrams_count} / 5</span>
                          {ws.diagrams_count >= 5 && (
                            <span className="text-[9px] text-amber-500 font-bold">(Full)</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
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
                    className={`group relative rounded-xl border-2 border-dashed p-4 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[160px] ${
                      workspaces.length >= 5
                        ? "border-amber-500/30 bg-amber-500/5 cursor-not-allowed"
                        : "border-border hover:border-primary/50 bg-card/40 hover:bg-card cursor-pointer"
                    }`}
                  >
                    <div
                      className={`size-8 rounded-lg border flex items-center justify-center transition-transform ${
                        workspaces.length >= 5
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          : "bg-primary/10 border-primary/20 text-primary group-hover:scale-110"
                      }`}
                    >
                      <PlusIcon className="size-4" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {workspaces.length >= 5 ? "Workspace Limit (5/5)" : "New Workspace"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {workspaces.length >= 5
                          ? "5 of 5 slots used"
                          : `Add environment (${5 - workspaces.length} slots left)`}
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                /* List View */
                <div className="rounded-xl border border-border bg-card divide-y divide-border/70 overflow-hidden shadow-xs">
                  {filteredWorkspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/dashboard/workspace/${ws.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-muted/40 transition-colors gap-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          {renderIcon(ws.iconType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {ws.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-[8px] font-bold font-mono px-1 py-0 shrink-0 ${
                                ws.env === "PROD"
                                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                                  : ws.env === "STAGING"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                  : "bg-primary/10 border-primary/20 text-primary"
                              }`}
                            >
                              {ws.env}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-md mt-0.5">
                            {ws.description || "No description provided."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground shrink-0 justify-between sm:justify-end">
                        <span className="flex items-center gap-1 text-[11px]">
                          <DiagramIcon className="size-3 text-primary" /> {ws.diagrams_count} / 5
                        </span>
                        <span className="text-[10px]">{formatDate(ws.updated_at)}</span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => openEditWorkspaceModal(ws, e)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Edit workspace"
                            aria-label="Edit workspace"
                          >
                            <FiEdit2 className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Delete workspace"
                            aria-label="Delete workspace"
                          >
                            <FiTrash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              /* Empty State */
              <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center flex flex-col items-center justify-center">
                <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                  <FolderIcon className="size-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  No workspaces found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
                  {searchQuery
                    ? `No workspaces match "${searchQuery}". Try clearing your search.`
                    : "You haven't created any workspaces yet. Workspaces organize your architectures by environment."}
                </p>
                <Button
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                  className="gap-1.5 h-8 text-xs cursor-pointer shadow-xs"
                >
                  <PlusIcon className="size-3.5" />
                  <span>Create Workspace</span>
                </Button>
              </div>
            )}
          </section>

          {/* ── E. SYSTEM CAPABILITIES & INFORMATION (Secondary) ─────────── */}
          <section className="space-y-3 pt-4 border-t border-border/80" aria-labelledby="capabilities-heading">
            <h2 id="capabilities-heading" className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Core Capabilities
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-1">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span>Deterministic Simulation</span>
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Frame-by-frame packet inspection with microsecond state transitions and fallback logic.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-1">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Interactive Topologies</span>
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Visual graph canvas with live metrics, node inspection, and dynamic connection routing.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-1">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-indigo-500" />
                  <span>Architecture DSL</span>
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Declarative system definitions with Monaco code editor, syntax parsing, and execution.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ── Create Workspace Modal ──────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Create Architecture Workspace
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Quota: <span className="font-mono font-semibold text-foreground">{workspaces.length} / 5</span> Used
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {workspaces.length >= 5 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400 space-y-1">
                <span className="font-semibold block">Workspace Limit Reached (5/5)</span>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Your plan allows up to 5 workspaces. Delete an unused workspace to create a new one.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="new-ws-name">
                  Workspace Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="new-ws-name"
                  type="text"
                  required
                  disabled={workspaces.length >= 5}
                  placeholder="e.g. Order Processing Cluster"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="new-ws-desc">
                  Description
                </label>
                <textarea
                  id="new-ws-desc"
                  rows={2}
                  disabled={workspaces.length >= 5}
                  placeholder="e.g. Microservices architecture with API Gateway and Redis."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground block">
                  Environment
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      disabled={workspaces.length >= 5}
                      onClick={() => setNewWsEnv(env)}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                        newWsEnv === env
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || workspaces.length >= 5}
                  className="h-8 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {workspaces.length >= 5
                    ? "Limit Reached"
                    : isSubmitting
                    ? "Creating…"
                    : "Create Workspace"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Workspace Modal ────────────────────────────────────────── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Edit Workspace
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateWorkspace} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="edit-ws-name">
                  Workspace Name
                </label>
                <input
                  id="edit-ws-name"
                  type="text"
                  required
                  value={editWsName}
                  onChange={(e) => setEditWsName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="edit-ws-desc">
                  Description
                </label>
                <textarea
                  id="edit-ws-desc"
                  rows={2}
                  value={editWsDesc}
                  onChange={(e) => setEditWsDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground block">
                  Environment
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEditWsEnv(env)}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                        editWsEnv === env
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="h-8 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Workspace Modal ──────────────────────────────────────── */}
      {deleteWsModalOpen && deletingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="size-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <FiTrash2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Delete Workspace
                </h3>
                <p className="text-[11px] text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{deletingWs.name}</span> and all associated architecture diagrams?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteWsModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={confirmDeleteWorkspace}
                disabled={isDeletingWs}
                className="h-8 text-xs font-semibold cursor-pointer shadow-xs"
              >
                {isDeletingWs ? "Deleting…" : "Delete Workspace"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Engineering Account Preferences & Settings Dialog ───────────── */}
      <DashboardSettingsDialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </div>
  );
}
