import {eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db";
import {lossReasons,quotes} from "@/db/schema";
import {apiError} from "@/lib/auth/api-guard";
import {guardApprovalManager} from "@/lib/auth/manager";

export const dynamic="force-dynamic";
export const runtime="edge";

const categoryCodes={
  "價格過高":"PRICE_TOO_HIGH",
  "交期過長":"LEAD_TIME_TOO_LONG",
  "競品搶單":"COMPETITOR_WON",
} as const;
const lossReasonSchema=z.object({
  quote_id:z.string().trim().min(1).max(100),
  reason_category:z.enum(["價格過高","交期過長","競品搶單"]),
  competitor_name:z.string().trim().max(200).nullable().optional(),
  notes:z.string().trim().max(2000).nullable().optional(),
}).strict();

export async function POST(request:Request){
  const access=await guardApprovalManager();
  if(!access.ok)return access.response;

  let input:unknown;
  try{input=await request.json();}
  catch{return apiError("ERR_4000","Request body must be valid JSON",400);}

  const parsed=lossReasonSchema.safeParse(input);
  if(!parsed.success){
    return apiError("ERR_4001","Request body validation failed",400,parsed.error.issues);
  }

  try{
    const db=getDb();
    const [quote]=await db.select({id:quotes.id,quoteNo:quotes.quoteNo})
      .from(quotes).where(eq(quotes.id,parsed.data.quote_id)).limit(1);
    if(!quote)return apiError("ERR_4041","Quote not found",404);

    const id=crypto.randomUUID();
    await db.insert(lossReasons).values({
      id,
      quoteId:quote.id,
      reasonCategory:categoryCodes[parsed.data.reason_category],
      competitorName:parsed.data.competitor_name||null,
      notes:parsed.data.notes||null,
    }).onConflictDoUpdate({
      target:lossReasons.quoteId,
      set:{
        reasonCategory:categoryCodes[parsed.data.reason_category],
        competitorName:parsed.data.competitor_name||null,
        notes:parsed.data.notes||null,
        createdAt:Math.floor(Date.now()/1000),
      },
    });
    await db.update(quotes).set({status:"LOST"}).where(eq(quotes.id,quote.id));

    return Response.json({
      status:"LOST",
      quote_id:quote.id,
      quote_no:quote.quoteNo,
      reason_category:parsed.data.reason_category,
    },{status:201,headers:{"cache-control":"no-store"}});
  }catch(error){
    console.error("Loss reason registration failed",error);
    return apiError("ERR_5007","Unable to register loss reason",500);
  }
}
