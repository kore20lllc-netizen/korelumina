"use client"

import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"
import PreviewFrame from "@/components/builder/PreviewFrame"

export default function BuilderInner(){

  const [projectId,setProjectId] = useState<string>("demo-project")
  const [files,setFiles] = useState<string[]>([])
  const [active,setActive] = useState<string>("")
  const [code,setCode] = useState("")
  const [version,setVersion] = useState(0)

  useEffect(()=>{
    const id =
      new URLSearchParams(window.location.search)
        .get("projectId") || "demo-project"

    setProjectId(id)
  },[])

  useEffect(()=>{
    if(!projectId) return

    loadFiles(projectId)

    const es = new EventSource(
      "/api/dev/version/stream?projectId=" + projectId
    )

    es.onmessage = ev=>{
      const v = Number(JSON.parse(ev.data).version || 0)
      setVersion(v)
    }

    return ()=> es.close()

  },[projectId])

  async function loadFiles(id:string){
    const r = await fetch("/api/dev/fs/list?projectId="+id)
    const j = await r.json()

    const list = j.files || []
    setFiles(list)

    if(list.length){
      openFile(id,list[0])
    }
  }

  async function openFile(id:string,file:string){
    setActive(file)

    const r = await fetch(
      "/api/dev/fs/read?projectId="+id+"&file="+file
    )

    const j = await r.json()
    setCode(j.code || "")
  }

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

    await fetch("/api/dev/version/bump",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ projectId })
    })
  }

  return (
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:240,borderRight:"1px solid #ddd",padding:10}}>
        {files.map(f=>(
          <div
            key={f}
            style={{cursor:"pointer",marginBottom:6}}
            onClick={()=>openFile(projectId,f)}
          >
            {f}
          </div>
        ))}
      </div>

      <div style={{flex:1}}>
        <button onClick={save}>SAVE</button>

        <Editor
          height="90vh"
          language="typescript"
          value={code}
          onChange={v=>setCode(v || "")}
        />
      </div>

      <div style={{width:"40%",borderLeft:"1px solid #ddd"}}>
        <div style={{padding:10}}>VERSION {version}</div>

        <PreviewFrame
          projectId={projectId}
          version={version}
        />
      </div>

    </div>
  )
}
