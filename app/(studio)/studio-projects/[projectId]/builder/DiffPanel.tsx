"use client"

export default function DiffPanel({
  diffs,
  onApply,
  onClose
}:{
  diffs:any[],
  onApply:(paths:string[])=>void,
  onClose:()=>void
}){

  const paths = diffs.map(d=>d.path)

  return (
    <div style={{
      position:"absolute",
      right:0,
      top:0,
      bottom:0,
      width:420,
      background:"#0b0b0b",
      borderLeft:"1px solid #333",
      display:"flex",
      flexDirection:"column",
      zIndex:100
    }}>
      <div style={{
        padding:12,
        borderBottom:"1px solid #222",
        fontWeight:600
      }}>
        AI Changes
      </div>

      <div style={{flex:1,overflow:"auto"}}>
        {diffs.map(d=>(
          <div key={d.path}
            style={{
              padding:10,
              borderBottom:"1px solid #111",
              fontSize:13
            }}
          >
            {d.path}
          </div>
        ))}
      </div>

      <div style={{
        padding:12,
        borderTop:"1px solid #222",
        display:"flex",
        gap:10
      }}>
        <button onClick={()=>onApply(paths)}>
          Apply All
        </button>

        <button onClick={onClose}>
          Cancel
        </button>
      </div>

    </div>
  )
}
