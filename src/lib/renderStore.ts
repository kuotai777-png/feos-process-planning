import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const dataRoot=process.env.RENDER_DATA_DIR||path.join(process.cwd(),".render-data");
type StoredItem={id:string};
type SqlClient=ReturnType<typeof postgres>;
let sqlClientPromise:Promise<SqlClient>|undefined;

async function database(){
  if(!process.env.DATABASE_URL)return null;
  sqlClientPromise??=(async()=>{
    const sql=postgres(process.env.DATABASE_URL!,{max:5,ssl:"require"});
    try{
      await sql`
        create table if not exists feos_collections (
          collection_name text not null,
          item_id text not null,
          payload jsonb not null,
          updated_at timestamptz not null default now(),
          primary key (collection_name,item_id)
        )
      `;
      return sql;
    }catch{
      await sql.end({timeout:1}).catch(()=>{});
      sqlClientPromise=undefined;
      return null as unknown as SqlClient;
    }
  })();
  return (await sqlClientPromise)||null;
}

async function fileFor(name:string){
  await mkdir(dataRoot,{recursive:true});
  return path.join(dataRoot,`${name}.json`);
}

export async function readCollection<T extends {id:string}>(name:string,defaults:T[]):Promise<T[]>{
  const sql=await database();
  if(sql){
    let rows=await sql<{payload:T}[]>`
      select payload from feos_collections
      where collection_name=${name}
      order by updated_at,item_id
    `;
    if(!rows.length&&defaults.length){
      await Promise.all(defaults.map(item=>sql`
        insert into feos_collections (collection_name,item_id,payload)
        values (${name},${item.id},${JSON.stringify(item)}::jsonb)
        on conflict (collection_name,item_id) do nothing
      `));
      rows=await sql<{payload:T}[]>`
        select payload from feos_collections
        where collection_name=${name}
        order by updated_at,item_id
      `;
    }
    return rows.map(row=>row.payload);
  }
  const file=await fileFor(name);
  try{
    return JSON.parse(await readFile(file,"utf8")) as T[];
  }catch{
    await writeCollection(name,defaults);
    return structuredClone(defaults);
  }
}

export async function writeCollection<T>(name:string,items:T[]){
  const sql=await database();
  if(sql){
    const records=items as StoredItem[];
    await sql.begin(async transaction=>{
      await transaction`delete from feos_collections where collection_name=${name}`;
      for(const item of records){
        await transaction`
          insert into feos_collections (collection_name,item_id,payload)
          values (${name},${item.id},${JSON.stringify(item)}::jsonb)
        `;
      }
    });
    return;
  }
  const file=await fileFor(name);
  const temporary=`${file}.tmp`;
  await writeFile(temporary,JSON.stringify(items,null,2),"utf8");
  await rename(temporary,file);
}

export async function upsertCollectionItem<T extends {id:string}>(name:string,defaults:T[],item:T){
  const sql=await database();
  if(sql){
    await sql`
      insert into feos_collections (collection_name,item_id,payload,updated_at)
      values (${name},${item.id},${JSON.stringify(item)}::jsonb,now())
      on conflict (collection_name,item_id)
      do update set payload=excluded.payload,updated_at=now()
    `;
    return item;
  }
  const items=await readCollection(name,defaults);
  const index=items.findIndex(existing=>existing.id===item.id);
  if(index>=0)items[index]=item;else items.push(item);
  await writeCollection(name,items);
  return item;
}

export async function deleteCollectionItem<T extends {id:string}>(name:string,defaults:T[],id:string){
  const sql=await database();
  if(sql){
    await sql`delete from feos_collections where collection_name=${name} and item_id=${id}`;
    return;
  }
  const items=await readCollection(name,defaults);
  await writeCollection(name,items.filter(item=>item.id!==id));
}

export const isRenderRuntime=()=>process.env.FEOS_RUNTIME==="render"||Boolean(process.env.RENDER||process.env.RENDER_SERVICE_ID);

export async function storageStatus(){
  const sql=await database();
  if(!sql)return {mode:"file",persistent:false,ok:true};
  await sql`select 1`;
  return {mode:"postgres",persistent:true,ok:true};
}
