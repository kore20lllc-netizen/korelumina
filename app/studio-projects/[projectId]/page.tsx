"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function ProjectIntentPage(){

  const params = useParams()
  const projectId = params?.projectId as string
  const router = useRouter()

  const [buildIntent,setBuildIntent] = useState("")
  const [userMode,setUserMode] = useState("")
  const [loading,setLoading] = useState(false)

  async function openWorkspace(){

    if(!buildIntent || !userMode){
      alert("Select what to build and how you want to work.")
      return
    }

    setLoading(true)

    const r = await fetch("/api/intent/set",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        projectId,
        buildIntent,
        userMode
      })
    })

    const j = await r.json()

    if(!j.ok){
      alert(j.error || "Failed to save intent")
      setLoading(false)
      return
    }

    const lr = await fetch(`/api/intent/load?projectId=${projectId}`)
    const lj = await lr.json()

    if(!lj.ok){
      alert(lj.error || "Failed to load route")
      setLoading(false)
      return
    }

    router.replace(lj.route)
  }

  return (
    <div style={{
      minHeight:"100vh",
      display:"grid",
      placeItems:"center",
      background:"#020617",
      color:"white",
      fontFamily:"sans-serif",
      padding:24
    }}>
      <div style={{
        width:"100%",
        maxWidth:640,
        background:"#0f172a",
        border:"1px solid #1e293b",
        borderRadius:16,
        padding:24
      }}>

        <div style={{fontSize:14,opacity:.7,marginBottom:10}}>
          KoreLumina
        </div>

        <h1 style={{fontSize:32,margin:"0 0 8px"}}>
          What do you want to build?
        </h1>

        <p style={{opacity:.8,margin:"0 0 24px"}}>
          Pick the product type and the workspace that matches your skill level.
        </p>

        <div style={{display:"grid",gap:18}}>

          <div>
            <div style={{marginBottom:8,fontWeight:600}}>Build type</div>
            <select
              value={buildIntent}
              onChange={e=>setBuildIntent(e.target.value)}
              style={{
                width:"100%",
                padding:12,
                borderRadius:10,
                background:"#111827",
                color:"white",
                border:"1px solid #334155"
              }}
            >
              <option value="">Select build type</option>
              <option value="website">Website</option>
              <option value="webapp">Web App</option>
              <option value="mobile">Mobile App</option>
              <option value="backend">Backend / API</option>
            </select>
          </div>

          <div>
            <div style={{marginBottom:8,fontWeight:600}}>Workspace mode</div>
            <select
              value={userMode}
              onChange={e=>setUserMode(e.target.value)}
              style={{
                width:"100%",
                padding:12,
                borderRadius:10,
                background:"#111827",
                color:"white",
                border:"1px solid #334155"
              }}
            >
              <option value="">Select mode</option>
              <option value="nontech">Non-Tech / AI Builder</option>
              <option value="designer">Designer Mode</option>
              <option value="dev">Developer Mode</option>
            </select>
          </div>

          <button
            onClick={openWorkspace}
            disabled={loading}
            style={{
              padding:14,
              border:"none",
              borderRadius:10,
              background:"#22c55e",
              color:"#052e16",
              fontWeight:700,
              cursor:"pointer"
            }}
          >
            {loading ? "Opening..." : "Open Workspace"}
          </button>

        </div>
      </div>
    </div>
  )
}
