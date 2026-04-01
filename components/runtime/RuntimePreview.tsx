"use client"

import { useEffect, useRef, useState } from "react"
import RuntimeErrorOverlay from "@/components/runtime/RuntimeErrorOverlay"

export default function RuntimePreview({ projectId }:{ projectId:string }){

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [tick,setTick] = useState("0")
  const [error,setError] = useState<string | null>(null)

  useEffect(()=>{

    const id = setInterval(async ()=>{

      try{
        const res = await fetch("/api/dev/runtime/tick")
        const json = await res.json()

        if(json.tick !== tick){

          setTick(json.tick)
          setError(null)

          if(iframeRef.current){
            iframeRef.current.src =
              "/api/dev/preview/run?projectId="+projectId+"&t="+json.tick
          }
        }
      }catch(e:any){
        setError(String(e?.message || e))
      }

    },1000)

    return ()=> clearInterval(id)

  },[tick,projectId])

  return (
    <div style={{
      position:"relative",
      width:"100%",
      height:"100%",
      overflow:"hidden",
      background:"#f6f7f9",
      borderLeft:"1px solid #e5e7eb"
    }}>
      <RuntimeErrorOverlay error={error} />

      <iframe
        ref={iframeRef}
        src={"/api/dev/preview/run?projectId="+projectId}
        style={{
          width:"100%",
          height:"100%",
          border:"none",
          background:"white"
        }}
      />
    </div>
  )
}
