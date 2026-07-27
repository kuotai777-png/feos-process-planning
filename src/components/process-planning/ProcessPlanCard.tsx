import type { processPlans } from "../../mock/processPlan";
type Plan=(typeof processPlans)[number];
export function ProcessPlanCard({plan}:{plan:Plan}) {
  return <article className={`card plan-card plan-${plan.id.toLowerCase()}`}>
    <div className="plan-top"><div className="plan-heading"><h3 className="plan-letter">方案 {plan.id}<span>（{plan.name}）</span></h3>{plan.recommended&&<span className="tag tag-green">AI 推薦</span>}<div className="cp"><span>CP 值</span><strong>{plan.cp}</strong></div></div></div>
    <div className="rating-list"><Stars label="成本" value={plan.id==="A"?5:plan.id==="B"?4:2}/><Stars label="品質" value={Math.round(plan.quality/20)}/><Stars label="效率" value={Math.round(plan.efficiency/20)}/><div className="rating-line"><span>設備適配率</span><b>{plan.fit}%</b></div></div>
    <div className="plan-description"><b>方案說明</b><p>{plan.id==="A"?"依現有設備能力進行最佳化流程安排，減少換刀與等待次數，提升整體效率。":plan.id==="B"?"調整加工順序，將部分工序前置，縮短整體加工時間。":"導入自動化設備，提升產能與精度，適合長期大量訂單。"}</p></div>
    <div className="evidence-title">提出依據（證據比例）</div><div className="evidence-row"><div className="donut multi"/><div className="evidence-legend">{["官方標準","技術文件","產業案例","學術研究","公司歷史案例"].map((x,i)=><div key={x}><i className={`legend-${i}`}/><span>{x}</span><b>{[30,25,20,15,10][i]}%</b></div>)}</div></div>
    <div className="references"><b>引用資料（部分）</b><ul><li>ISO 6789:2017 木材結構標準</li><li>CNS 2215 木製品加工規範</li><li>Wood Handbook 第十七版</li><li>公司案例 CASE-045、CASE-067</li></ul></div>
    <div className="confidence">可信度 <b>{plan.confidence}%</b></div>
  </article>;
}
function Stars({label,value}:{label:string,value:number}){return <div className="rating-line"><span>{label}</span><b className="stars">{"★".repeat(value)}<i>{"☆".repeat(5-value)}</i></b></div>}
