"use client";
export function FooterAction({onSave}:{onSave:()=>void}){return <footer className="footer-action"><div className="footer-right"><button className="btn btn-secondary">←　返回上一步</button><button className="btn btn-outline" onClick={onSave}>▣　保存分析結果</button><button className="btn btn-primary">✓　確認並導入訂單</button></div></footer>}
