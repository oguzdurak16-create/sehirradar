import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Activity, Building2, MapPin, RadioTower } from "lucide-react";
import { FilterableList } from "@/components/FilterableList";
import { SignalTicker } from "@/components/SignalTicker";
import { PROVINCES, getActiveItems, getItemProvince, getProvinceBySlug, getProvinceItems } from "@/lib/data";

export function generateStaticParams() {
  return PROVINCES.map((province) => ({ slug: province.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) return {};
  return {
    title: `${province.name} Canlı Şehir Radarı`,
    description: `${province.name} için güncel hava ve afet uyarıları, yol durumu, kesintiler, başvurular ve etkinlikler.`,
    alternates: { canonical: `/sehir/${province.slug}` },
  };
}

export default async function ProvincePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();
  const allItems = getProvinceItems(province.name);
  const active = getActiveItems(allItems);
  const localCount = active.filter((item) => getItemProvince(item) === province.name).length;
  const nationalCount = active.length - localCount;

  return (
    <main className="pageShell provincePage">
      <SignalTicker items={active} />
      <section className="provinceHero">
        <div>
          <span className="techEyebrow"><RadioTower size={14}/> {province.region.toLocaleUpperCase("tr-TR")} BÖLGESİ</span>
          <h1>{province.name} canlı şehir radarı</h1>
          <p>{province.name} için yerel sinyaller ve ülke genelini etkileyen resmî uyarılar tek akışta.</p>
        </div>
        <div className="provinceHeroPlate"><small>PLAKA</small><strong>{province.plate}</strong></div>
      </section>
      <section className="provinceStats">
        <div><MapPin/><span><b>{localCount}</b><small>yerel kayıt</small></span></div>
        <div><Activity/><span><b>{nationalCount}</b><small>ulusal sinyal</small></span></div>
        <div><Building2/><span><b>1/81</b><small>şehir ağı</small></span></div>
      </section>
      {localCount === 0 && <div className="cityCoverageNotice"><Activity/><p><strong>Bu şehirde şu anda aktif yerel kayıt yok.</strong> Ekran boş bırakılmadı; Türkiye genelini etkileyen deprem, hava ve yol sinyalleri gösteriliyor. Valilik kaynakları döngüsel olarak taranıyor.</p></div>}
      <FilterableList title={`${province.name} ve Türkiye canlı akışı`} items={active} initialProvince={province.name} eyebrow={`${province.name} canlı veri merkezi`} />
    </main>
  );
}
