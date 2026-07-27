"use client";
import {useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";

const goals=["降低材料成本","減少加工工時","降低換刀次數","降低加工次數","降低搬運次數","提高材料利用率","提高良率","提高組裝便利性","降低人力需求","符合設備能力","符合交期"];
const flow=[["備料","材料檢查與含水率確認"],["板材最佳化排版","AI 套料，優先使用餘料"],["裁切","自動裁板機批次裁切"],["CNC 加工","集中完成輪廓與槽位"],["鑽孔","自動定位一次完成"],["倒角","同刀具批次倒角"],["組裝","治具定位後螺釘固定"],["表面處理","砂磨、防霉處理"],["品質檢驗","尺寸、外觀與承載抽驗"],["包裝","標示批次並入庫"]];
const metrics=[
  ["材料利用率","87.6%","▲ +12.4%","good"],["加工時間","6.8 小時","▼ -18%","good"],["加工成本","NT$ 2,420","▼ -15%","good"],
  ["搬運次數","7 次","▼ -4 次","good"],["換刀次數","5 次","▼ -3 次","good"],["預估良率","98.2%","▲ +3.7%","good"],
  ["人力需求","2.5 人","▼ -1 人","good"],["預估交期","12 天","提前 2 天","good"],
];
export default function AiOptimization(){
  const [selected,setSelected]=useState(goals);
  const [running,setRunning]=useState(false);
  const [version,setVersion]=useState(3);
  const [toast,setToast]=useState("");
  const toggle=(g:string)=>setSelected(s=>s.includes(g)?s.filter(x=>x!==g):[...s,g]);
  const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(""),2200)};
  const optimize=()=>{setRunning(true);window.setTimeout(()=>{setRunning(false);setVersion(v=>v+1);notify("AI 已完成重新最佳化")},1500)};
  return <AppLayout activeIndex={6} title="STEP 05 AI 最佳化加工規劃" project="托盤 NEW-001">
    <main className="optimization-page">
      <div className="optimization-summary"><div><span>最佳化版本</span><b>V{version}.0</b></div><div><span>選定目標</span><b>{selected.length} / {goals.length}</b></div><div><span>綜合改善指數</span><b className="score">91.8</b></div><span className="optimization-status">● AI 最佳方案</span></div>
      <section className="optimization-goals panel-surface"><div className="optimization-heading"><div><span className="panel-kicker">OPTIMIZATION OBJECTIVES</span><h1>AI 最佳化目標</h1></div><button onClick={()=>setSelected(selected.length===goals.length?[]:goals)}>{selected.length===goals.length?"取消全選":"全部選取"}</button></div><div className="goal-grid">{goals.map((g,i)=><label className={selected.includes(g)?"selected":""} key={g}><input type="checkbox" checked={selected.includes(g)} onChange={()=>toggle(g)}/><span>{["＄","◷","⌁","⚙","⇄","▦","✓","⌘","♙","▣","▤"][i]}</span><b>{g}</b><em>{selected.includes(g)?"✓":""}</em></label>)}</div></section>
      <div className="optimization-grid">
        <section className="process-recommendation panel-surface"><div className="optimization-heading"><div><span className="panel-kicker">RECOMMENDED PROCESS</span><h2>AI 建議最佳加工流程</h2></div><span className="revision-badge">10 道工序</span></div><div className="optimized-flow">{flow.map(([name,note],i)=><div key={name}><span>{String(i+1).padStart(2,"0")}</span><i/><p><b>{name}</b><small>{note}</small></p>{i<flow.length-1&&<em>↓</em>}</div>)}</div></section>
        <section className="optimization-results panel-surface"><div className="optimization-heading"><div><span className="panel-kicker">OPTIMIZATION IMPACT</span><h2>AI 最佳化結果</h2></div><span className="ai-result-tag">可信度 94%</span></div>{running?<div className="optimization-loading"><i/><h3>AI 正在重新計算最佳方案…</h3><p>同時評估材料、設備、工時、成本與交期</p></div>:<><div className="metric-cards">{metrics.map(([name,value,delta,tone])=><div key={name}><span>{name}</span><b>{value}</b><em className={tone}>{delta}</em><div><i style={{width:name==="材料利用率"?"88%":name==="預估良率"?"98%":"74%"}}/></div></div>)}</div><div className="optimization-callout"><span>✦</span><div><b>AI 建議摘要</b><p>採用集中加工與板材最佳化排版，可降低換刀與搬運次數；現有設備能力足以完成，預估製造成本為 <strong>NT$ 2,420／件</strong>。</p></div></div></>}</section>
      </div>
    </main>
    <footer className="conditions-footer"><span>最佳化結果將作為加工流程規劃依據</span><div><button className="btn btn-secondary" onClick={optimize} disabled={running}>↻ 重新最佳化</button><button className="btn btn-outline" onClick={()=>notify("最佳加工流程已確認")}>✓ 確認流程</button><button className="btn btn-primary" onClick={()=>notify("已準備進入下一步")}>下一步 →</button></div></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
  </AppLayout>;
}
