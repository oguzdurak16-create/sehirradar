import type { Metadata } from "next";
import { FilterableList } from "@/components/FilterableList";
import { getItems } from "@/lib/data";
export const metadata: Metadata = { title: "Türkiye Açık Başvuruları", description: "Türkiye genelindeki resmî destek, kurs, yardım ve başvuru duyuruları." };
export default function Page(){ return <main className="pageShell"><FilterableList title="Açık başvurular ve destekler" items={getItems("application")}/></main>; }
