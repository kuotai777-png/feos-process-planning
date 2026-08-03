import {desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db";
import {quotes,quoteVersions} from "@/db/schema";
import {apiError} from "@/lib/auth/api-guard";
import {guardApprovalManager} from "@/lib/auth/manager";

export const dynamic="force-dynamic";
export const runtime="edge";

const decisionSchema=z.object({
  action:z.enum(["approve","return"]),
  comments:z.string().trim().max(1000).optional().default(""),
}).strict();

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  const access=await guardApprovalManager();
  if(!access.ok)return access.response;

  let input:unknown;
  try{input=await request.json();}
  catch{return apiError("ERR_4000","Request body must be valid JSON",400);}

  const parsed=decisionSchema.safeParse(input);
  if(!parsed.success){
    return apiError("ERR_4001","Request body validation failed",400,parsed.error.issues);
  }

  try{
    const {id}=await context.params;
    const db=getDb();
    const [quote]=await db.select({id:quotes.id,status:quotes.status,quoteNo:quotes.quoteNo})
      .from(quotes).where(eq(quotes.id,id)).limit(1);
    if(!quote)return apiError("ERR_4041","Quote not found",404);
    if(quote.status!=="PENDING_APPROVAL"){
      return apiError("ERR_4091","Quote is not pending approval",409,{current_status:quote.status});
    }

    const [latestVersion]=await db.select({id:quoteVersions.id}).from(quoteVersions)
      .where(eq(quoteVersions.quoteId,quote.id))
      .orderBy(desc(quoteVersions.createdAt))
      .limit(1);
    if(!latestVersion)return apiError("ERR_4224","Quote has no version to approve",422);

    const nextStatus=parsed.data.action==="approve"?"APPROVED_FOR_PRODUCTION":"RETURNED";
    await db.update(quotes).set({
      status:nextStatus,
      reviewedAt:Math.floor(Date.now()/1000),
      reviewedBy:access.user.email,
      reviewedVersionId:parsed.data.action==="approve"?latestVersion.id:null,
      reviewComments:parsed.data.comments||null,
    }).where(eq(quotes.id,quote.id));

    return Response.json({
      status:nextStatus,
      quote_id:quote.id,
      quote_no:quote.quoteNo,
      reviewed_by:access.user.email,
    },{headers:{"cache-control":"no-store"}});
  }catch(error){
    console.error("Quote approval decision failed",error);
    return apiError("ERR_5006","Unable to update approval decision",500);
  }
}
