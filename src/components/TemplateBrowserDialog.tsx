"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FiSearch,
  FiArrowRight,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  STARTER_TEMPLATES,
  StarterTemplateDefinition,
} from "@/templates/starterTemplates";

export { STARTER_TEMPLATES as WORKSPACE_TEMPLATES };
export type { StarterTemplateDefinition as TemplateDefinition };

const CATEGORIES = [
  "All",
  "Traffic Routing",
  "Data Caching",
  "Microservices",
  "Asynchronous",
  "Storage Offload",
  "Pub/Sub Fan-Out",
] as const;

interface TemplateBrowserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (templateId: string) => void;
  onUseTemplate?: (template: StarterTemplateDefinition) => void;
  existingNodeCount?: number;
}

export default function TemplateBrowserDialog({
  isOpen,
  onClose,
  onSelectTemplate,
  onUseTemplate,
  existingNodeCount = 0,
}: TemplateBrowserDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [confirmTemplate, setConfirmTemplate] = useState<StarterTemplateDefinition | null>(null);

  // Filter templates based on category and search query
  const filteredTemplates = useMemo(() => {
    return STARTER_TEMPLATES.filter((tpl) => {
      const matchesCategory =
        selectedCategory === "All" || tpl.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.title.toLowerCase().includes(q) ||
        tpl.desc.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.components.some((c) => c.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleTemplateClick = (template: StarterTemplateDefinition) => {
    // If used from Dashboard (create new diagram in workspace)
    if (onUseTemplate) {
      onUseTemplate(template);
      onClose();
      return;
    }

    // If used from Canvas (loading into active canvas)
    if (existingNodeCount > 0) {
      setConfirmTemplate(template);
    } else {
      if (onSelectTemplate) {
        onSelectTemplate(template.id);
      }
      onClose();
    }
  };

  const handleConfirmReplace = () => {
    if (confirmTemplate && onSelectTemplate) {
      onSelectTemplate(confirmTemplate.id);
      setConfirmTemplate(null);
      onClose();
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setConfirmTemplate(null);
      setSearchQuery("");
      setSelectedCategory("All");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-2xl md:max-w-3xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 bg-background border border-border text-foreground shadow-2xl rounded-xl">
        {/* Confirmation Shield when replacing existing diagram on Canvas */}
        {confirmTemplate ? (
          <div className="space-y-4 py-2 animate-in fade-in-50 duration-150">
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-foreground">
              <FiAlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground text-sm">
                  Replace Current Diagram?
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Your canvas currently contains{" "}
                  <strong className="text-foreground font-mono">
                    {existingNodeCount} component
                    {existingNodeCount !== 1 ? "s" : ""}
                  </strong>
                  . Loading{" "}
                  <strong className="text-foreground">
                    {confirmTemplate.title}
                  </strong>{" "}
                  will overwrite your active layout.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>Selected Architecture:</span>
                <span className="font-semibold text-foreground">
                  {confirmTemplate.title}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Component Count:</span>
                <span className="text-foreground">{confirmTemplate.nodeCount} nodes</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmTemplate(null)}
                className="h-9 px-3 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleConfirmReplace}
                className="h-9 px-4 text-xs font-semibold shadow-xs cursor-pointer"
              >
                Replace Canvas
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Architecture Templates
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Start with a production-ready, pre-configured distributed system architecture.
              </DialogDescription>
            </DialogHeader>

            {/* Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by pattern, component, or keyword…"
                className="w-full h-9 pl-9 pr-8 text-xs font-sans rounded-lg border border-border bg-muted/20 focus:bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  <FiX className="size-3" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer shrink-0 ${
                    selectedCategory === category
                      ? "bg-primary/10 text-primary border border-primary/30 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Template Cards Grid */}
            <div className="space-y-2">
              {filteredTemplates.length === 0 ? (
                <div className="py-12 text-center space-y-2 select-none border border-dashed border-border/80 rounded-xl bg-muted/10">
                  <p className="text-xs font-semibold text-foreground">
                    No templates found
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    No architecture templates matched "{searchQuery}". Try a different keyword or category.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="h-8 text-xs mt-1 cursor-pointer"
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleTemplateClick(template);
                          }
                        }}
                        className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition duration-150 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[120px]"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="size-7 rounded-lg bg-background border border-border flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                                <Icon className="size-3.5" />
                              </div>
                              <h4 className="text-xs font-bold text-foreground truncate tracking-tight">
                                {template.title}
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/60 shrink-0">
                              {template.nodeCount} nodes
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {template.desc}
                          </p>
                        </div>

                        <div className="pt-2.5 mt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span className="truncate max-w-[170px]">
                            {template.category}
                          </span>
                          <span className="flex items-center gap-1 font-sans text-primary group-hover:translate-x-0.5 transition-transform font-semibold text-[11px]">
                            <span>{onUseTemplate ? "Use Template" : "Open"}</span>
                            <FiArrowRight className="size-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
