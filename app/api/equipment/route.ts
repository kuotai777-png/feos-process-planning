import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {equipmentAssets} from "../../../db/schema";
import {defaultEquipmentAssets,EquipmentAsset} from "../../../src/lib/equipmentCatalog";
export const dynamic="force-dynamic";
async function all(){const db=getDb();const rows=await db.select().from(equipmentAssets);if(rows.length)return rows;await db.insert(equipmentAssets).values(defaultEquipmentAssets).onConflictDoNothing();return db.select().from(equipmentAssets)}
export async function GET(){try{return Response.json(await all())}catch(error){return Response.json({error:String(error)},{status:500})}}
export async function POST(request:Request){try{const input=await request.json() as EquipmentAsset;const item={...input,id:input.id||crypto.randomUUID()};await getDb().insert(equipmentAssets).values(item);return Response.json(item,{status:201})}catch(error){return Response.json({error:String(error)},{status:400})}}
export async function PUT(request:Request){try{const input=await request.json() as EquipmentAsset;await getDb().update(equipmentAssets).set({...input,updatedAt:new Date().toISOString()}).where(eq(equipmentAssets.id,input.id));return Response.json(input)}catch(error){return Response.json({error:String(error)},{status:400})}}
export async function DELETE(request:Request){const id=new URL(request.url).searchParams.get("id");if(!id)return Response.json({error:"缺少 ID"},{status:400});await getDb().delete(equipmentAssets).where(eq(equipmentAssets.id,id));return Response.json({ok:true})}
