"use client"

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

}
