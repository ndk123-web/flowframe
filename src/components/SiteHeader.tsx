"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import UserDropdown from "@/components/UserDropdown";

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
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

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
            <p className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-[color:var(--foreground)]/55 whitespace-nowrap">
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

          {/* GitHub Repo */}
          <a
            href="https://github.com/ndk123-web/flowframe"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]/85 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            title="FlowFrame GitHub Repository (PolyForm Noncommercial License 1.0.0)"
          >
            <svg className="w-4 h-4 text-[color:var(--foreground)]" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>

          {/* Sandbox Sandbox */}
          {!hideSandboxLink && (showHomeLink || scrolled) && (
            <Link
              href="/workspace"
              className="hidden sm:inline-flex items-center rounded-lg border border-[var(--border)] bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-violet-500 dark:text-violet-300 transition hover:from-violet-500/20 hover:to-blue-500/20 hover:scale-105 duration-300 shadow-md"
            >
              Sandbox
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {!isDashboard && (
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-2.5 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:scale-105 whitespace-nowrap shrink-0"
                >
                  <span>Dashboard</span>
                  <span>→</span>
                </Link>
              )}
              <UserDropdown theme={theme} onToggleTheme={onToggleTheme} />
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-violet-400 hover:bg-violet-500/20 transition"
              >
                Sign In
              </Link>
              {/* Theme toggle for logged out state */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="group relative inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-gradient-to-r from-[var(--surface)]/90 to-[var(--surface)]/70 px-0.5 py-0.5 transition hover:shadow-[0_4px_16px_var(--glow)] active:scale-95 cursor-pointer"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <span className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all text-sm ${theme === "dark" ? "bg-[var(--surface-muted)] shadow-sm" : "opacity-60"}`}>
                  ☀️
                </span>
                <span className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all text-sm ${theme === "light" ? "bg-[var(--surface-muted)] shadow-sm" : "opacity-60"}`}>
                  🌙
                </span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
