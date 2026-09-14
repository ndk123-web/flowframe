"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ZoomIn, ZoomOut, Maximize2, Map, Grid3X3, SlidersHorizontal } from "lucide-react";

interface CanvasControlsBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  bgPattern: "dots" | "lines" | "cross" | "none";
  onToggleGrid: () => void;
  onOpenSettings?: () => void;
}

export default function CanvasControlsBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  showMinimap,
  onToggleMinimap,
  bgPattern,
  onToggleGrid,
  onOpenSettings,
}: CanvasControlsBarProps) {
  return (
    <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 p-1 shadow-lg backdrop-blur-md select-none">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onZoomIn}
            aria-label="Zoom in"
            className="text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom In (Ctrl +)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onZoomOut}
            aria-label="Zoom out"
            className="text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
          >
            <ZoomOut className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom Out (Ctrl -)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onFitView}
            aria-label="Fit view"
            className="text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Fit to Screen</TooltipContent>
      </Tooltip>

      <div className="h-3.5 w-px bg-[var(--border)] mx-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showMinimap ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={onToggleMinimap}
            aria-label="Toggle Minimap"
            className="text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
          >
            <Map className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {showMinimap ? "Hide Minimap" : "Show Minimap"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={bgPattern !== "none" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={onToggleGrid}
            aria-label="Toggle Grid"
            className="text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
          >
            <Grid3X3 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {bgPattern !== "none" ? "Disable Grid" : "Enable Grid"}
        </TooltipContent>
      </Tooltip>

      {onOpenSettings && (
        <>
          <div className="h-3.5 w-px bg-[var(--border)] mx-0.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onOpenSettings}
                aria-label="Canvas Settings"
                className="text-[color:var(--foreground)]/70 hover:text-primary transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="size-3.5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Canvas Settings</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}
