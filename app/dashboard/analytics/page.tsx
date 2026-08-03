import {asc,ne} from "drizzle-orm";
import Link from "next/link";
import {requireChatGPTUser} from "@/app/chatgpt-auth";
import {getDb} from "@/db";
import {lossReasons,quotes} from "@/db/schema";
import {isApprovalManagerEmail} from "@/lib/auth/manager";
import LossReasonForm from "@/src/components/dashboard/LossReasonForm";
import styles from "../dashboard.module.css";

export const dynamic="force-dynamic";
export const runtime="edge";

const categoryMeta=[
  {code:"PRICE_TOO_HIGH",name:"價格過高",color:"#d97706"},
  {code:"LEAD_TIME_TOO_LONG",name:"交期過長",color:"#2563eb"},
  {code:"COMPETITOR_WON",name:"競品搶單",color:"#8b5cf6"},
] as const;

export default async function AnalyticsPage(){
  const user=await requireChatGPTUser("/dashboard/analytics");
  if(!isApprovalManagerEmail(user.email)){
    return <main className={styles.shell}><section className={styles.denied}>
      <span>403</span><h1>無分析頁存取權限</h1>
      <p>請由系統管理員將您的 Email 加入 APPROVAL_MANAGER_EMAILS 白名單。</p>
    </section></main>;
  }

  const db=getDb();
  const [losses,quoteOptions]=await Promise.all([
    db.select({
      id:lossReasons.id,
      category:lossReasons.reasonCategory,
      competitor:lossReasons.competitorName,
    }).from(lossReasons),
    db.select({id:quotes.id,quoteNo:quotes.quoteNo,customerName:quotes.customerName})
      .from(quotes).where(ne(quotes.status,"LOST")).orderBy(asc(quotes.quoteNo)),
  ]);

  const counts=categoryMeta.map(item=>({
    ...item,
    count:losses.filter(loss=>loss.category===item.code).length,
  }));
  const total=losses.length;
  let cursor=0;
  const segments=counts.map(item=>{
    const start=total?cursor/total*100:0;
    cursor+=item.count;
    const end=total?cursor/total*100:0;
    return `${item.color} ${start}% ${end}%`;
  });
  const pieBackground=total?`conic-gradient(${segments.join(",")})`:"#e2e8f0";
  const maxCount=Math.max(1,...counts.map(item=>item.count));

  const competitorCounts=new Map<string,number>();
  for(const loss of losses){
    const name=loss.competitor?.trim();
    if(name)competitorCounts.set(name,(competitorCounts.get(name)??0)+1);
  }
  const competitors=[...competitorCounts].sort((a,b)=>b[1]-a[1]).slice(0,5);

  return <main className={styles.shell}>
    <header className={styles.header}>
      <div><span className={styles.kicker}>WIN / LOSS INTELLIGENCE</span><h1>流標原因分析</h1><p>集中記錄未成交原因，辨識價格、交期與競品造成的流失趨勢。</p></div>
      <nav><Link href="/dashboard/approvals">待簽核</Link><Link className={styles.activeLink} href="/dashboard/analytics">流標分析</Link></nav>
    </header>
    <section className={styles.analyticsGrid}>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><span>原因占比</span><h2>流標分類</h2></div><strong>{total} 件</strong></div>
        <div className={styles.pieWrap}>
          <div className={styles.pie} style={{background:pieBackground}}><span>{total}<small>總案件</small></span></div>
          <div className={styles.legend}>{counts.map(item=><div key={item.name}><i style={{background:item.color}}/><span>{item.name}</span><b>{item.count}</b></div>)}</div>
        </div>
      </article>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><span>件數比較</span><h2>原因排行</h2></div></div>
        <div className={styles.bars}>{counts.map(item=><div key={item.name}>
          <header><span>{item.name}</span><b>{item.count}</b></header>
          <i><em style={{width:`${item.count/maxCount*100}%`,background:item.color}}/></i>
        </div>)}</div>
      </article>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><span>競爭情報</span><h2>主要競品</h2></div></div>
        {competitors.length?<ol className={styles.competitors}>{competitors.map(([name,count])=><li key={name}><span>{name}</span><b>{count} 件</b></li>)}</ol>:<div className={styles.emptySmall}>尚無競品資料</div>}
      </article>
      <article className={`${styles.panel} ${styles.formPanel}`}>
        <div className={styles.panelTitle}><div><span>NEW RECORD</span><h2>記錄流標原因</h2></div></div>
        <LossReasonForm quotes={quoteOptions}/>
      </article>
    </section>
  </main>;
}
