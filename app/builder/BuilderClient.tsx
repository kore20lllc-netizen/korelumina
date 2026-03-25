"use client"

import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"

export default function BuilderClient(){

  const [projectId,setProjectId] = useState("demo-project")
  const [files,setFiles] = useState<string[]>([])
  const [active,setActive] = useState("")
  const [code,setCode] = useState("")
  const [version,setVersion] = useState(0)
  const [journal,setJournal] = useState<any[]>([])

  // =========================
  // LOAD PROJECT ID
  // =========================
  useEffect(()=>{
    const id =
      new URLSearchParams(window.location.search)
      .get("projectId") || "demo-project"

    setProjectId(id)
  },[])

  // =========================
  // LOAD FILETREE
  // =========================
  async function loadFiles(id:string){
    const r = await fetch(`/api/dev/fs/list?projectId=${id}`,{ cache:"no-store" })
    const j = await r.json()

    const list = j.files || []
    setFiles(list)

    if(list.length && !active){
      openFile(id,list[0])
    }
  }

  // =========================
  // OPEN FILE
  // =========================
  async function openFile(id:string,file:string){
    setActive(file)

    const r = await fetch(
      `/api/dev/fs/read?projectId=${id}&file=${encodeURIComponent(file)}`,
      { cache:"no-store" }
    )

    const j = await r.json()
    setCode(j.code || "")
  }

  // =========================
  // LOAD JOURNAL
  // =========================
  async function loadJournal(id:string){
    const r = await fetch(`/api/dev/journal?projectId=${id}`,{ cache:"no-store" })
    const j = await r.json()

    setJournal(j.entries || [])
  }

  // =========================
  // SAVE
  // =========================
  async function save(){

    if(!active) return

    await fetch("/api/dev/fs/write",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({
        projectId,
        file: active,
        content: code
      })
    })

    const bump = await fetch("/api/dev/version/bump",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ projectId })
    })

    const bj = await bump.json()
    setVersion(bj.version || 0)

    loadJournal(projectId)
  }

  // =========================
  // INIT + VERSION STREAM
  // =========================
  useEffect(()=>{

    if(!projectId) return

    loadFiles(projectId)
    loadJournal(projectId)

    const es = new EventSource(
      `/api/dev/version/stream?projectId=${projectId}`
    )

    es.onmessage = (ev)=>{
      const d = JSON.parse(ev.data || "{}")
      setVersion(d.version || 0)
    }

    return ()=> es.close()

  },[projectId])

  // =========================
  // RENDER
  // =========================
  return (
    <div style={{display:"flex",height:"100vh"}}>

      {/* FILETREE */}
      <div style={{width:220,borderRight:"1px solid #ddd",padding:12}}>
        <b>FILES</b>

        {files.map(f=>(
          <div
            key={f}
            onClick={()=>openFile(projectId,f)}
            style={{
              cursor:"pointer",
              padding:6,
              background: active===f ? "#eef" : "transparent"
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* EDITOR */}
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>

        <div style={{
          height:50,
          borderBottom:"1px solid #ddd",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          padding:"0 10px"
        }}>
          <div>{active || "No file selected"}</div>
          <button onClick={save}>SAVE</button>
        </div>

        <Editor
          height="100%"
          language="typescript"
          value={code}
          onChange={(v)=> setCode(v || "")}
        />

      </div>

      {/* RIGHT PANEL */}
      <div style={{width:"35%",borderLeft:"1px solid #ddd"}}>

        <div style={{padding:10}}>
          <b>VERSION {version}</b>
        </div>

        <iframe
          key={version}
          src={`/api/dev/preview?projectId=${projectId}&v=${version}`}
          style={{
            width:"100%",
            height:"50%",
            border:"none",
            borderTop:"1px solid #ddd"
          }}
        />

        <div style={{
          height:"50%",
          overflow:"auto",
          borderTop:"1px solid #ddd",
          padding:10
        }}>
          <b>JOURNAL</b>

          {journal.map((j,i)=>(
            <div key={i}>
              {j.type} → {j.file || j.path}
            </div>
          ))}
        </div>

      </div>

    </div>
  )
}
