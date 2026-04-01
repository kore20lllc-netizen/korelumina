export default function Page(){
  return (
    <main style={{fontFamily:"sans-serif",minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#020617",color:"white"}}>
      <div style={{maxWidth:720,textAlign:"center"}}>
        <div style={{opacity:.7,marginBottom:12}}>Waitlist Template</div>
        <h1 style={{fontSize:54,margin:"0 0 16px"}}>Something big is coming</h1>
        <p style={{fontSize:18,opacity:.85,margin:"0 0 24px"}}>
          Capture interest before launch with a focused waitlist page.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <input placeholder="Enter your email" style={{padding:"12px 14px",minWidth:320}} />
          <button style={{padding:"12px 18px",background:"#22c55e",border:"none",cursor:"pointer"}}>Join</button>
        </div>
      </div>
    </main>
  )
}
