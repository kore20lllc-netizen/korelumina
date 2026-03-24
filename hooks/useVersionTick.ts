"use client"

import { useEffect } from "react"

export default function useVersionTick(projectId:string, onTick:()=>void){

  useEffect(()=>{

    const es = new EventSource(
      `/api/dev/version/stream?projectId=${projectId}`
    )

    es.onmessage = () => {
      onTick()
    }

    return () => es.close()

  },[projectId])

}
