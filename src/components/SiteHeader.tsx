"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import UserDropdown from "@/components/UserDropdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  Zap,
  BookOpen,
  Bookmark,
  FileText,
  LogOut,
  ChevronRight,
  ExternalLink,
  Box,
} from "lucide-react";
import { FiGithub } from "react-icons/fi";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "cn";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const pathname = usePathname() || "";
  const router = useRouter();

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
    {
      label: "Dashboard",
      href: "/dashboard",
      authOnly: true,
      icon: LayoutDashboard,
      desc: "Manage workspaces & active topologies",
    },
    {
      label: "Scenarios",
      href: "/scenarios",
      icon: Zap,
      desc: "Interactive system failures & resilience",
    },
    {
      label: "Learn",
      href: "/learn",
      icon: BookOpen,
      desc: "Distributed system design fundamentals",
    },
    {
      label: "Glossary",
      href: "/learn/glossary",
      icon: Bookmark,
      desc: "Architecture patterns & terminology",
    },
    {
      label: "Docs",
      href: "/docs",
      icon: FileText,
      desc: "DSL specifications & simulation engine",
    },
  ];

  const visibleNavLinks = navLinks.filter(
    (item) => !(item.authOnly && (!_hasHydrated || !isAuthenticated))
  );

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    router.push("/signin");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-all duration-200 border-b",
        isScrolled
          ? "border-border bg-background/95 backdrop-blur-sm"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 sm:px-6 gap-2">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 group shrink-0"
          aria-label="FlowFrame Home"
        >
          <div className="relative size-8 sm:size-9 shrink-0 rounded-full overflow-hidden transition-opacity group-hover:opacity-80 flex items-center justify-center">
            <Image
              src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
              alt="FlowFrame"
              width={36}
              height={36}
              priority
              className="size-full object-contain"
            />
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground truncate">
              FlowFrame
            </p>
            <p className="hidden md:block text-[10px] text-muted-foreground tracking-wide truncate">
              {badgeText}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-0.5 shrink-0">
          {showHomeLink && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
          )}

          {visibleNavLinks.map((item) => {
            const active = isRouteActive(item.href);
            return (
              <Button
                key={item.href}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "text-xs",
                  active && "font-semibold text-primary"
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* GitHub (Desktop only) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm" asChild className="hidden sm:inline-flex">
                <a
                  href="https://github.com/ndk123-web/flowframe"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository"
                >
                  <FiGithub className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View on GitHub</TooltipContent>
          </Tooltip>

          {/* Canvas CTA */}
          {!hideSandboxLink && (
            <Button variant="default" size="sm" asChild className="h-8 px-3 text-xs font-semibold shadow-xs">
              <Link href="/workspace">
                <Box className="size-3.5 mr-1" />
                <span>Canvas</span>
              </Link>
            </Button>
          )}

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-1.5">
            {_hasHydrated && isAuthenticated ? (
              <UserDropdown theme={theme} onToggleTheme={onToggleTheme} />
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium">
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onToggleTheme}
                      aria-label="Toggle theme"
                      className="size-8"
                    >
                      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button & Structured Slide-Over Sidebar Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden size-8 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/60 text-foreground transition cursor-pointer"
                aria-label="Open mobile navigation menu"
              >
                <Menu className="size-4.5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[310px] sm:w-[340px] max-w-[88vw] p-0 flex flex-col h-full bg-background/98 backdrop-blur-xl border-l border-border shadow-2xl z-50 overflow-hidden"
            >
              <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>

              {/* ── 1. Drawer Header: Logo + Close Button ──────── */}
              <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 min-w-0"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="relative size-7 shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
                    <Image
                      src={theme === "dark" ? "/logo/flow-frame-dark.png" : "/logo/flow-frame-light.png"}
                      alt="FlowFrame"
                      width={28}
                      height={28}
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="leading-tight">
                    <span className="text-sm font-bold tracking-tight text-foreground block">
                      FlowFrame
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground block">
                      Architecture Hub
                    </span>
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMobileOpen(false)}
                  className="size-8 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* ── 2. Scrollable Drawer Body ─────────────────────────── */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
                {/* User Identity / Auth Card */}
                {_hasHydrated && isAuthenticated && user ? (
                  <div className="rounded-xl border border-border bg-card/80 p-3 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name || "User"}
                            className="size-9 rounded-lg object-cover ring-1 ring-primary/20"
                          />
                        ) : (
                          <div className="size-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-xs select-none">
                            {(user.name || user.email || "FF")
                              .split(" ")
                              .map((s: string) => s[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-1 ring-card" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {user.name || "Developer"}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="h-7 text-xs font-semibold shadow-xs cursor-pointer"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/dashboard">
                          <LayoutDashboard className="size-3 mr-1.5" />
                          <span>Dashboard</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="h-7 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-border/80 cursor-pointer"
                      >
                        <LogOut className="size-3 mr-1.5" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-2.5 shadow-xs">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Welcome to FlowFrame</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Sign in to create, simulate, and persist architectures across workspaces.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 text-xs font-medium cursor-pointer"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/signin">Sign In</Link>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="h-8 text-xs font-semibold shadow-xs cursor-pointer"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/signup">Sign Up</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Primary Canvas CTA Button */}
                {!hideSandboxLink && (
                  <Button
                    variant="default"
                    asChild
                    className="w-full h-9 text-xs font-semibold gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/workspace">
                      <Box className="size-4" />
                      <span>Open Canvas Workspace</span>
                    </Link>
                  </Button>
                )}

                {/* Structured Navigation Links */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-1">
                    Explore & Learn
                  </span>
                  {visibleNavLinks.map((item) => {
                    const active = isRouteActive(item.href);
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition group",
                          active
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                            : "text-foreground/80 hover:bg-muted/40 hover:text-foreground border border-transparent"
                        )}
                      >
                        {IconComponent && (
                          <div
                            className={cn(
                              "size-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
                              active
                                ? "bg-primary/15 text-primary"
                                : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
                            )}
                          >
                            <IconComponent className="size-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{item.label}</span>
                          {item.desc && (
                            <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                              {item.desc}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. Pinned Drawer Footer ─────────────────────── */}
              <div className="p-4 border-t border-border bg-muted/20 shrink-0 space-y-3">
                {/* Theme Selector Segmented Switch */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Theme</span>
                  <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/80">
                    <button
                      type="button"
                      onClick={() => theme !== "light" && onToggleTheme()}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer",
                        theme === "light"
                          ? "bg-background text-foreground shadow-xs border border-border/60 font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Sun className="size-3 text-amber-500" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => theme !== "dark" && onToggleTheme()}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer",
                        theme === "dark"
                          ? "bg-background text-foreground shadow-xs border border-border/60 font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Moon className="size-3 text-blue-400" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* GitHub link */}
                <a
                  href="https://github.com/ndk123-web/flowframe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/80 bg-card hover:bg-muted/40 text-xs text-muted-foreground hover:text-foreground transition group"
                >
                  <div className="flex items-center gap-2">
                    <FiGithub className="size-4" />
                    <span>GitHub Repository</span>
                  </div>
                  <ExternalLink className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
