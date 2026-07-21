"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RadioTower } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { categoryPath, getItemProvince, getPriority } from "@/lib/data";
import { dedupeRadarItems, fetchLiveRadarData } from "@/lib/live-data-client";

export function SignalTicker({ items }: { items: RadarItem[] }) {
  const fallback = useMemo(() => dedupeRadarItems(items), [items]);
  const [liveItems, setLiveItems] = useState(fallback);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const live = await fetchLiveRadarData();
      if (mounted && live) setLiveItems(dedupeRadarItems(live.items));
    };
    void refresh();
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const signals = liveItems.filter((item) => item.status !== "ended").slice(0, 18);
  if (!signals.length) return null;

  return (
    <section className="signalTicker" aria-label="Canlı bilgi akışı">
      <div className="tickerLabel"><RadioTower size={15}/><span>CANLI</span></div>
      <div className="tickerViewport">
        <div className="tickerTrack tickerTrackUnique">
          {signals.map((item) => (
            <Link href={categoryPath(item)} key={item.id} className={`tickerItem ticker-${getPriority(item)}`}>
              {getPriority(item) === "critical" && <AlertTriangle size={14}/>}<b>{getItemProvince(item)}</b><span>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
