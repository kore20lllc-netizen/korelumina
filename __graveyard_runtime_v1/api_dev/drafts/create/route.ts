import { NextRequest, NextResponse } from "next/server"
import { pushDraft } from "@/runtime/drafts/store"

export async function POST(req: NextRequest){

  const { projectId, prompt } = await req.json()

  const fileName = "ai-generated-" + Date.now() + ".tsx"

  const content =
`export default function AIGenerated(){
  return (
    <div style={{padding:40,fontSize:28}}>
      AI GENERATED DRAFT
      <div style={{marginTop:20,color:"#888"}}>
        ${String(prompt || "").replace(/`/g,"")}
      </div>
    </div>
  )
}
`

  const draft = {
    id: "draft-" + Date.now(),
    path: "app/" + fileName,
    content,
    t: Date.now()
  }

  pushDraft(projectId || "demo-project", draft)

  return NextResponse.json({
    ok:true,
    draft
  })
}
