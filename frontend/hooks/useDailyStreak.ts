"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "zenvy:daily_streak";

export function useDailyStreak() {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const today = new Date().toDateString();
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: today, streak: 1 }));
      setStreak(1);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { day: string; streak: number };
      if (parsed.day === today) {
        setStreak(parsed.streak);
        return;
      }

      const next = {
        day: today,
        streak: parsed.streak + 1,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStreak(next.streak);
    } catch {
      setStreak(1);
    }
  }, []);

  return streak;
}
