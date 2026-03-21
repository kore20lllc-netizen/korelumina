"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function StudioRuntime(){

  const { projectId } = useParams()

  const [html,setHtml] = useState<string>("Loading runtime...")

  useEffect(()=>{

    fetch(`/api/dev/runtime/execute?projectId=${projectId}`)
      .then(r=>r.text())
      .then(t=>{
        setHtml(t)
      })

  },[projectId])

  return (
    <div style={{height:"100vh"}}>
      <iframe
        srcDoc={html}
        style={{
          width:"100%",
          height:"100%",
          border:"none",
          background:"#fff"
        }}
      />
    </div>
  )
}
