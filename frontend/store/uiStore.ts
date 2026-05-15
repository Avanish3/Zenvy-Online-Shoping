"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone?: "default" | "success" | "error";
}

type ToastInput =
  | string
  | {
      title: string;
      message?: string;
      tone?: "default" | "success" | "error";
    };

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
  addToast: (toast: ToastInput) => void;
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
      addToast: (toast) =>
        set((state) => {
          const normalized =
            typeof toast === "string"
              ? { title: toast, tone: "default" as const }
              : { tone: "default" as const, ...toast };

          return {
            toasts: [...state.toasts, { id: `toast_${Date.now()}`, ...normalized }],
          };
        }),
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
