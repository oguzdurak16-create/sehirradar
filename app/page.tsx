import Link from "next/link";
import { Activity, ArrowRight, BellRing, CalendarDays, CloudSun, Database, FileCheck2, MapPin, RadioTower, Route, Search, ShieldCheck, ShipWheel, Siren, Waves, Zap } from "lucide-react";
import sourceHealth from "@/data/source-health.json";
import { BURSA_DISTRICTS, data, getActiveItems, getItems, getPriority } from "@/lib/data";
import { ItemCard } from "@/components/ItemCard";
import { LiveStatus } from "@/components/LiveStatus";

export default function Home() {
  const active = getActiveItems();
  const alerts = getItems("alert").filter((item) => item.status !== "ended");
  const outages = getItems("outage").filter((item) => item.status !== "ended");
  const transport = getItems("transport").filter((item) => item.status !== "ended");
  const applications = getItems("application").filter((item) => item.status !== "ended");
  const events = getItems("event").filter((item) => item.status !== "ended");
  const critical = active.filter((item) => ["critical", "high"].includes(getPriority(item))).length;
  const featured = active.slice(0, 9);
  const weather = alerts.find((item) => item.subtype === "weather-forecast");
  const budo = transport.filter((item) => item.subtype.startsWith("ferry")).length;
  const roads = transport.filter((item) => item.subtype.startsWith("road")).length;

  return (
    <main className="techHome">
      <section className="techHero">
        <div className="techGrid" aria-hidden="true" />
        <div className="techGlow techGlowOne" aria-hidden="true" />
        <div className="techGlow techGlowTwo" aria-hidden="true" />
        <div className="techHeroInner">
          <div className="techHeroCopy">
            <div className="techKicker"><span /><RadioTower size={16} /> Bursa gerçek zamanlı şehir istihbaratı</div>
            <h1>Şehrin tüm sinyalleri.<br/><em>Tek canlı merkez.</em></h1>
            <p>Kesintiler, BUDO seferleri, yol çalışmaları, saatlik hava, afet kayıtları, başvurular ve etkinlikler resmî kaynaklardan otomatik süzülür.</p>
            <div className="techHeroActions">
              <Link className="techPrimary" href="/bugun"><Activity size={18}/> Canlı akışı aç <ArrowRight size={18}/></Link>
              <Link className="techSecondary" href="/kesintiler"><BellRing size={18}/> Kritik uyarılar</Link>
            </div>
            <div className="techTrust">
              <span><ShieldCheck size={15}/> Resmî kaynak doğrulaması</span>
              <span><Database size={15}/> Saatlik veri işleme</span>
              <span><Zap size={15}/> Otomatik önceliklendirme</span>
            </div>
          </div>

          <div className="radarCore" aria-label="Bursa canlı radar özeti">
            <div className="radarOrbit orbitOne" />
            <div className="radarOrbit orbitTwo" />
            <div className="radarSweep" />
            <div className="radarCenter"><span>{active.length}</span><small>AKTİF SİNYAL</small></div>
            <div className="radarNode nodeWeather"><CloudSun size={18}/><span>Hava</span></div>
            <div className="radarNode nodeRoad"><Route size={18}/><span>Yol</span></div>
            <div className="radarNode nodeFerry"><ShipWheel size={18}/><span>BUDO</span></div>
            <div className="radarNode nodeWater"><Waves size={18}/><span>Altyapı</span></div>
          </div>
        </div>
      </section>

      <div className="techStatusWrap"><LiveStatus /></div>

      <section className="signalModules" aria-label="Canlı veri modülleri">
        <Link href="/kesintiler" className="signalModule signalDanger"><span><Siren/></span><div><small>Kritik / önemli</small><strong>{critical}</strong><p>Öncelikli şehir uyarısı</p></div><ArrowRight/></Link>
        <Link href="/kesintiler" className="signalModule"><span><CloudSun/></span><div><small>Saatlik hava</small><strong>{weather ? weather.title.replace("Bursa saatlik hava: ", "") : "Takipte"}</strong><p>MGM tahmin ve eşik analizi</p></div><ArrowRight/></Link>
        <Link href="/kesintiler" className="signalModule"><span><ShipWheel/></span><div><small>BUDO sinyali</small><strong>{budo}</strong><p>İptal ve ek seferler</p></div><ArrowRight/></Link>
        <Link href="/kesintiler" className="signalModule"><span><Route/></span><div><small>Yol durumu</small><strong>{roads}</strong><p>KGM çalışma ve kapanmaları</p></div><ArrowRight/></Link>
      </section>

      <section className="techSection">
        <div className="techSectionHead">
          <div><span className="techEyebrow">ÖNCELİKLİ AKIŞ</span><h2>Şu anda bilmen gerekenler</h2><p>Önem ve güncellik puanına göre otomatik sıralanır.</p></div>
          <Link href="/bugun">Tüm sinyaller <ArrowRight size={17}/></Link>
        </div>
        {featured.length ? <div className="cardGrid techCardGrid">{featured.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <div className="emptyState"><strong>Aktif sinyal bulunamadı.</strong><p>Kaynaklar saatlik olarak yeniden taranıyor.</p></div>}
      </section>

      <section className="dataMatrix">
        <div className="matrixHead"><span className="techEyebrow">VERİ MATRİSİ</span><h2>Şehrin tüm katmanları</h2></div>
        <div className="matrixGrid">
          <Link href="/kesintiler"><Siren/><span><strong>{alerts.length + outages.length}</strong><small>Uyarı ve kesinti</small></span><ArrowRight/></Link>
          <Link href="/kesintiler"><Route/><span><strong>{transport.length}</strong><small>Ulaşım sinyali</small></span><ArrowRight/></Link>
          <Link href="/basvurular"><FileCheck2/><span><strong>{applications.length}</strong><small>Açık başvuru</small></span><ArrowRight/></Link>
          <Link href="/etkinlikler"><CalendarDays/><span><strong>{events.length}</strong><small>Etkinlik</small></span><ArrowRight/></Link>
          <div><Database/><span><strong>{sourceHealth.healthySources}/{sourceHealth.totalSources}</strong><small>Sağlıklı kaynak</small></span></div>
          <div><Activity/><span><strong>{data.items.length}</strong><small>Toplam veri kaydı</small></span></div>
        </div>
      </section>

      <section className="districtSection techDistrictSection">
        <div className="techSectionHead"><div><span className="techEyebrow">KONUM RADARI</span><h2>İlçeni seç, sinyali daralt</h2></div><Link href="/bugun"><Search size={17}/> Gelişmiş arama</Link></div>
        <div className="districtGrid">
          {BURSA_DISTRICTS.map((district) => (
            <Link href={`/bursa/${district.slug}`} key={district.slug}><MapPin size={15}/><span>{district.name}</span><ArrowRight size={14}/></Link>
          ))}
        </div>
      </section>
    </main>
  );
}
