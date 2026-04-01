"use client"

import { useEffect, useState } from "react"

export default function FileTree({
  projectId,
  refreshTick,
  onSelect
}:{
  projectId:string
  refreshTick:number
  onSelect:(p:string)=>void
}){

  const [files,setFiles] = useState<string[]>([])

  useEffect(()=>{

  console.log("🔥 FILETREE LOAD", projectId, refreshTick)

    let cancelled = false

    async function load(){

      const r = await fetch(
        "/api/dev/files/list?projectId=" + projectId,
        { cache:"no-store" }
      )

      const j = await r.json()

      if(!cancelled){
        setFiles(j.files || [])
      }

    }

    load()

    return ()=>{
      cancelled = true
    }

  },[projectId,refreshTick])

  return (
    <div style={{width:220,borderRight:"1px solid #ddd",padding:8}}>
      <div style={{fontWeight:600,marginBottom:8}}>Files</div>

      {files.length === 0 ? (
        <div style={{opacity:0.6}}>No files</div>
      ) : (
        files.map(f=>(
          <div
            key={f}
            onClick={()=>onSelect(f)}
            style={{
              padding:"6px 8px",
              cursor:"pointer",
              borderBottom:"1px solid #eee",
              fontFamily:"monospace",
              fontSize:13
            }}
          >
            {f}
          </div>
        ))
      )}
    </div>
  )

}
