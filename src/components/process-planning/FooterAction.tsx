"use client";
export function FooterAction({onSave,onConfirm}:{onSave:()=>void;onConfirm:()=>void}){return <footer className="footer-action"><div className="footer-right"><button className="btn btn-secondary">← 返回上一步</button><button className="btn btn-outline" onClick={onSave}>▣ 保存分析結果</button><button className="btn btn-primary" onClick={onConfirm}>✓ 確認並導入訂單</button></div></footer>}
