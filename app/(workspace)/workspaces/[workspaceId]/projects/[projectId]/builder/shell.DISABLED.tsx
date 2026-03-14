"use client";

import { useState } from "react";

import { useParams } from "next/navigation";
import PreviewFrame from "@/components/builder/PreviewFrame";
import FileTree from "@/components/builder/FileTree";
import CodeEditor from "@/components/builder/CodeEditor";

export default function BuilderShell(){

  const params = useParams();
  const projectId = params?.projectId as string;

  const [file,setFile] = useState("app/page.tsx");
  const [spec,setSpec] = useState("");
  const [journal,setJournal] = useState<any>(null);

  if(!projectId) return null;

  async function plan(){
    const r = await fetch("/api/ai/plan",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({
        workspaceId:"default",
        projectId,
        spec
      })
    });

    const d = await r.json();
    setJournal(d);
  }

  async function execute(){
    const r = await fetch("/api/ai/task",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({
        workspaceId:"default",
        projectId
      })
    });

    const d = await r.json();
    setJournal(d);
  }

  return(
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:260,borderRight:"1px solid #ddd",padding:10}}>
        <h3>Files</h3>
        <FileTree projectId={projectId} onSelect={setFile}/>
      </div>

      <div style={{flex:1}}>
        <CodeEditor projectId={projectId} path={file}/>
      </div>

      <div style={{width:420,borderLeft:"1px solid #ddd",padding:12,display:"flex",flexDirection:"column"}}>

        <h3>AI Builder</h3>

        <textarea
          value={spec}
          onChange={e=>setSpec(e.target.value)}
          placeholder="Describe what you want to build..."
          style={{height:120,marginBottom:10}}
        />

        <button onClick={plan}>Generate Plan</button>
        <button onClick={execute} style={{marginTop:6}}>Execute</button>

        <div style={{marginTop:12,flex:1,overflow:"auto",background:"#f7f7f7",padding:8}}>
          <pre style={{fontSize:12}}>
            {journal && JSON.stringify(journal,null,2)}
          </pre>
        </div>

        <div style={{height:260,marginTop:10}}>
          <PreviewFrame projectId={projectId} refreshTick={0}/>
        </div>

      </div>

    </div>
  )
}
