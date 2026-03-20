"use client"

export default function DiffView({
  draft,
  runtime
}:{
  draft:string
  runtime:string
}){

  return (
    <div style={{
      display:"flex",
      height:"100%",
      fontFamily:"monospace",
      fontSize:13
    }}>

      {/* RUNTIME */}
      <div style={{
        flex:1,
        borderRight:"1px solid #ddd",
        padding:12,
        overflow:"auto"
      }}>
        <div style={{fontWeight:700,marginBottom:8}}>
          Runtime
        </div>

        <pre style={{whiteSpace:"pre-wrap"}}>
{runtime}
        </pre>
      </div>

      {/* DRAFT */}
      <div style={{
        flex:1,
        padding:12,
        overflow:"auto",
        background:"#f8fffa"
      }}>
        <div style={{fontWeight:700,marginBottom:8,color:"#16a34a"}}>
          Draft
        </div>

        <pre style={{whiteSpace:"pre-wrap"}}>
{draft}
        </pre>
      </div>

    </div>
  )

}
