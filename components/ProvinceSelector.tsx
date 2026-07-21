"use client";

import { useRouter } from "next/navigation";
import { MapPinned } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";

export function ProvinceSelector({ current = "all", compact = false }: { current?: string; compact?: boolean }) {
  const router = useRouter();
  return (
    <label className={`provinceSelector ${compact ? "isCompact" : ""}`}>
      <MapPinned size={18}/>
      <span>{compact ? "Şehir" : "Şehrini seç"}</span>
      <select
        value={current}
        onChange={(event) => {
          const slug = event.target.value;
          router.push(slug === "all" ? "/bugun" : `/sehir/${slug}`);
        }}
        aria-label="Şehir seç"
      >
        <option value="all">Tüm Türkiye</option>
        {PROVINCES.map((province) => <option value={province.slug} key={province.slug}>{province.plate} · {province.name}</option>)}
      </select>
    </label>
  );
}
