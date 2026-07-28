"use client";
import {FormEvent,useEffect,useMemo,useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import {useActiveProject} from "../../hooks/useActiveProject";
import {defaultProcessCosts,ProcessCost} from "../../lib/processCostStore";

const connectors=[
  {icon:"◎",name:"國際標準資料庫",detail:"ISO、ASTM、EN 製造與材料標準",status:"已串連",tone:"blue"},
  {icon:"▣",name:"國家標準與法規",detail:"CNS、JIS 與官方安全法規",status:"已串連",tone:"blue"},
  {icon:"AI",name:"AI 搜索引擎",detail:"依專案需求搜尋可信工程資料",status:"可使用",tone:"green"},
  {icon:"◈",name:"產業研究報告",detail:"產業白皮書、技術與市場研究",status:"3 個來源",tone:"green"},
  {icon:"⌂",name:"公司內部知識庫",detail:"歷史案例、SOP、設備與報價資料",status:"持續更新",tone:"amber"},
  {icon:"✓",name:"人工審核資料",detail:"工程人員補充、確認與註記的依據",status:"可新增",tone:"green"},
];
const records=[
  ["ISO 6789:2017","國際標準","手工具與扭矩要求","98%"],
  ["ASTM D5456-23","材料標準","木材加工與結構規範","95%"],
  ["木工產業技術報告 2025","產業研究","CNC 製程效率與成本","91%"],
  ["公司托盤製造案例庫","內部知識","歷史流程、工時與良率","89%"],
];
const emptyRate:ProcessCost={id:"",processName:"",aliases:[],category:"機械加工",equipment:"",setupCost:0,unitCost:0,minuteCost:0,laborCost:0,estimatedMinutes:0,source:"人工建檔",effectiveDate:new Date().toISOString().slice(0,10),enabled:true};

export default function KnowledgeConnectors(){
  const project=useActiveProject();
  const [search,setSearch]=useState("托盤 木材加工 材料標準 CNC 製程成本");
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(true);
  const [rates,setRates]=useState<ProcessCost[]>(defaultProcessCosts);
  const [rateSearch,setRateSearch]=useState("");
  const [editing,setEditing]=useState<ProcessCost|null>(null);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");

  useEffect(()=>{fetch("/api/process-costs").then(r=>r.ok?r.json():Promise.reject()).then(setRates).catch(()=>setNotice("目前顯示內建費率，雲端資料同步後會自動更新。"))},[]);
  const filtered=useMemo(()=>rates.filter(rate=>`${rate.processName}${rate.aliases.join("")}${rate.category}${rate.equipment}`.toLowerCase().includes(rateSearch.toLowerCase())),[rates,rateSearch]);
  const run=()=>{setRunning(true);setDone(false);window.setTimeout(()=>{setRunning(false);setDone(true)},1400)};
  const saveRate=async(e:FormEvent)=>{
    e.preventDefault();if(!editing)return;setSaving(true);
    const item={...editing,id:editing.id||crypto.randomUUID()};
    const exists=rates.some(rate=>rate.id===item.id);
    try{
      const response=await fetch("/api/process-costs",{method:exists?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(item)});
      if(!response.ok)throw new Error();
      setRates(current=>exists?current.map(rate=>rate.id===item.id?item:rate):[...current,item]);
      setEditing(null);setNotice(`「${item.processName}」費率已儲存，成本估算將立即採用。`);
    }catch{setNotice("費率暫時無法儲存，請稍後再試。")}finally{setSaving(false)}
  };
  const removeRate=async(rate:ProcessCost)=>{
    if(!window.confirm(`確定刪除「${rate.processName}」費率？使用此工序的流程將顯示缺少費率。`))return;
    const response=await fetch(`/api/process-costs?id=${encodeURIComponent(rate.id)}`,{method:"DELETE"});
    if(response.ok){setRates(current=>current.filter(item=>item.id!==rate.id));setNotice(`已刪除「${rate.processName}」。`)}
  };
  const updateLocal=(id:string,patch:Partial<ProcessCost>)=>{
    const item=rates.find(rate=>rate.id===id);if(!item)return;
    const next={...item,...patch};setRates(current=>current.map(rate=>rate.id===id?next:rate));
    fetch("/api/process-costs",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(next)}).catch(()=>{});
  };

  return <AppLayout activeIndex={11} title="知識庫與工序費用中心" project={`${project.name} ${project.id}`}>
    <main className="knowledge-page">
      <header className="knowledge-hero"><div><span className="panel-kicker">KNOWLEDGE & COST DATA HUB</span><h1>製造知識、證據與工序費用資料庫</h1><p>集中管理 AI 分析依據與每一道製造工序費率，提供專案流程成本即時計算與後續擴充。</p></div><span className="evidence-health">● {done?"資料來源正常":"正在更新資料"}</span></header>
      <section className="connector-grid">{connectors.map(c=><article className="connector-card" key={c.name}><span className={`connector-icon ${c.tone}`}>{c.icon}</span><div><h2>{c.name}</h2><p>{c.detail}</p></div><button>{c.status}</button></article>)}</section>

      <section className="cost-database panel-surface">
        <div className="cost-db-heading"><div><span className="panel-kicker">PROCESS COST DATABASE</span><h2>製造工序費用資料庫</h2><p>計算公式：設定費＋單件費 × 數量＋每分鐘費 × 標準工時＋人工費</p></div><button className="btn btn-primary" onClick={()=>setEditing({...emptyRate})}>＋ 新增工序費率</button></div>
        <div className="cost-db-summary"><div><span>工序總數</span><b>{rates.length}</b></div><div><span>啟用中</span><b>{rates.filter(r=>r.enabled).length}</b></div><div><span>資料分類</span><b>{new Set(rates.map(r=>r.category)).size}</b></div><label>搜尋工序、設備或分類<input value={rateSearch} onChange={e=>setRateSearch(e.target.value)} placeholder="例如：CNC、表面處理"/></label></div>
        {notice&&<div className="cost-db-notice" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
        <div className="cost-table-wrap"><table className="cost-table"><thead><tr><th>狀態</th><th>工序／分類</th><th>設備</th><th>設定費</th><th>單件費</th><th>每分鐘費</th><th>人工費</th><th>標準工時</th><th>生效日／來源</th><th>操作</th></tr></thead><tbody>{filtered.map(rate=><tr key={rate.id} className={rate.enabled?"":"disabled"}><td><button className={`rate-toggle ${rate.enabled?"on":""}`} onClick={()=>updateLocal(rate.id,{enabled:!rate.enabled})}>{rate.enabled?"啟用":"停用"}</button></td><td><b>{rate.processName}</b><small>{rate.category} · 別名：{rate.aliases.join("、")||"—"}</small></td><td>{rate.equipment}</td><td>NT$ {rate.setupCost.toLocaleString()}</td><td>NT$ {rate.unitCost.toLocaleString()}</td><td>NT$ {rate.minuteCost.toLocaleString()}</td><td>NT$ {rate.laborCost.toLocaleString()}</td><td>{rate.estimatedMinutes} 分</td><td>{rate.effectiveDate}<small>{rate.source}</small></td><td><div className="rate-actions"><button onClick={()=>setEditing({...rate})}>編修</button><button className="danger" onClick={()=>removeRate(rate)}>刪除</button></div></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty-rates">找不到符合條件的工序，可直接新增新的工序費率。</div>}</div>
        <footer className="cost-db-foot"><span>● AI 分解與製造流程會自動依工序名稱或別名匹配此資料庫。</span><span>缺少費率的工序不會套用猜測值，系統會要求補建。</span></footer>
      </section>

      <div className="research-workspace">
        <section className="research-query panel-surface"><div className="optimization-heading"><div><span className="panel-kicker">AI ASSISTED RESEARCH</span><h2>AI 搜索與人工協助</h2></div></div><label>研究問題<textarea value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="research-options">{["國際標準","材料規範","學術研究","專利資料","產業報告","內部案例"].map(x=><label key={x}><input type="checkbox" defaultChecked/>{x}</label>)}</div><button className="btn btn-primary" onClick={run} disabled={running}>{running?"AI 正在搜尋與比對…":"開始 AI 證據搜索"}</button><div className="human-assist"><b>人工協助入口</b><p>工程人員可補充實務資料、報價依據、設備能力與審查註記，加入 AI 複驗來源。</p><button className="btn btn-secondary">＋ 新增人工資料</button></div></section>
        <section className="research-results panel-surface"><div className="optimization-heading"><div><span className="panel-kicker">VERIFIED SOURCES</span><h2>已驗證參考依據</h2></div><span>{records.length} 筆</span></div><div className="evidence-records">{records.map(([title,type,detail,match])=><article key={title}><span>✓</span><div><h3>{title}</h3><p>{type} · {detail}</p></div><b>{match}</b><button>查看</button></article>)}</div><div className="research-audit"><b>可追溯驗證紀錄</b><span>保留來源、版本、人工修正與 AI 使用紀錄，供複驗與稽核。</span></div></section>
      </div>
    </main>
    {editing&&<div className="modal-backdrop"><form className="rate-modal" onSubmit={saveRate}><header><div><span className="panel-kicker">PROCESS COST</span><h2>{editing.id?"編修":"新增"}工序費率</h2></div><button type="button" onClick={()=>setEditing(null)}>×</button></header><div className="rate-form-grid">
      <label>工序名稱<input required value={editing.processName} onChange={e=>setEditing({...editing,processName:e.target.value})}/></label>
      <label>分類<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}>{["前置作業","機械加工","組裝","表面處理","品質檢驗","包裝物流","其他"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="wide">搜尋別名（以頓號分隔）<input value={editing.aliases.join("、")} onChange={e=>setEditing({...editing,aliases:e.target.value.split(/[、,]/).map(x=>x.trim()).filter(Boolean)})}/></label>
      <label className="wide">使用設備<input required value={editing.equipment} onChange={e=>setEditing({...editing,equipment:e.target.value})}/></label>
      {([["設定費","setupCost"],["單件費","unitCost"],["每分鐘費","minuteCost"],["人工費","laborCost"],["標準工時（分鐘）","estimatedMinutes"]] as const).map(([label,key])=><label key={key}>{label}<input type="number" min="0" required value={editing[key]} onChange={e=>setEditing({...editing,[key]:Number(e.target.value)})}/></label>)}
      <label>生效日期<input type="date" required value={editing.effectiveDate} onChange={e=>setEditing({...editing,effectiveDate:e.target.value})}/></label>
      <label className="wide">費率來源<input required value={editing.source} onChange={e=>setEditing({...editing,source:e.target.value})}/></label>
    </div><footer><label className="enabled-check"><input type="checkbox" checked={editing.enabled} onChange={e=>setEditing({...editing,enabled:e.target.checked})}/>立即啟用</label><div><button type="button" className="btn btn-secondary" onClick={()=>setEditing(null)}>取消</button><button className="btn btn-primary" disabled={saving}>{saving?"儲存中…":"儲存費率"}</button></div></footer></form></div>}
  </AppLayout>
}
