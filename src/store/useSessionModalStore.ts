"use client";

import { create } from "zustand";

interface SessionModalState {
  isOpen: boolean;
  message: string;
  openModal: (message?: string) => void;
  closeModal: () => void;
}

export const useSessionModalStore = create<SessionModalState>((set) => ({
  isOpen: false,
  message: "Your session has expired or your access token is invalid. Please sign in again.",
  openModal: (message) =>
    set({
      isOpen: true,
      message:
        message ||
        "Your session has expired or your access token is invalid. Please sign in again.",
    }),
  closeModal: () => set({ isOpen: false }),
}));
