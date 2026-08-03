"use client";

import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "@/app/dashboard/dashboard.module.css";

type QuoteOption={id:string;quoteNo:string;customerName:string};

export default function LossReasonForm({quotes}:{quotes:QuoteOption[]}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<{type:"success"|"error";text:string}|null>(null);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);
    try{
      const response=await fetch("/api/dashboard/loss-reasons",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          quote_id:form.get("quote_id"),
          reason_category:form.get("reason_category"),
          competitor_name:form.get("competitor_name")||null,
          notes:form.get("notes")||null,
        }),
      });
      const payload=await response.json() as {message?:string};
      if(!response.ok)throw new Error(payload.message??"流標原因儲存失敗");
      event.currentTarget.reset();
      setMessage({type:"success",text:"流標原因已儲存，統計已更新。"});
      router.refresh();
    }catch(error){
      setMessage({type:"error",text:error instanceof Error?error.message:"流標原因儲存失敗"});
    }finally{
      setBusy(false);
    }
  }

  return <form className={styles.lossForm} onSubmit={submit}>
    <label>報價單
      <select name="quote_id" required defaultValue="">
        <option value="" disabled>選擇報價單</option>
        {quotes.map(quote=><option key={quote.id} value={quote.id}>{quote.quoteNo} · {quote.customerName}</option>)}
      </select>
    </label>
    <label>流標原因
      <select name="reason_category" required defaultValue="價格過高">
        <option>價格過高</option>
        <option>交期過長</option>
        <option>競品搶單</option>
      </select>
    </label>
    <label>競品名稱
      <input name="competitor_name" maxLength={200} placeholder="若適用請填寫"/>
    </label>
    <label className={styles.wide}>補充說明
      <textarea name="notes" maxLength={2000} placeholder="記錄客戶回饋或後續追蹤重點"/>
    </label>
    {message&&<div className={message.type==="error"?styles.error:styles.success}>{message.text}</div>}
    <button className={styles.approveButton} disabled={busy||!quotes.length}>{busy?"儲存中…":"記錄流標"}</button>
  </form>;
}
