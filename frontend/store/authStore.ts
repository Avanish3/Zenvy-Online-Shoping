"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tier: AuthUser["tier"] | null;
  setSession: (session: AuthSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tier: null,
      setSession: (session) =>
        set({
          user: session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          tier: session.user.tier ?? null,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tier: null,
        }),
    }),
    {
      name: "zenvy-auth",
    },
  ),
);
