import { API } from "@/services/api";
import type { RealtimeChannel, RealtimeEventMessage } from "@/types";

interface ConnectRealtimeOptions<T> {
  room?: string;
  onMessage: (message: RealtimeEventMessage<T>) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const persisted = window.localStorage.getItem("zenvy-auth");
  if (!persisted) {
    return null;
  }

  try {
    const parsed = JSON.parse(persisted);
    return (parsed?.state?.accessToken as string | undefined) ?? null;
  } catch {
    return null;
  }
}

function getRealtimeUrl(channel: RealtimeChannel, room?: string) {
  const base = new URL(API.defaults.baseURL ?? "http://localhost:8080");
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = channel;

  if (room) {
    base.searchParams.set("room", room);
  }

  const token = getAccessToken();
  if (token) {
    base.searchParams.set("token", token);
  }

  return base.toString();
}

export function connectRealtimeChannel<T>(
  channel: RealtimeChannel,
  { room, onMessage, onOpen, onClose, onError }: ConnectRealtimeOptions<T>,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const socket = new window.WebSocket(getRealtimeUrl(channel, room));
  socket.addEventListener("open", () => {
    onOpen?.();
  });
  socket.addEventListener("close", () => {
    onClose?.();
  });
  socket.addEventListener("error", () => {
    onError?.();
  });
  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(String(event.data)) as RealtimeEventMessage<T>;
      onMessage(message);
    } catch {
      onMessage({
        type: "error",
        payload: null as T,
      });
    }
  });

  return () => {
    if (socket.readyState === window.WebSocket.OPEN || socket.readyState === window.WebSocket.CONNECTING) {
      socket.close();
    }
  };
}

