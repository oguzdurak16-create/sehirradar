"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock3, Database, Wifi, WifiOff } from "lucide-react";

type Status = { publishedAt?: string; generatedAt?: string; itemCount?: number };
type Health = { healthySources?: number; totalSources?: number };

export function LiveStatus() {
  const [status, setStatus] = useState<Status>({});
  const [health, setHealth] = useState<Health>({});
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    Promise.allSettled([
      fetch(`${base}/deployment-status.json?ts=${Date.now()}`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`${base}/source-health.json?ts=${Date.now()}`, { cache: "no-store" }).then((response) => response.json()),
    ]).then(([deployment, sources]) => {
      if (deployment.status === "fulfilled") setStatus(deployment.value);
      if (sources.status === "fulfilled") setHealth(sources.value);
    });
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const formatted = status.publishedAt
    ? new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(status.publishedAt))
    : "yükleniyor";

  return (
    <div className="liveStatusBar">
      <span className={online ? "statusOnline" : "statusOffline"}>{online ? <Wifi size={16}/> : <WifiOff size={16}/>} {online ? "Bağlantı aktif" : "Çevrimdışı"}</span>
      <span><Clock3 size={16}/> Son yayın: <strong>{formatted}</strong></span>
      <span><Database size={16}/> <strong>{status.itemCount ?? "—"}</strong> canlı kayıt</span>
      <span><CheckCircle2 size={16}/> <strong>{health.healthySources ?? "—"}/{health.totalSources ?? "—"}</strong> kaynak</span>
      <span className="pulseText"><Activity size={16}/> Saatlik tarama</span>
    </div>
  );
}
