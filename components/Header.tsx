import Link from "next/link";
import { CalendarCheck2, CalendarDays, CircleHelp, FileCheck2, Menu, Siren } from "lucide-react";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/bugun", label: "Bugün", icon: CalendarCheck2 },
  { href: "/kesintiler", label: "Kesintiler", icon: Siren },
  { href: "/basvurular", label: "Başvurular", icon: FileCheck2 },
  { href: "/etkinlikler", label: "Etkinlikler", icon: CalendarDays },
  { href: "/hakkinda", label: "Nasıl çalışır?", icon: CircleHelp },
];

export function Header() {
  return (
    <header className="siteHeader">
      <div className="headerInner">
        <Logo />
        <nav className="desktopNav" aria-label="Ana menü">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <details className="mobileMenu">
          <summary aria-label="Menüyü aç"><Menu /></summary>
          <nav>
            {links.map(({ href, label }) => <Link href={href} key={href}>{label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
