import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const planRes = await fetch(`${base}/api/ai/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const plan = await planRes.json();

    if (!planRes.ok) {
      return NextResponse.json(
        { ok: false, stage: "plan", error: plan },
        { status: 500 }
      );
    }

    const taskRes = await fetch(`${base}/api/ai/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, plan }),
    });
    const tasks = await taskRes.json();

    if (!taskRes.ok) {
      return NextResponse.json(
        { ok: false, stage: "task", error: tasks },
        { status: 500 }
      );
    }

    const applyRes = await fetch(`${base}/api/ai/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, files: tasks.files || tasks }),
    });
    const result = await applyRes.json();

    if (!applyRes.ok) {
      return NextResponse.json(
        { ok: false, stage: "apply", error: result },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      plan,
      tasks,
      result,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "orchestrator_failed" },
      { status: 500 }
    );
  }
}
