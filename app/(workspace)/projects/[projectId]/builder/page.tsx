"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import FileTree from "@/components/builder/FileTree";
import CodeEditor from "@/components/builder/CodeEditor";
import PreviewFrame from "@/components/builder/PreviewFrame";
import AIPanel from "@/components/builder/AIPanel";
import JournalPanel from "@/components/builder/JournalPanel";

export default function BuilderPage(){

  const params = useParams();
  const projectId = params?.projectId as string;

  const [file,setFile] = useState("app/page.tsx");
  const [refreshTick,setRefreshTick] = useState(0);

  function handleGenerated(path:string){
    console.log("AI GENERATED FILE:", path);

    setFile(path);

    setRefreshTick(t=>{
      const next = t + 1;
      console.log("REFRESH TICK:", next);
      return next;
    });
  }

  if(!projectId) return null;

  return (
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{width:260,borderRight:"1px solid #ddd"}}>
        <FileTree projectId={projectId} onSelect={setFile}/>
      </div>

      <div style={{flex:1}}>
        <CodeEditor
          key={file + refreshTick}
          projectId={projectId}
          path={file}
        />
      </div>

      <div style={{width:420}}>
        <PreviewFrame
          key={refreshTick}
          projectId={projectId}
          refreshTick={refreshTick}
        />
      </div>

      <div style={{width:360,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1}}>
          <JournalPanel
            key={refreshTick}
            projectId={projectId}
            refreshTick={refreshTick}
          />
        </div>

        <AIPanel
          projectId={projectId}
          onGenerated={handleGenerated}
        />
      </div>

    </div>
  );
}
