import { NextRequest, NextResponse } from "next/server";
import path from "path";
import * as esbuild from "esbuild";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const version = searchParams.get("v") || Date.now();

  if (!projectId) {
    return new NextResponse("Missing projectId", { status: 400 });
  }

  const entryFile = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects",
    projectId,
    "app/page.tsx"
  );

  let code = "";

  try {
    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      globalName: "KoreApp",   // 🔥 THIS IS THE FIX
      jsx: "transform",
      loader: {
        ".ts": "ts",
        ".tsx": "tsx",
      },
      external: ["react", "react-dom"],
    });

    code = result.outputFiles[0].text;
  } catch (err: any) {
    return new NextResponse(
      `<pre style="color:red">${err.message}</pre>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const html = `
<!doctype html>
<html>
  <body style="margin:0">
    <div id="root-${version}"></div>

    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <script>
      ${code}

      try {
        const App = window.KoreApp?.default || window.KoreApp || window.Page || null;

        if (!App) {
          document.body.innerHTML = "<pre>No component found</pre>";
        } else {
          ReactDOM.createRoot(document.getElementById("root-${version}")).render(
            React.createElement(App)
          );
        }
      } catch (e) {
        document.body.innerHTML = "<pre style='color:red'>" + e + "</pre>";
      }
    </script>
  </body>
</html>
`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
