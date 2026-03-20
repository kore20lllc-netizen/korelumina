"use client";

import { useEffect, useState } from "react";

export default function JournalPanel({
  projectId,
  refreshTick
}:{
  projectId:string
  refreshTick:number
}){

  const [rows,setRows] = useState<any[]>([]);

  useEffect(()=>{

    async function load(){

      const r = await fetch(
        "/api/dev/journal?projectId=" +
        projectId +
        "&r=" +
        refreshTick,
        { cache:"no-store" }
      );

      const j = await r.json();

      const arr =
        Array.isArray(j?.entries)
          ? [...j.entries]   // ⭐ FORCE NEW REFERENCE
          : [];

      setRows(arr);

    }

    load();

  },[projectId,refreshTick]);

  return (
    <div style={{overflow:"auto",height:"100%"}}>
      <div style={{fontWeight:700,padding:8}}>
        Journal ({rows.length})
      </div>

      {rows.map((r,i)=>(
        <div
          key={i}
          style={{
            fontSize:12,
            padding:6,
            borderBottom:"1px solid #eee"
          }}
        >
          {r.type} → {r.path || r.file}
        </div>
      ))}
    </div>
  );
}
