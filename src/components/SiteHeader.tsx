"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Theme = "light" | "dark";

type SiteHeaderProps = {
  theme: Theme;
  onToggleTheme: () => void;
  showHomeLink?: boolean;
  badgeText?: string;
  hideSandboxLink?: boolean;
  alwaysGlass?: boolean;
};

export default function SiteHeader({
  theme,
  onToggleTheme,
  showHomeLink = false,
  badgeText = "Distributed Systems Simulator",
  hideSandboxLink = false,
  alwaysGlass = false,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (alwaysGlass) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysGlass]);

  const isHeaderGlass = alwaysGlass || scrolled;

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        isHeaderGlass
          ? "border-b border-[var(--border)] bg-[var(--surface)]/78 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {isHeaderGlass && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/75 to-transparent animate-pulse" />
      )}

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 sm:gap-3 min-w-0" aria-label="FlowFrame Home">
          <div className="shrink-0 rounded-full bg-gradient-to-br from-cyan-500/35 via-sky-500/20 to-blue-500/35 p-[2px] shadow-[0_10px_35px_-18px_var(--glow)] transition-transform duration-300 group-hover:scale-105">
            <div className="relative h-8 w-8 sm:h-11 sm:w-11 overflow-hidden rounded-full bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/90">
              <Image
                src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                alt="FlowFrame"
                width={44}
                height={44}
                priority
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>

          <div className="leading-tight min-w-0">
            <p className="text-sm sm:text-base font-semibold tracking-tight text-[color:var(--foreground)] truncate">FlowFrame</p>
            {/* Badge only visible sm+ */}
            <p className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-[color:var(--foreground)]/55 truncate max-w-[200px]">
              {badgeText}
            </p>
          </div>
        </Link>

        {/* Right nav */}
        <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {showHomeLink && (
            <Link
              href="/"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[var(--surface)]"
            >
              {/* Show arrow only on mobile, full word on sm+ */}
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden leading-none">←</span>
            </Link>
          )}

          <Link
            href="/docs"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] transition hover:bg-[var(--surface-muted)]"
          >
            Docs
          </Link>

          {/* Workspace Sandbox: hidden on mobile to prevent overflow */}
          {!hideSandboxLink && (showHomeLink || scrolled) && (
            <Link
              href="/workspace"
              className="hidden sm:inline-flex items-center animate-fade-in-scale rounded-lg border border-[var(--border)] bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-violet-500 dark:text-violet-300 transition hover:from-violet-500/20 hover:to-blue-500/20 hover:scale-105 duration-300 shadow-md"
            >
              Sandbox
            </Link>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="group relative inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-gradient-to-r from-[var(--surface)]/90 to-[var(--surface)]/70 px-0.5 py-0.5 transition hover:shadow-[0_4px_16px_var(--glow)] active:scale-95"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all text-sm ${theme === "dark" ? "bg-[var(--surface-muted)] shadow-sm" : "opacity-60"}`}>
              ☀️
            </span>
            <span className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all text-sm ${theme === "light" ? "bg-[var(--surface-muted)] shadow-sm" : "opacity-60"}`}>
              🌙
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
