"use client";

import { useEffect, useState } from "react";
import { FiGithub } from "react-icons/fi";
import { Star, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

const GITHUB_REPO = "ndk123-web/flowframe";
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
const CACHE_KEY = "ff_gh_stars";
const CACHE_TIME_KEY = "ff_gh_stars_time";
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache

function formatStars(count: number): string {
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return String(count);
}

interface GitHubStarButtonProps {
  variant?: "header" | "drawer" | "badge";
  className?: string;
  showLabelOnMobile?: boolean;
}

export default function GitHubStarButton({
  variant = "header",
  className,
  showLabelOnMobile = false,
}: GitHubStarButtonProps) {
  const [stars, setStars] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const num = parseInt(cached, 10);
        if (!isNaN(num)) return num;
      }
    }
    return 1; // Fallback / current actual repo stars
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchStars() {
      try {
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem(CACHE_KEY);
          const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
          if (cached && cachedTime) {
            const age = Date.now() - parseInt(cachedTime, 10);
            if (age < CACHE_DURATION) {
              const num = parseInt(cached, 10);
              if (!isNaN(num)) {
                if (isMounted) setStars(num);
                return;
              }
            }
          }
        }

        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.stargazers_count === "number" && isMounted) {
          setStars(data.stargazers_count);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(CACHE_KEY, String(data.stargazers_count));
            sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
          }
        }
      } catch {
        // Silently preserve current stars state
      }
    }

    fetchStars();
    return () => {
      isMounted = false;
    };
  }, []);

  const formattedStars = formatStars(stars);

  if (variant === "drawer") {
    return (
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub Repository"
        className={cn(
          "flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 group shadow-2xs",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <FiGithub className="size-4 text-foreground/80 group-hover:text-foreground transition-colors" />
          <span className="font-semibold text-foreground">GitHub</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
          <Star className="size-3 fill-amber-400 text-amber-400 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-mono">{formattedStars}</span>
          <ExternalLink className="size-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </a>
    );
  }

  if (variant === "badge") {
    return (
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Star FlowFrame on GitHub"
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20 transition group",
          className
        )}
      >
        <Star className="size-3 fill-amber-400 text-amber-400 transition-transform duration-200 group-hover:scale-110" />
        <span className="font-mono">{formattedStars}</span>
      </a>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Star ${GITHUB_REPO} on GitHub (${formattedStars} stars)`}
          className={cn(
            "group inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-lg border border-border/80 bg-card/60 hover:bg-muted/60 text-xs font-medium text-foreground transition-all duration-150 shadow-2xs hover:border-border-strong cursor-pointer shrink-0",
            className
          )}
        >
          <FiGithub className="size-3.5 text-foreground/80 group-hover:text-foreground transition-colors shrink-0" />
          <span
            className={cn(
              "font-semibold tracking-tight shrink-0",
              showLabelOnMobile ? "inline" : "hidden sm:inline"
            )}
          >
            Star
          </span>
          <span
            className={cn(
              "text-muted-foreground/40 shrink-0",
              showLabelOnMobile ? "inline" : "hidden sm:inline"
            )}
          >
            •
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
            <Star className="size-3 text-amber-400 fill-amber-400 transition-transform duration-200 group-hover:scale-110 shrink-0" />
            <span>{formattedStars}</span>
          </span>
        </a>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>
        <div className="flex items-center gap-1.5">
          <span>Star on GitHub</span>
          <span className="font-mono text-[10px] text-amber-300">★ {formattedStars}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
