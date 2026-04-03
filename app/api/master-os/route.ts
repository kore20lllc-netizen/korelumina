import { NextResponse } from "next/server";

let state: any = {
  currentProject: "repo-test",
  currentBranch: "main",
  lastStableTag: "master-os-v1-stable",
  modules: {},
  currentTask: {},
};

export async function GET() {
  return NextResponse.json({ state });
}

export async function POST(req: Request) {
  const body = await req.json();

  state = {
    ...state,
    ...body,
    currentTask: {
      ...(state.currentTask || {}),
      ...(body.currentTask || {}),
    },
  };

  return NextResponse.json({ ok: true, state });
}
