"use client"

import { useState } from "react"
import DiffViewer from "@/components/DiffViewer"

export default function Shell({workspaceId,projectId}:{workspaceId:string;projectId:string}){

  const [spec,setSpec] = useState("")
  const [plan,setPlan] = useState<any[]>([])
  const [files,setFiles] = useState<any[]>([])
  const [selected,setSelected] = useState<number>(0)

  async function generatePlan(){

    const r = await fetch("/api/ai/plan",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({workspaceId,projectId,spec})
    })

    const d = await r.json()
    setPlan(d.plan || [])
  }

  async function generateDiff(){

    const r = await fetch("/api/ai/task",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        workspaceId,
        projectId,
        mode:"draft",
        spec
      })
    })

    const d = await r.json()

    setFiles(d.files || [])
    setSelected(0)
  }

  async function applySelected(){

    const file = files[selected]

    if(!file) return

    const r = await fetch("/api/ai/apply",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        workspaceId,
        projectId,
        files:[file]
      })
    })

    const d = await r.json()

    alert(JSON.stringify(d,null,2))
  }

  const selectedFile = files[selected]

  return(

    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:260,borderRight:"1px solid #ddd",padding:10}}>

        <h3>Plan</h3>

        {plan.map((f,i)=>(
          <div key={i}>{f.path}</div>
        ))}

        <h3 style={{marginTop:20}}>Files</h3>

        {files.map((f,i)=>(
          <div
            key={i}
            onClick={()=>setSelected(i)}
            style={{
              cursor:"pointer",
              fontFamily:"monospace",
              padding:4,
              background:i===selected?"#eee":"transparent"
            }}
          >
            {f.path}
          </div>
        ))}

      </div>

      <div style={{flex:1,padding:20}}>

        <textarea
          value={spec}
          onChange={e=>setSpec(e.target.value)}
          style={{width:"100%",height:100}}
        />

        <div style={{marginTop:10}}>

          <button onClick={generatePlan}>
            Generate Plan
          </button>

          <button onClick={generateDiff} style={{marginLeft:10}}>
            Generate Diff
          </button>

          <button onClick={applySelected} style={{marginLeft:10}}>
            Apply Selected
          </button>

        </div>

        <div style={{marginTop:20}}>

          {selectedFile && (
            <DiffViewer
              oldCode=""
              newCode={selectedFile.content}
            />
          )}

        </div>

      </div>

      <div style={{width:300,borderLeft:"1px solid #ddd",padding:10}}>
        <h3>Journal</h3>
      </div>

    </div>
  )
}
