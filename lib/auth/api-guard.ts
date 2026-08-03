import {env} from "cloudflare:workers";
import type {ZodType} from "zod";

export interface IntegrationApiError{
  code:string;
  message:string;
  status:number;
  details?:unknown;
}

export function apiError(code:string,message:string,status:number,details?:unknown){
  const payload:IntegrationApiError={code,message,status};
  if(details!==undefined)payload.details=details;
  return Response.json(payload,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
}

function readSecret(name:"ERP_API_KEY"|"ERP_HMAC_SECRET"){
  const workerEnv=env as unknown as Record<string,unknown>;
  const workerValue=workerEnv[name];
  if(typeof workerValue==="string"&&workerValue)return workerValue;
  return typeof process!=="undefined"?process.env[name]??"":"";
}

function timingSafeEqual(left:string,right:string){
  const leftBytes=new TextEncoder().encode(left);
  const rightBytes=new TextEncoder().encode(right);
  let difference=leftBytes.length^rightBytes.length;
  const length=Math.max(leftBytes.length,rightBytes.length);
  for(let index=0;index<length;index++)difference|=(leftBytes[index]??0)^(rightBytes[index]??0);
  return difference===0;
}

async function hmacSha256Hex(payload:string,secret:string){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature),byte=>byte.toString(16).padStart(2,"0")).join("");
}

export type GuardedRequest={ok:true;rawBody:string}|{ok:false;response:Response};

export async function guardIntegrationRequest(request:Request):Promise<GuardedRequest>{
  const apiKey=readSecret("ERP_API_KEY");
  const hmacSecret=readSecret("ERP_HMAC_SECRET");
  if(!apiKey||!hmacSecret)return {ok:false,response:apiError("ERR_5001","ERP integration credentials are not configured",500)};

  const authorization=request.headers.get("authorization")??"";
  const suppliedKey=authorization.startsWith("Bearer ")?authorization.slice(7).trim():"";
  if(!suppliedKey||!timingSafeEqual(suppliedKey,apiKey))return {ok:false,response:apiError("ERR_4010","Invalid API key",401)};

  const suppliedSignature=(request.headers.get("x-signature")??"").trim().replace(/^sha256=/i,"").toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(suppliedSignature))return {ok:false,response:apiError("ERR_4011","Missing or invalid HMAC signature",401)};

  const rawBody=await request.text();
  const expectedSignature=await hmacSha256Hex(rawBody,hmacSecret);
  if(!timingSafeEqual(suppliedSignature,expectedSignature))return {ok:false,response:apiError("ERR_4012","HMAC signature verification failed",401)};
  return {ok:true,rawBody};
}

export function parseJsonBody<T>(rawBody:string,schema:ZodType<T>):{ok:true;data:T}|{ok:false;response:Response}{
  let input:unknown;
  try{input=JSON.parse(rawBody)}
  catch{return {ok:false,response:apiError("ERR_4000","Request body must be valid JSON",400)}}
  const parsed=schema.safeParse(input);
  if(!parsed.success){
    return {ok:false,response:apiError("ERR_4001","Request body validation failed",400,parsed.error.issues.map(issue=>({path:issue.path.join("."),message:issue.message})))};
  }
  return {ok:true,data:parsed.data};
}