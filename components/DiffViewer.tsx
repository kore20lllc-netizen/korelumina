"use client"

import { diffLines } from "diff"

export default function DiffViewer({
  oldCode,
  newCode
}:{
  oldCode:string
  newCode:string
}){

  const diff = diffLines(oldCode || "", newCode || "")

  return (
    <pre style={{
      background:"#111",
      color:"#eee",
      padding:16,
      overflow:"auto",
      fontSize:12
    }}>
      {diff.map((part,i)=>{

        let color = "#eee"

        if(part.added) color = "#4caf50"
        if(part.removed) color = "#ff5252"

        return (
          <span key={i} style={{color}}>
            {part.value}
          </span>
        )
      })}
    </pre>
  )
}
