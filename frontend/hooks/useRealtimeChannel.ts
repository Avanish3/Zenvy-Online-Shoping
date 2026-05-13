"use client";

import { useEffect, useState } from "react";
import { connectRealtimeChannel } from "@/services/realtimeService";
import type { RealtimeChannel, RealtimeEventMessage } from "@/types";

interface UseRealtimeChannelOptions<T> {
  room?: string;
  enabled?: boolean;
  onMessage: (message: RealtimeEventMessage<T>) => void;
}

export function useRealtimeChannel<T>(
  channel: RealtimeChannel,
  { room, enabled = true, onMessage }: UseRealtimeChannelOptions<T>,
) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">(
    enabled ? "connecting" : "idle",
  );

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    const disconnect = connectRealtimeChannel<T>(channel, {
      room,
      onOpen: () => setStatus("connected"),
      onClose: () => setStatus("disconnected"),
      onError: () => setStatus("disconnected"),
      onMessage,
    });

    return disconnect;
  }, [channel, enabled, onMessage, room]);

  return status;
}

