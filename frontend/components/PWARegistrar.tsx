"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/uiStore";

export function PWARegistrar() {
  const addToast = useUiStore((state) => state.addToast);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration is best-effort for local preview.
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const alreadyAsked = window.localStorage.getItem("zenvy-push-asked");
    if (alreadyAsked) {
      return;
    }

    window.localStorage.setItem("zenvy-push-asked", "yes");
    window.setTimeout(() => {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            addToast("Push notifications enabled for live deals and stock updates.");
          }
        });
      }
    }, 2400);
  }, [addToast]);

  return null;
}
