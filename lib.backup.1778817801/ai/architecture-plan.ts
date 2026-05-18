import OpenAI from "openai";

export async function generateArchitecturePlan({
  spec,
  context
}:{
  spec:string,
  context?:any
}){

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
You are a senior software architect.

User request:
${spec}

Design the file structure required to implement this feature.

Return JSON:

{
 "files":[
   {"path":"app/dashboard/page.tsx","description":"dashboard page"},
   {"path":"components/Navbar.tsx","description":"navigation bar"}
 ]
}
`;

  const res = await client.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[{role:"user",content:prompt}],
    temperature:0
  });

  const text = res.choices[0].message.content || "{}";

  try{
    return JSON.parse(text);
  }catch{
    return {files:[]};
  }
}
