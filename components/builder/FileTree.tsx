"use client";

import { useEffect, useState } from "react";

export default function FileTree({projectId,onSelect}:{projectId:string,onSelect:(p:string)=>void}){

  const [files,setFiles] = useState<string[]>([]);

  useEffect(()=>{
    async function load(){
      const r = await fetch(`/api/dev/files/list?projectId=${projectId}`);
      const d = await r.json();
      setFiles(d.files || []);
    }
    load();
  },[projectId]);

  return(
    <div>
      {files.map(f=>(
        <div
          key={f}
          style={{
            cursor:"pointer",
            fontFamily:"monospace",
            padding:4
          }}
          onClick={()=>onSelect(f)}
        >
          {f}
        </div>
      ))}
    </div>
  );
}
