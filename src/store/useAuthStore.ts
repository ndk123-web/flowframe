"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  type_of_signin: string;
  firebase_uid?: string;
  name?: string;
  avatar?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      setAuth: (token: string, user: AuthUser) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      updateUser: (updates: Partial<AuthUser>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "flowframe-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.token) {
          try {
            const parts = state.token.split(".");
            if (parts.length === 3) {
              const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
              const jsonStr = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              const payload = JSON.parse(jsonStr);
              if (typeof payload.exp === "number" && Date.now() >= payload.exp * 1000) {
                state.logout();
              }
            }
          } catch {
            // Keep token if non-JWT or decoding error
          }
        }
      },
    }
  )
);
