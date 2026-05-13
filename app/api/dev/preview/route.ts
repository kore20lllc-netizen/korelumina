import { NextRequest, NextResponse } from "next/server";
import { startProject, getProject } from "@/runtime/preview-manager";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const projectId =
      request.nextUrl.searchParams.get("projectId") ||
      "korelumina-dogfood";

    let runtime = getProject(projectId);

    if (!runtime) {
      runtime = await startProject(projectId);
    }

    const url = runtime.url || `http://localhost:${runtime.port}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0b0b0f;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: 0;
      background: white;
    }
  </style>
</head>
<body>
  <iframe
    src="${url}"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
  ></iframe>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Preview failed",
      },
      { status: 500 }
    );
  }
}
