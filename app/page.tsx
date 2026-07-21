import Link from "next/link";
import { Activity, ArrowRight, Building2, CloudSun, Database, FileCheck2, RadioTower, Route, Search, ShieldCheck, Siren, Zap } from "lucide-react";
import sourceHealth from "@/data/source-health.json";
import { PROVINCES, categoryPath, data, getActiveItems, getItemProvince, getItems, getPriority, getProvinceCounts } from "@/lib/data";
import { ItemCard } from "@/components/ItemCard";
import { LiveStatus } from "@/components/LiveStatus";
import { SignalTicker } from "@/components/SignalTicker";
import { ProvinceSelector } from "@/components/ProvinceSelector";

export default function Home() {
  const active = getActiveItems();
  const alerts = getItems("alert").filter((item) => item.status !== "ended");
  const outages = getItems("outage").filter((item) => item.status !== "ended");
  const transport = getItems("transport").filter((item) => item.status !== "ended");
  const applications = getItems("application").filter((item) => item.status !== "ended");
  const critical = active.filter((item) => ["critical", "high"].includes(getPriority(item))).length;
  const featured = active.slice(0, 12);
  const heroSignals = active.slice(0, 3);
  const provinceCounts = getProvinceCounts();
  const represented = new Set(active.map(getItemProvince).filter((name) => name !== "Türkiye")).size;
  const earthquakes = alerts.filter((item) => item.subtype === "earthquake").length;
  const weatherWarnings = alerts.filter((item) => ["weather-warning", "meteo-warning"].includes(item.subtype)).length;
  const roads = transport.filter((item) => item.subtype.startsWith("road")).length;

  return (
    <main className="techHome nationalHome">
      <SignalTicker items={active} />
      <section className="techHero nationalHero">
        <div className="techGrid" aria-hidden="true" />
        <div className="techGlow techGlowOne" aria-hidden="true" />
        <div className="techGlow techGlowTwo" aria-hidden="true" />
        <div className="techHeroInner">
          <div className="techHeroCopy">
            <div className="techKicker"><span /><RadioTower size={16} /> Türkiye gerçek zamanlı şehir ağı</div>
            <h1>81 şehrin tüm sinyalleri.<br/><em>Tek canlı merkez.</em></h1>
            <p>Depremler, meteorolojik uyarılar, yol kapanmaları, şehir kesintileri, resmî duyurular, başvurular ve etkinlikler saatlik olarak süzülür.</p>

            <div className="heroLivePreview" aria-label="Şu anda Türkiye'de öne çıkan bilgiler">
              <div className="heroLiveHead">
                <span><Activity size={15}/> Şimdi Türkiye&apos;de</span>
                <Link href="/bugun">Tüm akış <ArrowRight size={14}/></Link>
              </div>
              <div className="heroLiveRows">
                {heroSignals.map((item) => (
                  <Link className={`heroLiveRow heroPriority-${getPriority(item)}`} href={categoryPath(item)} key={item.id}>
                    <i />
                    <span>
                      <small>{getItemProvince(item)} · {item.sourceName}</small>
                      <strong>{item.title}</strong>
                    </span>
                    <ArrowRight size={15}/>
                  </Link>
                ))}
              </div>
            </div>

            <div className="heroProvinceSelect"><ProvinceSelector /></div>
            <div className="techHeroActions">
              <Link className="techPrimary" href="/bugun"><Activity size={18}/> Türkiye akışını aç <ArrowRight size={18}/></Link>
              <Link className="techSecondary" href="/sehirler"><Building2 size={18}/> 81 şehri keşfet</Link>
            </div>
            <div className="techTrust">
              <span><ShieldCheck size={15}/> Resmî kaynak doğrulaması</span>
              <span><Database size={15}/> Saatlik veri işleme</span>
              <span><Zap size={15}/> Otomatik önem puanı</span>
            </div>
          </div>

          <div className="radarCore nationalRadar" aria-label="Türkiye canlı radar özeti">
            <div className="radarOrbit orbitOne" />
            <div className="radarOrbit orbitTwo" />
            <div className="radarSweep" />
            <div className="radarCenter"><span>{active.length}</span><small>AKTİF SİNYAL</small></div>
            <div className="radarNode nodeWeather"><CloudSun size={18}/><span>Hava</span></div>
            <div className="radarNode nodeRoad"><Route size={18}/><span>Yol</span></div>
            <div className="radarNode nodeFerry"><Activity size={18}/><span>Deprem</span></div>
            <div className="radarNode nodeWater"><Building2 size={18}/><span>81 İl</span></div>
            <div className="nationalRadarStats">
              <span><b>{represented}</b> şehirde kayıt</span>
              <span><b>{sourceHealth.healthySources}/{sourceHealth.totalSources}</b> kaynak aktif</span>
            </div>
          </div>
        </div>
      </section>

      <div className="techStatusWrap"><LiveStatus /></div>

      <section className="signalModules nationalModules" aria-label="Canlı veri modülleri">
        <Link href="/kesintiler" className="signalModule signalDanger"><span><Siren/></span><div><small>Kritik / önemli</small><strong>{critical}</strong><p>Türkiye çapında öncelikli uyarı</p></div><ArrowRight/></Link>
        <Link href="/kesintiler" className="signalModule"><span><Activity/></span><div><small>Son depremler</small><strong>{earthquakes}</strong><p>AFAD ulusal deprem akışı</p></div><ArrowRight/></Link>
        <Link href="/kesintiler" className="signalModule"><span><CloudSun/></span><div><small>MeteoUYARI</small><strong>{weatherWarnings}</strong><p>Sarı, turuncu ve kırmızı uyarılar</p></div><ArrowRight/></Link>
        <Link href="/kesintiler" className="signalModule"><span><Route/></span><div><small>Yol durumu</small><strong>{roads}</strong><p>KGM çalışma ve kapanmaları</p></div><ArrowRight/></Link>
      </section>

      <section className="techSection visibleFeed">
        <div className="techSectionHead">
          <div><span className="techEyebrow">CANLI TÜRKİYE AKIŞI</span><h2>Şu anda bilmen gerekenler</h2><p>Bilgiler önem, zaman ve konuma göre otomatik sıralanır.</p></div>
          <Link href="/bugun">Tüm sinyaller <ArrowRight size={17}/></Link>
        </div>
        {featured.length ? <div className="cardGrid techCardGrid">{featured.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <div className="emptyState"><strong>Aktif sinyal bulunamadı.</strong><p>Ulusal kaynaklar saatlik olarak yeniden taranıyor.</p></div>}
      </section>

      <section className="dataMatrix nationalMatrix">
        <div className="matrixHead"><span className="techEyebrow">TÜRKİYE VERİ MATRİSİ</span><h2>Şehirlerin tüm katmanları</h2></div>
        <div className="matrixGrid">
          <Link href="/kesintiler"><Siren/><span><strong>{alerts.length + outages.length}</strong><small>Uyarı ve kesinti</small></span><ArrowRight/></Link>
          <Link href="/kesintiler"><Route/><span><strong>{transport.length}</strong><small>Ulaşım ve yol</small></span><ArrowRight/></Link>
          <Link href="/basvurular"><FileCheck2/><span><strong>{applications.length}</strong><small>Açık başvuru</small></span><ArrowRight/></Link>
          <Link href="/sehirler"><Building2/><span><strong>81</strong><small>Şehir sayfası</small></span><ArrowRight/></Link>
          <div><Database/><span><strong>{sourceHealth.healthySources}/{sourceHealth.totalSources}</strong><small>Sağlıklı kaynak</small></span></div>
          <div><Activity/><span><strong>{data.items.length}</strong><small>Toplam veri kaydı</small></span></div>
        </div>
      </section>

      <section className="districtSection techDistrictSection nationalProvinceSection">
        <div className="techSectionHead"><div><span className="techEyebrow">ŞEHİR RADARI</span><h2>Şehrini seç, akışı yerelleştir</h2></div><Link href="/sehirler"><Search size={17}/> 81 ilin tamamı</Link></div>
        <div className="districtGrid provinceQuickGrid">
          {PROVINCES.slice(0, 20).map((province) => (
            <Link href={`/sehir/${province.slug}`} key={province.slug}><span className="plateMini">{province.plate}</span><span>{province.name}<small>{provinceCounts[province.name] ?? 0} kayıt</small></span><ArrowRight size={14}/></Link>
          ))}
        </div>
      </section>
    </main>
  );
}
