import Link from "next/link";
import { Activity, Building2, CalendarDays, CircleHelp, FileCheck2, Menu, RadioTower, Siren } from "lucide-react";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/bugun", label: "Canlı Akış", icon: Activity },
  { href: "/sehirler", label: "81 Şehir", icon: Building2 },
  { href: "/kesintiler", label: "Uyarılar", icon: Siren },
  { href: "/basvurular", label: "Başvurular", icon: FileCheck2 },
  { href: "/etkinlikler", label: "Etkinlikler", icon: CalendarDays },
  { href: "/hakkinda", label: "Sistem", icon: CircleHelp },
];

export function Header() {
  return (
    <header className="siteHeader techHeader">
      <div className="headerInner">
        <Logo />
        <nav className="desktopNav" aria-label="Ana menü">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}><Icon size={16} /> {label}</Link>
          ))}
        </nav>
        <div className="headerLive"><span /><RadioTower size={15} /> TÜRKİYE LIVE</div>
        <details className="mobileMenu">
          <summary aria-label="Menüyü aç"><Menu /></summary>
          <nav>{links.map(({ href, label }) => <Link href={href} key={href}>{label}</Link>)}</nav>
        </details>
      </div>
    </header>
  );
}
