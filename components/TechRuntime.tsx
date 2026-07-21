"use client";

import { useEffect } from "react";

export function TechRuntime() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const base = window.location.pathname.startsWith("/sehirradar") ? "/sehirradar" : "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => undefined);
  }, []);

  return null;
}
