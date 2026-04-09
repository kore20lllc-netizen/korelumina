"use client"

import { useEffect, useState } from "react"
import { useRefreshBus } from "@/app/(studio)/studio-projects/[projectId]/builder/refreshBus"

export default function CodeEditor({
  projectId,
  path,
  onSaved
}:{
  projectId:string
  path:string
  onSaved:()=>void
}){

  const [content,setContent] = useState("")
  const [version,setVersion] = useState(0)

  useRefreshBus(()=>{
    setVersion(v=>v+1)
  })

  useEffect(()=>{

    async function load(){

      const r = await fetch(
        "/api/dev/files/read?projectId=" + projectId + "&path=" + path,
        { cache:"no-store" }
      )

      const j = await r.json()
      setContent(j.content || "")
    }

    load()

  },[projectId,path,version])

  async function save(){

    await fetch("/api/dev/files/write",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        projectId,
        path,
        content
      })
    })

    onSaved()
  }

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>

      <textarea
        value={content}
        onChange={e=>setContent(e.target.value)}
        style={{flex:1,width:"100%",fontFamily:"monospace"}}
      />

      <button
        onClick={save}
        style={{height:40}}
      >
        Save
      </button>

    </div>
  )

}
