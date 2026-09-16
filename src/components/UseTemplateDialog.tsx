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
} from "react-icons/fi";
import { StarterTemplateDefinition } from "@/templates/starterTemplates";

export interface WorkspaceOption {
  id: string;
  name: string;
  env?: "DEV" | "PROD" | "STAGING" | string;
  diagrams_count?: number;
}

interface UseTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: StarterTemplateDefinition | null;
  workspaces: WorkspaceOption[];
  defaultWorkspaceId?: string | null;
  existingDiagramNames?: string[];
  onCreateWorkspace: (name: string, env: "DEV" | "PROD" | "STAGING") => Promise<WorkspaceOption | null>;
  onConfirmUseTemplate: (workspaceId: string, diagramTitle: string, template: StarterTemplateDefinition) => Promise<void>;
}

export default function UseTemplateDialog({
  isOpen,
  onClose,
  template,
  workspaces,
  defaultWorkspaceId,
  existingDiagramNames = [],
  onCreateWorkspace,
  onConfirmUseTemplate,
}: UseTemplateDialogProps) {
  const [selectedWsId, setSelectedWsId] = useState<string>("");
  const [wsSearch, setWsSearch] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsEnv, setNewWsEnv] = useState<"DEV" | "PROD" | "STAGING">("DEV");
  const [isSubmittingWs, setIsSubmittingWs] = useState(false);
  const [isCreatingDiagram, setIsCreatingDiagram] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize selected workspace
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsCreatingWorkspace(false);
      setNewWsName("");
      setNewWsEnv("DEV");

      if (defaultWorkspaceId && workspaces.some((w) => w.id === defaultWorkspaceId)) {
        setSelectedWsId(defaultWorkspaceId);
      } else if (workspaces.length > 0) {
        setSelectedWsId(workspaces[0].id);
      } else {
        setSelectedWsId("");
      }
    }
  }, [isOpen, defaultWorkspaceId, workspaces]);

  // Compute sensible diagram title with duplicate resolution
  const resolvedDiagramTitle = useMemo(() => {
    if (!template) return "";
    const baseTitle = template.title;
    if (!existingDiagramNames.includes(baseTitle)) {
      return baseTitle;
    }

    let count = 2;
    while (existingDiagramNames.includes(`${baseTitle} ${count}`)) {
      count++;
    }
    return `${baseTitle} ${count}`;
  }, [template, existingDiagramNames]);

  // Filter workspaces by search
  const filteredWorkspaces = useMemo(() => {
    const q = wsSearch.toLowerCase().trim();
    if (!q) return workspaces;
    return workspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [workspaces, wsSearch]);

  if (!template) return null;
  const TemplateIcon = template.icon;

  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setIsSubmittingWs(true);
    setErrorMessage(null);
    try {
      const created = await onCreateWorkspace(newWsName.trim(), newWsEnv);
      if (created) {
        setSelectedWsId(created.id);
        setIsCreatingWorkspace(false);
        setNewWsName("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create workspace");
    } finally {
      setIsSubmittingWs(false);
    }
  };

  const handleUseTemplate = async () => {
    if (!selectedWsId || !template) return;

    setIsCreatingDiagram(true);
    setErrorMessage(null);
    try {
      await onConfirmUseTemplate(selectedWsId, resolvedDiagramTitle, template);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create diagram from template");
    } finally {
      setIsCreatingDiagram(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-lg max-h-[88vh] overflow-y-auto p-4 sm:p-6 bg-background border border-border text-foreground shadow-2xl rounded-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Use Template
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a new diagram from this starter architecture in your workspace.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Template Card Summary */}
        <div className="p-3 rounded-lg border border-border/80 bg-muted/20 flex items-start gap-3">
          <div className="size-8 rounded-lg bg-background border border-border flex items-center justify-center text-primary shrink-0 mt-0.5">
            <TemplateIcon className="size-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground truncate">
                {template.title}
              </h4>
              <Badge
                variant="outline"
                className="text-[9px] font-mono px-1.5 py-0 bg-primary/10 text-primary border-primary/20 shrink-0"
              >
                {template.nodeCount} nodes
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {template.desc}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-foreground flex items-center justify-between gap-2 animate-in fade-in-50">
            <div className="flex items-center gap-2 min-w-0">
              <FiAlertCircle className="size-4 text-red-500 shrink-0" />
              <span className="truncate text-red-400">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleUseTemplate}
              className="text-[11px] font-semibold text-red-400 hover:underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Workspace Selection / Inline Creation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FiFolder className="size-3.5 text-primary" />
              <span>Target Workspace</span>
            </label>

            {!isCreatingWorkspace && (
              <button
                type="button"
                onClick={() => setIsCreatingWorkspace(true)}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FiPlus className="size-3" />
                <span>Create new workspace</span>
              </button>
            )}
          </div>

          {isCreatingWorkspace ? (
            /* Inline Workspace Creation View */
            <form
              onSubmit={handleCreateWorkspaceSubmit}
              className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in-50"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-foreground block">
                  New Workspace Name
                </span>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Distributed Core, Production Cluster"
                  className="w-full h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
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
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingWorkspace(false)}
                  className="h-7 px-2.5 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
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
            /* Workspace Selection List */
            <div className="space-y-2">
              {workspaces.length > 4 && (
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
                <div className="p-4 rounded-lg border border-dashed border-border text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    No workspaces found. Create a workspace to store your diagrams.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingWorkspace(true)}
                    className="h-8 text-xs cursor-pointer"
                  >
                    <FiPlus className="size-3 mr-1" />
                    Create Workspace
                  </Button>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin pr-0.5">
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
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-left min-h-[44px] ${
                          isSelected
                            ? "bg-primary/10 border-primary/40 text-foreground font-semibold shadow-2xs"
                            : "bg-muted/10 border-border/70 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FiFolder
                            className={`size-4 shrink-0 ${
                              isSelected ? "text-primary" : "text-muted-foreground"
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
                            className="text-[8px] font-mono px-1 py-0 bg-background/80"
                          >
                            {ws.env || "DEV"}
                          </Badge>
                          {isSelected && (
                            <FiCheck className="size-3.5 text-primary shrink-0" />
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

        {/* Diagram Name Information */}
        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex items-center justify-between text-xs font-mono select-none">
          <span className="text-muted-foreground text-[11px]">New Diagram Name:</span>
          <span className="font-semibold text-foreground text-[11px] truncate max-w-[220px]">
            {resolvedDiagramTitle}
          </span>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isCreatingDiagram}
            className="h-9 px-3 text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleUseTemplate}
            disabled={!selectedWsId || isCreatingDiagram || workspaces.length === 0}
            className="h-9 px-4 text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {isCreatingDiagram ? (
              <>
                <div className="size-3 rounded-full border border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                <span>Creating diagram…</span>
              </>
            ) : (
              <>
                <span>Use Template</span>
                <FiArrowRight className="size-3" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
