"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import PreviewFrame from "./components/PreviewFrame"

type JournalEntry = {
  t:number
  type:string
  path:string
}

export default function BuilderPage(){

  const projectId = "demo-project"

  const [files,setFiles] = useState<string[]>([])
  const [active,setActive] = useState<string | null>(null)
  const [code,setCode] = useState("")
  const [version,setVersion] = useState(0)
  const [journal,setJournal] = useState<JournalEntry[]>([])

  const initializedRef = useRef(false)

  const sortedFiles = useMemo(()=>{
    return [...files].sort((a,b)=> b.localeCompare(a))
  },[files])

  async function loadFiles(){
    const r = await fetch(
      "/api/dev/fs/list?projectId=" + projectId,
      { cache:"no-store" }
    )
    const j = await r.json()
    const nextFiles = Array.isArray(j.files) ? j.files : []
    setFiles(nextFiles)
    return nextFiles
  }

  async function loadJournal(){
    const r = await fetch(
      "/api/dev/journal?projectId=" + projectId,
      { cache:"no-store" }
    )
    const j = await r.json()
    const nextJournal = Array.isArray(j.entries) ? j.entries : []
    setJournal(nextJournal)
    return nextJournal
  }

  async function openFile(file:string){
    setActive(file)

    const r = await fetch(
      "/api/dev/fs/read?projectId=" + projectId + "&file=" + encodeURIComponent(file),
      { cache:"no-store" }
    )
    const j = await r.json()

    setCode(j.content || "")
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
  }

  async function refreshAll(autoFocusNewest:boolean){
    const [nextFiles,nextJournal] = await Promise.all([
      loadFiles(),
      loadJournal()
    ])

    if(!nextFiles.length) return

    const newestFile = [...nextFiles].sort((a,b)=> b.localeCompare(a))[0]

    if(autoFocusNewest){
      if(active !== newestFile){
        await openFile(newestFile)
      }
      return
    }

    if(active){
      const stillExists = nextFiles.includes(active)
      if(stillExists){
        await openFile(active)
        return
      }
    }

    await openFile(newestFile)
  }
 
   useEffect(()=>{
 
     if(!projectId) return
 
     refreshAll(true)
 
     const es = new EventSource(
       "/api/dev/version/stream?projectId=" + projectId
     )
 
     es.onmessage = async (ev)=>{
       try{
         const data = JSON.parse(ev.data || "{}")
         const nextVersion = Number(data.version || 0)
 
         setVersion(nextVersion)
 
         if(!initializedRef.current){
           initializedRef.current = true
           return
         }

         await refreshAll(true)

       }catch{}
     }

     return ()=> es.close()

   },[projectId])

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"sans-serif"}}>

      {/* FILE TREE */}
      <div style={{
        width:240,
        borderRight:"1px solid #ddd",
        padding:12,
        overflow:"auto"
      }}>
        <div style={{fontWeight:700,marginBottom:10}}>FILES</div>

        {sortedFiles.map(file=>(
          <div
            key={file}
            onClick={()=>openFile(file)}
            style={{
              cursor:"pointer",
              padding:"6px 8px",
              borderRadius:6,
              background: active === file ? "#eef2ff" : "transparent",
              marginBottom:4,
              fontSize:13,
              wordBreak:"break-all"
            }}
          >
            {file}
          </div>
        ))}
      </div>

      {/* MONACO */}
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{
          height:48,
          borderBottom:"1px solid #ddd",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          padding:"0 12px"
        }}>
          <div style={{fontSize:13}}>
            {active || "No file selected"}
          </div>

          <button onClick={save}>SAVE</button>
        </div>

        <div style={{flex:1}}>
          <Editor
            height="100%"
            language="typescript"
            value={code}
            onChange={(v)=>setCode(v || "")}
            onMount={(editor,monaco)=>{
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                ()=> save()
              )
            }}
          />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width:"42%",
        borderLeft:"1px solid #ddd",
        display:"flex",
        flexDirection:"column"
      }}>

        <div style={{
          padding:12,
          borderBottom:"1px solid #ddd"
        }}>
          <div style={{fontWeight:700}}>VERSION</div>
          <div style={{fontSize:28}}>{version}</div>
        </div>

        <div style={{
          padding:12,
          borderBottom:"1px solid #ddd",
          maxHeight:180,
          overflow:"auto"
        }}>
          <div style={{fontWeight:700,marginBottom:8}}>JOURNAL</div>

          {journal.map((e,i)=>(
            <div key={i} style={{fontSize:12,marginBottom:6}}>
              {e.type} → {e.path}
            </div>
          ))}
        </div>

        <div style={{flex:1}}>
          <PreviewFrame
            projectId={projectId}
            version={version}
          />
        </div>

      </div>

    </div>
  )
}
