"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PreviewPage(){

  const params = useSearchParams();
  const projectId = params.get("projectId");

  const [html,setHtml] = useState("");

  useEffect(()=>{

    if(!projectId) return;

    fetch(`/api/dev/preview/bundle?projectId=${projectId}`)
      .then(r=>r.text())
      .then(setHtml);

  },[projectId]);

  return (
    <iframe
      style={{width:"100%",height:"100vh",border:"none"}}
      srcDoc={html}
    />
  );
}
