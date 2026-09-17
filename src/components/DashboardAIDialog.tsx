"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FiFolder,
  FiPlus,
  FiCheck,
  FiSearch,
  FiAlertCircle,
  FiArrowRight,
  FiLayers,
  FiCpu,
  FiFileText,
  FiZap,
} from "react-icons/fi";
import { Sparkles, Loader2 } from "lucide-react";
import { WorkspaceOption } from "@/components/UseTemplateDialog";
import {
  createDiagram,
  getWorkspaceDiagrams,
  type DiagramDTO,
} from "@/services/diagramApi";

export interface DashboardAIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  thinkEnabled: boolean;
  workspaces: WorkspaceOption[];
  token: string | null;
  defaultWorkspaceId?: string | null;
  onCreateWorkspace: (
    name: string,
    env: "DEV" | "PROD" | "STAGING",
  ) => Promise<WorkspaceOption | null>;
  onConfirmLaunch: (
    workspaceId: string,
    diagramId: string,
    prompt: string,
    think: boolean,
  ) => void;
}

export default function DashboardAIDialog({
  isOpen,
  onClose,
  prompt,
  thinkEnabled,
  workspaces,
  token,
  defaultWorkspaceId,
  onCreateWorkspace,
  onConfirmLaunch,
}: DashboardAIDialogProps) {
  // State
  const [selectedWsId, setSelectedWsId] = useState<string>("");
  const [wsSearch, setWsSearch] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsEnv, setNewWsEnv] = useState<"DEV" | "PROD" | "STAGING">("DEV");
  const [isSubmittingWs, setIsSubmittingWs] = useState(false);

  // Diagram selection within workspace
  const [diagramMode, setDiagramMode] = useState<"new" | "existing">("existing");
  const [newDiagramTitle, setNewDiagramTitle] = useState("");
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>("");
  const [workspaceDiagrams, setWorkspaceDiagrams] = useState<DiagramDTO[]>([]);
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAtWorkspaceLimit = workspaces.length >= 5;

  // Derive smart initial title from prompt
  const suggestedTitle = useMemo(() => {
    if (!prompt || !prompt.trim()) return "AI Architecture";
    const clean = prompt.trim();
    // Check known patterns
    if (/cache[- ]aside/i.test(clean)) return "Cache-Aside Architecture";
    if (/load[- ]balancer/i.test(clean)) return "Load Balanced Topology";
    if (/api[- ]gateway/i.test(clean)) return "Gateway Microservices Flow";
    if (/message[- ]queue|rabbitmq/i.test(clean)) return "Event Queue Pipeline";
    if (/pub[- ]?sub/i.test(clean)) return "PubSub Event Broker Flow";
    // Extract first 4-5 words or 35 chars
    const words = clean.split(/\s+/).slice(0, 5).join(" ");
    return words.length > 35 ? `${words.slice(0, 32)}…` : words;
  }, [prompt]);

  // Reset dialog state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsCreatingWorkspace(false);
      setNewWsName("");
      setNewWsEnv("DEV");
      setIsLaunching(false);
      setNewDiagramTitle(suggestedTitle);

      // Select default workspace or first available
      if (
        defaultWorkspaceId &&
        workspaces.some((w) => w.id === defaultWorkspaceId)
      ) {
        setSelectedWsId(defaultWorkspaceId);
      } else if (workspaces.length > 0) {
        setSelectedWsId(workspaces[0].id);
      } else {
        setSelectedWsId("");
        setIsCreatingWorkspace(true);
      }
    }
  }, [isOpen, defaultWorkspaceId, workspaces, suggestedTitle]);

  // Fetch diagrams whenever selected workspace changes
  useEffect(() => {
    if (!isOpen || !selectedWsId || !token) {
      setWorkspaceDiagrams([]);
      return;
    }

    setIsLoadingDiagrams(true);
    getWorkspaceDiagrams(selectedWsId, token)
      .then((diagrams) => {
        setWorkspaceDiagrams(diagrams || []);
        if (!diagrams || diagrams.length === 0) {
          setDiagramMode("new");
          setSelectedDiagramId("");
        } else {
          // If there are existing diagrams, keep mode user selected or default to "new"
          if (
            !selectedDiagramId ||
            !diagrams.some((d) => d.id === selectedDiagramId)
          ) {
            setSelectedDiagramId(diagrams[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch workspace diagrams:", err);
        setWorkspaceDiagrams([]);
        setDiagramMode("new");
      })
      .finally(() => {
        setIsLoadingDiagrams(false);
      });
  }, [isOpen, selectedWsId, token]);

  // Filter workspaces by search
  const filteredWorkspaces = useMemo(() => {
    const q = wsSearch.toLowerCase().trim();
    if (!q) return workspaces;
    return workspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [workspaces, wsSearch]);

  // Handle inline workspace creation
  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    if (isAtWorkspaceLimit) {
      setErrorMessage(
        "Free plan limit reached (max 5 workspaces). Please select an existing workspace.",
      );
      return;
    }

    setIsSubmittingWs(true);
    setErrorMessage(null);
    try {
      const created = await onCreateWorkspace(newWsName.trim(), newWsEnv);
      if (created) {
        setSelectedWsId(created.id);
        setIsCreatingWorkspace(false);
        setNewWsName("");
        setDiagramMode("new");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create workspace");
    } finally {
      setIsSubmittingWs(false);
    }
  };

  // Launch AI in selected workspace + diagram
  const handleLaunch = async () => {
    if (!selectedWsId) {
      setErrorMessage("Please select or create a workspace first.");
      return;
    }

    if (!token) {
      setErrorMessage("Authentication token missing. Please sign in.");
      return;
    }

    setIsLaunching(true);
    setErrorMessage(null);

    try {
      if (diagramMode === "new") {
        // Create new diagram in the selected workspace
        const titleToUse =
          newDiagramTitle.trim() || suggestedTitle || "AI Architecture";
        const created = await createDiagram(
          selectedWsId,
          {
            title: titleToUse,
            description: prompt.slice(0, 160),
            nodes: [],
            edges: [],
            configs: {},
          },
          token,
        );
        onConfirmLaunch(selectedWsId, created.id, prompt, thinkEnabled);
      } else {
        // Use existing diagram
        if (!selectedDiagramId) {
          setErrorMessage(
            "Please select a diagram or choose 'Create New Diagram'.",
          );
          setIsLaunching(false);
          return;
        }
        onConfirmLaunch(selectedWsId, selectedDiagramId, prompt, thinkEnabled);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize workspace canvas");
      setIsLaunching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 bg-background border border-border text-foreground shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Run Relay AI in Workspace
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Select where to compile, simulate, and persist your AI
                architecture.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Prompt Preview Snippet */}
        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Incoming Prompt
            </span>
            {thinkEnabled && (
              <Badge
                variant="outline"
                className="text-[9.5px] font-mono px-1.5 py-0 bg-primary/10 text-primary border-primary/30 flex items-center gap-1 font-semibold"
              >
                <FiCpu className="size-2.5 text-primary" />
                <span>Think Mode: ON</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
            “{prompt}”
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-foreground flex items-center justify-between gap-2 animate-in fade-in-50">
            <div className="flex items-center gap-2 min-w-0">
              <FiAlertCircle className="size-4 text-red-500 shrink-0" />
              <span className="truncate text-red-400">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[11px] font-semibold text-red-400 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── 1. Target Workspace Section ──────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FiFolder className="size-3.5 text-primary" />
              <span>1. Choose Workspace</span>
            </label>

            {!isCreatingWorkspace && !isAtWorkspaceLimit && (
              <button
                type="button"
                onClick={() => setIsCreatingWorkspace(true)}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FiPlus className="size-3" />
                <span>Create workspace</span>
              </button>
            )}

            {isAtWorkspaceLimit && !isCreatingWorkspace && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border/80 px-2 py-0.5 rounded-full">
                5/5 Workspaces (Limit)
              </span>
            )}
          </div>

          {isCreatingWorkspace ? (
            /* Inline Workspace Creation Form */
            <form
              onSubmit={handleCreateWorkspaceSubmit}
              className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in-50"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-foreground block">
                  New Workspace Name
                </span>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Production Cluster, Microservices Lab"
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-muted-foreground block">
                  Environment
                </span>
                <div className="flex items-center gap-1.5">
                  {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setNewWsEnv(env)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                        newWsEnv === env
                          ? "bg-primary/15 text-primary border border-primary/40 font-semibold"
                          : "text-muted-foreground border border-border/80 hover:text-foreground bg-background"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
                {workspaces.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingWorkspace(false)}
                    className="h-7 px-2.5 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={!newWsName.trim() || isSubmittingWs}
                  className="h-7 px-3 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {isSubmittingWs ? "Creating…" : "Create Workspace"}
                </Button>
              </div>
            </form>
          ) : (
            /* Workspaces List */
            <div className="space-y-2">
              {workspaces.length > 3 && (
                <div className="relative">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={wsSearch}
                    onChange={(e) => setWsSearch(e.target.value)}
                    placeholder="Search workspaces…"
                    className="w-full h-7 pl-8 pr-2.5 text-xs rounded-md border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {workspaces.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center space-y-2.5 bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    No workspaces found. Create your first workspace to persist
                    and simulate your architectures.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingWorkspace(true)}
                    className="h-8 text-xs cursor-pointer"
                  >
                    <FiPlus className="size-3 mr-1" />
                    Create First Workspace
                  </Button>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin pr-0.5">
                  {filteredWorkspaces.map((ws) => {
                    const isSelected = selectedWsId === ws.id;
                    return (
                      <div
                        key={ws.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedWsId(ws.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedWsId(ws.id);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left min-h-[42px] ${
                          isSelected
                            ? "bg-primary/10 border-primary/40 text-foreground font-semibold shadow-2xs"
                            : "bg-muted/10 border-border/70 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FiFolder
                            className={`size-4 shrink-0 ${
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="text-xs truncate block font-medium">
                              {ws.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground/80 block">
                              {ws.diagrams_count || 0} diagram
                              {(ws.diagrams_count || 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[8.5px] font-mono px-1.5 py-0 bg-background/80"
                          >
                            {ws.env || "DEV"}
                          </Badge>
                          {isSelected && (
                            <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <FiCheck className="size-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 2. Target Diagram Mode (New vs Existing) ─────────────────── */}
        {selectedWsId && !isCreatingWorkspace && (
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FiLayers className="size-3.5 text-primary" />
                <span>2. Choose Canvas Diagram</span>
              </label>

              {/* Toggle New vs Existing */}
              {workspaceDiagrams.length > 0 && (
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/80">
                  <button
                    type="button"
                    onClick={() => setDiagramMode("new")}
                    className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-medium transition cursor-pointer ${
                      diagramMode === "new"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    + New Diagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiagramMode("existing")}
                    className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-medium transition cursor-pointer ${
                      diagramMode === "existing"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Existing ({workspaceDiagrams.length})
                  </button>
                </div>
              )}
            </div>

            {isLoadingDiagrams ? (
              <div className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading workspace diagrams…</span>
              </div>
            ) : diagramMode === "new" || workspaceDiagrams.length === 0 ? (
              /* Create New Diagram Input */
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/15 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Diagram Name
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Fresh Canvas
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={newDiagramTitle}
                  onChange={(e) => setNewDiagramTitle(e.target.value)}
                  placeholder="e.g. Cache-Aside Microservices"
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                  Relay Will Open Into that workspace and diagram onto which you
                  select
                </p>
              </div>
            ) : (
              /* Existing Diagrams Selector */
              <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin pr-0.5">
                {workspaceDiagrams.map((d) => {
                  const isSelected = selectedDiagramId === d.id;
                  return (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDiagramId(d.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedDiagramId(d.id);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left min-h-[38px] ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 text-foreground font-semibold shadow-2xs"
                          : "bg-muted/10 border-border/70 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FiFileText
                          className={`size-3.5 shrink-0 ${
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-xs truncate font-medium">
                          {d.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {d.nodes_count || 0} nodes
                        </span>
                        {isSelected && (
                          <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <FiCheck className="size-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/80 gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={
              !selectedWsId ||
              isLaunching ||
              isCreatingWorkspace ||
              (diagramMode === "new" && !newDiagramTitle.trim()) ||
              (diagramMode === "existing" && !selectedDiagramId)
            }
            onClick={handleLaunch}
            className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Launching Canvas…</span>
              </>
            ) : (
              <>
                <span>Launch in Workspace</span>
                <FiArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
