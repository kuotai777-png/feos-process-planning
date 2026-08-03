import type {Metadata} from "next";
import {headers} from "next/headers";
import "./globals.css";

export async function generateMetadata():Promise<Metadata>{
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"localhost";
  const protocol=requestHeaders.get("x-forwarded-proto")??(host.startsWith("localhost")?"http":"https");
  const image=protocol+"://"+host+"/og.png";
  return {
    title:"FEOS 家具選配與報價",
    description:"客製家具尺寸、材質即時計價與高質感 PDF 報價單。",
    icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},
    openGraph:{title:"FEOS 家具選配與報價",description:"從尺寸選配到對客報價，一頁即時完成。",images:[image]},
    twitter:{card:"summary_large_image",title:"FEOS 家具選配與報價",description:"從尺寸選配到對客報價，一頁即時完成。",images:[image]},
  };
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="zh-Hant"><body>{children}</body></html>;
}

