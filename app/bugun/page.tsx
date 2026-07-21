import type { Metadata } from "next";
import { Activity, Building2, CalendarCheck2, Database, Siren } from "lucide-react";
import { FilterableList } from "@/components/FilterableList";
import { ItemCard } from "@/components/ItemCard";
import { ProvinceSelector } from "@/components/ProvinceSelector";
import { SignalTicker } from "@/components/SignalTicker";
import { data, getActiveItems, getItemProvince, getPriority, getTodayItems } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Bugün Türkiye'de Ne Var?",
  description: "Türkiye'nin 81 ilindeki aktif uyarılar, kesintiler, yol durumları, başvurular ve etkinlikler.",
  alternates: { canonical: "/bugun" },
};

export default function TodayPage() {
  const today = getTodayItems();
  const active = getActiveItems();
  const items = today.length >= 8 ? today : active;
  const spotlight = items.slice(0, 6);
  const represented = new Set(items.map(getItemProvince).filter((name) => name !== "Türkiye")).size;
  const critical = items.filter((item) => ["critical", "high"].includes(getPriority(item))).length;

  return (
    <main className="pageShell nationalToday">
      <SignalTicker items={active} />
      <section className="todayIntro nationalTodayIntro">
        <div>
          <span className="eyebrow">Günlük Türkiye özeti</span>
          <h1>Bugün Türkiye&apos;de</h1>
          <p><CalendarCheck2 size={17} /> {formatDate(new Date().toISOString(), { weekday: "long" })}</p>
        </div>
        <ProvinceSelector compact />
      </section>

      <section className="todaySummaryStrip">
        <div><Activity/><span><b>{items.length}</b><small>aktif sinyal</small></span></div>
        <div><Building2/><span><b>{represented}</b><small>şehirde kayıt</small></span></div>
        <div><Siren/><span><b>{critical}</b><small>önemli uyarı</small></span></div>
        <div><Database/><span><b>{data.items.length}</b><small>toplam kayıt</small></span></div>
      </section>

      <section className="todaySpotlight">
        <div className="techSectionHead"><div><span className="techEyebrow">ÖNE ÇIKAN SİNYALLER</span><h2>Akış şu anda böyle</h2></div></div>
        <div className="cardGrid techCardGrid">{spotlight.map((item) => <ItemCard item={item} key={item.id}/>)}</div>
      </section>

      <FilterableList title="Tüm canlı Türkiye kayıtları" items={active} />
    </main>
  );
}
