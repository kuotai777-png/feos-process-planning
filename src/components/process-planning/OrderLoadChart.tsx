import { ganttRows, orderSummary } from "../../mock/orders";
export function OrderLoadChart() {
  const dates=["08/10","08/11","08/12","08/13","08/14","08/15","08/16"];
  return <>
    <div className="card order-summary">
      {([["目前訂單",orderSummary.total],["進行中",orderSummary.processing],["待排程",orderSummary.waiting],["已排程",orderSummary.scheduled]] as const).map(([k,v])=>
        <div className="summary-item" key={k}><span>{k}</span><b>{v}<small className="muted"> 件</small></b></div>)}
    </div>
    <div className="card gantt-card"><div className="gantt">
      <div className="gantt-head"><div style={{textAlign:"left"}}>設備</div>{dates.map(d=><div key={d}>{d}</div>)}<div>預估空檔</div></div>
      {ganttRows.map((r,i)=><div className="gantt-row" key={r.name}>
        <div className="gantt-name">{r.name}<span className="sub">負載 {78+i*5}%</span></div>
        {dates.map(d=><div className="gantt-cell" key={d}/>)}
        <div className={`gantt-bar ${r.tone}`} style={{gridColumn:`${r.start+1} / span ${r.span}`,gridRow:1}}>{r.label}</div>
        <div className="muted" style={{gridColumn:9,gridRow:1,textAlign:"center"}}>{i<2?"08/13":"08/16"}</div>
      </div>)}
      <div className="muted" style={{marginTop:14}}>預估交期：2026/08/22　｜　不影響其他已承諾訂單</div>
    </div></div>
  </>;
}
