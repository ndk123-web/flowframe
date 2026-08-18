"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme: Theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme = get().theme === "dark" ? "light" : "dark";
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", nextTheme);
        }
        set({ theme: nextTheme });
      },
    }),
    {
      name: "flowframe-theme",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    }
  )
);
