export type ProcessCost = {
  id: string;
  processName: string;
  aliases: string[];
  category: string;
  equipment: string;
  setupCost: number;
  unitCost: number;
  minuteCost: number;
  laborCost: number;
  estimatedMinutes: number;
  source: string;
  effectiveDate: string;
  enabled: boolean;
};

export const defaultProcessCosts: ProcessCost[] = [
  ["material-prep","備料",["材料準備"],"前置作業","備料工作站",180,12,8,120,20],
  ["nesting","板材最佳化排版",["排版","板材排版"],"前置作業","排版軟體",220,8,12,90,15],
  ["cutting","裁切",["鋸切","切割"],"機械加工","精密裁板機",260,18,15,140,25],
  ["cnc","CNC 加工",["CNC","數控加工"],"機械加工","CNC 加工中心",480,45,32,180,35],
  ["drilling","鑽孔",["鉆孔"],"機械加工","多軸鑽孔機",220,16,18,130,18],
  ["chamfering","倒角",["修邊"],"機械加工","修邊機",160,10,12,110,15],
  ["pressing","壓合固定",["壓合"],"組裝","油壓壓合機",280,20,14,140,25],
  ["assembly","組裝",["裝配"],"組裝","組裝工作站",320,28,10,260,40],
  ["sanding","砂磨",["研磨","打磨"],"表面處理","寬帶砂光機",210,16,16,150,25],
  ["surface","表面處理",["塗裝","噴塗"],"表面處理","塗裝線",420,35,22,190,45],
  ["moisture","含水率檢測",["含水檢測"],"品質檢驗","含水率計",80,6,5,75,8],
  ["dimension","尺寸檢驗",["尺寸檢測"],"品質檢驗","量測工作站",90,8,6,85,10],
  ["load-test","承載測試",["負載測試"],"品質檢驗","承載試驗機",360,20,18,160,30],
  ["quality","品質檢驗",["品檢","檢驗"],"品質檢驗","品質檢驗站",140,12,8,110,15],
  ["barcode","條碼標示",["貼標"],"包裝物流","條碼列印機",70,5,4,65,6],
  ["packaging","包裝",["裝箱"],"包裝物流","包裝工作站",150,18,7,105,18],
].map(([id,processName,aliases,category,equipment,setupCost,unitCost,minuteCost,laborCost,estimatedMinutes])=>({
  id:id as string,
  processName:processName as string,
  aliases:aliases as string[],
  category:category as string,
  equipment:equipment as string,
  setupCost:setupCost as number,
  unitCost:unitCost as number,
  minuteCost:minuteCost as number,
  laborCost:laborCost as number,
  estimatedMinutes:estimatedMinutes as number,
  source:"FEOS 標準工序費率",
  effectiveDate:"2026-07-01",
  enabled:true,
}));

export function findProcessCost(step: string, rates: ProcessCost[]) {
  const normalized=step.replace(/\s+/g,"").toLowerCase();
  return rates.find(rate=>rate.enabled&&[rate.processName,...rate.aliases].some(name=>{
    const key=name.replace(/\s+/g,"").toLowerCase();
    return normalized.includes(key)||key.includes(normalized);
  }));
}

export function calculateProcessCost(rate: ProcessCost, quantity: number) {
  return rate.setupCost+(rate.unitCost*Math.max(1,quantity))+(rate.minuteCost*rate.estimatedMinutes)+rate.laborCost;
}
