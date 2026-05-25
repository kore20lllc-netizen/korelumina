"use client"

export default function RuntimeErrorOverlay({
  error
}:{ error:string | null }){

  if(!error) return null

  return (
    <div style={{
      position:"fixed",
      inset:0,
      background:"rgba(0,0,0,0.85)",
      color:"#ff8080",
      padding:24,
      fontFamily:"monospace",
      zIndex:999999,
      overflow:"auto"
    }}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:12}}>
        Runtime Preview Error
      </div>
      <pre style={{whiteSpace:"pre-wrap"}}>{error}</pre>
    </div>
  )
}
