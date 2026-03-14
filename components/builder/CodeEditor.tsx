"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({projectId,path}:{projectId:string,path:string}){

  const [code,setCode] = useState("")

  useEffect(()=>{
    async function load(){
      const r = await fetch(`/api/dev/files/read?projectId=${projectId}&path=${path}`,{cache:"no-store"})
      const j = await r.json()
      setCode(j.content || "")
    }
    load()
  },[projectId,path])

  async function save(){
    await fetch("/api/dev/files/write",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({
        projectId,
        path,
        content:code
      })
    })
  }

  return (
    <div style={{height:"100%"}}>
      <Editor
        height="90%"
        value={code}
        onChange={(v)=>setCode(v||"")}
        defaultLanguage="typescript"
        theme="vs-dark"
      />
      <button onClick={save}>Save</button>
    </div>
  )
}
