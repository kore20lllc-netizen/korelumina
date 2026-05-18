"use client"

import { useEffect, useRef } from "react"

export default function useRuntimeVersion(
  projectId:string,
  onChange:()=>void
){

  const last = useRef(0)

  useEffect(()=>{

    const id = setInterval(async ()=>{

      const r = await fetch(
        `/api/dev/version?projectId=${projectId}`
      )

      const j = await r.json()

      if(j.version !== last.current){
        last.current = j.version
        onChange()
      }

    },1000)

    return ()=> clearInterval(id)

  },[projectId,onChange])

}
