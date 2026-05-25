"use client"

export default function DiffSidebar({
  diffs,
  onApply,
  onOpen
}:{
  diffs:any[]
  onApply:(paths:string[])=>void
  onOpen:(p:string)=>void
}){

  function apply(){

    const paths = diffs.map(d=>d.path)

    console.log("🔥 APPLY CLICKED")
    console.log("🔥 AUTO PATHS",paths)

    if(paths.length === 0){
      console.log("❌ NO DIFFS")
      return
    }

    onApply(paths)
  }

  return (
    <div style={{width:240,borderRight:"1px solid #ddd",padding:8}}>

      <div style={{fontWeight:600,marginBottom:8}}>
        Diff
      </div>

      {diffs.length === 0 && (
        <div style={{opacity:0.6}}>
          No diffs
        </div>
      )}

      {diffs.map(d=>(
        <div
          key={d.path}
          onClick={()=>onOpen(d.path)}
          style={{
            padding:"6px 8px",
            borderBottom:"1px solid #eee",
            cursor:"pointer",
            fontFamily:"monospace",
            fontSize:13
          }}
        >
          {d.path}
        </div>
      ))}

      <button
        onClick={apply}
        style={{
          marginTop:12,
          width:"100%",
          padding:8,
          background:"#000",
          color:"#fff"
        }}
      >
        APPLY
      </button>

    </div>
  )

}
