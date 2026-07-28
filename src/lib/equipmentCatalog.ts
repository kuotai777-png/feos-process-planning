export type EquipmentStatus="運轉中"|"待機"|"保養中"|"異常"|"停用";
export type EquipmentAsset={id:string;code:string;name:string;category:string;location:string;status:EquipmentStatus;load:number;power:number;availableHours:number;capability:string;lastMaintenance:string;nextMaintenance:string;operator:string;alert:string;enabled:boolean};
export const defaultEquipmentAssets:EquipmentAsset[]=[
  ["cnc-01","CNC-01","CNC 加工中心 01","大型機台","A 棟加工區","運轉中",78,18.5,6.2,"三軸加工／最大 2440 × 1220 mm","2026-07-10","2026-08-10","陳工程師","",true],
  ["saw-01","SAW-01","精密裁板機 01","大型機台","A 棟裁切區","運轉中",65,12,7.1,"板材裁切／±0.5 mm","2026-07-05","2026-08-05","林技師","鋸片壽命剩餘 18%",true],
  ["drill-01","DRL-01","多軸鑽孔機","大型機台","A 棟加工區","待機",42,7.5,5.8,"32 軸／孔徑 3–35 mm","2026-07-18","2026-08-18","王技師","",true],
  ["sander-01","SND-01","寬帶砂光機","表面設備","B 棟表面區","運轉中",71,15,6.5,"寬度 1300 mm／粒度 80–320","2026-07-12","2026-08-12","張技師","集塵壓差偏高",true],
  ["press-01","PRS-01","油壓壓合機","組裝設備","B 棟組裝區","保養中",0,9,0,"最大壓力 80 噸","2026-07-28","2026-07-29","維修組","更換液壓油封",true],
  ["meter-01","QC-01","含水率檢測儀","檢測設備","品質實驗室","待機",10,.1,8,"木材含水率 5–40%","2026-06-30","2026-09-30","品保組","",true],
  ["drill-hand-01","PT-DR-01","充電式電鑽 A","電動工具","工具間 1","運轉中",55,.8,4.2,"18V／最大扭力 60 N·m","2026-07-20","2026-08-20","工具管理員","電池健康度 82%",true],
  ["router-hand-01","PT-RT-01","手持修邊機 A","電動工具","工具間 1","異常",0,1.2,0,"6 mm／30000 rpm","2026-07-02","2026-08-02","工具管理員","軸承異音，禁止領用",true],
].map(([id,code,name,category,location,status,load,power,availableHours,capability,lastMaintenance,nextMaintenance,operator,alert,enabled])=>({id,code,name,category,location,status,load,power,availableHours,capability,lastMaintenance,nextMaintenance,operator,alert,enabled} as EquipmentAsset));
