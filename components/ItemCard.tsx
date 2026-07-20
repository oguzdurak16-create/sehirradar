import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin, ShieldCheck } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { categoryPath } from "@/lib/data";
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
};

export function ItemCard({ item }: { item: RadarItem }) {
  return (
    <article className="itemCard">
      <div className="cardTopline">
        <span className={`category category-${item.type}`}>{labels[item.subtype] ?? item.subtype}</span>
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
        <Link href={categoryPath(item)}>Detay <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  );
}
