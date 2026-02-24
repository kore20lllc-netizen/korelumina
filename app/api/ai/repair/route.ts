import { NextResponse } from "next/server";
import { runRepairLoop, type RepairRequest } from "@/lib/ai/repair-loop";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RepairRequest;

    if (!body.workspaceId || !body.projectId || !body.files?.length) {
      return NextResponse.json(
        { error: "Invalid repair payload" },
        { status: 400 }
      );
    }

    const result = await runRepairLoop(body);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Repair error" },
      { status: 500 }
    );
  }
}
