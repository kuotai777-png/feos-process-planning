"use client";
import {ChangeEvent,FormEvent,useEffect,useMemo,useRef,useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";
import {useActiveProject} from "../../hooks/useActiveProject";
import {projectKey} from "../../lib/projectStore";
import {defaultResourceCatalog,ResourceCatalogItem} from "../../lib/resourceCatalog";

const groups=[
  {title:"尺寸要求",icon:"↔",fields:[
    {key:"length",label:"長度",unit:"mm"},{key:"width",label:"寬度",unit:"mm"},
    {key:"height",label:"高度",unit:"mm"},{key:"thickness",label:"板厚",unit:"mm"},
  ]},
  {title:"材料要求",icon:"▰",fields:[
    {key:"material",label:"指定材料"},{key:"alternatives",label:"可替代材料"},{key:"forbiddenMaterial",label:"禁用材料"},
  ]},
  {title:"施工要求",icon:"⚒",fields:[
    {key:"joint",label:"接合方式"},{key:"finish",label:"表面處理"},
    {key:"precision",label:"加工精度"},{key:"appearance",label:"外觀等級"},
  ]},
  {title:"製造限制",icon:"⚙",fields:[
    {key:"equipment",label:"指定設備"},{key:"forbiddenEquipment",label:"禁止設備"},
    {key:"method",label:"指定工法"},{key:"forbiddenMethod",label:"禁止工法"},
  ]},
  {title:"商業條件",icon:"＄",fields:[
    {key:"cost",label:"成本上限",unit:"NT$"},{key:"margin",label:"最低毛利",unit:"%"},
    {key:"leadTime",label:"交期",unit:"天"},
  ]},
] as const;

const initialValues:Record<string,string>={
  length:"1200",width:"1000",height:"150",thickness:"22",material:"北美花旗松",
  alternatives:"歐洲赤松、南方松",forbiddenMaterial:"回收混合木料",joint:"螺釘＋榫接",
  finish:"四面砂光、防霉處理",precision:"± 1.0 mm",appearance:"A 級",
  equipment:"CNC 加工中心 01",forbiddenEquipment:"手動裁切鋸",method:"自動定位鑽孔",
  forbiddenMethod:"人工釘合",cost:"2,850",margin:"18",leadTime:"14",
};

const aiPredictions:Record<string,string>={
  length:"1200",width:"1000",height:"145",thickness:"22",material:"松木（疑似花旗松）",
  alternatives:"歐洲赤松、南方松",forbiddenMaterial:"含水率高於 18% 木料",joint:"螺釘固定＋縱樑榫接",
  finish:"四面砂光、防霉處理",precision:"± 1.5 mm",appearance:"工業 A 級",
  equipment:"CNC 加工中心、自動裁板機",forbiddenEquipment:"手動裁切鋸",method:"自動定位鑽孔",
  forbiddenMethod:"未定位人工釘合",cost:"2,900",margin:"18",leadTime:"14",
};
type ChatMessage={role:"user"|"ai";text:string};
const welcomeMessage:ChatMessage={role:"ai",text:"您好，我是本專案的工程 AI 助理。可詢問尺寸、材料、加工方式、設備限制或交期風險，我會依目前工程條件回答。"};

export default function EngineeringConditions(){
  const project=useActiveProject();
  const [toast,setToast]=useState("");
  const [values,setValues]=useState<Record<string,string>>(initialValues);
  const [imageUrl,setImageUrl]=useState("");
  const [fileName,setFileName]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiReady,setAiReady]=useState(false);
  const [chatOpen,setChatOpen]=useState(false);
  const [chatInput,setChatInput]=useState("");
  const [chatting,setChatting]=useState(false);
  const [messages,setMessages]=useState<ChatMessage[]>([welcomeMessage]);
  const [catalog,setCatalog]=useState<ResourceCatalogItem[]>(defaultResourceCatalog);
  const fileInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const storedImage=localStorage.getItem(projectKey(project.id,"product-image"));
    const storedName=localStorage.getItem(projectKey(project.id,"product-image-name"));
    const storedValues=localStorage.getItem(projectKey(project.id,"engineering-conditions"));
    const storedChat=localStorage.getItem(projectKey(project.id,"engineering-chat"));
    setImageUrl(storedImage??"");setFileName(storedName??"");
    setValues(storedValues?JSON.parse(storedValues):initialValues);
    setMessages(storedChat?JSON.parse(storedChat):[welcomeMessage]);
    if(storedImage)setImageUrl(storedImage);
    if(storedName)setFileName(storedName);
  },[project.id]);
  useEffect(()=>{fetch("/api/resource-catalog").then(response=>response.ok?response.json():Promise.reject()).then(setCatalog).catch(()=>setCatalog(defaultResourceCatalog))},[]);
  const completion=useMemo(()=>{
    const filled=Object.values(values).filter(Boolean).length;
    return Math.round(filled/Object.keys(initialValues).length*100);
  },[values]);
  const notify=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(""),2400)};
  const chooseFile=()=>fileInput.current?.click();
  const upload=(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    if(!file.type.startsWith("image/")){notify("請選擇 JPG、PNG 或 WebP 圖片");return}
    if(file.size>10*1024*1024){notify("圖片大小請勿超過 10 MB");return}
    const reader=new FileReader();
    reader.onload=()=>{
      const dataUrl=String(reader.result??"");
      setImageUrl(dataUrl);
      setFileName(file.name);
      localStorage.setItem(projectKey(project.id,"product-image"),dataUrl);
      localStorage.setItem(projectKey(project.id,"product-image-name"),file.name);
      setAiReady(false);
      notify("產品圖片已載入，AI 分析頁面將自動帶入");
    };
    reader.readAsDataURL(file);
  };
  const removeImage=()=>{
    setImageUrl("");setFileName("");setAiReady(false);
    localStorage.removeItem(projectKey(project.id,"product-image"));
    localStorage.removeItem(projectKey(project.id,"product-image-name"));
    if(fileInput.current)fileInput.current.value="";
  };
  const analyze=()=>{
    if(!imageUrl){notify("請先載入產品圖片，再啟動 AI 預判");chooseFile();return}
    setAnalyzing(true);setAiReady(false);
    window.setTimeout(()=>{
      setValues(aiPredictions);
      localStorage.setItem(projectKey(project.id,"engineering-conditions"),JSON.stringify(aiPredictions));
      setAnalyzing(false);setAiReady(true);
      notify("AI 預判完成，所有欄位皆可人工修改");
    },1500);
  };
  const reset=()=>{setValues(Object.fromEntries(Object.keys(initialValues).map(k=>[k,""])));setAiReady(false);notify("條件已重設，可人工重新輸入")};
  const askAi=(event:FormEvent)=>{
    event.preventDefault();const question=chatInput.trim();if(!question||chatting)return;
    const userMessage:ChatMessage={role:"user",text:question};
    const pending=[...messages,userMessage];setMessages(pending);setChatInput("");setChatting(true);
    window.setTimeout(()=>{
      const lower=question.toLowerCase();
      const answer=lower.includes("材料")?`目前指定材料為「${values.material||"尚未設定"}」。建議同時確認含水率、承載需求與供應穩定度；可替代材料為 ${values.alternatives||"尚未設定"}。`
        :lower.includes("尺寸")||lower.includes("厚")?`目前尺寸為 ${values.length||"—"} × ${values.width||"—"} × ${values.height||"—"} mm，板厚 ${values.thickness||"—"} mm。若承載提高，建議先複核板厚、縱樑間距及接合點。`
        :lower.includes("設備")||lower.includes("加工")?`目前指定設備為「${values.equipment||"尚未設定"}」，工法為「${values.method||"尚未設定"}」。AI 分析階段會進一步檢查設備能力、換刀與工序衝突。`
        :lower.includes("交期")||lower.includes("成本")?`目前成本上限 NT$ ${values.cost||"—"}、交期 ${values.leadTime||"—"} 天、最低毛利 ${values.margin||"—"}%。建議在流程最佳化時同步評估材料利用率與設備負載。`
        :`已收到問題：「${question}」。依目前專案資料，建議先確認產品照片與右側工程條件是否完整，再啟動 AI 預判；結果可由人員直接修正。`;
      const next=[...pending,{role:"ai" as const,text:answer}];setMessages(next);localStorage.setItem(projectKey(project.id,"engineering-chat"),JSON.stringify(next));setChatting(false);
    },850);
  };

  const save=()=>{localStorage.setItem(projectKey(project.id,"engineering-conditions"),JSON.stringify(values));notify("工程條件已儲存至目前專案")};
  return <AppLayout activeIndex={2} title="STEP 02 製造商工程條件設定" project={`${project.name} ${project.id}`}>
    <main className="conditions-page">
      <div className="conditions-context">
        <div><span className="context-label">客戶</span><b>{project.customer}</b></div>
        <div><span className="context-label">產品類別</span><b>{project.product}</b></div>
        <div><span className="context-label">條件完整度</span><b className="completion-value">{completion}%</b></div>
        <span className={`condition-status ${aiReady?"ai-complete":""}`}>● {aiReady?"AI 預判完成":"草稿已儲存"}</span>
      </div>

      <div className="conditions-workspace">
        <section className="product-visual-panel">
          <div className="panel-heading"><div><span className="panel-kicker">PRODUCT INPUT</span><h1>產品圖片</h1></div><span className="revision-badge">{fileName||"尚未載入"}</span></div>
          <input ref={fileInput} className="sr-only-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/>
          <div className={`pallet-stage upload-stage ${imageUrl?"has-upload":""}`}>
            {imageUrl?<img className="uploaded-product" src={imageUrl} alt="使用者載入的產品圖片"/>:<>
              <div className="pallet-art" aria-label="木製托盤預設示意圖">
                <div className="pallet-top">{[0,1,2,3,4,5].map(i=><i key={i}/>)}</div>
                <div className="pallet-blocks">{[0,1,2,3,4,5].map(i=><i key={i}/>)}</div>
                <div className="pallet-base">{[0,1,2].map(i=><i key={i}/>)}</div>
              </div>
            </>}
            {analyzing&&<div className="ai-scanning"><i/><strong>AI 正在辨識產品特徵…</strong><span>分析尺寸比例、材料紋理與結構</span></div>}
          </div>
          <div className="upload-actions">
            <button className="btn btn-primary" onClick={chooseFile}>＋ {imageUrl?"更換圖片":"載入產品圖片"}</button>
            {imageUrl&&<button className="btn btn-secondary" onClick={removeImage}>移除圖片</button>}
            <span>支援 JPG、PNG、WebP，最大 10 MB</span>
          </div>
          {aiReady?<div className="ai-result-summary"><div><span>AI 辨識可信度</span><b>91%</b></div><p>辨識為木製雙向進叉托盤。已依外觀比例、木紋與結構提出工程條件，請由工程人員確認或修改。</p></div>:<div className="drawing-note"><span>✦</span><p>載入產品照片後按「AI 工程條件預判」，系統會自動填入右側建議值；每個欄位仍可由人工直接輸入或修改。</p></div>}
        </section>

        <section className="engineering-panel">
          <div className="engineering-heading"><div><span className="panel-kicker">ENGINEERING CONDITIONS</span><h2>工程條件</h2><small className="catalog-linked">● 已串接知識庫：{catalog.filter(item=>item.kind==="material"&&item.enabled).length} 筆可用材質</small></div><div className="input-mode"><span className={aiReady?"active":""}>AI 建議</span><span className="active">人工可編輯</span></div><button className="clear-btn" onClick={reset}>重設條件</button></div>
          {aiReady&&<div className="ai-notice">✦ AI 已填入預判值　<span>藍色標記代表 AI 建議，請人工覆核後儲存。</span></div>}
          <div className="condition-groups">{groups.map(group=><fieldset className="condition-group" key={group.title}>
            <legend><span>{group.icon}</span>{group.title}</legend>
            <div className="condition-fields">{group.fields.map(field=><label className={`condition-field ${aiReady?"ai-suggested":""}`} key={field.key}><span>{field.label}{aiReady&&<small>AI</small>}</span><div className="field-control">{field.unit&&<em>{field.unit}</em>}<input list={field.key==="material"||field.key==="alternatives"?"feos-material-options":undefined} value={values[field.key]??""} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))} aria-label={field.label}/></div></label>)}</div>
          </fieldset>)}</div>
          <datalist id="feos-material-options">{catalog.filter(item=>item.kind==="material"&&item.enabled).map(item=><option key={item.id} value={item.name}>{item.specification} · NT$ {item.unitPrice}/{item.unit}</option>)}</datalist>
        </section>
      </div>
    </main>
    <footer className="conditions-footer"><span>資料來源：產品圖片＋人工工程條件</span><div><button className="btn btn-secondary" onClick={save}>▣ 儲存條件</button><button className="btn btn-primary ai-action" onClick={analyze} disabled={analyzing}>{analyzing?"AI 分析中…":"✦ AI 工程條件預判"}</button></div></footer>
    <button className={`ai-chat-launcher ${chatOpen?"active":""}`} onClick={()=>setChatOpen(!chatOpen)} aria-label="開啟工程 AI 對話">{chatOpen?"×":"✦"}<span>{chatOpen?"關閉":"詢問工程 AI"}</span></button>
    {chatOpen&&<aside className="ai-chat-panel" aria-label="工程 AI 對話框">
      <header><div><i>AI</i><span><b>工程 AI 助理</b><small>專案：{project.name} {project.id}</small></span></div><button onClick={()=>setChatOpen(false)}>×</button></header>
      <div className="chat-context"><span>目前參考</span><b>產品圖片 · 工程條件 · 專案資料</b></div>
      <div className="chat-messages">{messages.map((message,index)=><div className={`chat-message ${message.role}`} key={index}><span>{message.role==="ai"?"AI":"人員"}</span><p>{message.text}</p></div>)}{chatting&&<div className="chat-message ai typing"><span>AI</span><p>正在分析<span>•••</span></p></div>}</div>
      <div className="chat-prompts">{["材料是否合適？","尺寸有何風險？","設備能否加工？"].map(q=><button key={q} onClick={()=>setChatInput(q)}>{q}</button>)}</div>
      <form onSubmit={askAi}><textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="輸入工程問題…" rows={2}/><button disabled={!chatInput.trim()||chatting}>送出 ↑</button></form>
    </aside>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </AppLayout>;
}
