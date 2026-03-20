"use client"

export default function InlineDiffViewer({ patch }:{ patch:string }){

  const lines = patch.split("\n")

  return (
    <div style={{
      fontFamily:"monospace",
      fontSize:13,
      padding:12,
      overflow:"auto",
      height:"100%"
    }}>

      {lines.map((l,i)=>{

        let bg="transparent"

        if(l.startsWith("+")) bg="#eaffea"
        if(l.startsWith("-")) bg="#ffecec"

        return (
          <div key={i} style={{background:bg}}>
            {l}
          </div>
        )

      })}

    </div>
  )

}
