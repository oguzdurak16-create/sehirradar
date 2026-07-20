import { data } from "@/lib/data";

export function GET() {
  const generatedAt = new Date(data.generatedAt);
  const ageMinutes = Math.max(0, Math.round((Date.now() - generatedAt.getTime()) / 60000));
  const healthy = ageMinutes <= 180;

  return Response.json(
    {
      ok: healthy,
      status: healthy ? "fresh" : "stale",
      generatedAt: data.generatedAt,
      ageMinutes,
      itemCount: data.items.length,
      activeItemCount: data.items.filter((item) => item.status !== "ended").length,
      reviewCount: data.reviewQueue.length,
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
