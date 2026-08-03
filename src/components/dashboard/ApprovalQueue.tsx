"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import styles from "@/app/dashboard/dashboard.module.css";

export type ApprovalRow={
  id:string;
  quoteNo:string;
  customerName:string;
  approvalTrigger:string;
  calculatedMargin:number|null;
  totalQuotePrice:number|null;
  versionNumber:string|null;
};

function money(value:number|null){
  return new Intl.NumberFormat("zh-TW",{style:"currency",currency:"TWD",maximumFractionDigits:0}).format(value??0);
}

export default function ApprovalQueue({initialRows}:{initialRows:ApprovalRow[]}){
  const router=useRouter();
  const [rows,setRows]=useState(initialRows);
  const [comments,setComments]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState<{type:"success"|"error";text:string}|null>(null);

  async function decide(row:ApprovalRow,action:"approve"|"return"){
    setBusy(row.id+action);
    setMessage(null);
    try{
      const response=await fetch(`/api/dashboard/approvals/${encodeURIComponent(row.id)}`,{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({action,comments:comments[row.id]??""}),
      });
      const payload=await response.json() as {message?:string;status?:string};
      if(!response.ok)throw new Error(payload.message??"簽核更新失敗");
      setRows(current=>current.filter(item=>item.id!==row.id));
      setMessage({type:"success",text:`${row.quoteNo} 已${action==="approve"?"核准":"退回"}。`});
      router.refresh();
    }catch(error){
      setMessage({type:"error",text:error instanceof Error?error.message:"簽核更新失敗"});
    }finally{
      setBusy(null);
    }
  }

  if(!rows.length){
    return <div className={styles.empty}>目前沒有待簽核報價。</div>;
  }

  return <div className={styles.queue}>
    {message&&<div className={message.type==="error"?styles.error:styles.success}>{message.text}</div>}
    {rows.map(row=><article className={styles.approvalCard} key={row.id}>
      <div className={styles.approvalMain}>
        <div>
          <span className={styles.quoteNo}>{row.quoteNo}</span>
          <h2>{row.customerName}</h2>
          <p>{row.approvalTrigger||"風控條件觸發"}</p>
        </div>
        <dl className={styles.metrics}>
          <div><dt>版本</dt><dd>{row.versionNumber??"—"}</dd></div>
          <div><dt>毛利率</dt><dd className={(row.calculatedMargin??0)<0.2?styles.danger:""}>{((row.calculatedMargin??0)*100).toFixed(1)}%</dd></div>
          <div><dt>報價金額</dt><dd>{money(row.totalQuotePrice)}</dd></div>
        </dl>
      </div>
      <div className={styles.approvalActions}>
        <input
          aria-label={`${row.quoteNo} 簽核意見`}
          placeholder="簽核意見（選填）"
          value={comments[row.id]??""}
          onChange={event=>setComments(current=>({...current,[row.id]:event.target.value}))}
        />
        <button className={styles.returnButton} disabled={busy!==null} onClick={()=>decide(row,"return")}>
          {busy===row.id+"return"?"處理中…":"退回"}
        </button>
        <button className={styles.approveButton} disabled={busy!==null} onClick={()=>decide(row,"approve")}>
          {busy===row.id+"approve"?"處理中…":"核准"}
        </button>
      </div>
    </article>)}
  </div>;
}
