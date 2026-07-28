"use client";
import {useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import Link from "next/link";
import {useActiveProject} from "../../hooks/useActiveProject";

const corrections=[
  {name:"修改尺寸",detail:"面板高度 150 → 145 mm"},
  {name:"修改材料",detail:"花旗松 → 歐洲赤松"},
  {name:"補充官方標準文件",detail:"新增 ISO 6789、CNS 2215"},
  {name:"修改加工方式",detail:"增加 CNC 倒角工序"},
  {name:"修改施工流程",detail:"砂磨移至組裝後執行"},
];
const sources=[
  ["國際標準","ISO / ASTM / EN","12 份"],["國家標準","CNS / JIS","8 份"],["官方法規","職安與環境規範","5 份"],
  ["材料規範","木材與黏著劑標準","9 份"],["設備技術手冊","CNC／裁板機","6 份"],["學術研究","期刊與研討會","14 份"],
  ["專利資料","結構與接合專利","7 份"],["產業技術報告","製造技術白皮書","11 份"],["市場產業趨勢","2025–2026 報告","4 份"],
  ["公司內部知識庫","案例與歷史製程","26 份"],
];
const results=[
  ["符合官方標準","ISO 6789、CNS 2215","通過"],["符合材料規範","替代材料強度符合要求","通過"],
  ["製造可行","現有設備可完成全部工序","通過"],["品質風險","低；需控管材料含水率","低風險"],
  ["成本影響","單件成本預估增加 1.8%","可接受"],["產業採用程度","同類工法採用率 82%","成熟"],
];
const references=[
  {code:"ISO 6789:2017",title:"木材結構與承載測試標準",type:"國際標準",match:98},
  {code:"ASTM D5456-23",title:"結構複合木材規範",type:"材料規範",match:95},
  {code:"CNS 2215",title:"木製品加工與品質規範",type:"國家標準",match:93},
  {code:"研究論文 A",title:"托盤接合強度與疲勞壽命研究",type:"學術研究",match:89},
  {code:"產業白皮書 B",title:"智慧木工製程應用指南 2025",type:"產業報告",match:87},
];

export default function ManualReview(){
  const project=useActiveProject();
  const [selected,setSelected]=useState(corrections.map(x=>x.name));
  const [reason,setReason]=useState("依現場設備加工範圍與材料庫存調整，並補充官方標準作為複驗依據。");
  const [reviewing,setReviewing]=useState(false);
  const [reviewed,setReviewed]=useState(true);
  const [openRefs,setOpenRefs]=useState(true);
  const [toast,setToast]=useState("");
  const toggle=(v:string)=>setSelected(s=>s.includes(v)?s.filter(x=>x!==v):[...s,v]);
  const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(""),2200)};
  const verify=()=>{setReviewing(true);setReviewed(false);window.setTimeout(()=>{setReviewing(false);setReviewed(true);notify("AI Evidence Verification 已完成")},1600)};
  return <AppLayout activeIndex={4} title="STEP 04 人工修正 / AI 複驗（Evidence Verification）" project={`${project.name} ${project.id}`}>
    <main className="evidence-page">
      <div className="evidence-statusbar">
        <div><span>修正版本</span><b>REV. 04</b></div><div><span>修正項目</span><b>{selected.length} 項</b></div>
        <div><span>驗證證據</span><b>{sources.reduce((sum,s)=>sum+Number(s[2].replace(" 份","")),0)} 份</b></div>
        <span className={`evidence-state ${reviewed?"passed":""}`}>{reviewing?"● AI 驗證中":"● 已完成複驗"}</span>
      </div>
      <div className="evidence-workspace">
        <section className="correction-panel">
          <div className="evidence-heading"><div><span className="panel-kicker">HUMAN CORRECTION</span><h1>人工修正後資料</h1></div><span className="revision-badge">工程師覆核</span></div>
          <div className="correction-list"><div className="evidence-section-title"><h2>修正內容</h2><span>選擇納入複驗的項目</span></div>{corrections.map(item=><label className={selected.includes(item.name)?"selected":""} key={item.name}><input type="checkbox" checked={selected.includes(item.name)} onChange={()=>toggle(item.name)}/><div><b>{item.name}</b><span>{item.detail}</span></div><em>{selected.includes(item.name)?"✓":""}</em></label>)}</div>
          <div className="reason-block"><div className="evidence-section-title"><h2>修正原因</h2><span>{reason.length} / 300</span></div><textarea maxLength={300} value={reason} onChange={e=>setReason(e.target.value)} placeholder="輸入工程判斷、現場限制或修改依據…"/></div>
          <div className="correction-summary"><b>本次複驗範圍</b><div><span>結構尺寸</span><span>替代材料</span><span>加工工序</span><span>品質風險</span><span>成本影響</span></div><Link className="evidence-hub-link" href="/knowledge-connectors">開啟 AI 證據與資料串連中心 →</Link></div>
        </section>
        <section className={`evidence-verification ${reviewing?"reviewing":""}`}>
          <div className="evidence-heading"><div><span className="panel-kicker">EVIDENCE VERIFICATION</span><h2>AI 複驗結果</h2></div><span className={`verification-status ${reviewed?"passed":""}`}>{reviewing?"驗證中…":"✓ 驗證通過"}</span></div>
          {reviewing?<div className="evidence-loading"><i/><h3>AI 正在重新驗證…</h3><p>比對官方標準、材料規範、技術手冊與產業證據</p><div><span/><span/><span/></div></div>:<>
            <section className="source-section"><div className="evidence-section-title"><h3>驗證來源</h3><span>共 102 份證據</span></div><div className="source-grid">{sources.map(([name,detail,count])=><div key={name}><i>✓</i><p><b>{name}</b><span>{detail}</span></p><em>{count}</em></div>)}</div></section>
            <section className="result-section"><div className="evidence-section-title"><h3>驗證結果</h3><span>6 / 6 項通過</span></div><div className="result-grid">{results.map(([name,detail,status])=><div key={name}><i>✓</i><p><b>{name}</b><span>{detail}</span></p><em>{status}</em></div>)}</div></section>
            <section className="reference-section"><button onClick={()=>setOpenRefs(!openRefs)}><span><b>參考依據</b><small>可展開查看證據來源與匹配度</small></span><em>{openRefs?"收合 ↑":"展開 ↓"}</em></button>{openRefs&&<div className="reference-list">{references.map(ref=><div key={ref.code}><span className="ref-code">{ref.code}</span><p><b>{ref.title}</b><small>{ref.type}</small></p><div><b>{ref.match}%</b><span>匹配度</span></div></div>)}</div>}</section>
            <div className="evidence-confidence"><div><span>AI 信心水準</span><b>96%</b></div><div className="confidence-track"><i style={{width:"96%"}}/></div><p>高可信度 · 所有人工修正皆有充分證據支持，未發現標準或製造衝突。</p></div>
          </>}
        </section>
      </div>
    </main>
    <footer className="conditions-footer"><span>複驗結果與證據來源將保留於版本紀錄</span><div><button className="btn btn-secondary" onClick={()=>notify("可繼續修改左側資料")}>✎ 再次修正</button><button className="btn btn-outline" onClick={verify} disabled={reviewing}>✦ AI 再次複驗</button><button className="btn btn-primary" onClick={()=>notify("已確認並進入下一步")}>✓ 確認下一步</button></div></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
  </AppLayout>;
}
