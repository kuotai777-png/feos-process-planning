import {env} from "cloudflare:workers";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {apiError} from "@/lib/auth/api-guard";

function managerEmailSet(){
  const workerEnv=env as unknown as Record<string,unknown>;
  const workerValue=workerEnv.APPROVAL_MANAGER_EMAILS;
  const configured=typeof workerValue==="string"&&workerValue
    ?workerValue
    :typeof process!=="undefined"?process.env.APPROVAL_MANAGER_EMAILS??"":"";

  return new Set(configured.split(",").map(email=>email.trim().toLowerCase()).filter(Boolean));
}

export function isApprovalManagerEmail(email:string){
  return managerEmailSet().has(email.trim().toLowerCase());
}

export async function guardApprovalManager(){
  const user=await getChatGPTUser();
  if(!user)return {ok:false as const,response:apiError("ERR_4013","Authentication required",401)};
  if(!isApprovalManagerEmail(user.email)){
    return {ok:false as const,response:apiError("ERR_4030","Manager approval permission required",403)};
  }
  return {ok:true as const,user};
}
