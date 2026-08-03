import {z} from "zod";

const internalFieldPattern=/(^|_)(unit_?cost|internal_?cost|purchase|procurement|supplier_?cost|waste|scrap|loss|margin|depreciation|machine_?cost|labor_?cost)(_|$)/i;
const internalChinesePattern=/(採購|進貨|成本|損耗|廢料|毛利|折舊|工時單價|機台單價)/;

function findInternalField(value:unknown,path:string[]=[]):string|null{
  if(Array.isArray(value)){
    for(let index=0;index<value.length;index++){
      const found=findInternalField(value[index],[...path,String(index)]);
      if(found)return found;
    }
    return null;
  }
  if(typeof value!=="object"||value===null)return null;
  for(const [key,nested] of Object.entries(value)){
    const next=[...path,key];
    if(internalFieldPattern.test(key)||internalChinesePattern.test(key))return next.join(".");
    const found=findInternalField(nested,next);
    if(found)return found;
  }
  return null;
}

const materialOptionSchema=z.object({
  code:z.enum(["A","B","C"]),
  name:z.string().trim().min(1).max(80),
  material:z.string().trim().min(1).max(120),
  description:z.string().trim().max(400).default(""),
  unit_price:z.number().finite().nonnegative(),
  quantity:z.number().int().positive().default(1),
  total_price:z.number().finite().nonnegative().optional(),
  lead_days:z.number().int().positive().optional(),
  specifications:z.array(z.string().trim().min(1).max(120)).max(12).default([]),
}).strip();

const publicQuoteSchema=z.object({
  quote_title:z.string().trim().min(1).max(120).default("家具客製報價"),
  product_name:z.string().trim().min(1).max(120),
  customer_name:z.string().trim().min(1).max(100),
  quote_no:z.string().trim().min(1).max(80),
  currency:z.string().trim().regex(/^[A-Z]{3}$/).default("TWD"),
  valid_until:z.string().trim().max(40).optional(),
  notes:z.string().trim().max(1000).optional(),
  options:z.array(materialOptionSchema).length(3).superRefine((options,context)=>{
    const codes=new Set(options.map(option=>option.code));
    if(codes.size!==3||!codes.has("A")||!codes.has("B")||!codes.has("C"))context.addIssue({code:"custom",message:"Options must contain A, B and C"});
  }),
}).strip();

export type ClientFacingQuote=z.infer<typeof publicQuoteSchema>;
export type ClientMaterialOption=z.infer<typeof materialOptionSchema>;

export function parseClientFacingQuote(value:unknown):
  |{ok:true;data:ClientFacingQuote}
  |{ok:false;reason:"internal_field"|"invalid_shape"}{
  if(findInternalField(value))return {ok:false,reason:"internal_field"};
  const parsed=publicQuoteSchema.safeParse(value);
  return parsed.success?{ok:true,data:parsed.data}:{ok:false,reason:"invalid_shape"};
}