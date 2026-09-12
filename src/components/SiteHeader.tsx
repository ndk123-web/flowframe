"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import UserDropdown from "@/components/UserDropdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sun, Moon, Menu, X } from "lucide-react";
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

  const visibleNavLinks = navLinks.filter(
    (item) => !(item.authOnly && (!_hasHydrated || !isAuthenticated))
  );

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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* GitHub */}
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
            <Button variant="default" size="sm" asChild>
              <Link href="/workspace">Canvas</Link>
            </Button>
          )}

          {/* Auth section */}
          {_hasHydrated && isAuthenticated ? (
            <UserDropdown theme={theme} onToggleTheme={onToggleTheme} />
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleTheme}
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="flex flex-col gap-1 pt-4">
                {visibleNavLinks.map((item) => {
                  const active = isRouteActive(item.href);
                  return (
                    <Button
                      key={item.href}
                      variant={active ? "secondary" : "ghost"}
                      className={cn("justify-start", active && "font-semibold text-primary")}
                      asChild
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  );
                })}
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  className="justify-start gap-2"
                  onClick={() => {
                    onToggleTheme();
                  }}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </Button>
                <Button variant="ghost" className="justify-start gap-2" asChild>
                  <a
                    href="https://github.com/ndk123-web/flowframe"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FiGithub className="size-4" /> GitHub
                  </a>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
