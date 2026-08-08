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

interface UserDropdownProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function UserDropdown({ theme, onToggleTheme }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const router = useRouter();

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
        className="group relative flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/80 hover:bg-[var(--surface)] p-1 sm:p-1.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/40 shrink-0"
      >
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-violet-500/40"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-inner">
              {userInitial}
            </div>
          )}
          {/* Active Status Dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)]" />
        </div>

        <span className="hidden md:block text-xs font-semibold text-[color:var(--foreground)]/80 max-w-[110px] truncate">
          {user.name || user.email.split("@")[0]}
        </span>

        <ChevronDownIcon className="w-3.5 h-3.5 text-[color:var(--foreground)]/40 transition-transform duration-200 group-hover:translate-y-0.5" />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-2xl shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Profile Header */}
          <div className="p-3 rounded-xl bg-[var(--surface-muted)]/60 border border-[var(--border)]/50 space-y-1">
            <div className="flex items-center gap-2.5">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-xl object-cover ring-1 ring-violet-500/40" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[color:var(--foreground)] truncate">
                  {user.name || user.email.split("@")[0]}
                </p>
                <p className="text-[10px] text-[color:var(--foreground)]/50 truncate font-mono">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="pt-1.5 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-violet-400 font-semibold">
                <ZapIcon className="w-3 h-3" /> Personal Account
              </span>
              <span className="text-[color:var(--foreground)]/30 font-mono">
                {user.type_of_signin.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="py-1 space-y-0.5 text-xs font-medium">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition"
            >
              <DashboardIcon className="w-4 h-4 text-violet-400" /> Dashboard
            </Link>

            <Link
              href="/workspace"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition"
            >
              <span className="flex items-center gap-2.5">
                <SandboxIcon className="w-4 h-4 text-cyan-400" /> Sandbox Editor
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
                Demo
              </span>
            </Link>

            <Link
              href="/docs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[color:var(--foreground)]/80 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition"
            >
              <DocsIcon className="w-4 h-4 text-amber-400" /> Documentation
            </Link>
          </div>

          <div className="h-px bg-[var(--border)] my-1" />

          {/* Preferences */}
          <div className="px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-[color:var(--foreground)]/60 font-medium">Theme</span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/80 hover:bg-[var(--surface)] transition cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <MoonIcon className="w-3.5 h-3.5 text-indigo-400" /> Dark
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
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
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
