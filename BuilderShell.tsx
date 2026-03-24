"use client"

import { useEffect, useState } from "react"

import FileTree from "@/components/builder/FileTree"
import CodeEditor from "@/components/builder/CodeEditor"
import PreviewFrame from "@/components/builder/PreviewFrame"
import DraftPanel from "@/components/builder/DraftPanel"
import AIPanel from "@/components/builder/AIPanel"
import JournalPanel from "@/components/builder/JournalPanel"

export default function BuilderShell({
  projectId
}:{ projectId:string }){

  const [file,setFile] = useState("app/page.tsx")
  const [tick,setTick] = useState(0)

  function refresh(){
    console.log("BUILDER HARD REFRESH")
    setTick(t=>t+1)
  }

  useEffect(()=>{

    function onRefresh(){
      refresh()
    }

    window.addEventListener("kore:builder-refresh",onRefresh)

    return ()=>{
      window.removeEventListener("kore:builder-refresh",onRefresh)
    }

  },[])

  return (
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:260,borderRight:"1px solid #ddd"}}>
        <FileTree
          projectId={projectId}
          refreshTick={tick}
          onSelect={setFile}
        />
      </div>

      <div style={{flex:1}}>
        <CodeEditor
          key={file + tick}
          projectId={projectId}
          path={file}
          onSaved={refresh}
        />
      </div>

      <div style={{width:420}}>
        <PreviewFrame
          projectId={projectId}
          refreshTick={tick}
        />
      </div>

      <div style={{
        width:360,
        display:"flex",
        flexDirection:"column"
      }}>

        <div style={{flex:1}}>
          <DraftPanel
            projectId={projectId}
            refreshTick={tick}
            onAccepted={refresh}
          />
        </div>

        <div style={{height:200}}>
          <JournalPanel
            projectId={projectId}
            refreshTick={tick}
          />
        </div>

        <AIPanel
          projectId={projectId}
          onGenerated={refresh}
        />

      </div>

    </div>
  )
}
