"use client";

import { useEffect, useState } from "react";

interface DealCountdownProps {
  seed: string;
  baseHours?: number;
  prefix?: string;
  className?: string;
}

function getHoursFromSeed(seed: string, baseHours: number) {
  const offset = seed.split("").reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
  return baseHours + offset;
}

function formatTime(timeLeft: number) {
  if (timeLeft <= 0) {
    return "Deal refresh soon";
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function DealCountdown({
  seed,
  baseHours = 4,
  prefix = "Deal ends in",
  className,
}: DealCountdownProps) {
  const [expiresAt] = useState(() => Date.now() + getHoursFromSeed(seed, baseHours) * 60 * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState(() => expiresAt - Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(expiresAt - Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className={className}>
      {timeLeft > 0 ? `${prefix} ${formatTime(timeLeft)}` : formatTime(timeLeft)}
    </span>
  );
}
