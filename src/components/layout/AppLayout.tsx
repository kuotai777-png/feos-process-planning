"use client";
import Link from "next/link";
import {useState} from "react";

const items=[
  ["⌂","首頁總覽","#"],["▣","專案管理","#"],["☷","需求管理","/engineering-conditions"],
  ["⚙","AI 分析","/ai-decomposition"],["✎","人工修正","#"],["▤","AI 複驗","#"],["▧","分析報告","#"],
  ["▦","加工流程規劃","/"],["▥","製程文件","#"],["▤","生產排程","#"],["▦","設備管理","#"],
  ["▥","知識庫","#"],["▥","數據統計","#"],["⚙","系統設定","#"],
] as const;

export function AppLayout({children,activeIndex=7,title="STEP 06 AI 加工流程規劃",project}:{children:React.ReactNode;activeIndex?:number;title?:string;project?:string}) {
  const [open,setOpen]=useState(false);
  return <div className="app-shell">
    <aside className={`sidebar ${open?"is-open":""}`}>
      <div className="brand"><span className="brand-text"><b>FEOS</b><small>Factory Engineering<br/>Optimization System</small></span></div>
      <nav className="side-nav" aria-label="主要導覽">{items.map(([icon,label,href],i)=><Link href={href} onClick={()=>setOpen(false)} className={`side-item ${i===activeIndex?"active":""}`} key={label}><span className="side-icon">{icon}</span><span>{label}</span><em>{[1,2,3,4,6,8,9,10,12,13].includes(i)?"⌄":""}</em></Link>)}</nav>
      <button className="side-collapse" onClick={()=>setOpen(false)} aria-label="收合選單">«</button>
    </aside>
    <div className="main-wrap">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={()=>setOpen(!open)} aria-label="開啟選單">☰</button>
        <div className="top-title"><span>☷</span> {title}</div>
        <div className="top-actions">{project&&<span className="project-chip">專案：{project}</span>}<button className="top-icon" aria-label="通知">♧<i>12</i></button><button className="top-icon" aria-label="說明">?</button><div className="user-meta"><b>王工程師</b><small>生產規劃部</small></div><span className="avatar">王</span></div>
      </header>
      {children}
    </div>
  </div>;
}
