import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {offcutInventory,quotes} from "@/db/schema";
import {apiError,guardIntegrationRequest,parseJsonBody} from "@/lib/auth/api-guard";
import {inventoryReserveSchema} from "@/lib/integration/erp-schemas";

export const dynamic="force-dynamic";
export const runtime="edge";

export async function POST(request:Request){
  const guarded=await guardIntegrationRequest(request);
  if(!guarded.ok)return guarded.response;
  const parsed=parseJsonBody(guarded.rawBody,inventoryReserveSchema);
  if(!parsed.ok)return parsed.response;

  try{
    const db=getDb();
    const [quote]=await db.select({id:quotes.id}).from(quotes)
      .where(eq(quotes.quoteNo,parsed.data.quote_no)).limit(1);
    if(!quote)return apiError("ERR_4041","Quote not found",404);

    const offcutIds=[...new Set(parsed.data.items.map(item=>item.offcut_id))];
    const candidates=await db.select({id:offcutInventory.id,status:offcutInventory.status})
      .from(offcutInventory).where(inArray(offcutInventory.id,offcutIds));
    const availableIds=new Set(candidates.filter(item=>item.status==="available").map(item=>item.id));
    const unavailableIds=offcutIds.filter(id=>!availableIds.has(id));
    if(unavailableIds.length)return apiError("ERR_4091","One or more offcuts are unavailable",409,{offcut_ids:unavailableIds});

    await db.batch([
      db.update(offcutInventory).set({status:"locked"})
        .where(and(inArray(offcutInventory.id,offcutIds),eq(offcutInventory.status,"available"))),
      db.update(quotes).set({inventoryLockStatus:"locked"}).where(eq(quotes.id,quote.id)),
    ]);

    return Response.json({
      status:"locked",
      quote_no:parsed.data.quote_no,
      locked_count:offcutIds.length,
      offcut_ids:offcutIds,
    });
  }catch(error){
    console.error("ERP integration inventory reserve failed",error);
    return apiError("ERR_5004","Unable to reserve inventory",500);
  }
}