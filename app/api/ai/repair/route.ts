import { NextResponse } from "next/server";
import { repairLoop, type RepairRequest } from "@/lib/ai/repair-loop";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RepairRequest;

    if (!body?.workspaceId || !body?.projectId || !Array.isArray(body.files)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await repairLoop(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Repair error" },
      { status: 500 }
    );
  }
}
