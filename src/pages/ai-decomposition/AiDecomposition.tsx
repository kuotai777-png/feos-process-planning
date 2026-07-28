"use client";
import {ChangeEvent,useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {AppLayout} from "../../components/layout/AppLayout";
import {useActiveProject} from "../../hooks/useActiveProject";
import {projectKey} from "../../lib/projectStore";

const initialParts=["面板 × 6","縱樑 × 3","支撐塊 × 9","底板 × 3"];
const initialProcesses=["裁切","CNC 定位","鑽孔","倒角","砂磨","組裝","表面處理"];
const initialFlow=["備料","裁切","CNC","鑽孔","組裝","砂磨","表面處理","包裝"];
const initialStructures=[
  {name:"板件數量",value:"21 件"},{name:"接合位置",value:"18 處"},
  {name:"接合形式",value:"螺釘＋榫接"},{name:"組裝順序",value:"底板 → 縱樑 → 面板"},
];

export default function AiDecomposition(){
  const router=useRouter();
  const project=useActiveProject();
  const [image,setImage]=useState("");
  const [name,setName]=useState("");
  const [parts,setParts]=useState(initialParts);
  const [processes,setProcesses]=useState(initialProcesses);
  const [flow,setFlow]=useState(initialFlow);
  const [structures,setStructures]=useState(initialStructures);
  const [dragIndex,setDragIndex]=useState<number|null>(null);
  const [editing,setEditing]=useState(false);
  const [analyzing,setAnalyzing]=useState(false);
  const [ready,setReady]=useState(false);
  const [toast,setToast]=useState("");
  const input=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    setImage(localStorage.getItem(projectKey(project.id,"product-image"))??"");
    setName(localStorage.getItem(projectKey(project.id,"product-image-name"))??"");
    const saved=localStorage.getItem(projectKey(project.id,"ai-decomposition"));
    if(saved){const data=JSON.parse(saved);setParts(data.parts??initialParts);setProcesses(data.processes??initialProcesses);setFlow(data.flow??initialFlow);setStructures(data.structures??initialStructures);setReady(Boolean(data.ready))}
    else{setParts(initialParts);setProcesses(initialProcesses);setFlow(initialFlow);setStructures(initialStructures);setReady(false)}
  },[project.id]);
  const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(""),2200)};
  const upload=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{const dataUrl=String(reader.result??"");setImage(dataUrl);setName(f.name);localStorage.setItem(projectKey(project.id,"product-image"),dataUrl);localStorage.setItem(projectKey(project.id,"product-image-name"),f.name);setReady(false);notify("產品圖片已載入")};reader.readAsDataURL(f)};
  const saveAnalysis=(isReady=ready)=>localStorage.setItem(projectKey(project.id,"ai-decomposition"),JSON.stringify({parts,processes,flow,structures,ready:isReady}));
  const analyze=()=>{if(!image){notify("請先於需求管理載入產品圖片");return}setAnalyzing(true);window.setTimeout(()=>{setAnalyzing(false);setReady(true);localStorage.setItem(projectKey(project.id,"ai-decomposition"),JSON.stringify({parts,processes,flow,structures,ready:true}));notify("AI 分解分析完成")},1500)};
  const update=(list:string[],setList:(v:string[])=>void,i:number,v:string)=>setList(list.map((x,n)=>n===i?v:x));
  const remove=(list:string[],setList:(v:string[])=>void,i:number)=>setList(list.filter((_,n)=>n!==i));
  const add=(list:string[],setList:(v:string[])=>void,label:string)=>{setList([...list,label]);setEditing(true)};
  const moveFlow=(target:number)=>{
    if(dragIndex===null||dragIndex===target)return;
    const next=[...flow];const [item]=next.splice(dragIndex,1);next.splice(target,0,item);setFlow(next);setDragIndex(null);
    window.setTimeout(()=>localStorage.setItem(projectKey(project.id,"ai-decomposition"),JSON.stringify({parts,processes,flow:next,structures,ready})),0);
  };
  const correctOrder=flow.indexOf("裁切")<flow.indexOf("CNC")&&flow.indexOf("CNC")<flow.indexOf("鑽孔")&&flow.indexOf("組裝")<flow.indexOf("砂磨");
  const processFit=Math.max(68,96-Math.abs(processes.length-7)*4-(correctOrder?0:12));
  const timeScore=Math.max(62,91-Math.abs(flow.length-8)*3-(correctOrder?0:9));
  return <AppLayout activeIndex={3} title="STEP 03 AI 分解分析" project={`${project.name} ${project.id}`}>
    <main className="decomp-page">
      <div className="decomp-summary"><div><span>分析狀態</span><b className={ready?"done":""}>{ready?"● AI 分析完成":"○ 等待圖片"}</b></div><div><span>辨識可信度</span><b>{ready?"93%":"—"}</b></div><div><span>人工覆核</span><b>{editing?"編輯中":"尚未確認"}</b></div></div>
      <div className="decomp-workspace">
        <section className="decomp-image-panel">
          <div className="panel-heading"><div><span className="panel-kicker">PRODUCT IMAGE</span><h1>產品圖片</h1></div><span className="revision-badge">{name||"尚未載入"}</span></div>
          <input ref={input} className="sr-only-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/>
          <div className={`decomp-image-stage ${image?"has-image":""}`}>
            {image?<img src={image} alt="載入的產品圖片"/>:<div className="upload-placeholder"><span>▧</span><b>載入產品圖片</b><small>AI 將辨識零件、結構與加工特徵</small></div>}
            {analyzing&&<div className="ai-scanning"><i/><strong>AI 正在分解產品結構…</strong><span>辨識零件邊界、接合點與加工特徵</span></div>}
          </div>
          <div className="upload-actions"><button className="btn btn-primary" onClick={()=>input.current?.click()}>＋ {image?"更換圖片":"載入產品圖片"}</button>{image&&<button className="btn btn-secondary" onClick={()=>{setImage("");setName("");setReady(false);localStorage.removeItem(projectKey(project.id,"product-image"));localStorage.removeItem(projectKey(project.id,"product-image-name"))}}>移除圖片</button>}</div>
          <div className="image-analysis-hint">✦ 圖片需清楚呈現產品全貌。建議使用正面、側面或斜角照片，AI 判讀結果仍須由工程人員覆核。</div>
        </section>
        <section className="decomp-results">
          <div className="engineering-heading"><div><span className="panel-kicker">AI DECOMPOSITION</span><h2>AI 分解結果</h2></div>{ready&&<span className="ai-result-tag">AI 建議值</span>}</div>
          <AnalysisGroup title="零件分解" icon="▦" note="AI 辨識 4 類、共 21 件">
            <div className="analysis-alert warning"><span>!</span><div><b>結構合理性示警</b><p>支撐塊共 9 件，但目前僅辨識 3 條縱樑；請確認中央支撐與受力位置是否對稱。</p></div><button onClick={()=>setEditing(true)}>人工檢查</button></div>
            <EditableList values={parts} editable={editing} onChange={(i,v)=>update(parts,setParts,i,v)} onRemove={i=>remove(parts,setParts,i)} tone="blue"/>
            <button className="add-analysis-item" onClick={()=>add(parts,setParts,"新增零件")}>＋ 新增零件</button>
          </AnalysisGroup>
          <AnalysisGroup title="結構分析" icon="⌘" note="依圖片與工程條件推估">
            <div className="structure-grid">
              {structures.map((item,i)=><label key={i}><input className="structure-name" value={item.name} readOnly={!editing} onChange={e=>setStructures(s=>s.map((x,n)=>n===i?{...x,name:e.target.value}:x))}/><input value={item.value} readOnly={!editing} onChange={e=>setStructures(s=>s.map((x,n)=>n===i?{...x,value:e.target.value}:x))}/>{editing&&<button onClick={()=>setStructures(s=>s.filter((_,n)=>n!==i))} aria-label="刪除結構項目">×</button>}</label>)}
            </div>
            <div className="structure-assessment"><b>AI 結構評估</b><span>承載路徑完整</span><span className="warn">中央區域可能產生應力集中</span><button onClick={()=>{setStructures([...structures,{name:"補強方式",value:"中央支撐補強"}]);setEditing(true)}}>＋ 增加分析項目</button></div>
          </AnalysisGroup>
          <AnalysisGroup title="加工方式分析" icon="⚙" note="可人工增刪或修正">
            <EditableList values={processes} editable={editing} onChange={(i,v)=>update(processes,setProcesses,i,v)} onRemove={i=>remove(processes,setProcesses,i)} tone="green"/>
            <button className="add-analysis-item" onClick={()=>add(processes,setProcesses,"新增加工方式")}>＋ 新增加工方式</button>
          </AnalysisGroup>
          <AnalysisGroup title="製造流程" icon="→" note="拖曳卡片即可重新安排，AI 將即時評估">
            <div className="flow-dnd">{flow.map((v,i)=><div draggable onDragStart={()=>setDragIndex(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>moveFlow(i)} className={dragIndex===i?"dragging":""} key={`${v}-${i}`}><i>⋮⋮</i><span>{String(i+1).padStart(2,"0")}</span>{editing?<input value={v} onChange={e=>update(flow,setFlow,i,e.target.value)}/>:<b>{v}</b>}<button onClick={()=>remove(flow,setFlow,i)}>×</button></div>)}<button onClick={()=>add(flow,setFlow,"新增工序")}>＋ 新增工序</button></div>
            <div className="live-evaluation"><header><div><b>AI 即時成效評估</b><small>流程調整後自動重新計算</small></div><em className={correctOrder?"good":"warning"}>● {correctOrder?"流程合理":"發現順序風險"}</em></header><div><article><span>設備適配率</span><b>{processFit}%</b><i style={{width:`${processFit}%`}}/></article><article><span>時間效率</span><b>{timeScore}%</b><i style={{width:`${timeScore}%`}}/></article><article><span>預估良率</span><b>{correctOrder?"97.6%":"89.5%"}</b><i style={{width:correctOrder?"97.6%":"89.5%"}}/></article></div>{!correctOrder&&<p>⚠ 建議維持「裁切 → CNC → 鑽孔」，並在組裝完成後進行砂磨，以降低定位誤差與返工風險。</p>}</div>
          </AnalysisGroup>
        </section>
      </div>
    </main>
    <footer className="conditions-footer"><span>AI 結果需經人工確認後才能進入下一步</span><div><button className="btn btn-secondary" onClick={()=>{if(editing)saveAnalysis();setEditing(!editing)}}>✎ {editing?"完成並儲存修正":"人工修正"}</button><button className="btn btn-outline" onClick={()=>{if(!ready){notify("請先完成 AI 分析");return}localStorage.setItem(projectKey(project.id,"ai-analysis-confirmed"),"true");saveAnalysis(true);notify("分析結果已確認並存入目前專案")}}>✓ 確認分析</button><button className="btn btn-primary" onClick={ready?()=>router.push("/manual-review"):analyze}>{ready?"下一步 →":analyzing?"AI 分析中…":"✦ 開始 AI 分析"}</button></div></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
  </AppLayout>;
}

function AnalysisGroup({title,icon,note,children}:{title:string;icon:string;note:string;children:React.ReactNode}){return <section className="analysis-group"><div className="analysis-group-head"><span>{icon}</span><div><h3>{title}</h3><small>{note}</small></div></div>{children}</section>}
function EditableList({values,editable,onChange,onRemove,tone}:{values:string[];editable:boolean;onChange:(i:number,v:string)=>void;onRemove:(i:number)=>void;tone:string}){return <div className={`decomp-chips ${tone}`}>{values.map((v,i)=><label key={i}><input type="checkbox" defaultChecked/>{editable?<input className="chip-input" value={v} onChange={e=>onChange(i,e.target.value)}/>:<b>{v}</b>}<span>AI {Math.max(72,92-i*2)}%</span>{editable&&<button className="chip-remove" onClick={()=>onRemove(i)} aria-label="刪除項目">×</button>}</label>)}</div>}
