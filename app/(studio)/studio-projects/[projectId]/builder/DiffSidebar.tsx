"use client"

export default function DiffSidebar({ diffs, onApplyAll, onApplyOne, onClose }:{
  diffs:any[]
  onApplyAll:()=>void
  onApplyOne:(d:any)=>void
  onClose:()=>void
}){

  return (
    <div style={{
      position:"fixed",
      right:0,
      top:0,
      bottom:0,
      width:420,
      background:"#0f172a",
      color:"#e5e7eb",
      padding:16,
      overflow:"auto",
      borderLeft:"1px solid #1f2937",
      zIndex:50
    }}>

      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontWeight:700}}>AI DIFF</div>
        <button onClick={onClose}>X</button>
      </div>

      <button
        onClick={onApplyAll}
        style={{
          width:"100%",
          padding:8,
          background:"#22c55e",
          border:"none",
          marginBottom:16,
          cursor:"pointer"
        }}
      >
        APPLY ALL
      </button>

      {diffs.map((d,i)=>(
        <div key={i} style={{
          marginBottom:16,
          border:"1px solid #334155",
          padding:8
        }}>
          <div style={{fontSize:12,opacity:.7}}>
            {d.file}
          </div>

          <pre style={{
            whiteSpace:"pre-wrap",
            fontSize:12,
            marginTop:6
          }}>
            {d.diff}
          </pre>

          <button
            onClick={()=>onApplyOne(d)}
            style={{
              marginTop:6,
              padding:6,
              background:"#3b82f6",
              border:"none",
              cursor:"pointer"
            }}
          >
            APPLY
          </button>
        </div>
      ))}

    </div>
  )
}
