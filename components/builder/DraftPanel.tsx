"use client"

import { useEffect, useState } from "react"
import useVersionStream from "@/hooks/useVersionStream"

export default function DraftPanel({ projectId }:{ projectId:string }){

  const [drafts,setDrafts] = useState<any[]>([])

  async function load(){
    const r = await fetch(
      `/api/dev/drafts?projectId=${projectId}`
    )
    const j = await r.json()
    setDrafts(j.drafts || [])
  }

  useEffect(()=>{ load() },[])

  useVersionStream(projectId,load)

  return (
    <div style={{padding:12}}>
      <b>Drafts</b>
      <div style={{marginTop:8}}>
        {drafts.map(d=>(
          <div key={d.id} style={{fontSize:12}}>
            {d.path}
          </div>
        ))}
      </div>
    </div>
  )

}
