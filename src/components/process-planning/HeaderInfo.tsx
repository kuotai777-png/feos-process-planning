const steps = ["需求接收","AI 初步分析","人工修正協作","AI 複驗","AI 分析報告","加工流程規劃","人工決策","導入生產","結案回寫"];

export function HeaderInfo() {
  const info = [
    ["專案名稱","Nordic 系列模組櫃量產案"],["客戶名稱","森域空間設計有限公司"],
    ["建立日期","2026/07/18"],["分析版本","v3.2"],["案件狀態",<span className="status-pill" key="status"><i className="status-dot"/>AI 規劃中</span>],
  ];
  return <>
    <div className="title-row">
      <div><div className="eyebrow">STEP 06</div><h1>AI 加工流程規劃</h1></div>
      <span className="version-pill">分析模型 FEOS-AI 3.2</span>
    </div>
    <div className="stepper" aria-label="案件流程">
      {steps.map((label,i)=><div className={`step ${i<5?"done":""} ${i===5?"active":""}`} key={label}>
        <div className="step-num">{i<5?"✓":String(i+1).padStart(2,"0")}</div><div>{label}</div>
      </div>)}
    </div>
    <div className="info-grid">
      {info.map(([label,value])=><div className="info-item" key={String(label)}>
        <div className="info-label">{label}</div><div className="info-value">{value}</div>
      </div>)}
    </div>
  </>;
}
