export type MaterialCode="OAK"|"WALNUT"|"ASH"|"LAMINATE";

export interface QuoteDimensions{length:number;width:number;height:number}
export interface QuoteCalculationInput{dimensions:QuoteDimensions;materialCode:MaterialCode;quantity:number}
export interface QuoteCalculation{
  materialName:string;
  unitCost:number;
  suggestedUnitPrice:number;
  subtotal:number;
  tax:number;
  total:number;
  grossMarginRate:number;
  leadDays:number;
}

export const MATERIALS:Record<MaterialCode,{name:string;unitCost:number;leadDays:number}>={
  OAK:{name:"北美白橡木",unitCost:2850,leadDays:21},
  WALNUT:{name:"北美胡桃木",unitCost:4200,leadDays:28},
  ASH:{name:"天然梣木",unitCost:2350,leadDays:18},
  LAMINATE:{name:"F1 低甲醛美耐板",unitCost:1380,leadDays:14},
};

const finite=(value:number,fallback:number)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function normalizeQuoteInput(input:QuoteCalculationInput):QuoteCalculationInput{
  return {
    dimensions:{
      length:clamp(finite(Number(input.dimensions?.length),1800),600,3600),
      width:clamp(finite(Number(input.dimensions?.width),900),400,1800),
      height:clamp(finite(Number(input.dimensions?.height),750),350,1200),
    },
    materialCode:input.materialCode in MATERIALS?input.materialCode:"OAK",
    quantity:Math.round(clamp(finite(Number(input.quantity),1),1,100)),
  };
}

export function calculateQuote(input:QuoteCalculationInput):QuoteCalculation{
  const normalized=normalizeQuoteInput(input);
  const {length,width,height}=normalized.dimensions;
  const material=MATERIALS[normalized.materialCode];
  const topArea=(length*width)/1_000_000;
  const topMaterial=topArea*material.unitCost*1.1;
  const edgeAndFinish=((length+width)*2/1000)*185;
  const legs=(height*4/1000)*165*1.05;
  const hardware=520;
  const processing=1750+topArea*620;
  const unitCost=Math.round(topMaterial+edgeAndFinish+legs+hardware+processing);
  const grossMarginRate=normalized.quantity>=10?.38:normalized.quantity>=5?.4:.42;
  const volumeFactor=normalized.quantity>=10?.94:normalized.quantity>=5?.97:1;
  const suggestedUnitPrice=Math.ceil((unitCost/(1-grossMarginRate))*volumeFactor/100)*100;
  const subtotal=suggestedUnitPrice*normalized.quantity;
  const tax=Math.round(subtotal*.05);
  return {materialName:material.name,unitCost,suggestedUnitPrice,subtotal,tax,total:subtotal+tax,grossMarginRate,leadDays:material.leadDays+Math.max(0,Math.ceil(normalized.quantity/5)-1)*3};
}

export const formatTwd=(value:number)=>new Intl.NumberFormat("zh-TW",{style:"currency",currency:"TWD",maximumFractionDigits:0}).format(value);

