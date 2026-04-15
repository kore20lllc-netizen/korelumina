const http = require("http");
const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");
const crypto = require("crypto");

const PORT = 5173;

const workspaceRoot = path.join(
  process.cwd(),
  "..",
  "runtime/workspaces/default/projects"
);

// ---- dependency resolver (bare imports → esm.sh) ----
function resolveImports(code) {
  return code.replace(/from\s+["']([^"']+)["']/g, (match, pkg) => {
    if (pkg.startsWith(".") || pkg.startsWith("/")) return match;

    if (pkg === "react") return `from "https://esm.sh/react@18"`;
    if (pkg === "react-dom") return `from "https://esm.sh/react-dom@18"`;
    if (pkg === "react/jsx-runtime") {
      return `from "https://esm.sh/react@18/jsx-runtime"`;
    }

    return `from "https://esm.sh/${pkg}"`;
  });
}

// ---- hash utilities ----
function hashContent(content) {
  return crypto.createHash("sha1").update(content).digest("hex");
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

// ---- simple graph hash (entry + its local deps via regex) ----
function computeGraphHash(projectRoot, entryPath, seen = new Set()) {
  if (seen.has(entryPath)) return "";
  seen.add(entryPath);

  const src = readFileSafe(entryPath);
  let acc = src;

  const importRegex = /from\s+["']([^"']+)["']/g;
  let m;
  while ((m = importRegex.exec(src))) {
    const spec = m[1];
    if (spec.startsWith(".")) {
      const depPath = path.join(path.dirname(entryPath), spec);
      const withExt = [
        depPath,
        depPath + ".ts",
        depPath + ".tsx",
        depPath + ".js",
        depPath + ".jsx",
        path.join(depPath, "index.ts"),
        path.join(depPath, "index.tsx"),
        path.join(depPath, "index.js"),
        path.join(depPath, "index.jsx"),
      ].find(fs.existsSync);

      if (withExt) {
        acc += computeGraphHash(projectRoot, withExt, seen);
      }
    }
  }

  return acc;
}

// ---- externalize ALL bare imports ----
const externalizeDepsPlugin = {
  name: "externalize-deps",
  setup(build) {
    build.onResolve({ filter: /^[^./]/ }, args => {
      return { path: args.path, external: true };
    });
  }
};

// ---- in-memory cache ----
// key: `${projectId}:${entry}`
// value: { hash, code }
const cache = new Map();

async function bundle(projectId, entry) {
  const projectRoot = path.join(workspaceRoot, projectId);
  const entryPath = path.join(projectRoot, entry);

  if (!fs.existsSync(entryPath)) {
    throw new Error("Entry not found: " + entryPath);
  }

  // ---- compute graph hash ----
  const graphContent = computeGraphHash(projectRoot, entryPath);
  const hash = hashContent(graphContent);

  const key = `${projectId}:${entry}`;
  const cached = cache.get(key);

  if (cached && cached.hash === hash) {
    return cached.code; // ✔ cache hit
  }

  // ---- build ----
  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
    jsx: "automatic",
    loader: {
      ".ts": "ts",
      ".tsx": "tsx",
      ".js": "js",
      ".jsx": "jsx",
      ".css": "empty",
    },
    plugins: [externalizeDepsPlugin],
  });

  let code = result.outputFiles[0].text;

  // rewrite imports to CDN
  code = resolveImports(code);

  // ---- store cache ----
  cache.set(key, { hash, code });

  return code;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/__preview_bundle")) {
      const projectId = url.searchParams.get("projectId");

      let entry = url.searchParams.get("entry");
      if (!entry || entry === "undefined") {
        entry = "app/page.tsx";
      }

      const code = await bundle(projectId, entry);

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Access-Control-Allow-Origin", "*");

      res.end(`<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>

    <script type="module">
      import React from "https://esm.sh/react@18";
      import { createRoot } from "https://esm.sh/react-dom@18/client";

      const mount = document.getElementById("root");

      try {
        const blob = new Blob([\`
${code}
\`], { type: "application/javascript" });

        const blobUrl = URL.createObjectURL(blob);
        const mod = await import(blobUrl);

        const App = mod.default;

        if (!App) {
          mount.innerHTML = "<pre style='color:red'>No default export</pre>";
        } else {
          createRoot(mount).render(React.createElement(App));
        }

      } catch (e) {
        mount.innerHTML = "<pre style='color:red'>" + e.message + "</pre>";
        console.error(e);
      }
    </script>
  </body>
</html>`);

      return;
    }

    res.statusCode = 404;
    res.end("Not found");
  } catch (err) {
    res.statusCode = 500;
    res.end(err.message);
  }
});

server.listen(PORT, () => {
  console.log("🚀 preview-v2 running on http://127.0.0.1:" + PORT);
});
