import {desc,eq,or} from "drizzle-orm";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {getDb} from "@/db";
import {quotes,quoteVersions} from "@/db/schema";
import {apiError} from "@/lib/auth/api-guard";
import {extractDxfPanels,generatePanelDxf} from "@/lib/dxf/export";

export const dynamic="force-dynamic";
export const runtime="edge";

function safeFilename(value:string){
  return value.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,80)||"quote";
}

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  const user=await getChatGPTUser();
  if(!user)return apiError("ERR_4013","Authentication required",401);

  try{
    const {id}=await context.params;
    const db=getDb();
    const [quote]=await db.select({id:quotes.id,quoteNo:quotes.quoteNo})
      .from(quotes)
      .where(or(eq(quotes.id,id),eq(quotes.quoteNo,id)))
      .limit(1);
    if(!quote)return apiError("ERR_4041","Quote not found",404);

    const [version]=await db.select({
      id:quoteVersions.id,
      internalCostJson:quoteVersions.internalCostJson,
    }).from(quoteVersions)
      .where(eq(quoteVersions.quoteId,quote.id))
      .orderBy(desc(quoteVersions.createdAt))
      .limit(1);
    if(!version)return apiError("ERR_4042","Quote version not found",404);

    const panels=extractDxfPanels(version.internalCostJson);
    if(!panels.length){
      return apiError("ERR_4225","Quote BOM contains no panel net dimensions for DXF export",422);
    }

    const dxf=generatePanelDxf(panels,quote.quoteNo);
    const filename=safeFilename(quote.quoteNo)+"-panels.dxf";
    return new Response(dxf,{headers:{
      "content-type":"application/dxf; charset=utf-8",
      "content-disposition":`attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control":"private, no-store",
      "x-content-type-options":"nosniff",
      "x-bom-panel-types":String(panels.length),
    }});
  }catch(error){
    console.error("DXF export failed",error);
    return apiError("ERR_5008","Unable to export DXF",500);
  }
}
