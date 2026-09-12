"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import UserDropdown from "@/components/UserDropdown";
import { FiGithub, FiSun, FiMoon } from "react-icons/fi";

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
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const pathname = usePathname() || "";

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

  const isRouteActive = (route: string) => {
    if (route === "/learn/glossary") {
      return pathname.startsWith("/learn/glossary");
    }
    if (route === "/learn") {
      return pathname.startsWith("/learn") && !pathname.startsWith("/learn/glossary");
    }
    return pathname.startsWith(route);
  };

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", authOnly: true },
    { label: "Scenarios", href: "/scenarios" },
    { label: "Learn", href: "/learn" },
    { label: "Glossary", href: "/learn/glossary" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-200 ${
        isScrolled
          ? "border-b border-[var(--border)] bg-[var(--bg-elevated)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3 gap-2">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 group shrink-0"
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
            <p className="hidden md:block text-[10px] text-[color:var(--muted)] tracking-wide truncate">
              {badgeText}
            </p>
          </div>
        </Link>

        {/* Center/Main Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          {showHomeLink && (
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface)] transition-all duration-150"
            >
              Home
            </Link>
          )}

          {navLinks.map((item) => {
            if (item.authOnly && (!_hasHydrated || !isAuthenticated)) return null;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                  active
                    ? "bg-[var(--accent)]/10 text-[color:var(--accent)] font-semibold border border-[var(--accent)]/25"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface)] border border-transparent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Nav / Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* GitHub link */}
          <a
            href="https://github.com/ndk123-web/flowframe"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition-all duration-150"
            title="FlowFrame on GitHub"
          >
            <FiGithub className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          {/* Sandbox Canvas link */}
          {!hideSandboxLink && (
            <Link
              href="/workspace"
              className="inline-flex items-center rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[color:var(--accent)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/50 transition-all duration-150"
            >
              Canvas
            </Link>
          )}

          {_hasHydrated && isAuthenticated ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <UserDropdown theme={theme} onToggleTheme={onToggleTheme} />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/signin"
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] hover:border-[var(--accent)]/40 transition-all duration-150"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition-all duration-150 cursor-pointer"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <FiSun className="w-3.5 h-3.5" />
                ) : (
                  <FiMoon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
