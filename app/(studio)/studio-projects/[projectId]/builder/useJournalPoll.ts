"use client"
import { emitRefresh } from "./refreshBus"

let globalPollId:any = null

export function useJournalPoll(projectId:string){

  if(globalPollId) return

  globalPollId = setInterval(async ()=>{

    try{
      await fetch(
        "/api/dev/journal/latest?projectId=" + projectId,
        { cache:"no-store" }
      )
    }catch{}

  },2500)

}
