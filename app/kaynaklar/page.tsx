import type { Metadata } from "next";
import { ExternalLink, ShieldCheck } from "lucide-react";
export const metadata: Metadata = { title: "Resmî Kaynaklar" };
const sources=[
  ["BUSKİ", "Su kesintileri ve altyapı duyuruları", "https://www.buski.gov.tr/gunluk-su-kesintileri"],
  ["UEDAŞ", "Planlı elektrik kesintileri", "https://www.uedas.com.tr/tr/kesintiler"],
  ["Bursa Büyükşehir Belediyesi", "Etkinlikler, duyurular ve sosyal destekler", "https://www.bursa.bel.tr/"],
  ["BURULAŞ", "Toplu ulaşım ve sefer duyuruları", "https://www.burulas.com.tr/"],
];
export default function Page(){return <main className="contentPage"><span className="eyebrow">Şeffaflık</span><h1>Kullandığımız resmî kaynaklar</h1><p className="lead">Her kaydın kaynağı içerik kartında gösterilir. Şehir Radar başvuru kabul etmez ve resmî kurum adına açıklama yapmaz.</p><div className="sourceList">{sources.map(([name,desc,url])=><a href={url} target="_blank" rel="noreferrer noopener" key={name}><ShieldCheck/><span><strong>{name}</strong><small>{desc}</small></span><ExternalLink/></a>)}</div></main>}
