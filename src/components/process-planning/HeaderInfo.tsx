const steps = ["需求接收","AI 初步分析","人工修正","AI 複驗","AI 分析報告","加工流程規劃"];
export function HeaderInfo() {
  const info=[["專案名稱","托盤 NEW-001"],["客戶名稱","大成木業有限公司"],["建立日期","2026/07/21"],["分析版本","V1.0"]];
  return <>
    <div className="stepper" aria-label="案件流程">{steps.map((label,i)=><div className={`step ${i===5?"active":""}`} key={label}><div className="step-num">{String(i+1).padStart(2,"0")}</div><div>{label}</div></div>)}<div className="head-tools"><button>▧ 匯出報告</button><button>▣ 列印</button></div></div>
    <div className="info-grid">{info.map(([label,value])=><div className="info-item" key={label}><div className="info-value"><span>{label}：</span>{value}</div></div>)}</div>
  </>;
}
