import { NextResponse } from "next/server";
import { runRepairLoop, type RepairRequest } from "@/lib/ai/repair-loop";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RepairRequest;

    if (!body?.workspaceId || !body?.projectId || !Array.isArray(body.files)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await runRepairLoop(body);

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Repair error" },
      { status: 500 }
    );
  }
}
