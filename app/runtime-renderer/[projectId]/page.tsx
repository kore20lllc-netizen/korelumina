"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function RuntimeRenderer(){

  const { projectId } = useParams()
  const [files,setFiles] = useState<string[]>([])

  useEffect(()=>{
    fetch(`/api/dev/files/list?projectId=${projectId}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok){
          setFiles(d.files || [])
        }
      })
  },[projectId])

  return (
    <div style={{padding:40}}>
      <h1>Runtime App Preview</h1>

      {files.includes("page.tsx")
        ? <iframe
            src={`/studio-runtime/${projectId}`}
            style={{
              width:"100%",
              height:"80vh",
              border:"1px solid #ddd",
              borderRadius:8
            }}
          />
        : <div>No page.tsx</div>
      }

    </div>
  )
}
