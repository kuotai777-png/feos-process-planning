import {storageStatus} from "../../../src/lib/renderStore";

export const dynamic="force-dynamic";

export async function GET(){
  try{return Response.json(await storageStatus())}
  catch(error){return Response.json({mode:"postgres",persistent:true,ok:false,error:String(error)},{status:500})}
}
