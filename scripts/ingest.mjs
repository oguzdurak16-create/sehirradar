import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import * as cheerio from "cheerio";

const ROOT=process.cwd();
const DATA_FILE=path.join(ROOT,"data/content.json");
const TIMEOUT=Number(process.env.INGEST_TIMEOUT_MS||20000);
const NOW=new Date();
const nowIso=NOW.toISOString();
const UA="SehirRadarBot/1.0 (+public city information aggregator; contact via site)";

const SOURCES={
  bursaApi:"https://bapi.bursa.bel.tr/apigateway/acikveri/duyuru",
  bursaEvents:"https://www.bursa.bel.tr/etkinlik",
  buski:"https://www.buski.gov.tr/gunluk-su-kesintileri",
  uedas:"https://www.uedas.com.tr/tr/kesintiler",
  burulas:"https://www.burulas.com.tr/"
};
const risky=/\b(cinayet|ölüm|öldü|yaralı|kaza|şüpheli|gözaltı|tutuk|tecavüz|istismar|sağlık verisi|hasta kimliği|intihar|silah|uyuşturucu|siyasi suçlama|başkan suçladı)\b/i;
const application=/\b(başvuru|destek|kurs|kayıt|burs|yardım|hibe|personel alımı|staj)\b/i;
const event=/\b(etkinlik|konser|tiyatro|sergi|festival|şenlik|atölye|söyleşi|sinema)\b/i;
const transport=/\b(sefer|güzergah|güzergâh|ulaşım|otobüs|metro|tramvay|BursaRay|BUDO)\b/i;

