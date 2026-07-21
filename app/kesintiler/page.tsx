import type { Metadata } from "next";
import { FilterableList } from "@/components/FilterableList";
import { getItems } from "@/lib/data";

export const metadata: Metadata = {
  title: "Türkiye Canlı Uyarılar",
  description: "Türkiye genelindeki su, elektrik, ulaşım, hava, afet ve yol durumu uyarıları.",
};

export default function Page() {
  return <main className="pageShell"><FilterableList title="Türkiye canlı uyarıları ve şehir kesintileri" items={[...getItems("alert"), ...getItems("outage"), ...getItems("transport")]}/></main>;
}
