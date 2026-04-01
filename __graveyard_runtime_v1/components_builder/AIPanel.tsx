"use client"

import { useState } from "react"

export default function AIPanel({
  projectId,
  onGenerated
}:{
  projectId:string
  onGenerated?:()=>void
}){

  const [prompt,setPrompt] = useState("")
  const [loading,setLoading] = useState(false)

  async function runAI(){

    if(!prompt.trim()) return

    setLoading(true)

    try{
      const r = await fetch("/api/dev/drafts/create",{
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({
          projectId,
          prompt
        })
      })

      await r.json()
      onGenerated?.()

    }catch(e){
      console.error("AI draft create failed",e)
    }

    setLoading(false)
  }

  return (
    <div style={{padding:8,borderTop:"1px solid #eee"}}>
      <div style={{fontWeight:700,marginBottom:6}}>
        AI
      </div>

      <textarea
        value={prompt}
        onChange={e=>setPrompt(e.target.value)}
        style={{width:"100%",height:120}}
      />

      <button
        disabled={loading}
        onClick={runAI}
      >
        {loading ? "Running..." : "Run AI"}
      </button>
    </div>
  )
}
