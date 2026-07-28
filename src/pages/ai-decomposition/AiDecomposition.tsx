"use client";
import {ChangeEvent,useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {AppLayout} from "../../components/layout/AppLayout";

const initialParts=["面板 × 6","縱樑 × 3","支撐塊 × 9","底板 × 3"];
const initialProcesses=["裁切","CNC 定位","鑽孔","倒角","砂磨","組裝","表面處理"];
const initialFlow=["備料","裁切","CNC","鑽孔","組裝","砂磨","表面處理","包裝"];

export default function AiDecomposition(){
  const router=useRouter();
  const [image,setImage]=useState("");
  const [name,setName]=useState("");
  const [parts,setParts]=useState(initialParts);
  const [processes,setProcesses]=useState(initialProcesses);
  const [flow,setFlow]=useState(initialFlow);
  const [editing,setEditing]=useState(false);
  const [analyzing,setAnalyzing]=useState(false);
  const [ready,setReady]=useState(false);
  const [toast,setToast]=useState("");
  const input=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const storedImage=sessionStorage.getItem("feos-product-image");
    const storedName=sessionStorage.getItem("feos-product-image-name");
    if(storedImage)setImage(storedImage);
    if(storedName)setName(storedName);
  },[]);
  const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(""),2200)};
  const upload=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{const dataUrl=String(reader.result??"");setImage(dataUrl);setName(f.name);sessionStorage.setItem("feos-product-image",dataUrl);sessionStorage.setItem("feos-product-image-name",f.name);setReady(false);notify("產品圖片已載入")};reader.readAsDataURL(f)};
  const analyze=()=>{if(!image){notify("請先載入產品圖片");input.current?.click();return}setAnalyzing(true);window.setTimeout(()=>{setAnalyzing(false);setReady(true);notify("AI 分解分析完成")},1500)};
  const update=(list:string[],setList:(v:string[])=>void,i:number,v:string)=>setList(list.map((x,n)=>n===i?v:x));
  return <AppLayout activeIndex={3} title="STEP 03 AI 分解分析" project="托盤 NEW-001">
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
          <div className="upload-actions"><button className="btn btn-primary" onClick={()=>input.current?.click()}>＋ {image?"更換圖片":"載入產品圖片"}</button>{image&&<button className="btn btn-secondary" onClick={()=>{setImage("");setName("");setReady(false);sessionStorage.removeItem("feos-product-image");sessionStorage.removeItem("feos-product-image-name")}}>移除圖片</button>}</div>
          <div className="image-analysis-hint">✦ 圖片需清楚呈現產品全貌。建議使用正面、側面或斜角照片，AI 判讀結果仍須由工程人員覆核。</div>
        </section>
        <section className="decomp-results">
          <div className="engineering-heading"><div><span className="panel-kicker">AI DECOMPOSITION</span><h2>AI 分解結果</h2></div>{ready&&<span className="ai-result-tag">AI 建議值</span>}</div>
          <AnalysisGroup title="零件分解" icon="▦" note="AI 辨識 4 類、共 21 件">
            <EditableList values={parts} editable={editing} onChange={(i,v)=>update(parts,setParts,i,v)} tone="blue"/>
          </AnalysisGroup>
          <AnalysisGroup title="結構分析" icon="⌘" note="依圖片與工程條件推估">
            <div className="structure-grid">
              {[["板件數量","21 件"],["接合位置","18 處"],["接合形式","螺釘＋榫接"],["組裝順序","底板 → 縱樑 → 面板"]].map(([k,v])=><label key={k}><span>{k}</span><input defaultValue={v} readOnly={!editing}/></label>)}
            </div>
          </AnalysisGroup>
          <AnalysisGroup title="加工方式分析" icon="⚙" note="可人工增刪或修正">
            <EditableList values={processes} editable={editing} onChange={(i,v)=>update(processes,setProcesses,i,v)} tone="green"/>
          </AnalysisGroup>
          <AnalysisGroup title="製造流程" icon="→" note="AI 建議加工順序">
            <div className="flow-list">{flow.map((v,i)=><div key={i}><span>{String(i+1).padStart(2,"0")}</span>{editing?<input value={v} onChange={e=>update(flow,setFlow,i,e.target.value)}/>:<b>{v}</b>}{i<flow.length-1&&<em>→</em>}</div>)}</div>
          </AnalysisGroup>
        </section>
      </div>
    </main>
    <footer className="conditions-footer"><span>AI 結果需經人工確認後才能進入下一步</span><div><button className="btn btn-secondary" onClick={()=>setEditing(!editing)}>✎ {editing?"完成修正":"人工修正"}</button><button className="btn btn-outline" onClick={()=>{if(!ready){notify("請先完成 AI 分析");return}sessionStorage.setItem("feos-ai-analysis-confirmed","true");notify("分析結果已確認")}}>✓ 確認分析</button><button className="btn btn-primary" onClick={ready?()=>router.push("/manual-review"):analyze}>{ready?"下一步 →":analyzing?"AI 分析中…":"✦ 開始 AI 分析"}</button></div></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
  </AppLayout>;
}

function AnalysisGroup({title,icon,note,children}:{title:string;icon:string;note:string;children:React.ReactNode}){return <section className="analysis-group"><div className="analysis-group-head"><span>{icon}</span><div><h3>{title}</h3><small>{note}</small></div></div>{children}</section>}
function EditableList({values,editable,onChange,tone}:{values:string[];editable:boolean;onChange:(i:number,v:string)=>void;tone:string}){return <div className={`decomp-chips ${tone}`}>{values.map((v,i)=><label key={i}><input type="checkbox" defaultChecked/>{editable?<input className="chip-input" value={v} onChange={e=>onChange(i,e.target.value)}/>:<b>{v}</b>}<span>AI {92-i*2}%</span></label>)}</div>}
