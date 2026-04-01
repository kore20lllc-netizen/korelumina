"use client"

import { useEffect, useState } from "react"
import useVersionStream from "@/hooks/useVersionStream"

export default function JournalPanel({ projectId }:{ projectId:string }){

  const [entries,setEntries] = useState<any[]>([])

  async function load(){
    const r = await fetch(
      `/api/dev/journal?projectId=${projectId}`
    )
    const j = await r.json()
    setEntries(j.entries || [])
  }

  useEffect(()=>{ load() },[])

  useVersionStream(projectId,load)
  useEffect(()=>{

    async function load(){

      const r = await fetch(
        "/api/dev/journal?projectId=" +
        projectId +
        "&r=" +
        refreshTick,
        { cache:"no-store" }
      );

      const j = await r.json();

      const arr =
        Array.isArray(j?.entries)
          ? [...j.entries]   // ⭐ FORCE NEW REFERENCE
          : [];

      setRows(arr);

    }

    load();

  },[projectId,refreshTick]);

  return (
    <div style={{padding:12}}>
      <b>Journal</b>
      <div style={{marginTop:8}}>
        {entries.map((e,i)=>(
          <div key={i} style={{fontSize:12}}>
            {e.type} → {e.path}
          </div>
        ))}
      </div>

      {rows.map((r,i)=>(
        <div
          key={i}
          style={{
            fontSize:12,
            padding:6,
            borderBottom:"1px solid #eee"
          }}
        >
          {r.type} → {r.path || r.file}
        </div>
      ))}
    </div>
  )

}
