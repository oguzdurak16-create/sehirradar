import type { Metadata } from "next";
import { FilterableList } from "@/components/FilterableList";
import { getItems } from "@/lib/data";
export const metadata: Metadata = { title: "Türkiye Etkinlikleri", description: "Türkiye şehirlerindeki resmî etkinlik, festival, sergi ve atölye duyuruları." };
export default function Page(){ return <main className="pageShell"><FilterableList title="Şehir etkinlikleri" items={getItems("event")}/></main>; }
