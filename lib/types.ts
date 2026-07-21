export type ContentType = "outage" | "application" | "event" | "transport" | "alert";
export type ContentStatus = "active" | "open" | "planned" | "ended" | "unknown";

export interface RadarItem {
  id: string;
  slug: string;
  type: ContentType;
  subtype: string;
  title: string;
  summary: string;
  body: string;
  province?: string;
  district: string;
  neighborhoods: string[];
  startsAt: string | null;
  endsAt: string | null;
  status: ContentStatus;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  updatedAt: string;
  risk: "low" | "review";
  isFree: boolean | null;
  tags: string[];
}

export interface RadarData {
  generatedAt: string;
  city: string;
  country?: string;
  items: RadarItem[];
  reviewQueue: RadarItem[];
}
