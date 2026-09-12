"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import {
  DashboardIcon,
  SandboxIcon,
  DocsIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  ChevronDownIcon,
  ZapIcon,
} from "./DashboardIcons";

import { useThemeStore } from "@/store/useThemeStore";

interface UserDropdownProps {
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export default function UserDropdown({ theme: propTheme, onToggleTheme: propOnToggle }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const { theme: storeTheme, toggleTheme: storeToggleTheme } = useThemeStore();
  const router = useRouter();

  const theme = propTheme || storeTheme;
  const onToggleTheme = propOnToggle || storeToggleTheme;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const userInitial = user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/signin");
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--bg-elevated)] p-1 sm:p-1.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shrink-0"
      >
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-7 h-7 rounded-md object-cover ring-1 ring-[var(--border)]"
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-[var(--accent)] text-white font-bold flex items-center justify-center text-xs">
              {userInitial}
            </div>
          )}
        </div>

        <ChevronDownIcon className="w-3.5 h-3.5 text-[color:var(--muted)] transition-transform duration-150 group-hover:translate-y-0.5" />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
          {/* Profile Header */}
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
            <div className="flex items-center gap-2.5">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-lg object-cover ring-1 ring-[var(--border)]" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[var(--accent)] text-white font-bold flex items-center justify-center text-sm">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[color:var(--foreground)] truncate">
                  {user.name || user.email.split("@")[0]}
                </p>
                <p className="text-[10px] text-[color:var(--muted)] truncate font-mono">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="pt-1.5 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 text-[color:var(--accent)] font-semibold">
                <ZapIcon className="w-3 h-3" /> Personal Account
              </span>
              <span className="text-[color:var(--muted)] font-mono">
                {user.type_of_signin.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="py-1 space-y-0.5 text-xs font-medium">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
            >
              <DashboardIcon className="w-4 h-4 text-[color:var(--accent)]" /> Dashboard
            </Link>

            <Link
              href="/scenarios"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
            >
              <span className="flex items-center gap-2.5">
                <ZapIcon className="w-4 h-4 text-[color:var(--accent)]" /> Scenarios Library
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-1.5 py-0.5 rounded">
                Sim
              </span>
            </Link>

            <Link
              href="/learn"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
            >
              <DocsIcon className="w-4 h-4 text-[color:var(--accent)]" /> Learn Guides
            </Link>

            <Link
              href="/workspace"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
            >
              <span className="flex items-center gap-2.5">
                <SandboxIcon className="w-4 h-4 text-[color:var(--accent)]" /> Sandbox Editor
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-1.5 py-0.5 rounded">
                Demo
              </span>
            </Link>

            <Link
              href="/docs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition"
            >
              <DocsIcon className="w-4 h-4 text-[color:var(--muted)]" /> Documentation
            </Link>
          </div>

          <div className="h-px bg-[var(--border)] my-1" />

          {/* Preferences */}
          <div className="px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-[color:var(--muted)] font-medium">Theme</span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <MoonIcon className="w-3.5 h-3.5 text-[color:var(--accent)]" /> Dark
                </>
              ) : (
                <>
                  <SunIcon className="w-3.5 h-3.5 text-amber-500" /> Light
                </>
              )}
            </button>
          </div>

          <div className="h-px bg-[var(--border)] my-1" />

          {/* Logout Button inside Dropdown */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <LogoutIcon className="w-4 h-4" /> Sign Out
            </span>
            <span className="text-[10px] font-mono opacity-60">Logout →</span>
          </button>
        </div>
      )}
    </div>
  );
}
