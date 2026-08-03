"use client";

import {useMemo,useState} from "react";
import type {ClientFacingQuote} from "@/lib/quotes/client-facing";
import SignatureCanvas from "./SignatureCanvas";
import styles from "@/app/quote/[id]/view/quote-view.module.css";

interface OwnerQuoteViewProps{
  quoteId:string;
  versionId:string;
  versionNumber:string;
  initialStatus:string;
  quote:ClientFacingQuote;
}

function formatMoney(value:number,currency:string){
  try{return new Intl.NumberFormat("zh-TW",{style:"currency",currency,maximumFractionDigits:0}).format(value)}
  catch{return currency+" "+Math.round(value).toLocaleString("zh-TW")}
}

export default function OwnerQuoteView({quoteId,versionId,versionNumber,initialStatus,quote}:OwnerQuoteViewProps){
  const [selectedCode,setSelectedCode]=useState<"A"|"B"|"C">("A");
  const [signature,setSignature]=useState<string|null>(null);
  const [status,setStatus]=useState(initialStatus);
  const [submitting,setSubmitting]=useState(false);
  const [message,setMessage]=useState("");
  const selected=useMemo(()=>quote.options.find(option=>option.code===selectedCode)??quote.options[0],[quote.options,selectedCode]);
  const signed=status==="SIGNED";
  const selectedTotal=selected.total_price??selected.unit_price*selected.quantity;

  const confirmSigning=async()=>{
    if(!signature){setMessage("請先完成電子簽名。");return}
    setSubmitting(true);setMessage("");
    try{
      const response=await fetch("/api/quotes/"+encodeURIComponent(quoteId)+"/sign",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({quote_version_id:versionId,signature_data_url:signature}),
      });
      const body=await response.json() as {status?:string;message?:string;signed_at?:string};
      if(!response.ok)throw new Error(body.message??"簽約失敗，請稍後再試");
      setStatus("SIGNED");
      setMessage("簽約完成。系統已安全記錄本次簽署。");
    }catch(error){
      setMessage(error instanceof Error?error.message:"簽約失敗，請稍後再試");
    }finally{setSubmitting(false)}
  };

  return <main className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}><span>F</span><div><b>FEOS</b><small>FURNITURE QUOTATION</small></div></div>
      <div className={styles.securityBadge}><i/> 僅顯示對客報價資料</div>
    </header>

    <section className={styles.hero}>
      <div><span className={styles.kicker}>ONLINE QUOTATION · VERSION {versionNumber}</span><h1>{quote.quote_title}</h1><p>{quote.customer_name} 您好，請比較以下材質方案並完成線上簽約。</p></div>
      <div className={styles.quoteMeta}><small>報價單號</small><b>{quote.quote_no}</b><span>{quote.valid_until?"有效期限 "+quote.valid_until:"請依報價說明期限確認"}</span></div>
    </section>

    <section className={styles.workspace}>
      <div className={styles.content}>
        <section className={styles.productCard}>
          <div><span>客製品項</span><h2>{quote.product_name}</h2></div>
          <span className={signed?styles.signedPill:styles.pendingPill}>{signed?"已完成簽約":"待業主確認"}</span>
        </section>

        <section className={styles.optionsSection}>
          <div className={styles.sectionHeading}><div><span>01</span><h2>選擇材質方案</h2></div><small>點選 A／B／C 即時比對</small></div>
          <div className={styles.optionTabs}>
            {quote.options.map(option=><button
              key={option.code}
              type="button"
              className={option.code===selected.code?styles.optionActive:styles.optionButton}
              onClick={()=>setSelectedCode(option.code)}
            >
              <span>{option.code}</span><div><b>{option.name}</b><small>{option.material}</small></div><strong>{formatMoney(option.total_price??option.unit_price*option.quantity,quote.currency)}</strong>
            </button>)}
          </div>

          <article className={styles.optionDetail}>
            <div className={styles.materialVisual}><span>方案 {selected.code}</span><div/><b>{selected.material}</b></div>
            <div className={styles.detailCopy}><span>SELECTED MATERIAL</span><h3>{selected.name}</h3><p>{selected.description||"依確認樣板與圖面規格製作。"}</p>
              <ul>{selected.specifications.map(spec=><li key={spec}>{spec}</li>)}</ul>
            </div>
            <dl>
              <div><dt>數量</dt><dd>{selected.quantity} 件</dd></div>
              {selected.lead_days&&<div><dt>預估交期</dt><dd>{selected.lead_days} 天</dd></div>}
              <div><dt>對客單價</dt><dd>{formatMoney(selected.unit_price,quote.currency)}</dd></div>
            </dl>
          </article>
        </section>

        {quote.notes&&<section className={styles.notes}><span>報價說明</span><p>{quote.notes}</p></section>}
      </div>

      <aside className={styles.signingCard}>
        <div className={styles.totalBlock}><span>所選方案總額</span><b>{formatMoney(selectedTotal,quote.currency)}</b><small>方案 {selected.code} · {selected.name}</small></div>
        <div className={styles.agreement}><b>簽約確認</b><p>本人已閱讀並同意本報價版本、所選材質方案及相關製作條件。</p></div>
        {signed?<div className={styles.signedPanel}><span>✓</span><b>本報價已完成簽署</b><p>如需變更方案，請聯絡業務建立新的報價版本。</p></div>:<>
          <SignatureCanvas onChange={setSignature} disabled={submitting}/>
          <button className={styles.signButton} type="button" onClick={confirmSigning} disabled={submitting||!signature}>{submitting?"正在確認簽約…":"確認簽約"}</button>
        </>}
        {message&&<p className={styles.message} role="status">{message}</p>}
        <small className={styles.privacy}>系統不會在此頁面傳送採購單價、損耗率、製造成本、毛利或機台折舊資料。</small>
      </aside>
    </section>
  </main>;
}