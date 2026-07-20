import type { Metadata } from "next";
import { FilterableList } from "@/components/FilterableList";
import { getItems } from "@/lib/data";
export const metadata: Metadata = { title: "Bursa Etkinlikleri", description: "Bursa ücretsiz etkinlikleri, konserler, sergiler ve çocuk aktiviteleri." };
export default function Page(){ return <main className="pageShell"><FilterableList title="Etkinlikler ve ücretsiz programlar" items={getItems("event")}/></main>; }
