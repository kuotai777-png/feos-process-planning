import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import path from "node:path";

const dataRoot=process.env.RENDER_DATA_DIR||path.join(process.cwd(),".render-data");

async function fileFor(name:string){
  await mkdir(dataRoot,{recursive:true});
  return path.join(dataRoot,`${name}.json`);
}

export async function readCollection<T extends {id:string}>(name:string,defaults:T[]):Promise<T[]>{
  const file=await fileFor(name);
  try{
    return JSON.parse(await readFile(file,"utf8")) as T[];
  }catch{
    await writeCollection(name,defaults);
    return structuredClone(defaults);
  }
}

export async function writeCollection<T>(name:string,items:T[]){
  const file=await fileFor(name);
  const temporary=`${file}.tmp`;
  await writeFile(temporary,JSON.stringify(items,null,2),"utf8");
  await rename(temporary,file);
}

export async function upsertCollectionItem<T extends {id:string}>(name:string,defaults:T[],item:T){
  const items=await readCollection(name,defaults);
  const index=items.findIndex(existing=>existing.id===item.id);
  if(index>=0)items[index]=item;else items.push(item);
  await writeCollection(name,items);
  return item;
}

export async function deleteCollectionItem<T extends {id:string}>(name:string,defaults:T[],id:string){
  const items=await readCollection(name,defaults);
  await writeCollection(name,items.filter(item=>item.id!==id));
}

export const isRenderRuntime=()=>process.env.FEOS_RUNTIME==="render"||Boolean(process.env.RENDER||process.env.RENDER_SERVICE_ID);
