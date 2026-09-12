"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Zap,
  BookOpen,
  PenTool,
  FileText,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface UserDropdownProps {
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export default function UserDropdown({ theme: propTheme, onToggleTheme: propOnToggle }: UserDropdownProps) {
  const { user, logout } = useAuthStore();
  const { theme: storeTheme, toggleTheme: storeToggleTheme } = useThemeStore();
  const router = useRouter();

  const theme = propTheme || storeTheme;
  const onToggleTheme = propOnToggle || storeToggleTheme;

  if (!user) return null;

  const userInitial = user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    router.push("/signin");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 pl-1 pr-2 rounded-full border-border bg-card/60 hover:bg-accent/50 transition cursor-pointer"
        >
          <Avatar className="size-6 border border-border">
            {user.avatar && <AvatarImage src={user.avatar} alt="Avatar" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold max-w-[90px] truncate hidden sm:inline text-foreground">
            {user.name || user.email.split("@")[0]}
          </span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl border-border bg-popover">
        {/* Profile Header */}
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border border-border shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt="Avatar" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-foreground truncate">
                  {user.name || user.email.split("@")[0]}
                </p>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  Dev
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Navigation Links */}
        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2.5 w-full cursor-pointer">
              <LayoutDashboard className="size-4 text-muted-foreground shrink-0" />
              <span className="flex-1">Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/workspace" className="flex items-center gap-2.5 w-full cursor-pointer">
              <PenTool className="size-4 text-muted-foreground shrink-0" />
              <span className="flex-1">Architecture Canvas</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/scenarios" className="flex items-center gap-2.5 w-full cursor-pointer">
              <Zap className="size-4 text-muted-foreground shrink-0" />
              <span className="flex-1">Scenarios</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/learn" className="flex items-center gap-2.5 w-full cursor-pointer">
              <BookOpen className="size-4 text-muted-foreground shrink-0" />
              <span className="flex-1">Learn Academy</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/docs" className="flex items-center gap-2.5 w-full cursor-pointer">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <span className="flex-1">Documentation</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Theme Toggle */}
        <DropdownMenuItem onClick={onToggleTheme} className="flex items-center gap-2.5 cursor-pointer">
          {theme === "dark" ? (
            <Sun className="size-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="size-4 text-muted-foreground shrink-0" />
          )}
          <span className="flex-1">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="flex-1">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
