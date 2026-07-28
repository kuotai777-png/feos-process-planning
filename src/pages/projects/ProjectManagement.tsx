"use client";
import Link from "next/link";
import {FormEvent,useEffect,useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import {defaultProjects,FeosProject,getActiveProjectId,getProjects,saveProjects,setActiveProjectId} from "../../lib/projectStore";

export default function ProjectManagement(){
  const [projects,setProjects]=useState<FeosProject[]>(defaultProjects);
  const [active,setActive]=useState(defaultProjects[0].id);
  const [showForm,setShowForm]=useState(false);
  const [query,setQuery]=useState("");
  useEffect(()=>{setProjects(getProjects());setActive(getActiveProjectId())},[]);
  const select=(id:string)=>{setActive(id);setActiveProjectId(id)};
  const create=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const next:FeosProject={
      id:String(data.get("id")||`NEW-${String(projects.length+1).padStart(3,"0")}`),
      name:String(data.get("name")||"未命名專案"),
      customer:String(data.get("customer")||"未指定客戶"),
      product:String(data.get("product")||"未指定產品"),
      status:"草稿",updatedAt:new Date().toLocaleDateString("zh-TW"),
    };
    const list=[next,...projects];setProjects(list);saveProjects(list);select(next.id);setShowForm(false);
  };
  const filtered=projects.filter(p=>`${p.id}${p.name}${p.customer}${p.product}`.toLowerCase().includes(query.toLowerCase()));
  const current=projects.find(p=>p.id===active)??projects[0];
  return <AppLayout activeIndex={1} title="專案管理" project={current?`${current.name} ${current.id}`:undefined}>
    <main className="project-page">
      <header className="project-hero"><div><span className="panel-kicker">PROJECT WORKSPACE</span><h1>專案中心</h1><p>每個專案獨立保存產品照片、工程條件、AI 分析、人工修正與複驗證據。</p></div><button className="btn btn-primary" onClick={()=>setShowForm(true)}>＋ 建立新專案</button></header>
      <div className="project-toolbar"><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋專案代碼、客戶或產品"/></label><span>共 {projects.length} 個專案</span></div>
      <div className="project-grid">{filtered.map(project=><article className={`project-card ${active===project.id?"selected":""}`} key={project.id}>
        <div className="project-card-head"><span>{project.id}</span><em>{project.status}</em></div>
        <h2>{project.name}</h2><p>{project.product}</p>
        <dl><div><dt>客戶</dt><dd>{project.customer}</dd></div><div><dt>最後更新</dt><dd>{project.updatedAt}</dd></div></dl>
        <div className="project-progress"><span style={{width:project.status==="AI 分析中"?"52%":project.status==="工程條件設定"?"30%":"12%"}}/></div>
        <div className="project-actions"><button className="btn btn-secondary" onClick={()=>select(project.id)}>{active===project.id?"✓ 目前專案":"切換專案"}</button><Link className="btn btn-primary" href="/engineering-conditions" onClick={()=>select(project.id)}>開啟專案 →</Link></div>
      </article>)}</div>
      {showForm&&<div className="modal-backdrop" onClick={()=>setShowForm(false)}><form className="project-modal" onSubmit={create} onClick={e=>e.stopPropagation()}><div><h2>建立新專案</h2><button type="button" onClick={()=>setShowForm(false)}>×</button></div><label>專案代碼<input name="id" placeholder="例如 NEW-004" required/></label><label>專案名稱<input name="name" placeholder="例如 客製木箱" required/></label><label>客戶名稱<input name="customer" required/></label><label>產品類別<input name="product" required/></label><footer><button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>取消</button><button className="btn btn-primary">建立並切換</button></footer></form></div>}
    </main>
  </AppLayout>
}

