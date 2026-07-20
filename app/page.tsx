import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, FileCheck2, MapPin, Search, Siren } from "lucide-react";
import { BURSA_DISTRICTS, categoryPath, data, getActiveItems, getItems } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { ItemCard } from "@/components/ItemCard";

export default function Home() {
  const outages = getItems("outage").filter((item) => item.status !== "ended");
  const applications = getItems("application").filter((item) => item.status !== "ended");
  const events = getItems("event").filter((item) => item.status !== "ended");
  const featured = getActiveItems().slice(0, 6);
  const heroItem = featured[0];

  return (
    <main className="editorialHome">
      <section className="editorialHero">
        <div className="editorialHeroInner">
          <div className="editorialCopy">
            <div className="editorialKicker">Bursa günlük şehir rehberi</div>
            <h1>Bursa&apos;nın bugünü,<em>tek bakışta.</em></h1>
            <p className="editorialLead">Su ve elektrik kesintilerinden açık başvurulara, ulaşım değişikliklerinden ücretsiz etkinliklere kadar seni etkileyen resmî şehir bilgisini tek yerde takip et.</p>
            <div className="editorialActions">
              <Link className="primaryButton" href="/bugun">Bugünün radarını aç <ArrowRight size={18} /></Link>
              <Link className="ghostButton" href="/hakkinda">Sistem nasıl çalışıyor?</Link>
            </div>
            <div className="editorialTrust">
              <span><CheckCircle2 size={16}/> Yalnızca resmî kaynaklar</span>
              <span><CheckCircle2 size={16}/> Her saat otomatik kontrol</span>
              <span><CheckCircle2 size={16}/> Kaynağa doğrudan bağlantı</span>
            </div>
          </div>

          <div className="editorialVisual">
            <Image className="editorialPanorama" src="/bursa-panorama.svg" alt="Uludağ, Bursa çatıları ve tarihi şehir siluetinden oluşan özgün illüstrasyon" fill priority sizes="(max-width: 980px) 100vw, 46vw" />
            <div className="editorialStamp"><span><b>{featured.length}</b>aktif kayıt</span></div>
            <div className="editorialCaption">
              <span>
                <small>{heroItem ? `${heroItem.district} · güncel kayıt` : "Bursa · şehir akışı"}</small>
                <strong>{heroItem?.title ?? "Bursa şehir verileri saatlik olarak kontrol ediliyor."}</strong>
              </span>
              <Link href={heroItem ? categoryPath(heroItem) : "/bugun"}>Detayı aç <ArrowRight size={15}/></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="editorialStats">
        <Link href="/kesintiler"><span className="statIcon outageIcon"><Siren/></span><span><small>Güncel kesinti</small><strong>{outages.length}</strong></span><ArrowRight/></Link>
        <Link href="/basvurular"><span className="statIcon applicationIcon"><FileCheck2/></span><span><small>Açık başvuru</small><strong>{applications.length}</strong></span><ArrowRight/></Link>
        <Link href="/etkinlikler"><span className="statIcon eventIcon"><CalendarDays/></span><span><small>Yaklaşan etkinlik</small><strong>{events.length}</strong></span><ArrowRight/></Link>
        <div className="lastUpdate"><small>Son resmî kaynak kontrolü</small><strong>{formatDateTime(data.generatedAt)}</strong></div>
      </section>

      <section className="homeSection">
        <div className="sectionHeading"><div><span className="eyebrow">Şehir nabzı</span><h2>Bugün bilmen gerekenler</h2></div><Link href="/bugun">Tüm şehir akışı <ArrowRight size={17}/></Link></div>
        {featured.length ? <div className="cardGrid">{featured.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <div className="emptyState"><strong>Şu anda aktif kayıt yok.</strong><p>Resmî kaynaklar her saat yeniden kontrol ediliyor.</p></div>}
      </section>

      <section className="districtSection">
        <div className="sectionHeading"><div><span className="eyebrow">Mahallene yaklaş</span><h2>Bursa&apos;yı ilçe ilçe takip et</h2></div></div>
        <div className="districtGrid">
          {BURSA_DISTRICTS.map((district) => (
            <Link href={`/bursa/${district.slug}`} key={district.slug}>
              <MapPin size={16} /><span>{district.name}</span><ArrowRight size={15}/>
            </Link>
          ))}
        </div>
      </section>

      <section className="searchBanner">
        <div><MapPin/><span><small>İlçe ve mahalle filtresi</small><h2>Seni etkileyen şehir bilgisini saniyeler içinde bul.</h2></span></div>
        <Link href="/bugun"><Search/> Radarı aç</Link>
      </section>
    </main>
  );
}
