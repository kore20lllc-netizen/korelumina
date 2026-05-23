export default function Hero(){
  return (
    <section style={{padding:"80px 24px",textAlign:"center",background:"#0f172a",color:"white"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        <div style={{fontSize:14,opacity:.8,marginBottom:12}}>KoreLumina Template</div>
        <h1 style={{fontSize:48,margin:"0 0 16px"}}>Launch your product with a polished AI-built site</h1>
        <p style={{fontSize:18,opacity:.9,maxWidth:720,margin:"0 auto 24px"}}>
          A modern landing page starter for SaaS, AI tools, and digital products.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button style={{padding:"12px 18px",background:"#22c55e",border:"none",cursor:"pointer"}}>Get Started</button>
          <button style={{padding:"12px 18px",background:"transparent",color:"white",border:"1px solid #334155",cursor:"pointer"}}>Book Demo</button>
        </div>
      </div>
    </section>
  )
}
