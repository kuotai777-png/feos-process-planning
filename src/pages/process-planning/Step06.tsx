"use client";
import { useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { HeaderInfo } from "../../components/process-planning/HeaderInfo";
import { ProcessPlanCard } from "../../components/process-planning/ProcessPlanCard";
import { EquipmentAnalysisCard } from "../../components/process-planning/EquipmentAnalysisCard";
import { OrderLoadChart } from "../../components/process-planning/OrderLoadChart";
import { SolutionComparisonTable } from "../../components/process-planning/SolutionComparisonTable";
import { KnowledgeLibraryCard } from "../../components/process-planning/KnowledgeLibraryCard";
import { HumanDecisionPanel } from "../../components/process-planning/HumanDecisionPanel";
import { FooterAction } from "../../components/process-planning/FooterAction";
import { processPlans } from "../../mock/processPlan";

const Section = ({index,title,note,children}:{index:string,title:string,note?:string,children:React.ReactNode}) =>
  <section className="section"><div className="section-head"><h2 className="section-title"><span className="section-index">{index}</span>{title}</h2>{note&&<span className="section-note">{note}</span>}</div>{children}</section>;

export default function Step06() {
  const [selected,setSelected]=useState("採用方案 A");
  const [saved,setSaved]=useState(false);
  const save=()=>{setSaved(true);window.setTimeout(()=>setSaved(false),2200)};
  return <AppLayout>
    <main className="page">
      <HeaderInfo/>
      <Section index="01" title="多種加工流程方案" note="AI 已根據成本、品質與設備條件產生 3 組方案">
        <div className="plan-grid">{processPlans.map(p=><ProcessPlanCard plan={p} key={p.id}/>)}</div>
      </Section>
      <Section index="02" title="現有設備適配分析" note="設備資料更新於 5 分鐘前"><EquipmentAnalysisCard/></Section>
      <Section index="03" title="目前訂單與設備負載" note="排程區間 2026/08/10–08/16"><OrderLoadChart/></Section>
      <Section index="04" title="解決方案比較"><SolutionComparisonTable/></Section>
      <Section index="05" title="企業知識庫引用" note="共引用 159 筆可信資料"><KnowledgeLibraryCard/></Section>
      <Section index="06" title="人工決策" note="請確認方案與知識回寫範圍"><HumanDecisionPanel selected={selected} onSelect={setSelected}/></Section>
    </main>
    <FooterAction onSave={save}/>
    {saved&&<div style={{position:"fixed",right:32,bottom:88,zIndex:50,padding:"11px 16px",borderRadius:10,background:"#0f172a",color:"#fff",fontSize:13,boxShadow:"0 8px 24px #0003"}}>✓ 草稿已儲存</div>}
  </AppLayout>;
}
