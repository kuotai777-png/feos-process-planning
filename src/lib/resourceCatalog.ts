export type ResourceKind="material"|"hardware";
export type ResourceCatalogItem={
  id:string;
  kind:ResourceKind;
  name:string;
  category:string;
  code:string;
  specification:string;
  unit:string;
  unitPrice:number;
  supplier:string;
  leadDays:number;
  stockQuantity:number;
  safetyStock:number;
  properties:Record<string,string>;
  source:string;
  effectiveDate:string;
  enabled:boolean;
};

export const defaultResourceCatalog:ResourceCatalogItem[]=[
  ["mat-birch-ply","material","樺木合板","木質板材","MAT-BP-15","15 × 1220 × 2440 mm","片",1680,"永續木材供應",5,86,20,{"密度":"680 kg/m³","含水率":"8–12%","適用":"CNC、裁切、鑽孔"}],
  ["mat-rubberwood","material","橡膠木集成材","實木板材","MAT-RW-18","18 × 1220 × 2440 mm","片",2150,"台灣集成材",7,42,12,{"密度":"650 kg/m³","含水率":"8–10%","表面":"AA 級"}],
  ["mat-mdf","material","中密度纖維板 MDF","人造板材","MAT-MDF-15","15 × 1220 × 2440 mm","片",720,"聯合板材",3,120,30,{"密度":"730 kg/m³","甲醛":"F1","適用":"CNC、塗裝"}],
  ["mat-pine","material","紐西蘭松木","實木","MAT-PINE-30","30 × 90 × 2400 mm","支",390,"森源木業",10,64,20,{"含水率":"10–14%","等級":"結構級","產地":"紐西蘭"}],
  ["mat-coating","material","水性透明面漆","塗裝材料","MAT-WC-20","20 kg／桶","桶",3250,"綠材塗料",4,18,6,{"VOC":"< 50 g/L","乾燥":"2 小時","適用":"木質表面"}],
  ["hw-screw","hardware","不鏽鋼木螺絲","緊固件","HW-SS-4X35","SUS304 4 × 35 mm","盒",480,"精工五金",2,75,20,{"包裝":"500 支／盒","扭力":"2.8 N·m","適用":"木材接合"}],
  ["hw-dowel","hardware","木榫","接合件","HW-DWL-8X40","樺木 Ø8 × 40 mm","包",260,"木作配件行",3,54,15,{"包裝":"1000 支／包","公差":"±0.1 mm","含水率":"8–10%"}],
  ["hw-handle","hardware","不鏽鋼提把","功能五金","HW-HDL-120","孔距 120 mm","只",165,"台灣家具五金",6,140,40,{"材質":"SUS304","承載":"80 kg","表面":"拉絲"}],
  ["hw-hinge","hardware","緩衝鉸鏈","活動五金","HW-HG-110","110° 全蓋式","只",92,"精密鉸鏈公司",5,210,50,{"杯徑":"35 mm","壽命":"80,000 次","調整":"三向"}],
  ["hw-adhesive","hardware","D3 木工膠","接合耗材","HW-GL-D3","5 kg／桶","桶",860,"工業黏著劑",4,26,8,{"開放時間":"8–10 分","固化":"24 小時","耐水":"D3"}],
].map(([id,kind,name,category,code,specification,unit,unitPrice,supplier,leadDays,stockQuantity,safetyStock,properties])=>({
  id:id as string,kind:kind as ResourceKind,name:name as string,category:category as string,code:code as string,
  specification:specification as string,unit:unit as string,unitPrice:unitPrice as number,supplier:supplier as string,
  leadDays:leadDays as number,stockQuantity:stockQuantity as number,safetyStock:safetyStock as number,
  properties:properties as Record<string,string>,source:"FEOS 採購與工程資料",effectiveDate:"2026-07-01",enabled:true,
}));
