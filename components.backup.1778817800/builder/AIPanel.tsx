"use client"

import { useState } from "react"

export default function AIPanel({
  projectId,
  onGenerated
}:{
  projectId:string
  onGenerated:(draftId:string)=>void
}){

  const [prompt,setPrompt] = useState("")
  const [loading,setLoading] = useState(false)

  async function generate(){

    if(!prompt.trim()) return

    setLoading(true)

    const res = await fetch("/api/ai/draft",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        projectId,
        prompt
      })
    })

    const json = await res.json()

    setLoading(false)

    if(json?.draftId){
      onGenerated(json.draftId)
    }

  }

  return (
    <div style={{padding:12,borderTop:"1px solid #ddd"}}>
      <textarea
        value={prompt}
        onChange={e=>setPrompt(e.target.value)}
        style={{width:"100%",height:80}}
      />

      <button
        onClick={generate}
        disabled={loading}
        style={{marginTop:8,width:"100%"}}
      >
        {loading ? "Generating..." : "Generate Draft"}
      </button>
    </div>
  )

}
