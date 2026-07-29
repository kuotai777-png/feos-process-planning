import {eq} from "drizzle-orm";
import {processCosts} from "../../../db/schema";
import {defaultProcessCosts,ProcessCost} from "../../../src/lib/processCostStore";
import {deleteCollectionItem,isRenderRuntime,readCollection,upsertCollectionItem} from "../../../src/lib/renderStore";

export const dynamic="force-dynamic";
const toRow=(item:ProcessCost)=>({...item,aliases:JSON.stringify(item.aliases)});
const fromRow=(item:typeof processCosts.$inferSelect):ProcessCost=>({...item,aliases:JSON.parse(item.aliases||"[]")});

async function cloudflareDb(){
  const {getDb}=await import("../../../db");
  return getDb();
}

async function all(){
  if(isRenderRuntime())return readCollection("process-costs",defaultProcessCosts);
  const db=await cloudflareDb();
  const rows=await db.select().from(processCosts);
  if(rows.length)return rows.map(fromRow);
  await db.insert(processCosts).values(defaultProcessCosts.map(toRow)).onConflictDoNothing();
  return (await db.select().from(processCosts)).map(fromRow);
}

export async function GET(){
  try{return Response.json(await all())}
  catch(error){return Response.json({error:String(error)},{status:500})}
}

export async function POST(request:Request){
  try{
    const input=await request.json() as ProcessCost;
    const item={...input,id:input.id||crypto.randomUUID(),updatedAt:new Date().toISOString()};
    if(isRenderRuntime())await upsertCollectionItem("process-costs",defaultProcessCosts,item);
    else await (await cloudflareDb()).insert(processCosts).values(toRow(item));
    return Response.json(item,{status:201});
  }catch(error){return Response.json({error:String(error)},{status:400})}
}

export async function PUT(request:Request){
  try{
    const input=await request.json() as ProcessCost;
    const item={...input,updatedAt:new Date().toISOString()};
    if(isRenderRuntime())await upsertCollectionItem("process-costs",defaultProcessCosts,item);
    else await (await cloudflareDb()).update(processCosts).set(toRow(item)).where(eq(processCosts.id,input.id));
    return Response.json(item);
  }catch(error){return Response.json({error:String(error)},{status:400})}
}

export async function DELETE(request:Request){
  const id=new URL(request.url).searchParams.get("id");
  if(!id)return Response.json({error:"缺少工序費用 ID"},{status:400});
  if(isRenderRuntime())await deleteCollectionItem("process-costs",defaultProcessCosts,id);
  else await (await cloudflareDb()).delete(processCosts).where(eq(processCosts.id,id));
  return Response.json({ok:true});
}
