import { data, getItemProvince, sortItems } from "@/lib/data";
import type { ContentStatus, ContentType } from "@/lib/types";

const contentTypes = new Set<ContentType>(["outage", "application", "event", "transport", "alert"]);
const contentStatuses = new Set<ContentStatus>(["active", "open", "planned", "ended", "unknown"]);

export function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as ContentType | null;
  const status = url.searchParams.get("status") as ContentStatus | null;
  const province = url.searchParams.get("province")?.trim();
  const district = url.searchParams.get("district")?.trim();
  const query = url.searchParams.get("q")?.trim().toLocaleLowerCase("tr-TR");
  const activeOnly = url.searchParams.get("active") === "1";
  const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 250) : 50;

  if (type && !contentTypes.has(type)) return Response.json({ error: "Geçersiz type değeri." }, { status: 400 });
  if (status && !contentStatuses.has(status)) return Response.json({ error: "Geçersiz status değeri." }, { status: 400 });

  const items = sortItems(data.items.filter((item) => {
    if (type && item.type !== type) return false;
    if (status && item.status !== status) return false;
    if (activeOnly && item.status === "ended") return false;
    if (province && getItemProvince(item).toLocaleLowerCase("tr-TR") !== province.toLocaleLowerCase("tr-TR")) return false;
    if (district && item.district.toLocaleLowerCase("tr-TR") !== district.toLocaleLowerCase("tr-TR")) return false;
    if (query) {
      const haystack = [item.title, item.summary, getItemProvince(item), item.district, item.sourceName, ...item.neighborhoods, ...item.tags]
        .join(" ").toLocaleLowerCase("tr-TR");
      if (!haystack.includes(query)) return false;
    }
    return true;
  })).slice(0, limit);

  return Response.json({
    generatedAt: data.generatedAt,
    country: "Türkiye",
    count: items.length,
    filters: { type, status, province, district, query, activeOnly, limit },
    items,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
