import type {Metadata} from "next";
import {notFound} from "next/navigation";
import OwnerQuoteView from "@/src/components/quote/OwnerQuoteView";
import {getOwnerQuote} from "@/lib/quotes/get-owner-quote";
import styles from "./quote-view.module.css";

export const dynamic="force-dynamic";

export const metadata:Metadata={
  title:"線上報價確認｜FEOS",
  description:"安全檢視家具材質方案並完成電子簽約。",
  robots:{index:false,follow:false},
};

export default async function QuoteViewPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const result=await getOwnerQuote(id);
  if(result.kind==="not_found")notFound();
  if(result.kind==="unsafe_or_invalid"){
    return <main className={styles.page}><section className={styles.unavailable}><span>FEOS</span><h1>對客報價版本尚未準備完成</h1><p>此報價資料未通過對客安全檢查，系統未顯示任何內容。請聯絡業務重新產生報價版本。</p></section></main>;
  }
  return <OwnerQuoteView
    quoteId={result.quoteId}
    versionId={result.versionId}
    versionNumber={result.versionNumber}
    initialStatus={result.status}
    quote={result.data}
  />;
}