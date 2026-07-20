import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, FileCheck2, MapPin, RadioTower, Search, Siren } from "lucide-react";
import { BURSA_DISTRICTS, data, getActiveItems, getItems } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { ItemCard } from "@/components/ItemCard";

export default function Home() {
  const outages = getItems("outage").filter((item) => item.status !== "ended");
  const applications = getItems("application").filter((item) => item.status !== "ended");
  const events = getItems("event").filter((item) => item.status !== "ended");
  const featured = getActiveItems().slice(0, 6);

  return (
    <main>
      <section className="hero">
        <div className="heroInner">
          <div className="heroCopy">
            <span className="livePill"><i /> Bursa verileri izleniyor</span>
            <h1>Şehrinde bugün<br/><em>ne oluyor?</em></h1>
            <p>Kesintileri, açık başvuruları ve ücretsiz etkinlikleri farklı kurum sitelerinde arama. Şehir Radar resmî bilgiyi tek ekranda toplar.</p>
            <div className="heroActions"><Link className="primaryButton" href="/bugun">Bugünü kontrol et <ArrowRight size={18} /></Link><Link className="ghostButton" href="/hakkinda">Nasıl çalışıyor?</Link></div>
            <div className="trustRow"><CheckCircle2 size={16}/> Yalnızca resmî kaynaklar <span/> <CheckCircle2 size={16}/> Saatlik veri kontrolü</div>
          </div>
          <div className="radarPanel" aria-hidden="true">
            <div className="radar"><span className="beam"/><span className="ring ring1"/><span className="ring ring2"/><span className="ring ring3"/><i className="dot d1"/><i className="dot d2"/><i className="dot d3"/><div className="radarCenter"><RadioTower /></div></div>
            <div className="floatingCard fc1"><Siren/><span><small>Nilüfer</small><strong>Su kesintisi</strong></span></div>
            <div className="floatingCard fc2"><CalendarDays/><span><small>Osmangazi</small><strong>Ücretsiz etkinlik</strong></span></div>
            <div className="floatingCard fc3"><FileCheck2/><span><small>Bursa</small><strong>Başvuru açık</strong></span></div>
          </div>
        </div>
      </section>

      <section className="quickStats">
        <Link href="/kesintiler"><span className="statIcon outageIcon"><Siren/></span><span><small>Güncel kesinti</small><strong>{outages.length}</strong></span><ArrowRight/></Link>
        <Link href="/basvurular"><span className="statIcon applicationIcon"><FileCheck2/></span><span><small>Açık başvuru</small><strong>{applications.length}</strong></span><ArrowRight/></Link>
        <Link href="/etkinlikler"><span className="statIcon eventIcon"><CalendarDays/></span><span><small>Yaklaşan etkinlik</small><strong>{events.length}</strong></span><ArrowRight/></Link>
        <div className="lastUpdate"><small>Son veri kontrolü</small><strong>{formatDateTime(data.generatedAt)}</strong></div>
      </section>

      <section className="homeSection">
        <div className="sectionHeading"><div><span className="eyebrow">Şehir akışı</span><h2>Şu an bilmen gerekenler</h2></div><Link href="/bugun">Bugünün tamamı <ArrowRight size={17}/></Link></div>
        {featured.length ? <div className="cardGrid">{featured.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <div className="emptyState"><strong>Şu anda aktif kayıt yok.</strong><p>Veriler saatlik olarak yeniden kontrol ediliyor.</p></div>}
      </section>

      <section className="districtSection">
        <div className="sectionHeading"><div><span className="eyebrow">İlçe sayfaları</span><h2>Bursa&apos;yı ilçe ilçe takip et</h2></div></div>
        <div className="districtGrid">
          {BURSA_DISTRICTS.map((district) => (
            <Link href={`/bursa/${district.slug}`} key={district.slug}>
              <MapPin size={16} /><span>{district.name}</span><ArrowRight size={15}/>
            </Link>
          ))}
        </div>
      </section>

      <section className="searchBanner">
        <div><MapPin/><span><small>Mahallene göre filtrele</small><h2>İhtiyacın olan bilgiyi saniyeler içinde bul.</h2></span></div>
        <Link href="/bugun"><Search/> Radarı aç</Link>
      </section>
    </main>
  );
}
