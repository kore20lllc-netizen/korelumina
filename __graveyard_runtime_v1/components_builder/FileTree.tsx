"use client";

import { useEffect, useState } from "react";

export default function FileTree({
  projectId,
  onSelect
}:{
  projectId:string
  onSelect:(p:string)=>void
}){

  const [files,setFiles] = useState<string[]>([])

  async function load(){
    try{
      const r = await fetch(
        "/api/dev/files?projectId="+projectId,
        { cache:"no-store" }
      )

      const j = await r.json()

      console.log("FILETREE API RAW:", j)

      const next = Array.isArray(j?.files) ? j.files : []

      console.log("FILETREE NEXT:", next)

      setFiles(next)
    }catch(e){
      console.error("FILETREE LOAD FAILED", e)
      setFiles([])
    }
  }

  useEffect(()=>{
    load()

    const refresh = ()=>{
      console.log("FILETREE REFRESH EVENT")
      load()
    }

    window.addEventListener("korelumina:fs-change", refresh)

    return ()=>{
      window.removeEventListener("korelumina:fs-change", refresh)
    }
  },[projectId])

  return (
    <div style={{overflow:"auto",height:"100%",padding:8}}>
      <div style={{fontWeight:700,marginBottom:8}}>
        Files ({files.length})
      </div>

      {files.map(f=>(
        <div
          key={f}
          onClick={()=>onSelect(f)}
          style={{
            cursor:"pointer",
            padding:6,
            fontFamily:"monospace",
            borderBottom:"1px solid #eee"
          }}
        >
          {f}
        </div>
      ))}
    </div>
  )
}
