"use client"

import { useParams, useRouter } from "next/navigation"

export default function DesignerWebsiteWorkspace(){

  const { projectId } = useParams<{ projectId:string }>()
  const router = useRouter()

  return (
    <div style={{
      height:"100vh",
      display:"flex",
      flexDirection:"column",
      background:"#020617",
      color:"white",
      fontFamily:"sans-serif"
    }}>

      {/* TOP BAR */}
      <div style={{
        height:56,
        borderBottom:"1px solid #1e293b",
        display:"flex",
        alignItems:"center",
        padding:"0 16px",
        gap:12
      }}>
        <div style={{fontWeight:600}}>
          KoreLumina Designer — Website
        </div>

        <div style={{opacity:.6}}>
          Project: {projectId}
        </div>

        <button
          onClick={()=>router.push(`/studio-projects/${projectId}/builder`)}
          style={{
            marginLeft:"auto",
            padding:"6px 12px",
            background:"#22c55e",
            border:"none",
            cursor:"pointer"
          }}
        >
          Open Dev Builder
        </button>
      </div>

      {/* WORKSPACE BODY */}
      <div style={{
        flex:1,
        display:"grid",
        placeItems:"center",
        fontSize:22,
        opacity:.7
      }}>
        Designer Workspace UI will mount here
      </div>

    </div>
  )
}
