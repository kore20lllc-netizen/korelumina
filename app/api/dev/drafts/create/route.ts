import { NextRequest, NextResponse } from "next/server"
import { writeDraft } from "@/runtime/drafts/fileDrafts"

export async function POST(req: NextRequest){

  const body = await req.json()

  const projectId = body.projectId || "demo-project"
  const prompt = body.prompt || ""

  const draft = {
    id: "draft-" + Date.now(),
    path: "app/ai-generated-" + Date.now() + ".tsx",
    content:
`export default function AIGenerated(){
  return (
    <div style={{padding:40,fontSize:28}}>
      AI GENERATED DRAFT
      <div style={{marginTop:20,color:"#888"}}>
        ${prompt}
      </div>
    </div>
  )
}`,
    t: Date.now()
  }

  await writeDraft(projectId, draft)

  return NextResponse.json({
    ok:true,
    draft
  })

}
