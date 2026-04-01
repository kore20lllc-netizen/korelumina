export function runtimeRefresh(){
  if (typeof window !== "undefined"){
    window.dispatchEvent(
      new Event("kore-runtime-refresh")
    )
  }
}
