import {and,eq} from "drizzle-orm";
import {resourceCatalog} from "../../../db/schema";
import {defaultResourceCatalog,ResourceCatalogItem,ResourceKind} from "../../../src/lib/resourceCatalog";
import {deleteCollectionItem,isRenderRuntime,readCollection,upsertCollectionItem} from "../../../src/lib/renderStore";

export const dynamic="force-dynamic";
const toRow=(item:ResourceCatalogItem)=>({...item,properties:JSON.stringify(item.properties)});
const fromRow=(item:typeof resourceCatalog.$inferSelect):ResourceCatalogItem=>({...item,kind:item.kind as ResourceKind,properties:JSON.parse(item.properties||"{}")});

async function cloudflareDb(){
  const {getDb}=await import("../../../db");
  return getDb();
}

async function all(){
  if(isRenderRuntime())return readCollection("resource-catalog",defaultResourceCatalog);
  const db=await cloudflareDb();
  const rows=await db.select().from(resourceCatalog);
  if(rows.length)return rows.map(fromRow);
  await db.insert(resourceCatalog).values(defaultResourceCatalog.map(toRow)).onConflictDoNothing();
  return (await db.select().from(resourceCatalog)).map(fromRow);
}

export async function GET(request:Request){
  try{
    const kind=new URL(request.url).searchParams.get("kind");
    return Response.json((await all()).filter(item=>!kind||item.kind===kind));
  }catch(error){return Response.json({error:String(error)},{status:500})}
}

export async function POST(request:Request){
  try{
    const input=await request.json() as ResourceCatalogItem;
    const item={...input,id:input.id||crypto.randomUUID()};
    if(isRenderRuntime())await upsertCollectionItem("resource-catalog",defaultResourceCatalog,item);
    else await (await cloudflareDb()).insert(resourceCatalog).values(toRow(item));
    return Response.json(item,{status:201});
  }catch(error){return Response.json({error:String(error)},{status:400})}
}

export async function PUT(request:Request){
  try{
    const input=await request.json() as ResourceCatalogItem;
    if(isRenderRuntime())await upsertCollectionItem("resource-catalog",defaultResourceCatalog,input);
    else await (await cloudflareDb()).update(resourceCatalog).set({...toRow(input),updatedAt:new Date().toISOString()}).where(and(eq(resourceCatalog.id,input.id),eq(resourceCatalog.kind,input.kind)));
    return Response.json(input);
  }catch(error){return Response.json({error:String(error)},{status:400})}
}

export async function DELETE(request:Request){
  const id=new URL(request.url).searchParams.get("id");
  if(!id)return Response.json({error:"缺少資料 ID"},{status:400});
  if(isRenderRuntime())await deleteCollectionItem("resource-catalog",defaultResourceCatalog,id);
  else await (await cloudflareDb()).delete(resourceCatalog).where(eq(resourceCatalog.id,id));
  return Response.json({ok:true});
}
