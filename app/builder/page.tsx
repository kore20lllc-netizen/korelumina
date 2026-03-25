"use client"

import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"

export default function Page(){

  const projectId = "demo-project"

  const [files,setFiles] = useState<string[]>([])
  const [active,setActive] = useState("page.tsx")
  const [code,setCode] = useState("")
  const [version,setVersion] = useState(0)
  const [previewKey,setPreviewKey] = useState(0)
  const [journal,setJournal] = useState<any[]>([])

  async function loadFiles(){
    const r = await fetch("/api/dev/fs/list?projectId="+projectId,{cache:"no-store"})
    const j = await r.json()
    setFiles(j.files || [])
  }

  async function loadFile(file:string){
    const r = await fetch("/api/dev/fs/read?projectId="+projectId+"&file="+file,{cache:"no-store"})
    const j = await r.json()
    setCode(j.content || "")
  }

  async function refreshJournal(){
    const r = await fetch("/api/dev/journal?projectId="+projectId,{cache:"no-store"})
    const j = await r.json()
    setJournal(j.entries || [])
  }

  async function save(){

    const r = await fetch("/api/dev/fs/write",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({
        projectId,
        file: active,
        content: code
      })
    })

    const j = await r.json()

    const v = j.version ?? (version + 1)

    setVersion(v)
    setPreviewKey(k=>k+1)

    refreshJournal()
  }

  useEffect(()=>{
    loadFiles()
    loadFile(active)
    refreshJournal()
  },[])

  return (
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:220,borderRight:"1px solid #333",padding:10}}>
        {files.map(f=>(
          <div
            key={f}
            style={{
              padding:8,
              cursor:"pointer",
              background:f===active ? "#eee" : "transparent"
            }}
            onClick={()=>{
              setActive(f)
              loadFile(f)
            }}
          >
            {f}
          </div>
        ))}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <button onClick={save}>SAVE</button>

        <div style={{flex:1}}>
          <Editor
            theme="vs-dark"
            language="typescript"
            value={code}
            onChange={(v)=>setCode(v || "")}
            options={{automaticLayout:true}}
          />
        </div>
      </div>

      <div style={{width:520,borderLeft:"1px solid #333",display:"flex",flexDirection:"column"}}>
        <div style={{padding:10,background:"#111",color:"#fff"}}>
          VERSION {version}
        </div>

        <iframe
          key={previewKey}
          src={"/api/dev/preview?projectId="+projectId+"&v="+version}
          style={{flex:1,width:"100%",border:"none",background:"#fff"}}
        />

        <div style={{height:200,overflow:"auto",borderTop:"1px solid #333"}}>
          {journal.map((e,i)=>(
            <div key={i}>{e.op || e.type} → {e.file}</div>
          ))}
        </div>

      </div>

    </div>
  )
}
