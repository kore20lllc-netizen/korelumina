import { NextRequest, NextResponse } from "next/server"
import { pushDraft } from "@/runtime/drafts/store"

export async function POST(req: NextRequest){

  const body = await req.json()

  const projectId = body.projectId || "demo-project"
  const prompt = body.prompt || ""

  const fileName = "ai-generated-" + Date.now() + ".tsx"

  const componentContent =
`export default function AIGenerated(){
  return (
    <div style={{padding:40,fontSize:28}}>
      AI GENERATED DRAFT
      <div style={{marginTop:20,color:"#888"}}>
        ${prompt.replace(/`/g,"")}
      </div>
    </div>
  )
}
`

  const id = "draft-" + Date.now()

  pushDraft(projectId,{
    id,
    path:"app/" + fileName,
    content: componentContent,
    t: Date.now()
  })

  return NextResponse.json({
    ok:true,
    draftId:id
  })

}
