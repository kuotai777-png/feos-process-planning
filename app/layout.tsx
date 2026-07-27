import type { Metadata } from "next";
import {headers} from "next/headers";
import "./globals.css";

export async function generateMetadata():Promise<Metadata>{
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"localhost";
  const protocol=requestHeaders.get("x-forwarded-proto")??(host.startsWith("localhost")?"http":"https");
  const image=`${protocol}://${host}/og.png`;
  return {
    title:"FEOS｜AI 加工流程規劃",
    description:"Factory Engineering Optimization System 智慧製造流程規劃與決策儀表板",
    icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},
    openGraph:{title:"FEOS｜AI 加工流程規劃",description:"以 AI 輔助設備、訂單與加工方案的綜合決策。",images:[image]},
    twitter:{card:"summary_large_image",title:"FEOS｜AI 加工流程規劃",description:"以 AI 輔助設備、訂單與加工方案的綜合決策。",images:[image]},
  };
}

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
