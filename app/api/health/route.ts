import { data } from "@/lib/data";
export function GET(){return Response.json({ok:true,generatedAt:data.generatedAt,itemCount:data.items.length,reviewCount:data.reviewQueue.length});}
