"use client";

import { useEffect } from "react";

export function TechRuntime() {
  useEffect(() => {
    const setNetwork = () => document.documentElement.dataset.network = navigator.onLine ? "online" : "offline";
    setNetwork();
    window.addEventListener("online", setNetwork);
    window.addEventListener("offline", setNetwork);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => undefined);
    return () => {
      window.removeEventListener("online", setNetwork);
      window.removeEventListener("offline", setNetwork);
    };
  }, []);
  return null;
}
