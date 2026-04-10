import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import * as esbuild from "esbuild";

export async function GET(req: NextRequest) {
  try {
    const projectId =
      req.nextUrl.searchParams.get("projectId") || "repo-test";

    const entryParam = req.nextUrl.searchParams.get("entry");

    const projectRoot = path.join(
      process.cwd(),
      "runtime/workspaces/default/projects",
      projectId
    );
function scoreFile(filePath: string): number {
  const content = fs.readFileSync(filePath, "utf-8");

  let score = 0;

  // good signals
  if (content.includes("export default")) score += 5;
  if (content.includes("<div")) score += 3;
  if (content.includes("use client")) score += 4;

  // bad signals
  if (content.includes("next-auth")) score -= 10;
  if (content.includes("cookies(")) score -= 10;
  if (content.includes("use server")) score -= 10;
  if (content.includes("fetch(")) score -= 5;

  return score;
}

    // ✅ SAFE ENTRY RESOLUTION (Next.js aware)
    function resolveEntry(): string | null {
  // 1. explicit entry (SAFE)
  if (entryParam) {
    const explicit = path.join(projectRoot, entryParam);
    if (fs.existsSync(explicit)) return explicit;
  }

  const appDir = path.join(projectRoot, "app");

  if (fs.existsSync(appDir)) {
    // 2. root page
    const rootPage = path.join(appDir, "page.tsx");
    if (fs.existsSync(rootPage)) return rootPage;

    // 3. route groups (app/(...)/page.tsx)
    const stack = [appDir];

    while (stack.length) {
      const current = stack.pop()!;
      const items = fs.readdirSync(current);

      for (const item of items) {
        const full = path.join(current, item);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
          const candidate = path.join(full, "page.tsx");
          if (fs.existsSync(candidate)) return candidate;

          stack.push(full);
        }
      }
    }
  }

  // 4. fallback: best TSX file
  function findBestFile(dir: string): string | null {
    let bestFile: string | null = null;
    let bestScore = -Infinity;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        const candidate = findBestFile(full);
        if (candidate) {
          const score = scoreFile(candidate);
          if (score > bestScore) {
            bestScore = score;
            bestFile = candidate;
          }
        }
      } else if (
        item.endsWith(".tsx") ||
        item.endsWith(".jsx")
      ) {
        // ❌ skip junk files
        if (
          item.includes("actions") ||
          item.includes("schema") ||
          item.includes("types") ||
          item.includes("config")
        ) continue;

        const score = scoreFile(full);
        if (score > bestScore) {
          bestScore = score;
          bestFile = full;
        }
      }
    }

    return bestFile;
  }

  return findBestFile(projectRoot);
}

    let entryFile = resolveEntry();

    if (!entryFile || !fs.existsSync(entryFile)) {
  const fallback = `
export default function Preview() {
  const React = window.React;
  return React.createElement(
    "div",
    { style: { padding: 40, fontFamily: "sans-serif" } },
    React.createElement("h2", null, "⚠️ No renderable entry found"),
    React.createElement("p", null, "This project uses server components."),
    React.createElement("p", null, "Select a file manually.")
  );
}
`;

  const tempFile = path.join(projectRoot, "__preview__.tsx");
  fs.writeFileSync(tempFile, fallback, "utf8");

  entryFile = tempFile;
}

    console.log("PREVIEW ENTRY:", entryFile);

    // ✅ BUILD (safe mode)
    const result = await esbuild.build({
  entryPoints: [entryFile],
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  globalName: "KoreApp",

  jsx: "automatic",

  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
    ".css": "empty",
  },

  external: [
  "react",
  "react-dom",

  // UI / utils
  "clsx",
  "tailwind-merge",
  "lucide-react",
  "class-variance-authority",

  // radix
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-slot",
  "@radix-ui/react-tabs",
  "@radix-ui/react-tooltip",

  // DB / server (critical)
  "drizzle-orm",
  "drizzle-orm/*",
  "drizzle-orm/pg-core",
  "drizzle-orm/neon-http",
  "drizzle-zod",
  "@neondatabase/serverless",

  // next / server
  "next",
  "next/*",
  "next-auth",
  "server-only",
],

  banner: {
    js: `
      var require = (name) => {
        if (name === "react") return window.React;
        if (name === "react-dom") return window.ReactDOM;

        if (name === "react/jsx-runtime") {
          return {
            jsx: (t,p)=>React.createElement(t,p),
            jsxs: (t,p)=>React.createElement(t,p),
            Fragment: React.Fragment
          };
        }

        return {};
      };
    `,
  },

  footer: {
    js: `
      if (typeof KoreApp !== "undefined") {
        window.App = KoreApp.default || KoreApp;
      }
    `,
  },
});

    const code = result.outputFiles?.[0]?.text || "";

    const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#0b0b0b;color:#fff">
    <div id="root"></div>
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <script>
      try {
        const React = window.React;
        const ReactDOM = window.ReactDOM;

        ${code}

        const App = window.App;
        const container = document.getElementById("root");

        if (!App) {
          throw new Error("No default export found");
        }

        if (!container) {
          throw new Error("Root container missing");
        }

        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(App));

      } catch (err) {
        document.body.innerHTML =
          "<div style='padding:20px'>" +
          "<h2>⚠️ Preview not fully supported</h2>" +
          "<p>This file cannot be rendered in the preview engine.</p>" +
          "<pre style='white-space:pre-wrap;color:red'>" +
          (err?.stack || err) +
          "</pre></div>";
      }
    </script>
  </body>
</html>
`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(
      "<pre style='padding:20px;color:red'>Preview failed:\n" +
        (err?.stack || err) +
        "</pre>",
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
