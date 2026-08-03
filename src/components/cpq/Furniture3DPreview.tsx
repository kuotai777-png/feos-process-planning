"use client";

import {useEffect,useRef} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import type {MaterialCode} from "@/src/lib/cpqQuote";

type Props={
  length:number;
  width:number;
  height:number;
  materialCode:MaterialCode;
  materialName:string;
};

const materialPalette:Record<MaterialCode,{base:string;grain:string;roughness:number}>={
  OAK:{base:"#c99b63",grain:"#76502f",roughness:.68},
  WALNUT:{base:"#65452f",grain:"#2e1e17",roughness:.62},
  ASH:{base:"#d8bd92",grain:"#947451",roughness:.72},
  LAMINATE:{base:"#b8afa0",grain:"#81786c",roughness:.48},
};

function makeTexture(code:MaterialCode){
  const palette=materialPalette[code];
  const canvas=document.createElement("canvas");
  canvas.width=512;canvas.height=512;
  const context=canvas.getContext("2d");
  if(!context)return null;
  context.fillStyle=palette.base;context.fillRect(0,0,512,512);
  context.globalAlpha=code==="LAMINATE"?0.16:0.32;
  context.strokeStyle=palette.grain;
  for(let y=10;y<512;y+=14){
    context.beginPath();
    context.moveTo(0,y+Math.sin(y*.08)*5);
    for(let x=0;x<=512;x+=32)context.lineTo(x,y+Math.sin(x*.035+y*.09)*5);
    context.stroke();
  }
  context.globalAlpha=.12;
  for(let index=0;index<24;index++){
    const y=(index*83)%512;
    context.beginPath();context.ellipse((index*137)%512,y,42,7,index*.17,0,Math.PI*2);context.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(2.2,1.4);
  texture.anisotropy=4;
  return texture;
}

function disposeObject(root:THREE.Object3D){
  root.traverse(object=>{
    const disposable=object as THREE.Object3D&{geometry?:THREE.BufferGeometry;material?:THREE.Material|THREE.Material[]};
    disposable.geometry?.dispose();
    const materials=disposable.material?(Array.isArray(disposable.material)?disposable.material:[disposable.material]):[];
    for(const material of materials){
      if(material instanceof THREE.MeshStandardMaterial)material.map?.dispose();
      material.dispose();
    }
  });
}

export default function Furniture3DPreview({length,width,height,materialCode,materialName}:Props){
  const mountRef=useRef<HTMLDivElement>(null);
  const modelRef=useRef<THREE.Group|null>(null);
  const cameraRef=useRef<THREE.PerspectiveCamera|null>(null);
  const controlsRef=useRef<OrbitControls|null>(null);

  useEffect(()=>{
    const mount=mountRef.current;
    if(!mount)return;
    let frame=0;
    try{
      const scene=new THREE.Scene();
      scene.background=new THREE.Color("#e7ece7");
      scene.fog=new THREE.Fog("#e7ece7",8,18);
      const camera=new THREE.PerspectiveCamera(38,1,.01,100);
      cameraRef.current=camera;
      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.08;
      renderer.shadowMap.enabled=true;
      renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight("#f8fbf8","#50665d",2.25));
      const key=new THREE.DirectionalLight("#fff4df",3.2);
      key.position.set(4,6,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
      const rim=new THREE.DirectionalLight("#a8c8bb",1.5);rim.position.set(-4,2,-3);scene.add(rim);

      const floor=new THREE.Mesh(
        new THREE.CircleGeometry(8,80),
        new THREE.MeshStandardMaterial({color:"#dbe2dc",roughness:.92,metalness:0}),
      );
      floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=-.018;scene.add(floor);
      const grid=new THREE.GridHelper(12,24,"#9cad9f","#c4cec6");
      const gridMaterials=Array.isArray(grid.material)?grid.material:[grid.material];
      for(const material of gridMaterials){material.opacity=.34;material.transparent=true}
      scene.add(grid);

      const model=new THREE.Group();modelRef.current=model;scene.add(model);
      const controls=new OrbitControls(camera,renderer.domElement);
      controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;
      controls.minPolarAngle=.28;controls.maxPolarAngle=Math.PI/2.04;
      controlsRef.current=controls;

      const resize=()=>{
        const rect=mount.getBoundingClientRect();
        const canvasWidth=Math.max(1,Math.round(rect.width));
        const canvasHeight=Math.max(260,Math.round(rect.height));
        camera.aspect=canvasWidth/canvasHeight;camera.updateProjectionMatrix();
        renderer.setSize(canvasWidth,canvasHeight,false);
      };
      const observer=new ResizeObserver(resize);observer.observe(mount);resize();
      const render=()=>{controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(render)};
      render();

      return ()=>{
        cancelAnimationFrame(frame);observer.disconnect();controls.dispose();disposeObject(scene);
        renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
        modelRef.current=null;cameraRef.current=null;controlsRef.current=null;
      };
    }catch(caught){
      mount.classList.add("furniture-3d-error");
      mount.textContent="3D 預覽無法啟用："+(caught instanceof Error?caught.message:"此裝置不支援 WebGL");
    }
  },[]);

  useEffect(()=>{
    const model=modelRef.current;const camera=cameraRef.current;const controls=controlsRef.current;
    if(!model||!camera||!controls)return;
    for(const child of [...model.children]){disposeObject(child);model.remove(child)}

    const size={x:Math.max(.1,length/1000),y:Math.max(.1,height/1000),z:Math.max(.1,width/1000)};
    const panel=Math.min(.055,Math.max(.022,Math.min(size.x,size.y,size.z)*.035));
    const texture=makeTexture(materialCode);
    const palette=materialPalette[materialCode];
    const boardMaterial=new THREE.MeshStandardMaterial({
      color:palette.base,map:texture,roughness:palette.roughness,metalness:.02,
    });
    const edgeMaterial=new THREE.MeshStandardMaterial({color:palette.grain,roughness:.78});
    const handleMaterial=new THREE.MeshStandardMaterial({color:"#2a332f",roughness:.3,metalness:.72});

    const addPanel=(x:number,y:number,z:number,sx:number,sy:number,sz:number,material=boardMaterial)=>{
      const panelMaterial=material.clone();
      if(panelMaterial instanceof THREE.MeshStandardMaterial&&material===boardMaterial)panelMaterial.map=texture?.clone()??null;
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),panelMaterial);
      mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;model.add(mesh);return mesh;
    };
    addPanel(-(size.x-panel)/2,size.y/2,0,panel,size.y,size.z);
    addPanel((size.x-panel)/2,size.y/2,0,panel,size.y,size.z);
    addPanel(0,size.y-panel/2,0,size.x-2*panel,panel,size.z);
    addPanel(0,panel/2,0,size.x-2*panel,panel,size.z);
    addPanel(0,size.y/2,-(size.z-panel)/2,size.x-2*panel,size.y-2*panel,panel,edgeMaterial);
    const doorWidth=(size.x-3*panel)/2;
    for(const direction of [-1,1]){
      addPanel(direction*(doorWidth+panel)/2,size.y/2,size.z/2+panel*.12,doorWidth,size.y-2.4*panel,panel*.7);
      const handle=new THREE.Mesh(new THREE.CylinderGeometry(panel*.12,panel*.12,Math.min(.18,size.y*.2),18),handleMaterial.clone());
      handle.rotation.x=Math.PI/2;handle.position.set(direction*panel*.72,size.y*.55,size.z/2+panel*.85);handle.castShadow=true;model.add(handle);
    }

    const envelope=new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x,size.y,size.z)),
      new THREE.LineBasicMaterial({color:"#315b4d",transparent:true,opacity:.34}),
    );
    envelope.position.y=size.y/2;model.add(envelope);
    boardMaterial.dispose();edgeMaterial.dispose();handleMaterial.dispose();texture?.dispose();

    const largest=Math.max(size.x,size.y,size.z);
    camera.position.set(largest*1.5,size.y*.95+largest*.55,largest*1.75);
    camera.near=Math.max(.01,largest/100);camera.far=Math.max(30,largest*20);camera.updateProjectionMatrix();
    controls.target.set(0,size.y*.47,0);controls.minDistance=largest*.85;controls.maxDistance=largest*5;controls.update();
  },[length,width,height,materialCode]);

  return <div className="furniture-3d" role="img" aria-label={`${materialName} 櫃體 3D 預覽，長 ${length}、寬 ${width}、高 ${height} 公釐`}>
    <div className="furniture-3d-canvas" ref={mountRef}/>
    <div className="furniture-3d-badges" aria-hidden="true"><span>W {length} mm</span><span>D {width} mm</span><span>H {height} mm</span></div>
    <div className="furniture-3d-hint">拖曳旋轉 · 滾輪縮放</div></div>;
}
