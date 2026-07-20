import Link from "next/link";
import { ArrowLeft, CalendarClock, ExternalLink, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import type { RadarItem } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export function DetailPage({ item, backHref, backLabel }: { item: RadarItem; backHref: string; backLabel: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sehirradar.example";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": item.type === "event" ? "Event" : "NewsArticle",
    name: item.title,
    headline: item.title,
    description: item.summary,
    dateModified: item.updatedAt,
    datePublished: item.sourcePublishedAt ?? item.updatedAt,
    startDate: item.startsAt ?? undefined,
    endDate: item.endsAt ?? undefined,
    mainEntityOfPage: `${siteUrl}${backHref}/${item.slug}`,
    isBasedOn: item.sourceUrl,
    publisher: { "@type": "Organization", name: "Şehir Radar" },
    location: item.type === "event" ? { "@type": "Place", name: item.district, address: { "@type": "PostalAddress", addressLocality: item.district, addressRegion: "Bursa", addressCountry: "TR" } } : undefined,
  };

  return (
    <main className="detailShell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href={backHref} className="backLink"><ArrowLeft size={16} /> {backLabel}</Link>
      <article className="detailCard">
        <div className="detailTop"><span className={`category category-${item.type}`}>{item.subtype}</span><StatusBadge status={item.status} /></div>
        <h1>{item.title}</h1>
        <p className="lead">{item.summary}</p>
        <div className="detailFacts">
          <div><MapPin /><span><small>Konum</small><strong>{item.district}{item.neighborhoods.length ? ` · ${item.neighborhoods.join(", ")}` : ""}</strong></span></div>
          <div><CalendarClock /><span><small>Başlangıç</small><strong>{formatDateTime(item.startsAt)}</strong></span></div>
          <div><RefreshCw /><span><small>Son kontrol</small><strong>{formatDateTime(item.updatedAt)}</strong></span></div>
        </div>
        <div className="articleBody"><p>{item.body}</p><div className="notice"><ShieldCheck /><p><strong>Kaynak doğrulaması:</strong> Şehir Radar, resmî kaynaktaki bilgiyi sadeleştirir. İşlem yapmadan önce kaynak sayfasındaki güncel koşulları kontrol edin.</p></div></div>
        <a className="sourceButton" href={item.sourceUrl} target="_blank" rel="noreferrer noopener">Resmî kaynağı aç <ExternalLink size={17} /></a>
      </article>
    </main>
  );
}
