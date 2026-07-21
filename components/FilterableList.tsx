"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { getItemProvince, getPriority } from "@/lib/data";
import { PROVINCES } from "@/lib/provinces";
import { dedupeRadarItems, fetchLiveRadarData } from "@/lib/live-data-client";
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

export function FilterableList({
  items,
  title,
  initialProvince = "all",
  eyebrow = "Türkiye canlı veri ağı",
}: {
  items: RadarItem[];
  title: string;
  initialProvince?: string;
  eyebrow?: string;
}) {
  const fallbackItems = useMemo(() => dedupeRadarItems(items), [items]);
  const scopeKey = useMemo(() => [...new Set(items.map((item) => item.type))].sort().join("|"), [items]);
  const [sourceItems, setSourceItems] = useState(fallbackItems);
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState(initialProvince);
  const [district, setDistrict] = useState("all");
  const [channel, setChannel] = useState("all");
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    let mounted = true;
    setSourceItems(fallbackItems);

    const refresh = async () => {
      const live = await fetchLiveRadarData();
      if (!mounted || !live) return;
      const allowedTypes = new Set(scopeKey.split("|").filter(Boolean));
      const scoped = allowedTypes.size ? live.items.filter((item) => allowedTypes.has(item.type)) : live.items;
      setSourceItems(dedupeRadarItems(scoped));
    };

    void refresh();
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [fallbackItems, scopeKey]);

  const districts = useMemo(() => Array.from(new Set(sourceItems
    .filter((item) => province === "all" || getItemProvince(item) === province)
    .map((item) => item.district)
    .filter((name) => name && name !== province && name !== "Türkiye")))
    .sort((a, b) => a.localeCompare(b, "tr")), [sourceItems, province]);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase("tr-TR").trim();
    return sourceItems.filter((item) => {
      const itemProvince = getItemProvince(item);
      const matchesQuery = !normalized || [item.title, item.summary, itemProvince, item.district, item.sourceName, ...item.neighborhoods, ...item.tags]
        .join(" ").toLocaleLowerCase("tr-TR").includes(normalized);
      const matchesProvince = province === "all" || itemProvince === province || itemProvince === "Türkiye";
      const matchesDistrict = district === "all" || item.district === district;
      const matchesStatus = !activeOnly || item.status !== "ended";
      const priority = getPriority(item);
      const matchesChannel = channel === "all"
        || (channel === "priority" && ["critical", "high"].includes(priority))
        || item.type === channel;
      return matchesQuery && matchesProvince && matchesDistrict && matchesStatus && matchesChannel;
    });
  }, [sourceItems, query, province, district, channel, activeOnly]);

  return (
    <section className="listingSection techListing">
      <div className="listingHeader">
        <div><span className="eyebrow"><Activity size={14}/> {eyebrow}</span><h1>{title}</h1></div>
        <span className="resultCount">{filtered.length} sinyal</span>
      </div>
      <div className="channelTabs" role="tablist" aria-label="Veri kanalları">
        {channels.map((entry) => <button type="button" className={channel === entry.value ? "isActive" : ""} onClick={() => setChannel(entry.value)} key={entry.value}>{entry.label}</button>)}
      </div>
      <div className="filters nationalFilters">
        <label className="searchBox"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şehir, ilçe, kaynak veya konu ara"/></label>
        <label className="selectBox"><MapPin size={17}/><select value={province} onChange={(event) => { setProvince(event.target.value); setDistrict("all"); }}><option value="all">81 ilin tamamı</option>{PROVINCES.map((entry) => <option key={entry.name} value={entry.name}>{entry.plate} · {entry.name}</option>)}</select></label>
        <label className="selectBox"><SlidersHorizontal size={17}/><select value={district} onChange={(event) => setDistrict(event.target.value)} disabled={!districts.length}><option value="all">Tüm ilçeler</option>{districts.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="toggle"><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)}/><span/> Yalnızca güncel</label>
      </div>
      {province !== "all" && <p className="scopeNote"><MapPin size={15}/> {province} kayıtlarıyla birlikte ülke genelini etkileyen sinyaller de gösteriliyor.</p>}
      {filtered.length ? <div className="cardGrid techCardGrid">{filtered.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <div className="emptyState"><strong>Bu filtrede aktif sinyal bulunamadı.</strong><p>Türkiye geneline dönün veya kanal filtresini değiştirin.</p><button type="button" onClick={() => { setProvince("all"); setDistrict("all"); setChannel("all"); setQuery(""); }}>Türkiye akışını göster</button></div>}
    </section>
  );
}
