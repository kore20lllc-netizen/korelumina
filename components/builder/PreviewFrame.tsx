"use client";

import { useEffect, useState } from "react";

export default function PreviewFrame({ projectId, refreshTick }:{ projectId:string, refreshTick:number }){

  const [html,setHtml] = useState("");

  useEffect(()=>{
    async function load(){
      const r = await fetch(
        "/api/dev/preview/run?projectId=" + projectId,
        { cache:"no-store" }
      );

      const t = await r.text();
      setHtml(t);
    }

    load();
  },[projectId,refreshTick]);

  return (
    <iframe
      srcDoc={html}
      style={{width:"100%",height:"100%",border:0}}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
