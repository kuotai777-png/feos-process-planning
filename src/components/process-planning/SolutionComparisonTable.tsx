import { solutions } from "../../mock/processPlan";
export function SolutionComparisonTable() {
  return <div className="card table-card"><table>
    <thead><tr><th>方案</th><th>成本</th><th>時間</th><th>品質</th><th>風險</th><th>CP 值</th><th>AI 推薦程度</th><th>說明</th></tr></thead>
    <tbody>{solutions.map((s,i)=><tr key={s.name} className={i===0?"solution-best":""}>
      <td><b>{s.name}</b>{i===0&&<span className="sub recommend">AI 首選</span>}</td><td>{s.cost}</td><td>{s.time}</td><td>{s.quality}</td>
      <td><span className={`tag ${s.risk==="低"?"tag-green":"tag-amber"}`}>{s.risk}</span></td><td><b>{s.cp}</b></td><td className="recommend">{s.recommend}</td><td>{s.desc}</td>
    </tr>)}</tbody>
  </table></div>;
}
