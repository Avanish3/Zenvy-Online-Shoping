"use client";

import type { ChangeEvent, RefObject } from "react";
import { useRef, useState } from "react";
import { visualSearch } from "@/services/aiService";
import type { Product } from "@/types";

interface UseVisualSearchOptions {
  onResults?: (results: Product[], inferredLabel: string) => void;
}

export function useVisualSearch(options: UseVisualSearchOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const inferredLabel = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
      const response = await visualSearch(inferredLabel);
      options.onResults?.(response.results, inferredLabel);
    } catch {
      setError("We could not process that image yet.");
    } finally {
      event.target.value = "";
      setIsLoading(false);
    }
  }

  return {
    error,
    inputRef: inputRef as RefObject<HTMLInputElement>,
    isLoading,
    handleFileChange,
    openPicker,
  };
}
