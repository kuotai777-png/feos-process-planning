import {and,asc,eq,gte} from "drizzle-orm";
import {getDb} from "@/db";
import {materials,offcutInventory} from "@/db/schema";
import {apiError,guardIntegrationRequest,parseJsonBody} from "@/lib/auth/api-guard";
import {availabilityCheckSchema} from "@/lib/integration/erp-schemas";

export const dynamic="force-dynamic";
export const runtime="edge";

export async function POST(request:Request){
  const guarded=await guardIntegrationRequest(request);
  if(!guarded.ok)return guarded.response;
  const parsed=parseJsonBody(guarded.rawBody,availabilityCheckSchema);
  if(!parsed.ok)return parsed.response;

  try{
    const input=parsed.data;
    const conditions=[
      eq(materials.materialCode,input.material_code),
      eq(offcutInventory.status,"available"),
      gte(offcutInventory.length,input.length),
      gte(offcutInventory.width,input.width),
    ];
    if(input.thickness!==undefined)conditions.push(gte(offcutInventory.thickness,input.thickness));

    const rows=await getDb().select({
      offcutId:offcutInventory.id,
      residualCost:offcutInventory.residualValue,
      location:offcutInventory.location,
      length:offcutInventory.length,
      width:offcutInventory.width,
      thickness:offcutInventory.thickness,
    }).from(offcutInventory)
      .innerJoin(materials,eq(offcutInventory.materialId,materials.id))
      .where(and(...conditions))
      .orderBy(asc(offcutInventory.residualValue),asc(offcutInventory.length))
      .limit(input.limit);

    return Response.json({
      status:"success",
      material_code:input.material_code,
      available_count:rows.length,
      offcuts:rows.map(row=>({
        offcut_id:row.offcutId,
        residual_cost:row.residualCost,
        location:row.location,
        length:row.length,
        width:row.width,
        thickness:row.thickness,
      })),
    });
  }catch(error){
    console.error("ERP integration availability check failed",error);
    return apiError("ERR_5003","Unable to check inventory availability",500);
  }
}