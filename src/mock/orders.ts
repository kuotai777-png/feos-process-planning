export const orderSummary = { total:12, processing:6, waiting:4, scheduled:2 };
export const ganttRows = [
  { name:"CNC 加工中心 01", start:1, span:5, tone:"amber" },
  { name:"CNC 加工中心 02", start:3, span:3, tone:"" },
  { name:"自動裁板機", start:1, span:5, tone:"teal" },
  { name:"封邊機", start:1, span:4, tone:"" },
  { name:"鑽孔機", start:1, span:6, tone:"purple" },
  { name:"噴塗設備", start:2, span:4, tone:"" },
  { name:"砂光機", start:1, span:6, tone:"purple" },
] as const;
