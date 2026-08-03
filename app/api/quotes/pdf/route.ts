import fontkit from "@pdf-lib/fontkit";
import {PDFDocument,rgb} from "pdf-lib";
import {calculateQuote,MaterialCode,normalizeQuoteInput} from "../../../../src/lib/cpqQuote";
import fontPart1Url from "../../../../src/assets/fonts/TraditionalChinese.1.png?url";
import fontPart2Url from "../../../../src/assets/fonts/TraditionalChinese.2.png?url";
import fontPart3Url from "../../../../src/assets/fonts/TraditionalChinese.3.png?url";
import fontPart4Url from "../../../../src/assets/fonts/TraditionalChinese.4.png?url";

export const dynamic="force-dynamic";
export const runtime="edge";

interface PdfQuoteRequest{
  customerName?:string;companyName?:string;productName?:string;notes?:string;
  dimensions?:{length?:number;width?:number;height?:number};materialCode?:MaterialCode;quantity?:number;
}

const safe=(value:unknown,max=120)=>String(value??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);
const customerSafe=(value:unknown,max=120)=>safe(value,max).replace(/(採購單價|進貨單價|損耗率|製造成本|內部毛利)[^，。；;]*/g,"[內部資料已遮蔽]");
const money=(value:number)=>"NT$ "+Math.round(value).toLocaleString("en-US");

export async function POST(request:Request){
  try{
    const body=await request.json() as PdfQuoteRequest;
    const input=normalizeQuoteInput({dimensions:{length:Number(body.dimensions?.length),width:Number(body.dimensions?.width),height:Number(body.dimensions?.height)},materialCode:body.materialCode??"OAK",quantity:Number(body.quantity)});
    const result=calculateQuote(input);
    const customerName=safe(body.customerName,50);
    if(!customerName)return Response.json({error:"請填寫聯絡人"},{status:400});
    const companyName=safe(body.companyName,80)||"個人客戶";
    const productName=safe(body.productName,80)||"客製家具";
    const notes=customerSafe(body.notes,260);
    const today=new Date();
    const quoteNumber="QT-"+today.toISOString().slice(0,10).replaceAll("-","")+"-"+crypto.randomUUID().slice(0,6).toUpperCase();
    const validUntil=new Date(today);validUntil.setDate(validUntil.getDate()+14);

    const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
    const fontResponses=await Promise.all([fontPart1Url,fontPart2Url,fontPart3Url,fontPart4Url].map(url=>fetch(new URL(url,request.url))));
    if(fontResponses.some(response=>!response.ok))throw new Error("報價單字型載入失敗");
    const fontParts=await Promise.all(fontResponses.map(response=>response.arrayBuffer()));
    const fontBytes=new Uint8Array(fontParts.reduce((total,part)=>total+part.byteLength,0));
    let fontOffset=0;for(const part of fontParts){fontBytes.set(new Uint8Array(part),fontOffset);fontOffset+=part.byteLength}
    const font=await pdf.embedFont(fontBytes);
    const page=pdf.addPage([595.28,841.89]);
    const navy=rgb(.055,.125,.20),blue=rgb(.07,.47,.72),ink=rgb(.10,.16,.21),muted=rgb(.38,.46,.52),line=rgb(.86,.89,.91),soft=rgb(.95,.97,.98),green=rgb(.08,.48,.31);
    const draw=(text:string,x:number,y:number,size=10,color=ink)=>page.drawText(text,{x,y,size,font,color});
    const right=(text:string,x:number,y:number,size=10,color=ink)=>draw(text,x-font.widthOfTextAtSize(text,size),y,size,color);
    const rect=(x:number,y:number,width:number,height:number,color=soft)=>page.drawRectangle({x,y,width,height,color});

    rect(0,758,595.28,83,navy);draw("FEOS",44,791,24,rgb(1,1,1));draw("FURNITURE QUOTATION",44,773,8,rgb(.60,.76,.86));right("家具客製報價單",551,790,18,rgb(1,1,1));right(quoteNumber,551,772,8,rgb(.76,.85,.91));
    draw("客戶資訊",44,725,12,blue);page.drawLine({start:{x:44,y:717},end:{x:551,y:717},thickness:1,color:line});
    draw("公司／單位",44,694,8,muted);draw(companyName,44,677,12,ink);draw("聯絡人",310,694,8,muted);draw(customerName,310,677,12,ink);
    draw("報價日期",44,648,8,muted);draw(today.toLocaleDateString("zh-TW"),44,632,10,ink);draw("有效期限",205,648,8,muted);draw(validUntil.toLocaleDateString("zh-TW"),205,632,10,ink);draw("預估交期",398,648,8,muted);draw("確認訂單後約 "+result.leadDays+" 天",398,632,10,ink);
    draw("報價明細",44,590,12,blue);rect(44,554,507,28,navy);draw("品項與規格",56,564,9,rgb(1,1,1));right("數量",380,564,9,rgb(1,1,1));right("未稅單價",462,564,9,rgb(1,1,1));right("小計",539,564,9,rgb(1,1,1));
    rect(44,482,507,72,rgb(.985,.99,.995));draw(productName,56,530,12,ink);draw(result.materialName+"｜"+input.dimensions.length+" × "+input.dimensions.width+" × "+input.dimensions.height+" mm",56,508,9,muted);draw("含標準表面塗裝與安裝五金",56,490,8,muted);right(String(input.quantity),380,520,10,ink);right(money(result.suggestedUnitPrice),462,520,10,ink);right(money(result.subtotal),539,520,10,ink);
    page.drawLine({start:{x:350,y:451},end:{x:551,y:451},thickness:1,color:line});draw("商品小計",377,430,9,muted);right(money(result.subtotal),539,430,10,ink);draw("營業稅 5%",377,407,9,muted);right(money(result.tax),539,407,10,ink);rect(350,354,201,38,navy);draw("含稅總額",365,367,10,rgb(1,1,1));right(money(result.total),537,365,15,rgb(1,1,1));
    draw("需求備註",44,414,11,blue);rect(44,354,278,48,soft);draw(notes||"依確認圖面與材色樣板製作。",56,378,8,muted);
    draw("報價說明",44,304,11,blue);page.drawLine({start:{x:44,y:296},end:{x:551,y:296},thickness:1,color:line});
    ["1. 本報價含標準製作、表面處理與五金，不含特殊搬運或現場修改。","2. 客製品於圖面、材色及訂金確認後排入生產，尺寸容許差依製造規範。","3. 報價有效期限為 14 天；天然木材紋理與色澤差異屬正常材料特性。"].forEach((text,index)=>draw(text,50,272-index*22,8.5,muted));
    rect(44,151,507,44,rgb(.93,.98,.95));draw("✓  此文件為對客版本，價格已由 FEOS 報價引擎核算。",58,169,9,green);
    page.drawLine({start:{x:44,y:112},end:{x:551,y:112},thickness:1,color:line});draw("FEOS Furniture Studio",44,91,8,muted);right("本報價單由系統產生｜第 1 頁，共 1 頁",551,91,8,muted);

    pdf.setTitle(quoteNumber+" 家具客製報價單");pdf.setAuthor("FEOS Furniture Studio");pdf.setSubject("Customer quotation");
    const bytes=await pdf.save();
    return new Response(bytes,{headers:{"content-type":"application/pdf","content-disposition":'attachment; filename="'+quoteNumber+'.pdf"',"cache-control":"no-store","x-content-type-options":"nosniff"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"PDF 產生失敗"},{status:400})}
}








