export type DxfPanel={name:string;length:number;width:number;thickness?:number;quantity:number};

const collectionKey=/^(bom|bom_items|bomitems|parts|panels|board_parts|boardparts|components)$/i;
const maxPanels=2000;

function record(value:unknown):value is Record<string,unknown>{
  return typeof value==="object"&&value!==null&&!Array.isArray(value);
}

function finite(value:unknown){
  const number=typeof value==="string"?Number(value.trim()):Number(value);
  return Number.isFinite(number)&&number>0?number:null;
}

function first(source:Record<string,unknown>,keys:string[]){
  for(const key of keys)if(source[key]!==undefined&&source[key]!==null)return source[key];
  return undefined;
}

function parsePanel(value:unknown,index:number):DxfPanel|null{
  if(!record(value))return null;
  const nested=first(value,["net_dimensions","netDimensions","dimensions","size"]);
  const dimensions=record(nested)?nested:{};
  const explicitLength=finite(first(value,["net_length","netLength","length","L"]))??finite(first(dimensions,["length","L"]));
  const dimensionW=finite(first(value,["W","w"]))??finite(first(dimensions,["W","w"]));
  let length=explicitLength??dimensionW;
  let width=finite(first(value,["net_width","netWidth","width","D","d"]))??finite(first(dimensions,["width","depth","D","d"]))??(explicitLength?dimensionW:null);
  const sizeText=typeof nested==="string"?nested:typeof value.net_size==="string"?value.net_size:null;
  if((!length||!width)&&sizeText){
    const match=sizeText.match(/([0-9]+(?:[.][0-9]+)?)[ ]*[x×*][ ]*([0-9]+(?:[.][0-9]+)?)(?:[ ]*[x×*][ ]*([0-9]+(?:[.][0-9]+)?))?/i);
    if(match){length=length??Number(match[1]);width=width??Number(match[2])}
  }
  if(!length||!width||length>100000||width>100000)return null;
  const quantity=Math.min(1000,Math.max(1,Math.trunc(finite(first(value,["quantity","qty","count"]))??1)));
  const thickness=finite(first(value,["thickness","net_thickness","netThickness"]))??finite(first(dimensions,["thickness","T"]));
  const rawName=first(value,["part_name","partName","name","component_name","componentName","label","code"]);
  const name=String(rawName??`PANEL-${index+1}`).split("").map(character=>character.charCodeAt(0)<32?" ":character).join("").trim().slice(0,80)||`PANEL-${index+1}`;

  return {name,length,width,thickness:thickness??undefined,quantity};
}

export function extractDxfPanels(snapshot:unknown){
  const panels:DxfPanel[]=[];
  const visit=(value:unknown)=>{
    if(panels.length>=maxPanels)return;
    if(Array.isArray(value)){for(const item of value)visit(item);return}
    if(!record(value))return;
    for(const [key,nested] of Object.entries(value)){
      if(collectionKey.test(key)&&Array.isArray(nested)){
        for(const item of nested){
          if(panels.length>=maxPanels)break;
          const panel=parsePanel(item,panels.length);
          if(panel)panels.push(panel);else visit(item);
        }
      }else if(record(nested)||Array.isArray(nested))visit(nested);
    }
  };
  visit(snapshot);
  return panels;
}

const pair=(code:number|string,value:number|string)=>String(code)+String.fromCharCode(10)+String(value)+String.fromCharCode(10);


const safeText=(value:string)=>value.split("").map(character=>character.charCodeAt(0)<32?" ":character).join("").slice(0,120);


export function generatePanelDxf(panels:DxfPanel[],quoteNo:string){
  let dxf="";
  dxf+=pair(0,"SECTION")+pair(2,"HEADER")+pair(9,"$ACADVER")+pair(1,"AC1015")+pair(9,"$INSUNITS")+pair(70,4)+pair(9,"$DWGCODEPAGE")+pair(3,"UTF-8")+pair(0,"ENDSEC");
  dxf+=pair(0,"SECTION")+pair(2,"TABLES")+pair(0,"TABLE")+pair(2,"LAYER")+pair(70,2);
  dxf+=pair(0,"LAYER")+pair(2,"CUT")+pair(70,0)+pair(62,7)+pair(6,"CONTINUOUS");
  dxf+=pair(0,"LAYER")+pair(2,"LABEL")+pair(70,0)+pair(62,3)+pair(6,"CONTINUOUS");
  dxf+=pair(0,"ENDTAB")+pair(0,"ENDSEC")+pair(0,"SECTION")+pair(2,"ENTITIES");

  const gap=80;const rowLimit=12000;let x=0;let y=0;let rowHeight=0;let serial=1;
  for(const panel of panels){
    for(let copy=0;copy<panel.quantity&&serial<=maxPanels;copy++,serial++){
      if(x>0&&x+panel.length>rowLimit){x=0;y+=rowHeight+gap;rowHeight=0}
      dxf+=pair(0,"LWPOLYLINE")+pair(100,"AcDbEntity")+pair(8,"CUT")+pair(100,"AcDbPolyline")+pair(90,4)+pair(70,1);
      for(const [px,py] of [[x,y],[x+panel.length,y],[x+panel.length,y+panel.width],[x,y+panel.width]])dxf+=pair(10,px)+pair(20,py);
      const label=`${serial}. ${safeText(panel.name)} ${panel.length}x${panel.width}${panel.thickness?`x${panel.thickness}`:""} mm`;
      dxf+=pair(0,"TEXT")+pair(100,"AcDbEntity")+pair(8,"LABEL")+pair(100,"AcDbText")+pair(10,x+20)+pair(20,y+Math.min(panel.width/2,100))+pair(40,Math.max(18,Math.min(48,panel.width/8)))+pair(1,label);
      x+=panel.length+gap;rowHeight=Math.max(rowHeight,panel.width);
    }
  }
  dxf+=pair(0,"TEXT")+pair(100,"AcDbEntity")+pair(8,"LABEL")+pair(100,"AcDbText")+pair(10,0)+pair(20,y+rowHeight+160)+pair(40,60)+pair(1,`FEOS ${safeText(quoteNo)} / NET PANEL SIZES / UNIT: MM`);
  dxf+=pair(0,"ENDSEC")+pair(0,"EOF");
  return dxf;
}
