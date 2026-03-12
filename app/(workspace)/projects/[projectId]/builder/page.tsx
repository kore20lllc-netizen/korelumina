"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FileTree from "@/components/builder/FileTree";
import CodeEditor from "@/components/builder/CodeEditor";
import PreviewFrame from "@/components/builder/PreviewFrame";
import AIPanel from "@/components/builder/AIPanel";

export default function BuilderPage() {

  const params = useParams()
  const projectId = params?.projectId as string | undefined

  const [file,setFile] = useState("app/page.tsx")

  // OPEN FILE EVENT
  useEffect(() => {

  const open = (e: Event) => {
    const ce = e as CustomEvent<string>

    if (ce.detail) {
      setFile(ce.detail)
    }
  }

  window.addEventListener("korelumina:open-file", open)

  return () => {
    window.removeEventListener("korelumina:open-file", open)
  }

}, [])

  // FS STREAM
  useEffect(()=>{
    if(!projectId) return

    const es = new EventSource("/api/dev/fs-stream?projectId="+projectId)

    es.onmessage = (ev)=>{
      try{
        const j = JSON.parse(ev.data)
        if(j.type === "fs-change"){
          window.dispatchEvent(
            new CustomEvent("korelumina:fs-change",{ detail:j })
          )
        }
      }catch{}
    }

    return ()=> es.close()
  },[projectId])

  if(!projectId) return null

  return (
    <div style={{display:"flex",height:"100vh"}}>
      <div style={{width:260,borderRight:"1px solid #ddd"}}>
        <FileTree projectId={projectId} onSelect={setFile}/>
      </div>

      <div style={{flex:1}}>
        <CodeEditor projectId={projectId} path={file}/>
      </div>

      <div style={{width:420}}>
        <PreviewFrame projectId={projectId}/>
      </div>

      <AIPanel projectId={projectId}/>
    </div>
  )
}
