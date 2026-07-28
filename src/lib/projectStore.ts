"use client";

export type FeosProject={
  id:string;
  name:string;
  customer:string;
  product:string;
  status:string;
  updatedAt:string;
};

export const defaultProjects:FeosProject[]=[
  {id:"NEW-001",name:"托盤",customer:"大成木業有限公司",product:"工業用木製托盤",status:"AI 分析中",updatedAt:"2026/07/28"},
  {id:"NEW-002",name:"木箱",customer:"聯成物流股份有限公司",product:"出口設備木箱",status:"工程條件設定",updatedAt:"2026/07/27"},
  {id:"NEW-003",name:"展示架",customer:"森川設計有限公司",product:"零售展示架",status:"草稿",updatedAt:"2026/07/25"},
];

const PROJECTS_KEY="feos-projects";
const ACTIVE_KEY="feos-active-project";

export function getProjects():FeosProject[]{
  if(typeof window==="undefined")return defaultProjects;
  try{
    const saved=localStorage.getItem(PROJECTS_KEY);
    return saved?JSON.parse(saved):defaultProjects;
  }catch{return defaultProjects}
}

export function saveProjects(projects:FeosProject[]){
  localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects));
}

export function getActiveProjectId(){
  if(typeof window==="undefined")return defaultProjects[0].id;
  return localStorage.getItem(ACTIVE_KEY)??defaultProjects[0].id;
}

export function setActiveProjectId(id:string){
  localStorage.setItem(ACTIVE_KEY,id);
  window.dispatchEvent(new CustomEvent("feos-project-change",{detail:id}));
}

export function projectKey(projectId:string,key:string){
  return `feos-project:${projectId}:${key}`;
}

