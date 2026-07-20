import type { Metadata } from "next";
import { FilterableList } from "@/components/FilterableList";
import { getItems } from "@/lib/data";
export const metadata: Metadata = { title: "Bursa Başvuruları", description: "Bursa sosyal destek, kurs ve belediye başvuruları." };
export default function Page(){ return <main className="pageShell"><FilterableList title="Açık başvurular ve destekler" items={getItems("application")}/></main>; }
