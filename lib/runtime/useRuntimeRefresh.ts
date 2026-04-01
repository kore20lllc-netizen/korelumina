"use client"

import { useEffect } from "react"

export function useRuntimeRefresh(cb: ()=>void){

  useEffect(()=>{

    const handler = ()=>{
      cb()
    }

    window.addEventListener(
      "kore-runtime-refresh",
      handler
    )

    return ()=>{
      window.removeEventListener(
        "kore-runtime-refresh",
        handler
      )
    }

  },[cb])

}
