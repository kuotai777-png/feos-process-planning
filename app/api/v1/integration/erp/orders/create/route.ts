import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db";
import {quotes,quoteVersions} from "@/db/schema";
import {apiError,guardIntegrationRequest,parseJsonBody} from "@/lib/auth/api-guard";
import {orderCreateSchema} from "@/lib/integration/erp-schemas";
import {evaluateQuoteRisk} from "@/lib/quotes/risk";

export const dynamic="force-dynamic";
export const runtime="edge";

const forbiddenClientKey=/(^|_)(unit_?cost|purchase|procurement|waste|loss|margin|depreciation|internal_?cost|machine_?cost)(_|$)/i;

function isRecord(value:unknown):value is Record<string,unknown>{
  return typeof value==="object"&&value!==null&&!Array.isArray(value);
}

function findForbiddenClientPath(value:unknown,path:string[]=[]):string|null{
  if(Array.isArray(value)){
    for(let index=0;index<value.length;index++){
      const found=findForbiddenClientPath(value[index],[...path,String(index)]);
      if(found)return found;
    }
    return null;
  }
  if(!isRecord(value))return null;
  for(const [key,nested] of Object.entries(value)){
    const next=[...path,key];
    if(forbiddenClientKey.test(key))return next.join(".");
    const found=findForbiddenClientPath(nested,next);
    if(found)return found;
  }
  return null;
}

export async function POST(request:Request){
  const guarded=await guardIntegrationRequest(request);
  if(!guarded.ok)return guarded.response;
  const parsed=parseJsonBody(guarded.rawBody,orderCreateSchema);
  if(!parsed.ok)return parsed.response;

  try{
    const db=getDb();
    const [quote]=await db.select({
      id:quotes.id,
      quoteNo:quotes.quoteNo,
      inventoryLockStatus:quotes.inventoryLockStatus,
      status:quotes.status,
      reviewedVersionId:quotes.reviewedVersionId,
    }).from(quotes).where(eq(quotes.quoteNo,parsed.data.quote_no)).limit(1);
    if(!quote)return apiError("ERR_4041","Quote not found",404);

    const versionConditions=[eq(quoteVersions.quoteId,quote.id)];
    if(parsed.data.quote_version_id)versionConditions.push(eq(quoteVersions.id,parsed.data.quote_version_id));
    const [version]=await db.select({
      id:quoteVersions.id,
      internalCostJson:quoteVersions.internalCostJson,
      clientFacingJson:quoteVersions.clientFacingJson,
      calculatedMargin:quoteVersions.calculatedMargin,
    }).from(quoteVersions)
      .where(and(...versionConditions))
      .orderBy(desc(quoteVersions.createdAt))
      .limit(1);

    if(!version)return apiError("ERR_4042","Quote version not found",404);
    if(!isRecord(version.internalCostJson)||!Object.keys(version.internalCostJson).length)return apiError("ERR_4221","Quote version has no internal cost snapshot",422);
    if(!isRecord(version.clientFacingJson)||!Object.keys(version.clientFacingJson).length)return apiError("ERR_4222","Quote version has no client-facing snapshot",422);
    const forbiddenPath=findForbiddenClientPath(version.clientFacingJson);
    if(forbiddenPath)return apiError("ERR_4223","Client-facing quote contains an internal cost field",422,{path:forbiddenPath});

    const risk=evaluateQuoteRisk({
      calculatedMargin:version.calculatedMargin,
      internalCostJson:version.internalCostJson,
      bomDetails:parsed.data.bom_details,
    });
    const approvedForThisVersion=quote.status==="APPROVED_FOR_PRODUCTION"&&quote.reviewedVersionId===version.id;
    if(risk.requiresApproval&&!approvedForThisVersion){
      await db.update(quotes).set({
        status:"PENDING_APPROVAL",
        approvalTrigger:risk.reasons.join(" / "),
        reviewedAt:null,
        reviewedBy:null,
        reviewedVersionId:null,
        reviewComments:null,
      }).where(eq(quotes.id,quote.id));

      return Response.json({
        status:"PENDING_APPROVAL",
        quote_no:quote.quoteNo,
        quote_version_id:version.id,
        approval_reasons:risk.reasons,
      },{status:202,headers:{"cache-control":"no-store"}});
    }

    await db.update(quotes).set({
      status:"APPROVED_FOR_PRODUCTION",
      approvalTrigger:null,
    }).where(eq(quotes.id,quote.id));

    const date=new Date().toISOString().slice(0,10).replaceAll("-","");
    const erpOrderNo="MO-"+date+"-"+crypto.randomUUID().slice(0,8).toUpperCase();
    return Response.json({
      status:"APPROVED_FOR_PRODUCTION",
      erp_order_no:erpOrderNo,
      quote_no:quote.quoteNo,
      quote_version_id:version.id,
      contract_reference:parsed.data.contract_reference,
      inventory_lock_status:quote.inventoryLockStatus,
      bom_line_count:parsed.data.bom_details.length,
    },{status:201});
  }catch(error){
    console.error("ERP integration order create failed",error);
    return apiError("ERR_5005","Unable to create ERP manufacturing order",500);
  }
}