# Şehir Radar

Bursa ile başlayan otomatik şehir bilgi platformu. Resmî kaynaklardan kesinti, başvuru ve etkinlik bilgisi toplar; özgün ve yapılandırılmış içerik olarak yayımlar.

## Canlı yayın

- GitHub Pages yedeği: `https://oguzdurak16-create.github.io/sehirradar/`
- Vercel kotası açıldığında aynı `main` dalı Vercel üzerinde de çalışır.

## Özellikler

- Modern mobil/masaüstü arayüz
- Kesinti, başvuru ve etkinlik filtreleri
- Her içerikte resmî kaynak bağlantısı
- Saatlik GitHub Actions veri kontrolü
- Riskli içerikleri otomatik olarak `reviewQueue` alanına ayırma
- Sitemap, robots.txt, RSS ve Schema.org verisi
- Vercel uyumlu Next.js 16 projesi
- GitHub Pages için otomatik statik yedek deploy
- Görsel kopyalamaz; tasarım içi özgün grafikler kullanır

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` içindeki `NEXT_PUBLIC_SITE_URL` değerini gerçek alan adıyla değiştirin.

## Vercel

1. Bu klasörü boş bir GitHub deposuna gönderin.
2. Vercel'de `New Project` ile depoyu seçin.
3. `NEXT_PUBLIC_SITE_URL` değişkenini gerçek alan adı olarak tanımlayın.
4. Deploy edin.

GitHub Actions her saatin 7. dakikasında resmî kaynakları kontrol eder. `data/content.json` değişirse otomatik commit atar; Vercel commit sonrasında yeniden deploy eder.

## Kaynak adaptörleri

`scripts/ingest.mjs` içinde:

- Bursa Büyükşehir Belediyesi açık veri duyuru servisi
- Bursa Büyükşehir Belediyesi etkinlik sayfası
- BUSKİ günlük su kesintileri
- UEDAŞ planlı elektrik kesintileri
- BURULAŞ ulaşım duyuruları

Kaynak sayfaların HTML yapısı değişirse yalnızca ilgili adaptör güncellenir. Bir kaynak geçici olarak çalışmazsa mevcut veriler korunur.

## Hukuki güvenlik

- Kaynak metin aynen kopyalanmaz.
- Haber sitesi fotoğrafı kullanılmaz.
- Suç, ölüm, kaza, sağlık, çocuk ve kişisel veri içeren içerikler otomatik yayımlanmaz.
- Her kayıt resmî kaynağa bağlanır.
- Site resmî kurum olmadığını açıkça belirtir.

## Google indeksleme

Sitemap otomatik üretilir: `/sitemap.xml`. Site Google Search Console'a eklendikten sonra sitemap bir kez tanıtılmalıdır. Google'ın genel içerikler için anlık indeks garantisi yoktur; temiz iç bağlantı, güncel sitemap ve özgün faydalı sayfalar keşfi hızlandırır.
