import Link from "next/link";
import { AlertTriangle, RadioTower } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { categoryPath, getItemProvince, getPriority } from "@/lib/data";

export function SignalTicker({ items }: { items: RadarItem[] }) {
  const signals = items.filter((item) => item.status !== "ended").slice(0, 18);
  if (!signals.length) return null;
  const loop = [...signals, ...signals];
  return (
    <section className="signalTicker" aria-label="Canlı bilgi akışı">
      <div className="tickerLabel"><RadioTower size={15}/><span>CANLI</span></div>
      <div className="tickerViewport">
        <div className="tickerTrack">
          {loop.map((item, index) => (
            <Link href={categoryPath(item)} key={`${item.id}-${index}`} className={`tickerItem ticker-${getPriority(item)}`}>
              {getPriority(item) === "critical" && <AlertTriangle size={14}/>}
              <b>{getItemProvince(item)}</b>
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
