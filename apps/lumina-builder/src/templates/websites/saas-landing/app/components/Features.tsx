const items = [
  { title:"Fast setup", text:"Start with a complete structure and iterate with AI." },
  { title:"Developer workspace", text:"Edit real code with preview and runtime feedback." },
  { title:"Template-driven", text:"Use strong defaults and customize from there." },
]

export default function Features(){
  return (
    <section style={{padding:"64px 24px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{fontSize:32,marginBottom:24}}>Built for speed</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
          {items.map(i=>(
            <div key={i.title} style={{padding:20,border:"1px solid #e5e7eb",borderRadius:12}}>
              <h3 style={{marginTop:0}}>{i.title}</h3>
              <p style={{marginBottom:0,color:"#475569"}}>{i.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
