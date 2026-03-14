"use client";

import { useState } from "react";

export default function AIPanel({
  projectId,
  onGenerated
}:{
  projectId:string
  onGenerated?:(path:string)=>void
}){

  const [prompt,setPrompt] = useState("");
  const [loading,setLoading] = useState(false);

  async function runAI(){
    if(!prompt.trim()) return;

    setLoading(true);

    try{
      const r = await fetch("/api/ai/generate",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          projectId,
          prompt
        })
      });

      const j = await r.json();

      // ⭐ refresh builder (file tree / preview / journal listeners)
      window.dispatchEvent(new Event("korelumina:fs-change"));

      if(j?.newFile && onGenerated){
        onGenerated("app/" + j.newFile);
      }

    }catch(e){
      console.error("AI generate failed",e);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div style={{padding:12,borderTop:"1px solid #ddd"}}>
      <div style={{fontWeight:700,marginBottom:8}}>AI</div>

      <textarea
        value={prompt}
        onChange={e=>setPrompt(e.target.value)}
        style={{width:"100%",height:120}}
      />

      <button onClick={runAI} disabled={loading}>
        {loading ? "Running..." : "Run AI"}
      </button>
    </div>
  );
}
