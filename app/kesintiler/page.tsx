import type { Metadata } from "next";
import { FilterableList } from "@/components/FilterableList";
import { getItems } from "@/lib/data";
export const metadata: Metadata = { title: "Bursa Kesintileri", description: "Bursa su, elektrik ve ulaşım kesintileri." };
export default function Page(){ return <main className="pageShell"><FilterableList title="Kesintiler ve ulaşım duyuruları" items={[...getItems("outage"), ...getItems("transport")]}/></main>; }
