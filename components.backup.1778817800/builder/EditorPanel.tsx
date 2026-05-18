"use client"

import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"

type Props = {
  projectId: string
  tick: number
}

export default function EditorPanel({ projectId, tick }: Props){

  const [files,setFiles] = useState<string[]>([])
  const [active,setActive] = useState<string | null>(null)
  const [code,setCode] = useState("")

  useEffect(()=>{
    loadFiles()
  },[tick])

  const loadFiles = async () => {
    const res = await fetch(`/api/dev/preview?projectId=${projectId}`)
    const html = await res.text()

    const matches = [...html.matchAll(/ai-generated-[^<]+/g)]
      .map(m => m[0])

    setFiles(matches)

    if(matches.length && !active){
      openFile(matches[0])
    }
  }

  const openFile = async (file:string) => {
    setActive(file)

    const res = await fetch(`/api/dev/file?projectId=${projectId}&path=app/${file}`)
    const json = await res.json()

    setCode(json.content || "")
  }

  return (
    <div style={{display:"flex",height:"100%"}}>
      
      <div style={{width:220,borderRight:"1px solid #eee",padding:12}}>
        <div style={{fontWeight:600,marginBottom:10}}>Files</div>

        {files.map(f => (
          <div
            key={f}
            onClick={()=>openFile(f)}
            style={{
              cursor:"pointer",
              padding:"6px 8px",
              background: active===f ? "#eef" : "transparent"
            }}
          >
            {f}
          </div>
        ))}

      </div>

      <div style={{flex:1}}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={(v)=>setCode(v || "")}
        />
      </div>

    </div>
  )
}
