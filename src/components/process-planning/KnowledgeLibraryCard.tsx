import { knowledgeSources } from "../../mock/knowledge";
export function KnowledgeLibraryCard() {
  return <div className="card knowledge-grid">
    <div className="knowledge-score">
      <div className="donut" style={{"--value":86} as React.CSSProperties} data-label="86%"/>
      <div><b>知識完整度</b><p className="muted">資料覆蓋良好<br/>可支援本次決策</p></div>
    </div>
    <div className="source-list">{knowledgeSources.map((s,i)=><div className="source-line" key={s.name}>
      <span><i className="source-dot" style={{opacity:1-i*.1}}/>{s.name}</span><b>{s.count} 筆</b>
    </div>)}</div>
    <div className="knowledge-actions"><button className="btn btn-secondary">檢視引用資料</button><button className="btn btn-primary">＋ 新增人工知識</button></div>
  </div>;
}
