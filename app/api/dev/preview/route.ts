import { NextRequest, NextResponse } from "next/server";
import { getProject, startProject } from "@/runtime/preview-manager";

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

    const runtimeUrl =
      runtime.url || `http://127.0.0.1:${runtime.port}`;

    // Validate URL to prevent "The string did not match the expected pattern."
    const validatedUrl = new URL(runtimeUrl).toString();

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />
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
      background: #ffffff;
    }
  </style>
</head>
<body>
  <iframe
    src="${validatedUrl}"
    title="KoreLumina Preview"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
  ></iframe>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message || "Preview failed",
      },
      { status: 500 },
    );
  }
}
