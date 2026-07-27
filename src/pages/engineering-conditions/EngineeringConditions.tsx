"use client";
import {useState} from "react";
import {AppLayout} from "../../components/layout/AppLayout";

const groups=[
  {title:"尺寸要求",icon:"↔",fields:[
    {label:"長度",unit:"mm",value:"1200"},{label:"寬度",unit:"mm",value:"1000"},
    {label:"高度",unit:"mm",value:"150"},{label:"板厚",unit:"mm",value:"22"},
  ]},
  {title:"材料要求",icon:"▰",fields:[
    {label:"指定材料",value:"北美花旗松"},{label:"可替代材料",value:"歐洲赤松、南方松"},
    {label:"禁用材料",value:"回收混合木料"},
  ]},
  {title:"施工要求",icon:"⚒",fields:[
    {label:"接合方式",value:"螺釘＋榫接"},{label:"表面處理",value:"四面砂光、防霉處理"},
    {label:"加工精度",value:"± 1.0 mm"},{label:"外觀等級",value:"A 級"},
  ]},
  {title:"製造限制",icon:"⚙",fields:[
    {label:"指定設備",value:"CNC 加工中心 01"},{label:"禁止設備",value:"手動裁切鋸"},
    {label:"指定工法",value:"自動定位鑽孔"},{label:"禁止工法",value:"人工釘合"},
  ]},
  {title:"商業條件",icon:"＄",fields:[
    {label:"成本上限",unit:"NT$",value:"2,850"},{label:"最低毛利",unit:"%",value:"18"},
    {label:"交期",unit:"天",value:"14"},
  ]},
] as const;

export default function EngineeringConditions(){
  const [toast,setToast]=useState("");
  const [completion,setCompletion]=useState(92);
  const notify=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(""),2400)};
  return <AppLayout activeIndex={2} title="STEP 02 製造商工程條件設定" project="托盤 NEW-001">
    <main className="conditions-page">
      <div className="conditions-context">
        <div><span className="context-label">客戶</span><b>大成木業有限公司</b></div>
        <div><span className="context-label">產品類別</span><b>工業用木製托盤</b></div>
        <div><span className="context-label">條件完整度</span><b className="completion-value">{completion}%</b></div>
        <span className="condition-status">● 草稿已儲存</span>
      </div>

      <div className="conditions-workspace">
        <section className="product-visual-panel">
          <div className="panel-heading"><div><span className="panel-kicker">PRODUCT PREVIEW</span><h1>托盤 NEW-001</h1></div><span className="revision-badge">REV. 03</span></div>
          <div className="pallet-stage" role="img" aria-label="木製托盤產品示意圖">
            <div className="measure measure-width">1200 mm</div>
            <div className="measure measure-depth">1000 mm</div>
            <div className="pallet-art">
              <div className="pallet-top">{[0,1,2,3,4,5].map(i=><i key={i}/>)}</div>
              <div className="pallet-blocks">{[0,1,2,3,4,5].map(i=><i key={i}/>)}</div>
              <div className="pallet-base">{[0,1,2].map(i=><i key={i}/>)}</div>
            </div>
            <div className="measure measure-height">150 mm</div>
          </div>
          <div className="product-specs">
            <div><span>用途</span><b>倉儲與國內運輸</b></div>
            <div><span>額定載重</span><b>1,200 kg</b></div>
            <div><span>數量</span><b>500 件</b></div>
          </div>
          <div className="drawing-note"><span>ⓘ</span><p>尺寸依客戶圖面 P-NEW-001-R3 建立。變更工程條件後，AI 將重新檢查設備與製程適配性。</p></div>
        </section>

        <section className="engineering-panel">
          <div className="engineering-heading"><div><span className="panel-kicker">ENGINEERING CONDITIONS</span><h2>工程條件</h2></div><button className="clear-btn" onClick={()=>{setCompletion(0);notify("條件已重設")}}>重設條件</button></div>
          <div className="condition-groups">{groups.map(group=><fieldset className="condition-group" key={group.title}>
            <legend><span>{group.icon}</span>{group.title}</legend>
            <div className="condition-fields">{group.fields.map(field=><label className="condition-field" key={field.label}><span>{field.label}</span><div className="field-control">{field.unit&&<em>{field.unit}</em>}<input defaultValue={field.value} onChange={()=>setCompletion(92)} aria-label={field.label}/></div></label>)}</div>
          </fieldset>)}</div>
        </section>
      </div>
    </main>
    <footer className="conditions-footer"><span>上次儲存：2026/07/27 15:08</span><div><button className="btn btn-secondary" onClick={()=>notify("工程條件已儲存")}>▣ 儲存條件</button><button className="btn btn-primary" onClick={()=>notify("AI 分析已啟動")}>✦ AI 開始分析 →</button></div></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
  </AppLayout>;
}
