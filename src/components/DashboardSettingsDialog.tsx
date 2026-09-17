"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useToastStore } from "@/store/useToastStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Palette,
  Code2,
  Layers,
  Activity,
  Shield,
  Sun,
  Moon,
  LogOut,
  Check,
  Laptop,
  Sparkles,
  Shuffle,
  Loader2,
} from "lucide-react";
import { CARTOON_AVATARS, generateRandomCartoonAvatar } from "@/config/cartoonAvatars";
import { syncFirebaseUserApi } from "@/services/authApi";

interface DashboardSettingsDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id?: string;
    firebase_uid?: string;
    name?: string;
    email?: string;
    avatar?: string;
    type_of_signin?: string;
  };
  onUpdateUser?: (data: { name?: string; avatar?: string }) => void;
  onLogout?: () => void;
  theme?: "light" | "dark";
  setTheme?: (theme: "light" | "dark") => void;
  showToast?: (msg: string, type?: "info" | "success" | "error") => void;
}

type SettingsTab = "profile" | "appearance" | "editor" | "canvas" | "simulation" | "account";

export default function DashboardSettingsDialog({
  open,
  isOpen,
  onOpenChange,
  user: propUser,
  onUpdateUser: propOnUpdateUser,
  onLogout: propOnLogout,
  theme: propTheme,
  setTheme: propSetTheme,
  showToast: propShowToast,
}: DashboardSettingsDialogProps) {
  const router = useRouter();
  const { user: authUser, updateUser, logout } = useAuthStore();
  const { theme: themeValue, setTheme: themeSetTheme } = useThemeStore();
  const showToastStore = useToastStore((s) => s.showToast);

  const user = propUser || authUser || {};
  const theme = propTheme || (themeValue as "light" | "dark") || "dark";
  const setTheme = propSetTheme || themeSetTheme;
  const onUpdateUser = propOnUpdateUser || updateUser;
  const onLogout = propOnLogout || (() => {
    logout();
    router.push("/signin");
  });
  const showToast = propShowToast || showToastStore;
  const dialogOpen = open ?? isOpen ?? false;

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [nameInput, setNameInput] = useState(user.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const [editorWordWrap, setEditorWordWrap] = useState<boolean>(true);
  const [editorTabSize, setEditorTabSize] = useState<number>(2);
  const [canvasGridType, setCanvasGridType] = useState<"dots" | "lines" | "cross" | "none">("dots");
  const [canvasSnapToGrid, setCanvasSnapToGrid] = useState<boolean>(true);
  const [simulationDefaultSpeed, setSimulationDefaultSpeed] = useState<number>(1);
  const [simulationDebugLogs, setSimulationDebugLogs] = useState<boolean>(true);

  // Sync state if user prop changes or saved locally
  React.useEffect(() => {
    const savedLocalAvatar =
      user.email && typeof window !== "undefined"
        ? localStorage.getItem(`flowframe_avatar_${user.email}`)
        : null;
    if (user.avatar || savedLocalAvatar) {
      setSelectedAvatar(user.avatar || savedLocalAvatar || "");
    }
    if (user.name) setNameInput(user.name);
  }, [user.avatar, user.name, user.email]);

  // Derive initial letters for user avatar fallback
  const initials = (nameInput || user.name || user.email || "FF")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleRollRandomAvatar = () => {
    const randomUrl = generateRandomCartoonAvatar();
    setSelectedAvatar(randomUrl);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const updatedName = nameInput.trim() || undefined;
    const updatedAvatar = selectedAvatar.trim() || undefined;

    // 1. Update in local Zustand store immediately
    onUpdateUser({ name: updatedName, avatar: updatedAvatar });

    // 2. Persist to localStorage backup for this user account
    if (user.email && typeof window !== "undefined") {
      if (updatedAvatar) {
        localStorage.setItem(`flowframe_avatar_${user.email}`, updatedAvatar);
      } else {
        localStorage.removeItem(`flowframe_avatar_${user.email}`);
      }
    }

    // 3. Persist to MongoDB database via sync API
    if (user.email) {
      try {
        await syncFirebaseUserApi({
          email: user.email,
          firebase_uid: user.firebase_uid || user.id || "standard_user",
          name: updatedName,
          avatar: updatedAvatar,
          type_of_signin: user.type_of_signin || "email",
        });
        showToast("Profile & cartoon avatar saved to database!", "success");
      } catch (err) {
        console.warn("Could not sync avatar to database:", err);
        showToast("Profile updated locally", "info");
      }
    } else {
      showToast("Profile updated locally", "success");
    }
    setIsSavingProfile(false);
  };

  const navItems = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "editor" as const, label: "Editor", icon: Code2 },
    { id: "canvas" as const, label: "Canvas", icon: Layers },
    { id: "simulation" as const, label: "Simulation", icon: Activity },
    { id: "account" as const, label: "Account", icon: Shield },
  ];

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
        <div className="flex flex-col sm:flex-row min-h-[500px] h-[580px]">
          {/* Settings Sidebar */}
          <aside className="w-full sm:w-52 border-b sm:border-b-0 sm:border-r border-border bg-muted/20 p-3 sm:p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  Settings
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                  FlowFrame preferences
                </DialogDescription>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom mini status */}
            <div className="pt-3 border-t border-border/80 hidden sm:block">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Simulator · Ready</span>
              </div>
            </div>
          </aside>

          {/* Settings Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-5 sm:p-6">
            {/* 1. PROFILE */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Developer Profile</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage your identity across FlowFrame diagrams and workspaces.
                  </p>
                </div>
                <Separator />

                {/* Identity Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg font-mono shrink-0 shadow-xs overflow-hidden">
                    {selectedAvatar ? (
                      <img
                        src={selectedAvatar}
                        alt="User Cartoon Avatar"
                        className="size-full object-cover p-1"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">
                        {nameInput || user.name || "Architect"}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/10 border-primary/25">
                        Developer Tier
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Cartoon Avatar Picker */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary" />
                      <span>Choose Cartoon Avatar</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRollRandomAvatar}
                        className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer select-none"
                        title="Generate random cartoon character"
                      >
                        <Shuffle className="size-3" />
                        <span>Surprise Me</span>
                      </button>
                      {selectedAvatar && (
                        <button
                          type="button"
                          onClick={() => setSelectedAvatar("")}
                          className="text-[10.5px] font-mono text-muted-foreground hover:text-foreground hover:underline cursor-pointer select-none"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Curated Grid of 12 Cartoon Avatars */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {CARTOON_AVATARS.map((av) => {
                      const isSelected = selectedAvatar === av.url;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.url)}
                          className={`group relative p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 aspect-square justify-center ${
                            isSelected
                              ? "border-primary bg-primary/15 ring-2 ring-primary/40 shadow-xs"
                              : "border-border/80 bg-muted/20 hover:bg-muted/50 hover:border-primary/40"
                          }`}
                          title={av.name}
                        >
                          <img
                            src={av.url}
                            alt={av.name}
                            className="size-8 sm:size-9 rounded-lg object-contain transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          <span className="text-[8.5px] font-mono text-muted-foreground truncate max-w-full block">
                            {av.name}
                          </span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold shadow-xs">
                              <Check className="size-2.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* <p className="text-[10px] font-mono text-muted-foreground/70">
                    100% Royalty-Free & Open-Source Cartoon Avatars (Public Domain / MIT License).
                  </p> */}
                </div>

                {/* Name Input Form */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Visible on shared architecture diagrams and simulation sessions.
                  </p>
                </div>

                {/* Email Read-only */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="w-full px-3.5 py-2 rounded-lg border border-border bg-muted/40 text-xs font-mono text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Linked to your {user.type_of_signin || "standard"} account authentication.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    disabled={isSavingProfile}
                    onClick={handleSaveProfile}
                    className="gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Saving to DB…</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Interface Appearance</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize the look and feel of the visual canvas and dashboard.
                  </p>
                </div>
                <Separator />

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground">Theme Mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Dark Theme Option */}
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                        theme === "dark"
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="size-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">Engineering Dark</span>
                        </div>
                        {theme === "dark" && <Check className="size-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Deep contrast palette optimized for topology simulation and long coding sessions.
                      </p>
                    </button>

                    {/* Light Theme Option */}
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                        theme === "light"
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sun className="size-4 text-amber-500" />
                          <span className="text-xs font-bold text-foreground">Clean Light</span>
                        </div>
                        {theme === "light" && <Check className="size-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        High-legibility light mode with crisp borders and clean contrast.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-foreground">Accent Tone</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20">
                    <span className="size-4 rounded-full bg-blue-500 shadow-xs" />
                    <span className="text-xs font-mono font-medium text-foreground">FlowFrame Cobalt (Default)</span>
                    <Badge variant="outline" className="ml-auto text-[10px] font-mono">Restrained</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* 3. EDITOR */}
            {activeTab === "editor" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-semibold text-foreground">DSL Code Editor</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure the CodeMirror 6 engine for FlowFrame architecture scripts.
                  </p>
                </div>
                <Separator />

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Editor Font Size</p>
                    <p className="text-[11px] text-muted-foreground">Adjust text scale in the DSL editor</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border">
                    {[12, 13, 14, 16].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setEditorFontSize(sz)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                          editorFontSize === sz
                            ? "bg-card text-primary font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Size */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Tab Indentation</p>
                    <p className="text-[11px] text-muted-foreground">Number of spaces per indentation level</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border">
                    {[2, 4].map((ts) => (
                      <button
                        key={ts}
                        type="button"
                        onClick={() => setEditorTabSize(ts)}
                        className={`px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                          editorTabSize === ts
                            ? "bg-card text-primary font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {ts} spaces
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Wrap */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Word Wrap</p>
                    <p className="text-[11px] text-muted-foreground">Wrap long DSL lines to viewport width</p>
                  </div>
                  <Button
                    variant={editorWordWrap ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorWordWrap((p) => !p)}
                    className="h-8 text-xs font-mono"
                  >
                    {editorWordWrap ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            )}

            {/* 4. CANVAS */}
            {activeTab === "canvas" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Canvas & Viewport</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Default grid and alignment behavior for system diagrams.
                  </p>
                </div>
                <Separator />

                {/* Grid Pattern */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Default Grid Pattern</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["dots", "lines", "cross", "none"] as const).map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => setCanvasGridType(pat)}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition cursor-pointer text-center ${
                          canvasGridType === pat
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snap to Grid */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Snap to Grid</p>
                    <p className="text-[11px] text-muted-foreground">Align dragged architecture nodes automatically</p>
                  </div>
                  <Button
                    variant={canvasSnapToGrid ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCanvasSnapToGrid((p) => !p)}
                    className="h-8 text-xs font-mono"
                  >
                    {canvasSnapToGrid ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            )}

            {/* 5. SIMULATION */}
            {activeTab === "simulation" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Simulation Engine</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure execution speeds and trace diagnostics.
                  </p>
                </div>
                <Separator />

                {/* Default Speed */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Default Playback Speed</p>
                    <p className="text-[11px] text-muted-foreground">Simulation step timing multiplier</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border">
                    {[0.5, 1, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setSimulationDefaultSpeed(spd)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                          simulationDefaultSpeed === spd
                            ? "bg-card text-primary font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Debug Logs */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Simulation Debug Logs</p>
                    <p className="text-[11px] text-muted-foreground">Show packet frame inspector and routing events</p>
                  </div>
                  <Button
                    variant={simulationDebugLogs ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSimulationDebugLogs((p) => !p)}
                    className="h-8 text-xs font-mono"
                  >
                    {simulationDebugLogs ? "Visible" : "Hidden"}
                  </Button>
                </div>
              </div>
            )}

            {/* 6. ACCOUNT */}
            {activeTab === "account" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Account & Session</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Session authentication and credentials.
                  </p>
                </div>
                <Separator />

                <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account Status</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-[10px] font-mono">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Auth Provider</span>
                    <span className="font-mono text-foreground capitalize">{user.type_of_signin || "Email Token"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Environment</span>
                    <span className="font-mono text-foreground">FlowFrame Cloud</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Sign Out</p>
                    <p className="text-[11px] text-muted-foreground">Terminate your current local session</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onLogout();
                    }}
                    className="gap-1.5 shadow-xs"
                  >
                    <LogOut className="size-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
