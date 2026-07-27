"use client";
export function FooterAction({onSave}:{onSave:()=>void}) {
  return <footer className="footer-action">
    <button className="btn btn-secondary">← 返回</button>
    <div className="footer-right"><span className="save-state">所有變更將記錄於案件歷程</span><button className="btn btn-secondary" onClick={onSave}>儲存草稿</button><button className="btn btn-primary">確認並導入生產　→</button></div>
  </footer>;
}
