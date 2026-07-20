import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilterableList } from "@/components/FilterableList";
import { BURSA_DISTRICTS, getDistrictBySlug, getDistrictItems } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return BURSA_DISTRICTS.map((district) => ({ district: district.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ district: string }>;
}): Promise<Metadata> {
  const { district: slug } = await params;
  const district = getDistrictBySlug(slug);
  if (!district) return {};

  return {
    title: `${district.name} Kesinti, Başvuru ve Etkinlikleri`,
    description: `Bursa ${district.name} su ve elektrik kesintileri, açık belediye başvuruları, ulaşım duyuruları ve etkinlikleri.`,
    alternates: { canonical: `/bursa/${district.slug}` },
    openGraph: {
      title: `${district.name} Şehir Radarı`,
      description: `${district.name} için güncel kesinti, başvuru ve etkinlik bilgileri.`,
    },
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ district: string }>;
}) {
  const { district: slug } = await params;
  const district = getDistrictBySlug(slug);
  if (!district) notFound();

  const items = getDistrictItems(district.name);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${district.name} Şehir Radarı`,
    description: `${district.name} ilçesindeki şehir duyuruları ve Bursa genelindeki başvurular.`,
    about: { "@type": "AdministrativeArea", name: `${district.name}, Bursa` },
    numberOfItems: items.length,
  };

  return (
    <main className="pageShell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="districtHero">
        <span className="eyebrow">Bursa ilçe radarı</span>
        <h1>{district.name}</h1>
        <p>
          İlçeye özel kayıtlar ile Bursa genelinde geçerli başvuru ve etkinlikler aynı ekranda gösterilir.
        </p>
      </section>
      <FilterableList title={`${district.name} güncel şehir bilgileri`} items={items} />
    </main>
  );
}
