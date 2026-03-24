"use client"

import { useState } from "react"

import FileTree from "@/components/builder/FileTree"
import CodeEditor from "@/components/builder/CodeEditor"
import PreviewFrame from "@/components/builder/PreviewFrame"
import JournalPanel from "@/components/builder/JournalPanel"
import DraftPanel from "@/components/builder/DraftPanel"
import AIPanel from "@/components/builder/AIPanel"

export default function Shell({
  workspaceId,
  projectId
}:{
  workspaceId:string
  projectId:string
}){

  const [file,setFile] = useState("app/page.tsx")
  const [refreshTick,setRefreshTick] = useState(0)

  function refreshAll(nextFile?:string){
    if(nextFile){
      setFile(nextFile)
    }
    setRefreshTick(t => t + 1)
  }

  return (
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:260,borderRight:"1px solid #ddd"}}>
        <FileTree
          projectId={projectId}
          refreshTick={refreshTick}
          onSelect={setFile}
        />
      </div>

      <div style={{flex:1,borderRight:"1px solid #ddd"}}>
        <CodeEditor
          key={file + refreshTick}
          projectId={projectId}
          path={file}
          onSaved={()=>{
            refreshAll(file)
          }}
        />
      </div>

      <div style={{width:420,borderRight:"1px solid #ddd"}}>
        <PreviewFrame
          key={refreshTick}
          projectId={projectId}
          refreshTick={refreshTick}
        />
      </div>

      <div style={{width:360,display:"flex",flexDirection:"column"}}>

        <DraftPanel
          projectId={projectId}
          refreshTick={refreshTick}
          onAccepted={(writtenPath?:string)=>{
            refreshAll(writtenPath || "app/page.tsx")
          }}
        />

        <JournalPanel
          projectId={projectId}
          refreshTick={refreshTick}
        />

        <AIPanel
          projectId={projectId}
          onGenerated={()=>{
            refreshAll(file)
          }}
        />

      </div>

    </div>
  )
}
