"use client";
import {useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import {useActiveProject} from "../../hooks/useActiveProject";

const connectors=[
  {icon:"◎",name:"國際標準資料庫",detail:"ISO／ASTM／EN 標準索引",status:"可設定",tone:"blue"},
  {icon:"▤",name:"國家標準與法規",detail:"CNS／JIS／職安與環境法規",status:"可設定",tone:"blue"},
  {icon:"⌕",name:"AI 網路研究",detail:"受控搜尋、來源追蹤與引用保存",status:"已啟用",tone:"green"},
  {icon:"▥",name:"產業研究報告",detail:"白皮書、產業趨勢與技術報告",status:"3 個來源",tone:"green"},
  {icon:"▣",name:"公司內部知識庫",detail:"歷史專案、SOP、設備手冊與案例",status:"待連接",tone:"amber"},
  {icon:"＋",name:"人工證據上傳",detail:"工程師上傳 PDF、圖片、試驗與說明",status:"可使用",tone:"green"},
];
const records=[
  ["ISO 6789:2017","國際標準","結構與承載測試","98%"],
  ["ASTM D5456-23","材料規範","結構複合木材","95%"],
  ["智慧木工製程應用指南 2025","產業報告","CNC 與自動化製程","91%"],
  ["托盤接合強度研究","學術研究","接合與疲勞壽命","89%"],
];

export default function KnowledgeConnectors(){
  const project=useActiveProject();
  const [search,setSearch]=useState("木製托盤 接合強度 材料規範 CNC 加工");
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(true);
  const run=()=>{setRunning(true);setDone(false);window.setTimeout(()=>{setRunning(false);setDone(true)},1600)};
  return <AppLayout activeIndex={11} title="AI 證據與資料串連中心" project={`${project.name} ${project.id}`}>
    <main className="knowledge-page">
      <header className="knowledge-hero"><div><span className="panel-kicker">AI RESEARCH & EVIDENCE HUB</span><h1>AI 搜索、人工協助與產業資料串連</h1><p>所有來源、人工判斷與 AI 引用均綁定目前專案，供 AI 分析及 AI 複驗共同使用。</p></div><span className="evidence-health">● {done?"證據索引正常":"正在更新索引"}</span></header>
      <section className="connector-grid">{connectors.map(c=><article className="connector-card" key={c.name}><span className={`connector-icon ${c.tone}`}>{c.icon}</span><div><h2>{c.name}</h2><p>{c.detail}</p></div><button>{c.status}</button></article>)}</section>
      <div className="research-workspace">
        <section className="research-query panel-surface"><div className="optimization-heading"><div><span className="panel-kicker">AI ASSISTED RESEARCH</span><h2>本專案研究任務</h2></div></div><label>研究問題<textarea value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="research-options">{["官方標準","材料規範","學術研究","專利資料","產業報告","內部知識庫"].map(x=><label key={x}><input type="checkbox" defaultChecked/>{x}</label>)}</div><button className="btn btn-primary" onClick={run} disabled={running}>{running?"AI 正在搜尋與比對…":"⌕ 啟動 AI 證據搜索"}</button><div className="human-assist"><b>人工協助區</b><p>工程師可補充現場經驗、試驗結果、供應商資料或指定必須採用的標準。</p><button className="btn btn-secondary">＋ 新增人工證據</button></div></section>
        <section className="research-results panel-surface"><div className="optimization-heading"><div><span className="panel-kicker">VERIFIED SOURCES</span><h2>已納入專案證據</h2></div><span>{records.length} 筆</span></div><div className="evidence-records">{records.map(([title,type,detail,match])=><article key={title}><span>▤</span><div><h3>{title}</h3><p>{type} · {detail}</p></div><b>{match}</b><button>查看</button></article>)}</div><div className="research-audit"><b>來源稽核紀錄</b><span>保留查詢時間、來源網址、版本、人工註記與 AI 引用段落</span></div></section>
      </div>
    </main>
  </AppLayout>
}

