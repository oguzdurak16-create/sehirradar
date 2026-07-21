"use client";

import { useEffect } from "react";

export function TechRuntime() {
  useEffect(() => {
    const setNetwork = () => document.documentElement.dataset.network = navigator.onLine ? "online" : "offline";
    setNetwork();
    window.addEventListener("online", setNetwork);
    window.addEventListener("offline", setNetwork);

    void (async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("sehir-radar")).map((key) => caches.delete(key)));
      }
    })();

    return () => {
      window.removeEventListener("online", setNetwork);
      window.removeEventListener("offline", setNetwork);
    };
  }, []);
  return null;
}
