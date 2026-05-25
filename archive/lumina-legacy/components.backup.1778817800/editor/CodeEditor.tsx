"use client"

import Editor from "@monaco-editor/react"

export default function CodeEditor({
  value,
  onChange
}:{
  value:string
  onChange:(v:string)=>void
}){

  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      theme="vs-dark"
      value={value}
      onChange={(v)=>onChange(v || "")}
      options={{
        fontSize:13,
        minimap:{ enabled:false },
        automaticLayout:true
      }}
    />
  )
}
