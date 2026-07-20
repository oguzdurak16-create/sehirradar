import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, MapPin } from "lucide-react";
import { FilterableList } from "@/components/FilterableList";
import { BURSA_DISTRICTS, getTodayItems } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Bugün Bursa'da Ne Var?",
  description: "Bugün Bursa'daki aktif kesintiler, açık başvurular, ulaşım duyuruları ve etkinlikler.",
  alternates: { canonical: "/bugun" },
};

export default function TodayPage() {
  const items = getTodayItems();

  return (
    <main className="pageShell">
      <section className="todayIntro">
        <div>
          <span className="eyebrow">Günlük şehir özeti</span>
          <h1>Bugün Bursa&apos;da</h1>
          <p><CalendarCheck2 size={17} /> {formatDate(new Date().toISOString(), { weekday: "long" })}</p>
        </div>
        <div className="districtMiniLinks" aria-label="İlçe sayfaları">
          <span><MapPin size={15} /> İlçe seç:</span>
          {BURSA_DISTRICTS.slice(0, 6).map((district) => (
            <Link key={district.slug} href={`/bursa/${district.slug}`}>{district.name}</Link>
          ))}
        </div>
      </section>
      <FilterableList title="Bugün geçerli kayıtlar" items={items} />
    </main>
  );
}
