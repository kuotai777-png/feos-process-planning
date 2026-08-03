import {getDb} from "@/db";
import {materials} from "@/db/schema";
import {apiError,guardIntegrationRequest,parseJsonBody} from "@/lib/auth/api-guard";
import {materialSyncSchema} from "@/lib/integration/erp-schemas";

export const dynamic="force-dynamic";
export const runtime="edge";

export async function POST(request:Request){
  const guarded=await guardIntegrationRequest(request);
  if(!guarded.ok)return guarded.response;
  const parsed=parseJsonBody(guarded.rawBody,materialSyncSchema);
  if(!parsed.ok)return parsed.response;

  try{
    const db=getDb();
    for(const item of parsed.data.materials){
      const updateSet:Partial<typeof materials.$inferInsert>={
        unitCost:item.unit_cost,
        defaultWasteRate:item.default_waste_rate,
        moqQuantity:item.moq_quantity,
      };
      if(item.material_name!==undefined)updateSet.materialName=item.material_name;
      if(item.unit!==undefined)updateSet.unit=item.unit;
      if(item.alternative_material_id!==undefined)updateSet.alternativeMaterialId=item.alternative_material_id;

      await db.insert(materials).values({
        id:crypto.randomUUID(),
        materialCode:item.material_code,
        materialName:item.material_name??item.material_code,
        unit:item.unit??"pcs",
        unitCost:item.unit_cost,
        defaultWasteRate:item.default_waste_rate,
        moqQuantity:item.moq_quantity,
        alternativeMaterialId:item.alternative_material_id??null,
      }).onConflictDoUpdate({target:materials.materialCode,set:updateSet});
    }

    return Response.json({
      status:"success",
      synced_count:parsed.data.materials.length,
      material_codes:parsed.data.materials.map(item=>item.material_code),
    });
  }catch(error){
    console.error("ERP integration materials sync failed",error);
    return apiError("ERR_5002","Unable to synchronize materials",500);
  }
}