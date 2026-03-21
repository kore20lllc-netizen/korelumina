import { NextRequest, NextResponse } from "next/server"
import { templates } from "@/runtime/templates/registry"

export async function GET(){
  return NextResponse.json({
    ok:true,
    templates
  })
}
