import Link from "next/link";

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerInner">
        <div>
          <strong>Şehir Radar</strong>
          <p>Resmî kaynaklardaki şehir bilgisini sadeleştirir. Resmî kurum değildir.</p>
        </div>
        <div className="footerLinks">
          <Link href="/kaynaklar">Kaynaklar</Link>
          <Link href="/hakkinda">Yayın ilkeleri</Link>
          <Link href="/feed.xml">RSS</Link>
        </div>
      </div>
    </footer>
  );
}
