"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SearchFilters } from "@/types";

interface SearchState {
  query: string;
  recentSearches: string[];
  filters: SearchFilters;
  setQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {
  sort: "relevance",
  view: "grid",
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: "",
      recentSearches: [],
      filters: defaultFilters,
      setQuery: (query) => set({ query }),
      addRecentSearch: (query) =>
        set({
          recentSearches: [query, ...get().recentSearches.filter((item) => item !== query)].slice(
            0,
            8,
          ),
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: "zenvy-search",
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        filters: state.filters,
      }),
    },
  ),
);
