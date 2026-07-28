import {and,eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {resourceCatalog} from "../../../db/schema";
import {defaultResourceCatalog,ResourceCatalogItem,ResourceKind} from "../../../src/lib/resourceCatalog";

export const dynamic="force-dynamic";
const toRow=(item:ResourceCatalogItem)=>({...item,properties:JSON.stringify(item.properties)});
const fromRow=(item:typeof resourceCatalog.$inferSelect):ResourceCatalogItem=>({...item,kind:item.kind as ResourceKind,properties:JSON.parse(item.properties||"{}")});

async function seedIfEmpty(){
  const db=getDb();
  const existing=await db.select().from(resourceCatalog);
  if(existing.length)return existing;
  await db.insert(resourceCatalog).values(defaultResourceCatalog.map(toRow)).onConflictDoNothing();
  return db.select().from(resourceCatalog);
}

export async function GET(request:Request){
  try{
    const kind=new URL(request.url).searchParams.get("kind");
    const rows=await seedIfEmpty();
    return Response.json(rows.map(fromRow).filter(item=>!kind||item.kind===kind));
  }catch(error){return Response.json({error:String(error)},{status:500})}
}
export async function POST(request:Request){
  try{
    const input=await request.json() as ResourceCatalogItem;
    const item={...input,id:input.id||crypto.randomUUID()};
    await getDb().insert(resourceCatalog).values(toRow(item));
    return Response.json(item,{status:201});
  }catch(error){return Response.json({error:String(error)},{status:400})}
}
export async function PUT(request:Request){
  try{
    const input=await request.json() as ResourceCatalogItem;
    await getDb().update(resourceCatalog).set({...toRow(input),updatedAt:new Date().toISOString()}).where(and(eq(resourceCatalog.id,input.id),eq(resourceCatalog.kind,input.kind)));
    return Response.json(input);
  }catch(error){return Response.json({error:String(error)},{status:400})}
}
export async function DELETE(request:Request){
  const id=new URL(request.url).searchParams.get("id");
  if(!id)return Response.json({error:"缺少資料 ID"},{status:400});
  await getDb().delete(resourceCatalog).where(eq(resourceCatalog.id,id));
  return Response.json({ok:true});
}
