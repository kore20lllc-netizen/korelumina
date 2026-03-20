"use client"

import { useParams, useRouter } from "next/navigation"

export default function WebsiteBuilderPage(){
  const params = useParams()
  const projectId = params?.projectId as string
  const router = useRouter()

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"sans-serif",padding:24}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h1 style={{margin:0}}>Website Builder</h1>
          <button onClick={()=>router.push(`/studio-projects/${projectId}/builder`)}>
            Open Dev Builder
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
          <div style={{border:"1px solid #e5e7eb",borderRadius:12,padding:16,background:"white"}}>
            <div style={{fontWeight:700,marginBottom:12}}>Sections</div>
            <div style={{display:"grid",gap:8}}>
              <button>Hero</button>
              <button>Features</button>
              <button>Pricing</button>
              <button>Testimonials</button>
              <button>CTA</button>
            </div>
          </div>

          <div style={{border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden",background:"white"}}>
            <div style={{padding:12,borderBottom:"1px solid #e5e7eb",fontWeight:700}}>Live Preview</div>
            <iframe
              src={`/api/dev/preview/run?projectId=${projectId}&t=0`}
              style={{width:"100%",height:"75vh",border:"none"}}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
