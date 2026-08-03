"use client";

import {useEffect,useRef,useState} from "react";
import styles from "@/app/quote/[id]/view/quote-view.module.css";

interface SignatureCanvasProps{
  disabled?:boolean;
  onChange:(dataUrl:string|null)=>void;
}

export default function SignatureCanvas({disabled=false,onChange}:SignatureCanvasProps){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const drawingRef=useRef(false);
  const [hasInk,setHasInk]=useState(false);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const resize=()=>{
      const rect=canvas.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const previous=document.createElement("canvas");
      previous.width=canvas.width;previous.height=canvas.height;
      previous.getContext("2d")?.drawImage(canvas,0,0);
      const ratio=Math.max(1,window.devicePixelRatio||1);
      canvas.width=Math.round(rect.width*ratio);
      canvas.height=Math.round(rect.height*ratio);
      const context=canvas.getContext("2d");
      if(!context)return;
      if(previous.width&&previous.height)context.drawImage(previous,0,0,canvas.width,canvas.height);
      context.setTransform(ratio,0,0,ratio,0,0);
      context.lineCap="round";
      context.lineJoin="round";
      context.lineWidth=2.4;
      context.strokeStyle="#173c32";
    };
    resize();
    const observer=new ResizeObserver(resize);
    observer.observe(canvas);
    return ()=>observer.disconnect();
  },[]);

  const point=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    return {x:event.clientX-rect.left,y:event.clientY-rect.top};
  };

  const start=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    if(disabled)return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current=true;
    const context=event.currentTarget.getContext("2d");
    const current=point(event);
    context?.beginPath();
    context?.moveTo(current.x,current.y);
    context?.lineTo(current.x+.01,current.y+.01);
    context?.stroke();
    setHasInk(true);
  };

  const move=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    if(disabled||!drawingRef.current)return;
    const context=event.currentTarget.getContext("2d");
    const current=point(event);
    context?.lineTo(current.x,current.y);
    context?.stroke();
    if(!hasInk)setHasInk(true);
  };

  const finish=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    if(!drawingRef.current)return;
    drawingRef.current=false;
    event.currentTarget.getContext("2d")?.closePath();
    if(hasInk||event.type==="pointerup"){
      setHasInk(true);
      onChange(event.currentTarget.toDataURL("image/png"));
    }
  };

  const clear=()=>{
    const canvas=canvasRef.current;
    if(!canvas||disabled)return;
    const context=canvas.getContext("2d");
    if(context){
      context.save();
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0,0,canvas.width,canvas.height);
      context.restore();
    }
    setHasInk(false);
    onChange(null);
  };

  return <div className={styles.signatureField}>
    <div className={styles.signatureLabel}><span>請在框內簽名</span><button type="button" onClick={clear} disabled={disabled||!hasInk}>清除重簽</button></div>
    <canvas
      ref={canvasRef}
      className={styles.signatureCanvas}
      aria-label="電子簽名板"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
    />
    <small>簽名將與本報價版本、簽署時間及來源 IP 一併留存。</small>
  </div>;
}