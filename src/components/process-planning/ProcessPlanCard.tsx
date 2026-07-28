import type { processPlans } from "../../mock/processPlan";
type Plan=(typeof processPlans)[number];
const refs={
  A:["ISO 6789:2017 木材結構標準","CNS 2215 木製品加工規範","Wood Handbook 第十七版","業界最佳實務報告 2024"],
  B:["ASTM D5456-23 木材加工標準","設備技術手冊（CNC 加工中心）","產線系統報告 2023","公司案例 CASE-032、CASE-089"],
  C:["ISO 19085-5 自動化加工標準","自動化設備技術白皮書 2024","產業趨勢報告 2024","公司案例 CASE-015、CASE-028"],
};
export function ProcessPlanCard({plan,selected=false,onSelect}:{plan:Plan;selected?:boolean;onSelect?:()=>void}) {
  const description=plan.id==="A"?"依現有設備能力進行最佳化流程安排，減少換刀與等待次數，提升整體效率。":plan.id==="B"?"調整加工順序，將部分工序前置，縮短整體加工時間。":"導入自動化設備，提升產能與精度，適合長期大量訂單。";
  const weights=plan.id==="C"?[20,20,25,15,20]:plan.id==="B"?[25,25,25,15,10]:[30,25,20,15,10];
  return <article role="button" tabIndex={0} aria-pressed={selected} onClick={onSelect} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")onSelect?.()}} className={`card plan-card plan-${plan.id.toLowerCase()} ${selected?"selected":""}`}>
    <div className="plan-top"><div className="plan-heading"><h3 className="plan-letter">方案 {plan.id} <span>（{plan.name}）</span></h3>{plan.recommended&&<span className="tag tag-green">AI 推薦</span>}<div className="cp"><span>CP 值</span><strong>{plan.cp}</strong></div></div></div>
    <div className="rating-list"><Stars label="成本" value={plan.id==="A"?5:plan.id==="B"?4:2}/><Stars label="品質" value={Math.round(plan.quality/20)}/><Stars label="效率" value={Math.round(plan.efficiency/20)}/><div className="rating-line"><span>設備適配率</span><b>{plan.fit}%</b></div></div>
    <div className="plan-description"><b>方案說明</b><p>{description}</p></div>
    <div className="evidence-title">提出依據（證據比例）</div><div className="evidence-row"><div className="donut multi"/><div className="evidence-legend">{["官方標準","技術文件","產業案例","學術研究","公司歷史案例"].map((x,i)=><div key={x}><i className={`legend-${i}`}/><span>{x}</span><b>{weights[i]}%</b></div>)}</div></div>
    <div className="references"><b>引用資料（部分）</b><ul>{refs[plan.id].map(r=><li key={r}>{r}</li>)}</ul></div>
    <div className="confidence">{selected&&<span className="selected-plan-mark">✓ 已選擇　</span>}可信度 <b>{plan.confidence}%</b></div>
  </article>;
}
function Stars({label,value}:{label:string,value:number}){return <div className="rating-line"><span>{label}</span><b className="stars">{"★".repeat(value)}<i>{"☆".repeat(5-value)}</i></b></div>}
