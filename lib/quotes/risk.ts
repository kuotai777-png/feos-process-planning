export const MINIMUM_APPROVAL_MARGIN=0.2;

const nonStandardKeys=new Set([
  "is_non_standard",
  "isnonstandard",
  "non_standard",
  "nonstandard",
  "custom_part",
  "custompart",
  "is_custom",
  "iscustom",
  "non_standard_item",
]);

function normalizedKey(value:string){
  return value.toLowerCase().replaceAll("-","_");
}

function isTruthyNonStandardValue(value:unknown){
  if(value===true||value===1)return true;
  if(typeof value!=="string")return false;
  const normalized=value.trim().toLowerCase();
  return ["true","yes","y","1","是","非標","非標件","non-standard","nonstandard"].includes(normalized);
}

export function containsNonStandardPart(value:unknown):boolean{
  if(Array.isArray(value))return value.some(containsNonStandardPart);
  if(typeof value!=="object"||value===null)return false;

  for(const [key,nested] of Object.entries(value)){
    if(nonStandardKeys.has(normalizedKey(key))&&isTruthyNonStandardValue(nested))return true;
    if(containsNonStandardPart(nested))return true;
  }
  return false;
}

export function evaluateQuoteRisk(input:{
  calculatedMargin:number;
  internalCostJson:unknown;
  bomDetails:unknown;
}){
  const reasons:string[]=[];
  if(!Number.isFinite(input.calculatedMargin)||input.calculatedMargin<MINIMUM_APPROVAL_MARGIN){
    reasons.push("毛利率低於 20%");
  }
  if(containsNonStandardPart(input.internalCostJson)||containsNonStandardPart(input.bomDetails)){
    reasons.push("包含非標件");
  }
  return {requiresApproval:reasons.length>0,reasons};
}
