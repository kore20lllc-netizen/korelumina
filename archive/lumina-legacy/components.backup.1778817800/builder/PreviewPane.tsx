"use client"

import { useEffect, useState } from "react"

export default function PreviewPane({
  projectId,
  refreshTick
}:{
  projectId:string
  refreshTick:number
}){

  const [html,setHtml] = useState("")

  useEffect(()=>{

    let cancelled = false

    async function load(){

      const r = await fetch(
        "/api/dev/preview/run?projectId=" + projectId,
        { cache:"no-store" }
      )

      const t = await r.text()

      if(!cancelled){
        setHtml(t)
      }

    }

    load()

    return ()=>{
      cancelled = true
    }

  },[projectId,refreshTick])   // ⭐ ONLY refresh on tick

  return (
    <iframe
      srcDoc={html}
      style={{flex:1,border:"none"}}
    />
  )
}
