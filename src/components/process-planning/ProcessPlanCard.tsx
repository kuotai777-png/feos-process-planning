import type { processPlans } from "../../mock/processPlan";
type Plan = (typeof processPlans)[number];

export function ProcessPlanCard({plan}:{plan:Plan}) {
  return <article className={`card plan-card ${plan.recommended?"recommended":""}`}>
    <div className="plan-top">
      <div className="plan-heading">
        <div><h3 className="plan-letter">方案 {plan.id}</h3><div className="plan-sub">{plan.name}</div></div>
        {plan.recommended&&<span className="tag tag-blue">AI 推薦</span>}
      </div>
      <div className="cp"><strong>{plan.cp}</strong><span>CP 值 / 100</span></div>
    </div>
    <div className="metric-grid">
      <div className="metric">預估成本<b>{plan.cost}</b></div>
      <Metric label="品質" value={plan.quality}/><Metric label="效率" value={plan.efficiency}/>
      <Metric label="設備適配" value={plan.fit}/><Metric label="可信度" value={plan.confidence}/>
    </div>
    <div className="evidence-row">
      <div className="donut" style={{"--value":plan.evidence} as React.CSSProperties} data-label={`${plan.evidence}%`}/>
      <div className="evidence-text"><b>證據比例</b><br/>引用資料：{plan.sources}</div>
    </div>
    <button className="card-action">查看完整證據 →</button>
  </article>;
}

function Metric({label,value}:{label:string,value:number}) {
  return <div className="metric">{label}<b>{value}%</b><div className="bar"><i style={{width:`${value}%`}}/></div></div>;
}
