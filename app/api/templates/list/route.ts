import { NextResponse } from "next/server"

export async function GET(){
  return NextResponse.json({
    ok:true,
    templates:[
      { id:"saas-landing", label:"SaaS Landing" },
      { id:"agency", label:"Agency" },
      { id:"waitlist", label:"Waitlist" }
    ]
  })
}
