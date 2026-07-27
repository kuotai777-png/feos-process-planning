export const processPlans = [
  { id:"A", name:"現有設備優化", cp:92, recommended:true, quality:100, efficiency:80, fit:95, confidence:96 },
  { id:"B", name:"加工順序調整", cp:88, recommended:false, quality:80, efficiency:80, fit:90, confidence:93 },
  { id:"C", name:"新增設備導入", cp:81, recommended:false, quality:100, efficiency:80, fit:82, confidence:90 },
] as const;

export const solutions = [
  { title:"使用現有設備生產", cost:"低", time:"低", quality:"穩定", risk:"低風險", desc:"利用現有設備進行生產，無需額外投資，成本最低。" },
  { title:"調整加工順序", cost:"中", time:"中", quality:"穩定", risk:"中風險", desc:"調整工序順序，提升效率，但需重新安排人力與排程。" },
  { title:"到銀湖加工", cost:"中高", time:"中", quality:"穩定", risk:"中風險", desc:"利用不同設備協同加工，提升效率並增加設備切換成本。" },
  { title:"委外部分製程", cost:"高", time:"高", quality:"穩定", risk:"高風險", desc:"將部分工序委外，降低設備負載，但增加溝通與管理成本。" },
] as const;
