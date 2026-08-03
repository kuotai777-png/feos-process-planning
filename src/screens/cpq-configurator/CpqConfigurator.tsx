"use client";

import {useEffect,useMemo,useState} from "react";
import {calculateQuote,formatTwd,MATERIALS,MaterialCode} from "../../lib/cpqQuote";
import {SOLANA_PAYMENT_ENABLED} from "../../lib/solanaPayment";
import Furniture3DPreview from "../../components/cpq/Furniture3DPreview";

const materialSwatches:Record<MaterialCode,string>={OAK:"#c99b63",WALNUT:"#65452f",ASH:"#d8bd92",LAMINATE:"#b8afa0"};

export default function CpqConfigurator(){
  const [length,setLength]=useState(1800);
  const [width,setWidth]=useState(900);
  const [height,setHeight]=useState(750);
  const [quantity,setQuantity]=useState(1);
  const [materialCode,setMaterialCode]=useState<MaterialCode>("OAK");
  const [customerName,setCustomerName]=useState("王先生");
  const [companyName,setCompanyName]=useState("木日空間設計");
  const [notes,setNotes]=useState("桌面四角導圓，霧面透明保護漆。交貨前請提供材色樣板確認。");
  const [exporting,setExporting]=useState(false);
  const [exportingDxf,setExportingDxf]=useState(false);
  const [storedQuoteId,setStoredQuoteId]=useState("");
  const [message,setMessage]=useState("");
  const dimensions=useMemo(()=>({length,width,height}),[length,width,height]);
  const quote=useMemo(()=>calculateQuote({dimensions,materialCode,quantity}),[dimensions,materialCode,quantity]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const timer=window.setTimeout(()=>setStoredQuoteId(params.get("quoteId")??params.get("quote_id")??""),0);
    return ()=>window.clearTimeout(timer);
  },[]);

  async function exportDxf(){
    if(!storedQuoteId){setMessage("請先儲存報價，取得報價 ID 後再匯出 DXF。");return}
    setExportingDxf(true);setMessage("");
    try{
      const response=await fetch(`/api/quotes/${encodeURIComponent(storedQuoteId)}/export-dxf`);
      if(!response.ok){
        const payload=await response.json().catch(()=>({})) as {message?:string};
        throw new Error(payload.message??"DXF 產生失敗");
      }
      const blob=await response.blob();
      const disposition=response.headers.get("content-disposition")??"";
      const filename=disposition.match(/filename="([^"]+)"/)?.[1]??"FEOS-panels.dxf";
      const url=URL.createObjectURL(blob);const anchor=document.createElement("a");
      anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url);
      setMessage("DXF 板件淨尺寸圖已產生，可交由 CAD/CAM 軟體讀取。");
    }catch(error){setMessage(error instanceof Error?error.message:"DXF 產生失敗")}finally{setExportingDxf(false)}
  }

  async function exportPdf(){
    setExporting(true);setMessage("");
    try{
      const response=await fetch("/api/quotes/pdf",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({customerName,companyName,productName:"客製實木餐桌",dimensions,materialCode,quantity,notes})});
      if(!response.ok)throw new Error("PDF 產生失敗");
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);const anchor=document.createElement("a");
      anchor.href=url;anchor.download="FEOS-quotation-"+new Date().toISOString().slice(0,10)+".pdf";anchor.click();URL.revokeObjectURL(url);
      setMessage("對客報價單已產生，內部成本資料未包含在文件中。");
    }catch(error){setMessage(error instanceof Error?error.message:"PDF 產生失敗")}finally{setExporting(false)}
  }

  return <main className="cpq-shell">
    <header className="cpq-topbar">
      <a className="cpq-brand" href="#" aria-label="FEOS 首頁"><span>F</span><div><b>FEOS</b><small>FURNITURE QUOTE STUDIO</small></div></a>
      <div className="cpq-top-meta"><span><i/> 即時計價引擎已連線</span><button type="button">儲存草稿</button><div className="cpq-avatar">CY</div></div>
    </header>

    <section className="cpq-hero">
      <div><span className="cpq-kicker">CONFIGURE · PRICE · QUOTE</span><h1>客製家具選配與報價</h1><p>調整尺寸與材質，系統即時計算製造成本與建議售價。</p></div>
      <div className="cpq-quote-id"><small>報價狀態</small><b>新報價 · 草稿</b><span>價格有效期限 14 天</span></div>
    </section>

    <section className="cpq-workspace">
      <div className="cpq-config-column">
        <article className="cpq-card cpq-product-card">
          <div className="cpq-card-head"><div><span>01</span><h2>家具尺寸</h2></div><em>單位：mm</em></div>
          <Furniture3DPreview
            length={length}
            width={width}
            height={height}
            materialCode={materialCode}
            materialName={MATERIALS[materialCode].name}
          />
          <div className="dimension-grid">
            {([["長度","length",length,setLength,600,3600],["寬度","width",width,setWidth,400,1800],["高度","height",height,setHeight,350,1200]] as const).map(([label,id,value,setter,min,max])=><label key={id}><span>{label}</span><div><input id={id} type="number" min={min} max={max} step="10" value={value} onChange={e=>setter(Number(e.target.value))}/><em>mm</em></div><small>{min} - {max} mm</small></label>)}
          </div>
        </article>

        <article className="cpq-card">
          <div className="cpq-card-head"><div><span>02</span><h2>材質與數量</h2></div><em>含標準表面處理</em></div>
          <div className="material-grid">
            {(Object.entries(MATERIALS) as [MaterialCode,(typeof MATERIALS)[MaterialCode]][]).map(([code,material])=><button type="button" key={code} className={materialCode===code?"selected":""} onClick={()=>setMaterialCode(code)}><i style={{background:materialSwatches[code]}}/><span><b>{material.name}</b><small>NT$ {material.unitCost.toLocaleString()} / m²</small></span><em>{materialCode===code?"✓":""}</em></button>)}
          </div>
          <label className="quantity-field"><span>訂購數量</span><div><button type="button" onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><input aria-label="訂購數量" type="number" min="1" max="100" value={quantity} onChange={e=>setQuantity(Math.max(1,Number(e.target.value)))}/><button type="button" onClick={()=>setQuantity(Math.min(100,quantity+1))}>＋</button><em>件</em></div><small>{quantity>=5?"已套用專案數量優惠":"5 件起享專案數量優惠"}</small></label>
        </article>

        <article className="cpq-card">
          <div className="cpq-card-head"><div><span>03</span><h2>客戶資訊</h2></div><em>僅用於對客報價單</em></div>
          <div className="customer-grid"><label><span>公司／單位</span><input value={companyName} onChange={e=>setCompanyName(e.target.value)} maxLength={80}/></label><label><span>聯絡人</span><input value={customerName} onChange={e=>setCustomerName(e.target.value)} maxLength={50}/></label><label className="wide"><span>需求備註</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={300}/></label></div>
        </article>
      </div>

      <aside className="cpq-summary-card">
        <div className="summary-title"><span>LIVE ESTIMATE</span><h2>即時報價摘要</h2><p>所有價格已依目前選配自動更新</p></div>
        <div className="summary-product"><div><b>客製實木餐桌</b><span>{length} × {width} × {height} mm</span></div><em>× {quantity}</em></div>
        <dl className="cost-breakdown"><div><dt>預估單件製造成本</dt><dd>{formatTwd(quote.unitCost)}</dd></div><div><dt>建議毛利率</dt><dd>{(quote.grossMarginRate*100).toFixed(0)}%</dd></div><div><dt>預估交期</dt><dd>{quote.leadDays} 天</dd></div></dl>
        <div className="suggested-price"><span>對客建議單價</span><b>{formatTwd(quote.suggestedUnitPrice)}</b><small>未稅 · 每件</small></div>
        <div className="quote-totals"><div><span>商品小計</span><b>{formatTwd(quote.subtotal)}</b></div><div><span>營業稅 5%</span><b>{formatTwd(quote.tax)}</b></div><div className="grand"><span>含稅報價總額</span><b>{formatTwd(quote.total)}</b></div></div>
        <div className="privacy-note"><b>對客資料保護</b><p>匯出的 PDF 僅顯示對客售價，不包含採購單價、損耗率、製造成本或內部毛利。</p></div>
        <button className="export-button" type="button" disabled={exporting||!customerName.trim()} onClick={exportPdf}>{exporting?"正在產生報價單…":"匯出 PDF 報價單"}</button>
        <button className="dxf-button" type="button" disabled={exportingDxf||!storedQuoteId} onClick={exportDxf}>{exportingDxf?"正在產生 DXF…":"匯出板件 DXF"}</button>
        {!storedQuoteId&&<small className="dxf-hint">儲存報價後，可由網址中的 quoteId 匯出正式 BOM 板件圖。</small>}
        <div className="solana-payment-slot">
          <button className="solana-button" type="button" disabled={!SOLANA_PAYMENT_ENABLED}>簽約付定 · Solana</button>
          <small>Web3 Wallet 介面已預留；啟用前不連接錢包、不簽章，也不送出任何交易。</small>
        </div>
        {message&&<p className="export-message" role="status">{message}</p>}
        <small className="summary-footnote">價格為系統試算，正式下單前需經業務確認。</small>
      </aside>
    </section>
  </main>;
}

