import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {processCosts} from "../../../db/schema";
import {defaultProcessCosts,ProcessCost} from "../../../src/lib/processCostStore";

export const dynamic="force-dynamic";

const toRow=(item:ProcessCost)=>({...item,aliases:JSON.stringify(item.aliases)});
const fromRow=(item:typeof processCosts.$inferSelect):ProcessCost=>({
  ...item,
  aliases:JSON.parse(item.aliases||"[]"),
});

async function seedIfEmpty(){
  const db=getDb();
  const existing=await db.select().from(processCosts);
  if(existing.length)return existing;
  await db.insert(processCosts).values(defaultProcessCosts.map(toRow)).onConflictDoNothing();
  return db.select().from(processCosts);
}

export async function GET(){
  try{
    const rows=await seedIfEmpty();
    return Response.json(rows.map(fromRow));
  }catch(error){
    return Response.json({error:String(error)},{status:500});
  }
}

export async function POST(request:Request){
  try{
    const input=await request.json() as ProcessCost;
    const item={...input,id:input.id||crypto.randomUUID(),updatedAt:new Date().toISOString()};
    await getDb().insert(processCosts).values(toRow(item));
    return Response.json(item,{status:201});
  }catch(error){
    return Response.json({error:String(error)},{status:400});
  }
}

export async function PUT(request:Request){
  try{
    const input=await request.json() as ProcessCost;
    await getDb().update(processCosts).set({...toRow(input),updatedAt:new Date().toISOString()}).where(eq(processCosts.id,input.id));
    return Response.json(input);
  }catch(error){
    return Response.json({error:String(error)},{status:400});
  }
}

export async function DELETE(request:Request){
  const id=new URL(request.url).searchParams.get("id");
  if(!id)return Response.json({error:"缺少工序 ID"},{status:400});
  await getDb().delete(processCosts).where(eq(processCosts.id,id));
  return Response.json({ok:true});
}
