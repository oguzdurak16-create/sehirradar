"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { ItemCard } from "@/components/ItemCard";

export function FilterableList({ items, title }: { items: RadarItem[]; title: string }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [activeOnly, setActiveOnly] = useState(true);
  const districts = useMemo(() => Array.from(new Set(items.map((item) => item.district))).sort((a,b) => a.localeCompare(b, "tr")), [items]);
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase("tr-TR").trim();
    return items.filter((item) => {
      const matchesQuery = !normalized || [item.title, item.summary, item.district, ...item.neighborhoods, ...item.tags]
        .join(" ").toLocaleLowerCase("tr-TR").includes(normalized);
      const matchesDistrict = district === "all" || item.district === district;
      const matchesStatus = !activeOnly || !["ended"].includes(item.status);
      return matchesQuery && matchesDistrict && matchesStatus;
    });
  }, [items, query, district, activeOnly]);

  return (
    <section className="listingSection">
      <div className="listingHeader">
        <div><span className="eyebrow">Bursa canlı veri</span><h1>{title}</h1></div>
        <span className="resultCount">{filtered.length} kayıt</span>
      </div>
      <div className="filters">
        <label className="searchBox"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mahalle, ilçe veya konu ara" /></label>
        <label className="selectBox"><SlidersHorizontal size={17} /><select value={district} onChange={(e) => setDistrict(e.target.value)}><option value="all">Tüm ilçeler</option>{districts.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="toggle"><input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /><span /> Yalnızca güncel</label>
      </div>
      {filtered.length ? <div className="cardGrid">{filtered.map((item) => <ItemCard item={item} key={item.id} />)}</div> : <div className="emptyState"><strong>Kayıt bulunamadı.</strong><p>Arama veya ilçe filtresini değiştirin.</p></div>}
    </section>
  );
}
