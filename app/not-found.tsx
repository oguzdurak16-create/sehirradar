import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";

export default function NotFound() {
  return (
    <main className="notFoundPage">
      <Radar size={58} />
      <span className="eyebrow">404</span>
      <h1>Bu kayıt radarda yok.</h1>
      <p>İçerik kaldırılmış, adresi değişmiş veya henüz yayımlanmamış olabilir.</p>
      <Link className="primaryButton" href="/bugun"><ArrowLeft size={17} /> Bugünün radarına dön</Link>
    </main>
  );
}
