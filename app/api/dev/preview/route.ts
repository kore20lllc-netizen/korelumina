import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { build } from "esbuild";
import { resolveProjectRoot } from "@/lib/runtime/guardrails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "demo-project";
  const workspaceId = "default";

  const root = resolveProjectRoot(workspaceId, projectId);
  const entryFile = path.join(root, "__entry__.tsx");

  const entry = `
    import React from "react";
    import ReactDOM from "react-dom/client";
    import App from "./app/page.tsx";

    const root = document.getElementById("root");

    ReactDOM.createRoot(root).render(
      React.createElement(App)
    );
  `;

  await fs.writeFile(entryFile, entry);

  const result = await build({
    entryPoints: [entryFile],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2017",
    loader: { ".tsx": "tsx", ".ts": "ts" },
    external: ["react", "react-dom", "react-dom/client"],
  });

  const code = result.outputFiles[0].text;

  return new Response(
    "<!doctype html>" +
      "<html><body style='margin:0'>" +
      "<div id='root'></div>" +
      "<pre id='err' style='position:fixed;bottom:0;left:0;width:100%;max-height:40%;overflow:auto;background:#111;color:#ff5555;padding:10px'></pre>" +
      "<script src='https://unpkg.com/react@18/umd/react.production.min.js'></script>" +
      "<script src='https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'></script>" +
      "<script>" +
      "window.require=(n)=>{" +
      "if(n==='react')return window.React;" +
      "if(n==='react-dom'||n==='react-dom/client')return window.ReactDOM;" +
      "};" +
      "try{" +
      code +
      "}catch(e){" +
      "document.getElementById('err').textContent = e && e.stack ? e.stack : e;" +
      "}" +
      "</script>" +
      "</body></html>",
    { headers: { "Content-Type": "text/html" } }
  );
}
