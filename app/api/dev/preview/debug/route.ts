import { NextRequest, NextResponse } from "next/server";
import path from "path";
import * as esbuild from "esbuild";
import fs from "fs";
import { resolveEntry } from "../resolveEntry";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || "repo-test";

  const projectRoot = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects",
    projectId
  );

  const entryFile = resolveEntry(projectRoot);

  const result = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "KoreApp",

    // ✅ SAME FIX
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",

    loader: {
      ".ts": "ts",
      ".tsx": "tsx",
      ".css": "empty",
    },

    external: ["react", "react-dom"],

    plugins: [
      {
        name: "strip-use-client",
        setup(build) {
          build.onLoad({ filter: /\.(tsx|ts|js|jsx)$/ }, async (args) => {
            let contents = fs.readFileSync(args.path, "utf8");
            contents = contents.replace(/["']use client["'];?/g, "");
            return { contents, loader: "tsx" };
          });
        },
      },
    ],

    banner: {
      js: `
        var require = (name) => {
          if (name === "react") return window.React;
          if (name === "react-dom") return window.ReactDOM;

          if (name === "react/jsx-runtime") {
            return {
              jsx: (type, props) => window.React.createElement(type, props),
              jsxs: (type, props) => window.React.createElement(type, props),
              Fragment: window.React.Fragment
            };
          }

          if (name === "react/jsx-dev-runtime") {
            return {
              jsxDEV: (type, props) => window.React.createElement(type, props),
              Fragment: window.React.Fragment
            };
          }

          throw new Error("Module not supported: " + name);
        };

        var process = { env: { NODE_ENV: "development" } };
      `,
    },

    footer: {
      js: `
        if (typeof KoreApp !== "undefined") {
          window.KoreApp = KoreApp.default || KoreApp;
        }
      `,
    },
  });

  return new NextResponse(result.outputFiles[0].text, {
    headers: { "Content-Type": "text/plain" },
  });
}
