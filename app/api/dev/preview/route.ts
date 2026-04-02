import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  const html = `
<!doctype html>
<html>
  <body style="margin:0;font-family:sans-serif;background:#fff;color:#000;">
    <div style="padding:20px">
      Preview ready<br/>
      Project: ${projectId}
    </div>
  </body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
