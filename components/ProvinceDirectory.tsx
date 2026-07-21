"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";

export function ProvinceDirectory({ counts }: { counts: Record<string, number> }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase("tr-TR").trim();
    return PROVINCES.filter((province) => {
      const queryMatch = !normalized || `${province.name} ${province.plate}`.toLocaleLowerCase("tr-TR").includes(normalized);
      const regionMatch = region === "all" || province.region === region;
      return queryMatch && regionMatch;
    });
  }, [query, region]);
  const regions = [...new Set(PROVINCES.map((province) => province.region))];

  return (
    <section className="provinceDirectory">
      <div className="provinceDirectoryControls">
        <label><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şehir veya plaka ara"/></label>
        <select value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Bölge seç">
          <option value="all">Tüm bölgeler</option>
          {regions.map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
      <div className="provinceDirectoryGrid">
        {filtered.map((province) => (
          <Link href={`/sehir/${province.slug}`} key={province.slug}>
            <span className="plateBadge">{province.plate}</span>
            <span><strong>{province.name}</strong><small>{province.region} · {counts[province.name] ?? 0} yerel kayıt</small></span>
            <MapPin size={16}/><ArrowRight size={15}/>
          </Link>
        ))}
      </div>
    </section>
  );
}
