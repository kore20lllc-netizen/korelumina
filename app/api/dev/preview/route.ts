import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import * as esbuild from "esbuild";

export const dynamic = "force-dynamic";

function scoreFile(filePath: string): number {
  let content = "";

  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return -9999;
  }

  let score = 0;
  const lowerPath = filePath.toLowerCase();
  const name = path.basename(lowerPath);

  // hard excludes
  if (
    name.includes("__entry__") ||
    name.includes("__preview__") ||
    name.includes("actions.") ||
    name.includes("action.") ||
    name.includes("schema.") ||
    name.includes("types.") ||
    name.includes("config.") ||
    name.includes("icon.")
  ) {
    return -9999;
  }

  // good signals
  if (content.includes("export default")) score += 8;
  if (content.includes("use client")) score += 6;
  if (/<[A-Za-z]/.test(content)) score += 6;
  if (lowerPath.includes("/components/")) score += 3;
  if (lowerPath.endsWith("/page.tsx")) score += 5;
  if (lowerPath.endsWith("/page.jsx")) score += 5;
  if (lowerPath.endsWith("app/page.tsx")) score += 20;
  if (lowerPath.endsWith("app/page.jsx")) score += 20;

  // bad signals
  if (content.includes("next-auth")) score -= 20;
  if (content.includes("cookies(")) score -= 20;
  if (content.includes("use server")) score -= 20;
  if (content.includes("server-only")) score -= 20;
  if (content.includes("next/headers")) score -= 20;
  if (content.includes("drizzle-orm")) score -= 20;
  if (content.includes("@neondatabase/serverless")) score -= 20;
  if (content.includes("fetch(")) score -= 5;

  return score;
}

function findAllPageFiles(dir: string): string[] {
  let results: string[] = [];

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(findAllPageFiles(full));
    } else if (item === "page.tsx" || item === "page.jsx") {
      results.push(full);
    }
  }

  return results;
}

function findBestTsxFile(dir: string): string | null {
  let bestFile: string | null = null;
  let bestScore = -Infinity;

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      const nested = findBestTsxFile(full);
      if (nested) {
        const score = scoreFile(nested);
        if (score > bestScore) {
          bestScore = score;
          bestFile = nested;
        }
      }
    } else if (
      (item.endsWith(".tsx") || item.endsWith(".jsx")) &&
      !item.includes("__entry__") &&
      !item.includes("__preview__")
    ) {
      const score = scoreFile(full);
      if (score > bestScore) {
        bestScore = score;
        bestFile = full;
      }
    }
  }

  return bestFile;
}

export async function GET(req: NextRequest) {
  try {
    const projectId =
      req.nextUrl.searchParams.get("projectId") || "repo-test";
    const entryParam = req.nextUrl.searchParams.get("entry");

    const projectRoot = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects",
      projectId
    );

    function resolveEntry(): string | null {
      // 1. explicit entry from builder click
      if (entryParam && !entryParam.includes("__entry__") && !entryParam.includes("__preview__")) {
        const explicit = path.join(projectRoot, entryParam);
        if (fs.existsSync(explicit)) return explicit;
      }

      // 2. app/page.tsx
      const appRootPageTsx = path.join(projectRoot, "app", "page.tsx");
      if (fs.existsSync(appRootPageTsx)) return appRootPageTsx;

      const appRootPageJsx = path.join(projectRoot, "app", "page.jsx");
      if (fs.existsSync(appRootPageJsx)) return appRootPageJsx;

      // 3. any app/**/page.tsx, best-scored
      const appDir = path.join(projectRoot, "app");
      if (fs.existsSync(appDir)) {
        const pages = findAllPageFiles(appDir);
        if (pages.length > 0) {
          return pages.sort((a, b) => scoreFile(b) - scoreFile(a))[0];
        }
      }

      // 4. fallback to best renderable tsx/jsx anywhere
      return findBestTsxFile(projectRoot);
    }

    const resolved = resolveEntry();
    if (!resolved) {
      throw new Error("No valid entry file found");
    }

    console.log("PREVIEW ENTRY:", resolved);

    const relative =
      "./" + path.relative(projectRoot, resolved).replace(/\\/g, "/");

    const entryFile = path.join(projectRoot, "__entry__.tsx");

    fs.writeFileSync(
      entryFile,
      `
import App from ${JSON.stringify(relative)};
export default App;
`,
      "utf8"
    );

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
        ".js": "js",
        ".jsx": "jsx",
        ".css": "empty",
      },
      external: [
        "react",
        "react-dom",
        "next/*",
        "lucide-react",
        "@radix-ui/*",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "server-only",
        "drizzle-orm",
        "drizzle-orm/*",
        "drizzle-zod",
        "@neondatabase/serverless",
        "@vercel/analytics/react",
      ],
      banner: {
        js: `
var require = (name) => {
  if (name === "react") return window.React;
  if (name === "react-dom") return window.ReactDOM;
  if (name === "react/jsx-runtime") {
    return {
      jsx: window.React.createElement,
      jsxs: window.React.createElement,
      Fragment: window.React.Fragment
    };
  }
  if (name === "react/jsx-dev-runtime") {
    return {
      jsxDEV: window.React.createElement,
      Fragment: window.React.Fragment
    };
  }
  if (name === "clsx") return (...args) => args.filter(Boolean).join(" ");
  if (name === "tailwind-merge") return (...args) => args.join(" ");
  if (name === "class-variance-authority") return { cva: () => () => "" };
  if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
  if (name.startsWith("@radix-ui")) return new Proxy({}, { get: () => () => null });
  if (name.startsWith("next")) return {};
  if (name.startsWith("drizzle")) return {};
  if (name.startsWith("@neondatabase")) return {};
  if (name === "server-only") return {};
  if (name.startsWith("@/")) return {};
  return {};
};
`,
      },
      footer: {
        js: `
if (typeof KoreApp !== "undefined") {
  window.App =
    KoreApp.default ||
    KoreApp.Page ||
    KoreApp.PreviewWrapper ||
    KoreApp.App ||
    KoreApp;
} else {
  window.App = null;
}
`,
      },
    });

    const code = result.outputFiles[0].text;

    const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#fff">
    <div id="root"></div>

    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <script>
      try {
        ${code}

        const React = window.React;
        const ReactDOM = window.ReactDOM;
        const App = window.App;
        const rootEl = document.getElementById("root");

        if (!rootEl) {
          throw new Error("Root element missing");
        }

        if (!App || typeof App !== "function") {
          rootEl.innerHTML =
            "<div style='padding:20px;font-family:sans-serif'>" +
            "<h2>⚠️ No renderable component</h2>" +
            "<p>This file may use server components or unsupported imports.</p>" +
            "</div>";
        } else {
          const root = ReactDOM.createRoot(rootEl);
          root.render(React.createElement(App));
        }
      } catch (err) {
        document.body.innerHTML =
          "<pre style='padding:20px;color:red;white-space:pre-wrap'>" +
          (err && err.stack ? err.stack : String(err)) +
          "</pre>";
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
      "<pre style='padding:20px;color:red;white-space:pre-wrap'>" +
        (err?.stack || String(err)) +
        "</pre>",
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
