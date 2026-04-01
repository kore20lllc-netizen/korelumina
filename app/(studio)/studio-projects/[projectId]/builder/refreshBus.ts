"use client"

type Listener = () => void

function getBus(){

  if (typeof window === "undefined") {
    return {
      listeners: new Set<Listener>(),
      emit(){},
      subscribe(){ return ()=>{} }
    }
  }

  const g = window as any

  if (!g.__KORE_REFRESH_BUS__) {

    g.__KORE_REFRESH_BUS__ = {

      listeners: new Set<Listener>(),

      emit(){
        for (const fn of g.__KORE_REFRESH_BUS__.listeners){
          fn()
        }
      },

      subscribe(fn: Listener){
        g.__KORE_REFRESH_BUS__.listeners.add(fn)
        return () => g.__KORE_REFRESH_BUS__.listeners.delete(fn)
      }

    }

  }

  return g.__KORE_REFRESH_BUS__

}

export function emitRefresh(){
  getBus().emit()
}

export function useRefreshBus(fn: Listener){

  const { useEffect } = require("react")

  useEffect(()=>{
    return getBus().subscribe(fn)
  },[fn])

}
