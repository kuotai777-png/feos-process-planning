"use client";
import {ChangeEvent,useMemo,useRef,useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";

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

export default function EngineeringConditions(){
  const [toast,setToast]=useState("");
  const [values,setValues]=useState<Record<string,string>>(initialValues);
  const [imageUrl,setImageUrl]=useState("");
  const [fileName,setFileName]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiReady,setAiReady]=useState(false);
  const fileInput=useRef<HTMLInputElement>(null);
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
    if(imageUrl)URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setAiReady(false);
    notify("產品圖片已載入");
  };
  const removeImage=()=>{
    if(imageUrl)URL.revokeObjectURL(imageUrl);
    setImageUrl("");setFileName("");setAiReady(false);
    if(fileInput.current)fileInput.current.value="";
  };
  const analyze=()=>{
    if(!imageUrl){notify("請先載入產品圖片，再啟動 AI 預判");chooseFile();return}
    setAnalyzing(true);setAiReady(false);
    window.setTimeout(()=>{
      setValues(aiPredictions);
      setAnalyzing(false);setAiReady(true);
      notify("AI 預判完成，所有欄位皆可人工修改");
    },1500);
  };
  const reset=()=>{setValues(Object.fromEntries(Object.keys(initialValues).map(k=>[k,""])));setAiReady(false);notify("條件已重設，可人工重新輸入")};

  return <AppLayout activeIndex={2} title="STEP 02 製造商工程條件設定" project="托盤 NEW-001">
    <main className="conditions-page">
      <div className="conditions-context">
        <div><span className="context-label">客戶</span><b>大成木業有限公司</b></div>
        <div><span className="context-label">產品類別</span><b>工業用木製托盤</b></div>
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
          <div className="engineering-heading"><div><span className="panel-kicker">ENGINEERING CONDITIONS</span><h2>工程條件</h2></div><div className="input-mode"><span className={aiReady?"active":""}>AI 建議</span><span className="active">人工可編輯</span></div><button className="clear-btn" onClick={reset}>重設條件</button></div>
          {aiReady&&<div className="ai-notice">✦ AI 已填入預判值　<span>藍色標記代表 AI 建議，請人工覆核後儲存。</span></div>}
          <div className="condition-groups">{groups.map(group=><fieldset className="condition-group" key={group.title}>
            <legend><span>{group.icon}</span>{group.title}</legend>
            <div className="condition-fields">{group.fields.map(field=><label className={`condition-field ${aiReady?"ai-suggested":""}`} key={field.key}><span>{field.label}{aiReady&&<small>AI</small>}</span><div className="field-control">{field.unit&&<em>{field.unit}</em>}<input value={values[field.key]??""} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))} aria-label={field.label}/></div></label>)}</div>
          </fieldset>)}</div>
        </section>
      </div>
    </main>
    <footer className="conditions-footer"><span>資料來源：產品圖片＋人工工程條件</span><div><button className="btn btn-secondary" onClick={()=>notify("工程條件已儲存")}>▣ 儲存條件</button><button className="btn btn-primary ai-action" onClick={analyze} disabled={analyzing}>{analyzing?"AI 分析中…":"✦ AI 工程條件預判"}</button></div></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
  </AppLayout>;
}