function slugify(v){return v.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100)}
function clean(v=""){return String(v).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim()}
function hash(v){return crypto.createHash("sha1").update(v).digest("hex").slice(0,12)}
function sentence(text,max=260){const t=clean(text);if(t.length<=max)return t;const cut=t.slice(0,max);return cut.slice(0,Math.max(cut.lastIndexOf("."),cut.lastIndexOf(" ")))+"…"}
function districtFrom(text){const districts=["Nilüfer","Osmangazi","Yıldırım","Mudanya","Gemlik","İnegöl","Mustafakemalpaşa","Karacabey","Gürsu","Kestel","Orhangazi","İznik","Yenişehir","Keles","Orhaneli","Büyükorhan","Harmancık"];return districts.find(d=>text.toLocaleLowerCase("tr-TR").includes(d.toLocaleLowerCase("tr-TR")))||"Bursa"}
function parseTrDate(text){const m=text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})(?:\s+(\d{1,2})[:.](\d{2}))?/);if(!m)return null;const [,d,mo,y,h="09",mi="00"]=m;return `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}T${h.padStart(2,"0")}:${mi}:00+03:00`}
async function fetchText(url){const c=new AbortController();const timer=setTimeout(()=>c.abort(),TIMEOUT);try{const r=await fetch(url,{headers:{"user-agent":UA,"accept":"text/html,application/json"},signal:c.signal});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return {text:await r.text(),type:r.headers.get("content-type")||""}}finally{clearTimeout(timer)}}
function classify(title,body=""){const t=`${title} ${body}`;if(/su kesint/i.test(t))return ["outage","water"];if(/elektrik kesint|enerji verilemeyecek/i.test(t))return ["outage","electricity"];if(transport.test(t))return ["transport","transport"];if(application.test(t))return ["application","social-support"];if(event.test(t))return ["event",/sergi/i.test(t)?"exhibition":/festival|şenlik/i.test(t)?"festival":"event"];return [null,null]}
function normalizeItem({title,body,url,sourceName,publishedAt,start,end,type,subtype,district}){title=clean(title);body=clean(body);if(!title||title.length<7)return null;const c=type?[type,subtype]:classify(title,body);if(!c[0])return null;const risk=risky.test(`${title} ${body}`)?"review":"low";const id=`${slugify(sourceName)}-${hash(url+title)}`;return {id,slug:slugify(title)||id,type:c[0],subtype:c[1]||"general",title:sentence(title,120),summary:sentence(body||title,260),body:sentence(body||title,700),district:district||districtFrom(`${title} ${body}`),neighborhoods:[],startsAt:start||parseTrDate(body)||parseTrDate(title),endsAt:end||null,status:c[0]==="application"?"open":c[0]==="event"?"active":"planned",sourceName,sourceUrl:url,sourcePublishedAt:publishedAt||null,updatedAt:nowIso,risk,isFree:/ücretsiz/i.test(`${title} ${body}`)?true:null,tags:Array.from(new Set([c[1],districtFrom(`${title} ${body}`),sourceName])).filter(Boolean)} }
function flattenJson(value,out=[]){if(Array.isArray(value)){for(const x of value)flattenJson(x,out)}else if(value&&typeof value==="object"){const keys=Object.keys(value).map(k=>k.toLocaleLowerCase("tr-TR"));if(keys.some(k=>/baslik|başlık|title|duyuruadi|ad/.test(k)))out.push(value);else for(const x of Object.values(value))flattenJson(x,out)}return out}
function pick(obj,patterns){for(const [k,v] of Object.entries(obj)){const key=k.toLocaleLowerCase("tr-TR");if(patterns.some(p=>key.includes(p))&&v!=null)return String(v)}return ""}
async function ingestBursaApi(){const {text}=await fetchText(SOURCES.bursaApi);const json=JSON.parse(text);return flattenJson(json).map(r=>{const title=pick(r,["baslik","başlık","title","duyuruadi","adi"]);const body=pick(r,["aciklama","açıklama","icerik","içerik","description","ozet","özet"]);let url=pick(r,["url","link"]);if(url&&!url.startsWith("http"))url=`https://www.bursa.bel.tr${url.startsWith("/")?"":"/"}${url}`;return normalizeItem({title,body,url:url||SOURCES.bursaApi,sourceName:"Bursa Büyükşehir Belediyesi",publishedAt:pick(r,["tarih","date"])||null})}).filter(Boolean)}
async function ingestEventHtml(){const {text}=await fetchText(SOURCES.bursaEvents);const $=cheerio.load(text);const results=[];$("a[href*='/etkinlik/']").each((_,a)=>{const el=$(a);const href=el.attr("href");const block=el.closest("article,li,.item,.card,.event,.etkinlik").length?el.closest("article,li,.item,.card,.event,.etkinlik"):el.parent();const title=clean(el.find("h1,h2,h3,h4,h5").first().text()||el.attr("title")||el.text());const body=clean(block.text());if(title.length>6){const url=new URL(href,SOURCES.bursaEvents).href;const item=normalizeItem({title,body,url,sourceName:"Bursa Büyükşehir Belediyesi",type:"event",subtype:/sergi/i.test(body)?"exhibition":/festival|şenlik/i.test(body)?"festival":"event"});if(item)results.push(item)}});return results}
async function ingestBuski(){const {text}=await fetchText(SOURCES.buski);const $=cheerio.load(text);const body=clean($("body").text());const chunks=body.split(/(?=(?:NİLÜFER|OSMANGAZİ|YILDIRIM|MUSTAFAKEMALPAŞA|İNEGÖL|GEMLİK|MUDANYA|GÜRSU|KESTEL|KARACABEY|ORHANGAZİ|İZNİK|YENİŞEHİR)\b)/i).filter(x=>/kesinti/i.test(x));return chunks.slice(0,40).map(chunk=>normalizeItem({title:`${districtFrom(chunk)} su kesintisi`,body:chunk,url:SOURCES.buski,sourceName:"BUSKİ",type:"outage",subtype:"water",district:districtFrom(chunk)})).filter(Boolean)}
async function ingestUedas(){const {text}=await fetchText(SOURCES.uedas);const $=cheerio.load(text);const body=clean($("body").text());const matches=body.match(/\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+[^.]{20,260}enerji verilemeyecektir/gi)||[];return matches.map(chunk=>normalizeItem({title:`${districtFrom(chunk)} planlı elektrik kesintisi`,body:chunk,url:SOURCES.uedas,sourceName:"UEDAŞ",type:"outage",subtype:"electricity",district:districtFrom(chunk)})).filter(Boolean)}
async function ingestBurulas(){const {text}=await fetchText(SOURCES.burulas);const $=cheerio.load(text);const results=[];$("a").each((_,a)=>{const el=$(a);const block=el.closest("article,li,.card,.item").length?el.closest("article,li,.card,.item"):el.parent();const body=clean(block.text());if(body.length>25&&transport.test(body)){const title=sentence(clean(el.text())||body,120);const href=el.attr("href")||SOURCES.burulas;const item=normalizeItem({title,body,url:new URL(href,SOURCES.burulas).href,sourceName:"BURULAŞ",type:"transport",subtype:"transport"});if(item)results.push(item)}});return results}
function unique(items){const map=new Map();for(const item of items){const key=`${item.type}|${slugify(item.title)}|${item.district}`;const old=map.get(key);if(!old||item.body.length>old.body.length)map.set(key,item)}return [...map.values()]}
function carryStatus(item){if(item.endsAt&&new Date(item.endsAt)<NOW)return {...item,status:"ended"};return item}
async function main(){const old=JSON.parse(await fs.readFile(DATA_FILE,"utf8"));const jobs=[["Bursa açık veri",ingestBursaApi],["Bursa etkinlik",ingestEventHtml],["BUSKİ",ingestBuski],["UEDAŞ",ingestUedas],["BURULAŞ",ingestBurulas]];const collected=[];for(const [name,fn] of jobs){try{const items=await fn();console.log(`${name}: ${items.length}`);collected.push(...items)}catch(e){console.error(`${name} başarısız:`,e.message)}}
  const fresh=unique(collected).map(carryStatus);
  const oldMap=new Map(old.items.map(i=>[i.id,i]));
  const refreshed=fresh.map(i=>oldMap.has(i.id)?{...oldMap.get(i.id),...i}:i);
  const freshIds=new Set(refreshed.map(i=>i.id));
  const preserved=old.items.filter(i=>!freshIds.has(i.id)).map(carryStatus);
  const merged=unique([...refreshed,...preserved]).filter(i=>{
    if(i.status!=="ended") return true;
    const anchor=i.endsAt||i.updatedAt;
    return NOW.getTime()-new Date(anchor).getTime()<1000*60*60*24*90;
  });
  const published=merged.filter(i=>i.risk==="low");
  const review=merged.filter(i=>i.risk==="review");
  const output={generatedAt:nowIso,city:"Bursa",items:published,reviewQueue:review};
  await fs.writeFile(DATA_FILE,JSON.stringify(output,null,2)+"\n");
  console.log(`Tamamlandı: ${published.length} yayın, ${review.length} inceleme.`);
}
main().catch(e=>{console.error(e);process.exit(1)});
