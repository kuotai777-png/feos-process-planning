"use client";
import {useEffect,useMemo,useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import {useActiveProject} from "../../hooks/useActiveProject";
import {projectKey} from "../../lib/projectStore";
import {HeaderInfo} from "../../components/process-planning/HeaderInfo";
import {ProcessPlanCard} from "../../components/process-planning/ProcessPlanCard";
import {EquipmentAnalysisCard} from "../../components/process-planning/EquipmentAnalysisCard";
import {OrderLoadChart} from "../../components/process-planning/OrderLoadChart";
import {SolutionComparisonTable} from "../../components/process-planning/SolutionComparisonTable";
import {HumanDecisionPanel} from "../../components/process-planning/HumanDecisionPanel";
import {FooterAction} from "../../components/process-planning/FooterAction";
import {processPlans} from "../../mock/processPlan";
const profiles={A:{name:"現有設備優化",cost:4173,hours:8.6,yield:96.2,carbon:18.4,fit:95,delivery:"2026/07/28",bottleneck:"CNC 加工中心 01",risk:"低",flow:"備料 → 排版 → 裁切 → CNC → 鑽孔 → 組裝 → 砂磨 → 品檢 → 包裝"},B:{name:"加工順序調整",cost:3890,hours:7.4,yield:95.6,carbon:16.8,fit:90,delivery:"2026/07/27",bottleneck:"多軸鑽孔機",risk:"中",flow:"備料 → 排版 → 裁切 → 鑽孔 → CNC → 砂磨 → 組裝 → 品檢 → 包裝"},C:{name:"新增設備導入",cost:4520,hours:5.9,yield:98.1,carbon:15.2,fit:82,delivery:"2026/08/05",bottleneck:"自動裁切設備到位",risk:"中高",flow:"備料 → 自動排版裁切 → CNC → 自動鑽孔 → 組裝 → 表面處理 → 自動品檢 → 包裝"}} as const;
const Section=({index,title,note,children}:{index:string;title:string;note?:string;children:React.ReactNode})=><section className="section"><div className="section-head"><h2 className="section-title"><span className="section-index">{index}、</span>{title}</h2>{note&&<span className="section-note">（{note}）</span>}</div>{children}</section>;
export default function Step06(){
  const project=useActiveProject();const[selectedId,setSelectedId]=useState<keyof typeof profiles>("A");const[toast,setToast]=useState("");
  useEffect(()=>{const saved=localStorage.getItem(projectKey(project.id,"selected-plan"));if(saved&&saved in profiles)setSelectedId(saved as keyof typeof profiles)},[project.id]);
  const profile=profiles[selectedId];
  const decisionText=`採用方案 ${selectedId}（${profile.name}）`;
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),2200)};
  const choose=(id:string)=>{if(!(id in profiles)){notify("自訂方案需先在分析報告建立後再導入");return}setSelectedId(id as keyof typeof profiles);localStorage.setItem(projectKey(project.id,"selected-plan"),id);notify(`已切換方案 ${id}，設備、排程、成本與風險已同步更新`)};
  const delta=useMemo(()=>({cost:profile.cost-profiles.A.cost,carbon:profile.carbon-profiles.A.carbon,hours:profile.hours-profiles.A.hours}),[profile]);
  return <AppLayout project={`${project.name} ${project.id}`}><main className="page"><HeaderInfo/><div className="planning-live-context"><header><div><span>目前選擇方案</span><b>方案 {selectedId}｜{profile.name}</b></div><em>跨區即時連動</em></header><div><span>成本<b>NT$ {profile.cost.toLocaleString()}</b><small>{delta.cost===0?"基準方案":`${delta.cost>0?"▲":"▼"} ${Math.abs(delta.cost)}`}</small></span><span>工時<b>{profile.hours} 小時</b><small>{delta.hours===0?"基準方案":`${delta.hours>0?"▲":"▼"} ${Math.abs(delta.hours).toFixed(1)}`}</small></span><span>良率<b>{profile.yield}%</b></span><span>排碳<b>{profile.carbon} kgCO₂e</b><small>{delta.carbon===0?"基準方案":`${delta.carbon>0?"▲":"▼"} ${Math.abs(delta.carbon).toFixed(1)}`}</small></span><span>設備適配<b>{profile.fit}%</b></span><span>預估交期<b>{profile.delivery}</b></span><span>主要瓶頸<b>{profile.bottleneck}</b></span><span>方案風險<b className={profile.risk==="低"?"ok":"warn"}>{profile.risk}</b></span></div><p>{profile.flow}</p></div><Section index="一" title="流程方案分析" note="選擇卡片會同步更新本頁所有區域"><div className="plan-grid">{processPlans.map(plan=><ProcessPlanCard plan={plan} selected={selectedId===plan.id} onSelect={()=>choose(plan.id)} key={plan.id}/>)}</div><div className="formula-note">ⓘ CP 值計算：綜合成本、品質、效率、設備適配率與風險等因素加權計算（滿分 100）</div></Section><div className="analysis-pair"><Section index="二" title="目前工廠設備分析"><EquipmentAnalysisCard planId={selectedId}/></Section><Section index="三" title="目前訂單分析"><OrderLoadChart planId={selectedId}/></Section></div><Section index="四" title="解決方案比較" note="與上方方案選擇共用同一狀態"><SolutionComparisonTable selectedId={selectedId} onSelect={choose}/></Section><Section index="五" title="人工決策"><HumanDecisionPanel selected={decisionText} onSelect={value=>choose(value.match(/方案 ([ABC])/)?.[1]??"custom")}/></Section></main><FooterAction onSave={()=>{localStorage.setItem(projectKey(project.id,"selected-plan"),selectedId);notify(`方案 ${selectedId} 與即時評估結果已保存`)}} onConfirm={()=>notify(`已確認方案 ${selectedId}：${profile.name}，可導入訂單`)}/>{toast&&<div className="toast" role="status">{toast}</div>}</AppLayout>
}
