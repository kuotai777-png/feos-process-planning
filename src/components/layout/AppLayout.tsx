export function AppLayout({children}:{children:React.ReactNode}) {
  const items=[["⌂","總覽中心"],["▣","案件管理"],["✦","AI 智慧分析"],["◫","生產排程"],["⚙","設備管理"],["◇","企業知識庫"],["▤","報表中心"]];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">F</span><span className="brand-text">FEOS</span></div>
      <div className="side-label">MANAGEMENT</div><nav className="side-nav">{items.map(([icon,label],i)=>
        <div className={`side-item ${i===2?"active":""}`} key={label}><span className="side-icon">{icon}</span><span>{label}</span></div>)}</nav>
      <div className="side-foot"><span className="avatar">林</span><div><b>林志偉</b><span className="sub">生產管理員</span></div></div>
    </aside>
    <div className="main-wrap">
      <header className="topbar"><button className="icon-btn mobile-menu">☰</button><div className="crumb">案件管理　/　AI 加工流程規劃</div><div className="top-actions"><button className="icon-btn">?</button><button className="icon-btn">♢</button><span className="avatar">林</span></div></header>
      {children}
    </div>
  </div>;
}
