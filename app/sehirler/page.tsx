import type { Metadata } from "next";
import { Building2, RadioTower } from "lucide-react";
import { ProvinceDirectory } from "@/components/ProvinceDirectory";
import { getProvinceCounts } from "@/lib/data";

export const metadata: Metadata = {
  title: "81 Şehir Canlı Radar",
  description: "Türkiye'nin 81 ili için canlı uyarı, kesinti, yol, başvuru ve etkinlik sayfaları.",
};

export default function CitiesPage() {
  return (
    <main className="pageShell citiesPage">
      <section className="citiesHero">
        <span className="techEyebrow"><RadioTower size={14}/> TÜRKİYE ŞEHİR AĞI</span>
        <h1>81 şehir, tek canlı radar.</h1>
        <p>Şehrini seç. Yerel kayıtlarla birlikte Türkiye genelini etkileyen uyarıları aynı ekranda gör.</p>
        <div className="citiesHeroStat"><Building2/><strong>81</strong><span>il sayfası</span></div>
      </section>
      <ProvinceDirectory counts={getProvinceCounts()} />
    </main>
  );
}
