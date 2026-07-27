"use client";
export function HumanDecisionPanel({selected,onSelect}:{selected:string,onSelect:(v:string)=>void}) {
  const edits=["修改加工流程","修改設備配置","修改加工順序","修改工時","修改成本","新增加工規則","建立公司案例"];
  const writes=["加工案例","設備能力","成本資料","品質案例","工程經驗"];
  return <div className="card">
    <div className="decision-grid">
      <div className="decision-col"><h3 className="col-title">決策方案</h3><div className="choice-list">
        {["採用方案 A","採用方案 B","採用方案 C","自訂方案"].map(v=><label className="choice" key={v}><input type="radio" name="plan" checked={selected===v} onChange={()=>onSelect(v)}/>{v}</label>)}
      </div></div>
      <div className="decision-col"><h3 className="col-title">人工修改項目</h3><div className="choice-list">
        {edits.map((v,i)=><label className="choice" key={v}><input type="checkbox" defaultChecked={i===0||i===2}/>{v}</label>)}
      </div></div>
      <div className="decision-col"><h3 className="col-title">寫入企業知識庫</h3><div className="choice-list">
        <label className="choice"><input type="checkbox" defaultChecked/><b>同步本次決策知識</b></label>
        {writes.map((v,i)=><label className="choice" key={v}><input type="checkbox" defaultChecked={i<2}/>{v}</label>)}
      </div></div>
    </div>
    <div className="textarea-wrap"><h3 className="col-title">決策備註</h3><textarea aria-label="決策備註" placeholder="請輸入方案調整原因、風險說明或交接事項…"/></div>
  </div>;
}
