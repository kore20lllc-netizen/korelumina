import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "kore-preview-entry",
      configureServer(server) {
        server.middlewares.use("/__kore_preview_entry", (req, res) => {
          const url = new URL(req.url!, "http://localhost");
          const projectId = url.searchParams.get("projectId");
          const entry = url.searchParams.get("entry") || "app/page.tsx";

          const root = path.join(
            process.cwd(),
            "..",
            "runtime/workspaces/default/projects",
            projectId || ""
          );

          const fullPath = path.join(root, entry);

          if (!fs.existsSync(fullPath)) {
            res.statusCode = 404;
            res.end("Entry not found");
            return;
          }

          res.setHeader("Content-Type", "application/javascript");

          res.end(`
            import React from "react";
            import { createRoot } from "react-dom/client";

            // 🔥 force client compatibility
            window.process = { env: {} };

            let App;

            try {
              const mod = await import("/@fs/${fullPath}");
              App = mod.default || mod;
            } catch (e) {
              document.body.innerHTML =
                "<pre style='color:red'>Import error: " + e.message + "</pre>";
              throw e;
            }

            const root = document.createElement("div");
            document.body.appendChild(root);

            try {
              createRoot(root).render(React.createElement(App));
            } catch (e) {
              root.innerHTML =
                "<pre style='color:red'>Render error: " + e.message + "</pre>";
              console.error(e);
            }
          `);
        });
      },
    },
  ],
});
