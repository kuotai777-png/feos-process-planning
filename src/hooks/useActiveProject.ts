"use client";
import {useEffect,useState} from "react";
import {defaultProjects,getActiveProjectId,getProjects,FeosProject} from "../lib/projectStore";

export function useActiveProject(){
  const [project,setProject]=useState<FeosProject>(defaultProjects[0]);
  useEffect(()=>{
    const sync=()=>{
      const id=getActiveProjectId();
      setProject(getProjects().find(item=>item.id===id)??defaultProjects[0]);
    };
    sync();
    window.addEventListener("feos-project-change",sync);
    window.addEventListener("storage",sync);
    return()=>{window.removeEventListener("feos-project-change",sync);window.removeEventListener("storage",sync)};
  },[]);
  return project;
}

