"use client"

import { useEffect, useRef } from "react"

export default function useJournalHeartbeat(projectId:string, onChange:()=>void){

  const lastCount = useRef(0)

  useEffect(()=>{

    const id = setInterval(async ()=>{

      try{

        const r = await fetch(
          `/api/dev/journal?projectId=${projectId}`
        )

        const j = await r.json()

        const count = j.entries?.length || 0

        if(count > lastCount.current){
          lastCount.current = count
          onChange()
        }

      }catch{}

    },1000)

    return ()=> clearInterval(id)

  },[projectId,onChange])

}
