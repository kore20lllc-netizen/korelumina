"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import PreviewFrame from "@/components/builder/PreviewFrame";
import FileTree from "@/components/builder/FileTree";
import CodeEditor from "@/components/builder/CodeEditor";

export default function BuilderShell(){

  const params = useParams();

  const projectId =
    typeof params?.projectId === "string"
      ? params.projectId
      : Array.isArray(params?.projectId)
      ? params.projectId[0]
      : undefined;

  if (!projectId) {
    return <div style={{padding:40}}>Loading project…</div>;
  }

  const [file,setFile] = useState("app/page.tsx");

  return(
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:260,borderRight:"1px solid #ddd",padding:10}}>
        <h3>Files</h3>
        <FileTree projectId={projectId} onSelect={setFile}/>
      </div>

      <div style={{flex:1}}>
        <CodeEditor projectId={projectId} path={file}/>
      </div>

      <div style={{width:420,borderLeft:"1px solid #ddd"}}>
        <PreviewFrame projectId={projectId}/>
      </div>

    </div>
  )
}
