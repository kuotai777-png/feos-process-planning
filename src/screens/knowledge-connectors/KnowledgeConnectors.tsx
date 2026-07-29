"use client";
import {FormEvent,useEffect,useMemo,useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import {useActiveProject} from "../../hooks/useActiveProject";
import {defaultProcessCosts,ProcessCost} from "../../lib/processCostStore";
import {defaultResourceCatalog,ResourceCatalogItem,ResourceKind} from "../../lib/resourceCatalog";

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
const newResource=(kind:ResourceKind):ResourceCatalogItem=>({id:"",kind,name:"",category:kind==="material"?"木質材料":"接合五金",code:"",specification:"",unit:kind==="material"?"片":"只",unitPrice:0,supplier:"",leadDays:0,stockQuantity:0,safetyStock:0,properties:{},source:"人工建檔",effectiveDate:new Date().toISOString().slice(0,10),enabled:true});

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
  const [resources,setResources]=useState<ResourceCatalogItem[]>(defaultResourceCatalog);
  const [library,setLibrary]=useState<ResourceKind|null>(null);
  const [resourceSearch,setResourceSearch]=useState("");
  const [resourceEditing,setResourceEditing]=useState<ResourceCatalogItem|null>(null);
  const [processLibrary,setProcessLibrary]=useState(false);

  useEffect(()=>{fetch("/api/process-costs").then(r=>r.ok?r.json():Promise.reject()).then(setRates).catch(()=>setNotice("目前顯示內建費率，雲端資料同步後會自動更新。"))},[]);
  useEffect(()=>{fetch("/api/resource-catalog").then(r=>r.ok?r.json():Promise.reject()).then(setResources).catch(()=>setNotice("材質與五金目前顯示內建資料，雲端同步後會自動更新。"))},[]);
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
  const saveResource=async(e:FormEvent)=>{
    e.preventDefault();if(!resourceEditing)return;setSaving(true);
    const item={...resourceEditing,id:resourceEditing.id||crypto.randomUUID()};
    const exists=resources.some(value=>value.id===item.id);
    try{
      const response=await fetch("/api/resource-catalog",{method:exists?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(item)});
      if(!response.ok)throw new Error();
      setResources(current=>exists?current.map(value=>value.id===item.id?item:value):[...current,item]);
      setResourceEditing(null);setNotice(`「${item.name}」已更新，其他頁面重新取得資料時將使用最新內容。`);
    }catch{setNotice("資料暫時無法儲存，請稍後再試。")}finally{setSaving(false)}
  };
  const deleteResource=async(item:ResourceCatalogItem)=>{
    if(!window.confirm(`確定刪除「${item.name}」？`))return;
    const response=await fetch(`/api/resource-catalog?id=${encodeURIComponent(item.id)}`,{method:"DELETE"});
    if(response.ok)setResources(current=>current.filter(value=>value.id!==item.id));
  };

  return <AppLayout activeIndex={11} title="知識庫與工序費用中心" project={`${project.name} ${project.id}`}>
    <main className="knowledge-page">
      <header className="knowledge-hero"><div><span className="panel-kicker">KNOWLEDGE & COST DATA HUB</span><h1>製造知識、證據與工序費用資料庫</h1><p>集中管理 AI 分析依據與每一道製造工序費率，提供專案流程成本即時計算與後續擴充。</p></div><span className="evidence-health">● {done?"資料來源正常":"正在更新資料"}</span></header>
      <section className="connector-grid">{connectors.map(c=><article className="connector-card" key={c.name}><span className={`connector-icon ${c.tone}`}>{c.icon}</span><div><h2>{c.name}</h2><p>{c.detail}</p></div><button>{c.status}</button></article>)}</section>

      <section className="shared-libraries">
        <div className="shared-library-heading"><div><span className="panel-kicker">SHARED MASTER DATA</span><h2>跨系統共用基礎資料</h2><p>主畫面保留摘要；詳細資料於側滑面板中搜尋、篩選與編修，避免資訊一次全部展開。</p></div><span>API 自動串接 · 即時更新</span></div>
        <div className="library-cards">
          <LibraryCard icon="⚙" title="製造工序費用資料庫" count={rates.length} categories={new Set(rates.map(x=>x.category)).size} warning={rates.filter(x=>!x.enabled).length} warningLabel="停用資料" detail="工序設定費、單件費、工時、人工費與設備資料" onOpen={()=>{setProcessLibrary(true);setRateSearch("")}}/>
          <LibraryCard icon="▰" title="材質資料庫" count={resources.filter(x=>x.kind==="material").length} categories={new Set(resources.filter(x=>x.kind==="material").map(x=>x.category)).size} warning={resources.filter(x=>x.kind==="material"&&x.stockQuantity<=x.safetyStock).length} detail="材料規格、價格、供應商、庫存與工程特性" onOpen={()=>{setLibrary("material");setResourceSearch("")}}/>
          <LibraryCard icon="⌘" title="五金與耗材資料庫" count={resources.filter(x=>x.kind==="hardware").length} categories={new Set(resources.filter(x=>x.kind==="hardware").map(x=>x.category)).size} warning={resources.filter(x=>x.kind==="hardware"&&x.stockQuantity<=x.safetyStock).length} detail="緊固件、接合件、功能五金與耗材資料" onOpen={()=>{setLibrary("hardware");setResourceSearch("")}}/>
          <article className="library-sync-card"><span>↻</span><div><b>系統共用串接</b><p>工程條件、AI 分解、流程規劃與成本估算皆可呼叫相同資料。</p></div><ul><li>名稱與規格自動帶入</li><li>單價與庫存即時取得</li><li>停用資料不再提供選用</li></ul></article>
        </div>
        {notice&&<div className="cost-db-notice" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
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
    {library&&<ResourceDrawer kind={library} items={resources.filter(item=>item.kind===library&&`${item.name}${item.code}${item.category}${item.specification}${item.supplier}`.toLowerCase().includes(resourceSearch.toLowerCase()))} search={resourceSearch} setSearch={setResourceSearch} onClose={()=>setLibrary(null)} onEdit={setResourceEditing} onAdd={()=>setResourceEditing(newResource(library))} onDelete={deleteResource}/>}
    {resourceEditing&&<ResourceEditor value={resourceEditing} setValue={setResourceEditing} onClose={()=>setResourceEditing(null)} onSubmit={saveResource} saving={saving}/>}
    {processLibrary&&<ProcessCostDrawer items={filtered} search={rateSearch} setSearch={setRateSearch} onClose={()=>setProcessLibrary(false)} onAdd={()=>setEditing({...emptyRate})} onEdit={rate=>setEditing({...rate})} onDelete={removeRate} onToggle={updateLocal}/>}
  </AppLayout>
}

function LibraryCard({icon,title,count,categories,warning,warningLabel="庫存示警",detail,onOpen}:{icon:string;title:string;count:number;categories:number;warning:number;warningLabel?:string;detail:string;onOpen:()=>void}){return <article className="library-card"><span>{icon}</span><div><h3>{title}</h3><p>{detail}</p><div><b>{count}<small>筆資料</small></b><b>{categories}<small>分類</small></b><b className={warning?"warn":""}>{warning}<small>{warningLabel}</small></b></div></div><button onClick={onOpen}>開啟管理 →</button></article>}

function ProcessCostDrawer({items,search,setSearch,onClose,onAdd,onEdit,onDelete,onToggle}:{items:ProcessCost[];search:string;setSearch:(v:string)=>void;onClose:()=>void;onAdd:()=>void;onEdit:(v:ProcessCost)=>void;onDelete:(v:ProcessCost)=>void;onToggle:(id:string,patch:Partial<ProcessCost>)=>void}){return <div className="catalog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="catalog-drawer process-drawer"><header><div><span className="panel-kicker">PROCESS COST DATABASE</span><h2>製造工序費用資料庫</h2></div><button onClick={onClose}>×</button></header><div className="catalog-tools"><label>⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋工序、分類、設備或別名"/></label><button className="btn btn-primary" onClick={onAdd}>＋ 新增工序費率</button></div><div className="process-cost-summary"><span>費用公式</span><b>設定費＋單件費 × 數量＋每分鐘費 × 標準工時＋人工費</b><em>AI 流程即時串接</em></div><div className="catalog-list process-cost-list">{items.map(rate=><article key={rate.id} className={rate.enabled?"":"disabled"}><div className="catalog-item-head"><button className={`rate-toggle ${rate.enabled?"on":""}`} onClick={()=>onToggle(rate.id,{enabled:!rate.enabled})}>{rate.enabled?"啟用":"停用"}</button><em>{rate.category}</em></div><h3>{rate.processName}</h3><p>{rate.equipment} · 別名：{rate.aliases.join("、")||"—"}</p><dl><div><dt>設定費</dt><dd>NT$ {rate.setupCost.toLocaleString()}</dd></div><div><dt>單件費</dt><dd>NT$ {rate.unitCost.toLocaleString()}</dd></div><div><dt>每分鐘費</dt><dd>NT$ {rate.minuteCost.toLocaleString()}</dd></div><div><dt>人工費</dt><dd>NT$ {rate.laborCost.toLocaleString()}</dd></div></dl><div className="process-time-chip">標準工時 <b>{rate.estimatedMinutes} 分鐘</b></div><footer><small>{rate.effectiveDate} · {rate.source}</small><div><button onClick={()=>onEdit(rate)}>編修</button><button className="danger" onClick={()=>onDelete(rate)}>刪除</button></div></footer></article>)}</div>{!items.length&&<div className="empty-rates">找不到符合條件的工序，可直接新增費率資料。</div>}<div className="drawer-sync-note">● AI 分解與製造流程會依工序名稱或別名，自動匹配此資料庫的最新啟用費率。</div></aside></div>}

function ResourceDrawer({kind,items,search,setSearch,onClose,onEdit,onAdd,onDelete}:{kind:ResourceKind;items:ResourceCatalogItem[];search:string;setSearch:(v:string)=>void;onClose:()=>void;onEdit:(v:ResourceCatalogItem)=>void;onAdd:()=>void;onDelete:(v:ResourceCatalogItem)=>void}){return <div className="catalog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="catalog-drawer"><header><div><span className="panel-kicker">{kind==="material"?"MATERIAL LIBRARY":"HARDWARE LIBRARY"}</span><h2>{kind==="material"?"材質資料庫":"五金與耗材資料庫"}</h2></div><button onClick={onClose}>×</button></header><div className="catalog-tools"><label>⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋名稱、編號、規格或供應商"/></label><button className="btn btn-primary" onClick={onAdd}>＋ 新增資料</button></div><div className="catalog-list">{items.map(item=><article key={item.id} className={item.enabled?"":"disabled"}><div className="catalog-item-head"><span className={item.stockQuantity<=item.safetyStock?"low":""}>{item.stockQuantity<=item.safetyStock?"庫存偏低":"供應正常"}</span><em>{item.code}</em></div><h3>{item.name}</h3><p>{item.category} · {item.specification}</p><dl><div><dt>單價</dt><dd>NT$ {item.unitPrice.toLocaleString()}／{item.unit}</dd></div><div><dt>庫存</dt><dd>{item.stockQuantity}（安全 {item.safetyStock}）</dd></div><div><dt>供應商</dt><dd>{item.supplier}</dd></div><div><dt>交期</dt><dd>{item.leadDays} 天</dd></div></dl><div className="catalog-properties">{Object.entries(item.properties).map(([key,value])=><span key={key}>{key}：{value}</span>)}</div><footer><small>{item.effectiveDate} · {item.source}</small><div><button onClick={()=>onEdit({...item})}>編修</button><button className="danger" onClick={()=>onDelete(item)}>刪除</button></div></footer></article>)}</div>{!items.length&&<div className="empty-rates">找不到符合條件的資料。</div>}</aside></div>}

function ResourceEditor({value,setValue,onClose,onSubmit,saving}:{value:ResourceCatalogItem;setValue:(v:ResourceCatalogItem)=>void;onClose:()=>void;onSubmit:(e:FormEvent)=>void;saving:boolean}){const propertyText=Object.entries(value.properties).map(([k,v])=>`${k}：${v}`).join("\n");return <div className="modal-backdrop"><form className="resource-modal" onSubmit={onSubmit}><header><div><span className="panel-kicker">{value.kind==="material"?"MATERIAL":"HARDWARE"} MASTER DATA</span><h2>{value.id?"編修":"新增"}{value.kind==="material"?"材質":"五金"}資料</h2></div><button type="button" onClick={onClose}>×</button></header><div className="rate-form-grid"><label>名稱<input required value={value.name} onChange={e=>setValue({...value,name:e.target.value})}/></label><label>資料編號<input required value={value.code} onChange={e=>setValue({...value,code:e.target.value})}/></label><label>分類<input required value={value.category} onChange={e=>setValue({...value,category:e.target.value})}/></label><label className="wide">規格<input required value={value.specification} onChange={e=>setValue({...value,specification:e.target.value})}/></label><label>單位<input required value={value.unit} onChange={e=>setValue({...value,unit:e.target.value})}/></label><label>單價<input type="number" min="0" required value={value.unitPrice} onChange={e=>setValue({...value,unitPrice:Number(e.target.value)})}/></label><label>供應商<input required value={value.supplier} onChange={e=>setValue({...value,supplier:e.target.value})}/></label><label>交期（天）<input type="number" min="0" value={value.leadDays} onChange={e=>setValue({...value,leadDays:Number(e.target.value)})}/></label><label>目前庫存<input type="number" min="0" value={value.stockQuantity} onChange={e=>setValue({...value,stockQuantity:Number(e.target.value)})}/></label><label>安全庫存<input type="number" min="0" value={value.safetyStock} onChange={e=>setValue({...value,safetyStock:Number(e.target.value)})}/></label><label className="wide">工程特性（每行「名稱：內容」）<textarea value={propertyText} onChange={e=>setValue({...value,properties:Object.fromEntries(e.target.value.split("\n").map(line=>line.split(/[：:]/,2).map(x=>x.trim())).filter(pair=>pair.length===2&&pair[0]))})}/></label><label>生效日期<input type="date" value={value.effectiveDate} onChange={e=>setValue({...value,effectiveDate:e.target.value})}/></label><label className="wide">資料來源<input value={value.source} onChange={e=>setValue({...value,source:e.target.value})}/></label></div><footer><label className="enabled-check"><input type="checkbox" checked={value.enabled} onChange={e=>setValue({...value,enabled:e.target.checked})}/>提供系統串接使用</label><div><button type="button" className="btn btn-secondary" onClick={onClose}>取消</button><button className="btn btn-primary" disabled={saving}>{saving?"儲存中…":"儲存資料"}</button></div></footer></form></div>}
