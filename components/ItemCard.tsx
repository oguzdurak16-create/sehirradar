import Link from "next/link";
import { ArrowUpRight, CalendarClock, CloudSun, MapPin, Radio, Route, ShieldCheck, ShipWheel, Waves, Zap } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { categoryPath, getPriority, isFresh } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

const labels: Record<string, string> = {
  water: "Su",
  electricity: "Elektrik",
  transport: "Ulaşım",
  "social-support": "Sosyal destek",
  festival: "Festival",
  exhibition: "Sergi",
  workshop: "Atölye",
  "ferry-cancelled": "BUDO iptal",
  "ferry-service": "BUDO sefer",
  "weather-forecast": "Saatlik hava",
  "weather-warning": "Hava uyarısı",
  "road-closed": "Yol kapalı",
  "road-work": "Yol çalışması",
  earthquake: "Deprem",
  "afad-announcement": "AFAD",
};

const priorityLabels = {
  critical: "Kritik",
  high: "Önemli",
  medium: "Bilgi",
  low: "Rutin",
};

function TypeIcon({ subtype }: { subtype: string }) {
  if (subtype.includes("weather")) return <CloudSun size={18} />;
  if (subtype.includes("ferry")) return <ShipWheel size={18} />;
  if (subtype.includes("road")) return <Route size={18} />;
  if (subtype === "water") return <Waves size={18} />;
  if (subtype === "electricity") return <Zap size={18} />;
  return <Radio size={18} />;
}

export function ItemCard({ item }: { item: RadarItem }) {
  const priority = getPriority(item);
  const fresh = isFresh(item);

  return (
    <article className={`itemCard techCard priority-${priority}`}>
      <div className="cardSignal"><TypeIcon subtype={item.subtype} /></div>
      <div className="cardTopline">
        <span className={`category category-${item.type}`}>{labels[item.subtype] ?? item.subtype}</span>
        <span className={`priorityBadge priorityBadge-${priority}`}>{priorityLabels[priority]}</span>
        {fresh && <span className="freshBadge"><i /> Yeni</span>}
        <StatusBadge status={item.status} />
      </div>
      <h3><Link href={categoryPath(item)}>{item.title}</Link></h3>
      <p>{item.summary}</p>
      <div className="cardMeta">
        <span><MapPin size={15} /> {item.district}</span>
        <span><CalendarClock size={15} /> {formatDateTime(item.startsAt ?? item.updatedAt)}</span>
      </div>
      <div className="cardFooter">
        <span><ShieldCheck size={15} /> {item.sourceName}</span>
        <Link href={categoryPath(item)}>İncele <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  );
}
