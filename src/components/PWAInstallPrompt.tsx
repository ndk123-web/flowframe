"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FiDownload, FiX, FiShare } from "react-icons/fi";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWA_SHOWN_KEY = "flowframe_pwa_first_time_shown";
const DISMISS_KEY = "flowframe_pwa_dismissed_at";

export default function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. STRICT ROUTE CHECK: Only show on the home page ('/'). Never show in workspace, dashboard, docs, etc.
    if (pathname !== "/") {
      setShowPrompt(false);
      return;
    }

    // 2. CHECK IF ALREADY SHOWN OR DISMISSED: Only 1 time ever per user/device
    const alreadyShown = localStorage.getItem(PWA_SHOWN_KEY);
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (alreadyShown || dismissedAt) {
      return; // Never show again
    }

    // 3. Check if already running in standalone PWA window
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 4. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 5. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari =
      /safari/.test(ua) &&
      !/chrome|crios|crmo|android|fxios|edgios/.test(ua);

    if (isIosDevice && isSafari) {
      setIsIOS(true);
      const timer = setTimeout(() => {
        // Mark as shown so it never repeats
        localStorage.setItem(PWA_SHOWN_KEY, "true");
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // 6. Chromium beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const pwaEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(pwaEvent);

      // Show only once after home page settles
      setTimeout(() => {
        localStorage.setItem(PWA_SHOWN_KEY, "true");
        setShowPrompt(true);
      }, 3500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem(PWA_SHOWN_KEY, "true");
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    localStorage.setItem(PWA_SHOWN_KEY, "true");
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      } else {
        handleDismiss();
      }
    } catch (err) {
      console.error("[PWA] Install prompt error:", err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PWA_SHOWN_KEY, "true");
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (pathname !== "/" || !showPrompt || isStandalone) {
    return null;
  }

  return (
    <aside
      aria-label="Install App"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-[380px] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        {/* App Logo */}
        <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)] p-1 flex items-center justify-center shadow-xs">
          <Image
            src="/logo/flow-frame-dark.png"
            alt="FlowFrame Logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[color:var(--foreground)] tracking-tight">
              Install FlowFrame
            </h3>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] p-1 rounded-md transition cursor-pointer"
              title="Dismiss"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-1 text-xs text-[color:var(--muted)] leading-relaxed">
            Install on your device for standalone window performance, offline caching, and fast home-screen access.
          </p>

          {isIOS ? (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)]">
              <FiShare className="w-3.5 h-3.5 text-[color:var(--accent)] shrink-0" />
              <span>Tap <strong>Share</strong> then select <strong>Add to Home Screen</strong>.</span>
            </div>
          ) : (
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="btn-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs cursor-pointer flex-1"
              >
                <FiDownload className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition cursor-pointer"
              >
                Not Now
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
