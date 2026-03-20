"use client"

import { useEffect } from "react"

const EVENT = "lumina-preview"

export function emitPreview(){
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(EVENT))
}

export function usePreviewRefresh(cb: () => void){

  useEffect(()=>{

    function handler(){
      cb()
    }

    window.addEventListener(EVENT, handler)

    return () => {
      window.removeEventListener(EVENT, handler)
    }

  },[cb])

}
