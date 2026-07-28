"use client";
import {useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import {useActiveProject} from "../../hooks/useActiveProject";
import {HeaderInfo} from "../../components/process-planning/HeaderInfo";
import {ProcessPlanCard} from "../../components/process-planning/ProcessPlanCard";
import {EquipmentAnalysisCard} from "../../components/process-planning/EquipmentAnalysisCard";
import {OrderLoadChart} from "../../components/process-planning/OrderLoadChart";
import {SolutionComparisonTable} from "../../components/process-planning/SolutionComparisonTable";
import {HumanDecisionPanel} from "../../components/process-planning/HumanDecisionPanel";
import {FooterAction} from "../../components/process-planning/FooterAction";
import {processPlans} from "../../mock/processPlan";
const Section=({index,title,note,children}:{index:string,title:string,note?:string,children:React.ReactNode})=><section className="section"><div className="section-head"><h2 className="section-title"><span className="section-index">{index}、</span>{title}</h2>{note&&<span className="section-note">（{note}）</span>}</div>{children}</section>;
export default function Step06(){const project=useActiveProject();const[selected,setSelected]=useState("採用方案 A（現有設備優化）");const[toast,setToast]=useState("");const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),2200)};return <AppLayout project={`${project.name} ${project.id}`}><main className="page"><HeaderInfo/><Section index="一" title="流程方案分析" note="AI 依據證據與數據提出多種加工流程方案"><div className="plan-grid">{processPlans.map(p=><ProcessPlanCard plan={p} key={p.id}/>)}</div><div className="formula-note">ⓘ CP 值計算：綜合成本、品質、效率、設備適配率與風險等因素加權計算（滿分 100）</div></Section><div className="analysis-pair"><Section index="二" title="目前工廠設備分析"><EquipmentAnalysisCard/></Section><Section index="三" title="目前訂單分析"><OrderLoadChart/></Section></div><Section index="四" title="解決方案比較"><SolutionComparisonTable/></Section><Section index="五" title="人工決策"><HumanDecisionPanel selected={selected} onSelect={setSelected}/></Section></main><FooterAction onSave={()=>notify("分析結果已保存")} onConfirm={()=>notify(`已確認：${selected}`)}/>{toast&&<div className="toast" role="status">{toast}</div>}</AppLayout>}
