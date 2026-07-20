import { data } from "@/lib/data";
import sourceHealth from "@/data/source-health.json";

export function GET() {
  const generatedAt = new Date(data.generatedAt);
  const ageMinutes = Math.max(0, Math.round((Date.now() - generatedAt.getTime()) / 60000));
  const hasSourceReport = sourceHealth.sources.length > 0;
  const sourceThreshold = Math.max(1, Math.ceil(sourceHealth.totalSources / 2));
  const sourcesHealthy = !hasSourceReport || sourceHealth.healthySources >= sourceThreshold;
  const healthy = ageMinutes <= 180 && sourcesHealthy;

  return Response.json(
    {
      ok: healthy,
      status: healthy ? "fresh" : ageMinutes > 180 ? "stale" : "source-degraded",
      generatedAt: data.generatedAt,
      ageMinutes,
      itemCount: data.items.length,
      activeItemCount: data.items.filter((item) => item.status !== "ended").length,
      reviewCount: data.reviewQueue.length,
      sourceReport: {
        generatedAt: sourceHealth.generatedAt,
        total: sourceHealth.totalSources,
        healthy: sourceHealth.healthySources,
        sources: sourceHealth.sources,
      },
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
