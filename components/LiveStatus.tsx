"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Database, Radio, ShieldCheck, Wifi, WifiOff } from "lucide-react";

type DeploymentStatus = {
  publishedAt: string;
  generatedAt?: string;
  itemCount?: number;
};

type SourceHealth = {
  totalSources: number;
  healthySources: number;
  generatedAt: string;
};

function basePath() {
  return window.location.pathname.startsWith("/sehirradar") ? "/sehirradar" : "";
}

function relativeTime(value?: string) {
  if (!value) return "bekleniyor";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  return `${hours} sa önce`;
}

export function LiveStatus() {
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [health, setHealth] = useState<SourceHealth | null>(null);
  const [online, setOnline] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const load = async () => {
      const base = basePath();
      const stamp = Date.now();
      const [deploymentResult, healthResult] = await Promise.allSettled([
        fetch(`${base}/deployment-status.json?t=${stamp}`, { cache: "no-store" }).then((response) => response.json()),
        fetch(`${base}/source-health.json?t=${stamp}`, { cache: "no-store" }).then((response) => response.json()),
      ]);
      if (deploymentResult.status === "fulfilled") setDeployment(deploymentResult.value);
      if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    };

    load();
    const dataTimer = window.setInterval(load, 60000);
    const clockTimer = window.setInterval(() => setTick((value) => value + 1), 30000);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.clearInterval(dataTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const healthRatio = useMemo(() => {
    if (!health?.totalSources) return 0;
    return Math.round((health.healthySources / health.totalSources) * 100);
  }, [health]);

  void tick;

  return (
    <section className="liveSystem" aria-label="Canlı sistem durumu">
      <div className="liveSystemHead">
        <span className={`systemPulse ${online ? "isOnline" : "isOffline"}`}><Radio size={16} /></span>
        <div>
          <small>ŞEHİR RADAR LIVE</small>
          <strong>{online ? "Sistem çevrimiçi" : "Bağlantı çevrimdışı"}</strong>
        </div>
      </div>
      <div className="liveMetrics">
        <div><Activity size={18} /><span><small>Son yayın</small><strong>{relativeTime(deployment?.publishedAt)}</strong></span></div>
        <div><Database size={18} /><span><small>Canlı kayıt</small><strong>{deployment?.itemCount ?? "—"}</strong></span></div>
        <div><ShieldCheck size={18} /><span><small>Kaynak sağlığı</small><strong>{health ? `${health.healthySources}/${health.totalSources}` : "—"}</strong></span></div>
        <div>{online ? <Wifi size={18} /> : <WifiOff size={18} />}<span><small>Bağlantı</small><strong>{online ? "Aktif" : "Kesildi"}</strong></span></div>
      </div>
      <div className="healthTrack" aria-label={`Kaynak sağlığı yüzde ${healthRatio}`}><span style={{ width: `${healthRatio}%` }} /></div>
    </section>
  );
}
