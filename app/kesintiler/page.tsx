import type { Metadata } from "next";
import { FilterableList } from "@/components/FilterableList";
import { getItems } from "@/lib/data";

export const metadata: Metadata = {
  title: "Bursa Canlı Uyarılar",
  description: "Bursa su, elektrik, ulaşım, BUDO, hava, afet ve yol durumu uyarıları.",
};

export default function Page() {
  return (
    <main className="pageShell">
      <FilterableList
        title="Canlı uyarılar ve şehir kesintileri"
        items={[...getItems("alert"), ...getItems("outage"), ...getItems("transport")]}
      />
    </main>
  );
}
