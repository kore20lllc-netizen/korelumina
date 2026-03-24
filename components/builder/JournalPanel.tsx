"use client"

import { useEffect, useState } from "react"

type Entry = {
  t:number
  type:string
  path:string
}

export default function JournalPanel({
  projectId,
  version
}:{
  projectId:string
  version:number
}){

  const [entries,setEntries] = useState<Entry[]>([])

  async function load(){
    const r = await fetch(
      "/api/dev/journal?projectId=" + projectId,
      { cache:"no-store" }
    )
    const j = await r.json()
    setEntries(j.entries || [])
  }

  useEffect(()=>{
    load()
  },[version])

  return(
    <div className="p-3">
      <div className="font-bold mb-2">Journal</div>

      {entries.length === 0 && (
        <div className="text-xs text-gray-500">
          No journal activity
        </div>
      )}

      {entries.map((e,i)=>(
        <div key={i} className="text-xs mb-1">
          {e.type} → {e.path}
        </div>
      ))}
    </div>
  )

}
