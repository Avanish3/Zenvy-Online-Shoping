"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ToastItem {
  id: string;
  title: string;
}

interface UiState {
  mobileMenuOpen: boolean;
  chatbotOpen: boolean;
  searchPanelOpen: boolean;
  theme: "light" | "dark";
  toasts: ToastItem[];
  setMobileMenuOpen: (open: boolean) => void;
  setChatbotOpen: (open: boolean) => void;
  setSearchPanelOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  addToast: (title: string) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mobileMenuOpen: false,
      chatbotOpen: false,
      searchPanelOpen: false,
      theme: "light",
      toasts: [],
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      setChatbotOpen: (open) => set({ chatbotOpen: open }),
      setSearchPanelOpen: (open) => set({ searchPanelOpen: open }),
      setTheme: (theme) => set({ theme }),
      addToast: (title) =>
        set((state) => ({
          toasts: [...state.toasts, { id: `toast_${Date.now()}`, title }],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
    }),
    {
      name: "zenvy-ui",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
