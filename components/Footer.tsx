import Link from "next/link";

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerInner">
        <div>
          <strong>Şehir Radar Türkiye</strong>
          <p>81 il için resmî kaynaklardaki şehir bilgisini sadeleştirir. Resmî kurum değildir.</p>
        </div>
        <div className="footerLinks">
          <Link href="/bugun">Türkiye canlı akışı</Link>
          <Link href="/sehirler">81 şehir</Link>
          <Link href="/kaynaklar">Kaynaklar</Link>
          <Link href="/hakkinda">Yayın ilkeleri</Link>
          <Link href="/feed.xml">RSS</Link>
          <Link href="/api/v1/items">Veri API</Link>
        </div>
      </div>
    </footer>
  );
}
