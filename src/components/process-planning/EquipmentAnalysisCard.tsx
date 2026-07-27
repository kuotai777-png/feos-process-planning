import { equipment } from "../../mock/equipment";
export function EquipmentAnalysisCard() {
  return <div className="split-grid">
    <div className="card fit-summary">
      <div className="muted">整體設備適配率</div><div className="big-number">91%</div>
      <div className="bar"><i style={{width:"91%"}}/></div>
      <div className="yes-box">✓ 可直接生產</div>
      <p className="muted">現有設備可完成全部製程，僅需微調鑽孔中心排程。</p>
    </div>
    <div className="card table-card"><table>
      <thead><tr><th>設備</th><th>設備狀態</th><th>適配率</th><th>瓶頸分析</th><th>建議</th></tr></thead>
      <tbody>{equipment.map(row=><tr key={row.code}>
        <td className="equipment-name">{row.name}<span className="sub">{row.code}</span></td>
        <td><span className={`tag ${row.status==="高負載"||row.status==="保養預排"?"tag-amber":"tag-green"}`}>{row.status}</span></td>
        <td><b>{row.fit}%</b></td><td>{row.bottleneck}</td><td>{row.advice}</td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}
