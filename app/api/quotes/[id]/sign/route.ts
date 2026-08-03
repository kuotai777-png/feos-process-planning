import {and,eq,ne} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db";
import {quotes,quoteVersions} from "@/db/schema";
import {apiError} from "@/lib/auth/api-guard";

export const dynamic="force-dynamic";
export const runtime="edge";

const signatureSchema=z.object({
  quote_version_id:z.string().trim().min(1).max(100),
  signature_data_url:z.string().max(500_000).regex(new RegExp("^data:image/png;base64,[A-Za-z0-9+/=]+$")),
}).strict();

function requestIp(request:Request){
  const cloudflareIp=request.headers.get("cf-connecting-ip")?.trim();
  const forwardedIp=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (cloudflareIp||forwardedIp||"unknown").slice(0,64);
}

function sameOrigin(request:Request){
  const origin=request.headers.get("origin");
  if(!origin)return true;
  try{return new URL(origin).host===new URL(request.url).host}
  catch{return false}
}

async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(request))return apiError("ERR_4031","Cross-origin signing is not allowed",403);
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")){
    return apiError("ERR_4150","Content-Type must be application/json",415);
  }

  let input:unknown;
  try{input=await request.json()}
  catch{return apiError("ERR_4000","Request body must be valid JSON",400)}
  const parsed=signatureSchema.safeParse(input);
  if(!parsed.success)return apiError("ERR_4001","Signature payload validation failed",400);

  try{
    const {id}=await params;
    const db=getDb();
    const [quote]=await db.select({id:quotes.id,status:quotes.status}).from(quotes)
      .where(eq(quotes.id,id)).limit(1);
    if(!quote)return apiError("ERR_4041","Quote not found",404);
    if(quote.status==="SIGNED")return apiError("ERR_4092","Quote has already been signed",409);

    const [version]=await db.select({id:quoteVersions.id}).from(quoteVersions)
      .where(and(eq(quoteVersions.id,parsed.data.quote_version_id),eq(quoteVersions.quoteId,quote.id)))
      .limit(1);
    if(!version)return apiError("ERR_4042","Quote version not found",404);

    const signedAt=Math.floor(Date.now()/1000);
    const signatureHash=await sha256Hex(parsed.data.signature_data_url);
    await db.update(quotes).set({
      status:"SIGNED",
      signedAt,
      signedIp:requestIp(request),
      signatureHash,
      signatureData:parsed.data.signature_data_url,
    }).where(and(eq(quotes.id,quote.id),ne(quotes.status,"SIGNED")));

    return Response.json({
      status:"SIGNED",
      signed_at:new Date(signedAt*1000).toISOString(),
      signature_hash:signatureHash,
    });
  }catch(error){
    console.error("Quote signing failed",error);
    return apiError("ERR_5006","Unable to sign quote",500);
  }
}