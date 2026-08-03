import {desc,eq} from "drizzle-orm";
import Link from "next/link";
import {requireChatGPTUser} from "@/app/chatgpt-auth";
import {getDb} from "@/db";
import {quotes,quoteVersions} from "@/db/schema";
import {isApprovalManagerEmail} from "@/lib/auth/manager";
import ApprovalQueue,{type ApprovalRow} from "@/src/components/dashboard/ApprovalQueue";
import styles from "../dashboard.module.css";

export const dynamic="force-dynamic";
export const runtime="edge";

export default async function ApprovalsPage(){
  const user=await requireChatGPTUser("/dashboard/approvals");
  if(!isApprovalManagerEmail(user.email)){
    return <main className={styles.shell}><section className={styles.denied}>
      <span>403</span><h1>無主管簽核權限</h1>
      <p>請由系統管理員將您的 Email 加入 APPROVAL_MANAGER_EMAILS 白名單。</p>
    </section></main>;
  }

  const db=getDb();
  const records=await db.select({
    id:quotes.id,
    quoteNo:quotes.quoteNo,
    customerName:quotes.customerName,
    approvalTrigger:quotes.approvalTrigger,
    calculatedMargin:quoteVersions.calculatedMargin,
    totalQuotePrice:quoteVersions.totalQuotePrice,
    versionNumber:quoteVersions.versionNumber,
    createdAt:quoteVersions.createdAt,
  }).from(quotes)
    .leftJoin(quoteVersions,eq(quoteVersions.quoteId,quotes.id))
    .where(eq(quotes.status,"PENDING_APPROVAL"))
    .orderBy(desc(quoteVersions.createdAt));

  const latest=new Map<string,ApprovalRow>();
  for(const record of records){
    if(!latest.has(record.id))latest.set(record.id,{
      id:record.id,
      quoteNo:record.quoteNo,
      customerName:record.customerName,
      approvalTrigger:record.approvalTrigger??"",
      calculatedMargin:record.calculatedMargin,
      totalQuotePrice:record.totalQuotePrice,
      versionNumber:record.versionNumber,
    });
  }

  return <main className={styles.shell}>
    <header className={styles.header}>
      <div><span className={styles.kicker}>CPQ RISK CONTROL</span><h1>管理者簽核中心</h1><p>低毛利與非標件報價會在此鎖定，完成主管決策後才可轉正式工單。</p></div>
      <nav><Link className={styles.activeLink} href="/dashboard/approvals">待簽核</Link><Link href="/dashboard/analytics">流標分析</Link></nav>
    </header>
    <section className={styles.summaryStrip}>
      <div><span>待簽核案件</span><strong>{latest.size}</strong></div>
      <div><span>風控門檻</span><strong>20%</strong></div>
      <div><span>登入主管</span><strong className={styles.email}>{user.email}</strong></div>
    </section>
    <ApprovalQueue initialRows={[...latest.values()]}/>
  </main>;
}
