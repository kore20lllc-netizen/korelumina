"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function StudioProjectLoader(){

  const { projectId } = useParams<{ projectId:string }>()
  const router = useRouter()

  const [error,setError] = useState<string | null>(null)

  useEffect(()=>{

    async function load(){

      const r = await fetch(`/api/workspace/load?projectId=${projectId}`)
      const j = await r.json()

      if(!j.ok){
        setError(j.error || "Failed to load workspace")
        return
      }

      router.replace(
        `/studio-projects/${projectId}/${j.workspace}`
      )
    }

    if(projectId) load()

  },[projectId])

  if(error){
    return (
      <div style={{padding:40}}>
        Workspace load failed: {error}
      </div>
    )
  }

  return (
    <div style={{padding:40}}>
      Loading workspace…
    </div>
  )
}
