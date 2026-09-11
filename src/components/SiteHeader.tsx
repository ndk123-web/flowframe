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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysGlass]);

  const isScrolled = alwaysGlass || scrolled;

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-200 ${
        isScrolled
          ? "border-b border-[var(--border)] bg-[var(--bg-elevated)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 group"
          aria-label="FlowFrame Home"
        >
          <div className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-lg bg-[var(--surface)] ring-1 ring-[var(--border-strong)] transition-opacity group-hover:opacity-80">
            <Image
              src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
              alt="FlowFrame"
              width={36}
              height={36}
              priority
              className="h-full w-full object-cover rounded-lg"
            />
          </div>

          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold tracking-tight text-[color:var(--foreground)] truncate">
              FlowFrame
            </p>
            <p className="hidden sm:block text-[10px] text-[color:var(--muted)] tracking-wide truncate">
              {badgeText}
            </p>
          </div>
        </Link>

        {/* Right nav */}
        <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {showHomeLink && (
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface)] transition-all duration-150"
            >
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden">←</span>
            </Link>
          )}

          <Link
            href="/docs"
            className="rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface)] transition-all duration-150"
          >
            Docs
          </Link>

          {/* GitHub */}
          <a
            href="https://github.com/ndk123-web/flowframe"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface)] transition-all duration-150"
            title="FlowFrame on GitHub"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>

          {/* Workspace link */}
          {!hideSandboxLink && (isScrolled || showHomeLink) && (
            <Link
              href="/workspace"
              className="hidden sm:inline-flex items-center rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[color:var(--accent)] hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/50 transition-all duration-150"
            >
              Workspace
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {!isDashboard && (
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-muted)] px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-all duration-150 whitespace-nowrap"
                >
                  Dashboard →
                </Link>
              )}
              <UserDropdown theme={theme} onToggleTheme={onToggleTheme} />
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] hover:border-[var(--accent)]/40 transition-all duration-150"
              >
                Sign In
              </Link>
              {/* Theme toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition-all duration-150 cursor-pointer"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
