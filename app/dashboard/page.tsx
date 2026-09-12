"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useThemeStore } from "@/store/useThemeStore";
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

const AVATAR_PRESETS = [
  // 1. Robots & Cyber Bots
  {
    id: "bot-1",
    category: "robots" as const,
    label: "Circuit Master",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CircuitMaster",
  },
  {
    id: "bot-2",
    category: "robots" as const,
    label: "Byte Commander",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=ByteCommander",
  },
  {
    id: "bot-3",
    category: "robots" as const,
    label: "Cyber Architect",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberArchitect",
  },
  {
    id: "bot-4",
    category: "robots" as const,
    label: "Quantum Dev",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=QuantumDev",
  },
  {
    id: "bot-5",
    category: "robots" as const,
    label: "Node Runner",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=NodeRunner",
  },
  {
    id: "bot-6",
    category: "robots" as const,
    label: "Data Daemon",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=DataDaemon",
  },
  // 2. Pixel Art & Retro Hackers
  {
    id: "pix-1",
    category: "pixel" as const,
    label: "Lead Architect",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Architect",
  },
  {
    id: "pix-2",
    category: "pixel" as const,
    label: "Core Coder",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Coder",
  },
  {
    id: "pix-3",
    category: "pixel" as const,
    label: "Cyber Hacker",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Hacker",
  },
  {
    id: "pix-4",
    category: "pixel" as const,
    label: "System Admin",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=SysAdmin",
  },
  {
    id: "pix-5",
    category: "pixel" as const,
    label: "Cloud Engineer",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=CloudEngineer",
  },
  {
    id: "pix-6",
    category: "pixel" as const,
    label: "SecOps Specialist",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=SecurityPro",
  },
  // 3. Illustrated Dev Personas
  {
    id: "per-1",
    category: "personas" as const,
    label: "Felix",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  },
  {
    id: "per-2",
    category: "personas" as const,
    label: "Aiden",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden",
  },
  {
    id: "per-3",
    category: "personas" as const,
    label: "Zoe",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  },
  {
    id: "per-4",
    category: "personas" as const,
    label: "Leo",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  },
  {
    id: "per-5",
    category: "personas" as const,
    label: "Maya",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
  },
  {
    id: "per-6",
    category: "personas" as const,
    label: "Sasha",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha",
  },
  // 4. Studio Developer Portraits
  {
    id: "stu-1",
    category: "portraits" as const,
    label: "Alex Studio",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "stu-2",
    category: "portraits" as const,
    label: "Jordan Studio",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "stu-3",
    category: "portraits" as const,
    label: "Marcus Studio",
    url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "stu-4",
    category: "portraits" as const,
    label: "Elena Studio",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "stu-5",
    category: "portraits" as const,
    label: "David Studio",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "stu-6",
    category: "portraits" as const,
    label: "Taylor Studio",
    url: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=128&q=80",
  },
];

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
  const [aiPrompt, setAiPrompt] = useState("");

  const toggleWorkspaceExpand = async (wsId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedWorkspaces((prev) => ({ ...prev, [wsId]: !prev[wsId] }));
    if (!workspaceDiagramsMap[wsId] && token) {
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

  // Settings Modal states
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatar || "");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [selectedAvatarCategory, setSelectedAvatarCategory] = useState<"all" | "robots" | "pixel" | "personas" | "portraits">("all");

  useEffect(() => {
    if (user) {
      setProfileAvatarUrl(user.avatar || "");
      setProfileName(user.name || "");
    }
  }, [user]);

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
        className={`fixed md:sticky top-0 h-screen shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between transition-all duration-200 z-50 md:z-30 ${
          sidebarCollapsed ? "md:w-16" : "md:w-64"
        } ${
          mobileMenuOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full md:translate-x-0 w-64 md:w-auto"
        }`}
      >
        {/* Sidebar Header: Logo & Collapse Button */}
        <div>
          <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 min-w-0 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-elevated)] ring-1 ring-[var(--border-strong)]">
                <Image
                  src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                  alt="FlowFrame"
                  width={32}
                  height={32}
                  priority
                  className="h-full w-full object-cover rounded-lg"
                />
              </div>
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="min-w-0 leading-tight">
                  <span className="text-sm font-bold tracking-tight text-[color:var(--foreground)] block truncate">
                    FlowFrame
                  </span>
                  <span className="text-[10px] font-mono text-[color:var(--muted)] block truncate">
                    Architecture Hub
                  </span>
                </div>
              )}
            </Link>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <FiChevronRight className="w-4 h-4" />
                ) : (
                  <FiChevronLeft className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex md:hidden p-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <div className="p-2 space-y-3">
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
                  title="Scenarios"
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
              </div>
            ) : (
              /* Expanded Hierarchical Sidebar */
              <>
                {/* 1. WORKSPACES HIERARCHY */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2.5 py-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
                      Workspaces
                    </span>
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(true)}
                      className="p-1 rounded text-[color:var(--muted)] hover:text-[color:var(--accent)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                      title="Create New Workspace"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {/* All Workspaces Root Filter */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav("workspaces");
                        setSelectedWsId(null);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        activeNav === "workspaces" && selectedWsId === null
                          ? "bg-[var(--accent)]/15 text-[color:var(--accent)]"
                          : "text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FiGrid className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">All Systems</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[color:var(--muted)]">
                        {workspaces.length}
                      </span>
                    </button>

                    {/* Workspaces Tree with Expandable Child Diagrams */}
                    {workspaces.map((ws) => {
                      const isExpanded = !!expandedWorkspaces[ws.id];
                      const childDiagrams =
                        workspaceDiagramsMap[ws.id] ||
                        recentDiagrams.filter((d) => d.workspace_id === ws.id);
                      const isSelected = activeNav === "workspaces" && selectedWsId === ws.id;

                      return (
                        <div key={ws.id} className="space-y-0.5">
                          <div
                            className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                              isSelected
                                ? "bg-[var(--accent)]/15 text-[color:var(--accent)] font-semibold"
                                : "text-[color:var(--foreground)]/80 hover:bg-[var(--bg-elevated)] hover:text-[color:var(--foreground)]"
                            }`}
                            onClick={() => {
                              setSelectedWsId(ws.id);
                              setActiveNav("workspaces");
                            }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={(e) => toggleWorkspaceExpand(ws.id, e)}
                                className="p-0.5 rounded text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition cursor-pointer"
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? (
                                  <FiChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <FiChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <FiFolder className="w-3.5 h-3.5 text-[color:var(--accent)] shrink-0" />
                              <span className="truncate text-xs">{ws.name}</span>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
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

                          {/* Expanded Child Architecture Diagrams */}
                          {isExpanded && (
                            <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-[var(--border)] ml-4">
                              {childDiagrams.length > 0 ? (
                                childDiagrams.map((diag) => (
                                  <Link
                                    key={diag.id}
                                    href={`/dashboard/workspace/${ws.id}/${diag.id}`}
                                    className="flex items-center gap-2 px-2 py-1 rounded text-[11px] text-[color:var(--muted)] hover:text-[color:var(--accent)] hover:bg-[var(--bg-elevated)] transition truncate"
                                    title={diag.title}
                                  >
                                    <FiLayers className="w-3 h-3 shrink-0 text-[color:var(--muted)]" />
                                    <span className="truncate">{diag.title}</span>
                                  </Link>
                                ))
                              ) : (
                                <div className="px-2 py-1 text-[10px] text-[color:var(--muted)] italic flex items-center justify-between">
                                  <span>No diagrams yet</span>
                                  <Link
                                    href={`/dashboard/workspace/${ws.id}`}
                                    className="text-[color:var(--accent)] hover:underline not-italic font-medium"
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
                  </div>
                </div>

                {/* 2. RECENT ACTIVITY / DIAGRAMS */}
                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between px-2.5 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav("recent");
                        setSelectedWsId(null);
                        setMobileMenuOpen(false);
                      }}
                      className="text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)] hover:text-[color:var(--foreground)] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FiClock className="w-3 h-3 text-[color:var(--accent)]" />
                      <span>Recent Activity</span>
                    </button>
                    {recentDiagrams.length > 0 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[color:var(--muted)]">
                        {recentDiagrams.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {recentDiagrams.slice(0, 5).map((diag) => (
                      <Link
                        key={diag.id}
                        href={`/dashboard/workspace/${diag.workspace_id}/${diag.id}`}
                        className="flex flex-col px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition group"
                        title={`Open ${diag.title}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-medium text-[color:var(--foreground)] truncate group-hover:text-[color:var(--accent)] transition-colors">
                            {diag.title}
                          </span>
                          <span className="text-[9px] font-mono text-[color:var(--muted)] shrink-0">
                            {formatDate(diag.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--muted)] truncate mt-0.5">
                          <span className="truncate">{diag.workspace_name}</span>
                          <span>·</span>
                          <span className="font-mono">{diag.nodes_count || 0} nodes</span>
                        </div>
                      </Link>
                    ))}
                    {recentDiagrams.length === 0 && (
                      <p className="px-2.5 py-1 text-[11px] text-[color:var(--muted)] italic">
                        No recent diagrams opened
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. EXPLORE & LEARN */}
                <div className="pt-2 space-y-1">
                  <p className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
                    Explore & Learn
                  </p>
                  <div className="h-px bg-[var(--border)] my-1" />

                  <Link
                    href="/scenarios"
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
                    title="Scenarios"
                  >
                    <FiSliders className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Scenarios</span>
                  </Link>

                  <Link
                    href="/learn"
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
                    title="Learn Academy"
                  >
                    <FiBookOpen className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span>Learn Academy</span>
                  </Link>

                  <Link
                    href="/learn/glossary"
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
                    title="Systems Glossary"
                  >
                    <FiBookmark className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Systems Glossary</span>
                  </Link>

                  <Link
                    href="/docs"
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
                    title="Documentation"
                  >
                    <FiFileText className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>Documentation</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar Bottom: Anchored User Profile Card (Canva / IDE style - opens Settings on click) */}
        <div className="p-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]/30">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className={`w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border)] transition cursor-pointer text-left group ${
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
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-lg object-cover bg-[var(--accent)]/10 ring-1 ring-[var(--border)] group-hover:ring-[var(--accent)] transition"
                  />
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
            >
              <FiMenu className="w-4 h-4" />
            </button>
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
            <Link
              href="/workspace"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-elevated)] text-[color:var(--foreground)] transition cursor-pointer"
            >
              <FiBox className="w-3.5 h-3.5 text-[color:var(--accent)]" />
              <span className="hidden sm:inline">Open Simulator</span>
            </Link>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-xs"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Workspace</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-10">
          {/* ── 1. Developer Tool Architecture Lab Hero ────────────────── */}
          <section className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7 shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-mono font-medium text-[color:var(--muted)]">
                <FiZap className="w-3.5 h-3.5 text-[color:var(--accent)]" />
                <span>Distributed Systems Architecture Lab</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                Design, simulate, and inspect distributed architectures.
              </h2>
              <p className="text-xs sm:text-sm text-[color:var(--muted)] max-w-2xl leading-relaxed">
                Build topologies visually or via code, run deterministic simulated requests frame-by-frame, and observe packet routing across services, caches, brokers, and databases.
              </p>
            </div>

            {/* 3 Developer Entry Pathways */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {/* Pathway 1: Blank Canvas */}
              <Link
                href="/workspace"
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center">
                    <FiBox className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
                      New Blank Architecture
                    </h3>
                    <p className="text-[11px] text-[color:var(--muted)] leading-relaxed mt-1">
                      Start with a clean canvas, place microservices, and connect edges visually.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--border)] mt-3 flex items-center justify-between text-[11px] font-semibold text-[color:var(--accent)]">
                  <span>Open Simulator</span>
                  <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Pathway 2: Monaco DSL Editor */}
              <Link
                href="/workspace"
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FiCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[color:var(--foreground)] group-hover:text-indigo-400 transition-colors">
                      Code-First DSL Editor
                    </h3>
                    <p className="text-[11px] text-[color:var(--muted)] leading-relaxed mt-1">
                      Define nodes, request endpoints, and routes declaratively with FlowFrame DSL.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--border)] mt-3 flex items-center justify-between text-[11px] font-semibold text-indigo-400">
                  <span>Open Code Editor</span>
                  <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Pathway 3: Interactive Scenarios */}
              <Link
                href="/scenarios"
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FiSliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[color:var(--foreground)] group-hover:text-emerald-400 transition-colors">
                      Production Scenarios
                    </h3>
                    <p className="text-[11px] text-[color:var(--muted)] leading-relaxed mt-1">
                      Explore pre-built system patterns: load balancing, caching, and pub/sub queues.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--border)] mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                  <span>Explore Scenarios</span>
                  <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            {/* Natural Topology Generation Input */}
            <div className="pt-2 border-t border-[var(--border)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const prompt = aiPrompt.trim();
                  router.push(
                    `/workspace?ai=true${prompt ? `&prompt=${encodeURIComponent(prompt)}` : ""}`
                  );
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe a system topology (e.g., API Gateway routing to User and Order microservices with Redis cache)..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[var(--accent)] transition"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs cursor-pointer shrink-0"
                >
                  <span>Generate</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </section>

          {/* ── 2. Recent Diagrams Section ───────────────────────────── */}
          {(activeNav === "recent" || recentDiagrams.length > 0) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-[color:var(--accent)]" />
                  <h2 className="text-sm font-bold text-[color:var(--foreground)]">
                    Recent Diagrams
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[color:var(--accent)] border border-[var(--accent)]/20">
                    {recentDiagrams.length}
                  </span>
                </div>
              </div>

              {recentDiagrams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {recentDiagrams.map((diag) => (
                    <Link
                      key={diag.id}
                      href={`/dashboard/workspace/${diag.workspace_id}/${diag.id}`}
                      className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent)]/60 hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
                    >
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              diag.env === "PROD"
                                ? "bg-[var(--red-muted)] border-[var(--red)]/25 text-[color:var(--red)]"
                                : diag.env === "STAGING"
                                ? "bg-[var(--amber-muted)] border-[var(--amber)]/25 text-[color:var(--amber)]"
                                : "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[color:var(--accent)]"
                            }`}
                          >
                            {diag.env || "DEV"}
                          </span>
                          <span className="text-[10px] font-mono text-[color:var(--muted)]">
                            {formatDate(diag.updated_at)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors truncate">
                            {diag.title}
                          </h3>
                          <p className="text-[11px] text-[color:var(--muted)] truncate mt-0.5">
                            {diag.workspace_name}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[color:var(--muted)]">
                          {diag.nodes_count || 0} nodes
                        </span>
                        <span className="font-medium text-[color:var(--accent)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Open Canvas <FiArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 p-6 text-center">
                  <p className="text-xs text-[color:var(--muted)]">
                    No recent diagrams opened yet. Select or create an architecture workspace below to begin diagramming.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── 3. Your Workspaces / Systems ─────────────────────────── */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
              <div>
                <h2 className="text-base font-bold text-[color:var(--foreground)] flex items-center gap-2">
                  <FiGrid className="w-4 h-4 text-[color:var(--accent)]" />
                  <span>Workspaces</span>
                </h2>
                <p className="text-xs text-[color:var(--muted)] mt-0.5">
                  Organize your distributed system architectures, topologies, and environments.
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative min-w-[180px] sm:min-w-[220px]">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--muted)]" />
                  <input
                    type="text"
                    placeholder="Search workspaces..."
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
                            className="p-1.5 rounded text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition"
                            title="Edit workspace"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDeleteWorkspaceModal(ws, e)}
                            className="p-1.5 rounded text-[color:var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete workspace"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
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

      {/* ── Account Preferences & Settings Modal (Canva / IDE style) ── */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[color:var(--accent)]">
                  <FiSettings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[color:var(--foreground)]">
                    Account & Preferences
                  </h3>
                  <p className="text-[11px] text-[color:var(--muted)]">
                    Personalize your developer profile and simulation settings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="p-1.5 rounded-lg text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
                title="Close"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Appearance / Theme Switcher */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
                Interface Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer text-left ${
                    theme === "dark"
                      ? "bg-[var(--bg-elevated)] border-[var(--accent)] text-[color:var(--foreground)] shadow-xs"
                      : "bg-[var(--surface)] border-[var(--border)] text-[color:var(--muted)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiMoon className={`w-4 h-4 ${theme === "dark" ? "text-[color:var(--accent)]" : ""}`} />
                    <div>
                      <p className="text-xs font-bold text-[color:var(--foreground)]">Dark Theme</p>
                      <p className="text-[10px] text-[color:var(--muted)]">Engineering dark mode</p>
                    </div>
                  </div>
                  {theme === "dark" && <FiCheck className="w-4 h-4 text-[color:var(--accent)]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer text-left ${
                    theme === "light"
                      ? "bg-[var(--bg-elevated)] border-[var(--accent)] text-[color:var(--foreground)] shadow-xs"
                      : "bg-[var(--surface)] border-[var(--border)] text-[color:var(--muted)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiSun className={`w-4 h-4 ${theme === "light" ? "text-amber-500" : ""}`} />
                    <div>
                      <p className="text-xs font-bold text-[color:var(--foreground)]">Light Theme</p>
                      <p className="text-[10px] text-[color:var(--muted)]">High-contrast light</p>
                    </div>
                  </div>
                  {theme === "light" && <FiCheck className="w-4 h-4 text-[color:var(--accent)]" />}
                </button>
              </div>
            </div>

            {/* Section 2: Profile Picture & Name */}
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[color:var(--muted)]">
                Developer Profile
              </label>

              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={
                      profileAvatarUrl ||
                      user.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`
                    }
                    alt="Profile Preview"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--accent)] shadow-md"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-bold text-[color:var(--foreground)] truncate">
                    {profileName || user.name || "Engineer"}
                  </p>
                  <p className="text-[10px] font-mono text-[color:var(--muted)] truncate">
                    {user.email}
                  </p>
                  <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-[color:var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 rounded">
                    {user.type_of_signin || "Email"} Account
                  </span>
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[color:var(--foreground)]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              {/* Avatar URL field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[color:var(--foreground)]">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={profileAvatarUrl}
                  onChange={(e) => setProfileAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-xs text-[color:var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition font-mono text-[11px]"
                />
              </div>

              {/* Quick Avatar Presets */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-[color:var(--foreground)]">
                    Developer Avatar Presets ({AVATAR_PRESETS.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const randIdx = Math.floor(Math.random() * AVATAR_PRESETS.length);
                      setProfileAvatarUrl(AVATAR_PRESETS[randIdx].url);
                      showToast(`Selected ${AVATAR_PRESETS[randIdx].label}`, "info");
                    }}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[color:var(--accent)] hover:underline cursor-pointer"
                  >
                    <FiShuffle className="w-3 h-3" />
                    <span>Surprise Me</span>
                  </button>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "robots", label: "Robots" },
                      { id: "pixel", label: "Pixel Art" },
                      { id: "personas", label: "Personas" },
                      { id: "portraits", label: "Portraits" },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedAvatarCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer shrink-0 ${
                        selectedAvatarCategory === cat.id
                          ? "bg-[var(--accent)] text-white shadow-xs"
                          : "bg-[var(--surface-muted)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Avatar Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-44 overflow-y-auto p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 scrollbar-thin">
                  {AVATAR_PRESETS.filter(
                    (p) => selectedAvatarCategory === "all" || p.category === selectedAvatarCategory
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setProfileAvatarUrl(preset.url)}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer hover:scale-105 ${
                        profileAvatarUrl === preset.url
                          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40 scale-105"
                          : "border-[var(--border)] opacity-80 hover:opacity-100 hover:border-[var(--accent)]/50"
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {profileAvatarUrl === preset.url && (
                        <div className="absolute inset-0 bg-[var(--accent)]/20 flex items-center justify-center">
                          <FiCheck className="w-3.5 h-3.5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateUser({
                      name: profileName.trim() || undefined,
                      avatar: profileAvatarUrl.trim() || undefined,
                    });
                    showToast("Profile updated successfully!", "success");
                  }}
                  className="w-full btn-primary py-2 px-4 rounded-lg text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>

            {/* Section 3: Session & Sign Out */}
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-[color:var(--muted)]">Active session</span>
              <button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  logout();
                  router.push("/signin");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition cursor-pointer"
              >
                <FiLogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
