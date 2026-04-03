import { NextRequest, NextResponse } from "next/server";
import path from "path";
import * as esbuild from "esbuild";
import { resolveEntry } from "./resolveEntry";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return new NextResponse("Missing projectId", { status: 400 });
  }

  const projectRoot = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects",
    projectId
  );

  let code = "";

  try {
    const entryFile = resolveEntry(projectRoot);

    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      globalName: "KoreApp",
      jsx: "transform",
      loader: {
        ".ts": "ts",
        ".tsx": "tsx",
        ".css": "empty",
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
    <div id="root"></div>

    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <script>
      ${code}

      try {
        const App =
          window.KoreApp?.default ||
          window.KoreApp ||
          null;

        const container = document.getElementById("root");

        if (!container) {
          document.body.innerHTML = "<pre>Root not found</pre>";
        } else if (!App) {
          document.body.innerHTML = "<pre>No component found</pre>";
        } else {
          const root = ReactDOM.createRoot(container);
          root.render(React.createElement(App));

          // 🔥 fix images AFTER render
          setTimeout(() => {
            document.querySelectorAll("img").forEach(img => {
              const src = img.getAttribute("src");
              if (src && src.startsWith("/") && !src.includes("/api/dev/asset")) {
                img.src = "/api/dev/asset?projectId=${projectId}&file=" + src.slice(1);
              }
            });
          }, 50);
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
