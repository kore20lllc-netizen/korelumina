"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import MonacoEditor from "./MonacoEditor"
import DiffSidebar from "./DiffSidebar"

type DiffItem = {
  file?: string
  path?: string
  next?: string
  after?: string
  diff?: string
}

export default function BuilderPage(){

  const params = useParams()
  const projectId = params?.projectId as string

  const [files,setFiles] = useState<string[]>([])
  const [tabs,setTabs] = useState<string[]>([])
  const [activeFile,setActiveFile] = useState("")
  const [buffers,setBuffers] = useState<Record<string,string>>({})
  const [dirty,setDirty] = useState<Record<string,boolean>>({})
  const [prompt,setPrompt] = useState("")
  const [status,setStatus] = useState("Ready")
  const [previewKey,setPreviewKey] = useState(0)
  const [diffs,setDiffs] = useState<DiffItem[]>([])

  const activeContent = useMemo(()=>{
    return activeFile ? (buffers[activeFile] || "") : ""
  },[buffers,activeFile])

  useEffect(()=>{
    if(projectId){
      loadFiles()
    }
  },[projectId])

  async function loadFiles(){
    const r = await fetch(`/api/dev/files/list?projectId=${projectId}`,{
      cache:"no-store"
    })
    const j = await r.json()
    setFiles(j.files || [])
  }

  async function openFile(file:string){

    if(!tabs.includes(file)){
      setTabs(t=>[...t,file])
    }

    setActiveFile(file)

    if(typeof buffers[file] === "string"){
      setStatus(`Opened ${file}`)
      return
    }

    const r = await fetch(
      `/api/dev/files/read?projectId=${projectId}&file=${encodeURIComponent(file)}`,
      { cache:"no-store" }
    )

    const text = await r.text()

    setBuffers(b=>({
      ...b,
      [file]:text
    }))

    setDirty(d=>({
      ...d,
      [file]:false
    }))

    setStatus(`Opened ${file}`)
  }

  function updateContent(v:string){
    if(!activeFile) return

    setBuffers(b=>({
      ...b,
      [activeFile]:v
    }))

    setDirty(d=>({
      ...d,
      [activeFile]:true
    }))

    setStatus("Unsaved")
  }

  async function saveFile(targetFile = activeFile){
    if(!targetFile) return

    setStatus("Saving...")

    await fetch("/api/dev/files/write",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        projectId,
        file:targetFile,
        content:buffers[targetFile] || ""
      })
    })

    setDirty(d=>({
      ...d,
      [targetFile]:false
    }))

    setPreviewKey(k=>k+1)
    setStatus("Saved")
  }

  async function generate(){
    if(!prompt.trim()) return

    setStatus("Planning...")

    const r = await fetch("/api/ai/plan",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        projectId,
        spec:prompt
      })
    })

    const j = await r.json()
    const raw = Array.isArray(j.files) ? j.files : []

    const normalized:DiffItem[] = raw
      .map((f:any)=>({
        file: f.file || f.path || "",
        path: f.path || f.file || "",
        next: f.next || f.after || f.content || "",
        after: f.after || f.next || f.content || "",
        diff: f.diff || ""
      }))
      .filter((f:DiffItem)=>f.file)

    setDiffs(normalized)
    setStatus(normalized.length ? "Review AI changes" : "No changes")
  }

  async function applyOne(diff:DiffItem){
    const file = diff.file || diff.path || ""
    const nextContent = diff.next ?? diff.after ?? ""

    if(!file) return

    setStatus(`Applying ${file}...`)

    await fetch("/api/dev/files/write",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        projectId,
        file,
        content:nextContent
      })
    })

    setBuffers(b=>({
      ...b,
      [file]:nextContent
    }))

    setDirty(d=>({
      ...d,
      [file]:false
    }))

    if(!tabs.includes(file)){
      setTabs(t=>[...t,file])
    }

    setActiveFile(file)
    setDiffs(current=>current.filter(x=>(x.file || x.path) !== file))
    setPreviewKey(k=>k+1)
    setStatus(`Applied ${file}`)

    await loadFiles()
  }

  async function applyAll(){
    if(!diffs.length) return

    setStatus("Applying all...")

    for(const d of diffs){
      const file = d.file || d.path || ""
      const nextContent = d.next ?? d.after ?? ""

      if(!file) continue

      await fetch("/api/dev/files/write",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          projectId,
          file,
          content:nextContent
        })
      })

      setBuffers(b=>({
        ...b,
        [file]:nextContent
      }))

      setDirty(prev=>({
        ...prev,
        [file]:false
      }))
    }

    const firstFile = diffs[0]?.file || diffs[0]?.path || ""

    if(firstFile){
      if(!tabs.includes(firstFile)){
        setTabs(t=>[...t,firstFile])
      }
      setActiveFile(firstFile)
    }

    setDiffs([])
    setPreviewKey(k=>k+1)
    setStatus("Applied ✓")

    await loadFiles()
  }

  function closeTab(file:string){
    const nextTabs = tabs.filter(t=>t!==file)
    setTabs(nextTabs)

    if(activeFile === file){
      setActiveFile(nextTabs[0] || "")
    }
  }

  return (
    <div style={{
      height:"100vh",
      display:"flex",
      flexDirection:"column",
      background:"#0f172a",
      color:"#e5e7eb",
      fontFamily:"sans-serif"
    }}>

      <div style={{
        height:56,
        borderBottom:"1px solid #1f2937",
        display:"flex",
        alignItems:"center",
        gap:12,
        padding:"0 16px",
        background:"#111827"
      }}>
        <input
          value={prompt}
          onChange={e=>setPrompt(e.target.value)}
          placeholder="Generate feature / UI / refactor..."
          style={{
            flex:1,
            height:38,
            padding:"0 12px",
            border:"1px solid #374151",
            borderRadius:10,
            background:"#0b1220",
            color:"#e5e7eb"
          }}
        />

        <button onClick={generate}>Generate</button>
        <button onClick={()=>saveFile()}>Save</button>

        <div style={{fontSize:12,color:"#9ca3af",minWidth:130,textAlign:"right"}}>
          {status}
        </div>
      </div>

      <div style={{flex:1,display:"flex",minHeight:0}}>

        <div style={{
          width:250,
          borderRight:"1px solid #1f2937",
          overflow:"auto",
          padding:10,
          background:"#020617"
        }}>
          <div style={{
            fontSize:12,
            color:"#94a3b8",
            marginBottom:10,
            textTransform:"uppercase",
            letterSpacing:0.5
          }}>
            Explorer
          </div>

          {files.map(f=>(
            <div
              key={f}
              onClick={()=>openFile(f)}
              style={{
                padding:"8px 10px",
                cursor:"pointer",
                borderRadius:8,
                color: activeFile===f ? "#fff" : "#cbd5e1",
                background: activeFile===f ? "#1e293b" : "transparent",
                marginBottom:4,
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
              }}
            >
              <span style={{fontSize:13}}>{f}</span>
              {dirty[f] && <span style={{fontSize:11,color:"#f59e0b"}}>●</span>}
            </div>
          ))}
        </div>

        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

          <div style={{
            height:40,
            borderBottom:"1px solid #1f2937",
            display:"flex",
            alignItems:"center",
            overflowX:"auto",
            background:"#0b1220"
          }}>
            {tabs.map(t=>(
              <div
                key={t}
                onClick={()=>setActiveFile(t)}
                style={{
                  height:"100%",
                  display:"flex",
                  alignItems:"center",
                  gap:8,
                  padding:"0 12px",
                  cursor:"pointer",
                  borderRight:"1px solid #1f2937",
                  background: activeFile===t ? "#111827" : "transparent",
                  color:"#e5e7eb"
                }}
              >
                <span style={{fontSize:13}}>{t}</span>
                {dirty[t] && <span style={{fontSize:11,color:"#f59e0b"}}>●</span>}
                <span
                  onClick={(e)=>{
                    e.stopPropagation()
                    closeTab(t)
                  }}
                  style={{opacity:0.7}}
                >
                  ×
                </span>
              </div>
            ))}
          </div>

          <div style={{flex:1,minHeight:0}}>
            <MonacoEditor
              value={activeContent}
              onChange={updateContent}
            />
          </div>
        </div>

        <div style={{
          width:460,
          minWidth:460,
          borderLeft:"1px solid #1f2937",
          display:"flex",
          flexDirection:"column",
          background:"#ffffff"
        }}>
          <div style={{
            height:40,
            borderBottom:"1px solid #e5e7eb",
            display:"flex",
            alignItems:"center",
            padding:"0 12px",
            fontWeight:600,
            color:"#111827",
            background:"#f8fafc"
          }}>
            Runtime Preview
          </div>

          <iframe
            key={previewKey}
            src={`/api/dev/preview/run?projectId=${projectId}&t=${previewKey}`}
            style={{width:"100%",height:"100%",border:"none"}}
          />
        </div>
      </div>

      {diffs.length > 0 && (
        <DiffSidebar
          diffs={diffs}
          onApplyAll={applyAll}
          onApplyOne={applyOne}
          onClose={()=>setDiffs([])}
        />
      )}
    </div>
  )
}
