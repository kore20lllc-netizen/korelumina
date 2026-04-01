import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { projectId, spec } = body;

  if (!projectId || !spec) {
    return NextResponse.json({ ok: false, error: "Missing input" }, { status: 400 });
  }

  const safeText = String(spec).replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return NextResponse.json({
    ok: true,
    files: ["app/page.tsx"],
    drafts: [
      {
        file: "app/page.tsx",
        content: `export default function Page() {
  return (
    <div style={{
      fontSize: "32px",
      fontWeight: 600,
      padding: "40px",
      textAlign: "center"
    }}>
      ${safeText}
    </div>
  );
}`
      }
    ]
  });
}
