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
const partSuggestions=["中央補強塊 × 3","防滑墊 × 6","護角件 × 4","識別銘牌 × 1"];
const structureSuggestions=[{name:"補強方式",value:"中央支撐補強"},{name:"承載方向",value:"四向均勻承載"},{name:"安全係數",value:"1.5"},{name:"最大載重",value:"1,200 kg"}];
const processSuggestions=["含水率檢測","尺寸檢驗","壓合固定","承載測試","條碼標示"];

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
  const [validation,setValidation]=useState<"idle"|"checking"|"passed"|"issues">("idle");
  const [confirmed,setConfirmed]=useState(false);
  const [engineeringConditions,setEngineeringConditions]=useState<Record<string,string>>({});
  const [lastDeleted,setLastDeleted]=useState<{section:"parts"|"structures"|"processes"|"flow";value:string|{name:string;value:string};index:number}|null>(null);
  const [dragFeedback,setDragFeedback]=useState("尚未調整流程；拖曳後系統會依新位置提供評估提示。");
  const [toast,setToast]=useState("");
  const input=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    setImage(localStorage.getItem(projectKey(project.id,"product-image"))??"");
    setName(localStorage.getItem(projectKey(project.id,"product-image-name"))??"");
    const saved=localStorage.getItem(projectKey(project.id,"ai-decomposition"));
    const conditions=localStorage.getItem(projectKey(project.id,"engineering-conditions"));
    setEngineeringConditions(conditions?JSON.parse(conditions):{});
    if(saved){const data=JSON.parse(saved);setParts(data.parts??initialParts);setProcesses(data.processes??initialProcesses);setFlow(data.flow??initialFlow);setStructures(data.structures??initialStructures);setReady(Boolean(data.ready));setValidation(data.validation??"idle");setConfirmed(Boolean(data.confirmed))}
    else{setParts(initialParts);setProcesses(initialProcesses);setFlow(initialFlow);setStructures(initialStructures);setReady(false);setValidation("idle");setConfirmed(false)}
  },[project.id]);
  const notify=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(""),2200)};
  const upload=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{const dataUrl=String(reader.result??"");setImage(dataUrl);setName(f.name);localStorage.setItem(projectKey(project.id,"product-image"),dataUrl);localStorage.setItem(projectKey(project.id,"product-image-name"),f.name);setReady(false);notify("產品圖片已載入")};reader.readAsDataURL(f)};
  const saveAnalysis=(isReady=ready,nextValidation=validation,nextConfirmed=confirmed)=>localStorage.setItem(projectKey(project.id,"ai-decomposition"),JSON.stringify({parts,processes,flow,structures,ready:isReady,validation:nextValidation,confirmed:nextConfirmed}));
  const analyze=()=>{if(!image){notify("請先於需求管理載入產品圖片");return}setAnalyzing(true);window.setTimeout(()=>{setAnalyzing(false);setReady(true);setValidation("idle");setConfirmed(false);localStorage.setItem(projectKey(project.id,"ai-decomposition"),JSON.stringify({parts,processes,flow,structures,ready:true,validation:"idle",confirmed:false}));notify("AI 分解分析完成，請人工覆核")},1500)};
  const changed=()=>{setValidation("idle");setConfirmed(false)};
  const update=(list:string[],setList:(v:string[])=>void,i:number,v:string)=>{setList(list.map((x,n)=>n===i?v:x));changed()};
  const remove=(section:"parts"|"processes"|"flow",list:string[],setList:(v:string[])=>void,i:number)=>{setLastDeleted({section,value:list[i],index:i});setList(list.filter((_,n)=>n!==i));changed()};
  const add=(list:string[],setList:(v:string[])=>void,label:string)=>{if(!list.includes(label))setList([...list,label]);setEditing(true);changed()};
  const moveFlow=(target:number)=>{
    if(dragIndex===null||dragIndex===target)return;
    const next=[...flow];const [item]=next.splice(dragIndex,1);next.splice(target,0,item);
    const indexOf=(key:string)=>next.findIndex(value=>value.includes(key));
    const after=(first:string,second:string)=>indexOf(first)>=0&&indexOf(second)>=0&&indexOf(first)>indexOf(second);
    const tips:string[]=[];
    if(indexOf("備料")>0)tips.push("備料移離首站，可能增加前置搬運與等待");
    if(indexOf("包裝")>=0&&indexOf("包裝")<next.length-1)tips.push("包裝不是末站，後續加工可能造成拆包與重包成本");
    if(after("裁切","CNC"))tips.push("CNC 早於裁切，定位基準可能不穩定");
    if(after("CNC","鑽孔"))tips.push("鑽孔早於 CNC，孔位可能因後續加工產生偏差");
    if(after("組裝","砂磨"))tips.push("砂磨早於組裝，接合後可能需要再次修磨");
    if(tips.length===0)tips.push(`「${item}」移至第 ${target+1} 站：順序符合通常製造邏輯`);
    else tips.push(`本次調整預估增加 NT$ ${tips.length*160} 的搬運、返工或等待成本`);
    setFlow(next);setDragIndex(null);
    setDragFeedback(tips.join("；"));
    notify(tips[0]);
    changed();
  };
  const correctOrder=flow.indexOf("裁切")<flow.indexOf("CNC")&&flow.indexOf("CNC")<flow.indexOf("鑽孔")&&flow.indexOf("組裝")<flow.indexOf("砂磨");
  const hasSupportWarning=!structures.some(item=>`${item.name}${item.value}`.includes("補強"));
  const hasIncomplete=[...parts,...processes,...flow,...structures.flatMap(item=>[item.name,item.value])].some(value=>!value.trim()||value.includes("新增"));
  const duplicateValues=(values:string[],index:number)=>values.filter(value=>value.trim()===values[index]?.trim()).length>1;
  const partIssues=parts.map((value,index)=>{
    if(!value.trim())return "零件名稱不可空白";
    if(!/[×xX]\s*\d+/.test(value))return "需包含數量，例如：面板 × 6";
    if(duplicateValues(parts,index))return "零件項目重複";
    return "";
  });
  const structureIssues=structures.map((item,index)=>{
    if(!item.name.trim()||!item.value.trim())return "名稱與分析值必須完整";
    if(structures.filter(value=>value.name.trim()===item.name.trim()).length>1)return "結構分析項目重複";
    return "";
  });
  const forbiddenMethod=engineeringConditions.forbiddenMethod??"";
  const processIssues=processes.map((value,index)=>{
    if(!value.trim())return "加工方式不可空白";
    if(duplicateValues(processes,index))return "加工方式重複";
    if(forbiddenMethod&&value.includes(forbiddenMethod))return `與需求管理的禁止工法「${forbiddenMethod}」衝突`;
    return "";
  });
  const missingProcesses=["裁切","組裝"].filter(required=>!processes.some(value=>value.includes(required)));
  const flowIssues=flow.map((value,index)=>{
    if(!value.trim())return "工序不可空白";
    if(duplicateValues(flow,index))return "工序重複";
    if(value.includes("鑽孔")&&flow.findIndex(item=>item.includes("CNC"))>index)return "鑽孔不可早於 CNC 定位";
    if(value.includes("砂磨")&&flow.findIndex(item=>item.includes("組裝"))>index)return "砂磨不可早於組裝";
    return "";
  });
  const informationWarnings=[
    parts.length<4?"零件資訊不足：至少需包含主要板件、支撐與底部構件":parts.length>10?"零件分類過多：建議合併同類零件，避免重複拆解":"",
    structures.length<4?"結構資訊不足：至少需有數量、接合、組裝及承載資訊":structures.length>8?"結構欄位過多：請確認是否存在重複或非必要資訊":"",
    processes.length<4?"加工資訊不足：無法完整評估製造可行性":processes.length>12?"加工項目過多：可能增加換站、搬運與製造成本":"",
  ].filter(Boolean);
  const activeIssueCount=partIssues.filter(Boolean).length+structureIssues.filter(Boolean).length+processIssues.filter(Boolean).length+flowIssues.filter(Boolean).length+missingProcesses.length+(hasSupportWarning?1:0);
  const processFit=Math.max(68,96-Math.abs(processes.length-7)*4-(correctOrder?0:12));
  const timeScore=Math.max(62,91-Math.abs(flow.length-8)*3-(correctOrder?0:9));
  const estimatedCost=1850+flow.length*165+Math.max(0,flow.length-8)*120+(correctOrder?0:480);
  const restoreDefaults=(section:"parts"|"structures"|"processes"|"flow")=>{if(section==="parts")setParts(initialParts);if(section==="structures")setStructures(initialStructures);if(section==="processes")setProcesses(initialProcesses);if(section==="flow")setFlow(initialFlow);changed();notify("已載入 AI 預設項目")};
  const undoDelete=()=>{if(!lastDeleted)return;const insert=<T,>(list:T[],value:T,index:number)=>{const next=[...list];next.splice(Math.min(index,next.length),0,value);return next};if(lastDeleted.section==="parts")setParts(insert(parts,lastDeleted.value as string,lastDeleted.index));if(lastDeleted.section==="structures")setStructures(insert(structures,lastDeleted.value as {name:string;value:string},lastDeleted.index));if(lastDeleted.section==="processes")setProcesses(insert(processes,lastDeleted.value as string,lastDeleted.index));if(lastDeleted.section==="flow")setFlow(insert(flow,lastDeleted.value as string,lastDeleted.index));setLastDeleted(null);changed();notify("已復原誤刪項目")};
  const revalidate=()=>{
    saveAnalysis();setEditing(false);setValidation("checking");setConfirmed(false);
    window.setTimeout(()=>{
      const passed=correctOrder&&!hasSupportWarning&&!hasIncomplete&&activeIssueCount===0&&parts.length>=4&&processes.length>=4&&structures.length>=4;
      const result=passed?"passed":"issues";setValidation(result);saveAnalysis(true,result,false);
      notify(passed?"AI 再驗證完成：資訊完整且結構合理":"AI 再驗證發現未排除項目，請繼續修正");
    },1800);
  };
  const confirmAnalysis=()=>{if(validation!=="passed"){notify("需先完成修正並通過 AI 再驗證");return}setConfirmed(true);localStorage.setItem(projectKey(project.id,"ai-analysis-confirmed"),"true");saveAnalysis(true,"passed",true);notify("分析已完成確認，可進入下一階段")};
  return <AppLayout activeIndex={3} title="STEP 03 AI 分解分析" project={`${project.name} ${project.id}`}>
    <main className="decomp-page">
      <div className="decomp-summary"><div><span>分析狀態</span><b className={ready?"done":""}>{ready?"● AI 分析完成":"○ 等待圖片"}</b></div><div><span>AI 再驗證</span><b className={validation==="passed"?"done":""}>{validation==="checking"?"檢查中…":validation==="passed"?"● 全部通過":validation==="issues"?"● 尚有問題":"尚未執行"}</b></div><div><span>完成確認</span><b className={confirmed?"done":""}>{confirmed?"● 已確認":editing?"修正中":"等待確認"}</b></div></div>
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
            <TrafficAssessment items={[
              {name:"結構安全",level:hasSupportWarning?"red":"green",detail:"中央支撐與受力位置可能不對稱，需增加補強方式。"},
              {name:"結構合理性",level:partIssues.some(Boolean)?"yellow":"green",detail:"零件名稱、數量格式或重複項目需要修正。"},
              {name:"製造可行性",level:missingProcesses.length?"red":processIssues.some(Boolean)?"yellow":"green",detail:`必要加工方式缺漏或與工程限制衝突${missingProcesses.length?`：${missingProcesses.join("、")}`:""}。`},
              {name:"資料完整性",level:hasIncomplete?"yellow":"green",detail:"仍有空白或尚未完成的新增項目。"},
            ]}/>
            <ValidationSummary count={partIssues.filter(Boolean).length+(hasSupportWarning?1:0)} okText="所有零件名稱、數量及支撐關係均符合需求"/>
            <EditableList values={parts} issues={partIssues} editable onChange={(i,v)=>update(parts,setParts,i,v)} onRemove={i=>remove("parts",parts,setParts,i)} tone="blue"/>
            <div className="analysis-tools"><SuggestionPicker label="新增零件" suggestions={partSuggestions} onSelect={value=>add(parts,setParts,value)}/><button onClick={()=>restoreDefaults("parts")}>↻ 載入預設零件</button></div>
          </AnalysisGroup>
          <AnalysisGroup title="結構分析" icon="⌘" note="依圖片與工程條件推估">
            <div className="structure-grid">
              {structures.map((item,i)=><label className={structureIssues[i]?"has-issue":""} key={i}><input className="structure-name" value={item.name} onChange={e=>{setStructures(s=>s.map((x,n)=>n===i?{...x,name:e.target.value}:x));changed()}}/><input value={item.value} onChange={e=>{setStructures(s=>s.map((x,n)=>n===i?{...x,value:e.target.value}:x));changed()}}/><button onClick={()=>{setLastDeleted({section:"structures",value:item,index:i});setStructures(s=>s.filter((_,n)=>n!==i));changed()}} aria-label="刪除結構項目">×</button>{structureIssues[i]&&<small className="inline-issue">⚠ {structureIssues[i]}</small>}</label>)}
            </div>
            <ValidationSummary count={structureIssues.filter(Boolean).length+(hasSupportWarning?1:0)} okText="結構欄位完整，未發現重複或受力衝突"/>
            <div className="structure-assessment"><b>AI 結構評估</b><span>承載路徑完整</span>{hasSupportWarning&&<span className="warn">中央區域可能產生應力集中</span>}<SuggestionPicker label="增加分析項目" suggestions={structureSuggestions.map(x=>`${x.name}｜${x.value}`)} onSelect={value=>{const [itemName,itemValue]=value.split("｜");if(!structures.some(x=>x.name===itemName))setStructures([...structures,{name:itemName,value:itemValue}]);setEditing(true);changed()}}/><button onClick={()=>restoreDefaults("structures")}>↻ 載入預設</button></div>
          </AnalysisGroup>
          <AnalysisGroup title="加工方式分析" icon="⚙" note="可人工增刪或修正">
            {missingProcesses.length>0&&<div className="section-live-warning" role="alert"><b>必要加工方式缺漏</b><span>缺少：{missingProcesses.join("、")}</span></div>}
            <ValidationSummary count={processIssues.filter(Boolean).length+missingProcesses.length} okText="加工方式符合工程限制，必要工序完整"/>
            <EditableList values={processes} issues={processIssues} editable onChange={(i,v)=>update(processes,setProcesses,i,v)} onRemove={i=>remove("processes",processes,setProcesses,i)} tone="green"/>
            <div className="analysis-tools"><SuggestionPicker label="新增加工方式" suggestions={processSuggestions} onSelect={value=>add(processes,setProcesses,value)}/><button onClick={()=>restoreDefaults("processes")}>↻ 載入預設加工</button></div>
          </AnalysisGroup>
          <AnalysisGroup title="製造流程" icon="→" note="拖曳卡片即可重新安排，AI 將即時評估">
            <ValidationSummary count={flowIssues.filter(Boolean).length+(!correctOrder?1:0)} okText="流程順序與前後製程關係正確"/>
            <div className="flow-dnd">{flow.map((v,i)=><div draggable onDragStart={()=>setDragIndex(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>moveFlow(i)} className={`${dragIndex===i?"dragging":""} ${flowIssues[i]?"has-issue":""}`} key={`${v}-${i}`}><i>⋮⋮</i><span>{String(i+1).padStart(2,"0")}</span>{editing?<input value={v} onChange={e=>update(flow,setFlow,i,e.target.value)}/>:<b>{v}</b>}<button onClick={()=>remove("flow",flow,setFlow,i)}>×</button>{flowIssues[i]&&<small className="inline-issue">⚠ {flowIssues[i]}</small>}</div>)}<SuggestionPicker label="新增工序" suggestions={processSuggestions} onSelect={value=>add(flow,setFlow,value)}/></div>
            <div className="live-evaluation"><header><div><b>AI 即時成效評估</b><small>流程調整後自動重新計算</small></div><em className={correctOrder?"good":"warning"}>● {correctOrder?"流程合理":"發現順序風險"}</em></header><div><article><span>設備適配率</span><b>{processFit}%</b><i style={{width:`${processFit}%`}}/></article><article><span>時間效率</span><b>{timeScore}%</b><i style={{width:`${timeScore}%`}}/></article><article><span>預估良率</span><b>{correctOrder?"97.6%":"89.5%"}</b><i style={{width:correctOrder?"97.6%":"89.5%"}}/></article></div>{!correctOrder&&<p>⚠ 建議維持「裁切 → CNC → 鑽孔」，並在組裝完成後進行砂磨，以降低定位誤差與返工風險。</p>}</div>
            <div className="flow-live-decision" aria-live="polite"><header><b>即時流程判斷與拖曳提示</b><span>自由拖曳 · 通常性 · 合理性 · 安全 · 成本</span></header><div><span className={flow.some(x=>x.includes("備料"))&&flow.findIndex(x=>x.includes("備料"))===0?"pass":"fail"}>備料起點</span><span className={flow.indexOf("裁切")<flow.indexOf("CNC")?"pass":"fail"}>裁切先於 CNC</span><span className={flow.indexOf("CNC")<flow.indexOf("鑽孔")?"pass":"fail"}>CNC 先於鑽孔</span><span className={flow.indexOf("組裝")<flow.indexOf("砂磨")?"pass":"fail"}>組裝先於砂磨</span></div><section><b>預估流程成本 NT$ {estimatedCost.toLocaleString()}</b><span>{flow.length>9?"工序偏多，換站與搬運成本上升":"工序數量位於合理範圍"}</span><button onClick={()=>{restoreDefaults("flow");setDragFeedback("已還原 AI 建議流程。")}}>↻ 還原建議流程</button></section><aside className={correctOrder?"safe":"caution"}><b>本次拖曳提示</b><span>{dragFeedback}</span></aside><p>{correctOrder&&flowIssues.every(issue=>!issue)?"✓ 目前流程可執行；人員仍可自由拖曳調整。":`⚠ 即時偵測 ${flowIssues.filter(Boolean).length+(!correctOrder?1:0)} 項流程風險，系統僅提示、不限制操作。`}</p></div>
          </AnalysisGroup>
          {validation==="checking"&&<div className="revalidation-overlay"><i/><div><b>AI 正在重新驗證所有修正</b><span>檢查資訊完整性、零件與結構合理性、加工相容性、流程順序及製造風險…</span><div><em>資料完整性</em><em>結構合理性</em><em>加工可行性</em><em>流程一致性</em></div></div></div>}
          {validation==="passed"&&<div className="validation-result passed"><span>✓</span><div><b>AI 再驗證通過</b><p>所有資訊完整，結構示警已排除，加工方式與製造流程合理。請按「確認分析」完成本階段。</p></div></div>}
          {validation==="issues"&&<div className="validation-result issues"><span>!</span><div><b>AI 再驗證未通過</b><p>{hasSupportWarning?"結構補強問題尚未排除。":hasIncomplete?"尚有空白或未完成的新增項目。":"製造流程順序或資料完整性仍需修正。"}</p></div><button onClick={()=>setEditing(true)}>返回修正</button></div>}
        </section>
      </div>
      {informationWarnings.length>0&&<div className="information-balance-warning"><b>AI 資訊量即時判斷</b>{informationWarnings.map(message=><span key={message}>⚠ {message}</span>)}</div>}
    </main>
    <footer className="conditions-footer"><span>{confirmed?"分析已確認，可進入下一階段":"修正後必須通過 AI 再驗證並完成確認"}</span><div><button className="btn btn-secondary" onClick={()=>editing?revalidate():setEditing(true)} disabled={validation==="checking"}>✎ {editing?"完成修正並啟動 AI 再驗證":"人工修正"}</button><button className="btn btn-outline" onClick={confirmAnalysis} disabled={validation!=="passed"||confirmed}>{confirmed?"✓ 已確認":"✓ 確認分析"}</button><button className="btn btn-primary" disabled={ready&&!confirmed} onClick={!ready?analyze:()=>router.push("/manual-review")}>{!ready?(analyzing?"AI 分析中…":"✦ 開始 AI 分析"):confirmed?"下一步 →":"等待確認"}</button></div></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
    {lastDeleted&&<div className="undo-delete">項目已刪除<button onClick={undoDelete}>復原</button><button onClick={()=>setLastDeleted(null)}>×</button></div>}
  </AppLayout>;
}

