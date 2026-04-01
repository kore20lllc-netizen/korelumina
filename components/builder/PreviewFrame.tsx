"use client"

<<<<<<< HEAD
import { useMemo } from "react"

export default function PreviewFrame({
  projectId,
  version
}:{
  projectId:string
  version:number
}){

  const src = useMemo(()=>{
    return `/api/dev/preview?projectId=${projectId}&v=${version}`
  },[projectId,version])

  return (
    <div style={{
      marginTop:20,
      border:"1px solid #ddd",
      height:500
    }}>
      <iframe
        src={src}
        style={{
          width:"100%",
          height:"100%",
          border:"none"
        }}
      />
    </div>
  )

=======
import { useEffect, useState } from "react"

export default function PreviewFrame({
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
        "/api/dev/preview/run?projectId=" + projectId + "&t=" + refreshTick,
        { cache:"no-store" }
      )

      const t = await r.text()

      if(!cancelled){
        setHtml(t || "")
      }
    }

    load()

    return ()=>{
      cancelled = true
    }

  },[projectId,refreshTick])

  return (
    <iframe
      srcDoc={html}
      style={{width:"100%",height:"100%",border:0}}
      sandbox="allow-scripts"
    />
  )
>>>>>>> origin/main
}
