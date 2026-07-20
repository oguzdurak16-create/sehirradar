import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DetailPage } from "@/components/DetailPage";
import { getItemBySlug, getItems } from "@/lib/data";
export function generateStaticParams(){ return getItems("event").map((item) => ({ slug: item.slug })); }
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> { const {slug}=await params; const item=getItemBySlug(slug); return item ? {title:item.title,description:item.summary} : {}; }
export default async function Page({params}:{params:Promise<{slug:string}>}){ const {slug}=await params; const item=getItemBySlug(slug); if(!item || item.type!=="event") notFound(); return <DetailPage item={item} backHref="/etkinlikler" backLabel="Etkinliklere dön"/>; }
