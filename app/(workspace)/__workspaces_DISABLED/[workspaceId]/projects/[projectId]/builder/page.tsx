"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import PreviewFrame from "@/components/builder/PreviewFrame"
import DraftPanel from "@/components/builder/DraftPanel"
import JournalPanel from "@/components/builder/JournalPanel"

export default function BuilderPage(){

  const params = useParams()
  const projectId = params?.projectId as string

  const [version,setVersion] = useState(0)

  useEffect(()=>{
    if(!projectId) return

    const es = new EventSource(`/api/dev/version/stream?projectId=${projectId}`)

    es.onmessage = ()=>{
      setVersion(v=>v+1)
    }

    return ()=> es.close()
  },[projectId])

  if(!projectId){
    return <div className="p-6">No project</div>
  }

  return (
    <div className="flex h-screen">

      <div className="w-96 border-r overflow-auto">
        <DraftPanel projectId={projectId} version={version}/>
        <JournalPanel projectId={projectId} version={version}/>
      </div>

      <div className="flex-1">
        <PreviewFrame projectId={projectId} version={version}/>
      </div>

    </div>
  )
}