function AnalysisGroup({title,icon,note,children}:{title:string;icon:string;note:string;children:React.ReactNode}){return <section className="analysis-group"><div className="analysis-group-head"><span>{icon}</span><div><h3>{title}</h3><small>{note}</small></div></div>{children}</section>}
function EditableList({values,issues,editable,onChange,onRemove,tone}:{values:string[];issues:string[];editable:boolean;onChange:(i:number,v:string)=>void;onRemove:(i:number)=>void;tone:string}){return <div className={`decomp-chips ${tone}`}>{values.map((v,i)=><label className={issues[i]?"has-issue":""} key={i}><input type="checkbox" defaultChecked/>{editable?<input className="chip-input" value={v} onChange={e=>onChange(i,e.target.value)}/>:<b>{v}</b>}<span>AI {Math.max(72,92-i*2)}%</span>{editable&&<button className="chip-remove" onClick={()=>onRemove(i)} aria-label="刪除項目">×</button>}{issues[i]&&<small className="inline-issue">⚠ {issues[i]}</small>}</label>)}</div>}
function ValidationSummary({count,okText}:{count:number;okText:string}){return <div className={`validation-summary ${count?"warning":"ok"}`} aria-live="polite"><span>{count?"!":"✓"}</span><b>{count?`即時檢驗：發現 ${count} 項待修正`:okText}</b></div>}
function TrafficAssessment({items}:{items:{name:string;level:string;detail:string}[]}){return <div className="traffic-assessment" aria-live="polite">{items.map(item=><div className={item.level} key={item.name}><i/><b>{item.name}</b>{item.level!=="green"&&<><span>{item.level==="red"?"高風險":"需注意"}</span><p>{item.detail}</p></>}</div>)}</div>}
function SuggestionPicker({label,suggestions,onSelect}:{label:string;suggestions:string[];onSelect:(value:string)=>void}){const[open,setOpen]=useState(false);const[custom,setCustom]=useState("");const timer=useRef<ReturnType<typeof setTimeout>|null>(null);useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);const cancelClose=()=>{if(timer.current)clearTimeout(timer.current)};const scheduleClose=()=>{cancelClose();timer.current=setTimeout(()=>setOpen(false),3000)};const submit=()=>{const value=custom.trim();if(!value)return;onSelect(value);setCustom("");setOpen(false)};return <div className="suggestion-picker" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}><button className="add-analysis-item" onClick={()=>setOpen(!open)}>＋ {label}<small>AI 建議備選</small></button>{open&&<div><header><b>AI 評估建議</b><small>移開 3 秒後收合 · 可自行輸入</small></header>{suggestions.map((item,index)=><button key={item} onClick={()=>{onSelect(item);setOpen(false)}}><span>{item}</span><em>AI {95-index*3}%</em></button>)}<footer><input value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();submit()}}} placeholder="人工自行輸入項目"/><button onClick={submit} disabled={!custom.trim()}>新增</button></footer></div>}</div>}
