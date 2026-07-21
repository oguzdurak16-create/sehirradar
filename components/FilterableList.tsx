"use client";

import { useMemo, useState } from "react";
import { Activity, Search, SlidersHorizontal } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { getPriority } from "@/lib/data";
import { ItemCard } from "@/components/ItemCard";

const channels = [
  { value: "all", label: "Tüm sinyaller" },
  { value: "priority", label: "Kritik / önemli" },
  { value: "alert", label: "Hava ve afet" },
  { value: "transport", label: "Ulaşım ve yol" },
  { value: "outage", label: "Su ve elektrik" },
  { value: "application", label: "Başvurular" },
  { value: "event", label: "Etkinlikler" },
];

export function FilterableList({ items, title }: { items: RadarItem[]; title: string }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [channel, setChannel] = useState("all");
  const [activeOnly, setActiveOnly] = useState(true);
  const districts = useMemo(() => Array.from(new Set(items.map((item) => item.district))).sort((a,b) => a.localeCompare(b, "tr")), [items]);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase("tr-TR").trim();
    return items.filter((item) => {
      const matchesQuery = !normalized || [item.title, item.summary, item.district, item.sourceName, ...item.neighborhoods, ...item.tags]
        .join(" ").toLocaleLowerCase("tr-TR").includes(normalized);
      const matchesDistrict = district === "all" || item.district === district;
      const matchesStatus = !activeOnly || item.status !== "ended";
      const priority = getPriority(item);
      const matchesChannel = channel === "all"
        || (channel === "priority" && ["critical", "high"].includes(priority))
        || item.type === channel;
      return matchesQuery && matchesDistrict && matchesStatus && matchesChannel;
    });
  }, [items, query, district, channel, activeOnly]);

  return (
    <section className="listingSection techListing">
      <div className="listingHeader">
        <div><span className="eyebrow"><Activity size={14}/> Bursa canlı veri merkezi</span><h1>{title}</h1></div>
        <span className="resultCount">{filtered.length} sinyal</span>
      </div>
      <div className="channelTabs" role="tablist" aria-label="Veri kanalları">
        {channels.map((entry) => <button type="button" className={channel === entry.value ? "isActive" : ""} onClick={() => setChannel(entry.value)} key={entry.value}>{entry.label}</button>)}
      </div>
      <div className="filters">
        <label className="searchBox"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mahalle, ilçe, kaynak veya konu ara"/></label>
        <label className="selectBox"><SlidersHorizontal size={17}/><select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="all">Tüm ilçeler</option>{districts.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="toggle"><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)}/><span/> Yalnızca güncel</label>
      </div>
      {filtered.length ? <div className="cardGrid techCardGrid">{filtered.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <div className="emptyState"><strong>Sinyal bulunamadı.</strong><p>Arama, kanal veya ilçe filtresini değiştirin.</p></div>}
    </section>
  );
}
